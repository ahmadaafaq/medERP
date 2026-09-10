import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ddl_sub = String(body.ddl_sub || '');
    const ddl_batch = String(body.ddl_batch || '2');
    const colgcd = String(body.colgcd || '1');
    const coursecd = String(body.coursecd || '13');
    const ddl_branch = String(body.ddl_branch || '1');
    const sem_cd = String(body.sem_cd || '3');
    const section_cd = String(body.section_cd || '1');
    const uid = String(body.uid || '');

    const payload = {
      ddl_sub,
      ddl_batch,
      colgcd,
      coursecd,
      ddl_branch,
      sem_cd,
      section_cd,
      uid,
    };

    const data = await srmsPost('student/GetEngSemSubwiseStatus', payload);
    const list = Array.isArray(data) ? data : [];

    return NextResponse.json({
      success: true,
      data: list,
      count: list.length,
    });
  } catch (error: any) {
    console.error('[SRMS Lecture Status API Error]', error);
    return NextResponse.json(
      { success: false, data: [], message: error.message || 'Failed to fetch lecture status' },
      { status: 500 }
    );
  }
}
