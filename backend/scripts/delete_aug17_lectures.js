const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp' });

async function removeLecturesForDate() {
  const schema = 'tenant_srms-cet-bareilly';
  
  // 1. Inspect existing events for 2026-08-17
  const findRes = await pool.query(`
    SELECT id, title, description, start_time, end_time, start_str, empid
    FROM "${schema}".srms_timetable_events
    WHERE start_time::date = '2026-08-17'::date OR start_str LIKE '%17-08-2026%'
  `);
  console.log('Found in srms_timetable_events on 2026-08-17:', findRes.rows.length);
  console.log(findRes.rows);

  // 2. Delete from srms_timetable_events
  const delSrms = await pool.query(`
    DELETE FROM "${schema}".srms_timetable_events
    WHERE start_time::date = '2026-08-17'::date OR start_str LIKE '%17-08-2026%'
    RETURNING id, title
  `);
  console.log('Deleted from srms_timetable_events:', delSrms.rows.length);

  // 3. Inspect and clean timetable_slots if any match this date
  const delSlots = await pool.query(`
    DELETE FROM "${schema}".timetable_slots
    WHERE effective_from::date = '2026-08-17'::date
       OR (topic LIKE '%Python%' AND start_time = '08:30:00' AND day_of_week = 1)
    RETURNING id, topic
  `);
  console.log('Cleaned matching timetable_slots:', delSlots.rows.length);

  // 4. Verify remaining events
  const remaining = await pool.query(`
    SELECT id, title, start_time, start_str
    FROM "${schema}".srms_timetable_events
    ORDER BY start_time ASC
  `);
  console.log('Remaining srms_timetable_events:', remaining.rows);

  await pool.end();
}

removeLecturesForDate().catch(console.error);
