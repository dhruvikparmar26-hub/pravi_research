import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Navbar from '../components/Navbar';
import api from '../api/client';
import {
  MapPin,
  Building2,
  Box,
  User,
  Search,
  ExternalLink,
  Layers,
  ArrowRightLeft,
  Navigation,
  RefreshCw,
  Compass,
  CheckCircle2,
} from 'lucide-react';

const GUJARAT_CENTER = [22.8, 71.8];
const DEFAULT_ZOOM = 7.5;

const MapPage = () => {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'ACTIVE_ASSETS' | 'EMPTY'
  const [mapStyle, setMapStyle] = useState('osm'); // 'osm' | 'hot'
  const tileLayerRef = useRef(null);

  // 1. Fetch real locations with live asset counts from MongoDB
  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/locations');
      if (res?.data?.data?.locations) {
        setLocations(res.data.data.locations);
      }
    } catch (err) {
      console.error('Failed to fetch map locations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: GUJARAT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false, // We'll render our own Coinbase-styled controls
      attributionControl: false,
    });

    // Original real-world OpenStreetMap tiles (100% free, zero API key required)
    const tileLayer = L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    // Ensure map tiles invalidate and resize to full static container
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch Tile Layer
  const toggleMapStyle = (style) => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    let newLayer;
    if (style === 'hot') {
      newLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      });
    } else {
      newLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      });
    }
    newLayer.addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
    setMapStyle(style);
  };

  // 3. Update Markers when locations or selection change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    locations.forEach((loc) => {
      const lat = loc.coordinates?.latitude || 23.0225;
      const lng = loc.coordinates?.longitude || 72.5714;
      const isSelected = selectedLocation?._id === loc._id;
      const assetCount = loc.assetCount || 0;
      const hasAssets = assetCount > 0;

      // Custom DivIcon matching Coinbase Institutional style
      const customIcon = L.divIcon({
        className: 'custom-facility-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            ${hasAssets ? `
              <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(0, 82, 255, 0.18); animation: pulse-ring 2.2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;"></div>
            ` : ''}
            <div style="
              width: ${isSelected ? '36px' : '32px'};
              height: ${isSelected ? '36px' : '32px'};
              border-radius: 50%;
              background-color: ${isSelected ? '#0052ff' : hasAssets ? '#0052ff' : '#475467'};
              border: 3px solid #ffffff;
              box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-weight: 700;
              font-size: 13px;
              font-family: var(--font-mono, monospace);
              transition: all 0.2s ease;
            ">
              ${assetCount}
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -22],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      // Custom Popup HTML
      const popupHtml = `
        <div style="padding: 16px 18px; min-width: 260px; font-family: 'Inter', -apple-system, sans-serif;">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 8px;">
            <div style="font-size: 14px; font-weight: 700; color: #0a0b0d; line-height: 1.3;">
              ${loc.siteName}
            </div>
            <span style="
              font-size: 11px;
              font-weight: 600;
              padding: 2px 8px;
              border-radius: 9999px;
              background-color: ${hasAssets ? '#edf4ff' : '#f2f4f7'};
              color: ${hasAssets ? '#0052ff' : '#667085'};
              white-space: nowrap;
            ">
              ${hasAssets ? 'Active Depot' : 'Standby Site'}
            </span>
          </div>

          <div style="font-size: 12px; color: #667085; margin-bottom: 10px;">
            ${loc.building} ${loc.roomOrBay ? `• ${loc.roomOrBay}` : ''}
          </div>

          <div style="
            background: #f7f7f7;
            border: 1px solid #dee1e6;
            border-radius: 8px;
            padding: 8px 10px;
            margin-bottom: 12px;
            font-size: 12px;
            color: #475467;
          ">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span>📍</span>
              <span>${loc.address?.street ? `${loc.address.street}, ` : ''}${loc.address?.city || 'Gujarat'} - ${loc.address?.postalCode || ''}</span>
            </div>
            ${loc.siteManager ? `
              <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px; color: #667085;">
                <span>👤</span>
                <span>In-Charge: ${loc.siteManager.name || loc.siteManager.email}</span>
              </div>
            ` : ''}
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px solid #dee1e6;">
            <div style="font-size: 13px; font-weight: 700; color: #0a0b0d; font-family: monospace;">
              📦 ${assetCount} Assets Assigned
            </div>
            <a
              href="/assets?location=${loc._id}"
              style="
                font-size: 12px;
                font-weight: 600;
                color: #0052ff;
                text-decoration: none;
                display: flex;
                align-items: center;
                gap: 4px;
              "
            >
              View Assets &rarr;
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        setSelectedLocation(loc);
      });

      markersRef.current[loc._id] = marker;
    });
  }, [locations, selectedLocation]);

  // Focus location on click from drawer
  const handleSelectLocation = (loc) => {
    setSelectedLocation(loc);
    const map = mapInstanceRef.current;
    if (!map) return;

    const lat = loc.coordinates?.latitude || 23.0225;
    const lng = loc.coordinates?.longitude || 72.5714;

    map.flyTo([lat, lng], 13.5, {
      duration: 1.2,
      easeLinearity: 0.25,
    });

    const marker = markersRef.current[loc._id];
    if (marker) {
      setTimeout(() => marker.openPopup(), 600);
    }
  };

  // Reset to full Gujarat view
  const handleResetView = () => {
    setSelectedLocation(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(GUJARAT_CENTER, DEFAULT_ZOOM, {
        duration: 1.0,
      });
      mapInstanceRef.current.closePopup();
    }
  };

  // Filtered list
  const filteredLocations = locations.filter((loc) => {
    const matchesSearch =
      loc.siteName?.toLowerCase().includes(search.toLowerCase()) ||
      loc.address?.city?.toLowerCase().includes(search.toLowerCase()) ||
      loc.building?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'ACTIVE_ASSETS') return (loc.assetCount || 0) > 0;
    if (activeFilter === 'EMPTY') return (loc.assetCount || 0) === 0;
    return true;
  });

  const totalAssetsAcrossGujarat = locations.reduce(
    (sum, loc) => sum + (loc.assetCount || 0),
    0
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100%', overflow: 'hidden' }}>
      <Navbar
        title="Map"
        subtitle="Real-time geographical tracking across circle offices, plant depots, and highway field camps"
        actionLabel="State Overview"
        actionIcon={Compass}
        onActionClick={handleResetView}
      />

      {/* Main Map View Area */}
      <div style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Left Side: Facility Drawer */}
        <div style={{
          width: '380px',
          minWidth: '380px',
          maxWidth: '380px',
          height: '100%',
          backgroundColor: 'var(--color-canvas)',
          borderRight: '1px solid var(--color-hairline)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 20,
          flexShrink: 0,
          overflow: 'hidden',
          boxShadow: '4px 0 16px rgba(0, 0, 0, 0.04)',
        }}>
          {/* Drawer Search & Summary (Pinned at top of drawer) */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-hairline)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            flexShrink: 0,
            backgroundColor: 'var(--color-canvas)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#12b76a',
                  display: 'inline-block',
                }} />
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-ink)' }}>
                  Live Facility Radar
                </span>
              </div>
              <span className="badge badge-in_use" style={{ fontSize: '11px' }}>
                {totalAssetsAcrossGujarat} Units Stationed
              </span>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
              <input
                type="text"
                placeholder="Search division, district, or yard..."
                className="input-field"
                style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { key: 'ALL', label: `All (${locations.length})` },
                { key: 'ACTIVE_ASSETS', label: 'Active Machinery' },
                { key: 'EMPTY', label: 'Standby' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '11px',
                    fontWeight: activeFilter === tab.key ? '600' : '500',
                    border: '1px solid',
                    borderColor: activeFilter === tab.key ? 'var(--color-primary)' : 'var(--color-hairline)',
                    backgroundColor: activeFilter === tab.key ? 'var(--color-primary-subtle)' : 'var(--color-surface-soft)',
                    color: activeFilter === tab.key ? 'var(--color-primary)' : 'var(--color-body)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Locations Scroll List - ONLY this list scrolls, map stays static */}
          <div style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-muted)', fontSize: '13px' }}>
                Loading live GPS telemetry...
              </div>
            ) : filteredLocations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-muted)', fontSize: '13px' }}>
                No facilities match your search.
              </div>
            ) : (
              filteredLocations.map((loc) => {
                const isSelected = selectedLocation?._id === loc._id;
                const assetCount = loc.assetCount || 0;
                const hasAssets = assetCount > 0;

                return (
                  <div
                    key={loc._id}
                    onClick={() => handleSelectLocation(loc)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: isSelected ? 'var(--color-primary-subtle)' : 'var(--color-canvas)',
                      border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-hairline)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-surface-soft)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-canvas)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', lineHeight: '1.3' }}>
                        {loc.siteName}
                      </div>
                      <span
                        className="number-display"
                        style={{
                          fontSize: '12px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-pill)',
                          backgroundColor: hasAssets ? 'rgba(0, 82, 255, 0.12)' : 'var(--color-surface-strong)',
                          color: hasAssets ? 'var(--color-primary)' : 'var(--color-muted)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        {assetCount} Units
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                      {loc.building} {loc.roomOrBay ? `• ${loc.roomOrBay}` : ''}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-body)', marginTop: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} color="var(--color-primary)" />
                        <span>{loc.address?.city || 'Gujarat'}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontSize: '11px', fontWeight: '600' }}>
                        <span>Locate</span>
                        <Navigation size={11} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Leaflet Map - Permanently static, anchored in place */}
        <div style={{
          flex: 1,
          position: 'relative',
          height: '100%',
          maxHeight: '100%',
          width: '100%',
          overflow: 'hidden',
          backgroundColor: '#e5e3df',
        }}>
          {/* Map Target Container - permanently static, full bleed */}
          <div
            ref={mapContainerRef}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
            }}
          />

          {/* Floating Coinbase Styled Map Controls (Top Right) */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 1000,
          }}>
            <div style={{
              backgroundColor: 'var(--color-canvas)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-hairline)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              <button
                onClick={() => mapInstanceRef.current?.zoomIn()}
                title="Zoom In"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--color-ink)',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-soft)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                +
              </button>
              <div style={{ height: '1px', backgroundColor: 'var(--color-hairline)' }} />
              <button
                onClick={() => mapInstanceRef.current?.zoomOut()}
                title="Zoom Out"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--color-ink)',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-soft)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                &minus;
              </button>
            </div>

            {/* Quick Map Controls Box */}
            <div style={{
              backgroundColor: 'var(--color-canvas)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-hairline)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              <button
                onClick={handleResetView}
                title="Center Gujarat Overview"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-soft)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Compass size={18} />
              </button>

              <button
                onClick={() => toggleMapStyle(mapStyle === 'osm' ? 'hot' : 'osm')}
                title={`Switch to ${mapStyle === 'osm' ? 'Humanitarian Detailed' : 'Standard'} OpenStreetMap`}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--color-ink)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-soft)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Layers size={18} />
              </button>

              <button
                onClick={fetchLocations}
                title="Refresh Real-Time Feed"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--color-ink)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-soft)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <RefreshCw size={17} />
              </button>
            </div>
          </div>

          {/* Floating Bottom Legend (Institutional Info Pill) */}
          <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '24px',
            zIndex: 1000,
            backgroundColor: 'var(--color-canvas)',
            border: '1px solid var(--color-hairline)',
            borderRadius: 'var(--radius-pill)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            padding: '8px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                boxShadow: '0 0 0 2px #ffffff',
              }} />
              <span style={{ fontWeight: '600', color: 'var(--color-ink)' }}>Stationed Machinery</span>
            </div>

            <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--color-hairline)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#475467',
                boxShadow: '0 0 0 2px #ffffff',
              }} />
              <span style={{ color: 'var(--color-muted)' }}>Standby Yard</span>
            </div>

            <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--color-hairline)' }} />

            <span style={{ color: 'var(--color-muted)', fontSize: '11px' }}>
              Click marker for detailed equipment inventory
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
