const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function syncSrmsAttendance() {
  const schema = 'tenant_srms-cet-bareilly';

  console.log('Fetching live attendance from SRMS portal API...');

  const totPayload = {
    batch_cd: 2,
    colg_cd: 1,
    course_cd: 13,
    branch_cd: 1,
  };

  try {
    const totRes = await fetch('https://myportal.srms.ac.in/srmserp/Student/Get_stud_Tot_att', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(totPayload),
    });

    if (!totRes.ok) {
      console.log('SRMS API failed with status:', totRes.status);
      return;
    }

    const totList = await totRes.json();
    console.log(`SRMS API returned ${totList.length} attendance records!`);
    console.log('Sample SRMS attendance rows:', totList.slice(0, 5));

    // Let's ensure the `students` table has an `attendance_percentage` column (or update it)
    await pool.query(`
      ALTER TABLE "${schema}".students
      ADD COLUMN IF NOT EXISTS attendance_percentage NUMERIC DEFAULT 0;
    `);

    let updatedCount = 0;
    for (const item of totList) {
      const regNo = String(item.stud_reg_no || '').trim();
      const rawPct = String(item.TotalPresentPercentage || '0').replace('%', '').trim();
      const pct = parseFloat(rawPct) || 0;

      if (regNo) {
        const updateRes = await pool.query(`
          UPDATE "${schema}".students
          SET attendance_percentage = $1
          WHERE registration_no = $2 OR rollno = $2
        `, [pct, regNo]);

        if (updateRes.rowCount > 0) {
          updatedCount++;
        }
      }
    }

    console.log(`Successfully stored/updated attendance for ${updatedCount} students in PostgreSQL ${schema}.students!`);

    // Verify stored student attendance
    const sample = await pool.query(`
      SELECT name, rollno, registration_no, attendance_percentage
      FROM "${schema}".students
      WHERE attendance_percentage > 0
      ORDER BY attendance_percentage DESC
      LIMIT 10
    `);
    console.log('\nTop 10 Students by Real SRMS Attendance in DB:');
    sample.rows.forEach(r => {
      console.log(`- ${r.name} (Reg: ${r.registration_no}): ${r.attendance_percentage}%`);
    });

  } catch (err) {
    console.error('Error fetching/storing SRMS attendance:', err);
  } finally {
    await pool.end();
  }
}

syncSrmsAttendance().catch(console.error);
