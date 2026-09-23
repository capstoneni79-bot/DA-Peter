import React, { useState, useEffect, useMemo } from 'react';
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
  Eye,
  Columns,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Building2,
  User,
  MapPin,
  Check,
  SlidersHorizontal,
  AlertCircle,
} from 'lucide-react';
import {
  Barangay,
  RegistryFormField,
  RegistryFormSchema,
  SwineRecord,
  UserAccount,
  UserRole,
} from '../../types';
import { storageService } from '../../services/storageService';
import { ImportSwineModal } from './ImportSwineModal';
import {
  ActiveFieldItem,
  formatFieldValue,
  getAllActiveFields,
  getFieldValue,
  getFieldKey,
  matchRecordSearch,
} from '../../utils/registryFieldUtils';

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
  // Schema configuration state
  const [formSchema, setFormSchema] = useState<RegistryFormSchema>(() =>
    storageService.getRegistryFormSchema()
  );

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState<string>(
    currentRole === 'focal' && currentUser?.assignedBarangay ? currentUser.assignedBarangay : 'all'
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [readyFilter, setReadyFilter] = useState<'all' | 'ready' | 'not_ready'>('all');
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [sortFieldKey, setSortFieldKey] = useState<string>('registeredAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Column Management
  const [visibleColumnIds, setVisibleColumnIds] = useState<Record<string, boolean>>({});
  const [showColumnPicker, setShowColumnPicker] = useState<boolean>(false);

  // Detail Modal State
  const [viewingRecord, setViewingRecord] = useState<SwineRecord | null>(null);

  // Print Report & Import States
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [showPrintMenu, setShowPrintMenu] = useState<boolean>(false);
  const [showPrintSelectModal, setShowPrintSelectModal] = useState<boolean>(false);
  const [printSelectedColumnIds, setPrintSelectedColumnIds] = useState<Record<string, boolean>>({});
  const [printValidationError, setPrintValidationError] = useState<string | null>(null);
  const [activePrintColumns, setActivePrintColumns] = useState<ActiveFieldItem[]>([]);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string>('');

  // Logo customization for Official Print Report
  const [reportLeftLogo, setReportLeftLogo] = useState<string>('/icon.svg');
  const [reportRightLogo, setReportRightLogo] = useState<string>('/icon.svg');
  const [showLogoCustomizer, setShowLogoCustomizer] = useState<boolean>(false);
  const [logoSaveSuccess, setLogoSaveSuccess] = useState<boolean>(false);

  // Listen to Schema Changes from Admin Customizer
  useEffect(() => {
    const handleSchemaChange = (e: Event) => {
      const customEvent = e as CustomEvent<RegistryFormSchema>;
      if (customEvent.detail) {
        setFormSchema(customEvent.detail);
      } else {
        setFormSchema(storageService.getRegistryFormSchema());
      }
    };
    window.addEventListener('da_registry_schema_change', handleSchemaChange);
    return () => window.removeEventListener('da_registry_schema_change', handleSchemaChange);
  }, []);

  // Load Certificate Config Logos
  useEffect(() => {
    try {
      const certConf = storageService.getCertificateConfig();
      if (certConf.daLogoUrl) setReportLeftLogo(certConf.daLogoUrl);
      if (certConf.lguLogoUrl) setReportRightLogo(certConf.lguLogoUrl);
    } catch {
      // ignore
    }
  }, []);

  // Active Fields from Schema (The Central Source of Truth)
  const activeFields: ActiveFieldItem[] = useMemo(() => {
    return getAllActiveFields(formSchema);
  }, [formSchema]);

  // Handle Logo Save
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

  // Toggle single column visibility
  const toggleColumnVisibility = (fieldId: string) => {
    setVisibleColumnIds(prev => ({
      ...prev,
      [fieldId]: prev[fieldId] === false ? true : false,
    }));
  };

  const resetColumnsToDefault = () => {
    setVisibleColumnIds({});
  };

  // Filtering
  const filtered = useMemo(() => {
    return swineList.filter(s => {
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

      // Dynamic search across all active fields
      if (searchTerm.trim()) {
        if (!matchRecordSearch(s, searchTerm, activeFields)) {
          return false;
        }
      }

      return true;
    });
  }, [
    swineList,
    selectedBarangay,
    currentRole,
    currentUser,
    showArchived,
    statusFilter,
    readyFilter,
    searchTerm,
    activeFields,
  ]);

  // Dynamic Sorting
  const sortedRecords = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortFieldKey === 'registeredAt') {
        valA = new Date(a.registeredAt).getTime();
        valB = new Date(b.registeredAt).getTime();
      } else if (sortFieldKey === 'earTagNo') {
        valA = a.earTagNo || '';
        valB = b.earTagNo || '';
      } else if (sortFieldKey === 'farmerName') {
        valA = a.farmerName || '';
        valB = b.farmerName || '';
      } else if (sortFieldKey === 'weightKg') {
        valA = Number(a.weightKg) || 0;
        valB = Number(b.weightKg) || 0;
      } else if (sortFieldKey === 'barangay') {
        valA = a.barangay || '';
        valB = b.barangay || '';
      } else {
        // Find matching field in activeFields
        const matched = activeFields.find(f => f.field.id === sortFieldKey || f.fieldKey === sortFieldKey);
        if (matched) {
          valA = getFieldValue(a, matched.field);
          valB = getFieldValue(b, matched.field);
        } else {
          valA = (a as any)[sortFieldKey];
          valB = (b as any)[sortFieldKey];
        }
      }

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      let cmp = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        cmp = valA - valB;
      } else {
        cmp = String(valA).localeCompare(String(valB));
      }

      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filtered, sortFieldKey, sortOrder, activeFields]);

  // Handlers
  const handleDelete = (id: string, tag: string) => {
    if (window.confirm(`Are you sure you want to permanently delete swine record "${tag}"?`)) {
      storageService.deleteSwineRecord(id);
      onRefresh();
    }
  };

  const handleToggleSell = (swine: SwineRecord) => {
    const nextState = !swine.readyToSell;
    storageService.toggleSellStatus(swine.id, nextState);
    onRefresh();
  };

  const handleMarkSold = (swine: SwineRecord) => {
    if (window.confirm(`Mark swine "${swine.earTagNo}" as officially SOLD / Disposed?`)) {
      storageService.markAsSold(swine.id);
      onRefresh();
    }
  };

  const handleToggleArchive = (id: string) => {
    storageService.toggleArchiveStatus(id);
    onRefresh();
  };

  // Export to Excel (CSV with all active dynamic columns)
  const exportToExcel = () => {
    const displayedFields = activeFields.filter(f => visibleColumnIds[f.field.id] !== false);
    const headers = displayedFields.map(f => `"${f.field.label.replace(/"/g, '""')}"`);

    // Add extra system columns if not already in schema
    headers.push('"Market Status"', '"Registration Date"');

    const rows = sortedRecords.map(s => {
      const fieldValues = displayedFields.map(f => {
        const raw = getFieldValue(s, f.field);
        const formatted = formatFieldValue(raw, f.field);
        return `"${String(formatted).replace(/"/g, '""')}"`;
      });
      fieldValues.push(
        `"${s.readyToSell ? 'READY TO SELL' : s.status.toUpperCase()}"`,
        `"${new Date(s.registeredAt).toLocaleDateString()}"`
      );
      return fieldValues.join(',');
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

  // Export to MS Word (.doc with HTML table of all active columns)
  const exportToWord = () => {
    const displayedFields = activeFields.filter(f => visibleColumnIds[f.field.id] !== false);

    const headersHtml = [
      '<th style="background-color:#15803d;color:white;padding:6px;border:1px solid #15803d;">#</th>',
      ...displayedFields.map(
        f => `<th style="background-color:#15803d;color:white;padding:6px;border:1px solid #15803d;">${f.field.label}</th>`
      ),
      '<th style="background-color:#15803d;color:white;padding:6px;border:1px solid #15803d;">Status</th>',
    ].join('');

    const tableRowsHtml = sortedRecords
      .map((s, i) => {
        const cells = displayedFields
          .map(f => {
            const raw = getFieldValue(s, f.field);
            const formatted = formatFieldValue(raw, f.field);
            return `<td style="padding:6px;border:1px solid #ccc;">${formatted}</td>`;
          })
          .join('');

        return `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 6px; border: 1px solid #ccc; font-weight: bold;">${i + 1}</td>
          ${cells}
          <td style="padding: 6px; border: 1px solid #ccc; font-weight: bold; text-align: center;">${s.readyToSell ? 'READY TO SELL' : s.status.toUpperCase()}</td>
        </tr>
      `;
      })
      .join('');

    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>DA Hinunangan Swine Registry</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 10pt; }
        h2, h3 { color: #15803d; margin-bottom: 2px; }
        table { border-collapse: collapse; width: 100%; margin-top: 15px; font-size: 9pt; }
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
            <tr>${headersHtml}</tr>
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

  // Determine active columns to display
  const displayedActiveFields = activeFields.filter(f => visibleColumnIds[f.field.id] !== false);

  return (
    <div className="space-y-6 py-6 px-4 max-w-7xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900">Registered Swine Records</h2>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {sortedRecords.length} Heads
            </span>
            <span className="bg-stone-100 text-stone-600 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border border-stone-200">
              <Layers className="w-3 h-3 text-emerald-700" />
              {activeFields.length} Form Fields Active
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Dynamic schema-driven records synchronized directly with the <strong>Swine Registry Form</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Column Visibility Selector Toggle */}
          <button
            type="button"
            onClick={() => setShowColumnPicker(!showColumnPicker)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
              showColumnPicker
                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                : 'border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700'
            }`}
            title="Choose which form fields appear as columns in the table"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700" />
            <span>Columns ({displayedActiveFields.length}/{activeFields.length})</span>
          </button>

          {/* Import Records via Java or Device */}
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="px-3 py-1.5 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="Import Swine Records from Device (CSV/JSON) or Java Backend Service"
          >
            <Upload className="w-3.5 h-3.5 text-purple-700" />
            <span>Import</span>
          </button>

          {/* Print Menu Dropdown (Print All or Selected Columns) */}
          <div className="relative inline-block text-left">
            <button
              type="button"
              onClick={() => setShowPrintMenu(prev => !prev)}
              className="px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-100 bg-white text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Print Swine Records (Print All or Select Columns)"
            >
              <Printer className="w-3.5 h-3.5 text-stone-600" />
              <span>Print</span>
              <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform ${showPrintMenu ? 'rotate-180' : ''}`} />
            </button>

            {showPrintMenu && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 py-1.5 z-40 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => {
                    setActivePrintColumns(activeFields);
                    setShowPrintMenu(false);
                    setShowPrintModal(true);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-stone-800 hover:bg-emerald-50 hover:text-emerald-950 font-semibold flex items-center gap-2.5 cursor-pointer transition"
                >
                  <Printer className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div>
                    <div className="font-bold">Print All</div>
                    <div className="text-[10px] text-stone-500 font-normal">
                      Complete table with all active columns ({activeFields.length})
                    </div>
                  </div>
                </button>
                <div className="my-1 border-t border-stone-100" />
                <button
                  type="button"
                  onClick={() => {
                    const initial: Record<string, boolean> = {};
                    activeFields.forEach(f => {
                      initial[f.field.id] = true;
                    });
                    setPrintSelectedColumnIds(initial);
                    setPrintValidationError(null);
                    setShowPrintMenu(false);
                    setShowPrintSelectModal(true);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-stone-800 hover:bg-emerald-50 hover:text-emerald-950 font-semibold flex items-center gap-2.5 cursor-pointer transition"
                >
                  <SlidersHorizontal className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <div className="font-bold">Select Columns to Print</div>
                    <div className="text-[10px] text-stone-500 font-normal">
                      Choose specific columns and order
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Export to Excel */}
          <button
            onClick={exportToExcel}
            className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="Export Records to Excel CSV (Includes All Dynamic Fields)"
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

      {/* Column Visibility Panel */}
      {showColumnPicker && (
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div>
              <h3 className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                <Columns className="w-4 h-4 text-emerald-700" />
                Customize Swine Records Table Columns
              </h3>
              <p className="text-[11px] text-stone-500">
                All fields configured in the Swine Registry Form are available. Toggle checkboxes to show or hide columns.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetColumnsToDefault}
                className="text-[11px] text-emerald-700 font-semibold hover:underline cursor-pointer"
              >
                Show All
              </button>
              <button
                type="button"
                onClick={() => setShowColumnPicker(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 pt-1 text-xs">
            {activeFields.map(item => {
              const isChecked = visibleColumnIds[item.field.id] !== false;
              return (
                <label
                  key={item.field.id}
                  className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition ${
                    isChecked
                      ? 'bg-emerald-50/50 border-emerald-300 text-stone-900 font-medium'
                      : 'bg-stone-50 border-stone-200 text-stone-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleColumnVisibility(item.field.id)}
                    className="w-3.5 h-3.5 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                  />
                  <span className="truncate text-[11px]" title={item.field.label}>
                    {item.field.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

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
              placeholder="Search across all fields (Ear Tag, Farmer, Breed, Custom Fields...)"
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
              value={sortFieldKey}
              onChange={e => setSortFieldKey(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-stone-300 bg-white font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            >
              <option value="registeredAt">Sort: Date Registered</option>
              <option value="earTagNo">Sort: Ear Tag No</option>
              <option value="farmerName">Sort: Farmer Name</option>
              <option value="weightKg">Sort: Live Weight</option>
              <option value="barangay">Sort: Barangay</option>
              {activeFields.map(f => (
                <option key={f.field.id} value={f.field.id}>
                  Sort: {f.field.label}
                </option>
              ))}
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
            Showing <strong>{sortedRecords.length}</strong> of {swineList.length} total records
          </span>
        </div>
      </div>

      {/* Dynamic Schema-Driven Records Table with Horizontal Scroll Support */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[1000px]">
            <thead className="bg-stone-100/90 text-stone-700 font-bold border-b border-stone-200 uppercase tracking-wider text-[10px]">
              <tr>
                {/* Primary Column 1: Ear Tag & Photo (Sticky Left) */}
                <th className="py-3.5 px-4 sticky left-0 bg-stone-100/95 z-10 border-r border-stone-200 shadow-2xs">
                  Swine / Ear Tag
                </th>

                {/* Primary Column 2: Farmer & Location */}
                <th className="py-3.5 px-4 border-r border-stone-200">
                  Farmer & Barangay
                </th>

                {/* Dynamic Fields generated directly from the Swine Registry Form Schema */}
                {displayedActiveFields.map(item => {
                  // Skip duplicate ear tag and farmer name as they are already in the frozen primary columns
                  if (
                    item.field.id === 'fld_ear_tag' ||
                    item.field.id === 'fld_farmer_name'
                  ) {
                    return null;
                  }
                  return (
                    <th
                      key={item.field.id}
                      className="py-3.5 px-4 border-r border-stone-200 hover:bg-stone-200/50 cursor-pointer transition select-none"
                      onClick={() => {
                        if (sortFieldKey === item.field.id) {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortFieldKey(item.field.id);
                          setSortOrder('asc');
                        }
                      }}
                      title={`Click to sort by ${item.field.label}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{item.field.label}</span>
                        {sortFieldKey === item.field.id && (
                          <span className="text-emerald-700 font-bold">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}

                {/* Status Column */}
                <th className="py-3.5 px-4 border-r border-stone-200 text-center">
                  Market Status
                </th>

                {/* Actions (Sticky Right) */}
                <th className="py-3.5 px-4 text-right sticky right-0 bg-stone-100/95 z-10 border-l border-stone-200 shadow-2xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {sortedRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={displayedActiveFields.length + 3}
                    className="py-12 text-center text-stone-400 text-sm"
                  >
                    No swine records found matching your filters.
                  </td>
                </tr>
              ) : (
                sortedRecords.map(swine => {
                  return (
                    <tr key={swine.id} className="hover:bg-emerald-50/40 transition group">
                      {/* Frozen Column 1: Ear Tag & Photo */}
                      <td className="py-3 px-4 sticky left-0 bg-white group-hover:bg-emerald-50/90 z-10 border-r border-stone-200">
                        <div className="flex items-center gap-3">
                          <img
                            src={swine.photoUrl || '/icon.svg'}
                            alt="Swine"
                            className="w-10 h-10 rounded-lg object-cover border border-stone-200 shadow-2xs shrink-0"
                          />
                          <div>
                            <span className="font-mono font-bold text-emerald-950 block text-xs">
                              {swine.earTagNo}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              {new Date(swine.registeredAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Farmer & Barangay */}
                      <td className="py-3 px-4 border-r border-stone-200">
                        <div className="font-bold text-stone-900">{swine.farmerName}</div>
                        <div className="text-[11px] text-stone-500 font-medium">
                          Brgy. {swine.barangay}
                        </div>
                        {swine.farmerContact && (
                          <div className="text-[10px] text-stone-400">{swine.farmerContact}</div>
                        )}
                      </td>

                      {/* Dynamic Field Values Rendered Automatically */}
                      {displayedActiveFields.map(item => {
                        if (
                          item.field.id === 'fld_ear_tag' ||
                          item.field.id === 'fld_farmer_name'
                        ) {
                          return null;
                        }

                        const rawVal = getFieldValue(swine, item.field);
                        const formatted = formatFieldValue(rawVal, item.field);

                        // Specialized formatting for specific types
                        if (item.field.id === 'fld_weight_kg') {
                          return (
                            <td key={item.field.id} className="py-3 px-4 border-r border-stone-200">
                              <span className="font-bold text-stone-900">{swine.weightKg} kg</span>
                            </td>
                          );
                        }

                        if (item.field.id === 'fld_estimated_price') {
                          return (
                            <td key={item.field.id} className="py-3 px-4 border-r border-stone-200">
                              <span className="font-bold text-emerald-800">
                                ₱{(swine.estimatedPricePhp || 0).toLocaleString()}
                              </span>
                            </td>
                          );
                        }

                        if (item.field.type === 'yes_no' || typeof rawVal === 'boolean') {
                          return (
                            <td key={item.field.id} className="py-3 px-4 border-r border-stone-200">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  rawVal
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-stone-100 text-stone-600'
                                }`}
                              >
                                {rawVal ? '✓ Yes' : '✕ No'}
                              </span>
                            </td>
                          );
                        }

                        if (item.field.type === 'image' && rawVal) {
                          return (
                            <td key={item.field.id} className="py-3 px-4 border-r border-stone-200">
                              <img
                                src={rawVal}
                                alt="Field Attachment"
                                className="w-8 h-8 rounded object-cover border"
                              />
                            </td>
                          );
                        }

                        return (
                          <td
                            key={item.field.id}
                            className="py-3 px-4 border-r border-stone-200 text-stone-700"
                          >
                            <span className="truncate max-w-[200px] block" title={String(formatted)}>
                              {formatted}
                            </span>
                          </td>
                        );
                      })}

                      {/* Market Status */}
                      <td className="py-3 px-4 border-r border-stone-200 text-center">
                        {swine.status === 'sold' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-700">
                            SOLD
                          </span>
                        ) : swine.readyToSell ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-amber-600" /> READY
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            GROWING
                          </span>
                        )}
                      </td>

                      {/* Sticky Actions */}
                      <td className="py-3 px-4 text-right sticky right-0 bg-white group-hover:bg-emerald-50/90 z-10 border-l border-stone-200">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick View Details Modal */}
                          <button
                            onClick={() => setViewingRecord(swine)}
                            className="p-1.5 rounded-lg text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                            title="View Full Form Data"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

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
                            {swine.isArchived ? (
                              <ArchiveRestore className="w-4 h-4" />
                            ) : (
                              <Archive className="w-4 h-4" />
                            )}
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

      {/* Comprehensive Record Detail Modal (Full Registry Form Fields View) */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden my-6 border border-stone-200 animate-fadeIn">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={viewingRecord.photoUrl || '/icon.svg'}
                  alt="Swine"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-400/50 shadow-md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-lg text-emerald-200">
                      {viewingRecord.earTagNo}
                    </span>
                    <span className="bg-emerald-800 text-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {viewingRecord.readyToSell ? 'READY FOR SALE' : viewingRecord.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-0.5">
                    {viewingRecord.farmerName} • Brgy. {viewingRecord.barangay}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingRecord(null)}
                className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Render Section by Section matching Swine Registry Form */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-xs text-stone-800">
              {formSchema.sections
                .filter(sec => sec.visible !== false)
                .map(section => {
                  const secFields = (section.fields || []).filter(f => f.visible !== false);
                  if (secFields.length === 0) return null;

                  return (
                    <div key={section.id} className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                        <Layers className="w-4 h-4 text-emerald-700" />
                        <h4 className="font-black text-stone-900 text-xs uppercase tracking-wide">
                          {section.title}
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {secFields.map(field => {
                          const val = getFieldValue(viewingRecord, field);
                          const formatted = formatFieldValue(val, field);

                          return (
                            <div key={field.id} className="bg-white p-2.5 rounded-xl border border-stone-200/80 shadow-2xs">
                              <span className="text-[10px] text-stone-500 font-bold block">
                                {field.label}
                              </span>
                              <span className="font-semibold text-stone-900 block mt-0.5 break-words">
                                {formatted}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-stone-100 px-6 py-3.5 border-t border-stone-200 flex items-center justify-between gap-3">
              <span className="text-[11px] text-stone-500">
                Registered on {new Date(viewingRecord.registeredAt).toLocaleString()} by {viewingRecord.registeredBy || 'DA Inspector'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const rec = viewingRecord;
                    setViewingRecord(null);
                    onEditSwine(rec);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold flex items-center gap-1.5 transition cursor-pointer text-xs"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Record
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const rec = viewingRecord;
                    setViewingRecord(null);
                    onIssueCertificate(rec);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer text-xs"
                >
                  <FileText className="w-3.5 h-3.5" /> Issue Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  <p className="text-[10px] text-stone-400">
                    Official Municipal Agriculture Document with Customizable Logos & Dynamic Columns
                  </p>
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
                    <span className="font-bold text-stone-800 block text-[11px]">
                      Left Header Logo (e.g. DA Emblem)
                    </span>
                    <div className="flex items-center gap-3">
                      <img
                        src={reportLeftLogo}
                        alt="Left Logo"
                        className="w-10 h-10 object-contain border p-1 rounded bg-stone-50"
                      />
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
                    <span className="font-bold text-stone-800 block text-[11px]">
                      Right Header Logo (e.g. Municipal Seal)
                    </span>
                    <div className="flex items-center gap-3">
                      <img
                        src={reportRightLogo}
                        alt="Right Logo"
                        className="w-10 h-10 object-contain border p-1 rounded bg-stone-50"
                      />
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
                    <p className="text-[11px] uppercase tracking-wider text-stone-600 font-medium">
                      Republic of the Philippines
                    </p>
                    <p className="text-[11px] uppercase tracking-wider text-stone-600 font-medium">
                      Province of Southern Leyte
                    </p>
                    <h2 className="text-base font-black text-emerald-950 tracking-tight">
                      MUNICIPALITY OF HINUNANGAN
                    </h2>
                    <h3 className="text-xs font-bold text-emerald-800">
                      OFFICE OF THE MUNICIPAL AGRICULTURIST
                    </h3>
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
                  <span className="font-bold text-base text-stone-900">{sortedRecords.length} Heads</span>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <span className="text-amber-700 text-[10px] block">Ready for Market Sale</span>
                  <span className="font-bold text-base text-amber-900">
                    {sortedRecords.filter(s => s.readyToSell).length} Heads
                  </span>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <span className="text-emerald-700 text-[10px] block">ASF Safe / Green Zone</span>
                  <span className="font-bold text-base text-emerald-900">100% Verified</span>
                </div>
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="text-stone-500 text-[10px] block">Est. Market Value</span>
                  <span className="font-bold text-base text-emerald-800">
                    ₱{sortedRecords.reduce((acc, s) => acc + (s.estimatedPricePhp || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Report Table with Dynamic Columns */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-stone-300 text-[10px]">
                  <thead className="bg-stone-100 font-bold text-stone-800 border-b border-stone-300">
                    <tr>
                      <th className="p-1.5 border border-stone-300 text-center w-8">#</th>
                      {(activePrintColumns.length > 0 ? activePrintColumns : activeFields).map(col => (
                        <th key={col.field.id} className="p-1.5 border border-stone-300 whitespace-nowrap">
                          {col.field.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {sortedRecords.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-stone-50">
                        <td className="p-1.5 border border-stone-300 text-center font-mono text-stone-500">
                          {idx + 1}
                        </td>
                        {(activePrintColumns.length > 0 ? activePrintColumns : activeFields).map(col => {
                          const rawVal = getFieldValue(s, col.field);
                          const formatted = formatFieldValue(rawVal, col.field);
                          const isEarTag = col.field.id === 'fld_ear_tag';
                          const isFarmer = col.field.id === 'fld_farmer_name';
                          return (
                            <td
                              key={col.field.id}
                              className={`p-1.5 border border-stone-300 ${
                                isEarTag
                                  ? 'font-mono font-bold text-emerald-900'
                                  : isFarmer
                                  ? 'font-bold text-stone-900'
                                  : 'text-stone-700'
                              }`}
                            >
                              {formatted || '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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
                  <p className="text-[10px] text-stone-500">
                    Municipal Agricultural Officer (MAO) - Hinunangan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Select Columns to Print Modal */}
      {showPrintSelectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <Printer className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Select Columns to Print</h3>
                  <p className="text-[11px] text-emerald-200/80">
                    Choose which fields appear on the printed official summary report
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintSelectModal(false)}
                className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Validation Message */}
            {printValidationError && (
              <div className="mx-6 mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-800 text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{printValidationError}</span>
              </div>
            )}

            {/* Selection Status & Controls */}
            <div className="px-6 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs">
              <span className="font-bold text-stone-700">
                Selected Columns:{' '}
                <span className="text-emerald-700 font-extrabold">
                  {activeFields.filter(f => printSelectedColumnIds[f.field.id]).length} of {activeFields.length}
                </span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const all: Record<string, boolean> = {};
                    activeFields.forEach(f => {
                      all[f.field.id] = true;
                    });
                    setPrintSelectedColumnIds(all);
                    setPrintValidationError(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold cursor-pointer text-xs transition"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPrintSelectedColumnIds({});
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold cursor-pointer text-xs transition"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Checkbox List Organized by Form Sections */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {formSchema.sections
                .filter(sec => sec.isActive)
                .map(sec => {
                  const secFields = activeFields.filter(f => f.section.id === sec.id);
                  if (secFields.length === 0) return null;
                  return (
                    <div key={sec.id} className="space-y-2">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 pb-1 border-b border-stone-100">
                        <Layers className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{sec.title}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {secFields.map(item => {
                          const isChecked = !!printSelectedColumnIds[item.field.id];
                          return (
                            <label
                              key={item.field.id}
                              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                                isChecked
                                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold'
                                  : 'bg-stone-50/50 border-stone-200 text-stone-600 hover:bg-stone-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => {
                                  setPrintSelectedColumnIds(prev => ({
                                    ...prev,
                                    [item.field.id]: e.target.checked,
                                  }));
                                  if (e.target.checked) setPrintValidationError(null);
                                }}
                                className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                              />
                              <span className="flex-1 truncate">{item.field.label}</span>
                              {item.field.isCustom && (
                                <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                                  Custom
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowPrintSelectModal(false)}
                className="px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const selected = activeFields.filter(f => printSelectedColumnIds[f.field.id]);
                  if (selected.length === 0) {
                    setPrintValidationError('Please select at least one column to print.');
                    return;
                  }
                  setActivePrintColumns(selected);
                  setShowPrintSelectModal(false);
                  setShowPrintModal(true);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
              >
                <Printer className="w-4 h-4" />
                <span>
                  Print Selected ({activeFields.filter(f => printSelectedColumnIds[f.field.id]).length})
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Swine Modal */}
      <ImportSwineModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={count => {
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
