import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import https from 'https';

function fetchSrmsJson(urlStr: string): Promise<any[]> {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(urlStr);
      const options: https.RequestOptions = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        },
        rejectUnauthorized: false,
        timeout: 8000,
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (data && data.trim().startsWith('[')) {
            try {
              const parsed = Function(`"use strict"; return (${data});`)();
              return resolve(Array.isArray(parsed) ? parsed : []);
            } catch {
              try {
                const parsed = JSON.parse(data);
                return resolve(Array.isArray(parsed) ? parsed : []);
              } catch {
                return resolve([]);
              }
            }
          }
          resolve([]);
        });
      });

      req.on('error', (err) => {
        console.warn('[SRMS Remote fetch warning]:', err.message);
        resolve([]);
      });
      req.on('timeout', () => {
        req.destroy();
        resolve([]);
      });
      req.end();
    } catch {
      resolve([]);
    }
  });
}

function parseDateToUnix(val: any): number {
  if (!val) return Math.floor(Date.now() / 1000);
  if (typeof val === 'number') {
    return val > 10000000000 ? Math.floor(val / 1000) : val;
  }
  if (typeof val === 'string') {
    const num = Number(val);
    if (!isNaN(num)) {
      return num > 10000000000 ? Math.floor(num / 1000) : num;
    }
    // Handle "10-08-2026 09:30:00 AM" or "DD-MM-YYYY hh:mm:ss A"
    if (val.includes('-') && val.includes(':')) {
      const parts = val.trim().split(/[\sT]+/);
      const datePart = parts[0];
      const timePart = parts[1] || '09:00:00';
      const ampm = (parts[2] || '').toUpperCase();
      let [d, m, y] = datePart.split('-').map(Number);
      if (d > 1000) { const temp = d; d = y; y = temp; }
      let [hh, mm, ss] = timePart.split(':').map(Number);
      if (ampm === 'PM' && hh < 12) hh += 12;
      if (ampm === 'AM' && hh === 12) hh = 0;
      const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0);
      return Math.floor(dt.getTime() / 1000);
    }
    const dt = new Date(val);
    if (!isNaN(dt.getTime())) return Math.floor(dt.getTime() / 1000);
  }
  if (val instanceof Date && !isNaN(val.getTime())) {
    return Math.floor(val.getTime() / 1000);
  }
  return Math.floor(Date.now() / 1000);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const course = searchParams.get('course') || '13';
    const batch = searchParams.get('batch') || '2';
    const branch = searchParams.get('branch') || '1';
    const sem = searchParams.get('sem') || searchParams.get('semester') || '3';
    const sec = searchParams.get('sec') || searchParams.get('section') || '1';
    const colgcd = searchParams.get('colgcd') || '1';
    let start = searchParams.get('start') || '';
    let end = searchParams.get('end') || '';
    const targetDateParam = searchParams.get('target_date');

    if ((!start || !end) && targetDateParam) {
      const targetBase = new Date(targetDateParam);
      const day = targetBase.getDay();
      const sundayStart = new Date(targetBase.getFullYear(), targetBase.getMonth(), targetBase.getDate() - day, 0, 0, 0);
      const sundayEnd = new Date(sundayStart);
      sundayEnd.setDate(sundayStart.getDate() + 7);
      start = String(Math.floor(sundayStart.getTime() / 1000));
      end = String(Math.floor(sundayEnd.getTime() / 1000));
    }

    const ts = Date.now();
    // 1. Always fetch live timetable from remote SRMS JsonResponse.ashx by default (unless explicitly fetch_remote=false)
    let remoteData: any[] = [];
    if (searchParams.get('fetch_remote') !== 'false') {
      const targetUrl = `https://myportal.srms.ac.in/timetable/master/JsonResponse.ashx?course=${course}&batch=${batch}&branch=${branch}&sem=${sem}&sec=${sec}&colgcd=${colgcd}&_=${ts}&start=${start}&end=${end}`;
      remoteData = await fetchSrmsJson(targetUrl);
      if (!Array.isArray(remoteData)) remoteData = [];
    }

    // 2. Fetch PostgreSQL timetable events from srms_timetable_events (strictly within requested date range)
    const tenantHeader = request.headers.get('x-tenant-id') || request.headers.get('x-tenant') || request.headers.get('x-tenant-slug') || '';
    let slug = tenantHeader.replace(/^tenant_/, '').replace(/^tenant-/, '') || (colgcd === '1' ? 'srms-cet-bareilly' : 'srms-cet-bareilly');
    if (!slug) slug = 'srms-cet-bareilly';
    const schema = `tenant_${slug}`;

    // Query deleted events blacklist
    let deletedEventIds = new Set<string>();
    try {
      await queryDb(`
        CREATE TABLE IF NOT EXISTS "${schema}".deleted_timetable_events (
          event_id VARCHAR(100) PRIMARY KEY,
          colg_cd VARCHAR(50) DEFAULT '1',
          deleted_at TIMESTAMPTZ DEFAULT NOW()
        );
      `).catch(() => {});

      const deletedRows = await queryDb(
        `SELECT event_id FROM "${schema}".deleted_timetable_events`
      ).catch(() => []);
      deletedEventIds = new Set<string>((deletedRows || []).map((r: any) => String(r.event_id)));
    } catch { }

    let dbEvents: any[] = [];
    try {
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
          raw_payload JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `).catch(() => {});

      const startTimestamp = Number(start);
      const endTimestamp = Number(end);
      const targetDateParam = searchParams.get('target_date');

      const whereClauses: string[] = [`(colg_cd = $1 OR colg_cd IS NULL)`];
      const queryParams: any[] = [colgcd];

      if (!isNaN(startTimestamp) && !isNaN(endTimestamp) && startTimestamp > 0 && endTimestamp > 0) {
        queryParams.push(new Date(startTimestamp * 1000).toISOString());
        queryParams.push(new Date(endTimestamp * 1000).toISOString());
        whereClauses.push(`(start_time >= $${queryParams.length - 1} AND start_time <= $${queryParams.length})`);
      } else if (targetDateParam) {
        const targetBase = new Date(targetDateParam);
        const day = targetBase.getDay();
        const startOfWeek = new Date(targetBase.getFullYear(), targetBase.getMonth(), targetBase.getDate() - day, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        queryParams.push(startOfWeek.toISOString());
        queryParams.push(endOfWeek.toISOString());
        whereClauses.push(`(start_time >= $${queryParams.length - 1} AND start_time <= $${queryParams.length})`);
      }

      if (course && course !== 'all') {
        queryParams.push(String(course));
        whereClauses.push(`(course_cd = $${queryParams.length} OR course_cd IS NULL)`);
      }
      if (branch && branch !== 'all') {
        queryParams.push(String(branch));
        whereClauses.push(`(branch_cd = $${queryParams.length} OR branch_cd IS NULL)`);
      }
      if (batch && batch !== 'all') {
        queryParams.push(String(batch));
        whereClauses.push(`(batch_cd = $${queryParams.length} OR batch_cd IS NULL)`);
      }
      if (sem && sem !== 'all') {
        queryParams.push(String(sem));
        whereClauses.push(`(sem_cd = $${queryParams.length} OR sem_cd IS NULL)`);
      }
      if (sec && sec !== 'all') {
        queryParams.push(String(sec));
        whereClauses.push(`(txt_sec = $${queryParams.length} OR txt_sec IS NULL)`);
      }

      const rows = await queryDb(
        `SELECT * FROM "${schema}".srms_timetable_events
         WHERE ${whereClauses.join(' AND ')}
         ORDER BY start_time ASC, created_at DESC`,
        queryParams
      );

      dbEvents = rows.map((r: any) => {
        const startSec = parseDateToUnix(r.start_str || r.start_time);
        const endSec = parseDateToUnix(r.end_str || r.end_time);

        const rawPayload = r.raw_payload || {};
        return {
          id: String(r.id),
          srms_id: r.srms_id ? Number(r.srms_id) : (rawPayload.srmsResponse?.id || null),
          title: r.title,
          description: r.description || r.title,
          start: startSec,
          end: endSec,
          start_str: r.start_str,
          end_str: r.end_str,
          start_time: r.start_str?.split(' ')[1] || String(r.start_time).slice(11, 19),
          end_time: r.end_str?.split(' ')[1] || String(r.end_time).slice(11, 19),
          day_of_week: r.day_of_week,
          linkcd: r.linkcd || '',
          electiveflg: r.electiveflg || 'N',
          txtG: r.txt_g || '0',
          txtSec: r.txt_sec || '1',
          empid: r.empid || '',
          colgcd: r.colg_cd || colgcd,
          camera_link: r.camera_link || '0',
          unit_id: r.unit_id || rawPayload.unitId || null,
          unit_name: r.unit_name || rawPayload.unitName || rawPayload.unit_name || null,
          topic: r.topic || rawPayload.topic || (r.title?.includes(' - ') ? r.title.split(' - ').slice(1).join(' - ') : r.title),
          sub_topics: r.sub_topics || rawPayload.subTopics || rawPayload.sub_topics || rawPayload.subtopic || null,
          competency_codes: r.competency_codes || rawPayload.competencyCodes || null,
          allDay: false,
          source: 'POSTGRESQL',
        };
      });

      // Also query timetable_slots to include medERP scheduled slots
      const slotWhereClauses: string[] = [`(ts.colg_cd = $1 OR ts.colg_cd IS NULL)`];
      const slotQueryParams: any[] = [colgcd];
      if (course && course !== 'all') {
        slotQueryParams.push(String(course));
        slotWhereClauses.push(`(ts.course_cd = $${slotQueryParams.length} OR ts.course_cd IS NULL)`);
      }
      if (branch && branch !== 'all') {
        slotQueryParams.push(String(branch));
        slotWhereClauses.push(`(ts.branch_cd = $${slotQueryParams.length} OR ts.branch_cd IS NULL)`);
      }
      if (batch && batch !== 'all') {
        slotQueryParams.push(String(batch));
        slotWhereClauses.push(`(ts.batch_cd = $${slotQueryParams.length} OR b.batch_cd::text = $${slotQueryParams.length} OR b.year::text = $${slotQueryParams.length} OR b.code = $${slotQueryParams.length} OR ts.batch_cd IS NULL)`);
      }
      if (sem && sem !== 'all') {
        slotQueryParams.push(String(sem));
        slotWhereClauses.push(`(ts.semester = $${slotQueryParams.length} OR ts.semester IS NULL)`);
      }
      if (sec && sec !== 'all') {
        slotQueryParams.push(String(sec));
        slotWhereClauses.push(`(ts.section = $${slotQueryParams.length} OR ts.section IS NULL OR ts.section = '1' OR ts.section = 'A')`);
      }

      const pgSlots = await queryDb(
        `SELECT ts.id, ts.day_of_week, ts.start_time, ts.end_time, ts.room, ts.slot_type,
                ts.topic, ts.unit_id, ts.unit_name, ts.sub_topics, ts.competency_codes,
                ts.colg_cd, ts.course_cd, ts.branch_cd, ts.batch_cd, ts.semester, ts.section, ts.description,
                f.name AS faculty_name, f.emp_id AS faculty_code,
                sub.name AS subject_name, sub.code AS subject_code
         FROM "${schema}".timetable_slots ts
         LEFT JOIN "${schema}".faculty f ON f.id::text = ts.faculty_id::text
         LEFT JOIN "${schema}".subjects sub ON sub.id::text = ts.subject_id::text
         LEFT JOIN "${schema}".batches b ON b.id::text = ts.batch_id::text
         WHERE ${slotWhereClauses.join(' AND ')}
         ORDER BY ts.day_of_week ASC, ts.start_time ASC`,
        slotQueryParams
      ).catch(() => []);

      for (const s of pgSlots) {
        const sTime = String(s.start_time || '08:30:00').slice(0, 8);
        const eTime = String(s.end_time || '09:30:00').slice(0, 8);
        const dayVal = Number(s.day_of_week) || 1;

        let startUnix = 0;
        let endUnix = 0;
        if (startTimestamp > 0) {
          const slotWeekDate = new Date(startTimestamp * 1000);
          slotWeekDate.setDate(slotWeekDate.getDate() + (dayVal === 7 ? 0 : dayVal));
          const [sh, sm] = sTime.split(':').map(Number);
          const [eh, em] = eTime.split(':').map(Number);
          slotWeekDate.setHours(sh || 8, sm || 30, 0, 0);
          startUnix = Math.floor(slotWeekDate.getTime() / 1000);
          const endSlotDate = new Date(slotWeekDate);
          endSlotDate.setHours(eh || 9, em || 30, 0, 0);
          endUnix = Math.floor(endSlotDate.getTime() / 1000);
        }

        dbEvents.push({
          id: String(s.id),
          srms_id: null,
          title: s.description || s.topic || s.subject_name || 'Subject Session',
          description: s.description || s.topic || s.subject_name || 'Subject Session',
          start: startUnix,
          end: endUnix,
          start_str: sTime,
          end_str: eTime,
          start_time: sTime,
          end_time: eTime,
          day_of_week: dayVal,
          linkcd: s.subject_code || '',
          electiveflg: 'N',
          txtG: '0',
          txtSec: s.section || sec,
          empid: s.faculty_code || '',
          colgcd: s.colg_cd || colgcd,
          camera_link: '0',
          room: s.room || 'Room 204',
          unit_id: s.unit_id || null,
          unit_name: s.unit_name || null,
          topic: s.topic || s.subject_name || 'Subject Session',
          sub_topics: s.sub_topics || null,
          competency_codes: s.competency_codes || null,
          subject_name: s.subject_name || s.topic || 'Subject Session',
          faculty_name: s.faculty_name || '',
          slot_type: s.slot_type || 'Lecture',
          slotType: s.slot_type || 'Lecture',
          allDay: false,
          source: 'POSTGRESQL_SLOT',
        });
      }
    } catch (dbErr: any) {
      console.warn('[PostgreSQL timetable fetch warning]:', dbErr.message);
    }

    // 3. Merge both datasets and enrich SRMS items with PostgreSQL unit, topic, subtopic
    const normalizeTitle = (t: string) => String(t || '').replace(/\([^)]*\)/g, '').trim().toLowerCase();

    // Filter out canceled or blacklisted remote items
    const activeRemoteData = remoteData.filter((item: any) => {
      if (item.Cancel_flg === '1') return false;
      const sid = String(item.id || '');
      if (sid && deletedEventIds.has(sid)) return false;
      return true;
    });

    const enrichedRemote = activeRemoteData.map((item: any) => {
      const startUnix = parseDateToUnix(item.start);
      const endUnix = parseDateToUnix(item.end);

      // Convert Unix timestamp to IST date for day_of_week and standard time string (UTC + 5:30)
      const istStartDate = new Date((startUnix + 19800) * 1000);
      const istEndDate = new Date((endUnix + 19800) * 1000);

      const dayVal = item.day_of_week !== undefined && item.day_of_week !== null
        ? Number(item.day_of_week)
        : (istStartDate.getUTCDay() === 0 ? 7 : istStartDate.getUTCDay());

      const pad = (n: number) => String(n).padStart(2, '0');
      const startTimeStr = item.start_time || `${pad(istStartDate.getUTCHours())}:${pad(istStartDate.getUTCMinutes())}:${pad(istStartDate.getUTCSeconds())}`;
      const endTimeStr = item.end_time || `${pad(istEndDate.getUTCHours())}:${pad(istEndDate.getUTCMinutes())}:${pad(istEndDate.getUTCSeconds())}`;

      const rawTitle = String(item.title || item.description || item.topic || '');
      const facultyMatch = rawTitle.match(/\(([^)]+)\)/);
      const teacher = (item.faculty_name || item.EmpName || item.emp_name || (facultyMatch ? facultyMatch[1] : '') || 'Faculty Member').trim();
      const cleanName = rawTitle.replace(/\([^)]*\)/g, '').trim();
      const isLab = rawTitle.toLowerCase().includes('lab') || rawTitle.toLowerCase().includes('practical');

      const itemTitleNorm = normalizeTitle(rawTitle);

      // Find matching PostgreSQL record for extra metadata (unit, topic, camera, etc.)
      const match = dbEvents.find((db) => {
        if (item.id && (String(db.srms_id) === String(item.id) || String(db.id) === String(item.id))) return true;
        const dbTitleNorm = normalizeTitle(db.title);
        const timeDiff = Math.abs((db.start || 0) - startUnix);
        if (timeDiff < 1800) {
          if (itemTitleNorm && dbTitleNorm && (itemTitleNorm.includes(dbTitleNorm) || dbTitleNorm.includes(itemTitleNorm))) return true;
          if (String(db.linkcd) === String(item.linkcd)) return true;
        }
        return false;
      });

      return {
        id: String(item.id),
        srms_id: Number(item.id) || null,
        title: rawTitle,
        description: item.description || rawTitle,
        start: startUnix,
        end: endUnix,
        start_time: startTimeStr,
        end_time: endTimeStr,
        day_of_week: dayVal,
        subject_name: match?.subject_name || cleanName || rawTitle,
        faculty_name: match?.faculty_name || teacher,
        faculty_id: String(item.empid || match?.faculty_id || match?.empid || ''),
        room: match?.room || item.room || (item.camera_link ? `Room 204 (Cam #${item.camera_link})` : (isLab ? 'Comp Lab 2' : 'Room 204')),
        slot_type: isLab ? 'Practical' : 'Lecture',
        slotType: isLab ? 'Practical' : 'Lecture',
        camera_link: match?.camera_link || item.camera_link || '0',
        unit_id: match?.unit_id || item.unit_id || null,
        unit_name: match?.unit_name || item.unit_name || null,
        topic: match?.topic || item.topic || cleanName || rawTitle,
        sub_topics: match?.sub_topics || item.sub_topics || null,
        competency_codes: match?.competency_codes || item.competency_codes || null,
        postgres_id: match?.id,
        Cancel_flg: item.Cancel_flg || '0',
        sec: item.sec || sec,
        grp: item.grp || '0',
        allDay: false,
        source: 'SRMS_PORTAL',
      };
    });

    // Filter active DB events
    const activeDbEvents = dbEvents.filter((db: any) => {
      const dbId = String(db.id || '');
      const srmsId = String(db.srms_id || '');
      if (dbId && deletedEventIds.has(dbId)) return false;
      if (srmsId && deletedEventIds.has(srmsId)) return false;
      return true;
    });

    const combined: any[] = [];
    const seenSlots = new Set<string>();

    // Helper key generator: day + start time + subject title
    const getSlotKey = (item: any): string => {
      const startSec = parseDateToUnix(item.start);
      const istStartDate = new Date((startSec + 19800) * 1000);
      const dayVal = item.day_of_week ?? (istStartDate.getUTCDay() === 0 ? 7 : istStartDate.getUTCDay());
      const timeStr = String(item.start_time || item.start_str || `${istStartDate.getUTCHours()}:${istStartDate.getUTCMinutes()}`).slice(0, 5);
      const subKey = normalizeTitle(item.title || item.subject_name || item.topic);
      return `${dayVal}_${timeStr}_${subKey}`;
    };

    // Index and add remote items first
    for (const item of enrichedRemote) {
      const key = getSlotKey(item);
      if (!seenSlots.has(key)) {
        seenSlots.add(key);
        combined.push(item);
      }
    }

    // Add local PostgreSQL events only if slot does not already exist
    for (const dbItem of activeDbEvents) {
      const key = getSlotKey(dbItem);
      if (!seenSlots.has(key)) {
        seenSlots.add(key);
        combined.push(dbItem);
      }
    }

    return NextResponse.json({
      success: true,
      data: combined,
      count: combined.length,
      remoteCount: remoteData.length,
      dbCount: dbEvents.length,
    });
  } catch (error: any) {
    console.error('[SRMS Timetable Schedule API Error]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch timetable schedule', data: [] },
      { status: 500 }
    );
  }
}
