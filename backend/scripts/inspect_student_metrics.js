const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function inspectStudentMetrics() {
  const schema = 'tenant_srms-cet-bareilly';

  console.log('--- 1. STUDENTS WITH REAL DATA ---');
  const stds = await pool.query(`
    SELECT s.id, s.name, s.rollno, s.registration_no, s.course_cd, s.batch_cd, s.branch_cd, s.photo_url, s.is_incubated,
           c.name AS course_name, b.name AS batch_name
    FROM "${schema}".students s
    LEFT JOIN "${schema}".courses c ON c.course_cd = s.course_cd
    LEFT JOIN "${schema}".batches b ON (b.batch_cd = s.batch_cd AND b.course_cd = s.course_cd)
    LIMIT 10
  `);
  console.log('Students:', stds.rows);

  console.log('\n--- 2. REPOSITORIES DATA ---');
  const repos = await pool.query(`
    SELECT r.id, r.student_id, r.title, r.grade, r.evaluation_score, r.is_incubated, r.incubation_status,
           s.name AS student_name, s.rollno
    FROM "${schema}".repositories r
    JOIN "${schema}".students s ON s.id = r.student_id
  `);
  console.log('Repositories count:', repos.rows.length, repos.rows);

  console.log('\n--- 3. EXAM PAPERS & RESULTS ---');
  const papers = await pool.query(`
    SELECT sr.id, sr.student_id, sr.marks_obtained, sr.practical_mark, sr.is_pass,
           ep.title AS paper_title, ep.max_marks,
           s.name AS student_name, s.rollno
    FROM "${schema}".student_results sr
    JOIN "${schema}".students s ON s.id = sr.student_id
    LEFT JOIN "${schema}".examination_papers ep ON ep.id = sr.paper_id
  `);
  console.log('Student results:', papers.rows);

  console.log('\n--- 4. ATTENDANCE TABLE STRUCTURE ---');
  const attCols = await pool.query(`
    SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'attendance_records'
  `, [schema]);
  console.log('attendance_records columns:', attCols.rows.map(c => `${c.column_name} (${c.data_type})`));

  await pool.end();
}

inspectStudentMetrics().catch(console.error);
