const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp',
});

async function main() {
  await client.connect();

  const schema = 'tenant_srms-cet-bareilly';

  const res = await client.query(`
    SELECT 
      ts.id,
      ts.day_of_week,
      CASE ts.day_of_week
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
        WHEN 7 THEN 'Sunday'
      END as day_name,
      ts.start_time,
      ts.end_time,
      ts.room,
      COALESCE(ts.slot_type, 'Lecture') as session_type,
      ts.group_name,
      ts.topic,
      ts.competency_codes,
      f.name as faculty_name,
      f.emp_id,
      f.designation,
      s.code as subject_code,
      s.name as subject_name,
      b.code as batch_code,
      b.year as batch_year,
      d.name as department_name,
      c.name as course_name
    FROM "${schema}".timetable_slots ts
    LEFT JOIN "${schema}".faculty f ON ts.faculty_id::text = f.id::text OR ts.faculty_id::text = f.emp_id::text
    LEFT JOIN "${schema}".subjects s ON ts.subject_id::text = s.id::text OR ts.subject_id::text = s.code::text
    LEFT JOIN "${schema}".batches b ON ts.batch_id::text = b.id::text OR ts.batch_id::text = b.code::text
    LEFT JOIN "${schema}".departments d ON ts.department_id::text = d.id::text OR ts.department_id::text = d.code::text
    LEFT JOIN "${schema}".courses c ON s.course_cd::text = c.course_cd::text OR s.course_cd::text = c.code::text OR b.course_cd::text = c.course_cd::text
    WHERE f.name ILIKE '%shorab%' OR ts.faculty_id::text = '879207b0-eaf4-43b0-b664-b6a854bbfe81'
    ORDER BY ts.day_of_week, ts.start_time
  `);

  console.log(JSON.stringify(res.rows, null, 2));

  await client.end();
}

main().catch(err => {
  console.error(err);
  client.end();
});
