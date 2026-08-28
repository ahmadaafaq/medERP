import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1';

async function handleGetCourse(colgcd?: string, tenantSlug?: string) {
  const cd = colgcd || '1';
  const tenant = tenantSlug || 'srms-cet-bareilly';

  // 1. Live SRMS ERP API: https://myportal.srms.ac.in/SRMSERP/erpadmin/GetCourse
  try {
    const data = await srmsPost('erpadmin/GetCourse', { colgcd: cd, colg_cd: cd });
    if (Array.isArray(data) && data.length > 0) {
      return NextResponse.json(data);
    }
  } catch (error: any) {
    console.warn('[API /api/srms/courses] SRMS live portal fetch error:', error?.message);
  }

  // 2. Dynamic Fallback to PostgreSQL via NestJS backend
  try {
    const res = await fetch(`${BACKEND_API}/college-master/courses?tenant=${tenant}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      const list = json.data || json;
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list.map((c: any) => ({
          colg_cd: c.colg_cd || cd,
          course_cd: String(c.course_cd || c.code || '1'),
          course_name: c.name || c.course_name,
        }));
        return NextResponse.json(mapped);
      }
    }
  } catch (backendErr: any) {
    console.warn('[API /api/srms/courses] PostgreSQL backend fallback error:', backendErr?.message);
  }

  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const colgcd = String(body.colgcd || body.colg_cd || '').trim();
    const tenant = String(body.tenant || body.tenantSlug || '').trim();
    return handleGetCourse(colgcd, tenant);
  } catch (error: any) {
    console.error('[API /api/srms/courses] Error in POST:', error);
    return NextResponse.json([]);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const colgcd = String(searchParams.get('colgcd') || searchParams.get('colg_cd') || '').trim();
    const tenant = String(searchParams.get('tenant') || searchParams.get('tenantSlug') || '').trim();
    return handleGetCourse(colgcd, tenant);
  } catch (error: any) {
    console.error('[API /api/srms/courses] Error in GET:', error);
    return NextResponse.json([]);
  }
}
