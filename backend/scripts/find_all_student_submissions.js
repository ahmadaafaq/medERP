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

  const schemasRes = await client.query(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%' OR schema_name = 'public'
    ORDER BY schema_name
  `);

  console.log(`Found ${schemasRes.rows.length} schemas. Scanning for logbook & submission records...`);

  for (const s of schemasRes.rows) {
    const schema = s.schema_name;
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1 AND (table_name LIKE 'logbook_%' OR table_name LIKE '%submission%' OR table_name LIKE '%seminar%' OR table_name LIKE '%tutorial%' OR table_name LIKE '%project%')
    `, [schema]);

    for (const t of tablesRes.rows) {
      try {
        const countRes = await client.query(`SELECT COUNT(*) FROM "${schema}"."${t.table_name}"`);
        const count = parseInt(countRes.rows[0].count, 10);
        if (count > 0) {
          console.log(`\n FOUND DATA in ${schema}.${t.table_name} (${count} rows):`);
          const rows = await client.query(`SELECT * FROM "${schema}"."${t.table_name}" LIMIT 3`);
          console.log(JSON.stringify(rows.rows, null, 2));
        }
      } catch (e) {
        // ignore
      }
    }
  }

  await client.end();
}

main().catch(console.error);
