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

  const tenants = await ds.query(`SELECT slug FROM public.tenants WHERE is_active = true`);

  for (const t of tenants) {
    const schema = `tenant_${t.slug}`;
    console.log(`Processing schema ${schema}...`);

    try {
      // Drop single-column unique constraint on departments.code if exists
      await ds.query(`ALTER TABLE "${schema}".departments DROP CONSTRAINT IF EXISTS departments_code_key CASCADE`);
      await ds.query(`ALTER TABLE "${schema}".departments DROP CONSTRAINT IF EXISTS uq_departments_code CASCADE`);

      await ds.query(`ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50)`);
      await ds.query(`ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS course_name VARCHAR(200)`);
      await ds.query(`ALTER TABLE "${schema}".subjects ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50)`);
      
      // Update departments where code still contains composite prefixes
      await ds.query(`
        UPDATE "${schema}".departments 
        SET code = branch_cd 
        WHERE branch_cd IS NOT NULL AND branch_cd != ''
      `);

      // Update departments where course_name is null by looking up courses
      await ds.query(`
        UPDATE "${schema}".departments d
        SET course_name = c.name
        FROM "${schema}".courses c
        WHERE (d.course_cd = c.code OR d.course_cd = c.course_cd)
          AND (d.course_name IS NULL OR d.course_name = '')
      `);

      // Update subjects course_cd, course_name, branch_cd from linked department
      await ds.query(`
        UPDATE "${schema}".subjects s
        SET course_cd = d.course_cd,
            course_name = d.course_name,
            branch_cd = d.branch_cd
        FROM "${schema}".departments d
        WHERE s.department_id = d.id
          AND (s.course_cd IS NULL OR s.course_cd = '')
      `);

      console.log(`Updated schema ${schema} successfully.`);
    } catch (e) {
      console.warn(`Error on schema ${schema}:`, e.message);
    }
  }

  await ds.destroy();
}

main().catch(console.error);
