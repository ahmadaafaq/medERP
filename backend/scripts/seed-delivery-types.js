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

  const tenants = await ds.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'`);
  console.log('Found schemas:', tenants.map(t => t.schema_name));

  const standardDtypes = [
    { code: 'TH', name: 'Theory' },
    { code: 'PR', name: 'Practical' },
    { code: 'AE', name: 'AETCOM' },
    { code: 'SDL', name: 'Self Directed Learning' },
    { code: 'CM', name: 'Clinical / Lab' },
    { code: 'TU', name: 'Tutorial' },
    { code: 'EL', name: 'Electives' },
  ];

  for (const t of tenants) {
    const s = t.schema_name;
    console.log(`\nChecking delivery_types in ${s}...`);
    for (const dt of standardDtypes) {
      await ds.query(`
        INSERT INTO "${s}".delivery_types (code, name, is_active)
        VALUES ($1, $2, true)
        ON CONFLICT (code) DO NOTHING
      `, [dt.code, dt.name]).catch(async () => {
        // If no unique constraint on code, check if exists
        const exists = await ds.query(`SELECT id FROM "${s}".delivery_types WHERE code = $1`, [dt.code]);
        if (exists.length === 0) {
          await ds.query(`INSERT INTO "${s}".delivery_types (code, name, is_active) VALUES ($1, $2, true)`, [dt.code, dt.name]);
        }
      });
    }

    const dtypesInSchema = await ds.query(`SELECT id, code, name FROM "${s}".delivery_types`);
    console.log(`${s} delivery types:`, dtypesInSchema);
  }

  await ds.destroy();
}

main().catch(console.error);
