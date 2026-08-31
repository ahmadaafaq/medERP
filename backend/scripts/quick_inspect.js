const { Client } = require('pg');

async function inspectResults() {
  const client = new Client({
    host: '34.236.107.120', port: 5433, user: 'unicampus',
    password: 'unicampus_dev@qsd!3ous', database: 'unicampus_erp',
  });
  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';

  // All student results with full paper + student info
  const r = await client.query(`
    SELECT 
      r.id as result_id,
      r.student_id, 
      r.paper_id, 
      r.marks_obtained,
      r.practical_mark,
      r.question_marks,
      st.name as student_name, 
      st.rollno,
      p.code as paper_code, 
      p.name as paper_name, 
      p.max_marks as paper_max
    FROM "${schema}".student_results r
    LEFT JOIN "${schema}".students st ON r.student_id::text = st.id::text
    LEFT JOIN "${schema}".examination_papers p ON r.paper_id::text = p.id::text
  `);
  console.log('\n=== ALL STUDENT RESULTS ===');
  if (r.rows.length === 0) {
    console.log('NO results found!');
  } else {
    r.rows.forEach(row => {
      console.log(JSON.stringify(row, null, 2));
    });
  }

  // All exam papers
  const p = await client.query(`
    SELECT id, code, name, max_marks, subject_id, 
           (SELECT name FROM "${schema}".subjects s WHERE s.id::text = examination_papers.subject_id::text LIMIT 1) as subject_name
    FROM "${schema}".examination_papers 
    ORDER BY created_at
  `);
  console.log('\n=== ALL EXAMINATION PAPERS ===');
  console.table(p.rows.map(row => ({
    id: row.id,
    code: row.code,
    name: row.name,
    max_marks: row.max_marks,
    subject: row.subject_name || row.subject_id
  })));

  await client.end();
}

inspectResults().catch(console.error);
