import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';

/**
 * TenantSchemaService — manages per-tenant PostgreSQL schema lifecycle.
 *
 * Each tenant gets an isolated schema: tenant_{slug}
 * All tables in the per-tenant schema are identical in structure.
 */
@Injectable()
export class TenantSchemaService {
  private readonly logger = new Logger(TenantSchemaService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Provision a new tenant schema with all required tables.
   * Called during onboarding → college setup wizard.
   */
  async provisionSchema(slug: string): Promise<void> {
    const schema = `tenant_${slug}`;
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
    const schema = `tenant_${slug}`;
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.query(`SET search_path TO "${schema}", public`);
    return runner;
  }

  /**
   * Execute a raw query in a tenant's schema context.
   */
  async queryInTenant<T = any>(slug: string, sql: string, params: any[] = []): Promise<T[]> {
    const schema = `tenant_${slug}`;
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    try {
      await runner.query(`SET search_path TO "${schema}", public`);
      return await runner.query(sql, params);
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
        type        VARCHAR(50)  NOT NULL,
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
        designation     VARCHAR(100),
        qualification   TEXT,
        specialization  VARCHAR(200),
        joining_date    DATE,
        photo_url       TEXT,
        phone           VARCHAR(20),
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
        is_active     BOOLEAN      DEFAULT true
      )
    `);

    // ── Students ───────────────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".students (
        id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id           UUID        UNIQUE REFERENCES "${schema}".users(id) ON DELETE CASCADE,
        rollno            VARCHAR(50)  UNIQUE NOT NULL,
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

    // ── Subjects ───────────────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".subjects (
        id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        code          VARCHAR(30)  UNIQUE NOT NULL,
        name          VARCHAR(200) NOT NULL,
        department_id UUID        REFERENCES "${schema}".departments(id),
        batch_id      UUID        REFERENCES "${schema}".batches(id),
        credits       INT          DEFAULT 0,
        type          VARCHAR(20),
        is_active     BOOLEAN      DEFAULT true
      )
    `);

    // ── Attendance Sessions ────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".attendance_sessions (
        id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        faculty_id    UUID        REFERENCES "${schema}".faculty(id),
        subject_id    UUID        REFERENCES "${schema}".subjects(id),
        batch_id      UUID        REFERENCES "${schema}".batches(id),
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
        is_active      BOOLEAN      DEFAULT true,
        created_at     TIMESTAMPTZ  DEFAULT NOW()
      )
    `);

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

    // ── Competency Results ─────────────────────────────────────────────────
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".student_competency_results (
        id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id      UUID        REFERENCES "${schema}".students(id),
        competency_id   UUID        REFERENCES "${schema}".examination_competencies(id),
        marks_obtained  NUMERIC(6,2)
      )
    `);

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
        slot_type       VARCHAR(20),
        effective_from  DATE,
        effective_until DATE
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

    this.logger.log(`All tables created in schema: ${schema}`);
  }

  private async seedDefaultData(runner: QueryRunner, slug: string): Promise<void> {
    const schema = `tenant_${slug}`;

    // Seed default leave types
    await runner.query(`
      INSERT INTO "${schema}".leave_types (code, name, max_days_per_year) VALUES
        ('CL',  'Casual Leave',          12),
        ('SL',  'Sick Leave',            10),
        ('EL',  'Earned Leave',          30),
        ('ML',  'Maternity Leave',       180),
        ('COL', 'Compensatory Off Leave', 0)
      ON CONFLICT DO NOTHING
    `);

    this.logger.log(`Default data seeded for schema: ${schema}`);
  }
}
