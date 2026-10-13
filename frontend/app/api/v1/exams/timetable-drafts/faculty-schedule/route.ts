export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getDraftsByWeekForFaculty } from '@/lib/timetable-drafts-db';
import { getBackendApiUrl } from '@/lib/backend-config';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

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
  const facultyId = url.searchParams.get('facultyId') || '';
  const facultyEmpId = url.searchParams.get('facultyEmpId') || '';
  const facultyName = url.searchParams.get('facultyName') || '';

  // 1. Try dynamic backend proxy first
  try {
    const backendUrl = `${getBackendApiUrl()}/exams/timetable-drafts/faculty-schedule?tenant=${tenantSlug}&facultyId=${encodeURIComponent(facultyId)}&facultyEmpId=${encodeURIComponent(facultyEmpId)}&facultyName=${encodeURIComponent(facultyName)}`;
    const backendRes = await fetch(backendUrl, {
      headers: {
        'x-tenant-slug': tenantSlug,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    });
    if (backendRes.ok) {
      const data = await backendRes.json();
      const list = Array.isArray(data) ? data : (data?.data || []);
      if (list.length > 0) {
        return NextResponse.json(list, { headers: noCacheHeaders });
      }
    }
  } catch (err: any) {
    console.warn('[faculty-schedule backend proxy fallback to local DB]:', err?.message);
  }

  // 2. Direct PostgreSQL fallback with tenant schema isolation
  try {
    const drafts = await getDraftsByWeekForFaculty(tenantSlug, facultyId, facultyEmpId, facultyName);
    return NextResponse.json(drafts, { headers: noCacheHeaders });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to fetch faculty schedule' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
