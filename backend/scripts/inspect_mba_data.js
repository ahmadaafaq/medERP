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
  try {
    const schema = 'tenant_srms-cet-bareilly';
    const s = await client.query(`
      SELECT * FROM "${schema}".students WHERE course_cd::text = '4' LIMIT 1
    `);
    console.log("SAMPLE MBA STUDENT:", s.rows[0]);

    const acad = await client.query(`
      SELECT * FROM "${schema}".student_academic_details WHERE student_id = $1 LIMIT 5
    `, [s.rows[0].id]).catch(e => ({ rows: [] }));
    console.log("ACADEMIC DETAILS:", acad.rows);

    const srmsTimetable = await client.query(`
      SELECT * FROM "${schema}".srms_timetable_events WHERE course_cd::text = '4' LIMIT 5
    `).catch(e => ({ rows: [] }));
    console.log("SRMS TIMETABLE FOR MBA:", srmsTimetable.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
