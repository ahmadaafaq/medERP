const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || '34.236.107.120',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  user: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || 'unicampus_dev@qsd!3ous',
  database: process.env.DB_NAME || 'unicampus_erp',
});

async function runCleanup() {
  await client.connect();
  console.log('Connected to database for deduplication.');

  const schemasRes = await client.query(`
    SELECT schema_name FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%'
  `);

  for (const s of schemasRes.rows) {
    const schema = s.schema_name;
    console.log(`\n--- Processing schema: ${schema} ---`);

    // 1. Deduplicate internship_applications
    try {
      const hasApps = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'internship_applications'
        )
      `, [schema]);

      if (hasApps.rows[0].exists) {
        const delRes = await client.query(`
          DELETE FROM "${schema}".internship_applications
          WHERE ctid NOT IN (
            SELECT min(ctid)
            FROM "${schema}".internship_applications
            GROUP BY id
          )
        `);
        console.log(`[${schema}] Removed ${delRes.rowCount} duplicate rows from internship_applications.`);

        // Add primary key if not exists
        await client.query(`
          DO $$ BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint 
              WHERE conrelid = '"${schema}".internship_applications'::regclass AND contype = 'p'
            ) THEN
              ALTER TABLE "${schema}".internship_applications ADD PRIMARY KEY (id);
            END IF;
          EXCEPTION WHEN OTHERS THEN
            NULL;
          END $$;
        `);
      }
    } catch (e) {
      console.warn(`[${schema}] Error cleaning internship_applications:`, e.message);
    }

    // 2. Deduplicate internship_programs
    try {
      const hasProgs = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'internship_programs'
        )
      `, [schema]);

      if (hasProgs.rows[0].exists) {
        const delRes = await client.query(`
          DELETE FROM "${schema}".internship_programs
          WHERE ctid NOT IN (
            SELECT min(ctid)
            FROM "${schema}".internship_programs
            GROUP BY id
          )
        `);
        console.log(`[${schema}] Removed ${delRes.rowCount} duplicate rows from internship_programs.`);

        await client.query(`
          DO $$ BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint 
              WHERE conrelid = '"${schema}".internship_programs'::regclass AND contype = 'p'
            ) THEN
              ALTER TABLE "${schema}".internship_programs ADD PRIMARY KEY (id);
            END IF;
          EXCEPTION WHEN OTHERS THEN
            NULL;
          END $$;
        `);
      }
    } catch (e) {
      console.warn(`[${schema}] Error cleaning internship_programs:`, e.message);
    }

    // 3. Deduplicate certificates
    try {
      const hasCerts = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'certificates'
        )
      `, [schema]);

      if (hasCerts.rows[0].exists) {
        const delRes = await client.query(`
          DELETE FROM "${schema}".certificates
          WHERE ctid NOT IN (
            SELECT min(ctid)
            FROM "${schema}".certificates
            GROUP BY id
          )
        `);
        console.log(`[${schema}] Removed ${delRes.rowCount} duplicate rows from certificates.`);

        await client.query(`
          DO $$ BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint 
              WHERE conrelid = '"${schema}".certificates'::regclass AND contype = 'p'
            ) THEN
              ALTER TABLE "${schema}".certificates ADD PRIMARY KEY (id);
            END IF;
          EXCEPTION WHEN OTHERS THEN
            NULL;
          END $$;
        `);
      }
    } catch (e) {
      console.warn(`[${schema}] Error cleaning certificates:`, e.message);
    }

    // 4. Deduplicate courses
    try {
      const hasCourses = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'courses'
        )
      `, [schema]);

      if (hasCourses.rows[0].exists) {
        const delRes = await client.query(`
          DELETE FROM "${schema}".courses
          WHERE ctid NOT IN (
            SELECT min(ctid)
            FROM "${schema}".courses
            GROUP BY id
          )
        `);
        console.log(`[${schema}] Removed ${delRes.rowCount} duplicate rows from courses.`);
      }
    } catch (e) {
      console.warn(`[${schema}] Error cleaning courses:`, e.message);
    }

    // 5. Deduplicate batches
    try {
      const hasBatches = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'batches'
        )
      `, [schema]);

      if (hasBatches.rows[0].exists) {
        const delRes = await client.query(`
          DELETE FROM "${schema}".batches
          WHERE ctid NOT IN (
            SELECT min(ctid)
            FROM "${schema}".batches
            GROUP BY id
          )
        `);
        console.log(`[${schema}] Removed ${delRes.rowCount} duplicate rows from batches.`);
      }
    } catch (e) {
      console.warn(`[${schema}] Error cleaning batches:`, e.message);
    }

    // 6. Deduplicate students
    try {
      const hasStudents = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = 'students'
        )
      `, [schema]);

      if (hasStudents.rows[0].exists) {
        const delRes = await client.query(`
          DELETE FROM "${schema}".students
          WHERE ctid NOT IN (
            SELECT min(ctid)
            FROM "${schema}".students
            GROUP BY id
          )
        `);
        console.log(`[${schema}] Removed ${delRes.rowCount} duplicate rows from students.`);
      }
    } catch (e) {
      console.warn(`[${schema}] Error cleaning students:`, e.message);
    }
  }

  await client.end();
  console.log('\n=== Cleanup completed successfully ===');
}

runCleanup().catch(console.error);
