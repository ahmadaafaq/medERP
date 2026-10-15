export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getPoPeoMatrixDb, savePoPeoMatrixDb } from '@/lib/obe-master-db';

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
  const semCd = url.searchParams.get('semCd') || url.searchParams.get('semester') || undefined;
  const section = url.searchParams.get('section') || undefined;
  const batchYear = url.searchParams.get('batchYear') || undefined;

  try {
    const data = await getPoPeoMatrixDb(tenantSlug, { courseCd, branchCd, semCd, section, batchYear });
    return NextResponse.json(
      {
        success: true,
        data: {
          matrix_data: data.matrix_data || {},
          rows: data.rows || [],
        },
      },
      { headers: noCacheHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to fetch PO-PEO matrix' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  const tenantSlug = getTenantSlug(req);
  try {
    const body = await req.json();
    const result = await savePoPeoMatrixDb(tenantSlug, body);
    return NextResponse.json(result, { headers: noCacheHeaders });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to save PO-PEO matrix' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
