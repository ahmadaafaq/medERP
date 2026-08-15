const { DataSource } = require('typeorm');
require('dotenv').config();

async function main() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'unicampus',
    password: process.env.DB_PASS || 'unicampus_secret',
    database: process.env.DB_NAME || 'unicampus_erp',
  });

  await ds.initialize();

  const slug = 'srms-cet-bareilly';

  // Natural code test payload
  const dto = {
    subject_code: '88534',
    phase_order: '3',
    dtype_code: 'TH',
    batch_year: 2025,
    hours_allotted: 100
  };

  // 1. Resolve subject
  const subRows = await ds.query(
    `SELECT id, name, code FROM "tenant_${slug}".subjects WHERE id::text = $1 OR code = $1 LIMIT 1`,
    [dto.subject_code]
  );
  console.log('Resolved subject:', subRows);

  // 2. Resolve phase
  const profRows = await ds.query(
    `SELECT id, name, phase_order FROM "tenant_${slug}".professional_phases WHERE id::text = $1 OR phase_order::text = $1 LIMIT 1`,
    [dto.phase_order]
  );
  console.log('Resolved phase:', profRows);

  // 3. Resolve dtype
  const dtRows = await ds.query(
    `SELECT id, name, code FROM "tenant_${slug}".delivery_types WHERE id::text = $1 OR code ILIKE $1 LIMIT 1`,
    [dto.dtype_code]
  );
  console.log('Resolved dtype:', dtRows);

  if (subRows.length > 0 && profRows.length > 0 && dtRows.length > 0) {
    const subjectId = subRows[0].id;
    const profId = profRows[0].id;
    const dtypeId = dtRows[0].id;

    // Delete if existing for testing
    await ds.query(`DELETE FROM "tenant_${slug}".subject_offerings WHERE subject_id = $1 AND prof_id = $2 AND dtype_id = $3 AND batch_year = $4`, [subjectId, profId, dtypeId, dto.batch_year]);

    const res = await ds.query(`
      INSERT INTO "tenant_${slug}".subject_offerings (subject_id, prof_id, dtype_id, batch_year, hours_allotted, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
    `, [subjectId, profId, dtypeId, dto.batch_year, dto.hours_allotted]);
    console.log('\nSubject offering successfully inserted into PostgreSQL:');
    console.table(res);
  }

  await ds.destroy();
}

main().catch(console.error);
