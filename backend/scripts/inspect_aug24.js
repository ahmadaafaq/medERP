const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp' });

async function purge() {
  const schema = 'tenant_srms-cet-bareilly';
  
  const res1 = await pool.query(`DELETE FROM "${schema}".timetable_slots RETURNING id, topic`);
  console.log('Deleted from timetable_slots:', res1.rows);

  const res2 = await pool.query(`DELETE FROM "${schema}".srms_timetable_events WHERE start_time::text LIKE '%2026-08-24%' OR start_str LIKE '%24-08-2026%' RETURNING id, title`);
  console.log('Deleted from srms_timetable_events:', res2.rows);

  await pool.end();
}

purge().catch(console.error);
