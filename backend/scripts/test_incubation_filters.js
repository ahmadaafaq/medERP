const http = require('http');

function test(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        const json = JSON.parse(data);
        console.log(`URL: ${url}`);
        console.log(`Count: ${json.data?.length}`);
        console.log(`IDs:`, json.data?.map(p => ({ id: p.id, title: p.title, status: p.incubationStatus, college: p.collegeName })));
        resolve();
      });
    });
  });
}

async function run() {
  await test('http://localhost:3001/api/v1/incubation-cell/projects?tenant=srms-cet-bareilly');
  await test('http://localhost:3001/api/v1/incubation-cell/projects?tenant=srms-cet-bareilly&status=Selected');
  await test('http://localhost:3001/api/v1/incubation-cell/projects?tenant=srms-cet-bareilly&collegeId=1');
}

run();
