import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMinhasUsinas, getRelatorioDiarioPDF, getRelatorioMensalCompletoPDF } from '../services/api';
import { verificarAtualizacao } from '../services/liveUpdate';
import { useTheme } from '../contexts/ThemeContext';

interface Props { open: boolean; clienteAtivo?: string; }
const Sidebar: React.FC<Props> = ({ open, clienteAtivo }) => {
  const [consumoOpen, setConsumoOpen] = useState(false);
  const [geracaoOpen, setGeracaoOpen] = useState(false);
  const [usinaAtual, setUsinaAtual] = useState<{ nome: string; cidade?: string; estado?: string } | null>(null);
  const [verificando, setVerificando] = useState(false);
  const navigate = useNavigate();
  const grupoId = localStorage.getItem('grupo_id');
  const { mode, cores, toggleTheme } = useTheme();

  useEffect(() => {
    const buscar = async () => {
      try {
        const res = await getMinhasUsinas();
        const cid = clienteAtivo || localStorage.getItem('cliente_ativo') || localStorage.getItem('cliente_id');
        const encontrada = res.usinas?.find((u: any) => u.cliente_id === cid);
        if (encontrada) setUsinaAtual(encontrada);
      } catch (err) {
        console.log('Não foi possível carregar nome da usina ativa');
      }
    };
    buscar();
  }, [clienteAtivo]);

  if (!open) return null;

  const baixarRelatorioPDF = async () => {
    try {
      const cid = clienteAtivo || localStorage.getItem('cliente_ativo') || localStorage.getItem('cliente_id');
      if (!cid) return;
      const blob = await getRelatorioDiarioPDF(cid);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-${cid}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.log('Não foi possível baixar o relatório PDF', err);
    }
  };

  const baixarRelatorioMensal = async () => {
    try {
      const cid = clienteAtivo || localStorage.getItem('cliente_ativo') || localStorage.getItem('cliente_id');
      if (!cid) return;
      const blob = await getRelatorioMensalCompletoPDF(cid);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-mensal-${cid}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.log('Não foi possível baixar o relatório mensal', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    localStorage.removeItem('cliente_id');
    localStorage.removeItem('cliente_ativo');
    localStorage.removeItem('grupo_id');
    localStorage.removeItem('nome');
    navigate('/login');
  };

  const handleVerificarAtualizacao = async () => {
    setVerificando(true);
    try {
      const resultado = await verificarAtualizacao();
      window.alert(resultado.mensagem);
    } finally {
      setVerificando(false);
    }
  };

  const navItem = (icon: string, label: string, active = false, onClick?: () => void, arrow?: string) => (
    <div onClick={onClick} style={{ display:'flex', alignItems:'center', gap:10, padding:'0.6rem 1.25rem', fontSize:13, color: active ? cores.laranja : cores.text2, cursor:'pointer', borderLeft: active ? `3px solid ${cores.laranja}` : '3px solid transparent', background: active ? cores.laranjaGlow : 'transparent' }}>
      <span>{icon}</span><span style={{flex:1}}>{label}</span>{arrow && <span style={{fontSize:10}}>{arrow}</span>}
    </div>
  );
  return (
    <div className="app-sidebar" style={{ position:'fixed', left:0, top:0, bottom:0, width:220, background:cores.bg2, borderRight:`1px solid ${cores.border}`, display:'flex', flexDirection:'column', zIndex:100, overflowY:'auto' }}>
      <div style={{ padding:'1.25rem', borderBottom:`1px solid ${cores.border}` }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, fontWeight:700, color:cores.laranja, lineHeight:1 }}>FLEX</div>
        <div style={{ fontSize:13, color:cores.text, fontWeight:300, letterSpacing:'0.1em' }}>Assistance</div>
        <div style={{ fontSize:10, color:cores.text3, marginTop:2 }}>Monitoramento Solar</div>
      </div>
      <div style={{ padding:'0.875rem 1.25rem', borderBottom:`1px solid ${cores.border}`, background:cores.laranjaGlow }}>
        <div style={{ fontSize:10, color:cores.laranja, textTransform:'uppercase', letterSpacing:'0.08em' }}>Cliente</div>
        <div style={{ fontSize:13, fontWeight:600, marginTop:2, color:cores.text }}>{usinaAtual?.nome || 'Carregando...'}</div>
        <div style={{ fontSize:11, color:cores.text3, marginTop:1 }}>📍 {usinaAtual?.cidade || ''}{usinaAtual?.estado ? `, ${usinaAtual.estado}` : ''}</div>
      </div>
      {grupoId && (
        <div
          onClick={() => navigate('/visao-geral')}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'0.7rem 1.25rem', fontSize:12, color:cores.text2, cursor:'pointer', borderBottom:`1px solid ${cores.border}` }}
        >
          <span>←</span><span>Voltar para Visão Geral</span>
        </div>
      )}
      <nav style={{ flex:1, paddingTop:'0.5rem' }}>
        <div style={{ padding:'0.5rem 1.25rem 0.25rem', fontSize:10, color:cores.text3, textTransform:'uppercase', letterSpacing:'0.08em' }}>Visão Geral</div>
        {navItem('⚡','Dashboard', true)}
        {navItem('📊','Relatórios')}
        {navItem('🔔','Alarmes')}
        <div style={{ padding:'0.5rem 1.25rem 0.25rem', fontSize:10, color:cores.text3, textTransform:'uppercase', letterSpacing:'0.08em' }}>Consumo</div>
        {navItem('🔌','Medidores', false, () => setConsumoOpen(!consumoOpen), consumoOpen ? '▴' : '▾')}
        {consumoOpen && ['Geral (Principal)','Ramal — Produção','Ramal — Administrativo','Ramal — Ar Condicionado'].map((r,i) => (
          <div key={i} style={{ padding:'0.4rem 1.25rem 0.4rem 3rem', fontSize:12, color: i===0 ? cores.laranja : cores.text3, cursor:'pointer' }}>{i===0?'●':'○'} {r}</div>
        ))}
        <div style={{ padding:'0.5rem 1.25rem 0.25rem', fontSize:10, color:cores.text3, textTransform:'uppercase', letterSpacing:'0.08em' }}>Geração</div>
        {navItem('☀️','Inversores', false, () => setGeracaoOpen(!geracaoOpen), geracaoOpen ? '▴' : '▾')}
        {geracaoOpen && ['Geral (Usina)','Inversor 1 — 10kW','Inversor 2 — 10kW','Inversor 3 — 15kW'].map((r,i) => (
          <div key={i} style={{ padding:'0.4rem 1.25rem 0.4rem 3rem', fontSize:12, color: i===0 ? cores.laranja : cores.text3, cursor:'pointer' }}>{i===0?'●':'○'} {r}</div>
        ))}
        <div style={{ padding:'0.5rem 1.25rem 0.25rem', fontSize:10, color:cores.text3, textTransform:'uppercase', letterSpacing:'0.08em' }}>Análise</div>
        {navItem('📈','Performance (PR)')}
        {navItem('☁️','Irradiância')}
        {navItem('📄','Exportar PDF', false, baixarRelatorioPDF)}
        {navItem('🗓️','Relatório Mensal', false, baixarRelatorioMensal)}
      </nav>
      <div style={{ padding:'1rem 1.25rem', borderTop:`1px solid ${cores.border}`, display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:'50%', background:cores.laranja, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff' }}>
          {usinaAtual?.nome?.charAt(0) || 'G'}
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:500, color:cores.text }}>{usinaAtual?.nome || 'Carregando...'}</div>
          <div style={{ fontSize:10, color:cores.text3 }}>Visualizador</div>
        </div>
      </div>
      <div style={{ padding:'0.5rem 1.25rem 1rem', borderTop:`1px solid ${cores.border}`, display:'flex', flexDirection:'column', gap:4 }}>
        <div
          onClick={toggleTheme}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'0.5rem 0', fontSize:12, color:cores.text2, cursor:'pointer' }}
        >
          <span>{mode === 'dark' ? '☀️' : '🌙'}</span>
          <span>{mode === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
        </div>
        <div
          onClick={handleVerificarAtualizacao}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'0.5rem 0', fontSize:12, color: verificando ? cores.text3 : cores.text2, cursor: verificando ? 'default' : 'pointer' }}
        >
          <span>{verificando ? '⟳' : '🔄'}</span>
          <span>{verificando ? 'Verificando...' : 'Verificar atualização'}</span>
        </div>
        <div
          onClick={handleLogout}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'0.5rem 0', fontSize:12, color:'#F87171', cursor:'pointer' }}
        >
          <span>🚪</span>
          <span>Sair</span>
        </div>
      </div>
    </div>
  );
};
export default Sidebar;