const { Client } = require('pg');

async function testQuery() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'unicampus',
    password: 'unicampus_secret',
    database: 'unicampus_erp',
  });

  await client.connect();

  const tenantSlug = 'tenant_srms-ims';
  const mode = 'MCQ';
  const subjectId = 'bd3e051a-7513-4f9e-8577-0e1ec39e3527';
  const topicId = '0fb688a4-41d8-4767-87e7-e010fc25355d';
  const competencyCode = 'PY1.1(2024)';

  const compCodeOnly = competencyCode.includes(':') ? competencyCode.split(':')[0].trim() : competencyCode.trim();
  const rootCodeMatch = compCodeOnly.match(/^([A-Za-z]+\s*\d+(?:\.\d+)?)/);
  const rootCode = rootCodeMatch ? rootCodeMatch[1].replace(/\s+/g, '') : compCodeOnly;

  console.log('compCodeOnly:', compCodeOnly);
  console.log('rootCode:', rootCode);

  const sql = `
    SELECT q.id, q.question_text, q.topic, q.topic_id, q.competency_code, q.competency_id, q.subject_id, q.mode
    FROM "${tenantSlug}".question_bank q
    WHERE q.is_active = true
      AND (q.subject_id::text = $1::text OR q.subject_id IS NULL)
      AND q.mode = $2
      AND (
        q.topic_id::text = $3::text
        OR q.topic::text = $3::text
        OR q.topic IN (SELECT name FROM "${tenantSlug}".topics WHERE id::text = $3::text)
        OR q.topic IN (SELECT code FROM "${tenantSlug}".topics WHERE id::text = $3::text)
        OR q.topic_id IN (SELECT id FROM "${tenantSlug}".topics WHERE id::text = $3::text)
      )
      AND (
        LOWER(TRIM(q.competency_code)) = LOWER($4)
        OR LOWER(TRIM(q.competency_code)) = LOWER($5)
        OR LOWER(q.competency_code) LIKE '%' || LOWER($4) || '%'
        OR LOWER(q.competency_code) LIKE '%' || LOWER($5) || '%'
        OR LOWER($4) LIKE '%' || LOWER(q.competency_code) || '%'
        OR LOWER($5) LIKE '%' || LOWER(q.competency_code) || '%'
        OR q.competency_id IN (SELECT id FROM "${tenantSlug}".competencies WHERE LOWER(code) LIKE '%' || LOWER($5) || '%')
      )
    ORDER BY q.created_at DESC
  `;

  const res = await client.query(sql, [subjectId, mode, topicId, compCodeOnly, rootCode]);
  console.log('SUCCESS! Query result count:', res.rows.length);
  console.table(res.rows);

  await client.end();
}

testQuery().catch(console.error);
