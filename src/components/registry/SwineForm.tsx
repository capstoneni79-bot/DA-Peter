import React, { useState } from 'react';
import {
  Upload,
  Camera,
  MapPin,
  ShieldCheck,
  Check,
  Sparkles,
  Layers,
  Save,
  AlertCircle,
  Calendar,
  DollarSign,
  Tag,
  User,
  Phone,
  FileSpreadsheet,
  RefreshCw,
  Scale,
  Droplets,
  School,
  Home,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  BookOpen,
  Lock,
} from 'lucide-react';
import { Barangay, BiosecurityChecklist, SwineRecord, SwineType, UserAccount } from '../../types';
import { storageService } from '../../services/storageService';
import { GisMap } from '../gis/GisMap';
import { SwineMatrixModal } from './SwineMatrixModal';
import {
  calculateAgeFromBirthDate,
  calculateBirthDateFromDays,
  calculateBirthDateFromWeeks,
  autoDetermineSwineCategory,
  estimateWeightFromAgeDays,
  calculateWeightFromTapeFormula,
  calculateEstimatedMarketPrice,
  evaluateSetbackBuffers,
} from '../../utils/swineMatrixCalculator';

interface SwineFormProps {
  barangays: Barangay[];
  currentUser: UserAccount | null;
  initialData?: SwineRecord | null;
  onSuccess: (record: SwineRecord) => void;
  onCancel?: () => void;
  onOpenBatchModal: () => void;
  onViewOrdinance?: () => void;
}

const SAMPLE_SWINE_PHOTOS = [
  { label: 'Finisher 1', url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80' },
  { label: 'Finisher 2', url: 'https://images.unsplash.com/photo-1541689592655-f5f52825a3b8?auto=format&fit=crop&w=600&q=80' },
  { label: 'Breeder Sow', url: 'https://images.unsplash.com/photo-1545468800-856f6620f8b2?auto=format&fit=crop&w=600&q=80' },
  { label: 'Piglet', url: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80' },
  { label: 'Lean Crossbreed', url: 'https://images.unsplash.com/photo-1563281577-a7be47e20db9?auto=format&fit=crop&w=600&q=80' },
];

export const SwineForm: React.FC<SwineFormProps> = ({
  barangays,
  currentUser,
  initialData,
  onSuccess,
  onCancel,
  onOpenBatchModal,
  onViewOrdinance,
}) => {
  // If user is focal person, restrict to their assigned barangay
  const defaultBarangay = currentUser?.assignedBarangay || initialData?.barangay || barangays[0]?.name || 'Poblacion';

  // Ear Tag ID / Code Auto-Generated
  const [earTagNo, setEarTagNo] = useState(
    initialData?.earTagNo ||
      `HNG-${defaultBarangay.substring(0, 3).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [farmerName, setFarmerName] = useState(initialData?.farmerName || '');
  const [farmerContact, setFarmerContact] = useState(initialData?.farmerContact || '');
  const [farmerAddress, setFarmerAddress] = useState(initialData?.farmerAddress || '');
  const [barangay, setBarangay] = useState(defaultBarangay);
  const [rsbsaId, setRsbsaId] = useState(initialData?.rsbsaId || '');
  const [farmType, setFarmType] = useState<'backyard' | 'commercial'>(initialData?.farmType || 'backyard');

  // GIS Pen Coordinates & Setback Buffers
  const defaultBgObj = barangays.find(b => b.name === defaultBarangay) || barangays[0];
  const [latitude, setLatitude] = useState<number>(initialData?.latitude || defaultBgObj?.latitude || 10.3969);
  const [longitude, setLongitude] = useState<number>(initialData?.longitude || defaultBgObj?.longitude || 125.1999);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Setback Buffers
  const [distanceToWaterSource, setDistanceToWaterSource] = useState<number>(
    initialData?.distanceToWaterSourceMeters ?? 35
  );
  const [distanceToTourismSchool, setDistanceToTourismSchool] = useState<number>(
    initialData?.distanceToTourismSchoolMeters ?? 250
  );
  const [distanceToBuiltUp, setDistanceToBuiltUp] = useState<number>(
    initialData?.distanceToBuiltUpMeters ?? 60
  );

  // Automated swine Age (in Days), Automated Category & Weight
  const initialDays = initialData?.ageDays || (initialData?.ageWeeks ? initialData.ageWeeks * 7 : 154);
  const [ageDays, setAgeDays] = useState<number>(initialDays);
  const [ageWeeks, setAgeWeeks] = useState<number>(Math.round(initialDays / 7));
  const [birthDate, setBirthDate] = useState<string>(
    initialData?.birthDate || calculateBirthDateFromDays(initialDays)
  );
  const [weightKg, setWeightKg] = useState<number>(initialData?.weightKg || 88);
  const [swineType, setSwineType] = useState<SwineType>(initialData?.swineType || 'finisher');
  const [breed, setBreed] = useState(initialData?.breed || 'Landrace x Large White');
  const [gender, setGender] = useState<'male' | 'female' | 'castrated'>(initialData?.gender || 'castrated');
  const [status, setStatus] = useState<SwineRecord['status']>(initialData?.status || 'ready_to_sell');
  const [readyToSell, setReadyToSell] = useState<boolean>(initialData?.readyToSell ?? true);
  const [targetSellDate, setTargetSellDate] = useState(
    initialData?.targetSellDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [estimatedPricePhp, setEstimatedPricePhp] = useState<number>(
    initialData?.estimatedPricePhp || Math.round((initialData?.weightKg || 88) * 180)
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [photoUrl, setPhotoUrl] = useState(initialData?.photoUrl || SAMPLE_SWINE_PHOTOS[0].url);

  // Matrix calculation states
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const [useTapeFormula, setUseTapeFormula] = useState(false);
  const [heartGirthCm, setHeartGirthCm] = useState<number>(initialData?.heartGirthCm || 105);
  const [bodyLengthCm, setBodyLengthCm] = useState<number>(initialData?.bodyLengthCm || 95);
  const [autoSyncMatrix, setAutoSyncMatrix] = useState(true);

  // Biosecurity Checklists
  const [biosecurity, setBiosecurity] = useState<BiosecurityChecklist>(
    initialData?.biosecurity || {
      perimeterFence: true,
      footbathInstalled: true,
      disinfectionRoutine: true,
      quarantinePenAvailable: true,
      potableWaterSource: true,
      standardFeedStorage: true,
      asfVaccinationOrTesting: true,
      noSwillFeeding: true,
      visitorLogbook: true,
      wasteLagoonOrCompost: false,
    }
  );

  // Dynamic form fields from admin configuration
  const dynamicFields = storageService.getDynamicFields();
  const biosecurityFields = dynamicFields.filter(f => f.section === 'biosecurity');

  // Automated ASF Biosecurity Standards & Compliance Percentage Calculation
  const standardBiosecurityKeys: (keyof BiosecurityChecklist)[] = [
    'perimeterFence',
    'footbathInstalled',
    'noSwillFeeding',
    'disinfectionRoutine',
    'potableWaterSource',
    'quarantinePenAvailable',
    'asfVaccinationOrTesting',
    'wasteLagoonOrCompost',
  ];
  const standardCheckedCount = standardBiosecurityKeys.filter(k => !!biosecurity[k]).length;
  const customCheckedCount = biosecurityFields.filter(f => !!biosecurity[f.id]).length;
  const totalBiosecurityChecked = standardCheckedCount + customCheckedCount;
  const totalBiosecurityStandards = standardBiosecurityKeys.length + biosecurityFields.length;
  const biosecurityPercentage = Math.round(
    (totalBiosecurityChecked / Math.max(1, totalBiosecurityStandards)) * 100
  );

  // Evaluate setbacks live
  const setbackAudit = evaluateSetbackBuffers(
    distanceToWaterSource,
    distanceToTourismSchool,
    distanceToBuiltUp
  );

  // Calculate current age metrics in days
  const ageDetails = calculateAgeFromBirthDate(birthDate);

  // Ear tag generator: HNG-[BRGY]-[YEAR]-[RAND]
  const handleRegenerateEarTag = (selectedBg: string) => {
    const bgCode = selectedBg.substring(0, 3).toUpperCase();
    const tag = `HNG-${bgCode}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setEarTagNo(tag);
  };

  const handleBarangayChange = (newBg: string) => {
    setBarangay(newBg);
    if (!initialData) {
      handleRegenerateEarTag(newBg);
    }
    const bgObj = barangays.find(b => b.name === newBg);
    if (bgObj) {
      setLatitude(bgObj.latitude + (Math.random() - 0.5) * 0.003);
      setLongitude(bgObj.longitude + (Math.random() - 0.5) * 0.003);
    }
  };

  // Re-center to Brgy GPS
  const handleRecenterToBrgyGps = () => {
    const bgObj = barangays.find(b => b.name === barangay);
    if (bgObj) {
      setLatitude(Number(bgObj.latitude.toFixed(6)));
      setLongitude(Number(bgObj.longitude.toFixed(6)));
    } else {
      setLatitude(10.3969);
      setLongitude(125.1999);
    }
  };

  const handleGetLiveGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
      },
      err => {
        alert('Could not acquire current GPS: ' + err.message);
      },
      { enableHighAccuracy: true }
    );
  };

  // Automated swine Age (in Days), Automated Category & Weight triggers
  const handleBirthDateChange = (newDate: string) => {
    setBirthDate(newDate);
    const details = calculateAgeFromBirthDate(newDate);
    setAgeDays(details.days);
    setAgeWeeks(details.weeks);

    if (autoSyncMatrix) {
      const benchmarkWeight = estimateWeightFromAgeDays(details.days);
      setWeightKg(benchmarkWeight);
      setEstimatedPricePhp(calculateEstimatedMarketPrice(benchmarkWeight));
      const category = autoDetermineSwineCategory(details.days, benchmarkWeight, gender);
      setSwineType(category);
    }
  };

  const handleAgeDaysChange = (newDays: number) => {
    const validDays = Math.max(1, newDays);
    setAgeDays(validDays);
    setAgeWeeks(Math.round(validDays / 7));
    const calculatedBirth = calculateBirthDateFromDays(validDays);
    setBirthDate(calculatedBirth);

    if (autoSyncMatrix) {
      const benchmarkWeight = estimateWeightFromAgeDays(validDays);
      setWeightKg(benchmarkWeight);
      setEstimatedPricePhp(calculateEstimatedMarketPrice(benchmarkWeight));
      const category = autoDetermineSwineCategory(validDays, benchmarkWeight, gender);
      setSwineType(category);
    }
  };

  const handleApplyMatrixValues = (cat: SwineType, wt: number, daysOrWeeks: number) => {
    const days = daysOrWeeks > 50 ? daysOrWeeks : Math.round(daysOrWeeks * 7);
    setSwineType(cat);
    setWeightKg(wt);
    setAgeDays(days);
    setAgeWeeks(Math.round(days / 7));
    setBirthDate(calculateBirthDateFromDays(days));
    setEstimatedPricePhp(calculateEstimatedMarketPrice(wt));
  };

  const handleTapeCalculation = (girth: number, length: number) => {
    setHeartGirthCm(girth);
    setBodyLengthCm(length);
    if (girth > 0 && length > 0) {
      const calculatedWeight = calculateWeightFromTapeFormula(girth, length);
      setWeightKg(calculatedWeight);
      setEstimatedPricePhp(calculateEstimatedMarketPrice(calculatedWeight));
      const category = autoDetermineSwineCategory(Math.round(ageWeeks * 7), calculatedWeight, gender);
      setSwineType(category);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerName.trim()) {
      alert('Please enter the Farmer / Owner Name');
      return;
    }

    const newRecord: SwineRecord = {
      id: initialData?.id || 'swine-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      earTagNo,
      farmerName,
      farmerContact,
      farmerAddress: farmerAddress || `Brgy. ${barangay}, Hinunangan`,
      barangay,
      rsbsaId,
      farmType,
      swineType,
      breed,
      birthDate,
      ageWeeks: Number(ageWeeks),
      ageDays: Number(ageDays),
      ageMonths: Number((ageDays / 30.4375).toFixed(1)),
      weightKg: Number(weightKg),
      gender,
      photoUrl,
      latitude: Number(latitude),
      longitude: Number(longitude),
      distanceToWaterSourceMeters: Number(distanceToWaterSource),
      distanceToTourismSchoolMeters: Number(distanceToTourismSchool),
      distanceToBuiltUpMeters: Number(distanceToBuiltUp),
      setbackCompliant: setbackAudit.allCompliant,
      heartGirthCm: useTapeFormula ? Number(heartGirthCm) : undefined,
      bodyLengthCm: useTapeFormula ? Number(bodyLengthCm) : undefined,
      calculationMethod: useTapeFormula ? 'tape_formula' : 'auto_matrix',
      status: readyToSell ? 'ready_to_sell' : status,
      readyToSell,
      targetSellDate: readyToSell ? targetSellDate : undefined,
      estimatedPricePhp: Number(estimatedPricePhp),
      biosecurity,
      notes,
      isArchived: initialData?.isArchived || false,
      registeredBy: currentUser?.name || 'Authorized DA Personnel',
      registeredAt: initialData?.registeredAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSynced: false,
    };

    if (initialData) {
      storageService.updateSwineRecord(newRecord);
    } else {
      storageService.addSwineRecord(newRecord);
    }

    onSuccess(newRecord);
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-7 mb-6 shadow-md border border-emerald-700/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
            <Layers className="w-4 h-4" /> Official DA Registry Form & Biosecurity Protocol
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1">
            {initialData ? `Edit Swine Record: ${initialData.earTagNo}` : 'Register Farmer & Swine Data'}
          </h2>
          <p className="text-xs text-emerald-200/90 mt-1 max-w-2xl leading-relaxed">
            Standardized registration including <strong>GIS Pen Coordinates & Setback Buffers</strong>, <strong>Automated Age/Category Matrix</strong>, and adherence to <strong>Southern Leyte Provincial Ordinance 2021-018</strong> & <strong>Hinunangan Municipal EO No. 12-2023</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onViewOrdinance && currentUser?.role !== 'focal' && (
            <button
              type="button"
              onClick={onViewOrdinance}
              className="bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/50 text-xs font-semibold px-3 py-2 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition"
            >
              <BookOpen className="w-4 h-4 text-emerald-300" />
              <span>View ASF Decrees</span>
            </button>
          )}

          {!initialData && (
            <button
              type="button"
              onClick={onOpenBatchModal}
              className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-emerald-500/50 shadow-sm flex items-center gap-1.5 cursor-pointer transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Batch CSV Import</span>
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Farmer & Farm Information */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <User className="w-5 h-5 text-emerald-700" />
            <h3 className="font-black text-stone-900 text-base">1. Farmer & Farm Identification</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Farmer / Raiser Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={farmerName}
                onChange={e => setFarmerName(e.target.value)}
                placeholder="e.g. Teodoro M. Maglente"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Contact Number</label>
              <input
                type="text"
                value={farmerContact}
                onChange={e => setFarmerContact(e.target.value)}
                placeholder="0917-000-0000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Barangay <span className="text-red-500">*</span>
              </label>
              <select
                value={barangay}
                disabled={currentUser?.role === 'focal'}
                onChange={e => handleBarangayChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden disabled:bg-stone-100 font-bold text-stone-800"
              >
                {barangays.map(b => (
                  <option key={b.id} value={b.name}>
                    Brgy. {b.name} ({b.riskLevel.toUpperCase()} Zone)
                  </option>
                ))}
              </select>
              {currentUser?.role === 'focal' && (
                <p className="text-[10px] text-blue-600 mt-1">Designated to your focal jurisdiction.</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-stone-700 mb-1">Purok / Sitio / Farm Location</label>
              <input
                type="text"
                value={farmerAddress}
                onChange={e => setFarmerAddress(e.target.value)}
                placeholder="e.g. Purok 2, Near Barangay Spring"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">RSBSA Reference Number</label>
              <input
                type="text"
                value={rsbsaId}
                onChange={e => setRsbsaId(e.target.value)}
                placeholder="08-64-07-001-XXXXXX"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Farm Scale Classification</label>
              <select
                value={farmType}
                onChange={e => setFarmType(e.target.value as 'backyard' | 'commercial')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              >
                <option value="backyard">Backyard Raiser (1 - 10 heads)</option>
                <option value="commercial">Commercial / Semi-Commercial (11+ heads)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: GIS Pen Coordinates & Setback Buffers */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-700" />
              <div>
                <h3 className="font-black text-stone-900 text-base">
                  2. GIS Pen Coordinates & Setback Buffers
                </h3>
                <span className="text-[11px] text-stone-500">
                  Enforced under Hinunangan Municipal EO 12-2023 & Provincial Ordinance 2021-018
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRecenterToBrgyGps}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Reset coordinates to official Barangay centroid GPS"
              >
                <RefreshCw className="w-3.5 h-3.5 text-stone-600" />
                <span>Re-center to Brgy GPS</span>
              </button>

              <button
                type="button"
                onClick={handleGetLiveGps}
                className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Current GPS</span>
              </button>
            </div>
          </div>

          {/* Latitude & Longitude Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Latitude (GPS) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.000001"
                required
                value={latitude}
                onChange={e => setLatitude(Number(e.target.value))}
                placeholder="10.3969"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono font-bold text-stone-900 bg-stone-50/50 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
              <span className="text-[10px] text-stone-500 mt-1 block">Default: 10.3969 (Hinunangan Corridor)</span>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Longitude (GPS) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.000001"
                required
                value={longitude}
                onChange={e => setLongitude(Number(e.target.value))}
                placeholder="125.1999"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono font-bold text-stone-900 bg-stone-50/50 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
              <span className="text-[10px] text-stone-500 mt-1 block">Default: 125.1999 (Hinunangan Corridor)</span>
            </div>
          </div>

          {/* Three Statutory Environmental & Zoning Setbacks */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-800 text-xs uppercase tracking-wide">
                Mandatory Physical Setback Distances (Zoning & Clean Water Act)
              </span>
              <span className="text-[11px] text-stone-500">Must satisfy minimum legal clearances</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Setback 1: Distance to Water Source */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  setbackAudit.waterCompliant
                    ? 'bg-emerald-50/40 border-emerald-300'
                    : 'bg-red-50/60 border-red-300 ring-1 ring-red-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    <label className="font-black text-stone-900">Distance to Water Source (m)</label>
                  </div>
                  {setbackAudit.waterCompliant ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                </div>

                <div className="text-[11px] font-bold text-stone-500 mb-2">
                  Min required: <strong className="text-stone-900">&gt;25m</strong>
                </div>

                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={distanceToWaterSource}
                  onChange={e => setDistanceToWaterSource(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600"
                />

                {setbackAudit.waterCompliant ? (
                  <div className="mt-2 text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Compliant (&gt;25m buffer)</span>
                  </div>
                ) : (
                  <div className="mt-2 text-[10px] text-red-700 font-bold flex items-start gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-600 shrink-0 mt-0.5" />
                    <span>Violation: &le;25m risks leachate into water table</span>
                  </div>
                )}
              </div>

              {/* Setback 2: Distance to Tourism / School */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  setbackAudit.tourismSchoolCompliant
                    ? 'bg-emerald-50/40 border-emerald-300'
                    : 'bg-red-50/60 border-red-300 ring-1 ring-red-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <School className="w-4 h-4 text-purple-600" />
                    <label className="font-black text-stone-900">Distance to Tourism / School (m)</label>
                  </div>
                  {setbackAudit.tourismSchoolCompliant ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                </div>

                <div className="text-[11px] font-bold text-stone-500 mb-2">
                  Min required: <strong className="text-stone-900">&gt;200m</strong>
                </div>

                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={distanceToTourismSchool}
                  onChange={e => setDistanceToTourismSchool(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600"
                />

                {setbackAudit.tourismSchoolCompliant ? (
                  <div className="mt-2 text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Compliant (&gt;200m buffer)</span>
                  </div>
                ) : (
                  <div className="mt-2 text-[10px] text-red-700 font-bold flex items-start gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-600 shrink-0 mt-0.5" />
                    <span>Violation: &le;200m near school/resort</span>
                  </div>
                )}
              </div>

              {/* Setback 3: Distance to Built-up Area */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  setbackAudit.builtUpCompliant
                    ? 'bg-emerald-50/40 border-emerald-300'
                    : 'bg-red-50/60 border-red-300 ring-1 ring-red-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Home className="w-4 h-4 text-amber-600" />
                    <label className="font-black text-stone-900">Distance to Built-up Area (m)</label>
                  </div>
                  {setbackAudit.builtUpCompliant ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                </div>

                <div className="text-[11px] font-bold text-stone-500 mb-2">
                  Min required: <strong className="text-stone-900">&gt;50m</strong>
                </div>

                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={distanceToBuiltUp}
                  onChange={e => setDistanceToBuiltUp(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600"
                />

                {setbackAudit.builtUpCompliant ? (
                  <div className="mt-2 text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Compliant (&gt;50m buffer)</span>
                  </div>
                ) : (
                  <div className="mt-2 text-[10px] text-red-700 font-bold flex items-start gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-600 shrink-0 mt-0.5" />
                    <span>Violation: &le;50m from neighbor homes</span>
                  </div>
                )}
              </div>
            </div>

            {/* Setback Status Notice */}
            <div
              className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                setbackAudit.allCompliant
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-2">
                {setbackAudit.allCompliant ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span className="font-semibold text-[11px]">
                  {setbackAudit.allCompliant
                    ? 'All 3 Setback Buffers Satisfied: Compliant with Southern Leyte Prov. Ord. 2021-018 & Hinunangan EO 12-2023.'
                    : `Setback Alert: ${setbackAudit.violationsCount} buffer condition(s) do not meet municipal minimum requirements.`}
                </span>
              </div>
              {onViewOrdinance && (
                <button
                  type="button"
                  onClick={onViewOrdinance}
                  className="text-[11px] font-bold text-emerald-800 hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <span>Ordinance Details</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Map Picker Collapsible */}
          <div>
            <button
              type="button"
              onClick={() => setShowMapPicker(!showMapPicker)}
              className="text-xs text-emerald-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              {showMapPicker ? '▼ Hide Interactive Map Picker' : '▶ Show Interactive Map Picker (Click map to adjust pin)'}
            </button>

            {showMapPicker && (
              <div className="mt-2 rounded-2xl overflow-hidden border border-stone-200 shadow-xs">
                <GisMap
                  swineList={[]}
                  barangays={barangays}
                  selectedBarangay={barangay}
                  isLocationPicker={true}
                  initialCenter={[latitude, longitude]}
                  onPickLocation={(lat, lng, closestBg) => {
                    setLatitude(Number(lat.toFixed(6)));
                    setLongitude(Number(lng.toFixed(6)));
                    if (closestBg && currentUser?.role !== 'focal') {
                      setBarangay(closestBg);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Swine Specifications (Automated Swine Age, Automated Category & Weight) */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-700" />
              <div>
                <h3 className="font-black text-stone-900 text-base">
                  3. Swine Specifications (Automated Age, Category & Weight)
                </h3>
                <span className="text-[11px] text-stone-500">
                  DA-BAI Philippine Swine Growth Matrix & Municipal Farmgate Engine
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMatrixModalOpen(true)}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Auto-Calculated Matrix</span>
              </button>
            </div>
          </div>

          {/* Ear Tag Identification Card with Auto-Generated Badge (LOCKED) */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <label className="font-black text-emerald-950 text-xs">Ear Tag ID / Code</label>
                <span className="px-2 py-0.5 rounded-full bg-emerald-800 text-white font-black text-[10px] tracking-wide flex items-center gap-1 shadow-2xs">
                  <Lock className="w-2.5 h-2.5 text-emerald-300" /> Locked & Auto-Generated
                </span>
              </div>
              <p className="text-[11px] text-emerald-900">
                Official Hinunangan barcode & ear tag structure: <code>[HNG]-[BRGY]-[YEAR]-[SEQ]</code>. Locked against manual tampering.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  required
                  value={earTagNo}
                  className="px-3.5 py-2 pl-8 rounded-xl border border-emerald-300 font-mono font-black text-sm text-emerald-950 bg-emerald-100/70 cursor-not-allowed select-none shadow-inner"
                  title="Ear Tag ID is locked and auto-generated by the municipal registry"
                />
                <Lock className="w-3.5 h-3.5 text-emerald-700 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Automated Swine Age & Matrix Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {/* Birth Date / Farrowing Date */}
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Birth Date / Farrowing Date
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={e => handleBirthDateChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-600 font-semibold text-stone-900"
              />
              <span className="text-[10px] text-stone-500 mt-1 block">Farrowing record</span>
            </div>

            {/* Automated Age in Days */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-stone-700">Age (Days)</label>
                <span className="text-[10px] text-emerald-700 font-black">Auto-Calculated</span>
              </div>
              <input
                type="number"
                min="1"
                max="2500"
                value={ageDays}
                onChange={e => handleAgeDaysChange(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-bold text-stone-900 focus:ring-2 focus:ring-emerald-600 bg-white"
              />
              <span className="text-[10px] text-emerald-800 font-semibold mt-1 block truncate">
                {ageDays} Days Old
              </span>
            </div>

            {/* Automated Swine Category */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-stone-700">Automated Category</label>
                <span className="text-[10px] text-emerald-700 font-black">Matrix Synced</span>
              </div>
              <select
                value={swineType}
                onChange={e => setSwineType(e.target.value as SwineType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-600 font-bold text-stone-900 capitalize"
              >
                <option value="piglet">Piglet / Weanling (Biik)</option>
                <option value="grower">Grower (Lumalaki)</option>
                <option value="finisher">Finisher (Market Ready)</option>
                <option value="sow">Breeder Sow (Inahin)</option>
                <option value="boar">Breeder Boar (Barako)</option>
              </select>
              <span className="text-[10px] text-stone-500 mt-1 block">Based on growth velocity</span>
            </div>

            {/* Gender */}
            <div>
              <label className="block font-bold text-stone-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={e => {
                  const g = e.target.value as 'male' | 'female' | 'castrated';
                  setGender(g);
                  if (autoSyncMatrix) {
                    const cat = autoDetermineSwineCategory(ageDays, weightKg, g);
                    setSwineType(cat);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-600 font-medium"
              >
                <option value="castrated">Castrated Male (Kapon)</option>
                <option value="female">Female</option>
                <option value="male">Intact Male (Barako)</option>
              </select>
            </div>

            {/* Breed */}
            <div>
              <label className="block font-bold text-stone-700 mb-1">Breed / Genetics</label>
              <input
                type="text"
                value={breed}
                onChange={e => setBreed(e.target.value)}
                placeholder="e.g. Landrace x Large White"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {/* Automated Live Weight */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-stone-700">Live Weight (kg)</label>
                <span className="text-[10px] text-stone-500 font-medium">DA Benchmark</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="450"
                  value={weightKg}
                  onChange={e => {
                    const wt = Number(e.target.value);
                    setWeightKg(wt);
                    setEstimatedPricePhp(calculateEstimatedMarketPrice(wt));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono font-black text-sm text-stone-900 focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <span className="text-[10px] text-stone-500 mt-1 block">
                Target finisher: 85 - 100 kg
              </span>
            </div>

            {/* Estimated Price PHP */}
            <div>
              <label className="block font-bold text-stone-700 mb-1">Estimated Value (₱)</label>
              <div className="relative">
                <input
                  type="number"
                  step="50"
                  value={estimatedPricePhp}
                  onChange={e => setEstimatedPricePhp(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono font-black text-sm text-emerald-900 bg-emerald-50/30 focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <span className="text-[10px] text-emerald-700 font-medium mt-1 block">
                ₱180/kg municipal farmgate
              </span>
            </div>

            {/* Health Status */}
            <div>
              <label className="block font-bold text-stone-700 mb-1">Health Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as SwineRecord['status'])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-emerald-600 font-bold"
              >
                <option value="healthy">Healthy & Active</option>
                <option value="ready_to_sell">Ready to Sell (Market Ready)</option>
                <option value="quarantined">Under Observation / Quarantined</option>
                <option value="sick">Sick (Requires Veterinary Visit)</option>
              </select>
            </div>
          </div>

          {/* Tape Measure Formula Toggle */}
          <div className="border-t border-stone-100 pt-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800 text-xs">
                <input
                  type="checkbox"
                  checked={useTapeFormula}
                  onChange={e => setUseTapeFormula(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                />
                <span className="flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-amber-600" />
                  <span>Use Measuring Tape Formula (When scale is not available in purok)</span>
                </span>
              </label>

              {useTapeFormula && (
                <span className="text-[11px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                  Formula: Girth² × Length ÷ 11,877
                </span>
              )}
            </div>

            {useTapeFormula && (
              <div className="mt-3 p-4 rounded-2xl bg-amber-50/50 border border-amber-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-in fade-in">
                <div>
                  <label className="block font-bold text-amber-950 mb-1">Heart Girth (cm)</label>
                  <input
                    type="number"
                    value={heartGirthCm}
                    onChange={e => handleTapeCalculation(Number(e.target.value), bodyLengthCm)}
                    placeholder="e.g. 105"
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white font-mono font-bold"
                  />
                  <span className="text-[10px] text-amber-800 mt-1 block">Circumference behind front legs</span>
                </div>

                <div>
                  <label className="block font-bold text-amber-950 mb-1">Body Length (cm)</label>
                  <input
                    type="number"
                    value={bodyLengthCm}
                    onChange={e => handleTapeCalculation(heartGirthCm, Number(e.target.value))}
                    placeholder="e.g. 95"
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white font-mono font-bold"
                  />
                  <span className="text-[10px] text-amber-800 mt-1 block">Base of ears to base of tail</span>
                </div>

                <div className="flex flex-col justify-end">
                  <div className="bg-white p-2.5 rounded-xl border border-amber-300 text-center">
                    <span className="text-[10px] font-bold text-stone-500 uppercase block">Calculated Weight:</span>
                    <span className="text-base font-black text-amber-900 font-mono">
                      {calculateWeightFromTapeFormula(heartGirthCm, bodyLengthCm)} kg
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Market Ready Checkbox Banner */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-900">
              <input
                type="checkbox"
                checked={readyToSell}
                onChange={e => {
                  setReadyToSell(e.target.checked);
                  if (e.target.checked) setStatus('ready_to_sell');
                }}
                className="w-4 h-4 text-amber-600 rounded border-amber-400 focus:ring-amber-500"
              />
              <span>Mark this Swine as "Ready to Sell" (Enters Swine Take-Off & Marketing Alerts)</span>
            </label>

            {readyToSell && (
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-900">Target Take-Off Date:</span>
                <input
                  type="date"
                  value={targetSellDate}
                  onChange={e => setTargetSellDate(e.target.value)}
                  className="bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-800"
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Swine Photo Verification */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <Camera className="w-5 h-5 text-emerald-700" />
            <h3 className="font-black text-stone-900 text-base">4. Swine Picture & Physical Verification</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block font-bold text-stone-700 mb-2">
                Swine Photo (Device Camera or File Upload)
              </label>

              <div className="flex items-center gap-3 mb-3">
                <label className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-4 py-2.5 rounded-xl border border-emerald-300 cursor-pointer flex items-center gap-2 transition">
                  <Upload className="w-4 h-4" />
                  <span>Upload / Snap Photo</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {/* Sample Photo Selector */}
              <div className="space-y-1">
                <span className="text-[11px] text-stone-500 font-medium">Quick sample catalog photo:</span>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_SWINE_PHOTOS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPhotoUrl(item.url)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition ${
                        photoUrl === item.url
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="block font-semibold text-stone-700 mb-1">Image URL / Path</label>
                <input
                  type="text"
                  value={photoUrl}
                  onChange={e => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-[11px] font-mono"
                />
              </div>
            </div>

            {/* Photo Preview Card */}
            <div>
              <span className="block font-bold text-stone-700 mb-2">Live Verification Preview</span>
              <div className="w-full h-44 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 flex items-center justify-center overflow-hidden relative shadow-inner">
                {photoUrl ? (
                  <img src={photoUrl} alt="Swine Preview" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <span className="text-stone-400 font-medium">No photo selected</span>
                )}
                <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-emerald-400" />
                  <span>{earTagNo}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: African Swine Fever (ASF) Biosecurity Standards & Decrees */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <div>
                <h3 className="font-black text-stone-900 text-base">
                  5. African Swine Fever (ASF) Biosecurity Standards & Compliance
                </h3>
                <span className="text-[11px] text-stone-500">
                  Enforcing Hinunangan EO 12-2023 & Southern Leyte Provincial Ordinance 2021-018
                </span>
              </div>
            </div>

            {onViewOrdinance && currentUser?.role !== 'focal' && (
              <button
                type="button"
                onClick={onViewOrdinance}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
              >
                <span>Read Official Legal Mandates</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Automatic Calculated Biosecurity Compliance Percentage Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50/30 border border-emerald-200/90 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-emerald-950">
                  {biosecurityPercentage}%
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-xs text-stone-900">Biosecurity Score</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-700 text-white font-black text-[9px] tracking-wide uppercase">
                      Auto-Calculated
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500">
                    {totalBiosecurityChecked} of {totalBiosecurityStandards} Standards Verified
                  </span>
                </div>
              </div>

              <div>
                {biosecurityPercentage >= 80 ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center gap-1.5 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Low ASF Risk • Green Zone Certified</span>
                  </span>
                ) : biosecurityPercentage >= 50 ? (
                  <span className="px-3 py-1 rounded-full bg-amber-500 text-white font-black text-xs flex items-center gap-1.5 shadow-2xs">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Moderate Risk • Conditional Pre-Movement</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-red-600 text-white font-black text-xs flex items-center gap-1.5 shadow-2xs">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>High ASF Risk • Movement Prohibited</span>
                  </span>
                )}
              </div>
            </div>

            {/* Dynamic Progress Bar */}
            <div className="w-full bg-stone-200/80 rounded-full h-3 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  biosecurityPercentage >= 80
                    ? 'bg-emerald-600'
                    : biosecurityPercentage >= 50
                    ? 'bg-amber-500'
                    : 'bg-red-600'
                }`}
                style={{ width: `${Math.max(4, biosecurityPercentage)}%` }}
              />
            </div>

            {!biosecurity.noSwillFeeding && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>
                  <strong>Strict Prohibition Alert:</strong> Feeding kitchen scraps/swill ("Pasaw") is banned under Hinunangan EO 12-2023. Compliance cannot pass without 100% swill feeding prohibition.
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-stone-500">
            Check or uncheck measures below to automatically update the compliance percentage score:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={biosecurity.perimeterFence}
                onChange={e => setBiosecurity({ ...biosecurity, perimeterFence: e.target.checked })}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
              />
              <div>
                <span className="font-bold text-stone-900">Perimeter Fence / Barrier Pen</span>
                <p className="text-[11px] text-stone-500">Enclosed pen preventing contact with stray animals & wildlife.</p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={biosecurity.footbathInstalled}
                onChange={e => setBiosecurity({ ...biosecurity, footbathInstalled: e.target.checked })}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
              />
              <div>
                <span className="font-bold text-stone-900">Entrance Footbath with Disinfectant</span>
                <p className="text-[11px] text-stone-500">Active chemical or lime footbath at pen entrance.</p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={biosecurity.noSwillFeeding}
                onChange={e => setBiosecurity({ ...biosecurity, noSwillFeeding: e.target.checked })}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
              />
              <div>
                <span className="font-bold text-emerald-950">100% No Swill Feeding ("Bawal ang Pasaw")</span>
                <p className="text-[11px] text-emerald-900">
                  Strictly prohibits feeding restaurant scraps/kanin-baboy under Section 3 of EO 12-2023.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={biosecurity.disinfectionRoutine}
                onChange={e => setBiosecurity({ ...biosecurity, disinfectionRoutine: e.target.checked })}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
              />
              <div>
                <span className="font-bold text-stone-900">Scheduled Pen Disinfection</span>
                <p className="text-[11px] text-stone-500">Routine weekly chemical spraying of walls and floor.</p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={biosecurity.potableWaterSource}
                onChange={e => setBiosecurity({ ...biosecurity, potableWaterSource: e.target.checked })}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
              />
              <div>
                <span className="font-bold text-stone-900">Clean & Potable Water Source</span>
                <p className="text-[11px] text-stone-500">Direct clean tap, spring, or deepwell water.</p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={biosecurity.quarantinePenAvailable}
                onChange={e => setBiosecurity({ ...biosecurity, quarantinePenAvailable: e.target.checked })}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
              />
              <div>
                <span className="font-bold text-stone-900">Isolation / Quarantine Pen</span>
                <p className="text-[11px] text-stone-500">Dedicated area for sick swine or new acquisitions.</p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={biosecurity.asfVaccinationOrTesting}
                onChange={e => setBiosecurity({ ...biosecurity, asfVaccinationOrTesting: e.target.checked })}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
              />
              <div>
                <span className="font-bold text-stone-900">DA Veterinary Clearance / ASF Negative</span>
                <p className="text-[11px] text-stone-500">Inspected by Municipal Agriculture Office or Barangay Focal.</p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={biosecurity.wasteLagoonOrCompost}
                onChange={e => setBiosecurity({ ...biosecurity, wasteLagoonOrCompost: e.target.checked })}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
              />
              <div>
                <span className="font-bold text-stone-900">Waste Management Lagoon / Bio-compost</span>
                <p className="text-[11px] text-stone-500">Proper manure disposal compliant with sanitation codes.</p>
              </div>
            </label>

            {/* Custom dynamic fields */}
            {biosecurityFields.map(f => (
              <label key={f.id} className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={!!biosecurity[f.id]}
                  onChange={e => setBiosecurity({ ...biosecurity, [f.id]: e.target.checked })}
                  className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-stone-900">{f.label}</span>
                  <p className="text-[11px] text-stone-500">Custom checklist configured in system.</p>
                </div>
              </label>
            ))}
          </div>

          <div className="pt-2">
            <label className="block font-bold text-stone-700 text-xs mb-1">
              Field Inspection Remarks & Observations
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Swine is healthy and active. All 3 setback buffers verified with laser/measuring tape. Checked by Barangay Focal Person."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs shadow-md hover:shadow-lg flex items-center gap-2 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{initialData ? 'Update Swine Record' : 'Save Swine to Registry'}</span>
          </button>
        </div>
      </form>

      {/* Swine Growth & Weight Matrix Modal */}
      <SwineMatrixModal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        currentAgeWeeks={ageWeeks}
        currentWeightKg={weightKg}
        onApplyStage={handleApplyMatrixValues}
      />
    </div>
  );
};
