import React, { useState, useEffect } from 'react';
import { getBalancoHoje, BalancoHoje } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

interface BalanceCardProps {
  clienteAtivo: string;
  // Dia (YYYY-MM-DD, fuso de Brasília) a mostrar aqui — repassado pelo
  // Dashboard a partir do dia selecionado no filtro do gráfico principal
  // (MainChart). Sem essa prop, continua mostrando hoje, como sempre.
  data?: string;
}

const fmt = (n: number) => n.toFixed(2).replace('.', ',');

// Data de hoje no fuso de Brasília, no formato YYYY-MM-DD — mesmo formato
// usado pelo seletor de dia do MainChart, pra comparar se `data` é hoje.
const hojeBR = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

// "2026-09-23" -> "23/09" — pra exibir no título quando não é hoje.
const formatarDataTitulo = (isoData: string) => {
  const [, mes, dia] = isoData.split('-');
  return `${dia}/${mes}`;
};

const BalanceCard: React.FC<BalanceCardProps> = ({ clienteAtivo, data }) => {
  const [dados, setDados] = useState<BalancoHoje | null>(null);
  const [loading, setLoading] = useState(true);
  const { cores } = useTheme();
  const ehHoje = !data || data === hojeBR();
  const titulo = ehHoje ? 'Saldo Energético — Hoje' : `Saldo Energético — ${formatarDataTitulo(data as string)}`;

  useEffect(() => {
    const buscar = async () => {
      try {
        const res = await getBalancoHoje(clienteAtivo, data);
        setDados(res);
      } catch (err) {
        console.log('Erro ao buscar saldo energético:', err);
        setDados(null);
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    buscar();
    // Só fica atualizando sozinho quando é hoje — um dia já encerrado no
    // passado não muda mais, então não precisa (nem faz sentido) recarregar
    // a cada 30s.
    const interval = ehHoje ? setInterval(buscar, 30000) : undefined;
    return () => { if (interval) clearInterval(interval); };
  }, [clienteAtivo, data, ehHoje]);

  if (loading) {
    return (
      <div style={{ background: cores.bg2, border: `1px solid ${cores.border}`, borderRadius: 12, padding: '1.25rem' }}>
        <div style={{ fontSize: 12, color: cores.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          {titulo}
        </div>
        <div style={{ color: cores.text3, fontSize: 14 }}>⟳ Carregando...</div>
      </div>
    );
  }

  if (!dados) {
    return (
      <div style={{ background: cores.bg2, border: `1px solid ${cores.border}`, borderRadius: 12, padding: '1.25rem' }}>
        <div style={{ fontSize: 12, color: cores.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          {titulo}
        </div>
        <div style={{ color: cores.text3, fontSize: 14 }}>
          {ehHoje ? 'Sem dados disponíveis ainda hoje.' : 'Sem dados disponíveis para esse dia.'}
        </div>
      </div>
    );
  }

  const { geracao_kwh, consumo_kwh, consumo_instantaneo_kwh, energia_injetada_kwh, saldo_kwh, fonte_injecao } = dados;
  const positivo = saldo_kwh >= 0;
  const totalBarra = geracao_kwh + consumo_kwh;
  const pctGeracao = totalBarra > 0 ? Math.min((geracao_kwh / totalBarra) * 100, 100) : 0;

  return (
    <div style={{ background: cores.bg2, border: `1px solid ${cores.border}`, borderRadius: 12, padding: '1.25rem' }}>
      <div style={{ fontSize: 12, color: cores.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        {titulo}
      </div>
      <div style={{ fontSize: 34, fontWeight: 700, color: positivo ? cores.verde : cores.vermelho, fontFamily: "'Barlow Condensed',sans-serif", lineHeight: 1 }}>
        {positivo ? '+' : ''}{fmt(saldo_kwh)} <span style={{ fontSize: 16, fontWeight: 400 }}>kWh</span>
      </div>
      <div style={{ fontSize: 13, color: cores.text3, marginTop: 4, marginBottom: 12 }}>
        {positivo ? '✅ Geração maior que consumo' : '⚠️ Consumo maior que geração'}
      </div>
      <div style={{ height: 6, background: cores.bg3, borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ height: '100%', width: `${pctGeracao}%`, background: positivo ? cores.verde : cores.vermelho, borderRadius: 3, transition: 'width 0.5s' }}></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        {[
          { val: fmt(geracao_kwh), label: 'Geração (kWh)', c: cores.verde },
          { val: fmt(consumo_kwh), label: 'Consumo (kWh)', c: cores.vermelho },
          { val: fmt(consumo_instantaneo_kwh), label: 'Consumo instantâneo', c: cores.azul },
          { val: fmt(energia_injetada_kwh), label: 'Energia injetada', c: cores.amarelo },
        ].map((s, i) => (
          <div key={i} style={{ background: cores.bg3, borderRadius: 8, padding: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: s.c }}>{s.val}</div>
            <div style={{ fontSize: 12, color: cores.text3 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: cores.text3, textAlign: 'right' }}>
        Injeção/consumo {fonte_injecao === 'medido' ? 'medidos' : 'estimados'}
      </div>
    </div>
  );
};

export default BalanceCard;
