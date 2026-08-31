const { Client } = require('pg');
async function check() {
  const client = new Client({ host: '34.236.107.120', port: 5433, user: 'unicampus', password: 'unicampus_dev@qsd!3ous', database: 'unicampus_erp' });
  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';

  // Check ALL results in DB
  const all = await client.query(`
    SELECT r.id, st.name as student_name, st.rollno, 
           p.name as paper_name, p.code as paper_code,
           r.marks_obtained, r.practical_mark
    FROM "${schema}".student_results r
    LEFT JOIN "${schema}".students st ON r.student_id::text = st.id::text
    LEFT JOIN "${schema}".examination_papers p ON r.paper_id::text = p.id::text
    ORDER BY st.name
  `);
  
  console.log(`Total records in student_results: ${all.rows.length}`);
  if (all.rows.length > 0) {
    console.table(all.rows);
  } else {
    console.log('✅ student_results table is EMPTY — no results exist for any student.');
  }

  // Check specifically for Unit Test First Sessional paper
  const paper = await client.query(`
    SELECT id, code, name, max_marks FROM "${schema}".examination_papers 
    WHERE name ILIKE '%Unit Test First Sessional%'
       OR code ILIKE '%WBTECHPYTHON%'
  `);
  console.log('\nUnit Test First Sessional paper(s):');
  console.table(paper.rows);

  await client.end();
}
check().catch(console.error);
