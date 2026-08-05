const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));

async function ensureColumns() {
  const client = new Client({ connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp' });
  await client.connect();

  try {
    const schemas = ['tenant_srms-ims', 'tenant_rajshreemri'];

    for (const s of schemas) {
      await client.query(`ALTER TABLE "${s}".attendance_sessions ADD COLUMN IF NOT EXISTS topic_covered VARCHAR(500)`);
      await client.query(`ALTER TABLE "${s}".attendance_sessions ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT false`);
      await client.query(`ALTER TABLE "${s}".attendance_sessions ADD COLUMN IF NOT EXISTS timetable_slot_id UUID`);
      await client.query(`ALTER TABLE "${s}".attendance_records ADD COLUMN IF NOT EXISTS remarks VARCHAR(500)`);
      await client.query(`ALTER TABLE "${s}".attendance_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      console.log(`Schema ${s} attendance tables updated successfully!`);
    }
  } catch (err) {
    console.error('Error altering table:', err);
  } finally {
    await client.end();
  }
}

ensureColumns();
