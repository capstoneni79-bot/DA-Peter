import {
  Barangay,
  BarangayBiosecurityAudit,
  BiosecurityIncident,
  CertificateConfig,
  DynamicFormField,
  LandingPageConfig,
  MarketingAlert,
  MessageItem,
  SwineRecord,
  SwineTakeoffRecord,
  UserAccount,
} from '../types';

export const INITIAL_BARANGAYS: Barangay[] = [
  { id: 'brgy-1', name: 'Poblacion', code: 'POB', latitude: 10.4035, longitude: 125.2005, riskLevel: 'green', focalPersonName: 'Maria Santos', contactNumber: '0917-123-4501' },
  { id: 'brgy-2', name: 'Labrador', code: 'LAB', latitude: 10.3950, longitude: 125.2100, riskLevel: 'green', focalPersonName: 'Juan Dela Cruz', contactNumber: '0918-234-5602' },
  { id: 'brgy-3', name: 'Calag-itan', code: 'CAL', latitude: 10.4350, longitude: 125.1850, riskLevel: 'yellow', focalPersonName: 'Rodrigo Balagao', contactNumber: '0919-345-6703' },
  { id: 'brgy-4', name: 'Canipaan', code: 'CAN', latitude: 10.4280, longitude: 125.2120, riskLevel: 'green', focalPersonName: 'Elena Ramos', contactNumber: '0920-456-7804' },
  { id: 'brgy-5', name: 'Bangcas A', code: 'BCA', latitude: 10.4120, longitude: 125.1950, riskLevel: 'green', focalPersonName: 'Crispin Oclarit', contactNumber: '0921-567-8905' },
  { id: 'brgy-6', name: 'Bangcas B', code: 'BCB', latitude: 10.4180, longitude: 125.1980, riskLevel: 'green', focalPersonName: 'Nenita Cadeliña', contactNumber: '0922-678-9006' },
  { id: 'brgy-7', name: 'Biasong', code: 'BIA', latitude: 10.3850, longitude: 125.1950, riskLevel: 'green', focalPersonName: 'Arman Kuizon', contactNumber: '0923-789-0107' },
  { id: 'brgy-8', name: 'Bitoon', code: 'BIT', latitude: 10.4080, longitude: 125.2150, riskLevel: 'green', focalPersonName: 'Lito Gervacio', contactNumber: '0924-890-1208' },
  { id: 'brgy-9', name: 'Catublian', code: 'CAT', latitude: 10.4450, longitude: 125.1920, riskLevel: 'yellow', focalPersonName: 'Grace Abanador', contactNumber: '0925-901-2309' },
  { id: 'brgy-10', name: 'Ilag', code: 'ILG', latitude: 10.3920, longitude: 125.2200, riskLevel: 'green', focalPersonName: 'Benito Tan', contactNumber: '0926-012-3410' },
  { id: 'brgy-11', name: 'Ingan', code: 'ING', latitude: 10.4200, longitude: 125.1800, riskLevel: 'green', focalPersonName: 'Marilou Pates', contactNumber: '0927-123-4511' },
  { id: 'brgy-12', name: 'Lumber', code: 'LUM', latitude: 10.4010, longitude: 125.1920, riskLevel: 'green', focalPersonName: 'Felipe Alcantara', contactNumber: '0928-234-5612' },
  { id: 'brgy-13', name: 'Nava', code: 'NAV', latitude: 10.4400, longitude: 125.2050, riskLevel: 'green', focalPersonName: 'Teresita Go', contactNumber: '0929-345-6713' },
  { id: 'brgy-14', name: 'Otikon', code: 'OTI', latitude: 10.4250, longitude: 125.2250, riskLevel: 'green', focalPersonName: 'Ramon Salazar', contactNumber: '0930-456-7814' },
  { id: 'brgy-15', name: 'Pandan', code: 'PAN', latitude: 10.3980, longitude: 125.2080, riskLevel: 'green', focalPersonName: 'Clara Montejo', contactNumber: '0931-567-8915' },
  { id: 'brgy-16', name: 'Pondol', code: 'PON', latitude: 10.4070, longitude: 125.2040, riskLevel: 'green', focalPersonName: 'Dario Mendoza', contactNumber: '0932-678-9016' },
  { id: 'brgy-17', name: 'San Bernardo', code: 'SBE', latitude: 10.3800, longitude: 125.2050, riskLevel: 'green', focalPersonName: 'Amparo Dizon', contactNumber: '0933-789-0117' },
  { id: 'brgy-18', name: 'Tahusan', code: 'TAH', latitude: 10.4480, longitude: 125.2200, riskLevel: 'green', focalPersonName: 'Danilo Flores', contactNumber: '0934-890-1218' },
  { id: 'brgy-19', name: 'Talisay', code: 'TAL', latitude: 10.4050, longitude: 125.1980, riskLevel: 'green', focalPersonName: 'Gloria Baclayon', contactNumber: '0935-901-2319' },
  { id: 'brgy-20', name: 'Tuburan', code: 'TUB', latitude: 10.4180, longitude: 125.2030, riskLevel: 'green', focalPersonName: 'Vicente Espina', contactNumber: '0936-012-3420' },
];

export const INITIAL_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr-admin-1',
    username: 'admin',
    name: 'Engr. Arnel M. Vasquez',
    email: 'admin@hinunangan.da.gov.ph',
    password: 'admin',
    role: 'admin',
    phone: '0917-888-9999',
    createdAt: '2025-01-10T08:00:00Z',
  },
  {
    id: 'usr-focal-labrador',
    username: 'focal_labrador',
    name: 'Juan B. Dela Cruz',
    email: 'labrador.focal@hinunangan.da.gov.ph',
    password: 'password123',
    role: 'focal',
    assignedBarangay: 'Labrador',
    phone: '0918-234-5602',
    createdAt: '2025-01-15T09:30:00Z',
  },
  {
    id: 'usr-focal-poblacion',
    username: 'focal_poblacion',
    name: 'Maria L. Santos',
    email: 'poblacion.focal@hinunangan.da.gov.ph',
    password: 'password123',
    role: 'focal',
    assignedBarangay: 'Poblacion',
    phone: '0917-123-4501',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'usr-focal-canipaan',
    username: 'focal_canipaan',
    name: 'Elena T. Ramos',
    email: 'canipaan.focal@hinunangan.da.gov.ph',
    password: 'password123',
    role: 'focal',
    assignedBarangay: 'Canipaan',
    phone: '0920-456-7804',
    createdAt: '2025-01-18T11:00:00Z',
  },
  {
    id: 'usr-agent-1',
    username: 'agent_hinunangan',
    name: 'Ricardo S. Mercado',
    email: 'mercado.trader@gmail.com',
    password: 'password123',
    role: 'agent',
    phone: '0928-555-1234',
    createdAt: '2025-02-01T08:15:00Z',
  },
];

export const INITIAL_SWINE_RECORDS: SwineRecord[] = [];

export const INITIAL_MESSAGES: MessageItem[] = [
  {
    id: 'msg-001',
    senderId: 'usr-admin-1',
    senderName: 'Engr. Arnel M. Vasquez (Admin/MAO)',
    senderRole: 'admin',
    targetBarangay: 'all',
    recipientBarangay: 'all',
    title: 'Advisory: Strict ASF Inspection Protocol in Hinunangan Checkpoints',
    subject: 'Advisory: Strict ASF Inspection Protocol in Hinunangan Checkpoints',
    content: 'All Barangay Focal Persons are directed to inspect all transit hog batches. Disinfection stations at Labrador and Calag-itan entry points remain mandatory.',
    body: 'All Barangay Focal Persons are directed to inspect all transit hog batches. Disinfection stations at Labrador and Calag-itan entry points remain mandatory.',
    priority: 'urgent',
    createdAt: '2026-09-14T08:30:00Z',
    timestamp: '2026-09-14T08:30:00Z',
    readBy: ['usr-focal-labrador', 'usr-focal-poblacion'],
    isRead: false,
  },
  {
    id: 'msg-002',
    senderId: 'usr-admin-1',
    senderName: 'Engr. Arnel M. Vasquez (Admin/MAO)',
    senderRole: 'admin',
    targetBarangay: 'Labrador',
    recipientBarangay: 'Labrador',
    recipientId: 'usr-focal-labrador',
    recipientName: 'Juan B. Dela Cruz',
    title: 'Upcoming Slaughterhouse Inspection for Labrador Ready Swine',
    subject: 'Upcoming Slaughterhouse Inspection for Labrador Ready Swine',
    content: 'Please verify the weight and ear tag numbers of swine records HN-LAB-2025-001 and 002 for the prospective market buyer tomorrow.',
    body: 'Please verify the weight and ear tag numbers of swine records HN-LAB-2025-001 and 002 for the prospective market buyer tomorrow.',
    priority: 'advisory',
    createdAt: '2026-09-15T10:15:00Z',
    timestamp: '2026-09-15T10:15:00Z',
    readBy: ['usr-focal-labrador'],
    isRead: false,
  },
  {
    id: 'msg-003',
    senderId: 'usr-focal-labrador',
    senderName: 'Juan B. Dela Cruz (Focal Person - Labrador)',
    senderRole: 'focal',
    targetBarangay: 'all',
    recipientBarangay: 'all',
    title: 'Biosecurity Verification Complete in Purok 2 Labrador',
    subject: 'Biosecurity Verification Complete in Purok 2 Labrador',
    content: 'Fencing and footbath disinfection compliance has reached 100% among our registered backyard hog raisers this quarter.',
    body: 'Fencing and footbath disinfection compliance has reached 100% among our registered backyard hog raisers this quarter.',
    priority: 'normal',
    createdAt: '2026-09-16T14:00:00Z',
    timestamp: '2026-09-16T14:00:00Z',
    readBy: ['usr-admin-1'],
    isRead: false,
  },
];

export const INITIAL_CERTIFICATE_CONFIG: CertificateConfig = {
  centerLogoUrl: '/icon.svg',
  lguLogoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=200&q=80',
  daLogoUrl: '/icon.svg',
  municipalityName: 'MUNICIPALITY OF HINUNANGAN',
  provinceName: 'PROVINCE OF SOUTHERN LEYTE',
  officeName: 'OFFICE OF THE MUNICIPAL AGRICULTURIST',
  certificateTitle: 'BARANGAY CERTIFICATION FOR LIVESTOCK & SWINE DISPOSAL / TRANSIT',
  authorizedPerson: 'ENGR. ARNEL M. VASQUEZ',
  authorizedPersonTitle: 'Municipal Agricultural Officer (MAO)',
  letterBodyTemplate: `TO WHOM IT MAY CONCERN:

THIS IS TO CERTIFY that the swine/hog described hereunder, registered under the official Department of Agriculture (DA) Hinunangan Swine Registry System, has undergone biosecurity verification, ASF clinical inspection, and physical examination by our designated Barangay Agricultural Focal Person.

The livestock is certified FREE from infectious swine diseases, originates from an official Green Zone (African Swine Fever-Free) area, and is authorized for sale, slaughter, and commercial transfer in accordance with Municipal Ordinance and Bureau of Animal Industry (BAI) Administrative Directives.`,
  termsAndConditions: [
    'Valid for seventy-two (72) hours from the exact date and time of issuance.',
    'Must be presented at all municipal quarantine and veterinary check points.',
    'Ear tag seal must remain intact and unaltered during transit.',
    'Any tampered or falsified document shall be subject to immediate legal penalties under Republic Act No. 8485 (Animal Welfare Act) and BAI regulations.',
  ],
  signatories: [
    {
      id: 'sig-1',
      name: 'HON. PEDRO C. BALAGAO',
      title: 'Punong Barangay / Authorized Official',
      office: 'Barangay Local Government Unit',
      order: 1,
    },
    {
      id: 'sig-2',
      name: 'DR. MARIO V. ESTRELLA, DVM',
      title: 'Designated Livestock Inspector / Veterinarian',
      office: 'Municipal Agriculture Office',
      order: 2,
    },
    {
      id: 'sig-3',
      name: 'ENGR. ARNEL M. VASQUEZ',
      title: 'Municipal Agricultural Officer',
      office: 'LGU Hinunangan, Southern Leyte',
      order: 3,
    },
  ],
};

export const INITIAL_LANDING_CONFIG: LandingPageConfig = {
  logoUrl: '/icon.svg',
  headerTitle: 'DA HINUNANGAN SWINE REGISTRY',
  headerSubtitle: 'Department of Agriculture & Municipal Agriculture Office • Hinunangan, Southern Leyte',
  welcomeMessage: 'Empowering Hinunangan Hog Raisers with Real-time Traceability, Offline Accessibility, and Resilient African Swine Fever (ASF) Biosecurity Monitoring.',
  heroBannerUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=1600&q=80',
  themeColor: '#15803d',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 'medium',
  lguFacebookUrl: 'https://facebook.com/LGUHinunanganOfficial',
  daContactEmail: 'agri.hinunangan@gmail.com',
  emergencyHotline: '(053) 578-2011 / 0917-888-9999',
  announcementAlert: 'NOTICE: ASF Green Zone Clearance status maintained across all 40 barangays of Hinunangan. Regular registry compliance required for livestock transport permits.',
  socialPosts: [
    {
      id: 'post-1',
      title: 'Municipal Free Swine Deworming & Biosecurity Kit Distribution',
      content: 'The Municipal Agriculture Office conducted on-site visitations in Labrador, Calag-itan, and Canipaan to distribute footbath disinfectants and ear tags for newly registered piglets.',
      date: '2026-09-14',
      author: 'MAO Extension Team',
    },
    {
      id: 'post-2',
      title: 'Strict Swill Feeding Ban in Hinunangan Enforced',
      content: 'Reminder to all backyard raisers: Feeding food scraps/kanin baboy is strictly prohibited under National ASF Task Force advisories. Please report any violations to your Barangay Focal Person.',
      date: '2026-09-10',
      author: 'Veterinary Quarantine Division',
    },
    {
      id: 'post-3',
      title: 'Ready-to-Sell Swine Market Bulletin Released for Local Meat Traders',
      content: 'Licensed meat traders and agents can now browse certified market-ready finishers directly through the DA Hinunangan Portal with verified weights and health certifications.',
      date: '2026-09-05',
      author: 'Livestock Marketing Desk',
    },
  ],
};

export const INITIAL_DYNAMIC_FIELDS: DynamicFormField[] = [
  // Biosecurity custom checklist choices
  { id: 'bio-fencing', label: 'Perimeter Barrier / Pen Fencing Installed', type: 'checkbox', section: 'biosecurity', required: true, defaultValue: true },
  { id: 'bio-footbath', label: 'Entrance Disinfection Footbath Active', type: 'checkbox', section: 'biosecurity', required: true, defaultValue: true },
  { id: 'bio-noswill', label: '100% No Swill Feeding (Strictly Prohibited Kanin Baboy)', type: 'checkbox', section: 'biosecurity', required: true, defaultValue: true },
  { id: 'bio-quarantine', label: 'Separate Isolation / Quarantine Pen for New Arrivals', type: 'checkbox', section: 'biosecurity', required: false, defaultValue: false },
  { id: 'bio-cleanwater', label: 'Deepwell / Potable Drinking Water Supply', type: 'checkbox', section: 'biosecurity', required: true, defaultValue: true },
  { id: 'bio-disinfectant', label: 'Weekly Pen Disinfection Schedule Maintained', type: 'checkbox', section: 'biosecurity', required: false, defaultValue: true },
  { id: 'bio-logbook', label: 'Farm Visitor & Vehicle Movement Logbook', type: 'checkbox', section: 'biosecurity', required: false, defaultValue: false },
  { id: 'bio-waste', label: 'Septic Lagoon or Biogas Compost Facility', type: 'checkbox', section: 'biosecurity', required: false, defaultValue: false },

  // Farmer & Farm fields
  { id: 'farmer-rsbsa', label: 'RSBSA Farmer Reference Number', type: 'text', section: 'farmer', required: false },
  { id: 'farmer-farmtype', label: 'Farm Scale Category', type: 'select', section: 'farmer', required: true, options: ['Backyard (1-10 heads)', 'Semi-Commercial (11-50 heads)', 'Commercial (51+ heads)'] },

  // Swine fields
  { id: 'swine-feedtype', label: 'Primary Feed Type', type: 'select', section: 'swine', required: false, options: ['Commercial Pellets', 'Silage / Fermented Feed', 'Mixed Grains & Rice Bran', 'Formulated Concentrate'] },
  { id: 'swine-dewormed', label: 'Deworming Status', type: 'select', section: 'swine', required: false, options: ['Up to date', 'Pending', 'Not dewormed'] },
];

export const INITIAL_BIOSECURITY_AUDITS: BarangayBiosecurityAudit[] = [];

export const INITIAL_BIOSECURITY_INCIDENTS: BiosecurityIncident[] = [];

export const INITIAL_MARKETING_ALERTS: MarketingAlert[] = [];

export const INITIAL_TAKEOFF_RECORDS: SwineTakeoffRecord[] = [];
