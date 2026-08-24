import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Default LocId: '7' (SRMS CET), frmyr: current year, toyr: current year
    const currentYear = String(new Date().getFullYear());
    const LocId = String(body.LocId || body.locId || '7');
    const frmyr = String(body.frmyr || currentYear);
    const toyr = String(body.toyr || frmyr || currentYear);

    const srmsPayload = {
      LocId,
      frmyr,
      toyr,
    };

    const response = await fetch('https://myportal.srms.ac.in/HR/HR/GetLeaveView', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
      body: JSON.stringify(srmsPayload),
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `SRMS HR API responded with status ${response.status}`,
          data: [],
        },
        { status: response.status }
      );
    }

    const rawData = await response.json();
    const list: any[] = Array.isArray(rawData) ? rawData : [];

    // Clean & normalize records
    const processedList = list.map((item: any) => {
      const empId = String(item.EMPID || item.EmpID || '').trim();
      const empName = String(item.EMPNAME || item.EmpName || '').replace(/\s+/g, ' ').trim();
      const designation = String(item.Designation || 'Staff').replace(/\s+/g, ' ').trim();
      const department = String(item.Department || 'General').replace(/\s+/g, ' ').trim();
      const category = String(item.Categary || item.Category || 'General').replace(/\s+/g, ' ').trim();

      const month = Number(item.MNTH || 0);
      const year = Number(item.YR || item.Yr || currentYear);
      const workingDays = Number(item.WD || 0);
      const presentDays = Number(item.PP || 0);
      const casualLeave = Number(item.CL || 0);
      const sickLeave = Number(item.SL || 0);
      const earnedLeave = Number(item.EL || 0);
      const compOff = Number(item.CO || 0);
      const specialAllowance = Number(item.SPALL || 0);
      const leaveWithoutPay = Number(item.LWP || 0);

      const totalPaidLeave = casualLeave + sickLeave + earnedLeave + compOff + specialAllowance;
      const totalLeaves = totalPaidLeave + leaveWithoutPay;
      const attendancePct = workingDays > 0 ? Math.min(100, Math.round((presentDays / workingDays) * 100)) : 0;

      return {
        EMPID: empId,
        EMPNAME: empName,
        Designation: designation,
        Department: department,
        Categary: category,
        MNTH: month,
        YR: year,
        WD: workingDays,
        PP: presentDays,
        CL: casualLeave,
        SL: sickLeave,
        EL: earnedLeave,
        CO: compOff,
        SPALL: specialAllowance,
        LWP: leaveWithoutPay,
        totalPaidLeave,
        totalLeaves,
        attendancePct,
      };
    });

    return NextResponse.json({
      success: true,
      LocId,
      frmyr,
      toyr,
      totalRecords: processedList.length,
      data: processedList,
    });
  } catch (error: any) {
    console.error('Error in SRMS GetLeaveView API proxy:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal Server Error while fetching leave report',
        data: [],
      },
      { status: 500 }
    );
  }
}
