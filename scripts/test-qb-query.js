const { Client } = require('../backend/node_modules/pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function run() {
  await client.connect();

  const slug = 'tenant_srms-ims';
  const subjectId = 'bd3e051a-7513-4f9e-8577-0e1ec39e3527';
  const topicId = '0fb688a4-41d8-4767-87e7-e010fc25355d';
  const competencyCode = 'PY1.1(2024)';
  const mode = 'MCQ';

  console.log('=== 1. Check Topic in DB ===');
  const tRes = await client.query(`SELECT * FROM "${slug}".topics WHERE id = $1`, [topicId]);
  console.log('Topic row:', tRes.rows);

  console.log('=== 2. Check Competency in DB ===');
  const cRes = await client.query(`SELECT * FROM "${slug}".competencies WHERE topic_id = $1`, [topicId]);
  console.log('Competency rows for topic:', cRes.rows);

  console.log('=== 3. Check All Questions in DB for this subject ===');
  const qAll = await client.query(`SELECT id, mode, topic, topic_id, competency_code, competency_id, subject_id, is_active FROM "${slug}".question_bank WHERE subject_id = $1`, [subjectId]);
  console.log('Questions for subject:', qAll.rows);

  // Now run the SQL from examination.service.ts
  const params = [];
  let sql = `
    SELECT q.*, d.name AS department_name, s.name AS subject_name, s.code AS subject_code
    FROM "${slug}".question_bank q
    LEFT JOIN "${slug}".departments d ON d.id = q.department_id
    LEFT JOIN "${slug}".subjects s ON s.id = q.subject_id
    WHERE q.is_active = true
  `;

  // subjectId
  params.push(subjectId);
  sql += ` AND (q.subject_id::text = $${params.length}::text OR q.subject_id IS NULL OR q.department_id::text IN (SELECT department_id::text FROM "${slug}".subjects WHERE id::text = $${params.length}::text AND department_id IS NOT NULL))`;

  // mode
  params.push(mode);
  sql += ` AND q.mode = $${params.length}`;

  // topicId
  params.push(topicId);
  sql += ` AND (
    q.topic_id::text = $${params.length}::text 
    OR q.topic::text = $${params.length}::text
    OR q.topic IN (SELECT name FROM "${slug}".topics WHERE id::text = $${params.length}::text)
    OR q.topic IN (SELECT code FROM "${slug}".topics WHERE id::text = $${params.length}::text)
    OR q.topic_id::text IN (SELECT id::text FROM "${slug}".topics WHERE id::text = $${params.length}::text)
  )`;

  // competencyCode
  const compCodeOnly = competencyCode.includes(':') ? competencyCode.split(':')[0].trim() : competencyCode.trim();
  const rootCodeMatch = compCodeOnly.match(/^([A-Za-z]+\s*\d+(?:\.\d+)?)/);
  const rootCode = rootCodeMatch ? rootCodeMatch[1].replace(/\s+/g, '') : compCodeOnly;

  params.push(compCodeOnly);
  const idx1 = params.length;
  params.push(rootCode);
  const idx2 = params.length;

  sql += ` AND (
    LOWER(TRIM(q.competency_code)) = LOWER($${idx1})
    OR LOWER(TRIM(q.competency_code)) = LOWER($${idx2})
    OR LOWER(q.competency_code) LIKE '%' || LOWER($${idx1}) || '%'
    OR LOWER(q.competency_code) LIKE '%' || LOWER($${idx2}) || '%'
    OR LOWER($${idx1}) LIKE '%' || LOWER(q.competency_code) || '%'
    OR LOWER($${idx2}) LIKE '%' || LOWER(q.competency_code) || '%'
    OR q.competency_id::text IN (SELECT id::text FROM "${slug}".competencies WHERE LOWER(code) LIKE '%' || LOWER($${idx2}) || '%')
  )`;

  console.log('=== 4. Test Full Query ===');
  console.log('SQL:', sql);
  console.log('Params:', params);
  const qResult = await client.query(sql, params);
  console.log('MATCHED QUESTIONS COUNT:', qResult.rows.length);
  qResult.rows.forEach(r => console.log(' -> Found:', r.id, r.mode, r.topic, r.competency_code));

  await client.end();
}

run().catch(console.error);
