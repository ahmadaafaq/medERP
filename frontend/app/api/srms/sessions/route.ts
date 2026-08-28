import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1';

async function handleGetSession(colgcd?: string, tenantSlug?: string) {
  const cd = colgcd || '1';
  const tenant = tenantSlug || 'srms-cet-bareilly';

  // 1. Live SRMS ERP API: https://myportal.srms.ac.in/SRMSERP/FeeAdmin/GetSession
  try {
    const data = await srmsPost('FeeAdmin/GetSession', { colgcd: cd, colg_cd: cd });
    if (Array.isArray(data) && data.length > 0) {
      return NextResponse.json(data);
    }
  } catch (error: any) {
    console.warn('[API /api/srms/sessions] SRMS live portal fetch error:', error?.message);
  }

  // 2. Dynamic Fallback to PostgreSQL via NestJS backend
  try {
    const res = await fetch(`${BACKEND_API}/college-master/sessions?tenant=${tenant}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      const list = json.data || json;
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list.map((s: any) => ({
          colg_cd: s.colg_cd || cd,
          session_cd: String(s.session_cd || s.code || s.name),
          session_name: s.name || s.session_name,
          active_flg: s.is_active ? '1' : '0',
          current_flg: s.is_current ? '1' : '0',
          paymentsession: 0,
        }));
        return NextResponse.json(mapped);
      }
    }
  } catch (backendErr: any) {
    console.warn('[API /api/srms/sessions] PostgreSQL backend fallback error:', backendErr?.message);
  }

  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const colgcd = String(body.colgcd || body.colg_cd || '').trim();
    const tenant = String(body.tenant || body.tenantSlug || '').trim();
    return handleGetSession(colgcd, tenant);
  } catch (error: any) {
    console.error('[API /api/srms/sessions] Error in POST:', error);
    return NextResponse.json([]);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const colgcd = String(searchParams.get('colgcd') || searchParams.get('colg_cd') || '').trim();
    const tenant = String(searchParams.get('tenant') || searchParams.get('tenantSlug') || '').trim();
    return handleGetSession(colgcd, tenant);
  } catch (error: any) {
    console.error('[API /api/srms/sessions] Error in GET:', error);
    return NextResponse.json([]);
  }
}
