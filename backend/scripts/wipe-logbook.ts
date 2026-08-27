import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || 'unicampus_secret',
  database: process.env.DB_NAME || 'unicampus_erp',
  synchronize: false,
});

async function run() {
  await dataSource.initialize();
  console.log('Connected to DB');

  // Find all tenant schemas
  const schemas = await dataSource.query(`
    SELECT schema_name FROM information_schema.schemata
    WHERE schema_name LIKE 'tenant_%'
  `);

  console.log('Found tenant schemas:', schemas.map((s: any) => s.schema_name));

  const tablesToWipe = [
    'logbook_evaluations',
    'logbook_submissions',
    'logbook_weekly_logs',
    'logbook_seminars',
    'logbook_tutorials',
    'logbook_technical_activities',
    'logbook_project_reviews',
    'logbook_documents',
    'logbook_faculty_remarks',
    'logbook_final_evaluations',
    'logbook_entry_verifications',
    'logbook_entry_tags',
    'logbook_entry_attachments',
    'logbook_entries',
    'logbook_mini_projects',
  ];

  for (const s of schemas) {
    const schema = s.schema_name;
    console.log(`Wiping logbook student entry data in schema: ${schema}`);
    for (const tbl of tablesToWipe) {
      try {
        await dataSource.query(`TRUNCATE TABLE "${schema}"."${tbl}" CASCADE`);
        console.log(`  [OK] Truncated ${schema}.${tbl}`);
      } catch (err: any) {
        console.log(`  [SKIP/INFO] ${schema}.${tbl}: ${err.message}`);
      }
    }
  }

  console.log('All student logbook entries wiped clean. Clean slate ready.');
  await dataSource.destroy();
}

run().catch((err) => {
  console.error('Wipe failed:', err);
  process.exit(1);
});
