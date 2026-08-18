const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { DataSource } = require('typeorm');

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || 'unicampus_secret',
  database: process.env.DB_NAME || 'unicampus_erp',
});

async function run() {
  await ds.initialize();
  const bcaBatches = await ds.query(`SELECT id, code, name, year, course_cd, course_name FROM "tenant_srms-cet-bareilly".batches WHERE course_cd = '13' OR course_name ILIKE '%BCA%';`);
  console.log('BCA Batches in CET:', bcaBatches);

  const bcaSlots = await ds.query(`SELECT ts.id, ts.day_of_week, ts.start_time, ts.end_time, ts.room, s.name as subject_name, s.code as subject_code, f.name as faculty_name, b.code as batch_code, b.name as batch_name, ts.batch_id
    FROM "tenant_srms-cet-bareilly".timetable_slots ts
    LEFT JOIN "tenant_srms-cet-bareilly".subjects s ON s.id = ts.subject_id
    LEFT JOIN "tenant_srms-cet-bareilly".faculty f ON f.id = ts.faculty_id
    LEFT JOIN "tenant_srms-cet-bareilly".batches b ON b.id = ts.batch_id;`);
  console.log('All Timetable Slots in CET:', bcaSlots);

  await ds.destroy();
}

run().catch(console.error);
