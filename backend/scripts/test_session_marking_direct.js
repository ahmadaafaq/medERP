const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_to_a_super_long_random_string_at_least_64_chars';

// Create a valid JWT token for faculty in srms-cet-bareilly
const token = jwt.sign(
  {
    sub: '19b15889-6db6-4774-a998-b6d8538de650',
    email: 'meenakshipathak7@gmail.com',
    role: 'FACULTY',
    tenantSlug: 'srms-cet-bareilly',
  },
  JWT_SECRET,
  { expiresIn: '1d' }
);

async function testAttendanceSave() {
  console.log('--- Testing Attendance Session Save with subjectId: "B.Tech" & slot ID ---');

  const payload = {
    batchId: '18',
    sessionDate: '2026-09-23',
    sessionType: 'THEORY',
    topicCovered: 'COA',
    timetableSlotId: 'da70c6c5-5792-41e1-84fc-5961aec41030',
    // Deliberately passing "B.Tech" as subjectId to prove the fix prevents UUID syntax errors!
    subjectId: 'B.Tech',
    subjectCd: 'KCS-302',
    records: [
      { studentId: '4e49c2de-3a16-4455-8a65-0fc544325a2f', status: 'PRESENT', remarks: 'Present in lecture' },
      { studentId: '650b5a98-2fb5-4db3-9884-5c14a75d860c', status: 'PRESENT' },
      { studentId: 'cc273b2b-636d-4b98-a107-d94445eca107', status: 'ABSENT', remarks: 'Absent' },
    ],
  };

  const res = await fetch('http://127.0.0.1:8081/api/v1/attendance/sessions?tenant=srms-cet-bareilly', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-tenant-slug': 'srms-cet-bareilly',
    },
    body: JSON.stringify(payload),
  });

  console.log('Status code:', res.status);
  const data = await res.json();
  console.log('Response JSON:', JSON.stringify(data, null, 2));

  if (res.status === 201 || res.status === 200) {
    console.log('SUCCESS: Attendance session saved without UUID error!');
  } else {
    console.error('FAILED:', data);
  }
}

testAttendanceSave().catch(console.error);
