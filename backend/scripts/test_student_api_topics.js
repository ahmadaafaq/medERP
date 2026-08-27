const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/v1/logbook/topics?studentView=true&tenant=srms-cet-bareilly',
  method: 'GET',
  headers: {
    'x-tenant-slug': 'srms-cet-bareilly'
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    const json = JSON.parse(body);
    const list = json.data || json;
    console.log('Returned topics count:', list.length);
    console.log('Titles:', list.map(t => ({ id: t.id, title: t.title, target: `${t.course_name || t.course_id} (Batch ${t.batch_name || t.batch_id})` })));
  });
});

req.on('error', err => console.error('Fetch error:', err));
req.end();
