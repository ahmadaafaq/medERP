const http = require('http');

const postData = JSON.stringify({
  colg_cd: 1,
  course_cd: 13,
  branch_cd: 1,
  batch_cd: 2,
  sem_cd: 3,
  section_cd: 1,
  fdt: '2026-07-02',
  tdt: '2026-08-21'
});

const req = http.request('http://localhost:3001/api/srms/student-attendance', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log('Success:', json.success);
      console.log('Count:', json.count || json.data?.length);
      console.log('Subjects:', json.subjectList);
      console.log('Sample student 0:', JSON.stringify(json.data?.[0], null, 2));
    } catch (e) {
      console.log('Raw output:', data.slice(0, 500));
    }
  });
});

req.on('error', err => console.error(err));
req.write(postData);
req.end();
