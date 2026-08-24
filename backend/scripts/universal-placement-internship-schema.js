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
    console.log(`Upgrading schemas for ${schema}...`);

    // 1. Upgrade placement_drives
    await c.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".placement_drives (
        drive_id              SERIAL PRIMARY KEY,
        colg_cd               VARCHAR(50) DEFAULT '1',
        company_name          VARCHAR(255),
        role                  VARCHAR(255),
        package_ctc           VARCHAR(100),
        package_min           NUMERIC(10,2),
        package_max           NUMERIC(10,2),
        description           TEXT,
        eligibility_course_cd VARCHAR(50),
        eligibility_branch_cd VARCHAR(100),
        eligibility_batch_cd  VARCHAR(100),
        eligible_branches     TEXT[] DEFAULT '{}',
        eligible_batches      TEXT[] DEFAULT '{}',
        min_score_required    NUMERIC(5,2) DEFAULT 60.00,
        drive_date            DATE,
        deadline_date         TIMESTAMPTZ,
        logo_url              VARCHAR(500),
        batch_title           VARCHAR(255),
        source_file_name      VARCHAR(255),
        extra_fields          JSONB DEFAULT '{}'::jsonb,
        status                VARCHAR(50) DEFAULT 'Open',
        created_by_empid      VARCHAR(100),
        created_at            TIMESTAMPTZ DEFAULT NOW(),
        updated_at            TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE "${schema}".placement_drives ADD COLUMN IF NOT EXISTS package_min NUMERIC(10,2);
      ALTER TABLE "${schema}".placement_drives ADD COLUMN IF NOT EXISTS package_max NUMERIC(10,2);
      ALTER TABLE "${schema}".placement_drives ADD COLUMN IF NOT EXISTS eligible_branches TEXT[] DEFAULT '{}';
      ALTER TABLE "${schema}".placement_drives ADD COLUMN IF NOT EXISTS eligible_batches TEXT[] DEFAULT '{}';
      ALTER TABLE "${schema}".placement_drives ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);
      ALTER TABLE "${schema}".placement_drives ADD COLUMN IF NOT EXISTS batch_title VARCHAR(255);
      ALTER TABLE "${schema}".placement_drives ADD COLUMN IF NOT EXISTS source_file_name VARCHAR(255);
      ALTER TABLE "${schema}".placement_drives ADD COLUMN IF NOT EXISTS extra_fields JSONB DEFAULT '{}'::jsonb;
    `);

    // 2. Upgrade placement_applications
    await c.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".placement_applications (
        application_id    SERIAL PRIMARY KEY,
        drive_id          INT REFERENCES "${schema}".placement_drives(drive_id) ON DELETE CASCADE,
        student_reg_no    VARCHAR(100) NOT NULL,
        student_name      VARCHAR(255),
        branch_cd         VARCHAR(100),
        batch_cd          VARCHAR(100),
        resume_link       VARCHAR(500),
        cover_note        TEXT,
        status            VARCHAR(50) DEFAULT 'Applied',
        selected_company  VARCHAR(255),
        selected_role     VARCHAR(255),
        offer_package     NUMERIC(10,2),
        offer_status      VARCHAR(50) DEFAULT 'pending', -- pending | accepted | declined
        remarks           TEXT,
        applied_at        TIMESTAMPTZ DEFAULT NOW(),
        updated_at        TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE "${schema}".placement_applications ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(100);
      ALTER TABLE "${schema}".placement_applications ADD COLUMN IF NOT EXISTS batch_cd VARCHAR(100);
      ALTER TABLE "${schema}".placement_applications ADD COLUMN IF NOT EXISTS offer_package NUMERIC(10,2);
      ALTER TABLE "${schema}".placement_applications ADD COLUMN IF NOT EXISTS offer_status VARCHAR(50) DEFAULT 'pending';
    `);

    // 3. Internship Programs, Applications & Certificates
    await c.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".internship_programs (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title                 VARCHAR(255) NOT NULL,
        category              VARCHAR(50) NOT NULL, -- IT | MANAGEMENT | PARAMEDICAL
        duration              VARCHAR(50) NOT NULL, -- 1_MONTH | 2_MONTH | 3_MONTH | 6_MONTH | 1_YEAR
        fee_type              VARCHAR(20) NOT NULL DEFAULT 'FREE', -- PAID | FREE
        fee_amount            NUMERIC(10,2) DEFAULT 0,
        description           TEXT,
        seats_available       INT DEFAULT 50,
        application_deadline  DATE,
        published_by          VARCHAR(100),
        status                VARCHAR(50) DEFAULT 'published', -- draft | published | applications_locked | completed
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
        status              VARCHAR(50) DEFAULT 'applied', -- applied | under_review | selected | rejected | completed
        locked              BOOLEAN DEFAULT false,
        payment_status      VARCHAR(50) DEFAULT 'not_required', -- not_required | pending | paid
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

    console.log(`Schema ${schema} successfully upgraded!`);
  }

  await c.end();
}

migrate().catch(console.error);
