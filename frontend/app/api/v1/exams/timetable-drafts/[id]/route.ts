export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { deleteTimetableDraft } from '@/lib/timetable-drafts-db';
import { getBackendApiUrl } from '@/lib/backend-config';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const url = new URL(req.url);
  const tenantSlug =
    url.searchParams.get('tenant') ||
    url.searchParams.get('tenantSlug') ||
    req.headers.get('x-tenant-slug') ||
    'srms-cet-bareilly';
  const { id } = params;

  // Try dynamic backend first
  try {
    const backendRes = await fetch(`${getBackendApiUrl()}/exams/timetable-drafts/${id}?tenant=${tenantSlug}`, {
      method: 'DELETE',
      headers: { 'x-tenant-slug': tenantSlug },
      signal: AbortSignal.timeout(2000),
    });
    if (backendRes.ok) {
      const data = await backendRes.json();
      return NextResponse.json(data);
    }
  } catch {}

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
