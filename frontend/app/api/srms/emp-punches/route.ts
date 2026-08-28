import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    // Extract empid and DEVICECD from request body, cookies, or default to logged-in admin
    const empid = String(body.empid || body.emp_id || request.cookies.get('empid')?.value || request.cookies.get('emp_id')?.value || 'T/99/1203').trim();
    const DEVICECD = String(body.DEVICECD || body.devicecd || request.cookies.get('devicecd')?.value || '30103').trim();

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

    // Parse and format attendance records
    const formatted = list.map((item: any) => {
      let timestamp = Date.now();
      if (item.logdate) {
        const match = String(item.logdate).match(/\d+/);
        if (match) timestamp = parseInt(match[0], 10);
      }
      const dateObj = new Date(timestamp);
      const dateStr = dateObj.toISOString().split('T')[0];
      const displayDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      const punchlogsStr = String(item.punchlogs || '').trim();
      const hasPunches = punchlogsStr && punchlogsStr.toLowerCase() !== 'no punch marked';

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

      const status = hasPunches
        ? punches.length > 1
          ? 'Completed Shift'
          : 'Present / In-Campus'
        : 'No Punch Marked';

      return {
        logdate: item.logdate,
        timestamp,
        date: dateStr,
        displayDate,
        dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        attsts: item.attsts || 'N.A',
        intime: item.intime?.trim() || punchIn,
        outtime: item.outtime?.trim() || punchOut,
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

    // Sort with latest date first
    formatted.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({
      success: true,
      empid,
      devicecd: DEVICECD,
      totalDays: formatted.length,
      today: formatted[0] || null,
      data: formatted,
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
