import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Header() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const touchStartY = useRef(null);

  const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
  const filial = sessionStorage.getItem('filial') || 'sao-paulo';
  const logoSrc = filial === 'diesel' ? '/logo-diesel.png' : '/logo-alien.png';
  const logoAlt = filial === 'diesel' ? 'Logo Diesel' : 'Logo Alien Engine Tuning';

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 1024);
      if (window.innerWidth > 1024) setOpen(true);
      else setOpen(false);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Touch events para mostrar menu ao puxar de cima
  useEffect(() => {
    if (!isMobile) return;
    function onTouchStart(e) {
      if (e.touches[0].clientY < 40) {
        touchStartY.current = e.touches[0].clientY;
      } else {
        touchStartY.current = null;
      }
    }
    function onTouchMove(e) {
      if (touchStartY.current !== null) {
        const deltaY = e.touches[0].clientY - touchStartY.current;
        if (deltaY > 60) {
          setOpen(true);
          touchStartY.current = null;
        }
      }
    }
    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [isMobile]);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      // Silent error
    }
  }

  const menuLinks = [
    { to: '/os', label: 'Ordens de Serviço' },
    { to: '/checklist', label: 'Checklist' },
    { to: '/cliente', label: 'Clientes' },
    { to: '/veiculo', label: 'Veículos' },
    { to: '/', label: 'Dashboard' },
    ...(isAdmin ? [{ to: '/aprovacao-usuarios', label: 'Gerenciar Usuários' }] : [])
  ];

  // Botão para abrir/fechar menu no mobile
  const menuButton = isMobile && (
    <button
      aria-label={open ? 'Fechar menu' : 'Abrir menu'}
      onClick={() => setOpen(o => !o)}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 201,
        background: '#111',
        color: '#fff',
        border: '2px solid #333',
        borderRadius: '50%',
        width: 56,
        height: 56,
        minWidth: 56,
        minHeight: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
        fontSize: 24,
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        padding: 0,
        margin: 0,
        lineHeight: 1,
        transform: open ? 'rotate(90deg)' : 'rotate(0deg)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = open ? 'rotate(90deg) scale(1.1)' : 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = open ? 'rotate(90deg)' : 'rotate(0deg)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
      }}
    >
      {open ? '×' : '☰'}
    </button>
  );

  return (
    <>
      {menuButton}
      {open && (
        <aside
          style={{
            position: isMobile ? 'fixed' : 'fixed',
            left: 0,
            top: 0,
            height: '100vh',
            width: 220,
            background: '#fff',
            borderRight: '1px solid #eee',
            boxShadow: '0 8px 22px rgba(15,15,15,0.06)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 200,
            padding: '24px 0',
            transition: 'transform .3s',
            transform: isMobile && !open ? 'translateX(-100%)' : 'none'
          }}
        >
          <div style={{ padding: '24px 0 12px 0', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src={logoSrc} alt={logoAlt} style={{ height: 80, width: 200, objectFit: 'contain', borderRadius: 24, background: 'transparent', display: 'block' }} />
          </div>
          <nav style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, marginTop: 16 }}>
            {menuLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  padding: '12px 24px',
                  textAlign: 'left',
                  fontWeight: 600,
                  fontSize: 16,
                  color: location.pathname === link.to ? '#fff' : '#222',
                  background: location.pathname === link.to ? '#111' : 'transparent',
                  textDecoration: 'none',
                  borderRadius: 8,
                  transition: 'background .2s, color .2s, box-shadow .2s',
                  boxShadow: location.pathname === link.to ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none'
                }}
                onClick={() => isMobile && setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div style={{ marginTop: 'auto', width: '100%', padding: '18px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {currentUser ? (
              <>
                <span className="small muted" style={{ textAlign: 'center', fontSize: '18px', fontWeight: 700 }}>{currentUser.displayName || currentUser.email}</span>
                <button onClick={handleLogout} style={{ width: '80%', padding: '10px 0', borderRadius: 8, color: '#fff' }}>Sair</button>
              </>
            ) : (
              <Link to="/login" style={{ width: '80%', padding: '10px 0', textAlign: 'center', borderRadius: 8, background: '#39FF14', color: '#222', fontWeight: 600, textDecoration: 'none' }}>Login</Link>
            )}
          </div>
        </aside>
      )}
    </>
  );
}
