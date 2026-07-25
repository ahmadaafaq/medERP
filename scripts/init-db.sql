-- Unicampus ERP — Database initialization script
-- This runs automatically when the PostgreSQL container first starts

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for fuzzy text search

-- ─── PUBLIC SCHEMA TABLES ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tenants (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(200) NOT NULL,
  slug          VARCHAR(50)  UNIQUE NOT NULL,
  domain        VARCHAR(200),
  plan          VARCHAR(50)  DEFAULT 'standard',
  logo_url      TEXT,
  primary_color VARCHAR(7)   DEFAULT '#6366F1',
  smtp_host     VARCHAR(200),
  smtp_port     INT          DEFAULT 587,
  smtp_user     VARCHAR(200),
  smtp_pass_encrypted TEXT,
  is_active     BOOLEAN      DEFAULT true,
  schema_provisioned BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  max_students  INT          DEFAULT 500,
  max_faculty   INT          DEFAULT 100,
  features      JSONB        DEFAULT '{}',
  price_monthly NUMERIC(10,2) DEFAULT 0,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.global_admins (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  name          VARCHAR(200),
  is_active     BOOLEAN      DEFAULT true,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        REFERENCES public.tenants(id),
  user_id     UUID,
  action      VARCHAR(50)  NOT NULL,
  entity      VARCHAR(100) NOT NULL,
  entity_id   UUID,
  old_value   JSONB,
  new_value   JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant_created ON public.audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs(entity, entity_id);

-- ─── SEED DEFAULT PLANS ───────────────────────────────────────────────────────

INSERT INTO public.subscription_plans (name, max_students, max_faculty, features, price_monthly)
VALUES
  ('starter',     200, 50,  '{"logbook":true,"examination":false,"hostel":false}', 2999),
  ('standard',    500, 100, '{"logbook":true,"examination":true,"hostel":false}',  5999),
  ('professional',1000,200, '{"logbook":true,"examination":true,"hostel":true}',   9999),
  ('enterprise',  9999,999, '{"logbook":true,"examination":true,"hostel":true,"analytics":true}', 19999)
ON CONFLICT DO NOTHING;

-- ─── FUNCTION: Create tenant schema ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_tenant_schema(p_slug TEXT)
RETURNS VOID AS $$
DECLARE
  v_schema TEXT := 'tenant_' || p_slug;
BEGIN
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', v_schema);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
