import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ArrowRight, Shield, HardHat, Wrench, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('admin@pravi.gov.in');
  const [password, setPassword] = useState('Admin@123456');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setFormError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const setDemoRole = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Admin@123456');
  };

  return (
    <div style={{
      height: '100vh',
      overflowY: 'auto',
      backgroundColor: 'var(--color-surface-soft)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-primary)',
            color: '#FFFFFF',
            marginBottom: '16px',
            boxShadow: '0 4px 14px rgba(0, 82, 255, 0.25)',
          }}>
            <Layers size={26} />
          </div>

          <h1 style={{
            fontSize: '36px',
            fontWeight: '400',
            letterSpacing: '-1px',
            color: 'var(--color-ink)',
            marginBottom: '8px',
          }}>
            Pravi Console
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--color-body)' }}>
            Roads &amp; Buildings Asset Lifecycle System
          </p>
        </div>

        {/* Login Card */}
        <div className="card" style={{ padding: '36px', boxShadow: 'var(--shadow-card)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-ink)' }}>
            Sign In
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-body)', marginBottom: '24px' }}>
            Enter your departmental credentials to access the console.
          </p>

          {formError && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(207, 32, 47, 0.08)',
              border: '1px solid rgba(207, 32, 47, 0.2)',
              color: 'var(--color-semantic-down)',
              fontSize: '13px',
              marginBottom: '20px',
            }}>
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="input-group">
              <label className="input-label">Email address</label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="name@pravi.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                type="password"
                required
                className="input-field"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '6px' }}
            >
              {submitting ? (
                'Signing in...'
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Pills */}
          <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid var(--color-hairline)' }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--color-muted)',
              marginBottom: '12px',
              textAlign: 'center',
            }}>
              Demo Accounts
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setDemoRole('admin@pravi.gov.in')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '12px', justifyContent: 'flex-start' }}
              >
                <Shield size={14} color="var(--color-primary)" />
                <span>Super Admin</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoRole('manager@pravi.gov.in')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '12px', justifyContent: 'flex-start' }}
              >
                <HardHat size={14} color="var(--color-accent-yellow)" />
                <span>Executive Engr</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoRole('tech@pravi.gov.in')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '12px', justifyContent: 'flex-start' }}
              >
                <Wrench size={14} color="var(--color-primary)" />
                <span>Technician</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoRole('employee@pravi.gov.in')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '12px', justifyContent: 'flex-start' }}
              >
                <UserCheck size={14} color="var(--color-semantic-up)" />
                <span>Field Custodian</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
        }}>
          <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
            Institutional Infrastructure Management
          </span>
          <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>•</span>
          <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
            Gujarat R&amp;B Dept
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
