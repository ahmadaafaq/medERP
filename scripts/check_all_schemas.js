const { Client } = require('../backend/node_modules/pg');

async function run() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'unicampus',
    password: 'unicampus_secret',
    database: 'unicampus_erp',
  });

  await client.connect();
  const schemas = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'");
  for (const s of schemas.rows) {
    const res = await client.query(`SELECT id, session_date::text AS raw_text_date, pg_typeof(session_date)::text AS col_type, batch_id, topic_covered FROM "${s.schema_name}".attendance_sessions`);
    console.log('SCHEMA:', s.schema_name);
    console.log(res.rows);
  }
  await client.end();
}

run().catch(console.error);
