const { Client } = require('pg');
const client = new Client({
  host: '34.236.107.120',
  port: 5433,
  user: 'unicampus',
  password: 'unicampus_dev@qsd!3ous',
  database: 'unicampus_erp'
});

async function run() {
  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';
  await client.query(`
    ALTER TABLE "${schema}".logbook_submissions ADD COLUMN IF NOT EXISTS annotations JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE "${schema}".logbook_submissions ADD COLUMN IF NOT EXISTS marks_awarded NUMERIC(6,2);
    ALTER TABLE "${schema}".logbook_submissions ADD COLUMN IF NOT EXISTS remarks TEXT;
    ALTER TABLE "${schema}".logbook_submissions ADD COLUMN IF NOT EXISTS evaluated_file_url VARCHAR(1000);
    ALTER TABLE "${schema}".logbook_submissions ADD COLUMN IF NOT EXISTS evaluated_file_path VARCHAR(1000);
    ALTER TABLE "${schema}".logbook_submissions ADD COLUMN IF NOT EXISTS original_file_url VARCHAR(1000);
    ALTER TABLE "${schema}".logbook_submissions ADD COLUMN IF NOT EXISTS original_file_path VARCHAR(1000);
    ALTER TABLE "${schema}".logbook_submissions ADD COLUMN IF NOT EXISTS file_type VARCHAR(50) DEFAULT 'pdf';
    ALTER TABLE "${schema}".logbook_submissions ADD COLUMN IF NOT EXISTS evaluated_at TIMESTAMP WITH TIME ZONE;
  `);
  console.log('Columns successfully ensured on logbook_submissions!');
  await client.end();
}

run().catch(console.error);
