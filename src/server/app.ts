import express from 'express';
import { INITIAL_ISSUED_CERTIFICATES, INITIAL_SWINE_RECORDS } from '../data/initialData';
import { ALL_ASF_REGULATIONS } from '../data/asfRegulationsData';
import { HINUNANGAN_BARANGAYS } from '../data/barangays';
import {
  getAllSwineRecords,
  upsertSwineRecord,
  deleteSwineRecordById,
  deleteSwineRecordsByIds,
} from '../db/swine.ts';
import { getAllCertificates, upsertCertificate } from '../db/certificates.ts';

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '15mb' }));

  // Health check endpoints for Cloud Run, Vercel & container orchestration
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'hinunangan-swine-registry', timestamp: new Date().toISOString() });
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'hinunangan-swine-registry', timestamp: new Date().toISOString() });
  });

  // Canonical Barangays Directory API
  app.get('/api/barangays', (_req, res) => {
    res.json({ success: true, count: HINUNANGAN_BARANGAYS.length, data: HINUNANGAN_BARANGAYS });
  });

  // In-memory persistent database stores (with PostgreSQL synchronization)
  let savedRegistrySchema: any = null;
  const inMemorySwineRecords: any[] = JSON.parse(JSON.stringify(INITIAL_SWINE_RECORDS));
  const inMemoryCertificates: any[] = JSON.parse(JSON.stringify(INITIAL_ISSUED_CERTIFICATES));
  const inMemoryLegalDocs: any[] = JSON.parse(JSON.stringify(ALL_ASF_REGULATIONS));
  const inMemoryAuditLogs: any[] = [];
  let inMemoryLandingSettings: any = null;
  const EXACT_11_DIGIT_REGEX = /^\d{11}$/;

  // Helper to extract authenticated user security context from headers or query
  function getUserSecurityContext(req: express.Request) {
    const role = (req.headers['x-user-role'] as string) || (req.query.role as string) || 'focal';
    const barangayId = (req.headers['x-user-barangay-id'] as string) || (req.query.barangay_id as string) || '';
    const assignedBarangay = (req.headers['x-user-assigned-barangay'] as string) || (req.query.assigned_barangay as string) || '';
    const userId = (req.headers['x-user-id'] as string) || (req.query.user_id as string) || 'user';
    const username = (req.headers['x-user-name'] as string) || (req.query.user_name as string) || 'User';
    const isAdmin = role === 'admin';
    return { role, barangayId, assignedBarangay, userId, username, isAdmin };
  }

  // =========================================================================
  // 1. CERTIFICATES & STRICT BARANGAY ACCESS CONTROL API
  // =========================================================================
  app.get('/api/certificates', async (req, res) => {
    const user = getUserSecurityContext(req);
    const requestedBarangay = (req.query.filter_barangay as string) || (req.query.barangay as string);

    let sourceCertificates = inMemoryCertificates;
    try {
      const dbCerts = await getAllCertificates();
      if (dbCerts && dbCerts.length > 0) {
        sourceCertificates = dbCerts.map((c: any) => ({
          ...c,
          certificateNo: c.controlNumber,
          farmerBarangay: c.barangay,
          issuingBarangay: c.barangay,
        }));
      }
    } catch (dbErr) {
      console.warn('Database fetch fallback for certificates:', dbErr);
    }

    if (!user.isAdmin) {
      if (
        requestedBarangay &&
        requestedBarangay !== 'all' &&
        requestedBarangay !== user.barangayId &&
        requestedBarangay.toLowerCase() !== user.assignedBarangay.toLowerCase()
      ) {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: You are not authorized to view certificates from other barangays.',
        });
      }

      if (requestedBarangay === 'all') {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: Non-admin users cannot query certificates for all barangays.',
        });
      }

      const filtered = sourceCertificates.filter((c: any) => {
        const matchId = Boolean(c.barangay_id && user.barangayId && c.barangay_id === user.barangayId);
        const matchName = Boolean(
          c.farmerBarangay && user.assignedBarangay && c.farmerBarangay.toLowerCase() === user.assignedBarangay.toLowerCase()
        );
        const matchIssuer = Boolean(
          c.issuingBarangay && user.assignedBarangay && c.issuingBarangay.toLowerCase() === user.assignedBarangay.toLowerCase()
        );
        return matchId || matchName || matchIssuer;
      });

      return res.json({ success: true, count: filtered.length, data: filtered, scope: user.assignedBarangay || user.barangayId });
    }

    let list = sourceCertificates;
    if (requestedBarangay && requestedBarangay !== 'all') {
      list = list.filter(
        (c: any) =>
          c.barangay_id === requestedBarangay ||
          (c.farmerBarangay && c.farmerBarangay.toLowerCase() === requestedBarangay.toLowerCase())
      );
    }
    return res.json({ success: true, count: list.length, data: list, scope: 'all_permitted' });
  });

  app.get('/api/certificates/:certNo', (req, res) => {
    const user = getUserSecurityContext(req);
    const cert = inMemoryCertificates.find((c: any) => c.certificateNo === req.params.certNo);

    if (!cert) {
      return res.status(404).json({ success: false, error: 'Certificate record was not found in the official registry.' });
    }

    if (!user.isAdmin) {
      const matchId = Boolean(cert.barangay_id && user.barangayId && cert.barangay_id === user.barangayId);
      const matchName = Boolean(
        cert.farmerBarangay && user.assignedBarangay && cert.farmerBarangay.toLowerCase() === user.assignedBarangay.toLowerCase()
      );
      const matchIssuer = Boolean(
        cert.issuingBarangay && user.assignedBarangay && cert.issuingBarangay.toLowerCase() === user.assignedBarangay.toLowerCase()
      );

      if (!matchId && !matchName && !matchIssuer) {
        const certBrgy = cert.farmerBarangay || cert.issuingBarangay || 'another barangay';
        return res.status(403).json({
          success: false,
          error: `Access Denied: You are not authorized to view this certificate. It belongs to Barangay ${certBrgy}. Your account is assigned strictly to Barangay ${user.assignedBarangay || user.barangayId}.`,
        });
      }
    }

    return res.json({ success: true, data: cert });
  });

  app.post('/api/certificates', async (req, res) => {
    const user = getUserSecurityContext(req);
    const cert = req.body;

    if (!cert || !cert.certificateNo) {
      return res.status(400).json({ success: false, error: 'Invalid certificate payload' });
    }

    if (!user.isAdmin) {
      cert.barangay_id = user.barangayId || cert.barangay_id;
      cert.farmerBarangay = user.assignedBarangay || cert.farmerBarangay;
      cert.issuingBarangay = user.assignedBarangay || cert.issuingBarangay;
    }

    try {
      await upsertCertificate(cert);
    } catch (err) {
      console.warn('PostgreSQL certificate insert fallback:', err);
    }

    inMemoryCertificates.unshift(cert);

    inMemoryAuditLogs.unshift({
      id: 'log-' + Date.now(),
      action: 'ISSUE_CERTIFICATE',
      entityId: cert.certificateNo,
      performedBy: user.username,
      role: user.role,
      barangayId: cert.barangay_id,
      timestamp: new Date().toISOString(),
      details: `Issued ${cert.certificateType || 'Certificate'} for ${cert.farmerName} (${cert.numberOfHeads || 1} heads)`,
    });

    return res.status(201).json({ success: true, data: cert });
  });

  // =========================================================================
  // 2. OFFICIAL REPORT GENERATION API (STRICT BARANGAY RESTRICTION)
  // =========================================================================
  app.post('/api/reports/certificates', (req, res) => {
    const user = getUserSecurityContext(req);
    const { barangayScope = 'all', certificateType = 'all', dateFrom, dateTo } = req.body || {};

    if (!user.isAdmin) {
      if (
        barangayScope === 'all' ||
        (barangayScope !== user.barangayId && barangayScope.toLowerCase() !== user.assignedBarangay.toLowerCase())
      ) {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: You cannot generate reports for all barangays or other barangays. Only your assigned barangay is permitted.',
        });
      }
    }

    let list = inMemoryCertificates;
    if (!user.isAdmin) {
      list = list.filter((c: any) => {
        const matchId = Boolean(c.barangay_id && user.barangayId && c.barangay_id === user.barangayId);
        const matchName = Boolean(
          c.farmerBarangay && user.assignedBarangay && c.farmerBarangay.toLowerCase() === user.assignedBarangay.toLowerCase()
        );
        return matchId || matchName;
      });
    } else if (barangayScope && barangayScope !== 'all') {
      list = list.filter(
        (c: any) =>
          c.barangay_id === barangayScope ||
          (c.farmerBarangay && c.farmerBarangay.toLowerCase() === barangayScope.toLowerCase())
      );
    }

    if (certificateType && certificateType !== 'all') {
      list = list.filter(
        (c: any) =>
          (c.certificateType || '').toLowerCase().includes(certificateType.toLowerCase()) ||
          (c.formatType || '').toLowerCase() === certificateType.toLowerCase()
      );
    }

    if (dateFrom) {
      list = list.filter((c: any) => (c.issueDate || '') >= dateFrom);
    }
    if (dateTo) {
      list = list.filter((c: any) => (c.issueDate || '') <= dateTo);
    }

    const totalCertificates = list.length;
    const totalHeads = list.reduce((sum: number, c: any) => sum + (Number(c.numberOfHeads) || 0), 0);

    return res.json({
      success: true,
      filter: {
        barangayScope: user.isAdmin ? barangayScope : user.assignedBarangay || user.barangayId,
        certificateType,
        dateFrom,
        dateTo,
      },
      summary: {
        officialTitle: 'MUNICIPAL AGRICULTURE OFFICE • OFFICIAL CERTIFICATE ISSUANCE REPORT',
        municipality: 'Hinunangan, Southern Leyte',
        totalCertificatesIssued: totalCertificates,
        totalHeadsCovered: totalHeads,
        generatedAt: new Date().toISOString(),
        generatedBy: user.username,
        userRole: user.role,
        authorizedScope: user.isAdmin ? 'All Municipal Barangays' : `Barangay ${user.assignedBarangay}`,
      },
      records: list,
    });
  });

  // =========================================================================
  // 3. LEGAL DECREES & ORDINANCES MANAGEMENT API
  // =========================================================================
  app.get('/api/legal-documents', (req, res) => {
    const { category, status, search } = req.query;
    let docs = inMemoryLegalDocs;

    if (category && category !== 'all') {
      docs = docs.filter((d: any) => d.category === category || d.type?.includes(String(category)));
    }
    if (status && status !== 'all') {
      docs = docs.filter((d: any) => d.status === status);
    }
    if (search) {
      const q = String(search).toLowerCase();
      docs = docs.filter(
        (d: any) =>
          (d.officialNumber || '').toLowerCase().includes(q) ||
          (d.title || '').toLowerCase().includes(q) ||
          (d.knownAs || '').toLowerCase().includes(q)
      );
    }

    return res.json({ success: true, count: docs.length, data: docs });
  });

  app.get('/api/legal-documents/:id', (req, res) => {
    const doc = inMemoryLegalDocs.find((d: any) => d.id === req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });
    return res.json({ success: true, data: doc });
  });

  app.post('/api/legal-documents', (req, res) => {
    const user = getUserSecurityContext(req);
    const doc = req.body;

    if (!doc || !doc.officialNumber || !doc.title) {
      return res.status(400).json({ success: false, error: 'Document official number and title are required' });
    }

    const id = doc.id || 'doc-' + Date.now();
    const newDoc = {
      ...doc,
      id,
      versionNumber: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryLegalDocs.unshift(newDoc);

    inMemoryAuditLogs.unshift({
      id: 'log-' + Date.now(),
      action: 'IMPORT_LEGAL_DOCUMENT',
      entityId: id,
      performedBy: user.username,
      role: user.role,
      timestamp: new Date().toISOString(),
      details: `Imported legal document ${newDoc.officialNumber}: "${newDoc.title}"`,
    });

    return res.status(201).json({ success: true, data: newDoc });
  });

  app.put('/api/legal-documents/:id', (req, res) => {
    const user = getUserSecurityContext(req);
    const idx = inMemoryLegalDocs.findIndex((d: any) => d.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Document not found' });

    const existing = inMemoryLegalDocs[idx];
    const updated = {
      ...existing,
      ...req.body,
      id: existing.id,
      versionNumber: (existing.versionNumber || 1) + 1,
      updatedAt: new Date().toISOString(),
    };

    inMemoryLegalDocs[idx] = updated;

    inMemoryAuditLogs.unshift({
      id: 'log-' + Date.now(),
      action: 'UPDATE_LEGAL_DOCUMENT',
      entityId: existing.id,
      performedBy: user.username,
      role: user.role,
      timestamp: new Date().toISOString(),
      details: `Updated legal document ${updated.officialNumber} (Version ${updated.versionNumber})`,
    });

    return res.json({ success: true, data: updated });
  });

  app.patch('/api/legal-documents/:id/archive', (req, res) => {
    const user = getUserSecurityContext(req);
    const doc = inMemoryLegalDocs.find((d: any) => d.id === req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });

    doc.isArchived = !doc.isArchived;
    doc.status = doc.isArchived ? 'archived' : 'active';

    inMemoryAuditLogs.unshift({
      id: 'log-' + Date.now(),
      action: doc.isArchived ? 'ARCHIVE_LEGAL_DOCUMENT' : 'RESTORE_LEGAL_DOCUMENT',
      entityId: doc.id,
      performedBy: user.username,
      role: user.role,
      timestamp: new Date().toISOString(),
      details: `${doc.isArchived ? 'Archived' : 'Restored'} legal document ${doc.officialNumber}`,
    });

    return res.json({ success: true, data: doc });
  });

  app.delete('/api/legal-documents/:id', (req, res) => {
    const user = getUserSecurityContext(req);
    if (!user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Only administrators can delete legal documents.' });
    }

    const idx = inMemoryLegalDocs.findIndex((d: any) => d.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Document not found' });

    const removed = inMemoryLegalDocs.splice(idx, 1)[0];

    inMemoryAuditLogs.unshift({
      id: 'log-' + Date.now(),
      action: 'DELETE_LEGAL_DOCUMENT',
      entityId: removed.id,
      performedBy: user.username,
      role: user.role,
      timestamp: new Date().toISOString(),
      details: `Permanently deleted legal document ${removed.officialNumber}`,
    });

    return res.json({ success: true, message: 'Document deleted successfully' });
  });

  app.get('/api/legal-documents/audit-logs', (_req, res) => {
    return res.json({ success: true, count: inMemoryAuditLogs.length, data: inMemoryAuditLogs });
  });

  // =========================================================================
  // 4. LANDING CMS SETTINGS API
  // =========================================================================
  app.get('/api/landing-settings', (_req, res) => {
    res.json({ success: true, data: inMemoryLandingSettings });
  });

  app.post('/api/landing-settings', (req, res) => {
    inMemoryLandingSettings = {
      ...req.body,
      serverUpdatedAt: new Date().toISOString(),
    };
    res.json({ success: true, data: inMemoryLandingSettings });
  });

  // API endpoint for shared Registry Form Schema Customization
  app.get('/api/registry-schema', (_req, res) => {
    res.json({ success: true, schema: savedRegistrySchema });
  });

  app.post('/api/registry-schema', (req, res) => {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid schema payload' });
    }
    savedRegistrySchema = {
      ...req.body,
      serverUpdatedAt: new Date().toISOString(),
    };
    res.json({ success: true, schema: savedRegistrySchema });
  });

  // Swine Registration Backend Validation & Record Persistence
  const PIG_ID_TAG_REGEX = /^(HIN-\d{4}-\d{4,}|HNG-[A-Z0-9]+-\d{4}-\d+)$/i;

  app.post('/api/validate-swine', (req, res) => {
    const { farmerContact, pigIdTag, earTagNo, birthDate, id } = req.body || {};
    if (!farmerContact || typeof farmerContact !== 'string' || !EXACT_11_DIGIT_REGEX.test(farmerContact)) {
      return res.status(400).json({
        isValid: false,
        field: 'farmerContact',
        error: 'Contact number must contain exactly 11 digits.',
      });
    }

    const tag = (pigIdTag || earTagNo || '').trim();
    if (tag && !PIG_ID_TAG_REGEX.test(tag)) {
      return res.status(400).json({
        isValid: false,
        field: 'pigIdTag',
        error: 'Invalid Pig ID Tag format. Expected format: HIN-YYYY-XXXX (e.g. HIN-2026-0001).',
      });
    }

    if (tag) {
      const isDuplicate = inMemorySwineRecords.some(
        r => r.id !== id && (r.pigIdTag?.toUpperCase() === tag.toUpperCase() || r.earTagNo?.toUpperCase() === tag.toUpperCase())
      );
      if (isDuplicate) {
        return res.status(400).json({
          isValid: false,
          field: 'pigIdTag',
          error: `Pig ID Tag "${tag}" already exists. Must be unique.`,
        });
      }
    }

    if (birthDate) {
      const bDate = new Date(birthDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (bDate.getTime() > today.getTime()) {
        return res.status(400).json({
          isValid: false,
          field: 'birthDate',
          error: 'Birth date cannot be in the future.',
        });
      }
    }

    res.json({ isValid: true });
  });

  // Strict Barangay-Based Swine Registry Query API
  app.get('/api/swine', async (req, res) => {
    const user = getUserSecurityContext(req);
    const requestedBarangay =
      (req.query.filter_barangay as string) ||
      (req.query.barangay as string) ||
      (req.query.barangayId as string);

    let sourceSwine = inMemorySwineRecords;
    try {
      const dbSwine = await getAllSwineRecords();
      if (dbSwine && dbSwine.length > 0) {
        sourceSwine = dbSwine.map((s: any) => ({
          ...s,
          farmerAddress: s.farmName,
          barangay_id: `brgy-${s.barangay.toLowerCase().replace(/\s+/g, '-')}`,
          weightKg: s.actualWeightKg ? Number(s.actualWeightKg) : undefined,
          status: (s.status || 'HEALTHY').toLowerCase(),
          ...(s.customFields && typeof s.customFields === 'object' ? s.customFields : {}),
        }));
      }
    } catch (dbErr) {
      console.warn('Database fetch fallback for swine:', dbErr);
    }

    if (!user.isAdmin) {
      if (
        requestedBarangay &&
        requestedBarangay !== 'all' &&
        requestedBarangay !== user.barangayId &&
        requestedBarangay.toLowerCase() !== user.assignedBarangay.toLowerCase()
      ) {
        return res.status(403).json({
          success: false,
          error: `Access Denied: You are not authorized to view swine records outside your assigned barangay (${user.assignedBarangay || user.barangayId}).`,
        });
      }

      if (requestedBarangay === 'all') {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: Non-admin users cannot query swine records for all barangays.',
        });
      }

      const filtered = sourceSwine.filter((s: any) => {
        const matchId = Boolean(s.barangay_id && user.barangayId && s.barangay_id === user.barangayId);
        const matchName = Boolean(
          s.barangay && user.assignedBarangay && s.barangay.toLowerCase() === user.assignedBarangay.toLowerCase()
        );
        return matchId || matchName;
      });

      return res.json({
        success: true,
        count: filtered.length,
        data: filtered,
        scope: user.assignedBarangay || user.barangayId,
      });
    }

    let list = sourceSwine;
    if (requestedBarangay && requestedBarangay !== 'all') {
      list = list.filter(
        (s: any) =>
          s.barangay_id === requestedBarangay ||
          (s.barangay && s.barangay.toLowerCase() === requestedBarangay.toLowerCase())
      );
    }
    return res.json({ success: true, count: list.length, data: list, scope: 'all_permitted' });
  });

  // Single Swine Record Access API with Strict Security Check
  app.get('/api/swine/:id', (req, res) => {
    const user = getUserSecurityContext(req);
    const swine = inMemorySwineRecords.find((s: any) => s.id === req.params.id);
    if (!swine) {
      return res.status(404).json({ success: false, error: 'Swine record not found.' });
    }

    if (!user.isAdmin) {
      const matchId = Boolean(swine.barangay_id && user.barangayId && swine.barangay_id === user.barangayId);
      const matchName = Boolean(
        swine.barangay && user.assignedBarangay && swine.barangay.toLowerCase() === user.assignedBarangay.toLowerCase()
      );
      if (!matchId && !matchName) {
        return res.status(403).json({
          success: false,
          error: `Access Denied: You are not authorized to view this swine record from Barangay ${swine.barangay}. It is restricted to officers of that barangay.`,
        });
      }
    }

    res.json({ success: true, data: swine });
  });

  // Barangay-level Swine Summary Stats API
  app.get('/api/swine/stats/summary', (req, res) => {
    const user = getUserSecurityContext(req);
    let list = inMemorySwineRecords;

    if (!user.isAdmin) {
      list = list.filter((s: any) => {
        const matchId = Boolean(s.barangay_id && user.barangayId && s.barangay_id === user.barangayId);
        const matchName = Boolean(
          s.barangay && user.assignedBarangay && s.barangay.toLowerCase() === user.assignedBarangay.toLowerCase()
        );
        return matchId || matchName;
      });
    }

    const summary = {
      totalHogs: list.length,
      healthyHogs: list.filter((s: any) => (s.status || '').toLowerCase() === 'healthy').length,
      underMonitoring: list.filter((s: any) => (s.status || '').toLowerCase() === 'monitoring').length,
      suspectedASF: list.filter((s: any) => (s.status || '').toLowerCase() === 'suspected').length,
      readyToSell: list.filter((s: any) => s.readyToSell).length,
      backyardFarms: list.filter((s: any) => (s.farmScale || '').toUpperCase() === 'BACKYARD').length,
      commercialFarms: list.filter((s: any) => (s.farmScale || '').toUpperCase() !== 'BACKYARD').length,
      byBarangay: {} as Record<string, number>,
    };

    list.forEach((s: any) => {
      const b = s.barangay || 'Unknown';
      summary.byBarangay[b] = (summary.byBarangay[b] || 0) + 1;
    });

    res.json({
      success: true,
      data: summary,
      scope: user.isAdmin ? 'all_permitted' : (user.assignedBarangay || user.barangayId),
    });
  });

  app.post('/api/swine', async (req, res) => {
    const record = req.body;
    if (!record || typeof record !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid record payload' });
    }

    const { farmerContact, pigIdTag, earTagNo, birthDate } = record;
    if (!farmerContact || typeof farmerContact !== 'string' || !EXACT_11_DIGIT_REGEX.test(farmerContact)) {
      return res.status(400).json({
        success: false,
        field: 'farmerContact',
        error: 'Contact number must contain exactly 11 digits.',
      });
    }

    const tag = (pigIdTag || earTagNo || '').trim();
    if (tag && !PIG_ID_TAG_REGEX.test(tag)) {
      return res.status(400).json({
        success: false,
        field: 'pigIdTag',
        error: 'Invalid Pig ID Tag format. Expected format: HIN-YYYY-XXXX (e.g. HIN-2026-0001).',
      });
    }

    if (tag) {
      const isDuplicate = inMemorySwineRecords.some(
        r => r.pigIdTag?.toUpperCase() === tag.toUpperCase() || r.earTagNo?.toUpperCase() === tag.toUpperCase()
      );
      if (isDuplicate) {
        return res.status(400).json({
          success: false,
          field: 'pigIdTag',
          error: `Pig ID Tag "${tag}" is already assigned to another swine. Must be unique.`,
        });
      }
    }

    if (birthDate) {
      const bDate = new Date(birthDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (bDate.getTime() > today.getTime()) {
        return res.status(400).json({
          success: false,
          field: 'birthDate',
          error: 'Birth date cannot be in the future.',
        });
      }
    }

    const newRec = {
      ...record,
      id: record.id || `swine-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      pigIdTag: record.pigIdTag || record.earTagNo,
      serverRegisteredAt: new Date().toISOString(),
    };
    try {
      await upsertSwineRecord(newRec);
    } catch (err) {
      console.warn('PostgreSQL insert fallback:', err);
    }
    inMemorySwineRecords.unshift(newRec);
    res.status(201).json({ success: true, record: newRec });
  });

  app.put('/api/swine/:id', async (req, res) => {
    const record = req.body;
    const { farmerContact, pigIdTag, earTagNo, birthDate } = record || {};
    if (!farmerContact || typeof farmerContact !== 'string' || !EXACT_11_DIGIT_REGEX.test(farmerContact)) {
      return res.status(400).json({
        success: false,
        field: 'farmerContact',
        error: 'Contact number must contain exactly 11 digits.',
      });
    }

    const tag = (pigIdTag || earTagNo || '').trim();
    if (tag) {
      const isDuplicate = inMemorySwineRecords.some(
        (r) => r.id !== req.params.id && (r.pigIdTag?.toUpperCase() === tag.toUpperCase() || r.earTagNo?.toUpperCase() === tag.toUpperCase())
      );
      if (isDuplicate) {
        return res.status(400).json({
          success: false,
          field: 'pigIdTag',
          error: `Pig ID Tag "${tag}" already exists. Must be unique.`,
        });
      }
    }

    if (birthDate) {
      const bDate = new Date(birthDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (bDate.getTime() > today.getTime()) {
        return res.status(400).json({
          success: false,
          field: 'birthDate',
          error: 'Birth date cannot be in the future.',
        });
      }
    }

    const updated = { ...record, id: req.params.id, serverUpdatedAt: new Date().toISOString() };
    try {
      await upsertSwineRecord(updated);
    } catch (err) {
      console.warn('PostgreSQL update fallback:', err);
    }

    const idx = inMemorySwineRecords.findIndex((r) => r.id === req.params.id);
    if (idx !== -1) {
      inMemorySwineRecords[idx] = updated;
    } else {
      inMemorySwineRecords.push(updated);
    }
    res.json({ success: true, record: updated });
  });

  // Delete Swine Record Endpoint
  app.delete('/api/swine/:id', async (req, res) => {
    const user = getUserSecurityContext(req);
    if (!user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Access Denied: Only administrators can delete swine records.' });
    }
    const { id } = req.params;
    try {
      await deleteSwineRecordById(id);
    } catch (err) {
      console.warn('PostgreSQL delete fallback:', err);
    }
    const idx = inMemorySwineRecords.findIndex(r => r.id === id);
    if (idx !== -1) inMemorySwineRecords.splice(idx, 1);
    return res.json({ success: true, message: 'Swine record deleted successfully.' });
  });

  // Bulk Delete Swine Records Endpoint
  app.post('/api/swine/bulk-delete', async (req, res) => {
    const user = getUserSecurityContext(req);
    if (!user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Access Denied: Only administrators can delete swine records.' });
    }
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid or empty IDs list.' });
    }
    try {
      await deleteSwineRecordsByIds(ids);
    } catch (err) {
      console.warn('PostgreSQL bulk delete fallback:', err);
    }
    const idSet = new Set(ids);
    for (let i = inMemorySwineRecords.length - 1; i >= 0; i--) {
      if (idSet.has(inMemorySwineRecords[i].id)) {
        inMemorySwineRecords.splice(i, 1);
      }
    }
    return res.json({ success: true, deletedCount: ids.length });
  });

  return app;
}

export const app = createApp();
