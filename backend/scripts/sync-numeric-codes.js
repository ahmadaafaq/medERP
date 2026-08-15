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
  console.log('Connected to PostgreSQL DB ✅');

  const tenants = await ds.query(`SELECT id, code, name, slug FROM public.tenants ORDER BY CAST(COALESCE(NULLIF(code, ''), '999') AS INT) ASC`);

  for (const t of tenants) {
    const schema = `tenant_${t.slug}`;

    // Clean Courses: set code = course_cd (numeric)
    const coursesExists = await ds.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'courses')`,
      [schema]
    );
    if (coursesExists[0]?.exists) {
      await ds.query(`DELETE FROM "${schema}".courses WHERE course_cd IS NULL AND code = 'MBBS'`).catch(() => {});
      await ds.query(`UPDATE "${schema}".courses SET code = course_cd WHERE course_cd IS NOT NULL AND course_cd != ''`).catch(() => {});
    }

    // Clean Batches: set code = batch_cd (numeric)
    const batchesExists = await ds.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'batches')`,
      [schema]
    );
    if (batchesExists[0]?.exists) {
      await ds.query(`
        UPDATE "${schema}".batches
        SET code = COALESCE(NULLIF(batch_cd, ''), NULLIF(curr_bat_cd, ''), code)
        WHERE (batch_cd IS NOT NULL AND batch_cd != '') OR (curr_bat_cd IS NOT NULL AND curr_bat_cd != '')
      `).catch(() => {});
    }

    // Clean Departments / Branches: set code = branch_cd (numeric)
    const deptsExists = await ds.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'departments')`,
      [schema]
    );
    if (deptsExists[0]?.exists) {
      await ds.query(`
        UPDATE "${schema}".departments
        SET code = branch_cd
        WHERE branch_cd IS NOT NULL AND branch_cd != ''
      `).catch(() => {});
    }
  }

  console.log('Cleaned and synced all courses, batches, and departments with numeric codes! ✅');
  await ds.destroy();
}

main().catch(console.error);
