import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  MapPin,
  Database,
  Printer,
  Users,
  Truck,
  Shield,
  BookOpen,
  MessageSquare,
  LogOut,
  Plus,
  X,
  Palette,
  FileEdit,
  User,
  Globe,
  Camera,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { SidebarTheme, UserAccount, UserRole } from '../../types';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { SealMunicipality, useOfficialLogos } from './OfficialSeals';
import { storageService } from '../../services/storageService';
import { useLanguage } from '../../context/LanguageContext';

interface SidebarProps {
  currentUser: UserAccount | null;
  currentRole: UserRole | 'landing';
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onSelectRole: (role: UserRole | 'landing', specificUser?: UserAccount) => void;
  unreadCount: number;
  readyTakeoffCount?: number;
  onLogout: () => void;
  onClose: () => void;
  onOpenLogin: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  currentRole,
  activeTab,
  onSelectTab,
  onSelectRole,
  unreadCount,
  readyTakeoffCount = 0,
  onLogout,
  onClose,
  onOpenLogin,
}) => {
  const { isOnline, isSimulatedOffline } = useOfflineStatus();
  const { language, setLanguage, t } = useLanguage();

  const [theme, setTheme] = useState<SidebarTheme>(() => storageService.getSidebarTheme());
  const officialLogos = useOfficialLogos();

  // Resolve single primary logo: theme custom logo > official logos > fallback seal
  const singleLogoUrl =
    theme.logoUrl ||
    officialLogos['logo-sidebar'] ||
    officialLogos['logo-system'] ||
    officialLogos['logo-municipal'] ||
    officialLogos['logo-da'];

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<SidebarTheme>;
      if (customEvent.detail) {
        setTheme(customEvent.detail);
      } else {
        setTheme(storageService.getSidebarTheme());
      }
    };

    window.addEventListener('da_sidebar_theme_change', handleThemeChange);
    return () => {
      window.removeEventListener('da_sidebar_theme_change', handleThemeChange);
    };
  }, []);

  const handleLanguageChange = (lang: 'en' | 'ceb' | 'fil') => {
    setLanguage(lang);
  };

  const isAgent = currentRole === 'agent';
  const isAdmin = currentRole === 'admin';

  return (
    <div
      className="w-full h-full text-white flex flex-col justify-between overflow-y-auto overflow-x-hidden select-none custom-sidebar-scroll transition-colors duration-200"
      style={{
        backgroundColor: theme.backgroundColor || '#070e20',
      }}
    >
      {/* Top Container */}
      <div className="p-4 pt-4 space-y-3.5 flex-1">
        {/* Header: Official Logo & Municipal Registry Brand */}
        <div className="flex items-center justify-between gap-3 pb-1 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative group shrink-0">
              {singleLogoUrl ? (
                <img
                  src={singleLogoUrl}
                  alt="Hinunangan Swine Registry Logo"
                  className={`w-10 h-10 object-contain border shadow-sm transition ${
                    theme.logoShape === 'square'
                      ? 'rounded-lg'
                      : theme.logoShape === 'rounded'
                      ? 'rounded-2xl'
                      : 'rounded-full'
                  }`}
                  style={{
                    borderColor: theme.sectionDividerColor || '#1e3a8a',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  }}
                />
              ) : (
                <div className="w-10 h-10 flex items-center justify-center">
                  <SealMunicipality className="w-10 h-10 shadow-sm" />
                </div>
              )}
              {isAdmin && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTab('sidebar_color');
                  }}
                  title="Change Sidebar Logo in Sidebar Configuration"
                  className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-md border border-white/40 transition opacity-0 group-hover:opacity-100 cursor-pointer scale-90 hover:scale-100"
                >
                  <Camera className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2
                className="font-extrabold text-[13.5px] leading-tight tracking-tight truncate"
                style={{ color: theme.activeTextColor || '#ffffff' }}
              >
                Hinunangan Swine Registry
              </h2>
              <p
                className="text-[11px] font-medium leading-tight mt-0.5 opacity-80 truncate"
                style={{ color: theme.menuTextColor || '#cbd5e1' }}
              >
                {t('header_location')} • DA-MAO
              </p>
            </div>
          </div>

          {/* Mobile Close Button (Only visible in mobile slide-out drawer) */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg opacity-80 hover:opacity-100 hover:bg-white/10 transition cursor-pointer text-slate-300 shrink-0"
            title={t('nav_close_sidebar')}
            aria-label="Close sidebar drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Profile Card */}
        <div
          onClick={() => {
            if (!currentUser) onOpenLogin();
            else if (isAgent) onSelectTab('account');
          }}
          className="border rounded-2xl p-3 flex items-center gap-3 shadow-inner transition cursor-pointer hover:brightness-110 active:scale-[0.99]"
          style={{
            backgroundColor: theme.hoverColor || '#111a36',
            borderColor: theme.sectionDividerColor || '#1e3a8a',
          }}
          title={currentUser ? currentUser.name : 'Click to Login'}
        >
          <div
            className="w-9 h-9 rounded-xl font-bold flex items-center justify-center text-sm shrink-0 shadow-md"
            style={{
              backgroundColor: isAgent ? '#d97706' : theme.activeMenuColor || '#2563eb',
              color: theme.activeTextColor || '#ffffff',
            }}
          >
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'E'}
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="font-bold text-xs leading-snug truncate"
              style={{ color: theme.activeTextColor || '#ffffff' }}
            >
              {currentUser?.name || (isAgent ? t('role_agent') : 'Engr. Arnaldo M. Valdez')}
            </div>
            <div
              className="text-[11px] leading-snug truncate mt-0.5 opacity-85"
              style={{ color: theme.menuTextColor || '#cbd5e1' }}
            >
              {currentUser
                ? currentUser.role === 'admin'
                  ? t('role_admin_full')
                  : currentUser.role === 'focal'
                  ? `${t('role_focal')} - Brgy. ${currentUser.assignedBarangay || 'Field'}`
                  : t('role_agent_full')
                : t('role_admin_full')}
            </div>
          </div>
        </div>

        {/* AGENT-SPECIFIC MINIMAL NAVIGATION */}
        {isAgent ? (
          <div className="space-y-1.5 pt-1">
            <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-400/80 flex items-center justify-between">
              <span>{t('nav_trader_portal')}</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">AGENT</span>
            </div>

            {/* 1. Ready-to-Sell Swine */}
            <button
              type="button"
              onClick={() => onSelectTab('ready_to_sell')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition cursor-pointer ${
                activeTab === 'ready_to_sell' || activeTab === 'dashboard'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Truck className="w-4 h-4 shrink-0 text-amber-300" />
                <span className="truncate">{t('nav_ready_to_sell')}</span>
              </div>
              {readyTakeoffCount > 0 && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500 text-amber-950 font-black text-[10px]">
                  {readyTakeoffCount}
                </span>
              )}
            </button>

            {/* 2. Messages */}
            <button
              type="button"
              onClick={() => onSelectTab('messages')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition cursor-pointer ${
                activeTab === 'messages'
                  ? 'bg-[#2563eb] text-white shadow-md'
                  : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <MessageSquare className="w-4 h-4 shrink-0 text-blue-300" />
                <span className="truncate">{t('nav_messages')}</span>
              </div>
              {unreadCount > 0 && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-red-600 text-white font-bold text-[10px]">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* 3. My Account */}
            <button
              type="button"
              onClick={() => onSelectTab('account')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer ${
                activeTab === 'account'
                  ? 'bg-[#2563eb] text-white shadow-md'
                  : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              <User className="w-4 h-4 shrink-0 text-emerald-300" />
              <span className="truncate">{t('nav_my_account')}</span>
            </button>
          </div>
        ) : (
          /* ADMIN & FOCAL PERSON NAVIGATION */
          <>
            {/* Prominent Action Button for Registration */}
            <button
              type="button"
              onClick={() => onSelectTab('add_swine')}
              className="w-full py-2.5 px-3.5 rounded-xl border text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-xs hover:brightness-110 active:scale-[0.99]"
              style={{
                backgroundColor: theme.hoverColor || '#0d1733',
                borderColor: theme.sectionDividerColor || '#1e3a8a',
              }}
            >
              <Plus className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{t('nav_add_swine')}</span>
            </button>

            {/* Navigation Menu List */}
            <div className="space-y-1 pt-0.5">
              {/* 1. Dashboard */}
              <button
                type="button"
                onClick={() => onSelectTab('dashboard')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                style={{
                  backgroundColor: activeTab === 'dashboard' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                  color: activeTab === 'dashboard' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                }}
              >
                <LayoutGrid
                  className="w-4 h-4 shrink-0"
                  style={{
                    color: activeTab === 'dashboard' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                  }}
                />
                <span className="truncate">{t('nav_dashboard')}</span>
              </button>

              {/* 2. GIS Swine Map */}
              <button
                type="button"
                onClick={() => onSelectTab('gis')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                style={{
                  backgroundColor: activeTab === 'gis' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                  color: activeTab === 'gis' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                }}
              >
                <MapPin
                  className="w-4 h-4 shrink-0"
                  style={{
                    color: activeTab === 'gis' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                  }}
                />
                <span className="truncate">{t('nav_gis_map')}</span>
              </button>

              {/* 3. Swine Records */}
              <button
                type="button"
                onClick={() => onSelectTab('records')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                style={{
                  backgroundColor: activeTab === 'records' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                  color: activeTab === 'records' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                }}
              >
                <Database
                  className="w-4 h-4 shrink-0"
                  style={{
                    color: activeTab === 'records' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                  }}
                />
                <span className="truncate">{t('nav_records')}</span>
              </button>

              {/* 4. Print Official Reports */}
              <button
                type="button"
                onClick={() => onSelectTab('certificate')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                style={{
                  backgroundColor: activeTab === 'certificate' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                  color: activeTab === 'certificate' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                }}
              >
                <Printer
                  className="w-4 h-4 shrink-0"
                  style={{
                    color: activeTab === 'certificate' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                  }}
                />
                <span className="truncate">{t('nav_reports')}</span>
              </button>

              {/* 5. Ready for Take-Off */}
              <button
                type="button"
                onClick={() => onSelectTab('takeoff')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition cursor-pointer hover:bg-white/10"
                style={{
                  backgroundColor: activeTab === 'takeoff' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                  color: activeTab === 'takeoff' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                }}
              >
                <div className="flex items-center gap-3 truncate">
                  <Truck
                    className="w-4 h-4 shrink-0"
                    style={{
                      color: activeTab === 'takeoff' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                    }}
                  />
                  <span className="truncate">{t('nav_takeoff')}</span>
                </div>
                {readyTakeoffCount > 0 && (
                  <span
                    className="ml-auto px-2 py-0.5 rounded-full text-white font-bold text-[10px]"
                    style={{ backgroundColor: theme.badgeColor || '#2563eb' }}
                  >
                    {readyTakeoffCount}
                  </span>
                )}
              </button>

              {/* 6. Barangay Biosecurity */}
              <button
                type="button"
                onClick={() => onSelectTab('biosecurity')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                style={{
                  backgroundColor: activeTab === 'biosecurity' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                  color: activeTab === 'biosecurity' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                }}
              >
                <Shield
                  className="w-4 h-4 shrink-0"
                  style={{
                    color: activeTab === 'biosecurity' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                  }}
                />
                <span className="truncate">{t('nav_biosecurity')}</span>
              </button>

              {/* 7. ASF Legal Decrees (Hidden for Focal Accounts) */}
              {currentUser?.role !== 'focal' && (
                <button
                  type="button"
                  onClick={() => onSelectTab('asf_ordinance')}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                  style={{
                    backgroundColor: activeTab === 'asf_ordinance' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                    color: activeTab === 'asf_ordinance' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                  }}
                >
                  <BookOpen
                    className="w-4 h-4 shrink-0"
                    style={{
                      color: activeTab === 'asf_ordinance' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                    }}
                  />
                  <span className="truncate">{t('nav_asf_decrees')}</span>
                </button>
              )}

              {/* 8. Messages */}
              <button
                type="button"
                onClick={() => onSelectTab('messages')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition cursor-pointer hover:bg-white/10"
                style={{
                  backgroundColor: activeTab === 'messages' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                  color: activeTab === 'messages' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                }}
              >
                <div className="flex items-center gap-3 truncate">
                  <MessageSquare
                    className="w-4 h-4 shrink-0"
                    style={{
                      color: activeTab === 'messages' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                    }}
                  />
                  <span className="truncate">{t('nav_messages')}</span>
                </div>
                {unreadCount > 0 && (
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-red-600 text-white font-bold text-[10px]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* 9. Manage Barangay (Admin only) */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onSelectTab('barangays')}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                  style={{
                    backgroundColor: activeTab === 'barangays' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                    color: activeTab === 'barangays' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                  }}
                >
                  <MapPin
                    className="w-4 h-4 shrink-0"
                    style={{
                      color: activeTab === 'barangays' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                    }}
                  />
                  <span className="truncate">{t('nav_barangays')}</span>
                </button>
              )}

              {/* 10. My Account (For Focal Person & Admin) */}
              <button
                type="button"
                onClick={() => onSelectTab('account')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                style={{
                  backgroundColor: activeTab === 'account' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                  color: activeTab === 'account' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                }}
              >
                <User
                  className="w-4 h-4 shrink-0"
                  style={{
                    color: activeTab === 'account' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                  }}
                />
                <span className="truncate">{t('nav_my_account')}</span>
              </button>

              {/* ───────────────────── ADMIN SETTINGS & CUSTOMIZATION ───────────────────── */}
              {isAdmin && (
                <div
                  className="pt-2.5 mt-2.5 border-t space-y-1"
                  style={{ borderColor: theme.sectionDividerColor || '#1e3a8a' }}
                >
                  <div
                    className="px-3 py-1 text-[10px] font-black uppercase tracking-wider flex items-center justify-between opacity-80"
                    style={{ color: theme.menuTextColor || '#cbd5e1' }}
                  >
                    <span>{t('nav_system_admin')}</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                      ADMIN
                    </span>
                  </div>

                  {/* Landing Page Settings */}
                  <button
                    type="button"
                    onClick={() => onSelectTab('landing_manager')}
                    title={t('nav_landing_settings')}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                    style={{
                      backgroundColor:
                        activeTab === 'landing_manager' || activeTab === 'landing_settings'
                          ? theme.activeMenuColor || '#2563eb'
                          : 'transparent',
                      color:
                        activeTab === 'landing_manager' || activeTab === 'landing_settings'
                          ? theme.activeTextColor || '#ffffff'
                          : theme.menuTextColor || '#cbd5e1',
                    }}
                  >
                    <Globe
                      className="w-4 h-4 shrink-0"
                      style={{
                        color:
                          activeTab === 'landing_manager' || activeTab === 'landing_settings'
                            ? theme.activeTextColor || '#ffffff'
                            : theme.iconColor || '#93c5fd',
                      }}
                    />
                    <span className="flex-1 min-w-0 truncate">{t('nav_landing_settings')}</span>
                  </button>

                  {/* Registry Form Customization (Admin-Only) */}
                  <button
                    type="button"
                    onClick={() => onSelectTab('form_customizer')}
                    title={t('nav_form_customizer')}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                    style={{
                      backgroundColor: activeTab === 'form_customizer' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                      color: activeTab === 'form_customizer' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                    }}
                  >
                    <FileEdit
                      className="w-4 h-4 shrink-0"
                      style={{
                        color: activeTab === 'form_customizer' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                      }}
                    />
                    <span className="flex-1 min-w-0 truncate">{t('nav_form_customizer')}</span>
                  </button>

                  {/* Sidebar Configuration (Colors & Logo) */}
                  <button
                    type="button"
                    onClick={() => onSelectTab('sidebar_color')}
                    title={t('nav_sidebar_config')}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                    style={{
                      backgroundColor: activeTab === 'sidebar_color' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                      color: activeTab === 'sidebar_color' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                    }}
                  >
                    <Palette
                      className="w-4 h-4 shrink-0"
                      style={{
                        color: activeTab === 'sidebar_color' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                      }}
                    />
                    <span className="flex-1 min-w-0 truncate">{t('nav_sidebar_config')}</span>
                  </button>

                  {/* LFT Accounts & Settings */}
                  <button
                    type="button"
                    onClick={() => onSelectTab('accounts')}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                    style={{
                      backgroundColor: activeTab === 'accounts' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                      color: activeTab === 'accounts' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                    }}
                  >
                    <Users
                      className="w-4 h-4 shrink-0"
                      style={{
                        color: activeTab === 'accounts' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                      }}
                    />
                    <span className="truncate">{t('nav_accounts')}</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom Footer Area */}
      <div
        className="p-4 pt-3 pb-4 border-t space-y-3 shrink-0"
        style={{
          backgroundColor: theme.backgroundColor || '#070e20',
          borderColor: theme.sectionDividerColor || '#1e3a8a',
        }}
      >
        {/* 3-Way Language Selector */}
        <div className="space-y-1.5">
          <div
            className="flex items-center justify-between text-xs px-0.5 opacity-80"
            style={{ color: theme.menuTextColor || '#cbd5e1' }}
          >
            <span className="font-semibold">{t('common_language')}</span>
            <span className="text-[11px] font-bold text-emerald-400">
              {language === 'en' ? 'English' : language === 'ceb' ? 'Bisaya' : 'Tagalog'}
            </span>
          </div>
          <div
            className="p-1 rounded-xl flex items-center gap-1 border"
            style={{
              backgroundColor: theme.hoverColor || '#0d1733',
              borderColor: theme.sectionDividerColor || '#1e3a8a',
            }}
          >
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`flex-1 py-1 px-1 rounded-lg text-xs font-bold transition cursor-pointer text-center whitespace-nowrap ${
                language === 'en'
                  ? 'text-white shadow-xs'
                  : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: language === 'en' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                color: language === 'en' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
              }}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('ceb')}
              className={`flex-1 py-1 px-1 rounded-lg text-xs font-bold transition cursor-pointer text-center whitespace-nowrap ${
                language === 'ceb'
                  ? 'text-white shadow-xs'
                  : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: language === 'ceb' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                color: language === 'ceb' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
              }}
            >
              CEB
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('fil')}
              className={`flex-1 py-1 px-1 rounded-lg text-xs font-bold transition cursor-pointer text-center whitespace-nowrap ${
                language === 'fil'
                  ? 'text-white shadow-xs'
                  : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: language === 'fil' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                color: language === 'fil' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
              }}
            >
              FIL
            </button>
          </div>
        </div>

        {/* Online / Synced Status */}
        <div className="flex items-center justify-between text-xs px-1 pt-0.5">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isOnline && !isSimulatedOffline
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse'
                  : 'bg-amber-400'
              }`}
            />
            <span
              className="font-semibold text-xs opacity-90 truncate"
              style={{ color: theme.activeTextColor || '#ffffff' }}
            >
              {isOnline && !isSimulatedOffline ? t('common_online') : t('common_offline')}
            </span>
          </div>
          <span
            className="font-medium text-[11px] opacity-75 shrink-0"
            style={{ color: theme.iconColor || '#93c5fd' }}
          >
            {t('common_synced')}
          </span>
        </div>

        {/* Sign Out Action */}
        <div className="pt-0.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full flex items-center gap-2 text-xs font-bold py-2 px-3 rounded-xl transition cursor-pointer hover:bg-white/10 active:scale-[0.99]"
            style={{ color: theme.menuTextColor || '#cbd5e1' }}
          >
            <LogOut className="w-4 h-4 shrink-0 text-red-400" />
            <span className="truncate">{t('nav_sign_out')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
