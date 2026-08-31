const { Client } = require('pg');

async function deleteAafreenResult() {
  const client = new Client({
    host: '34.236.107.120', port: 5433,
    user: 'unicampus', password: 'unicampus_dev@qsd!3ous',
    database: 'unicampus_erp',
  });
  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';

  // Show record before delete
  const before = await client.query(`
    SELECT r.id, st.name as student_name, st.rollno, 
           p.code as paper_code, p.name as paper_name,
           r.marks_obtained, r.practical_mark
    FROM "${schema}".student_results r
    LEFT JOIN "${schema}".students st ON r.student_id::text = st.id::text
    LEFT JOIN "${schema}".examination_papers p ON r.paper_id::text = p.id::text
    WHERE st.name ILIKE '%AAFREEN%'
  `);
  
  console.log('Records found for AAFREEN:');
  console.table(before.rows);

  if (before.rows.length === 0) {
    console.log('No records found for AAFREEN. Nothing to delete.');
    await client.end();
    return;
  }

  // Delete all result records for Aafreen Khan
  const del = await client.query(`
    DELETE FROM "${schema}".student_results
    WHERE student_id::text IN (
      SELECT id::text FROM "${schema}".students WHERE name ILIKE '%AAFREEN%'
    )
  `);
  console.log(`\n✅ Deleted ${del.rowCount} result record(s) for AAFREEN KHAN.`);

  // Verify deletion
  const after = await client.query(`
    SELECT COUNT(*) as remaining FROM "${schema}".student_results r
    LEFT JOIN "${schema}".students st ON r.student_id::text = st.id::text
    WHERE st.name ILIKE '%AAFREEN%'
  `);
  console.log(`Remaining records for AAFREEN: ${after.rows[0].remaining}`);

  await client.end();
}

deleteAafreenResult().catch(console.error);
