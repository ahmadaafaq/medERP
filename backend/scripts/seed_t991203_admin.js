const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function seedT99Admin() {
  const client = new Client({
    connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp',
  });
  await client.connect();

  const passwordHash = await bcrypt.hash('admin@123', 10);

  const schemasRes = await client.query(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%'
  `);

  console.log(`Found ${schemasRes.rows.length} tenant schemas to seed T/99/1203...`);

  for (const s of schemasRes.rows) {
    const schema = s.schema_name;
    try {
      // 1. Upsert in users table
      const userRes = await client.query(`
        INSERT INTO "${schema}".users (email, password_hash, role, emp_id, is_active, onboarding_completed, must_change_password)
        VALUES ('t991203@srms.ac.in', $1, 'COLLEGE_ADMIN', 'T/99/1203', true, true, false)
        ON CONFLICT (email) DO UPDATE SET 
          role = 'COLLEGE_ADMIN', 
          emp_id = 'T/99/1203', 
          password_hash = $1,
          is_active = true
        RETURNING id;
      `, [passwordHash]);

      let userId = userRes.rows[0]?.id;
      if (!userId) {
        const u = await client.query(`SELECT id FROM "${schema}".users WHERE LOWER(email) = 't991203@srms.ac.in' OR LOWER(emp_id) = 't/99/1203' LIMIT 1`);
        userId = u.rows[0]?.id;
      }

      if (userId) {
        // 2. Upsert in faculty table
        await client.query(`
          INSERT INTO "${schema}".faculty (user_id, emp_id, name, designation, staff_type, is_active)
          VALUES ($1, 'T/99/1203', 'Administrator (T/99/1203)', 'College Administrator', 'Administrator', true)
          ON CONFLICT (emp_id) DO UPDATE SET 
            designation = 'College Administrator', 
            staff_type = 'Administrator', 
            user_id = $1,
            is_active = true;
        `, [userId]);
      }
      console.log(`✓ Seeded T/99/1203 Admin in ${schema}`);
    } catch (err) {
      console.warn(`! Note on ${schema}: ${err.message}`);
    }
  }

  await client.end();
  console.log('Finished seeding T/99/1203 admin across all schemas.');
}

seedT99Admin().catch(console.error);
