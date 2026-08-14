import { NextRequest, NextResponse } from 'next/server';

async function handleGetCourse(colgcd: string) {
  if (!colgcd) {
    return NextResponse.json(
      { error: 'Missing required parameter: colgcd' },
      { status: 400 }
    );
  }

  const res = await fetch('https://myportal.srms.ac.in/SRMSERP/erpadmin/GetCourse', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
    },
    body: JSON.stringify({ colgcd }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const errText = await res.text();
    return NextResponse.json(
      { error: `SRMS Portal API error (${res.status}): ${errText}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const colgcd = String(body.colgcd || body.colg_cd || '').trim();
    return handleGetCourse(colgcd);
  } catch (error: any) {
    console.error('[API /api/srms/courses] Error fetching live courses:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch live courses from SRMS Portal' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const colgcd = String(searchParams.get('colgcd') || searchParams.get('colg_cd') || '').trim();
    return handleGetCourse(colgcd);
  } catch (error: any) {
    console.error('[API /api/srms/courses] Error fetching live courses via GET:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch live courses from SRMS Portal' },
      { status: 500 }
    );
  }
}

