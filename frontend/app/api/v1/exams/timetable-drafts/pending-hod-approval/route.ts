export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getPendingTimetableForHod } from '@/lib/timetable-drafts-db';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Surrogate-Control': 'no-store',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tenantSlug =
    url.searchParams.get('tenant') ||
    url.searchParams.get('tenantSlug') ||
    req.headers.get('x-tenant-slug') ||
    'srms-cet-bareilly';
  const departmentId = url.searchParams.get('departmentId') || undefined;

  try {
    // Always query direct PostgreSQL with strict schema isolation
    const drafts = await getPendingTimetableForHod(tenantSlug, departmentId);
    const filtered = (drafts || []).filter((item: any) => {
      const raw = item?.slots;
      const arr = typeof raw === 'string' ? JSON.parse(raw || '[]') : (raw || []);
      return Array.isArray(arr) && arr.length > 0;
    });
    return NextResponse.json(
      { success: true, data: filtered, timestamp: new Date().toISOString() },
      { headers: noCacheHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to fetch pending drafts from database' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
