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
      console.warn('[SRMS updateEvent error]:', err.message);
      resolve({ error: err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'SRMS updateEvent timed out' });
    });
    req.write(postData);
    req.end();
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const eventId = String(body.id || body.eventId || '');
    const title = String(body.title || '0');
    const description = String(body.description || '1');
    const lectFlg = Number(body.LectFlg ?? body.lectFlg ?? 1);
    const suspendreason = String(body.suspendreason || '');
    const colgcd = String(body.colgcd || body.colg_cd || '1');

    if (!eventId) {
      return NextResponse.json({ success: false, message: 'Event ID is required for update' }, { status: 400 });
    }

    // 1. Call SRMS Portal updateevent API
    const srmsTargetUrl = 'https://myportal.srms.ac.in/srmserp/timetbl/updateevent';
    const srmsPayload = {
      id: eventId,
      title,
      description,
      LectFlg: lectFlg,
      suspendreason,
    };

    const srmsResult = await srmsPost(srmsTargetUrl, srmsPayload);

    // 2. Update local PostgreSQL tenant table
    const tenantHeader = req.headers.get('x-tenant-id') || req.headers.get('x-tenant') || req.headers.get('x-tenant-slug') || '';
    let slug = tenantHeader.replace(/^tenant_/, '').replace(/^tenant-/, '') || (colgcd === '1' ? 'srms-cet-bareilly' : 'srms-cet-bareilly');
    if (!slug) slug = 'srms-cet-bareilly';
    const schema = `tenant_${slug}`;

    await queryDb(
      `UPDATE "${schema}".srms_timetable_events
       SET title = CASE WHEN $2 <> '0' THEN $2 ELSE title END,
           description = CASE WHEN $3 <> '1' THEN $3 ELSE description END,
           updated_at = NOW()
       WHERE id::text = $1 OR srms_id = $4`,
      [eventId, title, description, Number(eventId) || null]
    ).catch(() => {});

    return NextResponse.json({
      success: srmsResult?.success ?? true,
      id: srmsResult?.id ?? eventId,
      message: srmsResult?.message || 'Lecture updated successfully.',
      srms_response: srmsResult,
    });
  } catch (err: any) {
    console.error('[API /api/srms/update-event Error]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}
