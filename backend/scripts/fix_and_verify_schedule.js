const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function fixSchedule() {
  const schema = 'tenant_srms-cet-bareilly';

  // 1. Fix Tuesday slot to be Theory ([88534] Web Technology)
  await pool.query(`
    UPDATE "${schema}".timetable_slots
    SET subject_id = '47977f92-bd7f-46bf-9606-3e329ffc694e',
        slot_type = 'Lecture',
        topic = 'Python Basics & Syntax, Variables, Control Flow & Functions',
        sub_topics = 'Data Types, Conditionals, Loops, Function Arguments & Modules',
        description = 'Web Technology Python Theory Lecture'
    WHERE day_of_week = 2 AND (course_cd = '13' OR course_cd IS NULL)
  `);

  // 2. Ensure Wednesday slot is Practical ([88539] Web Technology Lab)
  await pool.query(`
    UPDATE "${schema}".timetable_slots
    SET subject_id = '4b7885cc-f1d2-44c0-9964-f39b2540407a',
        slot_type = 'Practical',
        topic = 'HTML5 Semantic Elements, Forms & CSS3 Styling',
        sub_topics = 'DOM Tree Traversal & Query Selectors, Event Listeners & Bubbling/Capturing',
        description = 'Web Technology Lab Practical'
    WHERE day_of_week = 3 AND (course_cd = '13' OR course_cd IS NULL)
  `);

  // 3. Query all slots for the entire week to verify
  const res = await pool.query(`
    SELECT ts.id, ts.day_of_week, ts.start_time, ts.end_time, ts.room, ts.slot_type,
           ts.topic, ts.sub_topics, ts.course_cd, ts.batch_cd,
           f.name AS faculty_name, f.emp_id AS faculty_empid,
           s.name AS subject_name, s.code AS subject_code, s.type AS subject_type,
           b.name AS batch_name, b.year AS batch_year, b.batch_cd AS batch_numeric_cd
    FROM "${schema}".timetable_slots ts
    LEFT JOIN "${schema}".faculty f ON f.id = ts.faculty_id
    LEFT JOIN "${schema}".subjects s ON s.id = ts.subject_id
    LEFT JOIN "${schema}".batches b ON b.id = ts.batch_id
    ORDER BY ts.day_of_week, ts.start_time
  `);

  console.log('\n==============================================');
  console.log('✅ VERIFIED FULL WEEK SCHEDULE IN DATABASE:');
  console.log('==============================================');
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  res.rows.forEach(r => {
    console.log(`\n📅 ${dayNames[r.day_of_week]} (Day ${r.day_of_week}):`);
    console.log(`  🕒 Time: ${r.start_time?.slice(0,5)} - ${r.end_time?.slice(0,5)} | Mode: ${r.slot_type} (Subject Type: ${r.subject_type})`);
    console.log(`  👨‍🏫 Faculty: ${r.faculty_name} (${r.faculty_empid})`);
    console.log(`  📚 Subject: [${r.subject_code}] ${r.subject_name}`);
    console.log(`  🎓 Batch: ${r.batch_name} (batch_cd: ${r.batch_numeric_cd}, year: ${r.batch_year})`);
    console.log(`  📖 Topic: ${r.topic}`);
    console.log(`  🎯 Sub Topics: ${r.sub_topics}`);
  });

  await pool.end();
}

fixSchedule().catch(console.error);
