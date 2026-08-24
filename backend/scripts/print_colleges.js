const http = require('http');

http.get('http://localhost:3001/api/v1/incubation-cell/meta?tenant=srms-cet-bareilly', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log('Colleges in meta:');
    console.log(json.data.colleges);
  });
});
