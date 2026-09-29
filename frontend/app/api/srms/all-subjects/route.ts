import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';
import { queryDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_API = (process.env.BACKEND_BASE_URL ? `${process.env.BACKEND_BASE_URL}/api/v1` : '') || (process.env.NEXT_PUBLIC_API_URL?.startsWith('http') ? process.env.NEXT_PUBLIC_API_URL : 'http://100.63.22.73:8081/api/v1');

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

async function handleGetAllSubjectDetail(
  colgcd?: string,
  coursecd?: string,
  branchcd?: string,
  batchcd?: string,
  semcd?: string,
  tenantSlug?: string,
) {
  const cd = colgcd || '1';
  const crs = coursecd || '';
  const br = branchcd || '';
  const bat = batchcd || '';
  const sem = semcd || '';

  let targetSlug = (tenantSlug || '').toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');
  if (!targetSlug || targetSlug === '1' || targetSlug === '2' || targetSlug === '11') {
    try {
      const tRows = await queryDb<any>(`SELECT slug FROM public.tenants WHERE code = $1 OR slug = $1 OR id::text = $1 LIMIT 1`, [cd]);
      if (tRows.length > 0 && tRows[0].slug) {
        targetSlug = tRows[0].slug;
      }
    } catch {}
    if (!targetSlug) {
      targetSlug = 'srms-cet-bareilly';
    }
  }
  const schema = `tenant_${targetSlug}`;
  const isSrmsTenant = targetSlug.startsWith('srms');

  // 1. Direct PostgreSQL query to tenant's subjects table FIRST
  try {
    const dbSubjects = await queryDb<any>(
      `SELECT DISTINCT
         s.id,
         COALESCE(s.code, s.subject_code, s.id::text)::text AS sub_cd,
         s.name AS sub_name,
         COALESCE(s.type, 'THEORY') AS type,
         s.course_cd,
         s.branch_cd,
         s.department_id,
         s.semester,
         s.is_active
       FROM "${schema}".subjects s
       WHERE ($1 = '' OR s.course_cd::text = $1::text OR s.course_id::text = $1::text)
         AND ($2 = '' OR s.branch_cd::text = $2::text OR s.department_id::text = $2::text)
       ORDER BY sub_name ASC`,
      [crs, br]
    );

    if (Array.isArray(dbSubjects) && dbSubjects.length > 0) {
      const mapped = dbSubjects.map((s: any) => ({
        colg_cd: Number(cd) || 1,
        sub_cd: String(s.sub_cd || s.id),
        sub_name: s.sub_name,
        mst_sub_name: `${s.sub_name} ${s.type || 'THEORY'}`,
        sub_addinfo: s.sub_cd,
        course_cd: Number(crs) || 1,
        branch_cd: Number(br) || 1,
        batch_cd: Number(bat) || 1,
        sem_cd: Number(sem) || 1,
        elective_flg: 0,
        active_flg: s.is_active ? 1 : 0,
        Sub_flg: 1,
        course_name: s.course_name || '',
        batch_name: bat || '',
        branch_name: s.department_name || '',
        semester_name: String(sem || s.semester || ''),
        ElectiveSts: 'N',
        ActiveSts: s.is_active ? 'Y' : 'N',
        SubTyp: s.type || 'THEORY',
      }));
      return NextResponse.json(mapped);
    }
  } catch (dbErr: any) {
    console.warn(`[API /api/srms/all-subjects] PostgreSQL direct query error on ${schema}:`, dbErr?.message);
  }

  // 2. Dynamic Fallback to PostgreSQL via NestJS backend
  try {
    const res = await fetch(`${BACKEND_API}/admin-master/subjects?tenant=${encodeURIComponent(targetSlug)}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      const list = json.data || json;
      if (Array.isArray(list) && list.length > 0) {
        const filtered = list.filter((s: any) =>
          (!crs || String(s.course_cd) === String(crs) || String(s.course_id) === String(crs)) &&
          (!br || String(s.branch_cd) === String(br) || String(s.department_id) === String(br))
        );
        const mapped = (filtered.length > 0 ? filtered : list).map((s: any) => ({
          colg_cd: Number(cd) || 1,
          sub_cd: String(s.code || s.id),
          sub_name: s.name,
          mst_sub_name: `${s.name} ${s.type || 'THEORY'}`,
          sub_addinfo: s.code,
          course_cd: Number(crs) || 1,
          branch_cd: Number(br) || 1,
          batch_cd: Number(bat) || 1,
          sem_cd: Number(sem) || 1,
          elective_flg: 0,
          active_flg: s.is_active ? 1 : 0,
          Sub_flg: 1,
          course_name: s.course_name || '',
          batch_name: bat || '',
          branch_name: s.department_name || '-',
          semester_name: String(sem),
          ElectiveSts: 'N',
          ActiveSts: s.is_active ? 'Y' : 'N',
          SubTyp: s.type || 'THEORY',
        }));
        return NextResponse.json(mapped);
      }
    }
  } catch (backendErr: any) {
    console.warn('[API /api/srms/all-subjects] PostgreSQL backend fallback error:', backendErr?.message);
  }

  // 3. Live SRMS ERP API: ONLY for SRMS tenants!
  if (isSrmsTenant) {
    try {
      const payload = {
        colgcd: String(cd),
        coursecd: String(crs || '13'),
        branchcd: String(br || '1'),
        batchcd: String(bat || '2'),
        semcd: String(sem || '3'),
      };
      const data = await srmsPost('AdminAttendance/GetAllSubjectDetail', payload);
      if (Array.isArray(data) && data.length > 0) {
        return NextResponse.json(data);
      }
    } catch (error: any) {
      console.warn('[API /api/srms/all-subjects] SRMS live portal fetch error:', error?.message);
    }
  }

  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const colgcd = String(body.colgcd || body.colg_cd || '').trim();
    const coursecd = String(body.coursecd || body.course_cd || '').trim();
    const branchcd = String(body.branchcd || body.branch_cd || '').trim();
    const batchcd = String(body.batchcd || body.batch_cd || '').trim();
    const semcd = String(body.semcd || body.sem_cd || '').trim();
    const tenant = resolveTenantFromReq(req, String(body.tenant || body.tenantSlug || '').trim());
    return handleGetAllSubjectDetail(colgcd, coursecd, branchcd, batchcd, semcd, tenant);
  } catch (error: any) {
    console.error('[API /api/srms/all-subjects] Error in POST:', error);
    return NextResponse.json([]);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const colgcd = String(searchParams.get('colgcd') || searchParams.get('colg_cd') || '').trim();
    const coursecd = String(searchParams.get('coursecd') || searchParams.get('course_cd') || '').trim();
    const branchcd = String(searchParams.get('branchcd') || searchParams.get('branch_cd') || '').trim();
    const batchcd = String(searchParams.get('batchcd') || searchParams.get('batch_cd') || '').trim();
    const semcd = String(searchParams.get('semcd') || searchParams.get('sem_cd') || '').trim();
    const tenant = resolveTenantFromReq(req, String(searchParams.get('tenant') || searchParams.get('tenantSlug') || '').trim());
    return handleGetAllSubjectDetail(colgcd, coursecd, branchcd, batchcd, semcd, tenant);
  } catch (error: any) {
    console.error('[API /api/srms/all-subjects] Error in GET:', error);
    return NextResponse.json([]);
  }
}

