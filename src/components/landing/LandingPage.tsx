import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  MapPin,
  ShoppingBag,
  ArrowRight,
  LogIn,
  CheckCircle,
  ExternalLink,
  WifiOff,
  Sparkles,
  Megaphone,
  Phone,
  Mail,
  Clock,
  Play,
  Share2,
  Calendar,
  Video,
  X,
} from 'lucide-react';
import { Barangay, LandingPageConfig, SwineRecord, UserAccount, UserRole } from '../../types';
import { LandingCmsConfig, VideoMediaItem } from '../../types/landingCms';
import { landingCmsService } from '../../services/landingCmsService';
import { storageService } from '../../services/storageService';
import { OfficialSealBadge } from '../common/OfficialSeals';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface LandingPageProps {
  swineList?: SwineRecord[];
  barangays?: Barangay[];
  config?: LandingPageConfig;
  accounts?: UserAccount[];
  overrideCmsConfig?: LandingCmsConfig;
  isEmbeddedPreview?: boolean;
  onSelectRole?: (role: UserRole, user?: UserAccount) => void;
  onNavigateTab?: (tab: string) => void;
  onOpenLogin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  swineList,
  barangays,
  accounts,
  overrideCmsConfig,
  isEmbeddedPreview = false,
  onSelectRole = (_role?: UserRole, _user?: UserAccount) => {},
  onOpenLogin = () => {},
}) => {
  const [publishedConfig, setPublishedConfig] = useState<LandingCmsConfig>(() =>
    landingCmsService.getPublishedConfig()
  );

  useEffect(() => {
    const handleUpdate = () => {
      setPublishedConfig(landingCmsService.getPublishedConfig());
    };
    window.addEventListener('da_landing_cms_updated', handleUpdate);
    return () => window.removeEventListener('da_landing_cms_updated', handleUpdate);
  }, []);

  const cmsConfig = overrideCmsConfig || publishedConfig;
  const [selectedVideo, setSelectedVideo] = useState<VideoMediaItem | null>(null);

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`;
    }
    return url;
  };

  const effectiveSwineList = swineList && swineList.length > 0 ? swineList : storageService.getSwineRecords();
  const effectiveBarangays = barangays && barangays.length > 0 ? barangays : storageService.getBarangays();

  const readyToSellCount = effectiveSwineList.filter(s => !s.isArchived && s.readyToSell).length;
  const totalSwine = effectiveSwineList.filter(s => !s.isArchived).length;
  const uniqueFarmers = new Set(effectiveSwineList.filter(s => !s.isArchived).map(s => s.farmerName)).size;

  const bg = cmsConfig.interfaceBackground || {
    enabled: true,
    imageUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=2000&q=80',
    overlayOpacity: 35,
    overlayColor: '#064e3b',
    blur: 0,
    brightness: 100,
    position: 'center',
    fit: 'cover',
    fixed: true,
  };

  const hasBackground = Boolean(bg.imageUrl && bg.enabled !== false);
  const blurPx = bg.blur ?? (bg as any).blurLevel ?? 0;
  const brightnessVal = (bg.brightness ?? 100) / 100;

  const theme = cmsConfig.theme || {
    primaryColor: '#047857',
    secondaryColor: '#064e3b',
    accentColor: '#f59e0b',
    backgroundColor: '#ffffff',
    textColor: '#1c1917',
    headingColor: '#064e3b',
    buttonColor: '#047857',
    buttonTextColor: '#ffffff',
    headingFont: 'system-ui',
    bodyFont: 'system-ui',
  };

  return (
    <div
      className={`relative ${isEmbeddedPreview ? 'w-full' : 'min-h-screen'} text-stone-900 selection:bg-emerald-500 selection:text-white`}
      style={{
        fontFamily: theme.bodyFont || 'system-ui',
        backgroundColor: theme.backgroundColor || '#ffffff',
        color: theme.textColor || '#1c1917',
      }}
    >
      {/* Background Layer */}
      {hasBackground && (
        <div
          className={`${isEmbeddedPreview ? 'absolute' : 'fixed'} inset-0 pointer-events-none z-0 ${bg.fixed !== false && !isEmbeddedPreview ? 'attachment-fixed' : ''}`}
          style={{
            backgroundImage: `url(${bg.imageUrl})`,
            backgroundSize: bg.fit || 'cover',
            backgroundPosition: bg.position || 'center',
            backgroundRepeat: bg.repeat || 'no-repeat',
            filter: `brightness(${brightnessVal}) blur(${blurPx}px)`,
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: bg.overlayColor || '#064e3b',
              opacity: (bg.overlayOpacity ?? 35) / 100,
            }}
          />
        </div>
      )}

      {/* Content wrapper */}
      <div className="relative z-10 space-y-16 pb-24">
        {/* Top Announcement Bar */}
        {cmsConfig.announcement?.enabled && (
          <div
            className={`px-4 py-2.5 text-xs font-bold flex items-center justify-between gap-3 shadow-md ${isEmbeddedPreview ? 'relative' : 'sticky top-0'} z-40`}
            style={{
              backgroundColor: cmsConfig.announcement.bgColor || '#f59e0b',
              color: cmsConfig.announcement.textColor || '#451a03',
            }}
          >
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 shrink-0" />
                <span className="leading-snug">{cmsConfig.announcement.text}</span>
              </div>
              {cmsConfig.announcement.linkText && (
                <a
                  href={cmsConfig.announcement.linkUrl || '#'}
                  className="underline uppercase tracking-wider font-black text-[11px] shrink-0 hover:opacity-80"
                >
                  {cmsConfig.announcement.linkText}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
          <div
            className="relative rounded-3xl overflow-hidden text-white p-8 sm:p-14 shadow-2xl border border-white/20"
            style={{
              backgroundImage: cmsConfig.heroBackgroundUrl ? `url(${cmsConfig.heroBackgroundUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: theme.secondaryColor || '#064e3b',
            }}
          >
            {/* Dark Color Overlay */}
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: cmsConfig.heroOverlayColor || '#064e3b',
                opacity: (cmsConfig.heroOverlayOpacity ?? 75) / 100,
              }}
            />

            <div className="relative z-10 max-w-3xl space-y-6">
              {/* Badges & Official Seals */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="bg-emerald-800/90 border border-emerald-400/40 text-emerald-200 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase flex items-center gap-1.5 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  {cmsConfig.heroBadgeText || 'Official Government Platform • Republic of the Philippines'}
                </span>
                <span className="bg-teal-900/90 border border-teal-400/40 text-teal-200 px-3 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 shadow-sm">
                  <WifiOff className="w-3.5 h-3.5" /> 100% Offline Access Ready
                </span>
              </div>

              {/* Institutional Seals Row */}
              <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
                {(cmsConfig.officialLogos || [])
                  .filter(l => l.visible !== false && (l.showInHero || l.placement === 'hero' || l.placement === 'header_left' || !l.placement))
                  .map(logo => (
                    <div
                      key={logo.id}
                      className="bg-white/95 rounded-xl p-1.5 shadow-md flex items-center gap-2 border border-white/40 backdrop-blur-xs"
                    >
                      {logo.url && logo.url.trim() !== '' && logo.url !== '/icon.svg' ? (
                        <img
                          src={logo.url}
                          alt={logo.name || logo.label}
                          className="w-7 h-7 object-contain rounded-full drop-shadow-xs"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <OfficialSealBadge
                          type={logo.vectorComponent || 'SealDA'}
                          size={30}
                          showLabel={false}
                          customUrl={logo.url}
                        />
                      )}
                      <span className="text-[10px] font-extrabold text-stone-900 uppercase tracking-wider pr-1">
                        {logo.name || logo.label || logo.institution}
                      </span>
                    </div>
                  ))}
              </div>

              <h1
                className="text-3xl sm:text-5xl font-black tracking-tight leading-tight drop-shadow-md"
                style={{ fontFamily: theme.headingFont || 'system-ui' }}
              >
                {cmsConfig.heroTitle}
              </h1>

              <p className="text-sm sm:text-base text-emerald-100/95 leading-relaxed max-w-2xl font-normal drop-shadow-xs">
                {cmsConfig.heroSubtitle}
              </p>

              {cmsConfig.heroDescription && (
                <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed max-w-xl font-normal">
                  {cmsConfig.heroDescription}
                </p>
              )}

              {/* Action Buttons */}
              <div className="pt-3 flex flex-wrap items-center gap-3">
                <button
                  onClick={onOpenLogin}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-emerald-950 font-black text-xs sm:text-sm shadow-xl hover:shadow-2xl transition transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer border border-emerald-200"
                >
                  <LogIn className="w-4 h-4 text-emerald-950" />
                  <span>{cmsConfig.primaryButtonText || 'Sign In / Portal Login'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        {((cmsConfig.stats && cmsConfig.stats.some(s => s.visible)) || cmsConfig.statsEnabled !== false) && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6">
            {(cmsConfig.statsTitle || cmsConfig.statsSubtitle) && (
              <div className="text-center max-w-xl mx-auto mb-6">
                {cmsConfig.statsTitle && (
                  <h2
                    className="text-xl sm:text-2xl font-black tracking-tight"
                    style={{
                      fontFamily: theme.headingFont || 'system-ui',
                      color: theme.headingColor || '#064e3b',
                    }}
                  >
                    {cmsConfig.statsTitle}
                  </h2>
                )}
                {cmsConfig.statsSubtitle && (
                  <p className="text-xs text-stone-500 mt-1">{cmsConfig.statsSubtitle}</p>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {cmsConfig.stats && cmsConfig.stats.filter(s => s.visible).length > 0 ? (
                cmsConfig.stats
                  .filter(s => s.visible)
                  .map(stat => (
                    <div
                      key={stat.id}
                      className="bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-stone-200 shadow-sm text-center"
                    >
                      <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                        {stat.label}
                      </span>
                      <span
                        className="text-3xl sm:text-4xl font-black mt-1 block"
                        style={{ color: theme.headingColor || '#064e3b' }}
                      >
                        {stat.value}
                      </span>
                      {stat.description && (
                        <span className="text-[11px] text-stone-400 mt-1 block">{stat.description}</span>
                      )}
                    </div>
                  ))
              ) : (
                <>
                  <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-stone-200 shadow-sm text-center">
                    <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                      Registered Swine
                    </span>
                    <span
                      className="text-3xl sm:text-4xl font-black mt-1 block"
                      style={{ color: theme.headingColor || '#064e3b' }}
                    >
                      {totalSwine || cmsConfig.statSwineCount || '3,850+'} Heads
                    </span>
                    <span className="text-[11px] text-stone-400 mt-1 block">Actively monitored</span>
                  </div>

                  <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-amber-200 shadow-sm text-center bg-amber-50/30">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                      Incoming Ready to Sell
                    </span>
                    <span className="text-3xl sm:text-4xl font-black text-amber-900 mt-1 block">
                      {readyToSellCount || cmsConfig.statMarketReadyCount || '142'} Heads
                    </span>
                    <span className="text-[11px] text-amber-700 mt-1 block">Market harvest ready</span>
                  </div>

                  <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-stone-200 shadow-sm text-center">
                    <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                      Jurisdiction Barangays
                    </span>
                    <span
                      className="text-3xl sm:text-4xl font-black mt-1 block"
                      style={{ color: theme.headingColor || '#064e3b' }}
                    >
                      {effectiveBarangays.length || cmsConfig.statBarangayCount || '40'} Barangays
                    </span>
                    <span className="text-[11px] text-stone-400 mt-1 block">100% Hinunangan covered</span>
                  </div>

                  <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-stone-200 shadow-sm text-center">
                    <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                      Registered Raisers
                    </span>
                    <span
                      className="text-3xl sm:text-4xl font-black mt-1 block"
                      style={{ color: theme.headingColor || '#064e3b' }}
                    >
                      {uniqueFarmers || cmsConfig.statFarmerCount || '1,240+'} Farmers
                    </span>
                    <span className="text-[11px] text-stone-400 mt-1 block">RSBSA verified</span>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* About & Academic Synergy Section */}
        <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 sm:p-12 border border-stone-200 shadow-lg grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> {cmsConfig.aboutSubtitle}
              </span>
              <h2
                className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight"
                style={{ fontFamily: theme.headingFont || 'system-ui' }}
              >
                {cmsConfig.aboutTitle}
              </h2>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {cmsConfig.aboutDescription}
              </p>

              {/* Pillars & Highlight Posts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
                {((cmsConfig.aboutCards && cmsConfig.aboutCards.length > 0)
                  ? cmsConfig.aboutCards.filter(c => c.visible !== false)
                  : ((cmsConfig as any).aboutPillars || [])
                ).map((pillar: any, idx: number) => (
                  <div key={pillar.id || idx} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1 hover:border-emerald-300 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-stone-400 font-mono">0{idx + 1}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    </div>
                    <h4 className="font-bold text-xs text-stone-900">{pillar.title}</h4>
                    <p className="text-[11px] text-stone-600 leading-snug">{pillar.description || pillar.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-3xl overflow-hidden shadow-xl border border-stone-200 aspect-4/3 relative bg-stone-900">
                <img
                  src={cmsConfig.aboutImageUrl}
                  alt={cmsConfig.aboutTitle}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features & Modules Section */}
        {((cmsConfig.showFeaturesSection ?? cmsConfig.featuresVisible ?? true) !== false) && (
          <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-8">
              <h2
                className="text-2xl sm:text-3xl font-black tracking-tight"
                style={{
                  fontFamily: theme.headingFont || 'system-ui',
                  color: theme.headingColor || '#064e3b',
                }}
              >
                {cmsConfig.featuresTitle}
              </h2>
              <p className="text-xs text-stone-500 mt-1.5">{cmsConfig.featuresSubtitle}</p>
              {cmsConfig.featuresButtonVisible && cmsConfig.featuresButtonText && (
                <div className="mt-4 flex justify-center">
                  <a
                    href={cmsConfig.featuresButtonLink || '#features'}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition hover:shadow-md"
                  >
                    <span>{cmsConfig.featuresButtonText}</span>
                  </a>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {((cmsConfig.featureCards && cmsConfig.featureCards.length > 0)
                ? cmsConfig.featureCards.filter(f => f.visible !== false)
                : ((cmsConfig as any).features || [])
              ).map((feature: any) => (
                <div
                  key={feature.id}
                  className="bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3 flex flex-col justify-between group hover:border-emerald-300 hover:shadow-md transition"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-5 h-5 text-emerald-700" />
                    </div>
                    <h3 className="font-black text-sm text-stone-900 group-hover:text-emerald-800 transition">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed">{feature.description}</p>
                  </div>

                  {feature.buttonText && (
                    <div className="pt-2">
                      <a
                        href={feature.buttonLink || '#'}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition"
                      >
                        <span>{feature.buttonText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Additional Custom Created Features Sections */}
            {(cmsConfig.featuresSections || [])
              .filter(sec => sec.visible !== false)
              .map(sec => (
                <div key={sec.id} className="mt-12 pt-10 border-t border-stone-200/70">
                  <div className="text-center max-w-xl mx-auto mb-8">
                    <h3
                      className="text-xl sm:text-2xl font-black tracking-tight"
                      style={{
                        fontFamily: theme.headingFont || 'system-ui',
                        color: theme.headingColor || '#064e3b',
                      }}
                    >
                      {sec.title}
                    </h3>
                    {sec.subtitle && <p className="text-xs text-stone-500 mt-1">{sec.subtitle}</p>}
                    {sec.description && <p className="text-xs text-stone-600 mt-2">{sec.description}</p>}
                  </div>
                  {sec.cards && sec.cards.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sec.cards.filter(c => c.visible !== false).map(card => (
                        <div
                          key={card.id}
                          className="bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3 flex flex-col justify-between group hover:border-emerald-300 hover:shadow-md transition"
                        >
                          <div className="space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold">
                              <ShieldCheck className="w-5 h-5 text-emerald-700" />
                            </div>
                            <h4 className="font-black text-sm text-stone-900 group-hover:text-emerald-800 transition">
                              {card.title}
                            </h4>
                            <p className="text-xs text-stone-600 leading-relaxed">{card.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </section>
        )}

        {/* Gallery Section */}
        {(cmsConfig.galleryPhotos || []).some(p => p.showOnLanding) && (
          <section id="gallery" className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-8">
              <h2
                className="text-2xl sm:text-3xl font-black tracking-tight"
                style={{
                  fontFamily: theme.headingFont || 'system-ui',
                  color: theme.headingColor || '#064e3b',
                }}
              >
                {cmsConfig.galleryTitle}
              </h2>
              <p className="text-xs text-stone-500 mt-1.5">{cmsConfig.gallerySubtitle}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(cmsConfig.galleryPhotos || [])
                .filter(p => p.showOnLanding)
                .map(photo => (
                  <div
                    key={photo.id}
                    className="bg-white/95 backdrop-blur-md rounded-2xl overflow-hidden border border-stone-200 shadow-sm group"
                  >
                    <div className="aspect-4/3 overflow-hidden bg-stone-900 relative">
                      <img
                        src={photo.imageUrl}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/75 text-white text-[10px] font-bold">
                        {photo.category}
                      </span>
                    </div>
                    <div className="p-4 space-y-1">
                      <h4 className="font-bold text-xs text-stone-900">{photo.title}</h4>
                      <p className="text-[11px] text-stone-500 leading-snug">{photo.caption}</p>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Education & Extension Videos */}
        {(cmsConfig.videos || []).some(v => v.visible !== false) && (
          <section id="videos" className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-[11px] font-bold mb-2">
                <Video className="w-3.5 h-3.5" />
                <span>Education & Extension Video Series</span>
              </div>
              <h2
                className="text-2xl sm:text-3xl font-black tracking-tight"
                style={{
                  fontFamily: theme.headingFont || 'system-ui',
                  color: theme.headingColor || '#064e3b',
                }}
              >
                {cmsConfig.videoTitle || cmsConfig.videosTitle || 'Education & Extension Video Guides'}
              </h2>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                {cmsConfig.videoSubtitle || cmsConfig.videosSubtitle || 'Step-by-step video demonstrations on African Swine Fever prevention, biosecurity protocols, and high-yield backyard raising.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(cmsConfig.videos || [])
                .filter(v => v.visible !== false)
                .map(video => (
                  <div
                    key={video.id}
                    className="bg-white/95 backdrop-blur-md rounded-2xl overflow-hidden border border-stone-200 shadow-sm flex flex-col justify-between group hover:shadow-md transition duration-300"
                  >
                    <div>
                      {/* Video Thumbnail with YouTube Play Button */}
                      <div
                        onClick={() => setSelectedVideo(video)}
                        className="aspect-16/9 bg-stone-900 relative overflow-hidden cursor-pointer"
                      >
                        <img
                          src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=600&q=80'}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90 group-hover:opacity-100"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/10 transition">
                          <div className="w-12 h-12 rounded-full bg-[#FF0000] text-white flex items-center justify-center shadow-lg transform group-hover:scale-115 transition duration-300">
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          </div>
                        </div>
                        {video.duration && (
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-white text-[10px] font-mono font-bold backdrop-blur-xs">
                            {video.duration}
                          </span>
                        )}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-stone-900/80 text-white text-[10px] font-bold backdrop-blur-xs">
                          {video.category || 'Livestock Extension'}
                        </span>
                      </div>

                      <div className="p-4 space-y-2">
                        <h4 className="font-bold text-sm text-stone-900 leading-snug group-hover:text-emerald-800 transition">
                          {video.title}
                        </h4>
                        {video.description && (
                          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                            {video.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-stone-100 mt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedVideo(video)}
                        className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-emerald-800" /> Watch Video
                      </button>
                      <a
                        href={video.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-[#FF0000] hover:bg-[#cc0000] text-white font-bold text-[11px] flex items-center gap-1.5 shadow-2xs transition"
                      >
                        <span>YouTube</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Official Updates & Social Media Feed */}
        {(cmsConfig.socialPosts || []).some(p => p.visible) && (
          <section id="social" className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-8">
              <h2
                className="text-2xl sm:text-3xl font-black tracking-tight"
                style={{
                  fontFamily: theme.headingFont || 'system-ui',
                  color: theme.headingColor || '#064e3b',
                }}
              >
                {cmsConfig.socialTitle || 'Official Updates & Social Media Feed'}
              </h2>
              <p className="text-xs text-stone-500 mt-1.5">
                {cmsConfig.socialSubtitle || 'Stay informed with the latest agricultural advisories, price bulletins, and veterinary schedules.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(cmsConfig.socialPosts || [])
                .filter(p => p.visible)
                .map(post => {
                  const isYouTube =
                    post.buttonColor === 'red' ||
                    post.buttonPlatform === 'youtube' ||
                    (post.buttonText || '').toLowerCase().includes('youtube') ||
                    post.postUrl.toLowerCase().includes('youtube') ||
                    post.postUrl.toLowerCase().includes('youtu.be');

                  const isFacebook =
                    !isYouTube &&
                    (post.buttonColor === 'blue' ||
                      post.buttonPlatform === 'facebook' ||
                      (post.buttonText || '').toLowerCase().includes('facebook') ||
                      post.postUrl.toLowerCase().includes('facebook'));

                  const btnBg = isYouTube
                    ? 'bg-[#FF0000] hover:bg-[#cc0000] text-white shadow-red-900/10'
                    : isFacebook
                    ? 'bg-[#1877F2] hover:bg-[#166fe5] text-white shadow-blue-900/10'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-900/10';

                  return (
                    <div
                      key={post.id}
                      className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-stone-400">
                          <span className="font-bold text-emerald-800 flex items-center gap-1">
                            <Share2 className="w-3.5 h-3.5" /> {post.author}
                          </span>
                          <span>{post.date}</span>
                        </div>
                        <h4 className="font-bold text-sm text-stone-900 leading-snug">{post.title}</h4>
                        <p className="text-xs text-stone-600 leading-relaxed">{post.content}</p>
                      </div>

                      <div className="pt-3 border-t border-stone-100 mt-4 flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] font-medium text-stone-400 truncate">
                          {post.noticeLabel || 'Official Municipal Notice'}
                        </span>
                        <a
                          href={post.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs transition transform hover:-translate-y-0.5 shrink-0 ${btnBg}`}
                        >
                          <span>
                            {post.buttonText ||
                              (isYouTube
                                ? 'Watch on YouTube'
                                : isFacebook
                                ? 'View on Facebook'
                                : 'Official Link')}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {/* Contact & Hotlines Section */}
        <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-emerald-950 text-white rounded-3xl p-8 sm:p-12 border border-emerald-800 shadow-xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Phone className="w-4 h-4" /> Official Municipal Agriculture Contact
              </span>
              <h3 className="text-2xl sm:text-3xl font-black">{cmsConfig.officeName}</h3>
              <p className="text-xs text-emerald-100/80 leading-relaxed">{cmsConfig.address}</p>
              <div className="space-y-2 pt-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-200">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>{cmsConfig.officeHours}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-200">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span>{cmsConfig.contactEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-200">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Office: {cmsConfig.contactPhone}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 space-y-4 text-center">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">
                24/7 Rapid Response ASF Emergency Hotline
              </span>
              <a
                href={`tel:${cmsConfig.hotlineEmergency}`}
                className="text-2xl sm:text-3xl font-black text-amber-300 block hover:underline"
              >
                {cmsConfig.hotlineEmergency}
              </a>
              <p className="text-[11px] text-emerald-100/70 leading-relaxed">
                Call immediately to report symptoms, unusual pig illness, or request urgent veterinary inspection across any Hinunangan barangay.
              </p>
              <div className="pt-2 flex justify-center">
                <PWAInstallButton />
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 border-t border-stone-300/60 text-xs text-stone-600">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-2">
              {/* Footer Logos (Footer Only - Managed from Footer Logo Management) */}
              <div className="flex flex-wrap items-center gap-3">
                {((cmsConfig.footerLogos && cmsConfig.footerLogos.length > 0)
                  ? cmsConfig.footerLogos.filter(l => l.visible !== false)
                  : [
                      {
                        id: 'flogo-default',
                        url: cmsConfig.footerLogoUrl || cmsConfig.systemLogoUrl || cmsConfig.websiteLogoUrl || '/icon.svg',
                        name: cmsConfig.websiteTitle || 'Municipal Swine Registry',
                      },
                    ]
                ).map(logo => (
                  <div key={logo.id} className="flex items-center gap-2">
                    <img
                      src={logo.url || '/icon.svg'}
                      alt={logo.name || 'Footer Logo'}
                      className="w-8 h-8 object-contain rounded-md bg-white p-0.5 border border-stone-200 shadow-2xs"
                      referrerPolicy="no-referrer"
                    />
                    {logo.name && (
                      <span className="font-bold text-stone-900 text-sm">{logo.name}</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[11px] leading-relaxed max-w-md text-stone-500">
                {cmsConfig.footerDescription}
              </p>
            </div>

            {/* Dynamic Footer Columns */}
            {(cmsConfig.footerColumns || []).map(col => (
              <div key={col.id} className="space-y-2">
                <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">{col.title}</h4>
                <ul className="space-y-1.5 text-[11px]">
                  {col.links.map(link => (
                    <li key={link.id}>
                      <a href={link.url} className="text-stone-500 hover:text-emerald-700 transition">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-400">
            <span>{cmsConfig.footerCopyright}</span>
            <span className="font-semibold text-emerald-800">
              Department of Agriculture • Municipality of Hinunangan • SLSU Extension
            </span>
          </div>
        </footer>
      </div>

      {/* Video Modal Player */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 text-white rounded-2xl overflow-hidden max-w-3xl w-full border border-stone-700 shadow-2xl space-y-3">
            <div className="p-4 flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                <h3 className="font-bold text-sm truncate max-w-lg">{selectedVideo.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVideo(null)}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-16/9 bg-black w-full">
              {selectedVideo.videoUrl && (selectedVideo.videoUrl.includes('youtube.com') || selectedVideo.videoUrl.includes('youtu.be')) ? (
                <iframe
                  src={getYouTubeEmbedUrl(selectedVideo.videoUrl)}
                  title={selectedVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={selectedVideo.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                />
              )}
            </div>

            <div className="p-4 pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-400">
              <p className="line-clamp-2 max-w-xl text-[11px] leading-relaxed text-stone-300">
                {selectedVideo.description}
              </p>
              <a
                href={selectedVideo.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-[#FF0000] hover:bg-[#cc0000] text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-xs transition"
              >
                <span>Open in YouTube</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
