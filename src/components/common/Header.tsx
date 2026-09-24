import React, { useState } from 'react';
import {
  ShieldAlert,
  Wifi,
  WifiOff,
  User,
  LogOut,
  Bell,
  Home,
  LayoutDashboard,
  Layers,
  FileSpreadsheet,
  FileText,
  MapPin,
  MessageSquare,
  Sparkles,
  ChevronDown,
  Database,
  Sliders,
  LogIn,
  Lock,
  Menu,
  X,
  Truck,
  Shield,
  TrendingUp,
  Settings,
  CheckCircle2,
  Languages,
  ChevronRight,
} from 'lucide-react';
import { UserAccount, UserRole } from '../../types';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { PWAInstallButton } from './PWAInstallButton';
import { SyncCenterModal } from './SyncCenterModal';
import { storageService } from '../../services/storageService';
import { useOfficialLogos } from './OfficialSeals';
import { useLanguage } from '../../context/LanguageContext';

interface HeaderProps {
  currentUser: UserAccount | null;
  currentRole: UserRole | 'landing';
  onSelectRole: (role: UserRole | 'landing', specificUser?: UserAccount) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  unreadCount: number;
  onOpenMessages: () => void;
  onLogout: () => void;
  onOpenBackupModal: () => void;
  onOpenLogin: () => void;
  readyTakeoffCount?: number;
  activeAlertsCount?: number;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentRole,
  onSelectRole,
  activeTab,
  onSelectTab,
  unreadCount,
  onOpenMessages,
  onLogout,
  onOpenBackupModal,
  onOpenLogin,
  readyTakeoffCount = 0,
  activeAlertsCount = 0,
  isSidebarOpen = false,
  onToggleSidebar,
}) => {
  const { isOnline, isSimulatedOffline, pendingQueueCount, toggleSimulateOffline } = useOfflineStatus();
  const { language, setLanguage, t } = useLanguage();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [isLandingNavOpen, setIsLandingNavOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const logos = useOfficialLogos();
  const activeHeaderLogo = logos['logo-header'] || logos['logo-system'] || logos['logo-da'] || logos['logo-website'] || '/icon.svg';

  const landingNavItems = [
    { id: 'programs', label: 'Programs & Services', href: '#programs' },
    { id: 'about', label: 'About Office', href: '#about' },
    { id: 'barangays', label: '40 Barangays', href: '#barangays' },
    { id: 'ordinances', label: 'Ordinances', fullLabel: 'Legal Decrees & Ordinances', href: '#ordinances' },
    { id: 'biosecurity-map', label: 'Biosecurity GIS', href: '#biosecurity-map' },
    { id: 'contact', label: 'Contact & Support', href: '#contact' },
  ];

  const scrollToLandingSection = (href: string) => {
    setIsLandingNavOpen(false);
    const targetId = href.replace('#', '');
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getRoleBadge = () => {
    if (currentRole === 'admin') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-700" /> {t('role_admin')}
        </span>
      );
    }
    if (currentRole === 'focal') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs">
          <MapPin className="w-3.5 h-3.5 text-blue-700" /> {t('role_focal')} ({currentUser?.assignedBarangay || 'Barangay'})
        </span>
      );
    }
    if (currentRole === 'agent') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" /> {t('role_agent')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
        {t('role_public')}
      </span>
    );
  };

  const handleTabClick = (tab: string) => {
    onSelectTab(tab);
    setIsAdminDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      {/* Top micro bar */}
      <div className="bg-stone-950 text-stone-300 px-4 py-1 text-xs flex justify-between items-center border-b border-stone-800">
        <div className="flex items-center gap-2">
          <span className="font-bold text-emerald-400">{t('header_rfo')}</span>
          <span className="text-stone-600">•</span>
          <span className="hidden sm:inline">{t('header_mao')}</span>
          <span className="text-stone-600 hidden sm:inline">•</span>
          <span>{t('header_location')}</span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick Language Switcher */}
          <div className="flex items-center bg-stone-900 rounded-lg p-0.5 border border-stone-800 text-[10px]">
            <Languages className="w-3 h-3 text-stone-400 ml-1 mr-0.5" />
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition ${
                language === 'en'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="English"
            >
              EN
            </button>
            <span className="text-stone-600 px-0.5">•</span>
            <button
              type="button"
              onClick={() => setLanguage('ceb')}
              className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition ${
                language === 'ceb'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Cebuano / Bisaya"
            >
              CEB
            </button>
            <span className="text-stone-600 px-0.5">•</span>
            <button
              type="button"
              onClick={() => setLanguage('fil')}
              className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition ${
                language === 'fil'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Filipino / Tagalog"
            >
              FIL
            </button>
          </div>

          {/* Simulate Offline Button & Sync Center */}
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className={`cursor-pointer px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1 transition ${
              !isOnline
                ? 'bg-amber-600 text-white hover:bg-amber-500'
                : pendingQueueCount > 0
                ? 'bg-emerald-800 text-emerald-200 border border-emerald-600 hover:bg-emerald-700'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
            title="Open Offline Synchronization Center"
          >
            {!isOnline ? (
              <WifiOff className="w-3 h-3 text-white" />
            ) : (
              <Wifi className="w-3 h-3 text-emerald-400" />
            )}
            <span className="hidden sm:inline">
              {!isOnline
                ? isSimulatedOffline
                  ? t('header_sim_offline')
                  : 'Offline'
                : pendingQueueCount > 0
                ? `${pendingQueueCount} Pending`
                : t('header_sync_active')}
            </span>
          </button>

          {/* Backup / Export */}
          <button
            onClick={onOpenBackupModal}
            className="cursor-pointer text-stone-400 hover:text-stone-200 flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded hover:bg-stone-800 transition"
            title="Database Backup / Restore"
          >
            <Database className="w-3 h-3" />
            <span className="hidden sm:inline">{t('header_backup')}</span>
          </button>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onSelectRole('landing')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <img
              src={activeHeaderLogo}
              alt="DA Hinunangan Logo"
              className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-xl shadow-xs group-hover:scale-105 transition transform"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-emerald-950 leading-none">
                  {t('header_da_title')}
                </h1>
                <div className="hidden md:block">{getRoleBadge()}</div>
              </div>
              <p className="text-[10px] sm:text-[11px] text-stone-500 font-semibold tracking-wide">
                {t('header_da_sub')}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Landing Page Navigation Links */}
        {currentRole === 'landing' && (
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {landingNavItems.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToLandingSection(item.href)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-stone-700 hover:text-emerald-800 hover:bg-emerald-50/80 transition cursor-pointer whitespace-nowrap"
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}

        {/* Right Actions & User Account */}
        <div className="flex items-center gap-2 sm:gap-3">
          <PWAInstallButton compact />

          {/* Messages Alert */}
          {currentRole !== 'landing' && (
            <button
              onClick={onOpenMessages}
              className="relative p-2 rounded-xl text-stone-600 hover:bg-stone-100 hover:text-emerald-800 transition cursor-pointer"
              title="Message Center"
            >
              <MessageSquare className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* User Profile Chip & Sign Out Button (When logged in) */}
          {currentUser && currentRole !== 'landing' && (
            <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
              <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block text-left leading-tight">
                <p className="text-xs font-bold text-stone-900 truncate max-w-[150px]">
                  {currentUser.fullName}
                </p>
                <p className="text-[10px] text-stone-500 font-medium">
                  {currentUser.role === 'admin'
                    ? 'Municipal Admin'
                    : currentUser.assignedBarangay
                    ? `Brgy. ${currentUser.assignedBarangay}`
                    : 'Field Focal'}
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title={t('header_sign_out')}
                className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Official Login Button (When not logged in) */}
          {!currentUser && (
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:shadow-md transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-300" />
              <span>{t('btn_login', 'Official Login')}</span>
            </button>
          )}

          {/* Mobile Menu Toggle Button for Landing Page */}
          {currentRole === 'landing' && (
            <button
              type="button"
              onClick={() => setIsLandingNavOpen(prev => !prev)}
              className="lg:hidden p-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isLandingNavOpen ? <X className="w-4 h-4 text-emerald-800" /> : <Menu className="w-4 h-4 text-stone-700" />}
            </button>
          )}

          {/* Mobile Sidebar Toggle Button for Authenticated Users (Small screens only, hidden on desktop) */}
          {currentRole !== 'landing' && onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 transition cursor-pointer"
              aria-label="Toggle navigation drawer"
            >
              <Menu className="w-4 h-4 text-stone-700" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Landing Dropdown Menu */}
      {isLandingNavOpen && currentRole === 'landing' && (
        <div className="lg:hidden border-t border-stone-200 bg-white/98 backdrop-blur-md px-4 py-3 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {landingNavItems.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToLandingSection(item.href)}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-stone-800 hover:bg-emerald-50 hover:text-emerald-800 transition cursor-pointer flex items-center justify-between"
            >
              <span>{item.fullLabel || item.label}</span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            </button>
          ))}
        </div>
      )}

      {/* Bottom Gold/Amber Accent Line as in official reference */}
      <div className="h-1 bg-amber-500 w-full" />

      {/* Sync Center Modal */}
      <SyncCenterModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </header>
  );
};
