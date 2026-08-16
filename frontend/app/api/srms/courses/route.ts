import { NextRequest, NextResponse } from 'next/server';
import { srmsPost, FALLBACK_COURSES_CET } from '@/lib/srms-client';

async function handleGetCourse(colgcd: string) {
  const cd = colgcd || '1';
  try {
    const data = await srmsPost('erpadmin/GetCourse', { colgcd: cd });
    if (Array.isArray(data) && data.length > 0) {
      return NextResponse.json(data);
    }
    return NextResponse.json(FALLBACK_COURSES_CET);
  } catch (error: any) {
    console.warn('[API /api/srms/courses] SRMS portal live fetch error, using fallback:', error?.message);
    return NextResponse.json(FALLBACK_COURSES_CET);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const colgcd = String(body.colgcd || body.colg_cd || '').trim();
    return handleGetCourse(colgcd);
  } catch (error: any) {
    console.error('[API /api/srms/courses] Error in POST:', error);
    return NextResponse.json(FALLBACK_COURSES_CET);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const colgcd = String(searchParams.get('colgcd') || searchParams.get('colg_cd') || '').trim();
    return handleGetCourse(colgcd);
  } catch (error: any) {
    console.error('[API /api/srms/courses] Error in GET:', error);
    return NextResponse.json(FALLBACK_COURSES_CET);
  }
}
