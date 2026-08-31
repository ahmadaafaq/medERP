const { Client } = require('pg');

async function inspectAllSchemas() {
  const client = new Client({
    host: '34.236.107.120',
    port: 5433,
    user: 'unicampus',
    password: 'unicampus_dev@qsd!3ous',
    database: 'unicampus_erp',
  });
  await client.connect();

  const schemasRes = await client.query(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%'
    ORDER BY schema_name;
  `);

  for (const s of schemasRes.rows) {
    const schema = s.schema_name;
    try {
      const papers = await client.query(`
        SELECT p.id, p.code, p.name, p.max_marks, p.passing_marks, p.subject_id, s.name as subject_name, s.code as subject_code
        FROM "${schema}".examination_papers p
        LEFT JOIN "${schema}".subjects s ON p.subject_id::text = s.id::text
      `);
      if (papers.rows.length > 0) {
        console.log(`\n=== Schema: ${schema} (${papers.rows.length} papers) ===`);
        console.table(papers.rows.map(p => ({
          id: p.id,
          code: p.code,
          name: p.name,
          max: p.max_marks,
          pass: p.passing_marks,
          subj: p.subject_name || p.subject_id
        })));
      }

      const results = await client.query(`
        SELECT r.id, r.student_id, st.name as student_name, st.rollno, r.paper_id, p.code as paper_code, p.name as paper_name, r.marks_obtained, r.question_marks, r.practical_mark
        FROM "${schema}".student_results r
        LEFT JOIN "${schema}".students st ON r.student_id::text = st.id::text
        LEFT JOIN "${schema}".examination_papers p ON r.paper_id::text = p.id::text
      `);
      if (results.rows.length > 0) {
        console.log(`--- Results in ${schema}: ${results.rows.length} records ---`);
        console.table(results.rows.map(r => ({
          student: r.student_name,
          rollno: r.rollno,
          paper_code: r.paper_code,
          paper_name: r.paper_name,
          marks_obtained: r.marks_obtained,
          practical: r.practical_mark
        })));
      }
    } catch (e) {
      // Table doesn't exist in schema
    }
  }

  await client.end();
}

inspectAllSchemas().catch(console.error);
