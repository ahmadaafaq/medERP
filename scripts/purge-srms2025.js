const { Client } = require('pg');

async function purgeOldSrms2025() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp',
  });

  try {
    await client.connect();

    const schemas = ['tenant_srms-ims', 'tenant_srms'];
    for (const schema of schemas) {
      console.log(`🧹 Purging SRMS2025 from "${schema}"...`);

      // Find student IDs with registration_no starting with SRMS2025
      const res = await client.query(`
        SELECT id FROM "${schema}".students WHERE registration_no LIKE 'SRMS2025%'
      `);

      const ids = res.rows.map((r) => r.id);
      if (ids.length > 0) {
        await client.query(`DELETE FROM "${schema}".student_admissions WHERE student_id = ANY($1)`, [ids]);
        await client.query(`DELETE FROM "${schema}".students WHERE id = ANY($1)`, [ids]);
        console.log(` ✅ Purged ${ids.length} old SRMS2025 entries in ${schema}`);
      } else {
        console.log(` ℹ️ No SRMS2025 entries found in ${schema}`);
      }
    }
  } catch (err) {
    console.error('❌ Error purging SRMS2025:', err);
  } finally {
    await client.end();
  }
}

purgeOldSrms2025();
