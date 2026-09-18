import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Users,
  MapPin,
  TrendingUp,
  ShieldCheck,
  Calendar,
  DollarSign,
  Plus,
  FileSpreadsheet,
  FileText,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle,
  Truck,
  Shield,
  Image as ImageIcon,
  FolderOpen,
  Video,
} from 'lucide-react';
import { Barangay, SwineRecord, UserAccount, UserRole } from '../../types';

interface DashboardProps {
  swineList: SwineRecord[];
  barangays: Barangay[];
  currentUser: UserAccount | null;
  currentRole: UserRole;
  onNavigateTab: (tab: string) => void;
  onAddSwine: () => void;
  onOpenBatchModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  swineList,
  barangays,
  currentUser,
  currentRole,
  onNavigateTab,
  onAddSwine,
  onOpenBatchModal,
}) => {
  const [selectedBgFilter, setSelectedBgFilter] = useState<string>(
    currentRole === 'focal' && currentUser?.assignedBarangay ? currentUser.assignedBarangay : 'all'
  );

  // Filter list based on role and selected barangay filter
  const effectiveList = swineList.filter(s => {
    if (s.isArchived) return false;
    const itemBg = (s.barangay || '').toLowerCase();
    if (currentRole === 'focal' && currentUser?.assignedBarangay) {
      return itemBg === (currentUser.assignedBarangay || '').toLowerCase();
    }
    if (selectedBgFilter !== 'all') {
      return itemBg === (selectedBgFilter || '').toLowerCase();
    }
    return true;
  });

  // Calculate Metrics
  const totalSwine = effectiveList.length;
  const readyToSellList = effectiveList.filter(s => s.readyToSell || s.status === 'ready_to_sell');
  const readyToSellCount = readyToSellList.length;
  const totalEstimatedPrice = readyToSellList.reduce((acc, s) => acc + (s.estimatedPricePhp || 0), 0);
  const uniqueFarmers = new Set(
    effectiveList.map(s => (s.farmerName || '').trim().toLowerCase()).filter(Boolean)
  ).size;

  // Swine categories count
  const typeCounts = {
    finisher: effectiveList.filter(s => s.swineType === 'finisher').length,
    grower: effectiveList.filter(s => s.swineType === 'grower').length,
    sow: effectiveList.filter(s => s.swineType === 'sow').length,
    boar: effectiveList.filter(s => s.swineType === 'boar').length,
    piglet: effectiveList.filter(s => s.swineType === 'piglet').length,
  };

  // Top Barangays by Swine count (if admin)
  const barangayCounts: { [key: string]: number } = {};
  swineList.forEach(s => {
    if (!s.isArchived) {
      barangayCounts[s.barangay] = (barangayCounts[s.barangay] || 0) + 1;
    }
  });

  const sortedBarangays = Object.entries(barangayCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Biosecurity adherence
  const bioComplianceRate = Math.round(
    (effectiveList.filter(s => {
      const p = Object.values(s.biosecurity || {}).filter(Boolean).length;
      return p >= 7;
    }).length /
      (totalSwine || 1)) *
      100
  );

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Top Banner & Context */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-950 text-white rounded-2xl p-6 shadow-md border border-emerald-700/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <span>DA Hinunangan Municipal Agriculture Registry</span>
            <span>•</span>
            <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            {currentRole === 'focal'
              ? `Barangay ${currentUser?.assignedBarangay || 'Focal'} Livestock Overview`
              : currentRole === 'agent'
              ? 'Market Ready Swine Catalog & Trader Dashboard'
              : 'Hinunangan Swine Registry & Biosurveillance Analytics'}
          </h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-2xl">
            {currentRole === 'focal'
              ? `Monitoring hog raisers, African Swine Fever biosecurity compliance, and transit clearances for Brgy. ${currentUser?.assignedBarangay}.`
              : currentRole === 'agent'
              ? 'Real-time verified inventory of market-ready hogs from registered Hinunangan farmers.'
              : 'Real-time municipal-wide monitoring across 40 barangays with offline synchronization, GIS mapping, and clearance issuance.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {currentRole !== 'agent' && (
            <>
              <button
                onClick={onAddSwine}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Register Swine
              </button>
              <button
                onClick={() => onNavigateTab('takeoff')}
                className="bg-emerald-950/90 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/50 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                title="View hogs ready for dispatch and takeoff"
              >
                <Truck className="w-4 h-4 text-emerald-300" />
                <span>Ready for Take-Off</span>
                {readyToSellCount > 0 && (
                  <span className="bg-emerald-400 text-emerald-950 px-1.5 py-0.2 rounded-full font-black text-[10px]">
                    {readyToSellCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => onNavigateTab('biosecurity')}
                className="bg-emerald-950/90 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/50 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Shield className="w-4 h-4 text-emerald-300" /> Biosecurity
              </button>
              <button
                onClick={() => onNavigateTab('marketing_alerts')}
                className="bg-emerald-950/90 hover:bg-emerald-900 text-amber-200 border border-amber-500/50 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 text-amber-400" /> Market Alerts
              </button>
            </>
          )}

          <button
            onClick={() => onNavigateTab('gis')}
            className="bg-teal-700 hover:bg-teal-600 text-white font-semibold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <MapPin className="w-4 h-4" /> View GIS Map
          </button>
        </div>
      </div>

      {/* Barangay Scope Filter for Admin */}
      {currentRole === 'admin' && (
        <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-stone-200 text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-emerald-700" />
            <span className="font-semibold text-stone-700">Analytics Scope:</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedBgFilter}
              onChange={e => setSelectedBgFilter(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-stone-800"
            >
              <option value="all">All 40 Hinunangan Barangays</option>
              {barangays.map(b => (
                <option key={b.id} value={b.name}>
                  Brgy. {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Total Swine */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Registered Swine</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-stone-900">{totalSwine}</div>
            <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" /> Heads actively tracked
            </div>
          </div>
        </div>

        {/* Metric 2: Incoming Ready to Sell */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs flex flex-col justify-between bg-gradient-to-b from-white to-amber-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">Incoming to Sell</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-amber-950">{readyToSellCount}</div>
            <div className="text-[11px] text-amber-700 font-medium flex items-center gap-1 mt-0.5">
              <span>Ready for market harvest</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Farmers / Raisers */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Registered Raisers</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-stone-900">{uniqueFarmers}</div>
            <div className="text-[11px] text-blue-700 font-medium mt-0.5">
              Verified hog raisers
            </div>
          </div>
        </div>

        {/* Metric 4: Est. Ready Market Value */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Ready Market Value</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xl sm:text-2xl font-black text-emerald-900">
              ₱{totalEstimatedPrice.toLocaleString()}
            </div>
            <div className="text-[11px] text-stone-500 font-medium mt-0.5">
              Based on live weight
            </div>
          </div>
        </div>

        {/* Metric 5: ASF Biosecurity Safety */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">ASF Safe Compliance</span>
            <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-teal-900">{bioComplianceRate}%</div>
            <div className="text-[11px] text-teal-700 font-medium mt-0.5">
              Meets DA protocols
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Graphs & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Swine Category Breakdown (Custom SVG Visualizer) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-stone-100">
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Swine Lifecycle & Category Breakdown</h3>
              <p className="text-[11px] text-stone-500">Distribution of heads by growth classification</p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
              {totalSwine} Total
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Finisher */}
            <div>
              <div className="flex justify-between font-semibold text-stone-700 mb-1">
                <span>Finishers (Market Ready & Near Harvest)</span>
                <span className="font-bold text-emerald-800">
                  {typeCounts.finisher} heads ({Math.round((typeCounts.finisher / (totalSwine || 1)) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(typeCounts.finisher / (totalSwine || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Grower */}
            <div>
              <div className="flex justify-between font-semibold text-stone-700 mb-1">
                <span>Growers (Growing Phase)</span>
                <span className="font-bold text-blue-800">
                  {typeCounts.grower} heads ({Math.round((typeCounts.grower / (totalSwine || 1)) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(typeCounts.grower / (totalSwine || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Sow */}
            <div>
              <div className="flex justify-between font-semibold text-stone-700 mb-1">
                <span>Breeder Sows (Inahin)</span>
                <span className="font-bold text-purple-800">
                  {typeCounts.sow} heads ({Math.round((typeCounts.sow / (totalSwine || 1)) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(typeCounts.sow / (totalSwine || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Boar */}
            <div>
              <div className="flex justify-between font-semibold text-stone-700 mb-1">
                <span>Breeder Boars (Barako)</span>
                <span className="font-bold text-amber-800">
                  {typeCounts.boar} heads ({Math.round((typeCounts.boar / (totalSwine || 1)) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(typeCounts.boar / (totalSwine || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Piglet */}
            <div>
              <div className="flex justify-between font-semibold text-stone-700 mb-1">
                <span>Piglets & Weanlings</span>
                <span className="font-bold text-teal-800">
                  {typeCounts.piglet} heads ({Math.round((typeCounts.piglet / (totalSwine || 1)) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-teal-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(typeCounts.piglet / (totalSwine || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Top Producing Barangays or Biosecurity Indicators */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-stone-100">
            <div>
              <h3 className="font-bold text-stone-900 text-sm">
                {currentRole === 'admin' ? 'Top Swine Producing Barangays' : 'Biosecurity Compliance Radar'}
              </h3>
              <p className="text-[11px] text-stone-500">
                {currentRole === 'admin' ? 'Leading Hinunangan hog raising areas' : 'ASF standard adherence in jurisdiction'}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('gis')}
              className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {currentRole === 'admin' ? (
            <div className="space-y-3 text-xs">
              {sortedBarangays.map((item, idx) => {
                const maxCount = sortedBarangays[0]?.count || 1;
                const pct = Math.round((item.count / maxCount) * 100);
                return (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="w-6 text-stone-400 font-bold text-right text-[11px]">#{idx + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between font-semibold text-stone-800 mb-1">
                        <span>Brgy. {item.name}</span>
                        <span className="text-emerald-800 font-bold">{item.count} heads</span>
                      </div>
                      <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-700 h-full rounded-full"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[11px] text-emerald-800 font-bold block">No Swill Feeding</span>
                <span className="text-lg font-black text-emerald-950 mt-1 block">100% Passed</span>
                <p className="text-[10px] text-emerald-700 mt-0.5">0 reported swill violations</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[11px] text-emerald-800 font-bold block">Disinfectant Footbaths</span>
                <span className="text-lg font-black text-emerald-950 mt-1 block">94% Compliant</span>
                <p className="text-[10px] text-emerald-700 mt-0.5">Maintained at pen gates</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-[11px] text-blue-800 font-bold block">Enclosed Pens</span>
                <span className="text-lg font-black text-blue-950 mt-1 block">98% Fenced</span>
                <p className="text-[10px] text-blue-700 mt-0.5">Isolated from wild boars</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-[11px] text-amber-800 font-bold block">Veterinary Inspection</span>
                <span className="text-lg font-black text-amber-950 mt-1 block">Active Routine</span>
                <p className="text-[10px] text-amber-700 mt-0.5">Regular MAO Hinunangan visits</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADMIN ONLY: PHOTO & MEDIA OVERVIEW CARD (Req #16) */}
      {currentRole === 'admin' && (
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl p-5 text-white shadow-md border border-emerald-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/30 text-emerald-300">
                <ImageIcon className="w-5 h-5" />
              </span>
              <h3 className="font-bold text-base text-white">Photo & Media</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                ADMIN ONLY
              </span>
            </div>
            <p className="text-xs text-emerald-100/80">
              Manage website branding, landing page hero images, municipal seals, SLSU emblems, and media gallery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs bg-emerald-950/60 backdrop-blur-xs py-2 px-3.5 rounded-xl border border-emerald-700/50">
              <div className="text-center px-1">
                <span className="block font-black text-white text-sm">24</span>
                <span className="text-[10px] text-emerald-200">Media Files</span>
              </div>
              <div className="h-6 w-px bg-emerald-700/50" />
              <div className="text-center px-1">
                <span className="block font-black text-emerald-300 text-sm">8</span>
                <span className="text-[10px] text-emerald-200">Logos</span>
              </div>
              <div className="h-6 w-px bg-emerald-700/50" />
              <div className="text-center px-1">
                <span className="block font-black text-purple-300 text-sm">5</span>
                <span className="text-[10px] text-emerald-200">Backgrounds</span>
              </div>
              <div className="h-6 w-px bg-emerald-700/50" />
              <div className="text-center px-1">
                <span className="block font-black text-amber-300 text-sm">10</span>
                <span className="text-[10px] text-emerald-200">Gallery</span>
              </div>
              <div className="h-6 w-px bg-emerald-700/50" />
              <div className="text-center px-1">
                <span className="block font-black text-red-300 text-sm">3</span>
                <span className="text-[10px] text-emerald-200">Videos</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('admin_photo_media')}
              className="py-2.5 px-5 rounded-xl bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 text-slate-950 font-black text-xs transition cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <span>Manage Media</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Incoming Ready-to-Sell Swine Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Incoming Available to Sell Swine</h3>
              <p className="text-[11px] text-stone-500">Market-ready livestock available for meat traders and butchers</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('records')}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-700 font-semibold border-b border-stone-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Ear Tag</th>
                <th className="py-3 px-4">Farmer / Raiser</th>
                <th className="py-3 px-4">Barangay</th>
                <th className="py-3 px-4">Breed</th>
                <th className="py-3 px-4">Live Weight</th>
                <th className="py-3 px-4">Estimated Price</th>
                <th className="py-3 px-4">Target Sell Date</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {readyToSellList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400">
                    No swine marked as ready to sell at this moment.
                  </td>
                </tr>
              ) : (
                readyToSellList.slice(0, 6).map(swine => (
                  <tr key={swine.id} className="hover:bg-amber-50/40">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-900">{swine.earTagNo}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-stone-900">{swine.farmerName}</div>
                      <div className="text-[10px] text-stone-400">{swine.farmerContact}</div>
                    </td>
                    <td className="py-3 px-4 text-stone-800 font-medium">Brgy. {swine.barangay}</td>
                    <td className="py-3 px-4 text-stone-600">{swine.breed}</td>
                    <td className="py-3 px-4 font-bold text-stone-900">{swine.weightKg} kg</td>
                    <td className="py-3 px-4 font-bold text-emerald-800">
                      ₱{(swine.estimatedPricePhp || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-amber-900 font-semibold">
                      {swine.targetSellDate || 'Immediately'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onNavigateTab('certificate')}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition"
                      >
                        Issue Clearance
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
