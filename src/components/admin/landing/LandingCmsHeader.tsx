import React from 'react';
import {
  Globe,
  Save,
  Send,
  RotateCcw,
  Eye,
  Smartphone,
  Tablet,
  Monitor,
  Columns2,
  FileEdit,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  FolderOpen,
  Layers,
  Share2,
} from 'lucide-react';
import { LandingCmsConfig } from '../../../types/landingCms';

export type ViewMode = 'split' | 'editor' | 'preview';
export type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface LandingCmsHeaderProps {
  config: LandingCmsConfig;
  hasUnsavedChanges: boolean;
  viewMode: ViewMode;
  deviceMode: DeviceMode;
  onChangeViewMode: (mode: ViewMode) => void;
  onChangeDeviceMode: (mode: DeviceMode) => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onResetDraft: () => void;
  onRestoreDefaults: () => void;
  onOpenMediaLibrary: () => void;
  onOpenLogosTab: () => void;
  onOpenSocialTab: () => void;
}

export const LandingCmsHeader: React.FC<LandingCmsHeaderProps> = ({
  config,
  hasUnsavedChanges,
  viewMode,
  deviceMode,
  onChangeViewMode,
  onChangeDeviceMode,
  onSaveDraft,
  onPublish,
  onResetDraft,
  onRestoreDefaults,
  onOpenMediaLibrary,
  onOpenLogosTab,
  onOpenSocialTab,
}) => {
  const mediaCount = config.mediaItems?.length || 0;
  const activeSectionsCount = config.sections?.filter(s => s.enabled).length || 0;
  const connectedSocialsCount = config.socialAccounts?.filter(s => s.enabled).length || 0;

  return (
    <div className="space-y-4">
      {/* Top Main Bar */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
              <Globe className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-stone-900 tracking-tight">Landing Page Management</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide flex items-center gap-1.5 ${
                    hasUnsavedChanges
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      hasUnsavedChanges ? 'bg-amber-500 animate-pulse' : 'bg-emerald-600'
                    }`}
                  />
                  {hasUnsavedChanges ? 'Draft (Unsaved Changes)' : '● Published Live'}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Customize the public DA Hinunangan Swine Registry website branding, imagery, and citizen services.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher */}
          <div className="bg-stone-100 p-1 rounded-xl flex items-center border border-stone-200">
            <button
              onClick={() => onChangeViewMode('split')}
              title="Split View (Editor + Live Preview)"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                viewMode === 'split' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              onClick={() => onChangeViewMode('editor')}
              title="Editor Fullscreen"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                viewMode === 'editor' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Editor</span>
            </button>
            <button
              onClick={() => onChangeViewMode('preview')}
              title="Live Preview Fullscreen"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                viewMode === 'preview' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Live Preview</span>
            </button>
          </div>

          {/* Responsive Preview Device Toggles (visible when in split or preview mode) */}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div className="bg-stone-100 p-1 rounded-xl flex items-center border border-stone-200">
              <button
                onClick={() => onChangeDeviceMode('desktop')}
                title="Desktop View (100%)"
                className={`p-1.5 rounded-lg text-xs cursor-pointer transition ${
                  deviceMode === 'desktop' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-600'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onChangeDeviceMode('tablet')}
                title="Tablet View (768px)"
                className={`p-1.5 rounded-lg text-xs cursor-pointer transition ${
                  deviceMode === 'tablet' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-600'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onChangeDeviceMode('mobile')}
                title="Mobile View (375px)"
                className={`p-1.5 rounded-lg text-xs cursor-pointer transition ${
                  deviceMode === 'mobile' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-600'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Primary Operations */}
          <button
            onClick={onSaveDraft}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-stone-300"
          >
            <Save className="w-3.5 h-3.5 text-stone-700" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={onPublish}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black shadow-md hover:shadow-lg flex items-center gap-1.5 transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-emerald-200" />
            <span>Publish Changes</span>
          </button>
        </div>
      </div>

      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>You have unpublished changes.</strong> These changes are saved in your local draft and visible in the preview, but not live to the public until published.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onResetDraft}
              className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 font-bold text-amber-900 transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Discard / Reset
            </button>
            <button
              onClick={onPublish}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 font-bold text-white shadow-xs transition flex items-center gap-1 cursor-pointer"
            >
              <CheckCircle className="w-3 h-3" /> Publish Now
            </button>
          </div>
        </div>
      )}

      {/* Quick Settings Overview Stats & Highlight Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
        {/* Metric 1 */}
        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Website Status</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
            <span className="font-bold text-stone-900 text-sm">{config.status === 'published' ? 'Published' : 'Draft'}</span>
          </div>
          <span className="text-[10px] text-stone-400 mt-0.5 block">Live in production</span>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Last Updated</span>
          <span className="font-bold text-stone-900 text-sm mt-1 block truncate">{config.lastUpdated}</span>
          <span className="text-[10px] text-stone-400 mt-0.5 block">By Municipal Admin</span>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Media Assets</span>
          <span className="font-bold text-emerald-800 text-sm mt-1 block">{mediaCount} Files</span>
          <span className="text-[10px] text-stone-400 mt-0.5 block">Logos, photos & seals</span>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Active Sections</span>
          <span className="font-bold text-stone-900 text-sm mt-1 block">{activeSectionsCount} Active</span>
          <span className="text-[10px] text-stone-400 mt-0.5 block">Custom page layout</span>
        </div>

        {/* Metric 5 */}
        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">Social Accounts</span>
          <span className="font-bold text-stone-900 text-sm mt-1 block">{connectedSocialsCount} Connected</span>
          <span className="text-[10px] text-stone-400 mt-0.5 block">Official feeds linked</span>
        </div>
      </div>

      {/* 2 Highlighted Management Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Official Branding */}
        <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white p-5 rounded-2xl shadow-sm border border-emerald-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="bg-emerald-800/80 border border-emerald-500/40 text-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Institutional Identity
              </span>
              <Sparkles className="w-4 h-4 text-emerald-300" />
            </div>
            <h3 className="text-base font-bold mt-2">Official Branding & Insignias</h3>
            <p className="text-xs text-emerald-100/80 mt-1 leading-relaxed">
              Control the official Municipal Seal, DA logo, SLSU University Seal, Extension Center Emblem, and partner badges displayed across header, hero, and footer.
            </p>
            <div className="flex items-center gap-2 mt-3 text-[11px] text-emerald-200">
              <span className="flex items-center gap-1 bg-emerald-950/60 px-2 py-1 rounded-md border border-emerald-800">
                ● Hinunangan Seal
              </span>
              <span className="flex items-center gap-1 bg-emerald-950/60 px-2 py-1 rounded-md border border-emerald-800">
                ● DA Emblem
              </span>
              <span className="flex items-center gap-1 bg-emerald-950/60 px-2 py-1 rounded-md border border-emerald-800">
                ● SLSU Seal
              </span>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-2">
            <button
              onClick={onOpenLogosTab}
              className="px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black text-xs transition cursor-pointer shadow-sm"
            >
              Manage Official Branding
            </button>
          </div>
        </div>

        {/* Card 2: Photo & Media Settings */}
        <div className="bg-gradient-to-br from-stone-900 to-slate-950 text-white p-5 rounded-2xl shadow-sm border border-stone-700/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="bg-stone-800 border border-stone-600 text-stone-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Digital Asset Manager
              </span>
              <FolderOpen className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-base font-bold mt-2">Photo & Media Library Settings</h3>
            <p className="text-xs text-stone-300 mt-1 leading-relaxed">
              Upload, crop, preview, and replace high-resolution photography of Hinunangan hog farms, SLSU extension facilities, veterinary checkpoints, and gallery items.
            </p>
            <div className="flex items-center gap-2 mt-3 text-[11px] text-stone-300">
              <span className="bg-stone-800/80 px-2 py-1 rounded-md border border-stone-700">
                {mediaCount} Total Media
              </span>
              <span className="bg-stone-800/80 px-2 py-1 rounded-md border border-stone-700">
                Hero & Backgrounds
              </span>
              <span className="bg-stone-800/80 px-2 py-1 rounded-md border border-stone-700">
                Field Inspections
              </span>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-2">
            <button
              onClick={onOpenMediaLibrary}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs transition cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5" /> Open Media Library
            </button>
            <button
              onClick={onRestoreDefaults}
              title="Reset all settings to initial defaults"
              className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition cursor-pointer border border-stone-700 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Restore Default
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
