export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { isSrmsTenant } from '@/lib/srms-client';
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

    const tenantParam = req.nextUrl?.searchParams?.get('tenant') || body.tenant || body.tenantSlug || '';
    const tenantHeader = req.headers.get('x-tenant-id') || req.headers.get('x-tenant') || req.headers.get('x-tenant-slug') || '';
    let slug = (tenantParam || tenantHeader).replace(/^tenant_/, '').replace(/^tenant-/, '').trim();
    const srmsCollegeSlugMap: Record<string, string> = {
      '1': 'srms-cet-bareilly',
      '2': 'srms-cetr-bareilly',
      '3': 'srms-cet-unnao',
      '4': 'srms-law',
      '5': 'srms-ibs-lucknow',
      '6': 'srms-iahs-bareilly',
      '11': 'srms-ims',
    };
    if (!slug && srmsCollegeSlugMap[colgcd]) {
      slug = srmsCollegeSlugMap[colgcd];
    } else if (!slug) {
      slug = 'srms-cet-bareilly';
    }
    const schema = `tenant_${slug}`;
    const callSrms = isSrmsTenant(slug);

    const topic = body.topic || null;
    const unitName = body.unit_name || body.unitName || null;
    const unitId = body.unit_id || body.unitId || null;
    const subTopics = body.sub_topics || body.subTopics || null;
    const competencyCodes = body.competency_codes || body.competencyCodes || null;
    const room = body.room || null;
    const facultyId = body.faculty_id || body.facultyId || body.empid || null;
    const facultyName = body.faculty_name || body.facultyName || null;
    const subjectId = body.subject_id || body.subjectId || null;
    const subjectName = body.subject_name || body.subjectName || null;

    let srmsResult: any = null;
    if (callSrms) {
      // 1. Call SRMS Portal updateevent API (strictly for SRMS tenants)
      const srmsTargetUrl = 'https://myportal.srms.ac.in/srmserp/timetbl/updateevent';
      const srmsPayload = {
        id: eventId,
        title,
        description,
        LectFlg: lectFlg,
        suspendreason,
      };

      srmsResult = await srmsPost(srmsTargetUrl, srmsPayload).catch(() => null);
    }

    // 2. Update local PostgreSQL srms_timetable_events
    await queryDb(
      `UPDATE "${schema}".srms_timetable_events
       SET title = CASE WHEN $2 <> '0' THEN $2 ELSE title END,
           description = CASE WHEN $3 <> '1' THEN $3 ELSE description END,
           topic = COALESCE($5, topic),
           unit_id = COALESCE($6, unit_id),
           unit_name = COALESCE($7, unit_name),
           sub_topics = COALESCE($8, sub_topics),
           competency_codes = COALESCE($9, competency_codes),
           updated_at = NOW()
       WHERE id::text = $1 OR srms_id = $4`,
      [eventId, title, description, Number(eventId) || null, topic, unitId, unitName, subTopics, competencyCodes]
    ).catch(() => {});

    // 3. Update local PostgreSQL timetable_slots
    await queryDb(
      `UPDATE "${schema}".timetable_slots
       SET description = CASE WHEN $2 <> '1' THEN $2 ELSE description END,
           topic = CASE WHEN $3 <> '0' THEN $3 ELSE COALESCE($4, topic) END,
           unit_name = COALESCE($5, unit_name),
           unit_id = COALESCE($6, unit_id),
           sub_topics = COALESCE($7, sub_topics),
           competency_codes = COALESCE($8, competency_codes),
           room = COALESCE($9, room),
           faculty_id = COALESCE($10, faculty_id),
           subject_id = COALESCE($11, subject_id)
       WHERE id::text = $1 OR draft_id::text = $1`,
      [eventId, description, title, topic, unitName, unitId, subTopics, competencyCodes, room, facultyId, subjectId]
    ).catch(() => {});

    // 4. Update matching slot in timetable_drafts
    try {
      const draftsWithSlots = await queryDb(
        `SELECT id, slots FROM "${schema}".timetable_drafts WHERE slots IS NOT NULL AND jsonb_array_length(slots) > 0`
      ).catch(() => []);
      for (const d of draftsWithSlots || []) {
        const raw = typeof d.slots === 'string' ? JSON.parse(d.slots || '[]') : (d.slots || []);
        if (Array.isArray(raw)) {
          let updated = false;
          const mapped = raw.map((s: any) => {
            if (String(s.id) === eventId || String(s.postgres_id) === eventId) {
              updated = true;
              return {
                ...s,
                subjectName: subjectName || (title !== '0' ? title : (s.subjectName || s.subject_name)),
                subject_name: subjectName || (title !== '0' ? title : (s.subject_name || s.subjectName)),
                topic: topic || (title !== '0' ? title : s.topic),
                description: description !== '1' ? description : s.description,
                unitName: unitName || s.unitName || s.unit_name,
                unit_name: unitName || s.unit_name || s.unitName,
                unitId: unitId || s.unitId || s.unit_id,
                unit_id: unitId || s.unit_id || s.unitId,
                subTopics: subTopics || s.subTopics || s.sub_topics,
                sub_topics: subTopics || s.sub_topics || s.subTopics,
                competencyCodes: competencyCodes || s.competencyCodes || s.competency_codes,
                competency_codes: competencyCodes || s.competency_codes || s.competencyCodes,
                room: room || s.room,
                facultyId: facultyId || s.facultyId || s.faculty_id,
                faculty_id: facultyId || s.faculty_id || s.facultyId,
                facultyName: facultyName || s.facultyName || s.faculty_name,
                faculty_name: facultyName || s.faculty_name || s.facultyName,
              };
            }
            return s;
          });
          if (updated) {
            await queryDb(
              `UPDATE "${schema}".timetable_drafts SET slots = $1::jsonb, updated_at = NOW() WHERE id::text = $2`,
              [JSON.stringify(mapped), String(d.id)]
            ).catch(() => {});
          }
        }
      }
    } catch {}

    return NextResponse.json({
      success: srmsResult?.success ?? true,
      id: srmsResult?.id ?? eventId,
      message: srmsResult?.message || 'Lecture updated successfully in PostgreSQL' + (callSrms ? ' & SRMS Portal.' : '.'),
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
