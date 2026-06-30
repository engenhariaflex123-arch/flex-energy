import React from 'react';
const ClimateCard: React.FC = () => (
  <div style={{ background:'#181C27', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'1.25rem' }}>
    <div style={{ fontSize:10, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Clima — Divinópolis, MG</div>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
      <div style={{ fontSize:32, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif" }}>28°C</div>
      <div style={{ fontSize:28 }}>⛅</div>
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
      {[{val:'847 W/m²',label:'Irradiância'},{val:'62%',label:'Umidade'},{val:'14 km/h',label:'Vento'},{val:'0 mm',label:'Chuva'}].map((item,i)=>(
        <div key={i} style={{ background:'#1E2436', borderRadius:6, padding:'6px 10px' }}>
          <div style={{ fontSize:13, fontWeight:600 }}>{item.val}</div>
          <div style={{ fontSize:10, color:'#64748B' }}>{item.label}</div>
        </div>
      ))}
    </div>
  </div>
);
export default ClimateCard;