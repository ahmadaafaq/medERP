export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenantSchema, ensureObeTables } from '@/lib/obe-master-db';
import { queryDb } from '@/lib/db';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

function getTenantSlug(req: NextRequest): string {
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get('tenant') || url.searchParams.get('tenantSlug');
  if (fromQuery && fromQuery !== 'all') return fromQuery;
  const fromHeader = req.headers.get('x-tenant-slug') || req.headers.get('x-tenant-id');
  if (fromHeader && fromHeader !== 'all') return fromHeader;
  return 'srms-cet-bareilly';
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const tenantSlug = getTenantSlug(req);
  const schema = resolveTenantSchema(tenantSlug);
  await ensureObeTables(schema);
  const { id } = params;

  try {
    const body = await req.json();
    const rows = await queryDb(
      `UPDATE "${schema}".program_educational_objectives
       SET code = COALESCE($1, code),
           title = COALESCE($2, title),
           description = COALESCE($3, description),
           course_cd = COALESCE($4, course_cd),
           course_name = COALESCE($5, course_name),
           branch_cd = COALESCE($6, branch_cd),
           batch_year = COALESCE($7, batch_year),
           peo_order = COALESCE($8, peo_order),
           is_active = COALESCE($9, is_active),
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        body.code ? body.code.trim().toUpperCase() : null,
        body.title ? body.title.trim() : null,
        body.description !== undefined ? body.description : null,
        body.course_cd || null,
        body.course_name || null,
        body.branch_cd || null,
        body.batch_year ? Number(body.batch_year) : null,
        body.peo_order ? Number(body.peo_order) : null,
        body.is_active !== undefined ? body.is_active : null,
        id,
      ]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'PEO not found' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, data: rows[0], message: 'Program Educational Objective updated successfully' },
      { headers: noCacheHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to update PEO' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const tenantSlug = getTenantSlug(req);
  const schema = resolveTenantSchema(tenantSlug);
  await ensureObeTables(schema);
  const { id } = params;

  try {
    await queryDb(`DELETE FROM "${schema}".program_educational_objectives WHERE id = $1`, [id]);
    return NextResponse.json({ success: true, message: 'PEO deleted successfully' }, { headers: noCacheHeaders });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to delete PEO' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
