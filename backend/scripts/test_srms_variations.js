const https = require('https');

const agent = new https.Agent({ rejectUnauthorized: false });

function postReq(path, payload) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(payload);
    const req = https.request({
      hostname: 'myportal.srms.ac.in',
      path: path,
      method: 'POST',
      agent: agent,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(postData),
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Referer': 'https://myportal.srms.ac.in/timetable/master/designtimetable.aspx',
        'Origin': 'https://myportal.srms.ac.in'
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        resolve({ status: res.statusCode, body, headers: res.headers });
      });
    });
    req.on('error', (e) => resolve({ status: 500, error: e.message }));
    req.write(postData);
    req.end();
  });
}

async function testVariations() {
  console.log('Testing SRMS API addEvent variations...');

  const baseEvent = {
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
    coursecd: '13',
    branchcd: '1',
    batchcd: '2',
    sem: '3',
    sec: '1',
    userId: '202616658'
  };

  // Variation 1: improperEvent wrapper
  const v1 = await postReq('/timetable/master/designtimetable.aspx/addEvent', { improperEvent: baseEvent });
  console.log('V1 (/timetable/master/designtimetable.aspx/addEvent with improperEvent):', v1.status, v1.body?.slice(0, 200));

  // Variation 2: flat object
  const v2 = await postReq('/timetable/master/designtimetable.aspx/addEvent', baseEvent);
  console.log('V2 (/timetable/master/designtimetable.aspx/addEvent flat):', v2.status, v2.body?.slice(0, 200));

  // Variation 3: EmployeeInfo.asmx
  const v3 = await postReq('/timetable/master/EmployeeInfo.asmx/addEvent', { improperEvent: baseEvent });
  console.log('V3 (/timetable/master/EmployeeInfo.asmx/addEvent):', v3.status, v3.body?.slice(0, 200));

  // Variation 4: SRMSERP path
  const v4 = await postReq('/SRMSERP/timetable/master/designtimetable.aspx/addEvent', { improperEvent: baseEvent });
  console.log('V4 (/SRMSERP/...):', v4.status, v4.body?.slice(0, 200));

  // Variation 5: Check EmployeeInfo.asmx methods
  const v5 = await postReq('/timetable/master/EmployeeInfo.asmx/Loadsubject', { colgcd: '1', course: '13', branch: '1', batch: '2', sem: '3' });
  console.log('V5 (EmployeeInfo.asmx/Loadsubject status):', v5.status, v5.body ? 'Data received' : 'No data');
}

testVariations();
