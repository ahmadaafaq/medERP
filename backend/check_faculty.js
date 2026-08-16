const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'unicampus_erp',
  user: 'unicampus',
  password: 'unicampus_secret',
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL');

  const schemas = ['tenant_srms-cet-bareilly', 'tenant_srms-cet-unnao', 'public'];

  for (const s of schemas) {
    console.log(`\n=== Checking schema: ${s} ===`);
    
    // Check tables in schema
    const tablesRes = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = $1
    `, [s]);
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log('Tables:', tables.filter(t => t.includes('user') || t.includes('staff') || t.includes('facul') || t.includes('prof')));

    // Check users
    if (tables.includes('users')) {
      const users = await client.query(`SELECT id, email, role, full_name FROM "${s}".users`);
      console.log(`Users in ${s}:`, users.rows);
    }

    // Check faculty_profiles or staff
    if (tables.includes('staff')) {
      const staff = await client.query(`SELECT * FROM "${s}".staff`);
      console.log(`Staff in ${s}:`, staff.rows);
    }

    if (tables.includes('faculty_profiles')) {
      const fp = await client.query(`SELECT * FROM "${s}".faculty_profiles`);
      console.log(`Faculty profiles in ${s}:`, fp.rows);
    }
  }

  await client.end();
}

main().catch(console.error);
