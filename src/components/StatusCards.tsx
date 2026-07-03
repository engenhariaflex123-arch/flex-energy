import { getClienteAtivo } from '../services/api';
import React, { useState, useEffect } from 'react';
import { getBalanco } from '../services/api';

const StatusCards: React.FC = () => {
  const [dados, setDados] = useState<any>(null);

  useEffect(() => {
    const buscar = async () => {
      try {
        const res = await getBalanco(getClienteAtivo(), 24);
        setDados(res);
      } catch (err) {
        console.log('Usando dados simulados');
      }
    };
    buscar();
    const interval = setInterval(buscar, 30000);
    return () => clearInterval(interval);
  }, []);

  const geracao = dados?.media_geracao_kw ?? 28.2;
  const consumo = dados?.media_consumo_kw ?? 6.6;
  const balanco = dados?.media_balanco_kw ?? 1.41;

  const cards = [
    { icon: '⚡', val: (geracao + consumo).toFixed(1).replace('.', ','), unit: 'kW', label: 'Potência Ativa', sub: 'Instantânea', color: 'orange' },
    { icon: '☀️', val: geracao.toFixed(1).replace('.', ','), unit: 'kW', label: 'Geração Atual', sub: '3 inversores', color: 'green' },
    { icon: '🔌', val: consumo.toFixed(1).replace('.', ','), unit: 'kW', label: 'Consumo Atual', sub: '4 ramais', color: 'red' },
    { icon: '⚠️', val: '1', unit: '', label: 'Alarmes Ativos', sub: 'Inv. 2 — tensão', color: 'yellow' },
    { icon: '📵', val: '1', unit: '', label: 'Equipamentos Off', sub: 'Medidor ramal 3', color: 'red' },
    { icon: '🌡️', val: '847', unit: 'W/m²', label: 'Irradiância', sub: 'Agora', color: 'blue' },
  ];

  const colors: Record<string, string> = {
    orange: '#F97316', green: '#16A34A', red: '#DC2626', yellow: '#EAB308', blue: '#3B82F6'
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginBottom: '1.25rem' }}>
      {cards.map((c, i) => (
        <div key={i} style={{ background: '#181C27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1rem', borderTop: `3px solid ${colors[c.color]}` }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
          <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, fontFamily: "'Barlow Condensed',sans-serif" }}>
            {c.val} <span style={{ fontSize: 13, fontWeight: 400, color: '#94A3B8' }}>{c.unit}</span>
          </div>
          <div style={{ fontSize: 10, color: '#64748B', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.label}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{c.sub}</div>
        </div>
      ))}
    </div>
  );
};

export default StatusCards;
