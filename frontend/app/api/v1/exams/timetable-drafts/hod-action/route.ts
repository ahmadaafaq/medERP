export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { hodTimetableAction } from '@/lib/timetable-drafts-db';
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

  const { draftId, action, remarks, slots } = body;
  if (!draftId || !action) {
    return NextResponse.json({ success: false, message: 'draftId and action are required' }, { status: 400 });
  }

  // Try dynamic backend first
  try {
    const backendRes = await fetch(`${getBackendApiUrl()}/exams/timetable-drafts/hod-action?tenant=${tenantSlug}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-slug': tenantSlug,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    if (backendRes.ok) {
      const data = await backendRes.json();
      return NextResponse.json(data);
    }
  } catch {}

  try {
    const result = await hodTimetableAction(tenantSlug, { draftId, action, remarks, slots });
    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'Timetable draft approved' : 'Timetable draft rejected',
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to perform HOD action' },
      { status: 500 }
    );
  }
}
