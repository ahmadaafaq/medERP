const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'unicampus',
    password: 'unicampus_secret',
    database: 'unicampus_erp',
  });

  try {
    await client.connect();

    // Find schemas
    const schemasRes = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant%' OR schema_name = 'public'");
    console.log('Schemas:', schemasRes.rows.map(r => r.schema_name));

    for (const row of schemasRes.rows) {
      const s = row.schema_name;
      try {
        const qRes = await client.query(`SELECT id, question_text, topic, topic_id, competency_code, competency_id, subject_id, mode, created_at FROM "${s}".question_bank`);
        console.log(`\n--- ${s}.question_bank (${qRes.rows.length} rows) ---`);
        console.table(qRes.rows);

        const topicsRes = await client.query(`SELECT id, name, code, subject_id FROM "${s}".topics LIMIT 10`).catch(() => ({ rows: [] }));
        console.log(`--- ${s}.topics (${topicsRes.rows.length} rows) ---`);
        console.table(topicsRes.rows);

        const compRes = await client.query(`SELECT id, code, topic_id FROM "${s}".competencies LIMIT 10`).catch(() => ({ rows: [] }));
        console.log(`--- ${s}.competencies (${compRes.rows.length} rows) ---`);
        console.table(compRes.rows);
      } catch (err) {
        console.log(`No question_bank in schema ${s} or query failed: ${err.message}`);
      }
    }
  } catch (e) {
    console.error('DB Connection error:', e.message);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
