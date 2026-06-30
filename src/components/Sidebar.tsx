import React, { useState } from 'react';

interface Props { open: boolean; }
const Sidebar: React.FC<Props> = ({ open }) => {
  const [consumoOpen, setConsumoOpen] = useState(false);
  const [geracaoOpen, setGeracaoOpen] = useState(false);
  if (!open) return null;
  const navItem = (icon: string, label: string, active = false, onClick?: () => void, arrow?: string) => (
    <div onClick={onClick} style={{ display:'flex', alignItems:'center', gap:10, padding:'0.6rem 1.25rem', fontSize:13, color: active ? '#F97316' : '#94A3B8', cursor:'pointer', borderLeft: active ? '3px solid #F97316' : '3px solid transparent', background: active ? 'rgba(249,115,22,0.08)' : 'transparent' }}>
      <span>{icon}</span><span style={{flex:1}}>{label}</span>{arrow && <span style={{fontSize:10}}>{arrow}</span>}
    </div>
  );
  return (
    <div style={{ position:'fixed', left:0, top:0, bottom:0, width:220, background:'#181C27', borderRight:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', zIndex:100, overflowY:'auto' }}>
      <div style={{ padding:'1.25rem', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, fontWeight:700, color:'#F97316', lineHeight:1 }}>FLEX</div>
        <div style={{ fontSize:13, color:'#F8FAFC', fontWeight:300, letterSpacing:'0.1em' }}>Energy</div>
        <div style={{ fontSize:10, color:'#64748B', marginTop:2 }}>Monitoramento Solar</div>
      </div>
      <div style={{ padding:'0.875rem 1.25rem', borderBottom:'1px solid rgba(255,255,255,0.07)', background:'rgba(249,115,22,0.08)' }}>
        <div style={{ fontSize:10, color:'#F97316', textTransform:'uppercase', letterSpacing:'0.08em' }}>Cliente</div>
        <div style={{ fontSize:13, fontWeight:600, marginTop:2 }}>GTJ-Flex DE</div>
        <div style={{ fontSize:11, color:'#64748B', marginTop:1 }}>📍 Divinópolis, MG</div>
      </div>
      <nav style={{ flex:1, paddingTop:'0.5rem' }}>
        <div style={{ padding:'0.5rem 1.25rem 0.25rem', fontSize:10, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.08em' }}>Visão Geral</div>
        {navItem('⚡','Dashboard', true)}
        {navItem('📊','Relatórios')}
        {navItem('🔔','Alarmes')}
        <div style={{ padding:'0.5rem 1.25rem 0.25rem', fontSize:10, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.08em' }}>Consumo</div>
        {navItem('🔌','Medidores', false, () => setConsumoOpen(!consumoOpen), consumoOpen ? '▴' : '▾')}
        {consumoOpen && ['Geral (Principal)','Ramal — Produção','Ramal — Administrativo','Ramal — Ar Condicionado'].map((r,i) => (
          <div key={i} style={{ padding:'0.4rem 1.25rem 0.4rem 3rem', fontSize:12, color: i===0 ? '#F97316' : '#64748B', cursor:'pointer' }}>{i===0?'●':'○'} {r}</div>
        ))}
        <div style={{ padding:'0.5rem 1.25rem 0.25rem', fontSize:10, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.08em' }}>Geração</div>
        {navItem('☀️','Inversores', false, () => setGeracaoOpen(!geracaoOpen), geracaoOpen ? '▴' : '▾')}
        {geracaoOpen && ['Geral (Usina)','Inversor 1 — 10kW','Inversor 2 — 10kW','Inversor 3 — 15kW'].map((r,i) => (
          <div key={i} style={{ padding:'0.4rem 1.25rem 0.4rem 3rem', fontSize:12, color: i===0 ? '#F97316' : '#64748B', cursor:'pointer' }}>{i===0?'●':'○'} {r}</div>
        ))}
        <div style={{ padding:'0.5rem 1.25rem 0.25rem', fontSize:10, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.08em' }}>Análise</div>
        {navItem('📈','Performance (PR)')}
        {navItem('☁️','Irradiância')}
        {navItem('📄','Exportar PDF')}
      </nav>
      <div style={{ padding:'1rem 1.25rem', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:'50%', background:'#F97316', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff' }}>G</div>
        <div>
          <div style={{ fontSize:12, fontWeight:500 }}>GTJ-Flex DE</div>
          <div style={{ fontSize:10, color:'#64748B' }}>Visualizador</div>
        </div>
      </div>
    </div>
  );
};
export default Sidebar;