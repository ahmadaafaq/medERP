import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    // Default LocId: '7' (SRMS CET), LocId: '8' (SRMS CETR)
    const LocId = String(body.LocId || body.locId || '7');
    
    // Current date format YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];
    const date = body.date || todayStr;
    
    // punch_typ: '1' for Punch In, '2' for Punch Out
    const punch_typ = String(body.punch_typ || body.punch_type || '1');

    let list: any[] = [];

    if (LocId === 'ALL') {
      // Fetch across all known active SRMS campus locations in parallel
      const locIds = ['1', '2', '4', '5', '6', '7', '8', '9', '10', '12', '14'];
      const results = await Promise.allSettled(
        locIds.map(async (loc) => {
          const res = await fetch('https://myportal.srms.ac.in/HR/HR/GetDailyPunchRpt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
            },
            body: JSON.stringify({ LocId: loc, date, punch_typ }),
            cache: 'no-store',
          });
          if (!res.ok) return [];
          const data = await res.json().catch(() => []);
          return Array.isArray(data) ? data : [];
        })
      );

      const seen = new Set<string>();
      for (const res of results) {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          for (const item of res.value) {
            const key = `${item.EmpID}_${item.PUNCHTIME}`;
            if (!seen.has(key)) {
              seen.add(key);
              list.push(item);
            }
          }
        }
      }
    } else {
      const srmsPayload = {
        LocId,
        date,
        punch_typ,
      };

      const response = await fetch('https://myportal.srms.ac.in/HR/HR/GetDailyPunchRpt', {
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
            message: `SRMS API responded with status ${response.status}`,
            data: [],
          },
          { status: response.status }
        );
      }

      const rawData = await response.json();
      list = Array.isArray(rawData) ? rawData : [];
    }

    // Clean and normalize staff records
    const processedList = list.map((item: any) => {
      const empId = String(item.EmpID || '').trim();
      const empName = String(item.EmpName || '').replace(/\s+/g, ' ').trim();
      const department = String(item.Department || 'GENERAL').replace(/\s+/g, ' ').trim();
      const designation = String(item.Designation || 'STAFF').replace(/\s+/g, ' ').trim();
      const mobile = String(item.PermanentTelNo || '').trim();
      const punchTime = String(item.PUNCHTIME || '').trim();
      const isPunched = punchTime.length > 0 && punchTime !== '0' && punchTime !== '-';

      return {
        EmpID: empId,
        EmpName: empName,
        Department: department,
        Designation: designation,
        PermanentTelNo: mobile,
        PUNCHTIME: punchTime,
        isPunched,
      };
    });

    // Sort: Punched records at the top, then alphabetically by name
    processedList.sort((a, b) => {
      if (a.isPunched && !b.isPunched) return -1;
      if (!a.isPunched && b.isPunched) return 1;
      return a.EmpName.localeCompare(b.EmpName);
    });

    const punchedCount = processedList.filter((x) => x.isPunched).length;
    const notPunchedCount = processedList.length - punchedCount;

    return NextResponse.json({
      success: true,
      LocId,
      date,
      punch_typ,
      totalCount: processedList.length,
      punchedCount,
      notPunchedCount,
      data: processedList,
    });
  } catch (error: any) {
    console.error('Error fetching SRMS Daily Punch Report:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal Server Error while fetching punch report',
        data: [],
      },
      { status: 500 }
    );
  }
}
