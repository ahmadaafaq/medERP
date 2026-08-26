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

  const att = await pool.query(`SELECT * FROM "${schema}".attendance_records LIMIT 10`);
  console.log('attendance_records:', att.rows);

  const sess = await pool.query(`SELECT * FROM "${schema}".attendance_sessions LIMIT 10`);
  console.log('attendance_sessions:', sess.rows);

  const studentsWithAtt = await pool.query(`
    SELECT id, name, rollno, registration_no, course_cd, batch_cd
    FROM "${schema}".students
    ORDER BY name
    LIMIT 20
  `);
  console.log('Students count:', studentsWithAtt.rows.length, studentsWithAtt.rows);

  await pool.end();
}

run().catch(console.error);
