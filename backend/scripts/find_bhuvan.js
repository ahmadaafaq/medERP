const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const c = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });
  await c.connect();

  await c.query('SET search_path TO "tenant_srms-cet-bareilly", public');

  const s = await c.query("SELECT id, name, rollno FROM students WHERE name ILIKE '%Bhuvan%' OR rollno = '2500141790016'");
  console.log('Student:', s.rows);

  if (s.rows.length > 0) {
    const stId = s.rows[0].id;

    // Check all tables with submissions, seminars, deliverables
    const tables = ['academic_seminars', 'logbook_submissions', 'logbook_entries', 'student_deliverables', 'topic_submissions'];
    for (const t of tables) {
      try {
        const res = await c.query(`SELECT * FROM ${t} WHERE student_id = $1 OR student_id::text = $2`, [stId, String(stId)]);
        console.log(`Table ${t}: ${res.rows.length} rows`);
        if (res.rows.length > 0) {
          console.log(JSON.stringify(res.rows, null, 2));
        }
      } catch (e) {
        // table might not exist
      }
    }
  }

  // Also search for cpuramcache in any table
  console.log('--- Searching for cpuramcache in tenant_srms-cet-bareilly ---');
  const tList = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'tenant_srms-cet-bareilly'");
  for (const row of tList.rows) {
    try {
      const q = await c.query(`SELECT * FROM "${row.table_name}" WHERE CAST(row_to_json("${row.table_name}".*) AS text) ILIKE '%cpuramcache%'`);
      if (q.rows.length > 0) {
        console.log(`Found in table ${row.table_name}:`, q.rows);
      }
    } catch (e) {}
  }

  await c.end();
}

main().catch(console.error);
