import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  MapPin,
  Wrench,
  ShieldCheck,
  AlertCircle,
  Activity,
  Layers,
  ArrowUpRight,
  Info,
} from 'lucide-react';

const formatINR = (val) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
};

const formatFullINR = (val) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
};

const CATEGORY_META = {
  HEAVY_MACHINERY: { name: 'Heavy Machinery & Earthmovers', color: '#175CD3', bg: '#EFF8FF' },
  FLEET_VEHICLE: { name: 'Site Fleet & Transport', color: '#027A48', bg: '#EBFDF2' },
  HVAC_AND_FACILITIES: { name: 'Civil & HVAC Facilities', color: '#B54708', bg: '#FEF0C7' },
  ELECTRICAL_EQUIPMENT: { name: 'Electrical & Power DG Sets', color: '#7A5AF8', bg: '#F4F3FF' },
  TOOLS_AND_APPARATUS: { name: 'Survey & Testing Apparatus', color: '#EE46BC', bg: '#FDF2FA' },
  WAREHOUSE_EQUIPMENT: { name: 'Depot & Storage Logistics', color: '#363F72', bg: '#F2F4F7' },
  OFFICE_INFRASTRUCTURE: { name: 'Institutional IT & Plotters', color: '#475467', bg: '#F9FAFB' },
};

const CONDITION_COLORS = {
  BRAND_NEW: { color: '#027A48', bg: '#EBFDF2', label: 'Brand New', weight: 1.0 },
  GOOD: { color: '#12B76A', bg: '#ECFDF3', label: 'Good', weight: 0.9 },
  FAIR: { color: '#F79009', bg: '#FFFAEB', label: 'Fair', weight: 0.7 },
  NEEDS_REPAIR: { color: '#F04438', bg: '#FEF3F2', label: 'Needs Repair', weight: 0.4 },
  DAMAGED: { color: '#B42318', bg: '#FEE4E2', label: 'Critical / Damaged', weight: 0.1 },
};

const TYPE_META = {
  BREAKDOWN_REPAIR: { label: 'Breakdown Repairs', color: '#F04438', bg: '#FEF3F2' },
  PREVENTIVE_SCHEDULED: { label: 'Scheduled Preventive', color: '#175CD3', bg: '#EFF8FF' },
  CALIBRATION: { label: 'NABL Calibration', color: '#7A5AF8', bg: '#F4F3FF' },
  INSPECTION: { label: 'Routine Inspection', color: '#027A48', bg: '#EBFDF2' },
  UPGRADE: { label: 'Refurbishment / Upgrade', color: '#B54708', bg: '#FEF0C7' },
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Monthly Trends Chart (SVG Area Curve + Bar Hybrid)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const MonthlyTrendChart = ({ trends = [] }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!trends || trends.length === 0) return null;

  const width = 640;
  const height = 220;
  const padding = { top: 25, right: 30, bottom: 40, left: 60 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const maxSpend = Math.max(...trends.map((t) => t.spend || 0), 100000);
  const maxTickets = Math.max(...trends.map((t) => t.tickets || 0), 12);

  // Generate SVG path points
  const points = trends.map((t, idx) => {
    const x = padding.left + (idx / (trends.length - 1)) * graphWidth;
    const y = padding.top + graphHeight - ((t.spend || 0) / maxSpend) * graphHeight;
    return { x, y, data: t, idx };
  });

  // Smooth bezier curve path
  const pathD = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = arr[i - 1];
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C ${cx},${prev.y} ${cx},${pt.y} ${pt.x},${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x},${padding.top + graphHeight} L ${points[0].x},${padding.top + graphHeight} Z`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#101828' }}>Maintenance Expenditure &amp; Work Volume</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#EFF8FF', color: '#175CD3', fontWeight: '600' }}>6-Month Horizon</span>
          </div>
          <p style={{ fontSize: '12px', color: '#667085', margin: '2px 0 0 0' }}>Cumulative parts replacement, dealer servicing, and labor cost distribution</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', fontWeight: '500' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(23, 92, 211, 0.15)', border: '1.5px solid #175CD3' }} />
            <span style={{ color: '#344054' }}>Monthly Spend (₹)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#027A48' }} />
            <span style={{ color: '#344054' }}>Tickets Raised</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block', minWidth: '480px' }}
        >
          <defs>
            <linearGradient id="spendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#175CD3" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#175CD3" stopOpacity="0.01" />
            </linearGradient>
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" floodColor="#175CD3" />
            </filter>
          </defs>

          {/* Horizontal gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding.top + graphHeight * (1 - ratio);
            const val = Math.round(maxSpend * ratio);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#EAECF0"
                  strokeDasharray={i === 0 ? 'none' : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fontWeight="500"
                  fill="#98A2B3"
                  fontFamily="sans-serif"
                >
                  ₹{(val / 1000).toFixed(0)}k
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill="url(#spendGradient)" />

          {/* Line stroke */}
          <path d={pathD} fill="none" stroke="#175CD3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data columns & interactive hover points */}
          {points.map((pt, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Vertical hover crosshair */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={padding.top}
                    x2={pt.x}
                    y2={padding.top + graphHeight}
                    stroke="#175CD3"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.6"
                  />
                )}

                {/* Point circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  fill="#FFFFFF"
                  stroke="#175CD3"
                  strokeWidth={isHovered ? 3 : 2}
                  filter="url(#shadow)"
                  style={{ transition: 'all 0.15s ease' }}
                />

                {/* Secondary Work Order indicator pill */}
                <circle
                  cx={pt.x}
                  cy={padding.top + graphHeight - ((pt.data.tickets || 0) / maxTickets) * (graphHeight * 0.45)}
                  r="3.5"
                  fill="#027A48"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />

                {/* X Axis Label */}
                <text
                  x={pt.x}
                  y={height - 12}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={isHovered ? '700' : '500'}
                  fill={isHovered ? '#175CD3' : '#667085'}
                  fontFamily="sans-serif"
                >
                  {pt.data.month}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <div
            style={{
              position: 'absolute',
              left: `${(points[hoveredIdx].x / width) * 100}%`,
              top: `${Math.max(10, (points[hoveredIdx].y / height) * 100 - 35)}%`,
              transform: 'translate(-50%, -100%)',
              backgroundColor: '#101828',
              color: '#FFFFFF',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '11px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
              pointerEvents: 'none',
              zIndex: 10,
              minWidth: '130px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontWeight: '700', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '4px', marginBottom: '4px' }}>
              {points[hoveredIdx].data.month}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', color: '#98A2B3' }}>
              <span>Spend:</span>
              <strong style={{ color: '#53B1FD' }}>{formatFullINR(points[hoveredIdx].data.spend)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', color: '#98A2B3' }}>
              <span>Work Orders:</span>
              <strong style={{ color: '#75E0A7' }}>{points[hoveredIdx].data.tickets} tickets</strong>
            </div>
          </div>
        )}
      </div>

      {/* Summary KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', paddingTop: '10px', borderTop: '1px solid #EAECF0' }}>
        <div style={{ padding: '10px', backgroundColor: '#F8F9FC', borderRadius: '8px' }}>
          <span style={{ fontSize: '11px', color: '#667085', fontWeight: '500' }}>6-Mo Total Spend</span>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#175CD3', marginTop: '2px' }}>
            {formatINR(trends.reduce((s, t) => s + (t.spend || 0), 0))}
          </div>
        </div>
        <div style={{ padding: '10px', backgroundColor: '#F8F9FC', borderRadius: '8px' }}>
          <span style={{ fontSize: '11px', color: '#667085', fontWeight: '500' }}>Monthly Run-Rate</span>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#101828', marginTop: '2px' }}>
            {formatINR(Math.round(trends.reduce((s, t) => s + (t.spend || 0), 0) / (trends.length || 1)))}
          </div>
        </div>
        <div style={{ padding: '10px', backgroundColor: '#F8F9FC', borderRadius: '8px' }}>
          <span style={{ fontSize: '11px', color: '#667085', fontWeight: '500' }}>Completed Orders</span>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#027A48', marginTop: '2px' }}>
            {trends.reduce((s, t) => s + (t.resolved || 0), 0)} Resolved
          </div>
        </div>
        <div style={{ padding: '10px', backgroundColor: '#F8F9FC', borderRadius: '8px' }}>
          <span style={{ fontSize: '11px', color: '#667085', fontWeight: '500' }}>Peak Spend Period</span>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#B54708', marginTop: '2px' }}>
            Sep 2026 (Monsoon)
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 2. Category & Capital Valuation Donut + Distribution Bars
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const CategoryDonutChart = ({ categoryValuation = [] }) => {
  const [selectedCat, setSelectedCat] = useState(null);

  if (!categoryValuation || categoryValuation.length === 0) return null;

  const totalValuation = categoryValuation.reduce((s, c) => s + (c.totalVal || 0), 0);
  const totalAssets = categoryValuation.reduce((s, c) => s + (c.count || 0), 0);

  // SVG Donut params
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const slices = categoryValuation.map((cat) => {
    const meta = CATEGORY_META[cat._id] || { name: cat._id, color: '#667085' };
    const pct = totalValuation > 0 ? (cat.totalVal || 0) / totalValuation : 0;
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeOffset;
    cumulativeOffset += pct * circumference;
    return {
      ...cat,
      name: meta.name,
      color: meta.color,
      pct: (pct * 100).toFixed(1),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#101828' }}>Capital Valuation Distribution</span>
          <p style={{ fontSize: '12px', color: '#667085', margin: '2px 0 0 0' }}>Procurement value allocation across equipment classes</p>
        </div>
        <span style={{ fontSize: '12px', fontWeight: '700', color: '#175CD3', padding: '3px 10px', borderRadius: '12px', backgroundColor: '#EFF8FF' }}>
          Total: {formatINR(totalValuation)}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '24px', alignItems: 'center' }}>
        {/* SVG Donut */}
        <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, margin: '0 auto' }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#F2F4F7"
              strokeWidth={strokeWidth}
            />
            {slices.map((slice) => {
              const isSelected = selectedCat === slice._id;
              return (
                <circle
                  key={slice._id}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={isSelected ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  strokeLinecap="butt"
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: selectedCat ? (isSelected ? 1 : 0.4) : 1,
                  }}
                  onMouseEnter={() => setSelectedCat(slice._id)}
                  onMouseLeave={() => setSelectedCat(null)}
                />
              );
            })}
          </svg>

          {/* Center Text */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#101828' }}>{totalAssets}</span>
            <span style={{ fontSize: '10px', fontWeight: '600', color: '#667085', textTransform: 'uppercase' }}>Assets</span>
          </div>
        </div>

        {/* Breakdown List with Visual Value Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {slices.map((slice) => {
            const isSelected = selectedCat === slice._id;
            return (
              <div
                key={slice._id}
                onMouseEnter={() => setSelectedCat(slice._id)}
                onMouseLeave={() => setSelectedCat(null)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: isSelected ? '#F8F9FC' : 'transparent',
                  border: isSelected ? `1px solid ${slice.color}` : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: slice.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', fontWeight: isSelected ? '700' : '600', color: '#101828' }}>
                      {slice.name}
                    </span>
                    <span style={{ fontSize: '11px', color: '#667085', backgroundColor: '#F2F4F7', padding: '1px 6px', borderRadius: '8px' }}>
                      {slice.count} units
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#101828' }}>{formatINR(slice.totalVal)}</span>
                    <span style={{ fontSize: '11px', color: '#667085', marginLeft: '6px' }}>({slice.pct}%)</span>
                  </div>
                </div>

                <div style={{ width: '100%', height: '5px', backgroundColor: '#EAECF0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${slice.pct}%`,
                      height: '100%',
                      backgroundColor: slice.color,
                      borderRadius: '999px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 3. Asset Health & Readiness Index
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const HealthRiskMatrix = ({ conditionDistribution = [] }) => {
  if (!conditionDistribution || conditionDistribution.length === 0) return null;

  const total = conditionDistribution.reduce((s, c) => s + (c.count || 0), 0) || 1;

  // Calculate Fleet Readiness Score (weighted out of 100)
  let weightedSum = 0;
  conditionDistribution.forEach((c) => {
    const meta = CONDITION_COLORS[c._id] || { weight: 0.5 };
    weightedSum += (c.count || 0) * meta.weight;
  });
  const healthScore = Math.round((weightedSum / total) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#101828' }}>Operational Health &amp; Availability</span>
          <p style={{ fontSize: '12px', color: '#667085', margin: '2px 0 0 0' }}>Field inspection rating &amp; readiness probability index</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#667085' }}>Health Score:</span>
          <span style={{
            fontSize: '13px',
            fontWeight: '800',
            color: healthScore >= 80 ? '#027A48' : healthScore >= 60 ? '#B54708' : '#B42318',
            backgroundColor: healthScore >= 80 ? '#EBFDF2' : healthScore >= 60 ? '#FEF0C7' : '#FEE4E2',
            padding: '2px 8px',
            borderRadius: '12px',
          }}>
            {healthScore}% Readiness
          </span>
        </div>
      </div>

      {/* Segmented Gradient Bar */}
      <div style={{ width: '100%', height: '14px', borderRadius: '7px', display: 'flex', overflow: 'hidden', backgroundColor: '#F2F4F7' }}>
        {conditionDistribution.map((c) => {
          const meta = CONDITION_COLORS[c._id] || { color: '#98A2B3', label: c._id };
          const pct = Math.round((c.count / total) * 100);
          if (pct === 0) return null;
          return (
            <div
              key={c._id}
              title={`${meta.label}: ${c.count} assets (${pct}%)`}
              style={{
                width: `${pct}%`,
                height: '100%',
                backgroundColor: meta.color,
                transition: 'width 0.3s ease',
              }}
            />
          );
        })}
      </div>

      {/* Condition Category Chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
        {conditionDistribution.map((c) => {
          const meta = CONDITION_COLORS[c._id] || { color: '#667085', bg: '#F2F4F7', label: c._id };
          const pct = Math.round((c.count / total) * 100);
          return (
            <div
              key={c._id}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                backgroundColor: meta.bg,
                border: `1px solid ${meta.color}20`,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: meta.color }}>{meta.label}</span>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#101828' }}>{c.count}</span>
              </div>
              <span style={{ fontSize: '10px', color: '#667085' }}>{pct}% of fleet</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 4. Location & Division Deployment Distribution
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const LocationDistributionChart = ({ locationDistribution = [] }) => {
  if (!locationDistribution || locationDistribution.length === 0) return null;

  const total = locationDistribution.reduce((s, l) => s + (l.count || 0), 0) || 1;
  const maxCount = Math.max(...locationDistribution.map((l) => l.count || 0), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#101828' }}>Divisional &amp; Site Allocation</span>
          <p style={{ fontSize: '12px', color: '#667085', margin: '2px 0 0 0' }}>Physical placement of machinery across state circles &amp; project camps</p>
        </div>
        <span style={{ fontSize: '11px', fontWeight: '600', color: '#175CD3', backgroundColor: '#EFF8FF', padding: '3px 8px', borderRadius: '12px' }}>
          {locationDistribution.length} Active Sites
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {locationDistribution.map((loc) => {
          const pct = Math.round(((loc.count || 0) / total) * 100);
          const barWidth = Math.round(((loc.count || 0) / maxCount) * 100);
          return (
            <div key={loc._id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={13} color="#175CD3" />
                  <span style={{ fontWeight: '600', color: '#101828' }}>{loc.siteName}</span>
                  <span style={{ fontSize: '10px', color: '#667085', backgroundColor: '#F2F4F7', padding: '1px 5px', borderRadius: '4px' }}>
                    {loc.city}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: '700', color: '#175CD3' }}>{loc.count} units</span>
                  <span style={{ color: '#98A2B3', fontSize: '11px' }}>({pct}%)</span>
                </div>
              </div>

              <div style={{ width: '100%', height: '6px', backgroundColor: '#F2F4F7', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${barWidth}%`,
                    height: '100%',
                    backgroundColor: '#175CD3',
                    borderRadius: '999px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 5. Maintenance Type & Expenditure Breakdown
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const MaintenanceTypeChart = ({ maintenanceByType = [] }) => {
  if (!maintenanceByType || maintenanceByType.length === 0) return null;

  const totalCost = maintenanceByType.reduce((s, m) => s + (m.totalCost || 0), 0);
  const totalTickets = maintenanceByType.reduce((s, m) => s + (m.count || 0), 0) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#101828' }}>Maintenance Nature &amp; Expense Distribution</span>
          <p style={{ fontSize: '12px', color: '#667085', margin: '2px 0 0 0' }}>Breakdown repairs vs preventive upkeep allocation</p>
        </div>
        <span style={{ fontSize: '12px', fontWeight: '700', color: '#B54708', backgroundColor: '#FEF0C7', padding: '3px 8px', borderRadius: '12px' }}>
          Total: {formatFullINR(totalCost)}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
        {maintenanceByType.map((item) => {
          const meta = TYPE_META[item._id] || { label: item._id, color: '#475467', bg: '#F8F9FC' };
          const countPct = Math.round(((item.count || 0) / totalTickets) * 100);
          const costPct = totalCost > 0 ? Math.round(((item.totalCost || 0) / totalCost) * 100) : 0;
          return (
            <div
              key={item._id}
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: meta.bg,
                border: `1px solid ${meta.color}25`,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: meta.color }}>{meta.label}</span>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#101828' }}>{item.count} tickets</span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#667085', marginBottom: '4px' }}>
                  <span>Expense: <strong style={{ color: '#101828' }}>{formatFullINR(item.totalCost)}</strong></span>
                  <span>{costPct}% spend</span>
                </div>
                <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${costPct}%`, height: '100%', backgroundColor: meta.color, borderRadius: '999px' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
