const axios = require('../frontend/node_modules/axios');
const https = require('https');

async function test() {
  console.log('=== 1. TEST LIVE SRMS ERP GetBranch ===');
  function callSrms(payload) {
    return new Promise((resolve) => {
      const postData = JSON.stringify(payload);
      const req = https.request({
        hostname: 'myportal.srms.ac.in',
        port: 443,
        path: '/SRMSERP/erpadmin/GetBranch',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        rejectUnauthorized: false,
        timeout: 8000,
      }, (res) => {
        let d = '';
        res.on('data', chunk => d += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(d)); } catch { resolve(d); }
        });
      });
      req.on('error', (err) => resolve({ error: err.message }));
      req.write(postData);
      req.end();
    });
  }

  const srmsBtech = await callSrms({ colgcd: 1, coursecd: 1 });
  console.log('SRMS B.Tech (coursecd=1):', srmsBtech);

  const srmsMba = await callSrms({ colgcd: 1, coursecd: 4 });
  console.log('SRMS MBA (coursecd=4):', srmsMba);

  const srmsBca = await callSrms({ colgcd: 1, coursecd: 13 });
  console.log('SRMS BCA (coursecd=13):', srmsBca);

  const { Client } = require('../frontend/node_modules/pg');
  const client = new Client({
    host: '34.236.107.120', port: 5433, user: 'unicampus',
    password: 'unicampus_dev@qsd!3ous', database: 'unicampus_erp'
  });
  await client.connect();

  console.log('\n=== 3. DEPARTMENTS IN POSTGRES ===');
  const depts = await client.query('SELECT id, name, code, course_cd, course_name, branch_cd, colg_cd FROM "tenant_srms-cet-bareilly".departments');
  console.log('Departments:', depts.rows);

  console.log('\n=== 4. WHAT DOES /api/srms/branches RETURN FOR B.TECH vs MBA ===');
  try {
    const resBtech = await axios.get('http://localhost:3000/api/srms/branches?colgcd=1&coursecd=1&tenant=srms-cet-bareilly');
    console.log('API B.Tech (coursecd=1):', resBtech.data);

    const resMba = await axios.get('http://localhost:3000/api/srms/branches?colgcd=1&coursecd=4&tenant=srms-cet-bareilly');
    console.log('API MBA (coursecd=4):', resMba.data);
  } catch (e) {
    console.log('API err:', e.message);
  }

  await client.end();
}

test();
