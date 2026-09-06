const { Client } = require('pg');
require('dotenv').config({ path: 'f:/AI_DOCKER/AAFAQ_SIR_PROJECTS/UNICAMPDIR/ERP/eng-erp/backend/.env' });

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5433'),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

async function diagnoseMiniProjects() {
  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';

  console.log('=== 1. logbook_mini_projects ===');
  const miniProjects = await client.query(`
    SELECT mp.id, mp.student_id, st.name as student_name, st.rollno, st.registration_no,
           mp.title, mp.project_status, mp.final_grade, mp.final_percentage, mp.guide_marks,
           mp.approved_at, mp.created_at
    FROM "${schema}".logbook_mini_projects mp
    LEFT JOIN "${schema}".students st ON (st.id::text = mp.student_id::text OR st.rollno = mp.student_id::text OR st.registration_no = mp.student_id::text)
  `);
  console.log('Total logbook_mini_projects:', miniProjects.rows.length);
  console.table(miniProjects.rows);

  console.log('\n=== 2. logbook_weekly_logs ===');
  const weeklyLogs = await client.query(`
    SELECT wl.*, st.name as student_name, st.rollno, st.registration_no
    FROM "${schema}".logbook_weekly_logs wl
    LEFT JOIN "${schema}".students st ON (st.id::text = wl.student_id::text OR st.rollno = wl.student_id::text OR st.registration_no = wl.student_id::text)
  `);
  console.log('Total logbook_weekly_logs:', weeklyLogs.rows.length);
  console.table(weeklyLogs.rows);

  console.log('\n=== 3. logbook_submissions (for MINI_PROJECT category) ===');
  const miniSubs = await client.query(`
    SELECT s.id, s.student_id, st.name as student_name, st.rollno,
           t.title as topic_title, c.code as cat_code, c.name as cat_name,
           s.status as sub_status, s.content, s.file_url, s.created_at
    FROM "${schema}".logbook_submissions s
    JOIN "${schema}".logbook_topics t ON t.id::text = s.topic_id::text
    JOIN "${schema}".logbook_categories c ON c.id::text = t.category_id::text
    LEFT JOIN "${schema}".students st ON (st.id::text = s.student_id::text OR st.rollno = s.student_id::text OR st.registration_no = s.student_id::text)
    WHERE c.code ILIKE '%mini%' OR c.name ILIKE '%mini%' OR t.title ILIKE '%mini%'
  `);
  console.log('Total mini project submissions in logbook_submissions:', miniSubs.rows.length);
  console.table(miniSubs.rows);

  console.log('\n=== 4. All submissions by Aafreen Khan ===');
  const aafreenSubs = await client.query(`
    SELECT s.id, s.student_id, t.title as topic_title, c.code as cat_code, c.name as cat_name,
           s.status as sub_status, s.file_url, e.marks_obtained, e.feedback
    FROM "${schema}".logbook_submissions s
    JOIN "${schema}".logbook_topics t ON t.id::text = s.topic_id::text
    JOIN "${schema}".logbook_categories c ON c.id::text = t.category_id::text
    LEFT JOIN "${schema}".logbook_evaluations e ON e.submission_id::text = s.id::text
    LEFT JOIN "${schema}".students st ON (st.id::text = s.student_id::text OR st.rollno = s.student_id::text)
    WHERE st.name ILIKE '%Aafreen%' OR s.student_id = '0f31c5bb-b06e-40ae-82ec-51528441117f'
  `);
  console.log('Aafreen submissions:', aafreenSubs.rows.length);
  console.table(aafreenSubs.rows);

  console.log('\n=== 5. All students with any mini project data ===');
  const anyMini = await client.query(`
    SELECT s.id, s.name, s.rollno, s.registration_no
    FROM "${schema}".students s
    WHERE EXISTS (
      SELECT 1 FROM "${schema}".logbook_mini_projects mp
      WHERE mp.student_id::text = s.id::text OR mp.student_id::text = s.rollno OR mp.student_id::text = s.registration_no
    ) OR EXISTS (
      SELECT 1 FROM "${schema}".logbook_submissions sub
      JOIN "${schema}".logbook_topics t ON t.id::text = sub.topic_id::text
      JOIN "${schema}".logbook_categories c ON c.id::text = t.category_id::text
      WHERE (sub.student_id::text = s.id::text OR sub.student_id::text = s.rollno)
        AND (c.code ILIKE '%mini%' OR c.name ILIKE '%mini%')
    )
  `);
  console.table(anyMini.rows);

  await client.end();
}

diagnoseMiniProjects().catch(console.error);
