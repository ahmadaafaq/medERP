'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import CompanyCard, { PlacementCompany } from '../../../../components/placement/CompanyCard';
import CompanyDetailDrawer from '../../../../components/placement/CompanyDetailDrawer';
import { 
  Building2, 
  Download, 
  Search, 
  Users, 
  Loader2, 
  X,
  Award
} from 'lucide-react';

export default function FacultyPlacementPage() {
  const [companies, setCompanies] = useState<PlacementCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Academic Hierarchy Cascading Filters (Matching Admin Placement Component)
  const [userRole, setUserRole] = useState<string>('FACULTY');
  const [collegesList, setCollegesList] = useState<any[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<string>('1');

  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');

  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');

  const [batchesList, setBatchesList] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('ALL');

  const [selectedSemester, setSelectedSemester] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [selectedCompany, setSelectedCompany] = useState<PlacementCompany | null>(null);

  // Applicants view
  const [applicantsModalCompany, setApplicantsModalCompany] = useState<PlacementCompany | null>(null);
  const [applicantsList, setApplicantsList] = useState<any[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  const getTenantSlug = () => {
    if (typeof window === 'undefined') return 'srms-cet-bareilly';
    const slug =
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('selectedTenant') ||
      localStorage.getItem('colg_slug') ||
      'srms-cet-bareilly';
    return (slug || 'srms-cet-bareilly').replace(/^tenant_/, '').replace(/^tenant-/, '');
  };

  const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {};
    const tenant = getTenantSlug();
    const token = localStorage.getItem('token') || localStorage.getItem('access_token') || localStorage.getItem('accessToken');
    const headers: Record<string, string> = {
      'x-tenant-id': tenant,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchColleges = async () => {
    try {
      const res = await fetch('/api/srms/colleges');
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          return list.map((c: any) => ({
            code: String(c.colg_cd || c.code || '1'),
            name: c.name || c.colg_name || 'SRMS CET Bareilly',
            slug: c.slug || 'srms-cet-bareilly',
          }));
        }
      }
    } catch {}
    return [{ code: '1', name: 'SRMS College of Engineering & Technology, Bareilly', slug: 'srms-cet-bareilly' }];
  };

  const fetchCoursesForCollege = async (colgcd: string) => {
    const cd = colgcd || '1';
    const slug = getTenantSlug();
    try {
      const res = await fetch(`/api/srms/courses?colgcd=${cd}&tenant=${slug}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((c: any) => ({
            code: String(c.course_cd || c.code || '1'),
            name: c.course_name || c.name || `Course ${c.course_cd}`,
            colg_cd: String(c.colg_cd || cd),
          }));
          setCoursesList(mapped);
          return mapped;
        }
      }
    } catch {}
    setCoursesList([]);
    return [];
  };

  const fetchBranchesForCourse = async (colgcd: string, coursecd: string) => {
    const cd = colgcd || '1';
    const crs = coursecd || '13';
    const slug = getTenantSlug();
    try {
      const res = await fetch(`/api/srms/branches?colgcd=${cd}&coursecd=${crs}&tenant=${slug}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const courseObj = coursesList.find(c => String(c.code) === String(crs));
          const courseName = courseObj?.name || 'BCA';
          const mapped = list.map((b: any) => {
            const rawName = (b.branch_name || b.name || '').trim();
            const validName = (rawName && rawName !== '-' && rawName !== 'null' && rawName !== 'NONE')
              ? rawName
              : `${b.course_name || courseName} General`;
            return {
              id: String(b.branch_cd || b.code || '1'),
              code: String(b.branch_cd || b.code || '1'),
              branch_cd: String(b.branch_cd || b.code || '1'),
              name: validName,
              course_cd: String(b.course_cd || crs),
              colg_cd: String(b.colg_cd || cd),
            };
          });
          setBranchesList(mapped);
          return mapped;
        }
      }
    } catch {}
    setBranchesList([]);
    return [];
  };

  const fetchBatchesForCourse = async (colgcd: string, coursecd: string) => {
    const cd = colgcd || '1';
    const crs = coursecd || '13';
    const slug = getTenantSlug();
    try {
      const res = await fetch(`/api/srms/batches?colgcd=${cd}&coursecd=${crs}&tenant=${slug}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((b: any) => ({
            code: String(b.batch_cd || b.code || b.batch_name || '1'),
            name: String(b.batch_name || b.name || b.year || b.batch_cd),
            year: Number(b.batch_name || b.year || 2025),
            course_cd: String(b.course_cd || crs),
            colg_cd: String(b.colg_cd || cd),
          }));
          setBatchesList(mapped);
          return mapped;
        }
      }
    } catch {}
    setBatchesList([]);
    return [];
  };

  const handleFilterCollegeChange = async (colgCode: string) => {
    setSelectedCollege(colgCode);
    const courses = await fetchCoursesForCollege(colgCode);
    if (courses.length > 0) {
      const initialCourseCd = courses[0].code;
      setSelectedCourse(initialCourseCd);
      const branches = await fetchBranchesForCourse(colgCode, initialCourseCd);
      if (branches.length > 0) setSelectedBranch(branches[0].code);
      const batches = await fetchBatchesForCourse(colgCode, initialCourseCd);
      if (batches.length > 0) setSelectedBatch(batches[0].code);
    }
  };

  const handleFilterCourseChange = async (courseCode: string) => {
    setSelectedCourse(courseCode);
    if (courseCode === 'ALL') {
      setSelectedBranch('ALL');
      setSelectedBatch('ALL');
      setBranchesList([]);
      setBatchesList([]);
      return;
    }
    const branches = await fetchBranchesForCourse(selectedCollege, courseCode);
    setSelectedBranch('ALL');
    const batches = await fetchBatchesForCourse(selectedCollege, courseCode);
    setSelectedBatch('ALL');
  };

  const handleFilterBranchChange = (branchCode: string) => {
    setSelectedBranch(branchCode);
  };

  const handleFilterBatchChange = (batchCode: string) => {
    setSelectedBatch(batchCode);
  };

  const handleFilterSemesterChange = (semester: string) => {
    setSelectedSemester(semester);
  };

  useEffect(() => {
    const initData = async () => {
      const role = (typeof window !== 'undefined' ? (localStorage.getItem('role') || 'FACULTY') : 'FACULTY').toUpperCase();
      const userColg = typeof window !== 'undefined' ? (localStorage.getItem('colg_cd') || localStorage.getItem('colgCd') || '1') : '1';
      const userSlug = getTenantSlug();
      setUserRole(role);

      const allColleges = await fetchColleges();
      let filteredColleges = allColleges;
      if (role !== 'SUPER_ADMIN') {
        const myCol = allColleges.find((c: any) => String(c.colg_cd || c.code) === String(userColg) || String(c.code) === String(userColg) || c.slug === userSlug);
        if (myCol) {
          filteredColleges = [myCol];
        } else {
          filteredColleges = [{
            code: userColg,
            name: 'SRMS College of Engineering & Technology, Bareilly',
            slug: userSlug,
          }];
        }
      }
      setCollegesList(filteredColleges);
      const activeColCode = role === 'SUPER_ADMIN' ? (filteredColleges[0]?.code || '1') : userColg;
      setSelectedCollege(activeColCode);

      const courses = await fetchCoursesForCollege(activeColCode);
      const bca = courses.find(c => c.code === '13' || c.name === 'BCA') || courses[0];
      const initialCourseCd = bca ? bca.code : '13';
      setSelectedCourse(initialCourseCd);

      await fetchBranchesForCourse(activeColCode, initialCourseCd);
      setSelectedBranch('ALL');

      await fetchBatchesForCourse(activeColCode, initialCourseCd);
      setSelectedBatch('ALL');

      await fetchDrives();
    };

    initData();
  }, []);

  const fetchDrives = async () => {
    setLoading(true);
    try {
      const tenant = getTenantSlug();
      const headers = getAuthHeaders();
      const res = await axios.get(`/api/placement-drive/list?tenant=${tenant}`, { headers }).catch(async () => {
        return axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/placement-drive/list?tenant=${tenant}`, { headers });
      });
      const dataObj = res.data?.data || res.data;
      const list = Array.isArray(dataObj?.data) ? dataObj.data : Array.isArray(dataObj) ? dataObj : [];
      setCompanies(list);
    } catch (e) {
      console.error('Error fetching placement drives:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApplicants = async (company: PlacementCompany) => {
    setApplicantsModalCompany(company);
    setLoadingApplicants(true);
    try {
      const tenant = getTenantSlug();
      const headers = getAuthHeaders();
      const res = await axios.get(`/api/placement-drive/${company.drive_id}?tenant=${tenant}`, { headers }).catch(async () => {
        return axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/placement-drive/${company.drive_id}?tenant=${tenant}`, { headers });
      });
      const dataObj = res.data?.data || res.data;
      const apps = Array.isArray(dataObj?.applicants) ? dataObj.applicants : Array.isArray(dataObj) ? dataObj : [];
      setApplicantsList(apps);
    } catch (e) {
      console.error('Error fetching applicants:', e);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleUpdateStatus = async (appId: number, status: string) => {
    try {
      const tenant = getTenantSlug();
      const headers = getAuthHeaders();
      await axios.patch(`/api/placement-drive/applicant/${appId}/status?tenant=${tenant}`, { status }, { headers }).catch(async () => {
        return axios.patch(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/placement-drive/applicant/${appId}/status?tenant=${tenant}`, { status }, { headers });
      });
      if (applicantsModalCompany) {
        handleOpenApplicants(applicantsModalCompany);
      }
      fetchDrives();
    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  const handleExportCompany = async (driveId: number, companyName: string, status?: string) => {
    try {
      const tenant = getTenantSlug();
      const headers = getAuthHeaders();
      const url = status
        ? `/api/placement-drive/export?tenant=${tenant}&drive_id=${driveId}&status=${status}`
        : `/api/placement-drive/export?tenant=${tenant}&drive_id=${driveId}`;
      const res = await axios.get(url, { headers }).catch(async () => {
        return axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/placement-drive/export?tenant=${tenant}&drive_id=${driveId}${status ? `&status=${status}` : ''}`, { headers });
      });
      const rows = res.data?.data || res.data || [];
      if (rows.length === 0) {
        alert(`No ${status || ''} applicant records found for ${companyName}.`);
        return;
      }
      const headerRow = ['Student Name', 'Reg No', 'Course', 'Batch', 'Company', 'Role', 'Package', 'Status', 'Applied Date'];
      const csvContent = 'data:text/csv;charset=utf-8,' +
        [headerRow.join(','), ...rows.map((r: any) => [
          `"${r.student_name || ''}"`,
          `"${r.registration_no || ''}"`,
          `"${r.course_cd || ''}"`,
          `"${r.batch_cd || ''}"`,
          `"${r.company_name || ''}"`,
          `"${r.role || ''}"`,
          `"${r.package_ctc || ''}"`,
          `"${r.status || ''}"`,
          `"${r.applied_at || ''}"`,
        ].join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Applicants.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  const filteredCompanies = companies.filter((c: any) => {
    const matchSearch =
      !search.trim() ||
      c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.role?.toLowerCase().includes(search.toLowerCase()) ||
      c.package_ctc?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());

    // 1. Course Match (Supports codes '13', names 'BCA', and target cohorts array)
    let matchCourse = true;
    if (selectedCourse && selectedCourse !== 'ALL') {
      const selectedCourseStr = String(selectedCourse).trim();
      const selectedCourseObj = coursesList.find(cr => String(cr.code).trim() === selectedCourseStr);
      const selectedCourseName = selectedCourseObj?.name ? String(selectedCourseObj.name).trim().toUpperCase() : '';

      const driveCourses = [
        ...(Array.isArray(c.courses) ? c.courses : typeof c.courses === 'string' ? c.courses.split(',') : []),
        ...(c.eligibility_course_cd ? String(c.eligibility_course_cd).split(',') : []),
        ...(c.extra_fields?.target_cohorts && Array.isArray(c.extra_fields.target_cohorts) 
          ? c.extra_fields.target_cohorts.flatMap((tc: any) => [tc.course_cd, tc.course_name])
          : [])
      ].map(crs => String(crs || '').trim().toUpperCase()).filter(Boolean);

      if (driveCourses.length > 0) {
        matchCourse = driveCourses.some(crs => 
          crs === selectedCourseStr.toUpperCase() ||
          (selectedCourseName && (crs.includes(selectedCourseName) || selectedCourseName.includes(crs)))
        );
      }
    }

    // 2. Branch Match (Supports codes, General, and target cohorts array)
    let matchBranch = true;
    if (selectedBranch && selectedBranch !== 'ALL') {
      const selectedBranchStr = String(selectedBranch).trim().toUpperCase();
      const selectedBranchObj = branchesList.find(br => String(br.code).trim() === selectedBranchStr);
      const selectedBranchName = selectedBranchObj?.name ? String(selectedBranchObj.name).trim().toUpperCase() : '';

      const driveBranches = [
        ...(Array.isArray(c.eligible_branches) ? c.eligible_branches : typeof c.eligible_branches === 'string' ? c.eligible_branches.split(',') : []),
        ...(Array.isArray(c.branches) ? c.branches : typeof c.branches === 'string' ? c.branches.split(',') : []),
        ...(c.eligibility_branch_cd ? String(c.eligibility_branch_cd).split(',') : []),
        ...(c.extra_fields?.target_cohorts && Array.isArray(c.extra_fields.target_cohorts)
          ? c.extra_fields.target_cohorts.flatMap((tc: any) => [tc.branch_cd, tc.branch_name])
          : [])
      ].map(b => String(b || '').trim().toUpperCase()).filter(Boolean);

      if (driveBranches.length > 0) {
        matchBranch = driveBranches.some(b =>
          b === selectedBranchStr ||
          (selectedBranchName && (b.includes(selectedBranchName) || selectedBranchName.includes(b)))
        );
      }
    }

    // 3. Batch Match (Supports years 2025, codes, and target cohort batch objects)
    let matchBatch = true;
    if (selectedBatch && selectedBatch !== 'ALL') {
      const selectedBatchStr = String(selectedBatch).trim();
      const selectedBatchObj = batchesList.find(bt => String(bt.code).trim() === selectedBatchStr);
      const selectedBatchName = selectedBatchObj?.name ? String(selectedBatchObj.name).trim() : '';
      const selectedBatchYear = selectedBatchObj?.year ? String(selectedBatchObj.year).trim() : '';

      const driveBatches = [
        ...(Array.isArray(c.eligible_batches) ? c.eligible_batches : typeof c.eligible_batches === 'string' ? c.eligible_batches.split(',') : []),
        ...(Array.isArray(c.batches) ? c.batches : typeof c.batches === 'string' ? c.batches.split(',') : []),
        ...(c.eligibility_batch_cd ? String(c.eligibility_batch_cd).split(',') : []),
        ...(c.extra_fields?.target_cohorts && Array.isArray(c.extra_fields.target_cohorts)
          ? c.extra_fields.target_cohorts.flatMap((tc: any) => [tc.batch_cd, tc.batch_name])
          : [])
      ].map(b => String(b || '').trim()).filter(Boolean);

      if (driveBatches.length > 0) {
        matchBatch = driveBatches.some(b =>
          b === selectedBatchStr ||
          (selectedBatchName && (b.includes(selectedBatchName) || selectedBatchName.includes(b))) ||
          (selectedBatchYear && (b.includes(selectedBatchYear) || selectedBatchYear.includes(b)))
        );
      }
    }

    const matchStatus =
      statusFilter === 'ALL' || (c.status || '').toUpperCase() === statusFilter.toUpperCase();

    return matchSearch && matchCourse && matchBranch && matchBatch && matchStatus;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#F6F8FC] dark:bg-slate-900">
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="Department Placement & Career Oversight" />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#5B4BFF] uppercase tracking-wider mb-1">
                <span>Placement Board</span>
                <span>•</span>
                <span>Departmental Oversight</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#1B1E28] dark:text-white tracking-tight">
                Corporate Recruitment Drives
              </h1>
              <p className="text-xs sm:text-sm text-[#4E5969] dark:text-slate-400 mt-1">
                Monitor visiting companies, review departmental applicants, and export shortlisted cohorts.
              </p>
            </div>
          </div>

          {/* Academic Hierarchy Cascading Filter Bar (Matching Timetable & Admin Placement Design) */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* 1. College Selector — Locked for Non-SuperAdmins */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-sm hover:border-[#5B4BFF]/40 transition-all">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                  <span>🏛️</span> College:
                </span>
                <select
                  value={selectedCollege}
                  disabled={userRole !== 'SUPER_ADMIN'}
                  onChange={(e) => handleFilterCollegeChange(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer disabled:cursor-not-allowed text-xs max-w-[220px] truncate"
                >
                  {collegesList.map((colg, idx) => (
                    <option key={colg.code || idx} value={colg.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      [#{colg.code}] {colg.name}
                    </option>
                  ))}
                </select>
                {userRole !== 'SUPER_ADMIN' && (
                  <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-black px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 shrink-0">
                    🔒 Locked
                  </span>
                )}
              </div>

              {/* 2. Course Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-sm hover:border-[#5B4BFF]/40 transition-all">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                  <span>🎓</span> Course <span className="font-extrabold text-[#5B4BFF] dark:text-indigo-400">({coursesList.length})</span>:
                </span>
                <select
                  value={selectedCourse}
                  onChange={(e) => handleFilterCourseChange(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[180px] truncate"
                >
                  <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Courses</option>
                  {coursesList.map((crs, idx) => (
                    <option key={crs.code || idx} value={crs.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      [#{crs.code}] {crs.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Branch Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-sm hover:border-[#5B4BFF]/40 transition-all">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                  <span>🏢</span> Branch <span className="font-extrabold text-[#5B4BFF] dark:text-indigo-400">({branchesList.length})</span>:
                </span>
                <select
                  value={selectedBranch}
                  onChange={(e) => handleFilterBranchChange(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[180px] truncate"
                >
                  <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Branches</option>
                  {branchesList.map((br: any, idx: number) => (
                    <option key={br.code || idx} value={br.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      [#{br.code}] {br.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Batch Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800/80 border border-indigo-400/60 dark:border-indigo-700 rounded-xl px-3 py-2 text-xs shadow-sm hover:border-[#5B4BFF] transition-all">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                  <span>👥</span> Batch <span className="font-extrabold text-[#5B4BFF] dark:text-indigo-400">({batchesList.length})</span> *:
                </span>
                <select
                  value={selectedBatch}
                  onChange={(e) => handleFilterBatchChange(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-black focus:outline-none cursor-pointer text-xs max-w-[180px] truncate"
                >
                  <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Batches</option>
                  {batchesList.map((batch, idx) => (
                    <option key={batch.code || idx} value={batch.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      [#{batch.code}] Batch {batch.name || batch.year} {batch.year && batch.name !== String(batch.year) ? `(${batch.year})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Semester Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-sm hover:border-[#5B4BFF]/40 transition-all">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                  <span>📖</span> Semester:
                </span>
                <select
                  value={selectedSemester}
                  onChange={(e) => handleFilterSemesterChange(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[140px] truncate"
                >
                  <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={String(sem)} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      [#{sem}] Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Status Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-sm hover:border-[#5B4BFF]/40 transition-all">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                  <span>📊</span> Status:
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[140px] truncate"
                >
                  <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Statuses</option>
                  <option value="OPEN" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Open / Active</option>
                  <option value="CLOSED" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Closed</option>
                </select>
              </div>

              {/* Search Bar Inline */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search company, role, package..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                />
              </div>

            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#5B4BFF] animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Loading placement board...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="p-16 text-center rounded-[28px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
              <Building2 className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                No active placement drives found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Try selecting &ldquo;All Courses&rdquo;, &ldquo;All Branches&rdquo;, or adjusting your filter criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCompanies.map((comp) => (
                <CompanyCard
                  key={comp.drive_id}
                  company={comp}
                  role="faculty"
                  onViewDetails={(c) => setSelectedCompany(c)}
                  onManageApplicants={(c) => handleOpenApplicants(c)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <CompanyDetailDrawer
        company={selectedCompany}
        role="faculty"
        onClose={() => setSelectedCompany(null)}
      />

      {/* Faculty Applicants Modal */}
      {applicantsModalCompany && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-[#5B4BFF]">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {applicantsModalCompany.company_name} — Applicants
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {applicantsModalCompany.role} ({applicantsModalCompany.package_ctc})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportCompany(applicantsModalCompany.drive_id, applicantsModalCompany.company_name)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Applicants
                </button>

                <button
                  onClick={() => setApplicantsModalCompany(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {loadingApplicants ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#5B4BFF] animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-500">Loading candidates...</p>
              </div>
            ) : applicantsList.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No applicants registered yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">Reg No</th>
                      <th className="p-3.5">Resume Link</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {applicantsList.map((app) => (
                      <tr key={app.application_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-extrabold text-slate-900 dark:text-white">
                          {app.student_name}
                        </td>
                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                          {app.student_reg_no}
                        </td>
                        <td className="p-3.5">
                          {app.resume_link ? (
                            <a
                              href={app.resume_link}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-[#5B4BFF] hover:underline"
                            >
                              View Resume ↗
                            </a>
                          ) : (
                            <span className="text-slate-400">No link</span>
                          )}
                        </td>
                        <td className="p-3.5 font-bold uppercase tracking-wider text-[11px]">
                          {app.status}
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => handleUpdateStatus(app.application_id, 'Shortlisted')}
                            className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(app.application_id, 'Selected')}
                            className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          >
                            Place
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
