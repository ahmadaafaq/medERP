const { Client } = require('../backend/node_modules/pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function fixPhysiologyMappings() {
  await client.connect();
  console.log('=== FIXING PHYSIOLOGY TOPICS, COMPETENCIES & QUESTION BANK MAPPINGS ===');
  const schema = 'tenant_srms-ims';

  // 1. Resolve Physiology Subject & Departments
  const subjRes = await client.query(`SELECT id FROM "${schema}".subjects WHERE name ILIKE '%physio%' OR code IN ('PHY', 'PY') LIMIT 1`);
  const subjId = subjRes.rows[0]?.id || 'bd3e051a-7513-4f9e-8577-0e1ec39e3527';

  const deptsRes = await client.query(`SELECT id, name FROM "${schema}".departments WHERE name ILIKE '%physio%' OR code IN ('PHY', 'PY')`);
  const deptIds = deptsRes.rows.map(r => r.id);
  const primaryDeptId = deptIds[0] || 'e730b589-4310-416b-be05-5ce9e42426e8';

  console.log(`Physiology Subject ID: ${subjId}`);
  console.log(`Physiology Department IDs: ${deptIds.join(', ')}`);

  // 2. Link all Physiology Topics to Subject
  await client.query(
    `UPDATE "${schema}".topics SET subject_id = $1 WHERE name ILIKE '%physio%' OR code ILIKE 'PY%' OR name ILIKE '%topic%'`,
    [subjId]
  );
  console.log('Updated Topics subject_id.');

  // Fetch all topics to build map
  const topicsRes = await client.query(`SELECT id, code, name FROM "${schema}".topics WHERE subject_id = $1`, [subjId]);
  const topicMap = new Map();
  topicsRes.rows.forEach(t => {
    topicMap.set(t.name.toLowerCase(), t.id);
    if (t.code) topicMap.set(t.code.toLowerCase(), t.id);
  });

  // 3. Link all Competencies to Subject and corresponding Topic
  const t1Id = topicMap.get('topic 01: general physiology (2024)') || topicsRes.rows[0]?.id;
  const t2Id = topicMap.get('topic 02 : haematology (2024)') || topicsRes.rows[1]?.id || t1Id;

  await client.query(
    `UPDATE "${schema}".competencies SET subject_id = $1, topic_id = $2 WHERE code IN ('PY1.1(2024)', 'PY-1.1', 'PY-1.2')`,
    [subjId, t1Id]
  );

  await client.query(
    `UPDATE "${schema}".competencies SET subject_id = $1, topic_id = $2 WHERE code IN ('PY2.1(2024)', 'PY-2.1', 'PY-2.2', 'PY-3.1', 'PY-3.2')`,
    [subjId, t2Id]
  );

  await client.query(
    `UPDATE "${schema}".competencies SET subject_id = $1 WHERE code LIKE 'PY%' OR code LIKE 'AN%'`,
    [subjId]
  );

  console.log('Updated Competencies subject_id and topic_id.');

  // 4. Update Question Bank records to ensure subject_id and department_id are correctly populated
  await client.query(
    `UPDATE "${schema}".question_bank SET subject_id = $1, department_id = $2 WHERE (topic ILIKE '%physio%' OR topic ILIKE '%haematology%' OR competency_code LIKE 'PY%')`,
    [subjId, primaryDeptId]
  );

  // Normalize competency codes in question_bank so PY-1.1 and PY1.1(2024) both match
  await client.query(
    `UPDATE "${schema}".question_bank SET competency_code = 'PY1.1(2024)' WHERE competency_code = 'PY-1.1'`
  );
  await client.query(
    `UPDATE "${schema}".question_bank SET competency_code = 'PY2.1(2024)' WHERE competency_code = 'PY-2.1'`
  );

  console.log('Question Bank records normalized and mapped to Subject & Department.');
  await client.end();
}

fixPhysiologyMappings().catch(e => console.error('PG FIX ERROR:', e));
