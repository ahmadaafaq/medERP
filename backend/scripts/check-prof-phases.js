const { Client } = require('pg');
const client = new Client({ host: 'localhost', port: 5432, user: 'unicampus', password: 'unicampus_secret', database: 'unicampus_erp' });

async function run() {
  await client.connect();
  const schemas = ['tenant_srms-ims', 'tenant_rajshreemri'];

  for (const s of schemas) {
    console.log(`\n=== Schema: ${s} ===`);
    try {
      const pPhases = await client.query(`SELECT id, name, phase_order FROM "${s}".professional_phases`);
      console.log('professional_phases:', pPhases.rows);
    } catch (e) {
      console.log('professional_phases error:', e.message);
    }
  }

  await client.end();
}

run().catch(console.error);
