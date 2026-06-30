import React from 'react';
const devices = [
  { nome:'☀️ Inversor 1 — 10kW', status:'online', potCA:'9,8', tensCC:'420', corr:'23,4', freq:'60,0', temp:'42', energia:'68,2 kWh' },
  { nome:'☀️ Inversor 2 — 10kW', status:'alarme', potCA:'8,1', tensCC:'418', corr:'19,4', freq:'60,1', temp:'48', energia:'61,4 kWh' },
  { nome:'☀️ Inversor 3 — 15kW', status:'online', potCA:'14,2', tensCC:'425', corr:'33,4', freq:'60,0', temp:'45', energia:'71,4 kWh' },
  { nome:'🔌 Medidor Geral',      status:'online', potCA:'6,6',  tensCC:'—',   corr:'30,0', freq:'60,0', temp:'—',  energia:'58,4 kWh' },
  { nome:'🔌 Ramal — Produção',   status:'online', potCA:'3,2',  tensCC:'—',   corr:'14,6', freq:'60,0', temp:'—',  energia:'28,1 kWh' },
  { nome:'🔌 Ramal — Adm.',       status:'offline',potCA:'—',    tensCC:'—',   corr:'—',    freq:'—',    temp:'—',  energia:'—' },
];
const pillColor: Record<string,{bg:string,color:string,label:string}> = {
  online:  { bg:'rgba(22,163,74,0.15)',  color:'#16A34A', label:'● Online' },
  alarme:  { bg:'rgba(234,179,8,0.15)',  color:'#EAB308', label:'⚠ Alarme' },
  offline: { bg:'rgba(100,116,139,0.15)',color:'#64748B', label:'○ Offline' },
  fault:   { bg:'rgba(220,38,38,0.15)',  color:'#DC2626', label:'✕ Falha' },
};
const valColor: Record<string,string> = { '☀️ Inversor 1 — 10kW':'#16A34A','☀️ Inversor 2 — 10kW':'#EAB308','☀️ Inversor 3 — 15kW':'#16A34A','🔌 Medidor Geral':'#DC2626','🔌 Ramal — Produção':'#DC2626','🔌 Ramal — Adm.':'#64748B' };
const DevicesTable: React.FC = () => (
  <div style={{ background:'#181C27', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'1.25rem', marginBottom:'1.25rem' }}>
    <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Inversores & Medidores — Status em Tempo Real</div>
    <div style={{ fontSize:11, color:'#64748B', marginBottom:'0.875rem' }}>Atualizado há 30 segundos</div>
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
        <thead>
          <tr>{['Dispositivo','Status','Pot. CA (kW)','Tensão CC (V)','Corrente (A)','Freq. (Hz)','Temp. (°C)','Energia Hoje'].map(h=>(
            <th key={h} style={{ fontSize:10, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.05em', textAlign:'left', padding:'6px 10px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {devices.map((d,i)=>{
            const p = pillColor[d.status]; const c = valColor[d.nome];
            return (
              <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding:'9px 10px' }}>{d.nome}</td>
                <td style={{ padding:'9px 10px' }}><span style={{ background:p.bg, color:p.color, padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:600 }}>{p.label}</span></td>
                <td style={{ padding:'9px 10px', color:c, fontWeight:600 }}>{d.potCA}</td>
                <td style={{ padding:'9px 10px', color:'#94A3B8' }}>{d.tensCC}</td>
                <td style={{ padding:'9px 10px', color:'#94A3B8' }}>{d.corr}</td>
                <td style={{ padding:'9px 10px', color:'#94A3B8' }}>{d.freq}</td>
                <td style={{ padding:'9px 10px', color:'#94A3B8' }}>{d.temp}</td>
                <td style={{ padding:'9px 10px', color:c, fontWeight:600 }}>{d.energia}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);
export default DevicesTable;