import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const res = await fetch('https://myportal.srms.ac.in/SRMSERP/Home/GetCollege', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
      body: JSON.stringify({}),
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
  } catch (error: any) {
    console.error('[API /api/srms/colleges] Error fetching live colleges:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch live colleges from SRMS Portal' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
