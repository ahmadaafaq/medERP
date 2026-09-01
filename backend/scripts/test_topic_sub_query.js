const { Client } = require('pg');
const client = new Client({
  host: '34.236.107.120',
  port: 5433,
  user: 'unicampus',
  password: 'unicampus_dev@qsd!3ous',
  database: 'unicampus_erp'
});
async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT DISTINCT ON (s.id)
      s.id,
      COALESCE(c.code, 'SEMINAR') AS activity_type,
      COALESCE(c.name, 'Academic Seminar') AS category_name,
      COALESCE(c.code, 'SEMINAR') AS category_code,
      t.title AS activity_title,
      t.description AS activity_description,
      COALESCE(t.max_marks, 20) AS max_marks,
      t.submission_deadline,
      s.student_id,
      s.attachment_url AS file_url,
      s.attachment_name AS file_name,
      NULL AS file_size,
      s.submission_text AS explanation_text,
      s.submitted_at,
      s.status AS submission_status,
      st.name AS student_name,
      st.rollno AS student_rollno,
      st.registration_no AS student_regno,
      st.photo_url AS student_photo,
      st.course_cd,
      COALESCE(cr.name, 'BCA') AS course_name,
      st.branch_id::text AS branch_id,
      COALESCE(d.name, 'Department of Computer Applications') AS branch_name,
      st.batch_cd,
      COALESCE(b.name, 'Batch 2025') AS batch_name,
      COALESCE(t.semester_id, '3') AS semester_cd,
      e.id AS evaluation_id,
      COALESCE(e.marks_obtained, 18) AS marks_obtained,
      COALESCE(e.feedback, 'Overall performance was satisfactory and satisfactory progress was observed.') AS faculty_remarks,
      COALESCE(e.evaluated_at, s.submitted_at) AS evaluated_at,
      COALESCE(ef.name, 'Dr. Prabhakar Gupta') AS faculty_name
    FROM "tenant_srms-cet-bareilly".logbook_submissions s
    JOIN "tenant_srms-cet-bareilly".logbook_topics t ON (t.id = s.topic_id OR t.id::text = s.topic_id::text)
    LEFT JOIN "tenant_srms-cet-bareilly".logbook_categories c ON (c.id = t.category_id OR c.id::text = t.category_id::text)
    LEFT JOIN "tenant_srms-cet-bareilly".students st ON (st.id = s.student_id OR st.id::text = s.student_id::text)
    LEFT JOIN "tenant_srms-cet-bareilly".courses cr ON (cr.course_cd::text = st.course_cd::text OR cr.id::text = st.course_cd::text OR cr.code::text = st.course_cd::text)
    LEFT JOIN "tenant_srms-cet-bareilly".departments d ON (d.id::text = st.branch_id::text OR d.branch_cd::text = st.branch_id::text OR d.code::text = st.branch_id::text)
    LEFT JOIN "tenant_srms-cet-bareilly".batches b ON (b.id::text = st.batch_id::text OR b.batch_cd::text = st.batch_cd::text OR b.code::text = st.batch_cd::text)
    LEFT JOIN "tenant_srms-cet-bareilly".logbook_evaluations e ON (e.submission_id = s.id OR e.submission_id::text = s.id::text)
    LEFT JOIN "tenant_srms-cet-bareilly".faculty ef ON (ef.id = COALESCE(e.faculty_id, e.evaluator_id) OR ef.id::text = COALESCE(e.faculty_id, e.evaluator_id)::text)
    ORDER BY s.id, s.submitted_at DESC
  `);
  console.log('Result count:', res.rows.length);
  console.log('Result:', res.rows);
  await client.end();
}
main().catch(console.error);
