export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { srmsPostDirect, isSrmsTenant, fetchSrmsLoadSubjects, fetchSrmsLoadFaculty, resolveSrmsSubjectLink } from '@/lib/srms-client';
import { queryDb } from '@/lib/db';

function formatToSrmsTimetblDate(dateStr?: string, defaultTime: string = '08:30'): { formatted: string; date: Date; iso: string; dayOfWeek: number; timeStr: string } {
  const pad = (n: number) => String(n).padStart(2, '0');
  if (!dateStr) {
    const now = new Date();
    const formatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${defaultTime} `;
    return { formatted, date: now, iso: now.toISOString(), dayOfWeek: now.getDay() || 7, timeStr: `${defaultTime}:00` };
  }

  const clean = dateStr.trim();
  // Already in "YYYY-MM-DD HH:mm" or "YYYY-MM-DD HH:mm " format
  const ymdMatch = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[\sT]+(\d{1,2}):(\d{1,2})/);
  if (ymdMatch) {
    const y = Number(ymdMatch[1]);
    const m = Number(ymdMatch[2]);
    const d = Number(ymdMatch[3]);
    let hh = Number(ymdMatch[4]);
    const mm = Number(ymdMatch[5]);
    if (clean.toUpperCase().includes('PM') && hh < 12) hh += 12;
    if (clean.toUpperCase().includes('AM') && hh === 12) hh = 0;
    const localDate = new Date(y, m - 1, d, hh, mm, 0);
    const dow = localDate.getDay() === 0 ? 7 : localDate.getDay();
    const formatted = `${y}-${pad(m)}-${pad(d)} ${pad(hh)}:${pad(mm)} `;
    const timeStr = `${pad(hh)}:${pad(mm)}:00`;
    return { formatted, date: localDate, iso: localDate.toISOString(), dayOfWeek: dow, timeStr };
  }

  // DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})[\sT]+(\d{1,2}):(\d{1,2})/);
  if (dmyMatch) {
    const d = Number(dmyMatch[1]);
    const m = Number(dmyMatch[2]);
    const y = Number(dmyMatch[3]);
    let hh = Number(dmyMatch[4]);
    const mm = Number(dmyMatch[5]);
    if (clean.toUpperCase().includes('PM') && hh < 12) hh += 12;
    if (clean.toUpperCase().includes('AM') && hh === 12) hh = 0;
    const localDate = new Date(y, m - 1, d, hh, mm, 0);
    const dow = localDate.getDay() === 0 ? 7 : localDate.getDay();
    const formatted = `${y}-${pad(m)}-${pad(d)} ${pad(hh)}:${pad(mm)} `;
    const timeStr = `${pad(hh)}:${pad(mm)}:00`;
    return { formatted, date: localDate, iso: localDate.toISOString(), dayOfWeek: dow, timeStr };
  }

  const dt = new Date(clean);
  if (!isNaN(dt.getTime())) {
    const y = dt.getFullYear();
    const m = dt.getMonth() + 1;
    const d = dt.getDate();
    const hh = dt.getHours();
    const mm = dt.getMinutes();
    const dow = dt.getDay() === 0 ? 7 : dt.getDay();
    const formatted = `${y}-${pad(m)}-${pad(d)} ${pad(hh)}:${pad(mm)} `;
    const timeStr = `${pad(hh)}:${pad(mm)}:00`;
    return { formatted, date: dt, iso: dt.toISOString(), dayOfWeek: dow, timeStr };
  }

  const fallback = new Date();
  return {
    formatted: `${fallback.getFullYear()}-${pad(fallback.getMonth() + 1)}-${pad(fallback.getDate())} ${defaultTime} `,
    date: fallback,
    iso: fallback.toISOString(),
    dayOfWeek: fallback.getDay() || 7,
    timeStr: `${defaultTime}:00`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const improperEvent = body.improperEvent || body;

    const title = String(improperEvent.title || '').trim();
    const description = String(improperEvent.description || '').trim();
    const rawStart = String(improperEvent.start || '').trim();
    const rawEnd = String(improperEvent.end || '').trim();
    const linkcd = String(improperEvent.linkcd || '').trim();
    const electiveflg = String(improperEvent.electiveflg || 'N').trim();
    const txtG = String(improperEvent.txtG || improperEvent.txt_g || '0').trim();
    const txtSec = String(improperEvent.txtSec || improperEvent.txt_sec || '1').trim();
    const empid = String(improperEvent.empid || '').trim();
    const colgcd = String(improperEvent.colgcd || improperEvent.colg_cd || '1').trim();
    const cameraLink = String(improperEvent.CameraLink || improperEvent.camera_link || '0').trim();
    
    // Academic & Curriculum metadata
    const courseCd = String(improperEvent.course || improperEvent.course_cd || '13').trim();
    const branchCd = String(improperEvent.branch || improperEvent.branch_cd || '1').trim();
    const batchCd = String(improperEvent.batch || improperEvent.batch_cd || '2').trim();
    const semCd = String(improperEvent.sem || improperEvent.sem_cd || improperEvent.semester || '3').trim();
    const unitId = String(improperEvent.unit_id || improperEvent.unitId || '').trim();
    const unitName = String(improperEvent.unit_name || improperEvent.unitName || improperEvent.unit || '').trim();
    const topic = String(improperEvent.topic || '').trim();
    const subTopics = String(improperEvent.sub_topics || improperEvent.subTopics || improperEvent.subtopic || '').trim();
    const competencyCodes = String(improperEvent.competency_codes || improperEvent.competencyCodes || '').trim();

    const startMeta = formatToSrmsTimetblDate(rawStart, '08:30');
    const endMeta = formatToSrmsTimetblDate(rawEnd, '09:40');

    // 1. Resolve target PostgreSQL schema first
    const tenantParam = req.nextUrl?.searchParams?.get('tenant') || improperEvent.tenant || improperEvent.tenantSlug || '';
    const tenantHeader = req.headers.get('x-tenant-id') || req.headers.get('x-tenant') || req.headers.get('x-tenant-slug') || '';
    let slug = (tenantParam || tenantHeader).replace(/^tenant_/, '').replace(/^tenant-/, '').trim();
    // Derive slug from colgcd when no header or param is present (SRMS college codes 1-14 -> srms-* slugs)
    if (!slug) {
      const srmsCollegeSlugMap: Record<string, string> = {
        '1': 'srms-cet-bareilly',
        '2': 'srms-cetr-bareilly',
        '3': 'srms-cet-unnao',
        '4': 'srms-law',
        '5': 'srms-ibs-lucknow',
        '6': 'srms-iahs-bareilly',
        '11': 'srms-ims',
      };
      slug = srmsCollegeSlugMap[colgcd] || 'srms-cet-bareilly';
    }
    const schema = `tenant_${slug}`;
    // Determines whether this college should sync to the SRMS portal (strictly tenants with srms)
    const callSrmsApi = isSrmsTenant(slug);

    // 1.5 Check if this exact slot is ALREADY synchronized in srms_timetable_events with a valid srms_id
    if (callSrmsApi) {
      try {
        const alreadySynced = await queryDb(
          `SELECT id, srms_id, title, description, start_time, end_time, start_str, end_str, day_of_week, linkcd, electiveflg, txt_g, txt_sec, empid, colg_cd, course_cd, branch_cd, batch_cd, sem_cd, camera_link, unit_id, unit_name, topic, sub_topics, competency_codes, raw_payload
           FROM "${schema}".srms_timetable_events
           WHERE day_of_week = $1
             AND (start_str LIKE '%' || $2 || '%' OR start_time::TIME = $3::TIME)
             AND (colg_cd = $4 OR colg_cd IS NULL)
             AND (course_cd = $5 OR course_cd IS NULL)
             AND (branch_cd = $6 OR branch_cd IS NULL)
             AND (batch_cd = $7 OR batch_cd IS NULL)
             AND (sem_cd = $8 OR sem_cd IS NULL)
             AND (txt_sec = $9 OR txt_sec IS NULL)
             AND (empid = $10 OR empid IS NULL)
             AND srms_id IS NOT NULL AND (srms_id > 0 OR srms_id::text != '')
             AND id::text NOT IN (SELECT event_id FROM "${schema}".deleted_timetable_events)
           ORDER BY created_at DESC
           LIMIT 1`,
          [
            startMeta.dayOfWeek,
            startMeta.timeStr.slice(0, 5),
            startMeta.timeStr,
            colgcd,
            courseCd,
            branchCd,
            batchCd,
            semCd,
            txtSec,
            empid,
          ]
        ).catch(() => []);

        if (alreadySynced && alreadySynced.length > 0) {
          const ev = alreadySynced[0];
          return NextResponse.json({
            success: true,
            message: 'Lecture already synchronized with SRMS.',
            id: Number(ev.srms_id) || ev.srms_id,
            event: ev,
            srms_data: { success: true, id: ev.srms_id, message: 'Already synchronized with SRMS.' }
          });
        }
      } catch (checkErr: any) {
        console.warn('[add-event check-already-synced]:', checkErr.message);
      }
    }

    // 2. Pre-Validation: Faculty Overlap Validation across All Departments & Courses for the SAME DAY & TIME SLOT
    const facIdentifier = empid || linkcd;
    if (facIdentifier) {
      // Find faculty details from faculty table
      const facRows = await queryDb(
        `SELECT id, emp_id, name FROM "${schema}".faculty 
         WHERE emp_id = $1 OR id::text = $1 OR name ILIKE $2
         LIMIT 1`,
        [facIdentifier, `%${description || title}%`]
      ).catch(() => []);

      const targetFacId = facRows[0]?.id ? String(facRows[0].id) : null;
      const targetEmpId = facRows[0]?.emp_id ? String(facRows[0].emp_id) : (empid || null);
      const targetFacName = facRows[0]?.name || title.match(/\(([^)]+)\)/)?.[1] || description.match(/\(([^)]+)\)/)?.[1] || empid || 'Faculty Member';

      const excludeId = String(improperEvent.excludeId || improperEvent.editingSlotId || improperEvent.id || '').trim();
      const excludeDraftId = String(improperEvent.excludeDraftId || improperEvent.draftId || body.excludeDraftId || body.draftId || '').trim();
      const isDraftApproval = Boolean(improperEvent.isDraftApproval || improperEvent.isApproval || body.isDraftApproval || body.isApproval || excludeDraftId);

      // Check timetable_slots, srms_timetable_events, and timetable_drafts for conflicts on this day of week and overlapping time
      const [slotClashes, eventClashes, draftClashes] = await Promise.all([
        queryDb(
          `SELECT ts.id, ts.start_time, ts.end_time, ts.day_of_week, ts.topic, ts.description,
                  ts.course_cd, ts.branch_cd, ts.batch_cd, ts.semester, ts.section,
                  f.name AS faculty_name, f.emp_id AS faculty_code,
                  sub.name AS subject_name,
                  d.name AS department_name,
                  b.code AS batch_code, b.name AS batch_name
           FROM "${schema}".timetable_slots ts
           LEFT JOIN "${schema}".faculty f ON f.id = ts.faculty_id
           LEFT JOIN "${schema}".subjects sub ON sub.id = ts.subject_id
           LEFT JOIN "${schema}".departments d ON d.id = ts.department_id
           LEFT JOIN "${schema}".batches b ON b.id = ts.batch_id
           WHERE ts.day_of_week = $1
             AND (ts.start_time::TIME < $3::TIME AND ts.end_time::TIME > $2::TIME)
             AND ($7::text = '' OR ts.id::text <> $7::text)
             AND ($8::text = '' OR ts.draft_id IS NULL OR ts.draft_id::text <> $8::text)
             AND (
               ts.faculty_id::text = $4
               OR f.emp_id = $5
               OR f.name ILIKE $6
               OR ts.description ILIKE $6
             )
           LIMIT 1`,
          [
            startMeta.dayOfWeek,
            startMeta.timeStr,
            endMeta.timeStr,
            targetFacId || '00000000-0000-0000-0000-000000000000',
            targetEmpId || '',
            `%${targetFacName}%`,
            excludeId,
            excludeDraftId
          ]
        ).catch(() => []),

        queryDb(
          `SELECT te.id, te.day_of_week, te.title, te.description,
                  te.course_cd, te.branch_cd, te.batch_cd, te.sem_cd AS semester, te.txt_sec AS section,
                  te.start_str, te.end_str,
                  f.name AS faculty_name, f.emp_id AS faculty_code,
                  sub.name AS subject_name,
                  d.name AS department_name
           FROM "${schema}".srms_timetable_events te
           LEFT JOIN "${schema}".faculty f ON (f.emp_id = te.empid OR f.id::text = te.empid)
           LEFT JOIN "${schema}".subjects sub ON (sub.code = te.linkcd OR sub.id::text = te.linkcd)
           LEFT JOIN "${schema}".departments d ON (d.code = te.branch_cd OR d.id::text = te.branch_cd)
           WHERE te.day_of_week = $1
             AND (
               (
                 te.start_str LIKE '% ' || $2 || '%' 
                 OR te.start_str LIKE '% ' || $3 || '%'
                 OR (te.start_time::TIME < $5::TIME AND te.end_time::TIME > $4::TIME)
               )
             )
             AND ($9::text = '' OR (te.id::text <> $9::text AND te.srms_id::text <> $9::text))
             AND (
               te.empid = $6
               OR f.emp_id = $6
               OR f.id::text = $7
               OR f.name ILIKE $8
               OR te.description ILIKE $8
             )
           LIMIT 1`,
          [
            startMeta.dayOfWeek,
            startMeta.timeStr.slice(0, 5),
            startMeta.timeStr.slice(0, 2),
            startMeta.timeStr,
            endMeta.timeStr,
            targetEmpId || '',
            targetFacId || '00000000-0000-0000-0000-000000000000',
            `%${targetFacName}%`,
            excludeId
          ]
        ).catch(() => []),

        // When approving a draft into live schedule, do not check unapproved drafts for clashes
        isDraftApproval ? Promise.resolve([]) : queryDb(
          `SELECT td.id, td.title, td.course_cd, td.branch_cd, td.batch_cd, td.semester, td.section,
                  slot->>'startTime' AS start_time, slot->>'endTime' AS end_time,
                  COALESCE(slot->>'dayOfWeek', slot->>'day_of_week')::int AS day_of_week,
                  COALESCE(slot->>'subjectName', slot->>'subject_name', slot->>'topic') AS subject_name,
                  COALESCE(slot->>'facultyName', slot->>'faculty_name') AS faculty_name,
                  COALESCE(slot->>'facultyEmpId', slot->>'faculty_code', slot->>'empid') AS faculty_code
           FROM "${schema}".timetable_drafts td,
                jsonb_array_elements(td.slots) slot
           WHERE (slot->>'dayOfWeek' = $1::text OR slot->>'day_of_week' = $1::text)
             AND ((slot->>'startTime')::time < $3::time AND (slot->>'endTime')::time > $2::time)
             AND ($7::text = '' OR (slot->>'id' <> $7::text AND td.id::text <> $7::text))
             AND ($8::text = '' OR td.id::text <> $8::text)
             AND (
               slot->>'facultyEmpId' = $5
               OR slot->>'faculty_code' = $5
               OR slot->>'empid' = $5
               OR slot->>'facultyId' = $4
               OR slot->>'faculty_id' = $4
               OR slot->>'facultyName' ILIKE $6
               OR slot->>'faculty_name' ILIKE $6
             )
           LIMIT 1`,
          [
            startMeta.dayOfWeek,
            startMeta.timeStr,
            endMeta.timeStr,
            targetFacId || '00000000-0000-0000-0000-000000000000',
            targetEmpId || '',
            `%${targetFacName}%`,
            excludeId,
            excludeDraftId
          ]
        ).catch(() => [])
      ]);

      const clash = (slotClashes && slotClashes.length > 0)
        ? slotClashes[0]
        : ((eventClashes && eventClashes.length > 0) ? eventClashes[0] : ((draftClashes && draftClashes.length > 0) ? draftClashes[0] : null));

      if (clash) {
        const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const dayName = days[clash.day_of_week] || `Day ${clash.day_of_week}`;
        
        let startTimeStr = '08:30';
        let endTimeStr = '09:30';
        if (clash.start_time && clash.end_time) {
          startTimeStr = String(clash.start_time).slice(0, 5);
          endTimeStr = String(clash.end_time).slice(0, 5);
        } else if (clash.start_str) {
          const matchStart = clash.start_str.match(/\d{1,2}:\d{2}/);
          const matchEnd = clash.end_str?.match(/\d{1,2}:\d{2}/);
          if (matchStart) startTimeStr = matchStart[0];
          if (matchEnd) endTimeStr = matchEnd[0];
        }
        const timeRange = `${startTimeStr} - ${endTimeStr}`;

        const facName = clash.faculty_name || targetFacName || 'Faculty Member';
        const courseName = clash.course_name || clash.department_name
          ? `Course: ${clash.course_name || clash.department_name}`
          : (clash.course_cd ? `Course: ${clash.course_cd}` : 'Course: Academic');
        const batchName = clash.batch_name || clash.batch_code || clash.batch_cd ? `Batch: ${clash.batch_name || clash.batch_code || clash.batch_cd}` : 'Batch: Current';
        const semVal = clash.semester || clash.sem_cd || '3';
        const semesterName = `Semester: ${semVal}`;
        const secRaw = String(clash.section || clash.txt_sec || '1');
        const secLetter = secRaw === '1' ? 'A' : secRaw === '2' ? 'B' : secRaw === '3' ? 'C' : secRaw === '4' ? 'D' : secRaw;
        const sectionName = `Section: ${secLetter}`;

        const conflictMsg = `${facName} is already assigned to ${courseName}, ${batchName}, ${semesterName}, ${sectionName} on ${dayName} (${timeRange}). Please select a different time slot or choose another faculty member, or contact the Academic Administrator or Department Clerk to resolve the schedule overlap.`;

        return NextResponse.json({
          success: false,
          error: conflictMsg,
          message: conflictMsg,
          conflict: {
            faculty_name: facName,
            course: courseName,
            batch: batchName,
            semester: semesterName,
            section: sectionName,
            time: timeRange,
            day: dayName,
          }
        }, { status: 409 });
      }
    }

    // 2.5 Resolve Authentic SRMS linkcd (linkcd in SRMS is the integer link ID, NOT the subject code)
    let resolvedLinkcd = linkcd;
    let resolvedEmpid = empid;
    const subCode = String(improperEvent.subjectCode || improperEvent.subject_code || improperEvent.sub_cd || '').trim();
    const subName = String(improperEvent.subjectName || improperEvent.subject_name || title || description || '').trim();
    const facName = String(improperEvent.facultyName || improperEvent.faculty_name || '').trim();

    if (callSrmsApi) {
      try {
        const loadSubs = await fetchSrmsLoadSubjects({
          course: courseCd,
          branch: branchCd,
          batch: batchCd,
          semester: semCd,
          section: txtSec,
          colgcd: colgcd,
        });

        if (loadSubs && loadSubs.length > 0) {
          const match = resolveSrmsSubjectLink(loadSubs, {
            linkcd,
            subjectCode: subCode || linkcd,
            subjectName: subName,
            facultyName: facName,
            empid,
          });

          if (match?.linkcd) {
            resolvedLinkcd = match.linkcd;
            if (!resolvedEmpid && match.empid) {
              resolvedEmpid = match.empid;
            }
          }
        }

        // If linkcd is still 0, call LoadFaculty API with subject code to retrieve precise linkcd
        if ((!resolvedLinkcd || resolvedLinkcd === '0') && (subCode || linkcd)) {
          const facList = await fetchSrmsLoadFaculty({
            course: courseCd,
            branch: branchCd,
            batch: batchCd,
            semester: semCd,
            section: txtSec,
            subject: subCode || linkcd,
            start: rawStart || '2026-10-06 08:00:00',
            end: rawEnd || '2026-10-06 09:00:00',
            colgcd: colgcd,
          });
          if (facList && facList.length > 0) {
            const fMatch = facList.find((f: any) =>
              (empid && String(f.empid).trim().toLowerCase() === empid.toLowerCase()) ||
              (facName && (f.empname || '').toLowerCase().includes(facName.toLowerCase())) ||
              (subCode && String(f.sub_cd).trim() === subCode.trim())
            ) || facList[0];
            if (fMatch?.linkcd) {
              resolvedLinkcd = String(fMatch.linkcd);
              if (fMatch.empid && !resolvedEmpid) resolvedEmpid = String(fMatch.empid);
            }
          }
        }
      } catch (resolveErr: any) {
        console.warn('[add-event resolve linkcd warning]:', resolveErr.message);
      }
    }

    const cleanSubTitle = improperEvent.subjectName || improperEvent.subject_name || (title.includes(' - Unit') ? title.split(' - Unit')[0].trim() : title);
    const srmsTitle = cleanSubTitle || title || 'Lecture';
    const srmsDesc = description || `${srmsTitle}${facName ? ' ' + facName : ''}`;

    // 3. New SRMS AddEvent API Payload (https://myportal.srms.ac.in/srmserp/Timetbl/AddEvent)
    const srmsPayload = {
      title: srmsTitle,
      description: srmsDesc,
      start: startMeta.formatted,
      end: endMeta.formatted,
      linkcd: resolvedLinkcd,
      electiveflg,
      txtG,
      txtSec,
      empid: resolvedEmpid,
      colgcd,
      CameraLink: cameraLink,
      Cancel_flg: '0',
      cancelflg: '0',
    };

    let srmsResponse: any = null;
    let srmsSuccess = false;
    let srmsId: number | string | null = null;
    let srmsMessage = '';

    if (callSrmsApi) {
      // Use srmsPostDirect (https.request + rejectUnauthorized:false) to bypass expired SSL on myportal.srms.ac.in.
      try {
        srmsResponse = await srmsPostDirect(
          'https://myportal.srms.ac.in/srmserp/Timetbl/AddEvent',
          srmsPayload,
        );
        if (srmsResponse) {
          srmsSuccess = srmsResponse.success === true || (srmsResponse.id && Number(srmsResponse.id) > 0);
          srmsId = srmsResponse.id ?? null;
          srmsMessage = srmsResponse.message || '';
        }
      } catch (srmsErr: any) {
        console.warn('[SRMS AddEvent remote error]:', srmsErr.message);
        srmsMessage = srmsErr.message;
      }

      if (!srmsSuccess) {
        // SRMS portal rejected — detect if it's a scheduling conflict or raw DB error
        // SRMS often returns "There is no row at position 0" or similar raw PG errors on duplicate lecture
        const rawMsg = (srmsMessage || '').toLowerCase();
        const isConflict = rawMsg.includes('already') || rawMsg.includes('exists') || rawMsg.includes('duplicate') ||
          rawMsg.includes('no row') || rawMsg.includes('position 0') || rawMsg.includes('overlap') ||
          rawMsg.includes('conflict') || rawMsg.includes('assigned') || !srmsMessage;

        if (isConflict) {
          // Query PostgreSQL to find where this faculty is already scheduled for this day & time
          const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          const targetEmpId = empid || linkcd;

          // Search in srms_timetable_events — JOIN courses table for dynamic name resolution
          const existingEvents = await queryDb(
            `SELECT te.id, te.day_of_week, te.start_str, te.end_str, te.title, te.description,
                    te.course_cd, te.branch_cd, te.batch_cd, te.sem_cd, te.txt_sec,
                    te.linkcd, te.empid,
                    f.name AS faculty_name, f.emp_id AS faculty_emp_id,
                    sub.name AS subject_name,
                    d.name AS department_name,
                    d.code AS branch_code,
                    cr.name AS course_name
             FROM "${schema}".srms_timetable_events te
             LEFT JOIN "${schema}".faculty f ON (f.emp_id = te.empid OR f.id::text = te.empid)
             LEFT JOIN "${schema}".subjects sub ON (sub.code = te.linkcd OR sub.id::text = te.linkcd)
             LEFT JOIN "${schema}".departments d ON (d.code = te.branch_cd OR d.id::text = te.branch_cd)
             LEFT JOIN "${schema}".courses cr ON (cr.code = te.course_cd OR cr.id::text = te.course_cd)
             WHERE te.day_of_week = $1
               AND (te.empid = $2 OR f.emp_id = $2)
             ORDER BY te.created_at DESC
             LIMIT 5`,
            [startMeta.dayOfWeek, targetEmpId]
          ).catch(() => []);

          // Also search timetable_slots — JOIN courses table for dynamic name resolution
          const existingSlots = await queryDb(
            `SELECT ts.id, ts.day_of_week, ts.start_time, ts.end_time, ts.topic, ts.description,
                    ts.course_cd, ts.branch_cd, ts.batch_cd, ts.semester, ts.section,
                    f.name AS faculty_name, f.emp_id AS faculty_emp_id,
                    sub.name AS subject_name,
                    d.name AS department_name,
                    cr.name AS course_name
             FROM "${schema}".timetable_slots ts
             LEFT JOIN "${schema}".faculty f ON f.id = ts.faculty_id
             LEFT JOIN "${schema}".subjects sub ON sub.id = ts.subject_id
             LEFT JOIN "${schema}".departments d ON d.id = ts.department_id
             LEFT JOIN "${schema}".courses cr ON (cr.code = ts.course_cd OR cr.id::text = ts.course_cd)
             WHERE ts.day_of_week = $1
               AND (f.emp_id = $2 OR ts.description ILIKE $3)
             ORDER BY ts.start_time
             LIMIT 5`,
            [startMeta.dayOfWeek, targetEmpId, `%${description}%`]
          ).catch(() => []);

          // Build detailed conflict message
          const dayName = days[startMeta.dayOfWeek] || `Day ${startMeta.dayOfWeek}`;
          const facName = (existingEvents[0]?.faculty_name || existingSlots[0]?.faculty_name || description || title || 'Faculty Member').split('(')[0].trim();

          // Collect all unique engagements for this faculty on this day
          const engagements: string[] = [];
          const seenEngagements = new Set<string>();

          for (const ev of existingEvents) {
            // Use course_name from JOIN (dynamic) — fallback to raw code only if table missing
            const cName = ev.course_name || ev.department_name || (ev.course_cd ? `Course ${ev.course_cd}` : 'Unknown Course');
            const bName = ev.branch_code || ev.department_name || ev.branch_cd || 'Branch';
            const semName = `Sem ${ev.sem_cd || '?'}`;
            const secRaw = String(ev.txt_sec || '1');
            const secLetter = secRaw === '1' ? 'A' : secRaw === '2' ? 'B' : secRaw === '3' ? 'C' : secRaw === '4' ? 'D' : secRaw;
            const subName = ev.subject_name || (ev.title || '').replace(/\s*\([^)]*\)/, '').trim() || 'Subject';
            
            // Extract HH:mm safely from ISO or date string (e.g. '2026-09-28 10:10:00' -> '10:10')
            let timeInfo = '';
            if (ev.start_str) {
              const timeMatch = ev.start_str.match(/(?:T|\s|^)(\d{1,2}:\d{2})/);
              if (timeMatch) timeInfo = timeMatch[1];
            }
            const line = `${cName} › ${bName} › ${semName} › Sec-${secLetter} (${subName}${timeInfo ? ' @ ' + timeInfo : ''})`;
            if (!seenEngagements.has(line)) {
              seenEngagements.add(line);
              engagements.push(line);
            }
          }

          for (const sl of existingSlots) {
            if (engagements.length >= 5) break;
            // Use course_name from JOIN (dynamic)
            const cName = sl.course_name || sl.department_name || (sl.course_cd ? `Course ${sl.course_cd}` : 'Unknown Course');
            const bName = sl.department_name || sl.branch_cd || 'Branch';
            const semName = `Sem ${sl.semester || '?'}`;
            const secRaw = String(sl.section || '1');
            const secLetter = secRaw === '1' ? 'A' : secRaw === '2' ? 'B' : secRaw === '3' ? 'C' : secRaw === '4' ? 'D' : secRaw;
            const subName = sl.subject_name || sl.topic || 'Subject';
            
            let timeInfo = '';
            if (sl.start_time) {
              const timeMatch = String(sl.start_time).match(/(?:T|\s|^)(\d{1,2}:\d{2})/);
              if (timeMatch) timeInfo = timeMatch[1];
            }
            const line = `${cName} › ${bName} › ${semName} › Sec-${secLetter} (${subName}${timeInfo ? ' @ ' + timeInfo : ''})`;
            if (!seenEngagements.has(line)) {
              seenEngagements.add(line);
              engagements.push(line);
            }
          }

          let conflictMsg: string;
          if (engagements.length > 0) {
            conflictMsg = `⚠ Faculty Scheduling Conflict: ${facName} is already engaged on ${dayName} in:\n• ${engagements.join('\n• ')}\nPlease select a different time slot or choose another available faculty member.`;
          } else {
            conflictMsg = `⚠ Faculty Scheduling Conflict: ${facName} already has a lecture scheduled on ${dayName} at ${startMeta.timeStr.slice(0, 5)}–${endMeta.timeStr.slice(0, 5)}. SRMS portal rejected the slot. Please choose a different time or another faculty member.`;
          }

          return NextResponse.json({
            success: false,
            error: conflictMsg,
            message: conflictMsg,
            conflict: {
              faculty_name: facName,
              day: dayName,
              time: `${startMeta.timeStr.slice(0, 5)} – ${endMeta.timeStr.slice(0, 5)}`,
              engagements,
            },
            srms_data: srmsResponse,
          }, { status: 409 });
        }

        // Non-conflict SRMS error
        const errMsg = srmsMessage || 'SRMS portal rejected slot. Please try again.';
        return NextResponse.json({
          success: false,
          error: errMsg,
          message: errMsg,
          srms_data: srmsResponse,
        }, { status: 409 });
      }
    } else {
      // Non-SRMS tenant (e.g. Rajshree): skip SRMS portal, treat as DB-only success
      srmsSuccess = true;
      srmsMessage = 'Lecture added successfully (local DB only).';
    }

    // 4. Ensure srms_timetable_events table and extended columns exist in PostgreSQL
    await queryDb(`
      CREATE TABLE IF NOT EXISTS "${schema}".srms_timetable_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ NOT NULL,
        start_str VARCHAR(100),
        end_str VARCHAR(100),
        day_of_week INT,
        linkcd VARCHAR(50),
        electiveflg VARCHAR(10) DEFAULT 'N',
        txt_g VARCHAR(50) DEFAULT '0',
        txt_sec VARCHAR(50) DEFAULT '1',
        empid VARCHAR(50),
        colg_cd VARCHAR(50) DEFAULT '1',
        course_cd VARCHAR(50) DEFAULT '13',
        branch_cd VARCHAR(50) DEFAULT '1',
        batch_cd VARCHAR(50) DEFAULT '2',
        sem_cd VARCHAR(50) DEFAULT '3',
        camera_link VARCHAR(50),
        unit_id VARCHAR(100),
        unit_name VARCHAR(255),
        topic VARCHAR(255),
        sub_topics VARCHAR(500),
        competency_codes VARCHAR(255),
        srms_id BIGINT,
        raw_payload JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE "${schema}".srms_timetable_events ADD COLUMN IF NOT EXISTS unit_id VARCHAR(100);
      ALTER TABLE "${schema}".srms_timetable_events ADD COLUMN IF NOT EXISTS unit_name VARCHAR(255);
      ALTER TABLE "${schema}".srms_timetable_events ADD COLUMN IF NOT EXISTS topic VARCHAR(255);
      ALTER TABLE "${schema}".srms_timetable_events ADD COLUMN IF NOT EXISTS sub_topics VARCHAR(500);
      ALTER TABLE "${schema}".srms_timetable_events ADD COLUMN IF NOT EXISTS competency_codes VARCHAR(255);
      ALTER TABLE "${schema}".srms_timetable_events ADD COLUMN IF NOT EXISTS srms_id BIGINT;
    `).catch(() => {});

    // 5. Save into PostgreSQL srms_timetable_events with all parameters
    const insertRes = await queryDb(
      `INSERT INTO "${schema}".srms_timetable_events (
        title, description, start_time, end_time, start_str, end_str, day_of_week,
        linkcd, electiveflg, txt_g, txt_sec, empid, colg_cd, course_cd, branch_cd,
        batch_cd, sem_cd, camera_link, unit_id, unit_name, topic, sub_topics, competency_codes, srms_id, raw_payload, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, NOW(), NOW()
      ) RETURNING *`,
      [
        title,
        description,
        startMeta.iso,
        endMeta.iso,
        startMeta.formatted,
        endMeta.formatted,
        startMeta.dayOfWeek,
        resolvedLinkcd,
        electiveflg,
        txtG,
        txtSec,
        resolvedEmpid,
        colgcd,
        courseCd,
        branchCd,
        batchCd,
        semCd,
        cameraLink,
        unitId || null,
        unitName || null,
        topic || null,
        subTopics || null,
        competencyCodes || null,
        srmsId ? Number(srmsId) : null,
        JSON.stringify({
          ...srmsPayload,
          unitId,
          unitName,
          topic,
          subTopics,
          competencyCodes,
          srmsResponse,
        }),
      ],
    );

    const savedRow = insertRes[0];

    // Ensure new event ID is removed from deleted blacklist if present
    if (srmsId || savedRow?.id) {
      await queryDb(
        `DELETE FROM "${schema}".deleted_timetable_events 
         WHERE event_id = $1 OR event_id = $2`,
        [String(srmsId || ''), String(savedRow?.id || '')]
      ).catch(() => {});
    }

    // 6. Also sync to timetable_slots with exact academic hierarchy and effective week duration
    // ONLY for Non-SRMS tenants (SRMS tenants rely on SRMS API AddEvent and srms_timetable_events)
    if (!callSrmsApi) {
      try {
        await queryDb(`
          ALTER TABLE "${schema}".timetable_slots ADD COLUMN IF NOT EXISTS effective_from DATE;
          ALTER TABLE "${schema}".timetable_slots ADD COLUMN IF NOT EXISTS effective_until DATE;
          ALTER TABLE "${schema}".timetable_slots ADD COLUMN IF NOT EXISTS unit_id VARCHAR(100);
          ALTER TABLE "${schema}".timetable_slots ADD COLUMN IF NOT EXISTS unit_name VARCHAR(255);
          ALTER TABLE "${schema}".timetable_slots ADD COLUMN IF NOT EXISTS topic VARCHAR(255);
          ALTER TABLE "${schema}".timetable_slots ADD COLUMN IF NOT EXISTS sub_topics VARCHAR(500);
          ALTER TABLE "${schema}".timetable_slots ADD COLUMN IF NOT EXISTS competency_codes VARCHAR(255);
        `).catch(() => {});

        // Calculate effective week duration (Monday to Sunday) from the event date
        const evDate = startMeta.date || new Date();
        const evDay = evDate.getDay();
        const diffToMon = evDate.getDate() - evDay + (evDay === 0 ? -6 : 1);
        const weekMonday = new Date(evDate.getFullYear(), evDate.getMonth(), diffToMon, 0, 0, 0);
        const weekSunday = new Date(weekMonday);
        weekSunday.setDate(weekMonday.getDate() + 6);

        const effFrom = weekMonday.toISOString().slice(0, 10);
        const effUntil = weekSunday.toISOString().slice(0, 10);

        // Check if slot already exists at this day, start time, and academic hierarchy for this week
        const existingSlots = await queryDb(
          `SELECT id FROM "${schema}".timetable_slots 
           WHERE day_of_week = $1 
             AND start_time::text LIKE $2 || '%'
             AND (colg_cd = $3 OR colg_cd IS NULL)
             AND (course_cd = $4 OR course_cd IS NULL)
             AND (branch_cd = $5 OR branch_cd IS NULL)
             AND (batch_cd = $6 OR batch_cd IS NULL)
             AND (semester = $7 OR semester IS NULL)
             AND (section = $8 OR section IS NULL)
             AND effective_from = $9::date
           LIMIT 1`,
          [startMeta.dayOfWeek, startMeta.timeStr.slice(0, 5), colgcd, courseCd, branchCd, batchCd, semCd, txtSec, effFrom]
        ).catch(() => []);

        if (existingSlots && existingSlots.length > 0) {
          await queryDb(
            `UPDATE "${schema}".timetable_slots SET
              topic = COALESCE($1, topic),
              unit_id = COALESCE($2, unit_id),
              unit_name = COALESCE($3, unit_name),
              sub_topics = COALESCE($4, sub_topics),
              competency_codes = COALESCE($5, competency_codes),
              description = COALESCE($6, description),
              effective_from = $7::date,
              effective_until = $8::date
            WHERE id = $9`,
            [
              topic || title,
              unitId || null,
              unitName || null,
              subTopics || null,
              competencyCodes || null,
              description,
              effFrom,
              effUntil,
              existingSlots[0].id,
            ]
          );
        } else {
          await queryDb(
            `INSERT INTO "${schema}".timetable_slots (
              day_of_week, start_time, end_time, room, slot_type, topic,
              unit_id, unit_name, sub_topics, competency_codes,
              colg_cd, course_cd, branch_cd, batch_cd, semester, section, description,
              effective_from, effective_until
            ) VALUES (
              $1, $2, $3, $4, 'Lecture', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17::date, $18::date
            )`,
            [
              startMeta.dayOfWeek,
              startMeta.timeStr,
              endMeta.timeStr,
              cameraLink ? `Room (Cam #${cameraLink})` : 'Room 204',
              topic || title,
              unitId || null,
              unitName || null,
              subTopics || null,
              competencyCodes || null,
              colgcd,
              courseCd,
              branchCd,
              batchCd,
              semCd,
              txtSec,
              description,
              effFrom,
              effUntil,
            ]
          );
        }
      } catch (slotErr) {
        // Non-blocking slot sync
      }
    }

    return NextResponse.json({
      success: true,
      message: srmsMessage || 'Lecture added successfully.',
      id: srmsId || savedRow?.id,
      event: savedRow,
      srms_data: srmsResponse,
    });
  } catch (error: any) {
    console.error('[API /api/srms/add-event] Error:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed to save timetable event',
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const colgcd = searchParams.get('colgcd') || '1';

    if (!id) {
      return NextResponse.json({ success: false, message: 'Event ID required for rollback deletion' }, { status: 400 });
    }

    const tenantHeader = req.headers.get('x-tenant-id') || req.headers.get('x-tenant') || req.headers.get('x-tenant-slug') || '';
    let slug = tenantHeader.replace(/^tenant_/, '').replace(/^tenant-/, '') || (colgcd === '1' ? 'srms-cet-bareilly' : 'srms-cet-bareilly');
    if (!slug) slug = 'srms-cet-bareilly';
    const schema = `tenant_${slug}`;

    // Match by Postgres UUID (id) OR numeric SRMS id (srms_id) so rollback always finds the row
    await queryDb(`DELETE FROM "${schema}".srms_timetable_events WHERE id::text = $1 OR srms_id::text = $1`, [id]).catch(() => {});
    // Also insert into deleted blacklist so the schedule view doesn't re-fetch it from SRMS portal
    await queryDb(`
      CREATE TABLE IF NOT EXISTS "${schema}".deleted_timetable_events (event_id VARCHAR(100) PRIMARY KEY, colg_cd VARCHAR(50) DEFAULT '1', deleted_at TIMESTAMPTZ DEFAULT NOW());
      INSERT INTO "${schema}".deleted_timetable_events (event_id, colg_cd) VALUES ($1, $2) ON CONFLICT DO NOTHING;
    `, [id, colgcd]).catch(() => {});
    // Also try to call SRMS portal delete if id looks like a numeric SRMS id
    if (id && /^\d+$/.test(id)) {
      try {
        const { srmsPostDirect } = await import('@/lib/srms-client');
        await srmsPostDirect('https://myportal.srms.ac.in/srmserp/Timetbl/DeleteEvent', { id: Number(id), colgcd });
      } catch { /* non-blocking */ }
    }

    return NextResponse.json({ success: true, message: 'Rollback delete completed' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
