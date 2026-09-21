import React, { useState, useMemo, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  Printer,
  Download,
  CheckCircle,
  FileText,
  ShieldCheck,
  Edit,
  Edit2,
  Plus,
  Trash2,
  Image as ImageIcon,
  Check,
  Upload,
  RefreshCw,
  Search,
  Building,
  User,
  AlertCircle,
  Clock,
  X,
  Save,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Award,
  Loader2,
  DollarSign,
  Tag,
  MapPin,
  Calendar,
  Truck,
  Hash,
} from 'lucide-react';
import {
  SwineRecord,
  UserAccount,
  CertificateConfig,
  CertificateSignatory,
  IssuedCertificate,
  CertificateTypeDefinition,
} from '../../types';
import { storageService } from '../../services/storageService';
import { HINUNANGAN_BARANGAYS } from '../../data/barangays';

interface CertificateManagerProps {
  swineList: SwineRecord[];
  currentUser: UserAccount | null;
  selectedSwineInitial?: SwineRecord | null;
}

// Format ordinal date in official Philippine LGU format: "19th day of September 2026"
function formatPhilippineOrdinalDate(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '19th day of September 2026';
  
  const day = d.getDate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();

  let suffix = 'th';
  if (day % 10 === 1 && day !== 11) suffix = 'st';
  else if (day % 10 === 2 && day !== 12) suffix = 'nd';
  else if (day % 10 === 3 && day !== 13) suffix = 'rd';

  return `${day}${suffix} day of ${month} ${year}`;
}

// Built-in Standard Certificate Formats matching Philippine LGU & Barangay standards
const STANDARD_CERTIFICATE_TYPES: CertificateTypeDefinition[] = [
  {
    id: 'barangay-certification',
    name: 'Barangay Certification (Market Sale / Transfer)',
    title: 'BARANGAY CERTIFICATION',
    formatType: 'barangay_cert',
    letterBody: `TO WHOM IT MAY CONCERN:

This is to certify that {farmerName} is a bonafide resident of Barangay {barangay}, Hinunangan, Southern Leyte.

This certifies further that {farmerName} owned {numberOfHeads} heads of pigs sold to {buyerName} of {destination}.

This certification is being issued upon the request of the named person for whatever legal purpose it may serve best.

Issued this {issueDate} at Barangay {barangay}, Hinunangan, Southern Leyte, Philippines.`,
    termsAndConditions: [
      'This Barangay Certification serves as proof of origin, ownership, and clearance for livestock sale and transit within or outside the municipality.',
      'The livestock originates from a registered ASF-Free (Green Zone) holding with zero clinical fever symptoms.',
      'Official Receipt (O.R.) payment is recorded under Barangay Regulatory Fees Ordinance.',
      'Subject to presentation at the Municipal Agriculture Office and Animal Quarantine Checkpoints.',
    ],
    signatories: [
      { id: 'sig-1', name: 'HON. CIRILO B. MONTEJO', title: 'Punong Barangay', office: 'Office of the Punong Barangay', order: 1 },
      { id: 'sig-2', name: 'KGD. EDUARDO S. CABRERA', title: 'Barangay Biosecurity Officer (BBO)', office: 'Committee on Agriculture & Biosecurity', order: 2 },
      { id: 'sig-3', name: '{farmerName}', title: 'Hog Owner / Raiser', office: 'Conforme', order: 3 },
      { id: 'sig-4', name: 'ENGR. ARNEL M. VASQUEZ', title: 'Municipal Agricultural Officer', office: 'Office of the Municipal Agriculturist (Attested)', order: 4 },
    ],
  },
  {
    id: 'biosecurity-transit',
    name: 'Livestock Biosecurity Clearance & Transit Permit',
    title: 'OFFICIAL BARANGAY LIVESTOCK BIOSECURITY CLEARANCE & TRANSFER PERMIT',
    formatType: 'biosecurity',
    letterBody: `THIS IS TO CERTIFY that the swine described herein has undergone comprehensive biosecurity inspection and is officially cleared for live animal transit, transfer, and commercial trade in accordance with Municipal Agriculture ordinances and African Swine Fever (ASF) biosecurity protocols.

The registered farm lot has been inspected and certified as ASF-Free (Green Zone Status), with zero history of clinical febrile outbreaks, zero swill feeding practices, and standard perimeter disinfection setbacks verified.`,
    termsAndConditions: [
      'This clearance is strictly valid for seventy-two (72) hours from official timestamp of issuance.',
      'Transport vehicle must be sanitized and disinfected before loading livestock at the municipal checkpoint.',
      'Any unauthorized route deviation or offloading in uncertified red/pink buffer zones revokes this permit immediately.',
      'Carrier must present this physical or digital QR certificate at all designated DA quarantine checkpoints.',
    ],
    signatories: [
      { id: 'sig-1', name: 'HON. CIRILO B. MONTEJO', title: 'Punong Barangay / Council Chair', office: 'Barangay Local Government Unit', order: 1 },
      { id: 'sig-2', name: 'ENGR. ARNEL M. VASQUEZ', title: 'Municipal Agricultural Officer', office: 'Office of the Municipal Agriculturist', order: 2 },
      { id: 'sig-3', name: 'DR. MARICEL P. TANYAG', title: 'Veterinary Biosecurity Inspector', office: 'Municipal Agriculture & Veterinary Services', order: 3 },
    ],
  },
  {
    id: 'vhc-clinical',
    name: 'Veterinary Health Certificate (VHC)',
    title: 'VETERINARY HEALTH CERTIFICATE (VHC) FOR SWINE TRANSIT & INSPECTION',
    formatType: 'health',
    letterBody: `THIS IS TO CERTIFY that I have personally conducted a comprehensive ante-mortem veterinary clinical examination on the live swine identified by the Ear Tag registered below.

Upon rigorous physical examination, the animal exhibited normal physiological parameters (rectal temperature within 38.5°C–39.5°C), normal mucosal membranes, clear ocular/nasal passages, absence of cutaneous hemorrhages or cyanosis, and exhibited zero clinical signs compatible with African Swine Fever (ASF), Hog Cholera, or other contagious viral diseases.`,
    termsAndConditions: [
      'Clinical certification is valid for 72 hours from the completion of ante-mortem physical examination.',
      'The livestock originates from a non-quarantined herd with verified vaccination and biosecurity audit records.',
      'Must be accompanied by the designated driver and carrier vehicle listed in the livestock manifest.',
    ],
    signatories: [
      { id: 'sig-1', name: 'DR. MARICEL P. TANYAG, DVM', title: 'Municipal Veterinary Officer', office: 'Provincial Veterinary Field Unit • Southern Leyte', order: 1 },
      { id: 'sig-2', name: 'ENGR. ARNEL M. VASQUEZ', title: 'Municipal Agricultural Officer (MAO)', office: 'Office of the Municipal Agriculturist - Hinunangan', order: 2 },
    ],
  },
  {
    id: 'slaughter-pass',
    name: 'Municipal Slaughter & Movement Permit',
    title: 'MUNICIPAL SLAUGHTER & LIVESTOCK DISPATCH PERMIT',
    formatType: 'slaughter',
    letterBody: `PERMISSION IS HEREBY GRANTED to transport, transfer, and deliver the live market swine detailed hereunder to the designated Municipal Slaughterhouse or accredited meat processing facility.

Ante-mortem clearance has been established, fees have been recorded, and the carcass is cleared for regulated processing in strict adherence to National Meat Inspection Service (NMIS) standards.`,
    termsAndConditions: [
      'Permit valid strictly for direct transit to the accredited slaughter facility specified herein.',
      'Slaughter without ante-mortem inspection tag constitutes a violation of Municipal Health Ordinance No. 2023-08.',
      'Valid for 48 hours from dispatch schedule.',
    ],
    signatories: [
      { id: 'sig-1', name: 'ENGR. ARNEL M. VASQUEZ', title: 'Municipal Agricultural Officer', office: 'Office of the Municipal Agriculturist', order: 1 },
      { id: 'sig-2', name: 'ROBERTO L. TAN', title: 'Meat Inspection Officer / Abattoir Supervisor', office: 'Municipal Slaughterhouse Division', order: 2 },
    ],
  },
  {
    id: 'barangay-market-permit',
    name: 'Barangay Market Sale & Transport Permit',
    title: 'BARANGAY LIVESTOCK MARKET SALE & TRANSPORT CLEARANCE',
    formatType: 'barangay_cert',
    letterBody: `TO WHOM IT MAY CONCERN:

This is to certify that {farmerName} is a bonafide resident and registered hog raiser of Barangay {barangay}, Hinunangan, Southern Leyte.

This certifies further that the hog raiser is authorized to sell and transport {numberOfHeads} heads of pigs to {buyerName} located at {destination}.

The live animals have undergone barangay biosecurity verification and are sourced from an ASF-free herd.

Issued this {issueDate} at Barangay {barangay}, Hinunangan, Southern Leyte, Philippines.`,
    termsAndConditions: [
      'Valid for seventy-two (72) hours from issuance.',
      'Must be presented at all veterinary checkpoints and during municipal slaughterhouse admission.',
      'Documentary stamp and barangay clearance fees verified.',
    ],
    signatories: [
      { id: 'sig-1', name: 'HON. CIRILO B. MONTEJO', title: 'Punong Barangay', office: 'Office of the Punong Barangay', order: 1 },
      { id: 'sig-2', name: 'KGD. EDUARDO S. CABRERA', title: 'Barangay Biosecurity Officer (BBO)', office: 'Barangay Committee on Agriculture', order: 2 },
      { id: 'sig-3', name: '{farmerName}', title: 'Hog Owner / Raiser', office: 'Conforme', order: 3 },
    ],
  },
  {
    id: 'registry-credential',
    name: 'Swine Registration & Pedigree Certificate',
    title: 'OFFICIAL SWINE REGISTRATION & BIOSECURITY CERTIFICATE',
    formatType: 'registration',
    letterBody: `THIS ACCREDITATION CERTIFIES that the swine specimen and owner raiser registered below have satisfied the biosecurity requirements of the Municipal Livestock Registry & Georeferencing Program.

The animal is issued with the tamper-evident Official Ear Tag and recorded in the municipal GIS database with verified pen setback distances from waterways, residential centers, and institutional facilities.`,
    termsAndConditions: [
      'Certificate serves as official registry credential and ownership identity of the recorded swine.',
      'Owner must notify the Municipal Agriculture Office immediately in case of illness, tagging loss, or disposal.',
    ],
    signatories: [
      { id: 'sig-1', name: 'ENGR. ARNEL M. VASQUEZ', title: 'Municipal Agricultural Officer', office: 'Office of the Municipal Agriculturist', order: 1 },
      { id: 'sig-2', name: 'HON. CIRILO B. MONTEJO', title: 'Municipal Agriculture Committee Chair', office: 'Sangguniang Bayan - Hinunangan', order: 2 },
    ],
  },
];

export const CertificateManager: React.FC<CertificateManagerProps> = ({
  swineList,
  currentUser,
  selectedSwineInitial,
}) => {
  const [activeTab, setActiveTab] = useState<'issue' | 'list' | 'history'>('issue');
  const [config, setConfig] = useState<CertificateConfig>(() => storageService.getCertificateConfig());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pdfToast, setPdfToast] = useState(false);

  // All Certificate Types (Built-in + Custom created by user)
  const [allCertificateTypes, setAllCertificateTypes] = useState<CertificateTypeDefinition[]>(() => {
    const custom = config.customCertificateTypes || [];
    return [...STANDARD_CERTIFICATE_TYPES, ...custom];
  });

  // Selected Certificate Type
  const [certificateType, setCertificateType] = useState<string>('Barangay Certification (Market Sale / Transfer)');

  // Certificate List Search & Filter
  const [certListSearch, setCertListSearch] = useState('');
  const [certFormatFilter, setCertFormatFilter] = useState('all');

  // Target certificate for editing / deleting from the list
  const [targetCertForEdit, setTargetCertForEdit] = useState<CertificateTypeDefinition | null>(null);
  const [targetCertForDelete, setTargetCertForDelete] = useState<CertificateTypeDefinition | null>(null);

  // Add Certificate Type Modal State
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeTitle, setNewTypeTitle] = useState('');
  const [newTypeFormat, setNewTypeFormat] = useState<'barangay_cert' | 'biosecurity' | 'health' | 'origin' | 'slaughter' | 'registration' | 'custom'>('barangay_cert');
  const [newTypeBody, setNewTypeBody] = useState('');
  const [newTypeSignatoryName, setNewTypeSignatoryName] = useState('');
  const [newTypeSignatoryTitle, setNewTypeSignatoryTitle] = useState('');

  // Edit Certificate Parameters State
  const [showEditParamsModal, setShowEditParamsModal] = useState(false);
  const [editParamName, setEditParamName] = useState('');
  const [editParamTitle, setEditParamTitle] = useState('');
  const [editParamFormat, setEditParamFormat] = useState<'barangay_cert' | 'biosecurity' | 'health' | 'origin' | 'slaughter' | 'registration' | 'custom'>('barangay_cert');
  const [editParamBody, setEditParamBody] = useState('');
  const [editParamSignatoryName, setEditParamSignatoryName] = useState('');
  const [editParamSignatoryTitle, setEditParamSignatoryTitle] = useState('');

  // Edit Issued Certificate Record Modal State
  const [editingCertItem, setEditingCertItem] = useState<IssuedCertificate | null>(null);
  const [editCertFarmerName, setEditCertFarmerName] = useState('');
  const [editCertEarTagNo, setEditCertEarTagNo] = useState('');
  const [editCertBuyerName, setEditCertBuyerName] = useState('');
  const [editCertDestination, setEditCertDestination] = useState('');
  const [editCertIssueDate, setEditCertIssueDate] = useState('');
  const [editCertStatus, setEditCertStatus] = useState<string>('active');
  const [editCertAuthorizedBy, setEditCertAuthorizedBy] = useState('');
  const [editCertOrNumber, setEditCertOrNumber] = useState('');
  const [editCertAmountPaid, setEditCertAmountPaid] = useState<number>(50);

  // Delete Issued Certificate State
  const [deletingCertNo, setDeletingCertNo] = useState<string | null>(null);

  // Reactive Issued History List
  const [issuedList, setIssuedList] = useState<IssuedCertificate[]>(() => storageService.getIssuedCertificates());

  // Quick Logo Customizer Drawer (In Issue & Print tab)
  const [showLogoDrawer, setShowLogoDrawer] = useState(false);
  const [leftLogoUrl, setLeftLogoUrl] = useState(config.daLogoUrl || '/icon.svg');
  const [centerLogoUrl, setCenterLogoUrl] = useState(config.centerLogoUrl || '/icon.svg');
  const [rightLogoUrl, setRightLogoUrl] = useState(config.lguLogoUrl || '/icon.svg');
  const [watermarkLogoUrl, setWatermarkLogoUrl] = useState(config.watermarkLogoUrl || config.lguLogoUrl || '/icon.svg');
  const [logoSaveNotice, setLogoSaveNotice] = useState(false);

  // Reference for printable certificate DOM container & PDF export state
  const printableCertRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfDownloadedName, setPdfDownloadedName] = useState('');

  // Active definition matching selected certificate type
  const activeDef = useMemo(() => {
    return allCertificateTypes.find(t => t.name === certificateType) || allCertificateTypes[0];
  }, [certificateType, allCertificateTypes]);

  // Farmer filter & Swine selection
  const uniqueFarmers = useMemo(() => {
    const map = new Map<string, string>();
    swineList.forEach(s => {
      if (s.farmerName && !map.has(s.farmerName)) {
        map.set(s.farmerName, s.barangay);
      }
    });
    return Array.from(map.entries()).map(([farmerName, barangay]) => ({ farmerName, barangay }));
  }, [swineList]);

  // Initial farmer setup
  const initialFarmer = selectedSwineInitial?.farmerName || uniqueFarmers[0]?.farmerName || 'Juan Dela Cruz';
  const initialBarangay = selectedSwineInitial?.barangay || uniqueFarmers[0]?.barangay || 'Labrador';

  const [selectedFarmer, setSelectedFarmer] = useState<string>(initialFarmer);
  const [farmerNameInput, setFarmerNameInput] = useState<string>(initialFarmer);
  const [originBarangay, setOriginBarangay] = useState<string>(initialBarangay);
  const [issuingBarangay, setIssuingBarangay] = useState<string>(initialBarangay);

  const farmerSwineList = useMemo(() => {
    if (!selectedFarmer) return swineList;
    return swineList.filter(s => s.farmerName.toLowerCase() === selectedFarmer.toLowerCase());
  }, [swineList, selectedFarmer]);

  const [selectedSwineId, setSelectedSwineId] = useState<string>(
    selectedSwineInitial?.id || farmerSwineList[0]?.id || swineList[0]?.id || ''
  );

  const selectedSwine = swineList.find(s => s.id === selectedSwineId) || farmerSwineList[0] || swineList[0];

  // Dynamic Data Mapping Form Inputs
  const [buyerName, setBuyerName] = useState('Juan C. Mercado (Licensed Meat Trader)');
  const [destinationAddress, setDestinationAddress] = useState('Brgy. Poblacion Public Market, Hinunangan');
  const [numberOfHeads, setNumberOfHeads] = useState<number>(2);
  const [swineDescription, setSwineDescription] = useState('Market-Ready Finishers (Large White / Landrace)');
  const [customEarTag, setCustomEarTag] = useState(selectedSwine?.earTagNo || 'HN-2026-0814');
  const [haulerVehiclePlate, setHaulerVehiclePlate] = useState('ABC-1234 (Livestock Hauler)');
  const [orNumber, setOrNumber] = useState('OR-8921473');
  const [amountPaid, setAmountPaid] = useState<number>(50.00);
  const [datePaid, setDatePaid] = useState<string>(new Date().toISOString().substring(0, 10));
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().substring(0, 10));

  // Dynamic Signatories
  const [punongBarangayName, setPunongBarangayName] = useState<string>('HON. CIRILO B. MONTEJO');
  const [bboName, setBboName] = useState<string>('KGD. EDUARDO S. CABRERA');
  const [maoName, setMaoName] = useState<string>('ENGR. ARNEL M. VASQUEZ');

  // Control number format: CERT-HN-2026-1192 or BC-HN-[BRGY]-2026-1192
  const [issuedControlNo, setIssuedControlNo] = useState(() => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `CERT-HN-${year}-${rand}`;
  });

  // Template Customization state
  const [authorizedPerson, setAuthorizedPerson] = useState(config.authorizedPerson || 'HON. CIRILO B. MONTEJO');
  const [authorizedPersonTitle, setAuthorizedPersonTitle] = useState(config.authorizedPersonTitle || 'Punong Barangay');
  const [customLetterBody, setCustomLetterBody] = useState(activeDef.letterBody);
  const [signatories, setSignatories] = useState<CertificateSignatory[]>(
    activeDef.signatories || config.signatories || []
  );

  // Sync when selected swine changes
  useEffect(() => {
    if (selectedSwine) {
      setCustomEarTag(selectedSwine.earTagNo);
      setFarmerNameInput(selectedSwine.farmerName);
      setSelectedFarmer(selectedSwine.farmerName);
      setOriginBarangay(selectedSwine.barangay);
      setIssuingBarangay(selectedSwine.barangay);
      setSwineDescription(`${selectedSwine.breed} (${selectedSwine.swineType || 'Finisher'}), ~${selectedSwine.weightKg}kg`);
    }
  }, [selectedSwine]);

  // Sync barangay officials when issuing barangay changes
  useEffect(() => {
    const foundBrgy = HINUNANGAN_BARANGAYS.find(
      b => b.name.toLowerCase() === issuingBarangay.toLowerCase()
    );
    if (foundBrgy) {
      setBboName(foundBrgy.focalPersonName || 'KGD. EDUARDO S. CABRERA');
      // Assign official captain name based on barangay if known, otherwise default
      setPunongBarangayName(`HON. ${foundBrgy.focalPersonName ? foundBrgy.focalPersonName.toUpperCase() : 'CIRILO B. MONTEJO'}`);
    }
  }, [issuingBarangay]);

  // Automatically adapt signatories and format when certificate type changes
  useEffect(() => {
    if (activeDef) {
      if (activeDef.signatories && activeDef.signatories.length > 0) {
        setSignatories(activeDef.signatories);
      }
      setCustomLetterBody(activeDef.letterBody);
    }
  }, [certificateType, activeDef]);

  // Handle Farmer change
  const handleFarmerChange = (farmer: string) => {
    setSelectedFarmer(farmer);
    setFarmerNameInput(farmer);
    const matching = swineList.filter(s => s.farmerName.toLowerCase() === farmer.toLowerCase());
    if (matching.length > 0) {
      setSelectedSwineId(matching[0].id);
      setOriginBarangay(matching[0].barangay);
      setIssuingBarangay(matching[0].barangay);
      setCustomEarTag(matching[0].earTagNo);
      setSwineDescription(`${matching[0].breed} (${matching[0].swineType || 'Finisher'}), ~${matching[0].weightKg}kg`);
    }
  };

  // Generate dynamic certificate body text with variable interpolation
  const computedBodyText = useMemo(() => {
    let body = activeDef.letterBody || '';
    const formattedDate = formatPhilippineOrdinalDate(issueDate);
    
    body = body
      .replace(/{farmerName}/g, farmerNameInput || selectedFarmer || 'Juan Dela Cruz')
      .replace(/{barangay}/g, originBarangay || 'Labrador')
      .replace(/{numberOfHeads}/g, numberOfHeads.toString())
      .replace(/{buyerName}/g, buyerName || 'Licensed Meat Trader')
      .replace(/{destination}/g, destinationAddress || 'Hinunangan Municipal Slaughterhouse')
      .replace(/{issueDate}/g, formattedDate)
      .replace(/{orNumber}/g, orNumber || 'OR-8921473')
      .replace(/{amountPaid}/g, `₱${amountPaid.toFixed(2)}`);

    return body;
  }, [
    activeDef.letterBody,
    farmerNameInput,
    selectedFarmer,
    originBarangay,
    numberOfHeads,
    buyerName,
    destinationAddress,
    issueDate,
    orNumber,
    amountPaid,
  ]);

  // Save Logos & Configuration to Persistent Storage
  const handleSaveLogosAndConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updatedConfig: CertificateConfig = {
      ...config,
      daLogoUrl: leftLogoUrl,
      centerLogoUrl: centerLogoUrl,
      lguLogoUrl: rightLogoUrl,
      watermarkLogoUrl: watermarkLogoUrl,
      authorizedPerson,
      authorizedPersonTitle,
      letterBodyTemplate: customLetterBody,
      signatories,
      customCertificateTypes: allCertificateTypes.filter(
        t => !STANDARD_CERTIFICATE_TYPES.some(s => s.id === t.id)
      ),
    };
    storageService.saveCertificateConfig(updatedConfig);
    setConfig(updatedConfig);
    setSaveSuccess(true);
    setLogoSaveNotice(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setLogoSaveNotice(false);
    }, 2500);
  };

  // Image Upload helper
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add New Custom Certificate Type
  const handleAddCertificateType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim() || !newTypeTitle.trim()) {
      alert('Please enter both the certificate type name and official document title.');
      return;
    }

    const newDef: CertificateTypeDefinition = {
      id: 'custom-type-' + Date.now(),
      name: newTypeName.trim(),
      title: newTypeTitle.trim().toUpperCase(),
      formatType: newTypeFormat,
      letterBody:
        newTypeBody.trim() ||
        `TO WHOM IT MAY CONCERN:

This is to certify that {farmerName} is a bonafide resident of Barangay {barangay}, Hinunangan, Southern Leyte.

This certifies further that {farmerName} owned {numberOfHeads} heads of pigs sold to {buyerName} of {destination}.

This certification is being issued upon the request of the named person for whatever legal purpose it may serve best.

Issued this {issueDate} at Barangay {barangay}, Hinunangan, Southern Leyte, Philippines.`,
      termsAndConditions: [
        'Official certificate issued under the authority of the Barangay & Municipal Local Government.',
        'Tamper-evident verification must be maintained during transfer, transport, or sale.',
      ],
      signatories: [
        {
          id: 'sig-custom-1',
          name: newTypeSignatoryName.trim() || 'HON. CIRILO B. MONTEJO',
          title: newTypeSignatoryTitle.trim() || 'Punong Barangay',
          office: 'Office of the Punong Barangay',
          order: 1,
        },
        {
          id: 'sig-custom-2',
          name: 'ENGR. ARNEL M. VASQUEZ',
          title: 'Municipal Agricultural Officer',
          office: 'Office of the Municipal Agriculturist',
          order: 2,
        },
      ],
    };

    const updatedTypes = [...allCertificateTypes, newDef];
    setAllCertificateTypes(updatedTypes);
    setCertificateType(newDef.name);

    // Save to storage
    const customOnly = updatedTypes.filter(
      t => !STANDARD_CERTIFICATE_TYPES.some(s => s.id === t.id)
    );
    const updatedConfig: CertificateConfig = {
      ...config,
      customCertificateTypes: customOnly,
    };
    storageService.saveCertificateConfig(updatedConfig);
    setConfig(updatedConfig);

    // Reset modal form
    setNewTypeName('');
    setNewTypeTitle('');
    setNewTypeBody('');
    setNewTypeSignatoryName('');
    setNewTypeSignatoryTitle('');
    setShowAddTypeModal(false);
  };

  // Execute Official Print
  const handlePrint = () => {
    const cert: IssuedCertificate = {
      certificateNo: issuedControlNo,
      certificateType: activeDef.name,
      formatType: activeDef.formatType,
      swineId: selectedSwine?.id || 'swine-custom',
      earTagNo: customEarTag || selectedSwine?.earTagNo || 'HN-2026-0814',
      farmerName: farmerNameInput || selectedFarmer,
      farmerBarangay: originBarangay,
      buyerName,
      destinationBarangay: destinationAddress,
      destinationMunicipality: 'Hinunangan, Southern Leyte',
      numberOfHeads,
      swineDescription,
      orNumber,
      amountPaid,
      datePaid,
      issueDate: new Date(issueDate).toISOString(),
      validUntil: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      issuingBarangay,
      punongBarangay: punongBarangayName,
      bboName,
      authorizedBy: punongBarangayName || authorizedPerson,
      status: 'active',
      qrVerificationCode: `DA-HN-${customEarTag || selectedSwine?.earTagNo || '000'}-${issuedControlNo}`,
    };
    storageService.issueCertificate(cert);
    setIssuedList(storageService.getIssuedCertificates());

    // Trigger standard browser print
    window.print();
  };

  // Save as PDF (Direct PDF generation via html2canvas & jsPDF)
  const handleSaveAsPdf = async () => {
    const cert: IssuedCertificate = {
      certificateNo: issuedControlNo,
      certificateType: activeDef.name,
      formatType: activeDef.formatType,
      swineId: selectedSwine?.id || 'swine-custom',
      earTagNo: customEarTag || selectedSwine?.earTagNo || 'HN-2026-0814',
      farmerName: farmerNameInput || selectedFarmer,
      farmerBarangay: originBarangay,
      buyerName,
      destinationBarangay: destinationAddress,
      destinationMunicipality: 'Hinunangan, Southern Leyte',
      numberOfHeads,
      swineDescription,
      orNumber,
      amountPaid,
      datePaid,
      issueDate: new Date(issueDate).toISOString(),
      validUntil: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      issuingBarangay,
      punongBarangay: punongBarangayName,
      bboName,
      authorizedBy: punongBarangayName || authorizedPerson,
      status: 'active',
      qrVerificationCode: `DA-HN-${customEarTag || selectedSwine?.earTagNo || '000'}-${issuedControlNo}`,
    };
    storageService.issueCertificate(cert);
    setIssuedList(storageService.getIssuedCertificates());

    const element = printableCertRef.current || document.querySelector<HTMLElement>('.printable-certificate-container');
    if (!element) {
      window.print();
      return;
    }

    try {
      setIsExportingPdf(true);
      const filename = `DA_Hinunangan_${activeDef.name.replace(/[^a-zA-Z0-9]/g, '_')}_${issuedControlNo}.pdf`;
      setPdfDownloadedName(filename);

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(filename);

      setPdfToast(true);
      setTimeout(() => setPdfToast(false), 4000);
    } catch (err) {
      console.error('PDF export error, falling back to print dialog:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Reset form to defaults
  const handleResetForm = () => {
    setFarmerNameInput(selectedSwine?.farmerName || 'Juan Dela Cruz');
    setSelectedFarmer(selectedSwine?.farmerName || 'Juan Dela Cruz');
    setOriginBarangay(selectedSwine?.barangay || 'Labrador');
    setIssuingBarangay(selectedSwine?.barangay || 'Labrador');
    setBuyerName('Juan C. Mercado (Licensed Meat Trader)');
    setDestinationAddress('Brgy. Poblacion Public Market, Hinunangan');
    setNumberOfHeads(2);
    setSwineDescription('Market-Ready Finishers (Large White / Landrace)');
    setOrNumber('OR-8921473');
    setAmountPaid(50.00);
    setDatePaid(new Date().toISOString().substring(0, 10));
    setIssueDate(new Date().toISOString().substring(0, 10));
    setIssuedControlNo(`CERT-HN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  // Handle Open Edit Parameters Modal
  const handleOpenEditParams = () => {
    setEditParamName(activeDef.name);
    setEditParamTitle(activeDef.title);
    setEditParamFormat(activeDef.formatType);
    setEditParamBody(activeDef.letterBody);
    setEditParamSignatoryName(signatories[0]?.name || 'HON. CIRILO B. MONTEJO');
    setEditParamSignatoryTitle(signatories[0]?.title || 'Punong Barangay');
    setTargetCertForEdit(activeDef);
    setShowEditParamsModal(true);
  };

  // Handle Save Edit Parameters
  const handleSaveEditParams = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCertForEdit) return;

    const oldName = targetCertForEdit.name;
    const updatedDef: CertificateTypeDefinition = {
      ...targetCertForEdit,
      name: editParamName.trim(),
      title: editParamTitle.trim().toUpperCase(),
      formatType: editParamFormat,
      letterBody: editParamBody,
      signatories: [
        {
          id: 'sig-edit-1',
          name: editParamSignatoryName.trim(),
          title: editParamSignatoryTitle.trim(),
          office: 'Office of the Punong Barangay',
          order: 1,
        },
        ...(targetCertForEdit.signatories?.slice(1) || []),
      ],
    };

    const updatedAll = allCertificateTypes.map(t => (t.id === targetCertForEdit.id ? updatedDef : t));
    setAllCertificateTypes(updatedAll);
    if (certificateType === oldName) {
      setCertificateType(updatedDef.name);
    }

    const customTypes = updatedAll.filter(t => !STANDARD_CERTIFICATE_TYPES.some(s => s.id === t.id));
    const newConfig = { ...config, customCertificateTypes: customTypes };
    setConfig(newConfig);
    storageService.saveCertificateConfig(newConfig);

    setShowEditParamsModal(false);
    setTargetCertForEdit(null);
  };

  // Handle Delete Certificate Type
  const handleDeleteCertificateType = (def: CertificateTypeDefinition) => {
    const updatedAll = allCertificateTypes.filter(t => t.id !== def.id);
    setAllCertificateTypes(updatedAll);
    if (certificateType === def.name) {
      setCertificateType(updatedAll[0]?.name || 'Barangay Certification (Market Sale / Transfer)');
    }

    const customTypes = updatedAll.filter(t => !STANDARD_CERTIFICATE_TYPES.some(s => s.id === t.id));
    const newConfig = { ...config, customCertificateTypes: customTypes };
    setConfig(newConfig);
    storageService.saveCertificateConfig(newConfig);
    setTargetCertForDelete(null);
  };

  // Handle Select and Issue from Certificate List
  const handleSelectAndIssue = (def: CertificateTypeDefinition) => {
    setCertificateType(def.name);
    setActiveTab('issue');
  };

  // Handle Print Issued Record from History
  const handlePrintIssuedRecord = (item: IssuedCertificate) => {
    const match = swineList.find(s => s.earTagNo === item.earTagNo || s.id === item.swineId);
    if (match) {
      setSelectedSwineId(match.id);
      setSelectedFarmer(match.farmerName);
      setFarmerNameInput(match.farmerName);
    } else {
      setFarmerNameInput(item.farmerName);
      setSelectedFarmer(item.farmerName);
    }
    setIssuedControlNo(item.certificateNo);
    if (item.buyerName) setBuyerName(item.buyerName);
    if (item.destinationBarangay) setDestinationAddress(item.destinationBarangay);
    if (item.numberOfHeads) setNumberOfHeads(item.numberOfHeads);
    if (item.swineDescription) setSwineDescription(item.swineDescription);
    if (item.orNumber) setOrNumber(item.orNumber);
    if (item.amountPaid) setAmountPaid(item.amountPaid);
    if (item.issuingBarangay) setIssuingBarangay(item.issuingBarangay);
    if (item.punongBarangay) setPunongBarangayName(item.punongBarangay);
    if (item.bboName) setBboName(item.bboName);

    if (item.certificateType) {
      setCertificateType(item.certificateType);
    }

    setActiveTab('issue');
    setTimeout(() => {
      window.print();
    }, 400);
  };

  // Handle Open Edit Issued Record Modal
  const handleOpenEditIssuedRecord = (item: IssuedCertificate) => {
    setEditingCertItem(item);
    setEditCertFarmerName(item.farmerName);
    setEditCertEarTagNo(item.earTagNo);
    setEditCertBuyerName(item.buyerName || '');
    setEditCertDestination(item.destinationBarangay || '');
    setEditCertIssueDate(item.issueDate ? item.issueDate.substring(0, 10) : new Date().toISOString().substring(0, 10));
    setEditCertStatus(item.status || 'active');
    setEditCertAuthorizedBy(item.authorizedBy || punongBarangayName);
    setEditCertOrNumber(item.orNumber || 'OR-8921473');
    setEditCertAmountPaid(item.amountPaid || 50);
  };

  // Handle Save Edited Issued Record
  const handleSaveEditIssuedRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCertItem) return;

    const updated: IssuedCertificate = {
      ...editingCertItem,
      farmerName: editCertFarmerName.trim(),
      earTagNo: editCertEarTagNo.trim(),
      buyerName: editCertBuyerName.trim(),
      destinationBarangay: editCertDestination.trim(),
      issueDate: new Date(editCertIssueDate).toISOString(),
      status: editCertStatus as any,
      authorizedBy: editCertAuthorizedBy.trim(),
      orNumber: editCertOrNumber.trim(),
      amountPaid: editCertAmountPaid,
    };

    storageService.updateIssuedCertificate(updated);
    setIssuedList(storageService.getIssuedCertificates());
    setEditingCertItem(null);
  };

  // Handle Delete Issued Record
  const handleDeleteIssuedRecord = (certNo: string) => {
    storageService.deleteIssuedCertificate(certNo);
    setIssuedList(storageService.getIssuedCertificates());
    setDeletingCertNo(null);
  };

  // Filtered certificate types for List tab
  const filteredTypes = useMemo(() => {
    return allCertificateTypes.filter(t => {
      const matchSearch =
        t.name.toLowerCase().includes(certListSearch.toLowerCase()) ||
        t.title.toLowerCase().includes(certListSearch.toLowerCase()) ||
        (t.signatories || []).some(s => s.name.toLowerCase().includes(certListSearch.toLowerCase()));
      const matchFormat = certFormatFilter === 'all' || t.formatType === certFormatFilter;
      return matchSearch && matchFormat;
    });
  }, [allCertificateTypes, certListSearch, certFormatFilter]);

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" />
            <h2 className="text-xl font-bold text-stone-900">Barangay Certification & Livestock Permits</h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Official Hinunangan barangay certification, market sale permits, and veterinary clearances with automatic layout adaptation and O.R. tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-xl bg-stone-100 p-1 border border-stone-200 text-xs">
            <button
              onClick={() => setActiveTab('issue')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'issue'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Issue & Print
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'list'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" /> Certificate Types ({allCertificateTypes.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'history'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Issuance History ({issuedList.length})
            </button>
          </div>

          {activeTab === 'issue' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLogoDrawer(!showLogoDrawer)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                  showLogoDrawer
                    ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                    : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
                }`}
                title="Change and Save Official Logos"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                <span>{showLogoDrawer ? 'Hide Logo Editor' : 'Change Logos'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Certificate</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAsPdf}
                disabled={isExportingPdf}
                className="bg-blue-700 hover:bg-blue-600 disabled:opacity-60 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                {isExportingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Save as PDF</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* QUICK LOGO EDITOR & SAVER DRAWER */}
      {showLogoDrawer && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 shadow-sm space-y-3 animate-fadeIn text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-700" />
              <span className="font-bold text-amber-950 text-sm">
                Change & Save Certificate Official Logos
              </span>
            </div>
            {logoSaveNotice && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Logos Saved to Database!
              </span>
            )}
          </div>
          <p className="text-[11px] text-amber-800">
            Upload from your device or specify image URLs for the Left Seal (DA / Bagong Pilipinas), Center Emblem, and Right Seal (Municipality / Barangay).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Left Seal (DA) */}
            <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-2">
              <span className="font-bold text-stone-800 block text-[11px]">Left Seal (DA / National)</span>
              <div className="flex items-center gap-2.5">
                <img
                  src={leftLogoUrl}
                  alt="Left Seal"
                  className="w-12 h-12 object-contain border p-1 rounded-lg bg-stone-50 shrink-0"
                />
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={leftLogoUrl}
                    onChange={e => setLeftLogoUrl(e.target.value)}
                    placeholder="/icon.svg or https://..."
                    className="w-full px-2 py-1 border border-stone-300 rounded font-mono text-[10px]"
                  />
                  <label className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:underline cursor-pointer">
                    <Upload className="w-3 h-3" /> Upload Device Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileUpload(e, setLeftLogoUrl)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Center Emblem */}
            <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-2">
              <span className="font-bold text-stone-800 block text-[11px]">Center Emblem / Seal</span>
              <div className="flex items-center gap-2.5">
                <img
                  src={centerLogoUrl}
                  alt="Center Seal"
                  className="w-12 h-12 object-contain border p-1 rounded-lg bg-stone-50 shrink-0"
                />
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={centerLogoUrl}
                    onChange={e => setCenterLogoUrl(e.target.value)}
                    placeholder="/icon.svg or https://..."
                    className="w-full px-2 py-1 border border-stone-300 rounded font-mono text-[10px]"
                  />
                  <label className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:underline cursor-pointer">
                    <Upload className="w-3 h-3" /> Upload Device Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileUpload(e, setCenterLogoUrl)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Right Seal (LGU) */}
            <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-2">
              <span className="font-bold text-stone-800 block text-[11px]">Right Seal (Municipality / Barangay)</span>
              <div className="flex items-center gap-2.5">
                <img
                  src={rightLogoUrl}
                  alt="Right Seal"
                  className="w-12 h-12 object-contain border p-1 rounded-lg bg-stone-50 shrink-0"
                />
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={rightLogoUrl}
                    onChange={e => setRightLogoUrl(e.target.value)}
                    placeholder="/icon.svg or https://..."
                    className="w-full px-2 py-1 border border-stone-300 rounded font-mono text-[10px]"
                  />
                  <label className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:underline cursor-pointer">
                    <Upload className="w-3 h-3" /> Upload Device Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileUpload(e, setRightLogoUrl)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => {
                setLeftLogoUrl('/icon.svg');
                setCenterLogoUrl('/icon.svg');
                setRightLogoUrl('/icon.svg');
              }}
              className="px-3 py-1 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold cursor-pointer"
            >
              Reset to Defaults
            </button>

            <button
              type="button"
              onClick={() => handleSaveLogosAndConfig()}
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Logos</span>
            </button>
          </div>
        </div>
      )}

      {/* PDF Export Success Toast */}
      {pdfToast && (
        <div className="bg-emerald-900 text-white px-5 py-3.5 rounded-2xl shadow-lg border border-emerald-700 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-700 text-emerald-100">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs">Official PDF Document Generated & Downloaded!</p>
              <p className="text-[11px] text-emerald-200">
                Saved as: <span className="font-mono font-bold text-white">{pdfDownloadedName || `Certificate_${issuedControlNo}.pdf`}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPdfToast(false)}
            className="text-emerald-300 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ===================== TAB CONTENT ===================== */}
      {activeTab === 'list' ? (
        /* ----------------- CERTIFICATE TEMPLATES & TYPES LIST TAB ----------------- */
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-stone-900 text-base">Certificate Types & Official Templates</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                  {allCertificateTypes.length} Available
                </span>
              </div>
              <p className="text-stone-500 text-[11px] mt-0.5">
                Manage, add, edit, and configure municipal livestock certification documents, formatting archetypes, and designated signatories.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setNewTypeName('');
                setNewTypeTitle('');
                setNewTypeBody('');
                setNewTypeSignatoryName('');
                setNewTypeSignatoryTitle('');
                setShowAddTypeModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center gap-2 shadow-xs cursor-pointer transition shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Certificate Type</span>
            </button>
          </div>

          {/* Search & Archetype Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={certListSearch}
                onChange={e => setCertListSearch(e.target.value)}
                placeholder="Search certificate type, document heading, or signatory..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-stone-500 font-bold text-[11px]">Format Filter:</span>
              <select
                value={certFormatFilter}
                onChange={e => setCertFormatFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white border border-stone-300 text-xs font-semibold cursor-pointer"
              >
                <option value="all">All Formats</option>
                <option value="barangay_cert">Barangay Certification</option>
                <option value="biosecurity">Biosecurity & Transit</option>
                <option value="health">Veterinary Health (VHC)</option>
                <option value="slaughter">Slaughter Dispatch</option>
                <option value="registration">Pedigree & Registration</option>
              </select>
            </div>
          </div>

          {/* Certificate Types Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTypes.map(item => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition hover:shadow-md flex flex-col justify-between space-y-3 ${
                  certificateType === item.name
                    ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-500'
                    : 'bg-white border-stone-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                        item.formatType === 'barangay_cert'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : item.formatType === 'health'
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : item.formatType === 'slaughter'
                          ? 'bg-rose-100 text-rose-900 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      }`}>
                        {item.formatType.replace('_', ' ')}
                      </span>
                      <h4 className="font-bold text-stone-900 text-sm mt-1">{item.name}</h4>
                    </div>

                    {certificateType === item.name && (
                      <span className="px-2 py-1 bg-emerald-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 shrink-0">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>

                  <div className="bg-stone-50 p-2 rounded-lg border border-stone-100 text-[11px] font-mono text-stone-600 truncate">
                    <strong>HEADING:</strong> {item.title}
                  </div>

                  <p className="text-stone-600 text-[11px] line-clamp-3 leading-relaxed">
                    {item.letterBody}
                  </p>

                  <div className="pt-1 border-t border-stone-100 text-[11px] text-stone-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <span>Primary Signatory: <strong>{item.signatories?.[0]?.name || 'Punong Barangay'}</strong></span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-100 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAndIssue(item)}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Issue Certificate</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetCertForEdit(item);
                        setEditParamName(item.name);
                        setEditParamTitle(item.title);
                        setEditParamFormat(item.formatType);
                        setEditParamBody(item.letterBody);
                        setEditParamSignatoryName(item.signatories?.[0]?.name || '');
                        setEditParamSignatoryTitle(item.signatories?.[0]?.title || '');
                        setShowEditParamsModal(true);
                      }}
                      className="p-1.5 hover:bg-stone-100 text-stone-600 hover:text-stone-900 rounded-lg border border-stone-200 cursor-pointer"
                      title="Edit Parameters"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {!STANDARD_CERTIFICATE_TYPES.some(s => s.id === item.id) && (
                      <button
                        type="button"
                        onClick={() => setTargetCertForDelete(item)}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-800 rounded-lg border border-rose-200 cursor-pointer"
                        title="Delete Custom Type"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'history' ? (
        /* ----------------- ISSUANCE HISTORY TAB ----------------- */
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-3 border-stone-100">
            <div>
              <h3 className="font-bold text-stone-900 text-base">Livestock Certificate Issuance History</h3>
              <p className="text-stone-500 text-[11px] mt-0.5">
                Complete tamper-evident registry of issued certificates, transport clearances, and official receipts.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
              {issuedList.length} Total Issued
            </span>
          </div>

          {issuedList.length === 0 ? (
            <div className="text-center py-12 text-stone-400 space-y-2">
              <FileText className="w-10 h-10 mx-auto opacity-40 text-stone-500" />
              <p className="font-bold text-stone-700">No certificates issued yet</p>
              <p className="text-[11px]">Generate and print or save your first certificate in the "Issue & Print" tab.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-stone-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
                    <th className="p-3">Control No</th>
                    <th className="p-3">Cert Type</th>
                    <th className="p-3">Farmer / Origin</th>
                    <th className="p-3">Buyer / Destination</th>
                    <th className="p-3">Heads / O.R.</th>
                    <th className="p-3">Date Issued</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {issuedList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-stone-50">
                      <td className="p-3 font-mono font-bold text-emerald-900">{item.certificateNo}</td>
                      <td className="p-3 font-semibold text-stone-800">
                        {item.certificateType || 'Barangay Certification'}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-stone-900 block">{item.farmerName}</span>
                        <span className="text-[10px] text-stone-500">Brgy. {item.farmerBarangay || 'Hinunangan'}</span>
                      </td>
                      <td className="p-3 text-stone-600">
                        <span className="font-semibold block">{item.buyerName || 'Meat Trader'}</span>
                        <span className="text-[10px] text-stone-500">{item.destinationBarangay || 'Slaughterhouse'}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-stone-900 block">{item.numberOfHeads || 1} Head(s)</span>
                        <span className="text-[10px] text-emerald-800 font-mono">
                          {item.orNumber || 'OR-PAID'} (₱{(item.amountPaid || 50).toFixed(2)})
                        </span>
                      </td>
                      <td className="p-3 text-stone-500">{new Date(item.issueDate).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          item.status === 'expired' || item.status === 'revoked'
                            ? 'bg-rose-100 text-rose-800'
                            : item.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {(item.status || 'ACTIVE').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePrintIssuedRecord(item)}
                            title="Print Certificate"
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1 border border-emerald-200 cursor-pointer shadow-2xs transition"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Print</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditIssuedRecord(item)}
                            title="Edit Record"
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-[11px] flex items-center gap-1 border border-blue-200 cursor-pointer shadow-2xs transition"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-700" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCertNo(item.certificateNo)}
                            title="Delete Record"
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-[11px] flex items-center gap-1 border border-rose-200 cursor-pointer shadow-2xs transition"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ----------------- ISSUE & PREVIEW TAB ----------------- */
        <div className="space-y-6">
          {/* COMPLETE DATA MAPPING FORM INPUTS (Image 4 Alignment) */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b pb-3 border-stone-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-stone-900 text-base">Barangay Certificate & Permit Configuration</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-emerald-50 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Format: {activeDef.formatType.replace('_', ' ').toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={handleOpenEditParams}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-stone-300 shadow-2xs transition"
                  title="Edit certificate parameters & format"
                >
                  <Edit2 className="w-3.5 h-3.5 text-stone-700" />
                  <span>Edit Parameters</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTypeModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="Add a custom certificate type"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Certificate Type</span>
                </button>
              </div>
            </div>

            {/* SECTION 1: Certificate Type & Document Nature */}
            <div className="space-y-3">
              <label className="block font-bold text-stone-800 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-700" />
                  <span>1. Select Certificate Document Type (Dynamic Layout & Body Text)</span>
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold">Auto-formats document template below</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {allCertificateTypes.map(t => {
                  const isSelected = certificateType === t.name;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setCertificateType(t.name)}
                      className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/80 border-emerald-600 shadow-xs ring-1 ring-emerald-600'
                          : 'bg-stone-50/50 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg mt-0.5 ${
                        isSelected ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-600'
                      }`}>
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${
                          isSelected ? 'text-emerald-950 font-black' : 'text-stone-800'
                        }`}>
                          {t.name}
                        </p>
                        <p className="text-[10px] text-stone-500 uppercase tracking-tight">
                          {t.formatType.replace('_', ' ')} layout
                        </p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: Farmer / Hog Raiser & Origin Barangay */}
            <div className="pt-3 border-t border-stone-100 space-y-3">
              <h4 className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-700" />
                <span>2. Farmer / Hog Raiser & Origin Details</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {/* Farmer Select or Custom Input */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Select Registered Hog Raiser
                  </label>
                  <select
                    value={selectedFarmer}
                    onChange={e => handleFarmerChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-semibold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden cursor-pointer"
                  >
                    {uniqueFarmers.map(f => (
                      <option key={f.farmerName} value={f.farmerName}>
                        {f.farmerName} (Brgy. {f.barangay})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Farmer Name Text Input */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Farmer / Hog Raiser Full Name
                  </label>
                  <input
                    type="text"
                    value={farmerNameInput}
                    onChange={e => setFarmerNameInput(e.target.value)}
                    placeholder="e.g. Juan Dela Cruz"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                {/* Origin Barangay */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Barangay of Residence / Origin
                  </label>
                  <select
                    value={originBarangay}
                    onChange={e => {
                      setOriginBarangay(e.target.value);
                      setIssuingBarangay(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden cursor-pointer"
                  >
                    {HINUNANGAN_BARANGAYS.map(b => (
                      <option key={b.id} value={b.name}>
                        Brgy. {b.name} {b.isUrban ? '(Urban)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 3: Buyer, Destination, and Swine Quantities */}
            <div className="pt-3 border-t border-stone-100 space-y-3">
              <h4 className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-700" />
                <span>3. Buyer / Transferee, Destination & Swine Particulars</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Buyer / Meat Trader / Transferee Name
                  </label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={e => setBuyerName(e.target.value)}
                    placeholder="e.g. Juan C. Mercado (Licensed Meat Trader)"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Destination Facility / Address
                  </label>
                  <input
                    type="text"
                    value={destinationAddress}
                    onChange={e => setDestinationAddress(e.target.value)}
                    placeholder="e.g. Brgy. Poblacion Public Market / Slaughterhouse"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Number of Heads / Swine Quantity
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={numberOfHeads}
                      onChange={e => setNumberOfHeads(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                    <span className="text-xs font-bold text-stone-600 whitespace-nowrap">Heads of Pig</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Primary Ear Tag Number
                  </label>
                  <input
                    type="text"
                    value={customEarTag}
                    onChange={e => setCustomEarTag(e.target.value)}
                    placeholder="e.g. HN-2026-0814"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Swine Breed / Age / Description
                  </label>
                  <input
                    type="text"
                    value={swineDescription}
                    onChange={e => setSwineDescription(e.target.value)}
                    placeholder="e.g. Market-Ready Finishers (Large White), ~90kg"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Hauler Vehicle Plate / Route
                  </label>
                  <input
                    type="text"
                    value={haulerVehiclePlate}
                    onChange={e => setHaulerVehiclePlate(e.target.value)}
                    placeholder="e.g. ABC-1234 (Livestock Hauler)"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: Official Receipt (O.R.) & Regulatory Assessment */}
            <div className="pt-3 border-t border-stone-100 space-y-3">
              <h4 className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <span>4. Official Receipt (O.R.), Payment & Issuance Date</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Official Receipt (O.R.) No.
                  </label>
                  <input
                    type="text"
                    value={orNumber}
                    onChange={e => setOrNumber(e.target.value)}
                    placeholder="e.g. OR-8921473"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Amount Paid (PHP ₱)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-400">₱</span>
                    <input
                      type="number"
                      step="5"
                      min={0}
                      value={amountPaid}
                      onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-stone-300 font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Date of Payment
                  </label>
                  <input
                    type="date"
                    value={datePaid}
                    onChange={e => setDatePaid(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Date of Official Issuance
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={e => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 5: Designated Signatories */}
            <div className="pt-3 border-t border-stone-100 space-y-3">
              <h4 className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
                <Building className="w-4 h-4 text-emerald-700" />
                <span>5. Issuing Barangay & Designated Signatories</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Punong Barangay (Barangay Captain)
                  </label>
                  <input
                    type="text"
                    value={punongBarangayName}
                    onChange={e => setPunongBarangayName(e.target.value)}
                    placeholder="e.g. HON. CIRILO B. MONTEJO"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold uppercase focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Barangay Biosecurity Officer (BBO)
                  </label>
                  <input
                    type="text"
                    value={bboName}
                    onChange={e => setBboName(e.target.value)}
                    placeholder="e.g. KGD. EDUARDO S. CABRERA"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold uppercase focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Municipal Agricultural Officer (MAO)
                  </label>
                  <input
                    type="text"
                    value={maoName}
                    onChange={e => setMaoName(e.target.value)}
                    placeholder="e.g. ENGR. ARNEL M. VASQUEZ"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold uppercase focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between pt-4 border-t border-stone-100 gap-3">
              <div className="flex items-center gap-2 text-xs text-stone-600 font-mono">
                <span>CONTROL NO:</span>
                <span className="font-bold text-emerald-950 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                  {issuedControlNo}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setIssuedControlNo(
                      `CERT-HN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
                    )
                  }
                  className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                  title="Generate New Control Number"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-3.5 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" /> Reset Form
                </button>

                <button
                  type="button"
                  onClick={handleSaveAsPdf}
                  disabled={isExportingPdf}
                  className="bg-blue-700 hover:bg-blue-600 disabled:opacity-60 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  {isExportingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Save as PDF</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Certificate</span>
                </button>
              </div>
            </div>
          </div>

          {/* ===================== OFFICIAL PRINTABLE DOCUMENT VIEWPORT (Images 1, 2, 3, & 5 Realization) ===================== */}
          <div
            ref={printableCertRef}
            className="printable-certificate-container bg-white p-8 sm:p-12 rounded-2xl border-2 border-stone-300 shadow-xl max-w-4xl mx-auto printable-document relative overflow-hidden"
          >
            {/* Watermark Center Seal Background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none">
              <img
                src={watermarkLogoUrl || rightLogoUrl}
                alt="Watermark Seal"
                className="w-[520px] h-[520px] object-contain"
              />
            </div>

            {/* Certificate Official Header */}
            <div className="text-center relative z-10 border-b-2 border-emerald-950 pb-5">
              <div className="flex items-center justify-between gap-4 mb-2">
                {/* Left Seal: DA / Bagong Pilipinas */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
                  <img
                    src={leftLogoUrl}
                    alt="DA Official Seal"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Center Institution Heading Text */}
                <div className="flex-1 space-y-0.5">
                  <p className="text-[11px] sm:text-xs uppercase tracking-widest text-stone-600 font-bold">
                    Republic of the Philippines
                  </p>
                  <p className="text-[10px] sm:text-xs uppercase tracking-wider text-stone-600 font-semibold">
                    Province of Southern Leyte
                  </p>
                  <p className="text-xs sm:text-sm uppercase tracking-wide text-emerald-950 font-bold">
                    MUNICIPALITY OF HINUNANGAN
                  </p>
                  <h2 className="text-base sm:text-xl font-black text-emerald-950 tracking-wide mt-1 uppercase">
                    BARANGAY {originBarangay.toUpperCase()}
                  </h2>
                  <h3 className="text-xs sm:text-sm font-bold text-emerald-800 tracking-wide">
                    OFFICE OF THE PUNONG BARANGAY
                  </h3>
                  <p className="text-[10px] text-stone-500 font-serif italic mt-0.5">
                    Municipal Agriculture & Biosecurity Extension Desk • Hinunangan, Southern Leyte
                  </p>
                </div>

                {/* Right Seal: Municipality / Barangay Seal */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
                  <img
                    src={rightLogoUrl}
                    alt="LGU Official Seal"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Control Reference Bar & Official Document Title */}
              <div className="mt-4 pt-2 border-t border-stone-200 flex items-center justify-between text-[10px] font-mono text-stone-500">
                <span>CONTROL NO: <strong className="text-stone-900">{issuedControlNo}</strong></span>
                <span>DATE: <strong className="text-stone-900">{formatPhilippineOrdinalDate(issueDate)}</strong></span>
              </div>

              <div className="mt-3">
                <h1 className="text-lg sm:text-2xl font-black text-emerald-950 uppercase tracking-wide border-b-2 border-double border-emerald-950 inline-block pb-0.5 px-4">
                  {activeDef.title}
                </h1>
              </div>
            </div>

            {/* Letter Body (Dynamic adaptation per Certificate Type) */}
            <div className="py-6 space-y-4 text-xs sm:text-sm text-stone-900 leading-relaxed relative z-10 font-serif">
              <div className="font-bold text-stone-900 tracking-widest text-sm uppercase">
                TO WHOM IT MAY CONCERN:
              </div>

              {/* Standard Barangay Certification Layout vs Other Specialized Layouts */}
              {activeDef.formatType === 'barangay_cert' ? (
                <div className="space-y-4 text-justify indent-8 text-stone-800 leading-loose">
                  <p>
                    This is to certify that <strong className="text-stone-950 font-bold uppercase underline underline-offset-4">{farmerNameInput || selectedFarmer || 'JUAN DELA CRUZ'}</strong> is a bonafide resident and registered hog raiser of Barangay <strong className="text-stone-950 font-bold uppercase underline underline-offset-4">{originBarangay || 'LABRADOR'}</strong>, Hinunangan, Southern Leyte.
                  </p>

                  <p>
                    This certifies further that <strong className="text-stone-950 font-bold uppercase underline underline-offset-4">{farmerNameInput || selectedFarmer || 'JUAN DELA CRUZ'}</strong> owned <strong className="text-stone-950 font-bold uppercase underline underline-offset-4">{numberOfHeads} ({numberOfHeads === 1 ? 'ONE' : numberOfHeads === 2 ? 'TWO' : numberOfHeads.toString()}) HEADS</strong> of pigs sold to <strong className="text-stone-950 font-bold uppercase underline underline-offset-4">{buyerName || 'JUAN C. MERCADO (LICENSED MEAT TRADER)'}</strong> of <strong className="text-stone-950 font-bold uppercase underline underline-offset-4">{destinationAddress || 'HINUNANGAN MUNICIPAL SLAUGHTERHOUSE'}</strong>.
                  </p>

                  <p>
                    This certification is being issued upon the request of the named person for whatever legal purpose it may serve best.
                  </p>

                  <p>
                    Issued this <strong className="text-stone-950 font-bold">{formatPhilippineOrdinalDate(issueDate)}</strong> at Barangay <strong className="text-stone-950 font-bold uppercase">{originBarangay || 'LABRADOR'}</strong>, Hinunangan, Southern Leyte, Philippines.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 text-justify text-stone-800 leading-relaxed font-sans">
                  <p className="whitespace-pre-line text-stone-700">
                    {computedBodyText}
                  </p>
                </div>
              )}

              {/* SWINE PARTICULARS & BIOSECURITY RECORD BOX */}
              <div className="bg-stone-50/90 rounded-xl p-4 border border-stone-300 my-4 text-xs font-sans">
                <div className="flex items-center justify-between border-b pb-2 mb-3 border-stone-300">
                  <h4 className="font-bold text-emerald-950 uppercase text-[11px] tracking-wide flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>LIVESTOCK BIOSECURITY & INSPECTION SPECIFICATION</span>
                  </h4>
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded border border-emerald-300">
                    ✓ ASF GREEN ZONE / COMPLIANT
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div>
                    <span className="text-stone-500 text-[10px] block font-medium">Ear Tag Number:</span>
                    <strong className="font-mono text-xs text-emerald-950">{customEarTag || selectedSwine?.earTagNo || 'HN-2026-0814'}</strong>
                  </div>

                  <div>
                    <span className="text-stone-500 text-[10px] block font-medium">Quantity / Heads:</span>
                    <strong className="text-stone-900">{numberOfHeads} Head(s) of Pig</strong>
                  </div>

                  <div>
                    <span className="text-stone-500 text-[10px] block font-medium">Breed & Description:</span>
                    <strong className="text-stone-900 truncate block" title={swineDescription}>
                      {swineDescription || 'Market-Ready Finisher'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-stone-500 text-[10px] block font-medium">Hauler Vehicle Plate:</span>
                    <strong className="font-mono text-stone-900">{haulerVehiclePlate}</strong>
                  </div>
                </div>
              </div>

              {/* OFFICIAL RECEIPT & REGULATORY FEES BLOCK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 font-sans">
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-[11px] space-y-1">
                  <span className="font-bold text-stone-800 block text-[10px] uppercase tracking-wider text-emerald-900">
                    Official Assessment & Payment Record:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-stone-600">
                    <div>O.R. Number: <strong className="font-mono text-stone-900">{orNumber || 'OR-8921473'}</strong></div>
                    <div>Amount Paid: <strong className="text-stone-900">₱{amountPaid.toFixed(2)}</strong></div>
                    <div>Date Paid: <strong className="text-stone-900">{new Date(datePaid).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></div>
                    <div>Doc Stamp: <strong className="text-emerald-800">PAID & AFFIXED</strong></div>
                  </div>
                </div>

                <div className="text-[10px] text-stone-500 space-y-1 flex flex-col justify-center">
                  <p className="italic">
                    * This clearance certifies that the livestock described herein was inspected and cleared for transport and sale in accordance with municipal ordinances.
                  </p>
                  <p className="font-mono text-[9px] text-stone-400">
                    VALIDITY: 72 HOURS FROM ISSUANCE • NON-TRANSFERABLE
                  </p>
                </div>
              </div>
            </div>

            {/* Dynamic Signatories Section */}
            <div className="pt-8 mt-4 border-t-2 border-stone-300 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs relative z-10 font-sans">
              {/* Conforme / Hog Owner */}
              <div className="space-y-1">
                <p className="text-[10px] text-stone-500 uppercase tracking-wider mb-8">Conforme / Hog Raiser:</p>
                <p className="font-black text-stone-900 border-t border-stone-400 pt-1 uppercase">
                  {farmerNameInput || selectedFarmer || 'JUAN DELA CRUZ'}
                </p>
                <p className="text-[11px] font-semibold text-stone-700">Hog Owner / Registered Raiser</p>
                <p className="text-[10px] text-stone-500">Barangay {originBarangay}</p>
              </div>

              {/* Barangay Biosecurity Officer */}
              <div className="space-y-1">
                <p className="text-[10px] text-stone-500 uppercase tracking-wider mb-8">Verified & Inspected by:</p>
                <p className="font-black text-stone-900 border-t border-stone-400 pt-1 uppercase">
                  {bboName || 'KGD. EDUARDO S. CABRERA'}
                </p>
                <p className="text-[11px] font-semibold text-stone-700">Barangay Biosecurity Officer (BBO)</p>
                <p className="text-[10px] text-stone-500">Committee on Agriculture</p>
              </div>

              {/* Punong Barangay */}
              <div className="space-y-1">
                <p className="text-[10px] text-stone-500 uppercase tracking-wider mb-8">Approved & Certified by:</p>
                <p className="font-black text-stone-900 border-t border-stone-400 pt-1 uppercase">
                  {punongBarangayName || 'HON. CIRILO B. MONTEJO'}
                </p>
                <p className="text-[11px] font-semibold text-stone-700">Punong Barangay</p>
                <p className="text-[10px] text-stone-500">Barangay {originBarangay}, Hinunangan</p>
              </div>
            </div>

            {/* Optional Attestation by Municipal Agricultural Officer */}
            <div className="pt-6 mt-6 border-t border-dashed border-stone-300 text-center relative z-10 font-sans">
              <div className="max-w-xs mx-auto space-y-1">
                <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-6">Attested & Recorded by:</p>
                <p className="font-black text-stone-900 border-t border-stone-400 pt-1 uppercase text-xs">
                  {maoName || 'ENGR. ARNEL M. VASQUEZ'}
                </p>
                <p className="text-[10px] font-semibold text-stone-700">Municipal Agricultural Officer (MAO)</p>
                <p className="text-[9px] text-stone-500">Office of the Municipal Agriculturist • Hinunangan, Southern Leyte</p>
              </div>
            </div>

            {/* Bottom Tamper-evident Verification & QR */}
            <div className="mt-8 pt-3 border-t border-stone-200 flex items-center justify-between text-[10px] text-stone-400 font-sans">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>DA Hinunangan Swine Registry System • Official Barangay Certification</span>
              </div>
              <div className="font-mono text-[9px]">
                SECURE QR VERIFICATION CODE: DA-HN-{customEarTag || 'TAG001'}-{issuedControlNo}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== ADD CERTIFICATE TYPE MODAL ===================== */}
      {showAddTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-xl w-full p-6 space-y-4 text-xs text-stone-800 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3 border-stone-100">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-stone-900 text-sm">Add New Certificate Type</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTypeModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCertificateType} className="space-y-3.5">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Certificate Type Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTypeName}
                  onChange={e => setNewTypeName(e.target.value)}
                  placeholder="e.g. Barangay Market Sale Permit"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Official Document Heading / Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTypeTitle}
                  onChange={e => setNewTypeTitle(e.target.value)}
                  placeholder="e.g. BARANGAY LIVESTOCK SALE & TRANSFER CLEARANCE"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold uppercase focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Format Layout Archetype</label>
                  <select
                    value={newTypeFormat}
                    onChange={e => setNewTypeFormat(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-semibold cursor-pointer"
                  >
                    <option value="barangay_cert">Barangay Certification Format</option>
                    <option value="biosecurity">Biosecurity & Transit Format</option>
                    <option value="health">Veterinary Health / Clinical Format</option>
                    <option value="origin">Barangay Origin & Resident Format</option>
                    <option value="slaughter">Slaughter & Abattoir Dispatch Format</option>
                    <option value="registration">Swine Pedigree & Registry Format</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Default Signatory Name</label>
                  <input
                    type="text"
                    value={newTypeSignatoryName}
                    onChange={e => setNewTypeSignatoryName(e.target.value)}
                    placeholder="e.g. HON. CIRILO B. MONTEJO"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Letter Body Statement</label>
                <textarea
                  rows={4}
                  value={newTypeBody}
                  onChange={e => setNewTypeBody(e.target.value)}
                  placeholder="TO WHOM IT MAY CONCERN:&#10;&#10;This is to certify that {farmerName} is a bonafide resident of Barangay {barangay}, Hinunangan, Southern Leyte..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 leading-relaxed text-xs font-mono"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  Supported variables: <code>{'{farmerName}'}</code>, <code>{'{barangay}'}</code>, <code>{'{numberOfHeads}'}</code>, <code>{'{buyerName}'}</code>, <code>{'{destination}'}</code>, <code>{'{issueDate}'}</code>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddTypeModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-semibold hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Certificate Type</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== EDIT CERTIFICATE PARAMETERS MODAL ===================== */}
      {showEditParamsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-xl w-full p-6 space-y-4 text-xs text-stone-800 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3 border-stone-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-stone-900 text-sm">Edit Certificate Parameters & Formatting</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditParamsModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditParams} className="space-y-3.5">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Certificate Name
                </label>
                <input
                  type="text"
                  required
                  value={editParamName}
                  onChange={e => setEditParamName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Official Document Heading
                </label>
                <input
                  type="text"
                  required
                  value={editParamTitle}
                  onChange={e => setEditParamTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Format Layout</label>
                  <select
                    value={editParamFormat}
                    onChange={e => setEditParamFormat(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-semibold cursor-pointer"
                  >
                    <option value="barangay_cert">Barangay Certification Format</option>
                    <option value="biosecurity">Biosecurity & Transit Format</option>
                    <option value="health">Veterinary Health / Clinical Format</option>
                    <option value="origin">Barangay Origin & Resident Format</option>
                    <option value="slaughter">Slaughter & Abattoir Dispatch Format</option>
                    <option value="registration">Swine Pedigree & Registry Format</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Primary Signatory Name</label>
                  <input
                    type="text"
                    value={editParamSignatoryName}
                    onChange={e => setEditParamSignatoryName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Letter Body Text</label>
                <textarea
                  rows={4}
                  value={editParamBody}
                  onChange={e => setEditParamBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 leading-relaxed text-xs font-mono"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  Variables: <code>{'{farmerName}'}</code>, <code>{'{barangay}'}</code>, <code>{'{numberOfHeads}'}</code>, <code>{'{buyerName}'}</code>, <code>{'{destination}'}</code>, <code>{'{issueDate}'}</code>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowEditParamsModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-semibold hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== EDIT ISSUED CERTIFICATE RECORD MODAL ===================== */}
      {editingCertItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs text-stone-800 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3 border-stone-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-stone-900 text-sm">Edit Issued Certificate Record</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCertItem(null)}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditIssuedRecord} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Farmer Name</label>
                  <input
                    type="text"
                    required
                    value={editCertFarmerName}
                    onChange={e => setEditCertFarmerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Ear Tag No</label>
                  <input
                    type="text"
                    required
                    value={editCertEarTagNo}
                    onChange={e => setEditCertEarTagNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Buyer / Consignee Name</label>
                <input
                  type="text"
                  value={editCertBuyerName}
                  onChange={e => setEditCertBuyerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Destination Facility / Barangay</label>
                <input
                  type="text"
                  value={editCertDestination}
                  onChange={e => setEditCertDestination(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">O.R. Number</label>
                  <input
                    type="text"
                    value={editCertOrNumber}
                    onChange={e => setEditCertOrNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Amount Paid (₱)</label>
                  <input
                    type="number"
                    value={editCertAmountPaid}
                    onChange={e => setEditCertAmountPaid(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Date Issued</label>
                  <input
                    type="date"
                    required
                    value={editCertIssueDate}
                    onChange={e => setEditCertIssueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Permit Status</label>
                  <select
                    value={editCertStatus}
                    onChange={e => setEditCertStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-semibold cursor-pointer"
                  >
                    <option value="active">Active (Valid)</option>
                    <option value="completed">Completed / Transit Done</option>
                    <option value="expired">Expired</option>
                    <option value="revoked">Revoked / Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Authorized By</label>
                <input
                  type="text"
                  value={editCertAuthorizedBy}
                  onChange={e => setEditCertAuthorizedBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 uppercase"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingCertItem(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-semibold hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== CONFIRM DELETE ISSUED RECORD MODAL ===================== */}
      {deletingCertNo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-xs text-stone-800 animate-fadeIn">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-2xl border border-rose-200">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Delete Issued Certificate</h3>
                <p className="text-[11px] text-stone-500 font-mono mt-0.5">Control: {deletingCertNo}</p>
              </div>
            </div>

            <p className="text-stone-600 leading-relaxed">
              Are you sure you want to permanently delete this issued certificate record from the registry logs? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDeletingCertNo(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-semibold hover:bg-stone-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteIssuedRecord(deletingCertNo)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== CONFIRM DELETE CERTIFICATE TYPE MODAL ===================== */}
      {targetCertForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-xs text-stone-800 animate-fadeIn">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-2xl border border-rose-200">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Delete Certificate Type</h3>
                <p className="text-[11px] text-stone-500 font-bold mt-0.5">{targetCertForDelete.name}</p>
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
              <div className="text-[10px] text-stone-400 font-mono">DOCUMENT TITLE:</div>
              <div className="font-bold text-stone-800 text-[11px] uppercase">{targetCertForDelete.title}</div>
            </div>

            <p className="text-stone-600 leading-relaxed">
              Are you sure you want to remove this certificate type and its document template? This will remove it from the available certificate issuance options.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setTargetCertForDelete(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-semibold hover:bg-stone-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCertificateType(targetCertForDelete)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Certificate Type</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
