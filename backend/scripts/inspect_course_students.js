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

  const groupStudents = await client.query(`
    SELECT course_cd, batch_cd, count(*) 
    FROM "${schema}".students 
    GROUP BY course_cd, batch_cd
    ORDER BY count(*) DESC
  `);
  console.log('Students grouped by course_cd and batch_cd:');
  console.table(groupStudents.rows);

  const existingSessions = await client.query(`
    SELECT sess.id, sess.session_date, sess.session_type, sess.topic_covered,
           sub.code as sub_cd, sub.name as sub_name,
           sess.timetable_slot_id, ts.course_cd, ts.batch_cd,
           count(rec.id) as marked_students
    FROM "${schema}".attendance_sessions sess
    LEFT JOIN "${schema}".subjects sub ON sub.id = sess.subject_id
    LEFT JOIN "${schema}".timetable_slots ts ON ts.id = sess.timetable_slot_id
    LEFT JOIN "${schema}".attendance_records rec ON rec.session_id = sess.id
    WHERE sess.is_cancelled = false
    GROUP BY sess.id, sess.session_date, sess.session_type, sess.topic_covered, sub.code, sub.name, sess.timetable_slot_id, ts.course_cd, ts.batch_cd
    ORDER BY sess.session_date DESC
  `);
  console.log('Stored sessions in DB with student count:');
  console.table(existingSessions.rows);

  await client.end();
}

run().catch(console.error);
