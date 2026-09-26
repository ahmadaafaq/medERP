const jwt = require('jsonwebtoken');

async function run() {
  const secret = 'change_me_to_a_super_long_random_string_at_least_64_chars';
  const token = jwt.sign(
    {
      sub: '2d1daa77-8597-47f0-9af5-e90489cee9f1',
      email: 'upendra@srms.ac.in',
      role: 'FACULTY',
      tenantSlug: 'srms-cet-bareilly',
    },
    secret,
    { expiresIn: '1h' }
  );

  // Payload with NO subjectId (or null, which frontend now omits)
  const payload = {
    batchId: '334c728c-c65c-4fef-a53f-8a2fbf5d1bc1',
    sessionDate: '2026-09-23',
    sessionType: 'LECTURE',
    topicCovered: 'COA',
    timetableSlotId: 'da70c6c5-5792-41e1-84fc-5961aec41030',
    records: [
      { studentId: '1a13f12c-fa69-48e0-98b4-8dbd0d816c16', status: 'PRESENT' }
    ]
  };

  console.log('Testing POST /api/v1/attendance/sessions with omitted/auto-resolved subjectId...');
  const res = await fetch('http://localhost:8081/api/v1/attendance/sessions?tenant=srms-cet-bareilly', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-tenant-slug': 'srms-cet-bareilly'
    },
    body: JSON.stringify(payload)
  });

  const json = await res.json();
  console.log('HTTP Status:', res.status);
  console.log('Response:', JSON.stringify(json, null, 2));
}

run().catch(console.error);
