import { NextResponse } from 'next/server';
import { srmsPost, FALLBACK_COLLEGES } from '@/lib/srms-client';

export async function POST() {
  try {
    const data = await srmsPost('Home/GetCollege', {});
    if (Array.isArray(data) && data.length > 0) {
      return NextResponse.json(data);
    }
    return NextResponse.json(FALLBACK_COLLEGES);
  } catch (error: any) {
    console.warn('[API /api/srms/colleges] SRMS portal live fetch error, using fallback:', error?.message);
    return NextResponse.json(FALLBACK_COLLEGES);
  }
}

export async function GET() {
  return POST();
}
