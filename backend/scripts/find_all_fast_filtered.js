require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: process.env.DB_NAME,
});

async function main() {
  const client = await pool.connect();
  try {
    const schema = 'tenant_srms-cet-bareilly';
    console.log(`Scanning all relevant tables in ${schema}...`);

    const excludeTables = [
      'attendance_records',
      'biometric_logs',
      'attendance_biometric_logs',
      'biometric_punches',
      'audit_logs',
      'system_logs',
      'activity_logs'
    ];

    const tablesRes = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = $1 AND table_type = 'BASE TABLE'
        AND table_name NOT IN (${excludeTables.map((_, i) => '$' + (i + 2)).join(', ')})
      ORDER BY table_name;
    `, [schema, ...excludeTables]);

    const results = [];

    for (const t of tablesRes.rows) {
      const tbl = t.table_name;
      const colsRes = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = $2 
          AND data_type IN ('text', 'character varying', 'character');
      `, [schema, tbl]);

      for (const c of colsRes.rows) {
        const col = c.column_name;
        try {
          const hit = await client.query(`
            SELECT ctid, "${col}" as val FROM "${schema}"."${tbl}" 
            WHERE "${col}" ILIKE '%AAFREEN%';
          `);
          if (hit.rows.length > 0) {
            hit.rows.forEach(r => {
              results.push({
                table: tbl,
                column: col,
                ctid: r.ctid,
                value: String(r.val).trim(),
              });
            });
          }
        } catch (e) {}
      }
    }

    console.log('\n=== ALL MATCHES FOUND ===');
    console.log(`Total hits: ${results.length}`);
    results.forEach((r, idx) => {
      console.log(`${idx + 1}. [${r.table}].[${r.column}] (ctid: ${r.ctid}): "${r.value.substring(0, 120)}"`);
    });

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
