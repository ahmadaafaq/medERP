const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || '34.236.107.120',
  port: Number(process.env.DB_PORT) || 5433,
  user: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || 'unicampus_dev@qsd!3ous',
  database: process.env.DB_NAME || 'unicampus_erp',
});

async function run() {
  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';

  console.log('--- 1. Timetable Slots containing B.Tech or Upendra or COA ---');
  const slots = await client.query(`
    SELECT ts.id, ts.day_of_week, ts.start_time, ts.end_time, ts.subject_id, ts.course_cd, ts.branch_cd, ts.batch_cd,
           ts.topic, ts.description, ts.unit_name,
           s.code as sub_code, s.name as sub_name, s.sub_addinfo
    FROM "${schema}".timetable_slots ts
    LEFT JOIN "${schema}".subjects s ON s.id::text = ts.subject_id::text
    WHERE ts.description ILIKE '%B.Tech%' OR ts.topic ILIKE '%B.Tech%' OR ts.course_cd = '1'
  `);
  console.table(slots.rows);

  console.log('--- 2. srms_timetable_events containing B.Tech or Upendra or COA ---');
  const events = await client.query(`
    SELECT id, title, description, linkcd, empid, course_cd, branch_cd, batch_cd, sem_cd, txt_sec
    FROM "${schema}".srms_timetable_events
    WHERE title ILIKE '%COA%' OR description ILIKE '%COA%' OR title ILIKE '%B.Tech%'
    LIMIT 10
  `);
  console.table(events.rows);

  console.log('--- 3. Courses in database ---');
  const courses = await client.query(`
    SELECT id, code, name, course_cd FROM "${schema}".courses
  `);
  console.table(courses.rows);

  await client.end();
}

run().catch(console.error);
