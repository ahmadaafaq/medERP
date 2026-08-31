const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: '34.236.107.120',
    port: 5433,
    user: 'unicampus',
    password: 'unicampus_dev@qsd!3ous',
    database: 'unicampus_erp',
  });

  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';

  const tables = ['students', 'courses', 'departments', 'batches', 'faculty', 'logbook_submissions', 'logbook_topics', 'logbook_seminars', 'logbook_tutorials', 'logbook_mini_projects', 'logbook_weekly_logs', 'logbook_evaluations'];

  for (const t of tables) {
    const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `, [schema, t]);

    console.log(`\nColumns for ${schema}.${t}:`);
    console.log(cols.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));
  }

  await client.end();
}

main().catch(console.error);
