const http = require('http');

http.get('http://localhost:3001/api/v1/incubation-cell/meta?tenant=srms-cet-bareilly', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('Meta response:');
    console.log(JSON.stringify(JSON.parse(data), null, 2));
  });
});
