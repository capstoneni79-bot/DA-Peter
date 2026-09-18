import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import { SealDA, SealMunicipality, SealTaskForce, SealSLSU } from '../common/OfficialSeals';

interface CertificateManagerProps {
  swineList: SwineRecord[];
  currentUser: UserAccount | null;
  selectedSwineInitial?: SwineRecord | null;
}

// Built-in Standard Certificate Formats
const STANDARD_CERTIFICATE_TYPES: CertificateTypeDefinition[] = [
  {
    id: 'biosecurity-transit',
    name: 'Maked Certificate',
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
    id: 'barangay-origin',
    name: 'Barangay Livestock Clearance',
    title: 'OFFICIAL BARANGAY LIVESTOCK CLEARANCE & ORIGIN CERTIFICATE',
    formatType: 'origin',
    letterBody: `TO WHOM IT MAY CONCERN:

THIS IS TO CERTIFY that the hog raiser identified below is a bona fide resident and registered hog farmer of this Barangay with farm coordinates duly georeferenced in the Municipal Swine Registry System.

FURTHER CERTIFIES that the swine bearing the specified ear tag was raised and fattened locally within the territorial jurisdiction of this Barangay, has not been exposed to infected livestock herds, and has satisfied all local barangay biosecurity ordinances.`,
    termsAndConditions: [
      'This Barangay origin certification is non-transferable and applicable solely to the specified hog ear tag.',
      'Subject to inspection and presentation at the Municipal Agriculture Office for issuance of slaughter/shipping permit.',
      'Valid for five (5) working days from date of issuance by the Punong Barangay.',
    ],
    signatories: [
      { id: 'sig-1', name: 'HON. CIRILO B. MONTEJO', title: 'Punong Barangay', office: 'Barangay Local Government Unit', order: 1 },
      { id: 'sig-2', name: 'KGD. EDUARDO S. CABRERA', title: 'Barangay Kagawad • Chair, Committee on Agriculture', office: 'Barangay Council - Hinunangan', order: 2 },
    ],
  },
  {
    id: 'slaughter-pass',
    name: 'Livestock Transfer & Movement Permit',
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
    id: 'registry-credential',
    name: 'Swine Biosecurity Certificate',
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
  const [activeTab, setActiveTab] = useState<'issue' | 'history'>('issue');
  const [config, setConfig] = useState<CertificateConfig>(() => storageService.getCertificateConfig());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pdfToast, setPdfToast] = useState(false);

  // All Certificate Types (Built-in + Custom created by user)
  const [allCertificateTypes, setAllCertificateTypes] = useState<CertificateTypeDefinition[]>(() => {
    const custom = config.customCertificateTypes || [];
    return [...STANDARD_CERTIFICATE_TYPES, ...custom];
  });

  // Selected Certificate Type
  const [certificateType, setCertificateType] = useState<string>('Maked Certificate');

  // Add Certificate Type Modal State
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeTitle, setNewTypeTitle] = useState('');
  const [newTypeFormat, setNewTypeFormat] = useState<'biosecurity' | 'health' | 'origin' | 'slaughter' | 'registration' | 'custom'>('biosecurity');
  const [newTypeBody, setNewTypeBody] = useState('');
  const [newTypeSignatoryName, setNewTypeSignatoryName] = useState('');
  const [newTypeSignatoryTitle, setNewTypeSignatoryTitle] = useState('');

  // Edit Certificate Parameters State
  const [showEditParamsModal, setShowEditParamsModal] = useState(false);
  const [editParamName, setEditParamName] = useState('');
  const [editParamTitle, setEditParamTitle] = useState('');
  const [editParamFormat, setEditParamFormat] = useState<'biosecurity' | 'health' | 'origin' | 'slaughter' | 'registration' | 'custom'>('biosecurity');
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

  const [selectedFarmer, setSelectedFarmer] = useState<string>(
    selectedSwineInitial?.farmerName || uniqueFarmers[0]?.farmerName || ''
  );

  const farmerSwineList = useMemo(() => {
    if (!selectedFarmer) return swineList;
    return swineList.filter(s => s.farmerName.toLowerCase() === selectedFarmer.toLowerCase());
  }, [swineList, selectedFarmer]);

  const [selectedSwineId, setSelectedSwineId] = useState<string>(
    selectedSwineInitial?.id || farmerSwineList[0]?.id || swineList[0]?.id || ''
  );

  const selectedSwine = swineList.find(s => s.id === selectedSwineId) || farmerSwineList[0] || swineList[0];

  // Dynamic issuance inputs
  const [buyerName, setBuyerName] = useState('Juan C. Mercado (Licensed Meat Trader)');
  const [destinationBarangay, setDestinationBarangay] = useState('Hinunangan Municipal Slaughterhouse');
  const [destinationMunicipality, setDestinationMunicipality] = useState('Hinunangan, Southern Leyte');
  const [haulerVehiclePlate, setHaulerVehiclePlate] = useState('ABC-1234 (Livestock Hauler)');
  const [issuedControlNo, setIssuedControlNo] = useState(
    `CERT-HN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );

  // Template Customization state
  const [authorizedPerson, setAuthorizedPerson] = useState(config.authorizedPerson);
  const [authorizedPersonTitle, setAuthorizedPersonTitle] = useState(config.authorizedPersonTitle);
  const [customLetterBody, setCustomLetterBody] = useState(config.letterBodyTemplate);
  const [signatories, setSignatories] = useState<CertificateSignatory[]>(
    activeDef.signatories || config.signatories || []
  );

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
    const matching = swineList.filter(s => s.farmerName.toLowerCase() === farmer.toLowerCase());
    if (matching.length > 0) {
      setSelectedSwineId(matching[0].id);
    }
  };

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
        `THIS IS TO CERTIFY that the registered swine documented below has satisfied all regulatory, sanitary, and municipal requirements in Hinunangan, Southern Leyte.`,
      termsAndConditions: [
        'Official certificate issued under the authority of the Municipal Agriculture Office.',
        'Tamper-evident verification must be maintained during transfer, transport, or sale.',
      ],
      signatories: [
        {
          id: 'sig-custom-1',
          name: newTypeSignatoryName.trim() || 'ENGR. ARNEL M. VASQUEZ',
          title: newTypeSignatoryTitle.trim() || 'Municipal Agricultural Officer',
          office: 'Office of the Municipal Agriculturist',
          order: 1,
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
    if (selectedSwine) {
      const cert: IssuedCertificate = {
        certificateNo: issuedControlNo,
        swineId: selectedSwine.id,
        earTagNo: selectedSwine.earTagNo,
        farmerName: selectedSwine.farmerName,
        buyerName,
        destinationBarangay,
        destinationMunicipality,
        issueDate: new Date().toISOString(),
        validUntil: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
        authorizedBy: authorizedPerson,
        status: 'active',
        qrVerificationCode: `DA-HN-${selectedSwine.earTagNo}-${issuedControlNo}`,
      };
      storageService.issueCertificate(cert);
      setIssuedList(storageService.getIssuedCertificates());
    }
    window.print();
  };

  // Save as PDF
  const handleSaveAsPdf = () => {
    if (selectedSwine) {
      const cert: IssuedCertificate = {
        certificateNo: issuedControlNo,
        swineId: selectedSwine.id,
        earTagNo: selectedSwine.earTagNo,
        farmerName: selectedSwine.farmerName,
        buyerName,
        destinationBarangay,
        destinationMunicipality,
        issueDate: new Date().toISOString(),
        validUntil: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
        authorizedBy: authorizedPerson,
        status: 'active',
        qrVerificationCode: `DA-HN-${selectedSwine.earTagNo}-${issuedControlNo}`,
      };
      storageService.issueCertificate(cert);
      setIssuedList(storageService.getIssuedCertificates());
    }
    setPdfToast(true);
    setTimeout(() => {
      setPdfToast(false);
      window.print();
    }, 600);
  };

  // Open Clean Standalone Print Window (for browsers where iframe print is constrained)
  const handleOpenPrintWindow = () => {
    const printArea = document.querySelector('.printable-certificate-container');
    if (!printArea) {
      window.print();
      return;
    }

    const printWin = window.open('', '_blank', 'width=900,height=800');
    if (!printWin) {
      window.print();
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${activeDef.title} - ${issuedControlNo}</title>
          <link rel="stylesheet" href="/src/index.css" />
          <style>
            @media print {
              body { margin: 0; padding: 15mm; }
              @page { size: portrait; margin: 10mm; }
            }
            body { font-family: system-ui, -apple-system, sans-serif; background: #fff; color: #111; }
          </style>
        </head>
        <body onload="window.print();">
          ${printArea.innerHTML}
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleResetForm = () => {
    setIssuedControlNo(
      `CERT-HN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    );
    setBuyerName('Juan C. Mercado (Licensed Meat Trader)');
    setDestinationBarangay('Hinunangan Municipal Slaughterhouse');
    setDestinationMunicipality('Hinunangan, Southern Leyte');
    setHaulerVehiclePlate('ABC-1234 (Livestock Hauler)');
  };

  // Open Edit Parameters Modal
  const handleOpenEditParams = () => {
    setEditParamName(activeDef.name);
    setEditParamTitle(activeDef.title);
    setEditParamFormat(activeDef.formatType);
    setEditParamBody(activeDef.customBody || activeDef.description || '');
    setEditParamSignatoryName(activeDef.signatoryName || authorizedPerson);
    setEditParamSignatoryTitle(activeDef.signatoryTitle || authorizedPersonTitle || 'Municipal Agriculture Officer');
    setShowEditParamsModal(true);
  };

  // Save Edit Parameters
  const handleSaveEditParams = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editParamName.trim()) return;

    const oldName = activeDef.name;
    const updatedDef: CertificateTypeDefinition = {
      ...activeDef,
      name: editParamName.trim(),
      title: editParamTitle.trim() || activeDef.title,
      formatType: editParamFormat,
      description: editParamBody.trim() || activeDef.description,
      customBody: editParamBody.trim(),
      signatoryName: editParamSignatoryName.trim() || activeDef.signatoryName,
      signatoryTitle: editParamSignatoryTitle.trim() || activeDef.signatoryTitle,
    };

    const updatedAll = allCertificateTypes.map(t => (t.name === oldName ? updatedDef : t));
    setAllCertificateTypes(updatedAll);
    setCertificateType(updatedDef.name);

    // Save custom types to certificate config
    const customTypes = updatedAll.filter(t => !STANDARD_CERTIFICATE_TYPES.some(s => s.id === t.id));
    const newConfig = { ...config, customCertificateTypes: customTypes };
    setConfig(newConfig);
    storageService.saveCertificateConfig(newConfig);

    setShowEditParamsModal(false);
  };

  // Handle Print Issued Record from History
  const handlePrintIssuedRecord = (item: IssuedCertificate) => {
    const match = swineList.find(s => s.earTagNo === item.earTagNo || s.id === item.swineId);
    if (match) {
      setSelectedSwineId(match.id);
      setSelectedFarmer(match.farmerName);
    }
    setIssuedControlNo(item.certificateNo);
    if (item.buyerName) setBuyerName(item.buyerName);
    if (item.destinationBarangay) setDestinationBarangay(item.destinationBarangay);
    if (item.destinationMunicipality) setDestinationMunicipality(item.destinationMunicipality);
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
    setEditCertAuthorizedBy(item.authorizedBy || authorizedPerson);
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

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" />
            <h2 className="text-xl font-bold text-stone-900">Print Official Certificate & Permits</h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Official municipal agriculture certification with automatic format adaptation, customizable logos, and custom certificate types.
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
                className="bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Save as PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {pdfToast && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs font-semibold flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-700" />
            <span>Generating official high-resolution document and opening print dialog...</span>
          </div>
          <span className="font-mono text-[11px] text-blue-600 font-bold">PDF Ready</span>
        </div>
      )}

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
            Upload from your device or specify image URLs for the Left Seal (DA), Center Emblem, and Right Seal (Municipality). Click <strong>Save Logos</strong> to make changes permanent.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Left Seal (DA) */}
            <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-2">
              <span className="font-bold text-stone-800 block text-[11px]">Left Seal (DA / Agency)</span>
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
              <span className="font-bold text-stone-800 block text-[11px]">Right Seal (Municipality)</span>
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

      {/* ===================== TAB CONTENT ===================== */}
      {activeTab === 'history' ? (
        /* ----------------- ISSUANCE HISTORY TAB ----------------- */
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-3 border-stone-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-stone-900 text-sm">Issued Certificate Registry Logs</h3>
            </div>
            <span className="text-[11px] text-stone-500 font-semibold">{issuedList.length} Total Permits Issued</span>
          </div>

          {issuedList.length === 0 ? (
            <div className="p-8 text-center text-stone-500">
              <FileText className="w-10 h-10 mx-auto text-stone-300 mb-2" />
              <p>No certificates issued yet. Issued permits will automatically be logged here with QR verification codes.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-stone-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                  <tr>
                    <th className="p-3">Control No.</th>
                    <th className="p-3">Ear Tag</th>
                    <th className="p-3">Farmer Name</th>
                    <th className="p-3">Buyer / Destination</th>
                    <th className="p-3">Date Issued</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {issuedList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-stone-50">
                      <td className="p-3 font-mono font-bold text-emerald-900">{item.certificateNo}</td>
                      <td className="p-3 font-mono font-bold">{item.earTagNo}</td>
                      <td className="p-3 font-semibold">{item.farmerName}</td>
                      <td className="p-3 text-stone-600">
                        {item.buyerName || 'Slaughterhouse'} ({item.destinationBarangay || 'Hinunangan'})
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
          {/* Certificate Parameters Form */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-stone-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-stone-900 text-sm">Certificate Parameters & Selection</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-emerald-50 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Active Format: {activeDef.formatType.toUpperCase()}
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {/* 1. Certificate Type Dropdown (automatically changes the format of each!) */}
              <div>
                <label className="block font-bold text-stone-800 mb-1.5 flex items-center justify-between">
                  <span>Certificate Type</span>
                  <span className="text-[10px] text-emerald-700 font-normal">Auto-formats Document</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <select
                    id="certificate-type-select"
                    value={certificateType}
                    onChange={e => setCertificateType(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border-2 border-emerald-600 font-bold text-emerald-950 bg-emerald-50/40 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer shadow-xs"
                  >
                    {allCertificateTypes.map(t => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleOpenEditParams}
                    title="Edit parameters for this certificate type"
                    className="p-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-stone-500 mt-1">
                  Format and layout update automatically for each certificate type selected.
                </p>
              </div>

              {/* 2. Farmer Selector */}
              <div>
                <label className="block font-bold text-stone-800 mb-1.5">
                  Select Farmer / Hog Raiser
                </label>
                <select
                  value={selectedFarmer}
                  onChange={e => handleFarmerChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-medium bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden cursor-pointer"
                >
                  {uniqueFarmers.map(f => (
                    <option key={f.farmerName} value={f.farmerName}>
                      {f.farmerName} (Brgy. {f.barangay})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-stone-500 mt-1">
                  Loads swine records registered under this raiser.
                </p>
              </div>

              {/* 3. Swine / Ear Tag Selector */}
              <div>
                <label className="block font-bold text-stone-800 mb-1.5">
                  Select Swine / Ear Tag
                </label>
                <select
                  value={selectedSwineId}
                  onChange={e => setSelectedSwineId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-mono font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden cursor-pointer"
                >
                  {farmerSwineList.map(s => (
                    <option key={s.id} value={s.id}>
                      Tag: {s.earTagNo} • {s.breed} ({s.weightKg}kg)
                    </option>
                  ))}
                  {farmerSwineList.length === 0 &&
                    swineList.map(s => (
                      <option key={s.id} value={s.id}>
                        Tag: {s.earTagNo} - {s.farmerName} ({s.weightKg}kg)
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-stone-500 mt-1">
                  Ear tag identification and biosecurity registry.
                </p>
              </div>
            </div>

            {/* Additional Fields tailored to format */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2 border-t border-stone-100">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Buyer / Meat Trader / Transferee</label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={e => setBuyerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  placeholder="e.g. Licensed Meat Trader"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Destination Facility / Slaughterhouse</label>
                <input
                  type="text"
                  value={destinationBarangay}
                  onChange={e => setDestinationBarangay(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  placeholder="e.g. Municipal Slaughterhouse"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Carrier Vehicle / Hauler Plate</label>
                <input
                  type="text"
                  value={haulerVehiclePlate}
                  onChange={e => setHaulerVehiclePlate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  placeholder="e.g. ABC-1234 (Livestock Hauler)"
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between pt-3 border-t border-stone-100 gap-3">
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
                  className="bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Save as PDF
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Print Certificate
                </button>
              </div>
            </div>
          </div>

          {/* ===================== OFFICIAL PRINTABLE DOCUMENT VIEWPORT ===================== */}
          <div className="printable-certificate-container bg-white p-8 sm:p-12 rounded-2xl border-2 border-stone-300 shadow-xl max-w-4xl mx-auto printable-document relative overflow-hidden">
            {/* Watermark Center Seal Background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
              <img
                src={watermarkLogoUrl || rightLogoUrl}
                alt="Watermark Seal"
                className="w-[500px] h-[500px] object-contain"
              />
            </div>

            {/* Certificate Header with Changeable Logos */}
            <div className="text-center relative z-10 border-b-2 border-emerald-900 pb-5">
              <div className="flex items-center justify-between gap-4 mb-2">
                {/* Left Seal: Changeable DA Seal */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
                  <img
                    src={leftLogoUrl}
                    alt="Left Seal"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Center Institution Text */}
                <div className="flex-1">
                  <p className="text-[10px] sm:text-xs uppercase tracking-widest text-stone-600 font-bold">
                    Republic of the Philippines
                  </p>
                  <p className="text-[10px] sm:text-xs uppercase tracking-widest text-stone-600 font-semibold">
                    Province of Southern Leyte
                  </p>
                  <h2 className="text-base sm:text-xl font-black text-emerald-950 tracking-wide mt-0.5">
                    {config.municipalityName}
                  </h2>
                  <h3 className="text-xs sm:text-sm font-bold text-emerald-800">
                    {config.officeName}
                  </h3>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    Municipal Agriculture & Veterinary Extension Division • Hinunangan
                  </p>
                </div>

                {/* Right Seal: Changeable Municipality Seal */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
                  <img
                    src={rightLogoUrl}
                    alt="Right Seal"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="mt-4">
                <span className="text-[10px] uppercase font-mono tracking-wider text-stone-500 bg-stone-100 px-3 py-1 rounded-full border border-stone-200">
                  OFFICIAL CONTROL NO: <strong>{issuedControlNo}</strong>
                </span>
                <h1 className="text-base sm:text-lg font-black text-emerald-950 uppercase tracking-tight mt-3">
                  {activeDef.title}
                </h1>
              </div>
            </div>

            {/* Letter Body (Automatically adapted per Certificate Type) */}
            <div className="py-6 space-y-4 text-xs sm:text-sm text-stone-800 leading-relaxed relative z-10">
              <div className="font-bold text-stone-900 tracking-wide text-xs flex items-center justify-between">
                <span>TO WHOM IT MAY CONCERN:</span>
                <span className="text-[11px] text-stone-500 font-normal">
                  Date of Inspection:{' '}
                  {new Date().toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <p className="whitespace-pre-line text-justify text-stone-700">
                {activeDef.letterBody}
              </p>

              {/* AUTOMATIC FORMAT RENDERING ACCORDING TO CERTIFICATE TYPE */}
              {selectedSwine && (
                <div className="bg-stone-50 rounded-xl p-4 border border-stone-300 my-4 text-xs">
                  <h4 className="font-bold text-emerald-950 mb-2 uppercase text-[11px] border-b pb-1 border-stone-200 flex items-center justify-between">
                    <span>
                      {activeDef.formatType === 'health'
                        ? 'CLINICAL EXAMINATION & VETERINARY STATUS'
                        : activeDef.formatType === 'slaughter'
                        ? 'ANTE-MORTEM INSPECTION & SLAUGHTER DISPATCH RECORD'
                        : activeDef.formatType === 'origin'
                        ? 'BARANGAY FARM LOT & RAISER REGISTRATION'
                        : activeDef.formatType === 'registration'
                        ? 'SWINE PEDIGREE & LIFETIME REGISTRY RECORD'
                        : 'REGISTERED SWINE & BIOSECURITY PARTICULARS'}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      {activeDef.formatType === 'health'
                        ? '✓ PASSED VETERINARY EVALUATION'
                        : activeDef.formatType === 'slaughter'
                        ? '✓ CLEARED FOR SLAUGHTER'
                        : '✓ CERTIFIED ASF-FREE / GREEN ZONE'}
                    </span>
                  </h4>

                  {/* Dynamic Fields tailored to certificate format */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2.5 gap-x-4">
                    <div>
                      <span className="text-stone-500 text-[10px] block font-medium">Official Ear Tag No:</span>
                      <strong className="font-mono text-sm text-emerald-950">{selectedSwine.earTagNo}</strong>
                    </div>

                    <div>
                      <span className="text-stone-500 text-[10px] block font-medium">Farmer / Raiser:</span>
                      <strong className="text-stone-900">{selectedSwine.farmerName}</strong>
                    </div>

                    <div>
                      <span className="text-stone-500 text-[10px] block font-medium">Origin Barangay:</span>
                      <strong className="text-stone-900">Brgy. {selectedSwine.barangay}, Hinunangan</strong>
                    </div>

                    <div>
                      <span className="text-stone-500 text-[10px] block font-medium">Breed & Classification:</span>
                      <strong className="text-stone-900">
                        {selectedSwine.breed} ({selectedSwine.swineType})
                      </strong>
                    </div>

                    <div>
                      <span className="text-stone-500 text-[10px] block font-medium">Verified Weight & Age:</span>
                      <strong className="text-stone-900">
                        {selectedSwine.weightKg} kg ({selectedSwine.ageWeeks} wks)
                      </strong>
                    </div>

                    {/* Conditional rows based on format archetype */}
                    {activeDef.formatType === 'health' ? (
                      <>
                        <div>
                          <span className="text-stone-500 text-[10px] block font-medium">Rectal Body Temp:</span>
                          <strong className="text-emerald-900">38.9 °C (Normal Range)</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 text-[10px] block font-medium">Mucous Membranes:</span>
                          <strong className="text-stone-900">Pinkish, Normal, No Cyanosis</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 text-[10px] block font-medium">ASF Symptom Screening:</span>
                          <strong className="text-emerald-700">NEGATIVE (Zero Lesions)</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 text-[10px] block font-medium">Deworming & Vaccine:</span>
                          <strong className="text-stone-900">Administered / Up to Date</strong>
                        </div>
                      </>
                    ) : activeDef.formatType === 'slaughter' ? (
                      <>
                        <div>
                          <span className="text-stone-500 text-[10px] block font-medium">Slaughter Destination:</span>
                          <strong className="text-stone-900">{destinationBarangay}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 text-[10px] block font-medium">Buyer / Meat Trader:</span>
                          <strong className="text-stone-900">{buyerName}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 text-[10px] block font-medium">Ante-Mortem Status:</span>
                          <strong className="text-emerald-800">PASSED FOR SLAUGHTER</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 text-[10px] block font-medium">Hauler Vehicle Plate:</span>
                          <strong className="font-mono text-stone-900">{haulerVehiclePlate}</strong>
                        </div>
                      </>
                    ) : activeDef.formatType === 'origin' ? (
                      <>
                        <div>
                          <span className="text-stone-500 text-[10px] block font-medium">Raiser Residency:</span>
                          <strong className="text-stone-900">Bona fide Registered Resident</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 text-[10px] block font-medium">Farm Holding Type:</span>
                          <strong className="text-stone-900">{selectedSwine.farmType === 'commercial' ? 'Commercial Piggery' : 'Backyard Pen'}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 text-[10px] block font-medium">Feed Practice:</span>
                          <strong className="text-stone-900">{selectedSwine.feedType || 'Commercial Feed'} (No Swill)</strong>
                        </div>
                      </>
                    ) : activeDef.formatType === 'registration' ? (
                      <>
                        <div>
                          <span className="text-stone-500 text-[10px] block font-medium">RSBSA Raiser ID:</span>
                          <strong className="font-mono text-stone-900">{selectedSwine.rsbsaId || 'RSBSA-08-6409-REG'}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 text-[10px] block font-medium">Gender / Castration:</span>
                          <strong className="text-stone-900 capitalize">{selectedSwine.gender}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 text-[10px] block font-medium">Pen GIS Coordinates:</span>
                          <strong className="font-mono text-[10px] text-stone-900">{selectedSwine.latitude.toFixed(4)}, {selectedSwine.longitude.toFixed(4)}</strong>
                        </div>
                      </>
                    ) : (
                      /* Default Biosecurity / Maked Certificate */
                      <>
                        <div>
                          <span className="text-stone-500 text-[10px] block font-medium">Buyer / Meat Trader:</span>
                          <strong className="text-stone-900">{buyerName}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 text-[10px] block font-medium">Destination Facility:</span>
                          <strong className="text-stone-900">{destinationBarangay}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 text-[10px] block font-medium">Transport Route:</span>
                          <strong className="text-stone-900">National Highway via Municipal Checkpoint</strong>
                        </div>
                        <div>
                          <span className="text-stone-500 text-[10px] block font-medium">Hauler Vehicle Plate:</span>
                          <strong className="font-mono text-stone-900">{haulerVehiclePlate}</strong>
                        </div>
                      </>
                    )}

                    <div>
                      <span className="text-stone-500 text-[10px] block font-medium">ASF Biosecurity Status:</span>
                      <strong className="text-emerald-700">✓ CERTIFIED ASF-FREE / GREEN ZONE</strong>
                    </div>

                    <div>
                      <span className="text-stone-500 text-[10px] block font-medium">Permit Validity:</span>
                      <strong className="text-stone-900">72 Hours from Timestamp</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Terms and Directives (Adapted per Certificate Type) */}
              <div className="text-[11px] text-stone-500 space-y-1">
                <span className="font-bold text-stone-700 block">Terms and Directives:</span>
                <ul className="list-disc pl-4 space-y-0.5">
                  {(activeDef.termsAndConditions || config.termsAndConditions || []).map((term, i) => (
                    <li key={i}>{term}</li>
                  ))}
                </ul>
              </div>

              {/* Timestamp of Issuance */}
              <div className="pt-2 text-xs">
                Issued this{' '}
                <strong>
                  {new Date().toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </strong>{' '}
                at the Municipal Agriculture Office, Hinunangan, Southern Leyte.
              </div>
            </div>

            {/* Dynamic Signatories Section (Adapted per Certificate Type) */}
            <div className="pt-8 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs relative z-10">
              {signatories.map(sig => (
                <div key={sig.id} className="space-y-1">
                  <div className="h-10"></div>
                  <p className="font-black text-stone-900 border-t border-stone-400 pt-1 uppercase">
                    {sig.name}
                  </p>
                  <p className="text-[11px] font-semibold text-stone-700">{sig.title}</p>
                  <p className="text-[10px] text-stone-500">{sig.office}</p>
                </div>
              ))}
            </div>

            {/* Bottom Tamper-evident Verification & QR */}
            <div className="mt-8 pt-4 border-t border-stone-200 flex items-center justify-between text-[10px] text-stone-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <span>DA Hinunangan Swine Registry System • Tamper-proof livestock clearance</span>
              </div>
              <div className="font-mono">
                VERIFICATION CODE: DA-HN-{selectedSwine?.earTagNo || '000'}-{issuedControlNo}
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
                  placeholder="e.g. Swine Quarantine Release Permit"
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
                  placeholder="e.g. OFFICIAL SWINE QUARANTINE RELEASE & HEALTH CLEARANCE"
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
                    <option value="biosecurity">Biosecurity & Transit Format</option>
                    <option value="health">Veterinary Health / Clinical Format</option>
                    <option value="origin">Barangay Origin & Resident Format</option>
                    <option value="slaughter">Slaughter & Abattoir Dispatch Format</option>
                    <option value="registration">Swine Pedigree & Registry Format</option>
                    <option value="custom">General Custom Clearance Format</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Default Signatory Name</label>
                  <input
                    type="text"
                    value={newTypeSignatoryName}
                    onChange={e => setNewTypeSignatoryName(e.target.value)}
                    placeholder="e.g. ENGR. ARNEL M. VASQUEZ"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Letter Body Statement</label>
                <textarea
                  rows={3}
                  value={newTypeBody}
                  onChange={e => setNewTypeBody(e.target.value)}
                  placeholder="Enter the official legal statement or certification body text..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 leading-relaxed text-xs"
                />
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
                  Certificate Type Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editParamName}
                  onChange={e => setEditParamName(e.target.value)}
                  placeholder="e.g. Swine Clearance Certificate"
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
                  value={editParamTitle}
                  onChange={e => setEditParamTitle(e.target.value)}
                  placeholder="e.g. MUNICIPAL SWINE TRANSPORT & HEALTH CLEARANCE PERMIT"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold uppercase focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Format Layout Archetype</label>
                  <select
                    value={editParamFormat}
                    onChange={e => setEditParamFormat(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-semibold cursor-pointer"
                  >
                    <option value="biosecurity">Biosecurity & Transit Format</option>
                    <option value="health">Veterinary Health / Clinical Format</option>
                    <option value="origin">Barangay Origin & Resident Format</option>
                    <option value="slaughter">Slaughter & Abattoir Dispatch Format</option>
                    <option value="registration">Swine Pedigree & Registry Format</option>
                    <option value="custom">General Custom Clearance Format</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Authorized Signatory Name</label>
                  <input
                    type="text"
                    value={editParamSignatoryName}
                    onChange={e => setEditParamSignatoryName(e.target.value)}
                    placeholder="e.g. ENGR. ARNEL M. VASQUEZ"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 uppercase font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Signatory Position / Title</label>
                <input
                  type="text"
                  value={editParamSignatoryTitle}
                  onChange={e => setEditParamSignatoryTitle(e.target.value)}
                  placeholder="e.g. Municipal Agriculture Officer"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Certification Statement / Body Text</label>
                <textarea
                  rows={3}
                  value={editParamBody}
                  onChange={e => setEditParamBody(e.target.value)}
                  placeholder="Enter the official legal statement or certification body text..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 leading-relaxed text-xs font-sans"
                />
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
                  <span>Save Parameters</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== EDIT ISSUED CERTIFICATE MODAL ===================== */}
      {editingCertItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs text-stone-800 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3 border-stone-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-700" />
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

            <form onSubmit={handleSaveEditIssuedRecord} className="space-y-3">
              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <span className="text-stone-500 font-medium">Control Number:</span>
                <span className="font-mono font-bold text-emerald-900">{editingCertItem.certificateNo}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Farmer / Owner Name</label>
                  <input
                    type="text"
                    required
                    value={editCertFarmerName}
                    onChange={e => setEditCertFarmerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Ear Tag No.</label>
                  <input
                    type="text"
                    required
                    value={editCertEarTagNo}
                    onChange={e => setEditCertEarTagNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold"
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

      {/* ===================== CONFIRM DELETE MODAL ===================== */}
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
    </div>
  );
};
