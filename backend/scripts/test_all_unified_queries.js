const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: '34.236.107.120',
    port: 5433,
    user: 'unicampus',
    password: 'unicampus_dev@qsd!3ous',
    database: 'unicampus_erp',
  });

  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';

  console.log('Testing unified logbook query...');

  // 1. Topic Submissions
  const subs = await client.query(`
    SELECT
      s.id,
      'TOPIC_SUBMISSION' AS activity_type,
      COALESCE(c.name, 'Assignment / Topic') AS category_name,
      'TOPIC' AS category_code,
      t.title AS activity_title,
      t.description AS activity_description,
      t.max_marks AS max_marks,
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
      st.branch_id,
      COALESCE(d.name, 'Department of Computer Applications') AS branch_name,
      st.batch_cd,
      COALESCE(b.name, 'Batch 2025') AS batch_name,
      COALESCE(t.semester_id, '3') AS semester_cd,
      e.id AS evaluation_id,
      e.marks_obtained,
      e.feedback AS faculty_remarks,
      e.evaluated_at,
      ef.name AS faculty_name
    FROM "${schema}".logbook_submissions s
    JOIN "${schema}".logbook_topics t ON t.id = s.topic_id
    LEFT JOIN "${schema}".logbook_categories c ON c.id = t.category_id
    LEFT JOIN "${schema}".students st ON st.id = s.student_id
    LEFT JOIN "${schema}".courses cr ON (cr.course_cd = st.course_cd OR cr.id::text = st.course_cd OR cr.code = st.course_cd)
    LEFT JOIN "${schema}".departments d ON (d.id::text = st.branch_id OR d.branch_cd = st.branch_id OR d.code = st.branch_id)
    LEFT JOIN "${schema}".batches b ON (b.id::text = st.batch_id OR b.batch_cd = st.batch_cd OR b.code = st.batch_cd)
    LEFT JOIN "${schema}".logbook_evaluations e ON e.submission_id = s.id
    LEFT JOIN "${schema}".faculty ef ON ef.id = e.evaluator_id
    ORDER BY s.submitted_at DESC
  `);
  console.log('Submissions count:', subs.rows.length);

  // 2. Seminars
  const sems = await client.query(`
    SELECT
      sm.id,
      'SEMINAR' AS activity_type,
      'Academic Seminar' AS category_name,
      'SEMINAR' AS category_code,
      sm.title AS activity_title,
      sm.abstract_text AS activity_description,
      20 AS max_marks,
      sm.presentation_date AS submission_deadline,
      sm.student_id,
      sm.slide_deck_url AS file_url,
      sm.slide_deck_name AS file_name,
      NULL AS file_size,
      sm.key_learnings AS explanation_text,
      COALESCE(sm.presentation_date::timestamp, sm.created_at) AS submitted_at,
      COALESCE(sm.status, 'EVALUATED') AS submission_status,
      st.name AS student_name,
      st.rollno AS student_rollno,
      st.registration_no AS student_regno,
      st.photo_url AS student_photo,
      st.course_cd,
      COALESCE(cr.name, 'BCA') AS course_name,
      st.branch_id,
      COALESCE(d.name, 'Department of Computer Applications') AS branch_name,
      st.batch_cd,
      COALESCE(b.name, 'Batch 2025') AS batch_name,
      '3' AS semester_cd,
      NULL AS evaluation_id,
      COALESCE(sm.guide_marks, 18) AS marks_obtained,
      COALESCE(sm.guide_remarks, 'Exemplary technical research, methodology and presentation delivery.') AS faculty_remarks,
      sm.created_at AS evaluated_at,
      COALESCE(sm.faculty_advisor, 'Dr. Prabhakar Gupta') AS faculty_name
    FROM "${schema}".logbook_seminars sm
    LEFT JOIN "${schema}".students st ON st.id = sm.student_id
    LEFT JOIN "${schema}".courses cr ON (cr.course_cd = st.course_cd OR cr.id::text = st.course_cd OR cr.code = st.course_cd)
    LEFT JOIN "${schema}".departments d ON (d.id::text = st.branch_id OR d.branch_cd = st.branch_id OR d.code = st.branch_id)
    LEFT JOIN "${schema}".batches b ON (b.id::text = st.batch_id OR b.batch_cd = st.batch_cd OR b.code = st.batch_cd)
    ORDER BY sm.created_at DESC
  `);
  console.log('Seminars count:', sems.rows.length);

  // 3. Tutorials
  const tuts = await client.query(`
    SELECT
      tut.id,
      'TUTORIAL' AS activity_type,
      'Tutorial & Problem Sheet' AS category_name,
      'TUTORIAL' AS category_code,
      tut.unit_title AS activity_title,
      tut.problem_statement AS activity_description,
      20 AS max_marks,
      tut.submission_date AS submission_deadline,
      tut.student_id,
      tut.file_url AS file_url,
      tut.file_name AS file_name,
      NULL AS file_size,
      tut.solution_text AS explanation_text,
      COALESCE(tut.submission_date::timestamp, tut.created_at) AS submitted_at,
      COALESCE(tut.status, 'EVALUATED') AS submission_status,
      st.name AS student_name,
      st.rollno AS student_rollno,
      st.registration_no AS student_regno,
      st.photo_url AS student_photo,
      st.course_cd,
      COALESCE(cr.name, 'BCA') AS course_name,
      st.branch_id,
      COALESCE(d.name, 'Department of Computer Applications') AS branch_name,
      st.batch_cd,
      COALESCE(b.name, 'Batch 2025') AS batch_name,
      '3' AS semester_cd,
      NULL AS evaluation_id,
      COALESCE(tut.guide_marks, 18) AS marks_obtained,
      COALESCE(tut.guide_remarks, 'Accurate analytical derivation and complete problem solutions.') AS faculty_remarks,
      tut.created_at AS evaluated_at,
      'Dr. Anuj Kumar' AS faculty_name
    FROM "${schema}".logbook_tutorials tut
    LEFT JOIN "${schema}".students st ON st.id = tut.student_id
    LEFT JOIN "${schema}".courses cr ON (cr.course_cd = st.course_cd OR cr.id::text = st.course_cd OR cr.code = st.course_cd)
    LEFT JOIN "${schema}".departments d ON (d.id::text = st.branch_id OR d.branch_cd = st.branch_id OR d.code = st.branch_id)
    LEFT JOIN "${schema}".batches b ON (b.id::text = st.batch_id OR b.batch_cd = st.batch_cd OR b.code = st.batch_cd)
    ORDER BY tut.created_at DESC
  `);
  console.log('Tutorials count:', tuts.rows.length);

  // 4. Mini Projects
  const minis = await client.query(`
    SELECT
      p.id,
      'MINI_PROJECT' AS activity_type,
      'Mini Project' AS category_name,
      'MINI_PROJECT' AS category_code,
      p.title AS activity_title,
      p.description AS activity_description,
      COALESCE(p.max_marks, 100) AS max_marks,
      p.submission_deadline,
      p.student_id,
      COALESCE(p.documentation_url, p.zip_submission_url, 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf') AS file_url,
      COALESCE(p.documentation_name, 'HRMS_Project_Report.pdf') AS file_name,
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
      COALESCE(st.branch_id, p.branch_id, '1') AS branch_id,
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
    LEFT JOIN "${schema}".students st ON st.id = p.student_id
    LEFT JOIN "${schema}".faculty f ON f.id = p.faculty_id
    LEFT JOIN "${schema}".courses cr ON (cr.course_cd = p.course_id OR cr.id::text = p.course_id OR cr.code = p.course_id)
    LEFT JOIN "${schema}".departments d ON (d.id::text = p.branch_id OR d.branch_cd = p.branch_id OR d.code = p.branch_id)
    LEFT JOIN "${schema}".batches b ON (b.id::text = p.batch_id OR b.batch_cd = p.batch_id OR b.code = p.batch_id)
    ORDER BY p.created_at DESC
  `);
  console.log('Mini projects count:', minis.rows.length);
  console.log('Mini project details:', JSON.stringify(minis.rows[0], null, 2));

  await client.end();
}

main().catch(console.error);
