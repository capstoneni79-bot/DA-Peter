import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoints for Cloud Run & container orchestration
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'hinunangan-swine-registry', timestamp: new Date().toISOString() });
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'hinunangan-swine-registry', timestamp: new Date().toISOString() });
  });

  // In-memory backing store for shared schema & swine records
  let savedRegistrySchema: any = null;
  const inMemorySwineRecords: any[] = [];
  const EXACT_11_DIGIT_REGEX = /^\d{11}$/;

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
  app.post('/api/validate-swine', (req, res) => {
    const { farmerContact } = req.body || {};
    if (!farmerContact || typeof farmerContact !== 'string' || !EXACT_11_DIGIT_REGEX.test(farmerContact)) {
      return res.status(400).json({
        isValid: false,
        field: 'farmerContact',
        error: 'Contact number must contain exactly 11 digits.',
      });
    }
    res.json({ isValid: true });
  });

  app.get('/api/swine', (_req, res) => {
    res.json({ success: true, count: inMemorySwineRecords.length, data: inMemorySwineRecords });
  });

  app.post('/api/swine', (req, res) => {
    const record = req.body;
    if (!record || typeof record !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid record payload' });
    }

    const { farmerContact } = record;
    // Strict Backend Validation: Contact number must be exactly 11 digits (0-9 only)
    if (!farmerContact || typeof farmerContact !== 'string' || !EXACT_11_DIGIT_REGEX.test(farmerContact)) {
      return res.status(400).json({
        success: false,
        field: 'farmerContact',
        error: 'Contact number must contain exactly 11 digits.',
      });
    }

    const newRec = {
      ...record,
      serverRegisteredAt: new Date().toISOString(),
    };
    inMemorySwineRecords.unshift(newRec);
    res.status(201).json({ success: true, record: newRec });
  });

  app.put('/api/swine/:id', (req, res) => {
    const record = req.body;
    const { farmerContact } = record || {};
    if (!farmerContact || typeof farmerContact !== 'string' || !EXACT_11_DIGIT_REGEX.test(farmerContact)) {
      return res.status(400).json({
        success: false,
        field: 'farmerContact',
        error: 'Contact number must contain exactly 11 digits.',
      });
    }

    const idx = inMemorySwineRecords.findIndex((r) => r.id === req.params.id);
    if (idx !== -1) {
      inMemorySwineRecords[idx] = { ...record, serverUpdatedAt: new Date().toISOString() };
    } else {
      inMemorySwineRecords.push(record);
    }
    res.json({ success: true, record });
  });

  // Vite middleware for development vs static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
