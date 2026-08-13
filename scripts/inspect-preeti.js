const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/unicampus_erp' });
  await client.connect();

  const users = await client.query(`SELECT id, email, role FROM "tenant_srms-ims".users WHERE email = '20260002@srms.ac.in' OR role = 'STUDENT'`);
  console.log('--- USERS ---');
  console.log(users.rows);

  const students = await client.query(`SELECT id, user_id, registration_no, rollno, name FROM "tenant_srms-ims".students WHERE registration_no = '20260002' OR rollno = '20260002' OR name LIKE '%Preeti%'`);
  console.log('--- STUDENTS ---');
  console.log(students.rows);

  const attendanceLogs = await client.query(`
    SELECT ar.id, ar.status, s.session_date::text AS session_date, sub.name AS subject_name, sub.code AS subject_code, st.registration_no, st.name AS student_name
    FROM "tenant_srms-ims".attendance_records ar
    JOIN "tenant_srms-ims".students st ON st.id = ar.student_id
    JOIN "tenant_srms-ims".attendance_sessions s ON s.id = ar.session_id
    JOIN "tenant_srms-ims".subjects sub ON sub.id = s.subject_id
    WHERE st.registration_no = '20260002' OR st.rollno = '20260002' OR st.name LIKE '%Preeti%'
  `);
  console.log('--- ATTENDANCE LOGS FOR PREETI AGARWAL ---');
  console.log(attendanceLogs.rows);

  await client.end();
}

main().catch(console.error);
