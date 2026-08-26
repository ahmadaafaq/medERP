const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function checkLeaderboard() {
  const schema = 'tenant_srms-cet-bareilly';
  const rawSql = `
    WITH evaluated_data AS (
      SELECT s.student_id,
             st.name AS student_name,
             st.rollno,
             st.registration_no,
             st.photo_url,
             st.course_cd,
             st.batch_cd,
             COALESCE(cr.name, 'Undergraduate Engineering') AS course_name,
             COALESCE(b.name, 'Batch 2025') AS batch_name,
             t.category_id,
             c.name AS category_name,
             e.marks_obtained,
             t.max_marks,
             ROUND((e.marks_obtained / NULLIF(t.max_marks, 0)) * 100, 2) AS score_pct
      FROM "${schema}".logbook_submissions s
      JOIN "${schema}".logbook_topics t ON t.id = s.topic_id
      LEFT JOIN "${schema}".logbook_categories c ON c.id = t.category_id
      JOIN "${schema}".logbook_evaluations e ON e.submission_id = s.id
      JOIN "${schema}".students st ON st.id::text = s.student_id::text
      LEFT JOIN "${schema}".courses cr ON (cr.course_cd = st.course_cd OR cr.id::text = t.course_id::text)
      LEFT JOIN "${schema}".batches b ON (b.id::text = st.batch_id::text OR b.id::text = t.batch_id::text OR b.batch_cd = st.batch_cd)
      WHERE s.status = 'EVALUATED'
    )
    SELECT student_id, student_name, rollno, registration_no, photo_url, course_name, batch_name,
           COUNT(*) AS total_evaluated_activities,
           SUM(marks_obtained) AS total_marks_obtained,
           SUM(max_marks) AS total_max_marks,
           ROUND((SUM(marks_obtained) / NULLIF(SUM(max_marks), 0)) * 100, 1) AS overall_performance_pct,
           MAX(score_pct) AS peak_activity_pct,
           json_agg(
             json_build_object(
               'category_name', category_name,
               'marks_obtained', marks_obtained,
               'max_marks', max_marks,
               'score_pct', score_pct
             )
           ) AS category_breakdown
    FROM evaluated_data
    GROUP BY student_id, student_name, rollno, registration_no, photo_url, course_name, batch_name
    ORDER BY overall_performance_pct DESC, total_evaluated_activities DESC
    LIMIT 20;
  `;

  const res = await pool.query(rawSql);
  console.log('Leaderboard count:', res.rows.length);
  console.log('Leaderboard sample row:', res.rows[0]);
  await pool.end();
}

checkLeaderboard();
