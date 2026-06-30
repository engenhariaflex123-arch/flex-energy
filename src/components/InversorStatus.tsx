import React, { useState, useEffect } from 'react';
import { getDadosInversor } from '../services/api';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  geracao_normal: { label: 'Geração Normal', color: '#16A34A', icon: '✅' },
  falha:          { label: 'Falha',          color: '#DC2626', icon: '❌' },
  alarme:         { label: 'Alarme',         color: '#EAB308', icon: '⚠️' },
  offline:        { label: 'Offline',        color: '#64748B', icon: '⭕' },
};

const InversorStatus: React.FC = () => {
  const [status, setStatus] = useState<string>('geracao_normal');
  const [temperatura, setTemperatura] = useState<number>(0);
  const [potencia, setPotencia] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const buscar = async () => {
    try {
      const res = await getDadosInversor('cliente_001', 1);
      if (res.dados && res.dados.length > 0) {
        const ultimo = res.dados[0];
        setStatus(ultimo.status || 'geracao_normal');
        setTemperatura(Number(ultimo.temperatura || 0));
        setPotencia(Number(ultimo.potencia_ativa_kw || 0));
      }
    } catch (err) {
      console.log('Erro ao buscar status do inversor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscar();
    const interval = setInterval(buscar, 30000);
    return () => clearInterval(interval);
  }, []);

  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['geracao_normal'];

  return (
    <div style={{ background: '#181C27', border: `1px solid ${cfg.color}44`, borderRadius: 12, padding: '1.25rem' }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: '1rem' }}>Status do Inversor</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
        <div style={{ fontSize: 32 }}>{cfg.icon}</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
          <div style={{ fontSize: 11, color: '#64748B' }}>Atualizado agora</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: '#1E2436', borderRadius: 8, padding: '0.75rem' }}>
          <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4 }}>POTÊNCIA ATIVA</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#F97316' }}>{potencia.toFixed(1)} <span style={{ fontSize: 12 }}>kW</span></div>
        </div>
        <div style={{ background: '#1E2436', borderRadius: 8, padding: '0.75rem' }}>
          <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4 }}>TEMPERATURA</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: temperatura > 60 ? '#DC2626' : '#38BDF8' }}>{temperatura.toFixed(1)} <span style={{ fontSize: 12 }}>°C</span></div>
        </div>
      </div>
    </div>
  );
};

export default InversorStatus;