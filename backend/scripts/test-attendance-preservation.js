const { DataSource } = require('typeorm');
require('dotenv').config();

async function testAttendancePreservation() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'unicampus',
    password: process.env.DB_PASS || 'unicampus_secret',
    database: process.env.DB_NAME || 'unicampus_erp',
  });

  await ds.initialize();
  console.log('✅ Connected to database.');

  const schema = 'tenant_srms-cet-bareilly';

  // 1. Check constraints on attendance_sessions.offering_id
  const constraints = await ds.query(`
    SELECT tc.constraint_name, rc.delete_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = '${schema}' 
      AND tc.table_name = 'attendance_sessions' 
      AND kcu.column_name = 'offering_id'
  `);
  console.log('Constraint check for offering_id in attendance_sessions:', constraints);

  // 2. Count existing subjects, offerings, attendance_sessions
  const [subs] = await ds.query(`SELECT count(*) FROM "${schema}".subjects`);
  const [offs] = await ds.query(`SELECT count(*) FROM "${schema}".subject_offerings`);
  const [atts] = await ds.query(`SELECT count(*) FROM "${schema}".attendance_sessions`);
  const [attr] = await ds.query(`SELECT count(*) FROM "${schema}".attendance_records`);

  console.log(`Current stats:
    - Subjects: ${subs.count}
    - Subject Offerings: ${offs.count}
    - Attendance Sessions: ${atts.count}
    - Attendance Records: ${attr.count}
  `);

  await ds.destroy();
  console.log('✅ Test complete.');
}

testAttendancePreservation().catch(console.error);
