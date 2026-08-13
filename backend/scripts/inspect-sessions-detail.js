const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp',
});

async function main() {
  await client.connect();

  console.log('=== CHECKING ATTENDANCE_SESSIONS DETAILED ===');
  const attRes = await client.query(`
    SELECT ats.id, ats.session_date, ats.session_type, ats.topic_covered, ats.timetable_slot_id,
           f.name AS faculty_name, s.name AS subject_name, s.code AS subject_code
    FROM "tenant_srms-ims".attendance_sessions ats
    LEFT JOIN "tenant_srms-ims".faculty f ON f.id = ats.faculty_id
    LEFT JOIN "tenant_srms-ims".subjects s ON s.id = ats.subject_id
  `);
  console.table(attRes.rows);

  console.log('=== CHECKING TIMETABLE_SLOTS FOR ALL FACULTIES ===');
  const slotsRes = await client.query(`
    SELECT ts.id, ts.day_of_week, ts.start_time, ts.end_time, ts.room, ts.slot_type, ts.topic, ts.competency_codes,
           f.name AS faculty_name, s.name AS subject_name, s.code AS subject_code
    FROM "tenant_srms-ims".timetable_slots ts
    LEFT JOIN "tenant_srms-ims".faculty f ON f.id = ts.faculty_id
    LEFT JOIN "tenant_srms-ims".subjects s ON s.id = ts.subject_id
  `);
  console.table(slotsRes.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  client.end();
});
