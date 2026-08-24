const { Client } = require('pg');

const c = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp',
});

async function migrate() {
  await c.connect();

  const schemasRes = await c.query(
    "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'"
  );

  for (const s of schemasRes.rows) {
    const schema = s.schema_name;
    console.log(`Migrating tables for ${schema}...`);

    await c.query(`
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

      CREATE INDEX IF NOT EXISTS idx_drive_apps_company_${schema.replace(/[^a-zA-Z0-9]/g, '_')} ON "${schema}".drive_applications(drive_company_id);
      CREATE INDEX IF NOT EXISTS idx_drive_apps_student_${schema.replace(/[^a-zA-Z0-9]/g, '_')} ON "${schema}".drive_applications(student_reg_no);

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
    console.log(`Migrated ${schema} successfully!`);
  }

  await c.end();
}

migrate().catch(console.error);
