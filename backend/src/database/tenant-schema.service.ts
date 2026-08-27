import { Injectable, Logger, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';

/**
 * TenantSchemaService — manages per-tenant PostgreSQL schema lifecycle.
 *
 * Each tenant gets an isolated schema: tenant_{slug}
 * All tables in the per-tenant schema are identical in structure.
 */
@Injectable()
export class TenantSchemaService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TenantSchemaService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  public resolveTenantSlug(slug?: string): string {
    if (!slug) return '';
    const s = slug.toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');
    if (s === 'all' || s === '') return '';
    if (s === 'srms' || s === 'srms-cet' || s === 'cet' || s === '1') return 'srms-cet-bareilly';
    if (s === 'srms-ims' || s === 'ims' || s === '2') return 'srms-ims';
    if (s === 'srms-cetr' || s === 'srms-cetr-bareilly') return 'srms-cetr-bareilly';
    if (s === 'srms-ibs' || s === 'srms-ibs-lucknow') return 'srms-ibs-lucknow';
    if (s === 'srms-law' || s === 'srms-college-of-law') return 'srms-college-of-law';
    return s;
  }

  /**
   * Provision a new tenant schema with all required tables.
   * Called during onboarding → college setup wizard.
   */
  async provisionSchema(slug: string): Promise<void> {
    const resolvedSlug = this.resolveTenantSlug(slug);
    const schema = `tenant_${resolvedSlug}`;
    this.logger.log(`Provisioning schema: ${schema}`);

    const runner: QueryRunner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    try {
      await runner.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
      await runner.query(`SET search_path TO "${schema}"`);

      await this.createTenantTables(runner, schema);
      await this.seedDefaultData(runner, slug);

      await runner.commitTransaction();

      // Mark tenant schema as provisioned in public schema
      await this.dataSource.query(
        `UPDATE public.tenants SET schema_provisioned = true, updated_at = NOW() WHERE slug = $1`,
        [slug],
      );

      this.logger.log(`Schema provisioned successfully: ${schema}`);
    } catch (err) {
      await runner.rollbackTransaction();
      this.logger.error(`Failed to provision schema ${schema}:`, err);
      throw err;
    } finally {
      await runner.release();
    }
  }

  /**
   * Get a query runner scoped to a specific tenant's schema.
   */
  async getTenantRunner(slug: string): Promise<QueryRunner> {
    const resolvedSlug = this.resolveTenantSlug(slug);
    const schema = `tenant_${resolvedSlug}`;
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.query(`SET search_path TO "${schema}", public`);
    return runner;
  }

  /**
   * Execute a raw query in a tenant's schema context.
   */
  async queryInTenant<T = any>(slug: string, sql: string, params: any[] = []): Promise<T[]> {
    const resolvedSlug = this.resolveTenantSlug(slug);
    const schema = `tenant_${resolvedSlug}`;
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    try {
      await runner.query(`SET search_path TO "${schema}", public`);
      return await runner.query(sql, params);
    } finally {
      await runner.release();
    }
  }

  async onApplicationBootstrap() {
    this.logger.log('Ensuring public tables, enums, firms, and licenses exist...');
    try {
      await this.ensurePublicTables();
    } catch (err: any) {
      this.logger.error('Failed to ensure public tables on startup:', err.message);
    }

    this.logger.log('Checking and upgrading tenant schemas in background...');
    (async () => {
      try {
        let tenants: any[] = [];
        try {
          tenants = await this.dataSource.query(`SELECT slug FROM public.tenants WHERE schema_provisioned = true OR slug = 'srms-ims'`);
        } catch {
          tenants = [{ slug: 'srms-cet-bareilly' }, { slug: 'srms-cet' }, { slug: 'srms-ims' }, { slug: 'unicamp-med' }];
        }

        const standardSlugs = ['srms-cet-bareilly', 'srms-cet', 'srms-ims', 'unicamp-med'];
        for (const s of standardSlugs) {
          if (!tenants.some((t) => t.slug === s)) {
            tenants.push({ slug: s });
          }
        }

        for (const tenant of tenants) {
          await this.ensureLatestSchema(tenant.slug).catch((e) => {
            this.logger.warn(`Schema upgrade skipped for ${tenant.slug}: ${e.message}`);
          });
        }
        this.logger.log('All provisioned tenant schemas successfully verified/upgraded.');
      } catch (err) {
        this.logger.error('Failed to run schema validation/upgrades on startup:', err);
      }
    })();
  }

  /**
   * Ensure public tables, enums, default SaaS firms, super admins, and license keys exist
   */
  async ensurePublicTables(): Promise<void> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();

    try {
      // 1. Create Enums in public schema
      await runner.query(`
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

      // 2. Create public.tenants
      await runner.query(`
        CREATE TABLE IF NOT EXISTS public.tenants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(100) NOT NULL UNIQUE,
          domain VARCHAR(255) UNIQUE,
          colg_cd VARCHAR(50),
          firm_mode VARCHAR(50) DEFAULT 'NONMED',
          timetable_module_type VARCHAR(50) DEFAULT 'ENGINEERING',
          schema_provisioned BOOLEAN DEFAULT true,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
        ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS colg_cd VARCHAR(50);
        ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS firm_mode VARCHAR(50) DEFAULT 'NONMED';
        ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS timetable_module_type VARCHAR(50) DEFAULT 'ENGINEERING';
        ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS domain VARCHAR(255);
      `);

      // 3. Create public.firms
      await runner.query(`
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
          timetable_module_type VARCHAR(50) DEFAULT 'ENGINEERING',
          status firm_status_enum NOT NULL DEFAULT 'ACTIVE',
          trial_days INTEGER DEFAULT 365,
          trial_started_at TIMESTAMPTZ DEFAULT NOW(),
          trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '365 days'),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        ALTER TABLE public.firms ADD COLUMN IF NOT EXISTS timetable_module_type VARCHAR(50) DEFAULT 'ENGINEERING';
        CREATE INDEX IF NOT EXISTS idx_firms_slug ON public.firms (slug);
        CREATE INDEX IF NOT EXISTS idx_firms_status ON public.firms (status);
      `);

      // 4. Create public.license_keys
      await runner.query(`
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
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT uq_license_keys_firm_prefix UNIQUE (firm_id, key_prefix)
        );
        CREATE INDEX IF NOT EXISTS idx_license_keys_firm_id ON public.license_keys (firm_id);
        CREATE INDEX IF NOT EXISTS idx_license_keys_status ON public.license_keys (status);
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'uq_license_keys_firm_prefix'
          ) THEN
            ALTER TABLE public.license_keys ADD CONSTRAINT uq_license_keys_firm_prefix UNIQUE (firm_id, key_prefix);
          END IF;
        END $$;
      `);

      // 5. Create public.transactions
      await runner.query(`
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
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT uq_transactions_firm_ref UNIQUE (firm_id, transaction_ref)
        );
        CREATE INDEX IF NOT EXISTS idx_transactions_firm_id ON public.transactions (firm_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_ref ON public.transactions (transaction_ref);
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'uq_transactions_firm_ref'
          ) THEN
            ALTER TABLE public.transactions ADD CONSTRAINT uq_transactions_firm_ref UNIQUE (firm_id, transaction_ref);
          END IF;
        END $$;
      `);

      // 6. Create public.super_admins
      await runner.query(`
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
      `);

      // 7. Create public.menu_registry & firm_role_permissions
      await runner.query(`
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

      // 8. Seed default Super Admin if missing
      await runner.query(`
        INSERT INTO public.super_admins (id, username, email, password_hash, name, role, is_active, created_at, updated_at)
        VALUES (
          '00000000-0000-0000-0000-000000000001',
          'nornx',
          'nornx@mederp.app',
          '$2b$10$7Z2vQx8H9D0W5n4m2P3q.uN7Z8r7O6P5Q4R3S2T1U0V9W8X7Y6Z',
          'NORNX Platform Owner',
          'SUPER_ADMIN',
          true,
          NOW(),
          NOW()
        )
        ON CONFLICT (email) DO NOTHING;
      `);

      // 9. Seed default Firms & License Keys
      const defaultFirms = [
        {
          id: 'f888b64c-c336-4434-bdf8-1032c075c5fc',
          title: 'SRMS CET,BAREILLY',
          slug: 'srms-cet-bareilly',
          tenant_name: 'SRMS CET,BAREILLY',
          domain: 'srms.ac.in',
          firm_mode: 'NONMED',
        },
        {
          id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
          title: 'SRMS CET',
          slug: 'srms-cet',
          tenant_name: 'SRMS College of Engineering & Technology',
          domain: 'cet.srms.ac.in',
          firm_mode: 'NONMED',
        },
        {
          id: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
          title: 'SRMS Institute of Medical Sciences',
          slug: 'srms-ims',
          tenant_name: 'SRMS Institute of Medical Sciences',
          domain: 'ims.srms.ac.in',
          firm_mode: 'MED',
        },
        {
          id: 'd4e5f6a7-b89c-0d1e-2f3a-4b5c6d7e8f9a',
          title: 'UniCampus Medical College & Hospital',
          slug: 'unicamp-med',
          tenant_name: 'UniCampus Medical College & Hospital',
          domain: 'unicampus.edu',
          firm_mode: 'MED',
        },
      ];

      for (const f of defaultFirms) {
        // Insert tenant
        await runner.query(`
          INSERT INTO public.tenants (id, name, slug, domain, colg_cd, firm_mode, schema_provisioned, is_active)
          VALUES ('${f.id}', '${f.title}', '${f.slug}', '${f.domain}', '1', '${f.firm_mode}', true, true)
          ON CONFLICT (slug) DO NOTHING;
        `);

        // Insert firm
        await runner.query(`
          INSERT INTO public.firms (
            id, title, slug, tenant_name, domain, level_type, theme_color, firm_mode, status,
            trial_days, trial_started_at, trial_ends_at, created_at, updated_at
          ) VALUES (
            '${f.id}', '${f.title}', '${f.slug}', '${f.tenant_name}', '${f.domain}',
            'STANDARD', '#5B4BFF', '${f.firm_mode}', 'ACTIVE',
            365, NOW(), NOW() + INTERVAL '365 days', NOW(), NOW()
          )
          ON CONFLICT (slug) DO NOTHING;
        `);

        const firmRow = await runner.query(`SELECT id FROM public.firms WHERE slug = $1 LIMIT 1`, [f.slug]);
        const actualFirmId = firmRow[0]?.id || f.id;

        // Insert active license key with ON CONFLICT check
        await runner.query(`
          INSERT INTO public.license_keys (
            firm_id, key_hash, key_prefix, duration_days, amount, issued_at, expires_at, status, is_renewal
          ) VALUES (
            '${actualFirmId}',
            MD5('${f.slug}-DEFAULT-LICENSE-KEY'),
            'FIRM-${f.slug.toUpperCase().slice(0, 4)}',
            365,
            250000.00,
            NOW(),
            NOW() + INTERVAL '365 days',
            'ACTIVE',
            true
          )
          ON CONFLICT (firm_id, key_prefix) DO NOTHING;
        `);

        // Insert transaction receipt with ON CONFLICT check
        await runner.query(`
          INSERT INTO public.transactions (
            firm_id, amount, currency, payment_method, transaction_ref, status, paid_at, duration_days, expires_at, is_renewal
          ) VALUES (
            '${actualFirmId}',
            250000.00,
            'INR',
            'NORNX Platform Billing / Bank Wire',
            'NRX-INIT-${f.slug.toUpperCase().slice(0, 4)}',
            'SUCCESS',
            NOW(),
            365,
            NOW() + INTERVAL '365 days',
            true
          )
          ON CONFLICT (firm_id, transaction_ref) DO NOTHING;
        `);
      }
    } finally {
      await runner.release();
    }
  }

  async ensureLatestSchema(slug: string): Promise<void> {
    const resolvedSlug = this.resolveTenantSlug(slug);
    const schema = `tenant_${resolvedSlug}`;
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    try {
      await runner.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
      await runner.query(`SET search_path TO "${schema}", public`);

      // 1. Check if base tables exist in tenant schema, if not create and seed them
      const usersTableExists = await runner.query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'users'`,
        [schema]
      );
      if (usersTableExists.length === 0) {
        await this.createTenantTables(runner, schema);
        await this.seedDefaultData(runner, resolvedSlug);
      }
      
      // Alter users table to add username, name, phone, emp_id, usr_id, devicecd, loc_cd, department, must_change_password if missing
      await runner.query(`
        ALTER TABLE "${schema}".users 
          ADD COLUMN IF NOT EXISTS username VARCHAR(100),
          ADD COLUMN IF NOT EXISTS name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
          ADD COLUMN IF NOT EXISTS emp_id VARCHAR(50),
          ADD COLUMN IF NOT EXISTS usr_id VARCHAR(50),
          ADD COLUMN IF NOT EXISTS devicecd BIGINT,
          ADD COLUMN IF NOT EXISTS loc_cd INT,
          ADD COLUMN IF NOT EXISTS department VARCHAR(100),
          ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS failed_login_count INT DEFAULT 0,
          ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT true,
          ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 0;
      `).catch(() => {});

      // Alter faculty table to add usr_id, devicecd, loc_cd, employment_status and all HR sync columns if missing
      await runner.query(`
        ALTER TABLE "${schema}".faculty 
          ADD COLUMN IF NOT EXISTS usr_id VARCHAR(50),
          ADD COLUMN IF NOT EXISTS devicecd BIGINT,
          ADD COLUMN IF NOT EXISTS loc_cd INT,
          ADD COLUMN IF NOT EXISTS email VARCHAR(200),
          ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
          ADD COLUMN IF NOT EXISTS designation VARCHAR(100),
          ADD COLUMN IF NOT EXISTS qualification VARCHAR(200),
          ADD COLUMN IF NOT EXISTS specialization VARCHAR(200),
          ADD COLUMN IF NOT EXISTS experience VARCHAR(50),
          ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
          ADD COLUMN IF NOT EXISTS photo_url TEXT,
          ADD COLUMN IF NOT EXISTS cover_url TEXT,
          ADD COLUMN IF NOT EXISTS bio TEXT,
          ADD COLUMN IF NOT EXISTS github_url VARCHAR(255),
          ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255),
          ADD COLUMN IF NOT EXISTS linkedin_connections VARCHAR(50),
          ADD COLUMN IF NOT EXISTS repository_evaluated_count INT DEFAULT 18,
          ADD COLUMN IF NOT EXISTS followers_count INT DEFAULT 384,
          ADD COLUMN IF NOT EXISTS research_interests TEXT[] DEFAULT '{}',
          ADD COLUMN IF NOT EXISTS date_of_joining DATE,
          ADD COLUMN IF NOT EXISTS joining_date DATE,
          ADD COLUMN IF NOT EXISTS date_of_birth DATE,
          ADD COLUMN IF NOT EXISTS date_of_leaving DATE,
          ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50) DEFAULT 'ACTIVE',
          ADD COLUMN IF NOT EXISTS staff_type VARCHAR(50) DEFAULT 'Faculty',
          ADD COLUMN IF NOT EXISTS blood_group VARCHAR(20),
          ADD COLUMN IF NOT EXISTS caste VARCHAR(50),
          ADD COLUMN IF NOT EXISTS pan_no VARCHAR(50),
          ADD COLUMN IF NOT EXISTS aadhaar_no VARCHAR(50),
          ADD COLUMN IF NOT EXISTS uan VARCHAR(50),
          ADD COLUMN IF NOT EXISTS bank_ac_no VARCHAR(50),
          ADD COLUMN IF NOT EXISTS current_basic NUMERIC(14,2),
          ADD COLUMN IF NOT EXISTS device_cd VARCHAR(50),
          ADD COLUMN IF NOT EXISTS salgrade VARCHAR(50),
          ADD COLUMN IF NOT EXISTS father_name VARCHAR(200),
          ADD COLUMN IF NOT EXISTS spouse_name VARCHAR(200),
          ADD COLUMN IF NOT EXISTS address TEXT,
          ADD COLUMN IF NOT EXISTS perm_addr TEXT,
          ADD COLUMN IF NOT EXISTS city VARCHAR(100),
          ADD COLUMN IF NOT EXISTS state VARCHAR(100),
          ADD COLUMN IF NOT EXISTS perm_city VARCHAR(100),
          ADD COLUMN IF NOT EXISTS perm_state VARCHAR(100),
          ADD COLUMN IF NOT EXISTS homephone VARCHAR(50),
          ADD COLUMN IF NOT EXISTS permanent_tel_no VARCHAR(50),
          ADD COLUMN IF NOT EXISTS highest_education VARCHAR(200),
          ADD COLUMN IF NOT EXISTS category VARCHAR(100),
          ADD COLUMN IF NOT EXISTS payroll_category VARCHAR(100);
      `).catch(() => {});
      
      // Alter students table
      await runner.query(`ALTER TABLE "${schema}".students ALTER COLUMN rollno DROP NOT NULL;`).catch(() => {});
      await runner.query(`ALTER TABLE "${schema}".students ADD COLUMN IF NOT EXISTS registration_no VARCHAR(50) UNIQUE;`).catch(() => {});
      
      // Create student_admissions
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".student_admissions (
          student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
          college_id UUID,
          college_name VARCHAR(200),
          course_id UUID,
          course_code VARCHAR(50),
          professional_id VARCHAR(50),
          professional_phase VARCHAR(100),
          session_id UUID,
          academic_session VARCHAR(100),
          batch_id UUID,
          batch_code VARCHAR(50),
          branch_id UUID,
          residency_type VARCHAR(50),
          admission_type VARCHAR(50),
          admission_date DATE,
          status VARCHAR(50) DEFAULT 'ACTIVE'
        );
      `);

      await runner.query(`
        ALTER TABLE "${schema}".student_admissions 
          ADD COLUMN IF NOT EXISTS group_id UUID,
          ADD COLUMN IF NOT EXISTS group_code VARCHAR(50),
          ADD COLUMN IF NOT EXISTS group_name VARCHAR(100),
          ADD COLUMN IF NOT EXISTS branch_id UUID,
          ADD COLUMN IF NOT EXISTS branch_code VARCHAR(50),
          ADD COLUMN IF NOT EXISTS branch_name VARCHAR(100);
      `);

      await runner.query(`
        ALTER TABLE "${schema}".students 
          ADD COLUMN IF NOT EXISTS group_id UUID,
          ADD COLUMN IF NOT EXISTS branch_id UUID;
      `);

      // Create student_academic_details
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".student_academic_details (
          student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
          class_10_board VARCHAR(100),
          class_10_percentage NUMERIC(5,2),
          class_12_board VARCHAR(100),
          class_12_physics NUMERIC(5,2),
          class_12_chemistry NUMERIC(5,2),
          class_12_biology NUMERIC(5,2),
          class_12_english NUMERIC(5,2),
          class_12_percentage NUMERIC(5,2)
        );
      `);

      // Create student_neet_details
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".student_neet_details (
          student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
          neet_roll_no VARCHAR(50),
          neet_score NUMERIC(6,2),
          neet_percentile NUMERIC(5,2),
          neet_air_rank INT,
          neet_category_rank INT
        );
      `);

      // Create student_parents
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".student_parents (
          student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
          father_name VARCHAR(200),
          father_occupation VARCHAR(100),
          father_mobile VARCHAR(20),
          mother_name VARCHAR(200),
          mother_occupation VARCHAR(100),
          mother_mobile VARCHAR(20),
          annual_income NUMERIC(12,2)
        );
      `);

      // Create student_addresses
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".student_addresses (
          student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
          permanent_address_1 TEXT,
          permanent_address_2 TEXT,
          permanent_city VARCHAR(100),
          permanent_district VARCHAR(100),
          permanent_state VARCHAR(100),
          permanent_pincode VARCHAR(20),
          same_as_permanent BOOLEAN DEFAULT false
        );
      `);

      // Create student_documents
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".student_documents (
          student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
          passport_photo_url TEXT,
          student_signature_url TEXT,
          parent_signature_url TEXT,
          aadhaar_card_url TEXT,
          class_10_marksheet_url TEXT,
          class_12_marksheet_url TEXT,
          neet_score_card_url TEXT
        );
      `);

      // Create student_fees
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".student_fees (
          student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
          paid_fees NUMERIC(12,2) DEFAULT 0,
          pending_fees NUMERIC(12,2) DEFAULT 0,
          total_fees NUMERIC(12,2) DEFAULT 0
        );
      `);

      // Create student_hostel
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".student_hostel (
          student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
          hostel_required BOOLEAN DEFAULT false,
          hostel_name VARCHAR(100),
          room_number VARCHAR(50)
        );
      `);

      // Create student_transport
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".student_transport (
          student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
          bus_required BOOLEAN DEFAULT false,
          transport_route VARCHAR(100)
        );
      `);

      // Create student_library
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".student_library (
          student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
          library_card_no VARCHAR(50),
          rfid_tag VARCHAR(50)
        );
      `);

      // Create student_medical
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".student_medical (
          student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
          medical_history TEXT,
          vaccination_status VARCHAR(100),
          fitness_certificate_url TEXT
        );
      `);

      // Create student_bank_accounts
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".student_bank_accounts (
          student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
          bank_name VARCHAR(150),
          account_number VARCHAR(50),
          ifsc_code VARCHAR(20)
        );
      `);

      // Create student_emergency_contacts
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".student_emergency_contacts (
          student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
          contact_name VARCHAR(200),
          relationship VARCHAR(100),
          phone VARCHAR(20)
        );
      `);

      // ── Courses (added in later migration) ───────────────────────────────
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".courses (
          id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          code               VARCHAR(30) UNIQUE NOT NULL,
          name               VARCHAR(200) NOT NULL,
          degree_level       VARCHAR(50) DEFAULT 'UG',
          duration_years     NUMERIC(4,1) DEFAULT 4.0,
          professional_phase VARCHAR(100) DEFAULT 'Semester 1 (1st Year)',
          academic_system    VARCHAR(50) DEFAULT 'semester',
          course_cd          VARCHAR(50),
          course_type        VARCHAR(50),
          is_active          BOOLEAN     DEFAULT true,
          created_at         TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      await runner.query(`
        ALTER TABLE "${schema}".courses ADD COLUMN IF NOT EXISTS academic_system VARCHAR(50) DEFAULT 'semester';
        ALTER TABLE "${schema}".courses ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
        ALTER TABLE "${schema}".courses ADD COLUMN IF NOT EXISTS course_type VARCHAR(50);
        ALTER TABLE "${schema}".courses ADD COLUMN IF NOT EXISTS professional_phase VARCHAR(100) DEFAULT 'Semester 1 (1st Year)';
        ALTER TABLE "${schema}".courses ALTER COLUMN duration_years TYPE NUMERIC(4,1);
      `);

      // ── Academic Sessions (added in later migration) ──────────────────────
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".academic_sessions (
          id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          code         VARCHAR(50),
          session_cd   VARCHAR(50),
          colg_cd      VARCHAR(50)  DEFAULT '1',
          name         VARCHAR(100) NOT NULL,
          start_date   DATE         NOT NULL,
          end_date     DATE         NOT NULL,
          is_current   BOOLEAN      DEFAULT false,
          is_active    BOOLEAN      DEFAULT true,
          created_at   TIMESTAMPTZ  DEFAULT NOW()
        );
        ALTER TABLE "${schema}".academic_sessions ADD COLUMN IF NOT EXISTS code VARCHAR(50);
        ALTER TABLE "${schema}".academic_sessions ADD COLUMN IF NOT EXISTS session_cd VARCHAR(50);
        ALTER TABLE "${schema}".academic_sessions ADD COLUMN IF NOT EXISTS colg_cd VARCHAR(50) DEFAULT '1';
      `);

      // ── Professional Linkers ──────────────────────────────────────────────
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".professional_linkers (
          id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          code               VARCHAR(50) NOT NULL,
          name               VARCHAR(200) NOT NULL,
          course_cd          VARCHAR(50),
          professional_phase VARCHAR(100),
          academic_session   VARCHAR(100),
          description        TEXT,
          is_active          BOOLEAN     DEFAULT true,
          created_at         TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // ── Topic Master ──────────────────────────────────────────────────────
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".topics (
          id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          subject_id   UUID        REFERENCES "${schema}".subjects(id) ON DELETE CASCADE,
          linker_id    UUID        REFERENCES "${schema}".professional_linkers(id) ON DELETE SET NULL,
          code         VARCHAR(50) NOT NULL,
          name         VARCHAR(200) NOT NULL,
          description  TEXT,
          hours        INT         DEFAULT 1,
          is_active    BOOLEAN     DEFAULT true,
          created_at         TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // ── Competency Master ─────────────────────────────────────────────────
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".competencies (
          id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          subject_id   UUID        REFERENCES "${schema}".subjects(id) ON DELETE SET NULL,
          topic_id     UUID        REFERENCES "${schema}".topics(id) ON DELETE SET NULL,
          linker_id    UUID        REFERENCES "${schema}".professional_linkers(id) ON DELETE SET NULL,
          code         VARCHAR(50) NOT NULL,
          description  TEXT        NOT NULL,
          domain       VARCHAR(50) DEFAULT 'Knowledge',
          level        VARCHAR(50) DEFAULT 'Knows How',
          is_core      BOOLEAN     DEFAULT true,
          is_active    BOOLEAN     DEFAULT true,
          created_at         TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // ── Professional Phases ───────────────────────────────────────────────
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".professional_phases (
          id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          college_id       VARCHAR(50),
          course_cd        VARCHAR(50) DEFAULT 'MBBS',
          name             VARCHAR(200) NOT NULL,
          phase_order      INT         DEFAULT 1,
          academic_system  VARCHAR(50) DEFAULT 'professional',
          is_active        BOOLEAN     DEFAULT true,
          created_at       TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // ── Student Phase Progressions (Promotion History) ────────────────────
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".student_phase_progressions (
          id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id       UUID        REFERENCES "${schema}".students(id) ON DELETE CASCADE,
          batch_id         VARCHAR(50),
          from_phase_id    VARCHAR(50),
          from_phase_name  VARCHAR(200),
          to_phase_id      VARCHAR(50),
          to_phase_name    VARCHAR(200),
          academic_year    VARCHAR(50),
          is_active        BOOLEAN     DEFAULT true,
          promoted_at      TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // ── Delivery Types Master ──
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".delivery_types (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(10) UNIQUE NOT NULL,
          name VARCHAR(50) NOT NULL,
          is_active BOOLEAN DEFAULT true NOT NULL
        );
      `);

      // Seed standard NMC delivery types
      const existingDTypes = await runner.query(`SELECT id FROM "${schema}".delivery_types LIMIT 1`);
      if (existingDTypes.length === 0) {
        await runner.query(`
          INSERT INTO "${schema}".delivery_types (code, name) VALUES
            ('TH', 'Theory'),
            ('PR', 'Practical'),
            ('AE', 'AETCOM'),
            ('PD', 'Pandemic Module'),
            ('CP', 'Clinical Posting');
        `);
      }

      // ── Subject Offerings Junction Table ──
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".subject_offerings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          subject_id UUID NOT NULL REFERENCES "${schema}".subjects(id) ON DELETE CASCADE,
          prof_id UUID NOT NULL REFERENCES "${schema}".professional_phases(id) ON DELETE CASCADE,
          dtype_id UUID NOT NULL REFERENCES "${schema}".delivery_types(id) ON DELETE CASCADE,
          batch_year INTEGER NOT NULL,
          hours_allotted INTEGER DEFAULT 0 NOT NULL,
          is_active BOOLEAN DEFAULT true NOT NULL,
          CONSTRAINT uq_subject_offering UNIQUE (subject_id, prof_id, dtype_id, batch_year)
        );
      `);

      // Alter attendance_sessions table to add offering_id column with ON DELETE SET NULL to preserve attendance
      await runner.query(`
        ALTER TABLE "${schema}".attendance_sessions 
        ADD COLUMN IF NOT EXISTS offering_id UUID REFERENCES "${schema}".subject_offerings(id) ON DELETE SET NULL;
      `);

      // Ensure existing offering_id constraints use ON DELETE SET NULL to protect attendance records
      await runner.query(`
        DO $$
        DECLARE
          r RECORD;
        BEGIN
          FOR r IN (
            SELECT tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_schema = '${schema}' 
              AND tc.table_name = 'attendance_sessions' 
              AND kcu.column_name = 'offering_id'
              AND rc.delete_rule = 'CASCADE'
          ) LOOP
            EXECUTE 'ALTER TABLE "${schema}".attendance_sessions DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
            EXECUTE 'ALTER TABLE "${schema}".attendance_sessions ADD CONSTRAINT ' || quote_ident(r.constraint_name) || ' FOREIGN KEY (offering_id) REFERENCES "${schema}".subject_offerings(id) ON DELETE SET NULL';
          END LOOP;
        END $$;
      `).catch(() => {});

      // Alter subjects table to add is_longitudinal column
      await runner.query(`
        ALTER TABLE "${schema}".subjects 
        ADD COLUMN IF NOT EXISTS is_longitudinal BOOLEAN DEFAULT false;
      `);

      // ── Units Master (Medical Curriculum) ──
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".units (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          subject_id UUID REFERENCES "${schema}".subjects(id) ON DELETE CASCADE,
          unit_number INT DEFAULT 1,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_units_subject ON "${schema}".units (subject_id);
      `);

      // Alter topics table to add unit_id
      await runner.query(`
        ALTER TABLE "${schema}".topics 
        ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES "${schema}".units(id) ON DELETE SET NULL;
      `);

      // ── Medical Schedule Entries (Parallel Medical Timetable Module) ──
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".medical_schedule_entries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          course_id VARCHAR(50) DEFAULT 'MBBS',
          course_name VARCHAR(100) DEFAULT 'MBBS',
          department_id UUID,
          department_name VARCHAR(200),
          professional_year_id UUID,
          professional_year_name VARCHAR(100),
          subject_id UUID,
          subject_name VARCHAR(200),
          linked_subject_id UUID,
          linked_subject_name VARCHAR(200),
          faculty_id UUID,
          faculty_name VARCHAR(200),
          faculty_emp_id VARCHAR(50),
          unit_id UUID,
          unit_name VARCHAR(255),
          topic_id UUID,
          topic_name VARCHAR(255),
          competency_ids JSONB DEFAULT '[]'::jsonb,
          competency_codes VARCHAR(255),
          room VARCHAR(100),
          day_of_week INT NOT NULL,
          start_time VARCHAR(20) NOT NULL,
          end_time VARCHAR(20) NOT NULL,
          session_type VARCHAR(50) DEFAULT 'Lecture',
          delivery_type_id UUID,
          notes TEXT,
          created_by UUID,
          updated_by UUID,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_med_sched_dept_prof ON "${schema}".medical_schedule_entries (department_id, professional_year_id);
        CREATE INDEX IF NOT EXISTS idx_med_sched_faculty ON "${schema}".medical_schedule_entries (faculty_id);
        CREATE INDEX IF NOT EXISTS idx_med_sched_day_time ON "${schema}".medical_schedule_entries (day_of_week, start_time, end_time);
      `);

      // Alter topics and competencies to add linker_id column
      await runner.query(`
        ALTER TABLE "${schema}".topics 
        ADD COLUMN IF NOT EXISTS linker_id UUID REFERENCES "${schema}".professional_linkers(id) ON DELETE SET NULL;
      `);
      await runner.query(`
        ALTER TABLE "${schema}".competencies 
        ADD COLUMN IF NOT EXISTS linker_id UUID REFERENCES "${schema}".professional_linkers(id) ON DELETE SET NULL;
      `);

      // Alter faculty table for Staff Master
      await runner.query(`
        ALTER TABLE "${schema}".faculty 
        ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES "${schema}".subjects(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
        ADD COLUMN IF NOT EXISTS experience VARCHAR(100),
        ADD COLUMN IF NOT EXISTS staff_type VARCHAR(50) DEFAULT 'Faculty';
      `);

      // Create faculty_subjects table for Subject Linker
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".faculty_subjects (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          faculty_id UUID NOT NULL REFERENCES "${schema}".faculty(id) ON DELETE CASCADE,
          subject_id UUID NOT NULL REFERENCES "${schema}".subjects(id) ON DELETE CASCADE,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          CONSTRAINT uq_faculty_subject UNIQUE (faculty_id, subject_id)
        );
      `);

      // ── My Repository Tables ────────────────────────────────────────────────
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".repositories (
          repo_id                SERIAL PRIMARY KEY,
          colg_cd                VARCHAR(20) NOT NULL DEFAULT '1',
          course_cd              VARCHAR(20) NOT NULL,
          branch_cd              VARCHAR(20) NOT NULL,
          batch_cd               VARCHAR(20) NOT NULL,
          sem_cd                 VARCHAR(20) NOT NULL DEFAULT '1',
          student_reg_no         VARCHAR(50) NOT NULL,
          student_name           VARCHAR(200),
          title                  VARCHAR(255) NOT NULL,
          description            TEXT NOT NULL,
          repo_link              TEXT NOT NULL,
          tech_stack             TEXT[] NOT NULL DEFAULT '{}',
          status                 VARCHAR(50) NOT NULL DEFAULT 'Pending Review',
          is_placement_eligible  BOOLEAN NOT NULL DEFAULT false,
          score                  NUMERIC(5,2),
          grade                  VARCHAR(10),
          submitted_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".repository_reviews (
          review_id      SERIAL PRIMARY KEY,
          repo_id        INT NOT NULL REFERENCES "${schema}".repositories(repo_id) ON DELETE CASCADE,
          faculty_empid  VARCHAR(50) NOT NULL,
          faculty_name   VARCHAR(200),
          remarks        TEXT NOT NULL,
          score          NUMERIC(5,2) NOT NULL,
          grade          VARCHAR(10),
          reviewed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      // ── Placement Drive Tables ──────────────────────────────────────────────
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".placement_drives (
          drive_id               SERIAL PRIMARY KEY,
          colg_cd                VARCHAR(20) NOT NULL DEFAULT '1',
          company_name           VARCHAR(200) NOT NULL,
          role                   VARCHAR(200) NOT NULL,
          package_ctc            VARCHAR(100),
          description            TEXT NOT NULL,
          eligibility_course_cd  VARCHAR(20) NOT NULL,
          eligibility_branch_cd  VARCHAR(20),
          eligibility_batch_cd   VARCHAR(20) NOT NULL,
          min_score_required     NUMERIC(5,2) DEFAULT 0.00,
          drive_date             DATE NOT NULL,
          deadline_date          TIMESTAMPTZ NOT NULL,
          status                 VARCHAR(50) NOT NULL DEFAULT 'Open',
          created_by_empid       VARCHAR(50) NOT NULL,
          created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".placement_applications (
          application_id    SERIAL PRIMARY KEY,
          drive_id          INT NOT NULL REFERENCES "${schema}".placement_drives(drive_id) ON DELETE CASCADE,
          student_reg_no    VARCHAR(50) NOT NULL,
          student_name      VARCHAR(200),
          resume_link       TEXT NOT NULL,
          cover_note        TEXT,
          applied_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          status            VARCHAR(50) NOT NULL DEFAULT 'Applied',
          selected_company  VARCHAR(200),
          selected_role     VARCHAR(200),
          remarks           TEXT,
          updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT uq_student_drive_app UNIQUE (drive_id, student_reg_no)
        );
      `);

      // ── Notices & Circulars Tables ──────────────────────────────────────────
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".notices (
          id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          college_id               UUID,
          title                    VARCHAR(255) NOT NULL,
          body                     TEXT NOT NULL,
          priority                 VARCHAR(20) DEFAULT 'normal',
          category                 VARCHAR(50) DEFAULT 'announcement',
          created_by               UUID,
          creator_name             VARCHAR(200),
          creator_role             VARCHAR(100),
          status                   VARCHAR(20) DEFAULT 'sent',
          scheduled_at             TIMESTAMPTZ,
          expires_at               TIMESTAMPTZ,
          requires_acknowledgement BOOLEAN DEFAULT false,
          created_at               TIMESTAMPTZ DEFAULT NOW(),
          updated_at               TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".notice_attachments (
          id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          notice_id    UUID REFERENCES "${schema}".notices(id) ON DELETE CASCADE,
          file_name    VARCHAR(255) NOT NULL,
          file_type    VARCHAR(50),
          file_url     TEXT NOT NULL,
          file_size_kb INT DEFAULT 0,
          created_at   TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".notice_targets (
          id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          notice_id    UUID REFERENCES "${schema}".notices(id) ON DELETE CASCADE,
          target_type  VARCHAR(50) NOT NULL,
          target_value VARCHAR(255) NOT NULL,
          target_label VARCHAR(255),
          created_at   TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".notice_recipients (
          id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          notice_id       UUID REFERENCES "${schema}".notices(id) ON DELETE CASCADE,
          user_id         UUID REFERENCES "${schema}".users(id) ON DELETE CASCADE,
          is_read         BOOLEAN DEFAULT false,
          read_at         TIMESTAMPTZ,
          acknowledged    BOOLEAN DEFAULT false,
          acknowledged_at TIMESTAMPTZ,
          created_at      TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await runner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS uq_${schema.replace(/[^a-zA-Z0-9]/g, '_')}_noticerec 
        ON "${schema}".notice_recipients (notice_id, user_id);
      `);

      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".notice_group_templates (
          id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name         VARCHAR(200) NOT NULL,
          description  TEXT,
          created_by   UUID,
          target_rules JSONB DEFAULT '[]'::jsonb,
          is_active    BOOLEAN DEFAULT true,
          created_at   TIMESTAMPTZ DEFAULT NOW(),
          updated_at   TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // ── Batch & Department Chat Communication Tables ──────────────────────
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".chat_groups (
          id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          college_id      VARCHAR(255),
          department_id   VARCHAR(255),
          department_name VARCHAR(255),
          batch_year      VARCHAR(100) NOT NULL DEFAULT '2025',
          batch_id        VARCHAR(255),
          batch_code      VARCHAR(100),
          name            VARCHAR(255) NOT NULL DEFAULT 'Batch Group',
          description     TEXT,
          is_active       BOOLEAN DEFAULT true,
          created_at      TIMESTAMPTZ DEFAULT NOW(),
          updated_at      TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS "${schema}".chat_group_members (
          id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          chat_group_id UUID REFERENCES "${schema}".chat_groups(id) ON DELETE CASCADE,
          user_id       VARCHAR(255) NOT NULL DEFAULT 'FAC001',
          role          VARCHAR(50) NOT NULL DEFAULT 'STUDENT',
          name          VARCHAR(255),
          avatar_url    TEXT,
          joined_at     TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(chat_group_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS "${schema}".chat_messages (
          id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          chat_group_id UUID REFERENCES "${schema}".chat_groups(id) ON DELETE CASCADE,
          sender_id     VARCHAR(255),
          sender_name   VARCHAR(255) NOT NULL DEFAULT 'Faculty Member',
          sender_role   VARCHAR(50) NOT NULL DEFAULT 'FACULTY',
          sender_avatar TEXT,
          body          TEXT,
          created_at    TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS "${schema}".chat_attachments (
          id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          message_id   UUID REFERENCES "${schema}".chat_messages(id) ON DELETE CASCADE,
          file_name    VARCHAR(255) NOT NULL,
          file_type    VARCHAR(50) DEFAULT 'other',
          file_url     TEXT NOT NULL,
          file_size_kb INT DEFAULT 0,
          created_at   TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS "${schema}".chat_read_state (
          id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          chat_group_id        UUID REFERENCES "${schema}".chat_groups(id) ON DELETE CASCADE,
          user_id              VARCHAR(255) NOT NULL,
          last_read_message_id UUID,
          updated_at           TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(chat_group_id, user_id)
        );
      `);

      // Column migrations for chat tables
      await runner.query(`
        DO $$ 
        BEGIN 
          BEGIN
            ALTER TABLE "${schema}".chat_groups ADD COLUMN IF NOT EXISTS batch_year VARCHAR(100) DEFAULT '2025';
            ALTER TABLE "${schema}".chat_groups ADD COLUMN IF NOT EXISTS batch_code VARCHAR(100);
            ALTER TABLE "${schema}".chat_groups ADD COLUMN IF NOT EXISTS department_id VARCHAR(255);
            ALTER TABLE "${schema}".chat_groups ADD COLUMN IF NOT EXISTS department_name VARCHAR(255);
            ALTER TABLE "${schema}".chat_groups ADD COLUMN IF NOT EXISTS college_id VARCHAR(255);
            ALTER TABLE "${schema}".chat_groups ADD COLUMN IF NOT EXISTS batch_id VARCHAR(255);
            ALTER TABLE "${schema}".chat_groups ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT 'Batch Group';
            ALTER TABLE "${schema}".chat_groups ADD COLUMN IF NOT EXISTS description TEXT;
            ALTER TABLE "${schema}".chat_groups ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
            ALTER TABLE "${schema}".chat_groups ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
            ALTER TABLE "${schema}".chat_groups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
          EXCEPTION WHEN OTHERS THEN NULL;
          END;

          BEGIN
            ALTER TABLE "${schema}".chat_groups ALTER COLUMN department_id TYPE VARCHAR(255) USING department_id::text;
          EXCEPTION WHEN OTHERS THEN NULL;
          END;
          BEGIN
            ALTER TABLE "${schema}".chat_groups ALTER COLUMN batch_id TYPE VARCHAR(255) USING batch_id::text;
          EXCEPTION WHEN OTHERS THEN NULL;
          END;
          BEGIN
            ALTER TABLE "${schema}".chat_groups ALTER COLUMN college_id TYPE VARCHAR(255) USING college_id::text;
          EXCEPTION WHEN OTHERS THEN NULL;
          END;
          BEGIN
            ALTER TABLE "${schema}".chat_group_members DROP CONSTRAINT IF EXISTS chat_group_members_chat_group_id_user_id_key;
            ALTER TABLE "${schema}".chat_group_members ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::text;
            ALTER TABLE "${schema}".chat_group_members ADD CONSTRAINT chat_group_members_chat_group_id_user_id_key UNIQUE(chat_group_id, user_id);
          EXCEPTION WHEN OTHERS THEN NULL;
          END;
          BEGIN
            ALTER TABLE "${schema}".chat_messages ALTER COLUMN sender_id TYPE VARCHAR(255) USING sender_id::text;
          EXCEPTION WHEN OTHERS THEN NULL;
          END;
          BEGIN
            ALTER TABLE "${schema}".chat_read_state DROP CONSTRAINT IF EXISTS chat_read_state_chat_group_id_user_id_key;
            ALTER TABLE "${schema}".chat_read_state ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::text;
            ALTER TABLE "${schema}".chat_read_state ADD CONSTRAINT chat_read_state_chat_group_id_user_id_key UNIQUE(chat_group_id, user_id);
          EXCEPTION WHEN OTHERS THEN NULL;
          END;
        END $$;
      `).catch(() => {});

      try {
        await this.seedDefaultData(runner, slug);
      } catch (seedErr) {
        this.logger.warn(`Non-fatal warning in seedDefaultData for ${slug}: ${seedErr.message}`);
      }
    } catch (err) {
      this.logger.error(`Failed to ensure latest schema for ${slug}:`, err);
      throw err;
    } finally {
      await runner.release();
    }
  }

  private async createTenantTables(runner: QueryRunner, schema: string): Promise<void> {
    // ── Users ──────────────────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".users (
        id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        email               VARCHAR(200) UNIQUE NOT NULL,
        username            VARCHAR(100),
        password_hash       VARCHAR(200) NOT NULL,
        name                VARCHAR(255),
        phone               VARCHAR(20),
        role                VARCHAR(50)  NOT NULL,
        emp_id              VARCHAR(50),
        usr_id              VARCHAR(50),
        devicecd            BIGINT,
        loc_cd              INT,
        department          VARCHAR(100),
        is_active           BOOLEAN      DEFAULT true,
        onboarding_completed BOOLEAN     DEFAULT false,
        onboarding_step     INT          DEFAULT 0,
        must_change_password BOOLEAN     DEFAULT true,
        failed_login_count  INT          DEFAULT 0,
        locked_until        TIMESTAMPTZ,
        last_login_at       TIMESTAMPTZ,
        password_reset_token VARCHAR(200),
        password_reset_expires TIMESTAMPTZ,
        created_at          TIMESTAMPTZ  DEFAULT NOW(),
        updated_at          TIMESTAMPTZ  DEFAULT NOW()
      )
    `);

    // ── Departments ────────────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".departments (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(200) NOT NULL,
        code        VARCHAR(50)  NOT NULL,
        type        VARCHAR(50)  DEFAULT 'ACADEMIC',
        hod_user_id UUID        REFERENCES "${schema}".users(id),
        is_active   BOOLEAN      DEFAULT true,
        created_at  TIMESTAMPTZ  DEFAULT NOW()
      );
      DROP INDEX IF EXISTS "${schema}".departments_code_idx;
      ALTER TABLE "${schema}".departments DROP CONSTRAINT IF EXISTS departments_code_key;
      ALTER TABLE "${schema}".departments DROP CONSTRAINT IF EXISTS departments_code_idx;
      ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50);
      ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
      ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS course_name VARCHAR(200);
      ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS colg_cd VARCHAR(50);
    `);

    // ── Faculty ────────────────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".faculty (
        id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID        UNIQUE REFERENCES "${schema}".users(id) ON DELETE CASCADE,
        emp_id          VARCHAR(50)  UNIQUE NOT NULL,
        usr_id          VARCHAR(50),
        devicecd        BIGINT,
        loc_cd          INT,
        name            VARCHAR(200) NOT NULL,
        department_id   UUID        REFERENCES "${schema}".departments(id),
        subject_id      UUID,
        designation     VARCHAR(100),
        qualification   TEXT,
        specialization  VARCHAR(200),
        joining_date    DATE,
        photo_url       TEXT,
        phone           VARCHAR(20),
        gender          VARCHAR(20),
        experience      VARCHAR(100),
        staff_type      VARCHAR(50)  DEFAULT 'Faculty',
        employment_status VARCHAR(50) DEFAULT 'ACTIVE',
        is_active       BOOLEAN      DEFAULT true,
        created_at      TIMESTAMPTZ  DEFAULT NOW(),
        updated_at      TIMESTAMPTZ  DEFAULT NOW()
      )
    `);
    await runner.query(`CREATE INDEX IF NOT EXISTS idx_faculty_emp_id ON "${schema}".faculty(emp_id)`);
    await runner.query(`CREATE INDEX IF NOT EXISTS idx_faculty_dept ON "${schema}".faculty(department_id)`);

    // ── Batches ────────────────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".batches (
        id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        code          VARCHAR(20)  NOT NULL,
        year          INT          NOT NULL,
        course_cd     VARCHAR(20)  NOT NULL,
        department_id UUID        REFERENCES "${schema}".departments(id),
        start_date    DATE,
        end_date      DATE,
        is_active     BOOLEAN      DEFAULT true,
        CONSTRAINT unq_batches_code UNIQUE (code)
      )
    `);

    // Clean up duplicate batches keeping only the oldest record per code
    await runner.query(`
      DELETE FROM "${schema}".batches
      WHERE id IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY code ORDER BY id ASC) as rnum
          FROM "${schema}".batches
        ) t
        WHERE t.rnum > 1
      );
    `);

    // ── Groups Master (Batch Sub-Groups like A, B, C, D) ───────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".groups_master (
        id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        code          VARCHAR(50)  NOT NULL,
        name          VARCHAR(200) NOT NULL,
        college_id    UUID,
        course_id     UUID,
        batch_id      UUID        REFERENCES "${schema}".batches(id) ON DELETE CASCADE,
        department_id UUID        REFERENCES "${schema}".departments(id) ON DELETE SET NULL,
        capacity      INT          DEFAULT 50,
        is_active     BOOLEAN      DEFAULT true,
        created_at    TIMESTAMPTZ  DEFAULT NOW(),
        updated_at    TIMESTAMPTZ  DEFAULT NOW()
      )
    `);

    // ── Students ───────────────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".students (
        id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id           UUID        UNIQUE REFERENCES "${schema}".users(id) ON DELETE CASCADE,
        rollno            VARCHAR(50)  UNIQUE,
        registration_no   VARCHAR(50)  UNIQUE NOT NULL,
        name              VARCHAR(200) NOT NULL,
        batch_cd          VARCHAR(20),
        course_cd         VARCHAR(20),
        department_id     UUID        REFERENCES "${schema}".departments(id),
        batch_id          UUID        REFERENCES "${schema}".batches(id),
        admission_year    INT,
        photo_url         TEXT,
        phone             VARCHAR(20),
        address           TEXT,
        blood_group       VARCHAR(5),
        emergency_contact VARCHAR(20),
        is_active         BOOLEAN      DEFAULT true,
        created_at        TIMESTAMPTZ  DEFAULT NOW(),
        updated_at        TIMESTAMPTZ  DEFAULT NOW()
      )
    `);
    await runner.query(`CREATE INDEX IF NOT EXISTS idx_students_rollno ON "${schema}".students(rollno)`);
    await runner.query(`CREATE INDEX IF NOT EXISTS idx_students_dept ON "${schema}".students(department_id)`);
    await runner.query(`CREATE INDEX IF NOT EXISTS idx_students_batch ON "${schema}".students(batch_id)`);

    // Create student_admissions
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".student_admissions (
        student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
        college_id UUID,
        college_name VARCHAR(200),
        course_id UUID,
        course_code VARCHAR(50),
        professional_id VARCHAR(50),
        professional_phase VARCHAR(100),
        session_id UUID,
        academic_session VARCHAR(100),
        batch_id UUID,
        batch_code VARCHAR(50),
        branch_id UUID,
        residency_type VARCHAR(50),
        admission_type VARCHAR(50),
        admission_date DATE,
        status VARCHAR(50) DEFAULT 'ACTIVE'
      );
    `);

    // Create student_academic_details
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".student_academic_details (
        student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
        class_10_board VARCHAR(100),
        class_10_percentage NUMERIC(5,2),
        class_12_board VARCHAR(100),
        class_12_physics NUMERIC(5,2),
        class_12_chemistry NUMERIC(5,2),
        class_12_biology NUMERIC(5,2),
        class_12_english NUMERIC(5,2),
        class_12_percentage NUMERIC(5,2)
      );
    `);

    // Create student_neet_details
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".student_neet_details (
        student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
        neet_roll_no VARCHAR(50),
        neet_score NUMERIC(6,2),
        neet_percentile NUMERIC(5,2),
        neet_air_rank INT,
        neet_category_rank INT
      );
    `);

    // Create student_parents
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".student_parents (
        student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
        father_name VARCHAR(200),
        father_occupation VARCHAR(100),
        father_mobile VARCHAR(20),
        mother_name VARCHAR(200),
        mother_occupation VARCHAR(100),
        mother_mobile VARCHAR(20),
        annual_income NUMERIC(12,2)
      );
    `);

    // Create student_addresses
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".student_addresses (
        student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
        permanent_address_1 TEXT,
        permanent_address_2 TEXT,
        permanent_city VARCHAR(100),
        permanent_district VARCHAR(100),
        permanent_state VARCHAR(100),
        permanent_pincode VARCHAR(20),
        same_as_permanent BOOLEAN DEFAULT false
      );
    `);

    // Create student_documents
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".student_documents (
        student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
        passport_photo_url TEXT,
        student_signature_url TEXT,
        parent_signature_url TEXT,
        aadhaar_card_url TEXT,
        class_10_marksheet_url TEXT,
        class_12_marksheet_url TEXT,
        neet_score_card_url TEXT
      );
    `);

    // Create student_fees
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".student_fees (
        student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
        paid_fees NUMERIC(12,2) DEFAULT 0,
        pending_fees NUMERIC(12,2) DEFAULT 0,
        total_fees NUMERIC(12,2) DEFAULT 0
      );
    `);

    // Create student_hostel
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".student_hostel (
        student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
        hostel_required BOOLEAN DEFAULT false,
        hostel_name VARCHAR(100),
        room_number VARCHAR(50)
      );
    `);

    // Create student_transport
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".student_transport (
        student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
        bus_required BOOLEAN DEFAULT false,
        transport_route VARCHAR(100)
      );
    `);

    // Create student_library
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".student_library (
        student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
        library_card_no VARCHAR(50),
        rfid_tag VARCHAR(50)
      );
    `);

    // Create student_medical
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".student_medical (
        student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
        medical_history TEXT,
        vaccination_status VARCHAR(100),
        fitness_certificate_url TEXT
      );
    `);

    // Create student_bank_accounts
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".student_bank_accounts (
        student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
        bank_name VARCHAR(150),
        account_number VARCHAR(50),
        ifsc_code VARCHAR(20)
      );
    `);

    // Create student_emergency_contacts
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".student_emergency_contacts (
        student_id UUID PRIMARY KEY REFERENCES "${schema}".students(id) ON DELETE CASCADE,
        contact_name VARCHAR(200),
        relationship VARCHAR(100),
        phone VARCHAR(20)
      );
    `);

    // ── Subjects ───────────────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".subjects (
        id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        code            VARCHAR(30)  UNIQUE NOT NULL,
        name            VARCHAR(200) NOT NULL,
        department_id   UUID        REFERENCES "${schema}".departments(id),
        batch_id        UUID        REFERENCES "${schema}".batches(id),
        credits         INT          DEFAULT 0,
        type            VARCHAR(20),
        is_longitudinal BOOLEAN      DEFAULT false,
        is_active       BOOLEAN      DEFAULT true
      )
    `);

    // ── Faculty Subjects junction ──────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".faculty_subjects (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        faculty_id  UUID        NOT NULL REFERENCES "${schema}".faculty(id) ON DELETE CASCADE,
        subject_id  UUID        NOT NULL REFERENCES "${schema}".subjects(id) ON DELETE CASCADE,
        is_active   BOOLEAN      DEFAULT true,
        created_at  TIMESTAMPTZ  DEFAULT NOW(),
        CONSTRAINT uq_faculty_subject UNIQUE (faculty_id, subject_id)
      )
    `);

    // ── Professional Phases ────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".professional_phases (
        id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        college_id       VARCHAR(50),
        course_cd        VARCHAR(50) DEFAULT 'MBBS',
        name             VARCHAR(200) NOT NULL,
        phase_order      INT         DEFAULT 1,
        academic_system  VARCHAR(50) DEFAULT 'professional',
        is_active        BOOLEAN     DEFAULT true,
        created_at       TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── Delivery Types Master ──────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".delivery_types (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        code        VARCHAR(10)  UNIQUE NOT NULL,
        name        VARCHAR(50)  NOT NULL,
        is_active   BOOLEAN      DEFAULT true NOT NULL
      )
    `);

    // ── Subject Offerings Junction ──────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".subject_offerings (
        id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        subject_id     UUID        NOT NULL REFERENCES "${schema}".subjects(id) ON DELETE CASCADE,
        prof_id        UUID        NOT NULL REFERENCES "${schema}".professional_phases(id) ON DELETE CASCADE,
        dtype_id       UUID        NOT NULL REFERENCES "${schema}".delivery_types(id) ON DELETE CASCADE,
        batch_year     INTEGER     NOT NULL,
        hours_allotted INTEGER     DEFAULT 0 NOT NULL,
        is_active      BOOLEAN     DEFAULT true NOT NULL,
        CONSTRAINT uq_subject_offering UNIQUE (subject_id, prof_id, dtype_id, batch_year)
      )
    `);

    // ── Attendance Sessions ────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".attendance_sessions (
        id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        faculty_id    UUID        REFERENCES "${schema}".faculty(id),
        subject_id    UUID        REFERENCES "${schema}".subjects(id),
        batch_id      UUID        REFERENCES "${schema}".batches(id),
        offering_id   UUID        REFERENCES "${schema}".subject_offerings(id) ON DELETE SET NULL,
        session_date  DATE         NOT NULL,
        session_time  TIME,
        session_type  VARCHAR(20),
        created_by    UUID        REFERENCES "${schema}".users(id),
        created_at    TIMESTAMPTZ  DEFAULT NOW()
      )
    `);
    await runner.query(`CREATE INDEX IF NOT EXISTS idx_att_sess_date ON "${schema}".attendance_sessions(session_date)`);

    // ── Attendance Records ─────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".attendance_records (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id  UUID        REFERENCES "${schema}".attendance_sessions(id) ON DELETE CASCADE,
        student_id  UUID        REFERENCES "${schema}".students(id),
        status      VARCHAR(10)  NOT NULL DEFAULT 'ABSENT',
        marked_at   TIMESTAMPTZ  DEFAULT NOW(),
        marked_by   UUID        REFERENCES "${schema}".users(id),
        UNIQUE(session_id, student_id)
      )
    `);
    await runner.query(`CREATE INDEX IF NOT EXISTS idx_att_rec_student ON "${schema}".attendance_records(student_id)`);

    // ── Faculty Punch Logs ─────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".faculty_punch_logs (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        faculty_id  UUID        REFERENCES "${schema}".faculty(id),
        punch_time  TIMESTAMPTZ  NOT NULL,
        punch_type  VARCHAR(10),
        device_id   VARCHAR(50),
        created_at  TIMESTAMPTZ  DEFAULT NOW()
      )
    `);

    // ── Logbook Activity Types ─────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".logbook_activity_types (
        id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        code          VARCHAR(50)  NOT NULL,
        name          VARCHAR(200) NOT NULL,
        subject_id    UUID        REFERENCES "${schema}".subjects(id),
        category      VARCHAR(50),
        max_required  INT          DEFAULT 1,
        activity_type VARCHAR(20),
        is_active     BOOLEAN      DEFAULT true
      )
    `);

    // ── Logbook Entries ────────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".logbook_entries (
        id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id        UUID        REFERENCES "${schema}".students(id),
        activity_type_id  UUID        REFERENCES "${schema}".logbook_activity_types(id),
        faculty_id        UUID        REFERENCES "${schema}".faculty(id),
        entry_date        DATE         NOT NULL,
        description       TEXT,
        batch_year        INT,
        month_number      INT,
        year              INT,
        created_at        TIMESTAMPTZ  DEFAULT NOW(),
        updated_at        TIMESTAMPTZ  DEFAULT NOW()
      )
    `);
    await runner.query(`CREATE INDEX IF NOT EXISTS idx_lb_entry_student ON "${schema}".logbook_entries(student_id)`);

    // ── Logbook Verifications ──────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".logbook_verifications (
        id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        entry_id      UUID        REFERENCES "${schema}".logbook_entries(id) ON DELETE CASCADE,
        verifier_id   UUID        NOT NULL,
        verifier_role VARCHAR(50),
        status        VARCHAR(20)  DEFAULT 'PENDING',
        verified_at   TIMESTAMPTZ,
        remarks       TEXT
      )
    `);

    // ── Examination Papers ─────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".examination_papers (
        id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        code           VARCHAR(50)  UNIQUE NOT NULL,
        name           VARCHAR(200) NOT NULL,
        subject_id     UUID        REFERENCES "${schema}".subjects(id),
        batch_id       UUID        REFERENCES "${schema}".batches(id),
        exam_date      DATE,
        max_marks      NUMERIC(6,2),
        passing_marks  NUMERIC(6,2),
        type           VARCHAR(50),
        duration_minutes INT       DEFAULT 60,
        sections       JSONB       DEFAULT '[]'::jsonb,
        is_active      BOOLEAN     DEFAULT true,
        created_at     TIMESTAMPTZ  DEFAULT NOW(),
        updated_at     TIMESTAMPTZ  DEFAULT NOW()
      )
    `);

    await runner.query(`ALTER TABLE "${schema}".examination_papers ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 60;`);
    await runner.query(`ALTER TABLE "${schema}".examination_papers ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]'::jsonb;`);
    await runner.query(`ALTER TABLE "${schema}".examination_papers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`);

    // ── Examination Competencies ───────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".examination_competencies (
        id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        paper_id         UUID        REFERENCES "${schema}".examination_papers(id) ON DELETE CASCADE,
        code             VARCHAR(50),
        name             VARCHAR(200),
        max_marks        NUMERIC(6,2),
        weight_percentage NUMERIC(5,2)
      )
    `);

    // ── Student Results ────────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".student_results (
        id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id      UUID        REFERENCES "${schema}".students(id),
        paper_id        UUID        REFERENCES "${schema}".examination_papers(id),
        marks_obtained  NUMERIC(6,2),
        is_pass         BOOLEAN,
        attempt_number  INT          DEFAULT 1,
        entered_by      UUID        REFERENCES "${schema}".users(id),
        created_at      TIMESTAMPTZ  DEFAULT NOW(),
        UNIQUE(student_id, paper_id, attempt_number)
      )
    `);
    await runner.query(`CREATE INDEX IF NOT EXISTS idx_results_student ON "${schema}".student_results(student_id)`);
    await runner.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_${schema.replace(/[^a-zA-Z0-9]/g, '_')}_res_stud_paper_att ON "${schema}".student_results(student_id, paper_id, attempt_number)`);

    await runner.query(`ALTER TABLE "${schema}".student_results ADD COLUMN IF NOT EXISTS question_marks JSONB DEFAULT '{}'::jsonb;`);
    await runner.query(`ALTER TABLE "${schema}".student_results ADD COLUMN IF NOT EXISTS sub_part_marks JSONB DEFAULT '{}'::jsonb;`);
    await runner.query(`ALTER TABLE "${schema}".student_results ADD COLUMN IF NOT EXISTS practical_mark NUMERIC(6,2) DEFAULT 0;`);
    await runner.query(`ALTER TABLE "${schema}".student_results ADD COLUMN IF NOT EXISTS eval_status VARCHAR(50) DEFAULT 'EVALUATED';`);
    await runner.query(`ALTER TABLE "${schema}".student_results ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`);

    // ── Competency Results ─────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".student_competency_results (
        id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id      UUID        REFERENCES "${schema}".students(id),
        competency_id   UUID        REFERENCES "${schema}".examination_competencies(id),
        marks_obtained  NUMERIC(6,2)
      )
    `);

    // ── Question Bank ──────────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".question_bank (
        id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        college_id         UUID,
        department_id      UUID        REFERENCES "${schema}".departments(id) ON DELETE SET NULL,
        subject_id         UUID        REFERENCES "${schema}".subjects(id) ON DELETE SET NULL,
        professional_phase VARCHAR(100),
        topic              VARCHAR(250),
        mode               VARCHAR(20)  NOT NULL,
        question_text      TEXT        NOT NULL,
        option_a           TEXT,
        option_b           TEXT,
        option_c           TEXT,
        option_d           TEXT,
        correct_option     VARCHAR(20),
        difficulty_level   VARCHAR(20)  DEFAULT 'Medium',
        competency_code    VARCHAR(100),
        has_sub_questions  BOOLEAN      DEFAULT false,
        sub_questions      JSONB        DEFAULT '[]'::jsonb,
        max_marks          NUMERIC(5,2) DEFAULT 1.00,
        is_active          BOOLEAN      DEFAULT true,
        created_at         TIMESTAMPTZ  DEFAULT NOW()
      )
    `);
    await runner.query(`ALTER TABLE "${schema}".question_bank ADD COLUMN IF NOT EXISTS topic VARCHAR(250)`);

    // ── Timetable Slots ────────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".timetable_slots (
        id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        faculty_id      UUID        REFERENCES "${schema}".faculty(id),
        subject_id      UUID        REFERENCES "${schema}".subjects(id),
        department_id   UUID        REFERENCES "${schema}".departments(id),
        batch_id        UUID        REFERENCES "${schema}".batches(id),
        day_of_week     INT          NOT NULL,
        start_time      TIME         NOT NULL,
        end_time        TIME         NOT NULL,
        room            VARCHAR(50),
        slot_type       VARCHAR(50),
        effective_from  DATE,
        effective_until DATE,
        group_name      VARCHAR(100),
        topic           VARCHAR(255),
        competency_codes VARCHAR(255)
      )
    `);

    // ── Leave Types ────────────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".leave_types (
        id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        code              VARCHAR(20)  UNIQUE NOT NULL,
        name              VARCHAR(100) NOT NULL,
        max_days_per_year INT          DEFAULT 0
      )
    `);

    // ── Leave Applications ─────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".leave_applications (
        id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        faculty_id      UUID        REFERENCES "${schema}".faculty(id),
        leave_type_id   UUID        REFERENCES "${schema}".leave_types(id),
        from_date       DATE         NOT NULL,
        to_date         DATE         NOT NULL,
        reason          TEXT,
        status          VARCHAR(20)  DEFAULT 'PENDING',
        approved_by     UUID        REFERENCES "${schema}".users(id),
        applied_at      TIMESTAMPTZ  DEFAULT NOW(),
        actioned_at     TIMESTAMPTZ
      )
    `);

    // ── Salary Records ─────────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".salary_records (
        id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        faculty_id          UUID        REFERENCES "${schema}".faculty(id),
        month               INT          NOT NULL,
        year                INT          NOT NULL,
        basic               NUMERIC(10,2),
        da                  NUMERIC(10,2),
        hra                 NUMERIC(10,2),
        other_allowances    NUMERIC(10,2),
        pf_deduction        NUMERIC(10,2),
        tax_deduction       NUMERIC(10,2),
        net_salary          NUMERIC(10,2),
        created_at          TIMESTAMPTZ  DEFAULT NOW(),
        UNIQUE(faculty_id, month, year)
      )
    `);

    // ── Library Books ──────────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".library_books (
        id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        title             VARCHAR(300) NOT NULL,
        author            VARCHAR(200),
        isbn              VARCHAR(20)  UNIQUE,
        category          VARCHAR(100),
        publisher         VARCHAR(200),
        copies_total      INT          DEFAULT 1,
        copies_available  INT          DEFAULT 1,
        cover_url         TEXT,
        is_ebook          BOOLEAN      DEFAULT false,
        ebook_s3_key      TEXT,
        is_active         BOOLEAN      DEFAULT true
      )
    `);

    // ── Library Circulation ────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".library_circulation (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        book_id     UUID        REFERENCES "${schema}".library_books(id),
        student_id  UUID        REFERENCES "${schema}".students(id),
        issued_at   TIMESTAMPTZ  DEFAULT NOW(),
        due_date    DATE,
        returned_at TIMESTAMPTZ,
        fine_amount NUMERIC(8,2) DEFAULT 0
      )
    `);

    // ── Chat Groups ────────────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".chat_groups (
        id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        name          VARCHAR(200) NOT NULL,
        batch_id      UUID        REFERENCES "${schema}".batches(id),
        department_id UUID        REFERENCES "${schema}".departments(id),
        created_by    UUID        REFERENCES "${schema}".users(id),
        created_at    TIMESTAMPTZ  DEFAULT NOW()
      )
    `);

    // ── Chat Messages ──────────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".chat_messages (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id    UUID        REFERENCES "${schema}".chat_groups(id) ON DELETE CASCADE,
        sender_id   UUID        REFERENCES "${schema}".users(id),
        content     TEXT,
        file_url    TEXT,
        file_type   VARCHAR(50),
        sent_at     TIMESTAMPTZ  DEFAULT NOW(),
        is_deleted  BOOLEAN      DEFAULT false
      )
    `);
    await runner.query(`CREATE INDEX IF NOT EXISTS idx_chat_msg_group ON "${schema}".chat_messages(group_id, sent_at DESC)`);

    // ── Notifications ──────────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".notifications (
        id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        recipient_id  UUID        REFERENCES "${schema}".users(id) ON DELETE CASCADE,
        title         VARCHAR(200) NOT NULL,
        body          TEXT,
        type          VARCHAR(50),
        is_read       BOOLEAN      DEFAULT false,
        created_at    TIMESTAMPTZ  DEFAULT NOW()
      )
    `);
    await runner.query(`CREATE INDEX IF NOT EXISTS idx_notif_recipient ON "${schema}".notifications(recipient_id, is_read, created_at DESC)`);

    // ── Fee Structure ──────────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".fees_structure (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        course_cd   VARCHAR(20),
        batch_id    UUID        REFERENCES "${schema}".batches(id),
        fee_type    VARCHAR(100),
        amount      NUMERIC(10,2),
        due_date    DATE,
        is_active   BOOLEAN      DEFAULT true
      )
    `);

    // ── Student Fee Records ────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".student_fee_records (
        id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id        UUID        REFERENCES "${schema}".students(id),
        fee_structure_id  UUID        REFERENCES "${schema}".fees_structure(id),
        amount_paid       NUMERIC(10,2),
        payment_date      DATE,
        payment_mode      VARCHAR(50),
        receipt_no        VARCHAR(100) UNIQUE,
        created_at        TIMESTAMPTZ  DEFAULT NOW()
      )
    `);

    // ── Hostel Blocks ──────────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".hostel_blocks (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(100) NOT NULL,
        type        VARCHAR(20),
        warden_id   UUID        REFERENCES "${schema}".users(id),
        total_rooms INT
      )
    `);

    // ── Hostel Rooms ───────────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".hostel_rooms (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        block_id    UUID        REFERENCES "${schema}".hostel_blocks(id),
        room_number VARCHAR(20)  NOT NULL,
        capacity    INT          DEFAULT 2,
        occupied    INT          DEFAULT 0,
        room_type   VARCHAR(20)
      )
    `);

    // ── Hostel Allotments ──────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".hostel_allotments (
        id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id     UUID        UNIQUE REFERENCES "${schema}".students(id),
        room_id        UUID        REFERENCES "${schema}".hostel_rooms(id),
        allotted_from  DATE,
        allotted_until DATE,
        is_active      BOOLEAN      DEFAULT true
      )
    `);

    // ── Courses ────────────────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".courses (
        id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        code               VARCHAR(30) UNIQUE NOT NULL,
        name               VARCHAR(200) NOT NULL,
        degree_level       VARCHAR(50) DEFAULT 'UG',
        duration_years     INT         DEFAULT 5,
        professional_phase VARCHAR(100) DEFAULT '1st Professional (Phase I)',
        is_active          BOOLEAN     DEFAULT true,
        created_at         TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── Academic Sessions ──────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".academic_sessions (
        id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        code         VARCHAR(50),
        session_cd   VARCHAR(50),
        colg_cd      VARCHAR(50)  DEFAULT '1',
        name         VARCHAR(100) NOT NULL,
        start_date   DATE         NOT NULL,
        end_date     DATE         NOT NULL,
        is_current   BOOLEAN      DEFAULT false,
        is_active    BOOLEAN      DEFAULT true,
        created_at   TIMESTAMPTZ  DEFAULT NOW()
      );
      ALTER TABLE "${schema}".academic_sessions ADD COLUMN IF NOT EXISTS code VARCHAR(50);
      ALTER TABLE "${schema}".academic_sessions ADD COLUMN IF NOT EXISTS session_cd VARCHAR(50);
      ALTER TABLE "${schema}".academic_sessions ADD COLUMN IF NOT EXISTS colg_cd VARCHAR(50) DEFAULT '1';
    `);

    // ── Professional Linkers ───────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".professional_linkers (
        id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        code               VARCHAR(50) NOT NULL,
        name               VARCHAR(200) NOT NULL,
        course_cd          VARCHAR(50),
        professional_phase VARCHAR(100),
        academic_session   VARCHAR(100),
        description        TEXT,
        is_active          BOOLEAN     DEFAULT true,
        created_at         TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── Topic Master ───────────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".topics (
        id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        subject_id   UUID        REFERENCES "${schema}".subjects(id) ON DELETE CASCADE,
        linker_id    UUID        REFERENCES "${schema}".professional_linkers(id) ON DELETE SET NULL,
        code         VARCHAR(50) NOT NULL,
        name         VARCHAR(200) NOT NULL,
        description  TEXT,
        hours        INT         DEFAULT 1,
        is_active    BOOLEAN     DEFAULT true,
        created_at         TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── Competency Master ──────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".competencies (
        id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        subject_id   UUID        REFERENCES "${schema}".subjects(id) ON DELETE SET NULL,
        topic_id     UUID        REFERENCES "${schema}".topics(id) ON DELETE SET NULL,
        linker_id    UUID        REFERENCES "${schema}".professional_linkers(id) ON DELETE SET NULL,
        code         VARCHAR(50) NOT NULL,
        description  TEXT        NOT NULL,
        domain       VARCHAR(50) DEFAULT 'Knowledge',
        level        VARCHAR(50) DEFAULT 'Knows How',
        is_core      BOOLEAN     DEFAULT true,
        is_active    BOOLEAN     DEFAULT true,
        created_at         TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── Professional Phases ────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".professional_phases (
        id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        college_id       VARCHAR(50),
        course_cd        VARCHAR(50) DEFAULT 'MBBS',
        name             VARCHAR(200) NOT NULL,
        phase_order      INT         DEFAULT 1,
        academic_system  VARCHAR(50) DEFAULT 'professional',
        is_active        BOOLEAN     DEFAULT true,
        created_at       TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── Student Phase Progressions (Promotion History) ─────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".student_phase_progressions (
        id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id       UUID        REFERENCES "${schema}".students(id) ON DELETE CASCADE,
        batch_id         VARCHAR(50),
        from_phase_id    VARCHAR(50),
        from_phase_name  VARCHAR(200),
        to_phase_id      VARCHAR(50),
        to_phase_name    VARCHAR(200),
        academic_year    VARCHAR(50),
        is_active        BOOLEAN     DEFAULT true,
        promoted_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".lessons (
        id SERIAL PRIMARY KEY,
        colg_cd VARCHAR(20) NOT NULL,
        course_cd VARCHAR(20) NOT NULL,
        branch_cd VARCHAR(20) NOT NULL,
        batch_cd VARCHAR(20) NOT NULL,
        sem_cd VARCHAR(20) NOT NULL,
        subject_id VARCHAR(100),
        unit_id VARCHAR(100),
        topic_id VARCHAR(100),
        subtopic_id VARCHAR(100),
        empid VARCHAR(50) NOT NULL,
        faculty_name VARCHAR(150),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        file_size BIGINT NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_lessons_academic ON "${schema}".lessons(colg_cd, course_cd, branch_cd, batch_cd, sem_cd);
      CREATE INDEX IF NOT EXISTS idx_lessons_faculty ON "${schema}".lessons(empid);

      -- ── Placement Drives (Batch Import & Tracking) ───────────────────────────
      CREATE TABLE IF NOT EXISTS "${schema}".placement_drives (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title             VARCHAR(255) NOT NULL,
        imported_by       VARCHAR(100),
        source_file_name  VARCHAR(255),
        imported_at       TIMESTAMPTZ DEFAULT NOW(),
        status            VARCHAR(50) DEFAULT 'upcoming',
        created_at        TIMESTAMPTZ DEFAULT NOW(),
        updated_at        TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "${schema}".drive_companies (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        drive_id            UUID REFERENCES "${schema}".placement_drives(id) ON DELETE CASCADE,
        company_name        VARCHAR(255) NOT NULL,
        role                VARCHAR(255),
        package_min         NUMERIC(10,2),
        package_max         NUMERIC(10,2),
        package_ctc         VARCHAR(100),
        eligible_branches   TEXT[] DEFAULT '{}',
        eligible_batches    TEXT[] DEFAULT '{}',
        drive_date          DATE,
        deadline_date       DATE,
        logo_url            VARCHAR(500),
        description         TEXT,
        extra_fields        JSONB DEFAULT '{}'::jsonb,
        status              VARCHAR(50) DEFAULT 'active',
        created_at          TIMESTAMPTZ DEFAULT NOW(),
        updated_at          TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "${schema}".drive_applications (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        drive_company_id    UUID REFERENCES "${schema}".drive_companies(id) ON DELETE CASCADE,
        student_id          VARCHAR(100),
        student_reg_no      VARCHAR(100),
        student_name        VARCHAR(255),
        branch_cd           VARCHAR(100),
        batch_cd            VARCHAR(100),
        resume_link         VARCHAR(500),
        status              VARCHAR(50) DEFAULT 'applied',
        offer_package       NUMERIC(10,2),
        applied_at          TIMESTAMPTZ DEFAULT NOW(),
        updated_at          TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_drive_apps_company ON "${schema}".drive_applications(drive_company_id);
      CREATE INDEX IF NOT EXISTS idx_drive_apps_student ON "${schema}".drive_applications(student_reg_no);

      -- ── Internship Programs, Applications & Digital Certificates ────────────
      CREATE TABLE IF NOT EXISTS "${schema}".internship_programs (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title                 VARCHAR(255) NOT NULL,
        category              VARCHAR(50) NOT NULL,
        duration              VARCHAR(50) NOT NULL,
        fee_type              VARCHAR(20) NOT NULL DEFAULT 'FREE',
        fee_amount            NUMERIC(10,2) DEFAULT 0,
        description           TEXT,
        seats_available       INT DEFAULT 50,
        application_deadline  DATE,
        published_by          VARCHAR(100),
        status                VARCHAR(50) DEFAULT 'published',
        created_at            TIMESTAMPTZ DEFAULT NOW(),
        updated_at            TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "${schema}".internship_applications (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        program_id          UUID REFERENCES "${schema}".internship_programs(id) ON DELETE CASCADE,
        student_id          VARCHAR(100),
        student_reg_no      VARCHAR(100),
        student_name        VARCHAR(255),
        course_cd           VARCHAR(100),
        batch_cd            VARCHAR(100),
        applied_at          TIMESTAMPTZ DEFAULT NOW(),
        status              VARCHAR(50) DEFAULT 'applied',
        locked              BOOLEAN DEFAULT false,
        payment_status      VARCHAR(50) DEFAULT 'not_required',
        completed_at        TIMESTAMPTZ,
        remarks             TEXT,
        created_at          TIMESTAMPTZ DEFAULT NOW(),
        updated_at          TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "${schema}".certificates (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id      UUID UNIQUE REFERENCES "${schema}".internship_applications(id) ON DELETE CASCADE,
        certificate_no      VARCHAR(100) UNIQUE NOT NULL,
        internship_name     VARCHAR(255) NOT NULL,
        applicant_name      VARCHAR(255) NOT NULL,
        course              VARCHAR(100),
        batch               VARCHAR(100),
        issued_date         DATE DEFAULT CURRENT_DATE,
        approved_by         VARCHAR(255) DEFAULT 'Prof. (Dr.) Prabhakar Gupta',
        pdf_url             VARCHAR(500),
        created_at          TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    this.logger.log(`All tables created in schema: ${schema}`);
  }

  private async seedDefaultData(runner: QueryRunner, slug: string): Promise<void> {
    const resolvedSlug = this.resolveTenantSlug(slug);
    const schema = `tenant_${resolvedSlug}`;

    // Add missing timetable_slots columns if updating existing schemas
    await runner.query(`
      ALTER TABLE "${schema}".timetable_slots ADD COLUMN IF NOT EXISTS group_name VARCHAR(100);
      ALTER TABLE "${schema}".timetable_slots ADD COLUMN IF NOT EXISTS topic VARCHAR(255);
      ALTER TABLE "${schema}".timetable_slots ADD COLUMN IF NOT EXISTS competency_codes VARCHAR(255);
    `);

    // Seed default leave types
    try {
      await runner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS leave_types_code_uq_idx ON "${schema}".leave_types (code);
      `).catch(() => {});
      const existingLT = await runner.query(`SELECT id FROM "${schema}".leave_types LIMIT 1`).catch(() => []);
      if (existingLT.length === 0) {
        await runner.query(`
          INSERT INTO "${schema}".leave_types (code, name, max_days_per_year) VALUES
            ('CL',  'Casual Leave',          12),
            ('SL',  'Sick Leave',            10),
            ('EL',  'Earned Leave',          30),
            ('ML',  'Maternity Leave',       180),
            ('COL', 'Compensatory Off Leave', 0);
        `).catch(() => {});
      }
    } catch (e) {}

    // Seed default delivery types
    try {
      await runner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS delivery_types_code_uq_idx ON "${schema}".delivery_types (code);
      `).catch(() => {});
      const existingDT = await runner.query(`SELECT id FROM "${schema}".delivery_types LIMIT 1`).catch(() => []);
      if (existingDT.length === 0) {
        await runner.query(`
          INSERT INTO "${schema}".delivery_types (code, name) VALUES
            ('TH',  'Theory'),
            ('PR',  'Practical'),
            ('AE',  'AETCOM'),
            ('PD',  'Pandemic Module'),
            ('CP',  'Clinical Posting');
        `).catch(() => {});
      }
    } catch (e) {}

    // ── Seed Demo Records ONLY for baseline Demo Tenants (srms-cet-bareilly, srms-ims) ──
    const isDemoSeedTenant = resolvedSlug === 'srms-cet-bareilly' || resolvedSlug === 'srms-ims';
    if (!isDemoSeedTenant) {
      this.logger.log(`Tenant '${resolvedSlug}' initialized with clean schema (zero sample data).`);
      return;
    }

    const defaultPasswordHash = '$2b$12$eImiTXuWVxfM37uY4JANjO5e.eZ.W8h8W/2i.tE8v9jX.'; // Default password hash for 'Password@123' / 'admin@123' / '1234'

    // 1. College Admin (admin / admin@123)
    await runner.query(`
      INSERT INTO "${schema}".users (email, password_hash, role, onboarding_completed, must_change_password)
      VALUES ('admin@srms.edu', $1, 'COLLEGE_ADMIN', true, false)
      ON CONFLICT (email) DO NOTHING;
    `, [defaultPasswordHash]);

    // 2. Clerk (1234 / 1234)
    await runner.query(`
      INSERT INTO "${schema}".users (email, password_hash, role, onboarding_completed, must_change_password)
      VALUES ('clerk@srms.edu', $1, 'CLERK', true, false)
      ON CONFLICT (email) DO NOTHING;
    `, [defaultPasswordHash]);

    // 3. Warden (warden / warden123)
    await runner.query(`
      INSERT INTO "${schema}".users (email, password_hash, role, onboarding_completed, must_change_password)
      VALUES ('warden@srms.edu', $1, 'WARDEN', true, false)
      ON CONFLICT (email) DO NOTHING;
    `, [defaultPasswordHash]);

    const isMedicalTenant = ['srms-ims', 'unicamp-med', 'aiims-delhi', 'aiims-jodhpur', 'kmc-manipal', 'rajshreemri'].includes(resolvedSlug);

    if (isMedicalTenant) {
      // 4. Medical Faculty (Dr. Sanjay Singh & Dr. Aparna Tyagi)
      try {
        const facRes1 = await runner.query(`
          INSERT INTO "${schema}".users (email, password_hash, role, onboarding_completed, must_change_password)
          VALUES ('sanjay.singh@srms.edu', $1, 'FACULTY', true, false)
          ON CONFLICT (email) DO NOTHING
          RETURNING id;
        `, [defaultPasswordHash]);

        const facUserId1 = facRes1[0]?.id || (await runner.query(`SELECT id FROM "${schema}".users WHERE email='sanjay.singh@srms.edu'`))[0]?.id;
        if (facUserId1) {
          await runner.query(`
            INSERT INTO "${schema}".faculty (user_id, emp_id, name, designation, specialization, photo_url)
            VALUES ($1, 'EMP1001', 'Dr. Sanjay Singh', 'Professor & HOD', 'Physiology & Biophysics', '/avatars/dr_sanjay_singh.png')
            ON CONFLICT (emp_id) DO UPDATE SET name = EXCLUDED.name, designation = EXCLUDED.designation, specialization = EXCLUDED.specialization, photo_url = EXCLUDED.photo_url;
          `, [facUserId1]);
        }

        const facRes2 = await runner.query(`
          INSERT INTO "${schema}".users (email, password_hash, role, onboarding_completed, must_change_password)
          VALUES ('aparna.tyagi@srms.edu', $1, 'FACULTY', true, false)
          ON CONFLICT (email) DO NOTHING
          RETURNING id;
        `, [defaultPasswordHash]);

        const facUserId2 = facRes2[0]?.id || (await runner.query(`SELECT id FROM "${schema}".users WHERE email='aparna.tyagi@srms.edu'`))[0]?.id;
        if (facUserId2) {
          const existingFac2 = await runner.query(`SELECT id FROM "${schema}".faculty WHERE user_id = $1 OR emp_id = 'EMP1002'`, [facUserId2]);
          if (existingFac2.length === 0) {
            await runner.query(`
              INSERT INTO "${schema}".faculty (user_id, emp_id, name, designation, specialization, photo_url)
              VALUES ($1, 'EMP1002', 'Dr. Aparna Tyagi', 'Associate Professor', 'Human Anatomy & Histology', '/avatars/dr_sarah_sharma.png')
              ON CONFLICT (emp_id) DO UPDATE SET name = EXCLUDED.name, designation = EXCLUDED.designation, specialization = EXCLUDED.specialization, photo_url = EXCLUDED.photo_url;
            `, [facUserId2]);
          }
        }
      } catch (e) {}

      // 5. Medical Students (Rahul Verma & Kabir Rao Deshmukh)
      try {
        const studRes = await runner.query(`
          INSERT INTO "${schema}".users (email, password_hash, role, onboarding_completed, must_change_password)
          VALUES ('rahul.verma@srms.edu', $1, 'STUDENT', true, false)
          ON CONFLICT (email) DO NOTHING
          RETURNING id;
        `, [defaultPasswordHash]);

        const studUserId = studRes[0]?.id || (await runner.query(`SELECT id FROM "${schema}".users WHERE email='rahul.verma@srms.edu'`))[0]?.id;
        if (studUserId) {
          const existingStudent = await runner.query(`SELECT id FROM "${schema}".students WHERE user_id = $1 OR registration_no = '2023MBBS045' LIMIT 1`, [studUserId]);
          if (existingStudent.length === 0) {
            await runner.query(`
              INSERT INTO "${schema}".students (user_id, rollno, registration_no, name, batch_cd, course_cd)
              VALUES ($1, 'MBBS2023045', '2023MBBS045', 'Rahul Verma', '2023-MBBS', 'MBBS');
            `, [studUserId]);
          }
        }
      } catch (e) {}
    } else {
      // 4. Engineering Faculty (Dr. Prabhakar Gupta, Dr. Anuj Kumar, Er. Shailesh Saxena)
      try {
        // Clean up any rogue MBBS data if it exists in non-medical tenant schemas
        await runner.query(`
          DELETE FROM "${schema}".students WHERE course_cd = 'MBBS' OR registration_no IN ('2023MBBS045', '20260008') OR name IN ('Rahul Verma', 'Kabir Rao Deshmukh');
          DELETE FROM "${schema}".batches WHERE code ILIKE '%MBBS%' OR course_cd = 'MBBS';
          DELETE FROM "${schema}".professional_phases WHERE course_cd = 'MBBS';
          DELETE FROM "${schema}".notice_group_templates WHERE name ILIKE '%MBBS%';
        `).catch(() => {});

        const engFaculty = [
          { email: 'prabhakar.gupta@srms.ac.in', name: 'Dr. Prabhakar Gupta', emp_id: 'CET-FAC-001', designation: 'Professor & Dean Academics', dept: 'CSE', spec: 'Computer Networks & Distributed Systems', photo: '/avatars/dr_sanjay_singh.png', phone: '9876500001', gender: 'Male', exp: '18 Years Exp.', staff_type: 'Faculty' },
          { email: 'anuj.kumar@srms.ac.in', name: 'Dr. Anuj Kumar', emp_id: 'CET-FAC-002', designation: 'Professor & HOD', dept: 'CSE', spec: 'Artificial Intelligence & Machine Learning', photo: '/avatars/dr_sarah_sharma.png', phone: '9876500002', gender: 'Male', exp: '14 Years Exp.', staff_type: 'Faculty' },
          { email: 'sovan.mohanty@srms.ac.in', name: 'Dr. Sovan Mohanty', emp_id: 'CET-FAC-003', designation: 'Associate Professor', dept: 'ECE', spec: 'VLSI Design & Signal Processing', photo: '/avatars/dr_sanjay_singh.png', phone: '9876500003', gender: 'Male', exp: '10 Years Exp.', staff_type: 'Faculty' },
          { email: 'shailesh.saxena@srms.ac.in', name: 'Er. Shailesh Saxena', emp_id: 'CET-FAC-004', designation: 'Assistant Professor', dept: 'BCA', spec: 'Database Systems & Web Technologies', photo: '/avatars/dr_sarah_sharma.png', phone: '9876500004', gender: 'Male', exp: '8 Years Exp.', staff_type: 'Faculty' },
          { email: 'shorab.ahmad@srms.ac.in', name: 'Dr. Shorab Ahmad', emp_id: '202516224', designation: 'Assistant Professor', dept: 'BCA', spec: 'Web Technologies, Python & Database Systems', photo: '/avatars/dr_sanjay_singh.png', phone: '8630153458', gender: 'Male', exp: '6 Years Exp.', staff_type: 'Faculty' },
        ];

        for (const f of engFaculty) {
          let uRes = await runner.query(`SELECT id FROM "${schema}".users WHERE LOWER(email) = $1`, [f.email.toLowerCase()]);
          let uId = uRes[0]?.id;

          if (!uId) {
            const createRes = await runner.query(`
              INSERT INTO "${schema}".users (email, password_hash, role, onboarding_completed, must_change_password)
              VALUES ($1, $2, 'FACULTY', true, false)
              ON CONFLICT (email) DO NOTHING
              RETURNING id;
            `, [f.email.toLowerCase(), defaultPasswordHash]);
            uId = createRes[0]?.id || (await runner.query(`SELECT id FROM "${schema}".users WHERE LOWER(email) = $1`, [f.email.toLowerCase()]))[0]?.id;
          }

          const deptRes = await runner.query(`SELECT id FROM "${schema}".departments WHERE code = $1 LIMIT 1`, [f.dept]);
          const deptId = deptRes[0]?.id || null;

          if (uId) {
            await runner.query(`
              INSERT INTO "${schema}".faculty (user_id, emp_id, name, designation, specialization, department_id, photo_url, phone, gender, experience, staff_type)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
              ON CONFLICT (emp_id) DO UPDATE SET 
                name = EXCLUDED.name, 
                designation = EXCLUDED.designation, 
                specialization = EXCLUDED.specialization,
                department_id = EXCLUDED.department_id,
                photo_url = EXCLUDED.photo_url,
                phone = COALESCE(EXCLUDED.phone, "${schema}".faculty.phone),
                gender = COALESCE(EXCLUDED.gender, "${schema}".faculty.gender),
                experience = COALESCE(EXCLUDED.experience, "${schema}".faculty.experience),
                staff_type = COALESCE(EXCLUDED.staff_type, "${schema}".faculty.staff_type);
            `, [uId, f.emp_id, f.name, f.designation, f.spec, deptId, f.photo, f.phone || null, f.gender || 'Male', f.exp || null, f.staff_type || 'Faculty']);
          }
        }
      } catch (e) {}
    }

    // 7. Auto-link any remaining unlinked students in students table to users table for authentic login
    try {
      const unlinkedStudents = await runner.query(`
        SELECT id, registration_no FROM "${schema}".students WHERE user_id IS NULL AND registration_no IS NOT NULL
      `);

      for (const st of unlinkedStudents) {
        const studentEmail = `${st.registration_no.toLowerCase()}@srms.ac.in`;
        let uRes = await runner.query(`SELECT id FROM "${schema}".users WHERE LOWER(email) = $1 LIMIT 1`, [studentEmail.toLowerCase()]);
        let uId = uRes[0]?.id;

        if (!uId) {
          const createRes = await runner.query(`
            INSERT INTO "${schema}".users (email, password_hash, role, onboarding_completed, must_change_password)
            VALUES ($1, $2, 'STUDENT', true, false)
            ON CONFLICT (email) DO NOTHING
            RETURNING id;
          `, [studentEmail.toLowerCase(), defaultPasswordHash]);
          uId = createRes[0]?.id;
        }

        if (uId) {
          await runner.query(`UPDATE "${schema}".students SET user_id = $1 WHERE id = $2 AND user_id IS NULL`, [uId, st.id]).catch(() => {});
        }
      }
    } catch (e) {}

    // 8. Auto-link any remaining unlinked faculty in faculty table to users table for authentic login
    try {
      const unlinkedFaculty = await runner.query(`
        SELECT id, emp_id, name FROM "${schema}".faculty WHERE user_id IS NULL AND emp_id IS NOT NULL
      `);

      for (const f of unlinkedFaculty) {
        const cleanEmp = f.emp_id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const facultyEmail = `${cleanEmp}@srms.edu`;
        let uRes = await runner.query(`SELECT id FROM "${schema}".users WHERE LOWER(email) = $1 LIMIT 1`, [facultyEmail]);
        let uId = uRes[0]?.id;

        if (!uId) {
          const createRes = await runner.query(`
            INSERT INTO "${schema}".users (email, password_hash, role, onboarding_completed, must_change_password)
            VALUES ($1, $2, 'FACULTY', true, false)
            ON CONFLICT (email) DO NOTHING
            RETURNING id;
          `, [facultyEmail, defaultPasswordHash]);
          uId = createRes[0]?.id;
        }

        if (uId) {
          await runner.query(`UPDATE "${schema}".faculty SET user_id = $1 WHERE id = $2 AND user_id IS NULL`, [uId, f.id]).catch(() => {});
        }
      }
    } catch (e) {}

    // 9. Seed authentic timetable slots & competencies / subtopics depending on college type
    try {
      const isMedical = resolvedSlug.includes('ims') || resolvedSlug.includes('iahs') || resolvedSlug.includes('nursing');

      if (isMedical) {
        // Medical Courses
        await runner.query(`
          INSERT INTO "${schema}".courses (code, name, type, duration_years, is_active)
          SELECT * FROM (VALUES
            ('MBBS', 'Bachelor of Medicine and Bachelor of Surgery', 'MEDICAL', 5, true),
            ('BAMS', 'Bachelor of Ayurvedic Medicine and Surgery', 'AYUSH', 5, true),
            ('MD-MED', 'Doctor of Medicine (General Medicine)', 'POSTGRADUATE', 3, true),
            ('MS-SUR', 'Master of Surgery (General Surgery)', 'POSTGRADUATE', 3, true)
          ) AS v(code, name, type, duration_years, is_active)
          WHERE NOT EXISTS (
            SELECT 1 FROM "${schema}".courses c WHERE c.code = v.code
          );
        `).catch(() => {});

        // Medical Departments
        await runner.query(`
          INSERT INTO "${schema}".departments (name, code, type, is_active)
          SELECT * FROM (VALUES
            ('Department of Anatomy', 'ANA', 'PRE_CLINICAL', true),
            ('Department of Physiology', 'PHY', 'PRE_CLINICAL', true),
            ('Department of Biochemistry', 'BIO', 'PRE_CLINICAL', true),
            ('Department of Pathology', 'PAT', 'PARA_CLINICAL', true),
            ('Department of Pharmacology', 'PHA', 'PARA_CLINICAL', true),
            ('Department of Microbiology', 'MIC', 'PARA_CLINICAL', true),
            ('Department of Forensic Medicine & Toxicology', 'FMT', 'PARA_CLINICAL', true),
            ('Department of Community Medicine', 'COM', 'CLINICAL', true),
            ('Department of General Medicine', 'MED', 'CLINICAL', true),
            ('Department of General Surgery', 'SUR', 'CLINICAL', true),
            ('Department of Rachana Sharir (Anatomy)', 'RAC', 'AYUSH', true),
            ('Department of Kriya Sharir (Physiology)', 'KRI', 'AYUSH', true),
            ('Department of Dravyaguna Vigyan (Pharmacology)', 'DRA', 'AYUSH', true),
            ('Department of Samhita & Siddhant', 'SAM', 'AYUSH', true)
          ) AS v(name, code, type, is_active)
          WHERE NOT EXISTS (
            SELECT 1 FROM "${schema}".departments d WHERE d.code = v.code
          );
        `).catch(() => {});

        // Professional Phases (Medical & BAMS)
        await runner.query(`
          INSERT INTO "${schema}".professional_phases (name, course_cd, phase_order, academic_system, is_active)
          SELECT * FROM (VALUES
            ('1st Professional MBBS', 'MBBS', 1, 'professional', true),
            ('2nd Professional MBBS', 'MBBS', 2, 'professional', true),
            ('3rd Professional MBBS (Part I)', 'MBBS', 3, 'professional', true),
            ('3rd Professional MBBS (Part II)', 'MBBS', 4, 'professional', true),
            ('1st Professional BAMS', 'BAMS', 1, 'professional', true),
            ('2nd Professional BAMS', 'BAMS', 2, 'professional', true),
            ('3rd Professional BAMS', 'BAMS', 3, 'professional', true),
            ('Final Professional BAMS', 'BAMS', 4, 'professional', true)
          ) AS v(name, course_cd, phase_order, academic_system, is_active)
          WHERE NOT EXISTS (
            SELECT 1 FROM "${schema}".professional_phases p WHERE p.name = v.name AND p.course_cd = v.course_cd
          );
        `).catch(() => {});

        // Medical Subjects
        await runner.query(`
          INSERT INTO "${schema}".subjects (name, code, credits, type, is_active)
          SELECT * FROM (VALUES
            ('Human Anatomy & Histology', 'ANA101', 4, 'THEORY', true),
            ('Human Physiology & Organ Systems', 'PHY101', 4, 'THEORY', true),
            ('Medical Biochemistry & Molecular Biology', 'BIO101', 4, 'THEORY', true),
            ('General & Systemic Pathology', 'PAT201', 4, 'THEORY', true),
            ('Medical Pharmacology & Therapeutics', 'PHA201', 4, 'THEORY', true),
            ('Medical Microbiology & Immunology', 'MIC201', 4, 'THEORY', true),
            ('Rachana Sharir (Ayurvedic Anatomy)', 'RAC101', 4, 'THEORY', true),
            ('Kriya Sharir (Ayurvedic Physiology)', 'KRI101', 4, 'THEORY', true)
          ) AS v(name, code, credits, type, is_active)
          WHERE NOT EXISTS (
            SELECT 1 FROM "${schema}".subjects s WHERE s.code = v.code
          );
        `).catch(() => {});

        // Link subjects to departments
        await runner.query(`
          UPDATE "${schema}".subjects SET department_id = (SELECT id FROM "${schema}".departments WHERE code='ANA' LIMIT 1) WHERE code='ANA101' AND department_id IS NULL;
          UPDATE "${schema}".subjects SET department_id = (SELECT id FROM "${schema}".departments WHERE code='PHY' LIMIT 1) WHERE code='PHY101' AND department_id IS NULL;
          UPDATE "${schema}".subjects SET department_id = (SELECT id FROM "${schema}".departments WHERE code='BIO' LIMIT 1) WHERE code='BIO101' AND department_id IS NULL;
          UPDATE "${schema}".subjects SET department_id = (SELECT id FROM "${schema}".departments WHERE code='PAT' LIMIT 1) WHERE code='PAT201' AND department_id IS NULL;
          UPDATE "${schema}".subjects SET department_id = (SELECT id FROM "${schema}".departments WHERE code='PHA' LIMIT 1) WHERE code='PHA201' AND department_id IS NULL;
          UPDATE "${schema}".subjects SET department_id = (SELECT id FROM "${schema}".departments WHERE code='MIC' LIMIT 1) WHERE code='MIC201' AND department_id IS NULL;
          UPDATE "${schema}".subjects SET department_id = (SELECT id FROM "${schema}".departments WHERE code='RAC' LIMIT 1) WHERE code='RAC101' AND department_id IS NULL;
          UPDATE "${schema}".subjects SET department_id = (SELECT id FROM "${schema}".departments WHERE code='KRI' LIMIT 1) WHERE code='KRI101' AND department_id IS NULL;
        `).catch(() => {});

        // Seed Units for Anatomy and Physiology
        const anaSubId = (await runner.query(`SELECT id FROM "${schema}".subjects WHERE code='ANA101'`))[0]?.id;
        const phySubId = (await runner.query(`SELECT id FROM "${schema}".subjects WHERE code='PHY101'`))[0]?.id;

        if (anaSubId) {
          await runner.query(`
            INSERT INTO "${schema}".units (subject_id, unit_number, name, description)
            SELECT $1, v.unit_number, v.name, v.description FROM (VALUES
              (1, 'General Anatomy & Musculoskeletal System', 'Basic anatomy principles, bones, joints and muscles'),
              (2, 'Upper Limb Anatomy & Neurovasculature', 'Pectoral region, axilla, arm, forearm, hand and nerve plexuses'),
              (3, 'Thorax & Cardiovascular Anatomy', 'Thoracic wall, mediastinum, heart and lungs'),
              (4, 'Head, Neck & Neuroanatomy', 'Cranial cavity, brain, spinal cord and autonomic nervous system')
            ) AS v(unit_number, name, description)
            WHERE NOT EXISTS (
              SELECT 1 FROM "${schema}".units u WHERE u.subject_id = $1 AND u.unit_number = v.unit_number
            );
          `, [anaSubId]).catch(() => {});
        }

        if (phySubId) {
          await runner.query(`
            INSERT INTO "${schema}".units (subject_id, unit_number, name, description)
            SELECT $1, v.unit_number, v.name, v.description FROM (VALUES
              (1, 'General Physiology & Cellular Transport', 'Cell membrane dynamics, resting membrane potential and action potential'),
              (2, 'Nerve-Muscle Physiology & Reflexes', 'Neuromuscular transmission, muscle contraction mechanisms and reflexes'),
              (3, 'Cardiovascular System Physiology', 'Cardiac cycle, blood pressure regulation, cardiac output and ECG'),
              (4, 'Respiratory & Renal Physiology', 'Pulmonary mechanics, gas exchange, GFR and countercurrent mechanisms')
            ) AS v(unit_number, name, description)
            WHERE NOT EXISTS (
              SELECT 1 FROM "${schema}".units u WHERE u.subject_id = $1 AND u.unit_number = v.unit_number
            );
          `, [phySubId]).catch(() => {});
        }

        // Seed Topics
        const anaUnit2 = (await runner.query(`SELECT id FROM "${schema}".units WHERE subject_id = $1 AND unit_number = 2`, [anaSubId]))[0]?.id;
        const phyUnit2 = (await runner.query(`SELECT id FROM "${schema}".units WHERE subject_id = $1 AND unit_number = 2`, [phySubId]))[0]?.id;
        const phyUnit3 = (await runner.query(`SELECT id FROM "${schema}".units WHERE subject_id = $1 AND unit_number = 3`, [phySubId]))[0]?.id;

        if (anaUnit2 && anaSubId) {
          await runner.query(`
            INSERT INTO "${schema}".topics (subject_id, unit_id, code, name, description, hours)
            SELECT $1, $2, v.code, v.name, v.description, v.hours FROM (VALUES
              ('TOP-AN-01', 'Brachial Plexus & Axillary Region', 'Formation of brachial plexus, relations and cords', 2),
              ('TOP-AN-02', 'Scapular Region & Rotator Cuff', 'Supraspinatus, Infraspinatus, Teres Minor, Subscapularis', 2),
              ('TOP-AN-03', 'Osteology of Clavicle, Scapula and Humerus', 'Bony landmarks and muscle attachments', 2)
            ) AS v(code, name, description, hours)
            WHERE NOT EXISTS (
              SELECT 1 FROM "${schema}".topics t WHERE t.subject_id = $1 AND t.code = v.code
            );
          `, [anaSubId, anaUnit2]).catch(() => {});
        }

        if (phyUnit2 && phySubId) {
          await runner.query(`
            INSERT INTO "${schema}".topics (subject_id, unit_id, code, name, description, hours)
            SELECT $1, $2, v.code, v.name, v.description, v.hours FROM (VALUES
              ('TOP-PY-01', 'Neuromuscular Junction & Synaptic Transmission', 'Acetylcholine release, end-plate potential, NMJ blockers', 2),
              ('TOP-PY-02', 'Excitation-Contraction Coupling in Skeletal Muscle', 'Sarcoplasmic reticulum, calcium release, cross-bridge cycle', 2),
              ('TOP-PY-03', 'Spirometry & Mechanics of Pulmonary Ventilation', 'Lung volumes, capacities and spirometric evaluation', 3)
            ) AS v(code, name, description, hours)
            WHERE NOT EXISTS (
              SELECT 1 FROM "${schema}".topics t WHERE t.subject_id = $1 AND t.code = v.code
            );
          `, [phySubId, phyUnit2]).catch(() => {});
        }

        if (phyUnit3 && phySubId) {
          await runner.query(`
            INSERT INTO "${schema}".topics (subject_id, unit_id, code, name, description, hours)
            SELECT $1, $2, v.code, v.name, v.description, v.hours FROM (VALUES
              ('TOP-PY-04', 'Cardiac Action Potential & Conduction System', 'SA node pacemaker potential, AV node delay, Purkinje fibers', 2),
              ('TOP-PY-05', 'Electrocardiogram (ECG) Waves & Clinical Interpretation', 'P-QRS-T complex, vector analysis, arrhythmias', 3)
            ) AS v(code, name, description, hours)
            WHERE NOT EXISTS (
              SELECT 1 FROM "${schema}".topics t WHERE t.subject_id = $1 AND t.code = v.code
            );
          `, [phySubId, phyUnit3]).catch(() => {});
        }

        // Competencies
        await runner.query(`
          CREATE UNIQUE INDEX IF NOT EXISTS competencies_code_uidx ON "${schema}".competencies (code);
        `).catch(() => {});

        const topAn01 = (await runner.query(`SELECT id FROM "${schema}".topics WHERE code='TOP-AN-01'`))[0]?.id;
        const topAn02 = (await runner.query(`SELECT id FROM "${schema}".topics WHERE code='TOP-AN-02'`))[0]?.id;
        const topAn03 = (await runner.query(`SELECT id FROM "${schema}".topics WHERE code='TOP-AN-03'`))[0]?.id;
        const topPy01 = (await runner.query(`SELECT id FROM "${schema}".topics WHERE code='TOP-PY-01'`))[0]?.id;
        const topPy02 = (await runner.query(`SELECT id FROM "${schema}".topics WHERE code='TOP-PY-02'`))[0]?.id;
        const topPy03 = (await runner.query(`SELECT id FROM "${schema}".topics WHERE code='TOP-PY-03'`))[0]?.id;
        const topPy04 = (await runner.query(`SELECT id FROM "${schema}".topics WHERE code='TOP-PY-04'`))[0]?.id;

        await runner.query(`
          INSERT INTO "${schema}".competencies (subject_id, topic_id, code, description, domain, level, is_core, is_active) VALUES
            ('${anaSubId}', '${topAn03 || null}', 'AN1.1', 'Describe osteology of upper limb, clavicle, scapula and humerus attachments', 'KNOWLEDGE', 'KNOWS', true, true),
            ('${anaSubId}', '${topAn01 || null}', 'AN2.3', 'Describe brachial plexus formation, branches and clinical nerve injury syndromes', 'KNOWLEDGE', 'KNOWS_HOW', true, true),
            ('${anaSubId}', '${topAn02 || null}', 'AN10.1', 'Describe scapular region muscles, rotator cuff and shoulder abduction', 'KNOWLEDGE', 'KNOWS', true, true),
            ('${phySubId}', '${topPy02 || null}', 'PY2.1', 'Describe excitation-contraction coupling in skeletal muscle and neuromuscular junction transmission', 'KNOWLEDGE', 'KNOWS_HOW', true, true),
            ('${phySubId}', '${topPy03 || null}', 'PY2.5', 'Perform and interpret spirometry and pulmonary function tests in normal subjects', 'SKILL', 'PERFORMS', true, true),
            ('${phySubId}', '${topPy04 || null}', 'PY3.1', 'Describe cardiac action potential, conduction system of heart and normal ECG waves', 'KNOWLEDGE', 'KNOWS_HOW', true, true),
            ('${phySubId}', '${topPy01 || null}', 'PY5.1', 'Describe synaptic transmission, neurotransmitters and receptor mechanisms', 'KNOWLEDGE', 'KNOWS_HOW', true, true)
          ON CONFLICT (code) DO UPDATE SET 
            description = EXCLUDED.description,
            subject_id = COALESCE(EXCLUDED.subject_id, "${schema}".competencies.subject_id),
            topic_id = COALESCE(EXCLUDED.topic_id, "${schema}".competencies.topic_id);
        `).catch(() => {});

        const phyDept = (await runner.query(`SELECT id FROM "${schema}".departments WHERE code='PHY'`))[0]?.id;
        const anaDept = (await runner.query(`SELECT id FROM "${schema}".departments WHERE code='ANA'`))[0]?.id;
        const sarahFacId = (await runner.query(`SELECT id FROM "${schema}".faculty WHERE emp_id='EMP1001' OR name LIKE '%Sarah%' LIMIT 1`))[0]?.id;
        const aparnaFacId = (await runner.query(`SELECT id FROM "${schema}".faculty WHERE emp_id='EMP1002' OR name LIKE '%Aparna%' LIMIT 1`))[0]?.id;
        const mbbsBatch = (await runner.query(`SELECT id FROM "${schema}".batches WHERE code='2023-MBBS' OR code='2025' OR course_cd='MBBS' LIMIT 1`))[0]?.id;

        // Ensure faculty department IDs are linked properly
        if (sarahFacId && phyDept) {
          await runner.query(`UPDATE "${schema}".faculty SET department_id = $1 WHERE id = $2`, [phyDept, sarahFacId]).catch(() => {});
        }
        if (aparnaFacId && anaDept) {
          await runner.query(`UPDATE "${schema}".faculty SET department_id = $1 WHERE id = $2`, [anaDept, aparnaFacId]).catch(() => {});
        }

        // Purge unregistered or non-Anatomy/Physiology dummy slots
        await runner.query(`
          DELETE FROM "${schema}".timetable_slots 
          WHERE subject_id NOT IN ($1, $2) OR faculty_id NOT IN ($3, $4) OR faculty_id IS NULL;
        `, [phySubId, anaSubId, sarahFacId || '00000000-0000-0000-0000-000000000000', aparnaFacId || '00000000-0000-0000-0000-000000000000']).catch(() => {});

        const countRes = await runner.query(`SELECT COUNT(*) as count FROM "${schema}".timetable_slots`);
        if (parseInt(countRes[0]?.count || '0', 10) === 0 && mbbsBatch && phySubId && anaSubId && sarahFacId && aparnaFacId) {
          await runner.query(`
            INSERT INTO "${schema}".timetable_slots
              (department_id, subject_id, batch_id, faculty_id, day_of_week, start_time, end_time, room, slot_type, topic, competency_codes)
            VALUES
              ($1, $2, $5, $3, 1, '09:00:00'::TIME, '10:00:00'::TIME, 'Lecture Hall 1', 'LECTURE', 'Excitation-Contraction Coupling in Muscle', 'PY2.1'),
              ($1, $2, $5, $3, 1, '14:00:00'::TIME, '16:00:00'::TIME, 'Physiology Lab A', 'PRACTICAL', 'Spirometry & Pulmonary Function Tests', 'PY2.5'),
              ($6, $7, $5, $4, 1, '10:00:00'::TIME, '11:00:00'::TIME, 'Dissection Hall 2', 'LECTURE', 'Upper Limb Osteology & Scapula Attachments', 'AN1.1'),

              ($6, $7, $5, $4, 2, '09:00:00'::TIME, '10:00:00'::TIME, 'Dissection Hall 1', 'LECTURE', 'Brachial Plexus Anatomy & Nerve Lesions', 'AN2.3'),
              ($1, $2, $5, $3, 2, '10:00:00'::TIME, '11:00:00'::TIME, 'Lecture Hall 1', 'LECTURE', 'Cardiac Action Potential & ECG Waves', 'PY3.1'),

              ($1, $2, $5, $3, 3, '10:00:00'::TIME, '11:00:00'::TIME, 'Lecture Hall 1', 'LECTURE', 'Renal Clearance & Glomerular Filtration', 'PY4.2'),
              ($6, $7, $5, $4, 4, '10:00:00'::TIME, '11:00:00'::TIME, 'Dissection Hall 1', 'LECTURE', 'Scapular Region & Shoulder Abduction', 'AN10.1'),
              ($1, $2, $5, $3, 5, '10:00:00'::TIME, '12:00:00'::TIME, 'Physiology Lab B', 'PRACTICAL', 'Synaptic Transmission & Neurotransmitters', 'PY5.1');
          `, [
            phyDept, phySubId, sarahFacId, aparnaFacId, mbbsBatch,
            anaDept, anaSubId
          ]);
        }
      } else {
        // Engineering / Management schemas (SRMS CET, CETR, IBS, Law, etc.)
        await runner.query(`CREATE UNIQUE INDEX IF NOT EXISTS subjects_code_uq_idx ON "${schema}".subjects (code);`).catch(() => {});
        await runner.query(`CREATE UNIQUE INDEX IF NOT EXISTS units_code_uq_idx ON "${schema}".units (code);`).catch(() => {});
        await runner.query(`CREATE UNIQUE INDEX IF NOT EXISTS topics_code_uq_idx ON "${schema}".topics (code);`).catch(() => {});
        await runner.query(`CREATE UNIQUE INDEX IF NOT EXISTS competencies_code_uq_idx ON "${schema}".competencies (code);`).catch(() => {});

        // Purge any accidental medical Anatomy/Physiology records from engineering schemas
        await runner.query(`
          DELETE FROM "${schema}".competencies 
          WHERE code LIKE 'AN%' OR code LIKE 'PY1%' OR code LIKE 'PY2%' OR code LIKE 'PY3%' OR code LIKE 'PY4%' OR code LIKE 'PY5%'
             OR description ILIKE '%osteology%' OR description ILIKE '%brachial%' OR description ILIKE '%scapular%';
        `).catch(() => {});

        await runner.query(`
          DELETE FROM "${schema}".subjects 
          WHERE code IN ('ANA101', 'PHY101') OR name ILIKE '%Human Anatomy%' OR name ILIKE '%Human Physiology%';
        `).catch(() => {});
      }
    } catch (e) {
      this.logger.error('Error seeding default timetable_slots/academic structures:', e);
    }

    this.logger.log(`Default data seeded for schema: ${schema}`);
  }
}


