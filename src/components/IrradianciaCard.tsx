import React, { useState, useEffect } from 'react';
import { getDadosIrradiancia } from '../services/api';

interface IrradianciaCardProps {
  clienteAtivo: string;
}

const IrradianciaCard: React.FC<IrradianciaCardProps> = ({ clienteAtivo }) => {
  const [irradiancia, setIrradiancia] = useState<number>(0);
  const [historico, setHistorico] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscar = async () => {
      try {
        const res = await getDadosIrradiancia(clienteAtivo, 6);
        if (res.dados && res.dados.length > 0) {
          setIrradiancia(Number(res.dados[0].irradiancia_wm2 || 0));
          setHistorico(res.dados.slice(0, 10).reverse().map((d: any) => Number(d.irradiancia_wm2 || 0)));
        }
      } catch (err) {
        console.log('Erro ao buscar irradiância');
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    buscar();
    const interval = setInterval(buscar, 30000);
    return () => clearInterval(interval);
  }, [clienteAtivo]);

  const nivel = irradiancia > 600 ? 'Alta' : irradiancia > 300 ? 'Média' : 'Baixa';
  const cor = irradiancia > 600 ? '#EAB308' : irradiancia > 300 ? '#F97316' : '#64748B';
  const max = 1200;
  const pct = Math.min((irradiancia / max) * 100, 100);

  return (
    <div style={{ background: '#181C27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1.25rem' }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: '1rem' }}>☀️ Irradiância Solar</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: '0.75rem' }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: cor }}>{irradiancia.toFixed(0)}</div>
        <div style={{ fontSize: 13, color: '#64748B', marginBottom: 6 }}>W/m²</div>
        <div style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: cor }}>{nivel}</div>
      </div>
      <div style={{ background: '#1E2436', borderRadius: 99, height: 8, marginBottom: '0.75rem' }}>
        <div style={{ background: cor, width: `${pct}%`, height: '100%', borderRadius: 99, transition: 'width 0.5s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748B' }}>
        <span>0</span><span>300</span><span>600</span><span>900</span><span>1200 W/m²</span>
      </div>
    </div>
  );
};

export default IrradianciaCard;