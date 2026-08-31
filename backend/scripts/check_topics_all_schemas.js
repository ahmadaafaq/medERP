const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: '34.236.107.120',
    port: 5433,
    user: 'unicampus',
    password: 'unicampus_dev@qsd!3ous',
    database: 'unicampus_erp',
  });

  await client.connect();

  const schemas = await client.query(`
    SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'
  `);

  for (const s of schemas.rows) {
    const schema = s.schema_name;
    const topics = await client.query(`SELECT * FROM "${schema}".logbook_topics`).catch(() => ({ rows: [] }));
    if (topics.rows.length > 0) {
      console.log(`\n FOUND TOPICS in ${schema} (${topics.rows.length} rows):`);
      console.log(JSON.stringify(topics.rows, null, 2));
    }
  }

  await client.end();
}

main().catch(console.error);
