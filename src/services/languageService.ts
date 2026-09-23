export type AppLanguage = 'en' | 'ceb' | 'fil';

export interface TranslationDictionary {
  // Navigation & Menu
  nav_dashboard: string;
  nav_add_swine: string;
  nav_farm_reg: string;
  nav_gis_map: string;
  nav_records: string;
  nav_reports: string;
  nav_takeoff: string;
  nav_ready_to_sell: string;
  nav_biosecurity: string;
  nav_asf_decrees: string;
  nav_messages: string;
  nav_barangays: string;
  nav_accounts: string;
  nav_landing_settings: string;
  nav_form_customizer: string;
  nav_sidebar_config: string;
  nav_public_portal: string;
  nav_sign_out: string;
  nav_system_admin: string;
  nav_trader_portal: string;
  nav_my_account: string;
  nav_close_sidebar: string;

  // Header & Brand
  header_da_title: string;
  header_da_sub: string;
  header_rfo: string;
  header_mao: string;
  header_location: string;
  header_sync_active: string;
  header_sim_offline: string;
  header_backup: string;
  header_menu: string;
  header_view_portal: string;
  header_sign_out: string;

  // Roles
  role_admin: string;
  role_focal: string;
  role_agent: string;
  role_public: string;
  role_admin_full: string;
  role_focal_full: string;
  role_agent_full: string;

  // Common UI Actions & Words
  common_language: string;
  common_online: string;
  common_offline: string;
  common_synced: string;
  common_save: string;
  common_saved: string;
  common_cancel: string;
  common_delete: string;
  common_edit: string;
  common_search: string;
  common_filter: string;
  common_export: string;
  common_print: string;
  common_close: string;
  common_back: string;
  common_actions: string;
  common_status: string;
  common_all: string;
  common_total: string;
  common_refresh: string;
  common_loading: string;
  common_confirm: string;
  common_yes: string;
  common_no: string;
  common_no_records: string;
  common_download: string;

  // Dashboard & Metrics
  dash_title: string;
  dash_subtitle: string;
  dash_total_farms: string;
  dash_total_heads: string;
  dash_ready_takeoff: string;
  dash_asf_free_rate: string;
  dash_biosecurity_rate: string;
  dash_recent_registrations: string;
  dash_distribution_title: string;
  dash_quick_actions: string;
  dash_export_csv: string;
  dash_filter_barangay: string;

  // Swine Classifications & Terminology
  swine_sow: string;
  swine_boar: string;
  swine_piglet: string;
  swine_fattener: string;
  swine_native: string;
  swine_commercial: string;
  swine_backyard: string;
  swine_semi_commercial: string;
  status_healthy: string;
  status_suspected: string;
  status_quarantined: string;
  status_sold: string;
}

export const translations: Record<AppLanguage, TranslationDictionary> = {
  en: {
    // Navigation & Menu
    nav_dashboard: 'Dashboard',
    nav_add_swine: 'Register Swine',
    nav_farm_reg: 'Swine Farm Registration',
    nav_gis_map: 'GIS Swine Map',
    nav_records: 'Swine Records',
    nav_reports: 'Print Official Reports',
    nav_takeoff: 'Ready for Take-Off',
    nav_ready_to_sell: 'Ready-to-Sell Swine',
    nav_biosecurity: 'Barangay Biosecurity',
    nav_asf_decrees: 'ASF Legal Decrees',
    nav_messages: 'Messages',
    nav_barangays: 'Manage Barangay',
    nav_accounts: 'User Accounts',
    nav_landing_settings: 'Landing Page CMS',
    nav_form_customizer: 'Registry Form Customization',
    nav_sidebar_config: 'Sidebar Configuration',
    nav_public_portal: 'View Public Portal',
    nav_sign_out: 'Sign Out',
    nav_system_admin: 'System Administration',
    nav_trader_portal: 'Trader Portal',
    nav_my_account: 'My Account',
    nav_close_sidebar: 'Close Navigation Menu',

    // Header & Brand
    header_da_title: 'DA HINUNANGAN',
    header_da_sub: 'MUNICIPAL SWINE BIOSECURITY & REGISTRY',
    header_rfo: 'DA - RFO VIII',
    header_mao: 'Municipal Agriculture Office',
    header_location: 'Hinunangan, Southern Leyte',
    header_sync_active: 'Online Sync Active',
    header_sim_offline: 'Simulating Offline',
    header_backup: 'Backup',
    header_menu: 'Menu',
    header_view_portal: 'View Public Portal',
    header_sign_out: 'Sign Out',

    // Roles
    role_admin: 'Admin',
    role_focal: 'Focal Person',
    role_agent: 'Livestock Trader',
    role_public: 'Public Portal',
    role_admin_full: 'Municipal Agriculturist / MAO Head',
    role_focal_full: 'Municipal Focal Person / Field Office',
    role_agent_full: 'Licensed Livestock Trader / Agent',

    // Common UI Actions & Words
    common_language: 'Language',
    common_online: 'Online',
    common_offline: 'Offline Mode',
    common_synced: 'Synced',
    common_save: 'Save',
    common_saved: 'Saved successfully',
    common_cancel: 'Cancel',
    common_delete: 'Delete',
    common_edit: 'Edit',
    common_search: 'Search',
    common_filter: 'Filter',
    common_export: 'Export',
    common_print: 'Print',
    common_close: 'Close',
    common_back: 'Back',
    common_actions: 'Actions',
    common_status: 'Status',
    common_all: 'All',
    common_total: 'Total',
    common_refresh: 'Refresh',
    common_loading: 'Loading...',
    common_confirm: 'Confirm',
    common_yes: 'Yes',
    common_no: 'No',
    common_no_records: 'No records found',
    common_download: 'Download',

    // Dashboard & Metrics
    dash_title: 'Swine Registry & Biosecurity Operations',
    dash_subtitle: 'Real-time monitoring and municipal surveillance for African Swine Fever prevention',
    dash_total_farms: 'Total Swine Farms',
    dash_total_heads: 'Total Swine Heads',
    dash_ready_takeoff: 'Ready for Take-Off',
    dash_asf_free_rate: 'ASF Free Rate',
    dash_biosecurity_rate: 'Biosecurity Compliance',
    dash_recent_registrations: 'Recent Swine Farm Registrations',
    dash_distribution_title: 'Swine Population by Barangay',
    dash_quick_actions: 'Quick Operations',
    dash_export_csv: 'Export Masterlist (CSV)',
    dash_filter_barangay: 'Filter by Barangay',

    // Swine Classifications & Terminology
    swine_sow: 'Sow',
    swine_boar: 'Boar',
    swine_piglet: 'Piglet',
    swine_fattener: 'Fattener',
    swine_native: 'Native',
    swine_commercial: 'Commercial',
    swine_backyard: 'Backyard',
    swine_semi_commercial: 'Semi-Commercial',
    status_healthy: 'Healthy',
    status_suspected: 'Suspected',
    status_quarantined: 'Quarantined',
    status_sold: 'Sold',
  },
  ceb: {
    // Navigation & Menu (Cebuano / Bisaya)
    nav_dashboard: 'Punoang Panid (Dashboard)',
    nav_add_swine: 'Rehistro sa Baboy',
    nav_farm_reg: 'Rehistro sa Baboyan',
    nav_gis_map: 'Mapa sa GIS ug Baboyan',
    nav_records: 'Talaan sa mga Baboy',
    nav_reports: 'I-print ang Opisyal nga Report',
    nav_takeoff: 'Andam Na Ibaligya',
    nav_ready_to_sell: 'Mga Baboy nga Baligyaon',
    nav_biosecurity: 'Biosecurity sa Barangay',
    nav_asf_decrees: 'Balaod ug Patakaran sa ASF',
    nav_messages: 'Mga Mensahe',
    nav_barangays: 'Pagdumala sa Barangay',
    nav_accounts: 'Mga Akawnt sa Gumagamit',
    nav_landing_settings: 'Setting sa Landing Page',
    nav_form_customizer: 'Pagpahaom sa Porma sa Rehistro',
    nav_sidebar_config: 'Pagsasaayos sa Sidebar',
    nav_public_portal: 'Tan-awa ang Publikong Portal',
    nav_sign_out: 'Paggawas (Sign Out)',
    nav_system_admin: 'Pagdumala sa Sistema',
    nav_trader_portal: 'Portal sa Negosyante (Trader)',
    nav_my_account: 'Akong Akawnt',
    nav_close_sidebar: 'Sirad-i ang Menu sa Pag-navigate',

    // Header & Brand
    header_da_title: 'DA HINUNANGAN',
    header_da_sub: 'REHISTRO UG PROTEKSYON SA BABOYAN SA MUNISIPYO',
    header_rfo: 'DA - RFO VIII',
    header_mao: 'Tanggapan sa Agrikultura sa Munisipyo',
    header_location: 'Hinunangan, Habagatang Leyte',
    header_sync_active: 'Aktibo ang Koneksyon (Online Sync)',
    header_sim_offline: 'Gisundog ang Way Koneksyon',
    header_backup: 'Kopya sa Datos (Backup)',
    header_menu: 'Menu',
    header_view_portal: 'Tan-awa ang Publikong Portal',
    header_sign_out: 'Paggawas (Sign Out)',

    // Roles
    role_admin: 'Tagdumala (Admin)',
    role_focal: 'Focal Person sa Barangay',
    role_agent: 'Negosyante sa Hayop (Trader)',
    role_public: 'Publikong Portal',
    role_admin_full: 'Agrikulturista sa Munisipyo / Pangulo sa MAO',
    role_focal_full: 'Focal Person sa Munisipyo / Field Office',
    role_agent_full: 'Lisensyadong Negosyante sa Baboy / Ahente',

    // Common UI Actions & Words
    common_language: 'Pinulongan',
    common_online: 'Konektado (Online)',
    common_offline: 'Way Koneksyon (Offline Mode)',
    common_synced: 'Na-sync Na',
    common_save: 'I-save (Tipigi)',
    common_saved: 'Malamposong na-save!',
    common_cancel: 'Kanselahon',
    common_delete: 'Papasa',
    common_edit: 'Usba',
    common_search: 'Pangitaa',
    common_filter: 'Salain',
    common_export: 'I-export',
    common_print: 'I-print',
    common_close: 'Sirad-i',
    common_back: 'Balik',
    common_actions: 'Mga Aksyon',
    common_status: 'Kahimtang',
    common_all: 'Tanan',
    common_total: 'Tibuok',
    common_refresh: 'I-refresh',
    common_loading: 'Nagkarga...',
    common_confirm: 'Kumpirmaha',
    common_yes: 'Oo',
    common_no: 'Dili',
    common_no_records: 'Walay nakit-ang talaan',
    common_download: 'I-download',

    // Dashboard & Metrics
    dash_title: 'Operasyon sa Rehistro sa Baboy ug Biosecurity',
    dash_subtitle: 'Tinuod-nga-oras nga pag-monitor sa munisipyo aron mapugngan ang African Swine Fever (ASF)',
    dash_total_farms: 'Tibuok Ihap sa Baboyan',
    dash_total_heads: 'Tibuok Ihap sa Ulo sa Baboy',
    dash_ready_takeoff: 'Andam Na Ibaligya (Take-Off)',
    dash_asf_free_rate: 'Bahin nga Luwas sa ASF',
    dash_biosecurity_rate: 'Pagsunod sa Biosecurity',
    dash_recent_registrations: 'Bag-ong Rehistro sa mga Baboyan',
    dash_distribution_title: 'Populasyon sa Baboy kada Barangay',
    dash_quick_actions: 'Dali nga mga Aksyon',
    dash_export_csv: 'I-download ang Listahan (CSV)',
    dash_filter_barangay: 'Salain sumala sa Barangay',

    // Swine Classifications & Terminology
    swine_sow: 'Anay (Sow)',
    swine_boar: 'Butakal (Boar)',
    swine_piglet: 'Baktin (Piglet)',
    swine_fattener: 'Patuboon (Fattener)',
    swine_native: 'Lumad / Bisaya (Native)',
    swine_commercial: 'Komersyal',
    swine_backyard: 'Tugkaran (Backyard)',
    swine_semi_commercial: 'Semi-Komersyal',
    status_healthy: 'Himsog',
    status_suspected: 'Gidudahan',
    status_quarantined: 'Gibulag (Quarantine)',
    status_sold: 'Nabaligya Na',
  },
  fil: {
    // Navigation & Menu (Filipino / Tagalog)
    nav_dashboard: 'Pangunahing Dashboard',
    nav_add_swine: 'Magparehistro ng Baboy',
    nav_farm_reg: 'Rehistro ng Babuyan',
    nav_gis_map: 'Mapa ng GIS at Babuyan',
    nav_records: 'Talaan ng mga Baboy',
    nav_reports: 'I-print ang Opisyal na Ulat',
    nav_takeoff: 'Handa nang Idispatso',
    nav_ready_to_sell: 'Mga Baboy na Ibinebenta',
    nav_biosecurity: 'Biosecurity sa Barangay',
    nav_asf_decrees: 'Batas at Ordinansa sa ASF',
    nav_messages: 'Mga Mensahe',
    nav_barangays: 'Pamamahala ng Barangay',
    nav_accounts: 'Mga Account ng Gumagamit',
    nav_landing_settings: 'Landing Page at Website',
    nav_form_customizer: 'Pagpapasadyang Form ng Rehistro',
    nav_sidebar_config: 'Pagsasaayos ng Sidebar',
    nav_public_portal: 'Tingnan ang Pampublikong Portal',
    nav_sign_out: 'Mag-sign Out',
    nav_system_admin: 'Pamamahala ng Sistema',
    nav_trader_portal: 'Portal ng Mangangalakal (Trader)',
    nav_my_account: 'Aking Account',
    nav_close_sidebar: 'Isara ang Navigation Menu',

    // Header & Brand
    header_da_title: 'DA HINUNANGAN',
    header_da_sub: 'REHISTRO AT BIOSECURITY NG MGA BABUYAN SA BAYAN',
    header_rfo: 'DA - RFO VIII',
    header_mao: 'Tanggapan ng Pagsasaka ng Bayan',
    header_location: 'Hinunangan, Southern Leyte',
    header_sync_active: 'Aktibo ang Pag-sync Online',
    header_sim_offline: 'Kunwaring Walang Koneksyon',
    header_backup: 'Kopya ng Datos (Backup)',
    header_menu: 'Menu',
    header_view_portal: 'Tingnan ang Pampublikong Portal',
    header_sign_out: 'Mag-sign Out',

    // Roles
    role_admin: 'Tagapamahala (Admin)',
    role_focal: 'Focal Person ng Barangay',
    role_agent: 'Mangangalakal ng Hayop (Trader)',
    role_public: 'Pampublikong Portal',
    role_admin_full: 'Agrikulturista ng Bayan / Pinuno ng MAO',
    role_focal_full: 'Focal Person ng Bayan / Field Office',
    role_agent_full: 'Lisensyadong Mangangalakal ng Baboy / Ahente',

    // Common UI Actions & Words
    common_language: 'Wika',
    common_online: 'Konektado (Online)',
    common_offline: 'Walang Koneksyon (Offline)',
    common_synced: 'Na-sync Na',
    common_save: 'I-save (Itala)',
    common_saved: 'Matagumpay na naitala!',
    common_cancel: 'Kanselahin',
    common_delete: 'Burahin',
    common_edit: 'I-edit',
    common_search: 'Maghanap',
    common_filter: 'Salain',
    common_export: 'I-export',
    common_print: 'I-print',
    common_close: 'Isara',
    common_back: 'Bumalik',
    common_actions: 'Mga Aksyon',
    common_status: 'Katayuan',
    common_all: 'Lahat',
    common_total: 'Kabuuan',
    common_refresh: 'I-refresh',
    common_loading: 'Naglo-load...',
    common_confirm: 'Kumpirmahin',
    common_yes: 'Oo',
    common_no: 'Hindi',
    common_no_records: 'Walang nahanap na tala',
    common_download: 'I-download',

    // Dashboard & Metrics
    dash_title: 'Operasyon sa Rehistro ng Babuyan at Biosecurity',
    dash_subtitle: 'Real-time na pagsubaybay sa buong bayan upang maiwasan ang African Swine Fever (ASF)',
    dash_total_farms: 'Kabuuang Bilang ng Babuyan',
    dash_total_heads: 'Kabuuang Bilang ng Ulo ng Baboy',
    dash_ready_takeoff: 'Handa nang Idispatso (Take-Off)',
    dash_asf_free_rate: 'Bahaging Ligtas sa ASF',
    dash_biosecurity_rate: 'Pagsunod sa Biosecurity',
    dash_recent_registrations: 'Kamakailang Rehistro ng Babuyan',
    dash_distribution_title: 'Populasyon ng Baboy sa bawat Barangay',
    dash_quick_actions: 'Mabilisang Aksyon',
    dash_export_csv: 'I-download ang Talaan (CSV)',
    dash_filter_barangay: 'Salain ayon sa Barangay',

    // Swine Classifications & Terminology
    swine_sow: 'Inahing Baboy (Sow)',
    swine_boar: 'Barako (Boar)',
    swine_piglet: 'Biik (Piglet)',
    swine_fattener: 'Pang-katay / Grower (Fattener)',
    swine_native: 'Katutubong Baboy (Native)',
    swine_commercial: 'Komersyal',
    swine_backyard: 'Likod-bahay (Backyard)',
    swine_semi_commercial: 'Semi-Komersyal',
    status_healthy: 'Malusog',
    status_suspected: 'Pinaghihinalaan',
    status_quarantined: 'Naka-quarantine',
    status_sold: 'Naibenta Na',
  },
};

const LANGUAGE_STORAGE_KEY = 'app_language';
const LANGUAGE_EVENT = 'app_language_change';

class LanguageService {
  private currentLanguage: AppLanguage = 'en';

  constructor() {
    this.init();
  }

  private init() {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === 'en' || stored === 'ceb' || stored === 'fil') {
        this.currentLanguage = stored;
      } else {
        this.currentLanguage = 'en';
      }
    } catch {
      this.currentLanguage = 'en';
    }
  }

  public getLanguage(): AppLanguage {
    return this.currentLanguage;
  }

  public setLanguage(lang: AppLanguage): void {
    if (lang !== 'en' && lang !== 'ceb' && lang !== 'fil') return;
    this.currentLanguage = lang;
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Could not save language to localStorage:', e);
    }

    // Broadcast across windows/components
    window.dispatchEvent(
      new CustomEvent(LANGUAGE_EVENT, {
        detail: { language: lang },
      })
    );
  }

  public t(key: keyof TranslationDictionary, fallback?: string): string {
    const dict = translations[this.currentLanguage] || translations.en;
    return dict[key] || fallback || key;
  }

  public onLanguageChange(callback: (lang: AppLanguage) => void): () => void {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ language: AppLanguage }>;
      if (customEvent.detail?.language) {
        callback(customEvent.detail.language);
      } else {
        callback(this.getLanguage());
      }
    };

    window.addEventListener(LANGUAGE_EVENT, handler);
    return () => window.removeEventListener(LANGUAGE_EVENT, handler);
  }
}

export const languageService = new LanguageService();
