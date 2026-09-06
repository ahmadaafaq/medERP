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

  console.log('=== 1. Fixing Vinay Kumar specific records ===');
  const uRes = await client.query(`
    UPDATE "${schema}".users 
    SET role = 'FACULTY', updated_at = NOW() 
    WHERE id = '13527823-2f8b-4c6c-a1be-cb4b75d1c3af' 
       OR emp_id = '202616658' 
       OR email = 'vinayverma111.vk@gmail.com'
    RETURNING id, email, role, emp_id;
  `);
  console.log('Updated users:', uRes.rows);

  const fRes = await client.query(`
    UPDATE "${schema}".faculty 
    SET staff_type = 'Faculty', updated_at = NOW() 
    WHERE emp_id = '202616658' 
       OR email = 'vinayverma111.vk@gmail.com'
    RETURNING id, name, designation, staff_type, payroll_category;
  `);
  console.log('Updated faculty:', fRes.rows);

  const cgmRes = await client.query(`
    UPDATE "${schema}".chat_group_members 
    SET role = 'FACULTY' 
    WHERE user_id = '13527823-2f8b-4c6c-a1be-cb4b75d1c3af' 
       OR user_id = '202616658'
    RETURNING id, chat_group_id, user_id, role;
  `);
  console.log(`Updated ${cgmRes.rows.length} chat group member records to FACULTY.`);

  const cmRes = await client.query(`
    UPDATE "${schema}".chat_messages 
    SET sender_role = 'FACULTY' 
    WHERE sender_id = '13527823-2f8b-4c6c-a1be-cb4b75d1c3af' 
       OR sender_id = '202616658' 
       OR sender_name ILIKE '%vinay%'
    RETURNING id, sender_name, sender_role, body;
  `);
  console.log(`Updated ${cmRes.rows.length} chat messages to sender_role = FACULTY.`);

  console.log('\n=== 2. Fixing all other teaching faculty incorrectly set to CLERK / Staff ===');
  const allFacUpdate = await client.query(`
    UPDATE "${schema}".faculty 
    SET staff_type = 'Faculty', updated_at = NOW() 
    WHERE (payroll_category ILIKE '%TEACH%' 
           OR designation ILIKE '%Faculty%' 
           OR designation ILIKE '%Professor%' 
           OR designation ILIKE '%Lecturer%')
      AND staff_type = 'Staff'
    RETURNING id, emp_id, name, designation, staff_type;
  `);
  console.log(`Updated ${allFacUpdate.rows.length} faculty members staff_type to 'Faculty'.`);

  const allUsersUpdate = await client.query(`
    UPDATE "${schema}".users u
    SET role = CASE WHEN f.designation ILIKE '%HOD%' THEN 'HOD' ELSE 'FACULTY' END,
        updated_at = NOW()
    FROM "${schema}".faculty f
    WHERE f.user_id::text = u.id::text
      AND (f.payroll_category ILIKE '%TEACH%' 
           OR f.designation ILIKE '%Faculty%' 
           OR f.designation ILIKE '%Professor%' 
           OR f.designation ILIKE '%Lecturer%')
      AND u.role = 'CLERK'
    RETURNING u.id, u.email, u.role, f.name;
  `);
  console.log(`Updated ${allUsersUpdate.rows.length} users role from CLERK to FACULTY/HOD:`, allUsersUpdate.rows);

  const allCgmUpdate = await client.query(`
    UPDATE "${schema}".chat_group_members cgm
    SET role = 'FACULTY'
    FROM "${schema}".faculty f
    WHERE (cgm.user_id::text = f.user_id::text OR cgm.user_id::text = f.emp_id::text)
      AND (f.payroll_category ILIKE '%TEACH%' OR f.designation ILIKE '%Faculty%' OR f.designation ILIKE '%Professor%')
      AND cgm.role = 'CLERK'
    RETURNING cgm.id, cgm.name, cgm.role;
  `);
  console.log(`Updated ${allCgmUpdate.rows.length} chat group members from CLERK to FACULTY.`);

  await client.end();
}

main().catch(console.error);
