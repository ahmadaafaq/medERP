import { DataSource } from 'typeorm';

async function run() {
  const ds = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'unicampus',
    password: 'unicampus_secret',
    database: 'unicampus_erp',
  });

  await ds.initialize();
  const schema = 'tenant_srms-ims';

  console.log('=== ALL ATTENDANCE SESSIONS IN TENANT ===');
  const sessions = await ds.query(`
    SELECT s.id, s.session_date, s.subject_id, sub.code as sub_code, s.batch_id, s.is_cancelled, s.created_at
    FROM "${schema}".attendance_sessions s
    LEFT JOIN "${schema}".subjects sub ON sub.id = s.subject_id
    ORDER BY s.session_date ASC
  `);
  console.table(sessions);

  console.log('=== ALL ATTENDANCE RECORDS FOR PRIYA M NAIR ===');
  const priyaRecs = await ds.query(`
    SELECT ar.id as record_id, ar.session_id, ar.student_id, ar.status, ar.marked_by, ar.created_at, ar.updated_at,
           s.session_date, sub.code as subject_code
    FROM "${schema}".attendance_records ar
    JOIN "${schema}".attendance_sessions s ON s.id = ar.session_id
    LEFT JOIN "${schema}".subjects sub ON sub.id = s.subject_id
    WHERE ar.student_id IN (
      SELECT id FROM "${schema}".students WHERE name ILIKE '%Priya%' OR registration_no = '20260007' OR rollno = '20260007'
    )
  `);
  console.table(priyaRecs);

  console.log('=== ALL ATTENDANCE RECORDS FOR PREETI AGARWAL ===');
  const preetiRecs = await ds.query(`
    SELECT ar.id as record_id, ar.session_id, ar.student_id, ar.status, ar.marked_by, ar.created_at, ar.updated_at,
           s.session_date, sub.code as subject_code
    FROM "${schema}".attendance_records ar
    JOIN "${schema}".attendance_sessions s ON s.id = ar.session_id
    LEFT JOIN "${schema}".subjects sub ON sub.id = s.subject_id
    WHERE ar.student_id IN (
      SELECT id FROM "${schema}".students WHERE name ILIKE '%Preeti%' OR registration_no = '20260002' OR rollno = '20260002'
    )
  `);
  console.table(preetiRecs);

  await ds.destroy();
}

run().catch(console.error);
