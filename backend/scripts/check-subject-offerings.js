const { Client } = require('pg');
const client = new Client({ host: 'localhost', port: 5432, user: 'unicampus', password: 'unicampus_secret', database: 'unicampus_erp' });

async function run() {
  await client.connect();
  const schemas = ['tenant_srms-ims', 'tenant_rajshreemri'];

  for (const s of schemas) {
    console.log(`\n=== Schema: ${s} ===`);
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = 'subject_offerings'
    `, [s]);
    console.log('subject_offerings columns:', cols.rows);

    const fks = await client.query(`
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = $1 AND tc.table_name = 'subject_offerings';
    `, [s]);
    console.log('subject_offerings foreign keys:', fks.rows);

    const pLinkers = await client.query(`SELECT id, code, name FROM "${s}".professional_linkers`);
    console.log('professional_linkers:', pLinkers.rows);

    const subjects = await client.query(`SELECT id, code, name FROM "${s}".subjects`);
    console.log('subjects:', subjects.rows);

    const dtypes = await client.query(`SELECT id, code, name FROM "${s}".delivery_types`);
    console.log('delivery_types:', dtypes.rows);
  }

  await client.end();
}

run().catch(console.error);
