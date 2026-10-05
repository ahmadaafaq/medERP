'use client';

import { useState, useEffect, useCallback } from 'react';

export const MODULE_SUB_TABS: Record<string, { key: string; label: string }[]> = {
  admin_college_master: [
    { key: 'admin_college_master_colleges', label: '1. College' },
    { key: 'admin_college_master_courses', label: '2. Courses' },
    { key: 'admin_college_master_professionals', label: '3. Academic Year' },
    { key: 'admin_college_master_batches', label: '4. Batch' },
    { key: 'admin_college_master_branches', label: '5. Departments & Specialties' },
    { key: 'admin_college_master_groups', label: '6. Section Groups' },
    { key: 'admin_college_master_sessions', label: '7. Session' },
    { key: 'admin_college_master_residencies', label: '8. Residency Category' },
  ],
  admin_admin_master: [
    { key: 'admin_admin_master_departments', label: '1. Department Master' },
    { key: 'admin_admin_master_subjects', label: '2. Subject Master' },
    { key: 'admin_admin_master_guidelines', label: '3. Guidelines' },
    { key: 'admin_admin_master_offerings', label: '4. Subject Offerings' },
    { key: 'admin_admin_master_delivery_types', label: '5. Delivery Types' },
    { key: 'admin_admin_master_units', label: '6. Unit Master' },
    { key: 'admin_admin_master_topics', label: '7. Topic Master' },
    { key: 'admin_admin_master_competencies', label: '8. Sub Topics' },
  ],
  admin_assessment: [
    { key: 'admin_assessment_bank', label: 'Question Bank' },
    { key: 'admin_assessment_design', label: 'Paper Designer' },
    { key: 'admin_assessment_publish', label: 'Published Assessments' },
  ],
  admin_assessment_marks: [
    { key: 'admin_assessment_marks_theory', label: 'Theory Evaluation' },
    { key: 'admin_assessment_marks_practical', label: 'Practical Evaluation' },
    { key: 'admin_assessment_marks_competency', label: 'Competency Scoring' },
  ],
  admin_medical_logbook: [
    { key: 'admin_medical_logbook_data_directory', label: '1. Data Directory' },
    { key: 'admin_medical_logbook_ug_logbook', label: '2. UG LogBook' },
    { key: 'admin_medical_logbook_pg_logbook', label: '3. PG LogBook' },
  ],
  faculty_medical_logbook: [
    { key: 'faculty_medical_logbook_data_directory', label: '1. Data Directory' },
    { key: 'faculty_medical_logbook_ug_logbook', label: '2. UG LogBook' },
    { key: 'faculty_medical_logbook_pg_logbook', label: '3. PG LogBook' },
  ],
  // ── MIS Reports sub-tabs (per role) ──────────────────────────────────────
  admin_reports: [
    { key: 'admin_reports_attendance', label: '📊 Attendance Report' },
    { key: 'admin_reports_theory_result', label: '📝 Theory Result' },
    { key: 'admin_reports_logbook', label: '📋 Academic Portfolio (Logbook)' },
  ],
  faculty_reports: [
    { key: 'faculty_reports_attendance', label: '📊 Attendance Report' },
    { key: 'faculty_reports_theory_result', label: '📝 Theory Result' },
    { key: 'faculty_reports_logbook', label: '📋 Academic Portfolio (Logbook)' },
  ],
  hod_faculty_reports: [
    { key: 'hod_reports_attendance', label: '📊 Dept Attendance Report' },
    { key: 'hod_reports_theory_result', label: '📝 Dept Theory Result' },
    { key: 'hod_reports_logbook', label: '📋 Dept Academic Portfolio (Logbook)' },
  ],
};

export const ALL_SUB_TAB_KEYS = new Set<string>(
  Object.values(MODULE_SUB_TABS).flatMap((tabs) => tabs.map((t) => t.key))
);

export function useRolePermissions(explicitTenantSlug?: string, explicitRole?: string) {
  const [enabledKeys, setEnabledKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPermissions = useCallback(async () => {
    try {
      let slug =
        explicitTenantSlug ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('tenantSlug') ||
            localStorage.getItem('selectedTenant') ||
            localStorage.getItem('college_slug') ||
            'srms-cet-bareilly'
          : 'srms-cet-bareilly');

      slug = slug.replace(/^tenant_/, '').replace(/^tenant-/, '').trim();
      if (!slug || slug === 'all' || slug === '1' || slug === 'srms' || slug === 'srms-cet') {
        slug = 'srms-cet-bareilly';
      }

      let role = explicitRole;
      if (!role && typeof window !== 'undefined') {
        role =
          localStorage.getItem('user_role') ||
          localStorage.getItem('role') ||
          'ADMIN';
      }
      if (!role) role = 'ADMIN';

      const res = await fetch(`/api/firms/${slug}/role-permissions?role=${role}&_t=${Date.now()}`, {
        cache: 'no-store',
      });

      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : json.data || [];
        const active = items
          .filter((p: any) => p.is_enabled !== false)
          .map((p: any) => p.menu_key);
        setEnabledKeys(active);
      }
    } catch (e) {
      console.warn('useRolePermissions fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [explicitTenantSlug, explicitRole]);

  useEffect(() => {
    fetchPermissions();

    const handleUpdate = () => {
      fetchPermissions();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('permissionsUpdated', handleUpdate);
      window.addEventListener('storage', handleUpdate);
      return () => {
        window.removeEventListener('permissionsUpdated', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      };
    }
  }, [fetchPermissions]);

  const isAllowed = useCallback(
    (menuKey: string, parentKey?: string): boolean => {
      // While initial loading or if permissions list isn't ready yet, allow to avoid flicker
      if (loading) return true;
      if (enabledKeys.length === 0) return true;

      const normKey = menuKey.replace(/[\/\-\.]+/g, '_');
      const directMatch =
        enabledKeys.includes(menuKey) ||
        enabledKeys.some((k) => k.replace(/[\/\-\.]+/g, '_') === normKey);

      if (directMatch) return true;

      // If checking a sub-tab under a parentKey
      if (parentKey) {
        const normParent = parentKey.replace(/[\/\-\.]+/g, '_');
        // Check if ANY sub-tab for this parent is configured in enabledKeys
        const hasAnySubTabConfigured = enabledKeys.some(
          (k) => k.startsWith(`${normParent}_`) || k.startsWith(`${parentKey}_`)
        );

        // If no sub-tabs have been configured/saved at all for this parent,
        // inherit the parent module's allowed status
        if (!hasAnySubTabConfigured) {
          return (
            enabledKeys.includes(parentKey) ||
            enabledKeys.some((k) => k.replace(/[\/\-\.]+/g, '_') === normParent)
          );
        }

        // Sub-tabs ARE configured, and this specific key is NOT enabled
        return false;
      }

      return false;
    },
    [enabledKeys, loading]
  );

  return {
    enabledKeys,
    loading,
    isAllowed,
    refresh: fetchPermissions,
  };
}
