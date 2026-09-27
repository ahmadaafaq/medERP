import { NextRequest, NextResponse } from 'next/server';
import { isSrmsTenant } from '@/lib/srms-client';
import { queryDb } from '@/lib/db';
import https from 'https';

export const dynamic = 'force-dynamic';

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function srmsCopyLecture(payload: Record<string, string>): Promise<{ status: number; data: string }> {
  return new Promise((resolve) => {
    const postData = JSON.stringify(payload);
    const options: https.RequestOptions = {
      hostname: 'myportal.srms.ac.in',
      port: 443,
      path: '/SRMSERP/AdminAttendance/CopyLecture',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
      rejectUnauthorized: false,
      timeout: 15000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode ?? 200, data: data.trim() }));
    });
    req.on('error', (err) => resolve({ status: 500, data: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 504, data: 'timeout' });
    });
    req.write(postData);
    req.end();
  });
}

function fetchSrmsSchedule(params: {
  course: string; batch: string; branch: string; sem: string; sec: string;
  colgcd: string; start: number; end: number;
}): Promise<any[]> {
  const { course, batch, branch, sem, sec, colgcd, start, end } = params;
  const url = `https://myportal.srms.ac.in/timetable/master/JsonResponse.ashx?course=${course}&batch=${batch}&branch=${branch}&sem=${sem}&sec=${sec}&colgcd=${colgcd}&_=${Date.now()}&start=${start}&end=${end}`;

  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const opts: https.RequestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: { 'Accept': 'application/json, */*; q=0.01', 'User-Agent': 'Mozilla/5.0' },
      rejectUnauthorized: false,
      timeout: 10000,
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        if (data && data.trim().startsWith('[')) {
          try { return resolve(Function(`"use strict"; return (${data});`)() || []); } catch { }
          try { return resolve(JSON.parse(data) || []); } catch { }
        }
        resolve([]);
      });
    });
    req.on('error', () => resolve([]));
    req.on('timeout', () => {
      req.destroy();
      resolve([]);
    });
    req.end();
  });
}

function parseDateToUnix(val: any): number {
  if (!val) return Math.floor(Date.now() / 1000);
  if (typeof val === 'number') return val > 10000000000 ? Math.floor(val / 1000) : val;
  if (typeof val === 'string') {
    const num = Number(val);
    if (!isNaN(num)) return num > 10000000000 ? Math.floor(num / 1000) : num;
    if (val.includes('-') && val.includes(':')) {
      const parts = val.trim().split(/[\sT]+/);
      const dp = parts[0]; const tp = parts[1] || '09:00:00'; const ampm = (parts[2] || '').toUpperCase();
      let [d, m, y] = dp.split('-').map(Number);
      if (d > 1000) { const t = d; d = y; y = t; }
      let [hh, mm, ss] = tp.split(':').map(Number);
      if (ampm === 'PM' && hh < 12) hh += 12;
      if (ampm === 'AM' && hh === 12) hh = 0;
      return Math.floor(new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0).getTime() / 1000);
    }
    const dt = new Date(val); if (!isNaN(dt.getTime())) return Math.floor(dt.getTime() / 1000);
  }
  return Math.floor(Date.now() / 1000);
}

// ──────────────────────────────────────────────────────────────────────────────
// POST handler
// ──────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Academic hierarchy params — no SRMS-specific defaults; use what the client sends
    const colgcd    = String(body.colgcd    || '').trim();
    const course    = String(body.course    || '').trim();
    const batch     = String(body.ddl_batch || body.batch || '').trim();
    const branch    = String(body.branch    || '').trim();
    const sem       = String(body.sem       || '').trim();
    const sec       = String(body.sec       || '').trim();

    // Source week date range (YYYY-MM-DD)
    const FromDate    = String(body.FromDate    || '').trim();
    const ToDate      = String(body.ToDate      || '').trim();
    // Target week date range (YYYY-MM-DD)
    const FromDate1new = String(body.FromDate1new || '').trim();
    const ToDate1new   = String(body.ToDate1new   || '').trim();

    if (!FromDate || !ToDate || !FromDate1new || !ToDate1new) {
      return NextResponse.json(
        { success: false, message: 'FromDate, ToDate, FromDate1new, ToDate1new are required (YYYY-MM-DD).' },
        { status: 400 }
      );
    }

    // ── Tenant resolution — strictly from request headers/body (AGENTS.md: no cross-tenant fallback) ──
    const tenantParam  = req.nextUrl?.searchParams?.get('tenant') || body.tenant || body.tenantSlug || '';
    const tenantHeader = req.headers.get('x-tenant-id') || req.headers.get('x-tenant') || req.headers.get('x-tenant-slug') || '';
    const slug = (tenantParam || tenantHeader).replace(/^tenant_/, '').replace(/^tenant-/, '').trim();

    if (!slug) {
      // Never guess or default to SRMS — require explicit tenant identification
      return NextResponse.json(
        { success: false, message: 'Tenant could not be determined. Please log in again.' },
        { status: 400 }
      );
    }

    const schema = `tenant_${slug}`;
    const callSrmsApi = isSrmsTenant(slug); // true only if slug contains 'srms' keyword


    // ── SRMS TENANT: proxy CopyLecture to SRMS portal ─────────────────────
    if (callSrmsApi) {
      const srmsPayload = { colgcd, course, FromDate, ToDate, FromDate1new, ToDate1new, ddl_batch: batch };
      const { status, data: rawData } = await srmsCopyLecture(srmsPayload);

      if (status >= 400) {
        return NextResponse.json(
          { success: false, message: `SRMS CopyLecture failed (HTTP ${status}): ${rawData}` },
          { status: 502 }
        );
      }

      // SRMS returns a numeric count (e.g. "4") on success
      // OR a string error like "Error : One Week Time Table i.e. of Seven Days Will Be Carried Forward."
      const srmsErrorMsg = rawData.startsWith('Error') ? rawData : null;
      const copiedCount  = srmsErrorMsg ? 0 : (rawData === '' ? 0 : (parseInt(rawData, 10) || 0));

      // ── After copy: fetch newly-copied week from SRMS & upsert into PostgreSQL ──
      // This allows immediate topic enrichment on copied slots without a page refresh
      let syncedCount = 0;
      try {
        const targetStart = Math.floor(new Date(FromDate1new + 'T00:00:00').getTime() / 1000);
        const targetEnd   = Math.floor(new Date(ToDate1new   + 'T23:59:59').getTime() / 1000);
        const remoteSlots = await fetchSrmsSchedule({ course, batch, branch, sem, sec, colgcd, start: targetStart, end: targetEnd });

        if (remoteSlots.length > 0) {
          // Ensure table + columns exist
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
            ALTER TABLE "${schema}".srms_timetable_events ADD COLUMN IF NOT EXISTS srms_id BIGINT;
            ALTER TABLE "${schema}".srms_timetable_events ADD COLUMN IF NOT EXISTS unit_id VARCHAR(100);
            ALTER TABLE "${schema}".srms_timetable_events ADD COLUMN IF NOT EXISTS unit_name VARCHAR(255);
            ALTER TABLE "${schema}".srms_timetable_events ADD COLUMN IF NOT EXISTS topic VARCHAR(255);
            ALTER TABLE "${schema}".srms_timetable_events ADD COLUMN IF NOT EXISTS sub_topics VARCHAR(500);
            ALTER TABLE "${schema}".srms_timetable_events ADD COLUMN IF NOT EXISTS competency_codes VARCHAR(255);
          `).catch(() => {});

          const pad = (n: number) => String(n).padStart(2, '0');

          for (const slot of remoteSlots) {
            if (slot.Cancel_flg === '1') continue;
            const srmsId = Number(slot.id) || null;
            if (!srmsId) continue;

            const startSec = parseDateToUnix(slot.start);
            const endSec   = parseDateToUnix(slot.end);
            const istStart = new Date((startSec + 19800) * 1000);
            const istEnd   = new Date((endSec   + 19800) * 1000);

            const ymd      = `${istStart.getUTCFullYear()}-${pad(istStart.getUTCMonth() + 1)}-${pad(istStart.getUTCDate())}`;
            const startStr = `${ymd} ${pad(istStart.getUTCHours())}:${pad(istStart.getUTCMinutes())}:00 `;
            const endStr   = `${ymd} ${pad(istEnd.getUTCHours())}:${pad(istEnd.getUTCMinutes())}:00 `;
            const dayOfWeek = istStart.getUTCDay() === 0 ? 7 : istStart.getUTCDay();
            const title    = String(slot.title || slot.description || '');

            // Upsert: skip if srms_id already exists
            const existing = await queryDb(
              `SELECT id FROM "${schema}".srms_timetable_events WHERE srms_id = $1 LIMIT 1`,
              [srmsId]
            ).catch(() => []);

            if (existing && existing.length > 0) { syncedCount++; continue; }

            await queryDb(
              `INSERT INTO "${schema}".srms_timetable_events
                (title, description, start_time, end_time, start_str, end_str, day_of_week,
                 linkcd, electiveflg, txt_g, txt_sec, colg_cd, course_cd, branch_cd, batch_cd, sem_cd,
                 srms_id, raw_payload, created_at, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW(),NOW())`,
              [
                title, title,
                new Date(startSec * 1000).toISOString(),
                new Date(endSec   * 1000).toISOString(),
                startStr, endStr, dayOfWeek,
                String(slot.linkcd || ''), 'N', '0', String(slot.sec || sec),
                colgcd, course, branch, batch, sem, srmsId,
                JSON.stringify(slot),
              ]
            ).catch(() => {});
            syncedCount++;
          }
        }
      } catch (syncErr: any) {
        console.warn('[CopyLecture] PostgreSQL sync warning:', syncErr.message);
      }

      if (srmsErrorMsg) {
        // SRMS rejected the copy (e.g. dates not exactly 7 days / Mon–Sun)
        // But we still synced whatever slots SRMS already had for the target week
        return NextResponse.json({
          success: syncedCount > 0,
          count: 0,
          synced: syncedCount,
          message: syncedCount > 0
            ? `⚠️ SRMS: "${srmsErrorMsg}". However, ${syncedCount} existing slot(s) from the target week were found in SRMS and synced to the database — switching to Design tab now.`
            : `❌ SRMS rejected the copy: "${srmsErrorMsg}". Make sure From Date is a Monday and To Date is the Sunday of the same week (exactly 7 days).`,
        });
      }

      return NextResponse.json({
        success: true,
        count: copiedCount,
        synced: syncedCount,
        message: copiedCount > 0
          ? `✅ Successfully copied ${copiedCount} lecture(s) from ${FromDate}–${ToDate} → ${FromDate1new}–${ToDate1new}. ${syncedCount} slot(s) synced to database.`
          : `ℹ️ Copy request sent (SRMS returned 0 new lectures — target week may already have identical slots). ${syncedCount} slot(s) confirmed in database.`,
      });
    }

    // ── NON-SRMS TENANT: duplicate timetable_slots in PostgreSQL ──────────
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

      // Fetch all slots effective during the source week
      const sourceRows = await queryDb(
        `SELECT * FROM "${schema}".timetable_slots
         WHERE (effective_from IS NULL OR effective_from <= $1::date)
           AND (effective_until IS NULL OR effective_until >= $2::date)`,
        [ToDate, FromDate]
      ).catch(() => []);

      let inserted = 0;
      for (const row of (sourceRows || [])) {
        // Skip if target week already has a slot at same day/time
        const existing = await queryDb(
          `SELECT id FROM "${schema}".timetable_slots
           WHERE day_of_week = $1
             AND start_time::text LIKE $2 || '%'
             AND effective_from = $3::date
           LIMIT 1`,
          [row.day_of_week, String(row.start_time).slice(0, 5), FromDate1new]
        ).catch(() => []);

        if (existing && existing.length > 0) continue;

        await queryDb(
          `INSERT INTO "${schema}".timetable_slots
             (day_of_week, start_time, end_time, room, slot_type, faculty_id, subject_id,
              department_id, batch_id, colg_cd, course_cd, branch_cd, batch_cd, semester, section,
              description, topic, unit_id, unit_name, sub_topics, competency_codes,
              effective_from, effective_until, created_at, updated_at)
           SELECT day_of_week, start_time, end_time, room, slot_type, faculty_id, subject_id,
              department_id, batch_id, colg_cd, course_cd, branch_cd, batch_cd, semester, section,
              description, topic, unit_id, unit_name, sub_topics, competency_codes,
              $1::date, $2::date, NOW(), NOW()
           FROM "${schema}".timetable_slots WHERE id = $3`,
          [FromDate1new, ToDate1new, row.id]
        ).catch(() => {});
        inserted++;
      }

      return NextResponse.json({
        success: true,
        count: inserted,
        synced: inserted,
        message: `Copied ${inserted} slot(s) from ${FromDate}–${ToDate} → ${FromDate1new}–${ToDate1new} in PostgreSQL.`,
      });
    } catch (pgErr: any) {
      return NextResponse.json(
        { success: false, message: `PostgreSQL copy failed: ${pgErr.message}` },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error('[CopyLecture route error]', err);
    return NextResponse.json({ success: false, message: err.message || 'Internal error' }, { status: 500 });
  }
}
