import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

async function handleGetCollege() {
  // 1. Live SRMS ERP API: https://myportal.srms.ac.in/SRMSERP/Home/GetCollege
  try {
    const data = await srmsPost('Home/GetCollege', {});
    if (Array.isArray(data) && data.length > 0) {
      return NextResponse.json(data);
    }
  } catch (error: any) {
    console.warn('[API /api/srms/colleges] SRMS live portal fetch error:', error?.message);
  }

  // 2. Dynamic Fallback to PostgreSQL via NestJS backend
  try {
    const res = await fetch(`${BACKEND_API}/college-master/colleges`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      const list = json.data || json;
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list.map((c: any) => ({
          colg_cd: String(c.code || c.colg_cd || '1'),
          colg_name: c.name || c.colg_name,
        }));
        return NextResponse.json(mapped);
      }
    }
  } catch (backendErr: any) {
    console.warn('[API /api/srms/colleges] PostgreSQL backend fallback error:', backendErr?.message);
  }

  return NextResponse.json([]);
}

export async function POST() {
  return handleGetCollege();
}

export async function GET() {
  return handleGetCollege();
}
