import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ClimateCard: React.FC = () => {
  const { cores } = useTheme();
  return (
    <div style={{ background:cores.bg2, border:`1px solid ${cores.border}`, borderRadius:12, padding:'1.25rem' }}>
      <div style={{ fontSize:10, color:cores.text3, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Clima — Divinópolis, MG</div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ fontSize:32, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", color:cores.text }}>28°C</div>
        <div style={{ fontSize:28 }}>⛅</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {[{val:'847 W/m²',label:'Irradiância'},{val:'62%',label:'Umidade'},{val:'14 km/h',label:'Vento'},{val:'0 mm',label:'Chuva'}].map((item,i)=>(
          <div key={i} style={{ background:cores.bg3, borderRadius:6, padding:'6px 10px' }}>
            <div style={{ fontSize:13, fontWeight:600, color:cores.text }}>{item.val}</div>
            <div style={{ fontSize:10, color:cores.text3 }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ClimateCard;