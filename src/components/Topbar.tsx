import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface Props { period: 'dia'|'mes'|'ano'; setPeriod: (p: 'dia'|'mes'|'ano') => void; onToggleSidebar: () => void; }
const Topbar: React.FC<Props> = ({ period, setPeriod, onToggleSidebar }) => {
  const now = new Date().toLocaleString('pt-BR', { dateStyle:'long', timeStyle:'short' });
  const { cores } = useTheme();
  return (
    <div className="app-topbar" style={{ background:cores.bg2, borderBottom:`1px solid ${cores.border}`, padding:'0.875rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={onToggleSidebar} style={{ background:'transparent', border:`1px solid ${cores.border}`, borderRadius:6, padding:'4px 8px', color:cores.text2, fontSize:16 }}>☰</button>
        <div>
          <div className="app-topbar-title" style={{ fontSize:15, fontWeight:600, color:cores.text }}>Dashboard — Visão Geral</div>
          <div style={{ fontSize:11, color:cores.text3, marginTop:1 }}>Atualizado agora · {now}</div>
        </div>
      </div>
      <div className="app-topbar-actions" style={{ display:'flex', alignItems:'center', gap:8 }}>
        {(['dia','mes','ano'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{ padding:'5px 14px', borderRadius:6, fontSize:12, border:'1px solid', borderColor: period===p ? cores.laranja : cores.border, background: period===p ? cores.laranja : 'transparent', color: period===p ? '#fff' : cores.text2, fontWeight: period===p ? 600 : 400 }}>
            {p.charAt(0).toUpperCase()+p.slice(1)}
          </button>
        ))}
        <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(220,38,38,0.1)', color:'#DC2626', padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:600 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#DC2626', display:'inline-block' }}></span> 1 offline
        </div>
      </div>
    </div>
  );
};
export default Topbar;