import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const colgcd = Number(body.colgcd || body.colg_cd || 1);

    const payload = {
      colgcd: colgcd,
    };

    const targetUrl = 'https://myportal.srms.ac.in/timetable/services/EmployeeInfo.asmx/LoadCamera';
    const data = await srmsPost(targetUrl, payload);

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
      data: Array.isArray(parsedData) ? parsedData : [],
      raw: data,
    });
  } catch (error: any) {
    console.error('[API /api/srms/load-camera] Error:', error);
    return NextResponse.json({
      success: false,
      error: error?.message,
      data: [],
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const colgcd = Number(searchParams.get('colgcd') || searchParams.get('colg_cd') || 1);

  const dummyReq = new NextRequest(req.url, {
    method: 'POST',
    body: JSON.stringify({ colgcd }),
  });
  return POST(dummyReq);
}
