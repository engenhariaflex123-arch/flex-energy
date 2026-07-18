import React, { useState, useEffect } from 'react';
import { getDadosCliente, getHistorico, getDadosIrradiancia, getIrradiacao } from '../services/api';

interface StatusCardsProps {
  clienteAtivo: string;
}

interface CardInfo {
  icon: string;
  val: string;
  unit: string;
  label: string;
  sub: string;
  color: string;
}

const colors: Record<string, string> = {
  orange: '#F97316', green: '#16A34A', red: '#DC2626', yellow: '#EAB308', blue: '#3B82F6', purple: '#A855F7',
};

const fmt = (n: number) => n.toFixed(1).replace('.', ',');

const StatusCards: React.FC<StatusCardsProps> = ({ clienteAtivo }) => {
  const [potenciaGeracao, setPotenciaGeracao] = useState(0);
  const [potenciaConsumo, setPotenciaConsumo] = useState(0);
  const [geracaoHoje, setGeracaoHoje] = useState(0);
  const [consumoHoje, setConsumoHoje] = useState(0);
  const [irradiancia, setIrradiancia] = useState(0);
  const [irradiacaoHoje, setIrradiacaoHoje] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscar = async () => {
      try {
        const [dados, historico, irrad, irradiacao] = await Promise.all([
          getDadosCliente(clienteAtivo, 1),
          getHistorico(clienteAtivo, 'dia'),
          getDadosIrradiancia(clienteAtivo, 1),
          getIrradiacao(clienteAtivo, 'dia'),
        ]);

        const ultimaLeitura = dados?.dados?.[0];
        setPotenciaGeracao(Number(ultimaLeitura?.geracao_kw) || 0);
        setPotenciaConsumo(Number(ultimaLeitura?.consumo_kw) || 0);

        setGeracaoHoje(historico?.totais?.geracao_kwh || 0);
        setConsumoHoje(historico?.totais?.consumo_kwh || 0);

        const ultimaIrrad = irrad?.dados?.[0];
        setIrradiancia(Number(ultimaIrrad?.irradiancia_wm2) || 0);

        setIrradiacaoHoje(irradiacao?.total_kwh_m2 || 0);
      } catch (err) {
        console.log('Erro ao buscar cards de status:', err);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    buscar();
    const interval = setInterval(buscar, 30000);
    return () => clearInterval(interval);
  }, [clienteAtivo]);

  const cards: CardInfo[] = [
    { icon: '⚡', val: fmt(potenciaGeracao), unit: 'kW', label: 'Potência Ativa', sub: 'Geração instantânea', color: 'orange' },
    { icon: '☀️', val: fmt(geracaoHoje), unit: 'kWh', label: 'Geração Hoje', sub: 'Acumulado do dia', color: 'green' },
    { icon: '🔌', val: fmt(potenciaConsumo), unit: 'kW', label: 'Consumo Ativo', sub: 'Consumo instantâneo', color: 'red' },
    { icon: '🏠', val: fmt(consumoHoje), unit: 'kWh', label: 'Consumo Hoje', sub: 'Acumulado do dia', color: 'red' },
    { icon: '🌡️', val: fmt(irradiancia), unit: 'W/m²', label: 'Irradiância', sub: 'Instantânea', color: 'blue' },
    { icon: '🔆', val: fmt(irradiacaoHoje), unit: 'kWh/m²', label: 'Irradiação', sub: 'Acumulada do dia', color: 'purple' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginBottom: '1.25rem' }}>
      {cards.map((c, i) => (
        <div key={i} style={{ background: '#181C27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0.85rem', borderTop: `3px solid ${colors[c.color]}` }}>
          <div style={{ fontSize: 20, marginBottom: 6 }}>{c.icon}</div>
          <div style={{ fontSize: 21, fontWeight: 700, lineHeight: 1, fontFamily: "'Barlow Condensed',sans-serif" }}>
            {loading ? '—' : c.val} <span style={{ fontSize: 12, fontWeight: 400, color: '#94A3B8' }}>{c.unit}</span>
          </div>
          <div style={{ fontSize: 10, color: '#64748B', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.label}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{c.sub}</div>
        </div>
      ))}
    </div>
  );
};

export default StatusCards;