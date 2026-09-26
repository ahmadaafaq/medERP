const { Client } = require('pg');

const client = new Client({
  host: '34.236.107.120',
  port: 5433,
  user: 'unicampus',
  password: 'unicampus_dev@qsd!3ous',
  database: 'unicampus_erp',
});

async function run() {
  await client.connect();

  const updateRes = await client.query(`
    UPDATE "tenant_srms-cet-bareilly".timetable_slots ts
    SET subject_id = s.id
    FROM "tenant_srms-cet-bareilly".subjects s
    WHERE ts.subject_id IS NULL
      AND (
        s.id::text = ts.topic
        OR s.code = ts.topic
        OR LOWER(s.name) = LOWER(ts.topic)
        OR (LOWER(ts.topic) = 'coa' AND (s.name ILIKE '%Computer Organization%' OR s.code ILIKE '%302%'))
        OR (LOWER(ts.topic) LIKE '%tc%' AND s.name ILIKE '%Technical Communication%')
        OR (LOWER(ts.topic) LIKE '%web technology lab%' AND s.name ILIKE '%Web Technology Lab%')
        OR (LOWER(ts.topic) LIKE '%web technology%' AND s.name ILIKE '%Web Technology%')
        OR (LOWER(ts.topic) LIKE '%business communication%' AND s.name ILIKE '%Business Communication%')
        OR (LOWER(ts.topic) LIKE '%object oriented programming%' AND s.name ILIKE '%Object Oriented Programming in C++%')
        OR (LOWER(ts.topic) LIKE '%front end development%' AND s.name ILIKE '%Front End Development%')
        OR (LOWER(ts.topic) = 'wt' AND s.name ILIKE '%Web Technology%')
        OR (LOWER(ts.topic) = 'dbms' AND s.name ILIKE '%Database Management%')
        OR (LOWER(ts.topic) = 'os' AND s.name ILIKE '%Operating System%')
      )
  `);
  console.log('Rows updated:', updateRes.rowCount);

  const remaining = await client.query(`
    SELECT id, topic, description, course_cd, branch_cd, batch_cd, semester, section 
    FROM "tenant_srms-cet-bareilly".timetable_slots 
    WHERE subject_id IS NULL
  `);
  console.log('Remaining null slots count:', remaining.rows.length);
  remaining.rows.forEach(r => console.log(r));

  await client.end();
}

run().catch(console.error);
