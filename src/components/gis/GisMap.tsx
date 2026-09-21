import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  MapPin,
  Layers,
  Flame,
  Shield,
  Eye,
  EyeOff,
  Crosshair,
  Info,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Navigation,
  X,
  Sliders,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Search,
  ExternalLink,
  Users,
  Building,
  Activity,
} from 'lucide-react';
import L from 'leaflet';
import { Barangay, SwineRecord } from '../../types';
import { HINUNANGAN_BARANGAYS, HinunanganBarangayGeo, findClosestBarangay } from '../../data/barangays';
import {
  HINUNANGAN_BARANGAY_BOUNDARIES,
  HINUNANGAN_GEOJSON,
  HINUNANGAN_MUNICIPAL_METADATA,
} from '../../data/hinunanganBoundariesGeoJSON';
import {
  initBoundaryStorage,
  getStoredMunicipalRings,
  getStoredBarangayBoundaries,
} from '../../services/boundaryStorageService';
import { GoogleGisMap } from './GoogleGisMap';

// 3D Red Location Pin Icon with circular center cutout hole
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

// Clean Barangay Name Text Label on Map
const createBarangayTextLabel = (
  name: string,
  isUrban: boolean,
  riskLevel: 'green' | 'yellow' | 'red',
  isSelected: boolean
) => {
  const borderColor = isSelected
    ? '#dc2626'
    : riskLevel === 'red'
    ? '#ef4444'
    : riskLevel === 'yellow'
    ? '#d97706'
    : '#059669';

  const bgStyle = isSelected
    ? 'background: #dc2626; color: #ffffff; border: 1.5px solid #ffffff; font-weight: 800; box-shadow: 0 3px 8px rgba(220,38,38,0.5); transform: scale(1.1);'
    : 'background: rgba(255, 255, 255, 0.92); color: #1e293b; border: 1px solid rgba(203, 213, 225, 0.9); box-shadow: 0 1.5px 4px rgba(0,0,0,0.18);';

  const iconHtml = `
    <div style="pointer-events: auto; cursor: pointer; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
      <div style="${bgStyle} padding: 2px 7px; border-radius: 6px; font-size: 11px; font-weight: 700; white-space: nowrap; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; gap: 4px; backdrop-blur: 4px; transition: all 0.2s ease;">
        <span style="width: 6px; height: 6px; border-radius: 50%; background: ${borderColor}; flex-shrink: 0;"></span>
        <span>${name}</span>
        ${isUrban ? '<span style="font-size: 8px; font-weight: 800; opacity: 0.75; text-transform: uppercase;">• Urban</span>' : ''}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-barangay-text-label',
    html: iconHtml,
    iconSize: [80, 20],
    iconAnchor: [40, 10],
  });
};

// Live GPS Pulsing Icon
const userGpsIcon = L.divIcon({
  className: 'user-gps-marker',
  html: `
    <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 26px; height: 26px; background: rgba(37, 99, 235, 0.35); border-radius: 50%; animation: pulse 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: absolute; width: 14px; height: 14px; background: #2563eb; border: 2.5px solid white; border-radius: 50%; box-shadow: 0 0 8px rgba(37,99,235,0.8);"></div>
    </div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
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

interface LeafletGisMapProps extends GisMapProps {
  onSwitchToGoogle?: () => void;
}

const LeafletGisMap: React.FC<LeafletGisMapProps> = ({
  swineList,
  barangays,
  selectedBarangay,
  onSelectSwine,
  onPickLocation,
  isLocationPicker = false,
  initialCenter,
  onSwitchToGoogle,
}) => {

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Dedicated Layer Groups for Independent Management
  const muniBoundaryLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const boundariesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const labelsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const pinsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const asfZonesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const pickerLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const userMarkerRef = useRef<L.Marker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const polygonRefsMap = useRef<{ [name: string]: L.Polygon }>({});

  // Map Controls State
  const [mapMode, setMapMode] = useState<'street' | 'satellite' | 'terrain'>('street');
  const [currentZoom, setCurrentZoom] = useState<number>(13);

  // Independent Layer Toggles
  const [showMunicipalBoundary, setShowMunicipalBoundary] = useState<boolean>(true);
  const [showBoundaries, setShowBoundaries] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showPins, setShowPins] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [showAsfZones, setShowAsfZones] = useState<boolean>(false);
  const [boundaryOpacity, setBoundaryOpacity] = useState<number>(0.12); // 0.05, 0.15, 0.30

  // Filters & Selection
  const [filterReadyOnly, setFilterReadyOnly] = useState<boolean>(false);
  const [activeBarangayFilter, setActiveBarangayFilter] = useState<string>(selectedBarangay || 'all');
  const [hoveredBarangay, setHoveredBarangay] = useState<string | null>(null);
  const [selectedBarangayData, setSelectedBarangayData] = useState<any | null>(null);

  // GPS & Interaction
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const [gpsNotification, setGpsNotification] = useState<string | null>(null);
  const [pickedPoint, setPickedPoint] = useState<[number, number] | null>(null);
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState<boolean>(false);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(true);

  // Tile layer URL definitions
  const tileLayers = {
    street: {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, DA Hinunangan GIS',
      },
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      options: {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Hinunangan Satellite Imagery',
      },
    },
    terrain: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      options: {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri Topo &mdash; Hinunangan Terrain Topography',
      },
    },
  };

  // Calculate bounding box containing all 40 Hinunangan barangays
  const getHinunanganBounds = useCallback(() => {
    const latLngs = HINUNANGAN_BARANGAYS.map(b => L.latLng(b.latitude, b.longitude));
    return L.latLngBounds(latLngs);
  }, []);

  // Aggregated Barangay Dataset with Dynamic Live Metrics
  const activeBarangayMetrics = useMemo(() => {
    const storedBgys = getStoredBarangayBoundaries();
    return HINUNANGAN_BARANGAYS.map(geo => {
      const live = barangays.find(b => b.name.toLowerCase() === geo.name.toLowerCase());
      const swineInBarangay = swineList.filter(
        s => (s.barangay || '').toLowerCase() === geo.name.toLowerCase() && !s.isArchived
      );
      const readyToSell = swineInBarangay.filter(s => s.readyToSell || s.status === 'ready_to_sell').length;
      const farmersCount = new Set(
        swineInBarangay.map(s => (s.farmerName || s.ownerName || '').trim().toLowerCase()).filter(Boolean)
      ).size;

      const boundaryPolygon = storedBgys[geo.name] || HINUNANGAN_BARANGAY_BOUNDARIES[geo.name] || [];
      const feature = HINUNANGAN_GEOJSON.features.find(f => f.properties.name === geo.name);

      return {
        ...geo,
        riskLevel: (live?.riskLevel || geo.defaultRiskLevel) as 'green' | 'yellow' | 'red',
        boundaryPolygon,
        areaHectares: feature?.properties.areaHectares || 120.5,
        perimeterKm: feature?.properties.perimeterKm || 4.8,
        totalSwine: swineInBarangay.length,
        readyToSell,
        farmersCount: farmersCount || (swineInBarangay.length > 0 ? Math.ceil(swineInBarangay.length * 0.7) : 0),
        activeRecords: swineInBarangay.length,
        focalPerson: live?.focalPersonName || geo.focalPersonName,
        contact: live?.contactNumber || geo.contactNumber,
      };
    });
  }, [barangays, swineList]);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const bounds = getHinunanganBounds();
    const center = initialCenter
      ? L.latLng(initialCenter[0], initialCenter[1])
      : bounds.getCenter();

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: 13,
      zoomControl: false,
    });

    if (!initialCenter) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    }

    // Add Tile Layer
    const currentConfig = tileLayers.street;
    const tile = L.tileLayer(currentConfig.url, currentConfig.options).addTo(map);
    tileLayerRef.current = tile;

    // Create Dedicated Layer Groups in Visual Stacking Order
    muniBoundaryLayerGroupRef.current = L.layerGroup().addTo(map);
    asfZonesLayerGroupRef.current = L.layerGroup().addTo(map);
    heatmapLayerGroupRef.current = L.layerGroup().addTo(map);
    boundariesLayerGroupRef.current = L.layerGroup().addTo(map);
    labelsLayerGroupRef.current = L.layerGroup().addTo(map);
    pinsLayerGroupRef.current = L.layerGroup().addTo(map);
    pickerLayerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Zoom and Pan Listeners
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    // Location Picker Click Handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setPickedPoint([lat, lng]);

      const closest = findClosestBarangay(lat, lng);
      if (onPickLocation) {
        onPickLocation(Number(lat.toFixed(6)), Number(lng.toFixed(6)), closest.name);
      }
    });

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Responsive Resize Observer
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    resizeObserver.observe(mapContainerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 3. Tile Layer Switching
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const config = tileLayers[mapMode] || tileLayers.street;
    const newTileLayer = L.tileLayer(config.url, config.options);

    newTileLayer.on('tileerror', () => {
      console.warn(`Tile load error on ${mapMode}, OpenStreetMap fallback engaged.`);
    });

    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;
    map.invalidateSize();
  }, [mapMode]);

  // 4. Handle External Selected Barangay Change & Zoom
  useEffect(() => {
    if (selectedBarangay) {
      setActiveBarangayFilter(selectedBarangay);
    }
  }, [selectedBarangay]);

  // Handle Focus & Zoom when activeBarangayFilter changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (activeBarangayFilter === 'all') {
      setSelectedBarangayData(null);
      const bounds = getHinunanganBounds();
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
    } else {
      const matched = activeBarangayMetrics.find(
        b => b.name.toLowerCase() === activeBarangayFilter.toLowerCase()
      );
      if (matched) {
        setSelectedBarangayData(matched);
        if (matched.boundaryPolygon && matched.boundaryPolygon.length >= 3) {
          const polyBounds = L.latLngBounds(matched.boundaryPolygon.map(p => L.latLng(p[0], p[1])));
          map.fitBounds(polyBounds, { padding: [50, 50], maxZoom: 16 });
        } else {
          map.flyTo([matched.latitude, matched.longitude], 15, { duration: 1.2 });
        }
      }
    }
  }, [activeBarangayFilter, getHinunanganBounds, activeBarangayMetrics]);

  // ---------------------------------------------------------------------------------
  // 5. RENDER INDIVIDUAL BARANGAY BOUNDARIES (Polygons with Red Dotted Outline)
  // ---------------------------------------------------------------------------------
  useEffect(() => {
    const layer = boundariesLayerGroupRef.current;
    if (!layer) return;
    layer.clearLayers();
    polygonRefsMap.current = {};

    if (!showBoundaries) return;

    activeBarangayMetrics.forEach(b => {
      if (!b.boundaryPolygon || b.boundaryPolygon.length < 3) return;

      const isSelected = activeBarangayFilter.toLowerCase() === b.name.toLowerCase();
      const isHovered = hoveredBarangay === b.name;

      // Style determination - Clean connected official municipal boundary
      let strokeColor = '#dc2626';
      let weight = 1.6;
      let dashArray = '';
      let fillOpacity = boundaryOpacity;
      let fillColor = '#ef4444';

      if (isSelected) {
        strokeColor = '#b91c1c';
        weight = 3.5;
        dashArray = '';
        fillOpacity = Math.min(0.4, boundaryOpacity + 0.22);
        fillColor = '#dc2626';
      } else if (isHovered) {
        strokeColor = '#991b1b';
        weight = 2.8;
        dashArray = '';
        fillOpacity = Math.min(0.3, boundaryOpacity + 0.14);
      } else if (activeBarangayFilter !== 'all') {
        // Less emphasized when another is selected
        strokeColor = '#f87171';
        weight = 1.2;
        dashArray = '';
        fillOpacity = Math.max(0.03, boundaryOpacity * 0.5);
      }

      const latLngs = b.boundaryPolygon.map(p => L.latLng(p[0], p[1]));
      const polygon = L.polygon(latLngs, {
        color: strokeColor,
        weight: weight,
        dashArray: dashArray,
        fillColor: fillColor,
        fillOpacity: fillOpacity,
        smoothFactor: 1,
      });

      // Hover and Click events
      polygon.on('mouseover', () => {
        setHoveredBarangay(b.name);
      });

      polygon.on('mouseout', () => {
        setHoveredBarangay(null);
      });

      polygon.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        setActiveBarangayFilter(b.name);
        setSelectedBarangayData(b);
      });

      // Tooltip for quick inspection
      polygon.bindTooltip(
        `
        <div style="font-family:system-ui,-apple-system,sans-serif;font-size:12px;padding:2px 4px;">
          <strong style="color:#111827;font-size:13px;">Brgy. ${b.name}</strong>
          ${b.isUrban ? '<span style="font-size:10px;color:#047857;margin-left:4px;font-weight:bold;">[Urban]</span>' : ''}
          <div style="font-size:11px;color:#4b5563;margin-top:2px;">
            Total Swine: <strong>${b.totalSwine}</strong> | Ready: <strong>${b.readyToSell}</strong>
          </div>
          <div style="font-size:10px;color:#6b7280;">Area: ~${b.areaHectares} ha (Perimeter: ${b.perimeterKm} km)</div>
        </div>
      `,
        { sticky: true, direction: 'top', opacity: 0.95 }
      );

      polygon.addTo(layer);
      polygonRefsMap.current[b.name] = polygon;
    });
  }, [activeBarangayMetrics, showBoundaries, activeBarangayFilter, hoveredBarangay, boundaryOpacity]);

  // ---------------------------------------------------------------------------------
  // 5b. RENDER ENTIRE MUNICIPAL PERIMETER (MultiPolygon from Real PSGC 086403000 Data)
  // ---------------------------------------------------------------------------------
  useEffect(() => {
    const layer = muniBoundaryLayerGroupRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showMunicipalBoundary) return;

    const rings = getStoredMunicipalRings();
    rings.forEach((ring, idx) => {
      const ringLatLngs = ring.map(p => L.latLng(p[0], p[1]));
      const muniPoly = L.polygon(ringLatLngs, {
        color: '#0284c7',
        weight: 3.5,
        dashArray: '6, 6',
        fillColor: '#0284c7',
        fillOpacity: 0.03,
        smoothFactor: 1,
      });

      muniPoly.bindTooltip(
        `
        <div style="font-family:system-ui,-apple-system,sans-serif;font-size:12px;padding:3px 5px;">
          <strong style="color:#0284c7;font-size:13px;">${HINUNANGAN_MUNICIPAL_METADATA.fullName}</strong>
          <div style="font-size:11px;color:#475569;margin-top:2px;">
            Area: <strong>168.09 km²</strong> • Perimeter: <strong>80.65 km</strong><br/>
            Ring ${idx + 1} of 3 (Official PSA PSGC 086403000)
          </div>
        </div>
        `,
        { sticky: true }
      );

      muniPoly.addTo(layer);
    });
  }, [showMunicipalBoundary]);

  // ---------------------------------------------------------------------------------
  // 6. RENDER BARANGAY LABELS (Clean, Zoom-responsive, Non-overlapping)
  // ---------------------------------------------------------------------------------
  useEffect(() => {
    const layer = labelsLayerGroupRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showLabels) return;

    activeBarangayMetrics.forEach(b => {
      // Zoom-filtering to avoid visual clutter
      if (currentZoom < 12 && !b.isUrban && b.name !== 'San Pedro Island' && b.name !== 'San Pablo Island') {
        return; // Hide small rural labels on low zoom
      }

      const isSelected = activeBarangayFilter.toLowerCase() === b.name.toLowerCase();

      const labelMarker = L.marker([b.latitude, b.longitude], {
        icon: createBarangayTextLabel(b.name, !!b.isUrban, b.riskLevel, isSelected),
        zIndexOffset: isSelected ? 400 : 150,
      });

      labelMarker.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        setActiveBarangayFilter(b.name);
        setSelectedBarangayData(b);
      });

      labelMarker.addTo(layer);
    });
  }, [activeBarangayMetrics, showLabels, currentZoom, activeBarangayFilter]);

  // ---------------------------------------------------------------------------------
  // 7. RENDER SWINE PINS (3D Red Pin with Circular Center Cutout & Gold Star)
  // ---------------------------------------------------------------------------------
  useEffect(() => {
    const layer = pinsLayerGroupRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showPins) return;

    let filteredSwine = swineList.filter(s => !s.isArchived);
    if (activeBarangayFilter !== 'all') {
      filteredSwine = filteredSwine.filter(
        s => (s.barangay || '').toLowerCase() === (activeBarangayFilter || '').toLowerCase()
      );
    }
    if (filterReadyOnly) {
      filteredSwine = filteredSwine.filter(s => s.readyToSell || s.status === 'ready_to_sell');
    }

    filteredSwine.forEach(swine => {
      let lat = swine.latitude;
      let lng = swine.longitude;

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        const bgGeo = HINUNANGAN_BARANGAYS.find(
          b => b.name.toLowerCase() === (swine.barangay || '').toLowerCase()
        );
        lat = bgGeo ? bgGeo.latitude : 10.397795;
        lng = bgGeo ? bgGeo.longitude : 125.199364;
      }

      const marker = L.marker([lat, lng], {
        icon: createCustomPinIcon(swine.readyToSell || swine.status === 'ready_to_sell', swine.id),
        zIndexOffset: 300,
      });

      const popupCard = document.createElement('div');
      popupCard.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      popupCard.style.fontSize = '12px';
      popupCard.style.minWidth = '230px';

      popupCard.innerHTML = `
        <div style="border-radius: 8px; overflow: hidden;">
          ${
            swine.photoUrl
              ? `<img src="${swine.photoUrl}" style="width: 100%; height: 105px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;" alt="Swine photo" />`
              : ''
          }
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-weight: 800; font-size: 13px; color: #065f46;">${swine.earTagNo}</span>
            <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: ${
              swine.readyToSell ? '#fef3c7' : '#dcfce7'
            }; color: ${swine.readyToSell ? '#92400e' : '#166534'}; font-weight: 800;">
              ${swine.readyToSell ? 'READY TO SELL' : (swine.status || 'ACTIVE').toUpperCase()}
            </span>
          </div>
          <div style="color: #374151; font-size: 11px; line-height: 1.45;">
            <div><strong>Farmer:</strong> ${swine.farmerName || swine.ownerName || '—'}</div>
            <div><strong>Barangay:</strong> Brgy. ${swine.barangay}</div>
            <div><strong>Breed:</strong> ${swine.breed || 'Standard'}</div>
            <div><strong>Weight:</strong> ${swine.weightKg} kg ${swine.ageWeeks ? `(${swine.ageWeeks} wks)` : ''}</div>
            ${swine.estimatedPricePhp ? `<div><strong>Est. Price:</strong> ₱${swine.estimatedPricePhp.toLocaleString()}</div>` : ''}
            <div style="color: #9ca3af; font-size: 10px; margin-top: 2px;"><strong>GPS:</strong> ${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
          </div>
        </div>
      `;

      if (onSelectSwine) {
        const btn = document.createElement('button');
        btn.innerText = 'View Swine Record Details';
        btn.style.cssText =
          'margin-top: 8px; width: 100%; padding: 5px 8px; background: #059669; color: white; border: none; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; transition: background 0.15s;';
        btn.onclick = () => onSelectSwine(swine);
        popupCard.appendChild(btn);
      }

      marker.bindPopup(popupCard);
      marker.addTo(layer);
    });
  }, [swineList, showPins, activeBarangayFilter, filterReadyOnly, onSelectSwine]);

  // ---------------------------------------------------------------------------------
  // 8. RENDER HEATMAP LAYER (Independent Swine Herd Density)
  // ---------------------------------------------------------------------------------
  useEffect(() => {
    const layer = heatmapLayerGroupRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showHeatmap) return;

    activeBarangayMetrics.forEach(b => {
      if (b.totalSwine === 0) return;

      let radius = 450;
      let fillColor = '#10b981';
      let strokeColor = '#059669';
      let densityLabel = 'Low Concentration (1–5 heads)';

      if (b.totalSwine >= 16) {
        radius = 950;
        fillColor = '#ef4444';
        strokeColor = '#b91c1c';
        densityLabel = 'High Concentration (16+ heads)';
      } else if (b.totalSwine >= 6) {
        radius = 650;
        fillColor = '#f59e0b';
        strokeColor = '#d97706';
        densityLabel = 'Medium Concentration (6–15 heads)';
      }

      const heatCircle = L.circle([b.latitude, b.longitude], {
        color: strokeColor,
        fillColor: fillColor,
        fillOpacity: 0.45,
        radius: radius,
        weight: 1.5,
      });

      heatCircle.bindPopup(`
        <div style="font-family:system-ui,-apple-system,sans-serif;font-size:12px;min-width:180px;">
          <strong style="color:#111827;font-size:13px;">Brgy. ${b.name} Density Heatmap</strong>
          <div style="margin:4px 0;padding:2px 6px;border-radius:4px;display:inline-block;font-size:10px;font-weight:bold;background:${fillColor}25;color:${strokeColor};">
            ${densityLabel}
          </div>
          <div style="color:#4b5563;font-size:11px;">
            <div>Registered Swine: <strong>${b.totalSwine} heads</strong></div>
            <div>Ready for Market: <strong>${b.readyToSell} heads</strong></div>
          </div>
        </div>
      `);

      heatCircle.addTo(layer);
    });
  }, [activeBarangayMetrics, showHeatmap]);

  // ---------------------------------------------------------------------------------
  // 9. RENDER ASF BIOSECURITY ZONES (Independent Layer)
  // ---------------------------------------------------------------------------------
  useEffect(() => {
    const layer = asfZonesLayerGroupRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showAsfZones) return;

    activeBarangayMetrics.forEach(b => {
      const zoneColor = b.riskLevel === 'green' ? '#16a34a' : b.riskLevel === 'yellow' ? '#eab308' : '#dc2626';
      const zoneLabel = b.riskLevel === 'green' ? 'Clean Zone (Safe)' : b.riskLevel === 'yellow' ? 'Surveillance / Buffer' : 'Infected / Quarantine';

      const zoneCircle = L.circle([b.latitude, b.longitude], {
        color: zoneColor,
        fillColor: zoneColor,
        fillOpacity: 0.2,
        radius: 700,
        weight: 2,
        dashArray: '3, 3',
      });

      zoneCircle.bindPopup(`
        <div style="font-family:system-ui,-apple-system,sans-serif;font-size:12px;min-width:190px;">
          <div style="font-weight:bold;font-size:13px;color:#111827;border-bottom:1px solid #e5e7eb;padding-bottom:3px;margin-bottom:4px;">
            Brgy. ${b.name} ASF Status
          </div>
          <div style="color:${zoneColor};font-weight:bold;font-size:11px;margin-bottom:4px;text-transform:uppercase;">
            ● ${zoneLabel}
          </div>
          <div style="color:#4b5563;font-size:11px;line-height:1.4;">
            <div>Swine in Zone: <strong>${b.totalSwine}</strong></div>
            <div>Focal Officer: ${b.focalPerson}</div>
          </div>
        </div>
      `);

      zoneCircle.addTo(layer);
    });
  }, [activeBarangayMetrics, showAsfZones]);

  // ---------------------------------------------------------------------------------
  // 10. RENDER LOCATION PICKER PIN (When active)
  // ---------------------------------------------------------------------------------
  useEffect(() => {
    const layer = pickerLayerGroupRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!pickedPoint) return;

    const pickerMarker = L.marker(pickedPoint, {
      icon: L.divIcon({
        className: 'picked-pin',
        html: `
          <div style="background: #dc2626; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.5); font-size: 14px; animation: bounce 1s infinite;">
            📍
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      }),
      zIndexOffset: 600,
    });

    const closest = findClosestBarangay(pickedPoint[0], pickedPoint[1]);
    pickerMarker
      .bindPopup(`
        <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px;">
          <strong style="color: #dc2626;">Selected Swine Pen GPS</strong>
          <div style="color: #4b5563; margin-top: 2px;">Assigned to: <strong>Brgy. ${closest.name}</strong></div>
          <div style="font-size: 10px; color: #9ca3af;">${pickedPoint[0].toFixed(6)}, ${pickedPoint[1].toFixed(6)}</div>
        </div>
      `)
      .addTo(layer);
  }, [pickedPoint]);

  // 11. Live GPS Toggle
  const toggleLiveGps = () => {
    if (!navigator.geolocation) {
      setGpsNotification('Geolocation is not supported by your browser.');
      return;
    }

    if (gpsActive) {
      setGpsActive(false);
      if (userMarkerRef.current) userMarkerRef.current.remove();
      if (userCircleRef.current) userCircleRef.current.remove();
      return;
    }

    setGpsActive(true);
    setGpsNotification(null);

    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude, accuracy } = pos.coords;
        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo([latitude, longitude], 15, { duration: 1.5 });

          if (userMarkerRef.current) userMarkerRef.current.remove();
          if (userCircleRef.current) userCircleRef.current.remove();

          userCircleRef.current = L.circle([latitude, longitude], {
            radius: accuracy,
            color: '#3b82f6',
            fillColor: '#60a5fa',
            fillOpacity: 0.15,
            weight: 1.5,
          }).addTo(map);

          userMarkerRef.current = L.marker([latitude, longitude], {
            icon: userGpsIcon,
            zIndexOffset: 1000,
          })
            .bindPopup(`
              <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px;">
                <strong style="color: #2563eb;">Your Live GPS Location</strong><br/>
                Accuracy: ~${Math.round(accuracy)} meters<br/>
                <span style="font-size: 10px; color: #6b7280;">${latitude.toFixed(6)}, ${longitude.toFixed(6)}</span>
              </div>
            `)
            .addTo(map);
        }
      },
      err => {
        console.warn('GPS position error:', err);
        setGpsActive(false);
        setGpsNotification('Could not acquire GPS position. Check location permissions.');
        setTimeout(() => setGpsNotification(null), 5000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Zoom controls
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  const handleResetMap = () => {
    setActiveBarangayFilter('all');
    setSelectedBarangayData(null);
    const bounds = getHinunanganBounds();
    mapInstanceRef.current?.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-stone-200 shadow-md bg-stone-100 flex flex-col h-[650px]">
      {/* Top Map Control Bar */}
      <div className="bg-white/95 backdrop-blur-md px-3 py-2 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 z-20 text-xs">
        {/* Left: Branding & Basemaps */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="font-bold text-emerald-950 flex items-center gap-1.5 mr-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
            <MapPin className="w-4 h-4 text-emerald-700" />
            <span className="font-black tracking-tight text-sm text-stone-900">Hinunangan GIS</span>
          </div>

          {/* Switch to Google Maps Engine Button */}
          <button
            onClick={onSwitchToGoogle}
            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
            title="Switch to Google Maps Platform Engine"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
            Switch to Google Maps
          </button>

          {/* Map Basemap Selector */}
          <div className="flex rounded-lg bg-stone-100 p-0.5 border border-stone-200 shadow-2xs">
            <button
              onClick={() => setMapMode('street')}
              className={`px-2 py-1 rounded-md font-medium cursor-pointer transition ${
                mapMode === 'street' ? 'bg-white shadow-2xs text-emerald-950 font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Street
            </button>
            <button
              onClick={() => setMapMode('satellite')}
              className={`px-2 py-1 rounded-md font-medium cursor-pointer transition ${
                mapMode === 'satellite' ? 'bg-white shadow-2xs text-emerald-950 font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapMode('terrain')}
              className={`px-2 py-1 rounded-md font-medium cursor-pointer transition ${
                mapMode === 'terrain' ? 'bg-white shadow-2xs text-emerald-950 font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Terrain
            </button>
          </div>

          {/* Map Layers Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setIsLayersPanelOpen(!isLayersPanelOpen)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer shadow-2xs ${
                isLayersPanelOpen ? 'bg-emerald-800 text-white border-emerald-900' : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              <span>Map Layers</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {/* Floating Layer Control Menu */}
            {isLayersPanelOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-64 bg-white/98 backdrop-blur-md rounded-xl shadow-xl border border-stone-200 p-3 z-50 text-xs space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
                  <span className="font-extrabold text-stone-900 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-600" /> Layer Management
                  </span>
                  <button onClick={() => setIsLayersPanelOpen(false)} className="text-stone-400 hover:text-stone-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center justify-between cursor-pointer group bg-sky-50 p-1.5 rounded-lg border border-sky-200">
                    <div>
                      <span className="text-sky-900 font-bold block">Entire Hinunangan Boundary</span>
                      <span className="text-[10px] text-sky-600 block">168.09 km² • PSGC 086403000</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showMunicipalBoundary}
                      onChange={e => setShowMunicipalBoundary(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-stone-700 font-semibold group-hover:text-stone-900">Barangay Boundaries</span>
                    <input
                      type="checkbox"
                      checked={showBoundaries}
                      onChange={e => setShowBoundaries(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-stone-700 font-semibold group-hover:text-stone-900">Barangay Names</span>
                    <input
                      type="checkbox"
                      checked={showLabels}
                      onChange={e => setShowLabels(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-stone-700 font-semibold group-hover:text-stone-900">Swine Record Pins</span>
                    <input
                      type="checkbox"
                      checked={showPins}
                      onChange={e => setShowPins(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-stone-700 font-semibold group-hover:text-stone-900">Swine Density Heatmap</span>
                    <input
                      type="checkbox"
                      checked={showHeatmap}
                      onChange={e => setShowHeatmap(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-stone-700 font-semibold group-hover:text-stone-900">ASF Risk Zones</span>
                    <input
                      type="checkbox"
                      checked={showAsfZones}
                      onChange={e => setShowAsfZones(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                    />
                  </label>
                </div>

                {/* Boundary Opacity Slider */}
                <div className="pt-2 border-t border-stone-200">
                  <div className="flex items-center justify-between text-[11px] text-stone-600 font-semibold mb-1">
                    <span>Boundary Fill Opacity</span>
                    <span className="text-emerald-800 font-bold">{Math.round(boundaryOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.04"
                    max="0.4"
                    step="0.04"
                    value={boundaryOpacity}
                    onChange={e => setBoundaryOpacity(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Barangay Selector, Ready-to-Sell, Hide Pins, GPS & Reset */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 40 Barangay Dropdown Selector */}
          <div className="flex items-center gap-1">
            <select
              value={activeBarangayFilter}
              onChange={e => setActiveBarangayFilter(e.target.value)}
              className="bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs text-stone-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-2xs cursor-pointer max-w-[200px]"
            >
              <option value="all">All Hinunangan Barangays (40)</option>
              {HINUNANGAN_BARANGAYS.map(b => (
                <option key={b.id} value={b.name}>
                  Brgy. {b.name} {b.isUrban ? '(Urban)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Ready to Sell Toggle */}
          <button
            onClick={() => setFilterReadyOnly(!filterReadyOnly)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition cursor-pointer shadow-2xs ${
              filterReadyOnly
                ? 'bg-amber-100 text-amber-950 border-amber-400 font-bold ring-1 ring-amber-400'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
            }`}
            title="Filter commercial market-ready swine"
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${filterReadyOnly ? 'text-amber-700' : 'text-stone-400'}`} />
            <span>Ready to Sell</span>
          </button>

          {/* Hide / Show Pins Quick Button */}
          <button
            onClick={() => setShowPins(!showPins)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer shadow-2xs ${
              !showPins
                ? 'bg-rose-50 text-rose-800 border-rose-300 font-bold ring-1 ring-rose-300'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
            }`}
            title={showPins ? 'Hide swine location pins' : 'Show swine location pins'}
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

          {/* Live GPS Toggle */}
          <button
            onClick={toggleLiveGps}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition cursor-pointer shadow-2xs ${
              gpsActive ? 'bg-blue-600 text-white border-blue-700 shadow-xs' : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
            }`}
            title="Locate device GPS position"
          >
            <Navigation className={`w-3.5 h-3.5 ${gpsActive ? 'text-white' : 'text-blue-600'}`} />
            <span>GPS</span>
          </button>

          {/* Reset Map Extent */}
          <button
            onClick={handleResetMap}
            className="p-1 rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 shadow-2xs transition cursor-pointer"
            title="Reset Map View to Full Hinunangan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* GPS Notification Toast */}
      {gpsNotification && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2 text-xs animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{gpsNotification}</span>
          <button onClick={() => setGpsNotification(null)} className="ml-1 text-amber-700 hover:text-amber-900">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Map Canvas */}
      <div className="relative flex-1 w-full h-full">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Zoom Controls (Top Left) */}
        <div className="absolute top-3 left-3 z-10 flex flex-col rounded-xl overflow-hidden shadow-lg border border-stone-200 bg-white/95 backdrop-blur-md">
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-stone-100 text-stone-700 border-b border-stone-200 transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-stone-100 text-stone-700 transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Barangay Interactive Info Card (Top Right / Bottom Right) */}
        {selectedBarangayData && (
          <div className="absolute top-3 right-3 z-20 w-80 max-w-[calc(100vw-2rem)] bg-white/98 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200 p-4 animate-fade-in text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  <h3 className="font-extrabold text-sm text-stone-900">
                    Brgy. {selectedBarangayData.name}
                  </h3>
                  {selectedBarangayData.isUrban && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-extrabold uppercase">
                      Urban
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-stone-500 mt-0.5">
                  Code: <strong>{selectedBarangayData.code}</strong> • Hinunangan, Southern Leyte
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedBarangayData(null);
                  setActiveBarangayFilter('all');
                }}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 transition cursor-pointer"
                title="Clear Selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics Bento */}
            <div className="grid grid-cols-2 gap-2 my-3">
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-2.5">
                <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Total Swine</div>
                <div className="text-lg font-black text-emerald-950 mt-0.5">
                  {selectedBarangayData.totalSwine} <span className="text-xs font-normal text-emerald-700">heads</span>
                </div>
              </div>
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5">
                <div className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Ready to Sell</div>
                <div className="text-lg font-black text-amber-950 mt-0.5">
                  {selectedBarangayData.readyToSell} <span className="text-xs font-normal text-amber-700">heads</span>
                </div>
              </div>
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5">
                <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Registered Farmers</div>
                <div className="text-base font-extrabold text-stone-900 mt-0.5">
                  {selectedBarangayData.farmersCount} <span className="text-xs font-normal text-stone-500">owners</span>
                </div>
              </div>
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5">
                <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">ASF Status</div>
                <div className="flex items-center gap-1 mt-1">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      selectedBarangayData.riskLevel === 'green'
                        ? 'bg-emerald-600'
                        : selectedBarangayData.riskLevel === 'yellow'
                        ? 'bg-amber-500'
                        : 'bg-red-600'
                    }`}
                  ></span>
                  <span className="font-extrabold capitalize text-stone-800">
                    {selectedBarangayData.riskLevel === 'green' ? 'Safe Zone' : selectedBarangayData.riskLevel}
                  </span>
                </div>
              </div>
            </div>

            {/* Geographical & Administrative Specs */}
            <div className="space-y-1 text-[11px] text-stone-600 border-t border-stone-100 pt-2 mb-3">
              <div className="flex justify-between">
                <span>Boundary Area:</span>
                <strong className="text-stone-800">~{selectedBarangayData.areaHectares} ha</strong>
              </div>
              <div className="flex justify-between">
                <span>Boundary Perimeter:</span>
                <strong className="text-stone-800">~{selectedBarangayData.perimeterKm} km</strong>
              </div>
              <div className="flex justify-between">
                <span>Barangay Focal:</span>
                <strong className="text-stone-800">{selectedBarangayData.focalPerson}</strong>
              </div>
              <div className="flex justify-between">
                <span>Contact Hotline:</span>
                <strong className="text-stone-800">{selectedBarangayData.contact}</strong>
              </div>
              <div className="flex justify-between">
                <span>Center GPS:</span>
                <span className="text-stone-500 font-mono text-[10px]">
                  {selectedBarangayData.latitude.toFixed(6)}, {selectedBarangayData.longitude.toFixed(6)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  if (selectedBarangayData.boundaryPolygon?.length >= 3) {
                    const bounds = L.latLngBounds(
                      selectedBarangayData.boundaryPolygon.map((p: [number, number]) => L.latLng(p[0], p[1]))
                    );
                    mapInstanceRef.current?.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
                  } else {
                    mapInstanceRef.current?.flyTo(
                      [selectedBarangayData.latitude, selectedBarangayData.longitude],
                      16
                    );
                  }
                }}
                className="flex-1 bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-center transition cursor-pointer shadow-xs"
              >
                Zoom to Boundary
              </button>
              <button
                onClick={handleResetMap}
                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Legend Panel (Bottom Left) */}
        <div className="absolute bottom-3 left-3 z-10 max-w-xs transition-all duration-200">
          {isLegendOpen ? (
            <div className="bg-white/95 backdrop-blur-md rounded-xl p-3 border border-stone-200 shadow-lg text-xs text-stone-800 space-y-2">
              <div className="flex items-center justify-between gap-4 font-bold border-b border-stone-200 pb-1.5">
                <span className="flex items-center gap-1.5 text-stone-900 font-extrabold">
                  <Info className="w-3.5 h-3.5 text-emerald-600" /> Municipal Map Legend
                </span>
                <button
                  onClick={() => setIsLegendOpen(false)}
                  className="text-stone-400 hover:text-stone-600 cursor-pointer p-0.5"
                  title="Minimize Legend"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-2.5 border border-red-600 bg-red-500/20 rounded-xs"></div>
                  <span>Barangay Boundary (Contiguous)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-red-600 border border-white shadow-2xs flex items-center justify-center text-[8px] text-white font-bold">●</span>
                  <span>Registered Swine Pin (3D)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-[9px] text-white flex items-center justify-center font-bold">★</span>
                  <span>Ready for Market Sale</span>
                </div>
                {showHeatmap && (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    <span>Swine Density Heat Gradient</span>
                  </div>
                )}
                {showAsfZones && (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                    <span>ASF Risk Zone Radius</span>
                  </div>
                )}
                {gpsActive && (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600 animate-ping"></span>
                    <span>Your Live GPS Location</span>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-stone-500 pt-1 border-t border-stone-100 flex items-center justify-between">
                <span>40 Hinunangan Barangays</span>
                <span className="font-bold text-emerald-900">100% Boundary Mapped</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsLegendOpen(true)}
              className="bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-stone-200 shadow-md text-xs font-bold text-stone-700 flex items-center gap-1.5 hover:bg-stone-50 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              <span>Legend</span>
            </button>
          )}
        </div>

        {/* Location Picker Prompt (when in picker mode) */}
        {isLocationPicker && (
          <div className="absolute top-3 right-3 z-10 bg-emerald-900/90 backdrop-blur-md text-white px-3 py-2 rounded-xl shadow-lg text-xs max-w-xs border border-emerald-700 animate-fade-in">
            <div className="font-bold flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-emerald-300 animate-spin" style={{ animationDuration: '4s' }} />
              Location Picker Active
            </div>
            <p className="text-[11px] text-emerald-100 mt-1">
              Click anywhere on the map to place the swine pen pin. The closest barangay and coordinates will be auto-selected.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export const GisMap: React.FC<GisMapProps> = (props) => {
  const [engine, setEngine] = useState<'google' | 'leaflet'>('google');

  if (engine === 'google') {
    return (
      <GoogleGisMap
        {...props}
        onSwitchToLeaflet={() => setEngine('leaflet')}
      />
    );
  }

  return (
    <LeafletGisMap
      {...props}
      onSwitchToGoogle={() => setEngine('google')}
    />
  );
};
