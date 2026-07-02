import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getResumoGrupo } from '../services/api';

interface Usina {
  cliente_id: string;
  nome: string;
  cidade: string;
  estado: string;
  status: string;
  geracao_kw: number;
  consumo_kw: number;
  ultima_leitura: string | null;
}

interface Resumo {
  grupo_id: number;
  nome_grupo: string;
  total_usinas: number;
  total_geracao_kw: number;
  total_consumo_kw: number;
  usinas: Usina[];
}

const statusCor: Record<string, string> = {
  produzindo: '#22C55E',
  online: '#3B82F6',
  offline: '#EF4444',
};

const statusLabel: Record<string, string> = {
  produzindo: 'Produzindo',
  online: 'Online',
  offline: 'Offline',
};

const VisaoGeral: React.FC = () => {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const grupoId = localStorage.getItem('grupo_id');
    if (!grupoId) {
      navigate('/dashboard');
      return;
    }
    carregar(Number(grupoId));
    const interval = setInterval(() => carregar(Number(grupoId)), 30000);
    return () => clearInterval(interval);
  }, []);

  const carregar = async (grupoId: number) => {
    try {
      const dados = await getResumoGrupo(grupoId);
      setResumo(dados);
      setErro('');
    } catch (e) {
      setErro('Erro ao carregar dados do grupo');
    } finally {
      setCarregando(false);
    }
  };

  if (carregando) {
    return (
      <div style={{ minHeight: '100vh', background: '#0F1117', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
        Carregando...
      </div>
    );
  }

  if (erro || !resumo) {
    return (
      <div style={{ minHeight: '100vh', background: '#0F1117', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F87171' }}>
        {erro || 'Nenhum dado encontrado'}
      </div>
    );
  }

  const saldo = resumo.total_geracao_kw - resumo.total_consumo_kw;
  const usinasOnline = resumo.usinas.filter(u => u.status !== 'offline').length;

  return (
    <div style={{ minHeight: '100vh', background: '#0F1117', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 32, fontWeight: 700, color: '#F97316' }}>
          {resumo.nome_grupo}
        </div>
        <div style={{ fontSize: 13, color: '#64748B' }}>Visão Geral das Usinas</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: '2rem' }}>
        <Card titulo="TOTAL DE USINAS" valor={String(resumo.total_usinas)} sub={`${usinasOnline} ativas`} cor="#F97316" />
        <Card titulo="GERAÇÃO ATUAL" valor={`${resumo.total_geracao_kw.toFixed(2)} kW`} sub="Soma de todas as usinas" cor="#22C55E" />
        <Card titulo="CONSUMO ATUAL" valor={`${resumo.total_consumo_kw.toFixed(2)} kW`} sub="Soma de todas as usinas" cor="#F87171" />
        <Card
          titulo="SALDO ENERGÉTICO"
          valor={`${saldo >= 0 ? '+' : ''}${saldo.toFixed(2)} kW`}
          sub={saldo >= 0 ? 'Exportando energia' : 'Importando energia'}
          cor={saldo >= 0 ? '#22C55E' : '#F87171'}
        />
      </div>

      <div style={{ background: '#181C27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '1.5rem' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#F8FAFC', marginBottom: '1rem' }}>Usinas</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Th>Usina</Th>
                <Th>Localização</Th>
                <Th>Status</Th>
                <Th>Geração</Th>
                <Th>Consumo</Th>
                <Th>Última leitura</Th>
              </tr>
            </thead>
            <tbody>
              {resumo.usinas.map((usina) => (
                <tr
                  key={usina.cliente_id}
                  onClick={() => navigate(`/dashboard?cliente=${usina.cliente_id}`)}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                >
                  <Td>{usina.nome}</Td>
                  <Td>{usina.cidade}, {usina.estado}</Td>
                  <Td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: `${statusCor[usina.status]}22`, color: statusCor[usina.status],
                      padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusCor[usina.status] }} />
                      {statusLabel[usina.status] ?? usina.status}
                    </span>
                  </Td>
                  <Td>{usina.geracao_kw.toFixed(2)} kW</Td>
                  <Td>{usina.consumo_kw.toFixed(2)} kW</Td>
                  <Td>{usina.ultima_leitura ? new Date(usina.ultima_leitura).toLocaleString('pt-BR') : '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Card: React.FC<{ titulo: string; valor: string; sub: string; cor: string }> = ({ titulo, valor, sub, cor }) => (
  <div style={{ background: '#181C27', border: `1px solid ${cor}55`, borderRadius: 12, padding: '1.25rem' }}>
    <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8, letterSpacing: 0.5 }}>{titulo}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color: cor }}>{valor}</div>
    <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{sub}</div>
  </div>
);

const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: '#94A3B8', fontWeight: 600, letterSpacing: 0.5 }}>{children}</th>
);

const Td: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <td style={{ padding: '12px', fontSize: 13, color: '#F8FAFC' }}>{children}</td>
);

export default VisaoGeral;