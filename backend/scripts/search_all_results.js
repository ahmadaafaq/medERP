const { Client } = require('pg');

async function searchAllSchemasForResults() {
  const client = new Client({
    host: '34.236.107.120', port: 5433, user: 'unicampus',
    password: 'unicampus_dev@qsd!3ous', database: 'unicampus_erp',
  });
  await client.connect();

  const schemasRes = await client.query(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%' OR schema_name = 'public'
    ORDER BY schema_name;
  `);

  for (const s of schemasRes.rows) {
    const schema = s.schema_name;
    try {
      const res = await client.query(`SELECT * FROM "${schema}".student_results LIMIT 10;`);
      if (res.rows.length > 0) {
        console.log(`\nFound results in schema: ${schema} (${res.rows.length} rows):`);
        console.table(res.rows);
      }
    } catch (e) {
      // Table does not exist in schema
    }

    try {
      const papers = await client.query(`SELECT id, code, name, subject_id FROM "${schema}".examination_papers;`);
      if (papers.rows.length > 0) {
        console.log(`\nPapers in schema: ${schema} (${papers.rows.length} papers):`);
        console.table(papers.rows);
      }
    } catch (e) {}
  }

  await client.end();
}

searchAllSchemasForResults().catch(console.error);
