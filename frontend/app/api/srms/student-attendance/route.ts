export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';
import { queryDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// ─── DATE NORMALIZER (Accepts DD-MM-YYYY or YYYY-MM-DD) ───
function normalizeDateToIso(d: any): string | null {
  if (!d) return null;
  const s = String(d).trim();
  const dmyMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  const ymdMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return s;
}

// ─── AUTHENTIC FACULTY MAPPINGS FOR B.TECH CSE (BATCH 17, SEM 5) ───
const BTECH_CSE_FACULTY_MAP: Record<
  string,
  { faculty_name: string; emp_id: string; designation: string; paper_code: string; sub_full_name: string; sub_type: string }
> = {
  '88621': {
    faculty_name: 'ASHOK KUMAR',
    emp_id: '202011033',
    designation: 'Assistant Professor',
    paper_code: 'BNC501',
    sub_full_name: 'CONSTITUTION OF INDIA, LAW AND ENGINEERING',
    sub_type: 'Theory',
  },
  '88622': {
    faculty_name: 'SHOBHA BHARTI',
    emp_id: '202516124',
    designation: 'Assistant Professor',
    paper_code: 'BCS052',
    sub_full_name: 'DATA ANALYTICS',
    sub_type: 'Theory',
  },
  '88623': {
    faculty_name: 'ANU SAXENA',
    emp_id: '202213072',
    designation: 'Assistant Professor',
    paper_code: 'BCS055',
    sub_full_name: 'MACHINE LEARNING TECHNIQUES',
    sub_type: 'Theory',
  },
  '88624': {
    faculty_name: 'MEENAKSHI PATHAK',
    emp_id: '201910016',
    designation: 'Assistant Professor',
    paper_code: 'BCS053',
    sub_full_name: 'DATABASE MANAGEMENT SYSTEMS',
    sub_type: 'Theory',
  },
  '88625': {
    faculty_name: 'SHAHJAHAN ALI',
    emp_id: 'T/11/0102',
    designation: 'Professor',
    paper_code: 'BCS051',
    sub_full_name: 'DESIGN AND ANALYSIS OF ALGORITHMS',
    sub_type: 'Theory',
  },
  '88626': {
    faculty_name: 'MONA',
    emp_id: '202515898',
    designation: 'Assistant Professor',
    paper_code: 'BCS054',
    sub_full_name: 'WEB TECHNOLOGY',
    sub_type: 'Theory',
  },
  '88627': {
    faculty_name: 'SHAHJAHAN ALI',
    emp_id: 'T/11/0102',
    designation: 'Professor',
    paper_code: 'BEE051',
    sub_full_name: 'DIGITAL ELECTRONICS',
    sub_type: 'Theory',
  },
  '88628': {
    faculty_name: 'MONA',
    emp_id: '202515898',
    designation: 'Assistant Professor',
    paper_code: 'BCS552',
    sub_full_name: 'WEB TECHNOLOGY LAB',
    sub_type: 'Lab',
  },
  '88629': {
    faculty_name: 'MEENAKSHI PATHAK',
    emp_id: '201910016',
    designation: 'Assistant Professor',
    paper_code: 'BCS551',
    sub_full_name: 'DATABASE MANAGEMENT SYSTEMS LAB',
    sub_type: 'Lab',
  },
  '88630': {
    faculty_name: 'SHAHJAHAN ALI',
    emp_id: 'T/11/0102',
    designation: 'Professor',
    paper_code: 'BCS553',
    sub_full_name: 'DESIGN AND ANALYSIS OF ALGORITHMS LAB',
    sub_type: 'Lab',
  },
  '88631': {
    faculty_name: 'SHOBHA BHARTI',
    emp_id: '202516124',
    designation: 'Assistant Professor',
    paper_code: 'BCS554',
    sub_full_name: 'MINI PROJECT OR INTERNSHIP ASSESSMENT',
    sub_type: 'Lab',
  },
};

const BTECH_CSE_SUBJECT_LIST = [
  { sub_cd: '88621', sub_name: 'COI', paper_code: 'BNC501', faculty: 'ASHOK KUMAR', faculty_name: 'ASHOK KUMAR', faculty_emp_id: '202011033', faculty_designation: 'Assistant Professor' },
  { sub_cd: '88622', sub_name: 'DA', paper_code: 'BCS052', faculty: 'SHOBHA BHARTI', faculty_name: 'SHOBHA BHARTI', faculty_emp_id: '202516124', faculty_designation: 'Assistant Professor' },
  { sub_cd: '88623', sub_name: 'MLT', paper_code: 'BCS055', faculty: 'ANU SAXENA', faculty_name: 'ANU SAXENA', faculty_emp_id: '202213072', faculty_designation: 'Assistant Professor' },
  { sub_cd: '88624', sub_name: 'DBMS', paper_code: 'BCS053', faculty: 'MEENAKSHI PATHAK', faculty_name: 'MEENAKSHI PATHAK', faculty_emp_id: '201910016', faculty_designation: 'Assistant Professor' },
  { sub_cd: '88625', sub_name: 'DAA', paper_code: 'BCS051', faculty: 'SHAHJAHAN ALI', faculty_name: 'SHAHJAHAN ALI', faculty_emp_id: 'T/11/0102', faculty_designation: 'Professor' },
  { sub_cd: '88626', sub_name: 'WT', paper_code: 'BCS054', faculty: 'MONA', faculty_name: 'MONA', faculty_emp_id: '202515898', faculty_designation: 'Assistant Professor' },
  { sub_cd: '88627', sub_name: 'DEC', paper_code: 'BEE051', faculty: 'SHAHJAHAN ALI', faculty_name: 'SHAHJAHAN ALI', faculty_emp_id: 'T/11/0102', faculty_designation: 'Professor' },
  { sub_cd: '88628', sub_name: 'WT LAB', paper_code: 'BCS552', faculty: 'MONA', faculty_name: 'MONA', faculty_emp_id: '202515898', faculty_designation: 'Assistant Professor' },
  { sub_cd: '88629', sub_name: 'DBMS LAB', paper_code: 'BCS551', faculty: 'MEENAKSHI PATHAK', faculty_name: 'MEENAKSHI PATHAK', faculty_emp_id: '201910016', faculty_designation: 'Assistant Professor' },
  { sub_cd: '88630', sub_name: 'DAA LAB', paper_code: 'BCS553', faculty: 'SHAHJAHAN ALI', faculty_name: 'SHAHJAHAN ALI', faculty_emp_id: 'T/11/0102', faculty_designation: 'Professor' },
  { sub_cd: '88631', sub_name: 'MINI PROJECT LAB', paper_code: 'BCS554', faculty: 'SHOBHA BHARTI', faculty_name: 'SHOBHA BHARTI', faculty_emp_id: '202516124', faculty_designation: 'Assistant Professor' },
];

const BTECH_CSE_SUBJECT_COLUMNS = BTECH_CSE_SUBJECT_LIST.map((s) => s.sub_name);

let cachedBTechCseJson: any = null;

function loadBTechCseTemplate(): any {
  if (cachedBTechCseJson) return cachedBTechCseJson;
  const candidatePaths = [
    path.join(process.cwd(), 'templates', 'btech_cse_batch17_attendance_jul_aug_2026.json'),
    path.join(process.cwd(), 'frontend', 'templates', 'btech_cse_batch17_attendance_jul_aug_2026.json'),
    path.join(process.cwd(), '..', 'backend', 'templates', 'btech_cse_batch17_attendance_jul_aug_2026.json'),
    'f:/AI_DOCKER/AAFAQ_SIR_PROJECTS/UNICAMPDIR/ERP/eng-erp/frontend/templates/btech_cse_batch17_attendance_jul_aug_2026.json',
    'f:/AI_DOCKER/AAFAQ_SIR_PROJECTS/UNICAMPDIR/ERP/eng-erp/backend/templates/btech_cse_batch17_attendance_jul_aug_2026.json',
  ];
  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        cachedBTechCseJson = JSON.parse(raw);
        return cachedBTechCseJson;
      }
    } catch {
      // continue
    }
  }
  return null;
}

// ─── PERSIST REMOTE SYNC ATTENDANCE TO POSTGRESQL DATABASE ───
async function persistSyncToDatabase(
  schema: string,
  attList: any[],
  meta: {
    colg_cd: any;
    course_cd: any;
    branch_cd: any;
    batch_cd: any;
    sem_cd: any;
    section_cd: any;
    fdt: string;
    tdt: string;
  }
) {
  try {
    if (!attList || attList.length === 0) return;

    for (const stud of attList) {
      const regNo = String(stud.stud_reg_no || '').trim();
      const rollNo = String(stud.stud_roll_no || '').trim();
      const name = String(stud.stud_name || '').trim();
      if (!regNo && !rollNo) continue;

      await queryDb(
        `INSERT INTO "${schema}".students (name, registration_no, rollno, course_cd, batch_cd, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (registration_no) DO UPDATE 
         SET name = COALESCE(EXCLUDED.name, "${schema}".students.name),
             rollno = COALESCE(EXCLUDED.rollno, "${schema}".students.rollno),
             course_cd = COALESCE(EXCLUDED.course_cd, "${schema}".students.course_cd),
             batch_cd = COALESCE(EXCLUDED.batch_cd, "${schema}".students.batch_cd)`,
        [name, regNo || rollNo, rollNo || regNo, String(meta.course_cd), String(meta.batch_cd)]
      ).catch(() => {});
    }

    const subMap = new Map<string, string>();
    for (const stud of attList) {
      if (Array.isArray(stud.subjects)) {
        for (const sub of stud.subjects) {
          if (sub.sub_cd && sub.sub_name && !subMap.has(String(sub.sub_cd))) {
            const code = String(sub.sub_cd).trim();
            const sName = String(sub.sub_name).trim();

            const existingSub = await queryDb(
              `SELECT id FROM "${schema}".subjects WHERE code = $1 LIMIT 1`,
              [code]
            ).catch(() => []);

            let subId: string;
            if (existingSub && existingSub.length > 0) {
              subId = existingSub[0].id;
            } else {
              const insSub = await queryDb(
                `INSERT INTO "${schema}".subjects (code, name, course_cd, branch_cd)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id`,
                [code, sName, String(meta.course_cd), String(meta.branch_cd)]
              ).catch(() => []);
              subId = insSub?.[0]?.id || code;
            }
            subMap.set(code, subId);
          }
        }
      }
    }

    const normTdt = normalizeDateToIso(meta.tdt) || new Date().toISOString().split('T')[0];
    for (const [code, subId] of Array.from(subMap.entries())) {
      const sessDate = normTdt;
      const existingSession = await queryDb(
        `SELECT id FROM "${schema}".attendance_sessions
         WHERE subject_id::text = $1::text
           AND course_cd::text = $2::text
           AND batch_cd::text = $3::text
           AND sem_cd::text = $4::text
           AND session_date::date = $5::date
         LIMIT 1`,
        [subId, String(meta.course_cd), String(meta.batch_cd), String(meta.sem_cd), sessDate]
      ).catch(() => []);

      let sessId: string;
      if (existingSession && existingSession.length > 0) {
        sessId = existingSession[0].id;
      } else {
        const insSess = await queryDb(
          `INSERT INTO "${schema}".attendance_sessions
           (subject_id, session_date, course_cd, branch_cd, batch_cd, sem_cd, section_cd, topic_covered, is_cancelled)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)
           RETURNING id`,
          [
            subId,
            sessDate,
            String(meta.course_cd),
            String(meta.branch_cd),
            String(meta.batch_cd),
            String(meta.sem_cd),
            String(meta.section_cd || 1),
            `Synced Attendance (${meta.fdt} to ${meta.tdt})`,
          ]
        ).catch(() => []);
        sessId = insSess?.[0]?.id;
      }

      if (!sessId) continue;

      for (const stud of attList) {
        const regNo = String(stud.stud_reg_no || stud.stud_roll_no || '').trim();
        const studDb = await queryDb(
          `SELECT id FROM "${schema}".students WHERE registration_no = $1 OR rollno = $1 LIMIT 1`,
          [regNo]
        ).catch(() => []);
        if (!studDb || studDb.length === 0) continue;
        const studentId = studDb[0].id;

        const studSub = Array.isArray(stud.subjects)
          ? stud.subjects.find((s: any) => String(s.sub_cd) === code)
          : null;

        if (studSub) {
          const match = String(studSub.attendance || '').match(/(\d+)\/(\d+)/);
          const attended = match ? parseInt(match[1], 10) : 0;
          const status = attended > 0 ? 'PRESENT' : 'ABSENT';

          await queryDb(
            `INSERT INTO "${schema}".attendance_records (session_id, student_id, status)
             VALUES ($1, $2, $3)
             ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status`,
            [sessId, studentId, status]
          ).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn('[persistSyncToDatabase warning]', err);
  }
}

// ─── SERVE B.TECH CSE BATCH 17 ATTENDANCE (PER-STUDENT ROW LH & LA ONLY) ───
async function serveBTechCseBatch17Attendance(
  schema: string,
  options: {
    isJulySearch: boolean;
    section_cd?: number | string | null;
    normFdt?: string | null;
    normTdt?: string | null;
  }
) {
  const { isJulySearch, section_cd, normFdt, normTdt } = options;
  const secFilter =
    section_cd && String(section_cd).toLowerCase() !== 'all' && Number(section_cd) > 0
      ? Number(section_cd)
      : null;

  // 1. Query PostgreSQL attendance records directly (COUNT(ar.id) guarantees per-student row LH, never cross-section sum)
  try {
    const startDate = isJulySearch ? '2026-07-01' : (normFdt || '2026-07-01');
    const endDate = isJulySearch ? '2026-07-31' : (normTdt || '2026-08-31');

    const dbQuery = `
      SELECT s.id, s.name AS stud_name, s.registration_no AS stud_reg_no, s.rollno AS stud_roll_no,
             sess.section_cd,
             sub.code AS sub_cd, sub.name AS sub_name,
             COUNT(ar.id)::int AS lectures_held,
             COUNT(CASE WHEN ar.status = 'PRESENT' THEN 1 END)::int AS lectures_attended
      FROM "${schema}".students s
      JOIN "${schema}".attendance_records ar ON ar.student_id = s.id
      JOIN "${schema}".attendance_sessions sess ON sess.id = ar.session_id
      JOIN "${schema}".subjects sub ON sub.id = sess.subject_id
      WHERE sess.course_cd = '1' AND sess.batch_cd = '17' AND sess.sem_cd = '5'
        AND sess.session_date >= $1::date AND sess.session_date <= $2::date
        AND ($3::int IS NULL OR sess.section_cd::int = $3::int)
      GROUP BY s.id, s.name, s.registration_no, s.rollno, sess.section_cd, sub.code, sub.name
      ORDER BY s.rollno ASC, sub.code ASC
    `;

    const dbRows = await queryDb(dbQuery, [startDate, endDate, secFilter]).catch((err) => {
      console.warn('[BTech CSE DB query error]', err);
      return [];
    });

    if (dbRows && dbRows.length > 0) {
      const studentMap = new Map<string, any>();
      dbRows.forEach((r: any) => {
        const key = String(r.stud_reg_no || r.stud_roll_no || r.id).trim();
        if (!studentMap.has(key)) {
          studentMap.set(key, {
            colg_name: 'SRMS CET,BAREILLY',
            course_name: 'B.TECH.',
            branch_name: '(CSE)',
            batch_name: '2024',
            stud_reg_no: r.stud_reg_no,
            stud_roll_no: r.stud_roll_no,
            stud_name: r.stud_name,
            sec_cd: r.section_cd ? Number(r.section_cd) : 1,
            AttendanceType: isJulySearch ? 'DATABASE_JULY' : 'DATABASE_CUMULATIVE',
            subjectStats: new Map<string, { held: number; attended: number; sub_name: string }>(),
          });
        }
        const sEntry = studentMap.get(key);
        sEntry.subjectStats.set(String(r.sub_cd), {
          held: Number(r.lectures_held || 0),
          attended: Number(r.lectures_attended || 0),
          sub_name: r.sub_name,
        });
      });

      const students = Array.from(studentMap.values()).map((sEntry: any, idx: number) => {
        let totalHeld = 0;
        let totalAttended = 0;
        const subjectsArr: any[] = [];
        const studentObj: Record<string, any> = {
          s_no: idx + 1,
          colg_name: sEntry.colg_name,
          course_name: sEntry.course_name,
          branch_name: sEntry.branch_name,
          batch_name: sEntry.batch_name,
          stud_reg_no: sEntry.stud_reg_no,
          stud_roll_no: sEntry.stud_roll_no,
          stud_name: sEntry.stud_name,
          sec_cd: sEntry.sec_cd || 1,
          AttendanceType: sEntry.AttendanceType,
        };

        BTECH_CSE_SUBJECT_LIST.forEach((subDef) => {
          const sc = subDef.sub_cd;
          const stat = sEntry.subjectStats.get(sc) || { held: 0, attended: 0, sub_name: subDef.sub_name };
          totalHeld += stat.held;
          totalAttended += stat.attended;
          const pct = stat.held > 0 ? ((stat.attended / stat.held) * 100).toFixed(2) : '0.00';
          const displayAtt = `${stat.attended}/${stat.held} (${pct}%)`;

          const fac = BTECH_CSE_FACULTY_MAP[sc];
          subjectsArr.push({
            sub_cd: sc,
            sub_name: subDef.sub_name,
            paper_code: subDef.paper_code,
            attendance: displayAtt,
            faculty: fac ? fac.faculty_name : subDef.faculty,
            faculty_name: fac ? fac.faculty_name : subDef.faculty_name,
            faculty_emp_id: fac ? fac.emp_id : subDef.faculty_emp_id,
            faculty_designation: fac ? fac.designation : subDef.faculty_designation,
          });

          studentObj[subDef.sub_name] = displayAtt;
          studentObj[`sub_cd_${subDef.sub_name}`] = sc;
        });

        const overallPct = totalHeld > 0 ? `${((totalAttended / totalHeld) * 100).toFixed(2)}%` : '0.00%';
        studentObj.TotalPresentPercentage = overallPct;
        studentObj.subjects = subjectsArr;

        return studentObj;
      });

      return {
        success: true,
        data: students,
        subjectList: BTECH_CSE_SUBJECT_LIST,
        subjectColumns: BTECH_CSE_SUBJECT_COLUMNS,
        count: students.length,
        source: 'POSTGRESQL_DATABASE',
        mode: isJulySearch ? 'JULY_WISE' : 'CUMULATIVE_UP_TO_DATE',
      };
    }
  } catch (dbErr) {
    console.warn('[BTech CSE DB Attendance query fallback to template]', dbErr);
  }

  // 2. Fallback to Pre-loaded Template JSON Feed (takes strictly each student row's own LH and LA)
  const template = loadBTechCseTemplate();
  if (template && Array.isArray(template.data)) {
    let rawStudents = template.data;
    if (secFilter && (secFilter === 1 || secFilter === 2)) {
      rawStudents = rawStudents.filter((st: any) => Number(st.sec_cd || 1) === secFilter);
    }

    const students = rawStudents.map((st: any, idx: number) => {
      const studentObj: Record<string, any> = {
        s_no: idx + 1,
        colg_name: st.colg_name || 'SRMS CET,BAREILLY',
        course_name: 'B.TECH.',
        branch_name: '(CSE)',
        batch_name: '2024',
        stud_reg_no: st.stud_reg_no,
        stud_roll_no: st.stud_roll_no,
        stud_name: st.stud_name,
        AttendanceType: isJulySearch ? 'FEED_JULY_2026' : 'FEED_CUMULATIVE_2026',
      };

      const subjectsArr: any[] = [];
      let totalHeld = 0;
      let totalAttended = 0;

      if (Array.isArray(st.subjects)) {
        st.subjects.forEach((sub: any) => {
          const sc = String(sub.sub_cd);
          const fac = BTECH_CSE_FACULTY_MAP[sc] || {
            faculty_name: sub.faculty_name || sub.faculty || 'FACULTY',
            emp_id: sub.faculty_emp_id || '',
            designation: sub.faculty_designation || 'Assistant Professor',
            paper_code: sub.paper_code || '',
            sub_full_name: sub.sub_full_name || sub.sub_name,
          };

          let attStr = sub.attendance || '0/0 (0.00%)';
          let sAtt = 0;
          let sHeld = 0;

          if (isJulySearch && sub.july_2026) {
            attStr = sub.july_2026.attendance || '0/0 (0.00%)';
            sAtt = sub.july_2026.lectures_attended || 0;
            sHeld = sub.july_2026.lectures_held || 0;
          } else if (!isJulySearch && sub.cumulative_jul_aug_2026) {
            attStr = sub.cumulative_jul_aug_2026.attendance || sub.attendance || '0/0 (0.00%)';
            sAtt = sub.cumulative_jul_aug_2026.lectures_attended || 0;
            sHeld = sub.cumulative_jul_aug_2026.lectures_held || 0;
          } else {
            const m = String(sub.attendance || '').match(/(\d+)\/(\d+)/);
            if (m) {
              sAtt = parseInt(m[1], 10);
              sHeld = parseInt(m[2], 10);
            }
          }

          totalAttended += sAtt;
          totalHeld += sHeld;

          subjectsArr.push({
            sub_cd: sc,
            sub_name: sub.sub_name,
            paper_code: fac.paper_code || sub.paper_code,
            attendance: attStr,
            faculty: fac.faculty_name,
            faculty_name: fac.faculty_name,
            faculty_emp_id: fac.emp_id,
            faculty_designation: fac.designation,
          });

          studentObj[sub.sub_name] = attStr;
          studentObj[`sub_cd_${sub.sub_name}`] = sc;
        });
      }

      let totPct = '0.00%';
      if (isJulySearch) {
        if (typeof st.TotalPresentPercentage === 'object' && st.TotalPresentPercentage?.july_2026) {
          totPct = st.TotalPresentPercentage.july_2026;
        } else if (st.july_2026_total_percentage) {
          totPct = st.july_2026_total_percentage;
        } else {
          totPct = totalHeld > 0 ? `${((totalAttended / totalHeld) * 100).toFixed(2)}%` : '0.00%';
        }
      } else {
        if (typeof st.TotalPresentPercentage === 'object' && st.TotalPresentPercentage?.cumulative_jul_aug_2026) {
          totPct = st.TotalPresentPercentage.cumulative_jul_aug_2026;
        } else if (typeof st.TotalPresentPercentage === 'string') {
          totPct = st.TotalPresentPercentage;
        } else {
          totPct = totalHeld > 0 ? `${((totalAttended / totalHeld) * 100).toFixed(2)}%` : '0.00%';
        }
      }

      studentObj.TotalPresentPercentage = totPct;
      studentObj.subjects = subjectsArr;

      return studentObj;
    });

    return {
      success: true,
      data: students,
      subjectList: BTECH_CSE_SUBJECT_LIST,
      subjectColumns: BTECH_CSE_SUBJECT_COLUMNS,
      count: students.length,
      source: 'JSON_TEMPLATE_FEED',
      mode: isJulySearch ? 'JULY_WISE' : 'CUMULATIVE_UP_TO_DATE',
    };
  }

  return {
    success: false,
    message: 'No attendance data found for B.Tech CSE Batch 17',
    data: [],
    subjectList: BTECH_CSE_SUBJECT_LIST,
    subjectColumns: BTECH_CSE_SUBJECT_COLUMNS,
    count: 0,
  };
}

// ─── MAIN HANDLER ───
async function handleStudentAttendance(request: NextRequest) {
  try {
    let body: any = {};
    if (request.method === 'POST') {
      try {
        body = await request.json();
      } catch {
        body = {};
      }
    }

    const { searchParams } = request.nextUrl;
    const colg_cd = body.colg_cd ?? searchParams.get('colg_cd') ?? 1;
    const course_cd = body.course_cd ?? searchParams.get('course_cd') ?? 1;
    const branch_cd = body.branch_cd ?? searchParams.get('branch_cd') ?? 1;
    const batch_cd = body.batch_cd ?? searchParams.get('batch_cd') ?? 17;
    const sem_cd = body.sem_cd ?? searchParams.get('sem_cd') ?? 5;
    const section_cd = body.section_cd ?? searchParams.get('section_cd') ?? null;
    const fdtRaw = body.fdt ?? searchParams.get('fdt') ?? '2026-07-01';
    const tdtRaw = body.tdt ?? searchParams.get('tdt') ?? '2026-07-31';
    const month = body.month ?? searchParams.get('month') ?? '';
    const tenantSlug =
      body.tenantSlug || body.tenant || request.headers.get('x-tenant-slug') || searchParams.get('tenant') || '';

    // Normalize dates to ISO YYYY-MM-DD
    const normFdt = normalizeDateToIso(fdtRaw) || '2026-07-01';
    const normTdt = normalizeDateToIso(tdtRaw) || '2026-07-31';

    const srmsCollegeSlugMap: Record<string, string> = {
      '1': 'srms-cet-bareilly',
      '2': 'srms-cetr-bareilly',
      '11': 'srms-cet-unnao',
    };

    let targetSlug = (tenantSlug || '').toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');
    if (!targetSlug || targetSlug === '1' || targetSlug === '2' || targetSlug === '11') {
      targetSlug = srmsCollegeSlugMap[String(colg_cd || '1')] || 'srms-cet-bareilly';
    }
    const schema = `tenant_${targetSlug}`;
    const isSrms =
      targetSlug.startsWith('srms') ||
      targetSlug.includes('srms') ||
      colg_cd === 1 ||
      colg_cd === '1' ||
      colg_cd === 2 ||
      colg_cd === '2' ||
      colg_cd === 11 ||
      colg_cd === '11';

    // ── IDENTIFY B.TECH CSE BATCH 17 SEM 5 ──
    const isBTechCseBatch17 =
      (Number(course_cd) === 1 || String(course_cd).toUpperCase().includes('B.TECH')) &&
      (Number(branch_cd) === 1 || String(branch_cd).toUpperCase().includes('CSE')) &&
      (String(batch_cd) === '17' || String(batch_cd) === '2024' || String(batch_cd).includes('17')) &&
      (Number(sem_cd) === 5 || String(sem_cd) === '5');

    // ── CHECK IF JULY IS SEARCHED OR WHOLE UP-TO-DATE ──
    const isJulySearch = Boolean(
      (month && String(month).toLowerCase().includes('jul')) ||
      (normFdt && normFdt >= '2026-07-01' && normTdt && normTdt <= '2026-07-31') ||
      (normFdt && normFdt.startsWith('2026-07') && (!normTdt || normTdt <= '2026-07-31')) ||
      searchParams.get('month')?.toLowerCase().includes('jul')
    );

    // ── CASE 0: B.TECH CSE BATCH 17 -> SKIP API SYNCING, TAKE ROW LH & LA ONLY ──
    if (isBTechCseBatch17) {
      const result = await serveBTechCseBatch17Attendance(schema, {
        isJulySearch,
        section_cd: section_cd ? Number(section_cd) : null,
        normFdt,
        normTdt,
      });
      return NextResponse.json(result, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });
    }

    // ── CASE 1: OTHER COURSES/BATCHES -> FETCH FROM REMOTE SRMS CCTV & UPDATE DB FROM SYNC ──
    let attList: any[] = [];
    let totList: any[] = [];

    if (isSrms) {
      const attPayload = {
        batch_cd: Number(batch_cd),
        colg_cd: Number(colg_cd || 1),
        course_cd: Number(course_cd),
        branch_cd: Number(branch_cd),
        sem_cd: Number(sem_cd),
        section_cd: Number(section_cd || 1),
        fdt: normFdt,
        tdt: normTdt,
      };

      const totPayload = {
        batch_cd: Number(batch_cd),
        colg_cd: Number(colg_cd || 1),
        course_cd: Number(course_cd),
        branch_cd: Number(branch_cd),
      };

      const [attListRaw, totListRaw] = await Promise.all([
        srmsPost('Student/Get_stud_att_with_subCd', attPayload).catch((err) => {
          console.warn('[Get_stud_att_with_subCd error]', err?.message);
          return [];
        }),
        srmsPost('Student/Get_stud_Tot_att', totPayload).catch((err) => {
          console.warn('[Get_stud_Tot_att error]', err?.message);
          return [];
        }),
      ]);

      attList = Array.isArray(attListRaw) ? attListRaw : [];
      totList = Array.isArray(totListRaw) ? totListRaw : [];

      if (attList.length > 0) {
        persistSyncToDatabase(schema, attList, {
          colg_cd,
          course_cd,
          branch_cd,
          batch_cd,
          sem_cd,
          section_cd,
          fdt: normFdt,
          tdt: normTdt,
        }).catch((err) => console.warn('[Async DB persist sync warning]', err));
      }
    }

    // ── CASE 2: SRMS CCTV RETURNED ATTENDANCE DATA ──
    if (attList.length > 0) {
      const totMap = new Map<string, string>();
      if (Array.isArray(totList)) {
        totList.forEach((item: any) => {
          if (item.stud_reg_no) {
            totMap.set(String(item.stud_reg_no).trim(), item.TotalPresentPercentage || '0.00%');
          }
        });
      }

      const subjectMap = new Map<string, { sub_cd: string; sub_name: string }>();
      attList.forEach((stud: any) => {
        if (Array.isArray(stud.subjects)) {
          stud.subjects.forEach((sub: any) => {
            if (sub.sub_cd && sub.sub_name && !subjectMap.has(String(sub.sub_cd))) {
              subjectMap.set(String(sub.sub_cd), {
                sub_cd: String(sub.sub_cd),
                sub_name: String(sub.sub_name),
              });
            }
          });
        }
      });

      // Fusion with manual faculty records in PostgreSQL
      try {
        const manualRows = await queryDb(
          `SELECT sess.id AS session_id, sess.subject_id, sess.session_date,
                  COALESCE(sub.code, sub.sub_addinfo, sess.topic_covered, sess.subject_id::text, 'LEC') AS sub_cd,
                  COALESCE(sess.topic_covered, sub.name, 'Lecture') AS sub_name,
                  sess.topic_covered,
                  ar.student_id, ar.status, s.registration_no, s.rollno
           FROM "${schema}".attendance_sessions sess
           JOIN "${schema}".attendance_records ar ON ar.session_id::text = sess.id::text
           JOIN "${schema}".students s ON s.id::text = ar.student_id::text
           LEFT JOIN "${schema}".subjects sub ON sub.id::text = sess.subject_id::text
           LEFT JOIN "${schema}".timetable_slots ts ON ts.id::text = sess.timetable_slot_id::text
           WHERE sess.is_cancelled = false
             AND sess.session_date::date >= $1::date
             AND sess.session_date::date <= $2::date
             AND (s.course_cd::text = $3::text OR $3 IS NULL OR s.course_cd IS NULL)
             AND (
               (ts.course_cd::text = $3::text)
               OR (sub.course_cd::text = $3::text)
             )`,
          [normFdt, normTdt, String(course_cd)]
        ).catch(() => []);

        if (manualRows && manualRows.length > 0) {
          const manualByStudent = new Map<string, Map<string, { present: number; total: number; sub_name: string }>>();
          manualRows.forEach((r: any) => {
            const keys = [r.registration_no, r.rollno].filter(Boolean).map((k) => String(k).trim());
            const subCd = String(r.sub_cd);
            const isPres = r.status === 'PRESENT' || r.status === 'LATE';

            const alreadyExistsByName = Array.from(subjectMap.values()).some(
              (s) => s.sub_name.toLowerCase().trim() === r.sub_name.toLowerCase().trim()
            );
            if (!subjectMap.has(subCd) && !alreadyExistsByName) {
              subjectMap.set(subCd, { sub_cd: subCd, sub_name: r.sub_name });
            }

            keys.forEach((k) => {
              if (!manualByStudent.has(k)) {
                manualByStudent.set(k, new Map());
              }
              const studentSubMap = manualByStudent.get(k)!;
              if (!studentSubMap.has(subCd)) {
                studentSubMap.set(subCd, { present: 0, total: 0, sub_name: r.sub_name });
              }
              const stat = studentSubMap.get(subCd)!;
              stat.total += 1;
              if (isPres) stat.present += 1;
            });
          });

          attList = attList.map((stud: any) => {
            const regNo = String(stud.stud_reg_no || '').trim();
            const rollNo = String(stud.stud_roll_no || '').trim();
            const mData = manualByStudent.get(regNo) || manualByStudent.get(rollNo);

            if (!mData || mData.size === 0) return stud;

            const existingSubs: any[] = Array.isArray(stud.subjects) ? [...stud.subjects] : [];
            const updatedSubs: any[] = [];
            const handledSubCds = new Set<string>();

            existingSubs.forEach((sub: any) => {
              const sc = String(sub.sub_cd || '');
              const sn = String(sub.sub_name || '').trim().toLowerCase();

              let matchedKey: string | null = null;
              if (mData.has(sc)) {
                matchedKey = sc;
              } else {
                for (const [mCode, mStat] of Array.from(mData.entries())) {
                  const mName = String(mStat.sub_name || '').trim().toLowerCase();
                  if (mName === sn || (sn.length >= 2 && (mName.includes(sn) || sn.includes(mName)))) {
                    matchedKey = mCode;
                    break;
                  }
                }
              }

              if (matchedKey) {
                handledSubCds.add(matchedKey);
                const mStat = mData.get(matchedKey)!;
                const match = String(sub.attendance || '').match(/(\d+)\/(\d+)/);
                const curPres = match ? parseInt(match[1], 10) : 0;
                const curTot = match ? parseInt(match[2], 10) : 0;
                const newPres = curPres + mStat.present;
                const newTot = curTot + mStat.total;
                const newPct = newTot > 0 ? ((newPres / newTot) * 100).toFixed(2) : '0.00';
                updatedSubs.push({
                  ...sub,
                  attendance: `${newPres}/${newTot} (${newPct}%)`,
                });
              } else {
                updatedSubs.push(sub);
              }
            });

            mData.forEach((mStat, sc) => {
              if (!handledSubCds.has(sc)) {
                const pct = mStat.total > 0 ? ((mStat.present / mStat.total) * 100).toFixed(2) : '0.00';
                updatedSubs.push({
                  sub_cd: sc,
                  sub_name: mStat.sub_name,
                  attendance: `${mStat.present}/${mStat.total} (${pct}%)`,
                });
              }
            });

            return {
              ...stud,
              AttendanceType: 'CCTV + MANUAL',
              subjects: updatedSubs,
            };
          });
        }
      } catch (manualSyncErr) {
        console.warn('[Manual attendance fusion error]:', manualSyncErr);
      }

      const subjectList = Array.from(subjectMap.values());
      const subjectColumns = subjectList.map((s) => s.sub_name);

      const students = attList.map((stud: any, idx: number) => {
        const regNo = String(stud.stud_reg_no || '').trim();
        let totalConducted = 0;
        let totalAttended = 0;
        if (Array.isArray(stud.subjects)) {
          stud.subjects.forEach((sub: any) => {
            const match = String(sub.attendance || '').match(/(\d+)\/(\d+)/);
            if (match) {
              totalAttended += parseInt(match[1], 10);
              totalConducted += parseInt(match[2], 10);
            }
          });
        }
        const totPct =
          totalConducted > 0
            ? `${((totalAttended / totalConducted) * 100).toFixed(2)}%`
            : totMap.get(regNo) || stud.TotalPresentPercentage || '0.00%';

        const studentObj: Record<string, any> = {
          ...stud,
          s_no: idx + 1,
          TotalPresentPercentage: totPct,
          subjects: stud.subjects || [],
        };

        if (Array.isArray(stud.subjects)) {
          stud.subjects.forEach((sub: any) => {
            studentObj[sub.sub_name] = sub.attendance;
            studentObj[`sub_cd_${sub.sub_name}`] = sub.sub_cd;
          });
        }

        return studentObj;
      });

      return NextResponse.json({
        success: true,
        data: students,
        subjectList,
        subjectColumns,
        count: students.length,
      });
    }

    // ── CASE 3: NO DATA FOUND IN SRMS -> POSTGRESQL FALLBACK (PER-STUDENT ROW LH & LA ONLY) ──
    const secFilter = section_cd ? Number(section_cd) : null;
    let studentRows = await queryDb(
      `SELECT s.id, s.name AS stud_name, s.registration_no AS stud_reg_no, s.rollno AS stud_roll_no,
              s.course_cd, s.batch_cd, s.batch_id
       FROM "${schema}".students s
       WHERE (s.course_cd::text = $1::text OR $1 IS NULL)
         AND (
           $2::text IS NULL
           OR s.batch_cd::text = $2::text
           OR s.batch_id::text = $2::text
           OR (s.batch_cd::text = '2025' AND $2::text IN ('18', '2', '2025'))
         )
       ORDER BY s.rollno ASC, s.name ASC`,
      [course_cd ? String(course_cd) : null, batch_cd ? String(batch_cd) : null]
    ).catch(() => []);

    if (!studentRows || studentRows.length === 0) {
      studentRows = await queryDb(
        `SELECT s.id, s.name AS stud_name, s.registration_no AS stud_reg_no, s.rollno AS stud_roll_no,
                s.course_cd, s.batch_cd, s.batch_id
         FROM "${schema}".students s
         WHERE (s.course_cd::text = $1::text OR $1 IS NULL)
         ORDER BY s.rollno ASC, s.name ASC
         LIMIT 200`,
        [course_cd ? String(course_cd) : null]
      ).catch(() => []);
    }

    const sessionRows = await queryDb(
      `SELECT sess.id AS session_id, sess.subject_id, sess.session_date, sess.timetable_slot_id, sess.topic_covered, sess.section_cd,
              COALESCE(sub.code, sub.sub_addinfo, ts.topic, sess.topic_covered, sess.subject_id::text, 'LEC') AS sub_cd,
              COALESCE(sub.name, ts.topic, ts.description, sess.topic_covered, 'Scheduled Lecture') AS sub_name
       FROM "${schema}".attendance_sessions sess
       LEFT JOIN "${schema}".timetable_slots ts ON ts.id::text = sess.timetable_slot_id::text
       LEFT JOIN "${schema}".subjects sub ON sub.id::text = sess.subject_id::text OR sub.id::text = ts.subject_id::text
       WHERE sess.is_cancelled = false
         AND sess.session_date::date >= $1::date
         AND sess.session_date <= $2::date
         AND (
           (ts.course_cd::text = $3::text)
           OR (sub.course_cd::text = $3::text)
         )
         AND ($4::int IS NULL OR sess.section_cd::int = $4::int)`,
      [normFdt, normTdt, course_cd ? String(course_cd) : null, secFilter]
    ).catch(() => []);

    const subjectMap = new Map<string, { sub_cd: string; sub_name: string; id: string }>();

    sessionRows.forEach((row: any) => {
      const key = String(row.sub_cd || row.subject_id || row.sub_name);
      if (!subjectMap.has(key)) {
        subjectMap.set(key, {
          sub_cd: String(row.sub_cd || 'LEC'),
          sub_name: String(row.sub_name),
          id: String(row.subject_id || key),
        });
      }
    });

    const slotSubjects = await queryDb(
      `SELECT DISTINCT COALESCE(sub.code, sub.sub_addinfo, ts.topic, ts.description, ts.subject_id::text, 'LEC') AS sub_cd,
                       COALESCE(sub.name, ts.topic, ts.description, 'Subject') AS sub_name,
                       ts.subject_id
       FROM "${schema}".timetable_slots ts
       LEFT JOIN "${schema}".subjects sub ON sub.id::text = ts.subject_id::text
       WHERE ts.course_cd::text = $1::text`,
      [course_cd ? String(course_cd) : null]
    ).catch(() => []);

    slotSubjects.forEach((s: any) => {
      const key = String(s.sub_cd || s.sub_name);
      if (!subjectMap.has(key)) {
        subjectMap.set(key, {
          sub_cd: String(s.sub_cd),
          sub_name: String(s.sub_name),
          id: String(s.subject_id || key),
        });
      }
    });

    const subjectList = Array.from(subjectMap.values()).map((s) => ({ sub_cd: s.sub_cd, sub_name: s.sub_name }));
    const subjectColumns = subjectList.map((s) => s.sub_name);

    const studentIds = studentRows.map((s: any) => String(s.id));
    let recordRows: any[] = [];
    if (studentIds.length > 0 && sessionRows.length > 0) {
      const sessionIds = sessionRows.map((s: any) => String(s.session_id));
      recordRows = await queryDb(
        `SELECT ar.student_id, ar.session_id, ar.status, sess.subject_id, sess.section_cd
         FROM "${schema}".attendance_records ar
         JOIN "${schema}".attendance_sessions sess ON sess.id::text = ar.session_id::text
         WHERE ar.session_id::text = ANY($1::text[])
           AND ar.student_id::text = ANY($2::text[])`,
        [sessionIds, studentIds]
      ).catch(() => []);
    }

    // Build per-student attendance stats directly from THAT student's own records (NEVER cross-section sum)
    const attStats = new Map<string, Map<string, { total: number; present: number }>>();
    studentRows.forEach((stud: any) => {
      const studId = String(stud.id);
      const subMap = new Map<string, { total: number; present: number }>();
      subjectMap.forEach((sub, key) => {
        subMap.set(key, {
          total: 0,
          present: 0,
        });
      });
      attStats.set(studId, subMap);
    });

    recordRows.forEach((rec: any) => {
      const studId = String(rec.student_id);
      const sess = sessionRows.find((s: any) => String(s.session_id) === String(rec.session_id));
      const key = sess ? String(sess.sub_cd || sess.subject_id || sess.sub_name) : String(rec.subject_id);
      const isPres = rec.status === 'PRESENT' || rec.status === 'LATE';
      if (attStats.has(studId)) {
        const subMap = attStats.get(studId)!;
        if (subMap.has(key)) {
          const cur = subMap.get(key)!;
          cur.total++; // increment strictly for THIS student's own session records
          if (isPres) cur.present++;
        }
      }
    });

    // If a student had no individual records for a subject, derive held count strictly from sessions in THAT student's section
    const studentSectionMap = new Map<string, number>();
    recordRows.forEach((r: any) => {
      if (r.section_cd) studentSectionMap.set(String(r.student_id), Number(r.section_cd));
    });

    const sessionsBySectionSubject = new Map<string, number>();
    sessionRows.forEach((row: any) => {
      const sec = Number(row.section_cd || 1);
      const key = `${sec}_${String(row.sub_cd || row.subject_id || row.sub_name)}`;
      sessionsBySectionSubject.set(key, (sessionsBySectionSubject.get(key) || 0) + 1);
    });

    studentRows.forEach((stud: any) => {
      const studId = String(stud.id);
      const studSec = studentSectionMap.get(studId) || secFilter || 1;
      const subMap = attStats.get(studId);
      if (subMap) {
        subjectMap.forEach((sub, key) => {
          const st = subMap.get(key);
          if (st && st.total === 0) {
            const secKey = `${studSec}_${key}`;
            st.total = sessionsBySectionSubject.get(secKey) || 0;
          }
        });
      }
    });

    const courseNameMap: Record<string, string> = {
      '1': 'B.Tech',
      '13': 'BCA',
      '4': 'MBA',
      '2': 'B.Pharma',
      '3': 'MCA',
      '12': 'BBA',
      '5': 'M.Tech',
      '6': 'M.Pharm',
    };
    const resolvedCourseName = courseNameMap[String(course_cd)] || `Course ${course_cd}`;

    const branchNameMap: Record<string, Record<string, string>> = {
      '4': { '1': 'MBA Department' },
      '13': { '1': 'BCA Department' },
      '1': { '1': 'CSE', '2': 'IT', '3': 'EC', '4': 'EN', '5': 'ME' },
      '2': { '1': 'Pharmacy' },
      '3': { '1': 'MCA Department' },
      '12': { '1': 'BBA Department' },
    };
    const resolvedBranchName =
      branchNameMap[String(course_cd)]?.[String(branch_cd)] ||
      (String(course_cd) === '4' ? 'MBA Department' : String(branch_cd) === '1' ? 'CSE' : `Branch ${branch_cd}`);

    const resolvedBatchName =
      String(batch_cd) === '16'
        ? '2025'
        : String(batch_cd) === '18' || String(batch_cd) === '2'
        ? '2025'
        : `Batch ${batch_cd}`;

    // Filter students by section if specified
    let finalStudentRows = studentRows;
    if (secFilter) {
      finalStudentRows = studentRows.filter((stud: any) => {
        const studSec = studentSectionMap.get(String(stud.id));
        return !studSec || studSec === secFilter;
      });
    }

    const students = finalStudentRows.map((stud: any, idx: number) => {
      const studId = String(stud.id);
      const studSubMap = attStats.get(studId);

      let totalConducted = 0;
      let totalAttended = 0;

      const subjectsArr: any[] = [];
      const studentObj: Record<string, any> = {
        s_no: idx + 1,
        colg_name: 'SRMS CET,BAREILLY',
        course_name: resolvedCourseName,
        branch_name: resolvedBranchName,
        batch_name: resolvedBatchName,
        stud_reg_no: stud.stud_reg_no || stud.id,
        stud_roll_no: stud.stud_roll_no || stud.stud_reg_no || stud.id,
        stud_name: stud.stud_name || 'Student',
        AttendanceType: 'FACULTY_MANUAL',
      };

      subjectMap.forEach((sub, key) => {
        const st = studSubMap?.get(key) || { total: 0, present: 0 };
        totalConducted += st.total;
        totalAttended += st.present;
        const pct = st.total > 0 ? ((st.present / st.total) * 100).toFixed(2) : '0.00';
        const displayVal = `${st.present}/${st.total} (${pct}%)`;

        studentObj[sub.sub_name] = displayVal;
        studentObj[`sub_cd_${sub.sub_name}`] = sub.sub_cd;

        subjectsArr.push({
          sub_cd: sub.sub_cd,
          sub_name: sub.sub_name,
          attendance: displayVal,
        });
      });

      const overallPct =
        totalConducted > 0
          ? `${((totalAttended / totalConducted) * 100).toFixed(2)}%`
          : totalConducted === 0 && subjectList.length === 0
          ? '—'
          : '0.00%';
      studentObj.TotalPresentPercentage = overallPct;
      studentObj.subjects = subjectsArr;

      return studentObj;
    });

    return NextResponse.json({
      success: true,
      data: students,
      subjectList,
      subjectColumns,
      count: students.length,
    });
  } catch (error: any) {
    console.error('[SRMS Student Attendance API Error]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch attendance', data: [], subjectList: [], subjectColumns: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return handleStudentAttendance(request);
}

export async function GET(request: NextRequest) {
  return handleStudentAttendance(request);
}
