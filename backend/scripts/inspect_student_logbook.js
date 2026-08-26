const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function inspectStudentAndTopics() {
  const schema = 'tenant_srms-cet-bareilly';
  const students = await pool.query(`SELECT id, user_id, name, rollno, registration_no, course_cd, course_id, batch_cd, batch_id, current_semester FROM "${schema}".students LIMIT 5`);
  console.log('Sample Students:', students.rows);

  const topics = await pool.query(`SELECT id, title, course_id, branch_id, batch_id, semester_id, is_active FROM "${schema}".logbook_topics`);
  console.log('Topics in DB:', topics.rows);

  await pool.end();
}

inspectStudentAndTopics();
