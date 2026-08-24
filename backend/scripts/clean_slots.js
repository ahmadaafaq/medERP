const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp' });

async function clean() {
  const schema = 'tenant_srms-cet-bareilly';
  
  await pool.query(`DELETE FROM "${schema}".srms_timetable_events WHERE id = '043fffeb-1883-4abb-ace0-2a77768ef59d'`);
  console.log('Cleaned test slot 043fffeb-1883-4abb-ace0-2a77768ef59d');

  await pool.end();
}

clean().catch(console.error);
