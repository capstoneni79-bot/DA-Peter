-- ============================================================================
-- HINUNANGAN SWINE REGISTRY & TRACEABILITY SYSTEM
-- PostgreSQL Schema for Supabase & Render Deployment
-- ============================================================================

-- 1. Enable UUID extension if desired
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Users Table (System Roles: admin, focal, public)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'focal',
  assigned_barangay TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Swine Records Table (Registry & Biosecurity Tracking)
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Issued Certificates Table (Official Movement / Transport Permits)
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Audit Logs Table (Tamper-evident activity logs)
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
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Performance & Search Indices
CREATE INDEX IF NOT EXISTS idx_swine_barangay ON swine_records(barangay);
CREATE INDEX IF NOT EXISTS idx_swine_status ON swine_records(status);
CREATE INDEX IF NOT EXISTS idx_swine_ready ON swine_records(ready_to_sell);
CREATE INDEX IF NOT EXISTS idx_swine_asf_zone ON swine_records(asf_zone);
CREATE INDEX IF NOT EXISTS idx_certs_barangay ON issued_certificates(barangay);
CREATE INDEX IF NOT EXISTS idx_certs_control ON issued_certificates(control_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);

-- ============================================================================
-- End of Supabase Schema Initialization
-- ============================================================================
