const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function exportData() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'unicampus',
    password: process.env.DB_PASS || 'unicampus_secret',
    database: process.env.DB_NAME || 'unicampus_erp',
  });

  await client.connect();
  console.log('Connected to PostgreSQL database...');

  const dumpFile = path.join(__dirname, 'dump_latest_erp_data.json');

  // Export tenants
  const tenants = (await client.query('SELECT * FROM public.tenants ORDER BY code ASC')).rows;
  
  // Export all tenant schemas
  const schemasResult = await client.query(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%'
    ORDER BY schema_name ASC
  `);

  const tenantData = {};
  for (const s of schemasResult.rows) {
    const schema = s.schema_name;
    tenantData[schema] = {};

    const tables = ['courses', 'branches', 'batches', 'departments', 'subjects', 'subject_offerings', 'faculty', 'users', 'students', 'timetable_slots', 'delivery_types', 'professional_phases', 'academic_years'];
    for (const tbl of tables) {
      try {
        const rows = (await client.query(`SELECT * FROM "${schema}"."${tbl}"`)).rows;
        tenantData[schema][tbl] = rows;
      } catch(e) {}
    }
  }

  const exportObj = {
    exported_at: new Date().toISOString(),
    tenants,
    tenant_schemas: tenantData,
  };

  fs.writeFileSync(dumpFile, JSON.stringify(exportObj, null, 2), 'utf-8');
  console.log(`Exported full database data to ${dumpFile} (${(fs.statSync(dumpFile).size / 1024 / 1024).toFixed(2)} MB)`);

  await client.end();
}

exportData().catch(console.error);
