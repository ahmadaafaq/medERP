const { DataSource } = require('typeorm');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function main() {
  const host = process.env.DB_HOST || '100.63.22.73';
  const port = parseInt(process.env.DB_PORT || '5433', 10);
  const username = process.env.DB_USER || 'unicampus';
  const password = process.env.DB_PASSWORD || process.env.DB_PASS || 'unicampus_dev@qsd!3ous';
  const database = process.env.DB_DATABASE || process.env.DB_NAME || 'unicampus_erp';

  console.log(`Connecting to Postgres at ${host}:${port}/${database}...`);

  const ds = new DataSource({
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
  });

  await ds.initialize();
  console.log('Database connected successfully.');

  // Parse CLI args for specific tenant e.g. --tenant=srms-cet-bareilly
  const tenantArg = process.argv.find((a) => a.startsWith('--tenant='));
  const specifiedTenant = tenantArg ? tenantArg.split('=')[1] : null;

  let schemas = [];
  if (specifiedTenant) {
    const s = specifiedTenant.startsWith('tenant_') ? specifiedTenant : `tenant_${specifiedTenant}`;
    schemas = [s];
  } else {
    const rows = await ds.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'`
    );
    schemas = rows.map((r) => r.schema_name);
  }

  console.log(`Applying OBE tables & seed data across schemas:`, schemas);

  for (const s of schemas) {
    console.log(`\n─────────────────────────────────────────────────────────────`);
    console.log(`Processing Schema: ${s}`);
    console.log(`─────────────────────────────────────────────────────────────`);

    // 1. Ensure OBE tables exist
    await ds.query(`
      CREATE TABLE IF NOT EXISTS "${s}".obe_targets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        faculty_id UUID,
        subject_code VARCHAR(100) NOT NULL,
        unit_code VARCHAR(50) NOT NULL,
        semester VARCHAR(20),
        batch_year INT,
        course_cd VARCHAR(50),
        branch_cd VARCHAR(50),
        exam_type VARCHAR(30) DEFAULT 'COMBINED',
        mark_threshold_pct NUMERIC(5,2) DEFAULT 40,
        student_pass_pct_target NUMERIC(5,2) DEFAULT 60,
        target_level INT DEFAULT 2,
        corrective_action TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS uq_obe_targets
        ON "${s}".obe_targets (faculty_id, subject_code, unit_code, COALESCE(semester,''), COALESCE(batch_year::text,''));

      CREATE TABLE IF NOT EXISTS "${s}".co_attainment_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subject_code VARCHAR(100) NOT NULL,
        unit_code VARCHAR(50) NOT NULL,
        exam_type VARCHAR(30) DEFAULT 'COMBINED',
        semester VARCHAR(20),
        batch_year INT,
        course_cd VARCHAR(50),
        branch_cd VARCHAR(50),
        direct_attainment NUMERIC(5,3) DEFAULT 0,
        indirect_attainment NUMERIC(5,3) DEFAULT 0,
        final_attainment NUMERIC(5,3) DEFAULT 0,
        student_pass_pct NUMERIC(5,2) DEFAULT 0,
        total_students INT DEFAULT 0,
        students_passed INT DEFAULT 0,
        mark_threshold_pct NUMERIC(5,2) DEFAULT 40,
        computed_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS uq_co_attainment
        ON "${s}".co_attainment_results (subject_code, unit_code, exam_type, COALESCE(semester,''), COALESCE(batch_year::text,''), COALESCE(course_cd,''), COALESCE(branch_cd,''));

      CREATE TABLE IF NOT EXISTS "${s}".po_attainment_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        po_code VARCHAR(50) NOT NULL,
        semester VARCHAR(20),
        batch_year INT,
        course_cd VARCHAR(50),
        branch_cd VARCHAR(50),
        attainment_value NUMERIC(5,3) DEFAULT 0,
        contributing_subjects TEXT[] DEFAULT '{}',
        computed_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS uq_po_attainment
        ON "${s}".po_attainment_results (po_code, COALESCE(semester,''), COALESCE(batch_year::text,''), COALESCE(course_cd,''), COALESCE(branch_cd,''));

      CREATE TABLE IF NOT EXISTS "${s}".peo_attainment_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        peo_code VARCHAR(50) NOT NULL,
        batch_year INT,
        course_cd VARCHAR(50),
        branch_cd VARCHAR(50),
        attainment_value NUMERIC(5,3) DEFAULT 0,
        computed_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS uq_peo_attainment
        ON "${s}".peo_attainment_results (peo_code, COALESCE(batch_year::text,''), COALESCE(course_cd,''), COALESCE(branch_cd,''));

      CREATE TABLE IF NOT EXISTS "${s}".course_exit_surveys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subject_code VARCHAR(100) NOT NULL,
        faculty_id UUID,
        semester VARCHAR(20),
        batch_year INT,
        course_cd VARCHAR(50),
        is_published BOOLEAN DEFAULT false,
        published_at TIMESTAMPTZ,
        closes_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "${s}".survey_responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        survey_id UUID REFERENCES "${s}".course_exit_surveys(id) ON DELETE CASCADE,
        student_id UUID,
        unit_code VARCHAR(50) NOT NULL,
        rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        responded_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS uq_survey_response
        ON "${s}".survey_responses (survey_id, COALESCE(student_id::text,''), unit_code);
    `);
    console.log(`[✓] 6 OBE tables & indexes ensured in ${s}`);

    // 2. Seed CO-PO Matrices for Core Engineering Subjects
    const chemMatrix = {
      CO1: { PO1: 3, PO2: 2, PO3: 1, PO7: 2, PO12: 1, PSO1: 2 },
      CO2: { PO1: 2, PO2: 3, PO3: 2, PO4: 2, PO12: 1, PSO1: 2 },
      CO3: { PO1: 3, PO2: 2, PO3: 3, PO5: 2, PO7: 3, PSO2: 2 },
      CO4: { PO1: 2, PO2: 3, PO3: 2, PO7: 3, PO12: 2, PSO2: 3 },
      CO5: { PO1: 3, PO2: 2, PO3: 3, PO5: 3, PO12: 2, PSO1: 2, PSO2: 2 },
    };

    const coaMatrix = {
      CO1: { PO1: 3, PO2: 3, PO3: 2, PO5: 2, PO12: 2, PSO1: 3 },
      CO2: { PO1: 3, PO2: 3, PO3: 3, PO5: 3, PO12: 2, PSO1: 3, PSO2: 2 },
      CO3: { PO1: 2, PO2: 3, PO3: 3, PO5: 2, PO12: 2, PSO1: 2, PSO2: 3 },
      CO4: { PO1: 3, PO2: 2, PO3: 2, PO5: 2, PO12: 3, PSO1: 3 },
      CO5: { PO1: 3, PO2: 3, PO3: 3, PO5: 3, PO12: 3, PSO1: 3, PSO2: 3 },
    };

    await ds.query(`
      UPDATE "${s}".co_po_matrices
      SET matrix_data = $1, updated_at = NOW()
      WHERE subject_code = '85185'
    `, [JSON.stringify(chemMatrix)]);

    const chemExists = await ds.query(`SELECT id FROM "${s}".co_po_matrices WHERE subject_code = '85185'`);
    if (chemExists.length === 0) {
      await ds.query(`
        INSERT INTO "${s}".co_po_matrices (subject_code, matrix_data, created_at, updated_at)
        VALUES ('85185', $1, NOW(), NOW())
      `, [JSON.stringify(chemMatrix)]);
    }

    const coaExists = await ds.query(`SELECT id FROM "${s}".co_po_matrices WHERE subject_code = 'KCS-302'`);
    if (coaExists.length === 0) {
      await ds.query(`
        INSERT INTO "${s}".co_po_matrices (subject_code, matrix_data, created_at, updated_at)
        VALUES ('KCS-302', $1, NOW(), NOW())
      `, [JSON.stringify(coaMatrix)]);
    } else {
      await ds.query(`
        UPDATE "${s}".co_po_matrices
        SET matrix_data = $1, updated_at = NOW()
        WHERE subject_code = 'KCS-302'
      `, [JSON.stringify(coaMatrix)]);
    }
    console.log(`[✓] Seeded co_po_matrices for subjects 85185 and KCS-302`);

    // 3. Seed PO-PEO Matrix for B.Tech CSE (Course 1, Branch 1, Batch 2024, Sem 1)
    const poPeoMatrix = {
      PO1:  { PEO1: 3, PEO2: 2, PEO3: 1, PEO4: 1 },
      PO2:  { PEO1: 3, PEO2: 3, PEO3: 1, PEO4: 1 },
      PO3:  { PEO1: 3, PEO2: 3, PEO3: 2, PEO4: 2 },
      PO4:  { PEO1: 2, PEO2: 2, PEO3: 2, PEO4: 1 },
      PO5:  { PEO1: 3, PEO2: 3, PEO3: 2, PEO4: 1 },
      PO6:  { PEO1: 1, PEO2: 1, PEO3: 2, PEO4: 3 },
      PO7:  { PEO1: 1, PEO2: 1, PEO3: 2, PEO4: 3 },
      PO8:  { PEO1: 1, PEO2: 2, PEO3: 1, PEO4: 3 },
      PO9:  { PEO1: 2, PEO2: 3, PEO3: 2, PEO4: 2 },
      PO10: { PEO1: 2, PEO2: 3, PEO3: 1, PEO4: 2 },
      PO11: { PEO1: 2, PEO2: 3, PEO3: 2, PEO4: 2 },
      PO12: { PEO1: 3, PEO2: 3, PEO3: 2, PEO4: 2 },
      PSO1: { PEO1: 3, PEO2: 3, PEO3: 2, PEO4: 2 },
      PSO2: { PEO1: 3, PEO2: 3, PEO3: 2, PEO4: 2 },
    };

    await ds.query(`
      DELETE FROM "${s}".po_peo_matrices
      WHERE matrix_data::text = '{}' OR matrix_data IS NULL
    `);

    const popeoCheck = await ds.query(`
      SELECT id FROM "${s}".po_peo_matrices
      WHERE course_cd = '1' AND branch_cd = '1' AND batch_year = 2024 AND sem_cd = '1'
    `);

    if (popeoCheck.length === 0) {
      await ds.query(`
        INSERT INTO "${s}".po_peo_matrices (course_cd, branch_cd, batch_year, sem_cd, matrix_data, created_at, updated_at)
        VALUES ('1', '1', 2024, '1', $1, NOW(), NOW())
      `, [JSON.stringify(poPeoMatrix)]);
    } else {
      await ds.query(`
        UPDATE "${s}".po_peo_matrices
        SET matrix_data = $1, updated_at = NOW()
        WHERE course_cd = '1' AND branch_cd = '1' AND batch_year = 2024 AND sem_cd = '1'
      `, [JSON.stringify(poPeoMatrix)]);
    }
    console.log(`[✓] Seeded po_peo_matrices for B.Tech CSE 2024 Sem 1`);

    // 4. Clean up any stale un-scoped rows to avoid duplicate key conflicts
    await ds.query(`
      DELETE FROM "${s}".co_attainment_results
      WHERE subject_code IN ('85185', 'KCS-302')
        AND (course_cd IS NULL OR batch_year IS NULL OR semester IS NULL)
    `);

    // 5. Clean up any un-scoped targets
    await ds.query(`
      DELETE FROM "${s}".obe_targets
      WHERE subject_code = '85185'
        AND (course_cd IS NULL OR batch_year IS NULL)
    `);

    console.log(`[✓] Synchronized attainment and target scopes for B.Tech CSE 2024 Sem 1`);
  }

  await ds.destroy();
  console.log(`\n🎉 OBE database tables and seed data setup completed successfully.`);
}

main().catch((err) => {
  console.error('Fatal error during OBE seeding:', err);
  process.exit(1);
});
