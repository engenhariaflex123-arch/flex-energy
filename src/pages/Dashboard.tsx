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

import InversorStatus from '../components/InversorStatus';
import IrradianciaCard from '../components/IrradianciaCard';


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
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
           <InversorStatus />
          <IrradianciaCard />
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;