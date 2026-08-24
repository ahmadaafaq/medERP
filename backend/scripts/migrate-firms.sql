-- PostgreSQL Schema Migration for Firm Registration & Licensing Module

-- 1. Create Enums if they do not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'firm_level_type_enum') THEN
    CREATE TYPE firm_level_type_enum AS ENUM ('STANDARD', 'ENTERPRISE');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'firm_mode_enum') THEN
    CREATE TYPE firm_mode_enum AS ENUM ('MED', 'NONMED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'firm_status_enum') THEN
    CREATE TYPE firm_status_enum AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'license_status_enum') THEN
    CREATE TYPE license_status_enum AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status_enum') THEN
    CREATE TYPE transaction_status_enum AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'menu_role_enum') THEN
    CREATE TYPE menu_role_enum AS ENUM ('SUPERADMIN', 'ADMIN', 'CLERK', 'FACULTY', 'WARDEN', 'STUDENT');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'applicable_firm_mode_enum') THEN
    CREATE TYPE applicable_firm_mode_enum AS ENUM ('MED', 'NONMED', 'BOTH');
  END IF;
END $$;

-- 2. Table: firms
CREATE TABLE IF NOT EXISTS public.firms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  tenant_name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE,
  logo_url VARCHAR(1000),
  cover_url VARCHAR(1000),
  banner_url VARCHAR(1000),
  level_type firm_level_type_enum NOT NULL DEFAULT 'STANDARD',
  theme_color VARCHAR(20) NOT NULL DEFAULT '#5B4BFF',
  firm_mode firm_mode_enum NOT NULL DEFAULT 'MED',
  status firm_status_enum NOT NULL DEFAULT 'TRIAL',
  trial_days INTEGER,
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_firms_slug ON public.firms (slug);
CREATE INDEX IF NOT EXISTS idx_firms_status ON public.firms (status);

-- 3. Table: license_keys
CREATE TABLE IF NOT EXISTS public.license_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(20) NOT NULL,
  duration_days INTEGER NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status license_status_enum NOT NULL DEFAULT 'ACTIVE',
  is_renewal BOOLEAN NOT NULL DEFAULT FALSE,
  renewed_from_key_id UUID REFERENCES public.license_keys(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_license_keys_firm_id ON public.license_keys (firm_id);
CREATE INDEX IF NOT EXISTS idx_license_keys_status ON public.license_keys (status);

-- 4. Table: transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  license_key_id UUID REFERENCES public.license_keys(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  payment_method VARCHAR(100) NOT NULL,
  transaction_ref VARCHAR(255) NOT NULL,
  status transaction_status_enum NOT NULL DEFAULT 'PENDING',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_firm_id ON public.transactions (firm_id);
CREATE INDEX IF NOT EXISTS idx_transactions_ref ON public.transactions (transaction_ref);

-- 5. Table: menu_registry
CREATE TABLE IF NOT EXISTS public.menu_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role menu_role_enum NOT NULL,
  menu_key VARCHAR(150) NOT NULL,
  menu_label VARCHAR(150) NOT NULL,
  route_path VARCHAR(255) NOT NULL,
  parent_menu_key VARCHAR(150),
  sort_order INTEGER NOT NULL DEFAULT 0,
  applicable_firm_mode applicable_firm_mode_enum NOT NULL DEFAULT 'BOTH',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_menu_registry_role_key UNIQUE (role, menu_key)
);

CREATE INDEX IF NOT EXISTS idx_menu_registry_role_mode ON public.menu_registry (role, applicable_firm_mode);
CREATE INDEX IF NOT EXISTS idx_menu_registry_parent ON public.menu_registry (parent_menu_key);

-- 6. Table: firm_role_permissions
CREATE TABLE IF NOT EXISTS public.firm_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  role menu_role_enum NOT NULL,
  menu_key VARCHAR(150) NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_firm_role_permissions UNIQUE (firm_id, role, menu_key)
);

CREATE INDEX IF NOT EXISTS idx_firm_role_perm_firm_role ON public.firm_role_permissions (firm_id, role);
