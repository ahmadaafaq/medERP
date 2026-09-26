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

  const slot = await client.query(`
    SELECT ts.id, ts.faculty_id, ts.subject_id, ts.department_id, ts.batch_id,
           ts.day_of_week, ts.start_time, ts.end_time, ts.room, ts.slot_type,
           ts.course_cd, ts.branch_cd, ts.batch_cd, ts.semester, ts.section, ts.topic, ts.description,
           COALESCE(f.name, '') AS faculty_name, f.emp_id AS faculty_code,
           COALESCE(s.name, '') AS subject_name, COALESCE(s.code, '') AS subject_code, COALESCE(s.code, '') AS subject_cd, COALESCE(s.sub_addinfo, '') AS subject_paper_code, COALESCE(s.type, '') AS subject_type
    FROM "${schema}".timetable_slots ts
    LEFT JOIN "${schema}".faculty f ON f.id::text = ts.faculty_id::text
    LEFT JOIN "${schema}".subjects s ON s.id::text = ts.subject_id::text
    WHERE ts.id = 'da70c6c5-5792-41e1-84fc-5961aec41030'
  `);
  console.log('Slot da70c6c5 query result:');
  console.log(slot.rows[0]);

  await client.end();
}

run().catch(console.error);
