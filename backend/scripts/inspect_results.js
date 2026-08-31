const { Client } = require('pg');

async function checkResults() {
  const client = new Client({
    host: '34.236.107.120',
    port: 5433,
    user: 'unicampus',
    password: 'unicampus_dev@qsd!3ous',
    database: 'unicampus_erp',
  });
  await client.connect();

  const res = await client.query(`
    SELECT 
      r.id, 
      r.student_id, 
      s.name as student_name, 
      s.rollno, 
      s.registration_no,
      r.paper_id, 
      p.name as paper_name, 
      p.code as paper_code, 
      p.max_marks as paper_max_marks,
      r.marks_obtained, 
      r.question_marks,
      r.sub_part_marks,
      r.created_at
    FROM "tenant_srms-cet-bareilly".student_results r
    LEFT JOIN "tenant_srms-cet-bareilly".students s ON r.student_id::text = s.id::text
    LEFT JOIN "tenant_srms-cet-bareilly".examination_papers p ON r.paper_id::text = p.id::text
    ORDER BY r.created_at DESC;
  `);

  console.log('Results in tenant_srms-cet-bareilly:', JSON.stringify(res.rows, null, 2));

  // Also check all examination papers
  const papers = await client.query(`
    SELECT id, code, name, subject_id, max_marks, passing_marks 
    FROM "tenant_srms-cet-bareilly".examination_papers
    ORDER BY created_at DESC;
  `);
  console.log('Papers in tenant_srms-cet-bareilly:', JSON.stringify(papers.rows, null, 2));

  await client.end();
}

checkResults().catch(console.error);
