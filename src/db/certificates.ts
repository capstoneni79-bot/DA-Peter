import { db } from './index.ts';
import { issuedCertificates } from './schema.ts';
import { INITIAL_ISSUED_CERTIFICATES } from '../data/initialData.ts';

export function mapCertToDb(c: any) {
  return {
    id: c.id,
    controlNumber: c.controlNumber || c.certificateNumber || c.id,
    swineId: c.swineId || '',
    farmerName: c.farmerName || c.raiserName || '',
    barangay: c.barangay || '',
    issueDate: c.issueDate || new Date().toISOString(),
    purpose: c.purpose || 'Transport / Slaughter Permit',
    destination: c.destination || '',
    inspectedBy: c.inspectedBy || c.issuedBy || 'Municipal Agriculturist',
    qrPayload: c.qrPayload || '',
    validUntil: c.validUntil || '',
    status: (c.status || 'VALID').toUpperCase(),
  };
}

export async function getAllCertificates() {
  try {
    const certs = await db.select().from(issuedCertificates);
    if (certs.length === 0 && INITIAL_ISSUED_CERTIFICATES.length > 0) {
      const initialDbCerts = INITIAL_ISSUED_CERTIFICATES.map(mapCertToDb);
      await db.insert(issuedCertificates).values(initialDbCerts).onConflictDoNothing();
      return await db.select().from(issuedCertificates);
    }
    return certs;
  } catch (error) {
    console.error('Database query failed for getAllCertificates:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function insertCertificates(certs: any[]) {
  try {
    if (certs.length === 0) return [];
    const dbCerts = certs.map(mapCertToDb);
    return await db.insert(issuedCertificates).values(dbCerts).onConflictDoNothing().returning();
  } catch (error) {
    console.error('Database query failed for insertCertificates:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function upsertCertificate(cert: any) {
  try {
    const dbCert = mapCertToDb(cert);
    const result = await db
      .insert(issuedCertificates)
      .values(dbCert)
      .onConflictDoUpdate({
        target: issuedCertificates.id,
        set: dbCert,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed for upsertCertificate:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
