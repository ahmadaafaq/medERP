const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'medERP',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || 'postgres',
});

async function main() {
  await client.connect();
  console.log('✅ Connected to PostgreSQL\n');

  const schema = 'tenant_srms-cet-bareilly';

  // 1. Count chat groups
  const groups = await client.query(`SELECT COUNT(*) AS cnt FROM "${schema}".chat_groups`);
  console.log(`📌 Chat Groups in DB: ${groups.rows[0].cnt}`);

  // 2. Show groups detail
  const groupDetails = await client.query(`
    SELECT id, name, department_name, batch_year, is_active, created_at 
    FROM "${schema}".chat_groups 
    ORDER BY created_at DESC LIMIT 10
  `);
  console.log('\n📋 Chat Groups:');
  groupDetails.rows.forEach(g => {
    console.log(`  - [${g.batch_year}] ${g.name} | Active: ${g.is_active} | ID: ${g.id}`);
  });

  // 3. Count messages
  const msgs = await client.query(`SELECT COUNT(*) AS cnt FROM "${schema}".chat_messages`);
  console.log(`\n💬 Total Chat Messages in DB: ${msgs.rows[0].cnt}`);

  // 4. Recent messages
  const recentMsgs = await client.query(`
    SELECT m.id, m.chat_group_id, m.sender_id, m.sender_name, m.sender_role, 
           LEFT(m.body, 80) AS body_preview, m.created_at 
    FROM "${schema}".chat_messages m 
    ORDER BY m.created_at DESC 
    LIMIT 10
  `);
  console.log('\n📨 Recent Messages:');
  recentMsgs.rows.forEach(m => {
    console.log(`  [${m.created_at?.toISOString?.() || m.created_at}] ${m.sender_name} (${m.sender_role}): "${m.body_preview}"`);
  });

  // 5. Read states
  const readStates = await client.query(`SELECT COUNT(*) AS cnt FROM "${schema}".chat_read_state`);
  console.log(`\n👁️ Read State Records in DB: ${readStates.rows[0].cnt}`);

  // 6. Members
  const members = await client.query(`SELECT COUNT(*) AS cnt FROM "${schema}".chat_group_members`);
  console.log(`👥 Chat Group Members in DB: ${members.rows[0].cnt}`);

  // 7. Simulate getUnreadCount for any user_id present
  const anyMember = await client.query(`
    SELECT DISTINCT user_id, role FROM "${schema}".chat_group_members 
    WHERE user_id IS NOT NULL LIMIT 5
  `);
  console.log('\n🔍 Sample Members:');
  anyMember.rows.forEach(m => console.log(`  - user_id: ${m.user_id} | role: ${m.role}`));

  if (anyMember.rows.length > 0) {
    const testUserId = anyMember.rows[0].user_id;
    const unreadRes = await client.query(`
      SELECT 
        COUNT(DISTINCT unread_msg.id) AS total_unread,
        COUNT(DISTINCT unread_msg.chat_group_id) AS groups_with_unread
      FROM "${schema}".chat_messages unread_msg
      JOIN "${schema}".chat_group_members mem 
        ON mem.chat_group_id::text = unread_msg.chat_group_id::text 
        AND mem.user_id::text = $1::text
      LEFT JOIN "${schema}".chat_read_state rs 
        ON rs.chat_group_id::text = unread_msg.chat_group_id::text 
        AND rs.user_id::text = $1::text
      LEFT JOIN "${schema}".chat_messages prev 
        ON prev.id::text = rs.last_read_message_id::text
      WHERE unread_msg.sender_id::text != $1::text
        AND (
          rs.last_read_message_id IS NULL 
          OR prev.created_at IS NULL
          OR unread_msg.created_at > prev.created_at
        )
    `, [testUserId]);
    
    console.log(`\n📊 Unread for user "${testUserId}": total_unread=${unreadRes.rows[0].total_unread}, groups_with_unread=${unreadRes.rows[0].groups_with_unread}`);
  }

  await client.end();
  console.log('\n✅ Done.');
}

main().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
