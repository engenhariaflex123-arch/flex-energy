import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const MedidorCard: React.FC = () => {
  const [dados, setDados] = useState<any>(null);

  const buscar = async () => {
    try {
      const res = await api.get('/medidor/cliente_001?horas=1');
      if (res.data.dados && res.data.dados.length > 0) {
        setDados(res.data.dados[0]);
      }
    } catch (err) {
      console.log('Erro ao buscar medidor');
    }
  };

  useEffect(() => {
    buscar();
    const interval = setInterval(buscar, 30000);
    return () => clearInterval(interval);
  }, []);

  const campo = (label: string, valor: any, unidade: string, cor = '#94A3B8') => (
    <div style={{ background: '#1E2436', borderRadius: 8, padding: '0.6rem 0.8rem' }}>
      <div style={{ fontSize: 10, color: '#64748B', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: cor }}>
        {valor !== undefined && valor !== null ? Number(valor).toFixed(1) : '—'} <span style={{ fontSize: 11, fontWeight: 400 }}>{unidade}</span>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#181C27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1.25rem' }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: '1rem' }}>⚡ Medidor — Dados em Tempo Real</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        {campo('TENSÃO FASE A', dados?.tensao_fase_a, 'V', '#38BDF8')}
        {campo('TENSÃO FASE B', dados?.tensao_fase_b, 'V', '#38BDF8')}
        {campo('TENSÃO FASE C', dados?.tensao_fase_c, 'V', '#38BDF8')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        {campo('CORRENTE FASE A', dados?.corrente_fase_a, 'A', '#F97316')}
        {campo('CORRENTE FASE B', dados?.corrente_fase_b, 'A', '#F97316')}
        {campo('CORRENTE FASE C', dados?.corrente_fase_c, 'A', '#F97316')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {campo('POT. ATIVA A', dados?.potencia_ativa_a_kw, 'kW', '#16A34A')}
        {campo('POT. ATIVA B', dados?.potencia_ativa_b_kw, 'kW', '#16A34A')}
        {campo('POT. ATIVA C', dados?.potencia_ativa_c_kw, 'kW', '#16A34A')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
        {campo('POT. REATIVA', dados?.potencia_reativa_kvar, 'kVAr', '#EAB308')}
        {campo('POT. ATIVA TOTAL', dados?.potencia_ativa_total_kw, 'kW', '#DC2626')}
      </div>
    </div>
  );
};

export default MedidorCard;