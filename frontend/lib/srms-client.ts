import https from 'https';

export const FALLBACK_COLLEGES = [
  { colg_cd: '1', colg_name: 'SRMS CET,BAREILLY' },
  { colg_cd: '2', colg_name: 'SRMS CETR,BAREILLY' },
  { colg_cd: '3', colg_name: 'SRMS CET, UNNAO' },
  { colg_cd: '4', colg_name: 'SRMS COLLEGE OF LAW' },
  { colg_cd: '5', colg_name: 'SRMS IBS, LUCKNOW' },
  { colg_cd: '6', colg_name: 'SRMS IAHS,BAREILLY' },
  { colg_cd: '7', colg_name: 'SRMS TRUST, BAREILLY' },
  { colg_cd: '8', colg_name: 'SRMS NURSING SCHOOL' },
  { colg_cd: '9', colg_name: 'SRMS NURSING COLLEGE' },
  { colg_cd: '10', colg_name: 'SRMS RIDDHIMA,BAREILLY' },
  { colg_cd: '11', colg_name: 'SRMS IMS,BAREILLY' },
  { colg_cd: '12', colg_name: 'SRMS COLLEGE OF NURSING & PARAMEDICAL SCIENCES,UNNAO' },
  { colg_cd: '13', colg_name: 'SRMS QUIZ PANEL' },
  { colg_cd: '14', colg_name: 'SRMS CRICKET ACADEMY' },
];

export const FALLBACK_COURSES_CET = [
  { course_cd: '13', course_name: 'BCA' },
  { course_cd: '1', course_name: 'B.TECH.' },
  { course_cd: '2', course_name: 'B.PHARM.' },
  { course_cd: '3', course_name: 'MCA' },
  { course_cd: '4', course_name: 'MBA' },
  { course_cd: '5', course_name: 'M.TECH.' },
  { course_cd: '6', course_name: 'M. PHARM.' },
  { course_cd: '12', course_name: 'BBA' },
];

export const FALLBACK_BRANCHES_BCA = [
  { branch_cd: '1', branch_name: 'BCA General' },
];

export const FALLBACK_BATCHES_BCA = [
  { colg_cd: '1', course_cd: '13', batch_cd: 1, batch_name: '2024', active_flg: '1', curr_bat_Cd: 1 },
  { colg_cd: '1', course_cd: '13', batch_cd: 2, batch_name: '2025', active_flg: '1', curr_bat_Cd: 2 },
  { colg_cd: '1', course_cd: '13', batch_cd: 3, batch_name: '2026', active_flg: '1', curr_bat_Cd: 3 },
];

export const FALLBACK_SESSIONS = [
  { colg_cd: '1', session_cd: '16', session_name: '2026-2027', active_flg: '1', current_flg: '1' },
  { colg_cd: '1', session_cd: '15', session_name: '2025-2026', active_flg: '1', current_flg: '1' },
  { colg_cd: '1', session_cd: '14', session_name: '2024-2025', active_flg: '1', current_flg: '1' },
  { colg_cd: '1', session_cd: '13', session_name: '2023-2024', active_flg: '1', current_flg: '0' },
  { colg_cd: '1', session_cd: '12', session_name: '2022-2023', active_flg: '1', current_flg: '0' },
  { colg_cd: '1', session_cd: '11', session_name: '2021-2022', active_flg: '1', current_flg: '0' },
  { colg_cd: '1', session_cd: '10', session_name: '2020-2021', active_flg: '1', current_flg: '0' },
];

/**
 * Perform HTTPS POST to myportal.srms.ac.in ignoring expired SSL certificate
 */
export async function srmsPost(urlPath: string, payload: Record<string, any> = {}): Promise<any> {
  const fullUrl = urlPath.startsWith('http') ? urlPath : `https://myportal.srms.ac.in/SRMSERP/${urlPath.replace(/^\//, '')}`;
  const urlObj = new URL(fullUrl);
  const postData = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
      rejectUnauthorized: false, // Handle expired SSL certificate on myportal.srms.ac.in
      timeout: 8000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('SRMS Portal request timed out'));
    });

    req.write(postData);
    req.end();
  });
}
