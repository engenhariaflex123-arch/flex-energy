import { getClienteAtivo } from '../services/api';
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';

const StringsChart: React.FC = () => {
  const [data, setData] = useState<any[]>([]);

  const buscar = async () => {
    try {
      const res = await api.get(`/inversor/${getClienteAtivo()}?horas=1`);
      if (res.data.dados && res.data.dados.length > 0) {
        const ultimo = res.data.dados[0];
        const strings: any[] = [];
        let i = 1;
        while (ultimo[`tensao_string_${i}`] !== undefined || ultimo[`corrente_string_${i}`] !== undefined) {
          strings.push({
            name: `S${i}`,
            'Tensão (V)': Number(ultimo[`tensao_string_${i}`] || 0).toFixed(1),
            'Corrente (A)': Number(ultimo[`corrente_string_${i}`] || 0).toFixed(2),
          });
          i++;
        }
        setData(strings);
      }
    } catch (err) {
      console.log('Erro ao buscar strings');
    }
  };

  useEffect(() => {
    buscar();
    const interval = setInterval(buscar, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ background: '#181C27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1.25rem' }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: '1rem' }}>🔆 Strings do Inversor</div>
      {data.length === 0 ? (
        <div style={{ color: '#64748B', fontSize: 12, textAlign: 'center', padding: '2rem' }}>Aguardando dados do ESP32...</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: '#1E2436', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#94A3B8' }} />
            <Bar yAxisId="left" dataKey="Tensão (V)" fill="#EAB308" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="Corrente (A)" fill="#16A34A" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default StringsChart;
