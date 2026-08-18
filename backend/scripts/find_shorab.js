const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp',
});

async function main() {
  await client.connect();
  let log = '';
  const logLine = (msg) => { console.log(msg); log += msg + '\n'; };

  const schemasRes = await client.query(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%'
  `);
  
  logLine(`Tenant schemas count: ${schemasRes.rows.length}`);

  for (const row of schemasRes.rows) {
    const s = row.schema_name;
    try {
      const facQuery = await client.query(`SELECT * FROM "${s}".faculty`);
      logLine(`\nSchema [${s}] faculty count: ${facQuery.rows.length}`);
      for (const f of facQuery.rows) {
        logLine(`  Faculty: emp_id=${f.emp_id || f.code} | name=${f.name} | id=${f.id}`);
      }
    } catch (err) {
      logLine(`Schema [${s}] faculty error: ${err.message}`);
    }

    try {
      const slots = await client.query(`SELECT * FROM "${s}".timetable_slots`);
      logLine(`Schema [${s}] timetable slots count: ${slots.rows.length}`);
      for (const sl of slots.rows) {
        logLine(`  Slot: Day ${sl.day_of_week} | ${sl.start_time}-${sl.end_time} | Type: ${sl.slot_type || sl.slotType} | Subj: ${sl.subject_name || sl.subject_code} | Fac: ${sl.faculty_name} (ID: ${sl.faculty_id}) | Room: ${sl.room} | Batch: ${sl.batch_code || sl.batch_id} | Topic: ${sl.topic}`);
      }
    } catch (err) {
      logLine(`Schema [${s}] slots error: ${err.message}`);
    }
  }

  fs.writeFileSync('scripts/shorab_output.txt', log);
  await client.end();
}

main().catch(err => {
  fs.writeFileSync('scripts/shorab_output.txt', 'Error: ' + err.stack);
  console.error(err);
  process.exit(1);
});
