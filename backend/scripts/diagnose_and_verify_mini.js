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

  console.log('=== Current Mini Projects in Database ===');
  const projs = await client.query(`
    SELECT mp.id, mp.student_id, st.name as student_name, st.rollno,
           mp.title, mp.project_status, mp.final_grade, mp.final_percentage,
           mp.guide_marks, mp.approved_at
    FROM "${schema}".logbook_mini_projects mp
    LEFT JOIN "${schema}".students st ON st.id::text = mp.student_id::text
  `);
  console.table(projs.rows);

  console.log('=== Current Weekly Logs in Database ===');
  const logs = await client.query(`
    SELECT wl.id, wl.student_id, st.name as student_name, st.rollno,
           wl.week_number, wl.status, wl.guide_marks, wl.tasks_planned,
           mp.title as project_title
    FROM "${schema}".logbook_weekly_logs wl
    LEFT JOIN "${schema}".students st ON st.id::text = wl.student_id::text
    LEFT JOIN "${schema}".logbook_mini_projects mp ON mp.id::text = wl.project_id::text
  `);
  console.table(logs.rows);

  // Update HRMS student_id if null
  console.log('\nLinking HRMS project to student Bhuvan Vishwas (e06691e9-09f2-49b6-8b7a-26f055cef647)...');
  await client.query(`
    UPDATE "${schema}".logbook_mini_projects
    SET student_id = 'e06691e9-09f2-49b6-8b7a-26f055cef647'
    WHERE id = '235720b5-5778-4177-bd2f-9e10ae402a4d' AND student_id IS NULL
  `);

  console.log('\n=== Mini Projects After Link ===');
  const projsAfter = await client.query(`
    SELECT mp.id, mp.student_id, st.name as student_name, st.rollno,
           mp.title, mp.project_status, mp.final_grade, mp.final_percentage,
           mp.guide_marks, mp.approved_at
    FROM "${schema}".logbook_mini_projects mp
    LEFT JOIN "${schema}".students st ON st.id::text = mp.student_id::text
  `);
  console.table(projsAfter.rows);

  await client.end();
}

main().catch(console.error);
