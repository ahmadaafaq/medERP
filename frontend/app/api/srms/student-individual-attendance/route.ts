import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const batch_cd = Number(body.batch_cd || 2);
    const colg_cd = Number(body.colg_cd || 1);
    const course_cd = Number(body.course_cd || 13);
    const branch_cd = Number(body.branch_cd || 1);
    const stud_reg_no = String(body.stud_reg_no || '2025107990');

    const payload = {
      batch_cd,
      colg_cd,
      course_cd,
      branch_cd,
      stud_reg_no,
    };

    const data = await srmsPost('Student/Get_stud_indi_Tot_att', payload);
    const item = Array.isArray(data) ? data[0] : data;

    const percentage =
      typeof item?.TotalPresentPercentage === 'number'
        ? item.TotalPresentPercentage
        : parseFloat(String(item?.TotalPresentPercentage || '0'));

    return NextResponse.json({
      success: true,
      data: {
        stud_reg_no: item?.stud_reg_no || stud_reg_no,
        stud_name: item?.stud_name || '',
        percentage: isNaN(percentage) ? 0 : percentage,
        formattedPercentage: isNaN(percentage) ? '0.00%' : `${percentage.toFixed(2)}%`,
      },
    });
  } catch (error: any) {
    console.error('[SRMS Individual Attendance API Error]', error);
    return NextResponse.json(
      { success: false, data: null, message: error.message || 'Failed to fetch individual attendance' },
      { status: 500 }
    );
  }
}
