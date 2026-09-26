require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: process.env.DB_NAME,
});

async function main() {
  const client = await pool.connect();
  try {
    const schema = 'tenant_srms-cet-bareilly';
    const targetRollNo = '2500140100018'; // B.Tech CSE student Ayush Khanduri
    const newName = 'AYUSH KHANDURI';

    console.log(`=== Targeted Replacement for B.Tech CS student rollno: ${targetRollNo} ===`);
    await client.query('BEGIN');

    // 1. Update repositories table for rollno 2500140100018
    const repoUpdate = await client.query(`
      UPDATE "${schema}".repositories
      SET student_name = $1,
          repo_link = REPLACE(repo_link, 'aafreen-khan', 'ayush-khanduri')
      WHERE student_reg_no = $2
      RETURNING repo_id, student_reg_no, student_name, title, repo_link;
    `, [newName, targetRollNo]);
    console.log(`Updated repositories: ${repoUpdate.rowCount} row(s)`);
    console.log(repoUpdate.rows);

    // 2. Update notice_targets for rollno 2500140100018
    const targetUpdate = await client.query(`
      UPDATE "${schema}".notice_targets
      SET target_label = $1
      WHERE target_value = $2
      RETURNING id, notice_id, target_value, target_label;
    `, [newName, targetRollNo]);
    console.log(`Updated notice_targets: ${targetUpdate.rowCount} row(s)`);

    // 3. Update notices linked to this student
    const noticeUpdate = await client.query(`
      UPDATE "${schema}".notices
      SET body = REPLACE(body, 'AAFREEN KHAN', $1),
          title = REPLACE(title, 'AAFREEN KHAN', $1)
      WHERE id::text IN (
        SELECT notice_id::text FROM "${schema}".notice_targets WHERE target_value = $2
      )
      RETURNING id, title, body;
    `, [newName, targetRollNo]);
    console.log(`Updated notices: ${noticeUpdate.rowCount} row(s)`);

    // 4. Update notifications for recipient 2500140100018
    const notifUpdate = await client.query(`
      UPDATE "${schema}".notifications
      SET message = REPLACE(message, 'AAFREEN KHAN', $1),
          body = REPLACE(body, 'AAFREEN KHAN', $1),
          title = REPLACE(title, 'AAFREEN KHAN', $1)
      WHERE recipient_id = $2
      RETURNING id, recipient_id, title;
    `, [newName, targetRollNo]);
    console.log(`Updated notifications: ${notifUpdate.rowCount} row(s)`);

    // 5. Update students table for rollno 2500140100018
    const studentUpdate = await client.query(`
      UPDATE "${schema}".students
      SET name = $1,
          gender = 'MALE'
      WHERE rollno = $2 OR registration_no = '2025108340'
      RETURNING id, rollno, registration_no, name, course_cd, batch_cd, photo_url, gender;
    `, [newName, targetRollNo]);
    console.log(`Updated students: ${studentUpdate.rowCount} row(s)`);
    console.log(studentUpdate.rows);

    // 6. Check if repository_reviews has any student name or references
    const reviewCheck = await client.query(`
      SELECT r.* FROM "${schema}".repository_reviews r
      WHERE r.repo_id IN (
        SELECT repo_id FROM "${schema}".repositories WHERE student_reg_no = $1
      );
    `, [targetRollNo]);
    console.log('Repository reviews for repo #5:', reviewCheck.rows);

    await client.query('COMMIT');
    console.log('\n>>> Successfully committed all replacements for B.Tech CSE rollno 2500140100018!');

    // VERIFICATION: Verify that other courses/students were NOT changed
    console.log('\n=== VERIFICATION: Checking BCA student (2025107990) remains untouched ===');
    const bcaStudent = await client.query(`
      SELECT rollno, registration_no, name, course_cd FROM "${schema}".students
      WHERE registration_no = '2025107990' OR rollno = '2500141790001';
    `);
    console.log('BCA Student (should be Aafreen Khan):', bcaStudent.rows);

    const bcaRepos = await client.query(`
      SELECT repo_id, student_reg_no, student_name, title, course_cd FROM "${schema}".repositories
      WHERE student_reg_no = '2025107990';
    `);
    console.log('BCA Repositories (should remain untouched):', bcaRepos.rows);

    console.log('\n=== VERIFICATION: Checking B.Tech CSE student (2500140100018) ===');
    const btechRepo = await client.query(`
      SELECT repo_id, student_reg_no, student_name, title, course_cd, batch_cd FROM "${schema}".repositories
      WHERE student_reg_no = $1;
    `, [targetRollNo]);
    console.log('B.Tech CSE Repo #5 (should be AYUSH KHANDURI):', btechRepo.rows);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error occurred, rolled back:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
