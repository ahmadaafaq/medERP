export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

function getTenantSlug(req: NextRequest): string {
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get('tenant') || url.searchParams.get('tenantSlug');
  if (fromQuery) return fromQuery;
  const fromHeader = req.headers.get('x-tenant-slug') || req.headers.get('x-tenant-id');
  return fromHeader || 'srms-cet-bareilly';
}

export async function POST(req: NextRequest) {
  const tenantSlug = getTenantSlug(req);
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    paperId,
    code,
    status,
    colgCd,
    courseCd,
    branchCd,
    batchCd,
    semester,
    section,
    departmentId,
    version,
    hodRemarks,
    questionRemarks,
  } = body;

  if (!paperId && !code) {
    return NextResponse.json({ success: false, message: 'paperId or code is required' }, { status: 400 });
  }

  const pool = getDbPool();
  const schema = `tenant_${tenantSlug}`;

  try {
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
    const validDeptId = departmentId && isUUID(departmentId) ? departmentId : null;
    const qRemarksJson = questionRemarks ? JSON.stringify(questionRemarks) : null;

    const res = await pool.query(
      `UPDATE "${schema}".examination_papers
       SET status = COALESCE($1, status),
           colg_cd = COALESCE($2, colg_cd),
           course_cd = COALESCE($3, course_cd),
           branch_cd = COALESCE($4, branch_cd),
           batch_cd = COALESCE($5, batch_cd),
           semester = COALESCE($6, semester),
           section = COALESCE($7, section),
           department_id = COALESCE($8, department_id),
           version = COALESCE($9, version),
           hod_remarks = COALESCE($10, hod_remarks),
           question_remarks = COALESCE($11::jsonb, question_remarks),
           updated_at = NOW()
       WHERE ($12::text IS NOT NULL AND id::text = $12::text)
          OR ($13::text IS NOT NULL AND code = $13::text)
       RETURNING id, code, name, status, colg_cd, course_cd, branch_cd, batch_cd, semester, section, department_id, version, updated_at`,
      [
        status || null,
        colgCd || null,
        courseCd || null,
        branchCd || null,
        batchCd || null,
        semester || null,
        section || null,
        validDeptId,
        version ? Number(version) : null,
        hodRemarks || null,
        qRemarksJson,
        paperId || null,
        code || null,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Paper metadata synchronized successfully',
      data: res.rows[0] || null,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to sync metadata' },
      { status: 500 }
    );
  }
}
