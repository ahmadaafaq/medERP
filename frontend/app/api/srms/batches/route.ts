import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function handleGetBatch(colgcd?: string, coursecd?: string, tenantSlug?: string, branchcd?: string) {
  const cd = colgcd || '1';
  const crs = coursecd && coursecd !== 'all' ? coursecd : '';
  const tenant = tenantSlug || 'srms-cet-bareilly';
  const br = branchcd && branchcd !== 'all' ? branchcd : '';

  if (!crs) {
    // Return empty or generic batches when no course is specified
    return NextResponse.json([]);
  }

  // 1. Live SRMS ERP API: https://myportal.srms.ac.in/SRMSERP/OnlineAttend/GetBatch
  try {
    const postPayload: Record<string, string> = { colgcd: cd, coursecd: crs };
    if (br) postPayload.branchcd = br;

    const data = await srmsPost('OnlineAttend/GetBatch', postPayload);
    if (Array.isArray(data) && data.length > 0) {
      return NextResponse.json(data);
    }
  } catch (error: any) {
    console.warn('[API /api/srms/batches] SRMS live portal fetch error:', error?.message);
  }

  // 2. Dynamic Fallback to PostgreSQL via NestJS backend
  try {
    const res = await fetch(`${BACKEND_API}/college-master/batches?tenant=${tenant}&course_cd=${crs}`, {
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
          batch_cd: Number(b.batch_cd || b.code || b.year),
          batch_name: String(b.name || b.year || b.code),
          active_flg: b.is_active ? '1' : '0',
          curr_bat_Cd: Number(b.curr_bat_cd || b.batch_cd || b.code || 1),
        }));
        return NextResponse.json(mapped);
      }
    }
  } catch (backendErr: any) {
    console.warn('[API /api/srms/batches] PostgreSQL backend fallback error:', backendErr?.message);
  }

  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const colgcd = String(body.colgcd || body.colg_cd || '').trim();
    const coursecd = String(body.coursecd || body.course_cd || '').trim();
    const tenant = String(body.tenant || body.tenantSlug || '').trim();
    const branchcd = String(body.branchcd || body.branch_cd || '').trim();
    return handleGetBatch(colgcd, coursecd, tenant, branchcd);
  } catch (error: any) {
    console.error('[API /api/srms/batches] Error in POST:', error);
    return NextResponse.json([]);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const colgcd = String(searchParams.get('colgcd') || searchParams.get('colg_cd') || '').trim();
    const coursecd = String(searchParams.get('coursecd') || searchParams.get('course_cd') || '').trim();
    const tenant = String(searchParams.get('tenant') || searchParams.get('tenantSlug') || '').trim();
    const branchcd = String(searchParams.get('branchcd') || searchParams.get('branch_cd') || '').trim();
    return handleGetBatch(colgcd, coursecd, tenant, branchcd);
  } catch (error: any) {
    console.error('[API /api/srms/batches] Error in GET:', error);
    return NextResponse.json([]);
  }
}
