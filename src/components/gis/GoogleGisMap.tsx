import React, { useState, useMemo, useCallback } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  Polygon,
  Polyline,
  Circle,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Layers,
  Flame,
  Shield,
  Eye,
  EyeOff,
  Crosshair,
  Info,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Navigation,
  X,
  Search,
  Users,
  Building,
  Activity,
  Truck,
  Compass,
  ArrowRight,
  Route as RouteIcon,
  Phone,
  Calendar,
  Sparkles,
  ChevronRight,
  Download,
  Database,
  Check,
} from 'lucide-react';
import { Barangay, SwineRecord } from '../../types';
import { HINUNANGAN_BARANGAYS, findClosestBarangay } from '../../data/barangays';
import {
  HINUNANGAN_BARANGAY_BOUNDARIES,
  HINUNANGAN_MUNICIPAL_METADATA,
} from '../../data/hinunanganBoundariesGeoJSON';
import {
  initBoundaryStorage,
  getStoredMunicipalGooglePaths,
  getStoredBarangayBoundaries,
  getBoundaryStorageStatus,
  exportAllBoundariesGeoJSON,
  resetBoundariesToOfficial,
} from '../../services/boundaryStorageService';
import {
  HINUNANGAN_ROAD_NETWORKS,
  HINUNANGAN_BIOSECURITY_CHECKPOINTS,
  RoadSegment,
  BiosecurityCheckpoint,
  getRouteToSlaughterhouse,
} from '../../data/hinunanganRoutes';

// Helper component to control map camera via useMap
function MapCameraController({
  targetCenter,
  targetZoom,
}: {
  targetCenter: { lat: number; lng: number } | null;
  targetZoom: number | null;
}) {
  const map = useMap();
  React.useEffect(() => {
    if (!map) return;
    if (targetCenter) {
      map.panTo(targetCenter);
      if (targetZoom) {
        map.setZoom(targetZoom);
      }
    }
  }, [map, targetCenter, targetZoom]);
  return null;
}

export interface GoogleGisMapProps {
  swineList: SwineRecord[];
  barangays: Barangay[];
  selectedBarangay?: string;
  onSelectSwine?: (swine: SwineRecord) => void;
  onPickLocation?: (lat: number, lng: number, closestBarangay?: string) => void;
  isLocationPicker?: boolean;
  initialCenter?: [number, number];
  onSwitchToLeaflet?: () => void;
}

export const GoogleGisMap: React.FC<GoogleGisMapProps> = ({
  swineList,
  barangays,
  selectedBarangay,
  onSelectSwine,
  onPickLocation,
  isLocationPicker = false,
  initialCenter,
  onSwitchToLeaflet,
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Hinunangan Town Hall / Central Hinunangan Coordinates
  const defaultCenter = useMemo<{ lat: number; lng: number }>(() => {
    if (initialCenter && initialCenter[0] && initialCenter[1]) {
      return { lat: initialCenter[0], lng: initialCenter[1] };
    }
    return { lat: 10.4015, lng: 125.1950 };
  }, [initialCenter]);

  // Camera State
  const [targetCenter, setTargetCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [targetZoom, setTargetZoom] = useState<number | null>(null);

  // Map Mode: satellite, hybrid, roadmap, terrain
  const [mapType, setMapType] = useState<'hybrid' | 'satellite' | 'roadmap' | 'terrain'>('hybrid');

  // Layer Visibility
  const [showMunicipalBoundary, setShowMunicipalBoundary] = useState<boolean>(true);
  const [showBoundaries, setShowBoundaries] = useState<boolean>(true);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [showCheckpoints, setShowCheckpoints] = useState<boolean>(true);
  const [showSwinePins, setShowSwinePins] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showAsfBuffer, setShowAsfBuffer] = useState<boolean>(false);
  const [filterReadyOnly, setFilterReadyOnly] = useState<boolean>(false);
  const [boundaryOpacity, setBoundaryOpacity] = useState<number>(0.18);

  // Municipal Detail Panel State
  const [municipalDataOpen, setMunicipalDataOpen] = useState<boolean>(false);
  const [storageNonce, setStorageNonce] = useState<number>(0);
  const [storageToast, setStorageToast] = useState<string | null>(null);

  // Initialize offline boundary storage & register update listener
  React.useEffect(() => {
    initBoundaryStorage();
    const handleStorageUpdate = () => setStorageNonce(n => n + 1);
    window.addEventListener('hinunangan-boundaries-updated', handleStorageUpdate);
    return () => window.removeEventListener('hinunangan-boundaries-updated', handleStorageUpdate);
  }, []);

  // Offline-stored Municipal Paths ({ lat, lng }[][])
  const storedMunicipalPaths = useMemo(() => {
    return getStoredMunicipalGooglePaths();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageNonce]);

  // Offline-stored 40 Barangay Boundaries Map
  const storedBarangayBoundaries = useMemo<Record<string, [number, number][]>>(() => {
    return getStoredBarangayBoundaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageNonce]);

  // Boundary Storage Status
  const boundaryStorageStatus = useMemo(() => {
    return getBoundaryStorageStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageNonce]);

  // Selections
  const [activeBarangayFilter, setActiveBarangayFilter] = useState<string>(selectedBarangay || 'all');
  const [hoveredBarangay, setHoveredBarangay] = useState<string | null>(null);
  const [selectedBarangayData, setSelectedBarangayData] = useState<any | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RoadSegment | null>(null);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<BiosecurityCheckpoint | null>(null);
  const [selectedSwineRecord, setSelectedSwineRecord] = useState<SwineRecord | null>(null);
  const [pickedPoint, setPickedPoint] = useState<{ lat: number; lng: number } | null>(null);

  // Route to Slaughterhouse Simulator
  const [activeSlaughterRoute, setActiveSlaughterRoute] = useState<{
    originName: string;
    path: { lat: number; lng: number }[];
    telemetry: ReturnType<typeof getRouteToSlaughterhouse>;
  } | null>(null);

  // GPS State
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsNotification, setGpsNotification] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // UI Panels
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState<boolean>(false);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Map 40 official barangays lookup
  const barangayLookup = useMemo(() => {
    const map = new Map<string, typeof HINUNANGAN_BARANGAYS[0]>();
    HINUNANGAN_BARANGAYS.forEach(b => map.set(b.name.toLowerCase(), b));
    return map;
  }, []);

  // Filtered Swine list
  const visibleSwine = useMemo(() => {
    return swineList.filter(s => {
      if (filterReadyOnly && s.status !== 'ready_to_sell') return false;
      if (activeBarangayFilter !== 'all' && s.barangay?.toLowerCase() !== activeBarangayFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [swineList, filterReadyOnly, activeBarangayFilter]);

  // Handle clicking a barangay polygon
  const handleBarangayClick = useCallback((barangayName: string) => {
    const bgInfo = barangayLookup.get(barangayName.toLowerCase());
    if (!bgInfo) return;

    const swineInBg = swineList.filter(s => s.barangay?.toLowerCase() === barangayName.toLowerCase());
    const readyInBg = swineInBg.filter(s => s.status === 'ready_to_sell');
    const dynamicBg = barangays.find(b => b.name.toLowerCase() === barangayName.toLowerCase());
    const currentRisk = dynamicBg?.riskLevel || bgInfo.defaultRiskLevel;

    const slaughterTelemetry = getRouteToSlaughterhouse(bgInfo.latitude, bgInfo.longitude);

    setSelectedBarangayData({
      ...bgInfo,
      riskLevel: currentRisk,
      swineCount: swineInBg.length || bgInfo.defaultSwineCount,
      readyToSellCount: readyInBg.length || bgInfo.defaultReadyToSellCount,
      slaughterTelemetry,
    });

    setTargetCenter({ lat: bgInfo.latitude, lng: bgInfo.longitude });
    setTargetZoom(14);
  }, [barangayLookup, swineList, barangays]);

  // Compute slaughter route from a coordinate
  const handlePlotSlaughterRoute = (lat: number, lng: number, name: string) => {
    const telemetry = getRouteToSlaughterhouse(lat, lng);
    const path: { lat: number; lng: number }[] = [
      { lat, lng },
      telemetry.nearestCheckpoint.position,
      telemetry.destination,
    ];
    setActiveSlaughterRoute({
      originName: name,
      path,
      telemetry,
    });
  };

  // Fit entire Hinunangan Municipal Boundary (168.09 km²)
  const handleFitEntireMunicipality = () => {
    setTargetCenter({ lat: 10.3793, lng: 125.1541 });
    setTargetZoom(11);
    setMunicipalDataOpen(true);
    setSelectedBarangayData(null);
    setSelectedRoute(null);
    setSelectedCheckpoint(null);
  };

  // Export full official boundaries GeoJSON (RFC 7946)
  const handleExportGeoJSON = () => {
    try {
      const geoJsonStr = exportAllBoundariesGeoJSON();
      const blob = new Blob([geoJsonStr], { type: 'application/geo+json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Hinunangan_Official_Boundaries_PSA_NAMRIA.geojson';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setStorageToast('GeoJSON exported with accurate municipal perimeter & 40 barangays');
      setTimeout(() => setStorageToast(null), 4000);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  // Reset local storage boundaries to official NAMRIA/PSA survey dataset
  const handleResetBoundaries = () => {
    if (window.confirm('Reset municipal & barangay boundaries to official PSA/NAMRIA survey data in localStorage?')) {
      resetBoundariesToOfficial();
      setStorageToast('Boundary data reset to official survey coordinates in localStorage');
      setTimeout(() => setStorageToast(null), 4000);
    }
  };

  // Locate User GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGpsNotification('Geolocation is not supported by your browser');
      setTimeout(() => setGpsNotification(null), 4000);
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGpsLoading(false);
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setTargetCenter({ lat: latitude, lng: longitude });
        setTargetZoom(16);

        const closest = findClosestBarangay(latitude, longitude);
        setGpsNotification(`Location acquired: Closest to ${closest.name}`);
        setTimeout(() => setGpsNotification(null), 5000);

        if (isLocationPicker && onPickLocation) {
          onPickLocation(latitude, longitude, closest.name);
          setPickedPoint({ lat: latitude, lng: longitude });
        }
      },
      err => {
        setGpsLoading(false);
        setGpsNotification(`GPS error: ${err.message}`);
        setTimeout(() => setGpsNotification(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Reset view to entire Hinunangan
  const handleResetView = () => {
    setTargetCenter({ lat: 10.4015, lng: 125.1950 });
    setTargetZoom(12);
    setSelectedBarangayData(null);
    setSelectedRoute(null);
    setSelectedCheckpoint(null);
    setSelectedSwineRecord(null);
    setActiveSlaughterRoute(null);
  };

  return (
    <div className="relative w-full h-[640px] md:h-[720px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col select-none">
      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Engine & Search */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Map Engine Badge & Switcher */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Google Maps
            </span>
            <span className="text-slate-400 text-[10px]">|</span>
            <span className="text-emerald-400 font-medium text-[11px]">Precision GIS</span>
            {onSwitchToLeaflet && (
              <button
                onClick={onSwitchToLeaflet}
                className="ml-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-0.5 rounded-lg border border-slate-700 transition cursor-pointer"
                title="Switch to Leaflet OpenStreetMap view"
              >
                Switch to Leaflet
              </button>
            )}
          </div>

          {/* Quick Search Barangay Dropdown */}
          <div className="relative hidden sm:block">
            <div className="flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-lg text-xs text-white">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search 40 barangays..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-white placeholder:text-slate-400 outline-none w-36 md:w-48"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-white cursor-pointer ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {searchQuery.trim().length > 0 && (
              <div className="absolute top-full mt-1 left-0 w-64 max-h-56 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-1">
                {HINUNANGAN_BARANGAYS.filter(b =>
                  b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  b.code.toLowerCase().includes(searchQuery.toLowerCase())
                ).map(b => (
                  <button
                    key={b.id}
                    onClick={() => {
                      handleBarangayClick(b.name);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 text-slate-200 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-semibold text-white">{b.name}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5">({b.code})</span>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        b.defaultRiskLevel === 'red'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : b.defaultRiskLevel === 'yellow'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {b.defaultRiskLevel}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Map Type & Layer Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Map Type Mode Switcher */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-lg flex items-center gap-0.5 text-xs">
            <button
              onClick={() => setMapType('satellite')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition cursor-pointer ${
                mapType === 'satellite'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapType('hybrid')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition cursor-pointer ${
                mapType === 'hybrid'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Hybrid
            </button>
            <button
              onClick={() => setMapType('roadmap')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition cursor-pointer ${
                mapType === 'roadmap'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Streets
            </button>
            <button
              onClick={() => setMapType('terrain')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition cursor-pointer ${
                mapType === 'terrain'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Terrain
            </button>
          </div>

          {/* Fit Entire Municipality Button */}
          <button
            onClick={handleFitEntireMunicipality}
            className="px-2.5 py-1.5 rounded-xl bg-sky-950/90 hover:bg-sky-900 text-sky-200 hover:text-white border border-sky-700/80 backdrop-blur-md shadow-lg transition cursor-pointer text-[11px] font-semibold flex items-center gap-1.5"
            title="Zoom to fit the entire Municipality of Hinunangan (168.09 km²)"
          >
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Whole Hinunangan</span>
          </button>

          {/* Layers Toggle Button */}
          <button
            onClick={() => setIsLayersPanelOpen(prev => !prev)}
            className={`p-2 rounded-xl border backdrop-blur-md shadow-lg transition cursor-pointer ${
              isLayersPanelOpen
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-slate-900/90 text-slate-300 hover:text-white border-slate-700/80'
            }`}
            title="Toggle GIS Map Layers"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Reset Map View */}
          <button
            onClick={handleResetView}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 backdrop-blur-md shadow-lg transition cursor-pointer"
            title="Reset to Hinunangan central view"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Storage Toast Notification */}
      {storageToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-sky-500/80 text-sky-200 text-xs px-4 py-2 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          <span>{storageToast}</span>
        </div>
      )}

      {/* GPS Notification Toast */}
      {gpsNotification && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 border border-emerald-500/80 text-emerald-300 text-xs px-4 py-2 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
          <span>{gpsNotification}</span>
        </div>
      )}

      {/* Layers Panel Drawer (Floating Right) */}
      {isLayersPanelOpen && (
        <div className="absolute top-16 right-3 z-30 w-76 bg-slate-900/95 border border-slate-700/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              GIS Layers & Boundary Storage
            </span>
            <button
              onClick={() => setIsLayersPanelOpen(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {/* Real Surveyed Outer Municipal Perimeter Toggle */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-sky-950/40 border border-sky-800/50 hover:bg-sky-950/60 cursor-pointer transition">
              <div>
                <span className="text-sky-200 font-bold block flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block"></span>
                  Entire Hinunangan Boundary
                </span>
                <span className="text-[10px] text-sky-400/90 font-mono block">
                  168.09 km² • PSGC 086403000
                </span>
              </div>
              <input
                type="checkbox"
                checked={showMunicipalBoundary}
                onChange={e => setShowMunicipalBoundary(e.target.checked)}
                className="accent-sky-500 w-4 h-4 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
              <span className="text-slate-200 font-medium">Barangay Boundaries (40)</span>
              <input
                type="checkbox"
                checked={showBoundaries}
                onChange={e => setShowBoundaries(e.target.checked)}
                className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
              <span className="text-slate-200 font-medium">Boundary Routes & Corridors</span>
              <input
                type="checkbox"
                checked={showRoutes}
                onChange={e => setShowRoutes(e.target.checked)}
                className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
              <span className="text-slate-200 font-medium">Checkpoints & Slaughterhouse</span>
              <input
                type="checkbox"
                checked={showCheckpoints}
                onChange={e => setShowCheckpoints(e.target.checked)}
                className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
              <span className="text-slate-200 font-medium">Swine Farm GPS Pins</span>
              <input
                type="checkbox"
                checked={showSwinePins}
                onChange={e => setShowSwinePins(e.target.checked)}
                className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
              <span className="text-slate-200 font-medium">Barangay Labels on Map</span>
              <input
                type="checkbox"
                checked={showLabels}
                onChange={e => setShowLabels(e.target.checked)}
                className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
              <span className="text-slate-200 font-medium">ASF 1km/7km Buffer Zones</span>
              <input
                type="checkbox"
                checked={showAsfBuffer}
                onChange={e => setShowAsfBuffer(e.target.checked)}
                className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
              />
            </label>

            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                <span>Boundary Opacity</span>
                <span className="font-mono text-emerald-400">{Math.round(boundaryOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.45"
                step="0.05"
                value={boundaryOpacity}
                onChange={e => setBoundaryOpacity(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => setFilterReadyOnly(prev => !prev)}
                className={`w-full py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  filterReadyOnly
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {filterReadyOnly ? 'Showing: Ready-to-Sell Only' : 'Filter: Market Ready Pigs'}
              </button>
            </div>

            {/* Offline Local Storage & GeoJSON Tools */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-semibold flex items-center gap-1">
                  <Database className="w-3 h-3 text-emerald-400" />
                  Offline Storage
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" />
                  localStorage Active
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Accurate boundaries are cached locally in your browser for 100% offline biosurveillance.
              </p>
              <div className="flex gap-1.5 pt-0.5">
                <button
                  onClick={handleExportGeoJSON}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold border border-slate-700 flex items-center justify-center gap-1 cursor-pointer transition"
                  title="Download standard RFC 7946 GeoJSON containing the Hinunangan outer perimeter & 40 barangays"
                >
                  <Download className="w-3 h-3 text-emerald-400" />
                  Export GeoJSON
                </button>
                <button
                  onClick={handleResetBoundaries}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-medium border border-slate-700 cursor-pointer transition"
                  title="Restore official survey boundary data"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Google Map Viewport */}
      <div className="flex-1 w-full h-full relative">
        <APIProvider apiKey={apiKey}>
          <GoogleMap
            mapId="DEMO_MAP_ID"
            defaultCenter={defaultCenter}
            defaultZoom={12}
            mapTypeId={mapType}
            gestureHandling="greedy"
            disableDefaultUI={false}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
            onClick={(e) => {
              if (isLocationPicker && onPickLocation && e.detail?.latLng) {
                const lat = e.detail.latLng.lat;
                const lng = e.detail.latLng.lng;
                const closest = findClosestBarangay(lat, lng);
                setPickedPoint({ lat, lng });
                onPickLocation(lat, lng, closest.name);
              }
            }}
          >
            {/* Camera Control Hook */}
            <MapCameraController targetCenter={targetCenter} targetZoom={targetZoom} />

            {/* Render Real Surveyed Outer Municipal Boundary of Hinunangan (168.09 km²) */}
            {showMunicipalBoundary &&
              storedMunicipalPaths.map((ringPath, rIdx) => (
                <Polygon
                  key={`muni-outer-ring-${rIdx}`}
                  paths={ringPath}
                  strokeColor="#0284c7"
                  strokeOpacity={0.95}
                  strokeWeight={3.5}
                  fillColor="#0284c7"
                  fillOpacity={0.03}
                  onClick={() => {
                    setMunicipalDataOpen(true);
                    setSelectedBarangayData(null);
                    setSelectedRoute(null);
                    setSelectedCheckpoint(null);
                  }}
                />
              ))}

            {/* Render 40 Official Barangay Boundary Polygons */}
            {showBoundaries &&
              (Object.entries(storedBarangayBoundaries) as [string, [number, number][]][]).map(([name, ring]) => {
                const bgInfo = barangayLookup.get(name.toLowerCase());
                const dynamicBg = barangays.find(b => b.name.toLowerCase() === name.toLowerCase());
                const riskLevel = dynamicBg?.riskLevel || bgInfo?.defaultRiskLevel || 'green';
                const isSelected = selectedBarangayData?.name?.toLowerCase() === name.toLowerCase();
                const isHovered = hoveredBarangay?.toLowerCase() === name.toLowerCase();

                const strokeColor = isSelected
                  ? '#ffffff'
                  : riskLevel === 'red'
                  ? '#ef4444'
                  : riskLevel === 'yellow'
                  ? '#f59e0b'
                  : '#10b981';

                const fillColor = riskLevel === 'red'
                  ? '#dc2626'
                  : riskLevel === 'yellow'
                  ? '#d97706'
                  : '#059669';

                const polygonCoords = ring.map(([lat, lng]) => ({ lat, lng }));

                return (
                  <Polygon
                    key={`boundary-${name}`}
                    paths={polygonCoords}
                    strokeColor={strokeColor}
                    strokeOpacity={isSelected ? 1.0 : isHovered ? 0.95 : 0.75}
                    strokeWeight={isSelected ? 3.5 : isHovered ? 2.5 : 1.5}
                    fillColor={fillColor}
                    fillOpacity={isSelected ? 0.35 : isHovered ? 0.28 : boundaryOpacity}
                    onClick={() => handleBarangayClick(name)}
                    onMouseOver={() => setHoveredBarangay(name)}
                    onMouseOut={() => setHoveredBarangay(null)}
                  />
                );
              })}

            {/* Render Real Boundary Routes & Highway Networks */}
            {showRoutes &&
              HINUNANGAN_ROAD_NETWORKS.map(segment => {
                const isSelectedRoute = selectedRoute?.id === segment.id;
                return (
                  <Polyline
                    key={segment.id}
                    path={segment.path}
                    strokeColor={isSelectedRoute ? '#ffffff' : segment.color}
                    strokeOpacity={isSelectedRoute ? 1.0 : 0.85}
                    strokeWeight={isSelectedRoute ? segment.weight + 2 : segment.weight}
                    onClick={() => {
                      setSelectedRoute(segment);
                      setSelectedBarangayData(null);
                      setSelectedCheckpoint(null);
                    }}
                  />
                );
              })}

            {/* Render Simulated Slaughterhouse Transit Route */}
            {activeSlaughterRoute && (
              <Polyline
                path={activeSlaughterRoute.path}
                strokeColor="#facc15"
                strokeOpacity={0.95}
                strokeWeight={5}
              />
            )}

            {/* Render Biosecurity 1km/7km Buffers if toggled */}
            {showAsfBuffer &&
              HINUNANGAN_BIOSECURITY_CHECKPOINTS.map(chk => (
                <React.Fragment key={`buffer-${chk.id}`}>
                  <Circle
                    center={chk.position}
                    radius={1000} // 1km strict quarantine radius
                    strokeColor="#ef4444"
                    strokeOpacity={0.7}
                    strokeWeight={1.5}
                    fillColor="#ef4444"
                    fillOpacity={0.12}
                  />
                  <Circle
                    center={chk.position}
                    radius={7000} // 7km surveillance radius
                    strokeColor="#f59e0b"
                    strokeOpacity={0.5}
                    strokeWeight={1}
                    fillColor="#f59e0b"
                    fillOpacity={0.04}
                  />
                </React.Fragment>
              ))}

            {/* Render Barangay Name Labels as AdvancedMarkers */}
            {showLabels &&
              HINUNANGAN_BARANGAYS.map(b => {
                const isSelected = selectedBarangayData?.name === b.name;
                const dynamicBg = barangays.find(db => db.name.toLowerCase() === b.name.toLowerCase());
                const risk = dynamicBg?.riskLevel || b.defaultRiskLevel;

                return (
                  <AdvancedMarker
                    key={`lbl-${b.id}`}
                    position={{ lat: b.latitude, lng: b.longitude }}
                    onClick={() => handleBarangayClick(b.name)}
                  >
                    <div
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-md cursor-pointer transition flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-red-600 text-white ring-2 ring-white scale-110'
                          : 'bg-slate-900/90 text-slate-100 border border-slate-700/80 hover:bg-slate-800'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          risk === 'red'
                            ? 'bg-red-500'
                            : risk === 'yellow'
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                      />
                      <span>{b.name}</span>
                    </div>
                  </AdvancedMarker>
                );
              })}

            {/* Render Biosecurity Checkpoint & Abattoir Pins */}
            {showCheckpoints &&
              HINUNANGAN_BIOSECURITY_CHECKPOINTS.map(chk => (
                <AdvancedMarker
                  key={`chk-${chk.id}`}
                  position={chk.position}
                  onClick={() => {
                    setSelectedCheckpoint(chk);
                    setSelectedRoute(null);
                    setSelectedBarangayData(null);
                    setSelectedSwineRecord(null);
                  }}
                >
                  <div
                    className={`p-1.5 rounded-full shadow-lg border cursor-pointer transition transform hover:scale-115 flex items-center justify-center ${
                      chk.type === 'slaughterhouse_hub'
                        ? 'bg-amber-600 text-white border-amber-300 ring-2 ring-amber-500/50'
                        : chk.type === 'quarantine_border'
                        ? 'bg-red-600 text-white border-red-300 ring-2 ring-red-500/50'
                        : chk.type === 'sea_patrol'
                        ? 'bg-cyan-600 text-white border-cyan-300 ring-2 ring-cyan-500/50'
                        : 'bg-blue-600 text-white border-blue-300 ring-2 ring-blue-500/50'
                    }`}
                    title={chk.name}
                  >
                    {chk.type === 'slaughterhouse_hub' ? (
                      <Building className="w-4 h-4" />
                    ) : chk.type === 'quarantine_border' ? (
                      <Shield className="w-4 h-4" />
                    ) : chk.type === 'sea_patrol' ? (
                      <Compass className="w-4 h-4" />
                    ) : (
                      <Activity className="w-4 h-4" />
                    )}
                  </div>
                </AdvancedMarker>
              ))}

            {/* Render Swine Registry Markers */}
            {showSwinePins &&
              visibleSwine.map(swine => {
                if (!swine.coordinates || typeof swine.coordinates[0] !== 'number') return null;
                const [lat, lng] = swine.coordinates;
                const isReady = swine.status === 'ready_to_sell';

                return (
                  <AdvancedMarker
                    key={`swine-${swine.id}`}
                    position={{ lat, lng }}
                    onClick={() => {
                      setSelectedSwineRecord(swine);
                      setSelectedCheckpoint(null);
                      setSelectedRoute(null);
                    }}
                  >
                    <div
                      className="relative flex items-center justify-center cursor-pointer transition transform hover:scale-125"
                      title={`${swine.pigId || 'Swine'} - ${swine.barangay} (${isReady ? 'Ready to Sell' : 'Registered'})`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shadow-lg ${
                          isReady
                            ? 'bg-amber-500 border-white text-slate-950 font-black'
                            : 'bg-red-600 border-white text-white'
                        }`}
                      >
                        {isReady ? '★' : '🐷'}
                      </div>
                    </div>
                  </AdvancedMarker>
                );
              })}

            {/* Live GPS User Pin */}
            {userLocation && (
              <AdvancedMarker position={userLocation}>
                <div className="relative flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-blue-500/40 animate-ping absolute"></div>
                  <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-xl relative z-10"></div>
                </div>
              </AdvancedMarker>
            )}

            {/* Location Picker Dropped Pin */}
            {isLocationPicker && pickedPoint && (
              <AdvancedMarker position={pickedPoint}>
                <div className="flex flex-col items-center">
                  <div className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow mb-0.5">
                    Selected Point
                  </div>
                  <MapPin className="w-8 h-8 text-emerald-500 drop-shadow" />
                </div>
              </AdvancedMarker>
            )}

            {/* Swine Details InfoWindow */}
            {selectedSwineRecord && selectedSwineRecord.coordinates && (
              <InfoWindow
                position={{
                  lat: selectedSwineRecord.coordinates[0],
                  lng: selectedSwineRecord.coordinates[1],
                }}
                onCloseClick={() => setSelectedSwineRecord(null)}
              >
                <div className="p-2 text-slate-900 max-w-xs space-y-2">
                  <div className="flex items-center justify-between border-b pb-1">
                    <span className="font-bold text-sm text-slate-900">
                      {selectedSwineRecord.pigId || 'Swine Details'}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        selectedSwineRecord.status === 'ready_to_sell'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {selectedSwineRecord.status === 'ready_to_sell' ? 'Ready to Sell' : 'Registered'}
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <p>
                      <strong>Barangay:</strong> {selectedSwineRecord.barangay}
                    </p>
                    <p>
                      <strong>Owner:</strong> {selectedSwineRecord.ownerName || 'Confidential'}
                    </p>
                    <p>
                      <strong>Breed:</strong> {selectedSwineRecord.breed || 'Landrace/Large White'}
                    </p>
                    <p>
                      <strong>Weight:</strong> {selectedSwineRecord.weightKg || '--'} kg
                    </p>
                    <p>
                      <strong>Health Status:</strong> {selectedSwineRecord.healthStatus || 'Healthy'}
                    </p>
                  </div>
                  <div className="pt-1 flex gap-2">
                    <button
                      onClick={() => {
                        handlePlotSlaughterRoute(
                          selectedSwineRecord.coordinates![0],
                          selectedSwineRecord.coordinates![1],
                          `${selectedSwineRecord.pigId} (${selectedSwineRecord.barangay})`
                        );
                      }}
                      className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] py-1 px-2 rounded-lg cursor-pointer flex items-center justify-center gap-1"
                    >
                      <RouteIcon className="w-3 h-3" />
                      Route to Slaughterhouse
                    </button>
                    {onSelectSwine && (
                      <button
                        onClick={() => onSelectSwine(selectedSwineRecord)}
                        className="bg-slate-800 hover:bg-slate-700 text-white text-[11px] py-1 px-2 rounded-lg cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </APIProvider>
      </div>

      {/* Bottom Right Floating Action Bar: GPS + Full Extent */}
      <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={handleLocateMe}
          disabled={gpsLoading}
          className="p-3 bg-slate-900/95 hover:bg-slate-800 text-white rounded-2xl border border-slate-700 shadow-xl backdrop-blur-md transition cursor-pointer flex items-center justify-center disabled:opacity-50"
          title="Locate my position using GPS"
        >
          <Navigation className={`w-5 h-5 ${gpsLoading ? 'animate-spin text-emerald-400' : 'text-blue-400'}`} />
        </button>
      </div>

      {/* Bottom Floating Card: Selected Barangay Information */}
      {selectedBarangayData && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-96 z-30 bg-slate-900/95 border border-slate-700 backdrop-blur-xl rounded-2xl p-4 shadow-2xl text-white space-y-3">
          <div className="flex items-start justify-between border-b border-slate-800 pb-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  {selectedBarangayData.name}
                </h3>
                <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.5 rounded">
                  {selectedBarangayData.code}
                </span>
                {selectedBarangayData.isUrban && (
                  <span className="text-[9px] bg-blue-950 text-blue-300 font-bold px-1.5 py-0.5 rounded uppercase">
                    Urban
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Focal Person: <strong className="text-slate-200">{selectedBarangayData.focalPersonName}</strong> ({selectedBarangayData.contactNumber})
              </p>
            </div>
            <button
              onClick={() => setSelectedBarangayData(null)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block font-medium">Swine Inventory</span>
              <span className="text-lg font-black text-white">{selectedBarangayData.swineCount}</span>
              <span className="text-[10px] text-emerald-400 block font-semibold">
                {selectedBarangayData.readyToSellCount} Ready to Sell
              </span>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block font-medium">ASF Biosecurity Zone</span>
              <span
                className={`text-xs font-black uppercase inline-block px-2 py-0.5 rounded mt-1 ${
                  selectedBarangayData.riskLevel === 'red'
                    ? 'bg-red-950 text-red-300 border border-red-800'
                    : selectedBarangayData.riskLevel === 'yellow'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                {selectedBarangayData.riskLevel === 'red'
                  ? 'Red Zone (Infected)'
                  : selectedBarangayData.riskLevel === 'yellow'
                  ? 'Yellow Buffer'
                  : 'Green Free Zone'}
              </span>
            </div>
          </div>

          {/* Transit to Slaughterhouse Telemetry */}
          {selectedBarangayData.slaughterTelemetry && (
            <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/60 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1 font-semibold text-[11px]">
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                  Distance to Slaughterhouse
                </span>
                <span className="font-bold text-white text-xs">
                  {selectedBarangayData.slaughterTelemetry.estimatedRoadDistanceKm} km
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Est. Livestock Transit Time:</span>
                <span className="font-semibold text-slate-200">
                  ~{selectedBarangayData.slaughterTelemetry.estimatedTransitTimeMin} mins
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Nearest Biosecurity Gate:</span>
                <span className="font-semibold text-slate-200 truncate max-w-[170px]">
                  {selectedBarangayData.slaughterTelemetry.nearestCheckpoint.name}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                handlePlotSlaughterRoute(
                  selectedBarangayData.latitude,
                  selectedBarangayData.longitude,
                  selectedBarangayData.name
                );
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-xl transition cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow-md"
            >
              <RouteIcon className="w-3.5 h-3.5" />
              Plot Transit Route
            </button>
            <a
              href={`tel:${selectedBarangayData.contactNumber}`}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition cursor-pointer"
              title="Call Focal Person"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Municipal Boundary Detail Card */}
      {municipalDataOpen && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-[440px] z-30 bg-slate-900/95 border border-sky-500/80 backdrop-blur-xl rounded-2xl p-4 shadow-2xl text-white space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start justify-between border-b border-slate-800 pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></span>
                <h3 className="text-base font-extrabold text-white">
                  {HINUNANGAN_MUNICIPAL_METADATA.fullName}
                </h3>
              </div>
              <p className="text-[11px] text-sky-300 font-medium">
                {HINUNANGAN_MUNICIPAL_METADATA.province} • {HINUNANGAN_MUNICIPAL_METADATA.region}
              </p>
            </div>
            <button
              onClick={() => setMunicipalDataOpen(false)}
              className="text-slate-400 hover:text-white cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block font-medium">Land Area</span>
              <span className="font-extrabold text-white text-sm">168.09 km²</span>
              <span className="text-[9px] text-sky-400 block font-mono">16,808.75 ha</span>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block font-medium">Perimeter</span>
              <span className="font-extrabold text-white text-sm">80.65 km</span>
              <span className="text-[9px] text-slate-400 block">Surveyed Coast</span>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block font-medium">PSGC Code</span>
              <span className="font-extrabold text-white text-sm">086403000</span>
              <span className="text-[9px] text-emerald-400 block font-medium">PSA Official</span>
            </div>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Constituents:</span>
              <span className="font-bold text-white">40 Barangays (38 Mainland + 2 Island)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Offshore Islands:</span>
              <span className="font-bold text-sky-300">San Pablo (Pong Daku) & San Pedro (Pong Gamay)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Borders:</span>
              <span className="text-slate-200">Silago (N), Hinundayan (S), Saint Bernard (W)</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">Offline Storage:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3 h-3" />
                localStorage Cached ({boundaryStorageStatus?.approxStorageKb || 28} KB)
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleFitEntireMunicipality}
              className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-3 rounded-xl transition cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow-md"
            >
              <Compass className="w-3.5 h-3.5" />
              Fit Full Extent
            </button>
            <button
              onClick={handleExportGeoJSON}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 px-3 rounded-xl border border-slate-700 transition cursor-pointer text-xs flex items-center gap-1"
              title="Download standard RFC 7946 GeoJSON dataset"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Export GeoJSON
            </button>
          </div>
        </div>
      )}

      {/* Selected Route Inspector Card */}
      {selectedRoute && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-96 z-30 bg-slate-900/95 border border-slate-700 backdrop-blur-xl rounded-2xl p-4 shadow-2xl text-white space-y-2.5">
          <div className="flex items-start justify-between border-b border-slate-800 pb-2">
            <div>
              <span
                className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded inline-block mb-1"
                style={{ backgroundColor: `${selectedRoute.color}30`, color: selectedRoute.color }}
              >
                {selectedRoute.type.replace('_', ' ')}
              </span>
              <h4 className="text-sm font-bold text-white leading-tight">{selectedRoute.name}</h4>
            </div>
            <button
              onClick={() => setSelectedRoute(null)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-400">{selectedRoute.description}</p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-800/80 rounded-xl p-2 border border-slate-700/60">
              <span className="text-[9px] text-slate-400 block">Length</span>
              <span className="font-bold text-white text-xs">{selectedRoute.totalDistanceKm} km</span>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-2 border border-slate-700/60">
              <span className="text-[9px] text-slate-400 block">Avg Transit</span>
              <span className="font-bold text-white text-xs">~{selectedRoute.estimatedTransitTimeMin}m</span>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-2 border border-slate-700/60">
              <span className="text-[9px] text-slate-400 block">Speed Cap</span>
              <span className="font-bold text-white text-xs">{selectedRoute.speedLimitKmh} km/h</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium mb-1">
              Connected Barangays ({selectedRoute.connectedBarangays.length}):
            </span>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {selectedRoute.connectedBarangays.map(bg => (
                <span
                  key={bg}
                  onClick={() => handleBarangayClick(bg)}
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded cursor-pointer transition"
                >
                  {bg}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Selected Checkpoint Card */}
      {selectedCheckpoint && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-96 z-30 bg-slate-900/95 border border-slate-700 backdrop-blur-xl rounded-2xl p-4 shadow-2xl text-white space-y-2.5">
          <div className="flex items-start justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="text-[9px] uppercase font-bold bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.5 rounded inline-block mb-1">
                {selectedCheckpoint.type.replace('_', ' ')}
              </span>
              <h4 className="text-sm font-bold text-white">{selectedCheckpoint.name}</h4>
            </div>
            <button
              onClick={() => setSelectedCheckpoint(null)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-400">{selectedCheckpoint.description}</p>
          <div className="space-y-1 text-[11px] bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60">
            <p className="text-slate-300">
              <strong className="text-white">Officer on Duty:</strong> {selectedCheckpoint.personnelOnDuty}
            </p>
            <p className="text-slate-300">
              <strong className="text-white">Operating Hours:</strong> {selectedCheckpoint.operatingHours}
            </p>
            <p className="text-slate-300">
              <strong className="text-white">Emergency Hotline:</strong> {selectedCheckpoint.contactNumber}
            </p>
            <p className="text-slate-300">
              <strong className="text-white">Disinfection Tire Bath:</strong>{' '}
              <span className={selectedCheckpoint.disinfectionFacility ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                {selectedCheckpoint.disinfectionFacility ? 'Active & Operational' : 'Not Equipped'}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Active Slaughterhouse Route Banner */}
      {activeSlaughterRoute && (
        <div className="absolute top-16 left-3 right-3 md:right-auto md:w-96 z-30 bg-amber-950/95 border border-amber-600/80 rounded-2xl p-3 text-amber-100 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Truck className="w-4 h-4 text-amber-400" />
              <span>Route: {activeSlaughterRoute.originName} → Abattoir</span>
            </div>
            <p className="text-[11px] text-amber-200/90">
              Distance: <strong>{activeSlaughterRoute.telemetry.estimatedRoadDistanceKm} km</strong> | Est. Transit:{' '}
              <strong>{activeSlaughterRoute.telemetry.estimatedTransitTimeMin} mins</strong>
            </p>
            <p className="text-[10px] text-amber-300/80">
              Passes through: {activeSlaughterRoute.telemetry.nearestCheckpoint.name}
            </p>
          </div>
          <button
            onClick={() => setActiveSlaughterRoute(null)}
            className="text-amber-300 hover:text-white cursor-pointer p-1"
            title="Clear Route"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Collapsible Map Legend (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 z-20 hidden lg:block">
        <div className="bg-slate-900/90 border border-slate-700/80 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden text-xs text-white w-60">
          <div
            onClick={() => setIsLegendOpen(prev => !prev)}
            className="px-3 py-2 bg-slate-800/80 flex items-center justify-between cursor-pointer font-bold text-[11px]"
          >
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              GIS Biosurveillance Legend
            </span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isLegendOpen ? 'rotate-90' : ''}`} />
          </div>

          {isLegendOpen && (
            <div className="p-3 space-y-2 text-[11px]">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  ASF Biosecurity Zones
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-emerald-500/60 border border-emerald-400"></span>
                  <span className="text-slate-200">Green (ASF-Free Protected)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-amber-500/60 border border-amber-400"></span>
                  <span className="text-slate-200">Yellow (Buffer Surveillance)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-red-500/60 border border-red-400"></span>
                  <span className="text-slate-200">Red (Restricted Quarantine)</span>
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="w-4 h-1 bg-sky-500 rounded border border-sky-400"></span>
                  <span className="text-sky-200 font-medium">Outer Municipal Boundary (168 km²)</span>
                </div>
              </div>

              <div className="space-y-1 pt-1 border-t border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Road & Transit Corridors
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-1 bg-red-600 rounded"></span>
                  <span className="text-slate-200">National Highway (N1)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-1 bg-blue-600 rounded"></span>
                  <span className="text-slate-200">Das-ay Valley Arterial</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-1 bg-emerald-600 rounded"></span>
                  <span className="text-slate-200">Farm-to-Market Routes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-0.5 border-t border-dashed border-cyan-400"></span>
                  <span className="text-slate-200">Island Sea Crossing</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
