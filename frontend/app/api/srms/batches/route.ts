import { NextRequest, NextResponse } from 'next/server';
import { srmsPost, FALLBACK_BATCHES_BCA } from '@/lib/srms-client';

async function handleGetBatch(colgcd: string, coursecd: string) {
  const col = colgcd || '1';
  const crs = coursecd || '13';
  try {
    const data = await srmsPost('OnlineAttend/GetBatch', { colgcd: col, coursecd: crs });
    if (Array.isArray(data) && data.length > 0) {
      return NextResponse.json(data);
    }
    return NextResponse.json(FALLBACK_BATCHES_BCA);
  } catch (error: any) {
    console.warn('[API /api/srms/batches] SRMS portal live fetch error, using fallback:', error?.message);
    return NextResponse.json(FALLBACK_BATCHES_BCA);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const colgcd = String(body.colgcd || body.colg_cd || '').trim();
    const coursecd = String(body.coursecd || body.course_cd || '').trim();
    return handleGetBatch(colgcd, coursecd);
  } catch (error: any) {
    console.error('[API /api/srms/batches] Error in POST:', error);
    return NextResponse.json(FALLBACK_BATCHES_BCA);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const colgcd = String(searchParams.get('colgcd') || searchParams.get('colg_cd') || '').trim();
    const coursecd = String(searchParams.get('coursecd') || searchParams.get('course_cd') || '').trim();
    return handleGetBatch(colgcd, coursecd);
  } catch (error: any) {
    console.error('[API /api/srms/batches] Error in GET:', error);
    return NextResponse.json(FALLBACK_BATCHES_BCA);
  }
}
