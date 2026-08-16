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
    const s = slug ? slug.toLowerCase() : 'srms-ims';
    return (s === 'srms' || s === 'srms-ims') ? 'srms-ims' : s;
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
    this.logger.log('Checking and upgrading tenant schemas if necessary...');
    try {
      const tenants = await this.dataSource.query(`SELECT slug FROM public.tenants WHERE schema_provisioned = true OR slug = 'srms-ims'`);
      for (const tenant of tenants) {
        await this.ensureLatestSchema(tenant.slug).catch((e) => {
          this.logger.warn(`Schema upgrade skipped for ${tenant.slug}: ${e.message}`);
        });
      }
      this.logger.log('All provisioned tenant schemas successfully verified/upgraded.');
    } catch (err) {
      this.logger.error('Failed to run schema validation/upgrades on startup:', err);
    }
  }

  async ensureLatestSchema(slug: string): Promise<void> {
    const resolvedSlug = this.resolveTenantSlug(slug);
    const schema = `tenant_${resolvedSlug}`;
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    try {
      await runner.query(`SET search_path TO "${schema}", public`);
      
      // Alter students table
      await runner.query(`ALTER TABLE "${schema}".students ALTER COLUMN rollno DROP NOT NULL;`);
      await runner.query(`ALTER TABLE "${schema}".students ADD COLUMN IF NOT EXISTS registration_no VARCHAR(50) UNIQUE;`);
      
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
          name         VARCHAR(100) NOT NULL,
          start_date   DATE         NOT NULL,
          end_date     DATE         NOT NULL,
          is_current   BOOLEAN      DEFAULT false,
          is_active    BOOLEAN      DEFAULT true,
          created_at   TIMESTAMPTZ  DEFAULT NOW()
        );
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

      // Alter attendance_sessions table to add offering_id column
      await runner.query(`
        ALTER TABLE "${schema}".attendance_sessions 
        ADD COLUMN IF NOT EXISTS offering_id UUID REFERENCES "${schema}".subject_offerings(id) ON DELETE CASCADE;
      `);

      // Alter subjects table to add is_longitudinal column
      await runner.query(`
        ALTER TABLE "${schema}".subjects 
        ADD COLUMN IF NOT EXISTS is_longitudinal BOOLEAN DEFAULT false;
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
        password_hash       VARCHAR(200) NOT NULL,
        role                VARCHAR(50)  NOT NULL,
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
        code        VARCHAR(20)  UNIQUE NOT NULL,
        type        VARCHAR(50)  DEFAULT 'ACADEMIC',
        hod_user_id UUID        REFERENCES "${schema}".users(id),
        is_active   BOOLEAN      DEFAULT true,
        created_at  TIMESTAMPTZ  DEFAULT NOW()
      )
    `);

    // ── Faculty ────────────────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".faculty (
        id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID        UNIQUE REFERENCES "${schema}".users(id) ON DELETE CASCADE,
        emp_id          VARCHAR(50)  UNIQUE NOT NULL,
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
        offering_id   UUID        REFERENCES "${schema}".subject_offerings(id) ON DELETE CASCADE,
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
        name         VARCHAR(100) NOT NULL,
        start_date   DATE         NOT NULL,
        end_date     DATE         NOT NULL,
        is_current   BOOLEAN      DEFAULT false,
        is_active    BOOLEAN      DEFAULT true,
        created_at   TIMESTAMPTZ  DEFAULT NOW()
      )
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

    // ── Seed Default Authentic Users (Admin, Clerk, Faculty, Student, Warden) ──
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

    // 4. Faculty (Dr. Sarah Sharma & Dr. Aparna Tyagi)
    try {
      // 4a. Dr. Sanjay Singh (Physiology)
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

      // 4b. Dr. Aparna Tyagi (Anatomy)
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

      // 4c. Dr. Sanjay Singh (Physiology)
      const facRes3 = await runner.query(`
        INSERT INTO "${schema}".users (email, password_hash, role, onboarding_completed, must_change_password)
        VALUES ('sanjay.singh@srms.edu', $1, 'FACULTY', true, false)
        ON CONFLICT (email) DO NOTHING
        RETURNING id;
      `, [defaultPasswordHash]);

      const facUserId3 = facRes3[0]?.id || (await runner.query(`SELECT id FROM "${schema}".users WHERE email='sanjay.singh@srms.edu'`))[0]?.id;
      if (facUserId3) {
        const existingFac3 = await runner.query(`SELECT id FROM "${schema}".faculty WHERE user_id = $1 OR emp_id = 'DR/07/026'`, [facUserId3]);
        if (existingFac3.length === 0) {
          await runner.query(`
            INSERT INTO "${schema}".faculty (user_id, emp_id, name, designation, specialization, photo_url)
            VALUES ($1, 'DR/07/026', 'Dr. Sanjay Singh', 'Assistant Professor', 'Human Physiology', '/avatars/dr_sanjay_singh.png')
            ON CONFLICT (emp_id) DO UPDATE SET name = EXCLUDED.name, designation = EXCLUDED.designation, specialization = EXCLUDED.specialization, photo_url = EXCLUDED.photo_url;
          `, [facUserId3]);
        }
      }
    } catch (e) {}

    // 5. Student (2023MBBS045 - Rahul Verma)
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

    // 6. Student (20260008 - Kabir Rao Deshmukh)
    try {
      const kabirRes = await runner.query(`
        INSERT INTO "${schema}".users (email, password_hash, role, onboarding_completed, must_change_password)
        VALUES ('kabir.deshmukh2025@srms.ac.in', $1, 'STUDENT', true, false)
        ON CONFLICT (email) DO NOTHING
        RETURNING id;
      `, [defaultPasswordHash]);

      const kabirUserId = kabirRes[0]?.id || (await runner.query(`SELECT id FROM "${schema}".users WHERE email='kabir.deshmukh2025@srms.ac.in' OR email='20260008@srms.ac.in'`))[0]?.id;
      if (kabirUserId) {
        const existingKabir = await runner.query(`SELECT id FROM "${schema}".students WHERE user_id = $1 OR registration_no = '20260008' LIMIT 1`, [kabirUserId]);
        if (existingKabir.length === 0) {
          await runner.query(`
            INSERT INTO "${schema}".students (user_id, rollno, registration_no, name, batch_cd, course_cd)
            VALUES ($1, '20260008', '20260008', 'Kabir Rao Deshmukh', '2025-MBBS', 'MBBS');
          `, [kabirUserId]);
        }
      }
    } catch (e) {}

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

    // 9. Seed authentic timetable slots & competencies for Physiology & Anatomy default departments
    try {
      await runner.query(`
        INSERT INTO "${schema}".departments (name, code, type, is_active)
        SELECT * FROM (VALUES
          ('Department of Physiology', 'PHY', 'PRE_CLINICAL', true),
          ('Department of Anatomy', 'ANA', 'PRE_CLINICAL', true)
        ) AS v(name, code, type, is_active)
        WHERE NOT EXISTS (
          SELECT 1 FROM "${schema}".departments d WHERE d.code = v.code
        );
      `).catch(() => {});

      await runner.query(`
        INSERT INTO "${schema}".subjects (name, code, credits, type, is_active)
        SELECT * FROM (VALUES
          ('Human Physiology & Organ Systems', 'PHY101', 4, 'THEORY', true),
          ('Human Anatomy & Histology', 'ANA101', 4, 'THEORY', true)
        ) AS v(name, code, credits, type, is_active)
        WHERE NOT EXISTS (
          SELECT 1 FROM "${schema}".subjects s WHERE s.code = v.code
        );
      `).catch(() => {});

      await runner.query(`
        INSERT INTO "${schema}".batches (code, year, course_cd, is_active)
        SELECT * FROM (VALUES
          ('2023-MBBS', 2023, 'MBBS', true),
          ('2025', 2025, 'MBBS', true)
        ) AS v(code, year, course_cd, is_active)
        WHERE NOT EXISTS (
          SELECT 1 FROM "${schema}".batches b WHERE b.code = v.code
        );
      `).catch(() => {});

      await runner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS competencies_code_uidx ON "${schema}".competencies (code);
      `).catch(() => {});

      await runner.query(`
        INSERT INTO "${schema}".competencies (code, description, domain, level, is_core, is_active) VALUES
          ('PY2.1', 'Describe excitation-contraction coupling in skeletal muscle and neuromuscular junction transmission', 'KNOWLEDGE', 'KNOWS_HOW', true, true),
          ('PY2.5', 'Perform and interpret spirometry and pulmonary function tests in normal subjects', 'SKILL', 'PERFORMS', true, true),
          ('PY3.1', 'Describe cardiac action potential, conduction system of heart and normal ECG waves', 'KNOWLEDGE', 'KNOWS_HOW', true, true),
          ('PY4.2', 'Describe renal clearance and glomerular filtration rate measurement', 'KNOWLEDGE', 'KNOWS_HOW', true, true),
          ('PY5.1', 'Describe synaptic transmission, neurotransmitters and receptor mechanisms', 'KNOWLEDGE', 'KNOWS_HOW', true, true),
          ('AN1.1', 'Describe osteology of upper limb, clavicle, scapula and humerus attachments', 'KNOWLEDGE', 'KNOWS', true, true),
          ('AN2.3', 'Describe brachial plexus formation, branches and clinical nerve injury syndromes', 'KNOWLEDGE', 'KNOWS_HOW', true, true),
          ('AN10.1', 'Describe scapular region muscles, rotator cuff and shoulder abduction', 'KNOWLEDGE', 'KNOWS', true, true)
        ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description;
      `).catch(() => {});

      const phyDept = (await runner.query(`SELECT id FROM "${schema}".departments WHERE code='PHY'`))[0]?.id;
      const anaDept = (await runner.query(`SELECT id FROM "${schema}".departments WHERE code='ANA'`))[0]?.id;

      const phySub = (await runner.query(`SELECT id FROM "${schema}".subjects WHERE code='PHY101'`))[0]?.id;
      const anaSub = (await runner.query(`SELECT id FROM "${schema}".subjects WHERE code='ANA101'`))[0]?.id;

      const mbbsBatch = (await runner.query(`SELECT id FROM "${schema}".batches WHERE code='2023-MBBS' OR code='2025' LIMIT 1`))[0]?.id;
      
      const sarahFacId = (await runner.query(`SELECT id FROM "${schema}".faculty WHERE emp_id='EMP1001' OR name LIKE '%Sarah%' LIMIT 1`))[0]?.id;
      const aparnaFacId = (await runner.query(`SELECT id FROM "${schema}".faculty WHERE emp_id='EMP1002' OR name LIKE '%Aparna%' LIMIT 1`))[0]?.id;

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
      `, [phySub, anaSub, sarahFacId || '00000000-0000-0000-0000-000000000000', aparnaFacId || '00000000-0000-0000-0000-000000000000']).catch(() => {});

      const countRes = await runner.query(`SELECT COUNT(*) as count FROM "${schema}".timetable_slots`);
      if (parseInt(countRes[0]?.count || '0', 10) === 0 && mbbsBatch && phySub && anaSub && sarahFacId && aparnaFacId) {
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
          phyDept, phySub, sarahFacId, aparnaFacId, mbbsBatch,
          anaDept, anaSub
        ]);
      }
    } catch (e) {
      this.logger.error('Error seeding default timetable_slots:', e);
    }

    this.logger.log(`Default data seeded for schema: ${schema}`);
  }
}


