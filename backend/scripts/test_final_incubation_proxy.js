const http = require('http');

http.get('http://localhost:3000/api/incubation-cell/projects?tenant=srms-cet-bareilly&minScore=70', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('Next.js Proxy Status with minScore=70:', res.statusCode);
    const json = JSON.parse(data);
    console.log('Total count:', json.data?.length);
    console.log('Projects list:');
    json.data?.forEach(p => console.log(` - ID: ${p.id} | ${p.title} | ${p.studentName} | Score: ${p.score}% | Status: ${p.incubationStatus}`));
  });
}).on('error', err => {
  console.error('Error via Next.js proxy:', err.message);
});
