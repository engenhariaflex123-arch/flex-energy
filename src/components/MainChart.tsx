import React, { useState, useEffect } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getDadosCliente, getDadosIrradiancia, getHistorico } from '../services/api';
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

const TITULOS: Record<MainChartProps['period'], { titulo: string; subtitulo: string }> = {
  dia:  { titulo: 'Geração × Consumo — Hoje',  subtitulo: 'Hoje, 00:00–23:59 · dados reais' },
  mes:  { titulo: 'Geração × Consumo — Mês',   subtitulo: 'Um ponto por dia · dados reais' },
  ano:  { titulo: 'Geração × Consumo — Ano',   subtitulo: 'Um ponto por mês · dados reais' },
};

const LABEL_TOTAL: Record<MainChartProps['period'], string> = {
  dia: '',
  mes: 'Total do Mês',
  ano: 'Total do Ano',
};

interface SerieToggle {
  key: 'Geração' | 'Consumo' | 'Irradiância';
  cor: string;
}

const fmt = (n: number) => n.toFixed(1).replace('.', ',');

const MainChart: React.FC<MainChartProps> = ({ clienteAtivo, period }) => {
  const [data, setData] = useState<any[]>([]);
  const [totais, setTotais] = useState<Totais | null>(null);
  const [loading, setLoading] = useState(true);
  const [visiveis, setVisiveis] = useState<Record<string, boolean>>({ 'Geração': true, 'Consumo': true, 'Irradiância': true });
  const [telaCheia, setTelaCheia] = useState(false);
  const { cores } = useTheme();

  useEffect(() => {
    if (!telaCheia) return;
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === 'Escape') setTelaCheia(false); };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [telaCheia]);

  const tt = { contentStyle: { background: cores.bg3, border: `1px solid ${cores.border}`, borderRadius: 8, fontSize: 12, color: cores.text } };
  const gridStroke = cores.border;

  const SERIES: SerieToggle[] = [
    { key: 'Geração', cor: cores.verde },
    { key: 'Consumo', cor: cores.vermelho },
    { key: 'Irradiância', cor: cores.azul },
  ];

  useEffect(() => {
    const buscarDia = async () => {
      const [resDados, resIrrad] = await Promise.all([
        getDadosCliente(clienteAtivo, 24, true),
        getDadosIrradiancia(clienteAtivo, 24, true),
      ]);

      const irradPorTimestamp: Record<string, number> = {};
      (resIrrad?.dados || []).forEach((d: any) => {
        if (d._time) irradPorTimestamp[d._time] = Number(d.irradiancia_wm2) || 0;
      });

      const dadosAsc = (resDados?.dados || []).slice().reverse();
      const pontos = dadosAsc.map((d: any) => ({
        hora: new Date(d.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        'Geração': Number(d.geracao_kw),
        'Consumo': Number(d.consumo_kw),
        'Irradiância': irradPorTimestamp[d.timestamp] ?? null,
      }));
      return { pontos, totais: null as Totais | null };
    };

    const buscarHistorico = async (periodo: 'mes' | 'ano') => {
      // hoje=true: usa o mês/ano CALENDÁRIO (desde o dia 1, ou desde 1º de
      // janeiro), não uma janela móvel de 31/365 dias corridos — senão
      // "Mês" mistura pedaço do mês anterior, e "Ano" mistura o ano passado
      // (mesmo bug corrigido antes no período "Dia", agora também aqui).
      const res = await getHistorico(clienteAtivo, periodo, true);
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
    buscar();
    const interval = period === 'dia' ? setInterval(buscar, 30000) : undefined;
    return () => { if (interval) clearInterval(interval); };
  }, [clienteAtivo, period]);

  const { titulo, subtitulo } = TITULOS[period];
  const unidade = period === 'dia' ? 'kW' : 'kWh';
  const temIrradiancia = period === 'dia';

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
          <div style={{ fontSize: 13, fontWeight: 600, color: cores.text }}>{titulo}</div>
          <div style={{ fontSize: 11, color: cores.text3, marginTop: 2 }}>{subtitulo}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {loading && <div style={{ fontSize: 11, color: cores.laranja }}>⟳ Carregando...</div>}
          <button
            onClick={() => setTelaCheia(v => !v)}
            title={telaCheia ? 'Sair da tela cheia' : 'Expandir para tela cheia'}
            style={{ background: 'transparent', border: `1px solid ${cores.border}`, borderRadius: 6, padding: '4px 8px', color: cores.text2, fontSize: 14, cursor: 'pointer' }}
          >
            {telaCheia ? '✕' : '⛶'}
          </button>
        </div>
      </div>
      {!loading && data.length === 0 ? (
        <div style={{ color: cores.text3, fontSize: 12, textAlign: 'center', padding: '3rem 0' }}>Sem dados neste período ainda.</div>
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
                <XAxis dataKey="hora" tick={{ fill: cores.text3, fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
                <YAxis yAxisId="kw" tick={{ fill: cores.text3, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v + 'kW'} />
                {temIrradiancia && (
                  <YAxis yAxisId="wm2" orientation="right" tick={{ fill: cores.text3, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v + 'W/m²'} />
                )}
                <Tooltip {...tt} />
                {visiveis['Geração'] && <Area yAxisId="kw" type="monotone" dataKey="Geração" stroke={cores.verde} strokeWidth={2} fill="url(#gG)" />}
                {visiveis['Consumo'] && <Area yAxisId="kw" type="monotone" dataKey="Consumo" stroke={cores.vermelho} strokeWidth={2} fill="url(#gC)" />}
                {temIrradiancia && visiveis['Irradiância'] && (
                  <Line yAxisId="wm2" type="monotone" dataKey="Irradiância" stroke={cores.azul} strokeWidth={2} dot={false} connectNulls />
                )}
              </ComposedChart>
            ) : (
              <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="hora" tick={{ fill: cores.text3, fontSize: 10 }} tickLine={false} interval={period === 'mes' ? 2 : 0} />
                <YAxis tick={{ fill: cores.text3, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v + unidade} />
                <Tooltip {...tt} />
                {visiveis['Geração'] && <Bar dataKey="Geração" fill={cores.verde} radius={[4, 4, 0, 0]} opacity={0.85} />}
                {visiveis['Consumo'] && <Bar dataKey="Consumo" fill={cores.vermelho} radius={[4, 4, 0, 0]} opacity={0.65} />}
              </BarChart>
            )}
          </ResponsiveContainer>

          {/* Checkboxes para ocultar/mostrar cada série, logo abaixo da linha do tempo */}
          <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
            {SERIES.filter(s => s.key !== 'Irradiância' || temIrradiancia).map(s => (
              <label key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: visiveis[s.key] ? cores.text : cores.text3, cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={visiveis[s.key]}
                  onChange={() => toggle(s.key)}
                  style={{ accentColor: s.cor, width: 14, height: 14, cursor: 'pointer' }}
                />
                <span style={{ width: 10, height: 10, borderRadius: 3, background: s.cor, opacity: visiveis[s.key] ? 1 : 0.35, display: 'inline-block' }} />
                {s.key}
              </label>
            ))}
          </div>

          {/* Card com o total do período — só aparece em Mês/Ano, não em Dia */}
          {totais && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${cores.border}` }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: cores.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  {LABEL_TOTAL[period]} — Geração
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: cores.verde, fontFamily: "'Barlow Condensed',sans-serif" }}>
                  {fmt(totais.geracao_kwh)} <span style={{ fontSize: 11, fontWeight: 400, color: cores.text2 }}>kWh</span>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: cores.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  {LABEL_TOTAL[period]} — Consumo
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: cores.vermelho, fontFamily: "'Barlow Condensed',sans-serif" }}>
                  {fmt(totais.consumo_kwh)} <span style={{ fontSize: 11, fontWeight: 400, color: cores.text2 }}>kWh</span>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: cores.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  {LABEL_TOTAL[period]} — Saldo
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: totais.saldo_kwh >= 0 ? cores.verde : cores.vermelho, fontFamily: "'Barlow Condensed',sans-serif" }}>
                  {totais.saldo_kwh >= 0 ? '+' : ''}{fmt(totais.saldo_kwh)} <span style={{ fontSize: 11, fontWeight: 400, color: cores.text2 }}>kWh</span>
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