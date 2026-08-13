const { Client } = require('../backend/node_modules/pg');

async function inspect() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'unicampus',
    password: 'unicampus_secret',
    database: 'unicampus_erp',
  });

  await client.connect();

  await client.query(`UPDATE "tenant_srms-ims".attendance_sessions SET session_date = '2026-08-06' WHERE id = '01ab70b7-338b-430e-8536-932170490688'`);
  await client.query(`UPDATE "tenant_srms-ims".attendance_sessions SET session_date = '2026-08-03' WHERE id IN ('cb90569f-14ce-4ec3-bf39-d507fa7ad375', '396be809-2293-4cd7-81b3-bec82a2f35f8')`);

  console.log('--- ATTENDANCE SESSIONS ---');
  const sessions = await client.query(`
    SELECT s.id, s.session_date, s.session_type, s.topic_covered, s.subject_id, s.faculty_id, s.timetable_slot_id,
           sub.name as subject_name, sub.code as subject_code, f.name as faculty_name
    FROM "tenant_srms-ims".attendance_sessions s
    LEFT JOIN "tenant_srms-ims".subjects sub ON sub.id = s.subject_id
    LEFT JOIN "tenant_srms-ims".faculty f ON f.id = s.faculty_id
    ORDER BY s.session_date DESC
  `);
  console.log(JSON.stringify(sessions.rows, null, 2));

  console.log('--- ATTENDANCE RECORDS AGGREGATED ---');
  const recs = await client.query(`
    SELECT session_id, count(*) as total, count(*) filter (where status='PRESENT') as present
    FROM "tenant_srms-ims".attendance_records
    GROUP BY session_id
  `);
  console.log(JSON.stringify(recs.rows, null, 2));

  console.log('--- TOTAL BATCH STUDENTS IN BATCH ---');
  const stCount = await client.query(`SELECT count(*) FROM "tenant_srms-ims".students`);
  console.log(JSON.stringify(stCount.rows, null, 2));

  console.log('--- FACULTY LIST ---');
  const facList = await client.query(`SELECT id, user_id, emp_id, name FROM "tenant_srms-ims".faculty`);
  console.log(JSON.stringify(facList.rows, null, 2));

  console.log('--- TIMETABLE SLOTS ---');
  const ttSlots = await client.query(`
    SELECT t.id, t.day_of_week, t.start_time, t.end_time, t.room, t.subject_id, t.faculty_id,
           sub.name as subject_name, f.name as faculty_name
    FROM "tenant_srms-ims".timetable_slots t
    LEFT JOIN "tenant_srms-ims".subjects sub ON sub.id = t.subject_id
    LEFT JOIN "tenant_srms-ims".faculty f ON f.id = t.faculty_id
  `);
  console.log(JSON.stringify(ttSlots.rows, null, 2));

  console.log('--- TESTING API CALL ---');
  const bRes = await client.query(`SELECT batch_id FROM "tenant_srms-ims".attendance_sessions LIMIT 1`);
  const bId = bRes.rows[0]?.batch_id;

  const http = require('http');
  const req = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/attendance/weekly-sessions?batchId=' + bId + '&fromDate=2026-08-01&toDate=2026-08-31',
    headers: { 'x-tenant-slug': 'srms-ims' }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => console.log('API RESPONSE:', JSON.stringify(JSON.parse(body), null, 2)));
  });
  req.end();

  await client.end();
}

inspect().catch(err => console.error(err));
