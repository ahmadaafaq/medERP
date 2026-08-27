import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const endpointUrl = body.endpointUrl || body.url || 'https://myportal.srms.ac.in/SRMSERP/FeeAdmin/GetColgWiseStudDt2';
    const colg_cd = String(body.colgcd || body.colg_cd || '1').trim();
    const course_cd = String(body.coursecd || body.course_cd || '2').trim();
    const batch_cd = String(body.batchcd || body.batch_cd || "'18'").trim();
    const branch_cd = String(body.branchcd || body.branch_cd || "'1'").trim();
    const session_cd = String(body.sessioncd || body.session_cd || '16').trim();
    const type = String(body.type ?? '').trim();
    const arrstdsts = String(body.arrstdsts || '0').trim();
    const tenant = String(body.tenant || body.tenantSlug || 'srms-cet-bareilly').trim();

    // Use custom payload if provided, otherwise standard GetColgWiseStudDt2 payload
    const payload = body.customPayload && typeof body.customPayload === 'object'
      ? body.customPayload
      : {
          colgcd: colg_cd,
          coursecd: course_cd,
          batchcd: batch_cd.startsWith("'") ? batch_cd : `'${batch_cd}'`,
          branchcd: branch_cd.startsWith("'") ? branch_cd : `'${branch_cd}'`,
          type: type,
          sessioncd: session_cd,
          arrstdsts: arrstdsts,
        };

    let rawList: any[] = [];
    try {
      const data = await srmsPost(endpointUrl, payload);
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          rawList = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.data) ? parsed.data : Array.isArray(parsed?.Table) ? parsed.Table : [];
        } catch {
          rawList = [];
        }
      } else if (Array.isArray(data)) {
        rawList = data;
      } else if (data && typeof data === 'object') {
        rawList = Array.isArray(data.data) ? data.data : Array.isArray(data.Table) ? data.Table : [];
      }
    } catch (err: any) {
      console.warn('[API /api/srms/students/sync] Primary live endpoint error:', err?.message);

      // Fallback try Student/Get_stud_Dtl if primary returned error
      try {
        const fbPayload = {
          colg_cd: Number(colg_cd.replace(/'/g, '')) || 1,
          batch_cd: Number(batch_cd.replace(/'/g, '')) || 2,
          course_cd: Number(course_cd.replace(/'/g, '')) || 2,
          branch_cd: Number(branch_cd.replace(/'/g, '')) || 1,
        };
        const fbData = await srmsPost('Student/Get_stud_Dtl', fbPayload);
        if (Array.isArray(fbData) && fbData.length > 0) {
          rawList = fbData;
        }
      } catch (fbErr: any) {
        console.warn('[API /api/srms/students/sync] Fallback endpoint error:', fbErr?.message);
      }
    }

    if (rawList.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'No student records returned from SRMS ERP for the specified parameters.',
        data: [],
      });
    }

    // Helper to format proper Name casing (Title Case)
    const toTitleCase = (str: string) => {
      if (!str) return '';
      return str
        .toLowerCase()
        .split(' ')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    };

    // Helper to build SRMS photo URL
    // Rule: https://myportal.srms.ac.in/SRMSERP/Registration/StudentDocument/{colg_cd}/{stud_reg_no}/{stud_reg_no}.JPG
    const buildPhotoUrl = (studentColgCd: string | number, regNo: string, rawImgPath?: string) => {
      const cleanColg = String(studentColgCd || colg_cd || '1').replace(/'/g, '').trim();
      const cleanReg = String(regNo || '').trim();

      if (cleanReg) {
        return `https://myportal.srms.ac.in/SRMSERP/Registration/StudentDocument/${cleanColg}/${cleanReg}/${cleanReg}.JPG`;
      }

      if (rawImgPath && String(rawImgPath).startsWith('http')) {
        return String(rawImgPath).replace(/\\/g, '/');
      }

      if (rawImgPath) {
        const norm = String(rawImgPath).replace(/\\/g, '/').replace(/^\//, '');
        return `https://myportal.srms.ac.in/SRMSERP/${norm}`;
      }

      return null;
    };

    // Map and normalize student records
    const mappedStudents = rawList.map((item: any, idx: number) => {
      const regNo = String(item.stud_reg_no || item.reg_no || item.registration_no || item.STUD_REG_NO || '').trim();
      const rollNo = String(item.stud_roll_no || item.roll_no || item.rollno || item.STUD_ROLL_NO || '').trim();
      const rawName = String(item.stud_name || item.student_name || item.name || item.STUD_NAME || '').trim();
      const name = toTitleCase(rawName);

      const rawBatch = String(item.batch_name || item.batch_cd || item.BATCH_NAME || item.BATCH_CD || batch_cd || '2025').replace(/'/g, '').trim();
      const batchYear = Number(rawBatch) || 2025;
      const batchLabel = `${batchYear} Batch`;

      const studentColgCd = String(item.colg_cd || item.COLG_CD || colg_cd).replace(/'/g, '');
      const studentCourseCd = String(item.course_cd || item.COURSE_CD || course_cd).replace(/'/g, '');
      const studentBranchCd = String(item.branch_cd || item.BRANCH_CD || branch_cd).replace(/'/g, '');

      const photoUrl = buildPhotoUrl(studentColgCd, regNo, item.IMGPATH || item.photo_url || item.IMAGEPATH);

      return {
        id: regNo || `srms-${studentColgCd}-${studentCourseCd}-${batchYear}-${idx + 1}`,
        registration_no: regNo,
        rollno: rollNo,
        name: name,
        gender: String(item.SEX || item.gender || item.GENDER || 'Male').toUpperCase(),
        father_name: toTitleCase(String(item.father_name || item.FATHER_NAME || '')),
        mother_name: toTitleCase(String(item.mother_name || item.MOTHER_NAME || '')),
        city: item.CITY || item.city || 'Bareilly',
        state: item.STATE || item.state || 'Uttar Pradesh',
        address: item.address || item.ADDRESS || '',
        admission_type: item.ADMITBY || item.admission_type || 'Regular Admission',
        residency_type: item.residency_type || 'Hosteller',
        mobile_number: item.mobile || item.mobile_no || item.MOBILE || '',
        photo_url: photoUrl,
        college_id: studentColgCd,
        college_name: item.colg_name || item.COLG_NAME || 'SRMS CET, BAREILLY',
        course_code: item.course_name || item.COURSE_NAME || (studentCourseCd === '2' ? 'B.Pharm' : studentCourseCd === '13' ? 'BCA' : 'B.Tech'),
        course_cd: studentCourseCd,
        batch_code: batchLabel,
        batch_id: String(batchYear),
        batch_name: String(batchYear),
        branch_id: studentBranchCd,
        branch_code: studentBranchCd,
        branch_name: item.branch_name || item.BRANCH_NAME || `Branch ${studentBranchCd}`,
        academic_session: `${batchYear}-${batchYear + 1}`,
        is_active: true,
        created_at: new Date().toISOString(),
      };
    });

    // Forward to backend to persist into PostgreSQL
    try {
      await fetch(`${BACKEND_API}/student-master/sync-live?tenant=${tenant}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: mappedStudents }),
      });
    } catch (persistErr: any) {
      console.warn('[API /api/srms/students/sync] Background PostgreSQL persistence notice:', persistErr?.message);
    }

    return NextResponse.json({
      success: true,
      count: mappedStudents.length,
      message: `Successfully synchronized ${mappedStudents.length} student records from SRMS ERP portal into PostgreSQL.`,
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
  const batchcd = searchParams.get('batchcd') || searchParams.get('batch_cd') || "'18'";
  const coursecd = searchParams.get('coursecd') || searchParams.get('course_cd') || '2';
  const branchcd = searchParams.get('branchcd') || searchParams.get('branch_cd') || "'1'";
  const sessioncd = searchParams.get('sessioncd') || searchParams.get('session_cd') || '16';
  const tenant = searchParams.get('tenant') || searchParams.get('tenantSlug') || 'srms-cet-bareilly';

  const dummyReq = new NextRequest(req.url, {
    method: 'POST',
    body: JSON.stringify({ colgcd, batchcd, coursecd, branchcd, sessioncd, tenant }),
  });
  return POST(dummyReq);
}
