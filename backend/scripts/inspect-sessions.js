const { Client } = require('pg');

async function inspect() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp',
  });

  try {
    await client.connect();
    const schema = 'tenant_srms-ims';
    console.log(`=== SCHEMA: ${schema} ===`);
    const sessRes = await client.query(`
      SELECT s.id, s.session_date::text, s.session_type, s.subject_id, sub.name as subject_name, sub.code as subject_code, s.batch_id, b.code as batch_code, s.is_cancelled,
             COUNT(ar.id) as record_count
      FROM "${schema}".attendance_sessions s
      LEFT JOIN "${schema}".subjects sub ON sub.id = s.subject_id
      LEFT JOIN "${schema}".batches b ON b.id = s.batch_id
      LEFT JOIN "${schema}".attendance_records ar ON ar.session_id = s.id
      WHERE s.session_date >= '2026-08-01'
      GROUP BY s.id, s.session_date, s.session_type, s.subject_id, sub.name, sub.code, s.batch_id, b.code, s.is_cancelled
      ORDER BY s.session_date ASC
    `);
    console.table(sessRes.rows);
  } catch (err) {
    console.error('Error inspecting:', err.message);
  } finally {
    await client.end();
  }
}

inspect();
