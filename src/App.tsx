import React, { useEffect } from 'react';
// HashRouter (em vez de BrowserRouter) porque dentro do app nativo (Capacitor)
// não existe um servidor real respondendo pelas rotas — o HashRouter resolve
// tudo no lado do cliente (#/dashboard), o que funciona em qualquer ambiente.
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Analise from './pages/Analise';
import Login from './pages/Login';
import VisaoGeral from './pages/VisaoGeral';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import { inicializarPush } from './services/push';
import { confirmarAtualizacao } from './services/liveUpdate';
import './App.css';

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
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;