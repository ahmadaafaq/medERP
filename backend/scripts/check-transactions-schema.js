const { Client } = require('pg');
const c = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp',
});

c.connect().then(async () => {
  const lkCols = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'license_keys'");
  console.log('LICENSE_KEYS COLUMNS:', lkCols.rows);

  const keys = await c.query("SELECT * FROM public.license_keys LIMIT 5");
  console.log('SAMPLE KEYS:', keys.rows);

  const txs = await c.query("SELECT * FROM public.transactions LIMIT 5");
  console.log('SAMPLE TXS:', txs.rows);

  await c.end();
}).catch(console.error);
