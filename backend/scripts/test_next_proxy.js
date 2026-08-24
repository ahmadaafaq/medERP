const http = require('http');

http.get('http://localhost:3000/api/incubation-cell/projects?tenant=srms-cet-bareilly', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('Next.js Proxy Status:', res.statusCode);
    const json = JSON.parse(data);
    console.log('Count returned via Next.js:', json.data?.length);
    console.log('Sample item:', json.data?.[0]?.title, json.data?.[0]?.studentName);
  });
}).on('error', err => {
  console.error('Error via Next.js proxy:', err.message);
});
