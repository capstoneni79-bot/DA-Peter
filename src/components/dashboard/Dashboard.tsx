import React, { useState } from 'react';
import { SwineFarmRegistrationModal } from './SwineFarmRegistrationModal';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
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
  Building2,
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
  PieChart as PieIcon,
  BarChart3,
  CircleDot,
  Activity,
  SlidersHorizontal,
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
  const [isFarmRegModalOpen, setIsFarmRegModalOpen] = useState<boolean>(false);
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

  // Graph Visualization & Analytics Choices
  type GraphType = 'pie' | 'donut' | 'bar' | 'hbar' | 'area' | 'line';
  type GraphDimension = 'category' | 'barangay' | 'status' | 'valuation' | 'biosecurity';

  const [graphType, setGraphType] = useState<GraphType>('pie');
  const [graphDimension, setGraphDimension] = useState<GraphDimension>('category');

  // Chart Datasets & Metric Builders
  const categoryChartData = [
    { name: 'Finishers', value: typeCounts.finisher, count: typeCounts.finisher, color: '#059669', desc: 'Market Ready (>80kg)' },
    { name: 'Growers', value: typeCounts.grower, count: typeCounts.grower, color: '#2563eb', desc: 'Growing Phase (30-79kg)' },
    { name: 'Breeder Sows', value: typeCounts.sow, count: typeCounts.sow, color: '#9333ea', desc: 'Inahin (Active Sows)' },
    { name: 'Breeder Boars', value: typeCounts.boar, count: typeCounts.boar, color: '#d97706', desc: 'Barako (Stud Boars)' },
    { name: 'Piglets', value: typeCounts.piglet, count: typeCounts.piglet, color: '#0d9488', desc: 'Weanlings & Sucklings' },
  ];

  const barangayChartData = sortedBarangays.map((b, idx) => ({
    name: b.name.length > 12 ? `${b.name.slice(0, 10)}..` : b.name,
    fullName: `Barangay ${b.name}`,
    value: b.count,
    count: b.count,
    color: ['#059669', '#0d9488', '#2563eb', '#7c3aed', '#d97706', '#dc2626', '#4f46e5', '#0891b2'][idx % 8],
    desc: `${b.count} registered heads`,
  }));

  const statusChartData = [
    {
      name: 'Ready for Take-Off',
      value: readyToSellCount,
      count: readyToSellCount,
      color: '#059669',
      desc: 'Prime for market sale & butcher dispatch',
    },
    {
      name: 'Growing Stage',
      value: Math.max(0, totalSwine - readyToSellCount - typeCounts.sow - typeCounts.boar),
      count: Math.max(0, totalSwine - readyToSellCount - typeCounts.sow - typeCounts.boar),
      color: '#2563eb',
      desc: 'In feeding and weight development',
    },
    {
      name: 'Breeder Herd',
      value: typeCounts.sow + typeCounts.boar,
      count: typeCounts.sow + typeCounts.boar,
      color: '#9333ea',
      desc: 'Breeding sows and boars',
    },
  ];

  const valuationChartData = [
    {
      name: 'Finishers',
      value: effectiveList.filter(s => s.swineType === 'finisher').reduce((a, b) => a + (b.estimatedPricePhp || 13500), 0),
      color: '#059669',
      desc: 'Live harvest valuation',
    },
    {
      name: 'Growers',
      value: effectiveList.filter(s => s.swineType === 'grower').reduce((a, b) => a + (b.estimatedPricePhp || 8500), 0),
      color: '#2563eb',
      desc: 'Mid-stage asset valuation',
    },
    {
      name: 'Breeder Sows',
      value: effectiveList.filter(s => s.swineType === 'sow').reduce((a, b) => a + (b.estimatedPricePhp || 19000), 0),
      color: '#9333ea',
      desc: 'Breeding stock capital',
    },
    {
      name: 'Breeder Boars',
      value: effectiveList.filter(s => s.swineType === 'boar').reduce((a, b) => a + (b.estimatedPricePhp || 24000), 0),
      color: '#d97706',
      desc: 'Genetic asset valuation',
    },
    {
      name: 'Piglets',
      value: effectiveList.filter(s => s.swineType === 'piglet').reduce((a, b) => a + (b.estimatedPricePhp || 3500), 0),
      color: '#0d9488',
      desc: 'Weanling market stock',
    },
  ];

  const biosecurityChartData = [
    {
      name: 'High Adherence (9-10/10)',
      value: effectiveList.filter(s => Object.values(s.biosecurity || {}).filter(Boolean).length >= 9).length,
      color: '#059669',
      desc: 'Full DA perimeter & hygiene isolation',
    },
    {
      name: 'Standard (7-8/10)',
      value: effectiveList.filter(s => {
        const c = Object.values(s.biosecurity || {}).filter(Boolean).length;
        return c >= 7 && c < 9;
      }).length,
      color: '#2563eb',
      desc: 'Satisfactory municipal clearance level',
    },
    {
      name: 'Moderate (5-6/10)',
      value: effectiveList.filter(s => {
        const c = Object.values(s.biosecurity || {}).filter(Boolean).length;
        return c >= 5 && c < 7;
      }).length,
      color: '#d97706',
      desc: 'Requires additional sanitation setup',
    },
    {
      name: 'Needs Review (<5/10)',
      value: effectiveList.filter(s => Object.values(s.biosecurity || {}).filter(Boolean).length < 5).length,
      color: '#dc2626',
      desc: 'Under MAO Hinunangan advisories',
    },
  ];

  // Pick active dataset based on dimension
  const currentChartData =
    graphDimension === 'category'
      ? categoryChartData
      : graphDimension === 'barangay'
      ? barangayChartData
      : graphDimension === 'status'
      ? statusChartData
      : graphDimension === 'valuation'
      ? valuationChartData
      : biosecurityChartData;

  const currentTotalValue = currentChartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Top Banner & Context */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-950 text-white rounded-2xl p-6 shadow-md border border-emerald-700/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">
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
        <div className="flex items-center gap-2.5 flex-wrap">
          {currentRole !== 'agent' && (
            <button
              onClick={() => setIsFarmRegModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>Swine Farm Registration</span>
            </button>
          )}

          <button
            onClick={() => onNavigateTab('gis')}
            className="bg-teal-700 hover:bg-teal-600 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <MapPin className="w-4 h-4" />
            <span>View GIS Map</span>
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

      {/* ===================== INTERACTIVE ANALYTICS & GRAPH CHOICES SUITE ===================== */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-6">
        {/* Graph Controls Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5 border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-stone-900 text-base">Livestock Visual Analytics & Charts</h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Select your preferred visual graph representation and dataset metric dimension.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Dimension / Metric Dropdown Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-600 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" /> Metric:
              </span>
              <select
                value={graphDimension}
                onChange={e => setGraphDimension(e.target.value as GraphDimension)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl border border-stone-300 bg-stone-50 text-stone-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer shadow-2xs"
              >
                <option value="category">Swine Lifecycle & Classification</option>
                <option value="barangay">Barangay Geographic Distribution</option>
                <option value="status">Market Readiness & Dispatch Status</option>
                <option value="valuation">Estimated Market Valuation (PHP ₱)</option>
                <option value="biosecurity">ASF Biosecurity Compliance Safety</option>
              </select>
            </div>

            {/* Graph Type Choice Pills */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
              <button
                type="button"
                onClick={() => setGraphType('pie')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                  graphType === 'pie'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Pie Chart"
              >
                <PieIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pie</span>
              </button>

              <button
                type="button"
                onClick={() => setGraphType('donut')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                  graphType === 'donut'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Donut Radial Ring Chart"
              >
                <CircleDot className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Donut</span>
              </button>

              <button
                type="button"
                onClick={() => setGraphType('bar')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                  graphType === 'bar'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Vertical Bar Chart"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bar</span>
              </button>

              <button
                type="button"
                onClick={() => setGraphType('hbar')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                  graphType === 'hbar'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Horizontal Bar Chart"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Rank</span>
              </button>

              <button
                type="button"
                onClick={() => setGraphType('area')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                  graphType === 'area'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Area Trend Chart"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Area</span>
              </button>

              <button
                type="button"
                onClick={() => setGraphType('line')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                  graphType === 'line'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Line Trend Graph"
              >
                <Activity className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Line</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Graph Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Chart Viewport (7 cols) */}
          <div className="lg:col-span-7 bg-stone-50/60 p-4 rounded-2xl border border-stone-200/80">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                {graphDimension === 'category' && 'Category Head Count'}
                {graphDimension === 'barangay' && 'Top Barangays Concentration'}
                {graphDimension === 'status' && 'Market Readiness Breakdown'}
                {graphDimension === 'valuation' && 'Estimated Live Valuation (PHP ₱)'}
                {graphDimension === 'biosecurity' && 'ASF Biosecurity Compliance'}
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                {graphDimension === 'valuation'
                  ? `₱${currentTotalValue.toLocaleString('en-PH')}`
                  : `${currentTotalValue} Heads`}
              </span>
            </div>

            <div className="w-full h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                {graphType === 'pie' ? (
                  <PieChart>
                    <Tooltip
                      formatter={(val: number | string | undefined) => [
                        graphDimension === 'valuation'
                          ? `₱${Number(val || 0).toLocaleString('en-PH')}`
                          : `${Number(val || 0)} heads (${(
                              (Number(val || 0) / (currentTotalValue || 1)) *
                              100
                            ).toFixed(1)}%)`,
                        'Count',
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Pie
                      data={currentChartData}
                      cx="50%"
                      cy="46%"
                      outerRadius={85}
                      dataKey="value"
                      nameKey="name"
                      label={({ percent }: { percent?: number }) => `${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {currentChartData.map((entry, index) => (
                        <Cell key={`pie-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                ) : graphType === 'donut' ? (
                  <PieChart>
                    <Tooltip
                      formatter={(val: number | string | undefined) => [
                        graphDimension === 'valuation'
                          ? `₱${Number(val || 0).toLocaleString('en-PH')}`
                          : `${Number(val || 0)} heads (${(
                              (Number(val || 0) / (currentTotalValue || 1)) *
                              100
                            ).toFixed(1)}%)`,
                        'Count',
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Pie
                      data={currentChartData}
                      cx="50%"
                      cy="46%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                    >
                      {currentChartData.map((entry, index) => (
                        <Cell key={`donut-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                ) : graphType === 'bar' ? (
                  <BarChart data={currentChartData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      angle={-15}
                      textAnchor="end"
                      tick={{ fontSize: 10, fill: '#475569' }}
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#475569' }} />
                    <Tooltip
                      formatter={(val: number | string | undefined) => [
                        graphDimension === 'valuation'
                          ? `₱${Number(val || 0).toLocaleString('en-PH')}`
                          : `${Number(val || 0)} heads`,
                        'Value',
                      ]}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {currentChartData.map((entry, index) => (
                        <Cell key={`bar-cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : graphType === 'hbar' ? (
                  <BarChart
                    data={currentChartData}
                    layout="vertical"
                    margin={{ top: 10, right: 25, left: 35, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#475569' }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#475569' }}
                    />
                    <Tooltip
                      formatter={(val: number | string | undefined) => [
                        graphDimension === 'valuation'
                          ? `₱${Number(val || 0).toLocaleString('en-PH')}`
                          : `${Number(val || 0)} heads`,
                        'Value',
                      ]}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {currentChartData.map((entry, index) => (
                        <Cell key={`hbar-cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : graphType === 'area' ? (
                  <AreaChart data={currentChartData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                    <defs>
                      <linearGradient id="areaChartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      angle={-15}
                      textAnchor="end"
                      tick={{ fontSize: 10, fill: '#475569' }}
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#475569' }} />
                    <Tooltip
                      formatter={(val: number | string | undefined) => [
                        graphDimension === 'valuation'
                          ? `₱${Number(val || 0).toLocaleString('en-PH')}`
                          : `${Number(val || 0)} heads`,
                        'Value',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#059669"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#areaChartGrad)"
                    />
                  </AreaChart>
                ) : (
                  <LineChart data={currentChartData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      angle={-15}
                      textAnchor="end"
                      tick={{ fontSize: 10, fill: '#475569' }}
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#475569' }} />
                    <Tooltip
                      formatter={(val: number | string | undefined) => [
                        graphDimension === 'valuation'
                          ? `₱${Number(val || 0).toLocaleString('en-PH')}`
                          : `${Number(val || 0)} heads`,
                        'Value',
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#059669"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#059669' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Dataset Breakdown & Legend Metrics (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                Distribution Breakdown
              </h4>
              <span className="text-[11px] text-stone-500">
                {currentChartData.length} active segments
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {currentChartData.map((item, index) => {
                const pct = currentTotalValue > 0 ? Math.round((item.value / currentTotalValue) * 100) : 0;
                return (
                  <div
                    key={`legend-row-${index}`}
                    className="p-2.5 rounded-xl border border-stone-200/80 bg-stone-50/50 hover:bg-stone-50 transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: item.color }}
                      ></span>
                      <div className="truncate">
                        <p className="font-bold text-stone-900 truncate">{item.name}</p>
                        <p className="text-[10px] text-stone-500 truncate">{item.desc}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-extrabold text-stone-900">
                        {graphDimension === 'valuation'
                          ? `₱${item.value.toLocaleString('en-PH')}`
                          : `${item.value} heads`}
                      </p>
                      <p className="text-[10px] font-semibold text-emerald-800">{pct}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Progress Cards & Biosecurity Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Swine Category Breakdown */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-stone-100">
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Swine Lifecycle Stage Summary</h3>
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

      {/* Swine Farm Registration Pop-up Modal */}
      <SwineFarmRegistrationModal
        isOpen={isFarmRegModalOpen}
        onClose={() => setIsFarmRegModalOpen(false)}
        barangays={barangays}
      />
    </div>
  );
};
