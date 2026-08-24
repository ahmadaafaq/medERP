const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp' });

async function verifyAdminPermissions() {
  const res = await pool.query(`
    SELECT f.title, f.slug, frp.menu_key, frp.is_enabled
    FROM public.firm_role_permissions frp
    JOIN public.firms f ON f.id = frp.firm_id
    WHERE frp.role = 'ADMIN' AND frp.menu_key IN ('admin_repository', 'admin_incubation_cell')
    LIMIT 10;
  `);
  console.table(res.rows);
  await pool.end();
}

verifyAdminPermissions().catch(console.error);
