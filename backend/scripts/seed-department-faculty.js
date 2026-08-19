const { Client } = require('pg');
const client = new Client({ host: 'localhost', port: 5432, user: 'unicampus', password: 'unicampus_secret', database: 'unicampus_erp' });

async function run() {
  await client.connect();

  const schemas = ['tenant_srms-ims', 'tenant_rajshreemri'];

  for (const s of schemas) {
    try {
      console.log(`\n=== Processing Schema: ${s} ===`);

      // 1. Get or create Department of Physiology & Department of Anatomy
      let phyDept = (await client.query(`SELECT id, name FROM "${s}".departments WHERE name ILIKE '%Physiology%' LIMIT 1`)).rows[0];
      if (!phyDept) {
        phyDept = (await client.query(`INSERT INTO "${s}".departments (code, name, type, is_active) VALUES ('PHY', 'Department of Physiology', 'Pre-Clinical', true) RETURNING id, name`)).rows[0];
      }

      let anaDept = (await client.query(`SELECT id, name FROM "${s}".departments WHERE name ILIKE '%Anatomy%' LIMIT 1`)).rows[0];
      if (!anaDept) {
        anaDept = (await client.query(`INSERT INTO "${s}".departments (code, name, type, is_active) VALUES ('ANA', 'Department of Anatomy', 'Pre-Clinical', true) RETURNING id, name`)).rows[0];
      }

      // Update Dr. Sanjay Singh to Physiology
      await client.query(`
        UPDATE "${s}".faculty
        SET department_id = $1, designation = 'Professor & HOD', specialization = 'Physiology & Biophysics', is_active = true
        WHERE name ILIKE '%Sanjay%'
      `, [phyDept.id]);

      // Update Dr. Aparna Tyagi to Anatomy
      await client.query(`
        UPDATE "${s}".faculty
        SET department_id = $1, designation = 'Professor & HOD', specialization = 'Gross Anatomy & Embryology', is_active = true
        WHERE name ILIKE '%Aparna%'
      `, [anaDept.id]);

      // Seed Dr. Rajesh Sharma (Associate Professor, Physiology)
      const u2Email = `rajesh.sharma@${s.replace('tenant_', '')}.edu`;
      let u2 = (await client.query(`SELECT id FROM "${s}".users WHERE email = $1`, [u2Email])).rows[0];
      if (!u2) {
        u2 = (await client.query(`
          INSERT INTO "${s}".users (email, password_hash, role, is_active, created_at)
          VALUES ($1, '$2b$10$epRsw5N9z3y.Z.Pq9zX17u/6Zc6XoW3kU.F8sXQp5G3R7G6jHk9C6', 'FACULTY', true, NOW())
          RETURNING id
        `, [u2Email])).rows[0];
      }
      await client.query(`
        INSERT INTO "${s}".faculty (user_id, emp_id, name, designation, specialization, department_id, phone, gender, experience, is_active)
        VALUES ($1, 'EMP1003', 'Dr. Rajesh Sharma', 'Associate Professor', 'Cardiopulmonary Physiology', $2, '+91 98101 44556', 'Male', '12 Years', true)
        ON CONFLICT (user_id) DO UPDATE SET department_id = $2, designation = 'Associate Professor', specialization = 'Cardiopulmonary Physiology';
      `, [u2.id, phyDept.id]);

      // Seed Dr. Meenakshi Sundaram (Assistant Professor, Physiology)
      const u3Email = `meenakshi.sundaram@${s.replace('tenant_', '')}.edu`;
      let u3 = (await client.query(`SELECT id FROM "${s}".users WHERE email = $1`, [u3Email])).rows[0];
      if (!u3) {
        u3 = (await client.query(`
          INSERT INTO "${s}".users (email, password_hash, role, is_active, created_at)
          VALUES ($1, '$2b$10$epRsw5N9z3y.Z.Pq9zX17u/6Zc6XoW3kU.F8sXQp5G3R7G6jHk9C6', 'FACULTY', true, NOW())
          RETURNING id
        `, [u3Email])).rows[0];
      }
      await client.query(`
        INSERT INTO "${s}".faculty (user_id, emp_id, name, designation, specialization, department_id, phone, gender, experience, is_active)
        VALUES ($1, 'EMP1004', 'Dr. Meenakshi Sundaram', 'Assistant Professor', 'Neurophysiology & EEG Studies', $2, '+91 98101 77889', 'Female', '6 Years', true)
        ON CONFLICT (user_id) DO UPDATE SET department_id = $2, designation = 'Assistant Professor', specialization = 'Neurophysiology & EEG Studies';
      `, [u3.id, phyDept.id]);

      // Seed Dr. Amit Kumar Gupta (Senior Resident, Physiology)
      const u4Email = `amit.gupta@${s.replace('tenant_', '')}.edu`;
      let u4 = (await client.query(`SELECT id FROM "${s}".users WHERE email = $1`, [u4Email])).rows[0];
      if (!u4) {
        u4 = (await client.query(`
          INSERT INTO "${s}".users (email, password_hash, role, is_active, created_at)
          VALUES ($1, '$2b$10$epRsw5N9z3y.Z.Pq9zX17u/6Zc6XoW3kU.F8sXQp5G3R7G6jHk9C6', 'FACULTY', true, NOW())
          RETURNING id
        `, [u4Email])).rows[0];
      }
      await client.query(`
        INSERT INTO "${s}".faculty (user_id, emp_id, name, designation, specialization, department_id, phone, gender, experience, is_active)
        VALUES ($1, 'EMP1005', 'Dr. Amit Kumar Gupta', 'Tutor & Senior Resident', 'Clinical Hematology Labs', $2, '+91 98101 99112', 'Male', '3 Years', true)
        ON CONFLICT (user_id) DO UPDATE SET department_id = $2, designation = 'Tutor & Senior Resident', specialization = 'Clinical Hematology Labs';
      `, [u4.id, phyDept.id]);

      // Seed Dr. Vikramaditya Rathore (Associate Professor, Anatomy)
      const u5Email = `vikram.rathore@${s.replace('tenant_', '')}.edu`;
      let u5 = (await client.query(`SELECT id FROM "${s}".users WHERE email = $1`, [u5Email])).rows[0];
      if (!u5) {
        u5 = (await client.query(`
          INSERT INTO "${s}".users (email, password_hash, role, is_active, created_at)
          VALUES ($1, '$2b$10$epRsw5N9z3y.Z.Pq9zX17u/6Zc6XoW3kU.F8sXQp5G3R7G6jHk9C6', 'FACULTY', true, NOW())
          RETURNING id
        `, [u5Email])).rows[0];
      }
      await client.query(`
        INSERT INTO "${s}".faculty (user_id, emp_id, name, designation, specialization, department_id, phone, gender, experience, is_active)
        VALUES ($1, 'EMP1006', 'Dr. Vikramaditya Rathore', 'Associate Professor', 'Neuroanatomy & Histology', $2, '+91 98101 33221', 'Male', '11 Years', true)
        ON CONFLICT (user_id) DO UPDATE SET department_id = $2, designation = 'Associate Professor', specialization = 'Neuroanatomy & Histology';
      `, [u5.id, anaDept.id]);

      // Verify counts in this schema
      const phyFaculty = await client.query(`
        SELECT f.name, f.designation, f.emp_id, u.email, d.name as dept_name
        FROM "${s}".faculty f
        JOIN "${s}".users u ON u.id = f.user_id
        JOIN "${s}".departments d ON d.id = f.department_id
        WHERE f.department_id = $1
      `, [phyDept.id]);

      const anaFaculty = await client.query(`
        SELECT f.name, f.designation, f.emp_id, u.email, d.name as dept_name
        FROM "${s}".faculty f
        JOIN "${s}".users u ON u.id = f.user_id
        JOIN "${s}".departments d ON d.id = f.department_id
        WHERE f.department_id = $1
      `, [anaDept.id]);

      console.log(`\nPhysiology Faculty (${phyFaculty.rows.length}):`);
      phyFaculty.rows.forEach(r => console.log(`  - [${r.emp_id}] ${r.name} (${r.designation}) | Email: ${r.email}`));

      console.log(`\nAnatomy Faculty (${anaFaculty.rows.length}):`);
      anaFaculty.rows.forEach(r => console.log(`  - [${r.emp_id}] ${r.name} (${r.designation}) | Email: ${r.email}`));

    } catch (e) {
      console.error(`Error in schema ${s}:`, e.message);
    }
  }

  await client.end();
  console.log('\n✅ Database seed & department linkage completed successfully!');
}

run().catch(console.error);
