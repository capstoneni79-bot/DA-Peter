import {
  filterSwineByAuthorization,
  computeBarangayGisMetrics,
  generateHeatmapPoints,
  getHeatmapColor,
  HeatmapMode,
} from './gisCalculations';
import { SwineRecord, Barangay } from '../types';
import { HINUNANGAN_BARANGAYS } from '../data/barangays';
import { INITIAL_SWINE_RECORDS } from '../data/initialData';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('\n--- TESTING GIS CALCULATIONS & SECURITY AUTHORIZATION ---\n');

// Mock barangays
const mockBarangays: Barangay[] = HINUNANGAN_BARANGAYS.map(b => ({
  id: b.id,
  name: b.name,
  code: b.id,
  riskLevel: b.defaultRiskLevel as any,
  latitude: b.latitude,
  longitude: b.longitude,
  focalPerson: b.focalPersonName,
  contactNumber: b.contactNumber,
}));

// Test 1: Focal Person Security Authorization
console.log('1. Testing Focal Person Authorization Filter:');
const ambaconPigs = filterSwineByAuthorization(INITIAL_SWINE_RECORDS, 'focal', 'Ambacon');
assert(ambaconPigs.length > 0, 'Ambacon focal person receives Ambacon swine records');
assert(
  ambaconPigs.every(s => s.barangay.toLowerCase() === 'ambacon'),
  'Ambacon focal person receives ZERO swine records from other barangays'
);

const adminPigs = filterSwineByAuthorization(INITIAL_SWINE_RECORDS, 'admin', undefined);
assert(
  adminPigs.length === INITIAL_SWINE_RECORDS.length,
  'Admin receives swine records for all barangays'
);

// Test 2: computeBarangayGisMetrics
console.log('\n2. Testing Barangay GIS Metrics Computation:');
const allMetrics = computeBarangayGisMetrics(mockBarangays, INITIAL_SWINE_RECORDS);
assert(allMetrics.length === 40, 'Computes metrics for all 40 Hinunangan barangays');

const ambaconMetric = allMetrics.find(m => m.barangayName.toLowerCase() === 'ambacon');
assert(!!ambaconMetric, 'Found Ambacon metric');
if (ambaconMetric) {
  assert(ambaconMetric.totalSwine > 0, `Ambacon total swine count > 0 (${ambaconMetric.totalSwine})`);
  assert(ambaconMetric.registeredFarmers > 0, `Ambacon registered farmers count > 0 (${ambaconMetric.registeredFarmers})`);
  assert(
    ambaconMetric.swineWithGps + ambaconMetric.swineWithoutGps === ambaconMetric.totalSwine,
    'GPS + Non-GPS records sum up exactly to total swine count'
  );
  assert(
    ambaconMetric.swineWithoutGps > 0,
    `Ambacon has non-GPS swine correctly associated with polygon (${ambaconMetric.swineWithoutGps})`
  );
}

// Test 3: Focal Restricted Metrics
console.log('\n3. Testing Restricted Focal Metrics:');
const focalMetrics = computeBarangayGisMetrics(mockBarangays, INITIAL_SWINE_RECORDS, 'Ambacon');
assert(focalMetrics.length === 1, 'Focal person metrics restricted to exactly 1 assigned barangay');
assert(
  focalMetrics[0].barangayName === 'Ambacon',
  'Focal person metric is exclusively for Ambacon'
);

// Test 4: Heatmap Generation for all 5 modes
console.log('\n4. Testing Dynamic Heatmap Generation (5 Modes):');
const modes: HeatmapMode[] = [
  'swine_density',
  'farmer_density',
  'ready_to_sell',
  'breeding_boar',
  'registry_activity',
];

modes.forEach(mode => {
  const result = generateHeatmapPoints(allMetrics, mode);
  assert(result.points.length > 0, `Heatmap points generated for mode: ${mode}`);
  assert(result.maxVal >= 0, `Heatmap maxVal calculated for ${mode}: ${result.maxVal}`);
  assert(
    result.points.every(p => p.intensity >= 0 && p.intensity <= 1),
    `All intensity values normalized between 0 and 1 for ${mode}`
  );
});

// Test 5: Color Ramp Integrity
console.log('\n5. Testing Heatmap Color Interpolation:');
const lowColor = getHeatmapColor(0.1);
const midColor = getHeatmapColor(0.4);
const highColor = getHeatmapColor(0.85);

assert(lowColor.includes('16, 185, 129'), 'Low intensity renders green/teal color');
assert(midColor.includes('234, 179, 8'), 'Medium intensity renders yellow color');
assert(highColor.includes('220, 38, 38'), 'High intensity renders red/crimson color');

console.log('\n🎉 ALL GIS MAP AND ACCESS CONTROL TESTS PASSED SUCCESSFULLY!\n');
