import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Plus,
  Search,
  Filter,
  Eye,
  RefreshCw,
  X,
  CheckCircle,
  Clock,
  Layers,
  MapPin,
  Tag,
  DollarSign,
  Calendar,
  AlertCircle,
  Edit2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Wrench,
  TrendingUp,
  Activity,
} from 'lucide-react';

const AssetsPage = () => {
  const { user } = useAuth();
  const canManageAssets = user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER';
  const [searchParams, setSearchParams] = useSearchParams();
  const [assets, setAssets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '');
  const [riskFilter, setRiskFilter] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    department: '',
    physicalCondition: 'GOOD',
    make: '',
    model: '',
    serialNumber: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const openEditAsset = (asset) => {
    setEditingAsset(asset);
    setEditFormData({
      name: asset.name || '',
      department: asset.department || 'Roads & Buildings',
      physicalCondition: asset.physicalCondition || 'GOOD',
      make: asset.make || '',
      model: asset.model || '',
      serialNumber: asset.serialNumber || '',
    });
  };

  const handleUpdateAsset = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.put(`/assets/${editingAsset._id}`, editFormData);
      if (res.data?.success) {
        setEditingAsset(null);
        fetchAssets();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update asset');
    } finally {
      setSubmitting(false);
    }
  };

  // Clean form state with smart defaults
  const [newAsset, setNewAsset] = useState({
    name: '',
    category: 'HEAVY_MACHINERY',
    make: '',
    model: '',
    serialNumber: '',
    department: 'Roads & Buildings',
    physicalCondition: 'GOOD',
    currentLocation: '',
    procurement: {
      vendor: '',
      purchaseCost: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      warrantyExpiryDate: '',
    },
    specifications: {
      capacityOrRating: '',
      powerOrFuelType: 'DIESEL',
      manufacturingYear: new Date().getFullYear(),
    },
  });

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      if (locationFilter) params.location = locationFilter;

      const [res, locRes] = await Promise.all([
        api.get('/assets', { params }).catch(() => null),
        api.get('/locations').catch(() => null),
      ]);

      if (res?.data?.data?.assets) {
        setAssets(res.data.data.assets);
      }

      if (locRes?.data?.data?.locations) {
        setLocations(locRes.data.data.locations);
        if (locRes.data.data.locations.length > 0 && !newAsset.currentLocation) {
          setNewAsset((prev) => ({ ...prev, currentLocation: locRes.data.data.locations[0]._id }));
        }
      }
    } catch {
      // Keep existing
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const locParam = searchParams.get('location');
    if (locParam !== null && locParam !== locationFilter) {
      setLocationFilter(locParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchAssets();
  }, [categoryFilter, statusFilter, locationFilter]);

  const viewAssetTimeline = async (asset) => {
    setSelectedAsset(asset);
    try {
      const res = await api.get(`/assets/${asset._id}/timeline`).catch(() => null);
      if (res?.data?.data?.timeline) {
        setTimeline(res.data.data.timeline);
      } else {
        setTimeline([
          {
            _id: 't1',
            eventType: 'CREATED',
            title: 'Asset Added',
            description: `Registered with tag ${asset.assetTag}`,
            createdAt: asset.createdAt || new Date().toISOString(),
          },
        ]);
      }
    } catch {
      setTimeline([]);
    }
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const selectedLoc = newAsset.currentLocation || locations[0]?._id;
      if (!selectedLoc) {
        throw new Error('Please select or create a location first.');
      }

      const payload = {
        name: newAsset.name.trim(),
        category: newAsset.category,
        make: newAsset.make.trim(),
        model: newAsset.model.trim(),
        serialNumber: newAsset.serialNumber?.trim() || `SN-${Date.now().toString().slice(-6)}`,
        department: newAsset.department?.trim() || 'Roads & Buildings',
        physicalCondition: newAsset.physicalCondition || 'GOOD',
        currentLocation: selectedLoc,
        procurement: {
          vendor: newAsset.procurement.vendor?.trim() || newAsset.make?.trim() || 'Authorized Supplier',
          purchaseCost: Number(newAsset.procurement.purchaseCost) || 0,
          purchaseDate: newAsset.procurement.purchaseDate || new Date().toISOString(),
          warrantyExpiryDate: newAsset.procurement.warrantyExpiryDate || undefined,
        },
        specifications: {
          capacityOrRating: newAsset.specifications?.capacityOrRating || 'Standard',
          powerOrFuelType: newAsset.specifications?.powerOrFuelType || 'DIESEL',
          manufacturingYear: Number(newAsset.specifications?.manufacturingYear) || new Date().getFullYear(),
        },
      };

      const res = await api.post('/assets', payload);
      if (res.data?.success) {
        setShowAddModal(false);
        // Reset form
        setNewAsset({
          name: '',
          category: 'HEAVY_MACHINERY',
          make: '',
          model: '',
          serialNumber: '',
          department: 'Roads & Buildings',
          physicalCondition: 'GOOD',
          currentLocation: locations[0]?._id || '',
          procurement: {
            vendor: '',
            purchaseCost: '',
            purchaseDate: new Date().toISOString().split('T')[0],
            warrantyExpiryDate: '',
          },
          specifications: {
            capacityOrRating: '',
            powerOrFuelType: 'DIESEL',
            manufacturingYear: new Date().getFullYear(),
          },
        });
        fetchAssets();
      } else {
        throw new Error(res.data?.message || 'Failed to add asset');
      }
    } catch (err) {
      setFormError(err.message || 'Failed to add asset. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const fleetSummary = React.useMemo(() => {
    let totalValuation = 0;
    let totalMaintenance = 0;
    let highRisk = 0;
    let medRisk = 0;
    let lowRisk = 0;
    let totalWarnings = 0;

    assets.forEach((a) => {
      totalValuation += a.procurement?.purchaseCost || 0;
      totalMaintenance += a.totalMaintenanceCost || 0;
      const lvl = a.risk?.level;
      if (lvl === 'HIGH') highRisk++;
      else if (lvl === 'MEDIUM') medRisk++;
      else lowRisk++;
      totalWarnings += (a.warnings?.length || 0);
    });

    return { totalValuation, totalMaintenance, highRisk, medRisk, lowRisk, totalWarnings };
  }, [assets]);

  const formatCurrency = (val) => {
    if (!val || isNaN(val)) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  const filteredAssets = assets.filter((asset) => {
    if (riskFilter && asset.risk?.level !== riskFilter) return false;
    return true;
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Navbar
        title="Assets"
        subtitle="Manage equipment, road machinery, fleet and testing apparatus"
        actionLabel={canManageAssets ? "Add Asset" : undefined}
        actionIcon={Plus}
        onActionClick={() => {
          setFormError('');
          setShowAddModal(true);
        }}
      />

      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* KPI Metric Overview Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}>
          {/* Card 1: Total Fleet Valuation */}
          <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--color-primary-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
              flexShrink: 0,
            }}>
              <DollarSign size={22} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Fleet Valuation
              </div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-ink)', lineHeight: '1.2' }}>
                {formatCurrency(fleetSummary.totalValuation)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-body)', marginTop: '2px' }}>
                {assets.length} Active capital assets
              </div>
            </div>
          </div>

          {/* Card 2: Cumulative Maintenance Spend */}
          <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#EFF8FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#175CD3',
              flexShrink: 0,
            }}>
              <Wrench size={22} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Maint. Expenditure
              </div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-ink)', lineHeight: '1.2' }}>
                ₹{fleetSummary.totalMaintenance.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-body)', marginTop: '2px' }}>
                Lifetime service spend
              </div>
            </div>
          </div>

          {/* Card 3: Operational Risk Breakdown */}
          <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: fleetSummary.highRisk > 0 ? '#FEE4E2' : fleetSummary.medRisk > 0 ? '#FEF0C7' : '#EBFDF2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: fleetSummary.highRisk > 0 ? '#D92D20' : fleetSummary.medRisk > 0 ? '#B54708' : '#027A48',
              flexShrink: 0,
            }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Fleet Risk Profile
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#D92D20', backgroundColor: '#FEE4E2', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>
                  {fleetSummary.highRisk} High
                </span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#B54708', backgroundColor: '#FEF0C7', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>
                  {fleetSummary.medRisk} Med
                </span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#027A48', backgroundColor: '#EBFDF2', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>
                  {fleetSummary.lowRisk} Low
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-body)', marginTop: '4px' }}>
                Live reliability indexing
              </div>
            </div>
          </div>

          {/* Card 4: Compliance & Alerts */}
          <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#FEF0C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#B54708',
              flexShrink: 0,
            }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Compliance & Alerts
              </div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-ink)', lineHeight: '1.2' }}>
                {fleetSummary.totalWarnings} Active
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-body)', marginTop: '2px' }}>
                Warranty, AMC & repair flags
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="card" style={{ padding: '18px 24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-on-surface-subtle)' }} />
            <input
              type="text"
              placeholder="Search by tag, name, make, model or serial number..."
              className="input-field"
              style={{ paddingLeft: '38px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchAssets()}
            />
          </div>

          <div style={{ width: '200px' }}>
            <select
              className="input-field"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="HEAVY_MACHINERY">Heavy Machinery</option>
              <option value="FLEET_VEHICLE">Fleet &amp; Vehicles</option>
              <option value="TOOLS_AND_APPARATUS">Testing &amp; Survey Tools</option>
              <option value="ELECTRICAL_EQUIPMENT">Generators &amp; Electrical</option>
              <option value="HVAC_AND_FACILITIES">Building Facilities</option>
              <option value="WAREHOUSE_EQUIPMENT">Warehouse Equipment</option>
              <option value="OFFICE_INFRASTRUCTURE">Office Equipment</option>
            </select>
          </div>

          <div style={{ width: '160px' }}>
            <select
              className="input-field"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
            >
              <option value="">All Risk Profiles</option>
              <option value="HIGH">High Risk Only</option>
              <option value="MEDIUM">Medium Risk Only</option>
              <option value="LOW">Low Risk Only</option>
            </select>
          </div>

          <div style={{ width: '160px' }}>
            <select
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="IN_USE">In Use</option>
              <option value="UNDER_MAINTENANCE">Under Maintenance</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="CONDEMNED">Condemned</option>
            </select>
          </div>

          <div style={{ width: '200px' }}>
            <select
              className="input-field"
              value={locationFilter}
              onChange={(e) => {
                const val = e.target.value;
                setLocationFilter(val);
                if (val) {
                  setSearchParams({ location: val });
                } else {
                  setSearchParams({});
                }
              }}
            >
              <option value="">All Sites &amp; Depots</option>
              {locations.map((loc) => (
                <option key={loc._id} value={loc._id}>
                  {loc.siteName}
                </option>
              ))}
            </select>
          </div>

          {(search || categoryFilter || riskFilter || statusFilter || locationFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setCategoryFilter('');
                setRiskFilter('');
                setStatusFilter('');
                setLocationFilter('');
                setSearchParams({});
              }}
              className="btn btn-secondary"
              style={{ fontSize: '13px' }}
            >
              Reset
            </button>
          )}

          <button onClick={fetchAssets} className="btn btn-secondary">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Data Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '160px', whiteSpace: 'nowrap' }}>Asset Tag</th>
                <th>Equipment Name</th>
                <th>Category</th>
                <th>Make &amp; Model</th>
                <th>Site / Location</th>
                <th>Status</th>
                <th>Risk Profile</th>
                <th>Maint. Spend</th>
                <th>Advisories</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '32px', color: 'var(--color-muted)' }}>
                    No matching assets found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset._id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        fontWeight: '600',
                        letterSpacing: '0.02em',
                        whiteSpace: 'nowrap',
                        color: 'var(--color-primary)',
                        backgroundColor: 'var(--color-primary-subtle)',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-pill)',
                        border: '1px solid rgba(0, 82, 255, 0.2)',
                      }}>
                        {asset.assetTag}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--color-ink)' }}>{asset.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                        S/N: {asset.serialNumber || 'N/A'} • {asset.physicalCondition || 'GOOD'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: 'var(--color-body)' }}>
                        {asset.category?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', color: 'var(--color-ink)' }}>{asset.make}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{asset.model}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--color-body)' }}>
                        <MapPin size={13} color="var(--color-primary)" />
                        <span>{asset.currentLocation?.siteName || 'Main Depot'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${asset.status?.toLowerCase()}`}>
                        {asset.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    {/* Risk Profile Column */}
                    <td>
                      {asset.risk?.level === 'HIGH' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '11px',
                          fontWeight: '700',
                          letterSpacing: '0.02em',
                          backgroundColor: '#FEE4E2',
                          color: '#D92D20',
                          border: '1px solid #FECDCA',
                          whiteSpace: 'nowrap',
                        }} title={asset.risk?.factors?.join(', ')}>
                          <ShieldAlert size={12} />
                          HIGH ({asset.risk?.score || 75})
                        </span>
                      ) : asset.risk?.level === 'MEDIUM' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '11px',
                          fontWeight: '700',
                          letterSpacing: '0.02em',
                          backgroundColor: '#FEF0C7',
                          color: '#B54708',
                          border: '1px solid #FEDF89',
                          whiteSpace: 'nowrap',
                        }} title={asset.risk?.factors?.join(', ')}>
                          <AlertTriangle size={12} />
                          MED ({asset.risk?.score || 40})
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '11px',
                          fontWeight: '700',
                          letterSpacing: '0.02em',
                          backgroundColor: '#EBFDF2',
                          color: '#027A48',
                          border: '1px solid #A6F4C5',
                          whiteSpace: 'nowrap',
                        }} title={asset.risk?.factors?.join(', ') || 'Optimal operating condition'}>
                          <ShieldCheck size={12} />
                          LOW ({asset.risk?.score || 15})
                        </span>
                      )}
                    </td>
                    {/* Maintenance Spend Column */}
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--color-ink)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {asset.totalMaintenanceCost > 0
                          ? `₹${asset.totalMaintenanceCost.toLocaleString('en-IN')}`
                          : '₹0'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                        {asset.maintenanceCostRatio > 0
                          ? `${asset.maintenanceCostRatio}% CapEx`
                          : `${asset.maintenanceTicketCount || 0} order${asset.maintenanceTicketCount === 1 ? '' : 's'}`}
                      </div>
                    </td>
                    {/* Advisories Column */}
                    <td>
                      {(!asset.warnings || asset.warnings.length === 0) ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          color: '#027A48',
                          backgroundColor: '#EBFDF2',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-pill)',
                          border: '1px solid #A6F4C5',
                          whiteSpace: 'nowrap',
                        }}>
                          <CheckCircle size={11} />
                          Healthy
                        </span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {asset.warnings.slice(0, 1).map((w, idx) => (
                            <span
                              key={idx}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                fontWeight: '600',
                                color: w.severity === 'critical' ? '#B42318' : w.severity === 'warning' ? '#B54708' : '#344054',
                                backgroundColor: w.severity === 'critical' ? '#FEE4E2' : w.severity === 'warning' ? '#FEF0C7' : '#F2F4F7',
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-pill)',
                                border: `1px solid ${w.severity === 'critical' ? '#FECDCA' : w.severity === 'warning' ? '#FEDF89' : '#EAECF0'}`,
                                whiteSpace: 'nowrap',
                                maxWidth: '160px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title={w.message}
                            >
                              <AlertTriangle size={10} />
                              {w.message}
                            </span>
                          ))}
                          {asset.warnings.length > 1 && (
                            <span style={{ fontSize: '10px', color: 'var(--color-muted)', fontWeight: '600' }}>
                              +{asset.warnings.length - 1} more alert{asset.warnings.length - 1 > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    {/* Actions Column */}
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => viewAssetTimeline(asset)}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '6px 12px', whiteSpace: 'nowrap' }}
                        >
                          <Eye size={14} />
                          <span>Timeline</span>
                        </button>
                        {canManageAssets && (
                          <button
                            onClick={() => openEditAsset(asset)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 12px' }}
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Timeline Modal */}
      {selectedAsset && (
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
          <div className="card" style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span className="badge badge-in_transit" style={{ marginBottom: '8px' }}>
                  {selectedAsset.assetTag}
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: '700' }}>{selectedAsset.name}</h2>
                <p style={{ fontSize: '13px', color: 'var(--color-on-surface-muted)' }}>
                  {selectedAsset.make} • {selectedAsset.model}
                </p>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                style={{ background: 'transparent', border: 'none', color: '#98A2B3', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Spec Highlights */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-surface-soft)',
              border: '1px solid var(--color-hairline)',
              marginBottom: '20px',
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Location</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)' }}>{selectedAsset.currentLocation?.siteName || 'Depot'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Purchase Cost</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-primary)' }}>
                  ₹{(selectedAsset.procurement?.purchaseCost || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Supplier / Vendor</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)' }}>
                  {selectedAsset.procurement?.vendor || 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Department</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)' }}>
                  {selectedAsset.department || 'Roads & Buildings'}
                </div>
              </div>
            </div>

            {/* Fleet Risk, Maintenance Expenditure & Compliance Diagnostics Panel */}
            <div style={{
              padding: '18px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: selectedAsset.risk?.level === 'HIGH' ? '#FEF3F2' : selectedAsset.risk?.level === 'MEDIUM' ? '#FFFAEB' : '#F6FEF9',
              border: `1px solid ${selectedAsset.risk?.level === 'HIGH' ? '#FECDCA' : selectedAsset.risk?.level === 'MEDIUM' ? '#FEDF89' : '#D1FADF'}`,
              marginBottom: '24px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {selectedAsset.risk?.level === 'HIGH' ? (
                    <ShieldAlert size={18} color="#D92D20" />
                  ) : selectedAsset.risk?.level === 'MEDIUM' ? (
                    <AlertTriangle size={18} color="#B54708" />
                  ) : (
                    <ShieldCheck size={18} color="#027A48" />
                  )}
                  <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--color-ink)' }}>
                    Fleet Reliability & Risk Assessment
                  </span>
                </div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '12px',
                  fontWeight: '700',
                  backgroundColor: selectedAsset.risk?.level === 'HIGH' ? '#FEE4E2' : selectedAsset.risk?.level === 'MEDIUM' ? '#FEF0C7' : '#EBFDF2',
                  color: selectedAsset.risk?.level === 'HIGH' ? '#D92D20' : selectedAsset.risk?.level === 'MEDIUM' ? '#B54708' : '#027A48',
                }}>
                  {selectedAsset.risk?.level || 'LOW'} RISK ({selectedAsset.risk?.score || 15}/100)
                </span>
              </div>

              {/* Identified Risk Factors */}
              {selectedAsset.risk?.factors && selectedAsset.risk.factors.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-muted)', marginBottom: '6px', letterSpacing: '0.04em' }}>
                    IDENTIFIED RISK DRIVERS:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {selectedAsset.risk.factors.map((factor, idx) => (
                      <div key={idx} style={{ fontSize: '12px', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: selectedAsset.risk?.level === 'HIGH' ? '#D92D20' : '#B54708', flexShrink: 0 }} />
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Maintenance Cost Tracker */}
              <div style={{
                backgroundColor: '#ffffff',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(0,0,0,0.06)',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                marginBottom: '14px',
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Maint. Incurred</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-primary)' }}>
                    ₹{(selectedAsset.totalMaintenanceCost || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>CapEx Ratio</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: (selectedAsset.maintenanceCostRatio || 0) > 30 ? '#D92D20' : '#344054' }}>
                    {selectedAsset.maintenanceCostRatio || 0}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Repair Tickets</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-ink)' }}>
                    {selectedAsset.maintenanceTicketCount || 0} Total ({selectedAsset.openMaintenanceTickets || 0} Open)
                  </div>
                </div>
              </div>

              {/* Active Compliance & Warnings */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-muted)', marginBottom: '6px', letterSpacing: '0.04em' }}>
                  COMPLIANCE & OPERATIONAL ADVISORIES:
                </div>
                {(!selectedAsset.warnings || selectedAsset.warnings.length === 0) ? (
                  <div style={{ fontSize: '12px', color: '#027A48', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', backgroundColor: '#ffffff', borderRadius: '6px' }}>
                    <CheckCircle size={14} />
                    All safety certificates, warranties, and maintenance orders are in good standing.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedAsset.warnings.map((w, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 10px',
                        backgroundColor: '#ffffff',
                        borderRadius: '6px',
                        border: `1px solid ${w.severity === 'critical' ? '#FECDCA' : w.severity === 'warning' ? '#FEDF89' : '#EAECF0'}`,
                        fontSize: '12px',
                        color: w.severity === 'critical' ? '#B42318' : w.severity === 'warning' ? '#B54708' : '#344054',
                      }}>
                        <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                        <span style={{ fontWeight: '600' }}>[{w.type?.replace(/_/g, ' ')}]:</span>
                        <span>{w.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '14px', color: 'var(--color-ink)' }}>
              Asset Timeline
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {timeline.length === 0 ? (
                <div style={{ color: 'var(--color-muted)', fontSize: '13px' }}>
                  No historical event recorded yet.
                </div>
              ) : (
                timeline.map((event) => (
                  <div key={event._id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary)',
                      marginTop: '6px',
                    }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)' }}>{event.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-body)' }}>{event.description}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '2px' }}>
                        {new Date(event.createdAt).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      {showAddModal && (
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
          <div className="card" style={{ width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Add Asset</h2>
                <p style={{ fontSize: '12px', color: 'var(--color-on-surface-muted)' }}>
                  Fill in the equipment details. A unique tag will be auto-generated.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#98A2B3', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-error-bg)',
                border: '1px solid rgba(240, 68, 56, 0.3)',
                color: '#FFA39E',
                fontSize: '13px',
                marginBottom: '16px',
              }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddAsset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Asset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Road Roller, Motor Grader, Heavy Dump Truck"
                  className="input-field"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Category</label>
                  <select
                    className="input-field"
                    value={newAsset.category}
                    onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
                  >
                    <option value="HEAVY_MACHINERY">Heavy Machinery</option>
                    <option value="FLEET_VEHICLE">Fleet &amp; Vehicles</option>
                    <option value="TOOLS_AND_APPARATUS">Testing &amp; Survey Tools</option>
                    <option value="ELECTRICAL_EQUIPMENT">Generators &amp; Electrical</option>
                    <option value="HVAC_AND_FACILITIES">Building Facilities</option>
                    <option value="OFFICE_INFRASTRUCTURE">Office Equipment</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Location / Site</label>
                  <select
                    className="input-field"
                    value={newAsset.currentLocation}
                    onChange={(e) => setNewAsset({ ...newAsset, currentLocation: e.target.value })}
                  >
                    {locations.map((loc) => (
                      <option key={loc._id} value={loc._id}>
                        {loc.siteName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Manufacturer / Make</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Caterpillar, JCB, Tata Motors"
                    className="input-field"
                    value={newAsset.make}
                    onChange={(e) => setNewAsset({ ...newAsset, make: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Model Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 120 GC, 3DX Super, Signa 2823"
                    className="input-field"
                    value={newAsset.model}
                    onChange={(e) => setNewAsset({ ...newAsset, model: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Serial / Chassis Number</label>
                  <input
                    type="text"
                    placeholder="e.g. SN-ROL-101, SN-GRD-401"
                    className="input-field"
                    value={newAsset.serialNumber}
                    onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Initial Condition</label>
                  <select
                    className="input-field"
                    value={newAsset.physicalCondition}
                    onChange={(e) => setNewAsset({ ...newAsset, physicalCondition: e.target.value })}
                  >
                    <option value="BRAND_NEW">Brand New</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="NEEDS_REPAIR">Needs Repair</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Supplier / Vendor</label>
                  <input
                    type="text"
                    placeholder="e.g. Authorized Dealer"
                    className="input-field"
                    value={newAsset.procurement.vendor}
                    onChange={(e) => setNewAsset({
                      ...newAsset,
                      procurement: { ...newAsset.procurement, vendor: e.target.value },
                    })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 450000"
                    className="input-field"
                    value={newAsset.procurement.purchaseCost}
                    onChange={(e) => setNewAsset({
                      ...newAsset,
                      procurement: { ...newAsset.procurement, purchaseCost: e.target.value },
                    })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Purchase Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={newAsset.procurement.purchaseDate}
                    onChange={(e) => setNewAsset({
                      ...newAsset,
                      procurement: { ...newAsset.procurement, purchaseDate: e.target.value },
                    })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Department</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newAsset.department}
                    onChange={(e) => setNewAsset({ ...newAsset, department: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-lg"
                style={{ marginTop: '10px' }}
              >
                {submitting ? 'Saving Asset...' : 'Save Asset'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {editingAsset && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '24px',
          backdropFilter: 'blur(3px)',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span className="badge badge-in_transit" style={{ marginBottom: '6px' }}>{editingAsset.assetTag}</span>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)' }}>Modify Asset Specifications</h2>
              </div>
              <button
                onClick={() => setEditingAsset(null)}
                style={{ background: 'transparent', border: 'none', color: '#98A2B3', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateAsset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Asset Title / Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Make / Manufacturer</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={editFormData.make}
                    onChange={(e) => setEditFormData({ ...editFormData, make: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Model</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={editFormData.model}
                    onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Serial Number</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editFormData.serialNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, serialNumber: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Department</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Physical Health Condition</label>
                <select
                  className="input-field"
                  value={editFormData.physicalCondition}
                  onChange={(e) => setEditFormData({ ...editFormData, physicalCondition: e.target.value })}
                >
                  <option value="EXCELLENT">EXCELLENT</option>
                  <option value="GOOD">GOOD</option>
                  <option value="FAIR">FAIR</option>
                  <option value="POOR">POOR</option>
                  <option value="DAMAGED">DAMAGED</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingAsset(null)}
                  className="btn btn-outline"
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
                  {submitting ? 'Saving Changes...' : 'Update Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetsPage;
