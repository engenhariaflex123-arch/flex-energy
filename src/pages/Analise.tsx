import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PRChart from '../components/PRChart';
import DevicesTable from '../components/DevicesTable';
import InversorStatus from '../components/InversorStatus';
import IrradianciaCard from '../components/IrradianciaCard';
import MedidorCard from '../components/MedidorCard';
import StringsChart from '../components/StringsChart';
import InversorChart from '../components/InversorChart';
import { useTheme } from '../contexts/ThemeContext';

// Página "Análise" — reúne tudo que antes ficava embaixo, no Dashboard
// principal (Performance, Dispositivos, Status do Inversor, Irradiância,
// Medidor, Strings, Inversor), agora numa página separada, dedicada.
// TODO (próximo passo, quando tivermos o código de MedidorCard/
// StringsChart/InversorChart em mãos): adicionar filtro de verdade pra
// escolher ramal/inversor específico, em vez de mostrar tudo junto.
const Analise: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchParams] = useSearchParams();
  const { cores } = useTheme();
  const clienteAtivo = searchParams.get('cliente') || localStorage.getItem('cliente_id') || 'default';

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar open={sidebarOpen} clienteAtivo={clienteAtivo} />
      <div style={{ flex:1, marginLeft: sidebarOpen ? 220 : 0, transition:'margin 0.3s', minWidth:0 }}>
        <div className="app-topbar" style={{ background:cores.bg2, borderBottom:`1px solid ${cores.border}`, padding:'0.875rem 1.5rem', display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:50 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background:'transparent', border:`1px solid ${cores.border}`, borderRadius:6, padding:'4px 8px', color:cores.text2, fontSize:16 }}>☰</button>
          <div>
            <div className="app-topbar-title" style={{ fontSize:15, fontWeight:600, color:cores.text }}>Análise Detalhada</div>
            <div style={{ fontSize:11, color:cores.text3, marginTop:1 }}>Strings, ramais e inversores individuais</div>
          </div>
        </div>
        <div key={clienteAtivo} className="dashboard-content" style={{ padding:'1.25rem 1.5rem' }}>
          <div className="dashboard-fixed-block" style={{ display:'grid', gridTemplateColumns:'320px', gap:12, marginBottom:12 }}>
            <PRChart />
          </div>
          <DevicesTable />
          <div className="grid-two-col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
            <InversorStatus clienteAtivo={clienteAtivo} />
            <IrradianciaCard clienteAtivo={clienteAtivo} />
          </div>
          <div style={{ marginTop: 24 }}>
            <div style={{ marginBottom: 12 }}>
              <MedidorCard clienteAtivo={clienteAtivo} />
            </div>
            <div className="grid-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <StringsChart clienteAtivo={clienteAtivo} />
              <InversorChart clienteAtivo={clienteAtivo} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Analise;