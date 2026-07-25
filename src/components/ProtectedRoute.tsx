import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

// Só renderiza a página protegida se existir um token salvo.
// Se não existir, redireciona pro login ANTES de qualquer chamada à API
// (evita disparar requisições que vão dar 401 e travar a tela em "carregando").
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem('access_token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;