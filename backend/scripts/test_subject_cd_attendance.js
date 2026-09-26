const jwt = require('jsonwebtoken');

async function run() {
  const secret = 'change_me_to_a_super_long_random_string_at_least_64_chars';
  const token = jwt.sign(
    {
      sub: '2d1daa77-8597-47f0-9af5-e90489cee9f1',
      email: 'clerk@srms.ac.in',
      role: 'CLERK',
      tenantSlug: 'srms-cet-bareilly',
    },
    secret,
    { expiresIn: '1h' }
  );

  console.log('--- TEST 1: POST attendance with subjectId = "87659" (numeric subject_cd) ---');
  const payload = {
    subjectId: '87659', // numeric subject_cd for OS Lab
    batchId: '17',      // numeric batch_cd
    sessionDate: '2026-09-24',
    sessionType: 'PRACTICAL',
    topicCovered: 'OS Lab Practical - Process Scheduling',
    records: [
      { studentId: '1a13f12c-fa69-48e0-98b4-8dbd0d816c16', status: 'PRESENT' }
    ]
  };

  const res1 = await fetch('http://localhost:8081/api/v1/attendance/sessions?tenant=srms-cet-bareilly', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-tenant-slug': 'srms-cet-bareilly'
    },
    body: JSON.stringify(payload)
  });

  const json1 = await res1.json();
  console.log('HTTP Status 1:', res1.status);
  console.log('Response 1:', JSON.stringify(json1, null, 2));

  console.log('\n--- TEST 3: POST attendance with an EXPIRED token (expired 2 hours ago) ---');
  const expiredToken = jwt.sign(
    {
      sub: '2d1daa77-8597-47f0-9af5-e90489cee9f1',
      email: 'clerk@srms.ac.in',
      role: 'CLERK',
      tenantSlug: 'srms-cet-bareilly',
      iat: Math.floor(Date.now() / 1000) - 7200,
      exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago!
    },
    secret
  );

  const res3 = await fetch('http://localhost:8081/api/v1/attendance/sessions?tenant=srms-cet-bareilly', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${expiredToken}`,
      'x-tenant-slug': 'srms-cet-bareilly'
    },
    body: JSON.stringify(payload)
  });

  const json3 = await res3.json();
  console.log('HTTP Status 3 (Expired Token):', res3.status);
  console.log('Response 3:', JSON.stringify(json3, null, 2));
}

run().catch(console.error);
