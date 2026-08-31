const { Client } = require('pg');

async function inspectAll() {
  const client = new Client({
    host: '34.236.107.120',
    port: 5433,
    user: 'unicampus',
    password: 'unicampus_dev@qsd!3ous',
    database: 'unicampus_erp',
  });
  await client.connect();

  const papers = await client.query(`
    SELECT id, code, name, max_marks, passing_marks, duration_minutes, sections
    FROM "tenant_srms-cet-bareilly".examination_papers
  `);
  console.log('All papers:', JSON.stringify(papers.rows, null, 2));

  const results = await client.query(`
    SELECT r.id, r.student_id, s.name as student_name, s.rollno, r.paper_id, p.code as paper_code, r.marks_obtained, r.question_marks, r.sub_part_marks, r.practical_mark
    FROM "tenant_srms-cet-bareilly".student_results r
    LEFT JOIN "tenant_srms-cet-bareilly".students s ON r.student_id::text = s.id::text
    LEFT JOIN "tenant_srms-cet-bareilly".examination_papers p ON r.paper_id::text = p.id::text
  `);
  console.log('All results in DB:', JSON.stringify(results.rows, null, 2));

  await client.end();
}

inspectAll().catch(console.error);
