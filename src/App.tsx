import React, { Suspense, lazy, useEffect } from 'react';
// HashRouter (em vez de BrowserRouter) porque dentro do app nativo (Capacitor)
// não existe um servidor real respondendo pelas rotas — o HashRouter resolve
// tudo no lado do cliente (#/dashboard), o que funciona em qualquer ambiente.
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import { inicializarPush } from './services/push';
import { confirmarAtualizacao } from './services/liveUpdate';
import './App.css';

// Páginas carregadas sob demanda (code splitting): o navegador só baixa o
// código da página que está sendo aberta, em vez do app inteiro de uma vez
// — a Análise, por exemplo, carrega a biblioteca de PDF (jspdf/svg2pdf),
// que é pesada e antes vinha junto até pra quem só abria o Dashboard.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analise = lazy(() => import('./pages/Analise'));
const VisaoGeral = lazy(() => import('./pages/VisaoGeral'));

const Carregando = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#F97316', fontSize: 14 }}>
    ⟳ Carregando...
  </div>
);

function App() {
  useEffect(() => {
    // Só tenta registrar push notification quando rodando dentro do app
    // nativo (Capacitor) — no navegador comum isso é ignorado.
    inicializarPush();
    // Confirma pro capacitor-updater que essa versão carregou bem (evita
    // rollback automático). Deve ser chamado sempre, o quanto antes.
    confirmarAtualizacao();
  }, []);

  return (
    <ThemeProvider>
      <HashRouter>
        <Suspense fallback={<Carregando />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/visao-geral"
            element={
              <ProtectedRoute>
                <VisaoGeral />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analise"
            element={
              <ProtectedRoute>
                <Analise />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
        </Suspense>
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;