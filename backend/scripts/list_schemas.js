const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp' });

async function listAllSchemas() {
  const res = await pool.query(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    ORDER BY schema_name;
  `);
  console.log('Schemas in database:');
  console.table(res.rows);

  const firms = await pool.query(`SELECT id, title, slug FROM public.firms`);
  console.log('Firms in public.firms:');
  console.table(firms.rows);

  await pool.end();
}

listAllSchemas().catch(console.error);
