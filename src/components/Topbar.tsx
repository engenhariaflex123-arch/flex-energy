import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useIsMobile } from '../hooks/useIsMobile';

interface Props { period: 'dia'|'mes'|'ano'; setPeriod: (p: 'dia'|'mes'|'ano') => void; onToggleSidebar: () => void; }
const Topbar: React.FC<Props> = ({ period, setPeriod, onToggleSidebar }) => {
  const now = new Date().toLocaleString('pt-BR', { dateStyle:'long', timeStyle:'short' });
  const { cores } = useTheme();
  const isMobile = useIsMobile();
  return (
    <div className="app-topbar" style={{ background:cores.bg2, borderBottom:`1px solid ${cores.border}`, padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10, position:'sticky', top:0, zIndex:50 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
        <button onClick={onToggleSidebar} style={{ background:'transparent', border:`1px solid ${cores.border}`, borderRadius:6, padding:'4px 8px', color:cores.text2, fontSize:18, flexShrink:0 }}>☰</button>
        <div style={{ minWidth:0 }}>
          <div className="app-topbar-title" style={{ fontSize: isMobile ? 15 : 17, fontWeight:600, color:cores.text, whiteSpace: isMobile ? 'nowrap' : 'normal', overflow: isMobile ? 'hidden' : 'visible', textOverflow: isMobile ? 'ellipsis' : 'clip' }}>Dashboard — Visão Geral</div>
          {/* No celular a data/hora some — é redundante com o relógio do próprio aparelho e só ocupa espaço que falta */}
          {!isMobile && <div style={{ fontSize:13, color:cores.text3, marginTop:1 }}>Atualizado agora · {now}</div>}
        </div>
      </div>
      <div className="app-topbar-actions" style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
        {(['dia','mes','ano'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{ padding: isMobile ? '5px 10px' : '5px 14px', borderRadius:6, fontSize:14, border:'1px solid', borderColor: period===p ? cores.laranja : cores.border, background: period===p ? cores.laranja : 'transparent', color: period===p ? '#fff' : cores.text2, fontWeight: period===p ? 600 : 400 }}>
            {p.charAt(0).toUpperCase()+p.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};
export default Topbar;