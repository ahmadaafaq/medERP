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
  const course_cd = '1';
  const batch_cd = '18';
  const studentRows = await client.query(`
    SELECT s.id, s.name AS stud_name, s.registration_no AS stud_reg_no, s.rollno AS stud_roll_no,
            s.course_cd, s.batch_cd, s.batch_id
    FROM "${schema}".students s
    WHERE (s.course_cd::text = $1::text OR $1 IS NULL)
      AND (
        $2::text IS NULL
        OR s.batch_cd::text = $2::text
        OR s.batch_id::text = $2::text
        OR (s.batch_cd::text = '2025' AND $2::text IN ('18', '2', '2025'))
      )
    ORDER BY s.rollno ASC, s.name ASC
  `, [course_cd, batch_cd]);
  console.log('Found students count:', studentRows.rows.length);

  const slotSubs = await client.query(`
    SELECT DISTINCT COALESCE(sub.code, '85717') AS sub_cd,
                    COALESCE(sub.name, ts.topic, ts.description, 'Subject') AS sub_name,
                    ts.subject_id
    FROM "${schema}".timetable_slots ts
    LEFT JOIN "${schema}".subjects sub ON sub.id::text = ts.subject_id::text
    WHERE (ts.course_cd::text = $1::text OR $1 IS NULL)
  `, [course_cd]);
  console.log('Slot subjects count:', slotSubs.rows.length);
  console.log('Slot subjects:', slotSubs.rows);

  await client.end();
}

run().catch(console.error);
