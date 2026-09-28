import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Search,
  Shield,
  HardHat,
  Wrench,
  UserCheck,
  Edit2,
  X,
  CheckCircle,
  AlertCircle,
  Mail,
  Building2,
  Phone,
} from 'lucide-react';

const ROLE_LABELS = {
  ADMIN: 'Super Admin',
  ASSET_MANAGER: 'Executive Engr',
  TECHNICIAN: 'Technician',
  EMPLOYEE: 'Field Custodian',
};

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    role: 'EMPLOYEE',
    department: '',
    phone: '',
    isActive: true,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      if (res?.data?.data?.users) {
        setUsers(res.data.data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name || '',
      role: u.role || 'EMPLOYEE',
      department: u.department || '',
      phone: u.phone || '',
      isActive: u.isActive !== false,
    });
    setFormError('');
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const res = await api.put(`/users/${editingUser.id || editingUser._id}`, formData);
      if (res.data?.success) {
        setEditingUser(null);
        fetchUsers();
      } else {
        throw new Error(res.data?.message || 'Failed to update user');
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.department?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    return true;
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'ADMIN': return <Shield size={14} color="var(--color-primary)" />;
      case 'ASSET_MANAGER': return <HardHat size={14} color="var(--color-accent-yellow)" />;
      case 'TECHNICIAN': return <Wrench size={14} color="var(--color-primary)" />;
      default: return <UserCheck size={14} color="var(--color-semantic-up)" />;
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Navbar
        title="Personnel & Roles"
        subtitle="Manage Gujarat R&B department officers, assign permissions, and oversee access"
      />

      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Metric Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-muted)' }}>Registered Officers</span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-surface-strong)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)',
              }}>
                <Users size={16} />
              </div>
            </div>
            <div className="number-display" style={{ fontSize: '28px', color: 'var(--color-ink)' }}>
              {users.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              Authorized system accounts
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-muted)' }}>Executive Engrs</span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-surface-strong)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-accent-yellow)',
              }}>
                <HardHat size={16} />
              </div>
            </div>
            <div className="number-display" style={{ fontSize: '28px', color: 'var(--color-ink)' }}>
              {users.filter((u) => u.role === 'ASSET_MANAGER').length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              Circle &amp; division managers
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-muted)' }}>Technicians</span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-surface-strong)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)',
              }}>
                <Wrench size={16} />
              </div>
            </div>
            <div className="number-display" style={{ fontSize: '28px', color: 'var(--color-ink)' }}>
              {users.filter((u) => u.role === 'TECHNICIAN').length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              Workshop &amp; field technicians
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
            <input
              type="text"
              placeholder="Search by officer name, email, or department..."
              className="input-field"
              style={{ paddingLeft: '38px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Role Filter Tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { key: 'ALL', label: 'All Roles' },
              { key: 'ADMIN', label: 'Super Admin' },
              { key: 'ASSET_MANAGER', label: 'Executive Engr' },
              { key: 'TECHNICIAN', label: 'Technicians' },
              { key: 'EMPLOYEE', label: 'Field Custodians' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRoleFilter(tab.key)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '12px',
                  fontWeight: roleFilter === tab.key ? '600' : '500',
                  border: '1px solid',
                  borderColor: roleFilter === tab.key ? 'var(--color-primary)' : 'var(--color-hairline)',
                  backgroundColor: roleFilter === tab.key ? 'var(--color-primary-subtle)' : 'var(--color-canvas)',
                  color: roleFilter === tab.key ? 'var(--color-primary)' : 'var(--color-body)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ minWidth: '240px' }}>Officer</th>
                <th style={{ minWidth: '180px' }}>Role &amp; Permissions</th>
                <th style={{ minWidth: '180px' }}>Department</th>
                <th style={{ minWidth: '140px' }}>Phone</th>
                <th style={{ minWidth: '130px' }}>Account Status</th>
                <th style={{ textAlign: 'right', minWidth: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: 'var(--color-muted)' }}>
                    Loading personnel records...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: 'var(--color-muted)' }}>
                    No officers match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = (u.id || u._id) === (currentUser?.id || currentUser?._id);
                  return (
                    <tr key={u.id || u._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'var(--color-surface-strong)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600',
                            fontSize: '14px',
                            color: 'var(--color-ink)',
                          }}>
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--color-primary-subtle)', color: 'var(--color-primary)', fontWeight: '700' }}>
                                  You
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-pill)',
                          backgroundColor: u.role === 'ADMIN' ? 'rgba(0, 82, 255, 0.1)' : 'var(--color-surface-soft)',
                          border: '1px solid var(--color-hairline)',
                          color: 'var(--color-ink)',
                        }}>
                          {getRoleIcon(u.role)}
                          <span>{ROLE_LABELS[u.role] || u.role}</span>
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--color-body)' }}>
                          {u.department || 'Roads & Buildings'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                          {u.phone || '—'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.isActive !== false ? 'badge-in_use' : 'badge-condemned'}`}>
                          {u.isActive !== false ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => openEditModal(u)}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '6px 12px' }}
                        >
                          <Edit2 size={13} />
                          <span>Modify</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '24px',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Modify Officer Permissions</h2>
                <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px' }}>
                  {editingUser.name} ({editingUser.email})
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(207, 32, 47, 0.08)',
                border: '1px solid rgba(207, 32, 47, 0.2)',
                color: 'var(--color-semantic-down)',
                fontSize: '13px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Role &amp; Security Clearance</label>
                <select
                  className="input-field"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="ADMIN">Super Admin (Full Read/Write, User Management)</option>
                  <option value="ASSET_MANAGER">Executive Engr (Assets, Gate Passes, Locations)</option>
                  <option value="TECHNICIAN">Technician (Work Orders, Maintenance Execution)</option>
                  <option value="EMPLOYEE">Field Custodian (Report Breakdowns, View Directory)</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Department / Circle</label>
                <input
                  type="text"
                  placeholder="e.g. Roads & Highways Division"
                  className="input-field"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Contact Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98250 11234"
                  className="input-field"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="userActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                />
                <label htmlFor="userActive" style={{ fontSize: '13px', color: 'var(--color-ink)', cursor: 'pointer' }}>
                  Account Active &amp; Authorized to Sign In
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
