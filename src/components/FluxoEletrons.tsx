import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { getFluxoFases, FluxoFasesResponse } from '../services/api';

interface Props {
  clienteAtivo: string;
}

const FASES = ['A', 'B', 'C'] as const;
type Fase = typeof FASES[number];

// Coordenadas do diagrama unifilar (viewBox 0 0 960 500) — mesma geometria
// validada no protótipo: rede à esquerda, cargas à direita, inversor embaixo
// alimentando cada fase por uma junção própria (430/480/530).
const Y: Record<Fase, number> = { A: 140, B: 220, C: 300 };
const JX: Record<Fase, number> = { A: 430, B: 480, C: 530 };
const MAXKW = 6; // potência acima da qual a animação já está na velocidade máxima

const SVGNS = 'http://www.w3.org/2000/svg';

const f1 = (n: number) => n.toFixed(1).replace('.', ',');
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const dotCount = (m: number) => clamp(Math.round(1 + m), 1, 6);
const durOf = (m: number) => +(2.6 - clamp(m, 0, MAXKW) / MAXKW * 2.1).toFixed(2);
const haloWidth = (m: number) => (m <= 0.05 ? 0 : 3 + clamp(m, 0, MAXKW) / MAXKW * 7);

type Direcao = 'fwd' | 'rev' | 'up';

const FluxoEletrons: React.FC<Props> = ({ clienteAtivo }) => {
  const { cores } = useTheme();
  const isMobile = useIsMobile();
  const [dados, setDados] = useState<FluxoFasesResponse | null>(null);
  const [semLeitura, setSemLeitura] = useState(false);
  const reducedRef = useRef(
    typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // Refs pros elementos do SVG que a gente atualiza na mão (halo colorido +
  // grupo de "elétrons" animados) — 4 trechos por fase: 1 (rede-junção),
  // 2p/2r (junção-carga, autoconsumo e rede, em pistas paralelas) e 3
  // (inversor-junção).
  const haloRefs = useRef<Record<string, SVGPathElement | null>>({});
  const dotRefs = useRef<Record<string, SVGGElement | null>>({});
  // Guarda o último estado aplicado por trecho — sem isso, cada nova
  // leitura (a cada 10s) recriaria os elétrons animados do zero, e a
  // animação "pularia" de volta pro início a cada atualização mesmo que a
  // potência tenha mudado muito pouco. Só reconstrói de fato quando ativo/
  // direção/faixa de potência realmente mudam.
  const ultimoRef = useRef<Record<string, { ativo: boolean; dir: Direcao; magR: number }>>({});

  useEffect(() => {
    let vivo = true;
    const buscar = async () => {
      try {
        const res = await getFluxoFases(clienteAtivo);
        if (vivo) { setDados(res); setSemLeitura(false); }
      } catch (err) {
        console.log('Erro ao buscar fluxo por fase:', err);
        if (vivo) setSemLeitura(true);
      }
    };
    buscar();
    // 10s: rápido o bastante pra animação parecer "viva", sem sobrecarregar
    // a API — mais frequente que o refresh de 30s do gráfico do dia porque
    // aqui o objetivo é dar a sensação de tempo real, não montar histórico.
    const intervalo = setInterval(buscar, 10000);
    return () => { vivo = false; clearInterval(intervalo); };
  }, [clienteAtivo]);

  const atualizarTrecho = (id: string, mag: number, dir: Direcao, cor: string) => {
    const halo = haloRefs.current[id];
    const grupo = dotRefs.current[id];
    if (!halo || !grupo) return;
    const ativo = mag > 0.05;
    halo.setAttribute('stroke', cor);
    halo.setAttribute('stroke-width', String(haloWidth(mag)));
    halo.setAttribute('opacity', ativo ? String(reducedRef.current ? 0.85 : 0.24) : '0');
    if (!ativo) {
      while (grupo.firstChild) grupo.removeChild(grupo.firstChild);
      ultimoRef.current[id] = { ativo, dir, magR: 0 };
      return;
    }

    // Potência arredondada em faixas de 0,3kW — pequenas variações entre
    // uma leitura e outra não justificam reiniciar a animação, só ajustes
    // reais de patamar (ex: uma nuvem passando) reconstroem os pontos.
    const magR = Math.round(mag / 0.3) * 0.3;
    const anterior = ultimoRef.current[id];
    if (anterior && anterior.ativo === ativo && anterior.dir === dir && anterior.magR === magR) return;
    ultimoRef.current[id] = { ativo, dir, magR };

    while (grupo.firstChild) grupo.removeChild(grupo.firstChild);
    const haloId = halo.getAttribute('id') || '';

    if (reducedRef.current) {
      const d = halo.getAttribute('d') || '';
      const m = d.match(/M([\d.\-]+),([\d.\-]+)\s*L([\d.\-]+),([\d.\-]+)/);
      if (!m) return;
      const mx = (Number(m[1]) + Number(m[3])) / 2;
      const my = (Number(m[2]) + Number(m[4])) / 2;
      const ang = dir === 'rev' ? 180 : dir === 'up' ? -90 : 0;
      const seta = document.createElementNS(SVGNS, 'polygon');
      seta.setAttribute('points', '-6,-5 7,0 -6,5');
      seta.setAttribute('transform', `translate(${mx},${my}) rotate(${ang})`);
      seta.setAttribute('fill', cor);
      grupo.appendChild(seta);
      return;
    }

    const n = dotCount(mag);
    const dur = durOf(mag);
    for (let i = 0; i < n; i++) {
      const c = document.createElementNS(SVGNS, 'circle');
      c.setAttribute('r', '4');
      c.setAttribute('fill', cor);
      const am = document.createElementNS(SVGNS, 'animateMotion');
      am.setAttribute('dur', `${dur}s`);
      am.setAttribute('repeatCount', 'indefinite');
      am.setAttribute('begin', `${(-(i * dur / n)).toFixed(2)}s`);
      if (dir === 'rev') {
        am.setAttribute('keyPoints', '1;0');
        am.setAttribute('keyTimes', '0;1');
        am.setAttribute('calcMode', 'linear');
      }
      const mpath = document.createElementNS(SVGNS, 'mpath');
      mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${haloId}`);
      mpath.setAttribute('href', `#${haloId}`);
      am.appendChild(mpath);
      c.appendChild(am);
      grupo.appendChild(c);
    }
  };

  useEffect(() => {
    if (!dados) return;
    FASES.forEach((fase) => {
      const f = dados.fases[fase];
      atualizarTrecho(fase + '3', f.geracao_kw, 'up', cores.verde);
      if (f.rede_kw >= f.injecao_kw) atualizarTrecho(fase + '1', f.rede_kw, 'fwd', cores.vermelho);
      else atualizarTrecho(fase + '1', f.injecao_kw, 'rev', cores.azul);
      atualizarTrecho(fase + '2p', f.autoconsumo_kw, 'fwd', cores.roxo);
      atualizarTrecho(fase + '2r', f.rede_kw, 'fwd', cores.vermelho);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados, cores]);

  const registrarHalo = (id: string) => (el: SVGPathElement | null) => { haloRefs.current[id] = el; };
  const registrarGrupo = (id: string) => (el: SVGGElement | null) => { dotRefs.current[id] = el; };

  const totais = { g: 0, c: 0, auto: 0, rede: 0, inj: 0 };
  if (dados) {
    FASES.forEach((fase) => {
      const f = dados.fases[fase];
      totais.g += f.geracao_kw; totais.c += f.consumo_kw; totais.auto += f.autoconsumo_kw;
      totais.rede += f.rede_kw; totais.inj += f.injecao_kw;
    });
  }

  return (
    <div style={{ background: cores.bg2, border: `1px solid ${cores.border}`, borderRadius: 12, padding: '1.25rem', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: cores.text }}>Fluxo de Elétrons — por fase</div>
          <div style={{ fontSize: 13, color: cores.text3, marginTop: 2 }}>
            Rede, inversor e cargas, em tempo real{dados?.tipo_medicao === 'consumo_direto' ? ' (sem medição de injeção — medidor no ramal de cargas)' : ''}
          </div>
        </div>
        {semLeitura && <div style={{ fontSize: 13, color: cores.vermelho }}>⚠ sem leitura recente</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,2fr) minmax(220px,1fr)', gap: '1rem' }}>
        <svg viewBox="0 0 960 500" style={{ width: '100%', height: 'auto', display: 'block', color: cores.text }} role="img"
          aria-label="Diagrama mostrando o fluxo de elétrons entre a rede, o inversor e as cargas, separado pelas fases A, B e C.">
          {/* Caixa REDE */}
          <rect x="30" y="90" width="100" height="260" rx="14" stroke={cores.text} opacity={0.32} fill="none" />
          <circle cx="70" cy="220" r="15" stroke={cores.text} opacity={0.32} fill="none" />
          <circle cx="88" cy="220" r="15" stroke={cores.text} opacity={0.32} fill="none" />
          <text x="80" y="272" textAnchor="middle" fontSize="15" fontWeight={700} fill={cores.text}>REDE</text>
          <text x="80" y="288" textAnchor="middle" fontSize="11" fill={cores.text3}>concessionária</text>

          {/* Caixa CARGAS */}
          <rect x="830" y="90" width="100" height="260" rx="14" stroke={cores.text} opacity={0.32} fill="none" />
          <path d="M880,196 L890,201 L870,206 L890,211 L870,216 L890,221 L870,226 L890,231 L870,236 L880,241" stroke={cores.text} opacity={0.32} fill="none" />
          <text x="880" y="270" textAnchor="middle" fontSize="15" fontWeight={700} fill={cores.text}>CARGAS</text>
          <text x="880" y="286" textAnchor="middle" fontSize="11" fill={cores.text3}>painel de consumo</text>

          {/* Caixa INVERSOR */}
          <rect x="395" y="400" width="170" height="76" rx="14" stroke={cores.text} opacity={0.32} fill="none" />
          <path d="M415,424 C420,414 430,414 435,424 C440,434 450,434 455,424" stroke={cores.text} opacity={0.32} fill="none" strokeWidth={2} />
          <path d="M462,424 L472,424 M469,420 L472,424 L469,428" stroke={cores.text} opacity={0.32} fill="none" strokeWidth={2} />
          <path d="M479,424 L489,424 L489,414 L499,414 L499,434 L509,434 L509,414 L519,414 L519,434 L529,434 L529,424 L539,424" stroke={cores.text} opacity={0.32} fill="none" strokeWidth={2} />
          <text x="480" y="458" textAnchor="middle" fontSize="15" fontWeight={700} fill={cores.text}>INVERSOR</text>
          <text x="480" y="470" textAnchor="middle" fontSize="10" fill={cores.text3}>CC → CA</text>

          {/* Rótulos de fase */}
          <text x="16" y="145" fontSize="17" fontWeight={700} fill={cores.text}>A</text>
          <text x="16" y="225" fontSize="17" fontWeight={700} fill={cores.text}>B</text>
          <text x="16" y="305" fontSize="17" fontWeight={700} fill={cores.text}>C</text>

          {FASES.map((fase) => {
            const y = Y[fase];
            const jx = JX[fase];
            return (
              <React.Fragment key={fase}>
                <line x1={130} y1={y} x2={jx} y2={y} stroke={cores.text} opacity={0.32} strokeWidth={2} />
                <line x1={jx} y1={y} x2={830} y2={y} stroke={cores.text} opacity={0.32} strokeWidth={2} />
                <line x1={jx} y1={400} x2={jx} y2={y} stroke={cores.text} opacity={0.32} strokeWidth={2} />
                <circle cx={jx} cy={y} r={4} fill={cores.text} />
                {(() => {
                  const id1 = fase + '1', id3 = fase + '3', id2p = fase + '2p', id2r = fase + '2r';
                  return (
                    <>
                      <path id={`h${id1}`} ref={registrarHalo(id1)} d={`M130,${y} L${jx},${y}`} fill="none" strokeLinecap="round" />
                      <g ref={registrarGrupo(id1)} />
                      <path id={`h${id3}`} ref={registrarHalo(id3)} d={`M${jx},400 L${jx},${y}`} fill="none" strokeLinecap="round" />
                      <g ref={registrarGrupo(id3)} />
                      <path id={`h${id2p}`} ref={registrarHalo(id2p)} d={`M${jx},${y - 4} L830,${y - 4}`} fill="none" strokeLinecap="round" />
                      <g ref={registrarGrupo(id2p)} />
                      <path id={`h${id2r}`} ref={registrarHalo(id2r)} d={`M${jx},${y + 4} L830,${y + 4}`} fill="none" strokeLinecap="round" />
                      <g ref={registrarGrupo(id2r)} />
                    </>
                  );
                })()}
              </React.Fragment>
            );
          })}
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: cores.text3, marginBottom: 6 }}>Legenda</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                [cores.verde, 'Geração (saída do inversor)'],
                [cores.vermelho, 'Consumo suprido pela rede'],
                [cores.roxo, 'Autoconsumo (energia própria)'],
                [cores.azul, 'Injeção na rede (excedente)'],
              ].map(([cor, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: cores.text2 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: cor, flex: 'none' }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontVariantNumeric: 'tabular-nums', fontSize: 12.5 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', fontSize: 11, color: cores.text3, fontWeight: 600, paddingBottom: 4 }}>Fase</th>
                  <th style={{ textAlign: 'right', fontSize: 11, color: cores.text3, fontWeight: 600, paddingBottom: 4 }}>Ger.</th>
                  <th style={{ textAlign: 'right', fontSize: 11, color: cores.text3, fontWeight: 600, paddingBottom: 4 }}>Cons.</th>
                  <th style={{ textAlign: 'right', fontSize: 11, color: cores.text3, fontWeight: 600, paddingBottom: 4 }}>Rede</th>
                  <th style={{ textAlign: 'right', fontSize: 11, color: cores.text3, fontWeight: 600, paddingBottom: 4 }}>Inj.</th>
                </tr>
              </thead>
              <tbody>
                {FASES.map((fase) => {
                  const f = dados?.fases[fase];
                  return (
                    <tr key={fase}>
                      <td style={{ padding: '3px 0', borderTop: `1px solid ${cores.border}`, color: cores.text2, fontWeight: 600 }}>{fase}</td>
                      <td style={{ padding: '3px 0', borderTop: `1px solid ${cores.border}`, textAlign: 'right', color: cores.text }}>{f ? f1(f.geracao_kw) : '—'}</td>
                      <td style={{ padding: '3px 0', borderTop: `1px solid ${cores.border}`, textAlign: 'right', color: cores.text }}>{f ? f1(f.consumo_kw) : '—'}</td>
                      <td style={{ padding: '3px 0', borderTop: `1px solid ${cores.border}`, textAlign: 'right', color: cores.text }}>{f ? f1(f.rede_kw) : '—'}</td>
                      <td style={{ padding: '3px 0', borderTop: `1px solid ${cores.border}`, textAlign: 'right', color: cores.text }}>{f ? f1(f.injecao_kw) : '—'}</td>
                    </tr>
                  );
                })}
                <tr>
                  <td style={{ padding: '4px 0', borderTop: `1px solid ${cores.text3}`, fontWeight: 700, color: cores.text2 }}>Total</td>
                  <td style={{ padding: '4px 0', borderTop: `1px solid ${cores.text3}`, textAlign: 'right', fontWeight: 700, color: cores.text }}>{dados ? f1(totais.g) : '—'}</td>
                  <td style={{ padding: '4px 0', borderTop: `1px solid ${cores.text3}`, textAlign: 'right', fontWeight: 700, color: cores.text }}>{dados ? f1(totais.c) : '—'}</td>
                  <td style={{ padding: '4px 0', borderTop: `1px solid ${cores.text3}`, textAlign: 'right', fontWeight: 700, color: cores.text }}>{dados ? f1(totais.rede) : '—'}</td>
                  <td style={{ padding: '4px 0', borderTop: `1px solid ${cores.text3}`, textAlign: 'right', fontWeight: 700, color: cores.text }}>{dados ? f1(totais.inj) : '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FluxoEletrons;
