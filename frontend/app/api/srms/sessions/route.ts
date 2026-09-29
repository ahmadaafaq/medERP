import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';
import { queryDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

const BACKEND_API = (process.env.BACKEND_BASE_URL ? `${process.env.BACKEND_BASE_URL}/api/v1` : '') || (process.env.NEXT_PUBLIC_API_URL?.startsWith('http') ? process.env.NEXT_PUBLIC_API_URL : 'http://100.63.22.73:8081/api/v1');

const srmsCollegeSlugMap: Record<string, string> = {
  '1': 'srms-cet-bareilly',
  '2': 'srms-cetr-bareilly',
  '11': 'srms-cet-unnao',
};

function resolveTenantFromReq(req: NextRequest, bodyOrParamTenant?: string): string {
  if (bodyOrParamTenant && bodyOrParamTenant.trim() && bodyOrParamTenant !== 'undefined' && bodyOrParamTenant !== 'null') {
    return bodyOrParamTenant.trim();
  }
  const urlTenant = req.nextUrl.searchParams.get('tenant') || req.nextUrl.searchParams.get('tenantSlug');
  if (urlTenant && urlTenant.trim() && urlTenant !== 'undefined' && urlTenant !== 'null') {
    return urlTenant.trim();
  }
  const headerTenant = req.headers.get('x-tenant-slug');
  if (headerTenant && headerTenant.trim()) {
    return headerTenant.trim();
  }
  const cookieTenant = req.cookies.get('auth_tenant')?.value || req.cookies.get('tenantSlug')?.value || req.cookies.get('selectedTenant')?.value;
  if (cookieTenant && cookieTenant.trim()) {
    return cookieTenant.trim();
  }
  return '';
}

async function handleGetSession(colgcd?: string, tenantSlug?: string) {
  const cd = colgcd || '1';
  let targetSlug = (tenantSlug || '').toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');
  if (!targetSlug || targetSlug === '1' || targetSlug === '2' || targetSlug === '11') {
    try {
      const tRows = await queryDb<any>(`SELECT slug FROM public.tenants WHERE code = $1 OR slug = $1 OR id::text = $1 LIMIT 1`, [cd]);
      if (tRows.length > 0 && tRows[0].slug) {
        targetSlug = tRows[0].slug;
      }
    } catch {}
    if (!targetSlug) {
      targetSlug = srmsCollegeSlugMap[cd] || 'srms-cet-bareilly';
    }
  }
  if (targetSlug === 'srms-cet') targetSlug = 'srms-cet-bareilly';
  if (targetSlug === 'srms-cetr') targetSlug = 'srms-cetr-bareilly';
  const schema = `tenant_${targetSlug}`;
  const isSrmsTenant = targetSlug.startsWith('srms');

  // 1. Direct PostgreSQL query to tenant schema sessions
  try {
    const dbSessions = await queryDb<any>(
      `SELECT DISTINCT
         COALESCE(s.session_cd, s.code, s.id::text)::text AS session_cd,
         COALESCE(s.name, s.session_name, s.code)::text AS session_name,
         s.is_current,
         s.is_active
       FROM "${schema}".sessions s
       ORDER BY session_name DESC`
    );

    if (Array.isArray(dbSessions) && dbSessions.length > 0) {
      const mapped = dbSessions.map((s: any) => ({
        colg_cd: cd,
        session_cd: String(s.session_cd),
        code: String(s.session_cd),
        session_name: s.session_name,
        name: s.session_name,
        active_flg: s.is_active ? '1' : '0',
        current_flg: s.is_current ? '1' : '0',
        paymentsession: 0,
      }));
      return NextResponse.json(mapped);
    }
  } catch (dbErr: any) {
    console.warn(`[API /api/srms/sessions] PostgreSQL direct query error on ${schema}:`, dbErr?.message);
  }

  // 2. Dynamic Fallback to NestJS backend
  try {
    const res = await fetch(`${BACKEND_API}/college-master/sessions?tenant=${encodeURIComponent(targetSlug)}`, {
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
          code: String(s.session_cd || s.code || s.name),
          session_name: s.name || s.session_name,
          name: s.name || s.session_name,
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

  // 3. Live SRMS ERP API: ONLY for SRMS tenants!
  if (isSrmsTenant) {
    try {
      const data = await srmsPost('FeeAdmin/GetSession', { colgcd: cd, colg_cd: cd });
      if (Array.isArray(data) && data.length > 0) {
        return NextResponse.json(data);
      }
    } catch (error: any) {
      console.warn('[API /api/srms/sessions] SRMS live portal fetch error:', error?.message);
    }
  }

  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const colgcd = String(body.colgcd || body.colg_cd || '').trim();
    const tenant = resolveTenantFromReq(req, String(body.tenant || body.tenantSlug || '').trim());
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
    const tenant = resolveTenantFromReq(req, String(searchParams.get('tenant') || searchParams.get('tenantSlug') || '').trim());
    return handleGetSession(colgcd, tenant);
  } catch (error: any) {
    console.error('[API /api/srms/sessions] Error in GET:', error);
    return NextResponse.json([]);
  }
}

