import React, { useState, useEffect } from 'react';
import { PieChart as RePieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getHistorico, PeriodoHistorico } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

interface PieChartProps {
  clienteAtivo: string;
  period: PeriodoHistorico;
}

const TITULOS: Record<PeriodoHistorico, string> = {
  dia: 'Balanço — Hoje',
  mes: 'Balanço — Mês',
  ano: 'Balanço — Ano',
};

const PieChart: React.FC<PieChartProps> = ({ clienteAtivo, period }) => {
  const [dados, setDados] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const { cores } = useTheme();

  const CORES: Record<string, string> = {
    'Geração': cores.verde,
    'Consumo': cores.vermelho,
    'Saldo':   cores.amarelo,
  };

  useEffect(() => {
    const buscar = async () => {
      try {
        // hoje=true: mês/ano calendário, não janela móvel (ver nota em
        // MainChart.tsx sobre o mesmo bug corrigido em 01/08/2026).
        const res = await getHistorico(clienteAtivo, period, true);
        const { geracao_kwh, consumo_kwh, saldo_kwh } = res.totais;
        setDados([
          { name: 'Geração', value: Math.max(geracao_kwh, 0) },
          { name: 'Consumo', value: Math.max(consumo_kwh, 0) },
          { name: 'Saldo', value: Math.abs(saldo_kwh) },
        ]);
      } catch (err) {
        console.log('Erro ao buscar histórico para o gráfico de pizza:', err);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    buscar();
    // Só o período "dia" muda com frequência ao longo do próprio dia;
    // mês/ano não precisam de atualização a cada 30s.
    const interval = period === 'dia' ? setInterval(buscar, 60000) : undefined;
    return () => { if (interval) clearInterval(interval); };
  }, [clienteAtivo, period]);

  const total = dados.reduce((acc, d) => acc + d.value, 0);

  return (
    <div style={{ background: cores.bg2, border: `1px solid ${cores.border}`, borderRadius: 12, padding: '1.25rem' }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: cores.text }}>{TITULOS[period]}</div>
      <div style={{ fontSize: 11, color: cores.text3, marginBottom: '0.75rem' }}>Geração, consumo e saldo (kWh)</div>
      {loading ? (
        <div style={{ color: cores.text3, fontSize: 12, textAlign: 'center', padding: '2rem 0' }}>⟳ Carregando...</div>
      ) : total === 0 ? (
        <div style={{ color: cores.text3, fontSize: 12, textAlign: 'center', padding: '2rem 0' }}>Sem dados neste período ainda.</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <RePieChart>
            <Pie data={dados} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
              {dados.map((d) => <Cell key={d.name} fill={CORES[d.name]} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: cores.bg3, border: `1px solid ${cores.border}`, borderRadius: 8, fontSize: 12, color: cores.text }}
              formatter={(value: any) => [`${Number(value).toFixed(1)} kWh`, '']}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: cores.text2 }} />
          </RePieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default PieChart;