const { Client } = require('pg');

const client = new Client({
  host: '34.236.107.120',
  port: 5433,
  user: 'unicampus',
  password: 'unicampus_dev@qsd!3ous',
  database: 'unicampus_erp',
});

async function main() {
  await client.connect();
  console.log('--- SEARCHING FOR DR/01/2026 ---');
  const schemasRes = await client.query(
    "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%' OR schema_name = 'public'"
  );

  for (const row of schemasRes.rows) {
    const s = row.schema_name;

    // Check users
    try {
      const uRes = await client.query(
        `SELECT * FROM "${s}".users WHERE LOWER(COALESCE(email, '')) LIKE '%dr/01/2026%' OR LOWER(COALESCE(emp_id, '')) LIKE '%dr/01/2026%' OR LOWER(COALESCE(username, '')) LIKE '%dr/01/2026%'`
      );
      if (uRes.rows.length > 0) {
        console.log(`FOUND in "${s}".users:`, uRes.rows);
      }
    } catch (e) {}

    // Check faculty
    try {
      const fRes = await client.query(
        `SELECT * FROM "${s}".faculty WHERE LOWER(COALESCE(emp_id, '')) LIKE '%dr/01/2026%' OR LOWER(COALESCE(email, '')) LIKE '%dr/01/2026%' OR LOWER(COALESCE(name, '')) LIKE '%dr/01/2026%'`
      );
      if (fRes.rows.length > 0) {
        console.log(`FOUND in "${s}".faculty:`, fRes.rows);
      }
    } catch (e) {}
  }

  // Also check recently created users in all tenant schemas
  console.log('\n--- RECENTLY CREATED USERS (PAST 4 HOURS) ---');
  for (const row of schemasRes.rows) {
    const s = row.schema_name;
    try {
      const recent = await client.query(
        `SELECT id, email, username, emp_id, role, is_active, created_at, updated_at FROM "${s}".users WHERE created_at > NOW() - INTERVAL '4 hours' ORDER BY created_at DESC`
      );
      if (recent.rows.length > 0) {
        console.log(`Recent users in "${s}".users:`, recent.rows);
      }
    } catch (e) {}

    try {
      const recentFac = await client.query(
        `SELECT id, user_id, emp_id, name, designation, created_at, updated_at FROM "${s}".faculty WHERE created_at > NOW() - INTERVAL '4 hours' ORDER BY created_at DESC`
      );
      if (recentFac.rows.length > 0) {
        console.log(`Recent faculty in "${s}".faculty:`, recentFac.rows);
      }
    } catch (e) {}
  }

  await client.end();
}

main().catch(console.error);
