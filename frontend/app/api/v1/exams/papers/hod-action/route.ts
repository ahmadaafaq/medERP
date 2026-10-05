export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { hodPaperActionInDb } from '@/lib/examination-db';

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
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
  }

  const { paperId, action, version, remarks, hodRemarks, questionRemarks } = body;
  if (!paperId || !action) {
    return NextResponse.json({ success: false, message: 'paperId and action are required' }, { status: 400 });
  }

  try {
    const result = await hodPaperActionInDb(tenantSlug, {
      paperId,
      action,
      version: version ? Number(version) : undefined,
      remarks: remarks || hodRemarks,
      questionRemarks,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
