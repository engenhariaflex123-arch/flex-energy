import React, { useState, useEffect } from 'react';
import { getBalanco } from '../services/api';

interface BalanceCardProps {
  clienteAtivo: string;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ clienteAtivo }) => {
  const [balanco, setBalanco] = useState<any>(null);

  useEffect(() => {
    const buscar = async () => {
      try {
        const res = await getBalanco(clienteAtivo, 24);
        setBalanco(res);
      } catch (err) {
        console.log('Usando dados simulados');
      }
    };
    buscar();
    const interval = setInterval(buscar, 30000);
    return () => clearInterval(interval);
  }, [clienteAtivo]);

  const geracao = balanco?.media_geracao_kw ?? 4.82;
  const consumo = balanco?.media_consumo_kw ?? 3.41;
  const saldo = balanco?.media_balanco_kw ?? 1.41;
  const positivo = saldo >= 0;
  const pct = Math.min(Math.abs(geracao / (geracao + consumo)) * 100, 100);

  return (
    <div style={{ background: '#181C27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1.25rem' }}>
      <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        Saldo Energético — Hoje
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: positivo ? '#EAB308' : '#F97316', fontFamily: "'Barlow Condensed',sans-serif", lineHeight: 1 }}>
        {positivo ? '+' : ''}{saldo.toFixed(2).replace('.', ',')} <span style={{ fontSize: 14, fontWeight: 400 }}>kW médio</span>
      </div>
      <div style={{ fontSize: 11, color: '#64748B', marginTop: 4, marginBottom: 12 }}>
        {positivo ? '✅ Geração maior que consumo' : '⚠️ Consumo maior que geração'}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748B', marginBottom: 4 }}>
        <span>🔌 {consumo.toFixed(2)} kW</span>
        <span>☀️ {geracao.toFixed(2)} kW</span>
      </div>
      <div style={{ height: 6, background: '#1E2436', borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: positivo ? '#16A34A' : '#DC2626', borderRadius: 3, transition: 'width 0.5s' }}></div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { val: geracao.toFixed(1), label: 'kW Geração', c: '#16A34A' },
          { val: consumo.toFixed(1), label: 'kW Consumo', c: '#DC2626' },
          { val: `R$ ${(saldo * 0.75 * 24).toFixed(0)}`, label: 'Economia/dia', c: '#F97316' }
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, background: '#1E2436', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: s.c }}>{s.val}</div>
            <div style={{ fontSize: 10, color: '#64748B' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BalanceCard;