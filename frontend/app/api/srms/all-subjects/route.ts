import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function handleGetAllSubjectDetail(
  colgcd?: string,
  coursecd?: string,
  branchcd?: string,
  batchcd?: string,
  semcd?: string,
  tenantSlug?: string,
) {
  const cd = colgcd || '1';
  const crs = coursecd || '13';
  const br = branchcd || '1';
  const bat = batchcd || '2';
  const sem = semcd || '3';
  const tenant = tenantSlug || 'srms-cet-bareilly';

  // 1. Live SRMS ERP API: https://myportal.srms.ac.in/SRMSERP/AdminAttendance/GetAllSubjectDetail
  try {
    const payload = {
      colgcd: String(cd),
      coursecd: String(crs),
      branchcd: String(br),
      batchcd: String(bat),
      semcd: String(sem),
    };
    const data = await srmsPost('AdminAttendance/GetAllSubjectDetail', payload);
    if (Array.isArray(data) && data.length > 0) {
      return NextResponse.json(data);
    }
  } catch (error: any) {
    console.warn('[API /api/srms/all-subjects] SRMS live portal fetch error:', error?.message);
  }

  // 2. Dynamic Fallback to PostgreSQL via NestJS backend
  try {
    const res = await fetch(`${BACKEND_API}/admin-master/subjects?tenant=${tenant}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      const list = json.data || json;
      if (Array.isArray(list) && list.length > 0) {
        const filtered = list.filter((s: any) =>
          (!crs || s.course_cd === crs) &&
          (!br || s.branch_cd === br || s.department_id === br)
        );
        const mapped = (filtered.length > 0 ? filtered : list).map((s: any) => ({
          colg_cd: Number(cd),
          sub_cd: String(s.code || s.id),
          sub_name: s.name,
          mst_sub_name: `${s.name} ${s.type || 'THEORY'}`,
          sub_addinfo: s.code,
          course_cd: Number(crs),
          branch_cd: Number(br),
          batch_cd: Number(bat),
          sem_cd: Number(sem),
          elective_flg: 0,
          active_flg: s.is_active ? 1 : 0,
          Sub_flg: 1,
          course_name: s.course_name || 'BCA',
          batch_name: '2025',
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
    const tenant = String(body.tenant || body.tenantSlug || '').trim();
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
    const tenant = String(searchParams.get('tenant') || searchParams.get('tenantSlug') || '').trim();
    return handleGetAllSubjectDetail(colgcd, coursecd, branchcd, batchcd, semcd, tenant);
  } catch (error: any) {
    console.error('[API /api/srms/all-subjects] Error in GET:', error);
    return NextResponse.json([]);
  }
}
