const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp',
});

const OFFICIAL_SESSIONS = [
  { colg_cd: '1', session_cd: '16', session_name: '2026-2027', active_flg: '1', current_flg: '1', start_date: '2026-07-01', end_date: '2027-06-30' },
  { colg_cd: '1', session_cd: '15', session_name: '2025-2026', active_flg: '1', current_flg: '1', start_date: '2025-07-01', end_date: '2026-06-30' },
  { colg_cd: '1', session_cd: '14', session_name: '2024-2025', active_flg: '1', current_flg: '1', start_date: '2024-07-01', end_date: '2025-06-30' },
  { colg_cd: '1', session_cd: '13', session_name: '2023-2024', active_flg: '1', current_flg: '0', start_date: '2023-07-01', end_date: '2024-06-30' },
  { colg_cd: '1', session_cd: '12', session_name: '2022-2023', active_flg: '1', current_flg: '0', start_date: '2022-07-01', end_date: '2023-06-30' },
  { colg_cd: '1', session_cd: '11', session_name: '2021-2022', active_flg: '1', current_flg: '0', start_date: '2021-07-01', end_date: '2022-06-30' },
  { colg_cd: '1', session_cd: '10', session_name: '2020-2021', active_flg: '1', current_flg: '0', start_date: '2020-07-01', end_date: '2021-06-30' },
];

async function main() {
  await client.connect();

  const schemasRes = await client.query(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%'
  `);

  console.log(`Syncing & cleaning sessions across ${schemasRes.rows.length} schemas in PostgreSQL...`);

  for (const row of schemasRes.rows) {
    const s = row.schema_name;
    try {
      // 1. Ensure table and columns exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS "${s}".academic_sessions (
          id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
          code         VARCHAR(50),
          session_cd   VARCHAR(50),
          colg_cd      VARCHAR(50)  DEFAULT '1',
          name         VARCHAR(100) NOT NULL,
          start_date   DATE         NOT NULL,
          end_date     DATE         NOT NULL,
          is_current   BOOLEAN      DEFAULT false,
          is_active    BOOLEAN      DEFAULT true,
          created_at   TIMESTAMPTZ  DEFAULT NOW()
        );
        ALTER TABLE "${s}".academic_sessions ADD COLUMN IF NOT EXISTS code VARCHAR(50);
        ALTER TABLE "${s}".academic_sessions ADD COLUMN IF NOT EXISTS session_cd VARCHAR(50);
        ALTER TABLE "${s}".academic_sessions ADD COLUMN IF NOT EXISTS colg_cd VARCHAR(50) DEFAULT '1';
      `);

      // 2. Delete duplicate/legacy messy names
      await client.query(`DELETE FROM "${s}".academic_sessions WHERE name LIKE '%Academic Session%' OR name LIKE 'ENG-%'`);

      // 3. Upsert clean sessions
      for (const sess of OFFICIAL_SESSIONS) {
        const isCurrent = sess.current_flg === '1';
        const isActive = sess.active_flg === '1';
        const existing = await client.query(`
          SELECT id FROM "${s}".academic_sessions 
          WHERE session_cd = $1 OR name = $2 
          LIMIT 1
        `, [sess.session_cd, sess.session_name]);

        if (existing.rows.length > 0) {
          await client.query(`
            UPDATE "${s}".academic_sessions
            SET name = $1, session_cd = $2, code = $2, colg_cd = $3, start_date = $4, end_date = $5, is_current = $6, is_active = $7
            WHERE id = $8
          `, [sess.session_name, sess.session_cd, sess.colg_cd, sess.start_date, sess.end_date, isCurrent, isActive, existing.rows[0].id]);
        } else {
          await client.query(`
            INSERT INTO "${s}".academic_sessions (name, code, session_cd, colg_cd, start_date, end_date, is_current, is_active)
            VALUES ($1, $2, $2, $3, $4, $5, $6, $7)
          `, [sess.session_name, sess.session_cd, sess.colg_cd, sess.start_date, sess.end_date, isCurrent, isActive]);
        }
      }

      // Deduplicate by session_cd keeping newest
      await client.query(`
        DELETE FROM "${s}".academic_sessions a USING "${s}".academic_sessions b
        WHERE a.session_cd = b.session_cd AND a.id < b.id
      `);

      const count = await client.query(`SELECT count(*) FROM "${s}".academic_sessions`);
      console.log(`Schema [${s}]: ${count.rows[0].count} sessions clean`);
    } catch(err) {
      console.error(`Error syncing schema ${s}:`, err.message);
    }
  }

  // Print sample from tenant_srms-cet-bareilly
  console.log('\n=== Clean tenant_srms-cet-bareilly academic_sessions: ===');
  const sample = await client.query(`
    SELECT session_cd, code, colg_cd, name, start_date, end_date, is_current, is_active 
    FROM "tenant_srms-cet-bareilly".academic_sessions 
    ORDER BY session_cd::int DESC
  `);
  console.table(sample.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  client.end();
});
