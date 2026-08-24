const https = require('https');

const agent = new https.Agent({ rejectUnauthorized: false });

function testWithCookie(cookieHeader) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      improperEvent: {
        title: 'Web Technology - Python',
        description: 'Web Technology (VINAY  KUMAR)',
        start: '17-08-2026 09:30:00 AM',
        end: '17-08-2026 10:30:00 AM',
        linkcd: '15318',
        electiveflg: 'N',
        txtG: '0',
        txtSec: '1',
        empid: '202616658',
        colgcd: '1',
        camera_link: '8',
        allDay: false
      }
    });

    const req = https.request({
      hostname: 'myportal.srms.ac.in',
      path: '/timetable/master/designtimetable.aspx/addEvent',
      method: 'POST',
      agent: agent,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(postData),
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'Cookie': cookieHeader || '',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://myportal.srms.ac.in/timetable/master/designtimetable.aspx',
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });

    req.on('error', (e) => resolve({ status: 500, error: e.message }));
    req.write(postData);
    req.end();
  });
}

// Test fetching initial cookies from default.aspx or login page
function getLoginCookies() {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'myportal.srms.ac.in',
      path: '/SRMSERP/Home/Index',
      method: 'GET',
      agent: agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      console.log('GET /SRMSERP/Home/Index status:', res.statusCode);
      const cookies = (res.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
      console.log('Got cookies:', cookies);
      resolve(cookies);
    });
    req.on('error', (e) => {
      console.error(e);
      resolve('');
    });
    req.end();
  });
}

async function run() {
  const cookie = await getLoginCookies();
  const res = await testWithCookie(cookie);
  console.log('addEvent with Home/Index cookie:', res.status, res.body);
}

run();
