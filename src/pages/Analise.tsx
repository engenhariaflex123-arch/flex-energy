import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Sidebar from '../components/Sidebar';
import { useTheme } from '../contexts/ThemeContext';
import {
  getDispositivosAnalise,
  getSerieAnalise,
  TipoAnalise,
  PontoSerieAnalise,
} from '../services/api';

// --- Descrição de cada campo disponível: rótulo amigável, unidade e a
// que grupo pertence (usado pra organizar os checkboxes e pra decidir em
// qual eixo Y do gráfico a linha entra). ---
interface CampoInfo {
  label: string;
  unidade: string;
  grupo: string;
}

const CAMPOS_INVERSOR: Record<string, CampoInfo> = {
  potencia_ativa_kw: { label: 'Potência ativa de geração', unidade: 'kW', grupo: 'Potência' },
  tensao_a: { label: 'Tensão de linha AN', unidade: 'V', grupo: 'Tensão de linha' },
  tensao_b: { label: 'Tensão de linha BN', unidade: 'V', grupo: 'Tensão de linha' },
  tensao_c: { label: 'Tensão de linha CN', unidade: 'V', grupo: 'Tensão de linha' },
  corrente_a: { label: 'Corrente de linha A', unidade: 'A', grupo: 'Corrente de linha' },
  corrente_b: { label: 'Corrente de linha B', unidade: 'A', grupo: 'Corrente de linha' },
  corrente_c: { label: 'Corrente de linha C', unidade: 'A', grupo: 'Corrente de linha' },
  temperatura: { label: 'Temperatura do inversor', unidade: '°C', grupo: 'Outras' },
};
for (let i = 1; i <= 20; i++) {
  CAMPOS_INVERSOR[`tensao_string_${i}`] = { label: `Tensão string ${i}`, unidade: 'V', grupo: 'Strings — Tensão' };
  CAMPOS_INVERSOR[`corrente_string_${i}`] = { label: `Corrente string ${i}`, unidade: 'A', grupo: 'Strings — Corrente' };
}

const CAMPOS_MEDIDOR: Record<string, CampoInfo> = {
  potencia_ativa_total_kw: { label: 'Potência ativa de consumo', unidade: 'kW', grupo: 'Potência' },
  potencia_reativa_kvar: { label: 'Potência reativa de consumo', unidade: 'kVAr', grupo: 'Potência' },
  tensao_fase_a: { label: 'Tensão de linha AN', unidade: 'V', grupo: 'Tensão de linha' },
  tensao_fase_b: { label: 'Tensão de linha BN', unidade: 'V', grupo: 'Tensão de linha' },
  tensao_fase_c: { label: 'Tensão de linha CN', unidade: 'V', grupo: 'Tensão de linha' },
  corrente_fase_a: { label: 'Corrente de linha A', unidade: 'A', grupo: 'Corrente de linha' },
  corrente_fase_b: { label: 'Corrente de linha B', unidade: 'A', grupo: 'Corrente de linha' },
  corrente_fase_c: { label: 'Corrente de linha C', unidade: 'A', grupo: 'Corrente de linha' },
  thd_tensao_percentual: { label: 'Harmônicas de tensão (THD)', unidade: '%', grupo: 'Harmônicas' },
  thd_corrente_percentual: { label: 'Harmônicas de corrente (THD)', unidade: '%', grupo: 'Harmônicas' },
};

const GRUPOS_ORDEM_INVERSOR = ['Potência', 'Tensão de linha', 'Corrente de linha', 'Outras', 'Strings — Tensão', 'Strings — Corrente'];
const GRUPOS_ORDEM_MEDIDOR = ['Potência', 'Tensão de linha', 'Corrente de linha', 'Harmônicas'];

// Paleta fixa (não vem do ThemeContext porque precisamos de várias cores
// bem diferenciáveis entre si para as linhas do gráfico, funcionando tanto
// no modo claro quanto no escuro).
const PALETA_LINHAS = [
  '#F97316', '#3B82F6', '#22C55E', '#EF4444', '#A855F7',
  '#06B6D4', '#EAB308', '#EC4899', '#14B8A6', '#F43F5E',
  '#8B5CF6', '#84CC16',
];

// Campos de potência/temperatura/percentual vão pro eixo esquerdo; tensão
// e corrente vão pro direito. Quando o usuário mistura tensão E corrente
// ao mesmo tempo, as duas dividem o eixo direito (escalas bem diferentes
// entre si) — por isso o aviso na interface pra evitar misturar demais.
const eixoDoCampo = (campo: string): 'left' | 'right' => {
  if (campo.includes('tensao')) return 'right';
  if (campo.includes('corrente')) return 'right';
  return 'left';
};

const formatarHora = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const hojeISO = () => {
  const d = new Date();
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
};

const Analise: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchParams] = useSearchParams();
  const { cores } = useTheme();
  const clienteAtivo = searchParams.get('cliente') || localStorage.getItem('cliente_id') || 'default';

  const [tipo, setTipo] = useState<TipoAnalise>('inversor');
  const [dispositivos, setDispositivos] = useState<string[]>([]);
  const [dispositivoSelecionado, setDispositivoSelecionado] = useState<string>('');
  const [data, setData] = useState<string>(hojeISO());
  const [camposSelecionados, setCamposSelecionados] = useState<string[]>(['potencia_ativa_kw']);
  const [pontos, setPontos] = useState<PontoSerieAnalise[]>([]);
  const [carregandoDispositivos, setCarregandoDispositivos] = useState(true);
  const [carregandoSerie, setCarregandoSerie] = useState(false);
  const [erro, setErro] = useState('');
  const [gruposAbertos, setGruposAbertos] = useState<Record<string, boolean>>({});

  const camposInfo = tipo === 'inversor' ? CAMPOS_INVERSOR : CAMPOS_MEDIDOR;
  const gruposOrdem = tipo === 'inversor' ? GRUPOS_ORDEM_INVERSOR : GRUPOS_ORDEM_MEDIDOR;

  // Ao trocar de tipo (inversor/medidor), recarrega a lista de dispositivos
  // e reseta pra um conjunto de campos padrão sensato (só potência).
  useEffect(() => {
    let cancelado = false;
    setCarregandoDispositivos(true);
    setErro('');
    getDispositivosAnalise(clienteAtivo, tipo)
      .then((lista) => {
        if (cancelado) return;
        setDispositivos(lista);
        setDispositivoSelecionado(lista[0] || 'principal');
      })
      .catch(() => {
        if (cancelado) return;
        setDispositivos(['principal']);
        setDispositivoSelecionado('principal');
      })
      .finally(() => { if (!cancelado) setCarregandoDispositivos(false); });

    setCamposSelecionados(tipo === 'inversor' ? ['potencia_ativa_kw'] : ['potencia_ativa_total_kw']);
    return () => { cancelado = true; };
  }, [tipo, clienteAtivo]);

  // Busca a série sempre que dispositivo, data ou campos escolhidos mudam.
  // Pequeno debounce pra não disparar uma requisição a cada clique quando
  // o usuário marca vários checkboxes em sequência rápida.
  useEffect(() => {
    if (!dispositivoSelecionado || camposSelecionados.length === 0) {
      setPontos([]);
      return;
    }
    const timeout = setTimeout(() => {
      setCarregandoSerie(true);
      setErro('');
      getSerieAnalise(clienteAtivo, tipo, camposSelecionados, dispositivoSelecionado, data)
        .then((res) => setPontos(res.pontos))
        .catch(() => setErro('Erro ao carregar a série de dados. Tente novamente.'))
        .finally(() => setCarregandoSerie(false));
    }, 350);
    return () => clearTimeout(timeout);
  }, [clienteAtivo, tipo, dispositivoSelecionado, data, camposSelecionados]);

  const toggleCampo = (campo: string) => {
    setCamposSelecionados((atual) =>
      atual.includes(campo) ? atual.filter((c) => c !== campo) : [...atual, campo]
    );
  };

  const toggleGrupo = (grupo: string) => {
    setGruposAbertos((atual) => ({ ...atual, [grupo]: !atual[grupo] }));
  };

  // Dados formatados pro recharts: hora legível + só os campos selecionados.
  const dadosGrafico = useMemo(() => {
    return pontos.map((p) => {
      const linha: Record<string, string | number> = { horaLabel: formatarHora(p.ts) };
      camposSelecionados.forEach((c) => {
        if (typeof p[c] === 'number') linha[c] = p[c] as number;
      });
      return linha;
    });
  }, [pontos, camposSelecionados]);

  const temTensaoECorrente =
    camposSelecionados.some((c) => c.includes('tensao')) &&
    camposSelecionados.some((c) => c.includes('corrente'));

  const grupoStyle: React.CSSProperties = { marginBottom: 14 };
  const grupoHeaderStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
    fontSize: 12, fontWeight: 600, color: cores.text2, letterSpacing: 0.4, textTransform: 'uppercase',
    padding: '6px 0', borderBottom: `1px solid ${cores.border}`, marginBottom: 8,
  };
  const checkboxLabelStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: cores.text, padding: '3px 0', cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar open={sidebarOpen} clienteAtivo={clienteAtivo} />
      <div style={{ flex: 1, marginLeft: sidebarOpen ? 220 : 0, transition: 'margin 0.3s', minWidth: 0, background: cores.bg }}>
        <div style={{ background: cores.bg2, borderBottom: `1px solid ${cores.border}`, padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 50 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'transparent', border: `1px solid ${cores.border}`, borderRadius: 6, padding: '4px 8px', color: cores.text2, fontSize: 16, cursor: 'pointer' }}>☰</button>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: cores.text }}>Análise Detalhada</div>
            <div style={{ fontSize: 11, color: cores.text3, marginTop: 1 }}>Gráfico configurável por inversor/medidor, variável e dia</div>
          </div>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, alignItems: 'start' }}>
          {/* --- Painel de filtros --- */}
          <div style={{ background: cores.bg2, border: `1px solid ${cores.border}`, borderRadius: 12, padding: '1rem' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {(['inversor', 'medidor'] as TipoAnalise[]).map((opcao) => (
                <button
                  key={opcao}
                  onClick={() => setTipo(opcao)}
                  style={{
                    flex: 1, background: tipo === opcao ? cores.laranja : 'transparent',
                    color: tipo === opcao ? '#fff' : cores.text2,
                    border: `1px solid ${tipo === opcao ? cores.laranja : cores.border}`,
                    borderRadius: 8, padding: '7px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {opcao === 'inversor' ? 'Inversor' : 'Medidor'}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: cores.text3, display: 'block', marginBottom: 4 }}>Dispositivo</label>
              <select
                value={dispositivoSelecionado}
                onChange={(e) => setDispositivoSelecionado(e.target.value)}
                disabled={carregandoDispositivos}
                style={{ width: '100%', background: cores.bg3, color: cores.text, border: `1px solid ${cores.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }}
              >
                {dispositivos.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {dispositivos.length <= 1 && (
                <div style={{ fontSize: 10.5, color: cores.text3, marginTop: 4 }}>
                  Só há um dispositivo "{dispositivos[0] || 'principal'}" registrado ainda para essa usina.
                </div>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: cores.text3, display: 'block', marginBottom: 4 }}>Dia</label>
              <input
                type="date"
                value={data}
                max={hojeISO()}
                onChange={(e) => setData(e.target.value)}
                style={{ width: '100%', background: cores.bg3, color: cores.text, border: `1px solid ${cores.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ fontSize: 11, color: cores.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Variáveis
            </div>
            {gruposOrdem.map((grupo) => {
              const camposDoGrupo = Object.entries(camposInfo).filter(([, info]) => info.grupo === grupo);
              if (camposDoGrupo.length === 0) return null;
              const ehGrupoDeStrings = grupo.startsWith('Strings');
              const aberto = ehGrupoDeStrings ? !!gruposAbertos[grupo] : true;
              return (
                <div key={grupo} style={grupoStyle}>
                  <div style={grupoHeaderStyle} onClick={() => ehGrupoDeStrings && toggleGrupo(grupo)}>
                    <span>{grupo}</span>
                    {ehGrupoDeStrings && <span>{aberto ? '−' : '+'}</span>}
                  </div>
                  {aberto && (
                    <div style={ehGrupoDeStrings ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px' } : undefined}>
                      {camposDoGrupo.map(([campo, info]) => (
                        <label key={campo} style={checkboxLabelStyle}>
                          <input
                            type="checkbox"
                            checked={camposSelecionados.includes(campo)}
                            onChange={() => toggleCampo(campo)}
                          />
                          {info.label} <span style={{ color: cores.text3, fontSize: 11 }}>({info.unidade})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* --- Gráfico --- */}
          <div style={{ background: cores.bg2, border: `1px solid ${cores.border}`, borderRadius: 12, padding: '1.25rem', minHeight: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: cores.text }}>
                {tipo === 'inversor' ? 'Inversor' : 'Medidor'} — {dispositivoSelecionado || '—'}
              </div>
              <div style={{ fontSize: 12, color: cores.text3 }}>
                {new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            </div>

            {temTensaoECorrente && (
              <div style={{ fontSize: 11, color: cores.text3, background: cores.bg3, border: `1px solid ${cores.border}`, borderRadius: 6, padding: '6px 10px', marginBottom: 10 }}>
                Tensão (V) e corrente (A) dividem o mesmo eixo direito — as escalas são bem diferentes. Para comparar melhor, veja uma unidade de cada vez.
              </div>
            )}

            {erro && <div style={{ color: cores.vermelho, fontSize: 13, marginBottom: 10 }}>{erro}</div>}

            {camposSelecionados.length === 0 ? (
              <div style={{ color: cores.text3, fontSize: 13, textAlign: 'center', padding: '4rem 0' }}>
                Selecione ao menos uma variável no painel à esquerda.
              </div>
            ) : carregandoSerie ? (
              <div style={{ color: cores.text2, fontSize: 13, textAlign: 'center', padding: '4rem 0' }}>Carregando...</div>
            ) : dadosGrafico.length === 0 ? (
              <div style={{ color: cores.text3, fontSize: 13, textAlign: 'center', padding: '4rem 0' }}>
                Nenhum dado encontrado para esse dia/dispositivo.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={420}>
                <LineChart data={dadosGrafico} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={cores.border} />
                  <XAxis dataKey="horaLabel" stroke={cores.text3} fontSize={11} minTickGap={30} />
                  <YAxis yAxisId="left" stroke={cores.text3} fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" stroke={cores.text3} fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: cores.bg2, border: `1px solid ${cores.border}`, borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: cores.text }}
                    formatter={(valor: number, nomeCampo: string) => {
                      const info = camposInfo[nomeCampo];
                      return [`${valor} ${info?.unidade || ''}`, info?.label || nomeCampo];
                    }}
                  />
                  <Legend
                    formatter={(nomeCampo: string) => camposInfo[nomeCampo]?.label || nomeCampo}
                    wrapperStyle={{ fontSize: 12, color: cores.text2 }}
                  />
                  {camposSelecionados.map((campo, idx) => (
                    <Line
                      key={campo}
                      yAxisId={eixoDoCampo(campo)}
                      type="monotone"
                      dataKey={campo}
                      stroke={PALETA_LINHAS[idx % PALETA_LINHAS.length]}
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analise;