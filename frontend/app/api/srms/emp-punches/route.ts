import { NextRequest, NextResponse } from 'next/server';

async function fetchAndFormatPunches(empid: string, DEVICECD: string) {
  try {
    const response = await fetch('https://myportal.srms.ac.in/ops/Home/GetEmpInOutTime', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
      body: JSON.stringify({
        empid,
        DEVICECD,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `SRMS Attendance API responded with status ${response.status}`,
          data: [],
        },
        { status: response.status }
      );
    }

    const rawData = await response.json();
    const list: any[] = Array.isArray(rawData) ? rawData : [];

    // Current date in Indian Standard Time (IST, UTC+05:30)
    const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    // Parse and format attendance records
    const formatted = list.map((item: any) => {
      let timestamp = Date.now();
      if (item.logdate) {
        const match = String(item.logdate).match(/\d+/);
        if (match) timestamp = parseInt(match[0], 10);
      }
      const dateObj = new Date(timestamp);
      // Format date in IST so it does not shift backward into UTC
      const dateStr = dateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const displayDate = dateObj.toLocaleDateString('en-US', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const dayName = dateObj.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' });

      const punchlogsStr = String(item.punchlogs || '').trim();
      const hasPunches = Boolean(punchlogsStr && punchlogsStr.toLowerCase() !== 'no punch marked' && punchlogsStr.length > 0);

      let punches: Array<{ time: string; rawTime: string; device: string }> = [];
      let punchIn = '--';
      let punchOut = '--';
      let device = 'SRMS Biometric Common Device';

      if (hasPunches) {
        const punchParts = punchlogsStr.split(',').map((p) => p.trim()).filter(Boolean);
        punches = punchParts.map((p) => {
          const timeMatch = p.match(/^([0-9]{1,2}:[0-9]{2}(?::[0-9]{2})?)/);
          const devMatch = p.match(/\{([^}]+)\}/);
          const rawTime = timeMatch ? timeMatch[1] : p;
          const devName = devMatch ? devMatch[1] : 'CET Biometric Device';

          // Format 12-hour time
          let formattedTime = rawTime;
          try {
            const [hh, mm, ss] = rawTime.split(':').map(Number);
            const d = new Date();
            d.setHours(hh, mm, ss || 0);
            formattedTime = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
          } catch {}

          return {
            time: formattedTime,
            rawTime,
            device: devName,
          };
        });

        if (punches.length > 0) {
          punchIn = punches[0].time;
          device = punches[0].device;
        }
        if (punches.length > 1) {
          punchOut = punches[punches.length - 1].time;
        }
      }

      const isToday = dateStr === todayIST;
      const isUpcoming = dateStr > todayIST;

      let status = 'No Punch Marked';
      if (hasPunches) {
        status = punches.length > 1 ? 'Shift Completed' : 'Present / On Duty';
      } else if (isToday) {
        status = 'Ready to Punch';
      } else if (isUpcoming) {
        status = 'Upcoming Cycle Day';
      } else if (dayName === 'Sun') {
        status = 'Weekend / Sunday';
      } else {
        status = item.attsts && item.attsts !== 'N.A' ? item.attsts : 'Absent / No Punch';
      }

      const rawIn = String(item.intime || '').trim();
      const rawOut = String(item.outtime || '').trim();
      const cleanIn = rawIn && !rawIn.toLowerCase().includes('not processed') && rawIn !== 'N.A' ? rawIn : punchIn;
      const cleanOut = rawOut && !rawOut.toLowerCase().includes('not processed') && rawOut !== 'N.A' ? rawOut : punchOut;

      return {
        logdate: item.logdate,
        timestamp,
        date: dateStr,
        displayDate,
        dayName,
        isToday,
        isUpcoming,
        attsts: item.attsts || 'N.A',
        intime: cleanIn,
        outtime: cleanOut,
        punchlogs: punchlogsStr,
        hasPunches,
        punches,
        punchIn,
        punchOut,
        totalPunches: punches.length,
        status,
        device,
      };
    });

    // Locate today's exact record in the billing/attendance cycle
    const todayRecord = formatted.find((d) => d.date === todayIST) || null;

    // Order data so today and elapsed cycle days come first (newest to oldest), followed by upcoming cycle days
    const pastAndToday = formatted.filter((d) => d.date <= todayIST).sort((a, b) => b.date.localeCompare(a.date));
    const upcoming = formatted.filter((d) => d.date > todayIST).sort((a, b) => a.date.localeCompare(b.date));
    const sortedRecords = [...pastAndToday, ...upcoming];

    return NextResponse.json({
      success: true,
      empid,
      devicecd: DEVICECD,
      todayDate: todayIST,
      totalDays: sortedRecords.length,
      today: todayRecord || sortedRecords[0] || null,
      data: sortedRecords,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Error fetching biometric attendance punches',
        data: [],
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const empid = String(searchParams.get('empid') || searchParams.get('emp_id') || request.cookies.get('empid')?.value || request.cookies.get('emp_id')?.value || 'T/99/1203').trim();
  const DEVICECD = String(searchParams.get('DEVICECD') || searchParams.get('devicecd') || request.cookies.get('devicecd')?.value || '30103').trim();
  return fetchAndFormatPunches(empid, DEVICECD);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const empid = String(body.empid || body.emp_id || request.cookies.get('empid')?.value || request.cookies.get('emp_id')?.value || 'T/99/1203').trim();
  const DEVICECD = String(body.DEVICECD || body.devicecd || request.cookies.get('devicecd')?.value || '30103').trim();
  return fetchAndFormatPunches(empid, DEVICECD);
}
