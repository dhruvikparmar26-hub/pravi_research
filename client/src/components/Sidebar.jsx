import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Box,
  Truck,
  Wrench,
  MapPin,
  Map,
  LogOut,
  Shield,
  Layers,
  ArrowRightLeft,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Assets', path: '/assets', icon: Box },
    { label: 'Transfers', path: '/transfers', icon: ArrowRightLeft },
    { label: 'Maintenance', path: '/maintenance', icon: Wrench },
    { label: 'Locations', path: '/locations', icon: MapPin },
    { label: 'Map', path: '/map', icon: Map },
    ...(user?.role === 'ADMIN' ? [{ label: 'Personnel', path: '/users', icon: Users }] : []),
  ];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--color-canvas)',
      borderRight: '1px solid var(--color-hairline)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid var(--color-hairline)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        {/* Coinbase Style Circular Glyph */}
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          flexShrink: 0,
        }}>
          <Layers size={20} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--color-ink)' }}>
              Pravi
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: '600',
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--color-surface-strong)',
              color: 'var(--color-body)',
            }}>
              R&amp;B
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-muted)', fontWeight: '400' }}>
            Infrastructure Lifecycle
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ padding: '20px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: 'var(--color-muted)',
          padding: '6px 12px 10px',
          letterSpacing: '0.02em',
        }}>
          Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '14px',
                fontWeight: isActive ? '600' : '500',
                color: isActive ? 'var(--color-primary)' : 'var(--color-body)',
                backgroundColor: isActive ? 'var(--color-primary-subtle)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              })}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Card & Logout */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--color-hairline)',
        backgroundColor: 'var(--color-surface-soft)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-surface-strong)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '600',
              fontSize: '13px',
              color: 'var(--color-ink)',
            }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                color: 'var(--color-ink)',
              }}>
                {user?.name || 'Administrator'}
              </div>
              <div style={{
                fontSize: '11px',
                color: 'var(--color-muted)',
                fontWeight: '500',
                whiteSpace: 'nowrap',
              }}>
                {user?.role === 'ADMIN'
                  ? 'Super Admin'
                  : user?.role === 'ASSET_MANAGER'
                  ? 'Executive Engr'
                  : user?.role === 'TECHNICIAN'
                  ? 'Technician'
                  : user?.role === 'EMPLOYEE'
                  ? 'Field Custodian'
                  : (user?.role || 'Authorized User')}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log out"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-ink)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
