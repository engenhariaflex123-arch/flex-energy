import os

files = {}

files['src/App.tsx'] = '''
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
'''.strip()

files['src/App.css'] = '''
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Barlow+Condensed:wght@600;700&display=swap');
:root {
  --laranja: #F97316; --laranja-dark: #EA6000; --laranja-glow: rgba(249,115,22,0.12);
  --verde: #16A34A; --vermelho: #DC2626; --amarelo: #EAB308; --azul: #3B82F6;
  --bg: #0F1117; --bg2: #181C27; --bg3: #1E2436;
  --border: rgba(255,255,255,0.07); --text: #F8FAFC; --text2: #94A3B8; --text3: #64748B;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); }
button { cursor: pointer; font-family: 'Inter', sans-serif; }
'''.strip()

files['src/pages/Login.tsx'] = '''
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const navigate = useNavigate();
  const handleLogin = (e: React.FormEvent) => { e.preventDefault(); if (user && pass) navigate('/dashboard'); };
  return (
    <div style={{ minHeight:'100vh', background:'#0F1117', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#181C27', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'2.5rem', width:380 }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:36, fontWeight:700, color:'#F97316' }}>FLEX<span style={{color:'#F8FAFC', fontWeight:300}}> Energy</span></div>
          <div style={{ fontSize:12, color:'#64748B', marginTop:4 }}>Plataforma de Monitoramento Solar</div>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom:'1rem' }}>
            <label style={{ fontSize:12, color:'#94A3B8', display:'block', marginBottom:6 }}>Usuário</label>
            <input value={user} onChange={e=>setUser(e.target.value)} placeholder="seu@email.com" type="email" required
              style={{ width:'100%', background:'#1E2436', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 14px', color:'#F8FAFC', fontSize:14, outline:'none' }} />
          </div>
          <div style={{ marginBottom:'1.5rem' }}>
            <label style={{ fontSize:12, color:'#94A3B8', display:'block', marginBottom:6 }}>Senha</label>
            <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" type="password" required
              style={{ width:'100%', background:'#1E2436', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 14px', color:'#F8FAFC', fontSize:14, outline:'none' }} />
          </div>
          <button type="submit" style={{ width:'100%', background:'#F97316', color:'#fff', border:'none', borderRadius:8, padding:'12px', fontSize:14, fontWeight:600 }}>Entrar</button>
        </form>
        <p style={{ textAlign:'center', fontSize:11, color:'#64748B', marginTop:'1.5rem' }}>Flex Energy © 2026</p>
      </div>
    </div>
  );
};
export default Login;
'''.strip()

files['src/pages/Dashboard.tsx'] = '''
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import StatusCards from '../components/StatusCards';
import MainChart from '../components/MainChart';
import BalanceCard from '../components/BalanceCard';
import ClimateCard from '../components/ClimateCard';
import MonthChart from '../components/MonthChart';
import YearChart from '../components/YearChart';
import PRChart from '../components/PRChart';
import DevicesTable from '../components/DevicesTable';

const Dashboard: React.FC = () => {
  const [period, setPeriod] = useState<'dia'|'mes'|'ano'>('dia');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar open={sidebarOpen} />
      <div style={{ flex:1, marginLeft: sidebarOpen ? 220 : 0, transition:'margin 0.3s', minWidth:0 }}>
        <Topbar period={period} setPeriod={setPeriod} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div style={{ padding:'1.25rem 1.5rem' }}>
          <div style={{ background:'rgba(234,179,8,0.1)', border:'1px solid rgba(234,179,8,0.3)', borderRadius:8, padding:'0.6rem 1rem', marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:10, fontSize:12, color:'#EAB308' }}>
            ⚠️ <strong>Inversor 2</strong> — Alarme ativo: sobretensão CA detectada às 14h22
          </div>
          <StatusCards />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:12, marginBottom:12 }}>
            <MainChart />
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <BalanceCard />
              <ClimateCard />
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
            <MonthChart />
            <YearChart />
            <PRChart />
          </div>
          <DevicesTable />
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
'''.strip()

files['src/components/Sidebar.tsx'] = '''
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
'''.strip()

files['src/components/Topbar.tsx'] = '''
import React from 'react';
interface Props { period: 'dia'|'mes'|'ano'; setPeriod: (p: 'dia'|'mes'|'ano') => void; onToggleSidebar: () => void; }
const Topbar: React.FC<Props> = ({ period, setPeriod, onToggleSidebar }) => {
  const now = new Date().toLocaleString('pt-BR', { dateStyle:'long', timeStyle:'short' });
  return (
    <div style={{ background:'#181C27', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'0.875rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={onToggleSidebar} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, padding:'4px 8px', color:'#94A3B8', fontSize:16 }}>☰</button>
        <div>
          <div style={{ fontSize:15, fontWeight:600 }}>Dashboard — Visão Geral</div>
          <div style={{ fontSize:11, color:'#64748B', marginTop:1 }}>Atualizado agora · {now}</div>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {(['dia','mes','ano'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{ padding:'5px 14px', borderRadius:6, fontSize:12, border:'1px solid', borderColor: period===p ? '#F97316' : 'rgba(255,255,255,0.1)', background: period===p ? '#F97316' : 'transparent', color: period===p ? '#fff' : '#94A3B8', fontWeight: period===p ? 600 : 400 }}>
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
'''.strip()

files['src/components/StatusCards.tsx'] = '''
import React, { useState, useEffect } from 'react';
const card = (icon:string, val:string, unit:string, label:string, sub:string, color:string) => {
  const colors: Record<string,string> = { orange:'#F97316', green:'#16A34A', red:'#DC2626', yellow:'#EAB308', blue:'#3B82F6' };
  const c = colors[color] || '#F97316';
  return (
    <div style={{ background:'#181C27', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'1rem', position:'relative', overflow:'hidden', borderTop:`3px solid ${c}` }}>
      <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
      <div style={{ fontSize:24, fontWeight:700, lineHeight:1, fontFamily:"'Barlow Condensed',sans-serif" }}>{val} <span style={{ fontSize:13, fontWeight:400, color:'#94A3B8' }}>{unit}</span></div>
      <div style={{ fontSize:10, color:'#64748B', marginTop:3, textTransform:'uppercase', letterSpacing:'0.04em' }}>{label}</div>
      <div style={{ fontSize:11, color:'#94A3B8', marginTop:2 }}>{sub}</div>
    </div>
  );
};
const StatusCards: React.FC = () => {
  const [pot, setPot] = useState(34.8);
  useEffect(() => { const t = setInterval(() => setPot(+(33+Math.random()*4).toFixed(1)), 3000); return () => clearInterval(t); }, []);
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:'1.25rem' }}>
      {card('⚡', pot.toFixed(1).replace('.',','), 'kW', 'Potência Ativa', 'Instantânea', 'orange')}
      {card('☀️', '28,2', 'kW', 'Geração Atual', '3 inversores', 'green')}
      {card('🔌', '6,6', 'kW', 'Consumo Atual', '4 ramais', 'red')}
      {card('⚠️', '1', '', 'Alarmes Ativos', 'Inv. 2 — tensão', 'yellow')}
      {card('📵', '1', '', 'Equipamentos Off', 'Medidor ramal 3', 'red')}
      {card('🌡️', '847', 'W/m²', 'Irradiância', 'Agora', 'blue')}
    </div>
  );
};
export default StatusCards;
'''.strip()

files['src/components/MainChart.tsx'] = '''
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
const hours = Array.from({length:24},(_,i)=>String(i).padStart(2,'0')+'h');
const geracao = [0,0,0,0,0,0.2,1.2,5.4,12.1,18.4,22.8,26.2,28.1,27.4,25.8,22.1,17.4,10.2,3.8,0.4,0,0,0,0];
const consumo  = [4.2,3.8,3.5,3.4,3.6,3.9,5.1,6.8,7.4,7.8,8.2,8.8,9.1,8.6,7.8,7.4,8.1,9.2,10.1,9.4,8.2,7.1,6.0,5.1];
const data = hours.map((h,i) => ({ hora:h, Geração:geracao[i], Consumo:consumo[i] }));
const tt = { contentStyle:{ background:'#1E2436', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:12 } };
const MainChart: React.FC = () => (
  <div style={{ background:'#181C27', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'1.25rem' }}>
    <div style={{ marginBottom:'1rem' }}>
      <div style={{ fontSize:13, fontWeight:600 }}>Geração × Consumo — Hoje</div>
      <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>Gráfico de área · valores em kW por hora</div>
    </div>
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top:5, right:10, left:0, bottom:0 }}>
        <defs>
          <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16A34A" stopOpacity={0.3}/><stop offset="95%" stopColor="#16A34A" stopOpacity={0.02}/></linearGradient>
          <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#DC2626" stopOpacity={0.3}/><stop offset="95%" stopColor="#DC2626" stopOpacity={0.02}/></linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="hora" tick={{ fill:'#64748B', fontSize:10 }} tickLine={false} interval={3} />
        <YAxis tick={{ fill:'#64748B', fontSize:10 }} tickLine={false} axisLine={false} tickFormatter={v=>v+'kW'} />
        <Tooltip {...tt} />
        <Legend wrapperStyle={{ fontSize:12, color:'#94A3B8' }} />
        <Area type="monotone" dataKey="Geração" stroke="#16A34A" strokeWidth={2} fill="url(#gG)" />
        <Area type="monotone" dataKey="Consumo" stroke="#DC2626" strokeWidth={2} fill="url(#gC)" />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);
export default MainChart;
'''.strip()

files['src/components/BalanceCard.tsx'] = '''
import React from 'react';
const BalanceCard: React.FC = () => (
  <div style={{ background:'#181C27', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'1.25rem' }}>
    <div style={{ fontSize:10, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Saldo Energético — Hoje</div>
    <div style={{ fontSize:32, fontWeight:700, color:'#EAB308', fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>+142,6 <span style={{ fontSize:14, fontWeight:400 }}>kWh</span></div>
    <div style={{ fontSize:11, color:'#64748B', marginTop:4, marginBottom:12 }}>✅ Geração maior que consumo</div>
    <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#64748B', marginBottom:4 }}><span>🔌 58,4 kWh</span><span>☀️ 201 kWh</span></div>
    <div style={{ height:6, background:'#1E2436', borderRadius:3, overflow:'hidden', marginBottom:16 }}>
      <div style={{ height:'100%', width:'65%', background:'#16A34A', borderRadius:3 }}></div>
    </div>
    <div style={{ display:'flex', gap:12 }}>
      {[{val:'201',label:'kWh Gerado',c:'#16A34A'},{val:'58,4',label:'kWh Consumido',c:'#DC2626'},{val:'R$ 89',label:'Economia',c:'#F97316'}].map((s,i)=>(
        <div key={i} style={{ flex:1, background:'#1E2436', borderRadius:8, padding:'8px', textAlign:'center' }}>
          <div style={{ fontSize:16, fontWeight:700, color:s.c }}>{s.val}</div>
          <div style={{ fontSize:10, color:'#64748B' }}>{s.label}</div>
        </div>
      ))}
    </div>
  </div>
);
export default BalanceCard;
'''.strip()

files['src/components/ClimateCard.tsx'] = '''
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
'''.strip()

files['src/components/MonthChart.tsx'] = '''
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
'''.strip()

files['src/components/YearChart.tsx'] = '''
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
const data = [{mes:'Jan',Geração:5820,Consumo:3100},{mes:'Fev',Geração:6210,Consumo:2980},{mes:'Mar',Geração:6890,Consumo:3200},{mes:'Abr',Geração:7100,Consumo:3400},{mes:'Mai',Geração:6540,Consumo:3180},{mes:'Jun',Geração:3842,Consumo:1820}];
const tt = { contentStyle:{ background:'#1E2436', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:11 } };
const YearChart: React.FC = () => (
  <div style={{ background:'#181C27', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'1.25rem' }}>
    <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Energia do Ano</div>
    <div style={{ fontSize:24, fontWeight:700, color:'#16A34A', fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>38.420 <span style={{ fontSize:13, fontWeight:400, color:'#64748B' }}>kWh</span></div>
    <div style={{ fontSize:11, color:'#64748B', marginBottom:10 }}>2026 · 6 meses</div>
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data} margin={{ top:0, right:5, left:-20, bottom:0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="mes" tick={{ fill:'#64748B', fontSize:9 }} tickLine={false} />
        <YAxis tick={{ fill:'#64748B', fontSize:9 }} tickLine={false} axisLine={false} />
        <Tooltip {...tt} />
        <Bar dataKey="Geração" fill="#16A34A" radius={[2,2,0,0]} opacity={0.85} />
        <Bar dataKey="Consumo" fill="#DC2626" radius={[2,2,0,0]} opacity={0.65} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
export default YearChart;
'''.strip()

files['src/components/PRChart.tsx'] = '''
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
'''.strip()

files['src/components/DevicesTable.tsx'] = '''
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
'''.strip()

# Write all files
for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'✅ {path}')

print('\n🎉 Todos os arquivos criados com sucesso!')