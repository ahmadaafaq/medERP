const { Client } = require('pg');

async function findLogbookFKs() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp',
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT tc.table_name, kcu.column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu 
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema 
      JOIN information_schema.constraint_column_usage AS ccu 
        ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema 
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND ccu.table_name = 'logbook_entries' 
        AND tc.table_schema = 'tenant_srms-ims'
    `);
    console.log('📌 Foreign Key tables referencing logbook_entries:', res.rows.map(r => `${r.table_name}.${r.column_name}`));
  } catch (err) {
    console.error('Error finding logbook FKs:', err);
  } finally {
    await client.end();
  }
}

findLogbookFKs();
