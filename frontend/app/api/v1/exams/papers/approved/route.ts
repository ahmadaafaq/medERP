export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getExamPapersFromDb } from '@/lib/examination-db';

function getTenantSlug(req: NextRequest): string {
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get('tenant') || url.searchParams.get('tenantSlug');
  if (fromQuery) return fromQuery;
  const fromHeader = req.headers.get('x-tenant-slug') || req.headers.get('x-tenant-id');
  return fromHeader || 'srms-cet-bareilly';
}

export async function GET(req: NextRequest) {
  const tenantSlug = getTenantSlug(req);
  const url = new URL(req.url);
  const departmentId = url.searchParams.get('departmentId') || undefined;

  try {
    const papers = await getExamPapersFromDb(tenantSlug, {
      status: 'HOD_APPROVED',
      departmentId,
    });
    return NextResponse.json(papers);
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message, data: [] }, { status: 500 });
  }
}
