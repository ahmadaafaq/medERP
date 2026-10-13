export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { seedProgramOutcomesDb } from '@/lib/obe-master-db';

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

export async function POST(req: NextRequest) {
  const tenantSlug = getTenantSlug(req);
  try {
    const result = await seedProgramOutcomesDb(tenantSlug);
    return NextResponse.json(result, { headers: noCacheHeaders });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to seed Program Outcomes' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
