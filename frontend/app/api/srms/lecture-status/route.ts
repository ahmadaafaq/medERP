import { NextRequest, NextResponse } from 'next/server';

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

    const res = await fetch('https://myportal.srms.ac.in/srmserp/student/GetEngSemSubwiseStatus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, data: [], message: `SRMS server returned ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
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
