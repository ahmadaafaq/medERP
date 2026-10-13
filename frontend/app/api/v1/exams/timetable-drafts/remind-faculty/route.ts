export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { remindFacultyForPlanning } from '@/lib/timetable-drafts-db';
import { getBackendApiUrl } from '@/lib/backend-config';

function getTenantSlug(req: NextRequest): string {
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get('tenant') || url.searchParams.get('tenantSlug');
  if (fromQuery) return fromQuery;
  const fromHeader = req.headers.get('x-tenant-slug') || req.headers.get('x-tenant-id');
  return fromHeader || 'srms-cet-bareilly';
}

export async function POST(req: NextRequest) {
  const tenantSlug = getTenantSlug(req);
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // 1. Try backend proxy first if available
  try {
    const backendRes = await fetch(`${getBackendApiUrl()}/exams/timetable-drafts/remind-faculty?tenant=${tenantSlug}`, {
      method: 'POST',
      headers: {
        'x-tenant-slug': tenantSlug,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
    const res = await remindFacultyForPlanning(tenantSlug, body);
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to dispatch reminder' },
      { status: 500 }
    );
  }
}
