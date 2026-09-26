const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || '34.236.107.120',
  port: Number(process.env.DB_PORT) || 5433,
  user: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || 'unicampus_dev@qsd!3ous',
  database: process.env.DB_NAME || 'unicampus_erp',
});

async function run() {
  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';

  console.log('1. Students in database:');
  const stdCount = await client.query(`SELECT count(*) FROM "${schema}".students`);
  console.log('Total students:', stdCount.rows[0].count);

  const stdByCourse = await client.query(`
    SELECT course_cd, branch_cd, batch_cd, semester, section, count(*) 
    FROM "${schema}".students 
    GROUP BY course_cd, branch_cd, batch_cd, semester, section
    ORDER BY count(*) DESC
    LIMIT 10
  `);
  console.table(stdByCourse.rows);

  console.log('2. Sample student records:');
  const sample = await client.query(`SELECT id, name, rollno, registration_no, course_cd, branch_cd, batch_cd, semester, section FROM "${schema}".students LIMIT 5`);
  console.table(sample.rows);

  console.log('3. Attendance Sessions and records count in DB:');
  const sess = await client.query(`
    SELECT s.id, s.session_date, s.session_type, s.topic_covered, s.timetable_slot_id,
           sub.code as sub_cd, sub.name as sub_name,
           (SELECT count(*) FROM "${schema}".attendance_records r WHERE r.session_id = s.id) as marked_count
    FROM "${schema}".attendance_sessions s
    LEFT JOIN "${schema}".subjects sub ON sub.id = s.subject_id
    ORDER BY s.session_date DESC
  `);
  console.table(sess.rows);

  await client.end();
}

run().catch(console.error);
