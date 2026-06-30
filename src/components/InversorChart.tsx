import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';

const InversorChart: React.FC = () => {
  const [data, setData] = useState<any[]>([]);

  const buscar = async () => {
    try {
      const res = await api.get('/inversor/cliente_001?horas=24');
      if (res.data.dados && res.data.dados.length > 0) {
        const formatado = res.data.dados.slice().reverse().map((d: any) => ({
          hora: new Date(d._time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          'Temperatura (°C)': Number(d.temperatura || 0).toFixed(1),
          'Pot. Injetada (kW)': Number(d.potencia_injetada_kw || 0).toFixed(2),
        }));
        setData(formatado);
      }
    } catch (err) {
      console.log('Erro ao buscar histórico do inversor');
    }
  };

  useEffect(() => {
    buscar();
    const interval = setInterval(buscar, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ background: '#181C27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1.25rem' }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: '1rem' }}>🌡️ Inversor — Temperatura & Potência Injetada</div>
      {data.length === 0 ? (
        <div style={{ color: '#64748B', fontSize: 12, textAlign: 'center', padding: '2rem' }}>Aguardando dados do ESP32...</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="hora" tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
            <YAxis yAxisId="left" tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: '#1E2436', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#94A3B8' }} />
            <Line yAxisId="left" type="monotone" dataKey="Temperatura (°C)" stroke="#F97316" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="Pot. Injetada (kW)" stroke="#16A34A" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default InversorChart;