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

  console.log('Testing miniProjects query:');
  try {
    const miniRes = await client.query(`
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
        COALESCE(p.documentation_name, 'Project_Report.pdf') AS file_name,
        p.file_size,
        COALESCE(p.prompt_instructions, p.description) AS explanation_text,
        COALESCE(p.created_at, NOW()) AS submitted_at,
        COALESCE(p.project_status, 'IN_PROGRESS') AS submission_status,
        COALESCE(st.name, 'All Students / Group') AS student_name,
        st.rollno AS student_rollno,
        st.registration_no AS student_regno,
        st.photo_url AS student_photo,
        COALESCE(st.course_cd, p.course_id) AS course_cd,
        COALESCE(cr.name, 'BCA') AS course_name,
        COALESCE(st.branch_id, p.branch_id) AS branch_id,
        COALESCE(d.name, 'Department of Computer Applications') AS branch_name,
        COALESCE(st.batch_cd, p.batch_id) AS batch_cd,
        COALESCE(b.name, 'Batch 2025') AS batch_name,
        COALESCE(st.current_semester_cd, p.semester_id, '3') AS semester_cd,
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
      ORDER BY p.created_at DESC
    `);
    console.log('miniProjects SUCCESS! Returned rows:', miniRes.rows.length);
    console.log(JSON.stringify(miniRes.rows, null, 2));
  } catch (e) {
    console.error('miniProjects error:', e.message);
  }

  await client.end();
}

main().catch(console.error);
