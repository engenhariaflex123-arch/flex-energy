import React, { useState, useEffect } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Brush } from 'recharts';
import { getDadosCliente, getHistorico } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

interface MainChartProps {
  clienteAtivo: string;
  period: 'dia' | 'mes' | 'ano';
}

interface Totais {
  geracao_kwh: number;
  consumo_kwh: number;
  saldo_kwh: number;
}

const LABEL_TOTAL: Record<MainChartProps['period'], string> = {
  dia: '',
  mes: 'Total do Mês',
  ano: 'Total do Ano',
};

const NOMES_MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// Data de hoje no fuso de Brasília, no formato YYYY-MM-DD (mesmo formato do
// <input type="date">) — usada como valor padrão do seletor de dia e como
// limite máximo (não deixa escolher uma data no "futuro").
const hojeBR = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

interface SerieToggle {
  key: 'Geração' | 'Consumo' | 'Injetado' | 'Consumo Instantâneo' | 'Balanço';
  cor: string;
}

const fmt = (n: number) => n.toFixed(1).replace('.', ',');

// Minutos desde meia-noite -> "HH:MM", pra rotular o eixo X (que usa
// minutos como valor numérico, não mais a hora como texto — ver
// comentário em "horaMin" abaixo).
const formatarMinutos = (min: number) => {
  const m = Math.round(min);
  const hh = String(Math.floor(m / 60)).padStart(2, '0');
  const mm = String(m % 60).padStart(2, '0');
  return `${hh}:${mm}`;
};
// Ticks fixos de 2 em 2 horas (00:00, 02:00, ..., 24:00), sempre os
// mesmos independente de quantos dados existirem — é isso que faz o
// eixo representar o dia inteiro, não só o intervalo com dado.
const TICKS_DIA = Array.from({ length: 13 }, (_, i) => i * 120);

const MainChart: React.FC<MainChartProps> = ({ clienteAtivo, period }) => {
  const [data, setData] = useState<any[]>([]);
  const [totais, setTotais] = useState<Totais | null>(null);
  const [loading, setLoading] = useState(true);
  // Dashboard mostra só os totais (soma das 3 fases) — o detalhamento por
  // fase (Fase A/B/C, Injetado por fase) fica só na aba Análise.
  const [visiveis, setVisiveis] = useState<Record<string, boolean>>({
    'Geração': true, 'Consumo': true, 'Injetado': true, 'Consumo Instantâneo': true, 'Balanço': true,
  });
  const [telaCheia, setTelaCheia] = useState(false);
  // Domínio (em minutos) do eixo X quando o usuário deu zoom arrastando a
  // faixa (Brush) abaixo do gráfico. null = sem zoom, mostra o dia inteiro
  // (0-1439min = 00:00-23:59), que é o padrão.
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  // Índices (posição no array `data`) da faixa de zoom selecionada no
  // Brush. null = acompanha o fim do array automaticamente conforme
  // "data" cresce a cada nova leitura (30s) — se passássemos um endIndex
  // fixo (ex: data.length-1 calculado uma vez), ele ficaria desatualizado
  // assim que mais pontos fossem adicionados, e o Brush pareceria "preso"
  // numa janela antiga do dia (foi exatamente esse o bug relatado).
  const [brushRange, setBrushRange] = useState<[number, number] | null>(null);
  // Data/mês/ano escolhidos pelo usuário para "olhar para trás" no
  // histórico — por padrão sempre o período corrente (hoje / mês atual /
  // ano atual), que é o comportamento de sempre.
  const agora = new Date();
  const [dataSelecionada, setDataSelecionada] = useState<string>(hojeBR());
  const [mesSelecionado, setMesSelecionado] = useState<number>(agora.getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState<number>(agora.getFullYear());
  const { cores } = useTheme();
  const hojeStr = hojeBR();
  const ehHoje = dataSelecionada === hojeStr;

  useEffect(() => {
    if (!telaCheia) return;
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === 'Escape') setTelaCheia(false); };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [telaCheia]);

  const tt = { contentStyle: { background: cores.bg3, border: `1px solid ${cores.border}`, borderRadius: 8, fontSize: 14, color: cores.text } };
  const gridStroke = cores.border;

  const SERIES: SerieToggle[] = [
    { key: 'Geração', cor: cores.verde },
    { key: 'Consumo', cor: cores.vermelho },
    { key: 'Injetado', cor: cores.azul },
    { key: 'Consumo Instantâneo', cor: cores.roxo },
    { key: 'Balanço', cor: cores.amarelo }, // swatch renderizado como gradiente amarelo/laranja, ver abaixo
  ];

  useEffect(() => {
    const buscarDia = async () => {
      const resDados = await getDadosCliente(clienteAtivo, 24, ehHoje, ehHoje ? undefined : dataSelecionada);

      const dadosAsc = (resDados?.dados || []).slice().reverse();
      const pontos = dadosAsc.map((d: any) => {
        const dataHora = new Date(d.timestamp);
        const geracao = d.geracao_kw != null ? Number(d.geracao_kw) : null;
        const injetado = d.exportada_kw != null ? Number(d.exportada_kw) : null;
        const consumoTotal = d.consumo_kw != null ? Number(d.consumo_kw) : null;
        // Consumo instantâneo = autoconsumo = parte da própria geração que
        // é usada na hora, sem passar pela rede (Geração - Injetado). Um
        // pequeno desvio negativo pode aparecer por causa da pequena
        // defasagem/ruído entre a leitura do inversor e a do medidor (dois
        // sensores diferentes) — trava em 0 pra nunca mostrar autoconsumo
        // negativo, o que não existe fisicamente.
        const consumoInstantaneo = (geracao != null && injetado != null) ? Math.max(geracao - injetado, 0) : null;
        // Consumo (a linha vermelha) agora é só a energia IMPORTADA da rede
        // — o que antes incluía autoconsumo (consumo_kw do backend) menos
        // o autoconsumo que já foi separado acima. Mesma trava em 0 por
        // segurança contra ruído de medição.
        const consumoImportado = (consumoTotal != null && consumoInstantaneo != null)
          ? Math.max(consumoTotal - consumoInstantaneo, 0)
          : consumoTotal; // sem Injetado (ex: consumo_direto) não dá pra separar — mostra o total mesmo
        return {
          hora: dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          // Minutos desde meia-noite (0-1439) — usado como valor NUMÉRICO
          // do eixo X (em vez da hora como categoria/texto), pra poder
          // fixar o domínio em [0, 1439] e o gráfico sempre representar
          // o dia inteiro (00:00-23:59) na mesma escala, com espaço em
          // branco nas horas sem dado ainda, em vez de esticar os pontos
          // que existem pra ocupar a largura toda do gráfico.
          horaMin: dataHora.getHours() * 60 + dataHora.getMinutes() + dataHora.getSeconds() / 60,
          // Geração vem só dos inversores (Modbus) — sempre positiva/verde.
          'Geração': geracao,
          // Vermelho, abaixo do zero: só a energia importada da rede.
          'Consumo': consumoImportado != null ? -consumoImportado : null,
          // Injetado/Balanço só existem pra clientes bidirecionais (medidor
          // no padrão de entrada) — em consumo_direto ficam null, e o
          // gráfico simplesmente não desenha essas linhas.
          'Injetado': injetado,
          // Roxo, abaixo do zero: autoconsumo (geração usada na hora).
          'Consumo Instantâneo': consumoInstantaneo != null ? -consumoInstantaneo : null,
          // Balanço muda de cor conforme o sinal (amarelo se positivo,
          // laranja se negativo) — como o Recharts não colore uma linha
          // por trecho, desenhamos duas linhas separadas, cada uma só com
          // os pontos do seu sinal (a outra fica null naquele instante).
          // Continua vindo pronto do backend (geracao_kw - consumo_kw) —
          // matematicamente é o mesmo valor de Injetado - Consumo(importado),
          // já que Consumo(importado) + Consumo Instantâneo = consumo_kw.
          'Balanço (+)': d.balanco_kw != null && d.balanco_kw >= 0 ? Number(d.balanco_kw) : null,
          'Balanço (-)': d.balanco_kw != null && d.balanco_kw < 0 ? Number(d.balanco_kw) : null,
        };
      });
      return { pontos, totais: null as Totais | null };
    };

    const buscarHistorico = async (periodo: 'mes' | 'ano') => {
      // Sempre manda mes/ano explicitamente (mesmo quando é o mês/ano
      // corrente) — o backend trava o range em [1º dia, último dia] do
      // mês/ano pedido, sem passar do presente, então cobre tanto "mês
      // atual" quanto "mês anterior" com a mesma chamada. Isso substitui o
      // antigo hoje=true (janela calendário só do período corrente).
      const res = periodo === 'mes'
        ? await getHistorico(clienteAtivo, periodo, false, mesSelecionado, anoSelecionado)
        : await getHistorico(clienteAtivo, periodo, false, undefined, anoSelecionado);
      const pontos = res.pontos.map(p => ({
        hora: p.label,
        'Geração': p.geracao_kwh,
        'Consumo': p.consumo_kwh,
      }));
      return { pontos, totais: res.totais as Totais };
    };

    const buscar = async () => {
      try {
        const resultado = period === 'dia' ? await buscarDia() : await buscarHistorico(period);
        setData(resultado.pontos);
        setTotais(resultado.totais);
      } catch (err) {
        console.log('Erro ao buscar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    setData([]);
    setTotais(null);
    setZoomDomain(null); // troca de cliente/período reseta qualquer zoom anterior
    setBrushRange(null);
    buscar();
    // Só atualiza sozinho a cada 30s quando está mostrando o dia de HOJE —
    // um dia passado é histórico fixo, não faz sentido ficar re-buscando.
    const interval = (period === 'dia' && ehHoje) ? setInterval(buscar, 30000) : undefined;
    return () => { if (interval) clearInterval(interval); };
  }, [clienteAtivo, period, dataSelecionada, mesSelecionado, anoSelecionado, ehHoje]);

  const diaLabel = ehHoje ? 'Hoje' : new Date(dataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const TITULOS_DINAMICO: Record<MainChartProps['period'], { titulo: string; subtitulo: string }> = {
    dia: { titulo: `Geração × Consumo — ${diaLabel}`, subtitulo: `${diaLabel}, 00:00–23:59 · dados reais` },
    mes: { titulo: `Geração × Consumo — ${NOMES_MESES[mesSelecionado - 1]}/${anoSelecionado}`, subtitulo: 'Um ponto por dia · dados reais' },
    ano: { titulo: `Geração × Consumo — ${anoSelecionado}`, subtitulo: 'Um ponto por mês · dados reais' },
  };
  const { titulo, subtitulo } = TITULOS_DINAMICO[period];
  const unidade = period === 'dia' ? 'kW' : 'kWh';

  const toggle = (key: string) => setVisiveis(v => ({ ...v, [key]: !v[key] }));

  return (
    <div style={telaCheia ? {
      position: 'fixed', inset: 0, zIndex: 300, background: cores.bg2,
      padding: '1.5rem', overflowY: 'auto',
    } : {
      background: cores.bg2, border: `1px solid ${cores.border}`, borderRadius: 12, padding: '1.25rem',
    }}>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: cores.text }}>{titulo}</div>
          <div style={{ fontSize: 13, color: cores.text3, marginTop: 2 }}>{subtitulo}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {loading && <div style={{ fontSize: 13, color: cores.laranja }}>⟳ Carregando...</div>}
          {period === 'dia' && zoomDomain && (
            <button
              onClick={() => { setZoomDomain(null); setBrushRange(null); }}
              title="Voltar a mostrar o dia inteiro"
              style={{ background: 'transparent', border: `1px solid ${cores.border}`, borderRadius: 6, padding: '4px 8px', color: cores.text2, fontSize: 13, cursor: 'pointer' }}
            >
              ⤢ Dia inteiro
            </button>
          )}
          <button
            onClick={() => setTelaCheia(v => !v)}
            title={telaCheia ? 'Sair da tela cheia' : 'Expandir para tela cheia'}
            style={{ background: 'transparent', border: `1px solid ${cores.border}`, borderRadius: 6, padding: '4px 8px', color: cores.text2, fontSize: 16, cursor: 'pointer' }}
          >
            {telaCheia ? '✕' : '⛶'}
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
        {period === 'dia' && (
          <>
            <input
              type="date"
              value={dataSelecionada}
              max={hojeStr}
              onChange={(e) => e.target.value && setDataSelecionada(e.target.value)}
              style={{ background: cores.bg2, color: cores.text, border: `1px solid ${cores.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 14 }}
            />
            {!ehHoje && (
              <button
                onClick={() => setDataSelecionada(hojeStr)}
                style={{ background: 'transparent', border: `1px solid ${cores.border}`, borderRadius: 6, padding: '5px 10px', color: cores.text2, fontSize: 13, cursor: 'pointer' }}
              >
                ↺ Voltar para hoje
              </button>
            )}
          </>
        )}
        {period === 'mes' && (
          <>
            <select
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(Number(e.target.value))}
              style={{ background: cores.bg2, color: cores.text, border: `1px solid ${cores.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 14 }}
            >
              {NOMES_MESES.map((nome, idx) => (
                <option key={idx} value={idx + 1}>{nome}</option>
              ))}
            </select>
            <select
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(Number(e.target.value))}
              style={{ background: cores.bg2, color: cores.text, border: `1px solid ${cores.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 14 }}
            >
              {Array.from({ length: 6 }, (_, i) => agora.getFullYear() - i).map((ano) => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
            {(mesSelecionado !== agora.getMonth() + 1 || anoSelecionado !== agora.getFullYear()) && (
              <button
                onClick={() => { setMesSelecionado(agora.getMonth() + 1); setAnoSelecionado(agora.getFullYear()); }}
                style={{ background: 'transparent', border: `1px solid ${cores.border}`, borderRadius: 6, padding: '5px 10px', color: cores.text2, fontSize: 13, cursor: 'pointer' }}
              >
                ↺ Mês atual
              </button>
            )}
          </>
        )}
        {period === 'ano' && (
          <>
            <select
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(Number(e.target.value))}
              style={{ background: cores.bg2, color: cores.text, border: `1px solid ${cores.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 14 }}
            >
              {Array.from({ length: 6 }, (_, i) => agora.getFullYear() - i).map((ano) => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
            {anoSelecionado !== agora.getFullYear() && (
              <button
                onClick={() => setAnoSelecionado(agora.getFullYear())}
                style={{ background: 'transparent', border: `1px solid ${cores.border}`, borderRadius: 6, padding: '5px 10px', color: cores.text2, fontSize: 13, cursor: 'pointer' }}
              >
                ↺ Ano atual
              </button>
            )}
          </>
        )}
      </div>
      {!loading && data.length === 0 ? (
        <div style={{ color: cores.text3, fontSize: 14, textAlign: 'center', padding: '3rem 0' }}>Sem dados neste período ainda.</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={telaCheia ? window.innerHeight - 260 : 420}>
            {period === 'dia' ? (
              <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={cores.verde} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={cores.verde} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={cores.vermelho} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={cores.vermelho} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis
                  dataKey="horaMin"
                  type="number"
                  domain={zoomDomain ?? [0, 1439]}
                  ticks={zoomDomain ? undefined : TICKS_DIA}
                  tickFormatter={(v) => formatarMinutos(Number(v))}
                  tick={{ fill: cores.text3, fontSize: 12 }}
                  tickLine={false}
                  allowDataOverflow
                />
                <YAxis yAxisId="kw" tick={{ fill: cores.text3, fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={v => v + 'kW'} />
                <Tooltip {...tt} labelFormatter={(label) => formatarMinutos(Number(label))} />
                {visiveis['Geração'] && <Area yAxisId="kw" type="monotone" dataKey="Geração" stroke={cores.verde} strokeWidth={2} fill="url(#gG)" connectNulls />}
                {visiveis['Consumo'] && <Area yAxisId="kw" type="monotone" dataKey="Consumo" stroke={cores.vermelho} strokeWidth={2} fill="url(#gC)" connectNulls />}
                {visiveis['Injetado'] && (
                  <Line yAxisId="kw" type="monotone" dataKey="Injetado" stroke={cores.azul} strokeWidth={2} dot={false} connectNulls />
                )}
                {visiveis['Consumo Instantâneo'] && (
                  <Line yAxisId="kw" type="monotone" dataKey="Consumo Instantâneo" stroke={cores.roxo} strokeWidth={2} dot={false} connectNulls />
                )}
                {visiveis['Balanço'] && (
                  <>
                    <Line yAxisId="kw" type="monotone" dataKey="Balanço (+)" stroke={cores.amarelo} strokeWidth={2} dot={false} connectNulls />
                    <Line yAxisId="kw" type="monotone" dataKey="Balanço (-)" stroke={cores.laranja} strokeWidth={2} dot={false} connectNulls />
                  </>
                )}
                {/* Faixa de zoom: arrasta as alças pra focar num trecho do dia;
                    solta de volta nas pontas pra ver o dia inteiro de novo. */}
                <Brush
                  dataKey="horaMin"
                  height={26}
                  travellerWidth={10}
                  stroke={cores.laranja}
                  fill={cores.bg3}
                  tickFormatter={(v) => formatarMinutos(Number(v))}
                  startIndex={brushRange ? brushRange[0] : 0}
                  endIndex={brushRange ? brushRange[1] : Math.max(data.length - 1, 0)}
                  onChange={(range: any) => {
                    const iInicio = range?.startIndex;
                    const iFim = range?.endIndex;
                    if (iInicio == null || iFim == null || !data[iInicio] || !data[iFim]) return;
                    // Alças arrastadas de volta pras pontas -> volta a
                    // acompanhar o fim do dia automaticamente (índice
                    // recalculado a cada render, não fica preso).
                    if (iInicio <= 0 && iFim >= data.length - 1) {
                      setBrushRange(null);
                      setZoomDomain(null);
                    } else {
                      setBrushRange([iInicio, iFim]);
                      setZoomDomain([data[iInicio].horaMin, data[iFim].horaMin]);
                    }
                  }}
                />
              </ComposedChart>
            ) : (
              <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="hora" tick={{ fill: cores.text3, fontSize: 12 }} tickLine={false} interval={period === 'mes' ? 2 : 0} />
                <YAxis tick={{ fill: cores.text3, fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={v => v + unidade} />
                <Tooltip {...tt} />
                {visiveis['Geração'] && <Bar dataKey="Geração" fill={cores.verde} radius={[4, 4, 0, 0]} opacity={0.85} />}
                {visiveis['Consumo'] && <Bar dataKey="Consumo" fill={cores.vermelho} radius={[4, 4, 0, 0]} opacity={0.65} />}
              </BarChart>
            )}
          </ResponsiveContainer>

          {/* Checkboxes para ocultar/mostrar cada série, logo abaixo da linha do tempo */}
          <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
            {SERIES.filter(s => period === 'dia' || ['Geração', 'Consumo'].includes(s.key)).map(s => (
              <label key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: visiveis[s.key] ? cores.text : cores.text3, cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={visiveis[s.key]}
                  onChange={() => toggle(s.key)}
                  style={{ accentColor: s.cor, width: 14, height: 14, cursor: 'pointer' }}
                />
                <span style={{
                  width: 10, height: 10, borderRadius: 3,
                  background: s.key === 'Balanço' ? `linear-gradient(90deg, ${cores.amarelo} 50%, ${cores.laranja} 50%)` : s.cor,
                  opacity: visiveis[s.key] ? 1 : 0.35, display: 'inline-block',
                }} />
                {s.key}
              </label>
            ))}
          </div>

          {/* Card com o total do período — só aparece em Mês/Ano, não em Dia */}
          {totais && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${cores.border}` }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: cores.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  {LABEL_TOTAL[period]} — Geração
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: cores.verde, fontFamily: "'Barlow Condensed',sans-serif" }}>
                  {fmt(totais.geracao_kwh)} <span style={{ fontSize: 13, fontWeight: 400, color: cores.text2 }}>kWh</span>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: cores.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  {LABEL_TOTAL[period]} — Consumo
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: cores.vermelho, fontFamily: "'Barlow Condensed',sans-serif" }}>
                  {fmt(totais.consumo_kwh)} <span style={{ fontSize: 13, fontWeight: 400, color: cores.text2 }}>kWh</span>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: cores.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  {LABEL_TOTAL[period]} — Saldo
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: totais.saldo_kwh >= 0 ? cores.verde : cores.vermelho, fontFamily: "'Barlow Condensed',sans-serif" }}>
                  {totais.saldo_kwh >= 0 ? '+' : ''}{fmt(totais.saldo_kwh)} <span style={{ fontSize: 13, fontWeight: 400, color: cores.text2 }}>kWh</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MainChart;
