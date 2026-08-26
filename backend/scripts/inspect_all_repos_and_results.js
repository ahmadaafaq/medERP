const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function run() {
  const schema = 'tenant_srms-cet-bareilly';

  console.log('=== ALL REPOSITORIES IN DB ===');
  const repos = await pool.query(`
    SELECT repo_id, student_reg_no, student_name, course_cd, batch_cd, title, score, grade, incubation_status, is_placement_eligible
    FROM "${schema}".repositories
    ORDER BY score DESC
  `);
  console.log(repos.rows);

  console.log('\n=== ALL STUDENT RESULTS IN DB ===');
  const results = await pool.query(`
    SELECT sr.id, sr.student_id, sr.marks_obtained, sr.practical_mark, sr.is_pass, sr.eval_status,
           s.name AS student_name, s.rollno, s.registration_no, s.course_cd, s.batch_cd,
           ep.title AS paper_title, ep.max_marks, ep.passing_marks
    FROM "${schema}".student_results sr
    LEFT JOIN "${schema}".students s ON s.id = sr.student_id
    LEFT JOIN "${schema}".examination_papers ep ON ep.id = sr.paper_id
  `);
  console.log(results.rows);

  await pool.end();
}

run().catch(console.error);
