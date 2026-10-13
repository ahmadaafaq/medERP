export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getFacultyTimetableCompliance } from '@/lib/timetable-drafts-db';
import { getBackendApiUrl } from '@/lib/backend-config';

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
  const draftId = url.searchParams.get('draftId') || undefined;

  // 1. Try backend proxy first if available
  try {
    let backendUrl = `${getBackendApiUrl()}/exams/timetable-drafts/faculty-compliance?tenant=${tenantSlug}`;
    if (draftId) backendUrl += `&draftId=${encodeURIComponent(draftId)}`;
    const backendRes = await fetch(backendUrl, {
      headers: {
        'x-tenant-slug': tenantSlug,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(2500),
    });
    if (backendRes.ok) {
      const data = await backendRes.json();
      return NextResponse.json(data);
    }
  } catch (err: any) {
    // Fall back to direct DB
  }

  // 2. Direct PostgreSQL fallback
  try {
    const res = await getFacultyTimetableCompliance(tenantSlug, draftId);
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to fetch faculty compliance' },
      { status: 500 }
    );
  }
}
