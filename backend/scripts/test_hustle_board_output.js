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

  const res = await client.query(`
    WITH mini_project_metrics AS (
      SELECT 
        p.student_id,
        COUNT(p.id) FILTER (WHERE p.project_status IN ('APPROVED', 'COMPLETED') OR p.approved_at IS NOT NULL) AS mini_projects_done,
        COUNT(p.id) FILTER (WHERE p.project_status NOT IN ('APPROVED', 'COMPLETED') AND p.approved_at IS NULL) AS mini_projects_in_progress,
        COUNT(p.id) AS total_mini_projects,
        MAX(p.title) AS mini_project_title,
        MAX(p.project_status) AS mini_project_status,
        MAX(p.final_grade) AS mini_project_grade,
        MAX(COALESCE(NULLIF(regexp_replace(p.final_percentage::text, '[^0-9.]', '', 'g'), '')::numeric, NULLIF(regexp_replace(p.guide_marks::text, '[^0-9.]', '', 'g'), '')::numeric, 0)) AS mini_project_score,
        COALESCE(MAX(wl.logs_count), 0) AS mini_project_logs_count
      FROM "${schema}".logbook_mini_projects p
      LEFT JOIN (
        SELECT student_id, COUNT(*) AS logs_count
        FROM "${schema}".logbook_weekly_logs
        GROUP BY student_id
      ) wl ON (wl.student_id::text = p.student_id::text)
      WHERE p.student_id IS NOT NULL
      GROUP BY p.student_id
    )
    SELECT st.name, st.rollno,
           COALESCE(mpm.mini_projects_done, 0) as mini_projects_done,
           COALESCE(mpm.mini_projects_in_progress, 0) as mini_projects_in_progress,
           COALESCE(mpm.total_mini_projects, 0) as total_mini_projects,
           mpm.mini_project_title,
           mpm.mini_project_logs_count
    FROM "${schema}".students st
    LEFT JOIN mini_project_metrics mpm ON mpm.student_id::text = st.id::text
    WHERE st.id::text IN ('0f31c5bb-b06e-40ae-82ec-51528441117f', 'e06691e9-09f2-49b6-8b7a-26f055cef647')
  `);

  console.log('Hustle Board mini project metrics:');
  console.table(res.rows);

  await client.end();
}

main().catch(console.error);
