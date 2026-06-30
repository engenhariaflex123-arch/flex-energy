import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
const data = Array.from({length:28},(_,i)=>({ dia:String(i+1), Geração:Math.floor(120+Math.random()*80), Consumo:Math.floor(60+Math.random()*30) }));
const tt = { contentStyle:{ background:'#1E2436', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:11 } };
const MonthChart: React.FC = () => (
  <div style={{ background:'#181C27', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'1.25rem' }}>
    <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Energia do Mês</div>
    <div style={{ fontSize:24, fontWeight:700, color:'#16A34A', fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>3.842 <span style={{ fontSize:13, fontWeight:400, color:'#64748B' }}>kWh</span></div>
    <div style={{ fontSize:11, color:'#64748B', marginBottom:10 }}>Junho 2026 · 28 dias</div>
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data} margin={{ top:0, right:5, left:-20, bottom:0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="dia" tick={{ fill:'#64748B', fontSize:9 }} tickLine={false} interval={4} />
        <YAxis tick={{ fill:'#64748B', fontSize:9 }} tickLine={false} axisLine={false} />
        <Tooltip {...tt} />
        <Bar dataKey="Geração" fill="#16A34A" radius={[2,2,0,0]} opacity={0.85} />
        <Bar dataKey="Consumo" fill="#DC2626" radius={[2,2,0,0]} opacity={0.65} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
export default MonthChart;