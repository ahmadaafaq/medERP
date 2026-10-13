export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { facultyLinkSlot } from '@/lib/timetable-drafts-db';
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

  // 1. Try dynamic backend proxy first
  try {
    const backendRes = await fetch(`${getBackendApiUrl()}/exams/timetable-drafts/link-slot?tenant=${tenantSlug}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-slug': tenantSlug,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });
    if (backendRes.ok) {
      const data = await backendRes.json();
      return NextResponse.json(data);
    }
  } catch (err: any) {
    console.warn('[link-slot backend proxy fallback to local DB]:', err?.message);
  }

  // 2. Direct PostgreSQL fallback with tenant schema isolation
  try {
    const res = await facultyLinkSlot(tenantSlug, body);
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to link slot' },
      { status: 500 }
    );
  }
}
