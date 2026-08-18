const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp'
  });
  await client.connect();

  console.log('Connected to DB for batch cleanup & sync.');

  const schemasRes = await client.query(`
    SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'
  `);
  const schemas = schemasRes.rows.map(r => r.schema_name);

  for (const schema of schemas) {
    // 1. Remove synthetic dummy batches with codes like B2022-C13-1
    await client.query(`
      DELETE FROM "${schema}".batches 
      WHERE code LIKE 'B202%-C%' OR code LIKE 'SYNTH-%'
    `).catch(() => {});

    // 2. Ensure CET (colg_cd 1) BCA (course_cd 13) has exact 3 official batches
    if (schema === 'tenant_srms-cet-bareilly') {
      const bcaBatches = [
        { batch_cd: '1', code: '1', year: 2024, name: '2024', course_cd: '13', course_name: 'BCA', colg_cd: '1', curr_bat_cd: '1' },
        { batch_cd: '2', code: '2', year: 2025, name: '2025', course_cd: '13', course_name: 'BCA', colg_cd: '1', curr_bat_cd: '2' },
        { batch_cd: '3', code: '3', year: 2026, name: '2026', course_cd: '13', course_name: 'BCA', colg_cd: '1', curr_bat_cd: '3' },
      ];

      for (const b of bcaBatches) {
        const existing = await client.query(`
          SELECT id FROM "${schema}".batches 
          WHERE (batch_cd = $1 OR code = $1) AND course_cd = $2
        `, [b.batch_cd, b.course_cd]);

        if (existing.rows.length === 0) {
          await client.query(`
            INSERT INTO "${schema}".batches (code, year, course_cd, batch_cd, course_name, colg_cd, curr_bat_cd, name, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
          `, [b.code, b.year, b.course_cd, b.batch_cd, b.course_name, b.colg_cd, b.curr_bat_cd, b.name]);
        } else {
          await client.query(`
            UPDATE "${schema}".batches 
            SET batch_cd = $1, code = $1, year = $2, name = $3, colg_cd = $4, curr_bat_cd = $5, course_name = $6
            WHERE id = $7
          `, [b.batch_cd, b.year, b.name, b.colg_cd, b.curr_bat_cd, b.course_name, existing.rows[0].id]);
        }
      }
    }

    const count = await client.query(`SELECT count(*) FROM "${schema}".batches`).catch(() => ({ rows: [{ count: 0 }] }));
    console.log(`Schema ${schema} batches count: ${count.rows[0].count}`);
  }

  // Check BCA batches in CET
  const cetBca = await client.query(`
    SELECT id, code, year, course_cd, batch_cd, name FROM "tenant_srms-cet-bareilly".batches WHERE course_cd = '13'
  `);
  console.log('Final BCA batches in CET:', cetBca.rows);

  await client.end();
}

main().catch(console.error);
