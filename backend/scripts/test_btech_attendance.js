const http = require('http');

const postData = JSON.stringify({
  colg_cd: 1,
  course_cd: 1,
  branch_cd: 1,
  batch_cd: 18,
  sem_cd: 3,
  section_cd: 1,
  fdt: '2026-09-01',
  tdt: '2026-09-30'
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
      console.log('Data length:', json.data?.length);
      console.log('Sample student 0:', json.data?.[0]);
    } catch (e) {
      console.log('Raw output:', data.slice(0, 500));
    }
  });
});

req.on('error', err => console.error(err));
req.write(postData);
req.end();
