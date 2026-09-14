const http = require('http');

const req = http.request('http://localhost:3000/api/srms/students/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    try {
      const j = JSON.parse(data);
      console.log('Keys of student 0:', Object.keys(j.data[0]));
      console.log('Record 0:', j.data[0]);
    } catch(e) {
      console.log(e, data.slice(0, 300));
    }
  });
});
req.write(JSON.stringify({
  colgcd: '1',
  coursecd: '1',
  batchcd: "'18'",
  branchcd: "'1'",
  sessioncd: '16',
  tenant: 'srms-cet-bareilly'
}));
req.end();
