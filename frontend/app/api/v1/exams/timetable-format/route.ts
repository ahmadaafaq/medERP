export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

function resolveSchema(tenantSlug?: string): string {
  let clean = (tenantSlug || '').replace(/^tenant_/, '').trim();
  if (!clean || clean === 'default' || clean === 'undefined' || clean === 'null' || clean === 'all') {
    clean = 'srms-cet-bareilly';
  }
  return `tenant_${clean}`;
}

async function ensureTable(schema: string) {
  await queryDb(`
    CREATE TABLE IF NOT EXISTS "${schema}".timetable_formats (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      colg_cd VARCHAR(100) DEFAULT '1',
      course_cd VARCHAR(100) NOT NULL,
      branch_cd VARCHAR(100) DEFAULT '1',
      department_id VARCHAR(100),
      slots JSONB NOT NULL,
      is_default BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT uq_timetable_format_colg_course UNIQUE (colg_cd, course_cd, branch_cd)
    )
  `).catch(() => {});
  // Ensure existing tables have VARCHAR(100)
  await queryDb(`
    ALTER TABLE "${schema}".timetable_formats ALTER COLUMN branch_cd TYPE VARCHAR(100);
    ALTER TABLE "${schema}".timetable_formats ALTER COLUMN course_cd TYPE VARCHAR(100);
    ALTER TABLE "${schema}".timetable_formats ALTER COLUMN colg_cd TYPE VARCHAR(100);
  `).catch(() => {});
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tenantSlug =
    url.searchParams.get('tenant') ||
    url.searchParams.get('tenantSlug') ||
    req.headers.get('x-tenant-slug') ||
    'srms-cet-bareilly';
  const schema = resolveSchema(tenantSlug);
  await ensureTable(schema);

  const colgCd = url.searchParams.get('colgcd') || url.searchParams.get('colg_cd') || '1';
  const rawCourse = url.searchParams.get('course') || url.searchParams.get('course_cd');
  if (!rawCourse || rawCourse === '0') {
    return NextResponse.json({
      success: true,
      data: null,
      isCustom: false,
    });
  }
  const courseCd = rawCourse;
  let branchCd = url.searchParams.get('branch') || url.searchParams.get('branch_cd') || '1';
  let deptId = url.searchParams.get('dept') || url.searchParams.get('department_id') || url.searchParams.get('departmentId') || '';
  if (branchCd.includes('-') || isNaN(Number(branchCd))) {
    if (!deptId) deptId = branchCd;
    branchCd = '1';
  }

  try {
    // 1. Check exact match for college + course + (branch or dept)
    const rows = await queryDb(
      `SELECT id, colg_cd, course_cd, branch_cd, department_id, slots, is_default, updated_at
       FROM "${schema}".timetable_formats
       WHERE colg_cd = $1 AND course_cd = $2 
         AND (branch_cd = $3 OR department_id = $3 OR (NULLIF($4, '') IS NOT NULL AND department_id = $4))
       ORDER BY updated_at DESC
       LIMIT 1`,
      [colgCd, courseCd, branchCd, deptId]
    );

    if (rows && rows.length > 0) {
      const row = rows[0];
      const slots = typeof row.slots === 'string' ? JSON.parse(row.slots) : row.slots;
      return NextResponse.json({
        success: true,
        data: slots,
        isCustom: true,
        updatedAt: row.updated_at,
      });
    }

    // 2. Check match for college + course across any branch
    const courseRows = await queryDb(
      `SELECT id, colg_cd, course_cd, branch_cd, department_id, slots, is_default, updated_at
       FROM "${schema}".timetable_formats
       WHERE colg_cd = $1 AND course_cd = $2
       ORDER BY updated_at DESC
       LIMIT 1`,
      [colgCd, courseCd]
    );

    if (courseRows && courseRows.length > 0) {
      const row = courseRows[0];
      const slots = typeof row.slots === 'string' ? JSON.parse(row.slots) : row.slots;
      return NextResponse.json({
        success: true,
        data: slots,
        isCustom: true,
        updatedAt: row.updated_at,
      });
    }

    // 3. Fallback: No custom format stored yet
    return NextResponse.json({
      success: true,
      data: null,
      isCustom: false,
    });
  } catch (err: any) {
    console.error(`[GET /api/v1/exams/timetable-format] ${schema}:`, err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const tenantSlug =
    url.searchParams.get('tenant') ||
    url.searchParams.get('tenantSlug') ||
    req.headers.get('x-tenant-slug') ||
    'srms-cet-bareilly';
  const schema = resolveSchema(tenantSlug);
  await ensureTable(schema);

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const colgCd = String(body.colgCd || body.colg_cd || '1');
  const courseCd = String(body.courseCd || body.course_cd || '13');
  let rawBranchCd = String(body.branchCd || body.branch_cd || '1');
  let departmentId = body.departmentId || body.department_id || null;
  let branchCd = rawBranchCd;
  if (branchCd.includes('-') || isNaN(Number(branchCd))) {
    if (!departmentId) departmentId = branchCd;
    branchCd = '1';
  }
  const slots = body.slots;

  if (!slots || !Array.isArray(slots) || slots.length === 0) {
    return NextResponse.json(
      { success: false, message: 'slots array is required and cannot be empty' },
      { status: 400 }
    );
  }

  try {
    const slotsJson = JSON.stringify(slots);
    
    // 1. Primary Upsert for the specified branch_cd
    const result = await queryDb(
      `INSERT INTO "${schema}".timetable_formats (
         colg_cd, course_cd, branch_cd, department_id, slots, is_default, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5::jsonb, false, NOW()
       )
       ON CONFLICT (colg_cd, course_cd, branch_cd)
       DO UPDATE SET
         slots = EXCLUDED.slots,
         department_id = COALESCE(EXCLUDED.department_id, "${schema}".timetable_formats.department_id),
         is_default = false,
         updated_at = NOW()
       RETURNING *`,
      [colgCd, courseCd, branchCd, departmentId, slotsJson]
    );

    // 2. Secondary Sync: If branchCd is a UUID or different from '1', also sync to branch_cd = '1'
    if (branchCd !== '1') {
      await queryDb(
        `INSERT INTO "${schema}".timetable_formats (
           colg_cd, course_cd, branch_cd, department_id, slots, is_default, updated_at
         ) VALUES (
           $1, $2, '1', $3, $4::jsonb, false, NOW()
         )
         ON CONFLICT (colg_cd, course_cd, branch_cd)
         DO UPDATE SET
           slots = EXCLUDED.slots,
           department_id = COALESCE(EXCLUDED.department_id, "${schema}".timetable_formats.department_id),
           is_default = false,
           updated_at = NOW()`,
        [colgCd, courseCd, departmentId || branchCd, slotsJson]
      ).catch(() => {});
    }

    const savedRow = result?.[0];
    const savedSlots = typeof savedRow?.slots === 'string' ? JSON.parse(savedRow.slots) : savedRow?.slots;

    return NextResponse.json({
      success: true,
      message: 'Time format saved successfully and synchronized across Clerk, HOD, and Admin.',
      data: savedSlots || slots,
    });
  } catch (err: any) {
    console.error(`[POST /api/v1/exams/timetable-format] ${schema}:`, err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
