import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
const data = [{mes:'Jan',PR:81},{mes:'Fev',PR:79},{mes:'Mar',PR:82},{mes:'Abr',PR:80},{mes:'Mai',PR:77},{mes:'Jun',PR:78}];
const tt = { contentStyle:{ background:'#1E2436', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:11 } };
const PRChart: React.FC = () => (
  <div style={{ background:'#181C27', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'1.25rem' }}>
    <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Performance (PR)</div>
    <div style={{ fontSize:24, fontWeight:700, color:'#F97316', fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>78,4 <span style={{ fontSize:13, fontWeight:400, color:'#64748B' }}>%</span></div>
    <div style={{ fontSize:11, color:'#64748B', marginBottom:10 }}>Junho 2026</div>
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={data} margin={{ top:0, right:5, left:-20, bottom:0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="mes" tick={{ fill:'#64748B', fontSize:9 }} tickLine={false} />
        <YAxis tick={{ fill:'#64748B', fontSize:9 }} tickLine={false} axisLine={false} domain={[60,100]} tickFormatter={v=>v+'%'} />
        <Tooltip {...tt} formatter={(v:any) => [v+'%','PR']} />
        <ReferenceLine y={75} stroke="rgba(249,115,22,0.3)" strokeDasharray="4 4" />
        <Line type="monotone" dataKey="PR" stroke="#F97316" strokeWidth={2} dot={{ fill:'#F97316', r:3 }} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);
export default PRChart;