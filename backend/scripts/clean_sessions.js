const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp',
});

async function main() {
  await client.connect();

  const schemasRes = await client.query(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%'
  `);

  for (const row of schemasRes.rows) {
    const s = row.schema_name;
    try {
      await client.query(`
        DELETE FROM "${s}".academic_sessions a
        WHERE a.ctid <> (
          SELECT min(b.ctid)
          FROM "${s}".academic_sessions b
          WHERE b.session_cd = a.session_cd OR (b.session_cd IS NULL AND b.name = a.name)
        )
      `);
      const count = await client.query(`SELECT count(*) FROM "${s}".academic_sessions`);
      console.log(`Schema [${s}]: ${count.rows[0].count} distinct sessions`);
    } catch(err) {
      console.error(`Error in schema ${s}:`, err.message);
    }
  }

  console.log('\n=== Exact 7 Sessions in tenant_srms-cet-bareilly: ===');
  const sample = await client.query(`
    SELECT session_cd, code, colg_cd, name, start_date, end_date, is_current, is_active 
    FROM "tenant_srms-cet-bareilly".academic_sessions 
    ORDER BY session_cd::int DESC
  `);
  console.table(sample.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  client.end();
});
