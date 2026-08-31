const http = require('http');

function check(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`URL: ${url} -> Status: ${res.statusCode}, Body length: ${data.length}`);
        resolve();
      });
    }).on('error', (err) => {
      console.log(`URL: ${url} -> Error: ${err.message}`);
      resolve();
    });
  });
}

async function main() {
  await check('http://127.0.0.1:8081/api/v1/logbook/academic-structure?tenant=srms-cet-bareilly');
  await check('http://127.0.0.1:3000/api/v1/logbook/academic-structure?tenant=srms-cet-bareilly');
  await check('http://127.0.0.1:8081/api/v1/logbook/admin/all-entries?tenant=srms-cet-bareilly');
  await check('http://127.0.0.1:3000/api/v1/logbook/admin/all-entries?tenant=srms-cet-bareilly');
}

main();
