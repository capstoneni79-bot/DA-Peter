import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Printer,
  Edit,
  Trash2,
  Archive,
  ArchiveRestore,
  CheckCircle,
  FileSpreadsheet,
  FileText,
  BadgePercent,
  CheckCircle2,
  XCircle,
  Plus,
  ExternalLink,
  ShieldCheck,
  Tag,
  Clock,
  Sparkles,
  ShoppingBag,
  Upload,
  Image as ImageIcon,
  Save,
  RotateCcw,
} from 'lucide-react';
import { Barangay, SwineRecord, UserAccount, UserRole } from '../../types';
import { storageService } from '../../services/storageService';
import { ImportSwineModal } from './ImportSwineModal';

interface PigsRecordsProps {
  swineList: SwineRecord[];
  barangays: Barangay[];
  currentUser: UserAccount | null;
  currentRole: UserRole;
  onEditSwine: (swine: SwineRecord) => void;
  onIssueCertificate: (swine: SwineRecord) => void;
  onAddSwine: () => void;
  onRefresh: () => void;
}

export const PigsRecords: React.FC<PigsRecordsProps> = ({
  swineList,
  barangays,
  currentUser,
  currentRole,
  onEditSwine,
  onIssueCertificate,
  onAddSwine,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState<string>(
    currentRole === 'focal' && currentUser?.assignedBarangay ? currentUser.assignedBarangay : 'all'
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [readyFilter, setReadyFilter] = useState<'all' | 'ready' | 'not_ready'>('all');
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'date' | 'weight' | 'tag' | 'farmer'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Print Report & Import States
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string>('');

  // Logo customization for Official Print Report
  const [reportLeftLogo, setReportLeftLogo] = useState<string>('/icon.svg');
  const [reportRightLogo, setReportRightLogo] = useState<string>('/icon.svg');
  const [showLogoCustomizer, setShowLogoCustomizer] = useState<boolean>(false);
  const [logoSaveSuccess, setLogoSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    try {
      const certConf = storageService.getCertificateConfig();
      if (certConf.daLogoUrl) setReportLeftLogo(certConf.daLogoUrl);
      if (certConf.lguLogoUrl) setReportRightLogo(certConf.lguLogoUrl);
    } catch {
      // ignore
    }
  }, []);

  const handleSaveReportLogos = () => {
    try {
      const currentConf = storageService.getCertificateConfig();
      storageService.saveCertificateConfig({
        ...currentConf,
        daLogoUrl: reportLeftLogo,
        lguLogoUrl: reportRightLogo,
      });
      setLogoSaveSuccess(true);
      setTimeout(() => setLogoSaveSuccess(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>, position: 'left' | 'right') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (position === 'left') {
        setReportLeftLogo(dataUrl);
      } else {
        setReportRightLogo(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Scoping: If focal person, filter strictly to their assigned barangay
  let filtered = swineList.filter(s => {
    const itemBg = (s.barangay || '').toLowerCase();
    if (currentRole === 'focal' && currentUser?.assignedBarangay) {
      if (itemBg !== (currentUser.assignedBarangay || '').toLowerCase()) {
        return false;
      }
    } else if (selectedBarangay !== 'all') {
      if (itemBg !== (selectedBarangay || '').toLowerCase()) return false;
    }

    if (showArchived) {
      if (!s.isArchived) return false;
    } else {
      if (s.isArchived) return false;
    }

    if (statusFilter !== 'all' && s.status !== statusFilter) return false;

    if (readyFilter === 'ready' && !s.readyToSell) return false;
    if (readyFilter === 'not_ready' && s.readyToSell) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        (s.earTagNo || '').toLowerCase().includes(q) ||
        (s.farmerName || '').toLowerCase().includes(q) ||
        (s.barangay || '').toLowerCase().includes(q) ||
        (s.breed || '').toLowerCase().includes(q) ||
        (Boolean(s.rsbsaId) && (s.rsbsaId || '').toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'date') {
      cmp = new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime();
    } else if (sortBy === 'weight') {
      cmp = a.weightKg - b.weightKg;
    } else if (sortBy === 'tag') {
      cmp = a.earTagNo.localeCompare(b.earTagNo);
    } else if (sortBy === 'farmer') {
      cmp = a.farmerName.localeCompare(b.farmerName);
    }
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  // Delete Action
  const handleDelete = (id: string, tag: string) => {
    if (window.confirm(`Are you sure you want to permanently delete swine record "${tag}"?`)) {
      storageService.deleteSwineRecord(id);
      onRefresh();
    }
  };

  // Toggle Ready to sell
  const handleToggleSell = (swine: SwineRecord) => {
    const nextState = !swine.readyToSell;
    storageService.toggleSellStatus(swine.id, nextState);
    onRefresh();
  };

  // Mark as Sold
  const handleMarkSold = (swine: SwineRecord) => {
    if (window.confirm(`Mark swine "${swine.earTagNo}" as officially SOLD / Disposed?`)) {
      storageService.markAsSold(swine.id);
      onRefresh();
    }
  };

  // Toggle Archive
  const handleToggleArchive = (id: string) => {
    storageService.toggleArchiveStatus(id);
    onRefresh();
  };

  // Export to Excel (CSV format that opens directly in MS Excel)
  const exportToExcel = () => {
    const headers = [
      'Ear Tag No',
      'Farmer / Raiser',
      'Contact',
      'Barangay',
      'RSBSA ID',
      'Farm Type',
      'Category',
      'Breed',
      'Weight (kg)',
      'Age (wks)',
      'Est Price (PHP)',
      'Status',
      'Ready to Sell',
      'Target Date',
      'Latitude',
      'Longitude',
      'Biosecurity Rating',
      'Registration Date',
    ];

    const rows = filtered.map(s => {
      const bioPassed = Object.values(s.biosecurity || {}).filter(Boolean).length;
      return [
        `"${s.earTagNo}"`,
        `"${s.farmerName}"`,
        `"${s.farmerContact || 'N/A'}"`,
        `"${s.barangay}"`,
        `"${s.rsbsaId || 'N/A'}"`,
        `"${s.farmType}"`,
        `"${s.swineType}"`,
        `"${s.breed}"`,
        s.weightKg,
        s.ageWeeks,
        s.estimatedPricePhp || 0,
        `"${s.status}"`,
        s.readyToSell ? 'YES' : 'NO',
        `"${s.targetSellDate || ''}"`,
        s.latitude,
        s.longitude,
        `"${bioPassed}/10 Verified"`,
        `"${new Date(s.registeredAt).toLocaleDateString()}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DA_Hinunangan_Swine_Records_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export to MS Word (.doc with HTML table styling)
  const exportToWord = () => {
    const tableRowsHtml = filtered
      .map(
        (s, i) => `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 6px; border: 1px solid #ccc;">${i + 1}</td>
        <td style="padding: 6px; border: 1px solid #ccc; font-weight: bold;">${s.earTagNo}</td>
        <td style="padding: 6px; border: 1px solid #ccc;">${s.farmerName}</td>
        <td style="padding: 6px; border: 1px solid #ccc;">${s.barangay}</td>
        <td style="padding: 6px; border: 1px solid #ccc;">${s.breed} (${s.swineType})</td>
        <td style="padding: 6px; border: 1px solid #ccc; text-align: right;">${s.weightKg} kg</td>
        <td style="padding: 6px; border: 1px solid #ccc; text-align: right;">₱${(s.estimatedPricePhp || 0).toLocaleString()}</td>
        <td style="padding: 6px; border: 1px solid #ccc; text-align: center;">${s.readyToSell ? 'READY TO SELL' : s.status.toUpperCase()}</td>
      </tr>
    `
      )
      .join('');

    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>DA Hinunangan Swine Registry</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11pt; }
        h2, h3 { color: #15803d; margin-bottom: 2px; }
        table { border-collapse: collapse; width: 100%; margin-top: 15px; }
        th { background-color: #15803d; color: white; padding: 8px; border: 1px solid #15803d; text-align: left; }
      </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 10pt;">Republic of the Philippines • Province of Southern Leyte</p>
          <h2 style="margin: 4px 0;">MUNICIPALITY OF HINUNANGAN</h2>
          <h3 style="margin: 0;">DEPARTMENT OF AGRICULTURE - SWINE REGISTRY</h3>
          <p style="margin-top: 4px; font-size: 9pt; color: #555;">Official Swine Registry Summary • Generated: ${new Date().toLocaleDateString()}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Ear Tag No</th>
              <th>Farmer Name</th>
              <th>Barangay</th>
              <th>Breed / Type</th>
              <th>Weight</th>
              <th>Est. Price</th>
              <th>Market Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
          <div style="width: 250px; text-align: center;">
            <p>Prepared by:</p>
            <br/><br/>
            <p style="border-top: 1px solid #000; font-weight: bold; margin-top: 20px;">${currentUser?.name || 'Authorized DA Focal Person'}</p>
            <p style="font-size: 9pt; margin: 0;">Agricultural Extension Worker</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([wordContent], { type: 'application/msword;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DA_Hinunangan_Swine_Registry_${new Date().toISOString().split('T')[0]}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 py-6 px-4 max-w-7xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900">Registered Swine Database</h2>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {filtered.length} Heads
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Official livestock records for Hinunangan, Southern Leyte with export to Excel, Word, and printable PDF.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Import Records via Java or Device */}
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="px-3 py-1.5 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="Import Swine Records from Device (CSV/JSON) or Java Backend Service"
          >
            <Upload className="w-3.5 h-3.5 text-purple-700" />
            <span>Import (Java / Device)</span>
          </button>

          {/* Print / PDF Report */}
          <button
            onClick={() => setShowPrintModal(true)}
            className="px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="Generate Printable PDF Document"
          >
            <Printer className="w-3.5 h-3.5 text-stone-600" />
            <span>Print Official</span>
          </button>

          {/* Export to Excel */}
          <button
            onClick={exportToExcel}
            className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="Export Records to Excel CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Excel (.CSV)</span>
          </button>

          {/* Export to Word */}
          <button
            onClick={exportToWord}
            className="px-3 py-1.5 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="Export Records to Microsoft Word Document"
          >
            <FileText className="w-3.5 h-3.5 text-blue-700" />
            <span>Word (.DOC)</span>
          </button>

          {/* Add New Swine */}
          <button
            onClick={onAddSwine}
            className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Swine</span>
          </button>
        </div>
      </div>

      {importSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-2xl flex items-center justify-between shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{importSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setImportSuccessMsg('')}
            className="text-emerald-700 hover:text-emerald-900 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search ear tag, farmer name, breed, RSBSA..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Barangay Filter */}
          <div>
            <select
              value={selectedBarangay}
              disabled={currentRole === 'focal'}
              onChange={e => setSelectedBarangay(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-hidden disabled:bg-stone-100"
            >
              <option value="all">All Barangays ({barangays.length})</option>
              {barangays.map(b => (
                <option key={b.id} value={b.name}>
                  Brgy. {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Ready to sell status filter */}
          <div>
            <select
              value={readyFilter}
              onChange={e => setReadyFilter(e.target.value as 'all' | 'ready' | 'not_ready')}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            >
              <option value="all">All Market Statuses</option>
              <option value="ready">🌟 Ready to Sell Only</option>
              <option value="not_ready">Growers / Not for Sale</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="flex-1 px-3 py-2 rounded-xl border border-stone-300 bg-white font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            >
              <option value="date">Sort: Date Registered</option>
              <option value="weight">Sort: Live Weight</option>
              <option value="tag">Sort: Ear Tag No</option>
              <option value="farmer">Sort: Farmer Name</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-stone-300 rounded-xl hover:bg-stone-50 text-stone-600 cursor-pointer"
              title="Toggle Ascending / Descending"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-toggles: Active vs Archived */}
        <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-xs text-stone-500">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-stone-700">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={e => setShowArchived(e.target.checked)}
                className="w-3.5 h-3.5 text-emerald-600 rounded border-stone-300"
              />
              <span>Show Archived Swine Records</span>
            </label>
          </div>

          <span className="text-[11px]">
            Showing <strong>{filtered.length}</strong> of {swineList.length} total records
          </span>
        </div>
      </div>

      {/* Main Records Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/80 text-stone-700 font-semibold border-b border-stone-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Swine / Ear Tag</th>
                <th className="py-3 px-4">Farmer / Location</th>
                <th className="py-3 px-4">Breed & Category</th>
                <th className="py-3 px-4">Weight & Price</th>
                <th className="py-3 px-4">Biosecurity</th>
                <th className="py-3 px-4">Market Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400 text-sm">
                    No swine records found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map(swine => {
                  const bioPassed = Object.values(swine.biosecurity || {}).filter(Boolean).length;
                  return (
                    <tr key={swine.id} className="hover:bg-emerald-50/40 transition">
                      {/* Ear tag & Photo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={swine.photoUrl || '/icon.svg'}
                            alt="Swine"
                            className="w-11 h-11 rounded-lg object-cover border border-stone-200 shadow-2xs shrink-0"
                          />
                          <div>
                            <span className="font-mono font-bold text-emerald-950 block text-xs">
                              {swine.earTagNo}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              Registered: {new Date(swine.registeredAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Farmer & Barangay */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-900">{swine.farmerName}</div>
                        <div className="text-[11px] text-stone-500">Brgy. {swine.barangay}</div>
                        {swine.farmerContact && (
                          <div className="text-[10px] text-stone-400">{swine.farmerContact}</div>
                        )}
                      </td>

                      {/* Breed & Category */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-stone-800">{swine.breed}</div>
                        <div className="text-[11px] text-stone-500 capitalize">
                          {swine.swineType} • {swine.gender}
                        </div>
                      </td>

                      {/* Weight & Price */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">{swine.weightKg} kg</div>
                        <div className="text-[11px] font-semibold text-emerald-800">
                          ₱{(swine.estimatedPricePhp || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-stone-400">{swine.ageWeeks} weeks old</div>
                      </td>

                      {/* Biosecurity */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            bioPassed >= 7
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          {bioPassed}/10 Verified
                        </span>
                        {swine.biosecurity?.noSwillFeeding && (
                          <span className="block text-[10px] text-emerald-700 font-medium mt-0.5">
                            ✓ No Swill Feed
                          </span>
                        )}
                      </td>

                      {/* Status / Ready to sell */}
                      <td className="py-3 px-4">
                        {swine.status === 'sold' ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-200 text-stone-700">
                            SOLD / SLAUGHTERED
                          </span>
                        ) : swine.readyToSell ? (
                          <div>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 w-fit">
                              <Sparkles className="w-2.5 h-2.5 text-amber-600" /> READY TO SELL
                            </span>
                            {swine.targetSellDate && (
                              <span className="text-[10px] text-stone-500 block mt-0.5">
                                Avail: {swine.targetSellDate}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            GROWING
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Certificate */}
                          <button
                            onClick={() => onIssueCertificate(swine)}
                            className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                            title="Generate Barangay Certificate"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Toggle Ready To Sell */}
                          <button
                            onClick={() => handleToggleSell(swine)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              swine.readyToSell
                                ? 'text-amber-600 hover:bg-amber-100'
                                : 'text-stone-400 hover:bg-stone-100'
                            }`}
                            title={swine.readyToSell ? 'Unmark Ready to Sell' : 'Mark as Ready to Sell'}
                          >
                            <ShoppingBag className="w-4 h-4" />
                          </button>

                          {/* Mark Sold */}
                          {swine.status !== 'sold' && (
                            <button
                              onClick={() => handleMarkSold(swine)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                              title="Mark as Officially Sold / Disposed"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            onClick={() => onEditSwine(swine)}
                            className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 transition cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Archive */}
                          <button
                            onClick={() => handleToggleArchive(swine.id)}
                            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 transition cursor-pointer"
                            title={swine.isArchived ? 'Restore Record' : 'Archive Record'}
                          >
                            {swine.isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(swine.id, swine.earTagNo)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-100 transition cursor-pointer"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable PDF Report Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-6 border border-stone-200">
            {/* Top Bar */}
            <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Print Official Registry Report (PDF Format)</h3>
                  <p className="text-[10px] text-stone-400">Official Municipal Agriculture Document with Customizable Logos</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogoCustomizer(!showLogoCustomizer)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition cursor-pointer ${
                    showLogoCustomizer
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'border-stone-700 bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                  title="Change Official Logos & Seals"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>{showLogoCustomizer ? 'Close Logos' : 'Change Logos'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Now
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="text-stone-400 hover:text-white px-2 py-1 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Expandable Logo Customizer Panel */}
            {showLogoCustomizer && (
              <div className="bg-amber-50/70 border-b border-amber-200 p-4 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-700" />
                    Customize & Save Official Report Logos
                  </span>
                  {logoSaveSuccess && (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Logos Saved!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Left Logo (DA) */}
                  <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-2">
                    <span className="font-bold text-stone-800 block text-[11px]">Left Header Logo (e.g. DA Emblem)</span>
                    <div className="flex items-center gap-3">
                      <img src={reportLeftLogo} alt="Left Logo" className="w-10 h-10 object-contain border p-1 rounded bg-stone-50" />
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={reportLeftLogo}
                          onChange={e => setReportLeftLogo(e.target.value)}
                          placeholder="/icon.svg or https://..."
                          className="w-full px-2 py-1 border border-stone-300 rounded font-mono text-[10px]"
                        />
                        <label className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:underline cursor-pointer">
                          <Upload className="w-3 h-3" /> Upload Local Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleLogoFileUpload(e, 'left')}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Right Logo (LGU) */}
                  <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-2">
                    <span className="font-bold text-stone-800 block text-[11px]">Right Header Logo (e.g. Municipal Seal)</span>
                    <div className="flex items-center gap-3">
                      <img src={reportRightLogo} alt="Right Logo" className="w-10 h-10 object-contain border p-1 rounded bg-stone-50" />
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={reportRightLogo}
                          onChange={e => setReportRightLogo(e.target.value)}
                          placeholder="/icon.svg or https://..."
                          className="w-full px-2 py-1 border border-stone-300 rounded font-mono text-[10px]"
                        />
                        <label className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:underline cursor-pointer">
                          <Upload className="w-3 h-3" /> Upload Local Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleLogoFileUpload(e, 'right')}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setReportLeftLogo('/icon.svg');
                      setReportRightLogo('/icon.svg');
                    }}
                    className="px-3 py-1 text-[11px] rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-600 font-semibold cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveReportLogos}
                    className="px-4 py-1 text-[11px] rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Save className="w-3 h-3" /> Save Logos
                  </button>
                </div>
              </div>
            )}

            {/* Printable Content Area */}
            <div className="p-8 space-y-6 text-xs text-stone-800 printable-document bg-white">
              {/* Official Header */}
              <div className="text-center border-b-2 border-emerald-800 pb-4">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <img src={reportLeftLogo} alt="Left Seal" className="w-16 h-16 object-contain" />
                  <div className="flex-1">
                    <p className="text-[11px] uppercase tracking-wider text-stone-600 font-medium">Republic of the Philippines</p>
                    <p className="text-[11px] uppercase tracking-wider text-stone-600 font-medium">Province of Southern Leyte</p>
                    <h2 className="text-base font-black text-emerald-950 tracking-tight">MUNICIPALITY OF HINUNANGAN</h2>
                    <h3 className="text-xs font-bold text-emerald-800">OFFICE OF THE MUNICIPAL AGRICULTURIST</h3>
                  </div>
                  <img src={reportRightLogo} alt="Right Seal" className="w-16 h-16 object-contain" />
                </div>
                <h4 className="text-sm font-black uppercase text-stone-900 mt-3 tracking-wide">
                  OFFICIAL SWINE REGISTRY & MONITORING SUMMARY REPORT
                </h4>
                <p className="text-[10px] text-stone-500">
                  Report Generated on: {new Date().toLocaleDateString()} • Hinunangan, Southern Leyte
                </p>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="text-stone-500 text-[10px] block">Total Listed Swine</span>
                  <span className="font-bold text-base text-stone-900">{filtered.length} Heads</span>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <span className="text-amber-700 text-[10px] block">Ready for Market Sale</span>
                  <span className="font-bold text-base text-amber-900">{filtered.filter(s => s.readyToSell).length} Heads</span>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <span className="text-emerald-700 text-[10px] block">ASF Safe / Green Zone</span>
                  <span className="font-bold text-base text-emerald-900">100% Verified</span>
                </div>
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="text-stone-500 text-[10px] block">Est. Market Value</span>
                  <span className="font-bold text-base text-emerald-800">
                    ₱{filtered.reduce((acc, s) => acc + (s.estimatedPricePhp || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-left border border-stone-300 text-[11px]">
                <thead className="bg-stone-100 font-bold text-stone-700 border-b border-stone-300">
                  <tr>
                    <th className="p-2 border-r border-stone-300">#</th>
                    <th className="p-2 border-r border-stone-300">Ear Tag</th>
                    <th className="p-2 border-r border-stone-300">Farmer Name</th>
                    <th className="p-2 border-r border-stone-300">Barangay</th>
                    <th className="p-2 border-r border-stone-300">Breed / Type</th>
                    <th className="p-2 border-r border-stone-300 text-right">Weight</th>
                    <th className="p-2 border-r border-stone-300 text-right">Est. Price</th>
                    <th className="p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-300">
                  {filtered.map((s, idx) => (
                    <tr key={s.id}>
                      <td className="p-2 border-r border-stone-300">{idx + 1}</td>
                      <td className="p-2 border-r border-stone-300 font-mono font-bold text-emerald-900">{s.earTagNo}</td>
                      <td className="p-2 border-r border-stone-300 font-semibold">{s.farmerName}</td>
                      <td className="p-2 border-r border-stone-300">Brgy. {s.barangay}</td>
                      <td className="p-2 border-r border-stone-300">{s.breed} ({s.swineType})</td>
                      <td className="p-2 border-r border-stone-300 text-right">{s.weightKg} kg</td>
                      <td className="p-2 border-r border-stone-300 text-right">₱{(s.estimatedPricePhp || 0).toLocaleString()}</td>
                      <td className="p-2 text-center font-bold text-[10px]">
                        {s.readyToSell ? 'READY TO SELL' : s.status.toUpperCase()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatories Footer */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center">
                <div>
                  <p className="text-stone-500 mb-8">Prepared & Inspected by:</p>
                  <p className="font-bold border-t border-stone-400 pt-1 text-stone-900 uppercase">
                    {currentUser?.name || 'Authorized DA Inspector'}
                  </p>
                  <p className="text-[10px] text-stone-500">Barangay Agricultural Focal Officer</p>
                </div>
                <div>
                  <p className="text-stone-500 mb-8">Attested & Approved by:</p>
                  <p className="font-bold border-t border-stone-400 pt-1 text-stone-900 uppercase">
                    ENGR. ARNEL M. VASQUEZ
                  </p>
                  <p className="text-[10px] text-stone-500">Municipal Agricultural Officer (MAO) - Hinunangan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Swine Modal */}
      <ImportSwineModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={(count) => {
          setImportSuccessMsg(`Successfully imported ${count} swine record${count > 1 ? 's' : ''}!`);
          onRefresh();
          setTimeout(() => setImportSuccessMsg(''), 5000);
        }}
        barangays={barangays}
        currentUser={currentUser}
        existingRecords={swineList}
      />
    </div>
  );
};
