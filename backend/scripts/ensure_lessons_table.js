const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASSWORD || 'unicampus_secret',
  database: process.env.DB_NAME || 'unicampus_erp',
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL');

  const res = await client.query(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%'
  `);

  for (const row of res.rows) {
    const schema = row.schema_name;
    console.log(`Ensuring lessons table in ${schema}...`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".lessons (
        id SERIAL PRIMARY KEY,
        colg_cd VARCHAR(20) NOT NULL,
        course_cd VARCHAR(20) NOT NULL,
        branch_cd VARCHAR(20) NOT NULL,
        batch_cd VARCHAR(20) NOT NULL,
        sem_cd VARCHAR(20) NOT NULL,
        subject_id VARCHAR(100),
        unit_id VARCHAR(100),
        topic_id VARCHAR(100),
        subtopic_id VARCHAR(100),
        empid VARCHAR(50) NOT NULL,
        faculty_name VARCHAR(150),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        file_size BIGINT NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_lessons_academic ON "${schema}".lessons(colg_cd, course_cd, branch_cd, batch_cd, sem_cd);
      CREATE INDEX IF NOT EXISTS idx_lessons_faculty ON "${schema}".lessons(empid);
    `);
  }

  console.log('All tenant schemas updated with lessons table.');
  await client.end();
}

main().catch(err => {
  console.error('Error ensuring lessons table:', err);
  process.exit(1);
});
