import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Truck,
  Plus,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
  MapPin,
  X,
  AlertCircle,
  ShieldCheck,
  Send,
  XCircle,
} from 'lucide-react';

const TransfersPage = () => {
  const { user } = useAuth();
  const canRequest = user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER';
  const canApprove = user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER';
  const canDispatch = user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER';
  const canReceive = user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER' || user?.role === 'TECHNICIAN';

  const [transfers, setTransfers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // New transfer form
  const [newTransfer, setNewTransfer] = useState({
    asset: '',
    toLocation: '',
    gatePassType: 'RETURNABLE',
    purpose: '',
    expectedReturnDate: '',
  });

  // Dispatch details form
  const [dispatchData, setDispatchData] = useState({
    carrierName: 'Gujarat Road Logistics Services',
    vehicleNumber: 'GJ-01-CZ-8819',
    driverName: 'Rameshwar Yadav',
    driverContact: '+91 98250 11234',
    remarks: 'Loaded onto low-bed trailer with safety chains fastened',
  });

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const [res, assetRes, locRes] = await Promise.all([
        api.get('/transfers').catch(() => null),
        api.get('/assets').catch(() => null),
        api.get('/locations').catch(() => null),
      ]);

      if (res?.data?.data?.transfers) {
        setTransfers(res.data.data.transfers);
      } else {
        setTransfers([]);
      }

      if (assetRes?.data?.data?.assets) setAssets(assetRes.data.data.assets);
      if (locRes?.data?.data?.locations) setLocations(locRes.data.data.locations);
    } catch {
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    if (!newTransfer.asset) {
      alert('Please select an equipment to transfer.');
      return;
    }
    if (!newTransfer.toLocation) {
      alert('Please select a destination facility.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        assetId: newTransfer.asset,
        toLocationId: newTransfer.toLocation,
        gatePassType: newTransfer.gatePassType,
        reason: newTransfer.purpose,
        expectedDeliveryDate: newTransfer.expectedReturnDate || undefined,
      };
      const res = await api.post('/transfers', payload);
      if (res.data?.success) {
        setShowCreateModal(false);
        setNewTransfer({
          asset: '',
          toLocation: '',
          gatePassType: 'RETURNABLE',
          purpose: '',
          expectedReturnDate: '',
        });
        fetchTransfers();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to issue gate pass');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/transfers/${id}/approve`);
      fetchTransfers();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Specify reason for rejecting this gate pass request:', 'Operational schedule conflict / Route unavailable');
    if (reason === null) return;
    try {
      await api.put(`/transfers/${id}/reject`, { rejectionReason: reason || 'Transfer request declined by supervisor' });
      fetchTransfers();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Rejection failed');
    }
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/transfers/${showDispatchModal._id}/dispatch`, dispatchData);
      setShowDispatchModal(null);
      fetchTransfers();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Dispatch failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceive = async (id) => {
    if (!window.confirm('Confirm delivery and acknowledge arrival at destination site?')) return;
    try {
      await api.put(`/transfers/${id}/receive`, { conditionOnArrival: 'GOOD', remarks: 'Received in sound operational state' });
      fetchTransfers();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Receiving failed');
    }
  };

  const filteredTransfers = transfers.filter((t) => {
    if (activeTab === 'ALL') return true;
    return t.status === activeTab;
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Navbar
        title="Transfers"
        subtitle="Track gate passes and equipment moving between sites"
        actionLabel={canRequest ? "New Transfer" : undefined}
        actionIcon={Plus}
        onActionClick={() => setShowCreateModal(true)}
      />

      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Status Tab Navigation */}
        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
          {['ALL', 'REQUESTED', 'APPROVED', 'DISPATCHED', 'DELIVERED', 'REJECTED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Transfers Grid / Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px', color: 'var(--color-muted)' }}>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>Loading inter-site gate passes...</div>
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Truck size={40} color="var(--color-muted)" />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-ink)' }}>No Gate Passes Found</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-muted)', maxWidth: '420px' }}>
              No transfer movements match the current filter. Authorize an equipment movement between Gujarat R&amp;B depots or project camps.
            </p>
            {canRequest && (
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
                style={{ marginTop: '8px' }}
              >
                <Plus size={16} /> Issue Inter-Site Gate Pass
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredTransfers.map((item) => (
              <div key={item._id} className="card" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      color: 'var(--color-primary)',
                      backgroundColor: 'var(--color-primary-subtle)',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-pill)',
                      border: '1px solid rgba(0, 82, 255, 0.2)',
                    }}>
                      {item.transferNumber || item.gatePassNumber}
                    </span>
                    <span className={`badge badge-${item.status?.toLowerCase()}`}>
                      {item.status}
                    </span>
                    <span className="badge badge-procured">
                      {item.gatePassType?.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Workflow Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {item.status === 'REQUESTED' && canApprove && (
                      <>
                        <button
                          onClick={() => handleApprove(item._id)}
                          className="btn btn-primary btn-sm"
                        >
                          <CheckCircle2 size={14} />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleReject(item._id)}
                          className="btn btn-outline btn-sm"
                          style={{ borderColor: 'rgba(239, 68, 68, 0.35)', color: '#ef4444' }}
                        >
                          <XCircle size={14} />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {item.status === 'APPROVED' && canDispatch && (
                      <button
                        onClick={() => setShowDispatchModal(item)}
                        className="btn btn-primary btn-sm"
                      >
                        <Send size={14} />
                        <span>Dispatch</span>
                      </button>
                    )}

                    {item.status === 'DISPATCHED' && canReceive && (
                      <button
                        onClick={() => handleReceive(item._id)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#12b76a' }}
                      >
                        <CheckCircle2 size={14} />
                        <span>Confirm Delivery</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Movement Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 2fr 1.5fr',
                  gap: '20px',
                  alignItems: 'center',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface-soft)',
                  border: '1px solid var(--color-hairline)',
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Equipment</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', marginTop: '2px' }}>
                      {item.asset?.name || 'Heavy Equipment'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                      {item.asset?.assetTag}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Origin Facility</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)' }}>
                        📍 {item.fromLocation?.siteName || 'Central Depot'}
                      </div>
                    </div>
                    <ArrowRight size={20} color="var(--color-primary)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Destination Facility</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-primary)' }}>
                        📍 {item.toLocation?.siteName || 'Project Site'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Logistics Carrier</div>
                    <div style={{ fontSize: '13px', color: 'var(--color-ink)', fontWeight: '500' }}>
                      {item.carrierName || item.logistics?.carrierName || 'Pending Carrier Assignment'}
                    </div>
                    {(item.vehicleNumber || item.logistics?.vehicleNumber) && (
                      <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px' }}>
                        🚛 {item.vehicleNumber || item.logistics?.vehicleNumber} ({item.driverName || item.logistics?.driverName || 'Driver'})
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--color-muted)' }}>
                  <strong>Purpose:</strong> {item.reason || item.purpose || 'Departmental project allocation'} • <strong>Requested by:</strong> {item.requestedBy?.name || 'Sub-Divisional Officer'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Issue Gate Pass Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '24px',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Issue Inter-Site Gate Pass</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#98A2B3', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Select Equipment to Move</label>
                <select
                  required
                  className="input-field"
                  value={newTransfer.asset}
                  onChange={(e) => setNewTransfer({ ...newTransfer, asset: e.target.value })}
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.assetTag} — {a.name} ({a.currentLocation?.siteName || 'Depot'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Destination Facility / Project Camp</label>
                <select
                  required
                  className="input-field"
                  value={newTransfer.toLocation}
                  onChange={(e) => setNewTransfer({ ...newTransfer, toLocation: e.target.value })}
                >
                  <option value="">-- Choose Destination --</option>
                  {locations.map((loc) => (
                    <option key={loc._id} value={loc._id}>
                      {loc.siteName} ({loc.building || 'Main Site'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Pass Type</label>
                  <select
                    className="input-field"
                    value={newTransfer.gatePassType}
                    onChange={(e) => setNewTransfer({ ...newTransfer, gatePassType: e.target.value })}
                  >
                    <option value="RETURNABLE">Returnable Gate Pass</option>
                    <option value="NON_RETURNABLE">Non-Returnable Pass</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Expected Return Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={newTransfer.expectedReturnDate}
                    onChange={(e) => setNewTransfer({ ...newTransfer, expectedReturnDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Purpose of Movement / Work Order</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Deployed for Ring Road asphalt resurfacing stretch KM 12 to 24"
                  className="input-field"
                  value={newTransfer.purpose}
                  onChange={(e) => setNewTransfer({ ...newTransfer, purpose: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-lg"
                style={{ marginTop: '10px' }}
              >
                {submitting ? 'Generating Gate Pass...' : 'Authorize & Issue Gate Pass'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch Logistics Modal */}
      {showDispatchModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '24px',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Record Dispatch Logistics</h2>
                <div style={{ fontSize: '12px', color: 'var(--color-primary)' }}>
                  {showDispatchModal.gatePassNumber} — {showDispatchModal.asset?.name}
                </div>
              </div>
              <button
                onClick={() => setShowDispatchModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#98A2B3', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleDispatch} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Carrier / Transporter Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={dispatchData.carrierName}
                  onChange={(e) => setDispatchData({ ...dispatchData, carrierName: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Vehicle / Trailer Reg No</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={dispatchData.vehicleNumber}
                    onChange={(e) => setDispatchData({ ...dispatchData, vehicleNumber: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Driver Name</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={dispatchData.driverName}
                    onChange={(e) => setDispatchData({ ...dispatchData, driverName: e.target.value })}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Driver Contact Mobile</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={dispatchData.driverContact}
                  onChange={(e) => setDispatchData({ ...dispatchData, driverContact: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Inspection &amp; Lashing Remarks</label>
                <input
                  type="text"
                  className="input-field"
                  value={dispatchData.remarks}
                  onChange={(e) => setDispatchData({ ...dispatchData, remarks: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-lg"
                style={{ marginTop: '8px' }}
              >
                {submitting ? 'Dispatching...' : 'Confirm Dispatch & Update Asset to In-Transit'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransfersPage;
