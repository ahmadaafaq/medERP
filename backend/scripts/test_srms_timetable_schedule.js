const http = require('http');

const url = 'http://localhost:3001/api/srms/timetable-schedule?course=1&batch=18&branch=1&sem=3&sec=1&colgcd=1&target_date=2026-09-23';
http.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log('Returned items count:', json.length || json.data?.length);
      console.log('Sample item:', JSON.stringify(json[0] || json.data?.[0], null, 2));
    } catch (e) {
      console.log('Raw body:', data.slice(0, 500));
    }
  });
}).on('error', err => {
  console.error('HTTP error:', err.message);
});
