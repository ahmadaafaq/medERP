export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';
import { queryDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const colg_cd = body.colg_cd;
    const course_cd = body.course_cd || 13;
    const branch_cd = body.branch_cd || 1;
    const batch_cd = body.batch_cd || 2;
    const sem_cd = body.sem_cd || 3;
    const section_cd = body.section_cd || 1;
    const fdt = body.fdt || '2026-07-02';
    const tdt = body.tdt || '2026-08-21';
    const tenantSlug = body.tenantSlug || body.tenant || request.headers.get('x-tenant-slug') || '';

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
    const isSrms = targetSlug.startsWith('srms') || targetSlug.includes('srms') || colg_cd === 1 || colg_cd === '1' || colg_cd === 2 || colg_cd === '2' || colg_cd === 11 || colg_cd === '11';

    let attList: any[] = [];
    let totList: any[] = [];

    if (isSrms) {
      // 1. Fetch live SRMS CCTV attendance from remote server
      const attPayload = {
        batch_cd: Number(batch_cd),
        colg_cd: Number(colg_cd || 1),
        course_cd: Number(course_cd),
        branch_cd: Number(branch_cd),
        sem_cd: Number(sem_cd),
        section_cd: Number(section_cd),
        fdt,
        tdt,
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
    }

    // ── CASE 1: SRMS RETURNED STUDENT ATTENDANCE DATA ──
    if (attList.length > 0) {
      // Map total percentage by stud_reg_no
      const totMap = new Map<string, string>();
      if (Array.isArray(totList)) {
        totList.forEach((item: any) => {
          if (item.stud_reg_no) {
            totMap.set(String(item.stud_reg_no).trim(), item.TotalPresentPercentage || '0.00%');
          }
        });
      }

      // Discover all unique subjects with sub_cd and sub_name from CCTV
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

      // ── FUSION: Check for any manual attendance marked by faculty in PostgreSQL ──
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
          [fdt, tdt, String(course_cd)]
        ).catch(() => []);

        if (manualRows && manualRows.length > 0) {
          // Map: studentIdentifier (reg_no or rollno) -> sub_cd -> { present: number, total: number }
          const manualByStudent = new Map<string, Map<string, { present: number; total: number; sub_name: string }>>();

          manualRows.forEach((r: any) => {
            const keys = [r.registration_no, r.rollno].filter(Boolean).map(k => String(k).trim());
            const subCd = String(r.sub_cd);
            const isPres = r.status === 'PRESENT' || r.status === 'LATE';

            // Also register subject in subjectMap if not present by code or name
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

          // Augment CCTV attendance data with manual faculty marks
          attList = attList.map((stud: any) => {
            const regNo = String(stud.stud_reg_no || '').trim();
            const rollNo = String(stud.stud_roll_no || '').trim();
            const mData = manualByStudent.get(regNo) || manualByStudent.get(rollNo);

            if (!mData || mData.size === 0) return stud;

            const existingSubs: any[] = Array.isArray(stud.subjects) ? [...stud.subjects] : [];
            const updatedSubs: any[] = [];
            const handledSubCds = new Set<string>();

            // 1. Update existing subjects with additional manual counts
            existingSubs.forEach((sub: any) => {
              const sc = String(sub.sub_cd || '');
              const sn = String(sub.sub_name || '').trim().toLowerCase();

              // Match by code or name
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

            // 2. Add manual subjects that weren't in CCTV
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

      // Flatten each student with dynamic subject properties and structured subjects array
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
        const totPct = totalConducted > 0
          ? `${((totalAttended / totalConducted) * 100).toFixed(2)}%`
          : (totMap.get(regNo) || stud.TotalPresentPercentage || '0.00%');

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

    // ── CASE 2: NO DATA FOUND IN SRMS (OR NON-SRMS TENANT) ──
    // Fallback directly to PostgreSQL database lecture-based as timetable schedules and faculty marked

    // 1. Fetch Students from PostgreSQL
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
      [
        course_cd ? String(course_cd) : null,
        batch_cd ? String(batch_cd) : null,
      ]
    ).catch(() => []);

    // Fallback: if batch query returned empty, query by course_cd
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

    // 2. Fetch Sessions in date range strictly scoped to the selected course
    const sessionRows = await queryDb(
      `SELECT sess.id AS session_id, sess.subject_id, sess.session_date, sess.timetable_slot_id, sess.topic_covered,
              COALESCE(sub.code, sub.sub_addinfo, ts.topic, sess.topic_covered, sess.subject_id::text, 'LEC') AS sub_cd,
              COALESCE(sub.name, ts.topic, ts.description, sess.topic_covered, 'Scheduled Lecture') AS sub_name
       FROM "${schema}".attendance_sessions sess
       LEFT JOIN "${schema}".timetable_slots ts ON ts.id::text = sess.timetable_slot_id::text
       LEFT JOIN "${schema}".subjects sub ON sub.id::text = sess.subject_id::text OR sub.id::text = ts.subject_id::text
       WHERE sess.is_cancelled = false
         AND sess.session_date::date >= $1::date
         AND sess.session_date::date <= $2::date
         AND (
           (ts.course_cd::text = $3::text)
           OR (sub.course_cd::text = $3::text)
         )`,
      [fdt, tdt, course_cd ? String(course_cd) : null]
    ).catch(() => []);

    // 3. Unique subjects from sessions + timetable_slots for this course
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

    // Also include subjects from timetable_slots for this course so columns show up
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

    const subjectList = Array.from(subjectMap.values()).map(s => ({ sub_cd: s.sub_cd, sub_name: s.sub_name }));
    const subjectColumns = subjectList.map(s => s.sub_name);

    // 4. Fetch attendance records for students and sessions
    const studentIds = studentRows.map((s: any) => String(s.id));
    let recordRows: any[] = [];
    if (studentIds.length > 0 && sessionRows.length > 0) {
      const sessionIds = sessionRows.map((s: any) => String(s.session_id));
      recordRows = await queryDb(
        `SELECT ar.student_id, ar.session_id, ar.status, sess.subject_id
         FROM "${schema}".attendance_records ar
         JOIN "${schema}".attendance_sessions sess ON sess.id::text = ar.session_id::text
         WHERE ar.session_id::text = ANY($1::text[])
           AND ar.student_id::text = ANY($2::text[])`,
        [sessionIds, studentIds]
      ).catch(() => []);
    }

    // Map: student_id -> sub_cd -> { total: number, present: number }
    const subjectTotalSessions = new Map<string, number>();
    sessionRows.forEach((row: any) => {
      const key = String(row.sub_cd || row.subject_id || row.sub_name);
      subjectTotalSessions.set(key, (subjectTotalSessions.get(key) || 0) + 1);
    });

    const attStats = new Map<string, Map<string, { total: number; present: number }>>();
    studentRows.forEach((stud: any) => {
      const studId = String(stud.id);
      const subMap = new Map<string, { total: number; present: number }>();
      subjectMap.forEach((sub, key) => {
        subMap.set(key, {
          total: subjectTotalSessions.get(key) || 0,
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
          if (isPres) cur.present++;
        }
      }
    });

    // Academic Course & Batch labels
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

    const students = studentRows.map((stud: any, idx: number) => {
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
