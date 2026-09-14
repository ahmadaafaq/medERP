const { Client } = require('pg');
const client = new Client({
  host: '34.236.107.120',
  port: 5433,
  user: 'unicampus',
  password: 'unicampus_dev@qsd!3ous',
  database: 'unicampus_erp'
});

async function run() {
  await client.connect();

  const res1 = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema='tenant_srms-cet-bareilly' AND table_name='timetable_slots'
    ORDER BY ordinal_position
  `);
  console.log('--- timetable_slots columns ---');
  console.table(res1.rows);

  const res2 = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema='tenant_srms-cet-bareilly' AND table_name='timetables'
    ORDER BY ordinal_position
  `);
  console.log('--- timetables columns ---');
  console.table(res2.rows);

  const res3 = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema='tenant_srms-cet-bareilly' AND table_name='srms_timetable_events'
    ORDER BY ordinal_position
  `);
  console.log('--- srms_timetable_events columns ---');
  console.table(res3.rows);

  const slots = await client.query(`
    SELECT id, day_of_week, start_time, end_time, course_cd, branch_cd, batch_cd, semester, section, topic, start_date, end_date, effective_date, valid_from, valid_to
    FROM "tenant_srms-cet-bareilly".timetable_slots
    LIMIT 10
  `).catch(e => {
    return client.query(`
      SELECT *
      FROM "tenant_srms-cet-bareilly".timetable_slots
      LIMIT 5
    `);
  });
  console.log('--- sample timetable_slots data ---');
  console.log(slots.rows);

  const events = await client.query(`
    SELECT id, title, start_time, end_time, start_str, end_str, day_of_week, course_cd, branch_cd, batch_cd, sem_cd, txt_sec
    FROM "tenant_srms-cet-bareilly".srms_timetable_events
    LIMIT 10
  `);
  console.log('--- sample srms_timetable_events data ---');
  console.log(events.rows);

  await client.end();
}

run().catch(console.error);
