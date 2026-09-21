import {
  INITIAL_ACCOUNTS,
  INITIAL_BARANGAYS,
  INITIAL_BIOSECURITY_AUDITS,
  INITIAL_BIOSECURITY_INCIDENTS,
  INITIAL_CERTIFICATE_CONFIG,
  INITIAL_DYNAMIC_FIELDS,
  INITIAL_LANDING_CONFIG,
  INITIAL_MARKETING_ALERTS,
  INITIAL_MESSAGES,
  INITIAL_SWINE_RECORDS,
  INITIAL_TAKEOFF_RECORDS,
} from '../data/initialData';
import { ALL_ASF_REGULATIONS } from '../data/asfRegulationsData';
import { DEFAULT_SIDEBAR_THEME, INITIAL_REGISTRY_FORM_SCHEMA } from '../data/initialFormSchema';
import {
  ASFRegulatoryDocument,
  Barangay,
  BarangayBiosecurityAudit,
  BiosecurityIncident,
  CertificateConfig,
  DynamicFormField,
  IssuedCertificate,
  LandingPageConfig,
  MarketingAlert,
  MessageItem,
  OfflineQueueItem,
  RegistryFormSchema,
  SidebarTheme,
  SwineRecord,
  SwineTakeoffRecord,
  UserAccount,
} from '../types';

const STORAGE_KEYS = {
  SWINE: 'da_hinunangan_swine_records_v1',
  BARANGAYS: 'da_hinunangan_barangays_v1',
  ACCOUNTS: 'da_hinunangan_accounts_v1',
  MESSAGES: 'da_hinunangan_messages_v1',
  CERT_CONFIG: 'da_hinunangan_cert_config_v1',
  CERT_ISSUED: 'da_hinunangan_cert_issued_v1',
  LANDING: 'da_hinunangan_landing_config_v1',
  DYNAMIC_FORM: 'da_hinunangan_dynamic_form_v1',
  OFFLINE_QUEUE: 'da_hinunangan_offline_queue_v1',
  CURRENT_USER: 'da_hinunangan_current_user_v1',
  SIMULATED_OFFLINE: 'da_hinunangan_simulated_offline_v1',
  BIOSECURITY_AUDITS: 'da_hinunangan_biosecurity_audits_v1',
  BIOSECURITY_INCIDENTS: 'da_hinunangan_biosecurity_incidents_v1',
  MARKETING_ALERTS: 'da_hinunangan_marketing_alerts_v1',
  TAKEOFF_RECORDS: 'da_hinunangan_takeoff_records_v1',
  ASF_REGULATIONS: 'da_hinunangan_asf_regulations_v1',
  SIDEBAR_THEME: 'da_hinunangan_sidebar_theme_v1',
  REGISTRY_FORM_SCHEMA: 'da_hinunangan_registry_form_schema_v1',
  REGISTRY_FORM_SCHEMA_DRAFT: 'da_hinunangan_registry_form_schema_draft_v1',
};

// Safe LocalStorage helpers
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (err) {
    console.warn(`Error reading localStorage key "${key}":`, err);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing localStorage key "${key}":`, err);
  }
}

// Auto-empty records one-time migration to ensure browser session clears data records while preserving all text
try {
  if (typeof window !== 'undefined' && localStorage.getItem('da_records_emptied_sept2026_v1') !== 'true') {
    localStorage.setItem(STORAGE_KEYS.SWINE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CERT_ISSUED, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TAKEOFF_RECORDS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.BIOSECURITY_AUDITS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.BIOSECURITY_INCIDENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.MARKETING_ALERTS, JSON.stringify([]));

    // Clear logo collections from landing CMS config if stored, keeping text intact
    const landingStr = localStorage.getItem(STORAGE_KEYS.LANDING);
    if (landingStr) {
      try {
        const landing = JSON.parse(landingStr);
        landing.footerLogos = [];
        landing.officialLogos = [];
        landing.mediaItems = [];
        localStorage.setItem(STORAGE_KEYS.LANDING, JSON.stringify(landing));
      } catch {
        // ignore
      }
    }
    localStorage.setItem('da_records_emptied_sept2026_v1', 'true');
  }
} catch {
  // ignore
}

export const storageService = {
  // Empty all records utility while keeping all text, accounts, and barangays
  emptyAllRecordsExceptText(): void {
    setItem(STORAGE_KEYS.SWINE, []);
    setItem(STORAGE_KEYS.CERT_ISSUED, []);
    setItem(STORAGE_KEYS.TAKEOFF_RECORDS, []);
    setItem(STORAGE_KEYS.BIOSECURITY_AUDITS, []);
    setItem(STORAGE_KEYS.BIOSECURITY_INCIDENTS, []);
    setItem(STORAGE_KEYS.MARKETING_ALERTS, []);
    const landing = this.getLandingConfig();
    landing.footerLogos = [];
    landing.officialLogos = [];
    landing.mediaItems = [];
    this.saveLandingConfig(landing);
  },

  // Simulated offline mode toggle for testing
  getSimulatedOffline(): boolean {
    return getItem<boolean>(STORAGE_KEYS.SIMULATED_OFFLINE, false);
  },

  setSimulatedOffline(status: boolean): void {
    setItem(STORAGE_KEYS.SIMULATED_OFFLINE, status);
    window.dispatchEvent(new CustomEvent('da_connectivity_change', { detail: { isSimulatedOffline: status } }));
  },

  isEffectiveOffline(): boolean {
    if (this.getSimulatedOffline()) return true;
    return typeof navigator !== 'undefined' && !navigator.onLine;
  },

  // Swine Records
  getSwineRecords(): SwineRecord[] {
    const stored = getItem<SwineRecord[] | null>(STORAGE_KEYS.SWINE, null);
    if (stored === null) {
      setItem(STORAGE_KEYS.SWINE, INITIAL_SWINE_RECORDS);
      return INITIAL_SWINE_RECORDS;
    }
    // Existing Data Compatibility: Normalize legacy 11-digit formatted contacts (e.g. 0917-888-9999 -> 09178889999)
    let hasNormalized = false;
    const normalized = stored.map(record => {
      if (record.farmerContact && typeof record.farmerContact === 'string') {
        const digits = record.farmerContact.replace(/\D/g, '');
        if (digits.length === 11 && record.farmerContact !== digits) {
          hasNormalized = true;
          return { ...record, farmerContact: digits };
        }
      }
      return record;
    });

    if (hasNormalized) {
      setItem(STORAGE_KEYS.SWINE, normalized);
    }
    return normalized;
  },

  saveSwineRecords(records: SwineRecord[]): void {
    setItem(STORAGE_KEYS.SWINE, records);
  },

  addSwineRecord(record: SwineRecord): void {
    // Backend/Database Layer Validation: Contact number must be exactly 11 numeric digits
    if (!record.farmerContact || typeof record.farmerContact !== 'string' || !/^\d{11}$/.test(record.farmerContact)) {
      throw new Error('Contact number must contain exactly 11 digits.');
    }

    const records = this.getSwineRecords();
    const isOffline = this.isEffectiveOffline();
    const newRecord: SwineRecord = {
      ...record,
      farmerContact: record.farmerContact.trim(),
      isSynced: !isOffline,
      updatedAt: new Date().toISOString(),
    };
    records.unshift(newRecord);
    this.saveSwineRecords(records);

    // Sync to backend API if reachable
    if (!isOffline && typeof fetch !== 'undefined') {
      fetch('/api/swine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      }).catch(() => {});
    }

    if (isOffline) {
      this.enqueueOfflineAction({
        id: 'queue-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        action: 'create',
        entity: 'swine',
        data: newRecord,
        timestamp: new Date().toISOString(),
      });
    }
  },

  updateSwineRecord(updated: SwineRecord): void {
    // Backend/Database Layer Validation: Contact number must be exactly 11 numeric digits
    if (!updated.farmerContact || typeof updated.farmerContact !== 'string' || !/^\d{11}$/.test(updated.farmerContact)) {
      throw new Error('Contact number must contain exactly 11 digits.');
    }

    const records = this.getSwineRecords();
    const isOffline = this.isEffectiveOffline();
    const index = records.findIndex(r => r.id === updated.id);
    if (index !== -1) {
      records[index] = {
        ...updated,
        farmerContact: updated.farmerContact.trim(),
        isSynced: !isOffline,
        updatedAt: new Date().toISOString(),
      };
      this.saveSwineRecords(records);

      if (!isOffline && typeof fetch !== 'undefined') {
        fetch(`/api/swine/${updated.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(records[index]),
        }).catch(() => {});
      }

      if (isOffline) {
        this.enqueueOfflineAction({
          id: 'queue-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          action: 'update',
          entity: 'swine',
          data: records[index],
          timestamp: new Date().toISOString(),
        });
      }
    }
  },

  deleteSwineRecord(id: string): void {
    const records = this.getSwineRecords();
    const filtered = records.filter(r => r.id !== id);
    this.saveSwineRecords(filtered);

    if (this.isEffectiveOffline()) {
      this.enqueueOfflineAction({
        id: 'queue-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        action: 'delete',
        entity: 'swine',
        data: { id },
        timestamp: new Date().toISOString(),
      });
    }
  },

  toggleSellStatus(id: string, readyToSell: boolean): void {
    const records = this.getSwineRecords();
    const item = records.find(r => r.id === id);
    if (item) {
      item.readyToSell = readyToSell;
      if (readyToSell && item.status !== 'ready_to_sell') {
        item.status = 'ready_to_sell';
      } else if (!readyToSell && item.status === 'ready_to_sell') {
        item.status = 'healthy';
      }
      this.updateSwineRecord(item);
    }
  },

  markAsSold(id: string): void {
    const records = this.getSwineRecords();
    const item = records.find(r => r.id === id);
    if (item) {
      item.status = 'sold';
      item.readyToSell = false;
      this.updateSwineRecord(item);
    }
  },

  toggleArchiveStatus(id: string): void {
    const records = this.getSwineRecords();
    const item = records.find(r => r.id === id);
    if (item) {
      item.isArchived = !item.isArchived;
      this.updateSwineRecord(item);
    }
  },

  // Barangays
  getBarangays(): Barangay[] {
    const stored = getItem<Barangay[] | null>(STORAGE_KEYS.BARANGAYS, null);
    if (!stored || stored.length < 40) {
      setItem(STORAGE_KEYS.BARANGAYS, INITIAL_BARANGAYS);
      return INITIAL_BARANGAYS;
    }
    // Ensure accurate coordinates from INITIAL_BARANGAYS are preserved
    const updated = stored.map(b => {
      const official = INITIAL_BARANGAYS.find(ib => ib.name.toLowerCase() === b.name.toLowerCase());
      if (official && (b.latitude !== official.latitude || b.longitude !== official.longitude)) {
        return { ...b, latitude: official.latitude, longitude: official.longitude };
      }
      return b;
    });
    return updated;
  },

  saveBarangays(barangays: Barangay[]): void {
    setItem(STORAGE_KEYS.BARANGAYS, barangays);
  },

  // Accounts
  getAccounts(): UserAccount[] {
    const stored = getItem<UserAccount[] | null>(STORAGE_KEYS.ACCOUNTS, null);
    if (!stored || stored.length === 0) {
      setItem(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
      return INITIAL_ACCOUNTS;
    }
    return stored;
  },

  saveAccounts(accounts: UserAccount[]): void {
    setItem(STORAGE_KEYS.ACCOUNTS, accounts);
  },

  saveUserAccount(account: UserAccount): void {
    const list = this.getAccounts();
    const idx = list.findIndex(a => a.id === account.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...account };
    } else {
      list.push(account);
    }
    this.saveAccounts(list);
  },

  deleteUserAccount(id: string): void {
    const list = this.getAccounts().filter(a => a.id !== id);
    this.saveAccounts(list);
  },

  saveBarangay(barangay: Barangay): void {
    const list = this.getBarangays();
    const idx = list.findIndex(b => b.id === barangay.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...barangay };
    } else {
      list.push(barangay);
    }
    this.saveBarangays(list);
  },

  deleteBarangay(id: string): void {
    const list = this.getBarangays().filter(b => b.id !== id);
    this.saveBarangays(list);
  },

  saveDynamicField(field: DynamicFormField): void {
    const list = this.getDynamicFields();
    const idx = list.findIndex(f => f.id === field.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...field };
    } else {
      list.push(field);
    }
    this.saveDynamicFields(list);
  },

  deleteDynamicField(id: string): void {
    const list = this.getDynamicFields().filter(f => f.id !== id);
    this.saveDynamicFields(list);
  },

  sendMessage(msg: MessageItem): void {
    const item: MessageItem = {
      ...msg,
      targetBarangay: msg.targetBarangay || msg.recipientBarangay || 'all',
      recipientBarangay: msg.recipientBarangay || msg.targetBarangay || 'all',
      isRead: false,
    };
    this.addMessage(item);
  },

  markMessageAsRead(id: string, userId?: string): void {
    const list = this.getMessages();
    const item = list.find(m => m.id === id);
    if (item) {
      item.isRead = true;
      if (userId) {
        if (!item.readBy) item.readBy = [];
        if (!item.readBy.includes(userId)) {
          item.readBy.push(userId);
        }
      }
      this.saveMessages(list);
    }
  },

  exportFullBackup(): any {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      swine: this.getSwineRecords(),
      barangays: this.getBarangays(),
      accounts: this.getAccounts(),
      messages: this.getMessages(),
      certConfig: this.getCertificateConfig(),
      issuedCertificates: this.getIssuedCertificates(),
      landingConfig: this.getLandingConfig(),
      dynamicFields: this.getDynamicFields(),
      biosecurityAudits: this.getBiosecurityAudits(),
      biosecurityIncidents: this.getBiosecurityIncidents(),
      marketingAlerts: this.getMarketingAlerts(),
      takeoffRecords: this.getTakeoffRecords(),
    };
  },

  restoreFullBackup(data: any): boolean {
    try {
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      if (data.swine) setItem(STORAGE_KEYS.SWINE, data.swine);
      if (data.barangays) setItem(STORAGE_KEYS.BARANGAYS, data.barangays);
      if (data.accounts) setItem(STORAGE_KEYS.ACCOUNTS, data.accounts);
      if (data.messages) setItem(STORAGE_KEYS.MESSAGES, data.messages);
      if (data.certConfig) setItem(STORAGE_KEYS.CERT_CONFIG, data.certConfig);
      if (data.issuedCertificates) setItem(STORAGE_KEYS.CERT_ISSUED, data.issuedCertificates);
      if (data.landingConfig) setItem(STORAGE_KEYS.LANDING, data.landingConfig);
      if (data.dynamicFields) setItem(STORAGE_KEYS.DYNAMIC_FORM, data.dynamicFields);
      if (data.biosecurityAudits) setItem(STORAGE_KEYS.BIOSECURITY_AUDITS, data.biosecurityAudits);
      if (data.biosecurityIncidents) setItem(STORAGE_KEYS.BIOSECURITY_INCIDENTS, data.biosecurityIncidents);
      if (data.marketingAlerts) setItem(STORAGE_KEYS.MARKETING_ALERTS, data.marketingAlerts);
      if (data.takeoffRecords) setItem(STORAGE_KEYS.TAKEOFF_RECORDS, data.takeoffRecords);
      return true;
    } catch (err) {
      console.error('Failed to restore backup:', err);
      return false;
    }
  },

  getCurrentUser(): UserAccount | null {
    return getItem<UserAccount | null>(STORAGE_KEYS.CURRENT_USER, null);
  },

  setCurrentUser(user: UserAccount | null): void {
    setItem(STORAGE_KEYS.CURRENT_USER, user);
  },

  // Messages
  getMessages(): MessageItem[] {
    const stored = getItem<MessageItem[] | null>(STORAGE_KEYS.MESSAGES, null);
    const raw = (!stored || stored.length === 0) ? INITIAL_MESSAGES : stored;
    return raw.map(m => ({
      ...m,
      subject: m.subject || m.title || 'Official Advisory',
      title: m.title || m.subject || 'Official Advisory',
      body: m.body || m.content || '',
      content: m.content || m.body || '',
      recipientBarangay: m.recipientBarangay || m.targetBarangay || 'all',
      targetBarangay: m.targetBarangay || m.recipientBarangay || 'all',
      timestamp: m.timestamp || m.createdAt || new Date().toISOString(),
      createdAt: m.createdAt || m.timestamp || new Date().toISOString(),
      priority: m.priority || 'normal',
      senderName: m.senderName || 'Municipal Agriculture Office',
      readBy: m.readBy || [],
      isRead: m.isRead ?? false,
    }));
  },

  saveMessages(messages: MessageItem[]): void {
    setItem(STORAGE_KEYS.MESSAGES, messages);
  },

  addMessage(msg: MessageItem): void {
    const messages = this.getMessages();
    messages.unshift(msg);
    this.saveMessages(messages);

    if (this.isEffectiveOffline()) {
      this.enqueueOfflineAction({
        id: 'queue-' + Date.now(),
        action: 'create',
        entity: 'message',
        data: msg,
        timestamp: new Date().toISOString(),
      });
    }
  },

  // Certificate Config & Issued
  getCertificateConfig(): CertificateConfig {
    return getItem<CertificateConfig>(STORAGE_KEYS.CERT_CONFIG, INITIAL_CERTIFICATE_CONFIG);
  },

  saveCertificateConfig(config: CertificateConfig): void {
    setItem(STORAGE_KEYS.CERT_CONFIG, config);
  },

  getIssuedCertificates(): IssuedCertificate[] {
    return getItem<IssuedCertificate[]>(STORAGE_KEYS.CERT_ISSUED, []);
  },

  saveIssuedCertificates(list: IssuedCertificate[]): void {
    setItem(STORAGE_KEYS.CERT_ISSUED, list);
  },

  deleteIssuedCertificate(certNo: string): void {
    const list = this.getIssuedCertificates().filter(c => c.certificateNo !== certNo);
    this.saveIssuedCertificates(list);
  },

  updateIssuedCertificate(cert: IssuedCertificate): void {
    const list = this.getIssuedCertificates();
    const idx = list.findIndex(c => c.certificateNo === cert.certificateNo);
    if (idx !== -1) {
      list[idx] = cert;
      this.saveIssuedCertificates(list);
    }
  },

  issueCertificate(cert: IssuedCertificate): void {
    const list = this.getIssuedCertificates();
    list.unshift(cert);
    setItem(STORAGE_KEYS.CERT_ISSUED, list);

    if (this.isEffectiveOffline()) {
      this.enqueueOfflineAction({
        id: 'queue-' + Date.now(),
        action: 'create',
        entity: 'certificate',
        data: cert,
        timestamp: new Date().toISOString(),
      });
    }
  },

  // Landing Page Customization
  getLandingConfig(): LandingPageConfig {
    return getItem<LandingPageConfig>(STORAGE_KEYS.LANDING, INITIAL_LANDING_CONFIG);
  },

  saveLandingConfig(config: LandingPageConfig): void {
    setItem(STORAGE_KEYS.LANDING, config);
  },

  // Dynamic Form Config
  getDynamicFields(): DynamicFormField[] {
    const stored = getItem<DynamicFormField[] | null>(STORAGE_KEYS.DYNAMIC_FORM, null);
    if (!stored || stored.length === 0) {
      setItem(STORAGE_KEYS.DYNAMIC_FORM, INITIAL_DYNAMIC_FIELDS);
      return INITIAL_DYNAMIC_FIELDS;
    }
    return stored;
  },

  saveDynamicFields(fields: DynamicFormField[]): void {
    setItem(STORAGE_KEYS.DYNAMIC_FORM, fields);
  },

  // Offline Queue
  getOfflineQueue(): OfflineQueueItem[] {
    return getItem<OfflineQueueItem[]>(STORAGE_KEYS.OFFLINE_QUEUE, []);
  },

  enqueueOfflineAction(item: OfflineQueueItem): void {
    const queue = this.getOfflineQueue();
    queue.push(item);
    setItem(STORAGE_KEYS.OFFLINE_QUEUE, queue);
    window.dispatchEvent(new CustomEvent('da_offline_queue_update', { detail: { count: queue.length } }));
  },

  clearOfflineQueue(): void {
    setItem(STORAGE_KEYS.OFFLINE_QUEUE, []);
    window.dispatchEvent(new CustomEvent('da_offline_queue_update', { detail: { count: 0 } }));
  },

  // Sync Offline Queue
  syncOfflineQueue(): { success: boolean; syncedCount: number } {
    const queue = this.getOfflineQueue();
    if (queue.length === 0) return { success: true, syncedCount: 0 };

    // Mark all existing swine records as synced
    const swine = this.getSwineRecords();
    const updatedSwine = swine.map(s => ({ ...s, isSynced: true }));
    this.saveSwineRecords(updatedSwine);

    const count = queue.length;
    this.clearOfflineQueue();
    return { success: true, syncedCount: count };
  },

  // Barangay Biosecurity Audits
  getBiosecurityAudits(): BarangayBiosecurityAudit[] {
    const stored = getItem<BarangayBiosecurityAudit[] | null>(STORAGE_KEYS.BIOSECURITY_AUDITS, null);
    if (stored === null) {
      setItem(STORAGE_KEYS.BIOSECURITY_AUDITS, INITIAL_BIOSECURITY_AUDITS);
      return INITIAL_BIOSECURITY_AUDITS;
    }
    return stored;
  },

  saveBiosecurityAudits(audits: BarangayBiosecurityAudit[]): void {
    setItem(STORAGE_KEYS.BIOSECURITY_AUDITS, audits);
  },

  saveBiosecurityAudit(audit: BarangayBiosecurityAudit): void {
    const list = this.getBiosecurityAudits();
    const idx = list.findIndex(a => a.id === audit.id || a.barangay.toLowerCase() === audit.barangay.toLowerCase());
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...audit, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...audit, updatedAt: new Date().toISOString() });
    }
    this.saveBiosecurityAudits(list);
  },

  deleteBiosecurityAudit(id: string): void {
    const list = this.getBiosecurityAudits().filter(a => a.id !== id);
    this.saveBiosecurityAudits(list);
  },

  // Biosecurity Incidents
  getBiosecurityIncidents(): BiosecurityIncident[] {
    const stored = getItem<BiosecurityIncident[] | null>(STORAGE_KEYS.BIOSECURITY_INCIDENTS, null);
    if (stored === null) {
      setItem(STORAGE_KEYS.BIOSECURITY_INCIDENTS, INITIAL_BIOSECURITY_INCIDENTS);
      return INITIAL_BIOSECURITY_INCIDENTS;
    }
    return stored;
  },

  saveBiosecurityIncidents(incidents: BiosecurityIncident[]): void {
    setItem(STORAGE_KEYS.BIOSECURITY_INCIDENTS, incidents);
  },

  addBiosecurityIncident(incident: BiosecurityIncident): void {
    const list = this.getBiosecurityIncidents();
    list.unshift({ ...incident, updatedAt: new Date().toISOString() });
    this.saveBiosecurityIncidents(list);
  },

  updateBiosecurityIncident(updated: BiosecurityIncident): void {
    const list = this.getBiosecurityIncidents();
    const idx = list.findIndex(i => i.id === updated.id);
    if (idx >= 0) {
      list[idx] = { ...updated, updatedAt: new Date().toISOString() };
      this.saveBiosecurityIncidents(list);
    }
  },

  // Swine Marketing Alerts
  getMarketingAlerts(): MarketingAlert[] {
    const stored = getItem<MarketingAlert[] | null>(STORAGE_KEYS.MARKETING_ALERTS, null);
    if (stored === null) {
      setItem(STORAGE_KEYS.MARKETING_ALERTS, INITIAL_MARKETING_ALERTS);
      return INITIAL_MARKETING_ALERTS;
    }
    return stored;
  },

  saveMarketingAlerts(alerts: MarketingAlert[]): void {
    setItem(STORAGE_KEYS.MARKETING_ALERTS, alerts);
  },

  addMarketingAlert(alert: MarketingAlert): void {
    const list = this.getMarketingAlerts();
    list.unshift(alert);
    this.saveMarketingAlerts(list);
  },

  updateMarketingAlert(alert: MarketingAlert): void {
    const list = this.getMarketingAlerts();
    const idx = list.findIndex(a => a.id === alert.id);
    if (idx >= 0) {
      list[idx] = alert;
      this.saveMarketingAlerts(list);
    }
  },

  toggleMarketingAlertStatus(id: string): void {
    const list = this.getMarketingAlerts();
    const item = list.find(a => a.id === id);
    if (item) {
      item.isActive = !item.isActive;
      this.saveMarketingAlerts(list);
    }
  },

  deleteMarketingAlert(id: string): void {
    const list = this.getMarketingAlerts().filter(a => a.id !== id);
    this.saveMarketingAlerts(list);
  },

  // Swine Take-Off Records
  getTakeoffRecords(): SwineTakeoffRecord[] {
    const stored = getItem<SwineTakeoffRecord[] | null>(STORAGE_KEYS.TAKEOFF_RECORDS, null);
    if (stored === null) {
      setItem(STORAGE_KEYS.TAKEOFF_RECORDS, INITIAL_TAKEOFF_RECORDS);
      return INITIAL_TAKEOFF_RECORDS;
    }
    return stored;
  },

  saveTakeoffRecords(records: SwineTakeoffRecord[]): void {
    setItem(STORAGE_KEYS.TAKEOFF_RECORDS, records);
  },

  addTakeoffRecord(record: SwineTakeoffRecord): void {
    const list = this.getTakeoffRecords();
    list.unshift(record);
    this.saveTakeoffRecords(list);
  },

  updateTakeoffRecord(record: SwineTakeoffRecord): void {
    const list = this.getTakeoffRecords();
    const idx = list.findIndex(r => r.id === record.id);
    if (idx >= 0) {
      list[idx] = { ...record, updatedAt: new Date().toISOString() };
      this.saveTakeoffRecords(list);
    }
  },

  deleteTakeoffRecord(id: string): void {
    const list = this.getTakeoffRecords().filter(r => r.id !== id);
    this.saveTakeoffRecords(list);
  },

  // African Swine Fever (ASF) Regulations & Executive Orders
  getAsfRegulations(): ASFRegulatoryDocument[] {
    const stored = getItem<ASFRegulatoryDocument[] | null>(STORAGE_KEYS.ASF_REGULATIONS, null);
    if (!stored || stored.length === 0) {
      setItem(STORAGE_KEYS.ASF_REGULATIONS, ALL_ASF_REGULATIONS);
      return ALL_ASF_REGULATIONS;
    }
    return stored;
  },

  saveAsfRegulations(docs: ASFRegulatoryDocument[]): void {
    setItem(STORAGE_KEYS.ASF_REGULATIONS, docs);
  },

  updateAsfRegulation(doc: ASFRegulatoryDocument): void {
    const list = this.getAsfRegulations();
    const idx = list.findIndex(d => d.id === doc.id);
    if (idx >= 0) {
      list[idx] = doc;
    } else {
      list.push(doc);
    }
    this.saveAsfRegulations(list);
  },

  addAsfRegulation(doc: ASFRegulatoryDocument): void {
    const list = this.getAsfRegulations();
    list.push(doc);
    this.saveAsfRegulations(list);
  },

  deleteAsfRegulation(id: string): void {
    const list = this.getAsfRegulations().filter(d => d.id !== id);
    this.saveAsfRegulations(list);
  },

  resetAsfRegulations(): ASFRegulatoryDocument[] {
    setItem(STORAGE_KEYS.ASF_REGULATIONS, ALL_ASF_REGULATIONS);
    return ALL_ASF_REGULATIONS;
  },

  // Sidebar Theme Customization
  getSidebarTheme(): SidebarTheme {
    return getItem<SidebarTheme>(STORAGE_KEYS.SIDEBAR_THEME, DEFAULT_SIDEBAR_THEME);
  },

  saveSidebarTheme(theme: SidebarTheme): void {
    setItem(STORAGE_KEYS.SIDEBAR_THEME, theme);
    window.dispatchEvent(new CustomEvent('da_sidebar_theme_change', { detail: theme }));
  },

  resetSidebarTheme(): SidebarTheme {
    setItem(STORAGE_KEYS.SIDEBAR_THEME, DEFAULT_SIDEBAR_THEME);
    window.dispatchEvent(new CustomEvent('da_sidebar_theme_change', { detail: DEFAULT_SIDEBAR_THEME }));
    return DEFAULT_SIDEBAR_THEME;
  },

  // Registry Form Customization Schema
  getRegistryFormSchema(): RegistryFormSchema {
    const stored = getItem<RegistryFormSchema | null>(STORAGE_KEYS.REGISTRY_FORM_SCHEMA, null);
    if (!stored || !stored.sections || stored.sections.length === 0) {
      setItem(STORAGE_KEYS.REGISTRY_FORM_SCHEMA, INITIAL_REGISTRY_FORM_SCHEMA);
      return INITIAL_REGISTRY_FORM_SCHEMA;
    }
    return stored;
  },

  saveRegistryFormSchema(schema: RegistryFormSchema): void {
    const published = {
      ...schema,
      isPublished: true,
      lastUpdated: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.REGISTRY_FORM_SCHEMA, published);
    // Also update draft to match published
    setItem(STORAGE_KEYS.REGISTRY_FORM_SCHEMA_DRAFT, published);
    window.dispatchEvent(new CustomEvent('da_registry_schema_change', { detail: published }));
    if (typeof fetch !== 'undefined') {
      fetch('/api/registry-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(published),
      }).catch(() => {});
    }
  },

  getRegistryFormDraft(): RegistryFormSchema {
    const draft = getItem<RegistryFormSchema | null>(STORAGE_KEYS.REGISTRY_FORM_SCHEMA_DRAFT, null);
    if (draft && draft.sections && draft.sections.length > 0) {
      return draft;
    }
    return this.getRegistryFormSchema();
  },

  saveRegistryFormDraft(schema: RegistryFormSchema): void {
    const updated = {
      ...schema,
      lastUpdated: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.REGISTRY_FORM_SCHEMA_DRAFT, updated);
    // Ensure the main form schema is synchronized immediately with latest admin customization settings
    setItem(STORAGE_KEYS.REGISTRY_FORM_SCHEMA, updated);
    window.dispatchEvent(new CustomEvent('da_registry_schema_change', { detail: updated }));
    if (typeof fetch !== 'undefined') {
      fetch('/api/registry-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
    }
  },

  resetRegistryFormSchema(): RegistryFormSchema {
    setItem(STORAGE_KEYS.REGISTRY_FORM_SCHEMA, INITIAL_REGISTRY_FORM_SCHEMA);
    setItem(STORAGE_KEYS.REGISTRY_FORM_SCHEMA_DRAFT, INITIAL_REGISTRY_FORM_SCHEMA);
    window.dispatchEvent(new CustomEvent('da_registry_schema_change', { detail: INITIAL_REGISTRY_FORM_SCHEMA }));
    if (typeof fetch !== 'undefined') {
      fetch('/api/registry-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(INITIAL_REGISTRY_FORM_SCHEMA),
      }).catch(() => {});
    }
    return INITIAL_REGISTRY_FORM_SCHEMA;
  },

  // Backup and Restore
  exportAllData(): string {
    const fullBackup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      swine: this.getSwineRecords(),
      barangays: this.getBarangays(),
      accounts: this.getAccounts(),
      messages: this.getMessages(),
      certConfig: this.getCertificateConfig(),
      issuedCertificates: this.getIssuedCertificates(),
      landingConfig: this.getLandingConfig(),
      dynamicFields: this.getDynamicFields(),
    };
    return JSON.stringify(fullBackup, null, 2);
  },

  importAllData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.swine) setItem(STORAGE_KEYS.SWINE, data.swine);
      if (data.barangays) setItem(STORAGE_KEYS.BARANGAYS, data.barangays);
      if (data.accounts) setItem(STORAGE_KEYS.ACCOUNTS, data.accounts);
      if (data.messages) setItem(STORAGE_KEYS.MESSAGES, data.messages);
      if (data.certConfig) setItem(STORAGE_KEYS.CERT_CONFIG, data.certConfig);
      if (data.issuedCertificates) setItem(STORAGE_KEYS.CERT_ISSUED, data.issuedCertificates);
      if (data.landingConfig) setItem(STORAGE_KEYS.LANDING, data.landingConfig);
      if (data.dynamicFields) setItem(STORAGE_KEYS.DYNAMIC_FORM, data.dynamicFields);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  },

  resetToDefaults(): void {
    localStorage.clear();
    window.location.reload();
  },
};
