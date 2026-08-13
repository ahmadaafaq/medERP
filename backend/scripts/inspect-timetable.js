const { Client } = require('pg');

async function inspectTimetable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp',
  });

  try {
    await client.connect();
    const schema = 'tenant_srms-ims';
    console.log(`=== TIMETABLE SLOTS IN ${schema} ===`);
    const res = await client.query(`
      SELECT ts.id, ts.day_of_week, ts.start_time, ts.end_time, ts.slot_type, ts.subject_id, sub.name as subject_name, sub.code as subject_code
      FROM "${schema}".timetable_slots ts
      LEFT JOIN "${schema}".subjects sub ON sub.id = ts.subject_id
      ORDER BY ts.day_of_week, ts.start_time
    `);
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

inspectTimetable();
