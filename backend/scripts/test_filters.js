const http = require('http');

function check(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          const count = Array.isArray(j.data) ? j.data.length : (Array.isArray(j) ? j.length : 0);
          console.log(`URL: ${url}\n  Status: ${res.statusCode}, Records returned: ${count}`);
          if (count > 0 && Array.isArray(j.data)) {
            console.log('  First Record:', JSON.stringify({
              title: j.data[0].title,
              category: j.data[0].categoryName,
              student: j.data[0].studentName,
              marks: j.data[0].marksObtained,
              status: j.data[0].status
            }));
          }
        } catch (e) {
          console.log(`URL: ${url} -> Status: ${res.statusCode}, Raw length: ${data.length}`);
        }
        resolve();
      });
    }).on('error', (err) => {
      console.log(`URL: ${url} -> Error: ${err.message}`);
      resolve();
    });
  });
}

async function main() {
  await check('http://127.0.0.1:8081/api/v1/logbook/admin/all-entries?tenant=srms-cet-bareilly');
  await check('http://127.0.0.1:8081/api/v1/logbook/admin/all-entries?tenant=srms-cet-bareilly&courseId=13');
  await check('http://127.0.0.1:8081/api/v1/logbook/admin/all-entries?tenant=srms-cet-bareilly&courseId=13&batchId=2025&semesterId=3');
  await check('http://127.0.0.1:8081/api/v1/logbook/admin/all-entries?tenant=srms-cet-bareilly&category=SEMINAR&status=EVALUATED');
  await check('http://127.0.0.1:8081/api/v1/logbook/admin/all-entries?tenant=srms-cet-bareilly&category=MINI_PROJECT');
}

main();
