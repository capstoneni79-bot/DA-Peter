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
} from 'lucide-react';
import { UserAccount, UserRole } from '../../types';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { PWAInstallButton } from './PWAInstallButton';
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
  const { isOnline, isSimulatedOffline, toggleSimulateOffline } = useOfflineStatus();
  const { language, setLanguage, t } = useLanguage();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const logos = useOfficialLogos();
  const activeHeaderLogo = logos['logo-header'] || logos['logo-system'] || logos['logo-da'] || logos['logo-website'] || '/icon.svg';

  const getRoleBadge = () => {
    if (currentRole === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
          <ShieldAlert className="w-3 h-3 text-emerald-700" /> {t('role_admin')}
        </span>
      );
    }
    if (currentRole === 'focal') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
          <MapPin className="w-3 h-3 text-blue-700" /> {t('role_focal')} ({currentUser?.assignedBarangay || 'Barangay'})
        </span>
      );
    }
    if (currentRole === 'agent') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <Sparkles className="w-3 h-3 text-amber-700" /> {t('role_agent')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700 border border-stone-300">
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
              title="Switch language to English"
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
              title="Switch language to Cebuano / Bisaya"
            >
              CEB
            </button>
          </div>

          {/* Simulate Offline Button */}
          <button
            onClick={toggleSimulateOffline}
            className={`cursor-pointer px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1 transition ${
              isSimulatedOffline
                ? 'bg-amber-600 text-white hover:bg-amber-500'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
            title="Toggle simulated offline state for field test"
          >
            {isSimulatedOffline ? <WifiOff className="w-3 h-3 text-white" /> : <Wifi className="w-3 h-3 text-emerald-400" />}
            <span className="hidden sm:inline">{isSimulatedOffline ? t('header_sim_offline') : t('header_sync_active')}</span>
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
        {/* Brand & Menu Button */}
        <div className="flex items-center gap-3">
          {/* Main Menu Toggle Button (Hidden on Landing Page) */}
          {currentRole !== 'landing' && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border transition cursor-pointer flex items-center gap-2 font-bold text-xs shadow-2xs ${
                isSidebarOpen
                  ? 'bg-blue-900 border-blue-900 text-white shadow-xs'
                  : 'border-stone-300 hover:border-blue-600 bg-white hover:bg-blue-50/60 text-slate-800 hover:text-blue-900'
              }`}
              title={isSidebarOpen ? t('nav_close_sidebar') : t('header_menu')}
              aria-label="Toggle navigation menu"
            >
              {isSidebarOpen ? <X className="w-4 h-4 text-white" /> : <Menu className="w-4 h-4 text-blue-700" />}
              <span className="hidden sm:inline font-bold">{t('header_menu')}</span>
            </button>
          )}

          {/* Brand Logo & Title */}
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

          {/* User Account / Login State (Clean, no role switcher) */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-stone-300 hover:border-emerald-600 bg-stone-50 hover:bg-emerald-50/50 text-stone-800 text-xs font-semibold cursor-pointer transition shadow-2xs"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[11px]">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-bold text-stone-900 leading-tight truncate max-w-[120px]">
                    {currentUser.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-emerald-800 font-medium capitalize leading-tight">
                    {currentUser.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
              </button>

              {/* User Menu Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/80">
                    <div className="font-bold text-stone-900 text-sm">{currentUser.name}</div>
                    <div className="text-[11px] text-stone-500">{currentUser.username} • {currentUser.phone || 'No phone'}</div>
                    <div className="mt-1">{getRoleBadge()}</div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onSelectRole('landing');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-stone-50 text-stone-700 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <Home className="w-4 h-4 text-stone-400" />
                      <span>{t('header_view_portal')}</span>
                    </button>

                    <div className="border-t border-stone-100 my-1" />

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer font-bold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('header_sign_out')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:shadow-md transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-300" />
              <span>Official Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
