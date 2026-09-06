const http = require('http');

function postJson(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: '127.0.0.1',
      port: 8081,
      path: '/api/v1' + path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'x-tenant-slug': 'srms-cet-bareilly'
      }
    }, res => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(buf || '{}') }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 8081,
      path: '/api/v1' + path,
      method: 'GET',
      headers: {
        'x-tenant-slug': 'srms-cet-bareilly'
      }
    }, res => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(buf) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: buf.substring(0, 100) });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function test() {
  const subId = '0dc2f11a-0f0d-4a49-bd7a-394f35d3a800';
  console.log('1. Testing POST /logbook/submissions/' + subId + '/annotations ...');
  const annRes = await postJson(`/logbook/submissions/${subId}/annotations`, {
    annotations: [
      { id: '1', page: 1, type: 'tick', x: 50, y: 100, w: 25, h: 25, color: 'green', thickness: 2 },
      { id: '2', page: 1, type: 'text', x: 100, y: 150, text: '+2.5 Marks (Accurate syntax)', color: 'green', fontSize: 11 }
    ],
    marksAwarded: 19,
    remarks: 'Outstanding research and accurate implementation.'
  });
  console.log('Annotation response:', annRes);

  console.log('2. Testing POST /logbook/submissions/' + subId + '/finalize ...');
  const finRes = await postJson(`/logbook/submissions/${subId}/finalize`, {
    marksAwarded: 19,
    remarks: 'Evaluated with digital guide signature.',
    digitalStamp: true
  });
  console.log('Finalize response:', finRes);

  console.log('3. Testing GET /logbook/submissions/' + subId + '/evaluated-pdf ...');
  const pdfRes = await getJson(`/logbook/submissions/${subId}/evaluated-pdf?tenant=srms-cet-bareilly`);
  console.log('PDF response status:', pdfRes.status, 'content-type:', pdfRes.headers['content-type']);
}

test().catch(console.error);
