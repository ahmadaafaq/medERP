const { Client } = require('pg');

async function syncIncubationNotices() {
  const client = new Client({
    connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp',
  });

  await client.connect();
  console.log('Connected to DB');

  const schema = 'tenant_srms-cet-bareilly';

  // Find all incubated/selected projects
  const res = await client.query(`
    SELECT repo_id, title, student_name, student_reg_no, incubation_status, funding_amount, mentor_assigned, score, grade
    FROM "${schema}".repositories
    WHERE incubation_status IN ('Selected', 'Funded', 'Incubated')
  `);

  console.log(`Found ${res.rows.length} incubated projects in ${schema}`);

  for (const row of res.rows) {
    const title = `🚀 Golden Opportunity: Project "${row.title}" Selected for Venture Incubation!`;
    const fundingMsg = row.funding_amount > 0 ? ` with approved seed funding of ₹${Number(row.funding_amount).toLocaleString('en-IN')}` : '';
    const body = `🌟 Congratulations ${row.student_name}! You are a genius! Your project "${row.title}" (Faculty Score: ${row.score}% Grade ${row.grade}) has been selected by College Administration for Venture Incubation & Seed Funding${fundingMsg}. A golden opportunity for corporate placement & commercialization awaits!`;

    // 1. Insert into notifications table for individual student
    await client.query(`
      INSERT INTO "${schema}".notifications (
        id, recipient_id, title, body, message, type, category, is_read, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $3, 'INCUBATION_SELECTED', 'INCUBATION', false, NOW()
      )
    `, [row.student_reg_no, title, body]);

    // Also add to ALL_STUDENTS and ALL
    await client.query(`
      INSERT INTO "${schema}".notifications (
        id, recipient_id, title, body, message, type, category, is_read, created_at
      ) VALUES (
        gen_random_uuid(), 'ALL_STUDENTS', $1, $2, $2, 'INCUBATION_SELECTED', 'INCUBATION', false, NOW()
      )
    `, [title, body]);

    // 2. Insert into notices for the Campus Alerts Bell
    const noticeRes = await client.query(`
      INSERT INTO "${schema}".notices (
        id, title, body, priority, category, creator_name, creator_role, status, requires_acknowledgement, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, 'urgent', 'announcement', 'Incubation & Entrepreneurship Cell', 'Admin', 'sent', true, NOW(), NOW()
      )
      RETURNING id
    `, [title, body]);

    const noticeId = noticeRes.rows[0].id;

    // Add notice targets
    await client.query(`
      INSERT INTO "${schema}".notice_targets (id, notice_id, target_type, target_value, target_label, created_at)
      VALUES 
        (gen_random_uuid(), $1, 'role', 'student', 'All Students', NOW()),
        (gen_random_uuid(), $1, 'individual', $2, $3, NOW())
    `, [noticeId, row.student_reg_no, row.student_name]);

    console.log(`Dispatched incubation alert notice & notification for ${row.student_name} (${row.title})`);
  }

  await client.end();
  console.log('Done!');
}

syncIncubationNotices().catch(err => {
  console.error(err);
  process.exit(1);
});
