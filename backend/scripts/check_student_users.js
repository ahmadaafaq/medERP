const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function checkAllStudents() {
  const schema = 'tenant_srms-cet-bareilly';
  
  // Group students by course_cd and batch_cd
  const groupRes = await pool.query(`
    SELECT course_cd, batch_cd, COUNT(*) as student_count
    FROM "${schema}".students
    GROUP BY course_cd, batch_cd
  `);
  console.log('Student breakdown by course and batch:', groupRes.rows);

  // Check auth users linked to students
  const usersRes = await pool.query(`
    SELECT u.id as user_id, u.email, u.name, u.role, s.id as student_id, s.course_cd, s.batch_cd
    FROM "${schema}".users u
    LEFT JOIN "${schema}".students s ON s.user_id = u.id OR s.id = u.id
    WHERE u.role = 'STUDENT' OR u.role ILIKE '%student%'
    LIMIT 10
  `);
  console.log('Sample STUDENT users:', usersRes.rows);

  await pool.end();
}

checkAllStudents();
