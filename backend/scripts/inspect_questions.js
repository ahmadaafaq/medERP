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

  console.log(`\n=== ALL QUESTION BANK RECORDS IN ${schema} ===`);
  const questions = await client.query(`
    SELECT q.id, q.mode, q.question_text, q.topic, q.topic_id, q.competency_code, q.competency_id, 
           q.subject_id, q.department_id, q.created_at
    FROM "${schema}".question_bank q
    ORDER BY q.created_at DESC
  `);
  console.log(JSON.stringify(questions.rows, null, 2));

  await client.end();
}

main().catch(err => console.error(err));
