const { Client } = require('pg');
require('dotenv').config({ path: 'f:/AI_DOCKER/AAFAQ_SIR_PROJECTS/UNICAMPDIR/ERP/eng-erp/backend/.env' });

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5433'),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

async function main() {
  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';

  const testProject = async (projectId, label) => {
    const res = await client.query(`
      SELECT st.id as student_id, st.name as student_name, st.rollno, st.registration_no,
             cr.name as course_name, b.name as batch_name,
             p.id as project_id, p.title as project_title, p.repository_url, p.live_demo_url, p.zip_submission_url,
             p.documentation_url, p.documentation_name, p.file_path, p.file_size, p.file_mime,
             p.is_locked, p.project_status, p.final_grade, p.final_percentage, p.guide_remarks, p.locked_at,
             COALESCE(SUM(w.hours_spent), 0) as total_hours_spent,
             COUNT(w.id) as total_weeks_logged,
             MAX(w.week_number) as latest_week_number,
             MAX(w.updated_at) as last_activity_at
      FROM "${schema}".students st
      LEFT JOIN "${schema}".courses cr ON (cr.course_cd::text = st.course_cd::text OR cr.id::text = st.course_cd::text)
      LEFT JOIN "${schema}".batches b ON (b.id::text = st.batch_id::text OR (b.batch_cd::text = st.batch_cd::text AND b.course_cd::text = st.course_cd::text))
      LEFT JOIN "${schema}".logbook_mini_projects p ON (
        (p.student_id = st.id OR (p.student_id IS NULL AND (p.batch_id IS NULL OR p.batch_id::text = st.batch_id::text OR p.batch_id::text = st.batch_cd::text)))
        AND ($1::text IS NULL OR p.id::text = $1 OR p.title ILIKE $1)
      )
      LEFT JOIN "${schema}".logbook_weekly_logs w ON (
        w.student_id = st.id
        AND ($1::text IS NULL OR w.project_id::text = $1)
      )
      WHERE ($1::text IS NULL OR p.id IS NOT NULL OR w.id IS NOT NULL)
      GROUP BY st.id, st.name, st.rollno, st.registration_no, cr.name, b.name,
               p.id, p.title, p.repository_url, p.live_demo_url, p.zip_submission_url,
               p.documentation_url, p.documentation_name, p.file_path, p.file_size, p.file_mime,
               p.is_locked, p.project_status, p.final_grade, p.final_percentage, p.guide_remarks, p.locked_at
      ORDER BY total_weeks_logged DESC, st.name ASC
    `, [projectId]);

    console.log(`\n=== Applicants for ${label} (${projectId}) ===`);
    console.table(res.rows.map(r => ({
      student_name: r.student_name,
      rollno: r.rollno,
      project_title: r.project_title,
      total_weeks_logged: r.total_weeks_logged,
      documentation_name: r.documentation_name
    })));
  };

  await testProject('248e81c0-0efb-48c1-9dbc-71a6fcddce0b', 'E-Commerce');
  await testProject('235720b5-5778-4177-bd2f-9e10ae402a4d', 'HRMS');

  await client.end();
}

main().catch(console.error);
