const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function testAllTopicsForAnyStudent() {
  const schema = 'tenant_srms-cet-bareilly';
  
  // 1. Fetch topics for a B.Pharm student
  const student = {
    id: '3a25b743-473d-495b-9fad-8a5adaf11b4f',
    user_id: 'a2feb1ce-82dd-4684-b1e9-41d91eb88728',
    course_cd: '2',
    batch_cd: '18'
  };

  const sql = `
    SELECT t.id, t.title, t.description, t.submission_deadline, t.max_marks,
           t.course_id, t.branch_id, t.batch_id, t.semester_id, t.is_active, t.created_at,
           c.id AS category_id, c.name AS category_name, c.code AS category_code,
           f.id AS faculty_id, COALESCE(f.name, 'Faculty') AS faculty_name,
           cr.name AS course_name,
           COALESCE(b.name, CASE WHEN b.year IS NOT NULL THEN 'Batch ' || b.year::text ELSE NULL END, t.batch_id) AS batch_name,
           (SELECT COUNT(*) FROM "${schema}".logbook_submissions s WHERE s.topic_id = t.id) AS submission_count,
           (SELECT COUNT(*) FROM "${schema}".logbook_submissions s WHERE s.topic_id = t.id AND s.status = 'EVALUATED') AS evaluated_count,
           (
             SELECT json_build_object(
               'id', sub.id,
               'status', sub.status,
               'submitted_at', sub.submitted_at,
               'file_url', sub.file_url,
               'file_name', sub.file_name,
               'file_size', sub.file_size,
               'explanation_text', sub.explanation_text,
               'marks_obtained', ev.marks_obtained,
               'remarks', ev.remarks,
               'evaluated_at', ev.evaluated_at
             )
             FROM "${schema}".logbook_submissions sub
             LEFT JOIN "${schema}".logbook_evaluations ev ON ev.submission_id = sub.id
             WHERE sub.topic_id = t.id AND (sub.student_id::text = $1 OR sub.student_id::text = $2)
             LIMIT 1
           ) AS student_submission
    FROM "${schema}".logbook_topics t
    LEFT JOIN "${schema}".logbook_categories c ON c.id = t.category_id
    LEFT JOIN "${schema}".faculty f ON f.id = t.faculty_id
    LEFT JOIN "${schema}".courses cr ON cr.course_cd = t.course_id
    LEFT JOIN "${schema}".batches b ON (b.id::text = t.batch_id OR (b.batch_cd = t.batch_id AND b.course_cd = t.course_id))
    WHERE t.is_active = true
    ORDER BY t.created_at DESC
  `;

  const res = await pool.query(sql, [student.id, student.user_id]);
  console.log(`Returned ${res.rows.length} topics for student ${student.id}:`);
  res.rows.forEach(r => {
    console.log(`- ${r.title} | Status: ${r.student_submission?.status || 'PENDING'} | Course: ${r.course_name || r.course_id}`);
  });

  await pool.end();
}

testAllTopicsForAnyStudent();
