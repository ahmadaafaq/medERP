const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp' });

async function inspectProjects() {
  console.log('--- Inspecting Projects & Grading Tables ---');

  // Check tables in tenant schemas
  const schemas = ['tenant_srms_cet_bareilly', 'tenant_srms_cetr_bareilly', 'tenant_srms_ims_bareilly', 'public'];

  for (const s of schemas) {
    const tables = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND (table_name LIKE '%project%' OR table_name LIKE '%repo%' OR table_name LIKE '%incub%')`,
      [s]
    );
    console.log(`Schema ${s} tables:`, tables.rows.map(r => r.table_name));

    for (const t of tables.rows) {
      const count = await pool.query(`SELECT count(*) FROM "${s}"."${t.table_name}"`);
      console.log(`  Table "${s}"."${t.table_name}" has ${count.rows[0].count} rows`);
      
      const sample = await pool.query(`SELECT * FROM "${s}"."${t.table_name}" LIMIT 3`);
      console.log(`  Sample data from "${s}"."${t.table_name}":`, sample.rows);
    }
  }

  await pool.end();
}

inspectProjects().catch(console.error);
