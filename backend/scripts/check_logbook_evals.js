const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function checkLogbookData() {
  const schema = 'tenant_srms-cet-bareilly';
  const topics = await pool.query(`SELECT COUNT(*) FROM "${schema}".logbook_topics`);
  const subs = await pool.query(`SELECT COUNT(*) FROM "${schema}".logbook_submissions`);
  const evals = await pool.query(`SELECT COUNT(*) FROM "${schema}".logbook_evaluations`);
  const cats = await pool.query(`SELECT id, name FROM "${schema}".logbook_categories`);

  console.log('Categories:', cats.rows);
  console.log('Topics count:', topics.rows[0].count);
  console.log('Submissions count:', subs.rows[0].count);
  console.log('Evaluations count:', evals.rows[0].count);

  const testQuery = await pool.query(`
    SELECT
      s.id as "studentId",
      COALESCE(s.name, s.first_name || ' ' || COALESCE(s.last_name, ''), 'Student') as "studentName",
      COALESCE(s.roll_number, s.enrollment_no, s.rollno, 'N/A') as "rollNo",
      COALESCE(c.course_name, c.name, 'Undergraduate') as "courseName",
      COUNT(DISTINCT sub.id)::int as "totalActivities",
      ROUND(AVG((ev.marks_obtained / NULLIF(top.max_marks, 0)) * 100), 1) as "performancePct"
    FROM "${schema}".logbook_evaluations ev
    JOIN "${schema}".logbook_submissions sub ON sub.id = ev.submission_id
    JOIN "${schema}".logbook_topics top ON top.id = sub.topic_id
    LEFT JOIN "${schema}".students s ON s.id = sub.student_id
    LEFT JOIN "${schema}".courses c ON c.id = top.course_id
    GROUP BY s.id, s.name, s.first_name, s.last_name, s.roll_number, s.enrollment_no, s.rollno, c.course_name, c.name
  `);

  console.log('Leaderboard test query rows:', testQuery.rows);

  await pool.end();
}

checkLogbookData();
