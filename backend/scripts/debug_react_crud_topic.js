const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function debugStudentTopics() {
  const schema = 'tenant_srms-cet-bareilly';
  
  // 1. Get the topic created in the screenshot
  const topicRes = await pool.query(`SELECT * FROM "${schema}".logbook_topics WHERE title ILIKE '%React Crud%'`);
  console.log('React Crud Topic in DB:', topicRes.rows[0]);

  // 2. Get students in the database
  const students = await pool.query(`SELECT id, user_id, name, rollno, course_cd, batch_cd, branch_id FROM "${schema}".students`);
  console.log(`Total students in ${schema}:`, students.rows.length);
  console.log('Sample students:', students.rows.slice(0, 5));

  // 3. Check what query in logbook.service.ts returned:
  const t = topicRes.rows[0];
  console.log('Topic course_id:', t.course_id, 'batch_id:', t.batch_id, 'branch_id:', t.branch_id, 'semester_id:', t.semester_id, 'is_active:', t.is_active);

  await pool.end();
}

debugStudentTopics();
