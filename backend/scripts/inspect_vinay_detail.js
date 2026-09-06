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

  console.log('--- 1. users table ---');
  const u = await client.query(`SELECT id, email, role, usr_id, emp_id, department FROM "${schema}".users WHERE id = '13527823-2f8b-4c6c-a1be-cb4b75d1c3af' OR emp_id = '202616658' OR email = 'vinayverma111.vk@gmail.com'`);
  console.log(u.rows);

  console.log('--- 2. faculty table ---');
  const f = await client.query(`SELECT id, user_id, emp_id, name, email, designation, staff_type, payroll_category, category FROM "${schema}".faculty WHERE emp_id = '202616658' OR email = 'vinayverma111.vk@gmail.com'`);
  console.log(f.rows);

  console.log('--- 3. chat_messages table ---');
  const cm = await client.query(`SELECT id, sender_id, sender_name, sender_role, body, created_at FROM "${schema}".chat_messages WHERE sender_id = '13527823-2f8b-4c6c-a1be-cb4b75d1c3af' OR sender_name ILIKE '%vinay%' OR sender_id = '202616658'`);
  console.log(cm.rows);

  console.log('--- 4. chat_group_members table ---');
  const cgm = await client.query(`SELECT id, chat_group_id, user_id, role, name FROM "${schema}".chat_group_members WHERE user_id = '13527823-2f8b-4c6c-a1be-cb4b75d1c3af' OR name ILIKE '%vinay%' OR user_id = '202616658'`);
  console.log(cgm.rows);

  await client.end();
}

main().catch(console.error);
