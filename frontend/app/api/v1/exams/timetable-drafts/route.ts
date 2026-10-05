export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import {
  getTimetableDrafts,
  createOrUpdateTimetableDraft,
  deleteTimetableDraft,
} from '@/lib/timetable-drafts-db';
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
  const status = url.searchParams.get('status') || undefined;
  const departmentId = url.searchParams.get('departmentId') || undefined;

  // Always query direct PostgreSQL with tenant schema isolation
  try {
    const drafts = await getTimetableDrafts(tenantSlug, { departmentId, status });
    return NextResponse.json({ success: true, data: drafts || [], timestamp: new Date().toISOString() }, { headers: noCacheHeaders });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to fetch drafts from database' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}


export async function POST(req: NextRequest) {
  const tenantSlug = getTenantSlug(req);
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // Try dynamic backend first if available
  try {
    const backendRes = await fetch(`${getBackendApiUrl()}/exams/timetable-drafts?tenant=${tenantSlug}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-slug': tenantSlug,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(2000),
    });
    if (backendRes.ok) {
      const data = await backendRes.json();
      return NextResponse.json(data);
    }
  } catch {}

  // Direct PostgreSQL save with tenant schema isolation
  try {
    const saved = await createOrUpdateTimetableDraft(tenantSlug, body);
    return NextResponse.json({
      success: true,
      message: 'Draft saved successfully',
      data: saved,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to save draft' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const tenantSlug = getTenantSlug(req);
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, message: 'Draft ID is required' }, { status: 400 });
  }

  try {
    const res = await deleteTimetableDraft(tenantSlug, id);
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to delete draft' },
      { status: 500 }
    );
  }
}
