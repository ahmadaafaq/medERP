const http = require('http');

function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    const req = http.get({
      hostname: 'localhost',
      port: 8081,
      path: path,
      headers: {
        'x-tenant-slug': 'srms-cet-bareilly',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
  });
}

async function main() {
  console.log('Testing live backend endpoints on port 8081...');
  
  const struct = await testEndpoint('/api/v1/logbook/academic-structure?tenant=srms-cet-bareilly');
  console.log('1. /logbook/academic-structure status:', struct.status);
  console.log('   Courses count:', struct.data?.courses?.length || 0);
  console.log('   Branches count:', struct.data?.branches?.length || 0);
  console.log('   Batches count:', struct.data?.batches?.length || 0);

  const entries = await testEndpoint('/api/v1/logbook/admin/all-entries?tenant=srms-cet-bareilly');
  console.log('\n2. /logbook/admin/all-entries status:', entries.status);
  const data = Array.isArray(entries.data?.data) ? entries.data.data : Array.isArray(entries.data) ? entries.data : [];
  console.log('   Total entries returned:', data.length);
  if (data.length > 0) {
    console.log('   Sample student 1:', data[0].studentName, '| Course:', data[0].courseName, '| Activity:', data[0].title);
    console.log('   Sample student 2:', data[1].studentName, '| Course:', data[1].courseName, '| Activity:', data[1].title);
  }
}

main().catch(console.error);
