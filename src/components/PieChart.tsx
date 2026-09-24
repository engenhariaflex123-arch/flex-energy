import React, { useState, useEffect } from 'react';
import { PieChart as RePieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getHistorico, getBalancoHoje, PeriodoHistorico } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

interface PieChartProps {
  clienteAtivo: string;
  period: PeriodoHistorico;
  // Dia (YYYY-MM-DD, fuso de Brasília) a mostrar quando period==='dia' —
  // repassado pelo Dashboard a partir do dia selecionado no filtro do
  // gráfico principal (MainChart). Sem essa prop, continua mostrando hoje,
  // como sempre. Não afeta os períodos 'mes'/'ano'.
  data?: string;
}

// Data de hoje no fuso de Brasília, no formato YYYY-MM-DD.
const hojeBR = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

// "2026-09-23" -> "23/09" — pra exibir no título quando não é hoje.
const formatarDataTitulo = (isoData: string) => {
  const [, mes, dia] = isoData.split('-');
  return `${dia}/${mes}`;
};

const PieChart: React.FC<PieChartProps> = ({ clienteAtivo, period, data }) => {
  const [dados, setDados] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const { cores } = useTheme();
  const ehHoje = !data || data === hojeBR();
  const titulo = period === 'dia'
    ? (ehHoje ? 'Balanço — Hoje' : `Balanço — ${formatarDataTitulo(data as string)}`)
    : (period === 'mes' ? 'Balanço — Mês' : 'Balanço — Ano');

  const CORES: Record<string, string> = {
    'Geração': cores.verde,
    'Consumo': cores.vermelho,
    'Saldo':   cores.amarelo,
  };

  useEffect(() => {
    const buscar = async () => {
      try {
        if (period === 'dia') {
          // Usa a mesma fórmula real (medida) do card "Saldo Energético",
          // em vez da soma simplificada do /historico — além de sincronizar
          // com o dia escolhido no filtro do gráfico principal, isso unifica
          // os números dos dois cards, que antes podiam divergir levemente.
          const res = await getBalancoHoje(clienteAtivo, data);
          setDados([
            { name: 'Geração', value: Math.max(res.geracao_kwh, 0) },
            { name: 'Consumo', value: Math.max(res.consumo_kwh, 0) },
            { name: 'Saldo', value: Math.abs(res.saldo_kwh) },
          ]);
          return;
        }
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
        console.log('Erro ao buscar dados para o gráfico de pizza:', err);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    buscar();
    // Só atualiza sozinho quando é o período "dia" de hoje — mês/ano não
    // mudam a cada minuto, e um dia já encerrado no passado não muda mais.
    const interval = (period === 'dia' && ehHoje) ? setInterval(buscar, 60000) : undefined;
    return () => { if (interval) clearInterval(interval); };
  }, [clienteAtivo, period, data, ehHoje]);

  const total = dados.reduce((acc, d) => acc + d.value, 0);

  return (
    <div style={{ background: cores.bg2, border: `1px solid ${cores.border}`, borderRadius: 12, padding: '1.25rem' }}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: cores.text }}>{titulo}</div>
      <div style={{ fontSize: 13, color: cores.text3, marginBottom: '0.75rem' }}>Geração, consumo e saldo (kWh)</div>
      {loading ? (
        <div style={{ color: cores.text3, fontSize: 14, textAlign: 'center', padding: '2rem 0' }}>⟳ Carregando...</div>
      ) : total === 0 ? (
        <div style={{ color: cores.text3, fontSize: 14, textAlign: 'center', padding: '2rem 0' }}>Sem dados neste período ainda.</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <RePieChart>
            <Pie data={dados} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
              {dados.map((d) => <Cell key={d.name} fill={CORES[d.name]} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: cores.bg3, border: `1px solid ${cores.border}`, borderRadius: 8, fontSize: 14, color: cores.text }}
              formatter={(value: any) => [`${Number(value).toFixed(1)} kWh`, '']}
            />
            <Legend wrapperStyle={{ fontSize: 13, color: cores.text2 }} />
          </RePieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default PieChart;
