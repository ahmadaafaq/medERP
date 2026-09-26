const http = require('http');

http.get('http://localhost:8081/api/v1/timetable?tenant=srms-cet-bareilly&courseCd=1&facultyId=202616680', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    const json = JSON.parse(data);
    console.log('Slots:', JSON.stringify(json.data || json, null, 2));
  });
}).on('error', err => console.error(err));
