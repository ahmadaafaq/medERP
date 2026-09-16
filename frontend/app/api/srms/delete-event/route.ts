import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { isSrmsTenant } from '@/lib/srms-client';
import https from 'https';

const _srmsAgent = new https.Agent({ rejectUnauthorized: false });

function getSrmsCookies(): Promise<string> {
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'myportal.srms.ac.in',
        path: '/SRMSERP/Home/Index',
        method: 'GET',
        agent: _srmsAgent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 4000,
      },
      (res) => {
        const cookies = (res.headers['set-cookie'] || []).map((c) => c.split(';')[0]).join('; ');
        resolve(cookies);
      }
    );
    req.on('error', () => resolve(''));
    req.on('timeout', () => {
      req.destroy();
      resolve('');
    });
    req.end();
  });
}

function srmsPost(url: string, payload: any, cookieHeader?: string): Promise<any> {
  return new Promise((resolve) => {
    const postData = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const urlObj = new URL(url);
    const options: https.RequestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      agent: _srmsAgent,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(postData),
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Referer': 'https://myportal.srms.ac.in/timetable/master/designtimetable.aspx',
        'Origin': 'https://myportal.srms.ac.in',
        ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
      },
      timeout: 8000,
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch {
          resolve({ raw: body, status: res.statusCode });
        }
      });
    });

    req.on('error', (err) => {
      console.warn('[SRMS deleteEvent error]:', err.message);
      resolve({ error: err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'SRMS deleteEvent timed out' });
    });
    req.write(postData);
    req.end();
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const eventId = String(body.id || body.eventId || '');
    const postgresId = String(body.postgres_id || body.postgresId || '');
    const colgcd = String(body.colgcd || body.colg_cd || '1');
    const dayOfWeek = body.day_of_week !== undefined && body.day_of_week !== null ? Number(body.day_of_week) : null;
    const startTimeStr = body.start_time || body.startTime || null;

    if (!eventId && !postgresId) {
      return NextResponse.json({ success: false, message: 'Event ID is required for deletion' }, { status: 400 });
    }

    const tenantHeader = req.headers.get('x-tenant-id') || req.headers.get('x-tenant') || req.headers.get('x-tenant-slug') || '';
    let slug = tenantHeader.replace(/^tenant_/, '').replace(/^tenant-/, '') || (colgcd === '1' ? 'srms-cet-bareilly' : 'srms-cet-bareilly');
    if (!slug) slug = 'srms-cet-bareilly';
    const schema = `tenant_${slug}`;

    const numId = Number(eventId);
    let numericSrmsId: number | null = !isNaN(numId) && numId > 0 ? numId : null;

    const allMatchedIds = new Set<string>();
    if (eventId) allMatchedIds.add(eventId);
    if (postgresId) allMatchedIds.add(postgresId);

    let discoveredDay: number | null = dayOfWeek;
    let discoveredTime: string | null = startTimeStr ? String(startTimeStr).slice(0, 5) : null;
    let discoveredCourse: string | null = body.course || body.course_cd || null;
    let discoveredBatch: string | null = body.batch || body.batch_cd || null;

    // 1. Cross-lookup in srms_timetable_events
    try {
      const srmsRows = await queryDb(
        `SELECT * FROM "${schema}".srms_timetable_events 
         WHERE id::text = $1 
            OR id::text = $2 
            OR srms_id::text = $1 
            OR srms_id::text = $2 
            OR raw_payload->'srmsResponse'->>'id' = $1 
            OR raw_payload->'improperEvent'->>'id' = $1 
            OR raw_payload->>'id' = $1
         LIMIT 1`,
        [eventId, postgresId || eventId]
      );
      if (srmsRows && srmsRows.length > 0) {
        const r = srmsRows[0];
        allMatchedIds.add(String(r.id));
        const raw = typeof r.raw_payload === 'string' ? JSON.parse(r.raw_payload || '{}') : (r.raw_payload || {});
        const candidate = Number(r.srms_id || raw.srmsResponse?.id || raw.improperEvent?.id || raw.id);
        if (!isNaN(candidate) && candidate > 0) {
          numericSrmsId = candidate;
          allMatchedIds.add(String(candidate));
        }
        if (!discoveredDay && r.day_of_week) discoveredDay = Number(r.day_of_week);
        if (!discoveredTime) {
          const t = r.start_str?.split(' ')[1] || (typeof r.start_time === 'string' ? r.start_time.slice(11, 16) : null);
          if (t) discoveredTime = t.slice(0, 5);
        }
        if (!discoveredCourse && r.course_cd) discoveredCourse = String(r.course_cd);
        if (!discoveredBatch && r.batch_cd) discoveredBatch = String(r.batch_cd);
      }
    } catch (e: any) {
      console.warn('[delete-event srms lookup error]:', e.message);
    }

    // 2. Cross-lookup in timetable_slots
    try {
      const pgRows = await queryDb(
        `SELECT * FROM "${schema}".timetable_slots 
         WHERE id::text = $1 OR id::text = $2 LIMIT 1`,
        [eventId, postgresId || eventId]
      );
      if (pgRows && pgRows.length > 0) {
        const r = pgRows[0];
        allMatchedIds.add(String(r.id));
        if (!discoveredDay && r.day_of_week) discoveredDay = Number(r.day_of_week);
        if (!discoveredTime && r.start_time) discoveredTime = String(r.start_time).slice(0, 5);
        if (!discoveredCourse && r.course_cd) discoveredCourse = String(r.course_cd);
        if (!discoveredBatch && r.batch_cd) discoveredBatch = String(r.batch_cd);
      }
    } catch (e: any) {
      console.warn('[delete-event pg lookup error]:', e.message);
    }

    // 3. If time and day are known, find counterpart records by time slot in both tables
    if (discoveredDay && discoveredTime) {
      try {
        const matchingPg = await queryDb(
          `SELECT id FROM "${schema}".timetable_slots 
           WHERE day_of_week = $1 
             AND start_time::text LIKE $2 || '%' 
             AND (colg_cd = $3 OR colg_cd IS NULL)
             ${discoveredCourse ? `AND (course_cd = '${discoveredCourse}' OR course_cd IS NULL)` : ''}`,
          [discoveredDay, discoveredTime, colgcd]
        );
        for (const p of matchingPg || []) {
          allMatchedIds.add(String(p.id));
        }
      } catch {}

      try {
        const matchingSrms = await queryDb(
          `SELECT id, srms_id, raw_payload FROM "${schema}".srms_timetable_events 
           WHERE day_of_week = $1 
             AND (start_str LIKE '%' || $2 || '%' OR start_time::text LIKE '%' || $2 || '%')
             AND (colg_cd = $3 OR colg_cd IS NULL)
             ${discoveredCourse ? `AND (course_cd = '${discoveredCourse}' OR course_cd IS NULL)` : ''}`,
          [discoveredDay, discoveredTime, colgcd]
        );
        for (const sm of matchingSrms || []) {
          allMatchedIds.add(String(sm.id));
          const raw = typeof sm.raw_payload === 'string' ? JSON.parse(sm.raw_payload || '{}') : (sm.raw_payload || {});
          const candidate = Number(sm.srms_id || raw.srmsResponse?.id || raw.id);
          if (!isNaN(candidate) && candidate > 0) {
            numericSrmsId = candidate;
            allMatchedIds.add(String(candidate));
          }
        }
      } catch {}
    }

    let srmsResult: any = null;
    let srmsDeleteResult: any = null;
    let srmsUpdateResult: any = null;

    // Only call external SRMS ASP.NET WebMethods if this is an SRMS tenant and we have a valid numeric Int32 event id
    if (isSrmsTenant(slug) && numericSrmsId) {
      // Fetch SRMS session cookie to ensure authenticated web method execution
      const srmsCookie = await getSrmsCookies().catch(() => '');

      // 1. Attempt deleteEvent with numeric integer ID (standard ASP.NET WebMethod signature)
      srmsResult = await srmsPost(
        'https://myportal.srms.ac.in/timetable/master/designtimetable.aspx/deleteEvent',
        { id: numericSrmsId },
        srmsCookie
      );

      // If unable or failed, attempt with colgcd parameter
      if (!srmsResult?.d || srmsResult.d.toLowerCase().includes('unable')) {
        const altResult = await srmsPost(
          'https://myportal.srms.ac.in/timetable/master/designtimetable.aspx/deleteEvent',
          { id: numericSrmsId, colgcd: colgcd },
          srmsCookie
        );
        if (altResult?.d && !altResult.d.toLowerCase().includes('unable')) {
          srmsResult = altResult;
        }
      }

      // If still unable, try with improperEvent wrapper
      if (!srmsResult?.d || srmsResult.d.toLowerCase().includes('unable')) {
        const altResult2 = await srmsPost(
          'https://myportal.srms.ac.in/timetable/master/designtimetable.aspx/deleteEvent',
          { improperEvent: { id: numericSrmsId, colgcd: colgcd } },
          srmsCookie
        );
        if (altResult2?.d && !altResult2.d.toLowerCase().includes('unable')) {
          srmsResult = altResult2;
        }
      }

      // 2. Also execute MVC Timetbl/UpdateEvent to set LectFlg: 0 (cancels/suspends lecture in SRMS ERP)
      srmsUpdateResult = await srmsPost(
        'https://myportal.srms.ac.in/srmserp/Timetbl/UpdateEvent',
        {
          id: numericSrmsId,
          title: '0',
          description: '1',
          LectFlg: 0,
          suspendreason: 'Deleted from timetable designer',
        },
        srmsCookie
      ).catch(() => null);

      srmsDeleteResult = await srmsPost(
        'https://myportal.srms.ac.in/srmserp/Timetbl/DeleteEvent',
        { id: numericSrmsId },
        srmsCookie
      ).catch(() => null);
    }

    // 3. Persist deletion in PostgreSQL tenant tables and maintain deleted blacklist
    await queryDb(`
      CREATE TABLE IF NOT EXISTS "${schema}".deleted_timetable_events (
        event_id VARCHAR(100) PRIMARY KEY,
        colg_cd VARCHAR(50) DEFAULT '1',
        deleted_at TIMESTAMPTZ DEFAULT NOW()
      );
    `).catch(() => {});

    // Blacklist all discovered IDs
    const idArray = Array.from(allMatchedIds);
    for (const matchedId of idArray) {
      await queryDb(
        `INSERT INTO "${schema}".deleted_timetable_events (event_id, colg_cd)
         VALUES ($1, $2)
         ON CONFLICT (event_id) DO UPDATE SET deleted_at = NOW()`,
        [matchedId, colgcd]
      ).catch(() => {});
    }

    // Delete from srms_timetable_events by all matching IDs and time slot
    await queryDb(
      `DELETE FROM "${schema}".srms_timetable_events 
       WHERE id::text = ANY($1::text[]) 
          OR srms_id::text = ANY($1::text[])
          OR raw_payload->'srmsResponse'->>'id' = ANY($1::text[])
          OR raw_payload->'improperEvent'->>'id' = ANY($1::text[])
          OR raw_payload->>'id' = ANY($1::text[])
          OR raw_payload->>'eventId' = ANY($1::text[])
          ${discoveredDay && discoveredTime ? `OR (day_of_week = ${discoveredDay} AND (start_str LIKE '%${discoveredTime}%' OR start_time::text LIKE '%${discoveredTime}%') AND colg_cd = '${colgcd}')` : ''}`,
      [idArray]
    ).catch(() => {});

    // Delete from timetable_slots by all matching IDs and time slot
    await queryDb(
      `DELETE FROM "${schema}".timetable_slots 
       WHERE id::text = ANY($1::text[])
          ${discoveredDay && discoveredTime ? `OR (day_of_week = ${discoveredDay} AND start_time::text LIKE '${discoveredTime}%' AND colg_cd = '${colgcd}')` : ''}`,
      [idArray]
    ).catch(() => {});

    const isExplicitlyDeleted = !!(srmsResult?.d && !srmsResult.d.toLowerCase().includes('unable'));
    const isUpdateSuccess = srmsUpdateResult?.success === true || srmsDeleteResult?.success === true;
    const isDeleted = isExplicitlyDeleted || isUpdateSuccess || !numericSrmsId;

    let responseMessage = `Deleted event with id:${eventId}`;
    let displayD = 'Lecture deleted successfully';
    if (isExplicitlyDeleted) {
      displayD = srmsResult.d;
      responseMessage = 'Timetable slot deleted from SRMS portal and database.';
    } else if (isUpdateSuccess) {
      displayD = 'Lecture cancelled and removed from SRMS portal.';
      responseMessage = 'Timetable slot cancelled on SRMS portal and removed from database.';
    } else {
      displayD = `Deleted event from database.`;
      responseMessage = 'Timetable slot removed from database.';
    }

    return NextResponse.json({
      success: true,
      message: responseMessage,
      d: displayD,
      srms_response: srmsResult,
      srms_update_response: srmsUpdateResult || srmsDeleteResult,
      srms_deleted: isDeleted,
      deleted_ids: idArray,
    });
  } catch (err: any) {
    console.error('[API /api/srms/delete-event Error]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  return POST(req);
}


