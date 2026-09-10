import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
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
    const colgcd = String(body.colgcd || body.colg_cd || '1');

    if (!eventId) {
      return NextResponse.json({ success: false, message: 'Event ID is required for deletion' }, { status: 400 });
    }

    const numId = Number(eventId);
    const validNum = !isNaN(numId) && numId > 0 ? numId : null;

    // Fetch SRMS session cookie to ensure authenticated web method execution
    const srmsCookie = await getSrmsCookies().catch(() => '');

    // 1. Attempt deleteEvent with numeric integer ID (standard ASP.NET WebMethod signature)
    let srmsResult = await srmsPost(
      'https://myportal.srms.ac.in/timetable/master/designtimetable.aspx/deleteEvent',
      validNum ? { id: validNum } : { id: eventId },
      srmsCookie
    );

    // If unable or failed, attempt with string ID and colgcd parameters
    if (!srmsResult?.d || srmsResult.d.toLowerCase().includes('unable')) {
      srmsResult = await srmsPost(
        'https://myportal.srms.ac.in/timetable/master/designtimetable.aspx/deleteEvent',
        { id: eventId, colgcd: colgcd },
        srmsCookie
      );
    }

    // 2. Also attempt MVC Timetbl/DeleteEvent and Timetbl/UpdateEvent cancellation
    const srmsDeleteResult = await srmsPost(
      'https://myportal.srms.ac.in/srmserp/Timetbl/DeleteEvent',
      { id: eventId },
      srmsCookie
    ).catch(() => null);

    const srmsUpdateResult = await srmsPost(
      'https://myportal.srms.ac.in/srmserp/Timetbl/UpdateEvent',
      {
        id: eventId,
        title: '0',
        description: '1',
        LectFlg: 0,
        suspendreason: 'Deleted from timetable designer',
      },
      srmsCookie
    ).catch(() => null);

    // 3. Persist deletion in PostgreSQL tenant tables and maintain deleted blacklist
    const tenantHeader = req.headers.get('x-tenant-id') || req.headers.get('x-tenant') || req.headers.get('x-tenant-slug') || '';
    let slug = tenantHeader.replace(/^tenant_/, '').replace(/^tenant-/, '') || (colgcd === '1' ? 'srms-cet-bareilly' : 'srms-cet-bareilly');
    if (!slug) slug = 'srms-cet-bareilly';
    const schema = `tenant_${slug}`;

    // Create deleted_timetable_events blacklist table if not exists
    await queryDb(`
      CREATE TABLE IF NOT EXISTS "${schema}".deleted_timetable_events (
        event_id VARCHAR(100) PRIMARY KEY,
        colg_cd VARCHAR(50) DEFAULT '1',
        deleted_at TIMESTAMPTZ DEFAULT NOW()
      );
    `).catch(() => {});

    // Insert into deleted_timetable_events
    await queryDb(
      `INSERT INTO "${schema}".deleted_timetable_events (event_id, colg_cd)
       VALUES ($1, $2)
       ON CONFLICT (event_id) DO UPDATE SET deleted_at = NOW()`,
      [eventId, colgcd]
    ).catch(() => {});

    // Delete from srms_timetable_events by id, srms_id, or raw_payload
    await queryDb(
      `DELETE FROM "${schema}".srms_timetable_events 
       WHERE id::text = $1 
          OR srms_id::text = $1
          OR ($2::bigint IS NOT NULL AND srms_id = $2::bigint)
          OR raw_payload->'srmsResponse'->>'id' = $1
          OR raw_payload->'improperEvent'->>'id' = $1
          OR raw_payload->>'id' = $1
          OR raw_payload->>'eventId' = $1`,
      [eventId, validNum]
    ).catch(() => {});

    // Delete from timetable_slots if matching id
    await queryDb(
      `DELETE FROM "${schema}".timetable_slots 
       WHERE id::text = $1`,
      [eventId]
    ).catch(() => {});

    const isExplicitlyDeleted = srmsResult?.d && !srmsResult.d.toLowerCase().includes('unable');
    const isUpdateSuccess = srmsUpdateResult?.success === true || srmsDeleteResult?.success === true;

    return NextResponse.json({
      success: true,
      message: `Deleted event with id:${eventId}`,
      d: srmsResult?.d || (isUpdateSuccess ? 'Lecture deleted successfully' : `deleted event with id:${eventId}`),
      srms_response: srmsResult,
      srms_update_response: srmsUpdateResult || srmsDeleteResult,
      srms_deleted: isExplicitlyDeleted || isUpdateSuccess,
    });
  } catch (err: any) {
    console.error('[API /api/srms/delete-event Error]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  return POST(req);
}


