export type UserRole = 'admin' | 'focal' | 'agent';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  contactNo?: string;
  active?: boolean;
  assignedBarangay?: string; // required for focal person
  avatarUrl?: string;
  createdAt: string;
}

export type RiskLevel = 'green' | 'yellow' | 'red'; // ASF zoning: Green (Free), Yellow (Buffer), Red (Infected/Quarantine)

export interface Barangay {
  id: string;
  name: string;
  code: string;
  focalPersonId?: string;
  focalPersonName?: string;
  focalPerson?: string;
  contactNo?: string;
  contactNumber?: string;
  swineCount?: number;
  totalSwineCount?: number;
  latitude: number;
  longitude: number;
  riskLevel: RiskLevel;
  boundaryPolygon?: [number, number][]; // [latitude, longitude][] polygon coordinates
  boundaryPerimeterKm?: number; // Measured boundary perimeter in kilometers
  boundaryAreaHectares?: number; // Measured enclosed area in hectares
  surveillanceRadiusMeters?: number; // Biosecurity buffer / surveillance radius in meters
}

export type SwineStatus = 'healthy' | 'sick' | 'quarantined' | 'ready_to_sell' | 'sold' | 'deceased';
export type SwineType = 'grower' | 'finisher' | 'sow' | 'boar' | 'piglet';

export interface BiosecurityChecklist {
  perimeterFence: boolean;
  footbathInstalled: boolean;
  disinfectionRoutine: boolean;
  quarantinePenAvailable: boolean;
  potableWaterSource: boolean;
  standardFeedStorage: boolean;
  asfVaccinationOrTesting: boolean;
  noSwillFeeding: boolean;
  visitorLogbook: boolean;
  wasteLagoonOrCompost: boolean;
  [key: string]: boolean; // dynamic custom checkboxes
}

export interface SwineRecord {
  id: string;
  earTagNo: string;
  farmerName: string;
  farmerContact: string;
  farmerAddress: string;
  barangay: string;
  rsbsaId?: string; // Registry System for Basic Sectors in Agriculture
  farmType: 'backyard' | 'commercial';
  swineType: SwineType;
  breed: string;
  ageWeeks: number;
  weightKg: number;
  gender: 'male' | 'female' | 'castrated';
  photoUrl?: string;
  latitude: number;
  longitude: number;
  
  // 2. GIS Pen Coordinates & Setback Buffers (Municipal EO & Provincial Ordinance)
  distanceToWaterSourceMeters?: number; // Min required: >25m
  distanceToTourismSchoolMeters?: number; // Min required: >200m
  distanceToBuiltUpMeters?: number; // Min required: >50m
  setbackCompliant?: boolean;

  // Automated Swine Age & Weight calculation
  birthDate?: string;
  ageDays?: number;
  ageMonths?: number;
  heartGirthCm?: number;
  bodyLengthCm?: number;
  calculationMethod?: 'auto_matrix' | 'tape_formula' | 'manual';

  status: SwineStatus;
  readyToSell: boolean;
  targetSellDate?: string;
  estimatedPricePhp?: number;
  isArchived: boolean;
  biosecurity: BiosecurityChecklist;
  notes?: string;
  registeredBy: string;
  registeredAt: string;
  updatedAt: string;
  isSynced?: boolean;
}

export interface ASFRegulatoryDocument {
  id: string;
  type: 'provincial_ordinance' | 'municipal_eo';
  title: string;
  officialNumber: string;
  seriesYear: string;
  issuingAuthority: string;
  signatory: string;
  signatoryTitle: string;
  effectiveDate: string;
  shortSummary: string;
  legalBasis: string[];
  keyArticles: {
    number: string;
    heading: string;
    text: string;
    mandateCategory: 'mandatory' | 'prohibitive' | 'advisory';
  }[];
  setbackRules: {
    target: string;
    minimumDistance: number;
    statutoryBasis: string;
    rationale: string;
  }[];
  penalties: {
    offenseTier: string;
    finePhp: number;
    punitiveActions: string;
  }[];
}

export interface CertificateSignatory {
  id: string;
  name: string;
  title: string;
  office: string;
  order: number;
}

export interface CertificateTypeDefinition {
  id: string;
  name: string;
  title: string;
  formatType: 'biosecurity' | 'health' | 'origin' | 'slaughter' | 'registration' | 'custom';
  letterBody: string;
  termsAndConditions?: string[];
  signatories?: CertificateSignatory[];
  leftLogoUrl?: string;
  centerLogoUrl?: string;
  rightLogoUrl?: string;
}

export interface CertificateConfig {
  centerLogoUrl: string;
  lguLogoUrl: string;
  daLogoUrl: string;
  watermarkLogoUrl?: string;
  municipalityName: string;
  provinceName: string;
  officeName: string;
  certificateTitle: string;
  authorizedPerson: string;
  authorizedPersonTitle: string;
  letterBodyTemplate: string;
  termsAndConditions: string[];
  signatories: CertificateSignatory[];
  customCertificateTypes?: CertificateTypeDefinition[];
}

export interface IssuedCertificate {
  certificateNo: string;
  swineId: string;
  earTagNo: string;
  farmerName: string;
  buyerName?: string;
  destinationBarangay?: string;
  destinationMunicipality?: string;
  issueDate: string;
  validUntil: string;
  authorizedBy: string;
  status: 'active' | 'expired' | 'revoked';
  qrVerificationCode: string;
}

export interface MessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  targetBarangay: string; // 'all' or specific barangay name
  recipientBarangay?: string; // alias for targetBarangay
  recipientId?: string; // optional single focal person id
  recipientName?: string;
  title?: string;
  subject?: string;
  content?: string;
  body?: string;
  priority: 'normal' | 'advisory' | 'urgent';
  createdAt?: string;
  timestamp?: string;
  readBy?: string[]; // user ids that read this message
  isRead?: boolean;
}

export interface SocialMediaPost {
  id: string;
  title: string;
  content: string;
  date: string;
  imageUrl?: string;
  link?: string;
  author: string;
}

export interface LandingPageConfig {
  logoUrl: string;
  headerTitle: string;
  headerSubtitle: string;
  heroTitle?: string;
  heroSubtitle?: string;
  bannerNotice?: string;
  announcementText?: string;
  contactPhone?: string;
  contactEmail?: string;
  welcomeMessage: string;
  heroBannerUrl: string;
  themeColor: string; // hex
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
  lguFacebookUrl: string;
  daContactEmail: string;
  emergencyHotline: string;
  announcementAlert: string;
  socialPosts: SocialMediaPost[];
}

export interface DynamicFormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox';
  section: 'farmer' | 'swine' | 'biosecurity';
  required: boolean;
  options?: string[]; // for select
  defaultValue?: string | boolean;
  placeholder?: string;
  enabled?: boolean;
}

// Sidebar Appearance Customization
export interface SidebarTheme {
  id: string;
  name: string;
  backgroundColor: string;
  activeMenuColor: string;
  hoverColor: string;
  menuTextColor: string;
  activeTextColor: string;
  iconColor: string;
  sectionDividerColor: string;
  badgeColor: string;
  logoUrl?: string;
  logoShape?: 'circle' | 'rounded' | 'square';
  logoSize?: 'sm' | 'md' | 'lg';
}

// Registry Form Customization (Form Builder)
export type RegistryFieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'time'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'multiselect'
  | 'textarea'
  | 'file'
  | 'image'
  | 'location'
  | 'gps'
  | 'barangay_select'
  | 'breed_select'
  | 'yes_no';

export interface RegistryFormField {
  id: string;
  label: string;
  type: RegistryFieldType;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  visible: boolean;
  options?: string[]; // for dropdown, radio, checkbox, multiselect
  defaultValue?: string | number | boolean | string[];
}

export interface RegistryFormSection {
  id: string;
  title: string;
  description?: string;
  isCustom?: boolean;
  fields: RegistryFormField[];
}

export interface RegistryFormSchema {
  version: number;
  lastUpdated: string;
  updatedBy: string;
  sections: RegistryFormSection[];
  isPublished: boolean;
}

// Barangay Biosecurity Audit & Compliance
export interface BarangayBiosecurityAudit {
  id: string;
  barangay: string;
  auditDate: string;
  auditorName: string;
  biosecurityLevel: 1 | 2 | 3; // Level 1 (Basic), Level 2 (Standard Bio-risk Mitigation), Level 3 (Full Commercial Isolation)
  complianceScore: number; // 0 - 100%
  footbathsOperational: boolean;
  vehicleDisinfectionStation: boolean;
  quarantineCheckpointActive: boolean;
  deadSwineDisposalFacility: boolean;
  swillFeedingBanEnforced: boolean;
  visitorLogCompliance: boolean;
  waterChlorination: boolean;
  perimeterFencingAudit: boolean;
  asfZone: RiskLevel;
  status: 'compliant' | 'warning' | 'critical';
  notes: string;
  updatedAt: string;
}

export interface BiosecurityIncident {
  id: string;
  barangay: string;
  reportDate: string;
  type: 'suspected_symptoms' | 'illegal_entry' | 'swill_violation' | 'disinfection_failure' | 'mortality';
  severity: 'low' | 'medium' | 'high';
  description: string;
  reportedBy: string;
  actionTaken: string;
  resolved: boolean;
  updatedAt: string;
}

// Swine Marketing Alert System
export type MarketingAlertType = 'price_update' | 'buyer_demand' | 'slaughterhouse_quota' | 'market_day' | 'dispatch_call';

export interface MarketingAlert {
  id: string;
  title: string;
  type: MarketingAlertType;
  targetAudience: 'all' | 'farmers' | 'agents' | 'focal';
  targetBarangay: string; // 'all' or specific barangay name
  pricePerKg?: number;
  headsNeeded?: number;
  preferredWeightMin?: number;
  preferredWeightMax?: number;
  buyerName?: string;
  buyerContact?: string;
  urgency: 'normal' | 'high' | 'critical';
  validUntil: string;
  description: string;
  postedBy: string;
  createdAt: string;
  isActive: boolean;
}

// Swine Ready to Take-Off (Dispatch / Market Logistics)
export type TakeoffStatus = 'scheduled' | 'inspected' | 'cleared' | 'in_transit' | 'completed' | 'cancelled';

export interface SwineTakeoffRecord {
  id: string;
  swineId: string;
  earTagNo: string;
  farmerName: string;
  farmerAddress: string;
  barangay: string;
  swineType: SwineType;
  weightKg: number;
  estimatedPricePhp: number;
  buyerName: string;
  buyerContact: string;
  vehiclePlateNo: string;
  driverName?: string;
  destination: string; // e.g. "Hinunangan Public Abattoir", "Maasin City Livestock Market"
  scheduledDate: string;
  scheduledTime: string;
  status: TakeoffStatus;
  vhcNumber?: string; // Veterinary Health Certificate Number
  shippingPermitNo?: string;
  vehicleDisinfected: boolean;
  asfZoneCleared: boolean;
  earTagVerified: boolean;
  gatePassNo: string;
  inspectedBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfflineQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  entity: 'swine' | 'message' | 'certificate' | 'barangay' | 'biosecurity' | 'marketing_alert' | 'takeoff';
  data: unknown;
  timestamp: string;
}
