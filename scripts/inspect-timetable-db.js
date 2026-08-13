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

  console.log('--- TABLES IN tenant_srms-ims ---');
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'tenant_srms-ims' 
    ORDER BY table_name
  `);
  console.log(tables.rows.map(r => r.table_name));

  console.log('\n--- TIMETABLE SLOTS ---');
  const slots = await client.query(`
    SELECT ts.id, ts.day_of_week, ts.start_time, ts.end_time, ts.room, ts.slot_type, ts.topic, ts.competency_codes,
           f.name AS faculty_name, s.name AS subject_name, s.code AS subject_code, b.code AS batch_code
    FROM "tenant_srms-ims".timetable_slots ts
    LEFT JOIN "tenant_srms-ims".faculty f ON f.id = ts.faculty_id
    LEFT JOIN "tenant_srms-ims".subjects s ON s.id = ts.subject_id
    LEFT JOIN "tenant_srms-ims".batches b ON b.id = ts.batch_id
    ORDER BY ts.day_of_week, ts.start_time
  `);
  console.table(slots.rows);

  // Check if academic_sessions or attendance_sessions or timetable_entries exist
  for (const t of ['academic_sessions', 'attendance_sessions', 'timetable_entries', 'faculty_schedule', 'attendance']) {
    if (tables.rows.some(r => r.table_name === t)) {
      console.log(`\n--- SAMPLE FROM ${t} ---`);
      const res = await client.query(`SELECT * FROM "tenant_srms-ims".${t} LIMIT 10`);
      console.table(res.rows);
    }
  }

  await client.end();
}

main().catch(err => {
  console.error(err);
  client.end();
});
