const { Client } = require('pg');

async function testGroupLinker() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/mederp'
  });
  await client.connect();

  try {
    // 1. Get Group A id from srms-ims schema
    const groupRes = await client.query('SELECT id, code, name FROM "tenant_srms-ims".groups_master WHERE code = $1 LIMIT 1', ['A']);
    if (groupRes.rows.length === 0) {
      console.log('Group A not found');
      return;
    }
    const groupA = groupRes.rows[0];
    console.log('Found Group A:', groupA);

    // 2. Fetch active students in srms-ims schema
    const studentsRes = await client.query('SELECT id, first_name, last_name FROM "tenant_srms-ims".students ORDER BY created_at ASC LIMIT 3');
    console.log(`Found ${studentsRes.rows.length} students:`, studentsRes.rows);

    const studentIds = studentsRes.rows.map(s => s.id);

    // 3. Perform bulk link on student_admissions
    for (const studentId of studentIds) {
      await client.query(`
        UPDATE "tenant_srms-ims".student_admissions
        SET group_id = $1, group_code = $2, group_name = $3, updated_at = NOW()
        WHERE student_id = $4
      `, [groupA.id, groupA.code, groupA.name, studentId]);
    }
    console.log(`Successfully assigned Group ${groupA.code} (${groupA.name}) to ${studentIds.length} students!`);

    // 4. Verify assigned admissions
    const checkRes = await client.query(`
      SELECT s.first_name, s.last_name, sa.group_id, sa.group_code, sa.group_name
      FROM "tenant_srms-ims".students s
      JOIN "tenant_srms-ims".student_admissions sa ON sa.student_id = s.id
      WHERE sa.group_id IS NOT NULL
    `);
    console.log('Admissions with assigned groups:', checkRes.rows);
  } catch (err) {
    console.error('Test group linker failed:', err);
  } finally {
    await client.end();
  }
}

testGroupLinker();
