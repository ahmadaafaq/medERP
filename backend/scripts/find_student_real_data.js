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
    ORDER BY schema_name
  `);

  console.log(`Searching across ${schemasRes.rows.length} schemas in PostgreSQL...`);

  for (const s of schemasRes.rows) {
    const schema = s.schema_name;
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1
    `, [schema]);

    for (const t of tablesRes.rows) {
      const tableName = t.table_name;
      try {
        const check = await client.query(`
          SELECT * FROM "${schema}"."${tableName}"
          WHERE CAST(row_to_json("${tableName}") AS TEXT) ILIKE '%Generative AI%'
             OR CAST(row_to_json("${tableName}") AS TEXT) ILIKE '%GEN AI%'
             OR CAST(row_to_json("${tableName}") AS TEXT) ILIKE '%E-Commerce%'
             OR CAST(row_to_json("${tableName}") AS TEXT) ILIKE '%Shorab%'
             OR CAST(row_to_json("${tableName}") AS TEXT) ILIKE '%Topology%'
             OR CAST(row_to_json("${tableName}") AS TEXT) ILIKE '%Aafreen%'
          LIMIT 10
        `);

        if (check.rows.length > 0) {
          console.log(`\n FOUND EXACT MATCH in schema "${schema}", table "${tableName}": (${check.rows.length} rows)`);
          console.log(JSON.stringify(check.rows, null, 2));
        }
      } catch (err) {
        // ignore
      }
    }
  }

  await client.end();
}

main().catch(console.error);
