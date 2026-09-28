import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Wrench, Plus, CheckCircle2, AlertTriangle,
  X, Gauge, Package, Trash2, Activity,
  MessageCircle, ChevronDown, ChevronUp,
  Send, AlertCircle, CheckCheck, Lock, Shield,
  Eye, UserCheck, ClipboardList,
} from 'lucide-react';

// ─── RBAC Permission Map ──────────────────────────────────────────────────────
// Defines exactly what each role can and cannot do on maintenance tickets.
const PERMISSIONS = {
  ADMIN: {
    canCreate: true,
    canAssign: true,
    canStartWork: true,
    canLogDiagnostics: true,
    canWaitForParts: true,
    canResolve: true,
    canClose: true,
    canComment: true,
    label: 'Super Admin',
    color: '#175CD3',
    bg: '#EFF8FF',
    description: 'Full access to all maintenance operations',
  },
  ASSET_MANAGER: {
    canCreate: true,
    canAssign: true,
    canStartWork: true,
    canLogDiagnostics: true,
    canWaitForParts: true,
    canResolve: true,
    canClose: true,
    canComment: true,
    label: 'Executive Engr',
    color: '#B54708',
    bg: '#FEF0C7',
    description: 'Raise tickets, assign technicians, approve & sign-off closures',
  },
  TECHNICIAN: {
    canCreate: true,
    canAssign: false,
    canStartWork: true,
    canLogDiagnostics: true,
    canWaitForParts: true,
    canResolve: true,
    canClose: false,
    canComment: true,
    label: 'Technician',
    color: '#027A48',
    bg: '#EBFDF2',
    description: 'Start work, log diagnostics, parts, and mark resolved',
  },
  EMPLOYEE: {
    canCreate: true,
    canAssign: false,
    canStartWork: false,
    canLogDiagnostics: false,
    canWaitForParts: false,
    canResolve: false,
    canClose: false,
    canComment: true,
    label: 'Field Custodian',
    color: '#344054',
    bg: '#F2F4F7',
    description: 'Report issues and communicate on tickets only',
  },
};

// ─── Toast System ─────────────────────────────────────────────────────────────
const ToastContainer = ({ toasts, onDismiss }) => (
  <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none' }}>
    {toasts.map((toast) => (
      <div key={toast.id} style={{
        pointerEvents: 'all', display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 18px',
        borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
        border: `1px solid ${toast.type === 'success' ? '#A6F4C5' : toast.type === 'error' ? '#FECDCA' : toast.type === 'warning' ? '#FEDF89' : '#BEE3F8'}`,
        backgroundColor: toast.type === 'success' ? '#F6FEF9' : toast.type === 'error' ? '#FEF3F2' : toast.type === 'warning' ? '#FFFAEB' : '#EFF8FF',
        minWidth: '320px', maxWidth: '420px', animation: 'slideInRight 0.3s ease',
      }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: toast.type === 'success' ? '#EBFDF2' : toast.type === 'error' ? '#FEE4E2' : toast.type === 'warning' ? '#FEF0C7' : '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: toast.type === 'success' ? '#027A48' : toast.type === 'error' ? '#D92D20' : toast.type === 'warning' ? '#B54708' : '#175CD3' }}>
          {toast.type === 'success' ? <CheckCheck size={16} /> : toast.type === 'error' ? <AlertCircle size={16} /> : <AlertTriangle size={16} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '700', fontSize: '13px', color: '#101828', marginBottom: '2px' }}>{toast.title}</div>
          <div style={{ fontSize: '12px', color: '#475467', lineHeight: '1.5' }}>{toast.message}</div>
        </div>
        <button onClick={() => onDismiss(toast.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#98A2B3', padding: '2px', flexShrink: 0 }}><X size={14} /></button>
      </div>
    ))}
  </div>
);

// ─── Role Permission Banner ───────────────────────────────────────────────────
const RoleBanner = ({ role }) => {
  const p = PERMISSIONS[role] || PERMISSIONS.EMPLOYEE;
  const allowed = [];
  const restricted = [];
  if (p.canCreate) allowed.push('Raise Tickets');
  if (p.canAssign) allowed.push('Assign Technician');
  if (p.canStartWork) allowed.push('Start Work');
  if (p.canLogDiagnostics) allowed.push('Log Diagnostics');
  if (p.canWaitForParts) allowed.push('Mark Waiting Parts');
  if (p.canResolve) allowed.push('Mark Resolved');
  if (p.canClose) allowed.push('Engineer Sign-off & Close');
  if (!p.canAssign) restricted.push('Assign Technician');
  if (!p.canStartWork) restricted.push('Start / Resume Work');
  if (!p.canLogDiagnostics) restricted.push('Log Diagnostics & Parts');
  if (!p.canResolve) restricted.push('Mark Resolved');
  if (!p.canClose) restricted.push('Sign-off & Close');

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 20px', borderRadius: '12px', backgroundColor: p.bg, border: `1px solid ${p.color}30`, marginBottom: '4px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Shield size={18} color="#fff" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: p.color }}>Logged in as: {p.label}</span>
          <span style={{ fontSize: '11px', color: '#667085' }}>{p.description}</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#027A48', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              &#10003; Permitted Actions
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {allowed.map(a => (
                <span key={a} style={{ fontSize: '11px', backgroundColor: '#EBFDF2', color: '#027A48', padding: '2px 8px', borderRadius: '20px', border: '1px solid #A6F4C5', fontWeight: '500' }}>{a}</span>
              ))}
            </div>
          </div>
          {restricted.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#D92D20', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                &#10007; Restricted (Role Insufficient)
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {restricted.map(r => (
                  <span key={r} style={{ fontSize: '11px', backgroundColor: '#FEF3F2', color: '#D92D20', padding: '2px 8px', borderRadius: '20px', border: '1px solid #FECDCA', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={9} />{r}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Comment Bubble ───────────────────────────────────────────────────────────
const roleColors = {
  ADMIN: { bg: '#EFF8FF', text: '#175CD3', label: 'Super Admin' },
  ASSET_MANAGER: { bg: '#FEF0C7', text: '#B54708', label: 'Executive Engr' },
  TECHNICIAN: { bg: '#EBFDF2', text: '#027A48', label: 'Technician' },
  EMPLOYEE: { bg: '#F2F4F7', text: '#344054', label: 'Field Custodian' },
};

const CommentBubble = ({ comment, isOwn }) => {
  const rc = roleColors[comment.authorRole] || roleColors.EMPLOYEE;
  const ts = new Date(comment.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  return (
    <div style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', gap: '10px', alignItems: 'flex-start' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: rc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '11px', fontWeight: '700', color: rc.text }}>
        {(comment.authorName || 'U').slice(0, 1).toUpperCase()}
      </div>
      <div style={{ maxWidth: '75%', backgroundColor: isOwn ? '#EFF8FF' : '#FFFFFF', border: `1px solid ${isOwn ? '#BEE3F8' : '#EAECF0'}`, borderRadius: isOwn ? '12px 2px 12px 12px' : '2px 12px 12px 12px', padding: '10px 13px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#101828' }}>{(comment.authorName || '').split(' ').slice(0, 3).join(' ')}</span>
          <span style={{ fontSize: '10px', fontWeight: '600', color: rc.text, backgroundColor: rc.bg, padding: '1px 7px', borderRadius: '20px' }}>{rc.label}</span>
          <span style={{ fontSize: '10px', color: '#98A2B3', marginLeft: 'auto' }}>{ts}</span>
        </div>
        <p style={{ fontSize: '13px', color: '#344054', margin: 0, lineHeight: '1.55' }}>{comment.message}</p>
      </div>
    </div>
  );
};

// ─── Locked Action Button ─────────────────────────────────────────────────────
// Shows a greyed-out button with lock icon for unauthorized actions
const LockedBtn = ({ label, icon: Icon }) => (
  <div title={`Requires Manager or Admin role`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #E9EAEB', backgroundColor: '#F9FAFB', color: '#98A2B3', fontSize: '12px', fontWeight: '600', cursor: 'not-allowed', userSelect: 'none' }}>
    <Lock size={12} color="#D0D5DD" />
    {Icon && <Icon size={13} color="#D0D5DD" />}
    <span>{label}</span>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const MaintenancePage = () => {
  const { user } = useAuth();
  const role = user?.role || 'EMPLOYEE';
  const perms = PERMISSIONS[role] || PERMISSIONS.EMPLOYEE;

  const [tickets, setTickets] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWorkLogModal, setShowWorkLogModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [postingComment, setPostingComment] = useState({});
  const [toasts, setToasts] = useState([]);

  const [newTicket, setNewTicket] = useState({ asset: '', maintenanceType: 'BREAKDOWN_REPAIR', priority: 'HIGH', issueDescription: '' });
  const [workLogData, setWorkLogData] = useState({ diagnosis: '', actionTaken: '', meterReadingAtService: '', laborCost: '', replacedParts: [] });

  const addToast = useCallback((title, message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5500);
  }, []);

  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // Guard: block unauthorized actions with a toast
  const requirePerm = (permKey, action) => {
    if (!perms[permKey]) {
      addToast('Access Denied', `Your role (${perms.label}) is not permitted to ${action}. Contact your Asset Manager.`, 'error');
      return false;
    }
    return true;
  };

  const openWorkLog = (ticket) => {
    setShowWorkLogModal(ticket);
    setWorkLogData({
      diagnosis: ticket.diagnosis || '',
      actionTaken: ticket.actionTaken || '',
      meterReadingAtService: ticket.meterReadingAtService || ticket.meterReading || '',
      laborCost: ticket.laborCost || '',
      replacedParts: ticket.replacedParts?.length
        ? ticket.replacedParts.map(p => ({ partName: p.partName || '', partNumber: p.partNumber || '', quantity: p.quantity || 1, unitCost: p.unitCost || 0 }))
        : [{ partName: '', partNumber: '', quantity: 1, unitCost: 0 }],
    });
  };

  const handleAddPartRow = () => setWorkLogData(prev => ({ ...prev, replacedParts: [...prev.replacedParts, { partName: '', partNumber: '', quantity: 1, unitCost: 0 }] }));
  const handleRemovePartRow = (idx) => setWorkLogData(prev => ({ ...prev, replacedParts: prev.replacedParts.filter((_, i) => i !== idx) }));
  const handlePartChange = (idx, field, value) => setWorkLogData(prev => { const u = [...prev.replacedParts]; u[idx] = { ...u[idx], [field]: value }; return { ...prev, replacedParts: u }; });

  const handleSaveWorkLog = async (e) => {
    e.preventDefault();
    if (!requirePerm('canLogDiagnostics', 'log diagnostics')) return;
    setSubmitting(true);
    try {
      const validParts = workLogData.replacedParts.filter(p => p.partName.trim()).map(p => ({ partName: p.partName, partNumber: p.partNumber, quantity: Number(p.quantity) || 1, unitCost: Number(p.unitCost) || 0, totalCost: (Number(p.quantity) || 1) * (Number(p.unitCost) || 0) }));
      const res = await api.put(`/maintenance/${showWorkLogModal._id}/work-log`, { diagnosis: workLogData.diagnosis, actionTaken: workLogData.actionTaken, meterReadingAtService: workLogData.meterReadingAtService ? Number(workLogData.meterReadingAtService) : undefined, laborCost: Number(workLogData.laborCost) || 0, replacedParts: validParts });
      if (res.data?.success) { setShowWorkLogModal(null); fetchTickets(); addToast('Work Log Saved', `Diagnostics & parts updated for ${showWorkLogModal.ticketNumber}`, 'success'); }
    } catch (err) { addToast('Save Failed', err.response?.data?.message || err.message, 'error'); }
    finally { setSubmitting(false); }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const [res, assetRes] = await Promise.all([api.get('/maintenance').catch(() => null), api.get('/assets').catch(() => null)]);
      if (res?.data?.data?.tickets) setTickets(res.data.data.tickets);
      if (assetRes?.data?.data?.assets) setAssets(assetRes.data.data.assets);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!requirePerm('canCreate', 'raise maintenance tickets')) return;
    setSubmitting(true);
    try {
      const res = await api.post('/maintenance', { assetId: newTicket.asset, type: newTicket.maintenanceType, priority: newTicket.priority, issueDescription: newTicket.issueDescription, issueTitle: newTicket.issueDescription ? newTicket.issueDescription.slice(0, 60) : 'Maintenance Ticket' });
      if (res.data?.success) { setShowCreateModal(false); setNewTicket({ asset: '', maintenanceType: 'BREAKDOWN_REPAIR', priority: 'HIGH', issueDescription: '' }); fetchTickets(); addToast('Ticket Raised', `Work order ${res.data.data?.ticket?.ticketNumber || ''} created & asset flagged`, 'success'); }
    } catch (err) { addToast('Failed to Create', err.response?.data?.message || err.message, 'error'); }
    finally { setSubmitting(false); }
  };

  const handleStartWork = async (ticket) => {
    if (!requirePerm('canStartWork', 'start work on a ticket')) return;
    try { await api.put(`/maintenance/${ticket._id}/start`); fetchTickets(); addToast('Work Started', `${ticket.ticketNumber} is now IN PROGRESS`, 'info'); }
    catch (err) { addToast('Cannot Start Work', err.response?.data?.message || err.message, 'error'); }
  };

  const handleResolve = async (ticket) => {
    if (!requirePerm('canResolve', 'mark a ticket as resolved')) return;
    try { await api.put(`/maintenance/${ticket._id}/resolve`, { resolutionNotes: 'Repairs completed and functional test passed' }); fetchTickets(); addToast('Ticket Resolved', `${ticket.ticketNumber} marked resolved — pending Manager sign-off`, 'success'); }
    catch (err) { addToast('Resolve Failed', err.response?.data?.message || err.message, 'error'); }
  };

  const handleWaitForParts = async (ticket) => {
    if (!requirePerm('canWaitForParts', 'mark a ticket as waiting for parts')) return;
    try { await api.put(`/maintenance/${ticket._id}/wait-for-parts`); fetchTickets(); addToast('Awaiting Parts', `${ticket.ticketNumber} on hold — procure required spare parts`, 'warning'); }
    catch (err) { addToast('Update Failed', err.response?.data?.message || err.message, 'error'); }
  };

  const handleCloseTicket = async (ticket) => {
    if (!requirePerm('canClose', 'sign-off and close a ticket')) return;
    if (!window.confirm(`Sign-off and close ${ticket.ticketNumber}? Asset will return to IN_USE.`)) return;
    try { await api.put(`/maintenance/${ticket._id}/close`, { managerSignoffNotes: 'Inspected by Executive Engineer and returned to duty' }); fetchTickets(); addToast('Ticket Closed & Signed Off', `${ticket.ticketNumber} closed. Asset returned to operational duty.`, 'success'); }
    catch (err) { addToast('Close Failed', err.response?.data?.message || err.message, 'error'); }
  };

  const handlePostComment = async (ticketId, ticketNumber) => {
    if (!requirePerm('canComment', 'post comments')) return;
    const msg = (commentText[ticketId] || '').trim(); if (!msg) return;
    setPostingComment(prev => ({ ...prev, [ticketId]: true }));
    try {
      const res = await api.post(`/maintenance/${ticketId}/comment`, { message: msg });
      if (res.data?.success) { setCommentText(prev => ({ ...prev, [ticketId]: '' })); setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, comments: res.data.data?.ticket?.comments || t.comments } : t)); addToast('Update Posted', `Your message on ${ticketNumber} is visible to the full team`, 'success'); }
    } catch (err) { addToast('Comment Failed', err.response?.data?.message || err.message, 'error'); }
    finally { setPostingComment(prev => ({ ...prev, [ticketId]: false })); }
  };

  const toggleComments = (id) => setExpandedComments(prev => ({ ...prev, [id]: !prev[id] }));

  const filteredTickets = tickets.filter((t) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'WAITING_PARTS') return t.status === 'WAITING_PARTS' || t.status === 'WAITING_FOR_PARTS';
    return t.status === activeTab;
  });

  const tabCounts = {
    ALL: tickets.length,
    OPEN: tickets.filter(t => t.status === 'OPEN').length,
    IN_PROGRESS: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    WAITING_PARTS: tickets.filter(t => t.status === 'WAITING_PARTS' || t.status === 'WAITING_FOR_PARTS').length,
    RESOLVED: tickets.filter(t => t.status === 'RESOLVED').length,
    CLOSED: tickets.filter(t => t.status === 'CLOSED').length,
  };

  const tabColors = { ALL: { bg: 'var(--color-primary-subtle)', text: '#0052ff' }, IN_PROGRESS: { bg: '#EFF8FF', text: '#175CD3' }, OPEN: { bg: '#FEF0C7', text: '#B54708' }, WAITING_PARTS: { bg: '#FEE4E2', text: '#D92D20' }, RESOLVED: { bg: '#EBFDF2', text: '#027A48' }, CLOSED: { bg: '#F2F4F7', text: '#667085' } };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <style>{`@keyframes slideInRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }`}</style>

      <Navbar
        title="Maintenance"
        subtitle="Service work orders, field repairs, and spare parts"
        actionLabel={perms.canCreate ? 'New Ticket' : null}
        actionIcon={perms.canCreate ? Plus : null}
        onActionClick={perms.canCreate ? () => setShowCreateModal(true) : null}
      />

      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Role Permission Banner */}
        <RoleBanner role={role} />

        {/* KPI Filter Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
          {Object.entries(tabCounts).map(([tab, count]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '16px', borderRadius: '12px', border: `2px solid ${activeTab === tab ? (tabColors[tab]?.text || '#0052ff') : 'var(--color-hairline)'}`, backgroundColor: activeTab === tab ? (tabColors[tab]?.bg || 'var(--color-primary-subtle)') : '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' }}>
              <div style={{ fontSize: '26px', fontWeight: '800', color: activeTab === tab ? (tabColors[tab]?.text || '#0052ff') : '#101828', lineHeight: 1 }}>{count}</div>
              <div style={{ fontSize: '10px', fontWeight: '600', color: '#667085', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px' }}>{tab.replace(/_/g, ' ')}</div>
            </button>
          ))}
        </div>

        {/* Tickets */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-muted)' }}>Loading tickets...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--color-muted)' }}>No tickets in {activeTab.replace(/_/g, ' ')} status.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredTickets.map((t) => {
              const isExpanded = expandedComments[t._id];
              const comments = t.comments || [];
              const isWaiting = t.status === 'WAITING_PARTS' || t.status === 'WAITING_FOR_PARTS';

              return (
                <div key={t._id} className="card" style={{ padding: '22px 26px' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: '600', color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-subtle)', padding: '4px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid rgba(0,82,255,0.2)' }}>{t.ticketNumber}</span>
                      <span className={`badge badge-${(t.status || '').toLowerCase()}`}>{(t.status || '').replace(/_/g, ' ')}</span>
                      <span className={`badge badge-${(t.priority || '').toLowerCase()}`}>{t.priority} Priority</span>
                      <span className="badge badge-procured">{((t.type || t.maintenanceType || 'MAINTENANCE')).replace(/_/g, ' ')}</span>
                    </div>

                    {/* Action Buttons — RBAC enforced */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* OPEN → Start Work (TECHNICIAN, MANAGER, ADMIN) */}
                      {t.status === 'OPEN' && (
                        perms.canStartWork
                          ? <button onClick={() => handleStartWork(t)} className="btn btn-primary btn-sm"><Wrench size={14} /><span>Start Work</span></button>
                          : <LockedBtn label="Start Work" icon={Wrench} />
                      )}

                      {/* IN_PROGRESS → Log Diagnostics / Wait / Resolve */}
                      {t.status === 'IN_PROGRESS' && (<>
                        {perms.canLogDiagnostics
                          ? <button onClick={() => openWorkLog(t)} className="btn btn-primary btn-sm"><Activity size={14} /><span>Log Diagnostics</span></button>
                          : <LockedBtn label="Log Diagnostics" icon={Activity} />}
                        {perms.canWaitForParts
                          ? <button onClick={() => handleWaitForParts(t)} className="btn btn-secondary btn-sm"><Package size={14} /><span>Wait for Parts</span></button>
                          : <LockedBtn label="Wait for Parts" icon={Package} />}
                        {perms.canResolve
                          ? <button onClick={() => handleResolve(t)} className="btn btn-secondary btn-sm" style={{ borderColor: '#027A48', color: '#027A48' }}><CheckCircle2 size={14} /><span>Mark Resolved</span></button>
                          : <LockedBtn label="Mark Resolved" icon={CheckCircle2} />}
                      </>)}

                      {/* WAITING_PARTS → Resume Work */}
                      {isWaiting && (<>
                        {perms.canStartWork
                          ? <button onClick={() => handleStartWork(t)} className="btn btn-primary btn-sm"><Wrench size={14} /><span>Resume Work</span></button>
                          : <LockedBtn label="Resume Work" icon={Wrench} />}
                        {perms.canLogDiagnostics
                          ? <button onClick={() => openWorkLog(t)} className="btn btn-secondary btn-sm"><Activity size={14} /><span>Log Diagnostics</span></button>
                          : <LockedBtn label="Log Diagnostics" icon={Activity} />}
                      </>)}

                      {/* RESOLVED → Close (MANAGER, ADMIN only) */}
                      {t.status === 'RESOLVED' && (
                        perms.canClose
                          ? <button onClick={() => handleCloseTicket(t)} className="btn btn-primary btn-sm" style={{ background: '#027A48', borderColor: '#027A48' }}><CheckCircle2 size={14} /><span>Engineer Sign-off &amp; Close</span></button>
                          : <LockedBtn label="Sign-off & Close (Manager Only)" icon={Lock} />
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '20px', padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-soft)', border: '1px solid var(--color-hairline)', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Equipment</div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--color-ink)', marginTop: '2px' }}>{t.asset?.name || 'Heavy Equipment'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>{t.asset?.assetTag}</div>
                      <p style={{ fontSize: '13px', color: 'var(--color-body)', marginTop: '8px' }}>{t.issueDescription}</p>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Assigned Technician</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)', marginTop: '4px' }}>{t.assignedTechnician?.name || 'In-House Mechanical Team'}</div>
                      {(t.meterReadingAtService || t.meterReading) > 0 && (
                        <div style={{ fontSize: '12px', color: '#b78103', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><Gauge size={14} /><span>{t.meterReadingAtService || t.meterReading} Operating Hours</span></div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Service Incurred Cost</div>
                      <div className="number-display" style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)', marginTop: '4px' }}>&#8377;{(t.totalCost || (t.partsCost || 0) + (t.laborCost || 0) || 0).toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{t.replacedParts?.length || 0} Replaced Spare Parts</div>
                    </div>
                  </div>

                  {/* Parts chips */}
                  {t.replacedParts && t.replacedParts.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Replaced:</span>
                      {t.replacedParts.map((part, i) => (<span key={i} style={{ fontSize: '11px', backgroundColor: 'var(--color-surface-soft)', border: '1px solid var(--color-hairline)', padding: '4px 10px', borderRadius: 'var(--radius-pill)', color: 'var(--color-body)' }}>&#128295; {part.partName} (Qty: {part.quantity}) &mdash; &#8377;{(part.totalCost || 0).toLocaleString('en-IN')}</span>))}
                    </div>
                  )}

                  {/* Activity / Comments */}
                  <div style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: '12px' }}>
                    <button onClick={() => toggleComments(t._id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', width: '100%', textAlign: 'left' }}>
                      <MessageCircle size={15} color={comments.length > 0 ? '#175CD3' : '#98A2B3'} />
                      <span style={{ fontSize: '13px', fontWeight: '600', color: comments.length > 0 ? '#175CD3' : '#98A2B3' }}>
                        Team Communication {comments.length > 0 ? `(${comments.length} message${comments.length > 1 ? 's' : ''})` : '— No updates yet'}
                      </span>
                      {isExpanded ? <ChevronUp size={14} color="#98A2B3" style={{ marginLeft: 'auto' }} /> : <ChevronDown size={14} color="#98A2B3" style={{ marginLeft: 'auto' }} />}
                    </button>

                    {isExpanded && (
                      <div style={{ marginTop: '14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
                          {comments.length === 0
                            ? <div style={{ fontSize: '13px', color: '#98A2B3', textAlign: 'center', padding: '12px' }}>No communication yet — be the first to update the team.</div>
                            : comments.map((c, idx) => <CommentBubble key={idx} comment={c} isOwn={c.authorRole === role} />)
                          }
                        </div>

                        {/* Comment Input — all roles can comment */}
                        {perms.canComment ? (
                          <>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', padding: '10px', backgroundColor: '#F9FAFB', borderRadius: '10px', border: '1px solid var(--color-hairline)' }}>
                              <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: (PERMISSIONS[role] || PERMISSIONS.EMPLOYEE).bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '11px', fontWeight: '700', color: (PERMISSIONS[role] || PERMISSIONS.EMPLOYEE).color }}>{(user?.name || 'U').slice(0, 1).toUpperCase()}</div>
                              <textarea rows={2} placeholder="Write an update, question, or field observation for the team..." style={{ flex: 1, border: 'none', background: 'transparent', resize: 'none', outline: 'none', fontSize: '13px', color: '#101828', lineHeight: '1.5', fontFamily: 'inherit' }} value={commentText[t._id] || ''} onChange={(e) => setCommentText(prev => ({ ...prev, [t._id]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostComment(t._id, t.ticketNumber); } }} />
                              <button onClick={() => handlePostComment(t._id, t.ticketNumber)} disabled={postingComment[t._id] || !(commentText[t._id] || '').trim()} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', backgroundColor: (commentText[t._id] || '').trim() ? 'var(--color-primary)' : '#E9EAEB', color: (commentText[t._id] || '').trim() ? '#fff' : '#98A2B3', cursor: (commentText[t._id] || '').trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}><Send size={15} /></button>
                            </div>
                            <div style={{ fontSize: '10px', color: '#98A2B3', marginTop: '4px' }}>Press Enter to send &bull; Shift+Enter for new line</div>
                          </>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#F9FAFB', borderRadius: '10px', border: '1px dashed #D0D5DD' }}>
                            <Lock size={13} color="#D0D5DD" />
                            <span style={{ fontSize: '12px', color: '#98A2B3' }}>Comment posting is restricted for your role.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '24px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Raise Maintenance Work Order</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: 'none', color: '#98A2B3', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group"><label className="input-label">Select Equipment</label>
                <select required className="input-field" value={newTicket.asset} onChange={(e) => setNewTicket({ ...newTicket, asset: e.target.value })}>
                  <option value="">-- Choose Equipment --</option>
                  {assets.map((a) => (<option key={a._id} value={a._id}>{a.assetTag} &mdash; {a.name}</option>))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group"><label className="input-label">Service Type</label>
                  <select className="input-field" value={newTicket.maintenanceType} onChange={(e) => setNewTicket({ ...newTicket, maintenanceType: e.target.value })}>
                    <option value="BREAKDOWN_REPAIR">Breakdown Repair</option>
                    <option value="PREVENTIVE_SCHEDULED">Preventive Scheduled</option>
                    <option value="INSPECTION">Inspection</option>
                    <option value="CALIBRATION">Calibration</option>
                  </select>
                </div>
                <div className="input-group"><label className="input-label">Priority Level</label>
                  <select className="input-field" value={newTicket.priority} onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}>
                    <option value="CRITICAL">Critical</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
                  </select>
                </div>
              </div>
              <div className="input-group"><label className="input-label">Issue Details &amp; Field Symptoms</label>
                <textarea rows={3} required placeholder="Describe the failure, breakdown symptom, or scheduled check requirements..." className="input-field" value={newTicket.issueDescription} onChange={(e) => setNewTicket({ ...newTicket, issueDescription: e.target.value })} />
              </div>
              <button type="submit" disabled={submitting} className="btn btn-primary btn-lg" style={{ marginTop: '8px' }}>{submitting ? 'Raising Ticket...' : 'Create Ticket & Flag Asset Under Maintenance'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Work Log Modal */}
      {showWorkLogModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '24px', backdropFilter: 'blur(3px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span className="badge badge-in_transit" style={{ marginBottom: '6px' }}>{showWorkLogModal.ticketNumber}</span>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)' }}>Log Diagnostics &amp; Replaced Parts</h2>
                <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px' }}>{showWorkLogModal.asset?.assetTag} &bull; {showWorkLogModal.asset?.name}</div>
              </div>
              <button onClick={() => setShowWorkLogModal(null)} style={{ background: 'transparent', border: 'none', color: '#98A2B3', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveWorkLog} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group"><label className="input-label">Technical Diagnosis &amp; Root Cause</label><textarea rows={2} required placeholder="e.g. Ruptured hydraulic cylinder seal causing pressure failure..." className="input-field" value={workLogData.diagnosis} onChange={(e) => setWorkLogData({ ...workLogData, diagnosis: e.target.value })} /></div>
              <div className="input-group"><label className="input-label">Action Taken / Remedial Procedure</label><textarea rows={2} placeholder="e.g. Disassembled cylinder, replaced seals, pressure tested..." className="input-field" value={workLogData.actionTaken} onChange={(e) => setWorkLogData({ ...workLogData, actionTaken: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="input-group"><label className="input-label">Meter Reading at Service</label><input type="number" placeholder="e.g. 1450" className="input-field" value={workLogData.meterReadingAtService} onChange={(e) => setWorkLogData({ ...workLogData, meterReadingAtService: e.target.value })} /></div>
                <div className="input-group"><label className="input-label">Labor &amp; Service Charges (&#8377;)</label><input type="number" placeholder="e.g. 4500" className="input-field" value={workLogData.laborCost} onChange={(e) => setWorkLogData({ ...workLogData, laborCost: e.target.value })} /></div>
              </div>
              <div style={{ border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-md)', padding: '16px', backgroundColor: 'var(--color-surface-soft)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div><h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>Replaced Spare Parts &amp; Consumables</h4><span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Itemize all replacement spares and parts</span></div>
                  <button type="button" onClick={handleAddPartRow} className="btn btn-secondary btn-sm"><Plus size={14} /> Add Part</button>
                </div>
                {workLogData.replacedParts.map((part, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.2fr auto', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <input type="text" placeholder="Part Name" className="input-field" style={{ padding: '8px 10px', fontSize: '13px' }} value={part.partName} onChange={(e) => handlePartChange(idx, 'partName', e.target.value)} />
                    <input type="text" placeholder="Part / Cat No." className="input-field" style={{ padding: '8px 10px', fontSize: '13px' }} value={part.partNumber} onChange={(e) => handlePartChange(idx, 'partNumber', e.target.value)} />
                    <input type="number" placeholder="Qty" min={1} className="input-field" style={{ padding: '8px 10px', fontSize: '13px' }} value={part.quantity} onChange={(e) => handlePartChange(idx, 'quantity', e.target.value)} />
                    <input type="number" placeholder="Unit &#8377;" min={0} className="input-field" style={{ padding: '8px 10px', fontSize: '13px' }} value={part.unitCost} onChange={(e) => handlePartChange(idx, 'unitCost', e.target.value)} />
                    <button type="button" onClick={() => handleRemovePartRow(idx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowWorkLogModal(null)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 2 }}>{submitting ? 'Saving Diagnostics...' : 'Save Work Log & Parts'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenancePage;
