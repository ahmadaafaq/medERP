const jwt = require('f:/AI_DOCKER/AAFAQ_SIR_PROJECTS/UNICAMPDIR/ERP/eng-erp/backend/node_modules/jsonwebtoken');

async function testActiveSession() {
  const secret = 'change_me_to_a_super_long_random_string_at_least_64_chars';
  const token = jwt.sign(
    {
      sub: 'f8888888-8888-8888-8888-888888888888',
      email: 'upendra@srms.ac.in',
      role: 'FACULTY',
      tenantSlug: 'srms-cet-bareilly',
    },
    secret,
    { expiresIn: '1d' }
  );

  const params = new URLSearchParams({
    tenant: 'srms-cet-bareilly',
    sessionDate: '2026-09-23',
    timetableSlotId: '85bfefba-ba1d-47e1-b99b-e3035bef8f98',
  });

  const res = await fetch(`http://localhost:8081/api/v1/attendance/active-session?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-tenant-slug': 'srms-cet-bareilly',
    },
  });

  const json = await res.json();
  const d = json.data;
  console.log('Found:', d.found);
  console.log('Session ID:', d.id || d.session?.id);
  console.log('Records count:', d.records?.length);
  const absentRecords = (d.records || []).filter(r => r.status === 'ABSENT');
  console.log('Absent records:', absentRecords);
  console.log('Sample record 0:', d.records?.[0]);
}

testActiveSession().catch(console.error);
