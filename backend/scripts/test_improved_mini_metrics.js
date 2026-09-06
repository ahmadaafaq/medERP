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

  const rawQuery = `
    WITH mini_project_candidates AS (
      SELECT p.student_id, p.id AS project_id, p.title, p.project_status, p.approved_at, p.is_locked, p.final_grade, p.final_percentage, p.guide_marks
      FROM "${schema}".logbook_mini_projects p
      WHERE p.student_id IS NOT NULL
      UNION
      SELECT w.student_id, w.project_id, p.title, p.project_status, p.approved_at, p.is_locked, p.final_grade, p.final_percentage, p.guide_marks
      FROM "${schema}".logbook_weekly_logs w
      LEFT JOIN "${schema}".logbook_mini_projects p ON p.id::text = w.project_id::text
      WHERE w.student_id IS NOT NULL
    ),
    mini_project_metrics AS (
      SELECT 
        mpc.student_id,
        COUNT(DISTINCT mpc.project_id) FILTER (WHERE mpc.project_status IN ('APPROVED', 'COMPLETED', 'CLOSED') OR mpc.approved_at IS NOT NULL OR mpc.is_locked = TRUE) AS mini_projects_done,
        COUNT(DISTINCT mpc.project_id) FILTER (WHERE (mpc.project_status NOT IN ('APPROVED', 'COMPLETED', 'CLOSED') AND mpc.approved_at IS NULL AND (mpc.is_locked IS NULL OR mpc.is_locked = FALSE)) OR mpc.project_status IS NULL) AS mini_projects_in_progress,
        COUNT(DISTINCT mpc.project_id) AS total_mini_projects,
        MAX(mpc.title) AS mini_project_title,
        COALESCE(MAX(mpc.project_status), 'IN_PROGRESS') AS mini_project_status,
        MAX(mpc.final_grade) AS mini_project_grade,
        MAX(COALESCE(NULLIF(regexp_replace(mpc.final_percentage::text, '[^0-9.]', '', 'g'), '')::numeric, NULLIF(regexp_replace(mpc.guide_marks::text, '[^0-9.]', '', 'g'), '')::numeric, 0)) AS mini_project_score,
        COALESCE(MAX(wl.logs_count), 0) AS mini_project_logs_count
      FROM mini_project_candidates mpc
      LEFT JOIN (
        SELECT student_id, COUNT(*) AS logs_count
        FROM "${schema}".logbook_weekly_logs
        GROUP BY student_id
      ) wl ON (wl.student_id::text = mpc.student_id::text)
      GROUP BY mpc.student_id
    )
    SELECT st.name, st.rollno,
           mpm.mini_projects_done,
           mpm.mini_projects_in_progress,
           mpm.total_mini_projects,
           mpm.mini_project_title,
           mpm.mini_project_logs_count
    FROM "${schema}".students st
    JOIN mini_project_metrics mpm ON mpm.student_id::text = st.id::text
  `;

  const res = await client.query(rawQuery);
  console.log('Query result:');
  console.table(res.rows);

  await client.end();
}

main().catch(console.error);
