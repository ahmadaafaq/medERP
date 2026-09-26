const { Client } = require('pg');
const c = new Client({
  host: process.env.DB_HOST || '34.236.107.120',
  port: +(process.env.DB_PORT || '5433'),
  user: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || 'unicampus_dev@qsd!3ous',
  database: process.env.DB_NAME || 'unicampus_erp',
  ssl: false,
});

const SCHEMA = 'tenant_srms-cet-bareilly';

async function main() {
  await c.connect();
  console.log('✅ Connected\n');

  // 1. Subjects table columns
  const colsRes = await c.query(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = 'subjects'
     ORDER BY ordinal_position`,
    [SCHEMA]
  );
  console.log('📋 SUBJECTS TABLE COLUMNS:');
  colsRes.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));

  // 2. Sample subjects
  const subjRes = await c.query(`SELECT * FROM "${SCHEMA}".subjects LIMIT 5`);
  console.log('\n📌 SAMPLE SUBJECTS:');
  console.log(JSON.stringify(subjRes.rows, null, 2));

  // 3. Timetable slots subject columns
  const ttColsRes = await c.query(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = 'timetable_slots'
     AND column_name ILIKE '%subject%'`,
    [SCHEMA]
  );
  console.log('\n📋 TIMETABLE_SLOTS SUBJECT COLUMNS:');
  ttColsRes.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));

  // 4. Sample timetable slots with subject info
  const ttRes = await c.query(
    `SELECT id, subject_id, topic, description FROM "${SCHEMA}".timetable_slots LIMIT 5`
  );
  console.log('\n📌 SAMPLE TIMETABLE SLOTS:');
  console.log(JSON.stringify(ttRes.rows, null, 2));

  // 5. Does subjects have a subject_cd or code column?
  const hasCd = colsRes.rows.some(r => r.column_name === 'subject_cd' || r.column_name === 'code');
  console.log(`\n🔍 subject_cd/code exists in subjects: ${hasCd}`);

  await c.end();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
