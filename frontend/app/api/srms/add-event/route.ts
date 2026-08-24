import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';
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

    // 1. New SRMS AddEvent API Payload (https://myportal.srms.ac.in/srmserp/Timetbl/AddEvent)
    const srmsPayload = {
      title,
      description,
      start: startMeta.formatted,
      end: endMeta.formatted,
      linkcd,
      electiveflg,
      txtG,
      txtSec,
      empid,
      colgcd,
      CameraLink: cameraLink,
    };

    let srmsResponse: any = null;
    let srmsSuccess = false;
    let srmsId: number | string | null = null;
    let srmsMessage = '';

    try {
      const srmsApiUrl = 'https://myportal.srms.ac.in/srmserp/Timetbl/AddEvent';
      const srmsRes = await fetch(srmsApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(srmsPayload),
      });

      if (srmsRes.ok) {
        srmsResponse = await srmsRes.json().catch(() => null);
        if (srmsResponse) {
          srmsSuccess = srmsResponse.success === true || (srmsResponse.id && srmsResponse.id > 0);
          srmsId = srmsResponse.id ?? null;
          srmsMessage = srmsResponse.message || '';
        }
      }
    } catch (srmsErr: any) {
      console.warn('[SRMS AddEvent remote error]:', srmsErr.message);
      srmsMessage = srmsErr.message;
    }

    // 2. Resolve target PostgreSQL schema
    const tenantHeader = req.headers.get('x-tenant-id') || req.headers.get('x-tenant') || req.headers.get('x-tenant-slug') || '';
    let slug = tenantHeader.replace(/^tenant_/, '').replace(/^tenant-/, '') || (colgcd === '1' ? 'srms-cet-bareilly' : 'srms-cet-bareilly');
    if (!slug) slug = 'srms-cet-bareilly';
    const schema = `tenant_${slug}`;

    // 3. Faculty Overlap Validation across All Departments for the SAME DATE & SAME TIME SLOT
    if (empid) {
      const clashRows = await queryDb(
        `SELECT ts.id, ts.start_time, ts.end_time, ts.day_of_week, ts.title, ts.description,
                f.name AS faculty_name, f.emp_id,
                sub.name AS subject_name,
                d.name AS department_name
         FROM "${schema}".srms_timetable_events ts
         LEFT JOIN "${schema}".faculty f ON (f.emp_id = ts.empid OR f.id::text = ts.empid)
         LEFT JOIN "${schema}".subjects sub ON (sub.code = ts.linkcd OR sub.id::text = ts.linkcd)
         LEFT JOIN "${schema}".departments d ON (d.code = ts.branch_cd OR d.id::text = ts.branch_cd)
         WHERE (ts.empid = $1 OR f.id::text = $1)
           AND ts.start_time::date = $2::date
           AND (ts.start_time::time, ts.end_time::time) OVERLAPS ($3::TIME, $4::TIME)
         LIMIT 1`,
        [empid, startMeta.iso, startMeta.timeStr, endMeta.timeStr]
      ).catch(() => []);

      if (clashRows && clashRows.length > 0) {
        const clash = clashRows[0];
        const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const dayName = days[clash.day_of_week] || `Day ${clash.day_of_week}`;
        const startTimeStr = clash.start_str && clash.start_str.includes(':') 
          ? clash.start_str.split(' ')[1]?.slice(0, 5) 
          : new Date(clash.start_time).toTimeString().slice(0, 5);
        const endTimeStr = clash.end_str && clash.end_str.includes(':') 
          ? clash.end_str.split(' ')[1]?.slice(0, 5) 
          : new Date(clash.end_time).toTimeString().slice(0, 5);
        const timeRange = `${startTimeStr || '08:30'} - ${endTimeStr || '09:40'}`;
        const facName = clash.faculty_name || (clash.description?.match(/\(([^)]+)\)/)?.[1] || empid);
        const deptName = clash.department_name || 'Academic Department';
        const rawTitle = clash.title || clash.description || '';
        const subName = clash.subject_name || rawTitle.split(' - ')[0].replace(/\([^)]*\)/g, '').trim() || 'Subject';
        const dateFormatted = new Date(clash.start_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        const conflictMsg = `This faculty (${facName}) is already scheduled on ${dateFormatted} (${dayName}) during ${timeRange} in Department (${deptName}), Subject (${subName}).`;

        return NextResponse.json({
          success: false,
          error: conflictMsg,
          message: conflictMsg,
          conflict: {
            faculty_name: facName,
            department_name: deptName,
            subject_name: subName,
            date: dateFormatted,
            time: timeRange,
            day: dayName,
          }
        }, { status: 409 });
      }
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
        linkcd,
        electiveflg,
        txtG,
        txtSec,
        empid,
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

    // 6. Also sync to timetable_slots
    try {
      await queryDb(`
        ALTER TABLE "${schema}".timetable_slots ADD COLUMN IF NOT EXISTS unit_id VARCHAR(100);
        ALTER TABLE "${schema}".timetable_slots ADD COLUMN IF NOT EXISTS unit_name VARCHAR(255);
        ALTER TABLE "${schema}".timetable_slots ADD COLUMN IF NOT EXISTS topic VARCHAR(255);
        ALTER TABLE "${schema}".timetable_slots ADD COLUMN IF NOT EXISTS sub_topics VARCHAR(500);
        ALTER TABLE "${schema}".timetable_slots ADD COLUMN IF NOT EXISTS competency_codes VARCHAR(255);
      `).catch(() => {});

      await queryDb(
        `INSERT INTO "${schema}".timetable_slots (
          day_of_week, start_time, end_time, room, slot_type, topic,
          unit_id, unit_name, sub_topics, competency_codes,
          colg_cd, course_cd, branch_cd, batch_cd, semester, section, description
        ) VALUES (
          $1, $2, $3, $4, 'Lecture', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
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
        ]
      );
    } catch (slotErr) {
      // Non-blocking slot insert
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

    await queryDb(`DELETE FROM "${schema}".srms_timetable_events WHERE id::text = $1`, [id]).catch(() => {});

    return NextResponse.json({ success: true, message: 'Rollback delete completed' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
