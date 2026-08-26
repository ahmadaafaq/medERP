const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function testStudentTopicDiscovery() {
  const schema = 'tenant_srms-cet-bareilly';
  
  // Pick first student
  const stRes = await pool.query(`SELECT id, user_id, name, rollno, course_cd, batch_cd, batch_id, branch_id FROM "${schema}".students LIMIT 1`);
  const student = stRes.rows[0];
  console.log('Testing with student:', student);

  const topicsRes = await pool.query(`SELECT id, title, course_id, batch_id, branch_id, semester_id, is_active FROM "${schema}".logbook_topics`);
  console.log('All topics in DB:', topicsRes.rows);

  const matchedSql = `
    SELECT t.id, t.title, t.description, t.submission_deadline, t.max_marks,
           t.course_id, t.branch_id, t.batch_id, t.semester_id, t.is_active,
           c.name as category_name,
           (
             SELECT json_build_object(
               'id', sub.id,
               'status', sub.status,
               'submitted_at', sub.submitted_at,
               'marks_obtained', ev.marks_obtained,
               'remarks', ev.remarks
             )
             FROM "${schema}".logbook_submissions sub
             LEFT JOIN "${schema}".logbook_evaluations ev ON ev.submission_id = sub.id
             WHERE sub.topic_id = t.id AND (sub.student_id::text = $1::text)
             LIMIT 1
           ) as student_submission
    FROM "${schema}".logbook_topics t
    LEFT JOIN "${schema}".logbook_categories c ON c.id = t.category_id
    WHERE t.is_active = true
      AND (t.course_id IS NULL OR t.course_id = 'all' OR t.course_id = $2 OR t.course_id = $3)
      AND (t.batch_id IS NULL OR t.batch_id = 'all' OR t.batch_id = $4 OR t.batch_id = $5)
  `;

  const matched = await pool.query(matchedSql, [
    student.id,
    student.course_cd || '',
    '13', // BCA code
    student.batch_cd || '',
    student.batch_id ? student.batch_id.toString() : ''
  ]);

  console.log('Matched topics for student count:', matched.rows.length);
  console.log('Matched topics sample:', matched.rows[0]);

  await pool.end();
}

testStudentTopicDiscovery();
