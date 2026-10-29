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
// ─── SERVE B.TECH CSE BATCH 17 ATTENDANCE (PER-STUDENT ROW LH & LA ONLY) ───
async function serveBTechCseBatch17Attendance(
  schema: string,
  options: {
    isJulySearch?: boolean;
    isAugustSearch?: boolean;
    section_cd?: number | string | null;
    normFdt?: string | null;
    normTdt?: string | null;
    cleanSubCd?: string | null;
  }
) {
  const normFdt = options.normFdt || '2026-07-01';
  const normTdt = options.normTdt || '2026-08-31';
  const isJulySearch = options.isJulySearch ?? (normFdt >= '2026-07-01' && normTdt <= '2026-07-31');
  const isAugustSearch = options.isAugustSearch ?? (normFdt >= '2026-08-01' && normTdt <= '2026-08-31');
  const cleanSubCd = options.cleanSubCd || null;
  const { section_cd } = options;

  const secFilter =
    section_cd && String(section_cd).toLowerCase() !== 'all' && Number(section_cd) > 0
      ? Number(section_cd)
      : null;

  // Resolve authentic college name for colg_cd: 1
  let colgName = 'SRMS CET,BAREILLY';
  try {
    const colRow = await queryDb(
      `SELECT name FROM "${schema}".colleges WHERE colg_cd = '1' OR code = '1' LIMIT 1`
    ).catch(() => []);
    if (colRow?.[0]?.name) {
      colgName = colRow[0].name;
    }
  } catch {}

  const effectiveSubjectList = cleanSubCd
    ? BTECH_CSE_SUBJECT_LIST.filter(
        (s) => s.sub_cd === cleanSubCd || s.sub_name.toLowerCase() === cleanSubCd.toLowerCase()
      )
    : BTECH_CSE_SUBJECT_LIST;
  const activeSubjectList = effectiveSubjectList.length > 0 ? effectiveSubjectList : BTECH_CSE_SUBJECT_LIST;
  const activeSubjectColumns = activeSubjectList.map((s) => s.sub_name);

  // 1. Query PostgreSQL attendance records directly (COUNT(ar.id) guarantees per-student row LH, never cross-section sum)
  try {
    const startDate = isJulySearch ? '2026-07-01' : (isAugustSearch ? '2026-08-01' : (normFdt || '2026-07-01'));
    const endDate = isJulySearch ? '2026-07-31' : (isAugustSearch ? '2026-08-31' : (normTdt || '2026-08-31'));

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
            colg_name: colgName,
            course_name: 'B.TECH.',
            branch_name: '(CSE)',
            batch_name: '2024',
            stud_reg_no: r.stud_reg_no,
            stud_roll_no: r.stud_roll_no,
            stud_name: r.stud_name,
            sec_cd: r.section_cd ? Number(r.section_cd) : 1,
            AttendanceType: isJulySearch
              ? 'DATABASE_JULY'
              : isAugustSearch
              ? 'DATABASE_AUGUST'
              : 'DATABASE_CUMULATIVE',
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

        activeSubjectList.forEach((subDef) => {
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
        subjectColumns: activeSubjectColumns,
        count: students.length,
        source: 'POSTGRESQL_DATABASE',
        mode: isJulySearch ? 'JULY_WISE' : isAugustSearch ? 'AUGUST_WISE' : 'CUMULATIVE_UP_TO_DATE',
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
        colg_name: colgName,
        course_name: 'B.TECH.',
        branch_name: '(CSE)',
        batch_name: '2024',
        stud_reg_no: st.stud_reg_no,
        stud_roll_no: st.stud_roll_no,
        stud_name: st.stud_name,
        sec_cd: st.sec_cd || 1,
        AttendanceType: isJulySearch
          ? 'FEED_JULY_2026'
          : isAugustSearch
          ? 'FEED_AUGUST_2026'
          : 'FEED_CUMULATIVE_2026',
      };

      const subjectsArr: any[] = [];
      let totalHeld = 0;
      let totalAttended = 0;

      if (Array.isArray(st.subjects)) {
        st.subjects.forEach((sub: any) => {
          const sc = String(sub.sub_cd);
          if (cleanSubCd && sc !== cleanSubCd && sub.sub_name?.toLowerCase() !== cleanSubCd.toLowerCase()) {
            return;
          }

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
          } else if (isAugustSearch && sub.august_2026) {
            attStr = sub.august_2026.attendance || '0/0 (0.00%)';
            sAtt = sub.august_2026.lectures_attended || 0;
            sHeld = sub.august_2026.lectures_held || 0;
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
      } else if (isAugustSearch) {
        if (typeof st.TotalPresentPercentage === 'object' && st.TotalPresentPercentage?.august_2026) {
          totPct = st.TotalPresentPercentage.august_2026;
        } else if (st.august_2026_total_percentage) {
          totPct = st.august_2026_total_percentage;
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
      subjectColumns: activeSubjectColumns,
      count: students.length,
      source: 'JSON_TEMPLATE_FEED',
      mode: isJulySearch ? 'JULY_WISE' : isAugustSearch ? 'AUGUST_WISE' : 'CUMULATIVE_UP_TO_DATE',
    };
  }

  return {
    success: false,
    message: 'No attendance data found for B.Tech CSE Batch 17',
    data: [],
    subjectList: BTECH_CSE_SUBJECT_LIST,
    subjectColumns: activeSubjectColumns,
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
    const rawSubCd = body.subject_cd ?? body.sub_cd ?? searchParams.get('subject_cd') ?? searchParams.get('sub_cd') ?? null;
    const cleanSubCd = rawSubCd && String(rawSubCd).toLowerCase() !== 'all' && String(rawSubCd).trim() !== '' ? String(rawSubCd).trim() : null;
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
      targetSlug = srmsCollegeSlugMap[String(colg_cd || '1')] || (colg_cd && String(colg_cd).length > 2 ? String(colg_cd) : 'team-university');
    }
    const schema = `tenant_${targetSlug}`;
    // AGENTS.md Rule 5: isSrms is TRUE ONLY if the tenant identifier contains 'srms'
    const isSrms = targetSlug.includes('srms');

    // ── CASE 1: FETCH FROM REMOTE SRMS CCTV (SRMS TENANTS ONLY) & UPDATE DB FROM SYNC ──
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

    // ── CASE 2.5: B.TECH CSE BATCH 17 (JULY - AUGUST 2026 / SEM 5) ATTENDANCE ──
    const isBTechCseBatch17 =
      String(course_cd) === '1' &&
      (String(branch_cd) === '1' || !branch_cd) &&
      (String(batch_cd) === '17' || String(batch_cd) === '2024') &&
      (String(sem_cd) === '5' || !sem_cd);

    if (isBTechCseBatch17) {
      const isJulySearch = normFdt >= '2026-07-01' && normTdt <= '2026-07-31';
      const isAugustSearch = normFdt >= '2026-08-01' && normTdt <= '2026-08-31';
      const btechResult = await serveBTechCseBatch17Attendance(schema, {
        isJulySearch,
        isAugustSearch,
        section_cd,
        normFdt,
        normTdt,
        cleanSubCd,
      });

      if (btechResult && btechResult.success && Array.isArray(btechResult.data) && btechResult.data.length > 0) {
        return NextResponse.json(btechResult);
      }
    }

    // ── CASE 3: NO DATA FOUND IN SRMS / NON-SRMS TENANT -> POSTGRESQL DYNAMIC ATTENDANCE MATRIX ──
    const secFilter = section_cd && String(section_cd).toLowerCase() !== 'all' ? String(section_cd) : null;

    // 1. Resolve Batch IDs & Codes from Batches Table
    let batchMatches: any[] = [];
    if (batch_cd) {
      if (course_cd) {
        batchMatches = await queryDb(
          `SELECT id, code, batch_cd, name, year, course_cd FROM "${schema}".batches
           WHERE (course_cd::text = $2::text OR course_cd IS NULL)
             AND (
               id::text = $1::text
               OR code::text = $1::text
               OR batch_cd::text = $1::text
               OR year::text = $1::text
               OR name::text ILIKE '%' || $1::text || '%'
               OR (
                 year::text IN (SELECT b2.year::text FROM "${schema}".batches b2 WHERE b2.id::text = $1::text OR b2.code::text = $1::text OR b2.batch_cd::text = $1::text)
               )
             )`,
          [String(batch_cd), String(course_cd)]
        ).catch(() => []);
      }

      if (!batchMatches || batchMatches.length === 0) {
        batchMatches = await queryDb(
          `SELECT id, code, batch_cd, name, year, course_cd FROM "${schema}".batches
           WHERE id::text = $1::text OR code::text = $1::text OR batch_cd::text = $1::text OR year::text = $1::text`,
          [String(batch_cd)]
        ).catch(() => []);
      }
    }

    if ((!batchMatches || batchMatches.length === 0) && course_cd) {
      batchMatches = await queryDb(
        `SELECT id, code, batch_cd, name, year, course_cd FROM "${schema}".batches
         WHERE course_cd::text = $1::text`,
        [String(course_cd)]
      ).catch(() => []);
    }

    const matchedBatchIds = batchMatches.map((b: any) => String(b.id));
    const matchedBatchCodes = batchMatches.flatMap((b: any) => [b.code, b.batch_cd, b.year].filter(Boolean).map(String));

    // 2. Fetch Enrolled Students for Selected Scope
    let studentRows = await queryDb(
      `SELECT s.id, s.name AS stud_name, s.registration_no AS stud_reg_no, s.rollno AS stud_roll_no,
              s.course_cd, s.batch_cd, s.batch_id, s.photo_url
       FROM "${schema}".students s
       WHERE (s.course_cd::text = $1::text OR $1 IS NULL)
         AND (
           $2::text IS NULL
           OR s.batch_id::text = $2::text
           OR s.batch_cd::text = $2::text
           OR (array_length($3::text[], 1) > 0 AND (s.batch_id::text = ANY($3::text[]) OR s.batch_cd::text = ANY($4::text[])))
         )
       ORDER BY s.rollno ASC, s.name ASC`,
      [course_cd ? String(course_cd) : null, batch_cd ? String(batch_cd) : null, matchedBatchIds, matchedBatchCodes]
    ).catch(() => []);

    if (!studentRows || studentRows.length === 0) {
      studentRows = await queryDb(
        `SELECT s.id, s.name AS stud_name, s.registration_no AS stud_reg_no, s.rollno AS stud_roll_no,
                s.course_cd, s.batch_cd, s.batch_id, s.photo_url
         FROM "${schema}".students s
         WHERE (s.course_cd::text = $1::text OR $1 IS NULL)
         ORDER BY s.rollno ASC, s.name ASC
         LIMIT 200`,
        [course_cd ? String(course_cd) : null]
      ).catch(() => []);
    }

    // 3. Find Attendance Sessions Conducted within Date Range
    const sessionRows = await queryDb(
      `SELECT sess.id AS session_id, sess.subject_id, sess.session_date, sess.timetable_slot_id, sess.topic_covered,
              sess.course_cd, sess.branch_cd, sess.batch_cd, sess.sem_cd, sess.section_cd,
              COALESCE(sub.code, sub.sub_addinfo, ts.topic, ts.competency_codes, sess.topic_covered, 'LEC') AS sub_cd,
              COALESCE(sub.name, ts.topic, ts.description, sess.topic_covered, 'Subject') AS sub_name,
              COALESCE(sess.section_cd::text, ts.section, '1') AS resolved_section
       FROM "${schema}".attendance_sessions sess
       LEFT JOIN "${schema}".subjects sub ON sub.id::text = sess.subject_id::text
       LEFT JOIN "${schema}".timetable_slots ts ON ts.id::text = sess.timetable_slot_id::text
       LEFT JOIN "${schema}".batches b ON b.id::text = sess.batch_id::text
       WHERE sess.is_cancelled = false
         AND sess.session_date::date >= $1::date
         AND sess.session_date::date <= $2::date
         AND (
           $3::text IS NULL
           OR sess.course_cd::text = $3::text
           OR sub.course_cd::text = $3::text
           OR ts.course_cd::text = $3::text
           OR b.course_cd::text = $3::text
         )
         AND (
           $4::text IS NULL
           OR sess.batch_cd::text = $4::text
           OR sess.batch_id::text = $4::text
           OR (array_length($5::text[], 1) > 0 AND (sess.batch_id::text = ANY($5::text[]) OR b.code::text = ANY($6::text[])))
           OR b.batch_cd::text = $4::text
           OR b.code::text = $4::text
           OR ts.batch_cd::text = $4::text
         )
         AND (
           $7::text IS NULL
           OR sess.sem_cd::text = $7::text
           OR ts.semester::text = $7::text
         )
         AND (
           $8::text IS NULL
           OR sess.section_cd::text = $8::text
           OR ts.section = $8::text
         )
         AND (
           $9::text IS NULL
           OR sub.code::text = $9::text
           OR sub.sub_addinfo::text = $9::text
           OR sess.subject_id::text = $9::text
           OR sub.name::text ILIKE '%' || $9::text || '%'
           OR ts.topic::text ILIKE '%' || $9::text || '%'
           OR sess.topic_covered::text ILIKE '%' || $9::text || '%'
         )`,
      [
        normFdt,
        normTdt,
        course_cd ? String(course_cd) : null,
        batch_cd ? String(batch_cd) : null,
        matchedBatchIds,
        matchedBatchCodes,
        sem_cd ? String(sem_cd) : null,
        secFilter,
        cleanSubCd,
      ]
    ).catch(() => []);

    // 4. Find Timetable Scheduled Slots within Date Range (for classes scheduled without attendance)
    const scheduledSlots = await queryDb(
      `SELECT ts.id, ts.subject_id,
              COALESCE(sub.code, sub.sub_addinfo, ts.topic, ts.competency_codes, 'LEC') AS sub_cd,
              COALESCE(sub.name, ts.topic, ts.description, 'Subject') AS sub_name,
              ts.section, ts.effective_from, ts.effective_until
       FROM "${schema}".timetable_slots ts
       LEFT JOIN "${schema}".subjects sub ON sub.id::text = ts.subject_id::text
       LEFT JOIN "${schema}".batches b ON b.id::text = ts.batch_id::text
       WHERE (
           $1::text IS NULL
           OR ts.course_cd::text = $1::text
           OR sub.course_cd::text = $1::text
           OR b.course_cd::text = $1::text
         )
         AND (
           $2::text IS NULL
           OR ts.batch_cd::text = $2::text
           OR ts.batch_id::text = $2::text
           OR (array_length($3::text[], 1) > 0 AND (ts.batch_id::text = ANY($3::text[]) OR b.code::text = ANY($4::text[])))
           OR b.batch_cd::text = $2::text
           OR b.code::text = $2::text
         )
         AND (
           $5::text IS NULL
           OR ts.semester::text = $5::text
         )
         AND (
           $6::text IS NULL
           OR ts.section = $6::text
         )
         AND (
           ts.effective_from IS NOT NULL AND ts.effective_until IS NOT NULL
           AND ts.effective_from::date <= $8::date
           AND ts.effective_until::date >= $7::date
         )
         AND (
           $9::text IS NULL
           OR sub.code::text = $9::text
           OR sub.sub_addinfo::text = $9::text
           OR ts.subject_id::text = $9::text
           OR sub.name::text ILIKE '%' || $9::text || '%'
           OR ts.topic::text ILIKE '%' || $9::text || '%'
         )`,
      [
        course_cd ? String(course_cd) : null,
        batch_cd ? String(batch_cd) : null,
        matchedBatchIds,
        matchedBatchCodes,
        sem_cd ? String(sem_cd) : null,
        secFilter,
        normFdt,
        normTdt,
        cleanSubCd,
      ]
    ).catch(() => []);

    // 5. Generate Subject Map Dynamically from Sessions & Scheduled Classes
    const subjectMap = new Map<string, { sub_cd: string; sub_name: string; id: string; hasSessions: boolean }>();

    sessionRows.forEach((row: any) => {
      const key = String(row.sub_cd || row.subject_id || row.sub_name);
      if (!subjectMap.has(key)) {
        subjectMap.set(key, {
          sub_cd: String(row.sub_cd || 'LEC'),
          sub_name: String(row.sub_name),
          id: String(row.subject_id || key),
          hasSessions: true,
        });
      }
    });

    scheduledSlots.forEach((slot: any) => {
      const key = String(slot.sub_cd || slot.subject_id || slot.sub_name);
      if (!subjectMap.has(key)) {
        subjectMap.set(key, {
          sub_cd: String(slot.sub_cd || 'LEC'),
          sub_name: String(slot.sub_name),
          id: String(slot.subject_id || key),
          hasSessions: false,
        });
      }
    });

    const subjectList = Array.from(subjectMap.values()).map((s) => ({ sub_cd: s.sub_cd, sub_name: s.sub_name }));
    const subjectColumns = subjectList.map((s) => s.sub_name);

    // 6. Fetch Student Attendance Records for Matched Sessions
    const studentIds = studentRows.map((s: any) => String(s.id));
    const sessionIds = sessionRows.map((s: any) => String(s.session_id));
    let recordRows: any[] = [];
    if (studentIds.length > 0 && sessionIds.length > 0) {
      recordRows = await queryDb(
        `SELECT ar.student_id, ar.session_id, ar.status, sess.subject_id, sess.section_cd
         FROM "${schema}".attendance_records ar
         JOIN "${schema}".attendance_sessions sess ON sess.id::text = ar.session_id::text
         WHERE ar.session_id::text = ANY($1::text[])
           AND ar.student_id::text = ANY($2::text[])`,
        [sessionIds, studentIds]
      ).catch(() => []);
    }

    // 7. Resolve Dynamic Institution, Course, and Batch Names
    const institutionRow = await queryDb(
      `SELECT name FROM "${schema}".colleges 
       WHERE colg_cd::text = $1::text OR code::text = $1::text OR id::text = $1::text 
       LIMIT 1`,
      [String(colg_cd || '1')]
    ).catch(() => []);
    let dynamicColgName = institutionRow?.[0]?.name;
    if (!dynamicColgName) {
      if (isSrms && (String(colg_cd) === '1' || targetSlug.includes('srms-cet-bareilly'))) {
        dynamicColgName = 'SRMS CET,BAREILLY';
      } else {
        dynamicColgName = targetSlug
          .split('-')
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
    }

    const courseRow = course_cd
      ? await queryDb(
          `SELECT name FROM "${schema}".courses WHERE code::text = $1::text OR id::text = $1::text LIMIT 1`,
          [String(course_cd)]
        ).catch(() => [])
      : [];
    const dynamicCourseName = courseRow?.[0]?.name || `Course ${course_cd || 1}`;

    const batchRow = batch_cd
      ? await queryDb(
          `SELECT name, year FROM "${schema}".batches WHERE id::text = $1::text OR code::text = $1::text OR batch_cd::text = $1::text LIMIT 1`,
          [String(batch_cd)]
        ).catch(() => [])
      : [];
    const dynamicBatchName =
      batchRow?.[0]?.name || (batchRow?.[0]?.year ? `Batch ${batchRow[0].year}` : `Batch ${batch_cd || 1}`);

    // Pre-index sessions and records for O(1) fast lookup
    const sessMap = new Map<string, any>();
    sessionRows.forEach((sess: any) => {
      sessMap.set(String(sess.session_id), sess);
    });

    const studentRecordMap = new Map<string, Map<string, { present: number; total: number }>>();
    recordRows.forEach((r: any) => {
      const sId = String(r.student_id);
      const sess = sessMap.get(String(r.session_id));
      if (!sess) return;
      const subKey = String(sess.sub_cd || sess.subject_id || sess.sub_name);
      if (!studentRecordMap.has(sId)) {
        studentRecordMap.set(sId, new Map());
      }
      const sSubMap = studentRecordMap.get(sId)!;
      if (!sSubMap.has(subKey)) {
        sSubMap.set(subKey, { present: 0, total: 0 });
      }
      const stat = sSubMap.get(subKey)!;
      stat.total += 1;
      if (r.status === 'PRESENT' || r.status === 'LATE') {
        stat.present += 1;
      }
    });

    // 8. Build Student Attendance Matrix
    const students = studentRows.map((stud: any, idx: number) => {
      const studId = String(stud.id);
      let totalConducted = 0;
      let totalAttended = 0;

      const subjectsArr: any[] = [];
      const studentObj: Record<string, any> = {
        s_no: idx + 1,
        colg_name: dynamicColgName,
        course_name: dynamicCourseName,
        branch_name: 'Department',
        batch_name: dynamicBatchName,
        stud_reg_no: stud.stud_reg_no || stud.id,
        stud_roll_no: stud.stud_roll_no || stud.stud_reg_no || stud.id,
        stud_name: stud.stud_name || 'Student',
        photo_url: stud.photo_url || null,
        AttendanceType: 'FACULTY_MANUAL',
      };

      const studSubMap = studentRecordMap.get(studId);

      subjectMap.forEach((sub, key) => {
        const stat = studSubMap?.get(key) || { present: 0, total: 0 };
        totalConducted += stat.total;
        totalAttended += stat.present;

        const pct = stat.total > 0 ? ((stat.present / stat.total) * 100).toFixed(2) : '0.00';
        const displayVal = `${stat.present}/${stat.total} (${pct}%)`;

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
