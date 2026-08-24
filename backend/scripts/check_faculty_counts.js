const { Client } = require('pg');

async function check() {
  const client = new Client({
    connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp',
  });
  await client.connect();

  const schemas = await client.query(`
    SELECT table_schema 
    FROM information_schema.tables 
    WHERE table_name = 'faculty' AND table_schema LIKE 'tenant_%'
  `);

  for (const s of schemas.rows) {
    const res = await client.query(`SELECT count(*) FROM "${s.table_schema}".faculty`);
    if (Number(res.rows[0].count) > 0) {
      console.log(s.table_schema, '->', res.rows[0].count, 'faculty records');
    }
  }

  await client.end();
}

check().catch(console.error);
