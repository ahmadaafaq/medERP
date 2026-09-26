const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || '34.236.107.120',
  port: Number(process.env.DB_PORT) || 5433,
  user: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || 'unicampus_dev@qsd!3ous',
  database: process.env.DB_NAME || 'unicampus_erp',
});

async function run() {
  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';

  console.log('1. Checking duplicates before...');
  const before = await client.query(`SELECT count(*) as total, count(distinct id) as distinct_ids FROM "${schema}".timetable_slots`);
  console.log('Before:', before.rows[0]);

  // Remove duplicate rows keeping min ctid
  const deleteRes = await client.query(`
    DELETE FROM "${schema}".timetable_slots a
    USING "${schema}".timetable_slots b
    WHERE a.ctid < b.ctid AND a.id = b.id
  `);
  console.log(`Deleted duplicate rows: ${deleteRes.rowCount}`);

  const after = await client.query(`SELECT count(*) as total, count(distinct id) as distinct_ids FROM "${schema}".timetable_slots`);
  console.log('After:', after.rows[0]);

  // Ensure primary key constraint exists
  try {
    await client.query(`
      ALTER TABLE "${schema}".timetable_slots 
      ADD CONSTRAINT timetable_slots_pkey PRIMARY KEY (id)
    `);
    console.log('Successfully added PRIMARY KEY (id) constraint to timetable_slots.');
  } catch (err) {
    console.log('Primary key constraint notice:', err.message);
  }

  await client.end();
}

run().catch(console.error);
