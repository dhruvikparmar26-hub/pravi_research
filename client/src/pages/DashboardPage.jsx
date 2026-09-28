import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/client';
import {
  Box,
  Truck,
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Filter,
} from 'lucide-react';
import {
  MonthlyTrendChart,
  CategoryDonutChart,
  HealthRiskMatrix,
  LocationDistributionChart,
  MaintenanceTypeChart,
} from '../components/AnalyticsCharts';

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [expirations, setExpirations] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyticsView, setAnalyticsView] = useState('ALL');

  // Fallback demo data if API is pending or offline
  const fallbackData = {
    quickCounts: {
      totalAssets: 20,
      activeAssets: 14,
      underMaintenance: 4,
      inTransit: 2,
      openTickets: 8,
      totalLocations: 4,
      totalUsers: 4,
    },
    assetStats: {
      byStatus: {
        IN_USE: 14,
        UNDER_MAINTENANCE: 4,
        IN_TRANSIT: 2,
      },
      byCondition: {
        GOOD: 10,
        BRAND_NEW: 5,
        FAIR: 3,
        NEEDS_REPAIR: 2,
      },
      byCategory: {
        HEAVY_MACHINERY: 8,
        FLEET_VEHICLE: 3,
        TOOLS_AND_APPARATUS: 3,
        ELECTRICAL_EQUIPMENT: 3,
        HVAC_AND_FACILITIES: 2,
        WAREHOUSE_EQUIPMENT: 1,
      },
    },
    financialSummary: {
      assetValue: {
        totalPurchaseCost: 75400000,
        assetCount: 20,
      },
      maintenanceCosts: {
        totalMaintenanceCost: 94100,
        ticketsClosed: 3,
      },
    },
    analyticsDistribution: {
      categoryValuation: [
        { _id: 'HEAVY_MACHINERY', count: 8, totalVal: 53300000 },
        { _id: 'FLEET_VEHICLE', count: 3, totalVal: 8900000 },
        { _id: 'HVAC_AND_FACILITIES', count: 2, totalVal: 5050000 },
        { _id: 'ELECTRICAL_EQUIPMENT', count: 3, totalVal: 3950000 },
        { _id: 'TOOLS_AND_APPARATUS', count: 3, totalVal: 2250000 },
        { _id: 'WAREHOUSE_EQUIPMENT', count: 1, totalVal: 1950000 },
      ],
      locationDistribution: [
        { _id: '1', siteName: 'Ahmedabad R&B Circle Headquarters', city: 'Ahmedabad', count: 9 },
        { _id: '2', siteName: 'Rajkot Mechanical Division & Central Workshop', city: 'Rajkot', count: 5 },
        { _id: '3', siteName: 'NH-48 Highway Widening Project Camp', city: 'Bharuch', count: 4 },
        { _id: '4', siteName: 'Gandhinagar Capital Project Division', city: 'Gandhinagar', count: 2 },
      ],
      maintenanceByType: [
        { _id: 'BREAKDOWN_REPAIR', count: 6, totalCost: 58000 },
        { _id: 'PREVENTIVE_SCHEDULED', count: 3, totalCost: 18100 },
        { _id: 'CALIBRATION', count: 1, totalCost: 18000 },
        { _id: 'INSPECTION', count: 1, totalCost: 0 },
      ],
      conditionDistribution: [
        { _id: 'BRAND_NEW', count: 5 },
        { _id: 'GOOD', count: 10 },
        { _id: 'FAIR', count: 3 },
        { _id: 'NEEDS_REPAIR', count: 2 },
      ],
      monthlyTrends: [
        { month: 'Apr 26', spend: 28500, tickets: 2, resolved: 2 },
        { month: 'May 26', spend: 45200, tickets: 4, resolved: 3 },
        { month: 'Jun 26', spend: 62000, tickets: 5, resolved: 4 },
        { month: 'Jul 26', spend: 38400, tickets: 3, resolved: 3 },
        { month: 'Aug 26', spend: 74200, tickets: 6, resolved: 5 },
        { month: 'Sep 26', spend: 94100, tickets: 11, resolved: 5 },
      ],
    },
  };

  const fallbackExpirations = [
    {
      _id: '1',
      assetTag: 'AST-HM-2026-0002',
      name: 'Asphalt Paver Machine',
      category: 'HEAVY_MACHINERY',
      procurement: { warrantyExpiryDate: '2026-10-15T00:00:00Z' },
      currentLocation: { siteName: 'NH-48 Widening Project Camp', building: 'Machinery Yard' },
    },
    {
      _id: '2',
      assetTag: 'AST-EL-2026-0007',
      name: 'Diesel Power Generator',
      category: 'ELECTRICAL_EQUIPMENT',
      procurement: { amcProvider: 'Kirloskar Care', amcExpiryDate: '2026-10-28T00:00:00Z' },
      currentLocation: { siteName: 'Gandhinagar Capital Project Division', building: 'Block-3 Basement' },
    },
    {
      _id: '3',
      assetTag: 'AST-TA-2026-0006',
      name: 'Digital Survey Station',
      category: 'TOOLS_AND_APPARATUS',
      procurement: { warrantyExpiryDate: '2026-11-05T00:00:00Z' },
      currentLocation: { siteName: 'Ahmedabad R&B Circle Headquarters', building: 'QC Survey Lab' },
    },
  ];

  const fallbackActivity = [
    {
      _id: 'e1',
      eventType: 'DISPATCHED',
      title: 'Gate Pass Dispatched',
      description: 'Road Roller dispatched to Surat Circle Heavy Equipment Depot',
      asset: { assetTag: 'AST-HM-2026-0001', name: 'Road Roller' },
      performedBy: { name: 'Er. V. K. Patel (Executive Engr)' },
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      _id: 'e2',
      eventType: 'MAINTENANCE_LOGGED',
      title: 'Work Order Resolved',
      description: 'Hydraulic hose replacement and engine oil filter changed (₹42,500)',
      asset: { assetTag: 'AST-HM-2026-0003', name: 'JCB Backhoe Loader' },
      performedBy: { name: 'M. S. Solanki (Technician)' },
      createdAt: new Date(Date.now() - 14400000).toISOString(),
    },
    {
      _id: 'e3',
      eventType: 'ASSIGNED',
      title: 'Custody Handover',
      description: 'Digital Survey Station handed over to Field Quality Control team',
      asset: { assetTag: 'AST-TA-2026-0006', name: 'Digital Survey Station' },
      performedBy: { name: 'Admin Console' },
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [overviewRes, expRes, actRes] = await Promise.all([
          api.get('/dashboard/overview').catch(() => null),
          api.get('/dashboard/expirations?days=90').catch(() => null),
          api.get('/dashboard/activity?limit=6').catch(() => null),
        ]);

        if (overviewRes?.data?.data) {
          setData(overviewRes.data.data);
        } else {
          setData(fallbackData);
        }

        if (expRes?.data?.data?.warrantyExpiring) {
          setExpirations([
            ...expRes.data.data.warrantyExpiring,
            ...(expRes.data.data.amcExpiring || []),
          ]);
        } else {
          setExpirations(fallbackExpirations);
        }

        if (actRes?.data?.data?.activities?.length) {
          setActivity(actRes.data.data.activities);
        } else {
          setActivity(fallbackActivity);
        }
      } catch {
        setData(fallbackData);
        setExpirations(fallbackExpirations);
        setActivity(fallbackActivity);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const counts = data?.quickCounts || fallbackData.quickCounts;
  const financial = data?.financialSummary || fallbackData.financialSummary;
  const analytics = data?.analyticsDistribution || fallbackData.analyticsDistribution;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Navbar
        title="Institutional Analytics & Operations Dashboard"
        subtitle="Real-time data distribution across capital investments, maintenance volume, and field equipment deployment"
      />

      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Top Metric Cards — 24px radius with hairline borders */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
        }}>
          {/* Card 1: Total Assets */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-muted)' }}>
                Total Assets
              </span>
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
            <div className="number-display" style={{ fontSize: '30px', color: 'var(--color-ink)' }}>
              {counts.totalAssets}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              Across {counts.totalLocations} Divisions &amp; Camps
            </div>
          </div>

          {/* Card 2: Active in Field */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-muted)' }}>
                Active in Field
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(5, 177, 105, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-semantic-up)',
              }}>
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="number-display" style={{ fontSize: '30px', color: 'var(--color-semantic-up)' }}>
              {counts.activeAssets}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              Operational on projects ({Math.round(((counts.activeAssets || 1) / (counts.totalAssets || 1)) * 100)}%)
            </div>
          </div>

          {/* Card 3: Under Maintenance */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-muted)' }}>
                Under Maintenance
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(244, 176, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#b78103',
              }}>
                <Wrench size={16} />
              </div>
            </div>
            <div className="number-display" style={{ fontSize: '30px', color: '#b78103' }}>
              {counts.underMaintenance}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              {counts.openTickets} active work orders
            </div>
          </div>

          {/* Card 4: In-Transit Gate Passes */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-muted)' }}>
                Gate Pass In-Transit
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(0, 82, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)',
              }}>
                <Truck size={16} />
              </div>
            </div>
            <div className="number-display" style={{ fontSize: '30px', color: 'var(--color-primary)' }}>
              {counts.inTransit}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              Inter-site transfers
            </div>
          </div>

          {/* Card 5: Valuation */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-muted)' }}>
                Total Valuation
              </span>
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
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="number-display" style={{ fontSize: '24px', color: 'var(--color-ink)' }}>
              {formatCurrency(financial?.assetValue?.totalPurchaseCost)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              Capital procurement value
            </div>
          </div>
        </div>

        {/* ─── Graphical Analytics Hub ─────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header & View Filter Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={18} color="var(--color-primary)" />
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)', margin: 0 }}>
                  Infrastructure Analytics &amp; Visual Distributions
                </h2>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '2px 0 0 0' }}>
                Multi-dimensional data distributions: Capital investment, maintenance volume, health index, and site allocation
              </p>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { key: 'ALL', label: 'All Visuals' },
                { key: 'TRENDS', label: 'Expenditure Trends' },
                { key: 'VALUATION', label: 'Capital Valuation' },
                { key: 'HEALTH', label: 'Fleet Health' },
                { key: 'LOCATIONS', label: 'Divisional Sites' },
                { key: 'NATURE', label: 'Work Order Types' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setAnalyticsView(tab.key)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '12px',
                    fontWeight: analyticsView === tab.key ? '700' : '500',
                    border: '1px solid',
                    borderColor: analyticsView === tab.key ? 'var(--color-primary)' : 'var(--color-hairline)',
                    backgroundColor: analyticsView === tab.key ? 'var(--color-primary-subtle)' : 'var(--color-canvas)',
                    color: analyticsView === tab.key ? 'var(--color-primary)' : 'var(--color-body)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Visual Charts Row: Trends & Valuation */}
          {(analyticsView === 'ALL' || analyticsView === 'TRENDS' || analyticsView === 'VALUATION') && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: analyticsView === 'ALL' ? '3fr 2fr' : '1fr',
              gap: '20px',
            }}>
              {(analyticsView === 'ALL' || analyticsView === 'TRENDS') && (
                <div className="card" style={{ padding: '22px' }}>
                  <MonthlyTrendChart trends={analytics?.monthlyTrends || []} />
                </div>
              )}

              {(analyticsView === 'ALL' || analyticsView === 'VALUATION') && (
                <div className="card" style={{ padding: '22px' }}>
                  <CategoryDonutChart categoryValuation={analytics?.categoryValuation || []} />
                </div>
              )}
            </div>
          )}

          {/* Secondary Visual Charts Row: Health & Divisional Allocation */}
          {(analyticsView === 'ALL' || analyticsView === 'HEALTH' || analyticsView === 'LOCATIONS' || analyticsView === 'NATURE') && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: analyticsView === 'ALL' ? '1fr 1fr' : '1fr',
              gap: '20px',
            }}>
              {(analyticsView === 'ALL' || analyticsView === 'HEALTH') && (
                <div className="card" style={{ padding: '22px' }}>
                  <HealthRiskMatrix conditionDistribution={analytics?.conditionDistribution || []} />
                </div>
              )}

              {(analyticsView === 'ALL' || analyticsView === 'LOCATIONS') && (
                <div className="card" style={{ padding: '22px' }}>
                  <LocationDistributionChart locationDistribution={analytics?.locationDistribution || []} />
                </div>
              )}

              {(analyticsView === 'ALL' || analyticsView === 'NATURE') && (
                <div className="card" style={{ padding: '22px', gridColumn: analyticsView === 'ALL' ? 'span 2' : 'span 1' }}>
                  <MaintenanceTypeChart maintenanceByType={analytics?.maintenanceByType || []} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Bottom Section: Expiration Alerts & Live Telemetry Feed ──────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Warranty & AMC Expirations */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="var(--color-accent-yellow)" />
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)', margin: 0 }}>
                  Upcoming Expirations (90 Days)
                </h3>
              </div>
              <span className="badge badge-under_maintenance" style={{ fontSize: '11px' }}>
                {expirations.length} Pending Actions
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {expirations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-muted)', fontSize: '13px' }}>
                  No contracts expiring in the next 90 days.
                </div>
              ) : (
                expirations.map((item) => {
                  const expiryDate = item.procurement?.warrantyExpiryDate || item.procurement?.amcExpiryDate;
                  const formattedDate = expiryDate ? new Date(expiryDate).toLocaleDateString('en-IN') : 'N/A';
                  return (
                    <div
                      key={item._id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-surface-soft)',
                        border: '1px solid var(--color-hairline)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            fontWeight: '700',
                            color: 'var(--color-primary)',
                          }}>
                            {item.assetTag}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)' }}>
                            {item.name}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '2px' }}>
                          📍 {item.currentLocation?.siteName || 'Depot'} • {item.procurement?.amcProvider ? `AMC: ${item.procurement.amcProvider}` : 'OEM Warranty'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#b78103' }}>
                          Expires: {formattedDate}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Live Telemetry Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-semantic-up)',
                  boxShadow: '0 0 6px rgba(5, 177, 105, 0.4)',
                }} />
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-ink)', margin: 0 }}>
                  Live Department Telemetry
                </h3>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                padding: '3px 8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--color-surface-soft)',
                border: '1px solid var(--color-hairline)',
                color: 'var(--color-body)',
              }}>
                Real-Time
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activity.map((act) => (
                <div
                  key={act._id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface-soft)',
                    border: '1px solid var(--color-hairline)',
                  }}
                >
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                    marginTop: '6px',
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-ink)' }}>
                        {act.title}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                        {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-body)', marginTop: '2px' }}>
                      {act.description}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-primary)', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>
                      {act.asset?.assetTag} • By {act.performedBy?.name || 'Engineer'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
