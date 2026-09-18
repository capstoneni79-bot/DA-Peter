import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Layers,
  Navigation,
  Flame,
  Shield,
  Eye,
  EyeOff,
  Crosshair,
  Filter,
  Info,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';
import L from 'leaflet';
import { Barangay, SwineRecord } from '../../types';

// 3D Red Location Pin Icon with circular center cutout hole matching the official reference image
const createCustomPinIcon = (isReadyToSell: boolean, uniqueId: string = '') => {
  const gradId = `pinRedGrad_${uniqueId || Math.random().toString(36).substring(2, 7)}`;
  const iconHtml = `
    <div style="position: relative; width: 34px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.15s ease-out;" onmouseover="this.style.transform='scale(1.15) translate(-0.5px, -2px)'" onmouseout="this.style.transform='scale(1)'">
      <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));">
        <defs>
          <radialGradient id="${gradId}" cx="35%" cy="30%" r="68%">
            <stop offset="0%" stop-color="#ff7070"/>
            <stop offset="25%" stop-color="#ff263b"/>
            <stop offset="72%" stop-color="#cc081f"/>
            <stop offset="100%" stop-color="#7a000e"/>
          </radialGradient>
        </defs>

        <!-- Ground drop shadow under tip -->
        <ellipse cx="17" cy="42" rx="6" ry="1.8" fill="rgba(0,0,0,0.28)"/>

        <!-- 3D Red Teardrop Body with Circular Center Cutout Hole -->
        <path fill-rule="evenodd" clip-rule="evenodd" 
          d="M17 2C7.611 2 0 9.611 0 19C0 29.5 13.5 39.8 17 41C20.5 39.8 34 29.5 34 19C34 9.611 26.389 2 17 2ZM17 27C12.582 27 9 23.418 9 19C9 14.582 12.582 11 17 11C21.418 11 25 14.582 25 19C25 23.418 21.418 27 17 27Z" 
          fill="url(#${gradId})" 
          stroke="#900010" 
          stroke-width="0.75"
        />

        <!-- Specular Highlight curved gleam along top-left shoulder -->
        <path d="M6 15C7.5 8 11.5 4.8 17 4.8C20.5 4.8 23.5 6.2 26 8.8" stroke="rgba(255,255,255,0.72)" stroke-width="2" stroke-linecap="round" fill="none"/>

        <!-- Inner bottom bevel glow on ring cutout -->
        <path d="M12 22.5C13.2 24.5 15 25.5 17 25.5C19 25.5 20.8 24.5 22 22.5" stroke="rgba(255,255,255,0.32)" stroke-width="1.2" stroke-linecap="round" fill="none"/>

        ${
          isReadyToSell
            ? `
          <!-- Ready to sell golden star badge on shoulder -->
          <circle cx="27" cy="8" r="6" fill="#f59e0b" stroke="#ffffff" stroke-width="1.8"/>
          <text x="27" y="11" text-anchor="middle" font-size="8" font-weight="900" fill="#78350f">★</text>
        `
            : ''
        }
      </svg>
    </div>
  `;
  return L.divIcon({
    className: 'custom-swine-marker-3d',
    html: iconHtml,
    iconSize: [34, 44],
    iconAnchor: [17, 42],
    popupAnchor: [0, -38],
  });
};

const userGpsIcon = L.divIcon({
  className: 'user-gps-marker',
  html: `
    <div style="position: relative; width: 24px; height: 24px;">
      <div style="position: absolute; width: 24px; height: 24px; background: rgba(37, 99, 235, 0.35); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; background: #2563eb; border: 2.5px solid white; border-radius: 50%; box-shadow: 0 0 6px rgba(37,99,235,0.8);"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface GisMapProps {
  swineList: SwineRecord[];
  barangays: Barangay[];
  selectedBarangay?: string;
  onSelectSwine?: (swine: SwineRecord) => void;
  onPickLocation?: (lat: number, lng: number, closestBarangay?: string) => void;
  isLocationPicker?: boolean;
  initialCenter?: [number, number];
}

export const GisMap: React.FC<GisMapProps> = ({
  swineList,
  barangays,
  selectedBarangay,
  onSelectSwine,
  onPickLocation,
  isLocationPicker = false,
  initialCenter = [10.4042, 125.2017], // Hinunangan Centroid
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);

  const [mapMode, setMapMode] = useState<'street' | 'satellite' | 'terrain'>('street');
  const [viewMode, setViewMode] = useState<'pins' | 'heatmap' | 'zones'>('pins');
  const [showPins, setShowPins] = useState(true);
  const [filterReadyOnly, setFilterReadyOnly] = useState(false);
  const [activeBarangayFilter, setActiveBarangayFilter] = useState(selectedBarangay || 'all');
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [pickedPoint, setPickedPoint] = useState<[number, number] | null>(null);

  // Tile layer URLs
  const tileLayers = {
    street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: L.latLng(initialCenter[0], initialCenter[1]),
      zoom: 13,
      zoomControl: true,
    });

    const tile = L.tileLayer(tileLayers.street, {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors, DA Hinunangan GIS',
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);

    tileLayerRef.current = tile;
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    // Location picker click handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setPickedPoint([lat, lng]);

      // Find closest barangay
      let closestBg = barangays[0]?.name;
      let minDistance = 999999;
      barangays.forEach(bg => {
        const dist = Math.hypot(bg.latitude - lat, bg.longitude - lng);
        if (dist < minDistance) {
          minDistance = dist;
          closestBg = bg.name;
        }
      });

      if (onPickLocation) {
        onPickLocation(Number(lat.toFixed(6)), Number(lng.toFixed(6)), closestBg);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Change Tile layer
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const url = tileLayers[mapMode];
    tileLayerRef.current.setUrl(url);
  }, [mapMode]);

  // 3. Render Markers & Layers (Pins, Heatmap, Zones)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // Filter records
    let filteredSwine = swineList.filter(s => !s.isArchived);
    if (activeBarangayFilter !== 'all') {
      filteredSwine = filteredSwine.filter(s => (s.barangay || '').toLowerCase() === (activeBarangayFilter || '').toLowerCase());
    }
    if (filterReadyOnly) {
      filteredSwine = filteredSwine.filter(s => s.readyToSell);
    }

    // A. Barangay Boundaries & Zones Layer
    if (viewMode === 'zones' || viewMode === 'pins') {
      barangays.forEach(b => {
        const zoneColor = b.riskLevel === 'green' ? '#16a34a' : b.riskLevel === 'yellow' ? '#eab308' : '#dc2626';
        const swineInBarangay = swineList.filter(s => (s.barangay || '').toLowerCase() === (b.name || '').toLowerCase() && !s.isArchived);
        const readyInBarangay = swineInBarangay.filter(s => s.readyToSell).length;

        const tooltipContent = `
          <div style="font-family:sans-serif;font-size:12px;padding:2px;">
            <strong style="font-size:13px;">Brgy. ${b.name}</strong><br/>
            Zone: <span style="text-transform:uppercase;color:${zoneColor};font-weight:bold">${b.riskLevel} ASF Status</span><br/>
            ${b.boundaryAreaHectares ? `Measured Area: <strong>${b.boundaryAreaHectares} ha</strong> (${b.boundaryPerimeterKm || '—'} km)<br/>` : ''}
            Total Swine: <strong>${swineInBarangay.length}</strong> (Ready to Sell: ${readyInBarangay})
          </div>
        `;

        if (b.boundaryPolygon && b.boundaryPolygon.length >= 3) {
          const latLngs = b.boundaryPolygon.map(p => L.latLng(p[0], p[1]));
          const poly = L.polygon(latLngs, {
            color: zoneColor,
            fillColor: zoneColor,
            fillOpacity: viewMode === 'zones' ? 0.32 : 0.12,
            weight: 2.5,
          });
          poly.bindTooltip(tooltipContent, { sticky: true, direction: 'top' });
          poly.addTo(layerGroup);
        } else {
          const circle = L.circle([b.latitude, b.longitude], {
            color: zoneColor,
            fillColor: zoneColor,
            fillOpacity: viewMode === 'zones' ? 0.25 : 0.08,
            radius: b.surveillanceRadiusMeters || 850,
            weight: 2,
            dashArray: '4, 4',
          });
          circle.bindTooltip(tooltipContent, { sticky: true, direction: 'top' });
          circle.addTo(layerGroup);
        }
      });
    }

    // B. Heatmap Density Circles
    if (viewMode === 'heatmap') {
      // Group swine by barangay to build high density visual heat gradients
      barangays.forEach(b => {
        const swineCount = swineList.filter(s => (s.barangay || '').toLowerCase() === (b.name || '').toLowerCase() && !s.isArchived).length;
        if (swineCount === 0) return;

        const heatRadius = Math.min(1800, 500 + swineCount * 250);
        const opacity = Math.min(0.7, 0.2 + swineCount * 0.12);

        L.circle([b.latitude, b.longitude], {
          color: '#f97316',
          fillColor: '#ea580c',
          fillOpacity: opacity,
          radius: heatRadius,
          weight: 0,
        }).bindPopup(`
          <div style="font-family:sans-serif;font-size:12px;">
            <h4 style="font-weight:bold;margin:0 0 4px;color:#c2410c;">Brgy. ${b.name} Swine Density</h4>
            <p style="margin:0;">Registered Swine: <strong>${swineCount} heads</strong></p>
            <p style="margin:2px 0 0;font-size:11px;color:#666;">High concentration area in Hinunangan.</p>
          </div>
        `).addTo(layerGroup);
      });
    }

    // C. Individual Swine Pins (3D Red Cutout Pin)
    if (showPins && (viewMode === 'pins' || viewMode === 'zones')) {
      filteredSwine.forEach(swine => {
        const marker = L.marker([swine.latitude, swine.longitude], {
          icon: createCustomPinIcon(swine.readyToSell, swine.id),
        });

        const popupContent = document.createElement('div');
        popupContent.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        popupContent.style.fontSize = '12px';
        popupContent.style.minWidth = '220px';
        popupContent.innerHTML = `
          <div style="border-radius:8px;overflow:hidden;">
            ${
              swine.photoUrl
                ? `<img src="${swine.photoUrl}" style="width:100%;height:100px;object-fit:cover;border-radius:6px;margin-bottom:6px;" alt="Swine" />`
                : ''
            }
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
              <span style="font-weight:bold;font-size:13px;color:#065f46;">${swine.earTagNo}</span>
              <span style="font-size:10px;padding:2px 6px;border-radius:4px;background:${swine.readyToSell ? '#fef3c7' : '#dcfce7'};color:${swine.readyToSell ? '#92400e' : '#166534'};font-weight:bold;">
                ${swine.readyToSell ? 'READY TO SELL' : swine.status.toUpperCase()}
              </span>
            </div>
            <div style="color:#444;line-height:1.4;">
              <div><strong>Farmer:</strong> ${swine.farmerName}</div>
              <div><strong>Barangay:</strong> ${swine.barangay}</div>
              <div><strong>Breed:</strong> ${swine.breed}</div>
              <div><strong>Weight:</strong> ${swine.weightKg} kg (${swine.ageWeeks} wks)</div>
              ${swine.estimatedPricePhp ? `<div><strong>Est. Price:</strong> ₱${swine.estimatedPricePhp.toLocaleString()}</div>` : ''}
              <div><strong>GPS:</strong> ${swine.latitude.toFixed(4)}, ${swine.longitude.toFixed(4)}</div>
            </div>
          </div>
        `;

        const btn = document.createElement('button');
        btn.innerText = 'View Full Record';
        btn.style.cssText = 'margin-top:8px;width:100%;padding:4px 8px;background:#15803d;color:white;border:none;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;';
        btn.onclick = () => {
          if (onSelectSwine) onSelectSwine(swine);
        };
        popupContent.appendChild(btn);

        marker.bindPopup(popupContent);
        marker.addTo(layerGroup);
      });
    }

    // D. Picked Location Marker (if picker mode)
    if (pickedPoint) {
      const pickerMarker = L.marker(pickedPoint, {
        icon: L.divIcon({
          className: 'picked-pin',
          html: '<div style="background:#dc2626;color:white;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.5);font-size:12px;">📍</div>',
          iconSize: [24, 24],
          iconAnchor: [12, 24],
        }),
      });
      pickerMarker.bindPopup('Selected Swine Pen Location').addTo(layerGroup);
    }
  }, [swineList, barangays, viewMode, activeBarangayFilter, filterReadyOnly, pickedPoint, showPins]);

  // 4. Live GPS Tracking
  const toggleLiveGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    if (gpsActive) {
      setGpsActive(false);
      if (userMarkerRef.current) userMarkerRef.current.remove();
      if (userCircleRef.current) userCircleRef.current.remove();
      return;
    }

    setGpsActive(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGpsCoords({ lat: latitude, lng: longitude, accuracy });

        const map = mapInstanceRef.current;
        if (map) {
          map.setView([latitude, longitude], 15);

          if (userMarkerRef.current) userMarkerRef.current.remove();
          if (userCircleRef.current) userCircleRef.current.remove();

          userCircleRef.current = L.circle([latitude, longitude], {
            radius: accuracy,
            color: '#3b82f6',
            fillColor: '#60a5fa',
            fillOpacity: 0.15,
            weight: 1,
          }).addTo(map);

          userMarkerRef.current = L.marker([latitude, longitude], {
            icon: userGpsIcon,
          })
            .bindPopup(`<strong>Your Live GPS Location</strong><br/>Accuracy: ~${Math.round(accuracy)}m`)
            .addTo(map);
        }
      },
      err => {
        console.error('GPS error:', err);
        setGpsActive(false);
        alert('Could not acquire live GPS position. Please check location permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Center on Hinunangan town
  const centerHinunangan = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([10.4042, 125.2017], 13);
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-stone-200 shadow-md bg-stone-100 flex flex-col h-[580px]">
      {/* Top Map Control Bar */}
      <div className="bg-white/95 backdrop-blur-md px-3 py-2 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 z-10 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-emerald-900 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-emerald-600" /> Hinunangan GIS
          </span>

          {/* View Mode Selector */}
          <div className="flex rounded-lg bg-stone-100 p-0.5 border border-stone-200">
            <button
              onClick={() => setViewMode('pins')}
              className={`px-2 py-1 rounded font-medium flex items-center gap-1 cursor-pointer transition ${
                viewMode === 'pins' ? 'bg-emerald-700 text-white shadow-2xs font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Eye className="w-3 h-3" /> Pin Records
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`px-2 py-1 rounded font-medium flex items-center gap-1 cursor-pointer transition ${
                viewMode === 'heatmap' ? 'bg-emerald-700 text-white shadow-2xs font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Flame className="w-3 h-3 text-orange-400" /> Heatmap
            </button>
            <button
              onClick={() => setViewMode('zones')}
              className={`px-2 py-1 rounded font-medium flex items-center gap-1 cursor-pointer transition ${
                viewMode === 'zones' ? 'bg-emerald-700 text-white shadow-2xs font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Shield className="w-3 h-3 text-emerald-300" /> ASF Zones
            </button>
          </div>

          {/* Map Tile Mode Selector */}
          <div className="flex rounded-lg bg-stone-100 p-0.5 border border-stone-200">
            <button
              onClick={() => setMapMode('street')}
              className={`px-2 py-1 rounded font-medium cursor-pointer ${
                mapMode === 'street' ? 'bg-white shadow-2xs text-stone-900 font-bold' : 'text-stone-600'
              }`}
            >
              Street
            </button>
            <button
              onClick={() => setMapMode('satellite')}
              className={`px-2 py-1 rounded font-medium cursor-pointer ${
                mapMode === 'satellite' ? 'bg-white shadow-2xs text-stone-900 font-bold' : 'text-stone-600'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapMode('terrain')}
              className={`px-2 py-1 rounded font-medium cursor-pointer ${
                mapMode === 'terrain' ? 'bg-white shadow-2xs text-stone-900 font-bold' : 'text-stone-600'
              }`}
            >
              Terrain
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Barangay Filter */}
          <select
            value={activeBarangayFilter}
            onChange={e => setActiveBarangayFilter(e.target.value)}
            className="bg-white border border-stone-300 rounded-md px-2 py-1 text-xs text-stone-700 font-medium focus:ring-1 focus:ring-emerald-600"
          >
            <option value="all">All Hinunangan Barangays ({barangays.length})</option>
            {barangays.map(b => (
              <option key={b.id} value={b.name}>
                Brgy. {b.name}
              </option>
            ))}
          </select>

          {/* Ready to sell toggle */}
          <button
            onClick={() => setFilterReadyOnly(!filterReadyOnly)}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 border transition cursor-pointer ${
              filterReadyOnly
                ? 'bg-amber-100 text-amber-900 border-amber-400 shadow-2xs font-bold'
                : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-50'
            }`}
          >
            <CheckCircle2 className={`w-3 h-3 ${filterReadyOnly ? 'text-amber-700' : 'text-stone-400'}`} />
            Ready to Sell
          </button>

          {/* Hide / Show Pins Button */}
          <button
            onClick={() => setShowPins(!showPins)}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
              !showPins
                ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-2xs font-bold'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
            }`}
            title={showPins ? 'Hide swine location pins on the map' : 'Show swine location pins on the map'}
          >
            {showPins ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                <span>Hide Pins</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>Show Pins</span>
              </>
            )}
          </button>

          {/* Live GPS Tracking Button */}
          <button
            onClick={toggleLiveGps}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 border transition cursor-pointer ${
              gpsActive
                ? 'bg-blue-600 text-white border-blue-700 animate-pulse shadow-sm'
                : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
            }`}
            title="Use Live GPS Tracking"
          >
            <Navigation className={`w-3.5 h-3.5 ${gpsActive ? 'fill-white' : ''}`} />
            <span>{gpsActive ? 'GPS Tracking Active' : 'Live GPS'}</span>
          </button>

          {/* Recenter */}
          <button
            onClick={centerHinunangan}
            className="p-1 rounded-md border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 cursor-pointer"
            title="Center on Hinunangan"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="flex-1 w-full h-full relative z-0" />

      {/* Floating Legend / Details */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-stone-200 text-[11px] max-w-xs space-y-2 pointer-events-auto">
        <div className="font-bold text-stone-900 flex items-center justify-between pb-1 border-b border-stone-100">
          <span className="flex items-center gap-1.5 text-xs text-emerald-950 font-black">
            <Layers className="w-3.5 h-3.5 text-emerald-700" /> Map &amp; GIS Legends
          </span>
          <span className="text-[10px] text-stone-500 font-normal">Hinunangan</span>
        </div>

        {/* Heatmap Density Legend Section */}
        <div className="bg-orange-50/70 p-2 rounded-xl border border-orange-200/80 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-orange-950">
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-600" /> Heatmap Density Legend
            </span>
            <span className="text-[9px] text-orange-700/80 font-semibold uppercase">Swine Herd Scale</span>
          </div>

          {/* Heat Gradient Visual Bar */}
          <div className="relative w-full h-2.5 rounded-full overflow-hidden bg-gradient-to-r from-amber-200 via-orange-500 to-red-600 border border-orange-300 shadow-inner" />
          
          <div className="flex justify-between text-[9px] text-stone-600 font-bold px-0.5">
            <span>Low (1–5)</span>
            <span>Medium (6–15)</span>
            <span>High (16+ heads)</span>
          </div>

          <div className="text-[9.5px] text-stone-600 leading-tight pt-0.5 flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-600 inline-block"></span>
                <span>Deep Red Core</span>
              </span>
              <span className="font-semibold text-red-900">Highest Cluster</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-400 inline-block"></span>
                <span>Warm Orange Glow</span>
              </span>
              <span className="font-semibold text-orange-900">Moderate Density</span>
            </div>
          </div>
        </div>

        {/* Pins & Zone Boundary Legend */}
        <div className="space-y-1 pt-0.5">
          <div className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
            Pins &amp; Biosecurity Zones
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-stone-700 text-[10.5px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                <svg width="12" height="15" viewBox="0 0 34 44" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M17 2C7.611 2 0 9.611 0 19C0 29.5 13.5 39.8 17 41C20.5 39.8 34 29.5 34 19C34 9.611 26.389 2 17 2ZM17 27C12.582 27 9 23.418 9 19C9 14.582 12.582 11 17 11C21.418 11 25 14.582 25 19C25 23.418 21.418 27 17 27Z" fill="#dc2626"/>
                </svg>
              </span>
              <span className="font-medium">3D Swine Pin {!showPins && <span className="text-rose-600 text-[9px]">(Hidden)</span>}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-600 inline-block shrink-0"></span>
              <span className="font-medium">Ready for Market</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block shrink-0"></span>
              <span>Green Zone (Safe)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shrink-0"></span>
              <span>Yellow Zone</span>
            </div>
          </div>
        </div>

        {isLocationPicker && (
          <div className="pt-1.5 border-t border-stone-200 text-emerald-800 font-medium text-[10px]">
            💡 Click anywhere on the map to pin coordinates for registration!
          </div>
        )}
      </div>

      {/* GPS Status pill */}
      {gpsCoords && gpsActive && (
        <div className="absolute top-12 right-3 z-10 bg-blue-900/90 text-white rounded-lg px-2.5 py-1 text-[11px] shadow-md border border-blue-400/40">
          GPS: {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)} (±{Math.round(gpsCoords.accuracy)}m)
        </div>
      )}
    </div>
  );
};
