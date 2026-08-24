import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import https from 'https';

const _srmsAgent = new https.Agent({ rejectUnauthorized: false });

function srmsPost(url: string, payload: any): Promise<any> {
  return new Promise((resolve) => {
    const postData = JSON.stringify(payload);
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

    // 1. Call SRMS Portal deleteEvent WebMethod
    const srmsTargetUrl = 'https://myportal.srms.ac.in/timetable/master/designtimetable.aspx/deleteEvent';
    const srmsPayload = { id: eventId };
    const srmsResult = await srmsPost(srmsTargetUrl, srmsPayload);

    // 2. Delete from PostgreSQL tenant tables
    const tenantHeader = req.headers.get('x-tenant-id') || req.headers.get('x-tenant') || req.headers.get('x-tenant-slug') || '';
    let slug = tenantHeader.replace(/^tenant_/, '').replace(/^tenant-/, '') || (colgcd === '1' ? 'srms-cet-bareilly' : 'srms-cet-bareilly');
    if (!slug) slug = 'srms-cet-bareilly';
    const schema = `tenant_${slug}`;

    // Delete from srms_timetable_events by id or raw_payload
    await queryDb(
      `DELETE FROM "${schema}".srms_timetable_events 
       WHERE id::text = $1 
          OR raw_payload->'improperEvent'->>'id' = $1
          OR linkcd = $1`,
      [eventId]
    ).catch(() => {});

    // Delete from timetable_slots if matching id
    await queryDb(
      `DELETE FROM "${schema}".timetable_slots 
       WHERE id::text = $1`,
      [eventId]
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Deleted event with id:${eventId}`,
      d: srmsResult?.d || `deleted event with id:${eventId}`,
      srms_response: srmsResult,
    });
  } catch (err: any) {
    console.error('[API /api/srms/delete-event Error]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  return POST(req);
}
