const http = require('http');

http.get('http://localhost:3001/api/v1/incubation-cell/projects?tenant=srms-cet-bareilly&minScore=70', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Body:', data);
  });
});
