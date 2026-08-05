const { Client } = require('pg');

async function checkColumns() {
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/mederp' });
  await client.connect();

  try {
    const res1 = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'tenant_srms-ims' AND table_name = 'attendance_sessions'
    `);
    console.log('Columns in tenant_srms-ims.attendance_sessions:');
    console.table(res1.rows);

    const res2 = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'tenant_srms' AND table_name = 'attendance_sessions'
    `);
    console.log('Columns in tenant_srms.attendance_sessions:');
    console.table(res2.rows);

  } catch (err) {
    console.error('Error checking columns:', err);
  } finally {
    await client.end();
  }
}

checkColumns();
