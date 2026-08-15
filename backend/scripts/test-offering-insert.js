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

  // Test inserting the exact payload from the user
  const payload = {
    subject_id: "d3eb5821-3e7b-420b-9a0c-bbb1019b8da3",
    prof_id: "c60d6a6a-7c3a-4ebf-b1a5-8b2776d5c085",
    dtype_id: "29458ffa-7c77-4ee6-b132-0fbaf5f3a4ea",
    batch_year: 2025,
    hours_allotted: 100
  };

  try {
    const existing = await ds.query(`
      SELECT id FROM "tenant_srms-cet-bareilly".subject_offerings 
      WHERE subject_id = $1 AND prof_id = $2 AND dtype_id = $3 AND batch_year = $4
    `, [payload.subject_id, payload.prof_id, payload.dtype_id, payload.batch_year]);
    console.log('Existing:', existing);

    const res = await ds.query(`
      INSERT INTO "tenant_srms-cet-bareilly".subject_offerings (subject_id, prof_id, dtype_id, batch_year, hours_allotted, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
    `, [payload.subject_id, payload.prof_id, payload.dtype_id, payload.batch_year, payload.hours_allotted]);
    console.log('Insert success:', res);
  } catch (err) {
    console.error('Insert error:', err);
  }

  // Also check foreign key constraints on subject_offerings in tenant_srms-cet-bareilly
  const fks = await ds.query(`
    SELECT
        tc.table_schema, 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'tenant_srms-cet-bareilly' AND tc.table_name='subject_offerings';
  `);
  console.table(fks);

  await ds.destroy();
}

main().catch(console.error);
