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
      `UPDATE "${schema}".program_outcomes
       SET code = COALESCE($1, code),
           title = COALESCE($2, title),
           description = COALESCE($3, description),
           type = COALESCE($4, type),
           course_cd = COALESCE($5, course_cd),
           course_name = COALESCE($6, course_name),
           branch_cd = COALESCE($7, branch_cd),
           batch_year = COALESCE($8, batch_year),
           po_order = COALESCE($9, po_order),
           target_level = COALESCE($10, target_level),
           is_active = COALESCE($11, is_active),
           updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [
        body.code ? body.code.trim().toUpperCase() : null,
        body.title ? body.title.trim() : null,
        body.description !== undefined ? body.description : null,
        body.type ? body.type.trim().toUpperCase() : null,
        body.course_cd || null,
        body.course_name || null,
        body.branch_cd || null,
        body.batch_year ? Number(body.batch_year) : null,
        body.po_order ? Number(body.po_order) : null,
        body.target_level ? Number(body.target_level) : null,
        body.is_active !== undefined ? body.is_active : null,
        id,
      ]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Program Outcome not found' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, data: rows[0], message: 'Program Outcome updated successfully' },
      { headers: noCacheHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to update program outcome' },
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
    await queryDb(`DELETE FROM "${schema}".program_outcomes WHERE id = $1`, [id]);
    return NextResponse.json({ success: true, message: 'Program Outcome deleted successfully' }, { headers: noCacheHeaders });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to delete program outcome' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
