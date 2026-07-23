import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClienteInfo, getDadosInversor, getDadosIrradiancia, getDadosCliente } from '../services/api';

interface OperacaoCardsProps {
  clienteAtivo: string;
}

// Mapeia o status combinado (hoje ainda não há rastreio por inversor
// individual - ver observação abaixo) para a contagem exibida em cada card.
const STATUS_MAP: Record<string, 'normal' | 'offline' | 'alarme' | 'falha'> = {
  geracao_normal: 'normal',
  offline: 'offline',
  alarme: 'alarme',
  falha: 'falha',
};

const OperacaoCards: React.FC<OperacaoCardsProps> = ({ clienteAtivo }) => {
  const navigate = useNavigate();
  const [totalInversores, setTotalInversores] = useState(0);
  const [statusAtual, setStatusAtual] = useState<'normal' | 'offline' | 'alarme' | 'falha'>('normal');
  const [potenciaKwp, setPotenciaKwp] = useState<number | null>(null);
  const [irradiancia, setIrradiancia] = useState(0);
  const [potenciaGeracao, setPotenciaGeracao] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscar = async () => {
      try {
        const [info, inversor, irrad, dados] = await Promise.all([
          getClienteInfo(clienteAtivo),
          getDadosInversor(clienteAtivo, 1),
          getDadosIrradiancia(clienteAtivo, 1),
          getDadosCliente(clienteAtivo, 1),
        ]);

        setTotalInversores(info?.total_inversores || 0);
        setPotenciaKwp(info?.potencia_kwp ?? null);

        const statusBruto = inversor?.dados?.[0]?.status as string | undefined;
        setStatusAtual(STATUS_MAP[statusBruto || ''] || 'normal');

        setIrradiancia(Number(irrad?.dados?.[0]?.irradiancia_wm2) || 0);
        setPotenciaGeracao(Number(dados?.dados?.[0]?.geracao_kw) || 0);
      } catch (err) {
        console.log('Erro ao buscar cards operacionais:', err);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    buscar();
    const interval = setInterval(buscar, 30000);
    return () => clearInterval(interval);
  }, [clienteAtivo]);

  // Aproximação combinada: como ainda não há status por inversor individual,
  // todos os inversores cadastrados entram no balde do status geral atual.
  const contagem = {
    normal: statusAtual === 'normal' ? totalInversores : 0,
    offline: statusAtual === 'offline' ? totalInversores : 0,
    alarme: statusAtual === 'alarme' ? totalInversores : 0,
    falha: statusAtual === 'falha' ? totalInversores : 0,
  };

  const potenciaEsperadaKw = potenciaKwp ? (irradiancia / 1000) * potenciaKwp : 0;
  const performancePct = potenciaEsperadaKw > 0 ? (potenciaGeracao / potenciaEsperadaKw) * 100 : 0;

  const cards = [
    { icon: '✅', val: String(contagem.normal), unit: '', label: 'Normal', sub: 'Inversores ok', color: 'green', onClick: () => navigate('/inversores?status=normal') },
    { icon: '⭕', val: String(contagem.offline), unit: '', label: 'Offline', sub: 'Sem comunicação', color: 'gray', onClick: () => navigate('/inversores?status=offline') },
    { icon: '⚠️', val: String(contagem.alarme), unit: '', label: 'Alarme', sub: 'Atenção necessária', color: 'yellow', onClick: () => navigate('/inversores?status=alarme') },
    { icon: '❌', val: String(contagem.falha), unit: '', label: 'Falha', sub: 'Desligado/falha', color: 'red', onClick: () => navigate('/inversores?status=falha') },
    { icon: '🎯', val: fmt(potenciaEsperadaKw), unit: 'kW', label: 'Energia Esperada', sub: 'Instantânea (irrad. × kWp)', color: 'blue', onClick: undefined },
    { icon: '📈', val: fmt(performancePct), unit: '%', label: 'Performance', sub: 'Instantânea (PR)', color: 'orange', onClick: undefined },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginBottom: '1.25rem' }}>
      {cards.map((c, i) => (
        <div
          key={i}
          onClick={c.onClick}
          style={{
            background: '#181C27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0.85rem',
            borderTop: `3px solid ${COLORS[c.color]}`, cursor: c.onClick ? 'pointer' : 'default', transition: 'background 0.15s',
          }}
          onMouseEnter={e => { if (c.onClick) e.currentTarget.style.background = '#1E2436'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#181C27'; }}
        >
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

const fmt = (n: number) => n.toFixed(1).replace('.', ',');

const COLORS: Record<string, string> = {
  green: '#16A34A', gray: '#64748B', yellow: '#EAB308', red: '#DC2626', blue: '#3B82F6', orange: '#F97316',
};

export default OperacaoCards;
