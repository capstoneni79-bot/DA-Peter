import { db } from './index.ts';
import { swineRecords } from './schema.ts';
import { eq, inArray } from 'drizzle-orm';
import { INITIAL_SWINE_RECORDS } from '../data/initialData.ts';

export function mapSwineToDb(s: any) {
  return {
    id: s.id,
    computedPigId: s.pigIdTag || s.earTagNo || s.computedPigId || s.id,
    pigIdTag: s.pigIdTag || s.earTagNo,
    earTagNo: s.earTagNo || s.pigIdTag,
    farmerName: s.farmerName,
    farmName: s.farmName || s.farmerAddress || '',
    farmerContact: s.farmerContact || '',
    barangay: s.barangay,
    birthDate: s.birthDate || '',
    ageDays: typeof s.ageDays === 'number' ? s.ageDays : null,
    ageMonths: String(s.ageMonths || ''),
    estimatedWeightKg: String(s.estimatedWeightKg || ''),
    actualWeightKg: String(s.actualWeightKg || s.weightKg || ''),
    swineType: s.swineType || 'FATTER_GROWER',
    farmScale: s.farmScale || 'BACKYARD',
    asfZone: s.asfZone || 'RED',
    biosecurityWarning: Boolean(s.biosecurityWarning),
    status: (s.status || 'HEALTHY').toUpperCase(),
    readyToSell: Boolean(s.readyToSell),
    priceEstimate: String(s.priceEstimate || ''),
    photoUrl: s.photoUrl || '',
    isArchived: Boolean(s.isArchived),
    registeredAt: s.registeredAt || new Date().toISOString(),
    customFields: s.customFields || s.biosecurity || null,
  };
}

export async function getAllSwineRecords() {
  try {
    const records = await db.select().from(swineRecords);
    if (records.length === 0 && INITIAL_SWINE_RECORDS.length > 0) {
      // Auto-seed initial records if empty
      const initialDbRecords = INITIAL_SWINE_RECORDS.map(mapSwineToDb);
      await db.insert(swineRecords).values(initialDbRecords).onConflictDoNothing();
      return await db.select().from(swineRecords);
    }
    return records;
  } catch (error) {
    console.error('Database query failed for getAllSwineRecords:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function insertSwineRecords(records: any[]) {
  try {
    if (records.length === 0) return [];
    const dbRecords = records.map(mapSwineToDb);
    return await db.insert(swineRecords).values(dbRecords).onConflictDoNothing().returning();
  } catch (error) {
    console.error('Database query failed for insertSwineRecords:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function upsertSwineRecord(record: any) {
  try {
    const dbRecord = mapSwineToDb(record);
    const result = await db
      .insert(swineRecords)
      .values(dbRecord)
      .onConflictDoUpdate({
        target: swineRecords.id,
        set: dbRecord,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed for upsertSwineRecord:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function deleteSwineRecordById(id: string) {
  try {
    return await db.delete(swineRecords).where(eq(swineRecords.id, id)).returning();
  } catch (error) {
    console.error('Database query failed for deleteSwineRecordById:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function deleteSwineRecordsByIds(ids: string[]) {
  try {
    if (ids.length === 0) return [];
    return await db.delete(swineRecords).where(inArray(swineRecords.id, ids)).returning();
  } catch (error) {
    console.error('Database query failed for deleteSwineRecordsByIds:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
