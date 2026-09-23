import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.SUPABASE_DATABASE_URL ||
      process.env.POSTGRES_URL;

    let poolConfig: PoolConfig;

    if (connectionString) {
      const isRemote =
        connectionString.includes('supabase') ||
        connectionString.includes('render') ||
        connectionString.includes('sslmode=require') ||
        process.env.NODE_ENV === 'production';

      poolConfig = {
        connectionString,
        ssl: isRemote ? { rejectUnauthorized: false } : undefined,
        max: 10,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 30000,
      };
    } else if (process.env.SQL_HOST) {
      const isSsl =
        process.env.SQL_SSL === 'true' ||
        process.env.NODE_ENV === 'production' ||
        Boolean(process.env.SQL_HOST?.includes('supabase'));

      poolConfig = {
        host: process.env.SQL_HOST,
        port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432,
        user: process.env.SQL_USER || process.env.SQL_ADMIN_USER,
        password: process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD,
        database: process.env.SQL_DB_NAME || 'postgres',
        ssl: isSsl ? { rejectUnauthorized: false } : undefined,
        max: 10,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 30000,
      };
    } else {
      // Fallback local configuration
      poolConfig = {
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        max: 5,
        connectionTimeoutMillis: 5000,
      };
    }

    global._postgresPool = new Pool(poolConfig);

    global._postgresPool.on('error', (err) => {
      console.warn('PostgreSQL pool idle client warning:', err.message);
    });
  }
  return global._postgresPool;
};

export const pool = createPool();
export const db = drizzle(pool, { schema });

/**
 * Initializes all required PostgreSQL tables on Supabase/Render if they don't exist.
 */
export async function initPostgresTables(): Promise<boolean> {
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          uid TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL,
          name TEXT,
          role TEXT NOT NULL DEFAULT 'focal',
          assigned_barangay TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Swine Records table
        CREATE TABLE IF NOT EXISTS swine_records (
          id TEXT PRIMARY KEY,
          computed_pig_id TEXT NOT NULL,
          pig_id_tag TEXT,
          ear_tag_no TEXT,
          farmer_name TEXT NOT NULL,
          farm_name TEXT,
          farmer_contact TEXT,
          barangay TEXT NOT NULL,
          birth_date TEXT,
          age_days INTEGER,
          age_months TEXT,
          estimated_weight_kg TEXT,
          actual_weight_kg TEXT,
          swine_type TEXT NOT NULL DEFAULT 'FATTER_GROWER',
          farm_scale TEXT NOT NULL DEFAULT 'BACKYARD',
          asf_zone TEXT NOT NULL DEFAULT 'RED',
          biosecurity_warning BOOLEAN NOT NULL DEFAULT FALSE,
          status TEXT NOT NULL DEFAULT 'HEALTHY',
          ready_to_sell BOOLEAN NOT NULL DEFAULT FALSE,
          price_estimate TEXT,
          photo_url TEXT,
          is_archived BOOLEAN NOT NULL DEFAULT FALSE,
          registered_at TEXT NOT NULL,
          custom_fields JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Issued Certificates table
        CREATE TABLE IF NOT EXISTS issued_certificates (
          id TEXT PRIMARY KEY,
          control_number TEXT NOT NULL,
          swine_id TEXT,
          farmer_name TEXT NOT NULL,
          barangay TEXT NOT NULL,
          issue_date TEXT NOT NULL,
          purpose TEXT NOT NULL,
          destination TEXT,
          inspected_by TEXT NOT NULL,
          qr_payload TEXT,
          valid_until TEXT,
          status TEXT NOT NULL DEFAULT 'VALID',
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Audit Logs table
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          action TEXT NOT NULL,
          entity TEXT NOT NULL,
          entity_id TEXT,
          user_id TEXT,
          username TEXT,
          user_role TEXT,
          barangay TEXT,
          details TEXT,
          timestamp TIMESTAMP DEFAULT NOW()
        );

        -- Create indices for ultra-fast query performance
        CREATE INDEX IF NOT EXISTS idx_swine_barangay ON swine_records(barangay);
        CREATE INDEX IF NOT EXISTS idx_swine_status ON swine_records(status);
        CREATE INDEX IF NOT EXISTS idx_swine_ready ON swine_records(ready_to_sell);
        CREATE INDEX IF NOT EXISTS idx_certs_barangay ON issued_certificates(barangay);
        CREATE INDEX IF NOT EXISTS idx_certs_control ON issued_certificates(control_number);
      `);
      console.log('✅ PostgreSQL / Supabase tables and indices initialized successfully.');
      return true;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.warn('⚠️ Notice: Could not connect to PostgreSQL server yet. Operating in resilient fallback mode:', err.message);
    return false;
  }
}
