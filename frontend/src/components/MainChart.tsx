import React, { useState, useEffect } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { getDadosCliente, getDadosIrradiancia, getHistorico } from '../services/api';

const tt = { contentStyle: { background: '#1E2436', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 } };

interface MainChartProps {
  clienteAtivo: string;
  period: 'dia' | 'mes' | 'ano';
}

const TITULOS: Record<MainChartProps['period'], { titulo: string; subtitulo: string }> = {
  dia:  { titulo: 'Geração × Consumo — Hoje',  subtitulo: 'Hoje, 00:00–23:59 · dados reais' },
  mes:  { titulo: 'Geração × Consumo — Mês',   subtitulo: 'Um ponto por dia · dados reais' },
  ano:  { titulo: 'Geração × Consumo — Ano',   subtitulo: 'Um ponto por mês · dados reais' },
};

interface SerieToggle {
  key: 'Geração' | 'Consumo' | 'Irradiância';
  cor: string;
}

const SERIES: SerieToggle[] = [
  { key: 'Geração', cor: '#16A34A' },
  { key: 'Consumo', cor: '#DC2626' },
  { key: 'Irradiância', cor: '#3B82F6' },
];

const MainChart: React.FC<MainChartProps> = ({ clienteAtivo, period }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visiveis, setVisiveis] = useState<Record<string, boolean>>({ 'Geração': true, 'Consumo': true, 'Irradiância': true });

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
      return dadosAsc.map((d: any) => ({
        hora: new Date(d.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        'Geração': Number(d.geracao_kw),
        'Consumo': Number(d.consumo_kw),
        'Irradiância': irradPorTimestamp[d.timestamp] ?? null,
      }));
    };

    const buscarHistorico = async (periodo: 'mes' | 'ano') => {
      const res = await getHistorico(clienteAtivo, periodo);
      return res.pontos.map(p => ({
        hora: p.label,
        'Geração': p.geracao_kwh,
        'Consumo': p.consumo_kwh,
      }));
    };

    const buscar = async () => {
      try {
        const formatado = period === 'dia' ? await buscarDia() : await buscarHistorico(period);
        setData(formatado);
      } catch (err) {
        console.log('Erro ao buscar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    setData([]);
    buscar();
    const interval = period === 'dia' ? setInterval(buscar, 30000) : undefined;
    return () => { if (interval) clearInterval(interval); };
  }, [clienteAtivo, period]);

  const { titulo, subtitulo } = TITULOS[period];
  const unidade = period === 'dia' ? 'kW' : 'kWh';
  const temIrradiancia = period === 'dia';

  const toggle = (key: string) => setVisiveis(v => ({ ...v, [key]: !v[key] }));

  return (
    <div style={{ background: '#181C27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1.25rem' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{titulo}</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{subtitulo}</div>
        </div>
        {loading && <div style={{ fontSize: 11, color: '#F97316' }}>⟳ Carregando...</div>}
      </div>
      {!loading && data.length === 0 ? (
        <div style={{ color: '#64748B', fontSize: 12, textAlign: 'center', padding: '3rem 0' }}>Sem dados neste período ainda.</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            {period === 'dia' ? (
              <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hora" tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
                <YAxis yAxisId="kw" tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v + 'kW'} />
                {temIrradiancia && (
                  <YAxis yAxisId="wm2" orientation="right" tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v + 'W/m²'} />
                )}
                <Tooltip {...tt} />
                {visiveis['Geração'] && <Area yAxisId="kw" type="monotone" dataKey="Geração" stroke="#16A34A" strokeWidth={2} fill="url(#gG)" />}
                {visiveis['Consumo'] && <Area yAxisId="kw" type="monotone" dataKey="Consumo" stroke="#DC2626" strokeWidth={2} fill="url(#gC)" />}
                {temIrradiancia && visiveis['Irradiância'] && (
                  <Line yAxisId="wm2" type="monotone" dataKey="Irradiância" stroke="#3B82F6" strokeWidth={2} dot={false} connectNulls />
                )}
              </ComposedChart>
            ) : (
              <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="hora" tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} interval={period === 'mes' ? 2 : 0} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v + unidade} />
                <Tooltip {...tt} />
                {visiveis['Geração'] && <Bar dataKey="Geração" fill="#16A34A" radius={[4, 4, 0, 0]} opacity={0.85} />}
                {visiveis['Consumo'] && <Bar dataKey="Consumo" fill="#DC2626" radius={[4, 4, 0, 0]} opacity={0.65} />}
              </BarChart>
            )}
          </ResponsiveContainer>

          {/* Checkboxes para ocultar/mostrar cada série, logo abaixo da linha do tempo */}
          <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
            {SERIES.filter(s => s.key !== 'Irradiância' || temIrradiancia).map(s => (
              <label key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: visiveis[s.key] ? '#E2E8F0' : '#64748B', cursor: 'pointer', userSelect: 'none' }}>
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
        </>
      )}
    </div>
  );
};

export default MainChart;
