require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: process.env.DB_NAME,
});

async function main() {
  const schema = 'tenant_srms-cet-bareilly';
  console.log(`Connecting to ${schema}...`);

  const reviewsToAdd = [
    {
      repo_id: 5,
      faculty_empid: 'FAC-CSE-001',
      faculty_name: 'Dr. R. K. Sharma',
      score: 94.00,
      grade: 'A+',
      remarks: 'Exceptional architectural rigor, clinical relevance, and complete REST API microservice integration.',
    },
    {
      repo_id: 6,
      faculty_empid: 'FAC-CSE-002',
      faculty_name: 'Prof. Ashish Kumar',
      score: 89.00,
      grade: 'A',
      remarks: 'Well-structured smart contract verifiable credentials architecture with instant QR cryptographic proof.',
    },
    {
      repo_id: 7,
      faculty_empid: 'FAC-PHARM-001',
      faculty_name: 'Dr. Nitin Sharma',
      score: 86.00,
      grade: 'A',
      remarks: 'Rigorous cold-chain pharmaceutical telemetry pipeline and temperature-excursion alerting.',
    },
    {
      repo_id: 8,
      faculty_empid: 'FAC-CSE-001',
      faculty_name: 'Dr. Rajesh Sharma',
      score: 96.00,
      grade: 'A+',
      remarks: 'Outstanding LiDAR SLAM point-cloud mapping and obstacle avoidance in live hardware demo.',
    },
    {
      repo_id: 9,
      faculty_empid: 'FAC-MGMT-001',
      faculty_name: 'Prof. Neha Agarwal',
      score: 82.00,
      grade: 'A',
      remarks: 'Sound econometric credit scoring heuristics combined with mobile money telemetry models.',
    },
  ];

  // Synchronize sequence before inserting
  try {
    await pool.query(
      `SELECT setval(
        pg_get_serial_sequence('"${schema}".repository_reviews', 'review_id'),
        COALESCE((SELECT MAX(review_id) FROM "${schema}".repository_reviews), 0) + 1,
        false
      );`
    );
  } catch (e) {
    console.warn('Sequence sync warning:', e.message);
  }

  for (const r of reviewsToAdd) {
    const existing = await pool.query(
      `SELECT * FROM "${schema}".repository_reviews WHERE repo_id = $1`,
      [r.repo_id]
    );

    if (existing.rows.length === 0) {
      console.log(`Inserting review for repo #${r.repo_id} (${r.faculty_name})...`);
      await pool.query(
        `INSERT INTO "${schema}".repository_reviews (
          repo_id, faculty_empid, faculty_name, score, grade, remarks, reviewed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '2 days')`,
        [r.repo_id, r.faculty_empid, r.faculty_name, r.score, r.grade, r.remarks]
      );
    } else {
      console.log(`Repo #${r.repo_id} already has a review record: ${existing.rows[0].faculty_name}`);
    }
  }

  console.log('Finished synchronizing repository reviews!');
  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
