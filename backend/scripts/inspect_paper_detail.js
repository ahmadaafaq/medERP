const { Client } = require('pg');

async function checkPaperDetail() {
  const client = new Client({
    host: '34.236.107.120',
    port: 5433,
    user: 'unicampus',
    password: 'unicampus_dev@qsd!3ous',
    database: 'unicampus_erp',
  });
  await client.connect();

  const paper = await client.query(`
    SELECT * FROM "tenant_srms-cet-bareilly".examination_papers
    WHERE code = 'WBTECHPYTHON2026-1' OR id = 'c3d28e51-e5f8-45f8-8d85-d6d7a9d6e17f'
  `);
  console.log('Paper:', JSON.stringify(paper.rows[0], null, 2));

  // Also check all results for all students across all papers
  const allResults = await client.query(`
    SELECT r.*, s.name as student_name, s.rollno, p.code as paper_code, p.name as paper_name, p.max_marks as paper_max
    FROM "tenant_srms-cet-bareilly".student_results r
    LEFT JOIN "tenant_srms-cet-bareilly".students s ON r.student_id::text = s.id::text
    LEFT JOIN "tenant_srms-cet-bareilly".examination_papers p ON r.paper_id::text = p.id::text
  `);
  console.log('All Student Results in DB:', JSON.stringify(allResults.rows, null, 2));

  await client.end();
}

checkPaperDetail().catch(console.error);
