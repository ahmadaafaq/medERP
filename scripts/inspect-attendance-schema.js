const { Client } = require('pg');

async function inspectSchema() {
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/mederp' });
  await client.connect();

  try {
    const colSessions = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'tenant_srms-ims' AND table_name = 'attendance_sessions'
    `);
    console.log('Columns in tenant_srms-ims.attendance_sessions:', colSessions.rows);

    const colRecords = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'tenant_srms-ims' AND table_name = 'attendance_records'
    `);
    console.log('Columns in tenant_srms-ims.attendance_records:', colRecords.rows);

    const fkConstraints = await client.query(`
      SELECT tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_schema = 'tenant_srms-ims' AND tc.table_name IN ('attendance_sessions', 'attendance_records')
    `);
    console.log('FK Constraints:', fkConstraints.rows);
  } catch (err) {
    console.error('Inspect failed:', err);
  } finally {
    await client.end();
  }
}

inspectSchema();
