import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { OfflineBanner } from './components/common/OfflineBanner';
import { BackupModal } from './components/common/BackupModal';
import { LandingPage } from './components/landing/LandingPage';
import { Dashboard } from './components/dashboard/Dashboard';
import { GisMap } from './components/gis/GisMap';
import { SwineForm } from './components/registry/SwineForm';
import { BatchImportModal } from './components/registry/BatchImportModal';
import { PigsRecords } from './components/records/PigsRecords';
import { CertificateManager } from './components/certificate/CertificateManager';
import { MessagingCenter } from './components/messaging/MessagingCenter';
import { ManageBarangays } from './components/admin/ManageBarangays';
import { ManageAccounts } from './components/admin/ManageAccounts';
import { ManageLandingPage } from './components/admin/ManageLandingPage';
import { ManageRegistryForms } from './components/admin/ManageRegistryForms';
import { BarangayBiosecurity } from './components/admin/BarangayBiosecurity';
import { PhotoMediaSettings } from './components/admin/media/PhotoMediaSettings';
import { LogoConfiguration } from './components/admin/media/LogoConfiguration';
import { InterfaceBackgroundConfig } from './components/admin/media/InterfaceBackgroundConfig';
import { AccessDenied403 } from './components/admin/media/AccessDenied403';
import { SidebarColorConfig } from './components/admin/SidebarColorConfig';
import { RegistryFormCustomizer } from './components/admin/RegistryFormCustomizer';
import { SwineMarketingAlerts } from './components/marketing/SwineMarketingAlerts';
import { SwineTakeoffManager } from './components/takeoff/SwineTakeoffManager';
import { AgentCatalog } from './components/agent/AgentCatalog';
import { AgentAccountView } from './components/agent/AgentAccountView';
import { UserAccountView } from './components/account/UserAccountView';
import { AuthModal } from './components/auth/AuthModal';
import { ASFOrdinanceModule } from './components/asf/ASFOrdinanceModule';
import { storageService } from './services/storageService';
import { landingCmsService } from './services/landingCmsService';
import { BackgroundPhotoConfig } from './types/landingCms';
import { Barangay, LandingPageConfig, SwineRecord, UserAccount, UserRole } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => storageService.getCurrentUser());
  const [currentRole, setCurrentRole] = useState<UserRole | 'landing'>(() => {
    const user = storageService.getCurrentUser();
    return user ? user.role : 'landing';
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [swineList, setSwineList] = useState<SwineRecord[]>(() => storageService.getSwineRecords());
  const [barangays, setBarangays] = useState<Barangay[]>(() => storageService.getBarangays());
  const [landingConfig, setLandingConfig] = useState<LandingPageConfig>(() => storageService.getLandingConfig());
  const [accounts, setAccounts] = useState<UserAccount[]>(() => storageService.getAccounts());
  const [interfaceBg, setInterfaceBg] = useState<BackgroundPhotoConfig | null>(() => {
    try {
      return landingCmsService.getDraftConfig().interfaceBackground || null;
    } catch {
      return null;
    }
  });

  // Modals & Navigation helpers
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<UserRole>('admin');
  const [editingSwine, setEditingSwine] = useState<SwineRecord | null>(null);
  const [certificateSwine, setCertificateSwine] = useState<SwineRecord | null>(null);
  const [preselectedTakeoffSwine, setPreselectedTakeoffSwine] = useState<SwineRecord | null>(null);

  // Counters for Header badges
  const [readyTakeoffCount, setReadyTakeoffCount] = useState<number>(0);
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(0);

  // Google Maps Platform Quota Defense listener
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  useEffect(() => {
    const handler = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handler);
    return () => window.removeEventListener('gmp-quota-exceeded', handler);
  }, []);

  // Sidebar visibility state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  // Unread messages count
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const refreshAllData = () => {
    setSwineList(storageService.getSwineRecords());
    setBarangays(storageService.getBarangays());
    setLandingConfig(storageService.getLandingConfig());
    setAccounts(storageService.getAccounts());

    const msgs = storageService.getMessages();
    const currUser = storageService.getCurrentUser();
    const unread = msgs.filter(m => {
      const isRead = m.isRead || (currUser?.id && m.readBy?.includes(currUser.id));
      if (isRead) return false;
      if (currUser?.role === 'admin') return true;
      const targetBg = (m.recipientBarangay || m.targetBarangay || 'all').toLowerCase();
      const userBg = (currUser?.assignedBarangay || '').toLowerCase();
      if (currUser?.role === 'focal' && userBg) {
        return targetBg === 'all' || targetBg === userBg;
      }
      return false;
    }).length;
    setUnreadCount(unread);

    // Badges for Takeoff & Marketing Alerts
    const readyPigs = storageService.getSwineRecords().filter(s => {
      if (s.isArchived || !s.readyToSell) return false;
      if (currUser?.role === 'focal' && currUser.assignedBarangay) {
        return (s.barangay || '').toLowerCase() === currUser.assignedBarangay.toLowerCase();
      }
      return true;
    });
    setReadyTakeoffCount(readyPigs.length);

    const alerts = storageService.getMarketingAlerts().filter(a => a.isActive);
    setActiveAlertsCount(alerts.length);
  };

  useEffect(() => {
    refreshAllData();
  }, [currentRole, currentUser]);

  useEffect(() => {
    const handleCmsUpdate = (e: Event) => {
      const customEvt = e as CustomEvent;
      const config = customEvt?.detail || landingCmsService.getDraftConfig();
      if (config?.interfaceBackground) {
        setInterfaceBg(config.interfaceBackground);
      }
    };
    window.addEventListener('da_landing_cms_updated', handleCmsUpdate);
    window.addEventListener('da_landing_draft_updated', handleCmsUpdate);
    return () => {
      window.removeEventListener('da_landing_cms_updated', handleCmsUpdate);
      window.removeEventListener('da_landing_draft_updated', handleCmsUpdate);
    };
  }, []);

  const handleSelectRole = (role: UserRole | 'landing', specificUser?: UserAccount) => {
    setCurrentRole(role);
    if (role === 'landing') {
      setCurrentUser(null);
      storageService.setCurrentUser(null as any);
    } else {
      const user = specificUser || accounts.find(a => a.role === role) || null;
      setCurrentUser(user);
      if (user) storageService.setCurrentUser(user);
      setActiveTab(role === 'agent' ? 'ready_to_sell' : 'dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentRole('landing');
    setCurrentUser(null);
    storageService.setCurrentUser(null as any);
  };

  const handleOpenLogin = (role: UserRole = 'admin') => {
    setAuthModalRole(role);
    setIsAuthModalOpen(true);
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    storageService.setCurrentUser(user);
    setIsAuthModalOpen(false);
    setActiveTab(user.role === 'agent' ? 'ready_to_sell' : 'dashboard');
  };

  // Navigations from records
  const handleEditSwine = (swine: SwineRecord) => {
    setEditingSwine(swine);
    setActiveTab('add_swine');
  };

  const handleIssueCertificateForSwine = (swine: SwineRecord) => {
    setCertificateSwine(swine);
    setActiveTab('certificate');
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans antialiased selection:bg-emerald-200 relative">
      {/* Connected Interface Background Layer for Admin/Portal */}
      {interfaceBg?.imageUrl && interfaceBg.enabled !== false && currentRole !== 'landing' && (
        <div
          className={`fixed inset-0 pointer-events-none z-0 ${interfaceBg.fixed !== false ? 'attachment-fixed' : ''}`}
          style={{
            backgroundImage: `url(${interfaceBg.imageUrl})`,
            backgroundPosition: interfaceBg.position || 'center',
            backgroundSize: interfaceBg.fit || 'cover',
            backgroundRepeat: interfaceBg.repeat || 'no-repeat',
            filter: `brightness(${(interfaceBg.brightness ?? 100) / 100}) blur(${interfaceBg.blur ?? 0}px)`,
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: interfaceBg.overlayColor || '#064e3b',
              opacity: Math.min(0.94, ((interfaceBg.overlayOpacity ?? 35) / 100) + 0.35),
            }}
          />
        </div>
      )}

      {/* Offline Status & Sync Alert */}
      <OfflineBanner onSyncComplete={refreshAllData} />

      {/* Google Maps Platform Quota Exceeded Sticky Notice */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Main Responsive Header */}
      <Header
        currentUser={currentUser}
        currentRole={currentRole}
        onSelectRole={handleSelectRole}
        activeTab={activeTab}
        onSelectTab={tab => {
          if (tab === 'add_swine' && activeTab !== 'add_swine') {
            setEditingSwine(null);
          }
          setActiveTab(tab);
        }}
        unreadCount={unreadCount}
        onOpenMessages={() => setActiveTab('messages')}
        onLogout={handleLogout}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenLogin={() => handleOpenLogin('admin')}
        readyTakeoffCount={readyTakeoffCount}
        activeAlertsCount={activeAlertsCount}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
      />

      {/* Main Layout Container with Desktop Locked-In Docked Sidebar & Mobile Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Locked-In Sidebar (Permanently docked, zero jump/flicker, 100% accessible) */}
        {currentRole !== 'landing' && (
          <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-slate-800/80 bg-[#070e20] z-20 h-full overflow-hidden">
            <Sidebar
              currentUser={currentUser}
              currentRole={currentRole}
              activeTab={activeTab}
              onSelectTab={tab => {
                if (tab === 'add_swine' && activeTab !== 'add_swine') {
                  setEditingSwine(null);
                }
                setActiveTab(tab);
              }}
              onSelectRole={handleSelectRole}
              unreadCount={unreadCount}
              readyTakeoffCount={readyTakeoffCount}
              onLogout={handleLogout}
              onClose={() => {}}
              onOpenLogin={() => handleOpenLogin('admin')}
            />
          </aside>
        )}

        {/* Mobile Slide-in Drawer (Only on mobile/tablet <lg when opened via menu toggle) */}
        {isSidebarOpen && currentRole !== 'landing' && (
          <div className="lg:hidden fixed inset-0 z-50 flex pointer-events-auto">
            {/* Clickable Backdrop - closes drawer cleanly */}
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity cursor-pointer"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close navigation menu"
            />
            <div className="relative w-72 max-w-[85vw] h-full bg-[#070e20] shadow-2xl z-10 flex flex-col overflow-hidden animate-in slide-in-from-left duration-200">
              <Sidebar
                currentUser={currentUser}
                currentRole={currentRole}
                activeTab={activeTab}
                onSelectTab={tab => {
                  if (tab === 'add_swine' && activeTab !== 'add_swine') {
                    setEditingSwine(null);
                  }
                  setActiveTab(tab);
                  setIsSidebarOpen(false);
                }}
                onSelectRole={role => {
                  handleSelectRole(role);
                  setIsSidebarOpen(false);
                }}
                unreadCount={unreadCount}
                readyTakeoffCount={readyTakeoffCount}
                onLogout={() => {
                  handleLogout();
                  setIsSidebarOpen(false);
                }}
                onClose={() => setIsSidebarOpen(false)}
                onOpenLogin={() => {
                  handleOpenLogin('admin');
                  setIsSidebarOpen(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Main Dashboard Viewport - ALWAYS fully visible, bright, clickable & interactive */}
        <main className="flex-1 w-full min-w-0 overflow-y-auto">
        {currentRole === 'landing' ? (
          <LandingPage
            swineList={swineList}
            barangays={barangays}
            config={landingConfig}
            accounts={accounts}
            onSelectRole={handleSelectRole}
            onNavigateTab={tab => setActiveTab(tab)}
            onOpenLogin={() => handleOpenLogin('admin')}
          />
        ) : currentRole === 'agent' ? (
          activeTab === 'messages' ? (
            <MessagingCenter
              barangays={barangays}
              currentUser={currentUser}
              onRefreshBadge={refreshAllData}
            />
          ) : activeTab === 'account' ? (
            <AgentAccountView
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          ) : (
            <AgentCatalog
              swineList={swineList}
              barangays={barangays}
            />
          )
        ) : (
          /* Admin or Focal Person Tabs */
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                swineList={swineList}
                barangays={barangays}
                currentUser={currentUser}
                currentRole={currentRole}
                onNavigateTab={setActiveTab}
                onAddSwine={() => {
                  setEditingSwine(null);
                  setActiveTab('add_swine');
                }}
                onOpenBatchModal={() => setIsBatchModalOpen(true)}
              />
            )}

            {activeTab === 'takeoff' && (
              <SwineTakeoffManager
                swineList={swineList}
                currentUser={currentUser}
                initialSelectedSwine={preselectedTakeoffSwine}
                onRefresh={refreshAllData}
                onNavigateBack={() => setActiveTab('records')}
              />
            )}

            {activeTab === 'biosecurity' && (
              <BarangayBiosecurity
                barangays={barangays}
                currentUser={currentUser}
                currentRole={currentRole}
                onRefresh={refreshAllData}
              />
            )}

            {activeTab === 'marketing_alerts' && (
              <SwineMarketingAlerts
                swineList={swineList}
                barangays={barangays}
                currentUser={currentUser}
                onScheduleTakeoff={(swine) => {
                  setPreselectedTakeoffSwine(swine);
                  setActiveTab('takeoff');
                }}
                onRefresh={refreshAllData}
              />
            )}

            {activeTab === 'gis' && (
              <div className="py-6 px-4 max-w-7xl mx-auto space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-stone-900">
                      Hinunangan Municipal GIS Biosurveillance & Swine Map
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Satellite & topographical mapping of 40 Hinunangan barangays, ASF risk zones, pig farm density heatmap, and live GPS tracking.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingSwine(null);
                      setActiveTab('add_swine');
                    }}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-sm"
                  >
                    + Register Swine with GPS
                  </button>
                </div>

                <GisMap
                  swineList={
                    currentRole === 'focal' && currentUser?.assignedBarangay
                      ? swineList.filter(s => (s.barangay || '').toLowerCase() === (currentUser.assignedBarangay || '').toLowerCase())
                      : swineList
                  }
                  barangays={barangays}
                  selectedBarangay={currentRole === 'focal' ? currentUser?.assignedBarangay : undefined}
                  onSelectSwine={handleEditSwine}
                />
              </div>
            )}

            {activeTab === 'asf_ordinance' && currentRole !== 'focal' && (
              <ASFOrdinanceModule
                barangays={barangays}
                currentUser={currentUser}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'add_swine' && (
              <SwineForm
                barangays={barangays}
                currentUser={currentUser}
                initialData={editingSwine}
                onSuccess={() => {
                  setEditingSwine(null);
                  refreshAllData();
                  setActiveTab('records');
                }}
                onCancel={() => {
                  setEditingSwine(null);
                  setActiveTab('records');
                }}
                onOpenBatchModal={() => setIsBatchModalOpen(true)}
                onViewOrdinance={() => setActiveTab('asf_ordinance')}
              />
            )}

            {activeTab === 'records' && (
              <PigsRecords
                swineList={swineList}
                barangays={barangays}
                currentUser={currentUser}
                currentRole={currentRole}
                onEditSwine={handleEditSwine}
                onIssueCertificate={handleIssueCertificateForSwine}
                onAddSwine={() => {
                  setEditingSwine(null);
                  setActiveTab('add_swine');
                }}
                onRefresh={refreshAllData}
              />
            )}

            {activeTab === 'certificate' && (
              <CertificateManager
                swineList={swineList}
                currentUser={currentUser}
                selectedSwineInitial={certificateSwine}
              />
            )}

            {activeTab === 'messages' && (
              <MessagingCenter
                barangays={barangays}
                currentUser={currentUser}
                onRefreshBadge={refreshAllData}
              />
            )}

            {activeTab === 'barangays' && currentRole === 'admin' && (
              <ManageBarangays barangays={barangays} onRefresh={refreshAllData} />
            )}

            {activeTab === 'accounts' && currentRole === 'admin' && (
              <ManageAccounts users={accounts} barangays={barangays} onRefresh={refreshAllData} />
            )}

            {/* Unified Landing Page Settings Hub (Consolidates all landing page settings, background, media library, logos, and social) */}
            {(activeTab === 'landing_manager' ||
              activeTab === 'landing_settings' ||
              activeTab === 'admin_photo_media' ||
              activeTab === 'photo_media' ||
              activeTab === 'admin_logos' ||
              activeTab === 'admin_background' ||
              activeTab === 'admin_social') && (
              currentRole === 'admin' ? (
                <ManageLandingPage
                  initialTab={
                    activeTab === 'admin_photo_media' || activeTab === 'photo_media'
                      ? 'media_library'
                      : activeTab === 'admin_logos'
                      ? 'logos_branding'
                      : activeTab === 'admin_background'
                      ? 'background'
                      : activeTab === 'admin_social'
                      ? 'social_media'
                      : undefined
                  }
                  onRefresh={refreshAllData}
                />
              ) : (
                <AccessDenied403
                  onBackToDashboard={() => setActiveTab('dashboard')}
                  moduleName="Landing Page Settings"
                />
              )
            )}

            {/* Theme & Appearance */}
            {activeTab === 'admin_theme' && (
              currentRole === 'admin' ? (
                <ManageLandingPage onRefresh={refreshAllData} />
              ) : (
                <AccessDenied403
                  onBackToDashboard={() => setActiveTab('dashboard')}
                  moduleName="Theme & Appearance Settings"
                />
              )
            )}

            {/* Sidebar Color Configuration (ADMIN ONLY) */}
            {activeTab === 'sidebar_color' && (
              currentRole === 'admin' ? (
                <SidebarColorConfig
                  onSaved={refreshAllData}
                  onNavigateTab={setActiveTab}
                />
              ) : (
                <AccessDenied403
                  onBackToDashboard={() => setActiveTab('dashboard')}
                  moduleName="Sidebar Color Configuration"
                />
              )
            )}

            {/* My Account (Focal Person & Admin) */}
            {activeTab === 'account' && (
              <UserAccountView
                currentUser={currentUser}
                onLogout={handleLogout}
                onUpdateUser={(updated) => {
                  setCurrentUser(updated);
                  refreshAllData();
                }}
                swineList={swineList}
                barangays={barangays}
              />
            )}

            {/* Registry Form Customization (ADMIN ONLY) */}
            {(activeTab === 'form_customizer' || activeTab === 'form_manager') && (
              currentRole === 'admin' ? (
                <RegistryFormCustomizer
                  barangays={barangays}
                  onRefresh={refreshAllData}
                  onNavigateTab={setActiveTab}
                />
              ) : (
                <AccessDenied403
                  onBackToDashboard={() => setActiveTab('dashboard')}
                  moduleName="Registry Form Customization"
                />
              )
            )}
          </>
        )}
      </main>
    </div>

      {/* Batch Import Modal */}
      <BatchImportModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        barangays={barangays}
        currentUser={currentUser}
        onImportComplete={() => {
          refreshAllData();
          setActiveTab('records');
        }}
      />

      {/* Database Backup & Restore Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onDataRestored={refreshAllData}
      />

      {/* Login Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialRole={authModalRole}
      />
    </div>
  );
}
