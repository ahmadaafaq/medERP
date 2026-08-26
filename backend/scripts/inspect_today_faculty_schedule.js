const { Client } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function main() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'unicampus',
    password: 'unicampus_secret',
    database: 'unicampus_erp',
  });

  await client.connect();

  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // 1 = Monday, 3 = Wednesday

  console.log(`\n======================================================`);
  console.log(`📅 INSPECTING TIMETABLE SCHEDULE FOR TODAY (${dayNames[today.getDay()]}, day_of_week = ${dayOfWeek})`);
  console.log(`======================================================\n`);

  const schemas = ['tenant_srms-cet-bareilly', 'tenant_srms-ims-bareilly'];

  for (const schema of schemas) {
    console.log(`\n------------------------------------------------------`);
    console.log(`🏛️ TENANT SCHEMA: ${schema}`);
    console.log(`------------------------------------------------------`);

    // 1. Check if schema exists
    const schemaCheck = await client.query(`
      SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1
    `, [schema]);

    if (schemaCheck.rows.length === 0) {
      console.log(`Schema ${schema} does not exist.`);
      continue;
    }

    // 2. Query timetable_slots for today
    const query = `
      SELECT ts.id, ts.day_of_week, ts.start_time, ts.end_time, ts.room, ts.slot_type,
             ts.topic, ts.sub_topics, ts.competency_codes, ts.course_cd, ts.branch_cd, ts.batch_cd,
             ts.semester, ts.section,
             f.name AS faculty_name, f.emp_id AS faculty_empid,
             s.name AS subject_name, s.code AS subject_code,
             d.name AS department_name,
             b.name AS batch_name, b.code AS batch_code, b.year AS batch_year, b.batch_cd AS batch_numeric_cd
      FROM "${schema}".timetable_slots ts
      LEFT JOIN "${schema}".faculty f ON f.id = ts.faculty_id
      LEFT JOIN "${schema}".subjects s ON s.id = ts.subject_id
      LEFT JOIN "${schema}".departments d ON d.id = ts.department_id
      LEFT JOIN "${schema}".batches b ON b.id = ts.batch_id
      WHERE ts.day_of_week = $1
      ORDER BY ts.start_time ASC
    `;

    const res = await client.query(query, [dayOfWeek]);
    console.log(`Found ${res.rows.length} timetable slot(s) for ${dayNames[today.getDay()]} in ${schema}:`);

    if (res.rows.length === 0) {
      console.log(`(No slots scheduled on ${dayNames[today.getDay()]})`);
    } else {
      res.rows.forEach((r, idx) => {
        console.log(`\n[Slot #${idx + 1}]`);
        console.log(`  🕒 Time: ${r.start_time?.slice(0, 5)} - ${r.end_time?.slice(0, 5)} | Type: ${r.slot_type || 'Lecture'} | Room: ${r.room || 'N/A'}`);
        console.log(`  👨‍🏫 Faculty: ${r.faculty_name || 'Unassigned'} (Emp ID: ${r.faculty_empid || 'N/A'})`);
        console.log(`  📚 Subject: [${r.subject_code || 'N/A'}] ${r.subject_name || 'N/A'}`);
        console.log(`  🏛️ Department: ${r.department_name || 'N/A'}`);
        console.log(`  🎓 Batch in DB:`);
        console.log(`     - batch.name: "${r.batch_name}"`);
        console.log(`     - batch.year: "${r.batch_year}"`);
        console.log(`     - batch.batch_cd: "${r.batch_numeric_cd}"`);
        console.log(`     - slot.batch_cd: "${r.batch_cd}"`);
        console.log(`     - batch.code (legacy): "${r.batch_code}"`);
        console.log(`  📖 Topic: ${r.topic || 'N/A'}`);
        console.log(`  🎯 Sub Topics / Competencies: ${r.sub_topics || r.competency_codes || 'N/A'}`);
      });
    }

    // 3. Query srms_timetable_events for today
    try {
      const srmsEvents = await client.query(`
        SELECT id, title, description, start_time, end_time, start_str, end_str, day_of_week,
               linkcd, empid, colg_cd, course_cd, branch_cd, batch_cd, sem_cd, camera_link,
               unit_name, topic, sub_topics, competency_codes
        FROM "${schema}".srms_timetable_events
        WHERE day_of_week = $1
        ORDER BY start_time ASC
      `, [dayOfWeek]);

      console.log(`\nFound ${srmsEvents.rows.length} srms_timetable_event(s) for ${dayNames[today.getDay()]} in ${schema}:`);
      srmsEvents.rows.forEach((ev, idx) => {
        console.log(`  [SRMS Event #${idx + 1}] Title: ${ev.title} | EmpID: ${ev.empid} | Course: ${ev.course_cd} | Batch: ${ev.batch_cd} | Sub-Topics: ${ev.sub_topics || 'N/A'}`);
      });
    } catch (e) {
      // ignore if table doesn't exist
    }
  }

  await client.end();
}

main().catch(err => {
  console.error('Error running query:', err);
  process.exit(1);
});
