export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { submitTimetableDraftForApproval } from '@/lib/timetable-drafts-db';
import { getBackendApiUrl } from '@/lib/backend-config';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const tenantSlug =
    url.searchParams.get('tenant') ||
    url.searchParams.get('tenantSlug') ||
    req.headers.get('x-tenant-slug') ||
    'srms-cet-bareilly';

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const { draftId, notes } = body;
  if (!draftId) {
    return NextResponse.json({ success: false, message: 'draftId is required' }, { status: 400 });
  }

  // Try dynamic backend first
  try {
    const backendRes = await fetch(`${getBackendApiUrl()}/exams/timetable-drafts/submit-for-approval?tenant=${tenantSlug}`, {
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

  try {
    const res = await submitTimetableDraftForApproval(tenantSlug, draftId, notes);
    return NextResponse.json({
      success: true,
      message: 'Timetable draft submitted for HOD approval',
      data: res,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to submit draft' },
      { status: 500 }
    );
  }
}
