import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import CadastroUsuario from './pages/CadastroUsuario';
import Dashboard from './pages/Dashboard';
import Cliente from './pages/Cliente';
import Veiculo from './pages/Veiculo';
import OSPage from './pages/OS';
import Checklist from './pages/Checklist';
import AprovacaoUsuarios from './pages/AprovacaoUsuarios';
import Header from './components/Header';
import { useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const hideHeader = ['/login', '/cadastro-usuario'].includes(location.pathname);

  // Bloqueia acesso a rotas protegidas se não autenticado, mesmo usando o botão voltar
  useEffect(() => {
    const protectedRoutes = ['/', '/cliente', '/veiculo', '/os', '/checklist', '/aprovacao-usuarios'];
    if (!currentUser && protectedRoutes.includes(location.pathname)) {
      navigate('/login', { replace: true });
    }
  }, [currentUser, location.pathname, navigate]);

  // Responsivo: remove marginLeft/padding se mobile
  const isMobile = window.innerWidth <= 720;
  // Tablet: menu lateral sobreposto, não empurra conteúdo
  return (
    <ToastProvider>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh', width: '100vw', overflowX: 'hidden' }}>
        {!hideHeader && <Header />}
        <div
          style={{
            flex: 1,
            marginLeft: !hideHeader && !isMobile ? 240 : 0,
            padding: !hideHeader && !isMobile ? '32px 32px 32px 0' : '8px 0 0 0',
            minWidth: 0,
            width: '100vw',
            boxSizing: 'border-box',
          }}
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro-usuario" element={<CadastroUsuario />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/cliente" element={<Cliente />} />
            <Route path="/veiculo" element={<Veiculo />} />
            <Route path="/os" element={<OSPage />} />
            <Route path="/checklist" element={<Checklist />} />
            <Route path="/aprovacao-usuarios" element={<AprovacaoUsuarios />} />
            <Route path="*" element={<Login />} />
          </Routes>
        </div>
      </div>
    </ToastProvider>
  );
}
