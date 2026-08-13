const { Client } = require('pg');

async function cleanup() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp',
  });

  try {
    await client.connect();
    const schema = 'tenant_srms-ims';
    console.log(`🧹 Cleaning up null-subject orphan sessions in ${schema}...`);
    
    // Delete attendance records linked to null-subject sessions
    const nullSessRes = await client.query(`SELECT id FROM "${schema}".attendance_sessions WHERE subject_id IS NULL`);
    const nullSessIds = nullSessRes.rows.map(r => r.id);
    if (nullSessIds.length > 0) {
      await client.query(`DELETE FROM "${schema}".attendance_records WHERE session_id = ANY($1)`, [nullSessIds]);
      await client.query(`DELETE FROM "${schema}".attendance_sessions WHERE id = ANY($1)`, [nullSessIds]);
      console.log(`✅ Removed ${nullSessIds.length} null-subject orphan sessions and their records.`);
    } else {
      console.log('ℹ️ No null-subject sessions found.');
    }
  } catch (err) {
    console.error('Error cleaning up:', err.message);
  } finally {
    await client.end();
  }
}

cleanup();
