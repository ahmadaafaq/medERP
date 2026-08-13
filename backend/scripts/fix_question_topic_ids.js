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
  const schema = 'tenant_srms-ims';

  console.log('--- LINKING ALL QUESTION_BANK RECORDS TO TOPIC_ID & COMPETENCY_ID ---');
  
  // 1. Link competency_id by matching competency_code
  const compUpdate = await client.query(`
    UPDATE "${schema}".question_bank q
    SET competency_id = c.id,
        topic_id = COALESCE(q.topic_id, c.topic_id)
    FROM "${schema}".competencies c
    WHERE LOWER(TRIM(q.competency_code)) = LOWER(TRIM(c.code))
       OR LOWER(q.competency_code) LIKE LOWER(c.code) || '%'
       OR LOWER(c.code) LIKE LOWER(q.competency_code) || '%';
  `);
  console.log(`Updated ${compUpdate.rowCount} rows via competency code matching!`);

  // 2. Link remaining topic_id by matching topic name or code
  const topicUpdate = await client.query(`
    UPDATE "${schema}".question_bank q
    SET topic_id = t.id
    FROM "${schema}".topics t
    WHERE q.topic_id IS NULL AND (
      LOWER(TRIM(q.topic)) = LOWER(TRIM(t.name))
      OR LOWER(q.topic) LIKE '%' || LOWER(TRIM(REGEXP_REPLACE(t.name, '^Topic \\d+:\\s*', '', 'i'))) || '%'
      OR LOWER(TRIM(REGEXP_REPLACE(t.name, '^Topic \\d+:\\s*', '', 'i'))) LIKE '%' || LOWER(q.topic) || '%'
    );
  `);
  console.log(`Updated ${topicUpdate.rowCount} rows via topic name matching!`);

  // 3. Print updated questions
  const res = await client.query(`
    SELECT q.id, q.question_text, q.topic, q.topic_id, q.competency_code, q.competency_id, t.name as topic_name
    FROM "${schema}".question_bank q
    LEFT JOIN "${schema}".topics t ON t.id = q.topic_id
    ORDER BY q.created_at DESC
  `);
  console.log('\nUpdated Questions:', JSON.stringify(res.rows, null, 2));

  await client.end();
}

main().catch(err => console.error(err));
