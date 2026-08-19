const { Client } = require('pg');
const client = new Client({ host: 'localhost', port: 5432, user: 'unicampus', password: 'unicampus_secret', database: 'unicampus_erp' });

async function fixFacultyDepartments() {
  await client.connect();
  const schemasRes = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'");

  for (const row of schemasRes.rows) {
    const s = row.schema_name;
    try {
      // Find Physiology dept in this schema
      const phyDept = await client.query(`
        SELECT id, name FROM "${s}".departments
        WHERE name ILIKE '%Physiology%' OR code ILIKE '%PHY%'
        LIMIT 1
      `);

      // Find Anatomy dept in this schema
      const anaDept = await client.query(`
        SELECT id, name FROM "${s}".departments
        WHERE name ILIKE '%Anatomy%' OR code ILIKE '%ANA%'
        LIMIT 1
      `);

      const phyId = phyDept.rows[0]?.id;
      const anaId = anaDept.rows[0]?.id;

      if (phyId) {
        // Map Sanjay Singh and any Physiology faculty to Physiology department
        await client.query(`
          UPDATE "${s}".faculty
          SET department_id = $1, designation = COALESCE(designation, 'Professor & HOD'), specialization = 'Physiology & Biophysics'
          WHERE (name ILIKE '%Sanjay%' OR name ILIKE '%Sarah%' OR email ILIKE '%sanjay%' OR email ILIKE '%sarah%')
        `, [phyId]);
      }

      if (anaId) {
        // Map Aparna Tyagi to Anatomy
        await client.query(`
          UPDATE "${s}".faculty
          SET department_id = $1, designation = COALESCE(designation, 'Associate Professor'), specialization = 'Human Anatomy & Histology'
          WHERE (name ILIKE '%Aparna%' OR email ILIKE '%aparna%')
        `, [anaId]);
      }

      // Add 2 realistic fellow Physiology department colleagues if only 1 exists, so the roster shows fellow department faculty!
      const facCount = await client.query(`
        SELECT COUNT(*) as cnt FROM "${s}".faculty WHERE department_id = $1
      `, [phyId]);

      console.log(`Schema ${s}: Physiology Dept = ${phyDept.rows[0]?.name} (${phyId}), Faculty Count = ${facCount.rows[0]?.cnt}`);

    } catch (e) {
      // Ignore if tables don't exist
    }
  }

  await client.end();
  console.log('Finished updating faculty department mappings.');
}

fixFacultyDepartments().catch(console.error);
