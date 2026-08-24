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

    // 1. Fetch remote SRMS JsonResponse.ashx (strictly by requested date range)
    const targetUrl = `https://myportal.srms.ac.in/timetable/master/JsonResponse.ashx?course=${course}&batch=${batch}&branch=${branch}&sem=${sem}&sec=${sec}&colgcd=${colgcd}&_=${ts}&start=${start}&end=${end}`;

    let remoteData = await fetchSrmsJson(targetUrl);

    if (!Array.isArray(remoteData)) remoteData = [];

    // 2. Fetch PostgreSQL timetable events from srms_timetable_events (strictly within requested date range)
    const tenantHeader = request.headers.get('x-tenant-id') || request.headers.get('x-tenant') || request.headers.get('x-tenant-slug') || '';
    let slug = tenantHeader.replace(/^tenant_/, '').replace(/^tenant-/, '') || (colgcd === '1' ? 'srms-cet-bareilly' : 'srms-cet-bareilly');
    if (!slug) slug = 'srms-cet-bareilly';
    const schema = `tenant_${slug}`;

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

      let dateFilterSql = '';
      const queryParams: any[] = [colgcd];

      if (!isNaN(startTimestamp) && !isNaN(endTimestamp) && startTimestamp > 0 && endTimestamp > 0) {
        queryParams.push(new Date(startTimestamp * 1000).toISOString());
        queryParams.push(new Date(endTimestamp * 1000).toISOString());
        dateFilterSql = `AND (start_time >= $2 AND start_time <= $3)`;
      } else if (targetDateParam) {
        const targetBase = new Date(targetDateParam);
        const day = targetBase.getDay();
        const startOfWeek = new Date(targetBase.getFullYear(), targetBase.getMonth(), targetBase.getDate() - day, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        queryParams.push(startOfWeek.toISOString());
        queryParams.push(endOfWeek.toISOString());
        dateFilterSql = `AND (start_time >= $2 AND start_time <= $3)`;
      }

      const rows = await queryDb(
        `SELECT * FROM "${schema}".srms_timetable_events
         WHERE (colg_cd = $1 OR colg_cd IS NULL)
         ${dateFilterSql}
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
    } catch (dbErr: any) {
      console.warn('[PostgreSQL timetable fetch warning]:', dbErr.message);
    }

    // 3. Merge both datasets and enrich SRMS items with PostgreSQL unit, topic, subtopic
    const enrichedRemote = remoteData.map((item: any) => {
      const startUnix = parseDateToUnix(item.start);
      // Find matching PostgreSQL record
      const match = dbEvents.find(
        (db) =>
          (item.id && (String(db.srms_id) === String(item.id) || String(db.id) === String(item.id))) ||
          (String(db.linkcd) === String(item.linkcd) && Math.abs(db.start - startUnix) < 300) ||
          (String(db.title).toLowerCase() === String(item.title).toLowerCase() && Math.abs(db.start - startUnix) < 300)
      );

      if (match) {
        return {
          ...item,
          unit_id: match.unit_id || item.unit_id || null,
          unit_name: match.unit_name || item.unit_name || null,
          topic: match.topic || item.topic || null,
          sub_topics: match.sub_topics || item.sub_topics || null,
          competency_codes: match.competency_codes || item.competency_codes || null,
          postgres_id: match.id,
        };
      }
      return item;
    });

    const combined: any[] = [...enrichedRemote];
    const seenKeys = new Set<string>();

    // Index remote items
    for (const item of enrichedRemote) {
      const key = `${item.title || ''}_${item.start || ''}_${item.linkcd || ''}`.toLowerCase();
      if (key) seenKeys.add(key);
    }

    // Add local PostgreSQL events if not duplicate
    for (const dbItem of dbEvents) {
      const key = `${dbItem.title || ''}_${dbItem.start || ''}_${dbItem.linkcd || ''}`.toLowerCase();
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
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
