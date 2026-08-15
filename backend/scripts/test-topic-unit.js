const { Client } = require('pg');

async function testTopicCreation() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'unicampus',
    password: 'unicampus_secret',
    database: 'unicampus_erp',
  });

  await client.connect();

  const schema = 'tenant_srms-cet-bareilly';

  // Fetch a subject and unit
  const subRes = await client.query(`SELECT id, code, name FROM "${schema}".subjects LIMIT 1`);
  const unitRes = await client.query(`SELECT id, code, name, bloom_level FROM "${schema}".units LIMIT 1`);

  console.log('Sample Subject:', subRes.rows[0]);
  console.log('Sample Unit:', unitRes.rows[0]);

  if (subRes.rows.length > 0 && unitRes.rows.length > 0) {
    const sub = subRes.rows[0];
    const unit = unitRes.rows[0];

    // Insert sample topic
    const topicCode = `${sub.code}-${unit.code.replace('UNIT-', 'U')}-T01`;
    const insertRes = await client.query(`
      INSERT INTO "${schema}".topics 
      (code, name, description, subject_id, subject_code, unit_id, unit_code, bloom_level, hours, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
      RETURNING *
    `, [
      topicCode,
      'HTML5 Semantic Markup and Structure',
      'Detailed overview of HTML5 semantic tags, doctypes, DOM tree, and accessibility standards.',
      sub.id,
      sub.code,
      unit.id,
      unit.code,
      unit.bloom_level || 'KL-2 (Understand)',
      2,
    ]);

    console.log('Created Topic:', insertRes.rows[0]);

    // Query topics with joins
    const listRes = await client.query(`
      SELECT t.*, s.name as subject_name, s.code as subject_code, u.name as unit_name, u.code as unit_code, u.bloom_level as unit_bloom_level
      FROM "${schema}".topics t
      LEFT JOIN "${schema}".subjects s ON (t.subject_id = s.id OR t.subject_code = s.code)
      LEFT JOIN "${schema}".units u ON (t.unit_id = u.id OR t.unit_code = u.code)
      ORDER BY t.created_at DESC
      LIMIT 5
    `);

    console.log('Queried Topics Count:', listRes.rows.length);
    console.log('First Topic:', listRes.rows[0]);
  }

  await client.end();
}

testTopicCreation().catch(console.error);
