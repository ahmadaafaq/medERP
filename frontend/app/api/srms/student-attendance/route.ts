import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const colg_cd = Number(body.colg_cd || 1);
    const course_cd = Number(body.course_cd || 13);
    const branch_cd = Number(body.branch_cd || 1);
    const batch_cd = Number(body.batch_cd || 2);
    const sem_cd = Number(body.sem_cd || 3);
    const section_cd = Number(body.section_cd || 1);
    const fdt = body.fdt || '2026-07-02';
    const tdt = body.tdt || '2026-08-21';

    // 1. Fetch Subject-wise Attendance with SubCd from Get_stud_att_with_subCd
    const attPayload = {
      batch_cd,
      colg_cd,
      course_cd,
      branch_cd,
      sem_cd,
      section_cd,
      fdt,
      tdt,
    };

    const totPayload = {
      batch_cd,
      colg_cd,
      course_cd,
      branch_cd,
    };

    const [attRes, totRes] = await Promise.all([
      fetch('https://myportal.srms.ac.in/srmserp/Student/Get_stud_att_with_subCd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attPayload),
        cache: 'no-store',
      }),
      fetch('https://myportal.srms.ac.in/srmserp/Student/Get_stud_Tot_att', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(totPayload),
        cache: 'no-store',
      }),
    ]);

    const attList: any[] = attRes.ok ? await attRes.json() : [];
    const totList: any[] = totRes.ok ? await totRes.json() : [];

    // Map total percentage by stud_reg_no
    const totMap = new Map<string, string>();
    if (Array.isArray(totList)) {
      totList.forEach((item: any) => {
        if (item.stud_reg_no) {
          totMap.set(String(item.stud_reg_no).trim(), item.TotalPresentPercentage || '0.00%');
        }
      });
    }

    // Discover all unique subjects with sub_cd and sub_name
    const subjectMap = new Map<string, { sub_cd: string; sub_name: string }>();
    if (Array.isArray(attList)) {
      attList.forEach((stud: any) => {
        if (Array.isArray(stud.subjects)) {
          stud.subjects.forEach((sub: any) => {
            if (sub.sub_cd && sub.sub_name && !subjectMap.has(sub.sub_cd)) {
              subjectMap.set(sub.sub_cd, {
                sub_cd: String(sub.sub_cd),
                sub_name: String(sub.sub_name),
              });
            }
          });
        }
      });
    }

    const subjectList = Array.from(subjectMap.values());
    const subjectColumns = subjectList.map((s) => s.sub_name);

    // Flatten each student with dynamic subject properties and structured subjects array
    const students = Array.isArray(attList)
      ? attList.map((stud: any, idx: number) => {
          const regNo = String(stud.stud_reg_no || '').trim();
          const totPct = totMap.get(regNo) || '0.00%';

          const studentObj: Record<string, any> = {
            ...stud,
            s_no: idx + 1,
            TotalPresentPercentage: totPct,
            subjects: stud.subjects || [],
          };

          // Also set dynamic keys directly for table column mapping
          if (Array.isArray(stud.subjects)) {
            stud.subjects.forEach((sub: any) => {
              studentObj[sub.sub_name] = sub.attendance;
              studentObj[`sub_cd_${sub.sub_name}`] = sub.sub_cd;
            });
          }

          return studentObj;
        })
      : [];

    return NextResponse.json({
      success: true,
      data: students,
      subjectList,
      subjectColumns,
      count: students.length,
    });
  } catch (error: any) {
    console.error('[SRMS Student Attendance API Error]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch attendance', data: [], subjectList: [], subjectColumns: [] },
      { status: 500 }
    );
  }
}
