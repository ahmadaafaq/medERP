const { Client } = require('f:/AI_DOCKER/AAFAQ_SIR_PROJECTS/UNICAMPDIR/ERP/eng-erp/backend/node_modules/pg');

async function inspectSubjects() {
  const client = new Client({
    host: process.env.DB_HOST || '34.236.107.120',
    port: Number(process.env.DB_PORT) || 5433,
    user: process.env.DB_USER || 'unicampus',
    password: process.env.DB_PASS || 'unicampus_dev@qsd!3ous',
    database: process.env.DB_NAME || 'unicampus_erp',
  });

  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';

  const subjects = await client.query(`
    SELECT *
    FROM "${schema}".subjects
    ORDER BY name ASC
  `);
  console.log('Subjects in DB:', subjects.rows.map(s => ({ id: s.id, code: s.code, name: s.name })));

  const timetableSlots = await client.query(`
    SELECT ts.id, ts.day_of_week, ts.start_time, ts.end_time, ts.subject_id, ts.course_cd, ts.branch_cd, ts.batch_cd,
           sub.code AS sub_code, sub.name AS sub_name, ts.topic
    FROM "${schema}".timetable_slots ts
    LEFT JOIN "${schema}".subjects sub ON sub.id::text = ts.subject_id::text
    LIMIT 10
  `);
  console.log('\nTimetable slots sample:', timetableSlots.rows);

  await client.end();
}

inspectSubjects().catch(console.error);
