const { DataSource } = require('typeorm');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || 'unicampus_secret',
  database: process.env.DB_NAME || 'unicampus_erp',
});

async function clearPhases() {
  await ds.initialize();
  console.log('Connected to DB');
  const schemas = await ds.query(`
    SELECT schema_name FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%'
  `);
  for (const s of schemas) {
    const schema = s.schema_name;
    try {
      await ds.query(`TRUNCATE TABLE "${schema}".professional_phases CASCADE;`);
      console.log('Cleared professional_phases in schema:', schema);
    } catch (e) {
      console.log('Skipped schema:', schema, e.message);
    }
  }
  await ds.destroy();
  console.log('Done! All professional_phases cleared.');
}

clearPhases().catch(console.error);
