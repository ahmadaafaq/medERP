const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: '34.236.107.120',
    port: 5433,
    user: 'unicampus',
    password: 'unicampus_dev@qsd!3ous',
    database: 'unicampus_erp',
  });

  await client.connect();

  const schemas = await client.query(`
    SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'
  `);

  for (const s of schemas.rows) {
    const schema = s.schema_name;
    const res = await client.query(`
      SELECT * FROM "${schema}".students WHERE name ILIKE '%Aafreen%' OR rollno ILIKE '%2500141790001%' OR registration_no ILIKE '%2500141790001%'
    `).catch(() => ({ rows: [] }));

    if (res.rows.length > 0) {
      console.log(`Found Aafreen in schema: ${schema}:`, res.rows);
      
      // Check submissions in this schema
      const subs = await client.query(`SELECT * FROM "${schema}".logbook_submissions WHERE student_id = $1`, [res.rows[0].id]).catch(() => ({ rows: [] }));
      console.log(`  logbook_submissions count: ${subs.rows.length}`);
      if (subs.rows.length > 0) console.log('  subs:', subs.rows);

      const sems = await client.query(`SELECT * FROM "${schema}".logbook_seminars WHERE student_id = $1`, [res.rows[0].id]).catch(() => ({ rows: [] }));
      console.log(`  logbook_seminars count: ${sems.rows.length}`);
      if (sems.rows.length > 0) console.log('  sems:', sems.rows);

      const tuts = await client.query(`SELECT * FROM "${schema}".logbook_tutorials WHERE student_id = $1`, [res.rows[0].id]).catch(() => ({ rows: [] }));
      console.log(`  logbook_tutorials count: ${tuts.rows.length}`);
      if (tuts.rows.length > 0) console.log('  tuts:', tuts.rows);

      const weeks = await client.query(`SELECT * FROM "${schema}".logbook_weekly_logs WHERE student_id = $1`, [res.rows[0].id]).catch(() => ({ rows: [] }));
      console.log(`  logbook_weekly_logs count: ${weeks.rows.length}`);
      if (weeks.rows.length > 0) console.log('  weeks:', weeks.rows);

      const minis = await client.query(`SELECT * FROM "${schema}".logbook_mini_projects WHERE student_id = $1 OR student_id IS NULL`, [res.rows[0].id]).catch(() => ({ rows: [] }));
      console.log(`  logbook_mini_projects count: ${minis.rows.length}`);
      if (minis.rows.length > 0) console.log('  minis:', minis.rows);
    }
  }

  await client.end();
}

main().catch(console.error);
