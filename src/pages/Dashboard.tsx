import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import StatusCards from '../components/StatusCards';
import OperacaoCards from '../components/OperacaoCards';
import MainChart from '../components/MainChart';
import BalanceCard from '../components/BalanceCard';
import ClimateCard from '../components/ClimateCard';
import PieChart from '../components/PieChart';

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
        <div key={clienteAtivo} className="dashboard-content" style={{ padding:'1.25rem 1.5rem' }}>
          <StatusCards clienteAtivo={clienteAtivo} />
          <OperacaoCards clienteAtivo={clienteAtivo} />
          <div className="dashboard-main-grid" style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:12, marginBottom:12 }}>
            <MainChart clienteAtivo={clienteAtivo} period={period} />
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <BalanceCard clienteAtivo={clienteAtivo} />
              <PieChart clienteAtivo={clienteAtivo} period={period} />
              <ClimateCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;