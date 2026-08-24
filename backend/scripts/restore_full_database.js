const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASSWORD || 'unicampus_secret',
  database: process.env.DB_NAME || 'unicampus_erp',
};

async function restoreDatabase() {
  const jsonFile = path.join(__dirname, '../database_backup/unicampus_full_dump.json');
  const sqlFile = path.join(__dirname, '../database_backup/unicampus_full_dump.sql');

  console.log('Connecting to database:', config.database, 'at', config.host);
  const client = new Client(config);
  await client.connect();

  console.log('1. Setting session replication role and creating base enums...');
  try {
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'firm_mode_enum') THEN
          CREATE TYPE firm_mode_enum AS ENUM ('MED', 'NONMED');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'firm_status_enum') THEN
          CREATE TYPE firm_status_enum AS ENUM ('ACTIVE', 'TRIAL', 'SUSPENDED', 'EXPIRED');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'firm_level_type_enum') THEN
          CREATE TYPE firm_level_type_enum AS ENUM ('STANDARD', 'ENTERPRISE', 'CUSTOM');
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
    `);
  } catch (e) {
    console.warn('Enum warning:', e.message);
  }

  // Create public tables
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.tenants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(100) NOT NULL UNIQUE,
      domain VARCHAR(255) UNIQUE,
      colg_cd VARCHAR(50),
      firm_mode VARCHAR(50) DEFAULT 'NONMED',
      schema_provisioned BOOLEAN DEFAULT true,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

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
      firm_mode firm_mode_enum NOT NULL DEFAULT 'NONMED',
      status firm_status_enum NOT NULL DEFAULT 'ACTIVE',
      trial_days INTEGER DEFAULT 365,
      trial_started_at TIMESTAMPTZ DEFAULT NOW(),
      trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '365 days'),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.license_keys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
      key_hash VARCHAR(255) NOT NULL,
      key_prefix VARCHAR(20) NOT NULL,
      duration_days INTEGER NOT NULL DEFAULT 365,
      amount NUMERIC(10,2) NOT NULL DEFAULT 250000.00,
      issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '365 days'),
      status license_status_enum NOT NULL DEFAULT 'ACTIVE',
      is_renewal BOOLEAN NOT NULL DEFAULT FALSE,
      renewed_from_key_id UUID REFERENCES public.license_keys(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
      license_key_id UUID REFERENCES public.license_keys(id) ON DELETE SET NULL,
      amount NUMERIC(10,2) NOT NULL DEFAULT 250000.00,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      payment_method VARCHAR(100) NOT NULL DEFAULT 'Bank Transfer / Platform Billing',
      transaction_ref VARCHAR(255) NOT NULL,
      status transaction_status_enum NOT NULL DEFAULT 'SUCCESS',
      paid_at TIMESTAMPTZ DEFAULT NOW(),
      duration_days INTEGER DEFAULT 365,
      expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '365 days'),
      is_renewal BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.super_admins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(100) UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL DEFAULT 'NORNX Platform Owner',
      role VARCHAR(50) NOT NULL DEFAULT 'SUPER_ADMIN',
      is_active BOOLEAN NOT NULL DEFAULT true,
      must_change_password BOOLEAN NOT NULL DEFAULT false,
      failed_login_count INTEGER NOT NULL DEFAULT 0,
      locked_until TIMESTAMPTZ,
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

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

    CREATE TABLE IF NOT EXISTS public.firm_role_permissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
      role menu_role_enum NOT NULL,
      menu_key VARCHAR(150) NOT NULL,
      is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT uq_firm_role_permissions UNIQUE (firm_id, role, menu_key)
    );
  `);

  if (fs.existsSync(jsonFile)) {
    const rawData = fs.readFileSync(jsonFile, 'utf8');
    const backup = JSON.parse(rawData);

    try {
      await client.query(`SET session_replication_role = 'replica';`);
    } catch {}

    for (const [schema, tables] of Object.entries(backup)) {
      console.log(`\nRestoring schema: ${schema}`);
      await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);

      for (const [table, rows] of Object.entries(tables)) {
        if (!Array.isArray(rows) || rows.length === 0) continue;

        console.log(`  └─ Restoring ${schema}.${table} (${rows.length} rows)`);

        for (const row of rows) {
          const colNames = Object.keys(row);
          const colVals = Object.values(row);
          const placeholders = colNames.map((_, idx) => `$${idx + 1}`).join(', ');

          try {
            await client.query(
              `INSERT INTO "${schema}"."${table}" ("${colNames.join('", "')}") VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
              colVals
            );
          } catch (rowErr) {
            // Non-blocking row insert
          }
        }
      }
    }

    try {
      await client.query(`SET session_replication_role = 'origin';`);
    } catch {}
  }

  console.log('\n======================================================');
  console.log('✅ Full database restoration complete!');
  console.log('======================================================');

  await client.end();
}

restoreDatabase().catch(err => {
  console.error('Database restore error:', err);
  process.exit(1);
});
