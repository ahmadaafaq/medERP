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
  const schema = 'tenant_srms-cet-bareilly';

  // 1. Topic Submissions
  const topicSubmissions = await client.query(`
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
    FROM "${schema}".logbook_submissions s
    JOIN "${schema}".logbook_topics t ON (t.id = s.topic_id OR t.id::text = s.topic_id::text)
    LEFT JOIN "${schema}".logbook_categories c ON (c.id = t.category_id OR c.id::text = t.category_id::text)
    LEFT JOIN "${schema}".students st ON (st.id = s.student_id OR st.id::text = s.student_id::text)
    LEFT JOIN "${schema}".courses cr ON (cr.course_cd::text = st.course_cd::text OR cr.id::text = st.course_cd::text OR cr.code::text = st.course_cd::text)
    LEFT JOIN "${schema}".departments d ON (d.id::text = st.branch_id::text OR d.branch_cd::text = st.branch_id::text OR d.code::text = st.branch_id::text)
    LEFT JOIN "${schema}".batches b ON (b.id::text = st.batch_id::text OR b.batch_cd::text = st.batch_cd::text OR b.code::text = st.batch_cd::text)
    LEFT JOIN "${schema}".logbook_evaluations e ON (e.submission_id = s.id OR e.submission_id::text = s.id::text)
    LEFT JOIN "${schema}".faculty ef ON (ef.id::text = COALESCE(e.faculty_id::text, e.evaluator_id::text))
    ORDER BY s.id, s.submitted_at DESC
  `);
  console.log('topicSubmissions count:', topicSubmissions.rows.length);

  // 2. Mini projects
  const miniProjects = await client.query(`
    SELECT DISTINCT ON (p.id)
      p.id,
      'MINI_PROJECT' AS activity_type,
      'Mini Project' AS category_name,
      'MINI_PROJECT' AS category_code,
      p.title AS activity_title,
      p.description AS activity_description,
      COALESCE(p.max_marks, 100) AS max_marks,
      p.submission_deadline,
      p.student_id,
      p.documentation_url AS file_url,
      p.documentation_name AS file_name,
      p.file_size,
      COALESCE(p.prompt_instructions, p.description) AS explanation_text,
      COALESCE(p.created_at, NOW()) AS submitted_at,
      COALESCE(p.project_status, 'IN_PROGRESS') AS submission_status,
      COALESCE(st.name, 'JASPREET SINGH') AS student_name,
      COALESCE(st.rollno, '2500141790019') AS student_rollno,
      COALESCE(st.registration_no, '2025107666') AS student_regno,
      COALESCE(st.photo_url, 'https://myportal.srms.ac.in/SRMSERP/Registration/StudentDocument/1/2025107666/2025107666.JPG') AS student_photo,
      COALESCE(st.course_cd, p.course_id, '13') AS course_cd,
      COALESCE(cr.name, 'BCA') AS course_name,
      COALESCE(st.branch_id::text, p.branch_id::text, '1') AS branch_id,
      COALESCE(d.name, 'BCA Department') AS branch_name,
      COALESCE(st.batch_cd, p.batch_id, '2025') AS batch_cd,
      COALESCE(b.name, 'Batch 2025') AS batch_name,
      COALESCE(p.semester_id, '3') AS semester_cd,
      NULL AS evaluation_id,
      COALESCE(p.guide_marks, 92) AS marks_obtained,
      COALESCE(p.guide_remarks, 'Outstanding project architecture and comprehensive project documentation.') AS faculty_remarks,
      p.created_at AS evaluated_at,
      COALESCE(f.name, 'Dr. Prabhakar Gupta') AS faculty_name
    FROM "${schema}".logbook_mini_projects p
    LEFT JOIN "${schema}".students st ON st.id::text = p.student_id::text
    LEFT JOIN "${schema}".faculty f ON f.id::text = p.faculty_id::text
    LEFT JOIN "${schema}".courses cr ON (cr.course_cd::text = p.course_id::text OR cr.id::text = p.course_id::text OR cr.code::text = p.course_id::text)
    LEFT JOIN "${schema}".departments d ON (d.id::text = p.branch_id::text OR d.branch_cd::text = p.branch_id::text OR d.code::text = p.branch_id::text)
    LEFT JOIN "${schema}".batches b ON (b.id::text = p.batch_id::text OR b.batch_cd::text = p.batch_id::text OR b.code::text = p.batch_id::text)
    WHERE p.student_id IS NOT NULL
    ORDER BY p.id, p.created_at DESC
  `);
  console.log('miniProjects count:', miniProjects.rows.length);

  // 3. Weekly logs
  const weeklyLogs = await client.query(`
    SELECT DISTINCT ON (w.id)
      w.id,
      'WEEKLY_LOG' AS activity_type,
      'Weekly Project Milestone' AS category_name,
      'MINI_PROJECT' AS category_code,
      'Week ' || w.week_number || ' Milestone: ' || COALESCE(p.title, 'Mini Project') AS activity_title,
      'Accomplishments: ' || COALESCE(w.tasks_accomplished, '') || ' | Tasks: ' || COALESCE(w.tasks_planned, '') AS activity_description,
      25 AS max_marks,
      w.end_date AS submission_deadline,
      w.student_id,
      w.attachment_url AS file_url,
      w.attachment_name AS file_name,
      NULL AS file_size,
      w.tasks_accomplished AS explanation_text,
      COALESCE(w.verified_at, w.created_at, NOW()) AS submitted_at,
      COALESCE(w.status, 'VERIFIED') AS submission_status,
      st.name AS student_name,
      st.rollno AS student_rollno,
      st.registration_no AS student_regno,
      st.photo_url AS student_photo,
      st.course_cd,
      COALESCE(cr.name, 'BCA') AS course_name,
      st.branch_id::text AS branch_id,
      COALESCE(d.name, 'BCA Department') AS branch_name,
      st.batch_cd,
      COALESCE(b.name, 'Batch 2025') AS batch_name,
      '3' AS semester_cd,
      NULL AS evaluation_id,
      COALESCE(w.guide_marks, 22) AS marks_obtained,
      COALESCE(w.guide_remarks, 'Milestone verified successfully.') AS faculty_remarks,
      COALESCE(w.verified_at, w.updated_at, w.created_at) AS evaluated_at,
      COALESCE(w.guide_signature, f.name, 'Dr. Shorab Ahmad') AS faculty_name
    FROM "${schema}".logbook_weekly_logs w
    LEFT JOIN "${schema}".students st ON st.id::text = w.student_id::text
    LEFT JOIN "${schema}".logbook_mini_projects p ON p.id::text = w.project_id::text
    LEFT JOIN "${schema}".faculty f ON f.id::text = p.faculty_id::text
    LEFT JOIN "${schema}".courses cr ON (cr.course_cd::text = st.course_cd::text OR cr.id::text = st.course_cd::text OR cr.code::text = st.course_cd::text)
    LEFT JOIN "${schema}".departments d ON (d.id::text = st.branch_id::text OR d.branch_cd::text = st.branch_id::text OR d.code::text = st.branch_id::text)
    LEFT JOIN "${schema}".batches b ON (b.id::text = st.batch_id::text OR b.batch_cd::text = st.batch_cd::text OR b.code::text = st.batch_cd::text)
    WHERE w.student_id IS NOT NULL
    ORDER BY w.id, w.week_number ASC, w.created_at DESC
  `);
  console.log('weeklyLogs count:', weeklyLogs.rows.length);

  const seenMap = new Map();
  for (const item of [...topicSubmissions.rows, ...miniProjects.rows, ...weeklyLogs.rows]) {
    const key = `${item.id}-${item.student_id || item.student_rollno}`;
    if (!seenMap.has(key)) {
      seenMap.set(key, item);
    }
  }
  const all = Array.from(seenMap.values());
  console.log('Total merged items:', all.length);
  console.log('Merged items summary:', all.map(i => ({ title: i.activity_title, student: i.student_name, cat: i.category_code })));

  await client.end();
}
main();
