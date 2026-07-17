import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import StatusCards from '../components/StatusCards';
import MainChart from '../components/MainChart';
import BalanceCard from '../components/BalanceCard';
import ClimateCard from '../components/ClimateCard';
import PieChart from '../components/PieChart';
import PRChart from '../components/PRChart';
import DevicesTable from '../components/DevicesTable';
import MedidorCard from '../components/MedidorCard';
import StringsChart from '../components/StringsChart';
import InversorChart from '../components/InversorChart';

import InversorStatus from '../components/InversorStatus';
import IrradianciaCard from '../components/IrradianciaCard';


const Dashboard: React.FC = () => {
  const [period, setPeriod] = useState<'dia'|'mes'|'ano'>('dia');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const clienteParam = searchParams.get('cliente');
    if (clienteParam) {
      localStorage.setItem('cliente_ativo', clienteParam);
    } else if (!localStorage.getItem('cliente_ativo')) {
      localStorage.setItem('cliente_ativo', localStorage.getItem('cliente_id') || 'cliente_001');
    }
  }, [searchParams]);
  const clienteAtivo = searchParams.get('cliente') || localStorage.getItem('cliente_id') || 'default';

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar open={sidebarOpen} clienteAtivo={clienteAtivo} />
      <div style={{ flex:1, marginLeft: sidebarOpen ? 220 : 0, transition:'margin 0.3s', minWidth:0 }}>
        <Topbar period={period} setPeriod={setPeriod} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div key={clienteAtivo} style={{ padding:'1.25rem 1.5rem' }}>
          <div style={{ background:'rgba(234,179,8,0.1)', border:'1px solid rgba(234,179,8,0.3)', borderRadius:8, padding:'0.6rem 1rem', marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:10, fontSize:12, color:'#EAB308' }}>
            ⚠️ <strong>Inversor 2</strong> — Alarme ativo: sobretensão CA detectada às 14h22
          </div>
          <StatusCards clienteAtivo={clienteAtivo} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:12, marginBottom:12 }}>
            <MainChart clienteAtivo={clienteAtivo} period={period} />
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <BalanceCard clienteAtivo={clienteAtivo} />
              <PieChart clienteAtivo={clienteAtivo} period={period} />
              <ClimateCard />
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'320px', gap:12, marginBottom:12 }}>
            <PRChart />
          </div>
          <DevicesTable />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
           <InversorStatus clienteAtivo={clienteAtivo} />
          <IrradianciaCard clienteAtivo={clienteAtivo} />
          <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 8 }}>
    📊 ANÁLISE DETALHADA
          </div>
          <div style={{ marginBottom: 12 }}>
          <MedidorCard clienteAtivo={clienteAtivo} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <StringsChart clienteAtivo={clienteAtivo} />
          <InversorChart clienteAtivo={clienteAtivo} />
          </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;