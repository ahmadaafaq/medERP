import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

async function handleGetBranch(colgcd?: string, coursecd?: string, tenantSlug?: string) {
  const cd = colgcd || '1';
  const crs = coursecd || '13';
  const tenant = tenantSlug || 'srms-cet-bareilly';

  // 1. Live SRMS ERP API: https://myportal.srms.ac.in/SRMSERP/erpadmin/GetBranch
  try {
    const data = await srmsPost('erpadmin/GetBranch', { colgcd: cd, coursecd: crs });
    if (Array.isArray(data) && data.length > 0) {
      return NextResponse.json(data);
    }
  } catch (error: any) {
    console.warn('[API /api/srms/branches] SRMS live portal fetch error:', error?.message);
  }

  // 2. Dynamic Fallback to PostgreSQL via NestJS backend
  try {
    const res = await fetch(`${BACKEND_API}/college-master/branches?tenant=${tenant}&course_cd=${crs}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      const list = json.data || json;
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list.map((b: any) => ({
          colg_cd: b.colg_cd || cd,
          course_cd: b.course_cd || crs,
          branch_cd: String(b.branch_cd || b.code || '1'),
          branch_name: b.name || b.branch_name,
        }));
        return NextResponse.json(mapped);
      }
    }
  } catch (backendErr: any) {
    console.warn('[API /api/srms/branches] PostgreSQL backend fallback error:', backendErr?.message);
  }

  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const colgcd = String(body.colgcd || body.colg_cd || '').trim();
    const coursecd = String(body.coursecd || body.course_cd || '').trim();
    const tenant = String(body.tenant || body.tenantSlug || '').trim();
    return handleGetBranch(colgcd, coursecd, tenant);
  } catch (error: any) {
    console.error('[API /api/srms/branches] Error in POST:', error);
    return NextResponse.json([]);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const colgcd = String(searchParams.get('colgcd') || searchParams.get('colg_cd') || '').trim();
    const coursecd = String(searchParams.get('coursecd') || searchParams.get('course_cd') || '').trim();
    const tenant = String(searchParams.get('tenant') || searchParams.get('tenantSlug') || '').trim();
    return handleGetBranch(colgcd, coursecd, tenant);
  } catch (error: any) {
    console.error('[API /api/srms/branches] Error in GET:', error);
    return NextResponse.json([]);
  }
}
