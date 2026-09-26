const http = require('http');

const payload = JSON.stringify({
  batchId: '18',
  sessionDate: '2026-09-23',
  sessionType: 'THEORY',
  topicCovered: 'COA',
  timetableSlotId: 'da70c6c5-5792-41e1-84fc-5961aec41030',
  subjectId: 'B.Tech',
  subjectCd: 'B.Tech',
  records: [
    { studentId: '2025107277', status: 'ABSENT', remarks: 'Medical leave' },
    { studentId: '2025107314', status: 'PRESENT' }
  ]
});

const req = http.request('http://localhost:8081/api/v1/attendance/sessions?tenant=srms-cet-bareilly', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', err => console.error(err));
req.write(payload);
req.end();
