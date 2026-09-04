'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  X, 
  Building2, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  ShieldCheck, 
  Briefcase, 
  FileText, 
  Pencil, 
  Save, 
  Loader2, 
  AlertCircle,
  Clock,
  Layers,
  Plus,
  Trash2
} from 'lucide-react';
import { PlacementCompany } from './CompanyCard';

export interface TargetCohort {
  id: string;
  course_cd: string;
  course_name?: string;
  branch_cd: string;
  branch_name?: string;
  batch_cd: string;
  batch_name?: string;
  semester: string;
}

interface CompanyDetailDrawerProps {
  company: PlacementCompany | null;
  role: string;
  initialEditMode?: boolean;
  coursesList?: any[];
  selectedCollege?: string;
  onClose: () => void;
  onApply?: (company: PlacementCompany) => void;
  onUpdateSuccess?: (updatedCompany: PlacementCompany) => void;
}

export default function CompanyDetailDrawer({
  company,
  role,
  initialEditMode = false,
  coursesList = [],
  selectedCollege = '1',
  onClose,
  onApply,
  onUpdateSuccess,
}: CompanyDetailDrawerProps) {
  if (!company) return null;

  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form Basic Details
  const [formData, setFormData] = useState({
    company_name: company.company_name || '',
    role: company.role || '',
    package_ctc: company.package_ctc || '',
    drive_date: company.drive_date ? new Date(company.drive_date).toISOString().split('T')[0] : '',
    deadline_date: company.deadline_date ? new Date(company.deadline_date).toISOString().split('T')[0] : '',
    status: company.status || 'Open',
    description: company.description || '',
  });

  // Target Cohorts Looping Builder States
  const [localCourses, setLocalCourses] = useState<any[]>(coursesList);
  const [modalCourse, setModalCourse] = useState<string>('13');
  const [modalBranch, setModalBranch] = useState<string>('1');
  const [modalBatch, setModalBatch] = useState<string>('2');
  const [modalSemester, setModalSemester] = useState<string>('All Semesters');
  const [modalBranchesList, setModalBranchesList] = useState<any[]>([]);
  const [modalBatchesList, setModalBatchesList] = useState<any[]>([]);
  const [cohortError, setCohortError] = useState<string | null>(null);
  const [queuedCohorts, setQueuedCohorts] = useState<TargetCohort[]>([]);

  const cohortListEndRef = useRef<HTMLDivElement | null>(null);

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
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('jwt_token') ||
      localStorage.getItem('access_token') ||
      '';
    return {
      'x-tenant-slug': tenant,
      'x-user-role': (localStorage.getItem('role') || 'ADMIN').toUpperCase(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchCourses = async () => {
    const cd = selectedCollege || '1';
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
          setLocalCourses(mapped);
          return mapped;
        }
      }
    } catch {}
    return [];
  };

  const fetchBranches = async (courseCd: string) => {
    const cd = selectedCollege || '1';
    const slug = getTenantSlug();
    try {
      const res = await fetch(`/api/srms/branches?colgcd=${cd}&coursecd=${courseCd}&tenant=${slug}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((b: any) => {
            const rawName = (b.branch_name || b.name || '').trim();
            return {
              code: String(b.branch_cd || b.code || '1'),
              name: rawName && rawName !== '-' && rawName !== 'null' ? rawName : `${courseCd === '13' ? 'BCA' : 'General'}`,
            };
          });
          setModalBranchesList(mapped);
          return mapped;
        }
      }
    } catch {}
    setModalBranchesList([]);
    return [];
  };

  const fetchBatches = async (courseCd: string) => {
    const cd = selectedCollege || '1';
    const slug = getTenantSlug();
    try {
      const res = await fetch(`/api/srms/batches?colgcd=${cd}&coursecd=${courseCd}&tenant=${slug}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((b: any) => ({
            code: String(b.batch_cd || b.code || b.batch_name || '1'),
            name: String(b.batch_name || b.name || b.year || b.batch_cd),
            year: Number(b.batch_name || b.year || 2025),
          }));
          setModalBatchesList(mapped);
          return mapped;
        }
      }
    } catch {}
    setModalBatchesList([]);
    return [];
  };

  // Sync courses & initial dropdown data
  useEffect(() => {
    if (coursesList && coursesList.length > 0) {
      setLocalCourses(coursesList);
    }
  }, [coursesList]);

  useEffect(() => {
    const initDropdowns = async () => {
      let crs = coursesList && coursesList.length > 0 ? coursesList : localCourses;
      if (crs.length === 0) {
        crs = await fetchCourses();
      }
      const initialCrs = crs[0]?.code || '13';
      setModalCourse(initialCrs);
      const brs = await fetchBranches(initialCrs);
      const bts = await fetchBatches(initialCrs);
      if (brs.length > 0) setModalBranch(brs[0].code);
      if (bts.length > 0) {
        const b2025 = bts.find(b => b.name === '2025' || b.year === 2025);
        setModalBranch(brs[0]?.code || '1');
        setModalBatch(b2025 ? b2025.code : bts[0].code);
      }
    };
    initDropdowns();
  }, [selectedCollege, coursesList]);

  const handleModalCourseChange = async (newCourseCd: string) => {
    setModalCourse(newCourseCd);
    const branches = await fetchBranches(newCourseCd);
    const batches = await fetchBatches(newCourseCd);
    const defaultBranch = branches[0]?.code || '1';
    const defaultBatch = batches.find(b => b.name === '2025' || b.year === 2025)?.code || batches[0]?.code || '2';
    setModalBranch(defaultBranch);
    setModalBatch(defaultBatch);
    setCohortError(null);
  };

  const handleAddCohortToQueue = () => {
    const activeCourses = localCourses.length > 0 ? localCourses : coursesList;
    const courseObj = activeCourses.find(c => String(c.code) === String(modalCourse));
    const courseLabel = courseObj?.name || (modalCourse === '13' ? 'BCA' : modalCourse === '1' ? 'B.Tech' : `Course #${modalCourse}`);

    const branchObj = modalBranchesList.find(b => String(b.code) === String(modalBranch));
    const branchLabel = branchObj?.name || `Branch #${modalBranch}`;

    const batchObj = modalBatchesList.find(b => String(b.code) === String(modalBatch));
    const batchLabel = batchObj?.name || (batchObj?.year ? `Batch ${batchObj.year}` : `Batch #${modalBatch}`);

    const isDuplicate = queuedCohorts.some(
      (c) =>
        String(c.course_cd) === String(modalCourse) &&
        String(c.branch_cd) === String(modalBranch) &&
        String(c.batch_cd) === String(modalBatch) &&
        String(c.semester) === String(modalSemester)
    );

    if (isDuplicate) {
      setCohortError(`Cohort "[#${modalCourse}] ${courseLabel} • ${branchLabel} • ${batchLabel} • ${modalSemester}" is already added.`);
      return;
    }

    setCohortError(null);
    setQueuedCohorts((prev) => [
      ...prev,
      {
        id: `${modalCourse}-${modalBranch}-${modalBatch}-${modalSemester}-${Date.now()}`,
        course_cd: modalCourse,
        course_name: courseLabel,
        branch_cd: modalBranch,
        branch_name: branchLabel,
        batch_cd: modalBatch,
        batch_name: batchLabel,
        semester: modalSemester,
      },
    ]);

    setTimeout(() => {
      cohortListEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);
  };

  const handleRemoveCohort = (cohortId: string) => {
    setQueuedCohorts((prev) => prev.filter((c) => c.id !== cohortId));
  };

  useEffect(() => {
    setIsEditing(initialEditMode);
  }, [initialEditMode, company]);

  useEffect(() => {
    if (company) {
      setFormData({
        company_name: company.company_name || '',
        role: company.role || '',
        package_ctc: company.package_ctc || '',
        drive_date: company.drive_date ? new Date(company.drive_date).toISOString().split('T')[0] : '',
        deadline_date: company.deadline_date ? new Date(company.deadline_date).toISOString().split('T')[0] : '',
        status: company.status || 'Open',
        description: company.description || '',
      });
      setSaveError(null);
      setSaveSuccess(false);

      // Load or Synthesize Target Cohorts
      if (company.extra_fields?.target_cohorts && Array.isArray(company.extra_fields.target_cohorts) && company.extra_fields.target_cohorts.length > 0) {
        setQueuedCohorts(company.extra_fields.target_cohorts);
      } else {
        const rawBranches = Array.isArray(company.eligible_branches) && company.eligible_branches.length > 0
          ? company.eligible_branches
          : typeof company.eligible_branches === 'string' && company.eligible_branches
          ? company.eligible_branches.split(',').map(s => s.trim())
          : company.eligibility_branch_cd ? [String(company.eligibility_branch_cd)] : ['BCA General'];

        const rawBatches = Array.isArray(company.eligible_batches) && company.eligible_batches.length > 0
          ? company.eligible_batches
          : typeof company.eligible_batches === 'string' && company.eligible_batches
          ? company.eligible_batches.split(',').map(s => s.trim())
          : company.eligibility_batch_cd ? [String(company.eligibility_batch_cd)] : ['2025'];

        const rawCourses = Array.isArray(company.eligible_courses) && company.eligible_courses.length > 0
          ? company.eligible_courses
          : typeof company.eligible_courses === 'string' && company.eligible_courses
          ? company.eligible_courses.split(',').map(s => s.trim())
          : [];

        const synthesized: TargetCohort[] = rawBranches.map((br, idx) => {
          const brStr = String(br).trim();
          const brUpper = brStr.toUpperCase();
          let cCd = '13';
          let cName = 'BCA';

          if (
            brUpper.includes('CSE') ||
            brUpper.includes('IT') ||
            brUpper.includes('(IT)') ||
            brUpper.includes('ECE') ||
            brUpper.includes('ME') ||
            brUpper.includes('EE') ||
            brUpper.includes('B.TECH') ||
            brUpper.includes('BTECH') ||
            brUpper.includes('(EN)')
          ) {
            cCd = '1';
            cName = 'B.Tech';
          } else if (brUpper.includes('PHARM')) {
            cCd = '2';
            cName = 'B.PHARM.';
          } else if (brUpper.includes('MCA')) {
            cCd = '14';
            cName = 'MCA';
          } else if (brUpper.includes('MBA')) {
            cCd = '15';
            cName = 'MBA';
          } else if (rawCourses[idx]) {
            cName = rawCourses[idx];
            cCd = cName.includes('B.Tech') ? '1' : cName.includes('PHARM') ? '2' : '13';
          }

          return {
            id: `init-${cCd}-${idx}-${Date.now()}`,
            course_cd: cCd,
            course_name: cName,
            branch_cd: String(idx + 1),
            branch_name: brStr,
            batch_cd: '1',
            batch_name: String(rawBatches[0] || '2025'),
            semester: 'All Semesters',
          };
        });
        setQueuedCohorts(synthesized);
      }
    }
  }, [company]);

  const normRole = (role || '').toUpperCase();
  const canEdit = normRole === 'ADMIN' || normRole === 'SUPER_ADMIN' || normRole === 'COLLEGE_ADMIN';

  const courses = React.useMemo(() => {
    const detected = new Set<string>();

    const addNormalized = (raw: string) => {
      if (!raw) return;
      const clean = String(raw).replace(/^\[#\d+\]\s*/, '').trim();
      const upper = clean.toUpperCase().replace(/[\.\s_-]/g, '');
      
      if (upper.includes('BTECH') || upper.includes('BACHELOROFTECH')) detected.add('B.Tech');
      else if (upper.includes('MTECH') || upper.includes('MASTEROFTECH')) detected.add('M.Tech');
      else if (upper.includes('BCA') || upper.includes('BACHELOROFCOMPUTER')) detected.add('BCA');
      else if (upper.includes('MCA') || upper.includes('MASTEROFCOMPUTER')) detected.add('MCA');
      else if (upper.includes('BBA') || upper.includes('BACHELOROFBUSINESS')) detected.add('BBA');
      else if (upper.includes('MBA') || upper.includes('MASTEROFBUSINESS')) detected.add('MBA');
      else if (upper.includes('BPHARM') || upper.includes('PHARMACY')) detected.add('B.Pharm');
      else if (upper.includes('MPHARM')) detected.add('M.Pharm');
      else if (upper.includes('BSC') || upper.includes('BACHELOROFSCI')) detected.add('B.Sc');
      else if (upper.includes('MSC') || upper.includes('MASTEROFSCI')) detected.add('M.Sc');
      else if (upper.includes('BCOM')) detected.add('B.Com');
      else if (upper.includes('MCOM')) detected.add('M.Com');
      else if (upper.includes('DIPLOMA')) detected.add('Diploma');
      else {
        const standard = clean.replace(/\.+$/, '');
        if (standard) detected.add(standard);
      }
    };

    if (company.extra_fields?.target_cohorts && Array.isArray(company.extra_fields.target_cohorts)) {
      company.extra_fields.target_cohorts.forEach((c: any) => {
        if (c.course_name) addNormalized(c.course_name);
        else if (c.course_cd) {
          const cd = String(c.course_cd).trim();
          if (cd === '13') addNormalized('BCA');
          else if (cd === '1') addNormalized('B.Tech');
          else if (cd === '14') addNormalized('MCA');
          else addNormalized(`Course ${cd}`);
        }
      });
    }

    const rawCourses = company.eligible_courses || company.courses;
    if (Array.isArray(rawCourses)) {
      rawCourses.forEach((c: any) => {
        if (c) addNormalized(c);
      });
    } else if (typeof rawCourses === 'string' && rawCourses) {
      rawCourses.split(',').forEach((s: string) => {
        const trimmed = s.trim();
        if (trimmed) addNormalized(trimmed);
      });
    }

    if (company.eligibility_course_cd) {
      const cdStr = String(company.eligibility_course_cd);
      cdStr.split(',').forEach((c) => {
        const trimmed = c.trim();
        if (trimmed === '13') addNormalized('BCA');
        else if (trimmed === '1') addNormalized('B.Tech');
        else if (trimmed === '14') addNormalized('MCA');
        else if (trimmed && trimmed !== 'ALL') addNormalized(`Course ${trimmed}`);
      });
    }

    const allBranchStrs = Array.isArray(company.eligible_branches)
      ? company.eligible_branches
      : typeof company.eligible_branches === 'string'
      ? company.eligible_branches.split(',')
      : Array.isArray(company.branches)
      ? company.branches
      : [];

    allBranchStrs.forEach((b: any) => {
      const bUpper = String(b).toUpperCase();
      if (bUpper.includes('BCA')) addNormalized('BCA');
      if (
        bUpper.includes('CSE') ||
        bUpper.includes('IT') ||
        bUpper.includes('(IT)') ||
        bUpper.includes('ECE') ||
        bUpper.includes('ME') ||
        bUpper.includes('EE') ||
        bUpper.includes('COMPUTER SCIENCE') ||
        bUpper.includes('DATA SCIENCE') ||
        bUpper.includes('INFORMATION TECH') ||
        bUpper.includes('MECHANICAL') ||
        bUpper.includes('ELECTRICAL') ||
        bUpper.includes('ELECTRONICS') ||
        bUpper.includes('CIVIL') ||
        bUpper.includes('B.TECH') ||
        bUpper.includes('BTECH')
      ) {
        addNormalized('B.Tech');
      }
      if (bUpper.includes('MCA')) addNormalized('MCA');
      if (bUpper.includes('MBA')) addNormalized('MBA');
      if (bUpper.includes('BBA')) addNormalized('BBA');
      if (bUpper.includes('PHARM')) addNormalized('B.Pharm');
    });

    if (detected.size === 0) {
      return ['BCA'];
    }
    return Array.from(detected);
  }, [company]);

  const branches = React.useMemo(() => {
    const raw = Array.isArray(company.eligible_branches) && company.eligible_branches.length > 0
      ? company.eligible_branches
      : typeof company.eligible_branches === 'string' && company.eligible_branches
      ? company.eligible_branches.split(',').map((s) => s.trim())
      : company.eligibility_branch_cd
      ? [String(company.eligibility_branch_cd)]
      : ['All Branches'];
    return Array.from(new Set(raw.map((b: any) => String(b || '').trim()).filter(Boolean)));
  }, [company]);

  const batches = React.useMemo(() => {
    const raw = Array.isArray(company.eligible_batches) && company.eligible_batches.length > 0
      ? company.eligible_batches
      : typeof company.eligible_batches === 'string' && company.eligible_batches
      ? company.eligible_batches.split(',').map((s) => s.trim())
      : company.eligibility_batch_cd
      ? [String(company.eligibility_batch_cd)]
      : ['2025'];
    return Array.from(new Set(raw.map((b: any) => String(b || '').trim()).filter(Boolean)));
  }, [company]);

  const extraFields = company.extra_fields || {};
  const extraKeys = Object.keys(extraFields).filter(k => k !== 'target_cohorts' && k !== 'eligible_courses');

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.company_name.trim() || !formData.role.trim()) {
      setSaveError('Company name and job role are required.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const tenant = getTenantSlug();
      const headers = getAuthHeaders();
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

      let cohorts = [...queuedCohorts];
      if (cohorts.length === 0) {
        const courseObj = (localCourses.length > 0 ? localCourses : coursesList).find(c => String(c.code) === String(modalCourse));
        const courseLabel = courseObj?.name || (modalCourse === '13' ? 'BCA' : `Course #${modalCourse}`);
        const branchObj = modalBranchesList.find(b => String(b.code) === String(modalBranch));
        const branchLabel = branchObj?.name || `Branch #${modalBranch}`;
        const batchObj = modalBatchesList.find(b => String(b.code) === String(modalBatch));
        const batchLabel = batchObj?.name || (batchObj?.year ? `Batch ${batchObj.year}` : `Batch #${modalBatch}`);

        cohorts = [{
          id: `${modalCourse}-${modalBranch}-${modalBatch}-${modalSemester}`,
          course_cd: modalCourse,
          course_name: courseLabel,
          branch_cd: modalBranch,
          branch_name: branchLabel,
          batch_cd: modalBatch,
          batch_name: batchLabel,
          semester: modalSemester,
        }];
      }

      const uniqueCourseCodes = Array.from(new Set(cohorts.map((c) => c.course_cd))).filter(Boolean);
      const uniqueCourseNames = Array.from(
        new Set(cohorts.map((c) => c.course_name ? String(c.course_name).replace(/^\[#\d+\]\s*/, '') : (c.course_cd === '13' ? 'BCA' : c.course_cd === '1' ? 'B.Tech' : `Course ${c.course_cd}`)))
      ).filter(Boolean);
      const uniqueBranchNames = Array.from(new Set(cohorts.map((c) => c.branch_name || c.branch_cd))).filter(Boolean);
      const uniqueBatchNames = Array.from(new Set(cohorts.map((c) => c.batch_name || c.batch_cd))).filter(Boolean);

      const payload = {
        company_name: formData.company_name.trim(),
        role: formData.role.trim(),
        package_ctc: formData.package_ctc.trim() || null,
        drive_date: formData.drive_date || null,
        deadline_date: formData.deadline_date || null,
        status: formData.status || 'Open',
        description: formData.description || '',
        eligibility_course_cd: uniqueCourseCodes.join(', ') || '13',
        eligibility_branch_cd: cohorts[0]?.branch_cd || '1',
        eligibility_batch_cd: cohorts[0]?.batch_cd || '2',
        eligible_courses: uniqueCourseNames,
        eligible_branches: uniqueBranchNames,
        eligible_batches: uniqueBatchNames,
        target_cohorts: cohorts,
        extra_fields: {
          ...(company.extra_fields || {}),
          target_cohorts: cohorts,
          eligible_courses: uniqueCourseNames,
        },
      };

      const res = await axios.patch(
        `${backendUrl}/placement-drive/${company.drive_id}?tenant=${tenant}`,
        payload,
        { headers }
      );

      const updated = res.data?.drive || { ...company, ...payload };
      setSaveSuccess(true);
      onUpdateSuccess?.(updated);
      
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditing(false);
        onClose();
      }, 400);
    } catch (err: any) {
      const msg = Array.isArray(err?.response?.data?.errors)
        ? err.response.data.errors.join('; ')
        : (err?.response?.data?.message || err?.message || 'Failed to update placement drive.');
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl overflow-y-auto flex flex-col justify-between border-l border-slate-200 dark:border-slate-800">
        <div>
          {/* Drawer Top Header */}
          <div className="p-6 bg-gradient-to-r from-[#2D2575] to-[#1e1757] text-white flex items-start justify-between">
            <div className="flex items-center gap-4">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={formData.company_name}
                  className="w-14 h-14 rounded-2xl object-cover bg-white p-1 shadow-md shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-[#5B4BFF] text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
                  {formData.company_name?.charAt(0)?.toUpperCase() || 'C'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F36C21] text-white uppercase tracking-wider inline-block">
                    Campus Drive 2026-27
                  </span>
                  {isEditing && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-900 uppercase tracking-wider inline-flex items-center gap-1">
                      <Pencil className="w-2.5 h-2.5" /> Edit Mode
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-extrabold tracking-tight">
                  {formData.company_name || 'Placement Drive'}
                </h2>
                <p className="text-xs text-indigo-200 font-medium">
                  {formData.role || 'Job Role'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {canEdit && !isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  title="Edit Placement Drive"
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Pencil className="w-3.5 h-3.5 text-amber-300" />
                  <span>Edit</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6">
            {saveError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {saveSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Placement drive updated successfully!</span>
              </div>
            )}

            {isEditing ? (
              /* EDIT MODE FORM */
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#5B4BFF]" />
                    <span>Company Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="e.g. Tech Mahindra"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:ring-2 focus:ring-[#5B4BFF] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-[#5B4BFF]" />
                    <span>Job Role / Designation *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Cloud Engineer"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:ring-2 focus:ring-[#5B4BFF] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-[#5B4BFF]" />
                      <span>Package (CTC)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.package_ctc}
                      onChange={(e) => setFormData({ ...formData, package_ctc: e.target.value })}
                      placeholder="e.g. 8.5 LPA"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:ring-2 focus:ring-[#5B4BFF] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#5B4BFF]" />
                      <span>Drive Status</span>
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:ring-2 focus:ring-[#5B4BFF] focus:outline-none cursor-pointer"
                    >
                      <option value="Open">Open / Active</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#5B4BFF]" />
                      <span>Drive Date</span>
                    </label>
                    <input
                      type="date"
                      value={formData.drive_date}
                      onChange={(e) => setFormData({ ...formData, drive_date: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:ring-2 focus:ring-[#5B4BFF] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#5B4BFF]" />
                      <span>Deadline Date</span>
                    </label>
                    <input
                      type="date"
                      value={formData.deadline_date}
                      onChange={(e) => setFormData({ ...formData, deadline_date: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:ring-2 focus:ring-[#5B4BFF] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-[#5B4BFF]" />
                    <span>Job Description & Requirements</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe skill requirements, eligibility, interview rounds..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:ring-2 focus:ring-[#5B4BFF] focus:outline-none resize-y"
                  />
                </div>

                {/* SECTION 2: Dynamic Target Academic Cohorts Looping Builder (Photo 2 Match) */}
                <div className="bg-orange-50/40 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-800/80 p-4 rounded-2xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-orange-950 dark:text-orange-200 flex items-center gap-1.5">
                      <span>🎯</span> 2. Target Academic Cohorts (Course • Branch • Batch • Semester)
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                      {queuedCohorts.length} Target Cohort{queuedCohorts.length !== 1 ? 's' : ''} Added
                    </span>
                  </div>

                  {cohortError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-[11px] font-bold text-rose-700 dark:text-rose-300">
                      ⚠️ {cohortError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        🎓 Course *
                      </label>
                      <select
                        value={modalCourse}
                        onChange={(e) => handleModalCourseChange(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                      >
                        {(localCourses.length > 0 ? localCourses : coursesList).map((crs, idx) => (
                          <option key={crs.code || idx} value={crs.code}>
                            [#{crs.code}] {crs.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        🏢 Branch * <span className="text-orange-600 dark:text-orange-400">({modalBranchesList.length})</span>
                      </label>
                      <select
                        value={modalBranch}
                        onChange={(e) => {
                          setModalBranch(e.target.value);
                          setCohortError(null);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                      >
                        {modalBranchesList.map((br: any, idx: number) => (
                          <option key={br.code || idx} value={br.code}>
                            [#{br.code}] {br.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        👥 Batch * <span className="text-orange-600 dark:text-orange-400">({modalBatchesList.length})</span>
                      </label>
                      <select
                        value={modalBatch}
                        onChange={(e) => {
                          setModalBatch(e.target.value);
                          setCohortError(null);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                      >
                        {modalBatchesList.map((batch: any, idx: number) => (
                          <option key={batch.code || idx} value={batch.code}>
                            [#{batch.code}] Batch {batch.name || batch.year} {batch.year && batch.name !== String(batch.year) ? `(${batch.year})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        📖 Semester
                      </label>
                      <select
                        value={modalSemester}
                        onChange={(e) => {
                          setModalSemester(e.target.value);
                          setCohortError(null);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="All Semesters">All Semesters</option>
                        <option value="Semester 1">Semester 1</option>
                        <option value="Semester 2">Semester 2</option>
                        <option value="Semester 3">Semester 3</option>
                        <option value="Semester 4">Semester 4</option>
                        <option value="Semester 5">Semester 5</option>
                        <option value="Semester 6">Semester 6</option>
                        <option value="Semester 7">Semester 7</option>
                        <option value="Semester 8">Semester 8</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddCohortToQueue}
                      className="py-2 px-4 text-xs font-bold text-white bg-[#F36C21] hover:bg-[#d95d18] rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Cohort to Drive
                    </button>
                  </div>
                </div>

                {/* Added Target Cohorts List (Photo 2 Match) */}
                <div className="bg-[#F8FAFC] dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-900 dark:text-white">
                    <span className="flex items-center gap-1.5">
                      <span>📋</span> Added Target Cohorts ({queuedCohorts.length} cohort{queuedCohorts.length !== 1 ? 's' : ''} ready to announce)
                    </span>
                    {queuedCohorts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setQueuedCohorts([])}
                        className="text-xs text-rose-500 hover:text-rose-600 hover:underline font-bold cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {queuedCohorts.length === 0 ? (
                    <div className="p-3.5 text-center text-xs text-slate-400 font-semibold border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900">
                      No cohorts queued. Use the dropdowns above to add cohorts to this drive.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {queuedCohorts.map((cohort) => (
                        <div
                          key={cohort.id}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/80 hover:border-orange-300 transition-all shadow-xs"
                        >
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold border border-[#F36C21]/60 text-[#F36C21] bg-orange-50/50 dark:bg-orange-950/40 shrink-0 font-mono">
                              [#{cohort.course_cd}] {cohort.course_name || (cohort.course_cd === '13' ? 'BCA' : `Course ${cohort.course_cd}`)}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 shrink-0">
                              {cohort.branch_name || cohort.branch_cd}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                              {cohort.batch_name || cohort.batch_cd}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                              {cohort.semester || 'All Semesters'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveCohort(cohort.id)}
                            title="Remove this cohort"
                            className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors shrink-0 cursor-pointer font-bold text-sm px-2"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <div ref={cohortListEndRef} />
                    </div>
                  )}
                </div>
              </form>
            ) : (
              /* READ-ONLY VIEW MODE */
              <>
                {/* Core Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Offered Package (CTC)
                    </span>
                    <span className="text-base font-black text-[#5B4BFF] dark:text-[#7867FF]">
                      {formData.package_ctc || '₹4.5 - ₹8.0 LPA'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Date of Drive
                    </span>
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {formData.drive_date
                        ? new Date(formData.drive_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'TBA'}
                    </span>
                  </div>
                </div>

                {/* Description & Overview */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Job Overview & Opportunity Details
                  </h3>
                  <div className="p-4 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {formData.description || 'On-campus placement drive. Selected candidates will join as part of the specialized engineering & technology cohort.'}
                  </div>
                </div>

                {/* Eligibility Section */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Eligibility & Qualifications
                  </h3>
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                        Eligible Courses:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {courses.map((c, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-violet-50 text-[#5B4BFF] dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200/80 dark:border-violet-800/60"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                        Eligible Branches:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {branches.map((b, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600 dark:text-slate-400">
                        Graduating Batches:
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {batches.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Extra Fields */}
                {extraKeys.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Additional Corporate Details
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Auto-Mapped from Sheet
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {extraKeys.map((key) => (
                        <div
                          key={key}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                        >
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            {key}
                          </span>
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white text-right">
                            {String(extraFields[key])}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Drawer Action Bar */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setSaveError(null);
                }}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                Cancel Edit
              </button>

              <button
                type="button"
                onClick={() => handleSave()}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl text-xs font-black bg-[#5B4BFF] hover:bg-[#4a3ae0] text-white shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                Close Details
              </button>

              <div className="flex items-center gap-2">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Drive</span>
                  </button>
                )}

                {role === 'student' && !(company.has_applied || (company as any).my_application || company.application_status) && (
                  <button
                    type="button"
                    onClick={() => {
                      onApply?.(company);
                      onClose();
                    }}
                    className="px-6 py-2.5 rounded-xl text-xs font-black bg-[#5B4BFF] hover:bg-[#4a3ae0] text-white shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    Submit Application
                  </button>
                )}

                {role === 'student' && (company.has_applied || (company as any).my_application || company.application_status) && (
                  <span className="px-4 py-2.5 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Already Applied ({company.application_status || (company as any).my_application?.status || 'Under Review'})</span>
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
