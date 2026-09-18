import { ASFRegulatoryDocument } from '../types';

export const MUNICIPAL_EXECUTIVE_ORDER: ASFRegulatoryDocument = {
  id: 'eo-hinunangan-12-2023',
  type: 'municipal_eo',
  title: 'An Executive Order Enforcing Comprehensive African Swine Fever (ASF) Prevention Protocols, Establishing Mandatory 25m/50m/200m Pen Setbacks, Absolute Prohibition of Swill Feeding (Pasaw), 24/7 Quarantine Border Checkpoints, and Barangay Swine Registry Systems in the Municipality of Hinunangan, Southern Leyte',
  officialNumber: 'Executive Order No. 12',
  seriesYear: 'Series of 2023',
  issuingAuthority: 'Office of the Municipal Mayor, Hinunangan, Southern Leyte',
  signatory: 'Hon. Reynaldo C. Fernandez',
  signatoryTitle: 'Municipal Mayor & Municipal ASF Task Force Chairman',
  effectiveDate: 'October 15, 2023 (Active & Enforced)',
  shortSummary: 'Comprehensive municipal decree mandating GPS pen registration, strict buffer setbacks from water bodies (>25m), houses (>50m), and schools/tourism (>200m), zero swill feeding, and strict transport clearance in all 40 barangays of Hinunangan.',
  legalBasis: [
    'Republic Act No. 7160 (Local Government Code of 1991, Section 16 - General Welfare Clause)',
    'Republic Act No. 9482 (Anti-Rabies & Animal Health Welfare Act)',
    'Republic Act No. 10611 (Food Safety Act of 2013)',
    'DA Administrative Circular No. 02, Series of 2022 (National Zoning and Movement Plan for ASF)',
    'Sangguniang Panlalawigan of Southern Leyte Provincial Ordinance No. 2021-018',
  ],
  keyArticles: [
    {
      number: 'Section 1',
      heading: 'Mandatory Georeferenced Pen Registration & Ear Tagging',
      text: 'All swine raisers (both backyard 1-10 heads and semi-commercial 11+ heads) within the 40 barangays of Hinunangan must be registered with GPS coordinates and official DA Hinunangan Ear Tags through their assigned Barangay Focal Person.',
      mandateCategory: 'mandatory',
    },
    {
      number: 'Section 2',
      heading: 'Mandatory Environmental & Community Setback Buffers',
      text: 'No swine pen, shed, or enclosure shall be erected or maintained within 25 meters from any natural potable water source, spring, river, or public deepwell; within 50 meters from residential built-up zones; and within 200 meters from public schools, day care centers, and certified eco-tourism sites.',
      mandateCategory: 'mandatory',
    },
    {
      number: 'Section 3',
      heading: 'Absolute Prohibition of Swill Feeding ("Pasaw")',
      text: 'The collection, transport, sale, and feeding of food scraps, leftovers, kitchen refuse ("kanin-baboy" or "pasaw") from restaurants, eateries, public markets, resort establishments, and household kitchens to swine is strictly prohibited across the entire municipality.',
      mandateCategory: 'prohibitive',
    },
    {
      number: 'Section 4',
      heading: 'Livestock Movement, Take-Off & Gate Pass Protocols',
      text: 'No live swine shall be loaded, transported, or slaughtered without a valid Veterinary Health Certificate (VHC) issued by the Municipal Agriculture Office and an authorized Municipal Swine Take-off Dispatch Gate Pass. Transport vehicles must undergo 100% tire bath and chassis chemical disinfection.',
      mandateCategory: 'mandatory',
    },
    {
      number: 'Section 5',
      heading: '24/7 Barangay Border Quarantine & Disinfection Checkpoints',
      text: 'Quarantine checkpoints are established at key entry borders (including Labrador, Calag-itan, Bangcas, and highway arteries). Barangay Tanods and Focal Persons are authorized to inspect all livestock cargo, meat cargo, and enforce disinfections.',
      mandateCategory: 'mandatory',
    },
    {
      number: 'Section 6',
      heading: 'Immediate 24-Hour Mortalities & Morbidity Reporting',
      text: 'Any hog raiser who observes sudden fever, skin reddening, loss of appetite, hemorrhages, or unexpected swine death must notify the Barangay Focal Person or Municipal Agriculturist within 24 hours. Concealing mortalities is a severe penal offense.',
      mandateCategory: 'mandatory',
    },
  ],
  setbackRules: [
    {
      target: 'Potable Water Source / River / Spring',
      minimumDistance: 25,
      statutoryBasis: 'Section 2(a), EO 12-2023 & PD 856 (Sanitation Code of the Philippines)',
      rationale: 'Prevents leachate, fecal runoff, and viral waterborne transmission into community water supplies and irrigation channels.',
    },
    {
      target: 'Built-up Residential Area / Neighboring Homes',
      minimumDistance: 50,
      statutoryBasis: 'Section 2(b), EO 12-2023 & Hinunangan Municipal Comprehensive Land Use Plan',
      rationale: 'Mitigates odor, vector insects (flies, mosquitoes), and bio-aerosol pathogen spread to nearby human populations.',
    },
    {
      target: 'Public Schools, Day Care Centers & Eco-Tourism Sites',
      minimumDistance: 200,
      statutoryBasis: 'Section 2(c), EO 12-2023 & Department of Tourism / DepEd Health Guidelines',
      rationale: 'Protects vulnerable school children, tourists, and beaches/eco-parks from biosecurity hazards and environmental contamination.',
    },
  ],
  penalties: [
    {
      offenseTier: 'First Offense',
      finePhp: 1500,
      punitiveActions: 'Written warning, mandatory biosecurity orientation, and 7-day pen compliance grace period.',
    },
    {
      offenseTier: 'Second Offense',
      finePhp: 2500,
      punitiveActions: 'Revocation of barangay clearance, quarantine of livestock pen, and issuance of formal notice of violation.',
    },
    {
      offenseTier: 'Third & Succeeding Offenses',
      finePhp: 5000,
      punitiveActions: 'Confiscation of undocumented swine, closure/condemnation of non-compliant pen, and filing of criminal charges under RA 10611 and RA 9482.',
    },
  ],
};

export const PROVINCIAL_ORDINANCE: ASFRegulatoryDocument = {
  id: 'po-southern-leyte-2021-018',
  type: 'provincial_ordinance',
  title: 'An Ordinance Enacting the Comprehensive African Swine Fever (ASF) Prevention and Biosecurity Code of the Province of Southern Leyte, Regulating the Ingress, Egress, and Transit of Live Swine, Semen, Pork, and Pork-Derived By-Products, Instituting Provincial Checkpoint Penalties, and Establishing the Provincial ASF Task Force',
  officialNumber: 'Provincial Ordinance No. 2021-018',
  seriesYear: 'Series of 2021 (as Amended 2023)',
  issuingAuthority: 'Sangguniang Panlalawigan of Southern Leyte, Capitol Building, Maasin City',
  signatory: 'Hon. Damian G. Mercado',
  signatoryTitle: 'Provincial Governor & Presiding Officer, Provincial Disaster Risk & Livestock Council',
  effectiveDate: 'November 28, 2021 (Permanent Provincial Statute)',
  shortSummary: 'Provincial statute defining strict ASF zoning (Green, Yellow, Pink, Red), seaport and boundary quarantine, livestock hauling accreditation, and severe penalties for illegal hog movement across all 18 municipalities and 1 city in Southern Leyte.',
  legalBasis: [
    'Republic Act No. 7160 (Section 468 - Legislative Powers of the Sangguniang Panlalawigan)',
    'Republic Act No. 8485 as amended by RA 10631 (Animal Welfare Act of the Philippines)',
    'DA Department Administrative Order No. 06, Series of 2021 (Bantay ASF sa Barangay / BABay ASF)',
    'DA-BAI Memorandum Circular on African Swine Fever Free Zone Recognition Protocols',
  ],
  keyArticles: [
    {
      number: 'Article I',
      heading: 'Provincial Zoning Demarcation & Movement Restrictions',
      text: 'All LGUs in Southern Leyte are categorized according to DA-BAI ASF Risk Tiers: Dark Green (Free), Light Green (Protected), Yellow (Surveillance), Pink (Buffer), and Red (Infected). Live swine transit between zones requires National Veterinary Quarantine Clearance (NVQC) and shipping permits.',
      mandateCategory: 'mandatory',
    },
    {
      number: 'Article II',
      heading: 'Provincial Border Control, Seaports, and Disinfection Gates',
      text: 'Mandatory inspection stations at Liloan Port, San Ricardo Ferry Terminal, Maasin City Port, and border boundaries connecting to Leyte Province (Agas-Agas Bridge and Mahaplag-Sogod corridor). All livestock vans must present DA-accredited driver credentials and disinfection certificates.',
      mandateCategory: 'mandatory',
    },
    {
      number: 'Article III',
      heading: 'Strict Prohibition on Entry of Swill and Unprocessed Pork By-products',
      text: 'Total interdiction against the importation and transit of frozen pork, uninspected processed meats, and food scraps from ASF-affected provinces and countries without NMIS inspection certificates.',
      mandateCategory: 'prohibitive',
    },
    {
      number: 'Article IV',
      heading: 'Institutionalization of Bantay ASF sa Barangay (BABay ASF)',
      text: 'Every barangay shall designate a trained Barangay Biosecurity Focal Person tasked with biosecurity auditing, sentinel animal monitoring, syndromic surveillance, and issuing pre-movement inspection attestations.',
      mandateCategory: 'mandatory',
    },
    {
      number: 'Article V',
      heading: 'Compulsory Farm Biosecurity Minimum Standards',
      text: 'Farm holdings must maintain perimeter fences, vehicle disinfection dip/spray equipment, personnel bootbaths with 10% sodium hypochlorite or authorized virucidal solutions, and adhere to local environmental setbacks.',
      mandateCategory: 'mandatory',
    },
  ],
  setbackRules: [
    {
      target: 'Natural Waterways, Rivers & Surface Aquifers',
      minimumDistance: 25,
      statutoryBasis: 'Article V, Section 3 - Provincial Environmental Protection Code',
      rationale: 'Guarantees that viral contamination from discarded animal waste or carcasses cannot enter regional river networks.',
    },
    {
      target: 'Residential Settlements & Commercial Centers',
      minimumDistance: 50,
      statutoryBasis: 'Article V, Section 4 - Provincial Public Health & Nuisance Standard',
      rationale: 'Creates an aerodynamic dilution barrier against airborne virus particles and protects public health.',
    },
    {
      target: 'Institutions, Schools, Hospitals & Ecotourism Parks',
      minimumDistance: 200,
      statutoryBasis: 'Article V, Section 5 - Provincial Tourism & Education Safeguards',
      rationale: 'Preserves the pristine environment of protected tourism and education zones in Southern Leyte.',
    },
  ],
  penalties: [
    {
      offenseTier: 'First Offense',
      finePhp: 2500,
      punitiveActions: 'Immediate impoundment of carrier vehicle for 24 hours and mandatory return to origin or humane destruction of contraband meat.',
    },
    {
      offenseTier: 'Second Offense',
      finePhp: 3500,
      punitiveActions: 'Suspension of business permit, impoundment of carrier vehicle for 72 hours, and condemnation of undocumented hogs.',
    },
    {
      offenseTier: 'Third & Habitual Offense',
      finePhp: 5000,
      punitiveActions: 'Maximum fine of ₱5,000 per violation, permanent revocation of hauler accreditation, and criminal indictment under RA 10611 with imprisonment up to 6 months.',
    },
  ],
};

export const ALL_ASF_REGULATIONS: ASFRegulatoryDocument[] = [
  MUNICIPAL_EXECUTIVE_ORDER,
  PROVINCIAL_ORDINANCE,
];
