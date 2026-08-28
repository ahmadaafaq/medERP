import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const course = String(body.course || body.course_cd || '13').trim();
    const branch = Number(body.branch || body.branch_cd || 1);
    const batch = Number(body.batch || body.batch_cd || 2);
    const semester = Number(body.semester || body.sem_cd || 3);
    const section = Number(body.section || body.sec_cd || 1);
    const colgcd = Number(body.colgcd || body.colg_cd || 1);

    const payload = {
      course: course,
      branch: branch,
      batch: batch,
      semester: semester,
      section: section,
      colgcd: colgcd,
    };

    const targetUrl = 'https://myportal.srms.ac.in/timetable/services/EmployeeInfo.asmx/Loadsubject';
    const data = await srmsPost(targetUrl, payload);

    // If ASMX returns { d: "[...]" } or { d: [...] }
    let parsedData = data;
    if (data && data.d) {
      try {
        parsedData = typeof data.d === 'string' ? JSON.parse(data.d) : data.d;
      } catch {
        parsedData = data.d;
      }
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
      raw: data,
    });
  } catch (error: any) {
    console.error('[API /api/srms/timetable-subjects] Error:', error);
    return NextResponse.json({
      success: false,
      error: error?.message,
      data: [],
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const course = searchParams.get('course') || searchParams.get('course_cd') || '13';
  const branch = Number(searchParams.get('branch') || searchParams.get('branch_cd') || 1);
  const batch = Number(searchParams.get('batch') || searchParams.get('batch_cd') || 2);
  const semester = Number(searchParams.get('semester') || searchParams.get('sem_cd') || 3);
  const section = Number(searchParams.get('section') || searchParams.get('sec_cd') || 1);
  const colgcd = Number(searchParams.get('colgcd') || searchParams.get('colg_cd') || 1);

  const dummyReq = new NextRequest(req.url, {
    method: 'POST',
    body: JSON.stringify({ course, branch, batch, semester, section, colgcd }),
  });
  return POST(dummyReq);
}
