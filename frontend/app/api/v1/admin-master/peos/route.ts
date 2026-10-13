export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { listProgramEducationalObjectivesDb, resolveTenantSchema, ensureObeTables } from '@/lib/obe-master-db';
import { queryDb } from '@/lib/db';
import { getBackendApiUrl } from '@/lib/backend-config';

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

export async function GET(req: NextRequest) {
  const tenantSlug = getTenantSlug(req);
  const url = new URL(req.url);
  const courseCd = url.searchParams.get('courseCd') || undefined;
  const branchCd = url.searchParams.get('branchCd') || undefined;

  // 1. Try local/backend proxy first
  try {
    const backendUrl = `${getBackendApiUrl()}/admin-master/peos?tenant=${tenantSlug}${courseCd ? `&courseCd=${courseCd}` : ''}${branchCd ? `&branchCd=${branchCd}` : ''}`;
    const backendRes = await fetch(backendUrl, {
      headers: {
        'x-tenant-slug': tenantSlug,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(2000),
      cache: 'no-store',
    });
    if (backendRes.ok) {
      const json = await backendRes.json();
      const list = Array.isArray(json) ? json : (json?.data || []);
      if (list.length > 0) {
        return NextResponse.json({ success: true, data: list }, { headers: noCacheHeaders });
      }
    }
  } catch (err: any) {
    // Fallback to direct DB
  }

  // 2. Direct PostgreSQL query with tenant isolation
  try {
    const data = await listProgramEducationalObjectivesDb(tenantSlug, courseCd, branchCd);
    return NextResponse.json({ success: true, data }, { headers: noCacheHeaders });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to list PEOs' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  const tenantSlug = getTenantSlug(req);
  const schema = resolveTenantSchema(tenantSlug);
  await ensureObeTables(schema);

  try {
    const body = await req.json();
    const cleanCode = body.code?.trim().toUpperCase();
    const cleanTitle = body.title?.trim();
    const cleanDesc = body.description ? body.description.trim() : null;

    let peoOrder = body.peo_order ? Number(body.peo_order) : 0;
    if (!peoOrder) {
      const match = cleanCode?.match(/\d+/);
      if (match) {
        peoOrder = parseInt(match[0], 10);
      } else {
        const maxRow = await queryDb(
          `SELECT COALESCE(MAX(peo_order), 0) + 1 AS next_order FROM "${schema}".program_educational_objectives`
        ).catch(() => [{ next_order: 1 }]);
        peoOrder = parseInt(maxRow[0]?.next_order || '1', 10);
      }
    }

    const rows = await queryDb(
      `INSERT INTO "${schema}".program_educational_objectives (
         code, title, description, course_cd, course_name, branch_cd, batch_year, peo_order, is_active
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        cleanCode,
        cleanTitle,
        cleanDesc,
        body.course_cd || null,
        body.course_name || null,
        body.branch_cd || null,
        body.batch_year ? Number(body.batch_year) : null,
        peoOrder,
        body.is_active !== undefined ? body.is_active : true,
      ]
    );

    return NextResponse.json(
      { success: true, data: rows[0], message: 'Program Educational Objective created successfully' },
      { status: 201, headers: noCacheHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to create PEO' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
