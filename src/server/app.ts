import express from 'express';
import { HINUNANGAN_BARANGAYS } from '../data/barangays.ts';
import { ALL_ASF_REGULATIONS } from '../data/asfRegulationsData.ts';
import {
  getAllSwineRecords,
  getSwineRecordById,
  upsertSwineRecord,
  deleteSwineRecordById,
  deleteSwineRecordsByIds,
} from '../db/swine.ts';
import { getAllCertificates, upsertCertificate } from '../db/certificates.ts';
import { getAllUsers, getUserByUsernameOrEmail, upsertUser, deleteUserByUid } from '../db/users.ts';
import { getAllMessages, createMessage, markMessageRead, deleteMessageById } from '../db/messages.ts';
import { getAllMedia, insertMedia, deleteMediaById } from '../db/media.ts';
import { getSystemSetting, setSystemSetting } from '../db/settings.ts';
import { initPostgresTables } from '../db/index.ts';
import { DEFAULT_SIDEBAR_THEME, INITIAL_REGISTRY_FORM_SCHEMA } from '../data/initialFormSchema.ts';
import { INITIAL_LANDING_CONFIG } from '../data/initialData.ts';

export function createApp() {
  const app = express();

  // Non-blocking background table verification
  initPostgresTables().catch(err => {
    console.warn('PostgreSQL table check notice:', err?.message || err);
  });

  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  // Health check endpoints for Cloud Run, Vercel & orchestration
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'hinunangan-swine-registry', timestamp: new Date().toISOString() });
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'hinunangan-swine-registry', timestamp: new Date().toISOString() });
  });

  // Regex patterns
  const EXACT_11_DIGIT_REGEX = /^\d{11}$/;
  const PIG_ID_TAG_REGEX = /^HIN-\d{4}-\d{4,}$/;

  // Helper to extract authenticated user security context
  function getUserSecurityContext(req: express.Request) {
    const role = (req.headers['x-user-role'] as string) || (req.query.role as string) || 'focal';
    const barangayId = (req.headers['x-user-barangay-id'] as string) || (req.query.barangay_id as string) || '';
    const assignedBarangay = (req.headers['x-user-assigned-barangay'] as string) || (req.query.assigned_barangay as string) || '';
    const userId = (req.headers['x-user-id'] as string) || (req.query.user_id as string) || 'user';
    const username = (req.headers['x-user-name'] as string) || (req.query.user_name as string) || 'User';
    const isAdmin = role === 'admin';
    const isAgent = role === 'agent';
    return { role, barangayId, assignedBarangay, userId, username, isAdmin, isAgent };
  }

  // =========================================================================
  // 1. AUTHENTICATION & USER ACCOUNTS (DATABASE-DRIVEN)
  // =========================================================================

  // Login endpoint
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    try {
      const user = await getUserByUsernameOrEmail(username.trim());
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid username or password.' });
      }

      if (user.password && user.password !== password.trim()) {
        return res.status(401).json({ success: false, error: 'Invalid username or password.' });
      }

      const safeUser = { ...user };
      delete (safeUser as any).password;

      return res.json({
        success: true,
        user: safeUser,
        role: safeUser.role,
        assignedBarangay: safeUser.assignedBarangay,
      });
    } catch (err: any) {
      console.error('Error during login authentication:', err);
      return res.status(500).json({ success: false, error: 'Database authentication service unavailable.' });
    }
  });

  // Get all user accounts (Admin only)
  app.get('/api/accounts', async (req, res) => {
    const user = getUserSecurityContext(req);
    if (!user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Access Denied: Only administrators can view user accounts.' });
    }

    try {
      const allUsers = await getAllUsers();
      const sanitized = allUsers.map(u => {
        const copy = { ...u };
        return copy;
      });
      return res.json({ success: true, count: sanitized.length, data: sanitized });
    } catch (err: any) {
      console.error('Error fetching accounts from database:', err);
      return res.status(500).json({ success: false, error: 'Unable to retrieve user accounts from database.' });
    }
  });

  app.get('/api/users', async (req, res) => {
    const user = getUserSecurityContext(req);
    if (!user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Access Denied: Only administrators can view user accounts.' });
    }
    try {
      const allUsers = await getAllUsers();
      return res.json({ success: true, count: allUsers.length, data: allUsers });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Unable to retrieve user accounts from database.' });
    }
  });

  // Create or Update user account
  app.post('/api/accounts', async (req, res) => {
    const admin = getUserSecurityContext(req);
    if (!admin.isAdmin) {
      return res.status(403).json({ success: false, error: 'Access Denied: Only administrators can create user accounts.' });
    }

    const payload = req.body;
    if (!payload || !payload.email) {
      return res.status(400).json({ success: false, error: 'User email is required.' });
    }

    try {
      const saved = await upsertUser(payload);
      return res.status(201).json({ success: true, data: saved });
    } catch (err: any) {
      console.error('Error creating user account:', err);
      return res.status(500).json({ success: false, error: 'Failed to save user account to database.' });
    }
  });

  app.put('/api/accounts/:id', async (req, res) => {
    const admin = getUserSecurityContext(req);
    if (!admin.isAdmin) {
      return res.status(403).json({ success: false, error: 'Access Denied: Only administrators can update user accounts.' });
    }

    const { id } = req.params;
    const payload = { ...req.body, id };

    try {
      const saved = await upsertUser(payload);
      return res.json({ success: true, data: saved });
    } catch (err: any) {
      console.error('Error updating user account:', err);
      return res.status(500).json({ success: false, error: 'Failed to update user account in database.' });
    }
  });

  app.delete('/api/accounts/:id', async (req, res) => {
    const admin = getUserSecurityContext(req);
    if (!admin.isAdmin) {
      return res.status(403).json({ success: false, error: 'Access Denied: Only administrators can delete user accounts.' });
    }

    const { id } = req.params;
    try {
      await deleteUserByUid(id);
      return res.json({ success: true, message: 'User account removed from database.' });
    } catch (err: any) {
      console.error('Error deleting user account:', err);
      return res.status(500).json({ success: false, error: 'Failed to delete user account from database.' });
    }
  });

  // =========================================================================
  // 2. SWINE RECORDS - STRICT DATABASE SOURCE OF TRUTH
  // =========================================================================

  // Next authoritative Pig ID Generator
  app.get('/api/swine-records/next-id', async (_req, res) => {
    try {
      const currentYear = new Date().getFullYear();
      const { total } = await getAllSwineRecords();
      const nextSequence = String(total + 1).padStart(4, '0');
      const nextPigId = `HIN-${currentYear}-${nextSequence}`;
      return res.json({ success: true, nextPigId });
    } catch (err: any) {
      const fallbackSeq = String(Math.floor(1000 + Math.random() * 9000));
      return res.json({ success: true, nextPigId: `HIN-${new Date().getFullYear()}-${fallbackSeq}` });
    }
  });

  // Helper handler for GET /api/swine-records and /api/swine
  const handleGetSwineRecords = async (req: express.Request, res: express.Response) => {
    const user = getUserSecurityContext(req);
    const requestedBarangay =
      (req.query.filter_barangay as string) ||
      (req.query.barangay as string) ||
      (req.query.barangayId as string);
    const search = req.query.search as string;
    const status = req.query.status as string;
    const readyToSell = req.query.readyToSell !== undefined ? req.query.readyToSell === 'true' : (user.isAgent ? true : undefined);
    const isArchived = req.query.isArchived !== undefined ? req.query.isArchived === 'true' : false;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const perPage = req.query.per_page || req.query.perPage ? parseInt((req.query.per_page || req.query.perPage) as string, 10) : undefined;

    // Security check: non-admins cannot query other barangays or 'all'
    if (!user.isAdmin && !user.isAgent) {
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
    }

    const effectiveBarangay = (user.isAdmin || user.isAgent)
      ? (requestedBarangay && requestedBarangay !== 'all' ? requestedBarangay : undefined)
      : (user.assignedBarangay || user.barangayId);

    try {
      const { records, total } = await getAllSwineRecords({
        barangay: effectiveBarangay,
        search,
        status,
        readyToSell,
        isArchived,
        page,
        perPage,
      });

      return res.json({
        success: true,
        count: records.length,
        total,
        data: records,
        scope: user.isAdmin ? (effectiveBarangay || 'all_permitted') : (user.assignedBarangay || user.barangayId),
      });
    } catch (err: any) {
      console.error('Database query error in swine records endpoint:', err);
      return res.status(500).json({
        success: false,
        error: 'Unable to connect to the Swine Registry database. Please check the backend connection.',
      });
    }
  };

  app.get('/api/swine-records', handleGetSwineRecords);
  app.get('/api/swine', handleGetSwineRecords);

  // Single Swine Record Access API
  const handleGetSingleSwine = async (req: express.Request, res: express.Response) => {
    const user = getUserSecurityContext(req);
    const { id } = req.params;

    try {
      const swine = await getSwineRecordById(id);
      if (!swine) {
        return res.status(404).json({ success: false, error: 'Swine record not found.' });
      }

      if (!user.isAdmin && !user.isAgent) {
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

      return res.json({ success: true, data: swine, record: swine });
    } catch (err: any) {
      console.error('Error fetching single swine record:', err);
      return res.status(500).json({
        success: false,
        error: 'Unable to connect to the Swine Registry database. Please check the backend connection.',
      });
    }
  };

  app.get('/api/swine-records/:id', handleGetSingleSwine);
  app.get('/api/swine/:id', handleGetSingleSwine);

  // Create Swine Record API
  const handleCreateSwine = async (req: express.Request, res: express.Response) => {
    const user = getUserSecurityContext(req);
    if (user.isAgent) {
      return res.status(403).json({ success: false, error: 'Access Denied: Agent accounts are view-only.' });
    }

    const record = req.body;
    if (!record || typeof record !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid record payload' });
    }

    const { farmerContact, pigIdTag, earTagNo, birthDate } = record;
    if (farmerContact && (!EXACT_11_DIGIT_REGEX.test(farmerContact.replace(/\D/g, '')))) {
      return res.status(400).json({
        success: false,
        field: 'farmerContact',
        error: 'Contact number must contain exactly 11 digits.',
      });
    }

    let tag = (pigIdTag || earTagNo || '').trim();
    if (!tag) {
      // Auto-generate authoritative ID if not supplied
      const currentYear = new Date().getFullYear();
      const { total } = await getAllSwineRecords();
      tag = `HIN-${currentYear}-${String(total + 1).padStart(4, '0')}`;
    }

    if (tag && !PIG_ID_TAG_REGEX.test(tag)) {
      return res.status(400).json({
        success: false,
        field: 'pigIdTag',
        error: 'Invalid Pig ID Tag format. Expected format: HIN-YYYY-XXXX (e.g. HIN-2026-0001).',
      });
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

    if (!user.isAdmin && user.assignedBarangay) {
      record.barangay = user.assignedBarangay;
      if (user.barangayId) record.barangay_id = user.barangayId;
    }

    const newRec = {
      ...record,
      id: record.id || `swine-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      pigIdTag: tag,
      earTagNo: tag,
      registeredBy: user.username,
      registeredAt: record.registeredAt || new Date().toISOString(),
    };

    try {
      const saved = await upsertSwineRecord(newRec);
      return res.status(201).json({ success: true, data: saved, record: saved });
    } catch (err: any) {
      console.error('Error inserting swine record to database:', err);
      return res.status(500).json({
        success: false,
        error: 'Unable to connect to the Swine Registry database. Please check the backend connection.',
      });
    }
  };

  app.post('/api/swine-records', handleCreateSwine);
  app.post('/api/swine', handleCreateSwine);

  // Update Swine Record API
  const handleUpdateSwine = async (req: express.Request, res: express.Response) => {
    const user = getUserSecurityContext(req);
    if (user.isAgent) {
      return res.status(403).json({ success: false, error: 'Access Denied: Agent accounts are view-only.' });
    }

    const { id } = req.params;
    const record = req.body;

    const { farmerContact, birthDate } = record || {};
    if (farmerContact && (!EXACT_11_DIGIT_REGEX.test(farmerContact.replace(/\D/g, '')))) {
      return res.status(400).json({
        success: false,
        field: 'farmerContact',
        error: 'Contact number must contain exactly 11 digits.',
      });
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

    const updated = { ...record, id };

    try {
      const saved = await upsertSwineRecord(updated);
      return res.json({ success: true, data: saved, record: saved });
    } catch (err: any) {
      console.error('Error updating swine record in database:', err);
      return res.status(500).json({
        success: false,
        error: 'Unable to connect to the Swine Registry database. Please check the backend connection.',
      });
    }
  };

  app.put('/api/swine-records/:id', handleUpdateSwine);
  app.put('/api/swine/:id', handleUpdateSwine);

  // Toggle Sell Status API
  const handleToggleSell = async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const { readyToSell, priceEstimate } = req.body || {};

    try {
      const existing = await getSwineRecordById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Swine record not found.' });
      }

      const updated = {
        ...existing,
        readyToSell: Boolean(readyToSell),
        status: readyToSell ? 'ready_to_sell' : (existing.status === 'ready_to_sell' ? 'healthy' : existing.status),
        priceEstimate: priceEstimate !== undefined ? String(priceEstimate) : existing.estimatedPricePhp,
      };

      const saved = await upsertSwineRecord(updated);
      return res.json({ success: true, data: saved, record: saved });
    } catch (err: any) {
      console.error('Error updating sell status:', err);
      return res.status(500).json({
        success: false,
        error: 'Unable to connect to the Swine Registry database. Please check the backend connection.',
      });
    }
  };

  app.patch('/api/swine-records/:id/sell', handleToggleSell);
  app.patch('/api/swine/:id/sell', handleToggleSell);

  // Delete Swine Record API (Admin only)
  const handleDeleteSwine = async (req: express.Request, res: express.Response) => {
    const user = getUserSecurityContext(req);
    if (!user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Access Denied: Only administrators can delete swine records.' });
    }
    const { id } = req.params;
    try {
      await deleteSwineRecordById(id);
      return res.json({ success: true, message: 'Swine record deleted successfully.' });
    } catch (err: any) {
      console.error('Error deleting swine record:', err);
      return res.status(500).json({
        success: false,
        error: 'Unable to connect to the Swine Registry database. Please check the backend connection.',
      });
    }
  };

  app.delete('/api/swine-records/:id', handleDeleteSwine);
  app.delete('/api/swine/:id', handleDeleteSwine);

  // Bulk Delete Swine Records API (Admin only)
  const handleBulkDeleteSwine = async (req: express.Request, res: express.Response) => {
    const user = getUserSecurityContext(req);
    if (!user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Access Denied: Only administrators can delete swine records.' });
    }
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid or empty IDs list.' });
    }
    try {
      const deletedCount = await deleteSwineRecordsByIds(ids);
      return res.json({ success: true, deletedCount });
    } catch (err: any) {
      console.error('Error bulk deleting swine records:', err);
      return res.status(500).json({
        success: false,
        error: 'Unable to connect to the Swine Registry database. Please check the backend connection.',
      });
    }
  };

  app.post('/api/swine-records/bulk-delete', handleBulkDeleteSwine);
  app.post('/api/swine/bulk-delete', handleBulkDeleteSwine);

  // =========================================================================
  // 3. FARMERS API (DATABASE-DERIVED)
  // =========================================================================
  app.get('/api/farmers', async (req, res) => {
    const user = getUserSecurityContext(req);
    const effectiveBarangay = user.isAdmin ? undefined : (user.assignedBarangay || user.barangayId);

    try {
      const { records } = await getAllSwineRecords({
        barangay: effectiveBarangay,
      });

      const farmerMap: Record<string, any> = {};

      records.forEach(r => {
        const key = `${(r.farmerName || '').trim().toLowerCase()}_${(r.barangay || '').trim().toLowerCase()}`;
        if (!farmerMap[key]) {
          farmerMap[key] = {
            id: `frm-${r.id}`,
            farmerName: r.farmerName,
            contactNumber: r.farmerContact || 'Not provided',
            address: r.farmerAddress || r.farmName || r.barangay,
            barangay: r.barangay,
            barangayId: r.barangay_id,
            farmScale: r.farmScale,
            farmType: r.farmType,
            swineCount: 0,
            readyToSellCount: 0,
            pigs: [],
            biosecurity: r.biosecurity,
            status: 'ACTIVE',
            registeredAt: r.registeredAt,
          };
        }
        farmerMap[key].swineCount += 1;
        if (r.readyToSell || r.status === 'ready_to_sell') {
          farmerMap[key].readyToSellCount += 1;
        }
        farmerMap[key].pigs.push({
          id: r.id,
          pigIdTag: r.pigIdTag,
          breed: r.breed,
          swineType: r.swineType,
          status: r.status,
          readyToSell: r.readyToSell,
        });
      });

      const farmerList = Object.values(farmerMap);
      return res.json({
        success: true,
        count: farmerList.length,
        data: farmerList,
      });
    } catch (err: any) {
      console.error('Error fetching farmers from database:', err);
      return res.status(500).json({
        success: false,
        error: 'Unable to retrieve farmers from database.',
      });
    }
  });

  // =========================================================================
  // 4. BARANGAYS API (DATABASE-ENRICHED REAL-TIME STATISTICS)
  // =========================================================================
  app.get('/api/barangays', async (_req, res) => {
    try {
      const { records } = await getAllSwineRecords();

      const countsByBarangay: Record<string, { totalSwine: number; readyToSell: number; farmers: Set<string> }> = {};

      records.forEach(r => {
        const bName = (r.barangay || '').trim().toLowerCase();
        if (!countsByBarangay[bName]) {
          countsByBarangay[bName] = { totalSwine: 0, readyToSell: 0, farmers: new Set() };
        }
        countsByBarangay[bName].totalSwine += 1;
        if (r.readyToSell || r.status === 'ready_to_sell') {
          countsByBarangay[bName].readyToSell += 1;
        }
        if (r.farmerName) {
          countsByBarangay[bName].farmers.add(r.farmerName.trim().toLowerCase());
        }
      });

      const enrichedBarangays = HINUNANGAN_BARANGAYS.map(b => {
        const stats = countsByBarangay[b.name.toLowerCase()] || { totalSwine: 0, readyToSell: 0, farmers: new Set() };
        return {
          ...b,
          registeredSwineCount: stats.totalSwine,
          registeredFarmerCount: stats.farmers.size,
          readyToSellCount: stats.readyToSell,
          asfZone: b.defaultRiskLevel.toUpperCase(),
        };
      });

      return res.json({
        success: true,
        count: enrichedBarangays.length,
        data: enrichedBarangays,
      });
    } catch (err: any) {
      console.error('Error computing barangay statistics:', err);
      return res.json({ success: true, count: HINUNANGAN_BARANGAYS.length, data: HINUNANGAN_BARANGAYS });
    }
  });

  // =========================================================================
  // 5. DASHBOARD & GIS STATISTICS API (DATABASE-DRIVEN)
  // =========================================================================
  app.get('/api/dashboard/stats', async (req, res) => {
    const user = getUserSecurityContext(req);
    const effectiveBarangay = user.isAdmin ? undefined : (user.assignedBarangay || user.barangayId);

    try {
      const { records, total } = await getAllSwineRecords({
        barangay: effectiveBarangay,
      });

      const farmersSet = new Set<string>();
      const barangaysWithPigs = new Set<string>();
      let healthyCount = 0;
      let quarantinedCount = 0;
      let sickCount = 0;
      let readyToSellCount = 0;
      let backyardCount = 0;
      let commercialCount = 0;

      const swineByType: Record<string, number> = {};
      const swineByBarangay: Record<string, number> = {};
      const asfDistribution: Record<string, number> = { GREEN: 0, YELLOW: 0, RED: 0, PINK: 0 };
      const monthlyRegistrations: Record<string, number> = {};

      records.forEach(r => {
        if (r.farmerName) farmersSet.add(`${r.farmerName.trim().toLowerCase()}_${r.barangay}`);
        if (r.barangay) {
          barangaysWithPigs.add(r.barangay);
          swineByBarangay[r.barangay] = (swineByBarangay[r.barangay] || 0) + 1;
        }

        const st = (r.status || 'healthy').toLowerCase();
        if (st === 'healthy') healthyCount++;
        else if (st === 'quarantined') quarantinedCount++;
        else if (st === 'sick') sickCount++;

        if (r.readyToSell || st === 'ready_to_sell') readyToSellCount++;

        if ((r.farmScale || '').toUpperCase() === 'BACKYARD') backyardCount++;
        else commercialCount++;

        const type = (r.swineType || 'grower').toLowerCase();
        swineByType[type] = (swineByType[type] || 0) + 1;

        const zone = (r.asfZone || 'RED').toUpperCase();
        asfDistribution[zone] = (asfDistribution[zone] || 0) + 1;

        if (r.registeredAt) {
          const monthKey = r.registeredAt.substring(0, 7); // YYYY-MM
          monthlyRegistrations[monthKey] = (monthlyRegistrations[monthKey] || 0) + 1;
        }
      });

      const stats = {
        totalSwine: total,
        totalFarmers: farmersSet.size,
        totalBarangays: user.isAdmin ? HINUNANGAN_BARANGAYS.length : 1,
        activeBarangaysWithSwine: barangaysWithPigs.size,
        healthySwine: healthyCount,
        quarantinedSwine: quarantinedCount,
        sickSwine: sickCount,
        readyToSell: readyToSellCount,
        backyardFarms: backyardCount,
        commercialFarms: commercialCount,
        swineByType,
        swineByBarangay,
        asfDistribution,
        monthlyRegistrations,
      };

      return res.json({ success: true, data: stats, scope: user.isAdmin ? 'all' : user.assignedBarangay });
    } catch (err: any) {
      console.error('Error computing dashboard statistics:', err);
      return res.status(500).json({ success: false, error: 'Unable to retrieve dashboard statistics from database.' });
    }
  });

  app.get('/api/swine-records/stats/summary', async (req, res) => {
    const user = getUserSecurityContext(req);
    const effectiveBarangay = user.isAdmin ? undefined : (user.assignedBarangay || user.barangayId);

    try {
      const { records } = await getAllSwineRecords({
        barangay: effectiveBarangay,
      });

      const summary = {
        totalHogs: records.length,
        healthyHogs: records.filter(s => (s.status || '').toLowerCase() === 'healthy').length,
        underMonitoring: records.filter(s => (s.status || '').toLowerCase() === 'quarantined' || (s.status || '').toLowerCase() === 'sick').length,
        suspectedASF: records.filter(s => (s.status || '').toLowerCase() === 'sick').length,
        readyToSell: records.filter(s => s.readyToSell || s.status === 'ready_to_sell').length,
        backyardFarms: records.filter(s => (s.farmScale || '').toUpperCase() === 'BACKYARD').length,
        commercialFarms: records.filter(s => (s.farmScale || '').toUpperCase() !== 'BACKYARD').length,
        byBarangay: {} as Record<string, number>,
      };

      records.forEach(s => {
        const b = s.barangay || 'Unknown';
        summary.byBarangay[b] = (summary.byBarangay[b] || 0) + 1;
      });

      return res.json({
        success: true,
        data: summary,
        scope: user.isAdmin ? 'all_permitted' : (user.assignedBarangay || user.barangayId),
      });
    } catch (err: any) {
      console.error('Error computing swine stats:', err);
      return res.status(500).json({
        success: false,
        error: 'Unable to connect to the Swine Registry database. Please check the backend connection.',
      });
    }
  });

  // =========================================================================
  // 6. CERTIFICATES & MOVEMENT PERMITS (DATABASE-DRIVEN)
  // =========================================================================
  app.get('/api/certificates', async (req, res) => {
    const user = getUserSecurityContext(req);
    const requestedBarangay = (req.query.filter_barangay as string) || (req.query.barangay as string);

    try {
      const dbCerts = await getAllCertificates();
      let list = dbCerts;

      if (!user.isAdmin) {
        list = list.filter((c: any) => {
          const matchId = Boolean(c.barangay_id && user.barangayId && c.barangay_id === user.barangayId);
          const matchName = Boolean(
            c.farmerBarangay && user.assignedBarangay && c.farmerBarangay.toLowerCase() === user.assignedBarangay.toLowerCase()
          );
          const matchIssuer = Boolean(
            c.issuingBarangay && user.assignedBarangay && c.issuingBarangay.toLowerCase() === user.assignedBarangay.toLowerCase()
          );
          return matchId || matchName || matchIssuer;
        });
      } else if (requestedBarangay && requestedBarangay !== 'all') {
        list = list.filter((c: any) => (c.barangay || '').toLowerCase() === requestedBarangay.toLowerCase());
      }

      return res.json({ success: true, count: list.length, data: list });
    } catch (err: any) {
      console.error('Error fetching certificates:', err);
      return res.status(500).json({ success: false, error: 'Unable to retrieve certificates from database.' });
    }
  });

  app.post('/api/certificates', async (req, res) => {
    const user = getUserSecurityContext(req);
    const cert = req.body;

    if (!cert || (!cert.controlNumber && !cert.certificateNo)) {
      return res.status(400).json({ success: false, error: 'Invalid certificate payload' });
    }

    if (!user.isAdmin && user.assignedBarangay) {
      cert.barangay = user.assignedBarangay;
      cert.farmerBarangay = user.assignedBarangay;
      cert.issuingBarangay = user.assignedBarangay;
    }

    try {
      const saved = await upsertCertificate({
        ...cert,
        id: cert.id || `cert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      });
      return res.status(201).json({ success: true, data: saved });
    } catch (err: any) {
      console.error('Error issuing certificate:', err);
      return res.status(500).json({ success: false, error: 'Failed to issue certificate to database.' });
    }
  });

  // =========================================================================
  // 7. MESSAGES (DATABASE-DRIVEN)
  // =========================================================================
  app.get('/api/messages', async (req, res) => {
    const user = getUserSecurityContext(req);
    try {
      const list = await getAllMessages({
        role: user.role,
        barangay: user.assignedBarangay,
        userId: user.userId,
      });
      return res.json({ success: true, count: list.length, data: list });
    } catch (err: any) {
      console.warn('Error retrieving messages from database:', err?.message || err);
      return res.json({ success: true, count: 0, data: [] });
    }
  });

  app.post('/api/messages', async (req, res) => {
    const user = getUserSecurityContext(req);
    const payload = req.body;
    if (!payload || !payload.message) {
      return res.status(400).json({ success: false, error: 'Message content is required.' });
    }

    try {
      const newMsg = await createMessage({
        ...payload,
        senderId: user.userId,
        senderName: user.username,
        senderRole: user.role as any,
        barangay: user.assignedBarangay,
      });
      return res.status(201).json({ success: true, data: newMsg });
    } catch (err: any) {
      console.error('Error creating message:', err);
      return res.status(500).json({ success: false, error: 'Failed to send message.' });
    }
  });

  app.patch('/api/messages/:id/read', async (req, res) => {
    const { id } = req.params;
    try {
      await markMessageRead(id);
      return res.json({ success: true, message: 'Message marked as read.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to update message.' });
    }
  });

  app.delete('/api/messages/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await deleteMessageById(id);
      return res.json({ success: true, message: 'Message deleted.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to delete message.' });
    }
  });

  // =========================================================================
  // 8. MEDIA FILES & UPLOAD (DATABASE-DRIVEN)
  // =========================================================================
  app.get('/api/media', async (req, res) => {
    const category = req.query.category as string;
    try {
      const items = await getAllMedia(category);
      return res.json({ success: true, count: items.length, data: items });
    } catch (err: any) {
      console.error('Error fetching media:', err);
      return res.status(500).json({ success: false, error: 'Unable to retrieve media from database.' });
    }
  });

  app.post('/api/media/upload', async (req, res) => {
    const user = getUserSecurityContext(req);
    const { fileName, fileUrl, base64, mimeType, fileSize, category, altText } = req.body || {};

    const resolvedUrl = fileUrl || base64;
    if (!resolvedUrl) {
      return res.status(400).json({ success: false, error: 'Image fileUrl or base64 payload is required.' });
    }

    try {
      const item = await insertMedia({
        fileName: fileName || `media-${Date.now()}`,
        fileUrl: resolvedUrl,
        mimeType: mimeType || 'image/jpeg',
        fileSize: fileSize || (typeof resolvedUrl === 'string' ? resolvedUrl.length : 0),
        category: category || 'OTHER',
        altText: altText || fileName || 'Uploaded media asset',
        uploadedBy: user.username,
      });

      return res.status(201).json({ success: true, data: item, fileUrl: item.fileUrl });
    } catch (err: any) {
      console.error('Error uploading media:', err);
      return res.status(500).json({ success: false, error: 'Failed to save media record to database.' });
    }
  });

  app.post('/api/media', async (req, res) => {
    const user = getUserSecurityContext(req);
    const { fileName, fileUrl, base64, category, altText } = req.body || {};
    const resolvedUrl = fileUrl || base64;
    if (!resolvedUrl) {
      return res.status(400).json({ success: false, error: 'fileUrl or base64 is required.' });
    }
    try {
      const item = await insertMedia({
        fileName: fileName || `media-${Date.now()}`,
        fileUrl: resolvedUrl,
        category: category || 'OTHER',
        altText: altText || fileName,
        uploadedBy: user.username,
      });
      return res.status(201).json({ success: true, data: item });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to save media.' });
    }
  });

  app.delete('/api/media/:id', async (req, res) => {
    const admin = getUserSecurityContext(req);
    if (!admin.isAdmin) {
      return res.status(403).json({ success: false, error: 'Access Denied: Only administrators can delete media.' });
    }
    const { id } = req.params;
    try {
      await deleteMediaById(id);
      return res.json({ success: true, message: 'Media removed from database.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to delete media.' });
    }
  });

  // =========================================================================
  // 9. SYSTEM SETTINGS, CMS & CUSTOM FORMS (DATABASE-DRIVEN)
  // =========================================================================
  app.get('/api/settings', async (req, res) => {
    const key = (req.query.key as string) || 'system_branding';
    try {
      const value = await getSystemSetting(key);
      return res.json({ success: true, key, value });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Unable to retrieve settings from database.' });
    }
  });

  app.put('/api/settings', async (req, res) => {
    const admin = getUserSecurityContext(req);
    if (!admin.isAdmin) {
      return res.status(403).json({ success: false, error: 'Access Denied: Only administrators can update system settings.' });
    }
    const { key, value } = req.body || {};
    if (!key) {
      return res.status(400).json({ success: false, error: 'Setting key is required.' });
    }
    try {
      const saved = await setSystemSetting(key, value);
      return res.json({ success: true, key, value: saved });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to update system settings.' });
    }
  });

  app.get('/api/landing-config', async (_req, res) => {
    try {
      const config = await getSystemSetting('landing_page_config', INITIAL_LANDING_CONFIG);
      return res.json({ success: true, config });
    } catch {
      return res.json({ success: true, config: INITIAL_LANDING_CONFIG });
    }
  });

  app.put('/api/landing-config', async (req, res) => {
    const admin = getUserSecurityContext(req);
    if (!admin.isAdmin) {
      return res.status(403).json({ success: false, error: 'Access Denied: Only administrators can update landing page configuration.' });
    }
    try {
      const config = await setSystemSetting('landing_page_config', req.body);
      return res.json({ success: true, config });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to update landing page config in database.' });
    }
  });

  app.get('/api/admin/sidebar-theme', async (_req, res) => {
    try {
      const theme = await getSystemSetting('sidebar_theme', DEFAULT_SIDEBAR_THEME);
      return res.json({ success: true, theme });
    } catch {
      return res.json({ success: true, theme: DEFAULT_SIDEBAR_THEME });
    }
  });

  app.put('/api/admin/sidebar-theme', async (req, res) => {
    const admin = getUserSecurityContext(req);
    if (!admin.isAdmin) {
      return res.status(403).json({ success: false, error: 'Access Denied: Only administrators can update sidebar theme.' });
    }
    try {
      const theme = await setSystemSetting('sidebar_theme', req.body);
      return res.json({ success: true, theme });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to update sidebar theme in database.' });
    }
  });

  app.get('/api/admin/registry-form-schema', async (_req, res) => {
    try {
      const schema = await getSystemSetting('registry_form_schema', INITIAL_REGISTRY_FORM_SCHEMA);
      return res.json({ success: true, schema });
    } catch {
      return res.json({ success: true, schema: INITIAL_REGISTRY_FORM_SCHEMA });
    }
  });

  app.put('/api/admin/registry-form-schema', async (req, res) => {
    const admin = getUserSecurityContext(req);
    if (!admin.isAdmin) {
      return res.status(403).json({ success: false, error: 'Access Denied: Only administrators can update form schema.' });
    }
    try {
      const schema = await setSystemSetting('registry_form_schema', req.body);
      return res.json({ success: true, schema });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to update form schema in database.' });
    }
  });

  // =========================================================================
  // 10. LEGAL DOCUMENTS & ASF REGULATIONS API
  // =========================================================================
  app.get('/api/legal-documents', (_req, res) => {
    res.json({ success: true, count: ALL_ASF_REGULATIONS.length, data: ALL_ASF_REGULATIONS });
  });

  // =========================================================================
  // 11. ENTERPRISE OFFLINE SYNCHRONIZATION API (IDEMPOTENT BATCH SYNC)
  // =========================================================================

  // GET /api/sync/status
  app.get('/api/sync/status', async (req, res) => {
    const user = getUserSecurityContext(req);
    try {
      const { total } = await getAllSwineRecords();
      return res.json({
        success: true,
        status: 'ONLINE',
        serverTime: new Date().toISOString(),
        role: user.role,
        scope: user.isAdmin ? 'ALL' : (user.assignedBarangay || user.barangayId),
        totalSwineInDb: total,
      });
    } catch {
      return res.json({
        success: true,
        status: 'ONLINE',
        serverTime: new Date().toISOString(),
      });
    }
  });

  // PULL: Download latest server data respecting role-based authorization
  const handleSyncPull = async (req: express.Request, res: express.Response) => {
    const user = getUserSecurityContext(req);
    const since = (req.query.since as string) || (req.body && req.body.since) || undefined;
    const effectiveBarangay = user.isAdmin ? undefined : (user.assignedBarangay || user.barangayId);

    try {
      const { records: swineList } = await getAllSwineRecords({
        barangay: effectiveBarangay,
        readyToSell: user.isAgent ? true : undefined,
      });

      const certs = await getAllCertificates();
      const filteredCerts = user.isAdmin
        ? certs
        : certs.filter((c: any) => {
            const matchId = Boolean(c.barangay_id && user.barangayId && c.barangay_id === user.barangayId);
            const matchName = Boolean(
              c.farmerBarangay && user.assignedBarangay && c.farmerBarangay.toLowerCase() === user.assignedBarangay.toLowerCase()
            );
            return matchId || matchName;
          });

      const messages = await getAllMessages({
        role: user.role,
        barangay: user.assignedBarangay,
        userId: user.userId,
      });

      return res.json({
        success: true,
        serverTimestamp: new Date().toISOString(),
        data: {
          swineRecords: swineList,
          certificates: filteredCerts,
          messages,
          barangays: HINUNANGAN_BARANGAYS,
        },
      });
    } catch (err: any) {
      console.error('Error during sync pull:', err);
      return res.status(500).json({
        success: false,
        error: 'Database sync pull failed. Backend server unavailable.',
      });
    }
  };

  app.get('/api/sync/pull', handleSyncPull);
  app.post('/api/sync/pull', handleSyncPull);

  // PUSH: Process pending offline operations queue idempotently
  app.post('/api/sync/push', async (req, res) => {
    const user = getUserSecurityContext(req);
    const { operations } = req.body || {};

    if (!Array.isArray(operations) || operations.length === 0) {
      return res.json({ success: true, processedCount: 0, results: [] });
    }

    const results: Array<{
      clientOperationId: string;
      entityId: string;
      serverEntityId?: string;
      serverPigId?: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const op of operations) {
      const { clientOperationId, operation, entity, entityId, payload } = op;

      try {
        if (entity === 'swine') {
          if (user.isAgent) {
            results.push({
              clientOperationId,
              entityId,
              success: false,
              error: 'Agent accounts are restricted to view-only access.',
            });
            continue;
          }

          if (operation === 'create') {
            let tag = (payload.pigIdTag || payload.earTagNo || '').trim();
            // If temporary local tag, generate authoritative backend Pig ID
            if (!tag || tag.startsWith('LOCAL-') || !PIG_ID_TAG_REGEX.test(tag)) {
              const currentYear = new Date().getFullYear();
              const { total } = await getAllSwineRecords();
              tag = `HIN-${currentYear}-${String(total + 1).padStart(4, '0')}`;
            }

            if (!user.isAdmin && user.assignedBarangay) {
              payload.barangay = user.assignedBarangay;
              if (user.barangayId) payload.barangay_id = user.barangayId;
            }

            const cleanRecord = {
              ...payload,
              id: entityId.startsWith('local-') || entityId.startsWith('swine-local-')
                ? `swine-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
                : entityId,
              pigIdTag: tag,
              earTagNo: tag,
              registeredBy: payload.registeredBy || user.username,
            };

            const saved = await upsertSwineRecord(cleanRecord);
            results.push({
              clientOperationId,
              entityId,
              serverEntityId: saved.id,
              serverPigId: saved.pigIdTag,
              success: true,
            });
          } else if (operation === 'update') {
            const updated = await upsertSwineRecord(payload);
            results.push({
              clientOperationId,
              entityId,
              serverEntityId: updated.id,
              success: true,
            });
          } else if (operation === 'delete') {
            if (user.isAdmin) {
              await deleteSwineRecordById(entityId);
              results.push({ clientOperationId, entityId, success: true });
            } else {
              results.push({
                clientOperationId,
                entityId,
                success: false,
                error: 'Only administrators can delete swine records.',
              });
            }
          } else if (operation === 'sell' || operation === 'archive') {
            const existing = await getSwineRecordById(entityId);
            if (existing) {
              const updated = {
                ...existing,
                ...payload,
              };
              await upsertSwineRecord(updated);
              results.push({ clientOperationId, entityId, success: true });
            } else {
              results.push({
                clientOperationId,
                entityId,
                success: true,
                error: 'Record already updated or removed.',
              });
            }
          }
        } else if (entity === 'media') {
          const resolvedUrl = payload.fileUrl || payload.base64 || payload.dataUrlOrBase64;
          if (resolvedUrl) {
            const savedMedia = await insertMedia({
              fileName: payload.fileName || `media-${Date.now()}`,
              fileUrl: resolvedUrl,
              mimeType: payload.mimeType || 'image/jpeg',
              fileSize: payload.fileSize || 0,
              category: payload.category || 'OTHER',
              altText: payload.altText || 'Media Asset',
              uploadedBy: user.username,
            });
            results.push({
              clientOperationId,
              entityId,
              serverEntityId: savedMedia.id,
              success: true,
            });
          } else {
            results.push({ clientOperationId, entityId, success: false, error: 'Empty media content' });
          }
        } else if (entity === 'certificate') {
          if (!user.isAdmin && user.assignedBarangay) {
            payload.barangay = user.assignedBarangay;
            payload.farmerBarangay = user.assignedBarangay;
          }
          const savedCert = await upsertCertificate({
            ...payload,
            id: payload.id || `cert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          });
          results.push({ clientOperationId, entityId, serverEntityId: savedCert.id, success: true });
        } else if (entity === 'message') {
          const newMsg = await createMessage({
            ...payload,
            senderId: user.userId,
            senderName: user.username,
            senderRole: user.role as any,
            barangay: user.assignedBarangay,
          });
          results.push({ clientOperationId, entityId, serverEntityId: newMsg.id, success: true });
        } else {
          results.push({ clientOperationId, entityId, success: true });
        }
      } catch (err: any) {
        console.error(`Sync error on operation ${clientOperationId}:`, err);
        results.push({
          clientOperationId,
          entityId,
          success: false,
          error: err?.message || 'Database transaction error',
        });
      }
    }

    return res.json({
      success: true,
      processedCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
      results,
    });
  });

  return app;
}

export const app = createApp();
