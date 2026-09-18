import React, { useRef } from 'react';
import {
  Megaphone,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Upload,
  FolderOpen,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { LandingCmsConfig } from '../../../../types/landingCms';

interface HeroTabProps {
  config: LandingCmsConfig;
  onChange: (updates: Partial<LandingCmsConfig>) => void;
  onOpenMediaPicker?: (targetField: string) => void;
}

export const HeroTab: React.FC<HeroTabProps> = ({ config, onChange, onOpenMediaPicker }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange({ heroBackgroundUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const heroImagePresets = [
    {
      name: 'Sanitary Swine Barn (Hinunangan Standard)',
      url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=1600&q=80',
    },
    {
      name: 'Hinunangan Rural Farm & Coconut Valley',
      url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=80',
    },
    {
      name: 'SLSU Extension Research & Animal Pen',
      url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1600&q=80',
    },
    {
      name: 'High-Health Breeding Finisher Facility',
      url: 'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?auto=format&fit=crop&w=1600&q=80',
    },
  ];

  return (
    <div className="space-y-6 text-xs text-stone-800">
      {/* Headlines & Copywriting */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 border-stone-100">
          <Megaphone className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-stone-900 text-sm">Hero Copy & Text Content</h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Top Badge Pill Notice</label>
            <input
              type="text"
              value={config.heroBadgeText}
              onChange={e => onChange({ heroBadgeText: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium"
              placeholder="e.g. Official DA Municipal Portal • Green Zone Certified"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Main Hero Headline (H1)</label>
            <input
              type="text"
              value={config.heroTitle}
              onChange={e => onChange({ heroTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-stone-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              placeholder="e.g. DA HINUNANGAN SWINE REGISTRY"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Hero Subtitle</label>
            <textarea
              rows={2}
              value={config.heroSubtitle}
              onChange={e => onChange({ heroSubtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden leading-relaxed"
              placeholder="Empowering Hinunangan Hog Raisers with Real-time Traceability..."
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Hero Extended Description (Paragraph)</label>
            <textarea
              rows={3}
              value={config.heroDescription}
              onChange={e => onChange({ heroDescription: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden leading-relaxed text-[11px]"
              placeholder="Detailed introduction of municipal mandate, SLSU partnership, and focal person responsibilities."
            />
          </div>
        </div>
      </div>

      {/* Buttons & Links */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 border-stone-100">
          <Sparkles className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-stone-900 text-sm">Call to Action (CTA) Buttons</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 space-y-2">
            <span className="font-bold text-stone-900 block text-xs">Primary CTA Button</span>
            <div>
              <label className="block text-[11px] text-stone-600 mb-1">Button Text</label>
              <input
                type="text"
                value={config.primaryButtonText}
                onChange={e => onChange({ primaryButtonText: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-stone-600 mb-1">Target Link / Action</label>
              <input
                type="text"
                value={config.primaryButtonLink}
                onChange={e => onChange({ primaryButtonLink: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white font-mono text-[11px]"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 space-y-2">
            <span className="font-bold text-stone-900 block text-xs">Secondary CTA Button</span>
            <div>
              <label className="block text-[11px] text-stone-600 mb-1">Button Text</label>
              <input
                type="text"
                value={config.secondaryButtonText}
                onChange={e => onChange({ secondaryButtonText: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-stone-600 mb-1">Target Link / Action</label>
              <input
                type="text"
                value={config.secondaryButtonLink}
                onChange={e => onChange({ secondaryButtonLink: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white font-mono text-[11px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Background Photo & Overlay Controls */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-stone-100">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-stone-900 text-sm">Hero Background Photo & Overlay</h3>
          </div>
          <span className="text-[11px] text-stone-400">High-res responsive image</span>
        </div>

        {/* Current Image Preview */}
        <div className="relative rounded-xl overflow-hidden border border-stone-200 h-44 bg-stone-900 flex items-center justify-center">
          <img
            src={config.heroBackgroundUrl}
            alt="Hero Background Preview"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div
            className="absolute inset-0 transition-opacity"
            style={{
              backgroundColor: config.heroOverlayColor || '#022c22',
              opacity: (config.heroOverlayOpacity ?? 75) / 100,
            }}
          />
          <div className="relative z-10 text-white text-center p-4">
            <p className="font-bold text-sm">Live Overlay Simulation</p>
            <p className="text-[11px] text-stone-300">
              Opacity: {config.heroOverlayOpacity}% • Tint: {config.heroOverlayColor}
            </p>
          </div>
        </div>

        {/* Image Controls & Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer border border-stone-300"
          >
            <Upload className="w-3.5 h-3.5 text-stone-600" /> Upload New Photo
          </button>

          {onOpenMediaPicker && (
            <button
              type="button"
              onClick={() => onOpenMediaPicker('heroBackgroundUrl')}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-emerald-300"
            >
              <FolderOpen className="w-3.5 h-3.5 text-emerald-700" /> Choose From Media Library
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              onChange({
                heroBackgroundUrl:
                  'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=1600&q=80',
              })
            }
            className="px-3 py-1.5 rounded-xl text-stone-500 hover:text-stone-800 text-xs transition cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Reset Default Photo
          </button>
        </div>

        {/* Presets List */}
        <div>
          <span className="font-semibold text-stone-600 text-[11px] block mb-1.5">
            Quick Presets (Hinunangan & SLSU Environments):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {heroImagePresets.map(preset => (
              <div
                key={preset.name}
                onClick={() => onChange({ heroBackgroundUrl: preset.url })}
                className={`p-2 rounded-xl border text-left cursor-pointer transition ${
                  config.heroBackgroundUrl === preset.url
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                }`}
              >
                <div className="h-12 rounded-lg bg-stone-200 overflow-hidden mb-1.5">
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <p className="text-[10px] leading-tight line-clamp-2">{preset.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Position, Opacity & Alignment controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-stone-100">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Overlay Opacity: {config.heroOverlayOpacity}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={config.heroOverlayOpacity}
              onChange={e => onChange({ heroOverlayOpacity: Number(e.target.value) })}
              className="w-full cursor-pointer accent-emerald-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Overlay Tint Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.heroOverlayColor || '#022c22'}
                onChange={e => onChange({ heroOverlayColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-stone-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={config.heroOverlayColor || '#022c22'}
                onChange={e => onChange({ heroOverlayColor: e.target.value })}
                className="w-full px-2.5 py-1 rounded-lg border border-stone-300 font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Text Alignment</label>
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => onChange({ heroTextAlign: 'left' })}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center cursor-pointer transition ${
                  config.heroTextAlign === 'left' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-stone-600'
                }`}
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onChange({ heroTextAlign: 'center' })}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center cursor-pointer transition ${
                  config.heroTextAlign === 'center' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-stone-600'
                }`}
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onChange({ heroTextAlign: 'right' })}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center cursor-pointer transition ${
                  config.heroTextAlign === 'right' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-stone-600'
                }`}
              >
                <AlignRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
