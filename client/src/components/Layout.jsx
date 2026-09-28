import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const isMapPage = location.pathname === '/map';

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-canvas)',
        color: 'var(--color-ink)',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid var(--color-hairline)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ fontSize: '14px', color: 'var(--color-muted)', fontWeight: '400' }}>
          Loading Pravi...
        </span>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', maxHeight: '100vh', width: '100%', overflow: 'hidden', backgroundColor: 'var(--color-surface-soft)' }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, height: '100vh', maxHeight: '100vh', display: 'flex', flexDirection: 'column', overflowY: isMapPage ? 'hidden' : 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
