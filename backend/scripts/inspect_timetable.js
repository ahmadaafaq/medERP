const { Client } = require('pg');
require('dotenv').config({ path: 'backend/.env' });

const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5433,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

async function run() {
  await client.connect();
  const schemasRes = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'");
  for (const row of schemasRes.rows) {
    const s = row.schema_name;
    const drafts = await client.query(`SELECT id, status, course_cd, branch_cd, batch_cd, semester, section, created_at, slots FROM "${s}".timetable_drafts ORDER BY created_at DESC LIMIT 5`).catch(e => ({ rows: [] }));
    const slots = await client.query(`SELECT count(*) FROM "${s}".timetable_slots`).catch(e => ({ rows: [{ count: 0 }] }));
    const srmsEvents = await client.query(`SELECT count(*), max(created_at) FROM "${s}".srms_timetable_events`).catch(e => ({ rows: [{ count: 0 }] }));
    console.log(`\n=== Schema: ${s} ===`);
    console.log(`Slots count: ${slots.rows[0].count}, SRMS events: ${JSON.stringify(srmsEvents.rows[0])}`);
    console.log(`Drafts count: ${drafts.rows.length}`);
    for (const d of drafts.rows) {
      const parsedSlots = typeof d.slots === 'string' ? JSON.parse(d.slots) : (d.slots || []);
      console.log(`  Draft ID: ${d.id}, Status: ${d.status}, Course: ${d.course_cd}, Sem: ${d.semester}, Sec: ${d.section}, Created: ${d.created_at}, Slots count: ${parsedSlots.length}`);
    }
  }
  await client.end();
}

run().catch(console.error);
