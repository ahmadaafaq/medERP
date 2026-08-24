const http = require('http');

http.get('http://localhost:3001/api/v1/incubation-cell/projects?tenant=srms-cet-bareilly', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    const parsed = JSON.parse(data);
    console.log('Data length:', parsed.data?.length);
    console.log('Sample project:', parsed.data?.[0]);
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
