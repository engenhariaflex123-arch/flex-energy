import { getClienteAtivo } from '../services/api';
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getDadosCliente } from '../services/api';

const tt = { contentStyle: { background: '#1E2436', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 } };

const MainChart: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const buscarDados = async () => {
    try {
      const res = await getDadosCliente(getClienteAtivo(), 24);
      if (res.dados && res.dados.length > 0) {
        const formatado = res.dados
          .slice()
          .reverse()
          .map((d: any, index: number) => ({
            hora: new Date(d.timestamp).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
            Geração: Number(d.geracao_kw),
            Consumo: Number(d.consumo_kw),
          }));
        setData(formatado);
      }
    } catch (err) {
      console.log('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarDados();
    const interval = setInterval(buscarDados, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ background: '#181C27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1.25rem' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Geração × Consumo — Hoje</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Atualiza a cada 30 segundos · dados reais</div>
        </div>
        {loading && <div style={{ fontSize: 11, color: '#F97316' }}>⟳ Carregando...</div>}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#16A34A" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#DC2626" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="hora" tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v + 'kW'} />
          <Tooltip {...tt} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94A3B8' }} />
          <Area type="monotone" dataKey="Geração" stroke="#16A34A" strokeWidth={2} fill="url(#gG)" />
          <Area type="monotone" dataKey="Consumo" stroke="#DC2626" strokeWidth={2} fill="url(#gC)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MainChart;
