const http = require('http');

http.get('http://localhost:8081/api/v1/timetable?tenant=srms-cet-bareilly&courseCd=1', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log('Returned slots count:', json.data?.length || json.length);
      console.log('Returned slots:', JSON.stringify(json.data || json, null, 2));
    } catch (e) {
      console.log('Raw body:', data.slice(0, 500));
    }
  });
}).on('error', err => {
  console.error('HTTP error:', err.message);
});
