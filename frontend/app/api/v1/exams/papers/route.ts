export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getExamPapersFromDb, saveExamPaperToDb } from '@/lib/examination-db';
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
  const status = url.searchParams.get('status') || undefined;
  const departmentId = url.searchParams.get('departmentId') || undefined;
  const colgCd = url.searchParams.get('colgCd') || undefined;
  const courseCd = url.searchParams.get('courseCd') || undefined;
  const branchCd = url.searchParams.get('branchCd') || undefined;
  const batchCd = url.searchParams.get('batchCd') || undefined;
  const semester = url.searchParams.get('semester') || undefined;
  const section = url.searchParams.get('section') || undefined;

  // Try direct PostgreSQL first for instant schema-isolated speed & reliability
  try {
    const papers = await getExamPapersFromDb(tenantSlug, {
      status, departmentId, colgCd, courseCd, branchCd, batchCd, semester, section
    });
    return NextResponse.json({ success: true, data: papers, timestamp: new Date().toISOString() });
  } catch {
    // Fallback to backend API
    try {
      const backendUrl = `${getBackendApiUrl()}/exams/papers?tenant=${tenantSlug}${url.search ? `&${url.search.slice(1)}` : ''}`;
      const backendRes = await fetch(backendUrl, {
        headers: { 'x-tenant-slug': tenantSlug },
        cache: 'no-store',
      });
      const data = await backendRes.json();
      return NextResponse.json(data);
    } catch (e: any) {
      return NextResponse.json({ success: false, message: e.message, data: [] }, { status: 500 });
    }
  }
}

export async function POST(req: NextRequest) {
  const tenantSlug = getTenantSlug(req);
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
  }

  // Save directly to PostgreSQL with schema isolation (guarantees practical sections & all fields are stored)
  try {
    const saved = await saveExamPaperToDb(tenantSlug, body);
    return NextResponse.json({
      success: true,
      message: 'Question paper saved successfully',
      data: saved,
      timestamp: new Date().toISOString(),
    });
  } catch (dbErr: any) {
    console.error('Direct DB save failed, trying backend fallback:', dbErr.message);
    try {
      const cleanPayload = {
        id: body.id,
        code: body.code,
        name: body.name,
        subjectId: body.subjectId,
        batchId: body.batchId,
        maxMarks: body.maxMarks,
        passingMarks: body.passingMarks,
        durationMinutes: body.durationMinutes,
        type: body.type,
        sections: body.sections,
        status: body.status,
      };
      const backendRes = await fetch(`${getBackendApiUrl()}/exams/papers?tenant=${tenantSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug,
        },
        body: JSON.stringify(cleanPayload),
      });
      const data = await backendRes.json();
      return NextResponse.json(data, { status: backendRes.status });
    } catch (fallbackErr: any) {
      return NextResponse.json(
        { success: false, message: fallbackErr.message || 'Failed to save question paper' },
        { status: 500 }
      );
    }
  }
}
