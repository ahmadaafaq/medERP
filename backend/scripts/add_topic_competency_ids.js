const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function main() {
  await client.connect();
  const schemasRes = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'");
  const schemas = schemasRes.rows.map(r => r.schema_name);

  for (const schema of schemas) {
    const tableExists = await client.query("SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'question_bank'", [schema]);
    if (tableExists.rows.length === 0) continue;

    console.log(`Adding topic_id & competency_id columns to "${schema}".question_bank...`);
    await client.query(`
      ALTER TABLE "${schema}".question_bank 
      ADD COLUMN IF NOT EXISTS topic_id UUID,
      ADD COLUMN IF NOT EXISTS competency_id UUID;
    `);
    
    await client.query(`
      UPDATE "${schema}".question_bank q
      SET topic_id = t.id
      FROM "${schema}".topics t
      WHERE q.topic_id IS NULL 
        AND (LOWER(TRIM(q.topic)) = LOWER(TRIM(t.name)) OR LOWER(q.topic) LIKE '%' || LOWER(t.name) || '%');
    `).catch(() => null);

    await client.query(`
      UPDATE "${schema}".question_bank q
      SET competency_id = c.id
      FROM "${schema}".competencies c
      WHERE q.competency_id IS NULL 
        AND (LOWER(TRIM(q.competency_code)) = LOWER(TRIM(c.code)) OR LOWER(q.competency_code) LIKE LOWER(c.code) || '%');
    `).catch(() => null);
  }

  console.log('Migration completed successfully!');
  await client.end();
}

main().catch(err => console.error(err));
