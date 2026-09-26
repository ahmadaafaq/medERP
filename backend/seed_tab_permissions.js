const { Client } = require('pg');

const client = new Client({
  host: '34.236.107.120',
  port: 5433,
  user: 'unicampus',
  password: 'unicampus_dev@qsd!3ous',
  database: 'unicampus_erp'
});

const SUB_TABS = [
  // ─── College Master Tabs ───
  { parent: 'admin_college_master', key: 'admin_college_master_colleges', label: '1. College', route: '/dashboard/admin/college-master#colleges', order: 21 },
  { parent: 'admin_college_master', key: 'admin_college_master_courses', label: '2. Courses', route: '/dashboard/admin/college-master#courses', order: 22 },
  { parent: 'admin_college_master', key: 'admin_college_master_professionals', label: '3. Academic Year', route: '/dashboard/admin/college-master#professionals', order: 23 },
  { parent: 'admin_college_master', key: 'admin_college_master_batches', label: '4. Batch', route: '/dashboard/admin/college-master#batches', order: 24 },
  { parent: 'admin_college_master', key: 'admin_college_master_branches', label: '5. Departments & Specialties', route: '/dashboard/admin/college-master#branches', order: 25 },
  { parent: 'admin_college_master', key: 'admin_college_master_groups', label: '6. Section Groups', route: '/dashboard/admin/college-master#groups', order: 26 },
  { parent: 'admin_college_master', key: 'admin_college_master_sessions', label: '7. Session', route: '/dashboard/admin/college-master#sessions', order: 27 },
  { parent: 'admin_college_master', key: 'admin_college_master_residencies', label: '8. Residency Category', route: '/dashboard/admin/college-master#residencies', order: 28 },

  // ─── College Curriculum (Admin Master) Tabs ───
  { parent: 'admin_admin_master', key: 'admin_admin_master_departments', label: '1. Department Master', route: '/dashboard/admin/admin-master#departments', order: 31 },
  { parent: 'admin_admin_master', key: 'admin_admin_master_subjects', label: '2. Subject Master', route: '/dashboard/admin/admin-master#subjects', order: 32 },
  { parent: 'admin_admin_master', key: 'admin_admin_master_guidelines', label: '3. Guidelines', route: '/dashboard/admin/admin-master#guidelines', order: 33 },
  { parent: 'admin_admin_master', key: 'admin_admin_master_offerings', label: '4. Subject Offerings', route: '/dashboard/admin/admin-master#offerings', order: 34 },
  { parent: 'admin_admin_master', key: 'admin_admin_master_delivery_types', label: '5. Delivery Types', route: '/dashboard/admin/admin-master#delivery-types', order: 35 },
  { parent: 'admin_admin_master', key: 'admin_admin_master_units', label: '6. Unit Master', route: '/dashboard/admin/admin-master#units', order: 36 },
  { parent: 'admin_admin_master', key: 'admin_admin_master_topics', label: '7. Topic Master', route: '/dashboard/admin/admin-master#topics', order: 37 },
  { parent: 'admin_admin_master', key: 'admin_admin_master_competencies', label: '8. Sub Topics', route: '/dashboard/admin/admin-master#sub-topics', order: 38 },

  // ─── Assessment & Q-Bank Tabs ───
  { parent: 'admin_assessment', key: 'admin_assessment_bank', label: 'Question Bank', route: '/dashboard/admin/assessment#bank', order: 111 },
  { parent: 'admin_assessment', key: 'admin_assessment_design', label: 'Paper Designer', route: '/dashboard/admin/assessment#design', order: 112 },
  { parent: 'admin_assessment', key: 'admin_assessment_publish', label: 'Published Assessments', route: '/dashboard/admin/assessment#publish', order: 113 },

  // ─── Gradebook & Scores Tabs ───
  { parent: 'admin_assessment_marks', key: 'admin_assessment_marks_theory', label: 'Theory Evaluation', route: '/dashboard/admin/assessment-marks#theory', order: 121 },
  { parent: 'admin_assessment_marks', key: 'admin_assessment_marks_practical', label: 'Practical Evaluation', route: '/dashboard/admin/assessment-marks#practical', order: 122 },
  { parent: 'admin_assessment_marks', key: 'admin_assessment_marks_competency', label: 'Competency Scoring', route: '/dashboard/admin/assessment-marks#competency', order: 123 },
];

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL database');

  // 1. Ensure parent_menu_key column exists on public.menu_registry
  await client.query(`
    ALTER TABLE public.menu_registry ADD COLUMN IF NOT EXISTS parent_menu_key VARCHAR(150);
  `);

  // 2. Upsert each sub-tab in public.menu_registry
  for (const t of SUB_TABS) {
    await client.query(`
      INSERT INTO public.menu_registry (role, menu_key, menu_label, route_path, parent_menu_key, sort_order, applicable_firm_mode, created_at, updated_at)
      VALUES ('ADMIN', $1, $2, $3, $4, $5, 'BOTH', NOW(), NOW())
      ON CONFLICT (role, menu_key) DO UPDATE SET
        menu_label = EXCLUDED.menu_label,
        route_path = EXCLUDED.route_path,
        parent_menu_key = EXCLUDED.parent_menu_key,
        sort_order = EXCLUDED.sort_order,
        updated_at = NOW();
    `, [t.key, t.label, t.route, t.parent, t.order]);
  }
  console.log(`Upserted ${SUB_TABS.length} sub-tabs in public.menu_registry`);

  // 3. For every firm that has the parent module enabled for ADMIN, also grant the sub-tabs by default
  const parentKeys = ['admin_college_master', 'admin_admin_master', 'admin_assessment', 'admin_assessment_marks'];
  for (const parentKey of parentKeys) {
    const parentFirms = await client.query(`
      SELECT DISTINCT firm_id FROM public.firm_role_permissions
      WHERE role = 'ADMIN' AND menu_key = $1 AND is_enabled = true
    `, [parentKey]);

    const childTabs = SUB_TABS.filter(t => t.parent === parentKey);
    for (const pf of parentFirms.rows) {
      for (const ct of childTabs) {
        await client.query(`
          INSERT INTO public.firm_role_permissions (firm_id, role, menu_key, is_enabled, created_at, updated_at)
          VALUES ($1, 'ADMIN', $2, true, NOW(), NOW())
          ON CONFLICT (firm_id, role, menu_key) DO NOTHING;
        `, [pf.firm_id, ct.key]);
      }
    }
  }
  console.log('Synchronized default sub-tab permissions for all active tenant firms');

  await client.end();
}

main().catch(console.error);
