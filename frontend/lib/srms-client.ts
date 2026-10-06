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
  { branch_cd: '1', branch_name: 'BCA Department' },
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

const _srmsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 10,
  rejectUnauthorized: false,
});

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
      agent: _srmsAgent,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
      rejectUnauthorized: false, // Handle expired SSL certificate on myportal.srms.ac.in
      timeout: 25000,
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

/**
 * Perform HTTPS POST to a FULL URL on myportal.srms.ac.in, ignoring expired SSL cert.
 * Unlike srmsPost(), this does NOT prepend /SRMSERP/ — use it for endpoints under /srmserp/
 * e.g. https://myportal.srms.ac.in/srmserp/Timetbl/AddEvent
 */
export async function srmsPostDirect(fullUrl: string, payload: Record<string, any> = {}): Promise<any> {
  const urlObj = new URL(fullUrl);
  const postData = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      agent: _srmsAgent,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
      rejectUnauthorized: false, // Bypass expired SSL cert on myportal.srms.ac.in
      timeout: 30000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
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
      reject(new Error('SRMS Portal Timetbl request timed out'));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Returns true if the given tenant slug belongs to an SRMS college.
 * All SRMS tenants start with "srms-". Non-SRMS tenants (e.g. rajshree-*)
 * must NOT call the myportal.srms.ac.in APIs.
 */
export function isSrmsTenant(tenantSlug: string): boolean {
  if (!tenantSlug || typeof tenantSlug !== 'string') return false;
  const clean = tenantSlug.toLowerCase().replace(/^tenant_/, '').replace(/^tenant-/, '').trim();
  return clean.includes('srms');
}

/**
 * In-memory short-lived cache for Loadsubject to avoid hammering SRMS portal on bulk approvals
 */
const _loadSubjectCache = new Map<string, { timestamp: number; data: any[] }>();

export async function fetchSrmsLoadSubjects(params: {
  course: string | number;
  branch?: string | number;
  batch?: string | number;
  semester?: string | number;
  section?: string | number;
  colgcd?: string | number;
}): Promise<any[]> {
  const c = Number(params.course) || 13;
  const br = Number(params.branch) || 1;
  const bat = Number(params.batch) || 2;
  const sem = Number(params.semester) || 3;
  const sec = Number(params.section) || 1;
  const colg = Number(params.colgcd) || 1;

  const cacheKey = `${c}-${br}-${bat}-${sem}-${sec}-${colg}`;
  const cached = _loadSubjectCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < 60000) {
    return cached.data;
  }

  try {
    const postData = JSON.stringify({
      course: c,
      branch: br,
      batch: bat,
      semester: sem,
      section: sec,
      colgcd: colg,
    });

    const res: any = await new Promise((resolve) => {
      const req = https.request(
        {
          hostname: 'myportal.srms.ac.in',
          port: 443,
          path: '/timetable/services/EmployeeInfo.asmx/Loadsubject',
          method: 'POST',
          agent: _srmsAgent,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(postData),
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          rejectUnauthorized: false,
          timeout: 10000,
        },
        (httpRes) => {
          let data = '';
          httpRes.on('data', (chunk) => (data += chunk));
          httpRes.on('end', () => {
            try {
              const json = JSON.parse(data);
              const list = typeof json.d === 'string' ? JSON.parse(json.d) : json.d;
              resolve(list || []);
            } catch {
              resolve([]);
            }
          });
        }
      );
      req.on('error', () => resolve([]));
      req.on('timeout', () => {
        req.destroy();
        resolve([]);
      });
      req.write(postData);
      req.end();
    });

    const list = Array.isArray(res) ? res : [];
    _loadSubjectCache.set(cacheKey, { timestamp: now, data: list });
    return list;
  } catch {
    return [];
  }
}

export async function fetchSrmsLoadFaculty(params: {
  course: string | number;
  branch?: string | number;
  batch?: string | number;
  semester?: string | number;
  section?: string | number;
  subject?: string | number;
  start?: string;
  end?: string;
  colgcd?: string | number;
}): Promise<any[]> {
  const c = String(params.course || '1');
  const br = Number(params.branch) || 1;
  const bat = Number(params.batch) || 17;
  const sem = Number(params.semester) || 5;
  const sec = Number(params.section) || 1;
  const subj = String(params.subject || '');
  const start = params.start || '2026-10-06 08:00:00';
  const end = params.end || '2026-10-06 09:00:00';
  const colg = String(params.colgcd || '1');

  try {
    const postData = JSON.stringify({
      course: c,
      branch: br,
      batch: bat,
      semester: sem,
      section: sec,
      subject: subj,
      start,
      end,
      colgcd: colg,
    });

    const res: any = await new Promise((resolve) => {
      const req = https.request(
        {
          hostname: 'myportal.srms.ac.in',
          port: 443,
          path: '/timetable/services/EmployeeInfo.asmx/LoadFaculty',
          method: 'POST',
          agent: _srmsAgent,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(postData),
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          rejectUnauthorized: false,
          timeout: 10000,
        },
        (httpRes) => {
          let data = '';
          httpRes.on('data', (chunk) => (data += chunk));
          httpRes.on('end', () => {
            try {
              const json = JSON.parse(data);
              const list = typeof json.d === 'string' ? JSON.parse(json.d) : json.d;
              resolve(list || []);
            } catch {
              resolve([]);
            }
          });
        }
      );
      req.on('error', () => resolve([]));
      req.on('timeout', () => {
        req.destroy();
        resolve([]);
      });
      req.write(postData);
      req.end();
    });

    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

export function getAcronym(str: string): string {
  const stopWords = new Set(['and', '&', 'of', 'in', 'the', 'for', 'to']);
  return (str || '')
    .split(/[\s_-]+/)
    .filter((w) => !stopWords.has(w.toLowerCase()))
    .map((w) => w[0])
    .join('')
    .toLowerCase();
}

export function resolveSrmsSubjectLink(
  subjects: any[],
  options: {
    linkcd?: string | number;
    subjectCode?: string;
    subjectName?: string;
    facultyName?: string;
    empid?: string;
    isLab?: boolean;
    isTutorial?: boolean;
  }
): { linkcd: string; sub_cd?: string; empid?: string; sub_name?: string } | null {
  if (!Array.isArray(subjects) || subjects.length === 0) return null;

  const linkStr = String(options.linkcd || '').trim();
  // 1. Direct match on linkcd if already a known authentic linkcd in this course/batch
  if (linkStr && linkStr !== '0') {
    const byLink = subjects.find((s) => String(s.linkcd) === linkStr);
    if (byLink) return { linkcd: String(byLink.linkcd), sub_cd: byLink.sub_cd, empid: byLink.empid, sub_name: byLink.sub_name };
  }

  // 2. Match if linkcd or subjectCode matches sub_cd or sub_addinfo
  const codeCandidate = options.subjectCode || (linkStr !== '0' ? linkStr : '');
  if (codeCandidate) {
    const bySubCd = subjects.find((s) => String(s.sub_cd) === String(codeCandidate) || String(s.sub_addinfo).trim() === String(codeCandidate).trim());
    if (bySubCd) return { linkcd: String(bySubCd.linkcd), sub_cd: bySubCd.sub_cd, empid: bySubCd.empid, sub_name: bySubCd.sub_name };
  }

  const cleanName = (options.subjectName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const acronym = getAcronym(options.subjectName || '');
  const cleanEmpid = String(options.empid || '').trim().toLowerCase();
  const cleanFacName = (options.facultyName || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // 3. Match by empid AND subject title/type
  if (cleanEmpid) {
    const facMatches = subjects.filter((s) => String(s.empid).trim().toLowerCase() === cleanEmpid);
    if (facMatches.length === 1) {
      return { linkcd: String(facMatches[0].linkcd), sub_cd: facMatches[0].sub_cd, empid: facMatches[0].empid, sub_name: facMatches[0].sub_name };
    }
    if (facMatches.length > 1) {
      const subTitleOnly = (options.subjectName || '').toLowerCase();
      const isLab = options.isLab || subTitleOnly.includes('lab');
      const isTut = options.isTutorial || subTitleOnly.includes('tut');

      const byType = facMatches.filter((s) => {
        const sName = (s.sub_name || '').toLowerCase();
        if (isLab) return sName.includes('lab');
        if (isTut) return sName.includes('tut');
        return !sName.includes('lab') && !sName.includes('tut');
      });
      if (byType.length > 0) {
        return { linkcd: String(byType[0].linkcd), sub_cd: byType[0].sub_cd, empid: byType[0].empid, sub_name: byType[0].sub_name };
      }
      return { linkcd: String(facMatches[0].linkcd), sub_cd: facMatches[0].sub_cd, empid: facMatches[0].empid, sub_name: facMatches[0].sub_name };
    }
  }

  // 4. Match by subject name or acronym
  for (const s of subjects) {
    const sRawTitle = (s.sub_name || '').split('(')[0].trim().toLowerCase();
    const sClean = sRawTitle.replace(/[^a-z0-9]/g, '');
    const sAcronym = getAcronym(sRawTitle);

    if (
      sClean === cleanName ||
      sClean === acronym ||
      sAcronym === acronym ||
      (cleanName && sClean && (sClean.includes(cleanName) || cleanName.includes(sClean)))
    ) {
      return { linkcd: String(s.linkcd), sub_cd: s.sub_cd, empid: s.empid, sub_name: s.sub_name };
    }
  }

  // 5. Match by faculty name
  if (cleanFacName) {
    for (const s of subjects) {
      const sEmp = (s.empname || s.EmpName || s.sub_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (sEmp && (sEmp.includes(cleanFacName) || cleanFacName.includes(sEmp))) {
        return { linkcd: String(s.linkcd), sub_cd: s.sub_cd, empid: s.empid, sub_name: s.sub_name };
      }
    }
  }

  return null;
}

