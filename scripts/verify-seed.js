const { Client } = require('../backend/node_modules/pg');

async function verify() {
  const c = new Client({ connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp' });
  await c.connect();
  await c.query('SET search_path TO "tenant_srms-ims"');
  const r = await c.query(
    "SELECT mode, topic, competency_code, difficulty_level FROM question_bank WHERE professional_phase = 'Phase 1 (1st Professional MBBS)' ORDER BY topic"
  );
  console.log(`\nTotal MCQs in question_bank (Professional 1): ${r.rows.length}\n`);
  r.rows.forEach((row, i) => {
    console.log(`${String(i+1).padStart(2)}. [${row.difficulty_level.padEnd(6)}] ${row.competency_code.padEnd(10)} | ${row.topic}`);
  });
  await c.end();
}
verify().catch(e => { console.error(e.message); process.exit(1); });
