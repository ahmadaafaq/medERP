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
  // Link the 7 timetable slots to BCA 2025 batch
  await ds.query(`
    UPDATE "tenant_srms-cet-bareilly".timetable_slots
    SET batch_id = 'a33c661d-1edc-4f10-a9e8-df8c5e517a75'
    WHERE faculty_id = '879207b0-eaf4-43b0-b664-b6a854bbfe81';
  `);
  console.log('✅ Updated timetable_slots to link with BCA 2025 batch');
  await ds.destroy();
}

run().catch(console.error);
