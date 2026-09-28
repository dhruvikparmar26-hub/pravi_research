import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Plus,
  Building2,
  Box,
  User,
  Search,
  X,
  Layers,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Globe2,
  Edit2,
} from 'lucide-react';

const LocationsPage = () => {
  const { user } = useAuth();
  const canManageLocations = user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER';
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const initialLocationState = {
    siteName: '',
    building: 'Main Administrative Wing',
    floor: 'Ground',
    roomOrBay: 'Machinery Depot / Plant Bay',
    address: {
      street: '',
      city: 'Ahmedabad',
      state: 'Gujarat',
      postalCode: '',
    },
  };

  const [newLocation, setNewLocation] = useState(initialLocationState);
  const [editLocationData, setEditLocationData] = useState(initialLocationState);

  const openEditLocation = (loc) => {
    setEditingLocation(loc);
    setEditLocationData({
      siteName: loc.siteName || '',
      building: loc.building || '',
      floor: loc.floor || 'Ground',
      roomOrBay: loc.roomOrBay || '',
      address: {
        street: loc.address?.street || '',
        city: loc.address?.city || 'Ahmedabad',
        state: loc.address?.state || 'Gujarat',
        postalCode: loc.address?.postalCode || '',
      },
    });
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.put(`/locations/${editingLocation._id}`, editLocationData);
      if (res.data?.success) {
        setEditingLocation(null);
        fetchLocations();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update location');
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch real locations dynamically from MongoDB API
  const fetchLocations = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (cityFilter) params.city = cityFilter;

      const res = await api.get('/locations', { params });
      if (res?.data?.data?.locations) {
        setLocations(res.data.data.locations);
      } else {
        setLocations([]);
      }
    } catch (err) {
      console.error('Failed to fetch real locations:', err);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [cityFilter]);

  const handleAddLocation = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!newLocation.siteName.trim()) {
      setFormError('Site / Division name is required.');
      return;
    }
    if (!newLocation.building.trim()) {
      setFormError('Building name is required.');
      return;
    }
    if (!newLocation.address.city.trim()) {
      setFormError('City / District is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/locations', newLocation);
      if (res?.data?.success) {
        setShowAddModal(false);
        setNewLocation(initialLocationState);
        fetchLocations();
      } else {
        setFormError(res?.data?.message || 'Failed to register facility.');
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Server error while saving location.');
    } finally {
      setSubmitting(false);
    }
  };

  // Derive unique cities for filter dropdown from actual loaded locations
  const availableCities = Array.from(
    new Set(locations.map((loc) => loc.address?.city).filter(Boolean))
  ).sort();

  // Aggregate statistics
  const totalAssetsHoused = locations.reduce((sum, loc) => sum + (loc.assetCount || 0), 0);
  const activeLocationsCount = locations.filter((loc) => loc.isActive !== false).length;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Navbar
        title="Locations"
        subtitle="Divisions, plant depots, workshops, and project staging camps"
        actionLabel={canManageLocations ? "Add Location" : undefined}
        actionIcon={Plus}
        onActionClick={() => {
          setFormError('');
          setShowAddModal(true);
        }}
      />

      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Metric Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-muted)' }}>Total Facilities</span>
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
                <Building2 size={16} />
              </div>
            </div>
            <div className="number-display" style={{ fontSize: '28px', color: 'var(--color-ink)' }}>
              {locations.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              Circles, depots &amp; field camps
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-muted)' }}>Stationed Machinery</span>
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
                <Box size={16} />
              </div>
            </div>
            <div className="number-display" style={{ fontSize: '28px', color: 'var(--color-primary)' }}>
              {totalAssetsHoused}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              Physical equipment verified
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-muted)' }}>Active Status</span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-surface-strong)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#12b76a',
              }}>
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="number-display" style={{ fontSize: '28px', color: 'var(--color-ink)' }}>
              {activeLocationsCount}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              Fully operational sites
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-muted)' }}>Regional Coverage</span>
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
                <Globe2 size={16} />
              </div>
            </div>
            <div className="number-display" style={{ fontSize: '28px', color: 'var(--color-ink)' }}>
              {availableCities.length || 1}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              Districts across Gujarat
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
            <input
              type="text"
              placeholder="Search by circle, division, city, or depot name..."
              className="input-field"
              style={{ paddingLeft: '38px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLocations()}
            />
          </div>

          <div style={{ width: '220px' }}>
            <select
              className="input-field"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            >
              <option value="">All Districts &amp; Cities</option>
              {availableCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {(search || cityFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setCityFilter('');
                fetchLocations();
              }}
              className="btn btn-secondary"
              style={{ padding: '8px 14px', fontSize: '13px' }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Real Location Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px', color: 'var(--color-muted)' }}>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>Loading live facility records from database...</div>
          </div>
        ) : locations.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Building2 size={40} color="var(--color-muted)" />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-ink)' }}>No Facilities Found</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-muted)', maxWidth: '420px' }}>
              No physical locations matched your search criteria. You can register a new Roads &amp; Buildings division, depot, or project site.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setFormError('');
                setShowAddModal(true);
              }}
              style={{ marginTop: '8px' }}
            >
              <Plus size={16} /> Register First Facility
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '20px',
          }}>
            {locations.map((loc) => (
              <div key={loc._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--color-surface-strong)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}>
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--color-ink)', lineHeight: '1.4' }}>
                        {loc.siteName}
                      </h3>
                      <div style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>
                        {loc.building} {loc.roomOrBay ? `• ${loc.roomOrBay}` : ''}
                      </div>
                    </div>
                  </div>

                  <span className="badge badge-in_use" style={{ flexShrink: 0 }}>
                    {loc.isActive !== false ? 'Active' : 'Decommissioned'}
                  </span>
                </div>

                {/* Address & Details Box */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface-soft)',
                  border: '1px solid var(--color-hairline)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-body)' }}>
                    <MapPin size={15} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                    <span style={{ wordBreak: 'break-word' }}>
                      {loc.address?.street ? `${loc.address.street}, ` : ''}
                      {loc.address?.city || 'Gujarat'}, {loc.address?.state || 'India'}
                      {loc.address?.postalCode ? ` - ${loc.address.postalCode}` : ''}
                    </span>
                  </div>

                  {loc.siteManager && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-muted)' }}>
                      <User size={14} color="var(--color-muted)" style={{ flexShrink: 0 }} />
                      <span>In-Charge: {loc.siteManager.name || loc.siteManager.email}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Metric & Link */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--color-hairline)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Box size={15} color="var(--color-primary)" />
                    <span className="number-display" style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>
                      {loc.assetCount || 0} Assets Assigned
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {canManageLocations && (
                      <button
                        onClick={() => openEditLocation(loc)}
                        className="btn btn-outline"
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/assets?location=${loc._id}`)}
                      className="btn btn-secondary"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      View Assets <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Register New Site Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '24px',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)' }}>Register Physical Facility</h2>
                <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '2px' }}>
                  Roads &amp; Buildings division, workshop depot, or project camp
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#98A2B3', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#dc2626',
                fontSize: '13px',
                marginBottom: '16px',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleAddLocation} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Site / Circle / Project Camp Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Surat Circle Heavy Equipment Depot"
                  className="input-field"
                  value={newLocation.siteName}
                  onChange={(e) => setNewLocation({ ...newLocation, siteName: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Building / Section *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mechanical Workshop Wing"
                    className="input-field"
                    value={newLocation.building}
                    onChange={(e) => setNewLocation({ ...newLocation, building: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Room / Bay / Shed</label>
                  <input
                    type="text"
                    placeholder="e.g. Earthmover Service Bay 1"
                    className="input-field"
                    value={newLocation.roomOrBay}
                    onChange={(e) => setNewLocation({ ...newLocation, roomOrBay: e.target.value })}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Street / Area Address</label>
                <input
                  type="text"
                  placeholder="e.g. Majura Gate, Ring Road"
                  className="input-field"
                  value={newLocation.address.street}
                  onChange={(e) => setNewLocation({
                    ...newLocation,
                    address: { ...newLocation.address, street: e.target.value },
                  })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">City / District *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Surat"
                    className="input-field"
                    value={newLocation.address.city}
                    onChange={(e) => setNewLocation({
                      ...newLocation,
                      address: { ...newLocation.address, city: e.target.value },
                    })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">State</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={newLocation.address.state}
                    onChange={(e) => setNewLocation({
                      ...newLocation,
                      address: { ...newLocation.address, state: e.target.value },
                    })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">PIN Code</label>
                  <input
                    type="text"
                    placeholder="395001"
                    className="input-field"
                    value={newLocation.address.postalCode}
                    onChange={(e) => setNewLocation({
                      ...newLocation,
                      address: { ...newLocation.address, postalCode: e.target.value },
                    })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                >
                  {submitting ? 'Registering Facility...' : 'Save Site Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Facility Modal */}
      {editingLocation && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '24px',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span className="badge badge-in_transit" style={{ marginBottom: '6px' }}>{editingLocation.locationCode || 'FACILITY'}</span>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)' }}>Modify Facility Information</h2>
              </div>
              <button
                onClick={() => setEditingLocation(null)}
                style={{ background: 'transparent', border: 'none', color: '#98A2B3', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateLocation} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Site / Division Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={editLocationData.siteName}
                  onChange={(e) => setEditLocationData({ ...editLocationData, siteName: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Building / Depot Wing</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={editLocationData.building}
                    onChange={(e) => setEditLocationData({ ...editLocationData, building: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Room / Machinery Bay</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editLocationData.roomOrBay}
                    onChange={(e) => setEditLocationData({ ...editLocationData, roomOrBay: e.target.value })}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Street Address</label>
                <input
                  type="text"
                  className="input-field"
                  value={editLocationData.address.street}
                  onChange={(e) => setEditLocationData({
                    ...editLocationData,
                    address: { ...editLocationData.address, street: e.target.value }
                  })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">City / District</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={editLocationData.address.city}
                    onChange={(e) => setEditLocationData({
                      ...editLocationData,
                      address: { ...editLocationData.address, city: e.target.value }
                    })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">State</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editLocationData.address.state}
                    onChange={(e) => setEditLocationData({
                      ...editLocationData,
                      address: { ...editLocationData.address, state: e.target.value }
                    })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">PIN Code</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editLocationData.address.postalCode}
                    onChange={(e) => setEditLocationData({
                      ...editLocationData,
                      address: { ...editLocationData.address, postalCode: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingLocation(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                >
                  {submitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationsPage;
