export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getCoPoMatrixDb, saveCoPoMatrixDb } from '@/lib/obe-master-db';

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
  const subjectId = url.searchParams.get('subjectId') || undefined;
  const subjectCode = url.searchParams.get('subjectCode') || undefined;
  const semester = url.searchParams.get('semester') || undefined;
  const academicYear = url.searchParams.get('academicYear') || undefined;

  try {
    const data = await getCoPoMatrixDb(tenantSlug, { subjectId, subjectCode, semester, academicYear });
    return NextResponse.json({ success: true, data }, { headers: noCacheHeaders });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to fetch CO-PO matrix' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  const tenantSlug = getTenantSlug(req);
  try {
    const body = await req.json();
    const result = await saveCoPoMatrixDb(tenantSlug, body);
    return NextResponse.json(result, { headers: noCacheHeaders });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to save CO-PO matrix' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
