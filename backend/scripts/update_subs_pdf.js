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

  // 1. Update GEN AI submission
  await client.query(`
    UPDATE "${schema}".logbook_submissions 
    SET 
      attachment_name = 'Generative AI.pdf',
      attachment_url = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      submission_text = 'Generative AI is transforming the way people create and work with digital content. It provides powerful assistance in education, business, software development, design, and many other fields. However, its output should be verified and used responsibly.',
      status = 'EVALUATED'
    WHERE id::text = 'a20cedb3-7410-457e-ae8e-338c2b98af6d' 
       OR topic_id IN (SELECT id FROM "${schema}".logbook_topics WHERE title = 'GEN AI');
  `);

  // 2. Update Topology submission
  await client.query(`
    UPDATE "${schema}".logbook_submissions 
    SET 
      attachment_name = 'Topology_Report.pdf',
      attachment_url = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      submission_text = 'In-depth research and mathematical presentation of network and topological geometries.',
      status = 'EVALUATED'
    WHERE id::text = 'bfd5eef1-b6eb-4706-a6e7-af223e0d3556' 
       OR topic_id IN (SELECT id FROM "${schema}".logbook_topics WHERE title = 'Topology');
  `);

  // 3. Ensure evaluation feedback remarks
  await client.query(`
    UPDATE "${schema}".logbook_evaluations
    SET 
      marks_obtained = 18,
      feedback = 'Overall performance was satisfactory and satisfactory progress was observed. impressive',
      evaluated_at = NOW()
    WHERE submission_id::text = 'a20cedb3-7410-457e-ae8e-338c2b98af6d';
  `);

  await client.query(`
    UPDATE "${schema}".logbook_evaluations
    SET 
      marks_obtained = 19,
      feedback = 'Excellent analytical explanation and comprehensive diagrammatic illustrations.',
      evaluated_at = NOW()
    WHERE submission_id::text = 'bfd5eef1-b6eb-4706-a6e7-af223e0d3556';
  `);

  const res = await client.query(`SELECT id, topic_id, attachment_name, attachment_url, submission_text FROM "${schema}".logbook_submissions;`);
  console.log('Updated submissions in database:', res.rows);

  await client.end();
}
main();
