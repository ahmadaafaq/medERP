import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const colg_cd = String(body.colgcd || body.colg_cd || '1').trim();
    const batch_cd = String(body.batchcd || body.batch_cd || '2').trim();
    const course_cd = String(body.coursecd || body.course_cd || '13').trim();
    const branch_cd = String(body.branchcd || body.branch_cd || '1').trim();
    const tenant = String(body.tenant || body.tenantSlug || 'srms-cet-bareilly').trim();

    // 1. Live SRMS ERP API: http://myportal.srms.ac.in/srmserp/Student/Get_stud_Dtl
    const payload = {
      colg_cd: Number(colg_cd) || 1,
      batch_cd: Number(batch_cd) || 2,
      course_cd: Number(course_cd) || 13,
      branch_cd: Number(branch_cd) || 1,
    };

    let rawList: any[] = [];
    try {
      const data = await srmsPost('Student/Get_stud_Dtl', payload);
      if (Array.isArray(data) && data.length > 0) {
        rawList = data;
      }
    } catch (err: any) {
      console.warn('[API /api/srms/students/sync] SRMS live portal error:', err?.message);
    }

    if (rawList.length === 0) {
      return NextResponse.json({ success: true, count: 0, data: [] });
    }

    // 2. Map and normalize student records
    const mappedStudents = rawList.map((item: any, idx: number) => {
      // Normalize backslashes in image URL
      let photoUrl = String(item.IMGPATH || '').trim();
      if (photoUrl) {
        photoUrl = photoUrl.replace(/\\/g, '/');
      }

      const regNo = String(item.stud_reg_no || '').trim();
      const rollNo = String(item.stud_roll_no || '').trim();
      const name = String(item.stud_name || '').trim();
      const batchYear = String(item.batch_name || item.batch_cd || '2025').trim();
      const batchLabel = batchYear.includes('Batch') ? batchYear : `${batchYear} Batch`;

      return {
        id: regNo || `srms-${colg_cd}-${course_cd}-${batch_cd}-${idx + 1}`,
        registration_no: regNo,
        rollno: rollNo,
        name: name,
        gender: String(item.SEX || 'Male').toUpperCase(),
        father_name: item.father_name || '',
        mother_name: item.mother_name || '',
        city: item.CITY || '',
        state: item.STATE || '',
        address: item.address || '',
        admission_type: item.ADMITBY || 'Regular Admission',
        residency_type: 'Hosteller',
        mobile_number: item.mobile || '',
        photo_url: photoUrl,
        college_id: String(item.colg_cd || colg_cd),
        college_name: item.colg_name || 'SRMS CET, BAREILLY',
        course_code: item.course_name || 'BCA',
        course_cd: String(item.course_cd || course_cd),
        batch_code: batchLabel,
        batch_id: String(item.batch_cd || batch_cd),
        batch_name: batchYear,
        branch_id: String(item.branch_cd || branch_cd),
        branch_code: String(item.branch_cd || branch_cd),
        academic_session: `${Number(batchYear) || 2025}-${(Number(batchYear) || 2025) + 1}`,
        is_active: true,
        created_at: new Date().toISOString(),
      };
    });

    // 3. Forward to backend to persist into PostgreSQL in background
    try {
      fetch(`${BACKEND_API}/student-master/sync-live?tenant=${tenant}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: mappedStudents }),
      }).catch(() => null);
    } catch {}

    return NextResponse.json({
      success: true,
      count: mappedStudents.length,
      data: mappedStudents,
    });
  } catch (error: any) {
    console.error('[API /api/srms/students/sync] Error:', error);
    return NextResponse.json({ success: false, error: error?.message, data: [] }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const colgcd = searchParams.get('colgcd') || searchParams.get('colg_cd') || '1';
  const batchcd = searchParams.get('batchcd') || searchParams.get('batch_cd') || '2';
  const coursecd = searchParams.get('coursecd') || searchParams.get('course_cd') || '13';
  const branchcd = searchParams.get('branchcd') || searchParams.get('branch_cd') || '1';
  const tenant = searchParams.get('tenant') || searchParams.get('tenantSlug') || 'srms-cet-bareilly';

  const dummyReq = new NextRequest(req.url, {
    method: 'POST',
    body: JSON.stringify({ colgcd, batchcd, coursecd, branchcd, tenant }),
  });
  return POST(dummyReq);
}
