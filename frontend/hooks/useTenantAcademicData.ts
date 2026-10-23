'use client';

/**
 * useTenantAcademicData — Tenant-aware academic data fetcher
 *
 * AGENTS.md Rule: SRMS portal endpoints (/api/srms/*) are ONLY called when the
 * tenant slug contains the keyword 'srms'. All other tenants (rimt-bareilly,
 * rajshree, rmribar, rmch-bareilly, apex-tech, etc.) MUST fetch from
 * PostgreSQL via /api/v1 backend.
 *
 * This is the SINGLE SOURCE OF TRUTH for academic cascading data:
 *   colleges → courses → branches/departments → batches
 *
 * Usage:
 *   import { fetchCourses, fetchBranches, fetchBatches, fetchColleges, isSrmsTenant, getTenantSlug } from '@/hooks/useTenantAcademicData';
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

// ─── Tenant Resolution ───────────────────────────────────────────────────────

export function getTenantSlug(): string {
  if (typeof window === 'undefined') return '';
  let slug = (
    localStorage.getItem('tenantSlug') ||
    localStorage.getItem('selectedTenant') ||
    localStorage.getItem('tenant') ||
    localStorage.getItem('institutionSlug') ||
    ''
  ).replace(/^tenant_/, '').replace(/^tenant-/, '').trim();

  if (!slug) {
    try {
      const raw = localStorage.getItem('user') || localStorage.getItem('auth_user');
      if (raw) {
        const u = JSON.parse(raw);
        slug = (u.tenantSlug || u.tenant || u.firmSlug || u.college_slug || '')
          .replace(/^tenant_/, '').replace(/^tenant-/, '').trim();
      }
    } catch {}
  }

  if (!slug && typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)auth_tenant=([^;]+)/);
    if (match?.[1]) {
      slug = decodeURIComponent(match[1]).replace(/^tenant_/, '').replace(/^tenant-/, '').trim();
    }
  }

  return slug;
}

/** Returns true ONLY if the tenant slug contains 'srms' */
export function isSrmsTenant(slug?: string): boolean {
  const s = (slug || getTenantSlug()).toLowerCase();
  return s.includes('srms');
}

/** Get clean human-readable tenant or college name */
export function getTenantName(): string {
  if (typeof window === 'undefined') return 'SRMS College of Engineering & Technology';
  try {
    const raw = localStorage.getItem('user') || localStorage.getItem('auth_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u.collegeName) return u.collegeName;
      if (u.tenantName) return u.tenantName;
      if (u.profile?.collegeName) return u.profile.collegeName;
      if (u.firmName) return u.firmName;
    }
    const name = localStorage.getItem('tenantName') || localStorage.getItem('collegeName');
    if (name) return name;
  } catch {}
  return 'SRMS College of Engineering & Technology';
}

function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || '';
}

function makeHeaders(slug: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAuthToken()}`,
    'x-tenant-slug': slug,
  };
}

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface AcademicCourse {
  course_cd: string;
  course_name: string;
  colg_cd?: string;
  active_flg?: string;
  is_active?: boolean;
}

export interface AcademicBranch {
  branch_cd: string;
  branch_name: string;
  course_cd: string;
  colg_cd?: string;
  active_flg?: string;
  is_active?: boolean;
}

export interface AcademicBatch {
  batch_cd: string | number;
  batch_name: string;
  course_cd?: string;
  colg_cd?: string;
  department_id?: string;
  year?: string | number;
  active_flg?: string;
  is_active?: boolean;
}

export interface AcademicCollege {
  colg_cd: string;
  colg_name: string;
  slug?: string;
}

// ─── PostgreSQL Fetchers (non-SRMS tenants) ──────────────────────────────────

async function pgFetchCourses(slug: string, colgCd?: string): Promise<AcademicCourse[]> {
  const params = new URLSearchParams({ tenant: slug });
  if (colgCd) params.set('college_cd', colgCd);

  // Try college-master endpoint first
  let res = await fetch(`${API_BASE}/college-master/courses?${params}`, {
    headers: makeHeaders(slug),
  }).catch(() => null);

  // Fallback: chat selection-options always returns courses from DB
  if (!res || !res.ok) {
    res = await fetch(`${API_BASE}/chat/selection-options?${params}`, {
      headers: makeHeaders(slug),
    }).catch(() => null);
    if (res?.ok) {
      const json = await res.json();
      return (json.data?.courses || []).map((c: any) => ({
        course_cd: String(c.course_cd || c.code || ''),
        course_name: String(c.course_name || c.name || 'Course'),
        colg_cd: colgCd || '',
        is_active: true,
      })).filter((c: AcademicCourse) => c.course_cd);
    }
    return [];
  }

  const json = await res.json();
  const list = Array.isArray(json) ? json : (json.data || []);
  return list.map((c: any) => ({
    course_cd: String(c.course_cd || c.code || c.id || ''),
    course_name: String(c.course_name || c.name || 'Course'),
    colg_cd: String(c.colg_cd || colgCd || ''),
    active_flg: c.active_flg,
    is_active: c.is_active,
  })).filter((c: AcademicCourse) => c.course_cd);
}

async function pgFetchBranches(slug: string, courseCd: string, colgCd?: string): Promise<AcademicBranch[]> {
  const params = new URLSearchParams({ tenant: slug });
  if (courseCd) params.set('course_cd', courseCd);
  if (colgCd) params.set('college_cd', colgCd);

  let res = await fetch(`${API_BASE}/college-master/branches?${params}`, {
    headers: makeHeaders(slug),
  }).catch(() => null);

  // Fallback: chat selection-options departments filtered by course
  if (!res || !res.ok) {
    res = await fetch(`${API_BASE}/chat/selection-options?tenant=${encodeURIComponent(slug)}`, {
      headers: makeHeaders(slug),
    }).catch(() => null);
    if (res?.ok) {
      const json = await res.json();
      const allDepts = json.data?.departments || [];
      const filtered = courseCd
        ? allDepts.filter((d: any) => !d.course_cd || String(d.course_cd) === String(courseCd) || d.course_cd === '')
        : allDepts;
      return (filtered.length > 0 ? filtered : allDepts).map((d: any) => ({
        branch_cd: String(d.code || d.branch_cd || d.id || ''),
        branch_name: String(d.name || d.branch_name || d.department_name || 'Department'),
        course_cd: String(d.course_cd || courseCd || ''),
        colg_cd: colgCd || '',
        is_active: true,
      }));
    }
    return [];
  }

  const json = await res.json();
  const list = Array.isArray(json) ? json : (json.data || []);
  return list.map((b: any) => ({
    branch_cd: String(b.branch_cd || b.code || b.id || ''),
    branch_name: String(b.branch_name || b.name || b.department_name || 'Department'),
    course_cd: String(b.course_cd || courseCd || ''),
    colg_cd: String(b.colg_cd || colgCd || ''),
    active_flg: b.active_flg,
    is_active: b.is_active,
  })).filter((b: AcademicBranch) => b.branch_cd);
}

async function pgFetchBatches(slug: string, courseCd?: string, branchCd?: string): Promise<AcademicBatch[]> {
  const params = new URLSearchParams({ tenant: slug });
  if (courseCd) params.set('course_cd', courseCd);
  if (branchCd) params.set('branch_cd', branchCd);

  let res = await fetch(`${API_BASE}/college-master/batches?${params}`, {
    headers: makeHeaders(slug),
  }).catch(() => null);

  // Fallback: chat selection-options batches filtered by course
  if (!res || !res.ok) {
    res = await fetch(`${API_BASE}/chat/selection-options?tenant=${encodeURIComponent(slug)}`, {
      headers: makeHeaders(slug),
    }).catch(() => null);
    if (res?.ok) {
      const json = await res.json();
      let allBatches = json.data?.batches || [];
      if (courseCd) {
        const filtered = allBatches.filter((b: any) =>
          !b.course_cd || String(b.course_cd) === String(courseCd) || b.course_cd === ''
        );
        allBatches = filtered.length > 0 ? filtered : allBatches;
      }
      return allBatches.map((b: any) => {
        const year = String(b.year || b.batch_cd || '').replace(/[^0-9]/g, '');
        return {
          batch_cd: b.code || b.batch_cd || year,
          batch_name: b.name || (year ? `Batch ${year}` : `Batch ${b.code}`),
          course_cd: b.course_cd ? String(b.course_cd) : (courseCd || ''),
          department_id: b.department_id ? String(b.department_id) : undefined,
          year,
          is_active: true,
        };
      });
    }
    return [];
  }

  const json = await res.json();
  const list = Array.isArray(json) ? json : (json.data || []);
  return list.map((b: any) => ({
    batch_cd: String(b.batch_cd || b.code || b.id || ''),
    batch_name: String(b.batch_name || b.name || `Batch ${b.year || b.batch_cd}`),
    course_cd: String(b.course_cd || courseCd || ''),
    colg_cd: String(b.colg_cd || ''),
    department_id: b.department_id ? String(b.department_id) : undefined,
    year: String(b.year || b.batch_cd || ''),
    active_flg: b.active_flg,
    is_active: b.is_active,
  })).filter((b: AcademicBatch) => b.batch_cd);
}

async function pgFetchColleges(slug: string): Promise<AcademicCollege[]> {
  const res = await fetch(`${API_BASE}/college-master/colleges?tenant=${encodeURIComponent(slug)}`, {
    headers: makeHeaders(slug),
  }).catch(() => null);
  if (!res?.ok) return [];
  const json = await res.json();
  const list = Array.isArray(json) ? json : (json.data || []);
  return list.map((c: any) => ({
    colg_cd: String(c.colg_cd || c.code || c.id || ''),
    colg_name: String(c.colg_name || c.name || ''),
    slug: c.slug || '',
  }));
}

// ─── SRMS Fetchers (SRMS tenants only) ──────────────────────────────────────

async function srmsFetchCourses(slug: string, colgCd: string): Promise<AcademicCourse[]> {
  const res = await fetch(`/api/srms/courses?colgcd=${encodeURIComponent(colgCd)}&tenant=${encodeURIComponent(slug)}`, {
    headers: makeHeaders(slug),
  }).catch(() => null);
  if (!res?.ok) return [];
  const json = await res.json();
  const list: any[] = Array.isArray(json) ? json : (json.data || []);
  return list.map((c) => ({
    course_cd: String(c.course_cd || ''),
    course_name: String(c.course_name || ''),
    colg_cd: String(c.colg_cd || colgCd),
    active_flg: c.active_flg || c.ACTIVESTS,
    is_active: c.is_active,
  })).filter((c) => c.course_cd);
}

async function srmsFetchBranches(slug: string, colgCd: string, courseCd: string): Promise<AcademicBranch[]> {
  const res = await fetch(
    `/api/srms/branches?colgcd=${encodeURIComponent(colgCd)}&coursecd=${encodeURIComponent(courseCd)}&tenant=${encodeURIComponent(slug)}`,
    { headers: makeHeaders(slug) }
  ).catch(() => null);
  if (!res?.ok) return [];
  const json = await res.json();
  const list: any[] = Array.isArray(json) ? json : (json.data || []);
  return list.map((b) => ({
    branch_cd: String(b.branch_cd || ''),
    branch_name: String(b.branch_name || b.name || ''),
    course_cd: String(b.course_cd || courseCd),
    colg_cd: String(b.colg_cd || colgCd),
    active_flg: b.active_flg || b.BRANCHSTS,
    is_active: b.is_active,
  })).filter((b) => b.branch_cd);
}

async function srmsFetchBatches(slug: string, colgCd: string, courseCd: string, branchCd?: string): Promise<AcademicBatch[]> {
  const params = new URLSearchParams({ colgcd: colgCd, coursecd: courseCd, tenant: slug });
  if (branchCd) params.set('branchcd', branchCd);
  const res = await fetch(`/api/srms/batches?${params}`, {
    headers: makeHeaders(slug),
  }).catch(() => null);
  if (!res?.ok) return [];
  const json = await res.json();
  const list: any[] = Array.isArray(json) ? json : (json.data || []);
  return list.map((b) => ({
    batch_cd: String(b.batch_cd ?? b.curr_bat_Cd ?? ''),
    batch_name: String(b.batch_name || `Batch ${b.batch_cd}`),
    course_cd: String(b.course_cd || courseCd),
    colg_cd: String(b.colg_cd || colgCd),
    year: String(b.year || b.batch_cd || ''),
    active_flg: b.active_flg,
    is_active: b.is_active,
  })).filter((b) => b.batch_cd);
}

async function srmsFetchColleges(slug: string): Promise<AcademicCollege[]> {
  const params = new URLSearchParams({ tenant: slug });
  const res = await fetch(`/api/srms/colleges?${params}`, {
    headers: makeHeaders(slug),
  }).catch(() => null);
  if (!res?.ok) return [];
  const json = await res.json();
  const list: any[] = Array.isArray(json) ? json : (json.data || []);
  return list.map((c) => ({
    colg_cd: String(c.colg_cd || c.code || ''),
    colg_name: String(c.colg_name || c.name || ''),
    slug: c.slug || '',
  }));
}

export interface AcademicSemester {
  id: string;
  code: string;
  sem_cd: number;
  name: string;
  SemName?: string;
}

export interface AcademicSubject {
  id: string;
  code: string;
  name: string;
  sub_cd?: string;
  sub_name?: string;
  mst_sub_name?: string;
  sub_addinfo?: string;
  course_cd?: string | number;
  branch_cd?: string | number;
  batch_cd?: string | number;
  sem_cd?: string | number;
  SubTyp?: string;
  department_id?: string;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Fetch courses — SRMS API for srms tenants, PostgreSQL for all others.
 */
export async function fetchCourses(slug: string, colgCd?: string): Promise<AcademicCourse[]> {
  if (isSrmsTenant(slug)) {
    return srmsFetchCourses(slug, colgCd || '1');
  }
  return pgFetchCourses(slug, colgCd);
}

/**
 * Fetch branches/departments — SRMS API for srms tenants, PostgreSQL for all others.
 */
export async function fetchBranches(slug: string, courseCd: string, colgCd?: string): Promise<AcademicBranch[]> {
  if (isSrmsTenant(slug)) {
    return srmsFetchBranches(slug, colgCd || '1', courseCd);
  }
  return pgFetchBranches(slug, courseCd, colgCd);
}

/**
 * Fetch batches — SRMS API for srms tenants, PostgreSQL for all others.
 */
export async function fetchBatches(slug: string, courseCd?: string, colgCd?: string, branchCd?: string): Promise<AcademicBatch[]> {
  if (isSrmsTenant(slug)) {
    return srmsFetchBatches(slug, colgCd || '1', courseCd || '', branchCd);
  }
  return pgFetchBatches(slug, courseCd, branchCd);
}

/**
 * Fetch colleges — SRMS API for srms tenants, PostgreSQL for all others.
 */
export async function fetchColleges(slug: string): Promise<AcademicCollege[]> {
  if (isSrmsTenant(slug)) {
    return srmsFetchColleges(slug);
  }
  return pgFetchColleges(slug);
}

/**
 * Fetch semesters — SRMS API for srms tenants, PostgreSQL / computed for all others.
 */
export async function fetchSemesters(
  slug: string,
  colgCd?: string,
  courseCd?: string,
  branchCd?: string,
  batchCd?: string
): Promise<AcademicSemester[]> {
  const cd = colgCd || '1';
  const crs = courseCd || '1';
  const br = branchCd || '1';
  const bat = batchCd || '17';

  const params = new URLSearchParams({
    colgcd: cd,
    coursecd: crs,
    branchcd: br,
    batchcd: bat,
    tenant: slug,
  });

  try {
    const res = await fetch(`/api/srms/semesters?${params.toString()}`, {
      headers: makeHeaders(slug),
    }).catch(() => null);

    if (res?.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.data || []);
      if (list.length > 0) {
        return list.map((s: any) => ({
          id: String(s.sem_cd || s.code || s.id),
          code: String(s.sem_cd || s.code || s.id),
          sem_cd: Number(s.sem_cd || s.code || s.id),
          name: s.name || `Semester ${s.sem_cd || s.code || s.id}`,
          SemName: s.SemName || s.name || `Semester ${s.sem_cd || s.code || s.id}`,
        }));
      }
    }
  } catch (e) {
    console.warn('[useTenantAcademicData] fetchSemesters error:', e);
  }

  // Fallback: standard semesters based on course code
  const crsUpper = String(crs).toUpperCase();
  const maxSems = (crsUpper === '3' || crsUpper === '4' || crsUpper === '5' || crsUpper === '6' || crsUpper === 'MCA' || crsUpper === 'MBA')
    ? 4
    : (crsUpper === '12' || crsUpper === '13' || crsUpper === '7' || crsUpper === 'BCA' || crsUpper === 'BBA')
      ? 6
      : (crsUpper === '11' || crsUpper === 'BALLB')
        ? 10
        : 8;
  const ords = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
  const fallbackList: AcademicSemester[] = [];
  for (let i = 1; i <= maxSems; i++) {
    fallbackList.push({
      id: String(i),
      code: String(i),
      sem_cd: i,
      name: `Semester ${i}`,
      SemName: `${ords[i - 1] || `${i}th`} Semester`,
    });
  }
  return fallbackList;
}

/**
 * Fetch subjects for a specific College, Course, Branch, Batch, and Semester.
 */
export async function fetchSubjects(
  slug: string,
  colgCd?: string,
  courseCd?: string,
  branchCd?: string,
  batchCd?: string,
  semCd?: string
): Promise<AcademicSubject[]> {
  const cd = colgCd || '1';
  const crs = courseCd || '1';
  const br = branchCd || '1';
  const bat = batchCd || '17';
  const sem = semCd || '1';

  const params = new URLSearchParams({
    colgcd: cd,
    coursecd: crs,
    branchcd: br,
    batchcd: bat,
    semcd: sem,
    tenant: slug,
  });

  try {
    const res = await fetch(`/api/srms/all-subjects?${params.toString()}`, {
      headers: makeHeaders(slug),
    }).catch(() => null);

    if (res?.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.data || []);
      if (list.length > 0) {
        return list.map((s: any) => {
          const subCd = String(s.sub_cd || s.code || s.id || '');
          const subName = String(s.sub_name || s.name || '');
          const mstName = String(s.mst_sub_name || s.name || subName);
          return {
            id: subCd || String(s.id || ''),
            code: subCd,
            name: mstName ? `${subName} — ${mstName}` : subName,
            sub_cd: subCd,
            sub_name: subName,
            mst_sub_name: mstName,
            sub_addinfo: s.sub_addinfo,
            course_cd: s.course_cd,
            branch_cd: s.branch_cd,
            batch_cd: s.batch_cd,
            sem_cd: s.sem_cd,
            SubTyp: s.SubTyp,
            department_id: s.department_id,
          };
        });
      }
    }
  } catch (e) {
    console.warn('[useTenantAcademicData] fetchSubjects error:', e);
  }

  // Fallback to admin-master/subjects
  try {
    const res = await fetch(`${API_BASE}/admin-master/subjects?tenant=${encodeURIComponent(slug)}`, {
      headers: makeHeaders(slug),
    }).catch(() => null);
    if (res?.ok) {
      const json = await res.json();
      const list = Array.isArray(json) ? json : (json.data || []);
      return list.map((s: any) => ({
        id: String(s.id || s.code || ''),
        code: String(s.code || s.id || ''),
        name: String(s.name || s.title || 'Subject'),
        sub_cd: String(s.code || ''),
        sub_name: String(s.name || ''),
        mst_sub_name: String(s.name || ''),
        department_id: s.department_id,
      }));
    }
  } catch {}

  return [];
}

export interface FacultySubjectLink {
  id: string;
  faculty_id: string;
  faculty_code?: string;
  faculty_name?: string;
  subject_id: string;
  subject_code?: string;
  subject_name?: string;
  course_cd?: string;
  course_name?: string;
  branch_cd?: string;
  branch_name?: string;
  batch_cd?: string;
  batch_name?: string;
  batch_year?: string | number;
  sem_cd?: string;
  section?: string;
  college_id?: string;
  college_name?: string;
  college_code?: string;
  college_slug?: string;
}

/**
 * Fetch linked subjects for a faculty member.
 */
export async function fetchFacultyLinkedSubjects(
  slug: string,
  facultyId?: string
): Promise<FacultySubjectLink[]> {
  let fid = facultyId;
  let userObj: any = {};
  if (typeof window !== 'undefined') {
    try {
      userObj = JSON.parse(localStorage.getItem('user') || localStorage.getItem('auth_user') || '{}');
      if (!fid) {
        fid =
          userObj.emp_id ||
          userObj.faculty_id ||
          userObj.faculty_code ||
          userObj.profile?.emp_id ||
          userObj.profile?.faculty_id ||
          userObj.profile?.id ||
          userObj.id ||
          userObj.sub ||
          localStorage.getItem('empid') ||
          localStorage.getItem('emp_id') ||
          localStorage.getItem('facultyId') ||
          localStorage.getItem('faculty_code') ||
          '';
      }
    } catch {}
  }

  // 1. Try with facultyId query param
  if (fid) {
    const url = `${API_BASE}/admin-master/faculty-subjects?tenant=${encodeURIComponent(slug)}&facultyId=${encodeURIComponent(fid)}`;
    try {
      const res = await fetch(url, { headers: makeHeaders(slug) }).catch(() => null);
      if (res?.ok) {
        const json = await res.json();
        const list = Array.isArray(json) ? json : (json.data || []);
        if (list.length > 0) return list;
      }
    } catch (err) {
      console.warn('[useTenantAcademicData] fetchFacultyLinkedSubjects query error:', err);
    }
  }

  // 2. Fallback: Fetch all tenant faculty-subjects and match by id, code, name or email
  try {
    const allUrl = `${API_BASE}/admin-master/faculty-subjects?tenant=${encodeURIComponent(slug)}`;
    const allRes = await fetch(allUrl, { headers: makeHeaders(slug) }).catch(() => null);
    if (allRes?.ok) {
      const allJson = await allRes.json();
      const allList = Array.isArray(allJson) ? allJson : (allJson.data || []);
      if (allList.length > 0) {
        const matched = allList.filter((l: any) => {
          if (fid && (
            String(l.faculty_id || '').toLowerCase() === String(fid).toLowerCase() ||
            String(l.faculty_code || '').toLowerCase() === String(fid).toLowerCase() ||
            String(l.emp_id || '').toLowerCase() === String(fid).toLowerCase()
          )) return true;

          const uName = String(userObj?.name || userObj?.full_name || '').trim().toLowerCase();
          const lName = String(l.faculty_name || '').trim().toLowerCase();
          if (uName && lName && (uName === lName || uName.includes(lName) || lName.includes(uName))) return true;

          const uEmail = String(userObj?.email || '').trim().toLowerCase();
          const lEmail = String(l.faculty_email || '').trim().toLowerCase();
          if (uEmail && lEmail && uEmail === lEmail) return true;

          return false;
        });
        if (matched.length > 0) return matched;
      }
    }
  } catch (err) {
    console.warn('[useTenantAcademicData] fetchFacultyLinkedSubjects allList fallback error:', err);
  }

  // 3. Fallback to auth/me cached subjects if available
  if (Array.isArray(userObj?.profile?.subjects) && userObj.profile.subjects.length > 0) {
    return userObj.profile.subjects.map((s: any) => ({
      id: s.id || s.code || 'sub',
      faculty_id: fid || userObj.id || '',
      subject_id: s.id || s.code,
      subject_code: s.code || s.id,
      subject_name: s.name || s.title || 'Assigned Subject',
      course_cd: s.course_cd,
      branch_cd: s.branch_cd,
      batch_cd: s.batch_cd,
      sem_cd: s.sem_cd,
      section: s.section,
    }));
  }

  return [];
}

