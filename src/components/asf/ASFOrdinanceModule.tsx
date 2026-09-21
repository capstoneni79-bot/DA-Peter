import React, { useState } from 'react';
import {
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MapPin,
  Scale,
  Printer,
  Search,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Info,
  Layers,
  Building,
  Droplets,
  School,
  Home,
  Ban,
  Car,
  PhoneCall,
  Plus,
  Pencil,
  Trash2,
  Save,
  RotateCcw,
  X,
  Check,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { ASFRegulatoryDocument, Barangay, UserAccount } from '../../types';

interface ASFOrdinanceModuleProps {
  barangays?: Barangay[];
  currentUser: UserAccount | null;
  onNavigateTab?: (tab: string) => void;
}

export const ASFOrdinanceModule: React.FC<ASFOrdinanceModuleProps> = ({
  barangays = [],
  currentUser,
  onNavigateTab,
}) => {
  const [regulations, setRegulations] = useState<ASFRegulatoryDocument[]>(() =>
    storageService.getAsfRegulations()
  );
  const [selectedDocId, setSelectedDocId] = useState<string>(
    regulations[0]?.id || 'eo-hinunangan-12-2023'
  );
  const [activeTabMode, setActiveTabMode] = useState<'document' | 'audit'>('document');
  const [searchTerm, setSearchTerm] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modals state for admin
  const [isEditDocModalOpen, setIsEditDocModalOpen] = useState(false);
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticleIndex, setEditingArticleIndex] = useState<number | null>(null);

  // Edit Doc Form State
  const [editDocForm, setEditDocForm] = useState<Partial<ASFRegulatoryDocument>>({});

  // Article Form State
  const [articleForm, setArticleForm] = useState<{
    number: string;
    heading: string;
    text: string;
    mandateCategory: 'mandatory' | 'prohibitive' | 'advisory';
  }>({
    number: '',
    heading: '',
    text: '',
    mandateCategory: 'mandatory',
  });

  // Self-audit state for raisers & officers
  const [auditWaterDist, setAuditWaterDist] = useState<number>(35);
  const [auditBuiltUpDist, setAuditBuiltUpDist] = useState<number>(65);
  const [auditSchoolDist, setAuditSchoolDist] = useState<number>(250);
  const [auditNoSwill, setAuditNoSwill] = useState<boolean>(true);
  const [auditFootbath, setAuditFootbath] = useState<boolean>(true);
  const [auditFence, setAuditFence] = useState<boolean>(true);
  const [auditEarTag, setAuditEarTag] = useState<boolean>(true);
  const [auditVHC, setAuditVHC] = useState<boolean>(true);

  const isAdmin = currentUser?.role === 'admin';

  // Currently selected document
  const selectedDoc = regulations.find(r => r.id === selectedDocId) || regulations[0];

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Filter articles by search term
  const filteredArticles = selectedDoc
    ? selectedDoc.keyArticles.filter(
        art =>
          art.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          art.heading.toLowerCase().includes(searchTerm.toLowerCase()) ||
          art.text.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Calculate audit results
  const isWaterCompliant = auditWaterDist > 25;
  const isBuiltUpCompliant = auditBuiltUpDist > 50;
  const isSchoolCompliant = auditSchoolDist > 200;
  const setbackScore = (isWaterCompliant ? 1 : 0) + (isBuiltUpCompliant ? 1 : 0) + (isSchoolCompliant ? 1 : 0);
  const biosecurityScore =
    (auditNoSwill ? 2 : 0) +
    (auditFootbath ? 1 : 0) +
    (auditFence ? 1 : 0) +
    (auditEarTag ? 1 : 0) +
    (auditVHC ? 1 : 0);
  const totalScore = setbackScore + biosecurityScore; // max 8 points (3 setback + 5 biosecurity)
  const isFullyCompliant = setbackScore === 3 && auditNoSwill && auditEarTag && auditVHC;

  const handlePrint = () => {
    window.print();
  };

  // Admin Handler: Open Edit Document
  const handleOpenEditDoc = () => {
    if (!selectedDoc) return;
    setEditDocForm({
      ...selectedDoc,
      keyArticles: [...selectedDoc.keyArticles],
      setbackRules: [...selectedDoc.setbackRules],
      penalties: [...selectedDoc.penalties],
      legalBasis: [...selectedDoc.legalBasis],
    });
    setIsEditDocModalOpen(true);
  };

  // Admin Handler: Save Edited Document
  const handleSaveEditDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDocForm.id || !editDocForm.title) return;

    const updatedDoc = editDocForm as ASFRegulatoryDocument;
    storageService.updateAsfRegulation(updatedDoc);
    const refreshed = storageService.getAsfRegulations();
    setRegulations(refreshed);
    setIsEditDocModalOpen(false);
    showToast(`Updated ordinance "${updatedDoc.officialNumber}" successfully`);
  };

  // Admin Handler: Open Add Document Modal
  const handleOpenAddDoc = () => {
    setEditDocForm({
      id: 'doc-' + Date.now(),
      type: 'municipal_eo',
      title: '',
      officialNumber: 'Executive Order No. ' + (regulations.length + 1),
      seriesYear: `Series of ${new Date().getFullYear()}`,
      issuingAuthority: 'Office of the Municipal Mayor, Hinunangan, Southern Leyte',
      signatory: currentUser?.name || 'Hon. Municipal Mayor',
      signatoryTitle: 'Municipal Mayor & Task Force Head',
      effectiveDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + ' (Active)',
      shortSummary: '',
      legalBasis: ['Republic Act No. 7160 (Local Government Code of 1991)'],
      keyArticles: [
        {
          number: 'Section 1',
          heading: 'General Mandate & Scope',
          text: 'Enacting swine movement, setback enforcement, and biosecurity regulations across all 40 barangays of Hinunangan.',
          mandateCategory: 'mandatory',
        },
      ],
      setbackRules: [
        {
          target: 'Potable Water Source / River / Spring',
          minimumDistance: 25,
          statutoryBasis: 'Sanitation Code of the Philippines & Municipal Zoning',
          rationale: 'Mitigate contamination of water supply and community riverways.',
        },
        {
          target: 'Built-up Residential Area / Neighboring Homes',
          minimumDistance: 50,
          statutoryBasis: 'Comprehensive Land Use Plan (CLUP)',
          rationale: 'Prevent odor nuisance and residential pathogen exposure.',
        },
        {
          target: 'Schools, Day Care Centers & Certified Tourism Sites',
          minimumDistance: 200,
          statutoryBasis: 'Municipal Ordinance & DepEd Health Safety Protocols',
          rationale: 'Protect vulnerable student populations and prime tourist zones.',
        },
      ],
      penalties: [
        { offenseTier: 'First Offense', finePhp: 1000, punitiveActions: 'Written warning and mandatory 48-hour compliance.' },
        { offenseTier: 'Second Offense', finePhp: 1500, punitiveActions: 'Administrative fine and suspension of shipping permits.' },
        { offenseTier: 'Third Offense', finePhp: 2500, punitiveActions: 'Full fine, pen closure, and forfeiture of swine.' },
      ],
    });
    setIsAddDocModalOpen(true);
  };

  // Admin Handler: Save New Document
  const handleSaveNewDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDocForm.title || !editDocForm.officialNumber) {
      alert('Please fill out the Title and Official Number');
      return;
    }

    const newDoc: ASFRegulatoryDocument = {
      id: editDocForm.id || 'doc-' + Date.now(),
      type: editDocForm.type || 'municipal_eo',
      title: editDocForm.title || '',
      officialNumber: editDocForm.officialNumber || 'Decree',
      seriesYear: editDocForm.seriesYear || `Series of ${new Date().getFullYear()}`,
      issuingAuthority: editDocForm.issuingAuthority || 'Local Government of Hinunangan',
      signatory: editDocForm.signatory || 'Municipal Mayor',
      signatoryTitle: editDocForm.signatoryTitle || 'Mayor',
      effectiveDate: editDocForm.effectiveDate || 'Effective Immediately',
      shortSummary: editDocForm.shortSummary || editDocForm.title || '',
      legalBasis: editDocForm.legalBasis || ['Republic Act No. 7160'],
      keyArticles: editDocForm.keyArticles || [],
      setbackRules: editDocForm.setbackRules || [],
      penalties: editDocForm.penalties || [],
    };

    storageService.addAsfRegulation(newDoc);
    const refreshed = storageService.getAsfRegulations();
    setRegulations(refreshed);
    setSelectedDocId(newDoc.id);
    setIsAddDocModalOpen(false);
    showToast(`Added new ordinance "${newDoc.officialNumber}" successfully`);
  };

  // Admin Handler: Delete Document
  const handleDeleteDoc = (id: string) => {
    if (regulations.length <= 1) {
      alert('You must keep at least one ordinance in the system.');
      return;
    }
    if (confirm('Are you sure you want to delete this ordinance?')) {
      storageService.deleteAsfRegulation(id);
      const refreshed = storageService.getAsfRegulations();
      setRegulations(refreshed);
      setSelectedDocId(refreshed[0].id);
      showToast('Ordinance removed from database');
    }
  };

  // Admin Handler: Reset to Defaults
  const handleResetDefaults = () => {
    if (confirm('Reset all ASF ordinances back to original baseline statutes (Hinunangan EO 12-2023 & Provincial Ordinance 2021-018)?')) {
      const reset = storageService.resetAsfRegulations();
      setRegulations(reset);
      setSelectedDocId(reset[0].id);
      showToast('Restored default statutes');
    }
  };

  // Admin Handler: Open Article Modal (Add or Edit)
  const handleOpenAddArticle = () => {
    setEditingArticleIndex(null);
    setArticleForm({
      number: `Section ${selectedDoc.keyArticles.length + 1}`,
      heading: '',
      text: '',
      mandateCategory: 'mandatory',
    });
    setIsArticleModalOpen(true);
  };

  const handleOpenEditArticle = (idx: number) => {
    const art = selectedDoc.keyArticles[idx];
    if (!art) return;
    setEditingArticleIndex(idx);
    setArticleForm({ ...art });
    setIsArticleModalOpen(true);
  };

  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleForm.heading.trim() || !articleForm.text.trim()) {
      alert('Please provide an article heading and mandate text.');
      return;
    }

    const updatedDoc = { ...selectedDoc };
    const articles = [...updatedDoc.keyArticles];

    if (editingArticleIndex !== null && editingArticleIndex >= 0) {
      articles[editingArticleIndex] = { ...articleForm };
    } else {
      articles.push({ ...articleForm });
    }

    updatedDoc.keyArticles = articles;
    storageService.updateAsfRegulation(updatedDoc);
    setRegulations(storageService.getAsfRegulations());
    setIsArticleModalOpen(false);
    showToast(
      editingArticleIndex !== null ? `Updated article "${articleForm.number}"` : `Added new article "${articleForm.number}"`
    );
  };

  const handleDeleteArticle = (idx: number) => {
    if (confirm('Are you sure you want to delete this article?')) {
      const updatedDoc = { ...selectedDoc };
      const articles = [...updatedDoc.keyArticles];
      articles.splice(idx, 1);
      updatedDoc.keyArticles = articles;
      storageService.updateAsfRegulation(updatedDoc);
      setRegulations(storageService.getAsfRegulations());
      showToast('Article deleted from ordinance');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Success Notification Toast */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl border border-emerald-700 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-stone-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              African Swine Fever (ASF) Legal & Biosecurity Decrees
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/90 max-w-3xl leading-relaxed">
              Statutory regulations governing swine pen setbacks, absolute swill-feeding prohibitions, transport clearances, and quarantine checkpoint enforcement in the <strong>Municipality of Hinunangan</strong> and the <strong>Province of Southern Leyte</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isAdmin && (
              <button
                onClick={handleOpenAddDoc}
                className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Ordinance</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/20 flex items-center gap-2 transition cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4 text-emerald-300" />
              <span>Print Official Summary</span>
            </button>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('add_swine')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition cursor-pointer shadow-md"
              >
                <Layers className="w-4 h-4" />
                <span>Register Swine with Setbacks</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs (Dynamic Documents + Audit Tool) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-2 shadow-xs flex flex-wrap gap-2 text-xs font-bold">
        {regulations.map(doc => (
          <button
            key={doc.id}
            onClick={() => {
              setSelectedDocId(doc.id);
              setActiveTabMode('document');
            }}
            className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTabMode === 'document' && selectedDocId === doc.id
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            {doc.type === 'municipal_eo' ? (
              <Building className="w-4 h-4 text-emerald-300" />
            ) : (
              <Shield className="w-4 h-4 text-emerald-300" />
            )}
            <span className="truncate">{doc.officialNumber} ({doc.seriesYear})</span>
          </button>
        ))}

        <button
          onClick={() => setActiveTabMode('audit')}
          className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTabMode === 'audit'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'text-stone-700 hover:bg-stone-100'
          }`}
        >
          <Scale className="w-4 h-4 text-emerald-300" />
          <span>Interactive Farm Compliance Audit</span>
        </button>
      </div>

      {/* Main Viewport Content */}
      {activeTabMode === 'audit' ? (
        /* INTERACTIVE FARM SETBACK & BIOSECURITY AUDIT */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
            <div>
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Self-Assessment Tool
              </span>
              <h2 className="text-xl font-black text-stone-900 mt-0.5">
                Farm Compliance Audit: Setback Buffers & Biosecurity Mandates
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Enter your farm's physical buffer distances to test compliance against Municipal EO 12-2023 and Provincial Ordinance 2021-018.
              </p>
            </div>

            {/* Overall Rating Badge */}
            <div
              className={`p-4 rounded-2xl border text-center ${
                isFullyCompliant
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider block text-stone-500">
                Compliance Status
              </span>
              <div className="text-base font-black flex items-center justify-center gap-1.5 mt-0.5">
                {isFullyCompliant ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Grade A - FULLY COMPLIANT</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span>REQUIRES ADJUSTMENT</span>
                  </>
                )}
              </div>
              <span className="text-[11px] font-semibold text-stone-600 mt-1 block">
                Score: {totalScore} / 8 Standard Points
              </span>
            </div>
          </div>

          {/* Section 1: The 3 Statutory Setback Distances */}
          <div className="space-y-4">
            <h3 className="font-bold text-stone-900 text-sm uppercase tracking-wide flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>1. Physical Setback Buffers (Section 2, EO 12-2023)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Buffer 1: Water */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  isWaterCompliant ? 'bg-emerald-50/50 border-emerald-300' : 'bg-red-50/50 border-red-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-stone-900">Distance to Water Source</span>
                  </div>
                  {isWaterCompliant ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      Compliant (&gt;25m)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                      Violation (&le;25m)
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Your Current Buffer:</span>
                    <span className="font-mono font-black text-sm text-stone-900">{auditWaterDist} meters</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="1"
                    value={auditWaterDist}
                    onChange={e => setAuditWaterDist(Number(e.target.value))}
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                  <p className="text-[11px] text-stone-500">
                    Required: Minimum 25m from streams, springs, rivers, or public wells.
                  </p>
                </div>
              </div>

              {/* Buffer 2: Built-up Residential */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  isBuiltUpCompliant ? 'bg-emerald-50/50 border-emerald-300' : 'bg-red-50/50 border-red-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-stone-900">Distance to Built-up Zone</span>
                  </div>
                  {isBuiltUpCompliant ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      Compliant (&gt;50m)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                      Violation (&le;50m)
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Your Current Buffer:</span>
                    <span className="font-mono font-black text-sm text-stone-900">{auditBuiltUpDist} meters</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="150"
                    step="1"
                    value={auditBuiltUpDist}
                    onChange={e => setAuditBuiltUpDist(Number(e.target.value))}
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                  <p className="text-[11px] text-stone-500">
                    Required: Minimum 50m from adjacent residential houses or cluster settlements.
                  </p>
                </div>
              </div>

              {/* Buffer 3: School / Tourism */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  isSchoolCompliant ? 'bg-emerald-50/50 border-emerald-300' : 'bg-red-50/50 border-red-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <School className="w-4 h-4 text-purple-700" />
                    <span className="font-bold text-stone-900">Distance to School / Eco-site</span>
                  </div>
                  {isSchoolCompliant ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      Compliant (&gt;200m)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                      Violation (&le;200m)
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Your Current Buffer:</span>
                    <span className="font-mono font-black text-sm text-stone-900">{auditSchoolDist} meters</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="5"
                    value={auditSchoolDist}
                    onChange={e => setAuditSchoolDist(Number(e.target.value))}
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                  <p className="text-[11px] text-stone-500">
                    Required: Minimum 200m from schools, churches, or eco-tourism sites.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Statutory Biosecurity Checklist */}
          <div className="space-y-4">
            <h3 className="font-bold text-stone-900 text-sm uppercase tracking-wide flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-700" />
              <span>2. Mandatory Farm Biosecurity Protocols</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <label className="flex items-start gap-3 p-4 rounded-2xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={auditNoSwill}
                  onChange={e => setAuditNoSwill(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-stone-900">Zero Swill-Feeding ("Bawal ang Pasaw")</span>
                  <p className="text-[11px] text-stone-500">100% commercial feeds or safe cooked crops. No restaurant/kitchen food scraps.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-2xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={auditFootbath}
                  onChange={e => setAuditFootbath(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-stone-900">Disinfectant Footbath at Entrance</span>
                  <p className="text-[11px] text-stone-500">Lime or virucidal chemical footbath maintained daily at pen entrance.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-2xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={auditFence}
                  onChange={e => setAuditFence(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-stone-900">Enclosed Perimeter Fence</span>
                  <p className="text-[11px] text-stone-500">Physical netting or solid barrier preventing contact with stray dogs or feral animals.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-2xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={auditEarTag}
                  onChange={e => setAuditEarTag(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-stone-900">Official Municipal DA Ear Tag Installed</span>
                  <p className="text-[11px] text-stone-500">All swine tagged with official Hinunangan code sequence.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-2xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition md:col-span-2">
                <input
                  type="checkbox"
                  checked={auditVHC}
                  onChange={e => setAuditVHC(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-stone-900">Veterinary Health Certificate (VHC) Pre-Movement Clearance</span>
                  <p className="text-[11px] text-stone-500">Commitment to secure official municipal clearance before loading or transferring any hog.</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      ) : (
        /* REGULATORY STATUTE DOCUMENT VIEWER WITH ADMIN EDIT CAPABILITIES */
        <div className="space-y-6">
          {/* Document Summary Card & Admin Action Toolbar */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-stone-100 pb-5">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-black text-xs">
                    {selectedDoc.officialNumber}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 font-bold text-xs">
                    {selectedDoc.seriesYear}
                  </span>
                  <span className="text-xs text-stone-500 font-medium">
                    Effective: {selectedDoc.effectiveDate}
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-black text-stone-900 leading-snug">
                  {selectedDoc.title}
                </h2>

                <p className="text-xs text-stone-600 font-medium">
                  Issuing Authority: <strong>{selectedDoc.issuingAuthority}</strong>
                </p>
                <p className="text-xs text-emerald-900 font-semibold">
                  Signatory: {selectedDoc.signatory} ({selectedDoc.signatoryTitle})
                </p>
                {selectedDoc.shortSummary && (
                  <p className="text-xs text-stone-500 mt-1 bg-stone-50 p-3 rounded-xl border border-stone-200 leading-relaxed">
                    {selectedDoc.shortSummary}
                  </p>
                )}
              </div>

              {/* Admin Action Buttons & Search */}
              <div className="flex flex-col sm:items-end gap-3 shrink-0">
                {isAdmin && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleOpenEditDoc}
                      className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-300 flex items-center gap-1.5 transition cursor-pointer"
                      title="Edit ordinance details and metadata"
                    >
                      <Pencil className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Edit Ordinance</span>
                    </button>

                    <button
                      onClick={handleOpenAddArticle}
                      className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      title="Add a new Section / Article"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Article</span>
                    </button>

                    {regulations.length > 1 && (
                      <button
                        onClick={() => handleDeleteDoc(selectedDoc.id)}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition cursor-pointer"
                        title="Delete this ordinance"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={handleResetDefaults}
                      className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition cursor-pointer"
                      title="Reset all ordinances to system defaults"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Quick Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search articles & keywords..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Setback Matrix within this Ordinance */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black text-stone-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-emerald-700" />
                  <span>Statutory Setback Buffers Enforced under this Law</span>
                </h4>
                {isAdmin && (
                  <button
                    onClick={handleOpenEditDoc}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit Setback Limits</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {selectedDoc.setbackRules.map((rule, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-stone-900">{rule.target}</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white font-black text-xs">
                        &gt; {rule.minimumDistance} meters
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-800 font-bold block">{rule.statutoryBasis}</span>
                    <p className="text-[11px] text-stone-600 leading-relaxed">{rule.rationale}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Penalties & Fines Schedule */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black text-stone-900 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Penalties, Administrative Fines & Confiscations</span>
                </h4>
                {isAdmin && (
                  <button
                    onClick={handleOpenEditDoc}
                    className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit Fines & Penalties</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {selectedDoc.penalties.map((pen, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950">{pen.offenseTier}</span>
                      <span className="font-black text-amber-800 text-sm">₱{pen.finePhp.toLocaleString()}</span>
                    </div>
                    <p className="text-[11px] text-amber-900/90 leading-snug">{pen.punitiveActions}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Articles Accordion / Cards */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-black text-stone-900 text-sm uppercase tracking-wide">
                Official Key Provisions ({filteredArticles.length} Sections)
              </h3>
              {isAdmin && (
                <button
                  onClick={handleOpenAddArticle}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Article / Section</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {filteredArticles.map((art, idx) => {
                // Find actual index in parent document
                const actualIdx = selectedDoc.keyArticles.findIndex(
                  a => a.number === art.number && a.heading === art.heading
                );

                return (
                  <div key={idx} className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-2 relative group">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-stone-900 text-white font-mono font-bold text-xs">
                          {art.number}
                        </span>
                        <h4 className="font-black text-stone-900 text-sm">{art.heading}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide ${
                            art.mandateCategory === 'prohibitive'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : art.mandateCategory === 'mandatory'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {art.mandateCategory}
                        </span>

                        {isAdmin && (
                          <div className="flex items-center gap-1 pl-2 border-l border-stone-200">
                            <button
                              onClick={() => handleOpenEditArticle(actualIdx)}
                              className="p-1 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-emerald-800 transition cursor-pointer"
                              title="Edit this article"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteArticle(actualIdx)}
                              className="p-1 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-700 transition cursor-pointer"
                              title="Delete this article"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-line">{art.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legal References Footnote */}
          <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 text-xs text-stone-600 space-y-2">
            <span className="font-bold text-stone-900 block">Statutory Legal Enactments & Enabling National Acts:</span>
            <ul className="list-disc list-inside space-y-1 text-[11px]">
              {selectedDoc.legalBasis.map((lb, i) => (
                <li key={i}>{lb}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADMIN MODAL: EDIT ORDINANCE DETAILS                     */}
      {/* ======================================================== */}
      {isEditDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-emerald-700" />
                <h3 className="font-black text-stone-900 text-base">
                  Edit Ordinance: {editDocForm.officialNumber}
                </h3>
              </div>
              <button
                onClick={() => setIsEditDocModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDoc} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Official Number *</label>
                  <input
                    type="text"
                    required
                    value={editDocForm.officialNumber || ''}
                    onChange={e => setEditDocForm({ ...editDocForm, officialNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-semibold focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Series Year *</label>
                  <input
                    type="text"
                    required
                    value={editDocForm.seriesYear || ''}
                    onChange={e => setEditDocForm({ ...editDocForm, seriesYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-semibold focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Full Statutory Title *</label>
                <textarea
                  rows={2}
                  required
                  value={editDocForm.title || ''}
                  onChange={e => setEditDocForm({ ...editDocForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Issuing Authority</label>
                  <input
                    type="text"
                    value={editDocForm.issuingAuthority || ''}
                    onChange={e => setEditDocForm({ ...editDocForm, issuingAuthority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Effective Date</label>
                  <input
                    type="text"
                    value={editDocForm.effectiveDate || ''}
                    onChange={e => setEditDocForm({ ...editDocForm, effectiveDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Signatory Name</label>
                  <input
                    type="text"
                    value={editDocForm.signatory || ''}
                    onChange={e => setEditDocForm({ ...editDocForm, signatory: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Signatory Title</label>
                  <input
                    type="text"
                    value={editDocForm.signatoryTitle || ''}
                    onChange={e => setEditDocForm({ ...editDocForm, signatoryTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Short Summary / Purpose</label>
                <textarea
                  rows={2}
                  value={editDocForm.shortSummary || ''}
                  onChange={e => setEditDocForm({ ...editDocForm, shortSummary: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Setback Rules Editor */}
              <div className="pt-2 border-t border-stone-100">
                <span className="font-black text-stone-900 block mb-2">Setback Buffers (Meters):</span>
                <div className="space-y-2">
                  {editDocForm.setbackRules?.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                      <span className="font-bold text-stone-800 flex-1 truncate">{rule.target}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-stone-500 text-[11px]">Min:</span>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={rule.minimumDistance}
                          onChange={e => {
                            const newRules = [...(editDocForm.setbackRules || [])];
                            newRules[idx] = { ...newRules[idx], minimumDistance: Number(e.target.value) };
                            setEditDocForm({ ...editDocForm, setbackRules: newRules });
                          }}
                          className="w-16 px-2 py-1 rounded-lg border border-stone-300 font-bold bg-white text-center"
                        />
                        <span className="text-stone-500 font-bold">m</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Penalties Editor */}
              <div className="pt-2 border-t border-stone-100">
                <span className="font-black text-stone-900 block mb-2">Penalty Schedule (PHP):</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {editDocForm.penalties?.map((pen, idx) => (
                    <div key={idx} className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 space-y-1">
                      <span className="font-bold text-amber-950 block">{pen.offenseTier}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-amber-800 font-bold">₱</span>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={pen.finePhp}
                          onChange={e => {
                            const newPens = [...(editDocForm.penalties || [])];
                            newPens[idx] = { ...newPens[idx], finePhp: Number(e.target.value) };
                            setEditDocForm({ ...editDocForm, penalties: newPens });
                          }}
                          className="w-full px-2 py-1 rounded-lg border border-amber-300 font-black bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsEditDocModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold cursor-pointer hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Ordinance Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADMIN MODAL: ADD NEW ORDINANCE                          */}
      {/* ======================================================== */}
      {isAddDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-700" />
                <h3 className="font-black text-stone-900 text-base">Add New Ordinance / Executive Order</h3>
              </div>
              <button
                onClick={() => setIsAddDocModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewDoc} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Decree Type *</label>
                  <select
                    value={editDocForm.type || 'municipal_eo'}
                    onChange={e =>
                      setEditDocForm({
                        ...editDocForm,
                        type: e.target.value as 'municipal_eo' | 'provincial_ordinance',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-semibold focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="municipal_eo">Municipal Executive Order (EO)</option>
                    <option value="provincial_ordinance">Provincial Ordinance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Official Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Executive Order No. 14"
                    value={editDocForm.officialNumber || ''}
                    onChange={e => setEditDocForm({ ...editDocForm, officialNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-semibold focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Full Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. An Order Strengthening Biosurveillance in Hinunangan..."
                  value={editDocForm.title || ''}
                  onChange={e => setEditDocForm({ ...editDocForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-semibold focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Series Year</label>
                  <input
                    type="text"
                    placeholder="Series of 2024"
                    value={editDocForm.seriesYear || ''}
                    onChange={e => setEditDocForm({ ...editDocForm, seriesYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Effective Date</label>
                  <input
                    type="text"
                    placeholder="November 1, 2024 (Active)"
                    value={editDocForm.effectiveDate || ''}
                    onChange={e => setEditDocForm({ ...editDocForm, effectiveDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Issuing Authority</label>
                  <input
                    type="text"
                    value={editDocForm.issuingAuthority || ''}
                    onChange={e => setEditDocForm({ ...editDocForm, issuingAuthority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Signatory Official</label>
                  <input
                    type="text"
                    value={editDocForm.signatory || ''}
                    onChange={e => setEditDocForm({ ...editDocForm, signatory: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Summary of Regulatory Objectives</label>
                <textarea
                  rows={2}
                  placeholder="Summarize the core mandates for farmers and field personnel..."
                  value={editDocForm.shortSummary || ''}
                  onChange={e => setEditDocForm({ ...editDocForm, shortSummary: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddDocModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold cursor-pointer hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>Create & Publish Ordinance</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADMIN MODAL: ADD / EDIT ARTICLE                         */}
      {/* ======================================================== */}
      {isArticleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-700" />
                <h3 className="font-black text-stone-900 text-base">
                  {editingArticleIndex !== null ? 'Edit Article / Provision' : 'Add New Article / Section'}
                </h3>
              </div>
              <button
                onClick={() => setIsArticleModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Section / Article Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Section 7 or Article IV"
                    value={articleForm.number}
                    onChange={e => setArticleForm({ ...articleForm, number: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Mandate Classification *</label>
                  <select
                    value={articleForm.mandateCategory}
                    onChange={e =>
                      setArticleForm({
                        ...articleForm,
                        mandateCategory: e.target.value as 'mandatory' | 'prohibitive' | 'advisory',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="mandatory">Mandatory (Compulsory Protocol)</option>
                    <option value="prohibitive">Prohibitive (Strict Ban / Pasaw)</option>
                    <option value="advisory">Advisory (Guideline / Standard)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Heading / Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mandatory Visitor Disinfection Logbook"
                  value={articleForm.heading}
                  onChange={e => setArticleForm({ ...articleForm, heading: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Mandate Legal Text / Instructions *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe the full legal requirements, obligations, and enforcement rules..."
                  value={articleForm.text}
                  onChange={e => setArticleForm({ ...articleForm, text: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-medium focus:ring-2 focus:ring-emerald-600 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsArticleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold cursor-pointer hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Article</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
