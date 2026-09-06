const { Client } = require('pg');
const client = new Client({
  host: '34.236.107.120',
  port: 5433,
  user: 'unicampus',
  password: 'unicampus_dev@qsd!3ous',
  database: 'unicampus_erp'
});

async function main() {
  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';

  console.log('=== Checking faculty with TEACHING payroll_category or Faculty designation ===');
  const teachingStaff = await client.query(`
    SELECT f.id, f.emp_id, f.name, f.designation, f.staff_type, f.payroll_category, f.category, u.role as user_role
    FROM "${schema}".faculty f
    LEFT JOIN "${schema}".users u ON u.id::text = f.user_id::text
    WHERE (f.payroll_category ILIKE '%TEACH%' 
           OR f.designation ILIKE '%Faculty%' 
           OR f.designation ILIKE '%Professor%' 
           OR f.designation ILIKE '%Lecturer%')
      AND (f.staff_type = 'Staff' OR u.role = 'CLERK')
  `);
  console.log(`Found ${teachingStaff.rows.length} faculty incorrectly marked as Staff/CLERK:`);
  console.log(JSON.stringify(teachingStaff.rows, null, 2));

  await client.end();
}

main().catch(console.error);
