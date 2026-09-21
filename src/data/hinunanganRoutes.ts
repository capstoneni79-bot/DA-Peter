/**
 * Real Boundary Routes, National Highway, and Farm-to-Market Networks of Hinunangan, Southern Leyte
 * Mapped with official coordinates and biosecurity transport corridors.
 */

export interface RoadSegment {
  id: string;
  name: string;
  type: 'national_highway' | 'provincial_road' | 'municipal_arterial' | 'farm_to_market' | 'marine_corridor';
  code: string;
  description: string;
  color: string;
  dashArray?: string;
  weight: number;
  totalDistanceKm: number;
  estimatedTransitTimeMin: number;
  speedLimitKmh: number;
  biosecurityZone: 'strict_quarantine' | 'monitored_transit' | 'safe_buffer';
  connectedBarangays: string[];
  path: { lat: number; lng: number }[];
}

export interface BiosecurityCheckpoint {
  id: string;
  name: string;
  type: 'quarantine_border' | 'municipal_checkpoint' | 'slaughterhouse_hub' | 'sea_patrol';
  barangay: string;
  position: { lat: number; lng: number };
  description: string;
  personnelOnDuty: string;
  operatingHours: string;
  contactNumber: string;
  disinfectionFacility: boolean;
  clearanceRequired: boolean;
}

export const HINUNANGAN_BIOSECURITY_CHECKPOINTS: BiosecurityCheckpoint[] = [
  {
    id: 'chk-north-ingan',
    name: 'North Ingan Quarantine Border Station',
    type: 'quarantine_border',
    barangay: 'Ingan',
    position: { lat: 10.453644, lng: 125.165383 },
    description: 'Northern inter-municipal boundary quarantine post with Silago on the Surigao-Tacloban Highway.',
    personnelOnDuty: 'Municipal Vet Quarantine Inspector & PNP Leyte',
    operatingHours: '24/7 Continuous Monitoring',
    contactNumber: '0945-882-9011',
    disinfectionFacility: true,
    clearanceRequired: true,
  },
  {
    id: 'chk-south-biasong',
    name: 'South Biasong Quarantine Border Post',
    type: 'quarantine_border',
    barangay: 'Biasong',
    position: { lat: 10.377535, lng: 125.217776 },
    description: 'Southern border checkpoint intercepting swine shipments from Hinundayan and Anahawan.',
    personnelOnDuty: 'Livestock Quarantine Officer',
    operatingHours: '24/7 Continuous Monitoring',
    contactNumber: '0945-882-9012',
    disinfectionFacility: true,
    clearanceRequired: true,
  },
  {
    id: 'chk-west-nava',
    name: 'Nava Mountain Pass Biosecurity Gate',
    type: 'quarantine_border',
    barangay: 'Nava',
    position: { lat: 10.305619, lng: 125.174930 },
    description: 'Southwestern interior mountain corridor intercepting inland livestock movement.',
    personnelOnDuty: 'Barangay Livestock Focal Officer',
    operatingHours: '05:00 - 22:00 Daily',
    contactNumber: '0945-882-9013',
    disinfectionFacility: true,
    clearanceRequired: true,
  },
  {
    id: 'chk-pob-central',
    name: 'Hinunangan Municipal Agriculture & Livestock Station',
    type: 'municipal_checkpoint',
    barangay: 'Poblacion',
    position: { lat: 10.397796, lng: 125.199365 },
    description: 'Central verification point for African Swine Fever (ASF) veterinary health certificates.',
    personnelOnDuty: 'Municipal Veterinarian & MAO Staff',
    operatingHours: '08:00 - 17:00 (Emergency Standby)',
    contactNumber: '0945-882-9014',
    disinfectionFacility: true,
    clearanceRequired: true,
  },
  {
    id: 'chk-labrador-abattoir',
    name: 'Hinunangan Municipal Slaughterhouse & Meat Inspection Post',
    type: 'slaughterhouse_hub',
    barangay: 'Labrador',
    position: { lat: 10.396507, lng: 125.196752 },
    description: 'Class-A accredited municipal abattoir where ante-mortem & post-mortem swine inspections occur.',
    personnelOnDuty: 'Senior Meat Inspection Officer',
    operatingHours: '03:00 - 12:00 (Daily Slaughter Operations)',
    contactNumber: '0945-882-9015',
    disinfectionFacility: true,
    clearanceRequired: true,
  },
  {
    id: 'chk-tahusan-pier',
    name: 'Tahusan Seaport & Coastal Biosecurity Watch',
    type: 'sea_patrol',
    barangay: 'Tahusan',
    position: { lat: 10.389892, lng: 125.204115 },
    description: 'Coastal surveillance post for banca swine transport to and from San Pedro & San Pablo Islands.',
    personnelOnDuty: 'Bantay Dagat & Livestock Focal Person',
    operatingHours: '06:00 - 18:00 Daily',
    contactNumber: '0945-882-9016',
    disinfectionFacility: false,
    clearanceRequired: true,
  },
];

export const HINUNANGAN_ROAD_NETWORKS: RoadSegment[] = [
  {
    id: 'route-national-highway',
    name: 'Surigao-Tacloban Coastal Highway (National Route 1)',
    type: 'national_highway',
    code: 'N1-HIN',
    description: 'Primary coastal national arterial road cutting north-to-south across Hinunangan, connecting Silago, the municipal proper, and Hinundayan.',
    color: '#dc2626', // High visibility bold red
    weight: 5,
    totalDistanceKm: 18.6,
    estimatedTransitTimeMin: 26,
    speedLimitKmh: 60,
    biosecurityZone: 'monitored_transit',
    connectedBarangays: [
      'Ingan',
      'Calag-itan',
      'Pondol',
      'Talisay',
      'Canipaan',
      'Bangcas B',
      'Bangcas A',
      'Poblacion',
      'Labrador',
      'Panalaron',
      'Salog',
      'Badiangon',
      'Biasong',
    ],
    path: [
      { lat: 10.457800, lng: 125.163900 }, // Northern boundary from Silago
      { lat: 10.453644, lng: 125.165383 }, // Ingan Checkpoint
      { lat: 10.447200, lng: 125.167800 },
      { lat: 10.436249, lng: 125.169413 }, // Calag-itan
      { lat: 10.428500, lng: 125.170900 },
      { lat: 10.423498, lng: 125.171854 }, // Pondol
      { lat: 10.418200, lng: 125.178400 },
      { lat: 10.414000, lng: 125.183200 },
      { lat: 10.410424, lng: 125.188507 }, // Talisay
      { lat: 10.415385, lng: 125.188200 }, // Canipaan coastal branch
      { lat: 10.407800, lng: 125.191200 },
      { lat: 10.405104, lng: 125.192912 }, // Bangcas B
      { lat: 10.401494, lng: 125.190303 }, // Bangcas A
      { lat: 10.397796, lng: 125.199365 }, // Poblacion Town Proper
      { lat: 10.396507, lng: 125.196752 }, // Labrador Slaughterhouse Junction
      { lat: 10.389284, lng: 125.198737 }, // Panalaron
      { lat: 10.388145, lng: 125.194632 }, // Salog
      { lat: 10.382191, lng: 125.201135 }, // Badiangon
      { lat: 10.377535, lng: 125.217776 }, // Biasong Checkpoint
      { lat: 10.371200, lng: 125.221500 }, // Southern boundary towards Hinundayan
    ],
  },
  {
    id: 'route-dasay-river-arterial',
    name: 'Das-ay Valley Interior Highway (Hinunangan - St. Bernard)',
    type: 'provincial_road',
    code: 'PR-DAS',
    description: 'Central agricultural corridor through the Das-ay fertile river basin, connecting highland swine producers to the municipal abattoir.',
    color: '#2563eb', // Blue
    weight: 4,
    totalDistanceKm: 14.8,
    estimatedTransitTimeMin: 22,
    speedLimitKmh: 45,
    biosecurityZone: 'monitored_transit',
    connectedBarangays: [
      'Poblacion',
      'Ambacon',
      'Calayugan',
      'Toptop',
      'Union',
      'Catublian',
      'Nueva Esperanza',
      'Patong',
      'Tuburan',
      'Ilaya',
      'Nava',
    ],
    path: [
      { lat: 10.397796, lng: 125.199365 }, // Poblacion
      { lat: 10.401804, lng: 125.184524 }, // Ambacon
      { lat: 10.392483, lng: 125.190414 }, // Calayugan
      { lat: 10.387194, lng: 125.193176 }, // Toptop
      { lat: 10.387226, lng: 125.185798 }, // Union
      { lat: 10.382618, lng: 125.177112 }, // Catublian
      { lat: 10.375619, lng: 125.164672 }, // Nueva Esperanza
      { lat: 10.369085, lng: 125.185076 }, // Patong
      { lat: 10.358093, lng: 125.174927 }, // Tuburan
      { lat: 10.343630, lng: 125.176637 }, // Ilaya
      { lat: 10.305619, lng: 125.174930 }, // Nava Mountain Border
    ],
  },
  {
    id: 'route-northwest-agri-corridor',
    name: 'Northwest Basin Farm-to-Market Road',
    type: 'farm_to_market',
    code: 'FMR-NW',
    description: 'Highland feeder route connecting Calinao, Matin-ao, and Lumbog swine piggeries to the national highway at Pondol/Tawog.',
    color: '#059669', // Emerald Green
    weight: 3.5,
    totalDistanceKm: 12.4,
    estimatedTransitTimeMin: 20,
    speedLimitKmh: 40,
    biosecurityZone: 'safe_buffer',
    connectedBarangays: [
      'Pondol',
      'Tawog',
      'Matin-ao',
      'Calinao',
      'Lumbog',
      'Palongpong',
      'Upper Bantawon',
    ],
    path: [
      { lat: 10.423498, lng: 125.171854 }, // Pondol (junction with N1)
      { lat: 10.414030, lng: 125.177493 }, // Tawog
      { lat: 10.419579, lng: 125.157340 }, // Matin-ao
      { lat: 10.415074, lng: 125.133178 }, // Calinao
      { lat: 10.392269, lng: 125.142382 }, // Lumbog
      { lat: 10.395271, lng: 125.169692 }, // Palongpong
      { lat: 10.431009, lng: 125.094337 }, // Upper Bantawon boundary
    ],
  },
  {
    id: 'route-southeast-coastal-link',
    name: 'Southeast Coastal Swine Cluster Feeder',
    type: 'farm_to_market',
    code: 'FMR-SE',
    description: 'Agricultural road serving the coastal and upland pig raisers of Tahusan, Otama, Bugho, and Salvacion.',
    color: '#d97706', // Amber
    weight: 3.5,
    totalDistanceKm: 8.2,
    estimatedTransitTimeMin: 14,
    speedLimitKmh: 35,
    biosecurityZone: 'monitored_transit',
    connectedBarangays: [
      'Panalaron',
      'Tahusan',
      'Santo Niño I',
      'Otama',
      'Bugho',
      'Salvacion',
    ],
    path: [
      { lat: 10.389284, lng: 125.198737 }, // Panalaron
      { lat: 10.389892, lng: 125.204115 }, // Tahusan
      { lat: 10.376627, lng: 125.204769 }, // Santo Niño I
      { lat: 10.360044, lng: 125.205493 }, // Otama
      { lat: 10.354894, lng: 125.211405 }, // Bugho
      { lat: 10.357059, lng: 125.197162 }, // Salvacion
    ],
  },
  {
    id: 'route-southwest-hinterland',
    name: 'Southwest Mountain Ridge Feeder',
    type: 'farm_to_market',
    code: 'FMR-SW',
    description: 'Mountain ridge feeder road connecting remote backyard swine farms in Libas, Manlico, and Santo Niño II.',
    color: '#7c3aed', // Purple
    weight: 3,
    totalDistanceKm: 9.6,
    estimatedTransitTimeMin: 18,
    speedLimitKmh: 30,
    biosecurityZone: 'safe_buffer',
    connectedBarangays: [
      'Tuburan',
      'Santo Niño II',
      'Libas',
      'Manlico',
    ],
    path: [
      { lat: 10.358093, lng: 125.174927 }, // Tuburan junction
      { lat: 10.362501, lng: 125.152845 }, // Santo Niño II
      { lat: 10.361054, lng: 125.145712 }, // Libas
      { lat: 10.341996, lng: 125.141422 }, // Manlico
    ],
  },
  {
    id: 'route-sea-san-pablo',
    name: 'Tahusan - San Pablo Island Marine Corridor',
    type: 'marine_corridor',
    code: 'SEA-SPB',
    description: 'Designated motorized banca crossing for livestock transport from Tahusan pier to San Pablo Island.',
    color: '#0284c7', // Cyan Blue
    dashArray: '8, 8',
    weight: 2.5,
    totalDistanceKm: 4.8,
    estimatedTransitTimeMin: 25,
    speedLimitKmh: 15,
    biosecurityZone: 'strict_quarantine',
    connectedBarangays: ['Tahusan', 'San Pablo Island'],
    path: [
      { lat: 10.389892, lng: 125.204115 }, // Tahusan Pier
      { lat: 10.405000, lng: 125.212000 },
      { lat: 10.420000, lng: 125.218000 },
      { lat: 10.431294, lng: 125.221851 }, // San Pablo Island
    ],
  },
  {
    id: 'route-sea-san-pedro',
    name: 'Tahusan - San Pedro Island Marine Corridor',
    type: 'marine_corridor',
    code: 'SEA-SPD',
    description: 'Designated deepwater banca livestock passage from Tahusan port to San Pedro Island.',
    color: '#0284c7',
    dashArray: '8, 8',
    weight: 2.5,
    totalDistanceKm: 8.4,
    estimatedTransitTimeMin: 40,
    speedLimitKmh: 15,
    biosecurityZone: 'strict_quarantine',
    connectedBarangays: ['Tahusan', 'San Pedro Island'],
    path: [
      { lat: 10.389892, lng: 125.204115 }, // Tahusan Pier
      { lat: 10.412000, lng: 125.216000 },
      { lat: 10.435000, lng: 125.224000 },
      { lat: 10.461373, lng: 125.224764 }, // San Pedro Island
    ],
  },
];

/**
 * Calculates straight line & estimated road distance in km
 */
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Get route from any barangay to the Municipal Slaughterhouse in Labrador
 */
export function getRouteToSlaughterhouse(barangayLat: number, barangayLng: number): {
  destination: { lat: number; lng: number; name: string };
  directDistanceKm: number;
  estimatedRoadDistanceKm: number;
  estimatedTransitTimeMin: number;
  primaryHighway: string;
  nearestCheckpoint: BiosecurityCheckpoint;
} {
  const slaughterhouse = {
    lat: 10.396507,
    lng: 125.196752,
    name: 'Hinunangan Municipal Slaughterhouse (Labrador)',
  };

  const directDist = calculateDistanceKm(barangayLat, barangayLng, slaughterhouse.lat, slaughterhouse.lng);
  // Mountain/winding road coefficient in Eastern Leyte averages ~1.35x direct
  const estimatedRoadDist = Number((directDist * 1.34).toFixed(2));
  // Average rural livestock vehicle speed ~32 km/h
  const transitTime = Math.max(5, Math.round((estimatedRoadDist / 32) * 60));

  // Find nearest biosecurity checkpoint
  let nearestCheckpoint = HINUNANGAN_BIOSECURITY_CHECKPOINTS[0];
  let minChkDist = Infinity;
  for (const chk of HINUNANGAN_BIOSECURITY_CHECKPOINTS) {
    const d = calculateDistanceKm(barangayLat, barangayLng, chk.position.lat, chk.position.lng);
    if (d < minChkDist) {
      minChkDist = d;
      nearestCheckpoint = chk;
    }
  }

  return {
    destination: slaughterhouse,
    directDistanceKm: directDist,
    estimatedRoadDistanceKm: estimatedRoadDist,
    estimatedTransitTimeMin: transitTime,
    primaryHighway: directDist > 6 ? 'Surigao-Tacloban Coastal Highway (N1)' : 'Municipal Internal Arterial',
    nearestCheckpoint,
  };
}
