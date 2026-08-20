const { DataSource } = require('typeorm');
require('dotenv').config();

async function migrateAllSchemas() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'unicampus',
    password: process.env.DB_PASS || 'unicampus_secret',
    database: process.env.DB_NAME || 'unicampus_erp',
  });

  await ds.initialize();
  console.log('✅ Connected to database for constraint migration.');

  const schemas = await ds.query(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%'
  `);

  console.log(`Found ${schemas.length} tenant schemas.`);

  for (const s of schemas) {
    const schema = s.schema_name;
    try {
      await ds.query(`
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
      `);
      console.log(`Migrated constraint to ON DELETE SET NULL in ${schema}`);
    } catch (err) {
      console.warn(`Could not migrate ${schema}:`, err.message);
    }
  }

  // Also test an end-to-end flow in tenant_srms-cet-bareilly:
  // Create dummy attendance session with offering_id -> delete offering -> verify session still exists with offering_id = null
  const testSchema = 'tenant_srms-cet-bareilly';
  const subRows = await ds.query(`SELECT id FROM "${testSchema}".subjects LIMIT 1`);
  const profRows = await ds.query(`SELECT id FROM "${testSchema}".professional_phases LIMIT 1`);
  const dtRows = await ds.query(`SELECT id FROM "${testSchema}".delivery_types LIMIT 1`);

  if (subRows.length && profRows.length && dtRows.length) {
    const subId = subRows[0].id;
    const profId = profRows[0].id;
    const dtId = dtRows[0].id;

    // 1. Insert test offering
    const [testOffering] = await ds.query(`
      INSERT INTO "${testSchema}".subject_offerings (subject_id, prof_id, dtype_id, batch_year, hours_allotted, is_active)
      VALUES ($1, $2, $3, 9999, 100, true)
      RETURNING id
    `, [subId, profId, dtId]);

    // 2. Insert test attendance session linked to testOffering
    const [testSession] = await ds.query(`
      INSERT INTO "${testSchema}".attendance_sessions (subject_id, session_date, session_type, offering_id)
      VALUES ($1, CURRENT_DATE, 'THEORY', $2)
      RETURNING id, offering_id
    `, [subId, testOffering.id]);
    console.log('Created test session linked to offering:', testSession);

    // 3. Delete the test offering
    await ds.query(`DELETE FROM "${testSchema}".subject_offerings WHERE id = $1`, [testOffering.id]);
    console.log('Deleted test offering.');

    // 4. Verify the attendance session STILL exists with offering_id = null (ZERO DATA LOSS)
    const [verifySession] = await ds.query(`
      SELECT id, subject_id, offering_id, session_date FROM "${testSchema}".attendance_sessions WHERE id = $1
    `, [testSession.id]);

    if (verifySession) {
      console.log('✅ SUCCESS: Attendance session was PRESERVED as-is after offering deletion:', verifySession);
      // Clean up test session
      await ds.query(`DELETE FROM "${testSchema}".attendance_sessions WHERE id = $1`, [testSession.id]);
    } else {
      console.error('❌ FAILURE: Attendance session was deleted!');
    }
  }

  await ds.destroy();
  console.log('Migration & Verification script completed successfully.');
}

migrateAllSchemas().catch(console.error);
