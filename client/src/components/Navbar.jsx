import React from 'react';
import { Building2, Search, Bell, Plus, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ title, subtitle, onActionClick, actionLabel, actionIcon: ActionIcon = Plus }) => {
  const { user } = useAuth();

  return (
    <header style={{
      height: '64px',
      backgroundColor: 'var(--color-canvas)',
      borderBottom: '1px solid var(--color-hairline)',
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 30,
    }}>
      {/* Page Title & Breadcrumb */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--color-ink)', letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        {subtitle && (
          <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '1px' }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Right Controls: Department Badge & Action */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* R&B Department Tag */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: 'var(--radius-pill)',
          backgroundColor: 'var(--color-surface-soft)',
          border: '1px solid var(--color-hairline)',
        }}>
          <Building2 size={15} color="var(--color-primary)" />
          <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-ink)' }}>
            Roads &amp; Buildings Dept
          </span>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-semantic-up)',
          }} />
        </div>

        {/* Primary Action Button (optional) */}
        {actionLabel && (
          <button
            onClick={onActionClick}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ActionIcon size={16} />
            <span>{actionLabel}</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
