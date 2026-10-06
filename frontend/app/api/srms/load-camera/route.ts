import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';

const DEFAULT_ROOMS = [
  { camera_id: 1, classroom: 'Web Cam', camera_ip: '0' },
  { camera_id: 2, classroom: 'Lecture Hall 1', camera_ip: '0' },
  { camera_id: 3, classroom: 'Lecture Hall 2', camera_ip: '0' },
  { camera_id: 4, classroom: 'Computer Lab 1', camera_ip: '0' },
  { camera_id: 5, classroom: 'Computer Lab 2', camera_ip: '0' },
  { camera_id: 6, classroom: 'Seminar Hall', camera_ip: '0' },
];

async function handleLoadCamera(colgcd: number) {
  try {
    const payload = { colgcd: Number(colgcd) || 1 };
    const targetUrl = 'https://myportal.srms.ac.in/timetable/services/EmployeeInfo.asmx/LoadCamera';
    const data = await srmsPost(targetUrl, payload).catch(() => null);

    let parsedData: any[] | null = null;
    if (data && data.d) {
      try {
        parsedData = typeof data.d === 'string' ? JSON.parse(data.d) : data.d;
      } catch {
        parsedData = data.d;
      }
    } else if (Array.isArray(data)) {
      parsedData = data;
    }

    const list = Array.isArray(parsedData) && parsedData.length > 0 ? parsedData : DEFAULT_ROOMS;

    return NextResponse.json({
      success: true,
      data: list,
      raw: data,
    });
  } catch (error: any) {
    console.error('[API /api/srms/load-camera] Error:', error);
    return NextResponse.json({
      success: true,
      data: DEFAULT_ROOMS,
    });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const colgcd = Number(body.colgcd || body.colg_cd || 1);
  return handleLoadCamera(colgcd);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const colgcd = Number(searchParams.get('colgcd') || searchParams.get('colg_cd') || 1);
  return handleLoadCamera(colgcd);
}

