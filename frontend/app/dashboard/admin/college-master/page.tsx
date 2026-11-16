'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import LiveCollegeCourseCascadingDropdown from '../../../../components/LiveCollegeCourseCascadingDropdown';
import Live3LevelDepartmentCascadingDropdown from '../../../../components/Live3LevelDepartmentCascadingDropdown';
import LiveCollegeCourseBatchCascadingDropdown from '../../../../components/LiveCollegeCourseBatchCascadingDropdown';
import { useRolePermissions } from '../../../../lib/useRolePermissions';

const ActionButtons = ({ onEdit, onDelete }: { onEdit: () => void, onDelete: () => void }) => (
  <div className="flex items-center justify-end gap-1.5">
    <button
      onClick={onEdit}
      className="p-1.5 text-[var(--color-primary-700)] hover:text-white bg-[var(--color-primary-100)] hover:bg-[var(--color-primary-700)] rounded-lg transition-all"
      title="Edit"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
      </svg>
    </button>
    <button
      onClick={onDelete}
      className="p-1.5 text-[var(--color-danger)] hover:text-white bg-[var(--color-danger-tint)] hover:bg-[var(--color-danger)] rounded-lg transition-all"
      title="Delete"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
    </button>
  </div>
);

const TableSkeleton = ({ colCount = 6 }: { colCount?: number }) => (
  <tbody className="divide-y divide-[var(--color-border)]">
    {[...Array(5)].map((_, rIdx) => (
      <tr key={rIdx} className="animate-pulse bg-[var(--color-bg-surface)]">
        <td className="pl-5 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800/80 rounded w-6"></div></td>
        {[...Array(colCount - 2)].map((_, cIdx) => (
          <td key={cIdx} className="py-4 px-4">
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-800/80 rounded w-2/3"></div>
              {cIdx === 0 && <div className="h-3 bg-slate-100 dark:bg-slate-900/50 rounded w-1/2"></div>}
            </div>
          </td>
        ))}
        <td className="pr-5 py-4 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <div className="w-7 h-7 bg-slate-200 dark:bg-slate-800/80 rounded-lg"></div>
            <div className="w-7 h-7 bg-slate-200 dark:bg-slate-800/80 rounded-lg"></div>
          </div>
        </td>
      </tr>
    ))}
  </tbody>
);

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch (e) {
    return dateStr;
  }
};



interface Group {
  id: string;
  code: string;
  name: string;
  college_id?: string;
  college_name?: string;
  course_id?: string;
  course_code?: string;
  course_name?: string;
  batch_id?: string;
  batch_code?: string;
  department_id?: string;
  department_code?: string;
  department_name?: string;
  group_type?: string;
  subject_id?: string;
  subject_code?: string;
  subject_name?: string;
  section_id?: string;
  section_code?: string;
  section_name?: string;
  phase_id?: string;
  phase_name?: string;
  semester?: string;
  capacity?: number;
  member_count?: number;
  is_active: boolean;
}

interface Section {
  id: string;
  code: string;
  name: string;
  college_id?: string;
  college_code?: string;
  college_name?: string;
  college_slug?: string;
  course_id?: string;
  course_code?: string;
  course_name?: string;
  department_id?: string;
  department_code?: string;
  department_name?: string;
  batch_id?: string;
  batch_code?: string;
  batch_year?: number | string;
  phase_id?: string;
  phase_name?: string;
  semester?: string;
  capacity?: number;
  group_count?: number;
  is_default?: boolean;
  is_active: boolean;
}

type SubCategory = 'colleges' | 'courses' | 'professionals' | 'batches' | 'branches' | 'sections' | 'groups' | 'sessions' | 'residencies';

interface College {
  id: string;
  code?: string;
  name: string;
  slug: string;
  domain?: string;
  plan?: string;
  primary_color?: string;
  is_active: boolean;
  schema_provisioned?: boolean;
  created_at?: string;
}

interface Course {
  id: string;
  code: string;
  name: string;
  degree_level: string;
  academic_system: 'professional' | 'semester';
  college_id: string;
  college_name: string;
  college_code?: string;
  college_slug?: string;
  course_cd?: string;
  course_type?: string;
  duration_years?: number;
  is_active: boolean;
}

interface ProfessionalPhase {
  id: string;
  name?: string;
  college_id: string;
  college_name: string;
  college_code?: string;
  college_slug?: string;
  course_id: string;
  course_code: string;
  course_name: string;
  branch_id?: string;
  branch_cd?: string;
  branch_name?: string;
  academic_year?: number;
  phase_order?: number;
  academic_system: 'professional' | 'semester';
  phase_name: string;
  duration_years: number;
  is_active: boolean;
}

const YEAR_NAMES: Record<number, string> = {
  1: 'First Year',
  2: 'Second Year',
  3: 'Third Year',
  4: 'Fourth Year',
  5: 'Fifth Year',
};

const YEAR_SEMESTERS: Record<number, string[]> = {
  1: ['1st Semester', '2nd Semester'],
  2: ['3rd Semester', '4th Semester'],
  3: ['5th Semester', '6th Semester'],
  4: ['7th Semester', '8th Semester'],
  5: ['9th Semester', '10th Semester'],
};

interface GroupedAcademicYear {
  groupKey: string;
  college_id: string;
  college_name: string;
  college_code?: string;
  college_slug?: string;
  course_id: string;
  course_code: string;
  course_name: string;
  branch_id?: string;
  branch_cd?: string;
  branch_name?: string;
  branch_display_name?: string;
  academic_year: number;
  academic_year_name: string;
  academic_system: 'professional' | 'semester';
  duration_years: number;
  is_active: boolean;
  semesters: Array<{
    id: string;
    name: string;
    phase_order: number;
    is_active: boolean;
  }>;
}

interface Batch {
  id: string;
  college_id: string;
  college_name: string;
  college_code?: string;
  college_slug?: string;
  course_id: string;
  course_code: string;
  code: string;
  batch_cd?: string;
  name?: string;
  year: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
}

interface Branch {
  id: string;
  college_id: string;
  college_name: string;
  college_code?: string;
  college_slug?: string;
  course_id?: string;
  course_code?: string;
  course_name?: string;
  code: string;
  name: string;
  branch_name?: string;
  type: string;
  branch_cd?: string;
  is_active: boolean;
}

interface AcademicSession {
  id: string;
  college_id: string;
  college_name: string;
  name: string;
  session_cd?: string;
  session_name?: string;
  code?: string;
  colg_cd?: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_active: boolean;
}

interface ResidencyCategory {
  id: string;
  college_id: string;
  college_name: string;
  course_id?: string;
  course_code?: string;
  residency_type: 'Resident' | 'Hosteller' | 'Day Scholar';
  category_name: string;
  block_wing?: string;
  total_capacity: number;
  allocated_count: number;
  monthly_fee?: number;
  is_active: boolean;
}

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/college-master`;

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export default function CollegeMasterPage() {
  const [activeTab, setActiveTab] = useState<SubCategory>('colleges');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  // User Auth & Tenant Context State
  const [userRole, setUserRole] = useState<string>('ADMIN');
  const [userColgCd, setUserColgCd] = useState<string>('1');
  const [userTenantSlug, setUserTenantSlug] = useState<string>('srms-cet-bareilly');
  const [userTenantId, setUserTenantId] = useState<string>('');
  const [userFirmMode, setUserFirmMode] = useState<string>('');
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState<string>('all');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');

  // All data starts empty — loaded from PostgreSQL via API
  const [colleges, setColleges] = useState<College[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalPhase[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  // Student Group Member Allocation Modal State
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [batchStudents, setBatchStudents] = useState<any[]>([]);
  const [loadingGroupMembers, setLoadingGroupMembers] = useState(false);
  const [memberStartRoll, setMemberStartRoll] = useState('');
  const [memberEndRoll, setMemberEndRoll] = useState('');
  const [savingGroupMembers, setSavingGroupMembers] = useState(false);
  const [groupMemberMessage, setGroupMemberMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberSortBy, setMemberSortBy] = useState<'rollno' | 'name'>('rollno');
  const [memberSortOrder, setMemberSortOrder] = useState<'asc' | 'desc'>('asc');
  const [hideAlreadyAssigned, setHideAlreadyAssigned] = useState(true);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [rosterSearch, setRosterSearch] = useState('');
  // Integrated Student Checkbox List inside Large Group Create/Edit Modal
  const [formBatchStudents, setFormBatchStudents] = useState<any[]>([]);
  const [loadingFormStudents, setLoadingFormStudents] = useState(false);
  const [formSelectedStudentIds, setFormSelectedStudentIds] = useState<string[]>([]);
  const [formLinkedSections, setFormLinkedSections] = useState<Section[]>([]);
  const [loadingFormSections, setLoadingFormSections] = useState(false);
  const [loadingFormBatches, setLoadingFormBatches] = useState(false);
  const [loadingFormSubjects, setLoadingFormSubjects] = useState(false);
  const [formStudentSearch, setFormStudentSearch] = useState('');
  const [formStudentSortBy, setFormStudentSortBy] = useState<'rollno' | 'name'>('rollno');
  const [formStudentSortOrder, setFormStudentSortOrder] = useState<'asc' | 'desc'>('asc');
  const [formHideAssigned, setFormHideAssigned] = useState(true);
  const [formRangeStart, setFormRangeStart] = useState('');
  const [formRangeEnd, setFormRangeEnd] = useState('');
  const [liveSubjects, setLiveSubjects] = useState<any[]>([]);
  const [deliveryTypes, setDeliveryTypes] = useState<{ id?: string; code: string; name: string; description?: string | null; is_active?: boolean }[]>([]);
  const [loadingDeliveryTypes, setLoadingDeliveryTypes] = useState(false);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [residencies, setResidencies] = useState<ResidencyCategory[]>([]);

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchFormBatchStudents = async (opts?: {
    batchId?: string;
    courseId?: string;
    departmentId?: string;
    subjectId?: string;
    groupType?: string;
    currentGroupId?: string;
    groupCode?: string;
    sectionId?: string;
    isEditing?: boolean;
  }) => {
    const bId = opts?.batchId ?? formData.batchId ?? '';
    const cId = opts?.courseId ?? formData.courseId ?? '';
    const dId = opts?.departmentId ?? formData.departmentId ?? '';
    const sId = opts?.subjectId ?? formData.subjectId ?? '';
    const gType = opts?.groupType ?? formData.groupType ?? 'PRACTICAL';
    const curGrpId = opts?.currentGroupId ?? editingItem?.id ?? '';
    const gCode = opts?.groupCode ?? formData.code ?? 'A';
    const secId = opts?.sectionId ?? formData.sectionId ?? '';
    const isEditingGrp = opts?.isEditing ?? Boolean(editingItem?.id);

    if (!bId) {
      setFormBatchStudents([]);
      setFormSelectedStudentIds([]);
      return;
    }

    setLoadingFormStudents(true);
    const slug = getActiveTenantSlug();
    try {
      const url = `/api/v1/college-master/groups/batch-students/${encodeURIComponent(bId)}?tenant=${encodeURIComponent(slug)}&courseId=${encodeURIComponent(cId)}&departmentId=${encodeURIComponent(dId)}&subjectId=${encodeURIComponent(sId)}&groupType=${encodeURIComponent(gType)}&currentGroupId=${encodeURIComponent(curGrpId)}&groupCode=${encodeURIComponent(gCode)}&sectionId=${encodeURIComponent(secId)}`;
      const res = await fetch(url);
      const data = await res.json();
      const rawList: any[] = data?.success && Array.isArray(data.data) ? data.data : [];
      // Defensive client-side deduplication by student id & registration/rollno
      const seenKeys = new Set<string>();
      const list = rawList.filter((st) => {
        const key = String(st.id || st.registration_no || st.rollno || '');
        if (!key || seenKeys.has(key)) return false;
        seenKeys.add(key);
        return true;
      });
      setFormBatchStudents(list);

      if (isEditingGrp && curGrpId) {
        setFormSelectedStudentIds(list.filter((s) => s.is_in_current_group).map((s) => s.id));
      } else if (gCode === 'ALL') {
        const availIds = list.filter((s) => !s.is_assigned_to_same_subject).map((s) => s.id);
        setFormSelectedStudentIds(availIds);
        const exactCap = availIds.length > 0 ? availIds.length : list.length;
        if (exactCap > 0) {
          setFormData((prev) => (prev.code === 'ALL' ? { ...prev, capacity: exactCap } : prev));
        }
      } else {
        const availSet = new Set(list.filter((s) => !s.is_assigned_to_same_subject).map((s) => s.id));
        setFormSelectedStudentIds((prev) => prev.filter((id) => availSet.has(id)));
      }
    } catch (err) {
      console.error('Failed to fetch batch students for group form:', err);
      setFormBatchStudents([]);
    } finally {
      setLoadingFormStudents(false);
    }
  };

  const fetchFormBatches = async (opts?: {
    collegeId?: string;
    courseId?: string;
    departmentId?: string;
  }) => {
    const colRef = opts?.collegeId ?? formData.collegeId ?? '';
    const crsRef = opts?.courseId ?? formData.courseId ?? '';
    const dId = opts?.departmentId ?? formData.departmentId ?? '';

    const activePool = colleges.filter((c) => c.is_active !== false);
    const colObj = activePool.find((c) => c.id === colRef || c.code === colRef || c.slug === colRef)
      || colleges.find((c) => c.id === colRef || c.code === colRef || c.slug === colRef);
    const slug = colObj?.slug || getFormCollegeSlug();
    if (!slug) return;

    setLoadingFormBatches(true);
    try {
      const res = await fetch(`/api/v1/college-master/batches?tenant=${encodeURIComponent(slug)}&_t=${Date.now()}`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        const rawList: Batch[] = json?.success && Array.isArray(json.data)
          ? json.data
          : Array.isArray(json)
            ? json
            : [];
        if (rawList.length > 0) {
          setBatches((prev) => {
            const others = prev.filter((b) => b.college_slug !== slug && b.college_id !== colObj?.id);
            return [...others, ...rawList];
          });
          // Auto-select first matching batch when branch is picked and batch is not yet chosen
          if (!formData.batchId) {
            const crsObj = courses.find((c) => c.id === crsRef || c.course_cd === crsRef || c.code === crsRef);
            const crsCd = crsObj?.course_cd || crsObj?.code || '';
            const matching = rawList.filter((b: any) => {
              const matchCourse = !crsCd && !crsObj?.id ? true : (b.course_code === crsCd || b.course_cd === crsCd || b.course_id === crsObj?.id);
              const matchDept = !dId ? true : (!b.department_id || b.department_id === dId || b.branch_cd === dId);
              return matchCourse && matchDept;
            });
            const firstB = matching[0] || rawList.find((b: any) => !crsCd || b.course_code === crsCd || b.course_cd === crsCd || b.course_id === crsObj?.id) || rawList[0];
            const firstBId = firstB?.id || firstB?.batch_cd || firstB?.code || '';
            if (firstBId) {
              setFormData((prev) => (prev.batchId ? prev : { ...prev, batchId: firstBId }));
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch batches for group form:', err);
    } finally {
      setLoadingFormBatches(false);
    }
  };

  const toNumericSectionCode = (rawCode?: string | null, fallback = '1'): string => {
    const clean = String(rawCode || '').trim().toUpperCase();
    if (/^\d+$/.test(clean)) return clean;
    const alphaIdx = 'ABCDEFGHIJ'.indexOf(clean);
    if (alphaIdx >= 0) return String(alphaIdx + 1);
    return fallback;
  };

  const buildNumericSectionOptions = (list: Section[]) => {
    const usedNums = new Set(
      list
        .map((s) => String(s.code || '').trim())
        .filter((c) => /^\d+$/.test(c)),
    );
    return list.map((sec, idx) => {
      const raw = String(sec.code || '').trim().toUpperCase();
      let numVal = /^\d+$/.test(raw) ? raw : '';
      if (!numVal) {
        const preferred = toNumericSectionCode(raw, String(idx + 1));
        if (!usedNums.has(preferred)) {
          numVal = preferred;
        } else {
          for (let n = 1; n <= 99; n++) {
            if (!usedNums.has(String(n))) {
              numVal = String(n);
              break;
            }
          }
        }
        if (numVal) usedNums.add(numVal);
      }
      return { sec, numVal: numVal || String(idx + 1) };
    });
  };

  const fetchFormLinkedSections = async (opts?: {
    batchId?: string;
    courseId?: string;
    departmentId?: string;
    semester?: string;
    collegeId?: string;
  }) => {
    const bId = opts?.batchId ?? formData.batchId ?? '';
    const cId = opts?.courseId ?? formData.courseId ?? '';
    const dId = opts?.departmentId ?? formData.departmentId ?? '';
    const sem = opts?.semester ?? formData.semester ?? '';
    const colRef = opts?.collegeId ?? formData.collegeId ?? '';

    const courseBranches = getBranchesForCollegeAndCourse(colRef, cId, Boolean(cId));
    if (!bId || (courseBranches.length > 0 && !dId)) {
      setFormLinkedSections([]);
      return;
    }

    setLoadingFormSections(true);
    const activePool = colleges.filter((c) => c.is_active !== false);
    const colObj = activePool.find((c) => c.id === colRef || c.code === colRef || c.slug === colRef)
      || colleges.find((c) => c.id === colRef || c.code === colRef || c.slug === colRef);
    const slug = colObj?.slug || getFormCollegeSlug();

    const filterSectionsStrictly = (list: Section[]) => {
      const seenCodes = new Set<string>();
      const semLower = sem.toLowerCase().trim();
      const isProfSem = semLower.includes('professional') || semLower.includes('phase');
      const semNumMatch = !isProfSem ? semLower.match(/(\d+)/) : null;
      const semNum = semNumMatch ? semNumMatch[1] : '';
      const crsObj = cId
        ? courses.find((c) => c.id === cId || c.course_cd === cId || c.code === cId)
        : undefined;
      const crsCd = crsObj?.course_cd || crsObj?.code || cId || '';
      const batchObj = bId
        ? (batches.find((b) => b.id === bId) ||
           batches.find((b) => (!crsCd || b.course_code === crsCd || (b as any).course_cd === crsCd) && (b.batch_cd === bId || b.code === bId || String(b.year) === String(bId))) ||
           batches.find((b) => b.batch_cd === bId || b.code === bId || String(b.year) === String(bId)))
        : undefined;
      const resolvedBId = batchObj?.id || bId;
      const deptObj = dId
        ? (branches.find((br) => br.id === dId) ||
           branches.find((br) => (!crsCd || (br as any).course_cd === crsCd || br.course_code === crsCd) && (br.branch_cd === dId || br.code === dId || br.name === dId)) ||
           branches.find((br) => br.branch_cd === dId || br.code === dId || br.name === dId))
        : undefined;

      return list
        .filter((sec) => {
          const codeStr = String(sec.code || '').trim();
          if (!codeStr) return false;
          if (!sec.department_id || !sec.semester) return false;
          if (resolvedBId && sec.batch_id) {
            const matchById = sec.batch_id === resolvedBId;
            const matchByCodeYear = Boolean(
              batchObj?.code &&
              sec.batch_code === batchObj.code &&
              (!batchObj.year || !sec.batch_year || String(sec.batch_year) === String(batchObj.year))
            );
            if (!matchById && !matchByCodeYear) return false;
          }
          if (deptObj) {
            const matchDept =
              sec.department_id === deptObj.id ||
              (deptObj.name && sec.department_name && sec.department_name.toLowerCase().trim() === deptObj.name.toLowerCase().trim()) ||
              (deptObj.branch_cd && sec.department_code === deptObj.branch_cd && (!sec.course_code || !crsCd || sec.course_code === crsCd)) ||
              (deptObj.code && sec.department_code === deptObj.code && (!sec.course_code || !crsCd || sec.course_code === crsCd));
            if (!matchDept) return false;
          }
          if (sem) {
            const secSemLower = sec.semester.toLowerCase().trim();
            const secSemNum = secSemLower.replace(/\D/g, '');
            const semMatched = secSemLower === semLower || (Boolean(semNum) && secSemNum === semNum);
            if (!semMatched) return false;
          }
          if (sec.is_active === false) return false;
          if (seenCodes.has(codeStr)) return false;
          seenCodes.add(codeStr);
          return true;
        })
        .sort((a, b) => {
          const aNum = /^\d+$/.test(String(a.code || '').trim()) ? Number(a.code) : 999;
          const bNum = /^\d+$/.test(String(b.code || '').trim()) ? Number(b.code) : 999;
          if (aNum !== bNum) return aNum - bNum;
          return String(a.code || '').localeCompare(String(b.code || ''));
        });
    };

    try {
      const params = new URLSearchParams({
        tenant: slug,
        onlyLinked: 'true',
        batchId: bId,
        _t: String(Date.now()),
      });
      if (cId) params.set('courseId', cId);
      if (dId) params.set('departmentId', dId);
      if (sem) params.set('semester', sem);

      const res = await fetch(`/api/v1/college-master/sections?${params.toString()}`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        const rawList: Section[] = data?.success && Array.isArray(data.data) ? data.data : [];
        const cleanList = filterSectionsStrictly(rawList);
        setFormLinkedSections(cleanList.length > 0 ? cleanList : filterSectionsStrictly(sections));
      } else {
        setFormLinkedSections(filterSectionsStrictly(sections));
      }
    } catch (err) {
      console.error('Failed to fetch linked sections for group form:', err);
      setFormLinkedSections(filterSectionsStrictly(sections));
    } finally {
      setLoadingFormSections(false);
    }
  };

  const fetchFormSubjects = async (opts?: { collegeId?: string }) => {
    const colRef = opts?.collegeId ?? formData.collegeId ?? '';
    const activePool = colleges.filter((c) => c.is_active !== false);
    const colObj = activePool.find((c) => c.id === colRef || c.code === colRef || c.slug === colRef)
      || colleges.find((c) => c.id === colRef || c.code === colRef || c.slug === colRef);
    const slug = colObj?.slug || getFormCollegeSlug();
    if (!slug) return;

    setLoadingFormSubjects(true);
    try {
      const res = await fetch(`/api/v1/admin-master/subjects?tenant=${encodeURIComponent(slug)}&_t=${Date.now()}`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      const d = await res.json();
      if (d?.success && Array.isArray(d.data)) {
        setLiveSubjects(d.data);
      }
    } catch (err) {
      console.error('Failed to fetch subjects on section selection:', err);
    } finally {
      setLoadingFormSubjects(false);
    }
  };

  const fetchFormDeliveryTypes = async (collegeRefOrSlug?: string) => {
    const colRef = collegeRefOrSlug ?? formData.collegeId ?? '';
    const activePool = colleges.filter((c) => c.is_active !== false);
    const colObj = activePool.find((c) => c.id === colRef || c.code === colRef || c.slug === colRef)
      || colleges.find((c) => c.id === colRef || c.code === colRef || c.slug === colRef);
    const slug = colObj?.slug || (collegeRefOrSlug && collegeRefOrSlug.includes('-') ? collegeRefOrSlug : '') || getFormCollegeSlug() || userTenantSlug;
    if (!slug) return [];

    setLoadingDeliveryTypes(true);
    try {
      const res = await fetch(`/api/v1/admin-master/delivery-types?tenant=${encodeURIComponent(slug)}&_t=${Date.now()}`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      if (res.ok) {
        const d = await res.json();
        const rows = (d?.success && Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [])
          .filter((dt: any) => dt && dt.is_active !== false);
        setDeliveryTypes(rows);
        return rows;
      }
    } catch (err) {
      console.error('Failed to fetch delivery types:', err);
    } finally {
      setLoadingDeliveryTypes(false);
    }
    return [];
  };

  const isNonMedTenantMode = (colSlug?: string, colObj?: any): boolean => {
    const explicitMode = String((colObj as any)?.firm_mode || (colObj as any)?.firmMode || userFirmMode || '').trim().toUpperCase();
    if (explicitMode === 'NONMED') return true;
    if (explicitMode === 'MED') return false;
    const rawSlug = String(colSlug || colObj?.slug || userTenantSlug || '').toLowerCase();
    const isMedSlug =
      rawSlug.includes('ims') ||
      rawSlug.includes('med') ||
      rawSlug.includes('iahs') ||
      rawSlug.includes('nursing') ||
      rawSlug.includes('ayush') ||
      rawSlug === 'rmribar' ||
      rawSlug === 'rmch-bareilly';
    return !isMedSlug;
  };

  const getGroupPurposeLabel = (rawCode?: string | null): string => {
    const clean = String(rawCode || '').trim();
    if (!clean) return '🔬 Practical';
    const dtMatch = deliveryTypes.find((dt) => String(dt.code || '').toUpperCase() === clean.toUpperCase());
    if (dtMatch) return `[${dtMatch.code}] ${dtMatch.name}`;
    const up = clean.toUpperCase();
    if (up === 'CLINICAL') return '🏥 Clinical';
    if (up === 'COMMUNITY') return '🏡 Community';
    if (up === 'TUTORIAL') return '📖 Tutorial';
    if (up === 'PRACTICAL') return '🔬 Practical';
    return clean;
  };

  // Step 2: Fetch Batches once Branch is selected in Group Master modal
  useEffect(() => {
    if (!isModalOpen || activeTab !== 'groups') return;
    const courseBranches = getBranchesForCollegeAndCourse(formData.collegeId || '', formData.courseId || '', Boolean(formData.courseId));
    if (courseBranches.length > 0 && !formData.departmentId) return;
    fetchFormBatches({
      collegeId: formData.collegeId || '',
      courseId: formData.courseId || '',
      departmentId: formData.departmentId || '',
    });
  }, [isModalOpen, activeTab, formData.collegeId, formData.courseId, formData.departmentId]);

  // Step 4: Fetch Linked Sections once Branch, Batch, and Semester are chosen
  useEffect(() => {
    if (!isModalOpen || activeTab !== 'groups') return;
    if (formData.batchId && formData.semester) {
      fetchFormLinkedSections({
        collegeId: formData.collegeId || '',
        courseId: formData.courseId || '',
        departmentId: formData.departmentId || '',
        batchId: formData.batchId || '',
        semester: formData.semester || '',
      });
    } else {
      setFormLinkedSections([]);
    }
  }, [isModalOpen, activeTab, formData.collegeId, formData.courseId, formData.departmentId, formData.batchId, formData.semester]);

  // Load Delivery Types dynamically for Group Master (when firm_mode = 'NONMED')
  useEffect(() => {
    if (!isModalOpen || activeTab !== 'groups') return;
    fetchFormDeliveryTypes(formData.collegeId || '').then((rows: any[]) => {
      if (!editingItem && Array.isArray(rows) && rows.length > 0) {
        const activePool = colleges.filter((c) => c.is_active !== false);
        const colRef = formData.collegeId || '';
        const colObj = activePool.find((c) => c.id === colRef || c.code === colRef || c.slug === colRef)
          || colleges.find((c) => c.id === colRef || c.code === colRef || c.slug === colRef);
        if (isNonMedTenantMode(colObj?.slug, colObj)) {
          setFormData((prev) => {
            if (rows.some((r) => String(r.code) === String(prev.groupType))) return prev;
            const preferred = rows.find((r) => String(r.code).toUpperCase() === 'PR') || rows[0];
            return { ...prev, groupType: preferred.code };
          });
        }
      }
    });
  }, [isModalOpen, activeTab, formData.collegeId]);

  // Fetch Subjects ONLY when a Section is selected in Group Master modal
  useEffect(() => {
    if (!isModalOpen || activeTab !== 'groups') return;
    if (formData.sectionId) {
      fetchFormSubjects({ collegeId: formData.collegeId || '' });
    } else {
      setLiveSubjects([]);
    }
  }, [isModalOpen, activeTab, formData.sectionId, formData.collegeId]);

  useEffect(() => {
    if (!isModalOpen || (activeTab !== 'groups' && activeTab !== 'sections')) return;

    let activeBatchId = formData.batchId || '';
    if (!activeBatchId && activeTab === 'sections' && batches.length > 0) {
      const crsObj = courses.find(c => c.id === formData.courseId || c.course_cd === formData.courseId || c.code === formData.courseId);
      const crsCd = crsObj?.course_cd || crsObj?.code || '';
      const matched = batches.filter(b => !crsCd || b.course_code === crsCd || (b as any).course_cd === crsCd || b.course_id === crsObj?.id);
      const firstB = matched[0] || batches[0];
      activeBatchId = firstB?.id || firstB?.batch_cd || firstB?.code || '';
      if (activeBatchId) {
        setFormData(prev => ({ ...prev, batchId: activeBatchId }));
        return;
      }
    }

    if (activeTab === 'groups' && activeBatchId) {
      fetchFormBatchStudents({
        batchId: activeBatchId,
        courseId: formData.courseId || '',
        departmentId: formData.departmentId || '',
        subjectId: formData.subjectId || '',
        groupType: formData.groupType || 'PRACTICAL',
        currentGroupId: editingItem?.id || '',
        groupCode: formData.code || 'A',
        sectionId: formData.sectionId || '',
        isEditing: Boolean(editingItem?.id),
      });
    }
  }, [isModalOpen, activeTab, batches.length, formData.batchId, formData.courseId, formData.departmentId, formData.subjectId, formData.groupType, formData.code]);

  // ─── STUDENT GROUP MEMBERS ALLOCATION HANDLERS ────────────────────────────
  const openGroupMembersModal = async (grp: Group) => {
    setSelectedGroupForMembers(grp);
    setIsMemberModalOpen(true);
    setLoadingGroupMembers(true);
    setGroupMemberMessage(null);
    setMemberStartRoll('');
    setMemberEndRoll('');
    setSelectedStudentIds([]);
    setMemberSearch('');
    setRosterSearch('');
    setHideAlreadyAssigned(true);
    const slug = getActiveTenantSlug();
    try {
      const mRes = await fetch(`/api/v1/college-master/groups/${grp.id}/members?tenant=${encodeURIComponent(slug)}`);
      const mData = await mRes.json();
      if (mData?.success && Array.isArray(mData.data)) {
        setGroupMembers(mData.data);
      } else {
        setGroupMembers([]);
      }

      if (grp.batch_id) {
        const bRes = await fetch(
          `/api/v1/college-master/groups/batch-students/${grp.batch_id}?tenant=${encodeURIComponent(slug)}&courseId=${grp.course_id || ''}&departmentId=${grp.department_id || ''}&subjectId=${grp.subject_id || ''}&groupType=${grp.group_type || 'PRACTICAL'}&currentGroupId=${grp.id}&groupCode=${encodeURIComponent(grp.code || '')}&sectionId=${encodeURIComponent(grp.section_id || grp.section_code || '')}`
        );
        const bData = await bRes.json();
        if (bData?.success && Array.isArray(bData.data)) {
          const seenM = new Set<string>();
          setBatchStudents(bData.data.filter((st: any) => {
            const k = String(st.id || st.registration_no || st.rollno || '');
            if (!k || seenM.has(k)) return false;
            seenM.add(k);
            return true;
          }));
        } else {
          setBatchStudents([]);
        }
      } else {
        setBatchStudents([]);
      }
    } catch (err: any) {
      console.error('Failed to load group members:', err);
    } finally {
      setLoadingGroupMembers(false);
    }
  };

  const handleAssignGroupMembers = async (params: { studentIds?: string[]; startRollNo?: string; endRollNo?: string }) => {
    if (!selectedGroupForMembers) return;
    setSavingGroupMembers(true);
    setGroupMemberMessage(null);
    const slug = getActiveTenantSlug();
    try {
      const res = await fetch(`/api/v1/college-master/groups/${selectedGroupForMembers.id}/members?tenant=${encodeURIComponent(slug)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          groupType: selectedGroupForMembers.group_type || 'PRACTICAL',
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setGroupMemberMessage({ text: data.message || 'Students allocated successfully!', type: 'success' });
        const mRes = await fetch(`/api/v1/college-master/groups/${selectedGroupForMembers.id}/members?tenant=${encodeURIComponent(slug)}`);
        const mData = await mRes.json();
        if (mData?.success && Array.isArray(mData.data)) setGroupMembers(mData.data);

        if (selectedGroupForMembers.batch_id) {
          const bRes = await fetch(
            `/api/v1/college-master/groups/batch-students/${selectedGroupForMembers.batch_id}?tenant=${encodeURIComponent(slug)}&courseId=${selectedGroupForMembers.course_id || ''}&departmentId=${selectedGroupForMembers.department_id || ''}&subjectId=${selectedGroupForMembers.subject_id || ''}&groupType=${selectedGroupForMembers.group_type || 'PRACTICAL'}&currentGroupId=${selectedGroupForMembers.id}&groupCode=${encodeURIComponent(selectedGroupForMembers.code || '')}&sectionId=${encodeURIComponent(selectedGroupForMembers.section_id || selectedGroupForMembers.section_code || '')}`
          );
          const bData = await bRes.json();
          if (bData?.success && Array.isArray(bData.data)) setBatchStudents(bData.data);
        }
        setSelectedStudentIds([]);
        fetchData('groups');
      } else {
        setGroupMemberMessage({ text: data?.message || 'Failed to allocate students', type: 'error' });
      }
    } catch (err: any) {
      setGroupMemberMessage({ text: err.message || 'Error assigning members', type: 'error' });
    } finally {
      setSavingGroupMembers(false);
    }
  };

  const handleRemoveGroupMember = async (studentId: string) => {
    if (!selectedGroupForMembers) return;
    const slug = getActiveTenantSlug();
    try {
      const res = await fetch(`/api/v1/college-master/groups/${selectedGroupForMembers.id}/members/${studentId}?tenant=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data?.success) {
        setGroupMembers(prev => prev.filter(m => m.student_id !== studentId && m.id !== studentId));
        if (selectedGroupForMembers.batch_id) {
          const bRes = await fetch(
            `/api/v1/college-master/groups/batch-students/${selectedGroupForMembers.batch_id}?tenant=${encodeURIComponent(slug)}&courseId=${selectedGroupForMembers.course_id || ''}&departmentId=${selectedGroupForMembers.department_id || ''}&subjectId=${selectedGroupForMembers.subject_id || ''}&groupType=${selectedGroupForMembers.group_type || 'PRACTICAL'}&currentGroupId=${selectedGroupForMembers.id}&groupCode=${encodeURIComponent(selectedGroupForMembers.code || '')}&sectionId=${encodeURIComponent(selectedGroupForMembers.section_id || selectedGroupForMembers.section_code || '')}`
          );
          const bData = await bRes.json();
          if (bData?.success && Array.isArray(bData.data)) setBatchStudents(bData.data);
        }
        fetchData('groups');
      }
    } catch (err: any) {
      console.error('Failed to remove member:', err);
    }
  };

  // ─── TENANT SLUG RESOLVER ────────────────────────────────────────────────────
  const getActiveTenantSlug = (): string => {
    if (selectedCollegeFilter !== 'all') {
      const match = colleges.find((c) => c.id === selectedCollegeFilter || c.code === selectedCollegeFilter || c.slug === selectedCollegeFilter);
      if (match?.slug) return match.slug;
    }
    return userTenantSlug || colleges[0]?.slug || 'srms-cet-bareilly';
  };

  const getFormCollegeSlug = (): string => {
    if (formData.collegeId) {
      const match = colleges.find((c) => c.id === formData.collegeId || c.code === formData.collegeId || c.slug === formData.collegeId);
      if (match?.slug) return match.slug;
    }
    return userTenantSlug || colleges[0]?.slug || 'srms-cet-bareilly';
  };

  // ─── SYNC FROM SRMS PORTAL API ───────────────────────────────────────────────
  const syncFromExternalApi = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      const activeTenant = userTenantSlug || 'srms-cet-bareilly';
      const isSrmsTenant = activeTenant.toLowerCase().includes('srms');
      const urlParams = new URLSearchParams({ tenant: activeTenant, sync: 'true', include_inactive: 'true' });
      if (userTenantId) urlParams.set('tenantId', userTenantId);

      // 1. Direct Next.js sync to PostgreSQL
      const res = await fetch(`/api/srms/colleges?${urlParams.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userTenantId ? { 'x-tenant-id': userTenantId } : {}),
          ...(activeTenant ? { 'x-tenant-slug': activeTenant } : {}),
        },
        body: JSON.stringify({ tenant: activeTenant, tenantId: userTenantId, sync: true }),
      });

      // 2. Also trigger backend sync
      fetch(`${API_BASE}/colleges/sync-external?${urlParams.toString()}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          ...(userTenantId ? { 'x-tenant-id': userTenantId } : {}),
          ...(activeTenant ? { 'x-tenant-slug': activeTenant } : {}),
        },
      }).catch(() => {});

      if (res.ok) {
        const raw = await res.json();
        let list: College[] = (Array.isArray(raw) ? raw : []).map((t: any) => ({
          id: t.id || t.code,
          code: t.code || t.colg_cd || '',
          name: t.name || t.colg_name,
          slug: t.slug,
          domain: t.domain || '',
          plan: t.plan || 'enterprise',
          primary_color: t.primary_color || '#6366F1',
          is_active: t.is_active ?? true,
          schema_provisioned: t.schema_provisioned ?? false,
          created_at: t.created_at,
        }));
        if (isSrmsTenant) {
          list = list.filter((c) => {
            const name = (c.name || '').toLowerCase();
            const slug = (c.slug || '').toLowerCase();
            const cd = String(c.code || '').trim();
            return slug.includes('srms') || name.includes('srms') || name.includes('shri ram murti') || ['1','2','3','4','5','6','7','8','9','10','11','12','13','14'].includes(cd);
          });
        }
        setColleges(list);
        setSyncMessage(`Synced ${list.length} Colleges from Portal & saved to PostgreSQL under ${activeTenant} ✅`);
        setTimeout(() => setSyncMessage(''), 5000);
      } else {
        const fallbackList = await fetchCollegesFromDb(activeTenant, userTenantId);
        if (fallbackList.length > 0) {
          setColleges(fallbackList);
          setSyncMessage(`Loaded ${fallbackList.length} Colleges from PostgreSQL database ✅`);
        } else {
          setSyncMessage('Failed to sync colleges from portal API.');
        }
      }
    } catch (err: any) {
      console.error('[CollegeMaster] Sync error:', err);
      setSyncMessage('Error syncing colleges from portal.');
    } finally {
      setSyncing(false);
    }
  };

  // Sync courses for a single selected college via official SRMS GetCourse API
  const syncCoursesForCollege = async (col: College, showToast = true): Promise<Course[]> => {
    if (!col || !col.slug) return [];
    setSyncing(true);
    if (showToast) setSyncMessage(`⚡ Querying SRMS GetCourse API for ${col.name}...`);
    try {
      const res = await fetch(`${API_BASE}/courses/sync-external?tenant=${col.slug}`, { method: 'POST', headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const list: any[] = data.data || [];
        const mappedList: Course[] = list.map((c: any) => ({
          ...c,
          degree_level: c.degree_level || c.degreeLevel || 'UG',
          academic_system: c.academic_system || c.academicSystem || (col.slug === 'srms-ims' || col.code === '11' ? 'professional' : 'semester'),
          college_id: col.id,
          college_name: col.name,
          college_code: col.code || '',
          college_slug: col.slug,
        }));

        setCourses((prev) => {
          const otherColleges = prev.filter((c) => c.college_id !== col.id && c.college_slug !== col.slug);
          return [...otherColleges, ...mappedList];
        });

        if (showToast) {
          setSyncMessage(`⚡ Synced ${mappedList.length} active courses for ${col.name} via SRMS GetCourse API ✅`);
          setTimeout(() => setSyncMessage(''), 5000);
        }
        return mappedList;
      } else {
        if (showToast) setSyncMessage(`Unable to sync courses for ${col.name}`);
      }
    } catch (err: any) {
      console.error(`[CollegeMaster] Sync courses error for ${col.name}:`, err);
      if (showToast) setSyncMessage(`Failed to connect to SRMS GetCourse API for ${col.name}`);
    } finally {
      setSyncing(false);
    }
    return [];
  };

  // Sync all courses sequentially across colleges from SRMS GetCourse API
  const syncCoursesFromExternalApi = async () => {
    setSyncing(true);
    setSyncMessage('⚡ Sequentially syncing all courses for all colleges from SRMS GetCourse API...');
    try {
      const slug = getActiveTenantSlug();
      const queryParam = selectedCollegeFilter === 'all' ? '?tenant=all' : (slug ? `?tenant=${slug}` : '');
      const res = await fetch(`${API_BASE}/courses/sync-external${queryParam}`, { method: 'POST', headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const list = data.data || [];
        setCourses(list.map((c: any) => ({
          ...c,
          degree_level: c.degree_level || c.degreeLevel || 'UG',
          academic_system: c.academic_system || c.academicSystem || (c.college_slug === 'srms-ims' || c.slug === 'srms-ims' ? 'professional' : 'semester'),
          college_id: c.college_id || c.collegeId || colleges[0]?.id,
          college_name: c.college_name || colleges.find(col => col.id === (c.college_id || c.collegeId))?.name || '',
          college_code: c.college_code || colleges.find(col => col.id === (c.college_id || c.collegeId))?.code || '',
          college_slug: c.college_slug || colleges.find(col => col.id === (c.college_id || c.collegeId))?.slug || '',
        })));
        setSyncMessage(`Synced ${list.length} Courses sequentially from SRMS Portal API ✅`);
        setTimeout(() => setSyncMessage(''), 5000);
      } else {
        setSyncMessage('Failed to sync courses from portal API.');
      }
    } catch (err: any) {
      console.error('[CollegeMaster] Sync courses error:', err);
      setSyncMessage('Error syncing courses from portal.');
    } finally {
      setSyncing(false);
    }
  };

  // Sync branches for a single selected college via official SRMS GetBranch API
  const syncBranchesForCollege = async (col: College, showToast = true): Promise<any[]> => {
    if (!col || !col.slug) return [];
    setSyncing(true);
    if (showToast) setSyncMessage(`⚡ Querying SRMS GetBranch API for ${col.name}...`);
    try {
      const res = await fetch(`${API_BASE}/branches/sync-external?tenant=${col.slug}`, { method: 'POST', headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const list: any[] = data.data || [];
        setBranches((prev) => {
          const otherColleges = prev.filter((b) => b.college_id !== col.id && b.college_slug !== col.slug);
          return [...otherColleges, ...list];
        });
        if (showToast) {
          setSyncMessage(`⚡ Synced ${list.length} Departments & Branches for ${col.name} via SRMS GetBranch API to PostgreSQL ✅`);
          setTimeout(() => setSyncMessage(''), 5000);
        }
        return list;
      } else {
        if (showToast) setSyncMessage(`Unable to sync branches for ${col.name}`);
      }
    } catch (err: any) {
      console.error(`[CollegeMaster] Sync branches error for ${col.name}:`, err);
      if (showToast) setSyncMessage(`Failed to connect to SRMS GetBranch API for ${col.name}`);
    } finally {
      setSyncing(false);
    }
    return [];
  };

  // Sync all branches sequentially across colleges from SRMS GetBranch API
  const syncBranchesFromExternalApi = async () => {
    setSyncing(true);
    setSyncMessage('⚡ Sequentially syncing all departments & branches for all colleges from SRMS GetBranch API to PostgreSQL...');
    try {
      const slug = getActiveTenantSlug();
      const queryParam = selectedCollegeFilter === 'all' ? '?tenant=all' : (slug ? `?tenant=${slug}` : '');
      const res = await fetch(`${API_BASE}/branches/sync-external${queryParam}`, { method: 'POST', headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const list = data.data || [];
        setBranches(list);
        setSyncMessage(`Synced ${list.length} Departments & Branches to PostgreSQL ✅`);
        setTimeout(() => setSyncMessage(''), 5000);
      } else {
        setSyncMessage('Failed to sync branches from SRMS GetBranch API.');
      }
    } catch (err: any) {
      console.error('[CollegeMaster] Sync branches error:', err);
      setSyncMessage('Error syncing branches from SRMS API.');
    } finally {
      setSyncing(false);
    }
  };

  // Sync batches for a single selected college via official SRMS GetBatch API
  const syncBatchesForCollege = async (col: College, showToast = true): Promise<any[]> => {
    if (!col || !col.slug) return [];
    setSyncing(true);
    if (showToast) setSyncMessage(`⚡ Querying SRMS GetBatch API for ${col.name}...`);
    try {
      const res = await fetch(`${API_BASE}/batches/sync-external?tenant=${col.slug}`, { method: 'POST', headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const list: any[] = data.data || [];
        setBatches((prev) => {
          const otherColleges = prev.filter((b) => b.college_id !== col.id && b.college_slug !== col.slug);
          return [...otherColleges, ...list];
        });
        if (showToast) {
          setSyncMessage(`⚡ Synced ${list.length} Batches for ${col.name} via SRMS GetBatch API to PostgreSQL ✅`);
          setTimeout(() => setSyncMessage(''), 5000);
        }
        return list;
      } else {
        if (showToast) setSyncMessage(`Unable to sync batches for ${col.name}`);
      }
    } catch (err: any) {
      console.error(`[CollegeMaster] Sync batches error for ${col.name}:`, err);
      if (showToast) setSyncMessage(`Failed to connect to SRMS GetBatch API for ${col.name}`);
    } finally {
      setSyncing(false);
    }
    return [];
  };

  // Sync all batches sequentially across colleges from SRMS GetBatch API
  const syncBatchesFromExternalApi = async () => {
    setSyncing(true);
    setSyncMessage('⚡ Sequentially syncing all batches for all colleges from SRMS GetBatch API to PostgreSQL...');
    try {
      const slug = getActiveTenantSlug();
      const queryParam = selectedCollegeFilter === 'all' ? '?tenant=all' : (slug ? `?tenant=${slug}` : '');
      const res = await fetch(`${API_BASE}/batches/sync-external${queryParam}`, { method: 'POST', headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const list = data.data || [];
        setBatches(list);
        setSyncMessage(`Synced ${list.length} Batches to PostgreSQL ✅`);
        setTimeout(() => setSyncMessage(''), 5000);
      } else {
        setSyncMessage('Failed to sync batches from SRMS GetBatch API.');
      }
    } catch (err: any) {
      console.error('[CollegeMaster] Sync batches error:', err);
      setSyncMessage('Error syncing batches from SRMS API.');
    } finally {
      setSyncing(false);
    }
  };

  // Handle User Selecting a College Filter in Dropdown
  const handleCollegeFilterSelect = async (cId: string) => {
    setSelectedCollegeFilter(cId);
    setSelectedCourseFilter('all');
    setSelectedBranchFilter('all');
    if (cId !== 'all') {
      const targetCol = colleges.find((c) => c.id === cId);
      if (targetCol) {
        if (activeTab === 'batches') {
          await syncBatchesForCollege(targetCol, true);
        } else if (activeTab === 'branches') {
          await syncBranchesForCollege(targetCol, true);
        } else {
          await syncCoursesForCollege(targetCol, true);
        }
      }
    }
  };

  // ─── HELPER: Fetch Colleges directly from PostgreSQL Database ────────────
  const fetchCollegesFromDb = async (tenantSlug: string, tenantId?: string): Promise<College[]> => {
    const isSrmsTenant = (tenantSlug || '').toLowerCase().includes('srms');
    const urlParams = new URLSearchParams({
      tenant: tenantSlug,
      include_inactive: 'true',
    });
    if (tenantId) urlParams.set('tenantId', tenantId);

    // 1. Direct Next.js proxy route (connects directly to PostgreSQL tenant schema)
    try {
      const res = await fetch(`/api/srms/colleges?${urlParams.toString()}`, {
        headers: {
          ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
          ...(tenantSlug ? { 'x-tenant-slug': tenantSlug } : {}),
        },
      });
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw) && raw.length > 0) {
          let list: College[] = raw.map((t: any) => ({
            id: t.id || t.code,
            code: t.code || t.colg_cd || '',
            name: t.name || t.colg_name,
            slug: t.slug,
            domain: t.domain || '',
            plan: t.plan || 'enterprise',
            primary_color: t.primary_color || '#6366F1',
            is_active: t.is_active ?? true,
            schema_provisioned: t.schema_provisioned ?? false,
            created_at: t.created_at,
          }));
          if (isSrmsTenant) {
            list = list.filter((c) => {
              const name = (c.name || '').toLowerCase();
              const slug = (c.slug || '').toLowerCase();
              const cd = String(c.code || '').trim();
              return slug.includes('srms') || name.includes('srms') || name.includes('shri ram murti') || ['1','2','3','4','5','6','7','8','9','10','11','12','13','14'].includes(cd);
            });
          }
          if (list.length > 0) return list;
        }
      }
    } catch (e) {
      console.warn('[CollegeMaster] /api/srms/colleges fetch error:', e);
    }

    // 2. Fallback to backend API
    try {
      const bRes = await fetch(`${API_BASE}/colleges?${urlParams.toString()}`, {
        headers: {
          ...getAuthHeaders(),
          ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
          ...(tenantSlug ? { 'x-tenant-slug': tenantSlug } : {}),
        },
      });
      if (bRes.ok) {
        const data = await bRes.json();
        const rawList = data.data || (Array.isArray(data) ? data : []);
        if (Array.isArray(rawList) && rawList.length > 0) {
          let list: College[] = rawList.map((t: any) => ({
            id: t.id || t.code,
            code: t.code || t.colg_cd || '',
            name: t.name,
            slug: t.slug,
            domain: t.domain || '',
            plan: t.plan || 'enterprise',
            primary_color: t.primary_color || '#6366F1',
            is_active: t.is_active ?? true,
            schema_provisioned: t.schema_provisioned ?? false,
            created_at: t.created_at,
          }));
          if (isSrmsTenant) {
            list = list.filter((c) => {
              const name = (c.name || '').toLowerCase();
              const slug = (c.slug || '').toLowerCase();
              const cd = String(c.code || '').trim();
              return slug.includes('srms') || name.includes('srms') || name.includes('shri ram murti') || ['1','2','3','4','5','6','7','8','9','10','11','12','13','14'].includes(cd);
            });
          }
          if (list.length > 0) return list;
        }
      }
    } catch (e) {
      console.warn('[CollegeMaster] Backend API colleges fetch error:', e);
    }

    return [];
  };

  // ─── ON MOUNT: Load colleges from public.tenants (PostgreSQL) ───────────────
  useEffect(() => {
    ['mederp_colleges', 'mederp_courses', 'mederp_batches', 'mederp_branches', 'mederp_sessions', 'mederp_residencies', 'mederp_professionals']
      .forEach((k) => localStorage.removeItem(k));

    const loadColleges = async () => {
      try {
        let role = 'ADMIN';
        let userColg = '';
        let userSlug = '';
        let uTenantId = '';
        let storedCollegeName = '';
        if (typeof window !== 'undefined') {
          role = (localStorage.getItem('role') || 'ADMIN').toUpperCase();
          userColg = localStorage.getItem('colg_cd') || localStorage.getItem('colgCd') || '';
          userSlug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || localStorage.getItem('tenant_slug') || '';
          uTenantId = localStorage.getItem('tenantId') || '';
          storedCollegeName = localStorage.getItem('collegeName') || localStorage.getItem('tenantName') || '';
          let detectedFirmMode = localStorage.getItem('firm_mode') || '';
          try {
            const rawUser = localStorage.getItem('user');
            if (rawUser) {
              const parsed = JSON.parse(rawUser);
              detectedFirmMode = parsed.firm_mode || parsed.firmMode || detectedFirmMode;
            }
          } catch {}
          setUserRole(role);
          setUserColgCd(userColg);
          setUserTenantSlug(userSlug);
          setUserTenantId(uTenantId);
          setUserFirmMode(detectedFirmMode);
        }

        const activeTenant = userSlug || userTenantSlug || 'srms-cet-bareilly';
        const list = await fetchCollegesFromDb(activeTenant, uTenantId);
        if (list.length > 0) {
          setColleges(list);
          setSelectedCollegeFilter('all');
          console.log(`[CollegeMaster] Loaded ${list.length} colleges for tenant ${activeTenant} from PostgreSQL ✅`);
        } else {
          console.error('[CollegeMaster] Failed to load colleges from DB');
        }
      } catch (err) {
        console.error('[CollegeMaster] Error loading colleges:', err);
      }
    };
    loadColleges();
  }, []);

  // ─── FETCH TAB DATA ───────────────────────────────────────────────────────────
  const fetchData = async (tab: SubCategory, silent = false) => {
    if (tab === 'colleges') {
      if (!silent) setLoading(true);
      try {
        const targetTenant = getActiveTenantSlug() || userTenantSlug || 'srms-cet-bareilly';
        const list = await fetchCollegesFromDb(targetTenant, userTenantId);
        if (list.length > 0) {
          setColleges(list);
        }
      } catch (err) {
        console.error('[CollegeMaster] Error fetching colleges:', err);
      } finally {
        if (!silent) setLoading(false);
      }
      return;
    }

    // For tenant-scoped tabs, resolve slug dynamically
    const slug = getActiveTenantSlug();
    if (!slug) {
      console.warn('[CollegeMaster] No tenant selected — cannot fetch', tab);
      return;
    }

    if (!silent) setLoading(true);
    try {
      // API_BASE already = '.../api/v1/college-master' so just use the sub-path
      const endpointMap: Record<string, string> = {
        colleges: 'colleges',
        courses: 'courses',
        professionals: 'professionals',
        batches: 'batches',
        branches: 'branches',
        sections: 'sections',
        groups: 'groups',
        sessions: 'sessions',
        residencies: 'residencies',
      };
      const endpoint = endpointMap[tab] || tab;
      const tenantParam = userRole === 'SUPER_ADMIN'
        ? ((selectedCollegeFilter === 'all' || tab === 'courses' || tab === 'professionals') && selectedCollegeFilter === 'all' ? 'all' : slug)
        : (userTenantSlug || slug || 'srms-cet-bareilly');
      const res = await fetch(`${API_BASE}/${endpoint}?tenant=${tenantParam}`, { headers: getAuthHeaders() });
      if (!res.ok) {
        const errText = await res.text();
        console.error(`[CollegeMaster] API ${tab} failed (${res.status}):`, errText);
        return;
      }
      const data = await res.json();
      const list = data.data || (Array.isArray(data) ? data : []);
      if (Array.isArray(list)) {
        if (tab === 'courses') {
          setCourses(list.map((c: any) => {
            const matchedCol = colleges.find(col =>
              col.id === (c.college_id || c.collegeId) ||
              (c.college_code && col.code === c.college_code) ||
              (c.college_slug && col.slug === c.college_slug) ||
              (c.code && col.code === c.code)
            );
            return {
              ...c,
              degree_level: c.degree_level || c.degreeLevel || 'UG',
              academic_system: c.academic_system || c.academicSystem || (c.college_slug === 'srms-ims' || c.slug === 'srms-ims' || matchedCol?.code === '11' ? 'professional' : 'semester'),
              college_id: matchedCol?.id || c.college_id || c.collegeId || colleges[0]?.id,
              college_name: matchedCol?.name || c.college_name || 'SRMS Institution',
              college_code: matchedCol?.code || c.college_code || '',
              college_slug: matchedCol?.slug || c.college_slug || '',
            };
          }));
        }
        if (tab === 'batches') setBatches(list);
        if (tab === 'branches') setBranches(list);
        if (tab === 'sections') setSections(list);
        if (tab === 'groups') {
          setGroups(list);
          fetchFormDeliveryTypes(slug);
          fetch(`/api/v1/admin-master/subjects?tenant=${encodeURIComponent(slug)}`)
            .then(r => r.json())
            .then(data => {
              if (data?.success && Array.isArray(data.data)) setLiveSubjects(data.data);
            })
            .catch(() => {});
        }
        if (tab === 'sessions') setSessions(list);
        if (tab === 'residencies') setResidencies(list);
        if (tab === 'professionals') {
          setProfessionals(list.map((p: any) => ({
            id: p.id,
            college_id: p.college_id || colleges[0]?.id || '',
            college_name: p.college_name || colleges.find(col => col.id === p.college_id || col.code === p.college_code)?.name || 'SRMS Institution',
            college_code: p.college_code || '',
            college_slug: p.college_slug || '',
            course_id: p.course_cd || p.course_code || '',
            course_code: p.course_code || p.course_cd || '',
            course_name: p.course_name || 'Academic Program',
            branch_id: p.branch_id || '',
            branch_cd: p.branch_cd || '',
            branch_name: p.branch_name || p.branch_display_name || 'General Branch',
            academic_year: Number(p.academic_year) || (p.academic_system === 'semester' ? Math.ceil((p.phase_order || 1) / 2) : 1),
            phase_order: p.phase_order || 1,
            academic_system: p.academic_system || (p.college_slug === 'srms-ims' ? 'professional' : 'semester'),
            phase_name: p.name || p.phase_name || `Semester ${p.phase_order || 1}`,
            name: p.name || p.phase_name || `Semester ${p.phase_order || 1}`,
            duration_years: p.duration_years || 1,
            is_active: p.is_active ?? true,
          })));
        }
      }
    } catch (err) {
      console.error('[CollegeMaster] API connection failed:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if ((activeTab === 'sections' || activeTab === 'groups') && selectedCollegeFilter !== 'all') {
      const selCol = colleges.find(
        (c) => c.id === selectedCollegeFilter || c.code === selectedCollegeFilter || c.slug === selectedCollegeFilter
      );
      if (selCol && selCol.is_active === false) {
        setSelectedCollegeFilter('all');
        setSelectedCourseFilter('all');
        setSelectedBranchFilter('all');
        return;
      }
    }
    fetchData(activeTab);
    // Preload courses, branches, batches, and sections silently so cascading dropdowns stay populated
    if (activeTab !== 'courses') fetchData('courses', true);
    if (['batches', 'sections', 'groups', 'professionals', 'residencies'].includes(activeTab)) {
      fetchData('branches', true);
    }
    if (['sections', 'groups'].includes(activeTab)) {
      fetchData('batches', true);
    }
    if (activeTab === 'groups') {
      fetchData('sections', true);
    }
  }, [activeTab, selectedCollegeFilter]);

  // Active colleges only (used across Section Master & Group Master selectors and filters)
  const activeColleges = colleges.filter((c) => c.is_active !== false);

  const isActiveCollegeRecord = (itemCollegeId?: string, itemCollegeCode?: string, itemCollegeSlug?: string) => {
    if (!colleges || colleges.length === 0) return true;
    const matched = colleges.find(
      (c) =>
        (itemCollegeId && (c.id === itemCollegeId || c.code === itemCollegeId || c.slug === itemCollegeId)) ||
        (itemCollegeCode && c.code === itemCollegeCode) ||
        (itemCollegeSlug && c.slug === itemCollegeSlug)
    );
    return matched ? matched.is_active !== false : true;
  };

  // Helper: Available Courses under currently selected Form College (robust matching by ID, slug, or code)
  const getCoursesForCollege = (collegeIdOrSlug: string) => {
    if (!collegeIdOrSlug || collegeIdOrSlug === 'all') return courses;
    const selectedCol = colleges.find(c => c.id === collegeIdOrSlug || c.slug === collegeIdOrSlug || c.code === collegeIdOrSlug);
    const targetId = selectedCol?.id || collegeIdOrSlug;
    const targetSlug = selectedCol?.slug;
    const targetCode = selectedCol?.code;

    const filtered = courses.filter((c) =>
      c.college_id === targetId ||
      (targetCode && c.college_id === targetCode) ||
      (targetSlug && c.college_slug === targetSlug) ||
      (targetCode && c.college_code === targetCode)
    );
    return filtered.length > 0 ? filtered : courses;
  };

  // Helper: Available Branches under currently selected College & Course
  const getBranchesForCollegeAndCourse = (collegeIdOrSlug: string, courseIdOrCd?: string, strictCourse = false) => {
    const cleanCollege = collegeIdOrSlug && collegeIdOrSlug !== 'all' ? collegeIdOrSlug : '';
    const cleanCourse = courseIdOrCd && courseIdOrCd !== 'all' ? courseIdOrCd : '';
    if (!cleanCollege && !cleanCourse) return branches;

    const selectedCol = cleanCollege
      ? colleges.find(c => c.id === cleanCollege || c.slug === cleanCollege || c.code === cleanCollege)
      : undefined;
    const targetColId = selectedCol?.id || cleanCollege;
    const targetSlug = selectedCol?.slug;
    const targetColgCd = selectedCol?.code;

    const selectedCrs = cleanCourse
      ? courses.find(c => c.id === cleanCourse || c.code === cleanCourse || (c as any).course_cd === cleanCourse)
      : undefined;
    const targetCourseCd = (selectedCrs as any)?.course_cd || selectedCrs?.code || cleanCourse;
    const targetCourseId = selectedCrs?.id;

    const colBranches = cleanCollege
      ? branches.filter((b: any) =>
          (targetColId && b.college_id === targetColId) ||
          (targetSlug && b.college_slug === targetSlug) ||
          (targetColgCd && String(b.colg_cd) === String(targetColgCd)) ||
          (targetColgCd && String(b.college_code) === String(targetColgCd))
        )
      : branches;

    if (!targetCourseCd && !targetCourseId) return colBranches.length > 0 ? colBranches : branches;

    const courseSpecific = colBranches.filter((b: any) =>
      (targetCourseId && b.course_id === targetCourseId) ||
      (targetCourseCd && (
        String(b.course_cd) === String(targetCourseCd) ||
        String(b.course_code) === String(targetCourseCd)
      )) ||
      (selectedCrs?.name && b.course_name && b.course_name.toLowerCase().trim() === selectedCrs.name.toLowerCase().trim())
    );

    if (courseSpecific.length > 0) return courseSpecific;
    if (strictCourse) {
      return colBranches.filter((b: any) => !b.course_cd && !b.course_code && !b.course_id);
    }
    return colBranches.length > 0 ? colBranches : branches;
  };

  // Helper: Group individual semester rows into enterprise Academic Year entities
  const getGroupedAcademicYears = (items: ProfessionalPhase[]): GroupedAcademicYear[] => {
    const map = new Map<string, GroupedAcademicYear>();

    items.forEach((p) => {
      const yearNum = Number(p.academic_year) || (p.academic_system === 'semester' ? Math.ceil((p.phase_order || 1) / 2) : (p.phase_order || 1));
      const colId = p.college_id || '';
      const crsCd = p.course_code || (p as any).course_cd || '';
      const brCd = p.branch_cd || p.branch_name || 'COMMON';
      const key = `${colId}__${crsCd}__${brCd}__${yearNum}`;

      if (!map.has(key)) {
        map.set(key, {
          groupKey: key,
          college_id: p.college_id,
          college_name: p.college_name,
          college_code: (p as any).college_code,
          college_slug: (p as any).college_slug,
          course_id: p.course_id,
          course_code: p.course_code,
          course_name: p.course_name,
          branch_id: p.branch_id,
          branch_cd: p.branch_cd,
          branch_name: p.branch_name || (p as any).branch_display_name || 'General Branch',
          branch_display_name: (p as any).branch_display_name || p.branch_name || 'General Branch',
          academic_year: yearNum,
          academic_year_name: YEAR_NAMES[yearNum] || `Year ${yearNum}`,
          academic_system: p.academic_system,
          duration_years: p.duration_years || 1,
          is_active: p.is_active,
          semesters: [],
        });
      }

      const group = map.get(key)!;
      const semName = p.phase_name || p.name || `Semester ${p.phase_order || 1}`;
      if (!group.semesters.some(s => s.name === semName && s.phase_order === (p.phase_order || 1))) {
        group.semesters.push({
          id: p.id,
          name: semName,
          phase_order: p.phase_order || 1,
          is_active: p.is_active,
        });
      }
      if (p.is_active) group.is_active = true;
    });

    map.forEach((g) => {
      g.semesters.sort((a, b) => a.phase_order - b.phase_order);
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.college_name !== b.college_name) return a.college_name.localeCompare(b.college_name);
      if (a.course_name !== b.course_name) return a.course_name.localeCompare(b.course_name);
      return a.academic_year - b.academic_year;
    });
  };

  // Open Modal to Add New Item (Preselect College & Course)
  const handleAddNew = async () => {
    setEditingItem(null);
    const defaultCollegeId = selectedCollegeFilter !== 'all' ? selectedCollegeFilter : colleges[0]?.id || '';
    const selectedCol = colleges.find(c => c.id === defaultCollegeId) || colleges[0];
    let collegeCourses = getCoursesForCollege(defaultCollegeId);

    if (collegeCourses.length === 0 && selectedCol) {
      try {
        const res = await fetch(`${API_BASE}/courses?tenant=${selectedCol.slug}`);
        if (res.ok) {
          const json = await res.json();
          const list = json.data || [];
          if (list.length > 0) {
            const mapped = list.map((c: any) => ({
              ...c,
              degree_level: c.degree_level || c.degreeLevel || 'UG',
              academic_system: c.academic_system || c.academicSystem || (selectedCol.slug === 'srms-ims' || selectedCol.code === '11' ? 'professional' : 'semester'),
              college_id: selectedCol.id,
              college_name: selectedCol.name,
              college_code: selectedCol.code || '',
              college_slug: selectedCol.slug,
            }));
            setCourses((prev) => {
              const others = prev.filter((c) => c.college_id !== selectedCol.id && c.college_slug !== selectedCol.slug);
              return [...others, ...mapped];
            });
            collegeCourses = mapped;
          } else {
            collegeCourses = await syncCoursesForCollege(selectedCol, false);
          }
        }
      } catch (e) {
        console.warn('[CollegeMaster] handleAddNew course load error:', e);
      }
    }

    const defaultCourse = collegeCourses[0] || courses[0];
    const defaultCourseId = defaultCourse?.id || '';

    // Pre-fetch branches for this college if empty
    let collegeBranches = getBranchesForCollegeAndCourse(defaultCollegeId, defaultCourseId);
    if (collegeBranches.length === 0 && selectedCol) {
      try {
        const bRes = await fetch(`${API_BASE}/branches?tenant=${selectedCol.slug}`);
        if (bRes.ok) {
          const bJson = await bRes.json();
          const bList = bJson.data || (Array.isArray(bJson) ? bJson : []);
          if (bList.length > 0) {
            setBranches((prev) => {
              const others = prev.filter((b) => b.college_id !== selectedCol.id && b.college_slug !== selectedCol.slug);
              return [...others, ...bList];
            });
            collegeBranches = bList;
          }
        }
      } catch (e) {
        console.warn('[CollegeMaster] handleAddNew branch load error:', e);
      }
    }

    const defaultCollegeCode = selectedCol?.code || selectedCol?.id || defaultCollegeId;
    const defaultCourseCd = defaultCourse?.course_cd || defaultCourse?.code || defaultCourse?.id || '';

    if (activeTab === 'colleges') {
      setFormData({ code: '', name: '', slug: '', domain: '', plan: 'Enterprise', primaryColor: '#6366F1', isActive: true });
    } else if (activeTab === 'courses') {
      const isProf = selectedCol?.slug === 'srms-ims' || selectedCol?.code === '11';
      setFormData({
        collegeId: defaultCollegeCode,
        code: '',
        course_cd: '',
        name: '',
        degreeLevel: 'UG',
        academicSystem: isProf ? 'professional' : 'semester',
        durationYears: isProf ? 5.5 : 4.0,
        professionalPhase: isProf ? '1st Professional (Phase I)' : 'Semester 1 (1st Year)',
        isActive: true,
      });
    } else if (activeTab === 'professionals') {
      const isProf = defaultCourse?.academic_system === 'professional';
      const availableBranches = getBranchesForCollegeAndCourse(defaultCollegeCode, defaultCourseCd);
      const firstBranch = availableBranches[0];
      const defaultBranchCd = firstBranch?.branch_cd || firstBranch?.code || '1';
      setFormData({
        collegeId: defaultCollegeCode,
        courseId: defaultCourseCd,
        branchId: defaultBranchCd,
        branchCd: defaultBranchCd,
        branchName: firstBranch?.name || (firstBranch ? firstBranch.name : 'General Branch'),
        academicYear: 1,
        semester: '1st Semester',
        phaseName: isProf ? '1st Professional MBBS (Phase I)' : '1st Semester',
        durationYears: 1,
        academicSystem: isProf ? 'professional' : 'semester',
      });
    } else if (activeTab === 'batches') {
      setFormData({
        collegeId: defaultCollegeCode,
        courseId: defaultCourseCd,
        code: '',
        batch_cd: '',
        year: new Date().getFullYear(),
        startDate: '',
        endDate: '',
        isActive: true,
      });
    } else if (activeTab === 'branches') {
      setFormData({
        collegeId: defaultCollegeCode,
        courseId: defaultCourseCd,
        code: '',
        branch_cd: '',
        name: '',
        type: 'General',
        isActive: true,
      });
    } else if (activeTab === 'sections') {
      if (courses.length === 0) fetchData('courses', true);
      if (batches.length === 0) fetchData('batches', true);
      if (branches.length === 0) fetchData('branches', true);

      const poolCols = activeColleges.length > 0 ? activeColleges : colleges;
      const defaultCol = poolCols.find(c => c.id === defaultCollegeCode || c.code === defaultCollegeCode || c.slug === defaultCollegeCode) || poolCols[0];
      const targetColId = defaultCol?.code || defaultCol?.id || defaultCollegeCode;
      const colCourses = getCoursesForCollege(targetColId);
      const preselectedCrs = selectedCourseFilter !== 'all'
        ? colCourses.find(c => c.id === selectedCourseFilter || c.course_cd === selectedCourseFilter || c.code === selectedCourseFilter)
        : undefined;
      const firstCrs = preselectedCrs || colCourses[0];
      const targetCrsId = firstCrs?.course_cd || firstCrs?.code || firstCrs?.id || defaultCourseCd;
      const colBranches = getBranchesForCollegeAndCourse(targetColId, targetCrsId, true);
      const preselectedBranch = selectedBranchFilter !== 'all'
        ? colBranches.find(br => br.id === selectedBranchFilter || br.branch_cd === selectedBranchFilter || br.code === selectedBranchFilter)
        : undefined;
      const targetDeptId = preselectedBranch?.id || preselectedBranch?.branch_cd || preselectedBranch?.code || '';
      const colBatches = batches.filter(b => {
        const crsCd = firstCrs?.course_cd || firstCrs?.code;
        return !crsCd || b.course_code === crsCd || (b as any).course_cd === crsCd || b.course_id === firstCrs?.id;
      });
      const firstBch = colBatches[0] || batches[0];
      const targetBchId = firstBch?.id || firstBch?.batch_cd || firstBch?.code || '';
      const defaultSem = firstCrs?.academic_system === 'professional' ? '1st Professional MBBS (Phase I)' : '1st Semester';

      setFormData({
        collegeId: targetColId,
        courseId: targetCrsId,
        departmentId: targetDeptId,
        batchId: targetBchId,
        semester: defaultSem,
        phaseId: '',
        code: '1',
        name: 'Section 1',
        capacity: 60,
        isDefault: false,
        isActive: true,
      });
    } else if (activeTab === 'groups') {
      // Ensure dependent data is loaded for the cascading dropdowns
      if (courses.length === 0) fetchData('courses', true);
      if (batches.length === 0) fetchData('batches', true);
      if (branches.length === 0) fetchData('branches', true);
      if (sections.length === 0) fetchData('sections', true);

      const poolCols = activeColleges.length > 0 ? activeColleges : colleges;
      const defaultCol = poolCols.find(c => c.id === defaultCollegeCode || c.code === defaultCollegeCode || c.slug === defaultCollegeCode) || poolCols[0];
      const targetColId = defaultCol?.code || defaultCol?.id || defaultCollegeCode;
      const colCourses = getCoursesForCollege(targetColId);
      const preselectedCrs = selectedCourseFilter !== 'all'
        ? colCourses.find(c => c.id === selectedCourseFilter || c.course_cd === selectedCourseFilter || c.code === selectedCourseFilter)
        : undefined;
      const firstCrs = preselectedCrs || colCourses[0];
      const targetCrsId = firstCrs?.course_cd || firstCrs?.code || firstCrs?.id || defaultCourseCd;
      const colBranches = getBranchesForCollegeAndCourse(targetColId, targetCrsId, true);
      const preselectedBranch = selectedBranchFilter !== 'all'
        ? colBranches.find(br => br.id === selectedBranchFilter || br.branch_cd === selectedBranchFilter || br.code === selectedBranchFilter)
        : undefined;
      const targetDeptId = preselectedBranch?.id || preselectedBranch?.branch_cd || preselectedBranch?.code || '';
      const colBatches = batches.filter(b => {
        const crsCd = firstCrs?.course_cd || firstCrs?.code;
        return !crsCd || b.course_code === crsCd || (b as any).course_cd === crsCd || b.course_id === firstCrs?.id;
      });
      const firstBch = colBatches[0] || batches[0];
      // Step 1 asks user to choose Branch first before Batch & Section load (unless Branch was prefiltered or course has 0 branches)
      const targetBchId = (targetDeptId || colBranches.length === 0)
        ? (firstBch?.id || firstBch?.batch_cd || firstBch?.code || '')
        : '';
      const defaultSem = firstCrs?.academic_system === 'professional' ? '1st Professional MBBS (Phase I)' : '1st Semester';

      setFormBatchStudents([]);
      setFormSelectedStudentIds([]);
      setFormLinkedSections([]);
      setLiveSubjects([]);
      setFormStudentSearch('');
      setFormHideAssigned(true);
      setFormRangeStart('');
      setFormRangeEnd('');

      const useNonMedDelivery = isNonMedTenantMode(defaultCol?.slug, defaultCol);
      const defaultDt = deliveryTypes.find((dt) => dt.is_active !== false && String(dt.code).toUpperCase() === 'PR')
        || deliveryTypes.find((dt) => dt.is_active !== false);
      const initialGroupType = (useNonMedDelivery && defaultDt?.code) ? defaultDt.code : (useNonMedDelivery ? 'PR' : 'PRACTICAL');
      const initialTypeLabel = defaultDt?.name || (useNonMedDelivery ? 'Practical' : 'Practical');

      setFormData({
        collegeId: targetColId,
        courseId: targetCrsId,
        departmentId: targetDeptId,
        batchId: targetBchId,
        semester: defaultSem,
        phaseId: '',
        sectionId: '',
        subjectId: '',
        groupType: initialGroupType,
        code: 'A',
        name: `Group A - ${initialTypeLabel}${targetBchId && firstBch?.year ? ` (Batch ${firstBch.year})` : ''}`,
        capacity: 50,
        isActive: true,
      });
    } else if (activeTab === 'sessions') {
      setFormData({ collegeId: defaultCollegeId, name: '', startDate: '', endDate: '', isCurrent: false });
    } else if (activeTab === 'residencies') {
      setFormData({
        collegeId: defaultCollegeId,
        courseId: defaultCourseId,
        residencyType: 'Hosteller',
        categoryName: '',
        blockWing: '',
        totalCapacity: 100,
        allocatedCount: 0,
        monthlyFee: 10000,
      });
    }
    setIsModalOpen(true);
  };

  // Open Modal to Edit Item
  const handleEdit = (item: any) => {
    setEditingItem(item);

    if (activeTab === 'colleges') {
      setFormData({
        ...item,
        code: item.code || '',
        name: item.name || '',
        slug: item.slug || '',
        domain: item.domain || '',
        plan: item.plan || 'Enterprise',
        primaryColor: item.primary_color || item.primaryColor || '#6366F1',
        isActive: item.is_active ?? true,
      });
      setIsModalOpen(true);
      return;
    }

    if (activeTab === 'courses') {
      const col = colleges.find(c => c.id === (item.college_id || item.collegeId) || c.slug === item.college_slug || c.code === item.college_code) || colleges[0];
      const isProf = item.academic_system === 'professional' || col?.slug === 'srms-ims' || col?.code === '11';
      const numericCourseCd = item.course_cd || item.code || '';
      setFormData({
        ...item,
        collegeId: col?.code || col?.id || colleges[0]?.code || colleges[0]?.id,
        code: numericCourseCd,
        course_cd: numericCourseCd,
        name: item.name || '',
        degreeLevel: item.degree_level || item.degreeLevel || 'UG',
        academicSystem: item.academic_system || (isProf ? 'professional' : 'semester'),
        durationYears: item.duration_years ?? (isProf ? 5.5 : 4.0),
        professionalPhase: item.professional_phase || (isProf ? '1st Professional (Phase I)' : 'Semester 1 (1st Year)'),
        isActive: item.is_active ?? true,
      });
      setIsModalOpen(true);
      return;
    }

    if (activeTab === 'professionals') {
      const yearNum = Number(item.academic_year) || (item.academic_system === 'semester' ? Math.ceil((item.phase_order || 1) / 2) : 1);
      const semName = item.name || item.phase_name || (YEAR_SEMESTERS[yearNum]?.[0] || '1st Semester');
      const resolvedCourse = courses.find(c => c.id === item.course_id || c.code === item.course_cd || (c as any).course_cd === item.course_cd || c.code === item.course_code);
      const col = colleges.find(c => c.id === item.college_id || c.slug === item.college_slug || c.code === item.college_code);

      setFormData({
        ...item,
        collegeId: col?.code || col?.id || item.college_id || colleges[0]?.code || colleges[0]?.id,
        courseId: resolvedCourse?.course_cd || resolvedCourse?.code || item.course_id || '',
        branchCd: item.branch_cd || '',
        branchId: item.branch_id || '',
        branchName: item.branch_name || item.branch_display_name || '',
        academicYear: yearNum,
        semester: semName,
        phaseName: semName,
        durationYears: item.duration_years || 1,
        academicSystem: item.academic_system || 'semester',
        isActive: item.is_active ?? true,
      });
      setIsModalOpen(true);
      return;
    }

    if (activeTab === 'batches') {
      const col = colleges.find(c => c.id === item.college_id || c.code === item.college_code || c.slug === item.college_slug) || colleges[0];
      const crs = courses.find(c => c.course_cd === (item.course_cd || item.course_code) || c.code === (item.course_code || item.course_cd) || c.id === item.course_id);
      const rawStartDate = item.start_date || item.startDate || '';
      const rawEndDate = item.end_date || item.endDate || '';
      setFormData({
        ...item,
        collegeId: col?.code || col?.id || colleges[0]?.code || colleges[0]?.id,
        courseId: crs?.course_cd || crs?.code || item.course_cd || item.course_code || '',
        code: item.batch_cd || item.code || '',
        batch_cd: item.batch_cd || item.code || '',
        year: item.year || new Date().getFullYear(),
        startDate: rawStartDate && rawStartDate !== '—' ? formatDate(rawStartDate) : '',
        endDate: rawEndDate && rawEndDate !== '—' ? formatDate(rawEndDate) : '',
        isActive: item.is_active ?? true,
      });
      setIsModalOpen(true);
      return;
    }

    if (activeTab === 'branches') {
      const col = colleges.find(c => c.id === item.college_id || c.code === item.college_code || c.slug === item.college_slug) || colleges[0];
      const targetCollegeId = col?.code || col?.id || colleges[0]?.code || colleges[0]?.id;
      if (courses.length === 0) {
        fetchData('courses');
      }
      const crs = courses.find(c => c.course_cd === (item.course_cd || item.course_code) || c.code === (item.course_code || item.course_cd) || c.id === item.course_id);
      const targetCourseId = crs?.course_cd || crs?.code || item.course_cd || item.course_code || item.course_id || '';
      setFormData({
        ...item,
        collegeId: targetCollegeId,
        courseId: targetCourseId,
        code: item.branch_cd || item.code || '',
        branch_cd: item.branch_cd || item.code || '',
        name: item.name || '',
        type: item.type || 'General',
        isActive: item.is_active ?? true,
      });
      setIsModalOpen(true);
      return;
    }

    if (activeTab === 'sessions') {
      const col = colleges.find(c => c.id === item.college_id || c.code === item.college_code || c.slug === item.college_slug) || colleges[0];
      const rawStartDate = item.start_date || item.startDate || '';
      const rawEndDate = item.end_date || item.endDate || '';
      const sessionCdVal = item.session_cd || item.code || '';
      setFormData({
        ...item,
        collegeId: col?.code || col?.id || colleges[0]?.code || colleges[0]?.id,
        session_cd: sessionCdVal,
        code: sessionCdVal,
        name: item.name || item.session_name || '',
        startDate: rawStartDate && rawStartDate !== '—' ? formatDate(rawStartDate) : '',
        endDate: rawEndDate && rawEndDate !== '—' ? formatDate(rawEndDate) : '',
        isCurrent: item.is_current ?? item.isCurrent ?? false,
        isActive: item.is_active ?? true,
      });
      setIsModalOpen(true);
      return;
    }

    if (activeTab === 'sections') {
      const poolCols = activeColleges.length > 0 ? activeColleges : colleges;
      const col = poolCols.find(c => c.id === item.college_id || c.code === item.college_code || c.slug === item.college_slug) || poolCols[0];
      const targetCollegeId = col?.code || col?.id || poolCols[0]?.code || poolCols[0]?.id;

      const crs = courses.find(c =>
        c.id === item.course_id ||
        c.course_cd === item.course_id ||
        c.code === item.course_id ||
        c.course_cd === item.course_cd ||
        c.code === item.course_code ||
        c.course_cd === (item as any).batch_course_cd ||
        c.code === (item as any).batch_course_cd
      ) || (item.batch_id ? courses.find(c => {
        const b = batches.find(bx => bx.id === item.batch_id || bx.code === item.batch_id || (bx as any).batch_cd === item.batch_id);
        return b && (c.id === b.course_id || c.code === b.course_code || c.course_cd === (b as any).course_cd || c.code === (b as any).course_cd);
      }) : undefined) || courses[0];
      const targetCourseId = crs?.course_cd || crs?.code || crs?.id || item.course_id || '';

      const bch =
        batches.find(b => b.id === item.batch_id) ||
        batches.find(b =>
          (!crs?.course_cd || (b as any).course_cd === crs.course_cd || b.course_code === crs.code) &&
          (b.code === item.batch_code || b.batch_cd === item.batch_code || String(b.year) === String(item.batch_year))
        ) ||
        batches.find(b =>
          b.code === item.batch_id ||
          b.batch_cd === item.batch_id ||
          b.code === item.batch_code ||
          b.batch_cd === item.batch_code ||
          String(b.year) === String(item.batch_year)
        );
      const targetBatchId = bch?.id || bch?.batch_cd || bch?.code || item.batch_id || item.batch_code || '';

      const hasDeptRef = Boolean(item.department_id || item.department_code || item.department_name);
      const dept = hasDeptRef
        ? (branches.find(br => item.department_id && br.id === item.department_id) ||
           branches.find(br =>
             (!crs?.course_cd || (br as any).course_cd === crs.course_cd || br.course_code === crs.code) &&
             ((item.department_code && (br.code === item.department_code || br.branch_cd === item.department_code)) ||
              (item.department_name && br.name === item.department_name))
           ) ||
           branches.find(br =>
             (item.department_id && (br.code === item.department_id || br.branch_cd === item.department_id)) ||
             (item.department_code && (br.code === item.department_code || br.branch_cd === item.department_code)) ||
             (item.department_name && br.name === item.department_name)
           ))
        : undefined;
      const targetDeptId = dept?.id || dept?.branch_cd || dept?.code || item.department_id || item.department_code || '';

      setFormData({
        ...item,
        collegeId: targetCollegeId,
        courseId: targetCourseId,
        departmentId: targetDeptId,
        batchId: targetBatchId,
        semester: item.semester || (crs?.academic_system === 'professional' ? '1st Professional MBBS (Phase I)' : '1st Semester'),
        phaseId: item.phase_id || '',
        code: toNumericSectionCode(item.code, '1'),
        name: item.name || '',
        capacity: Number(item.capacity) || 60,
        isDefault: item.is_default ?? false,
        isActive: item.is_active ?? true,
      });
      setIsModalOpen(true);
      return;
    }

    if (activeTab === 'groups') {
      const poolCols = activeColleges.length > 0 ? activeColleges : colleges;
      const col = poolCols.find(c => c.id === item.college_id || c.code === item.college_code || c.slug === item.college_slug) || poolCols[0];
      const targetCollegeId = col?.code || col?.id || poolCols[0]?.code || poolCols[0]?.id;

      // Match course
      const crs = courses.find(c =>
        c.id === item.course_id ||
        c.course_cd === item.course_id ||
        c.code === item.course_id ||
        c.course_cd === item.course_cd ||
        c.code === item.course_code ||
        c.course_cd === (item as any).batch_course_cd ||
        c.code === (item as any).batch_course_cd
      ) || (item.batch_id ? courses.find(c => {
        const b = batches.find(bx => bx.id === item.batch_id || bx.code === item.batch_id || (bx as any).batch_cd === item.batch_id);
        return b && (c.id === b.course_id || c.code === b.course_code || c.course_cd === (b as any).course_cd || c.code === (b as any).course_cd);
      }) : undefined) || courses[0];

      const targetCourseId = crs?.course_cd || crs?.code || crs?.id || item.course_id || '';

      // Match batch (prioritize exact UUID match over code fallback)
      const bch =
        batches.find(b => b.id === item.batch_id) ||
        batches.find(b =>
          (!crs?.course_cd || (b as any).course_cd === crs.course_cd || b.course_code === crs.code) &&
          (b.code === item.batch_code || b.batch_cd === item.batch_code || String(b.year) === String(item.batch_year))
        ) ||
        batches.find(b =>
          b.code === item.batch_id ||
          b.batch_cd === item.batch_id ||
          b.code === item.batch_code ||
          b.batch_cd === item.batch_code ||
          String(b.year) === String(item.batch_year)
        );
      const targetBatchId = bch?.id || bch?.batch_cd || bch?.code || item.batch_id || item.batch_code || '';

      // Match department / branch safely (prioritize exact UUID match over code fallback)
      const hasDeptRef = Boolean(item.department_id || item.department_code || item.department_name);
      const dept = hasDeptRef
        ? (branches.find(br => item.department_id && br.id === item.department_id) ||
           branches.find(br =>
             (!crs?.course_cd || (br as any).course_cd === crs.course_cd || br.course_code === crs.code) &&
             ((item.department_code && (br.code === item.department_code || br.branch_cd === item.department_code)) ||
              (item.department_name && br.name === item.department_name))
           ) ||
           branches.find(br =>
             (item.department_id && (br.code === item.department_id || br.branch_cd === item.department_id)) ||
             (item.department_code && (br.code === item.department_code || br.branch_cd === item.department_code)) ||
             (item.department_name && br.name === item.department_name)
           ))
        : undefined;
      const targetDeptId = dept?.id || dept?.branch_cd || dept?.code || item.department_id || item.department_code || '';

      setFormBatchStudents([]);
      setFormSelectedStudentIds([]);
      setFormLinkedSections([]);
      setFormStudentSearch('');
      setFormHideAssigned(true);
      setFormRangeStart('');
      setFormRangeEnd('');

      const matchedSecObj = item.section_id
        ? sections.find((s) => s.id === item.section_id || s.code === item.section_code)
        : undefined;
      const rawSecCode = String(item.section_code || matchedSecObj?.code || '').trim();
      const resolvedSecCode = rawSecCode ? toNumericSectionCode(rawSecCode, '') : '';

      setFormData({
        ...item,
        collegeId: targetCollegeId,
        courseId: targetCourseId,
        batchId: targetBatchId,
        departmentId: targetDeptId,
        sectionId: resolvedSecCode,
        semester: item.semester || (crs?.academic_system === 'professional' ? '1st Professional MBBS (Phase I)' : '1st Semester'),
        phaseId: item.phase_id || '',
        code: item.code || item.group_code || 'A',
        name: item.name || item.group_name || '',
        capacity: Number(item.capacity) || 50,
        groupType: item.group_type || 'PRACTICAL',
        subjectId: item.subject_id || '',
        isActive: item.is_active ?? true,
      });
      setIsModalOpen(true);
      return;
    }

    if (activeTab === 'residencies') {
      const col = colleges.find(c => c.id === item.college_id || c.code === item.college_code || c.slug === item.college_slug) || colleges[0];
      const targetCollegeId = col?.code || col?.id || colleges[0]?.code || colleges[0]?.id;
      const crs = courses.find(c => c.id === item.course_id || c.course_cd === item.course_id || c.code === item.course_id || c.code === item.course_code);
      setFormData({
        ...item,
        collegeId: targetCollegeId,
        courseId: crs?.course_cd || crs?.code || item.course_id || '',
        residencyType: item.residency_type || item.residencyType || 'Hosteller',
        categoryName: item.category_name || item.categoryName || '',
        blockWing: item.block_wing || item.blockWing || '',
        totalCapacity: item.total_capacity || item.totalCapacity || 100,
        allocatedCount: item.allocated_count || item.allocatedCount || 0,
        monthlyFee: item.monthly_fee || item.monthlyFee || 0,
        isActive: item.is_active ?? true,
      });
      setIsModalOpen(true);
      return;
    }

    const rawStartDate = item.start_date || item.startDate || '';
    const rawEndDate = item.end_date || item.endDate || '';
    const startDate = rawStartDate && rawStartDate !== '—' ? formatDate(rawStartDate) : '';
    const endDate = rawEndDate && rawEndDate !== '—' ? formatDate(rawEndDate) : '';

    setFormData({
      ...item,
      collegeId: item.college_id || item.collegeId || colleges[0]?.id,
      courseId: item.course_id || item.courseId || '',
      startDate,
      endDate,
      isCurrent: item.is_current ?? item.isCurrent ?? false,
      phaseName: item.phase_name || item.phaseName || item.name || '',
      durationYears: item.duration_years || item.durationYears || item.phase_order || 1.0,
      academicSystem: item.academic_system || item.academicSystem || 'professional',
      residencyType: item.residency_type || item.residencyType || 'Hosteller',
      categoryName: item.category_name || item.categoryName || '',
      blockWing: item.block_wing || item.blockWing || '',
      totalCapacity: item.total_capacity || item.totalCapacity || 100,
      allocatedCount: item.allocated_count || item.allocatedCount || 0,
      monthlyFee: item.monthly_fee || item.monthlyFee || 0,
      isActive: item.is_active ?? true,
    });
    setIsModalOpen(true);
  };

  const syncSessionsFromExternalApi = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      const slug = getActiveTenantSlug();
      const res = await fetch(`${API_BASE}/sessions/sync-external?tenant=${slug}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        setSyncMessage(`✅ Synced ${json.data?.length || 7} academic sessions successfully from SRMS GetSession API to PostgreSQL!`);
        fetchData('sessions');
      } else {
        const localRes = await fetch('/api/srms/sessions');
        if (localRes.ok) {
          const list = await localRes.json();
          setSyncMessage(`✅ Synced ${list.length} sessions from SRMS FeeAdmin/GetSession API.`);
          fetchData('sessions');
        }
      }
    } catch (e: any) {
      setSyncMessage('⚠️ Error syncing sessions: ' + e.message);
    } finally {
      setSyncing(false);
    }
  };

  // Handle Form College Change -> Automatically update Cascading Course Dropdown
  const handleFormCollegeChange = async (cId: string) => {
    const selectedCol = colleges.find(c => c.id === cId || c.slug === cId || c.code === cId);
    const isColIms = selectedCol?.slug === 'srms-ims' || selectedCol?.code === '11';
    const targetSlug = selectedCol?.slug || cId;

    let availableCourses = getCoursesForCollege(selectedCol?.id || cId);
    if (availableCourses.length === 0 && selectedCol) {
      try {
        // 1. Fetch courses for this tenant from backend (which looks in postgresql schema)
        const res = await fetch(`${API_BASE}/courses?tenant=${targetSlug}`, { headers: getAuthHeaders() });
        if (res.ok) {
          const json = await res.json();
          const list = json.data || (Array.isArray(json) ? json : []);
          if (list.length > 0) {
            const mapped = list.map((c: any) => ({
              ...c,
              degree_level: c.degree_level || c.degreeLevel || 'UG',
              academic_system: c.academic_system || c.academicSystem || (targetSlug === 'srms-ims' || selectedCol.code === '11' ? 'professional' : 'semester'),
              college_id: selectedCol.id,
              college_name: selectedCol.name,
              college_code: selectedCol.code || '',
              college_slug: selectedCol.slug,
            }));
            setCourses((prev) => {
              const others = prev.filter((c) => c.college_id !== selectedCol.id && c.college_slug !== selectedCol.slug);
              return [...others, ...mapped];
            });
            availableCourses = mapped;
          } else {
            // 2. If empty, sync from SRMS GetCourse API
            availableCourses = await syncCoursesForCollege(selectedCol, false);
          }
        } else {
          availableCourses = await syncCoursesForCollege(selectedCol, false);
        }
      } catch (err) {
        console.error('[CollegeMaster] Error loading courses on college change:', err);
      }
    }

    const firstCourse = availableCourses[0];
    const firstCourseId = firstCourse?.id || '';
    const isProf = firstCourse?.academic_system === 'professional';

    // Load branches for this college if not already present
    let availableBranches = getBranchesForCollegeAndCourse(selectedCol?.id || cId, firstCourseId);
    if (availableBranches.length === 0 && selectedCol) {
      try {
        const bRes = await fetch(`${API_BASE}/branches?tenant=${targetSlug}`);
        if (bRes.ok) {
          const bJson = await bRes.json();
          const bList = bJson.data || (Array.isArray(bJson) ? bJson : []);
          if (bList.length > 0) {
            setBranches((prev) => {
              const others = prev.filter((b) => b.college_id !== selectedCol.id && b.college_slug !== selectedCol.slug);
              return [...others, ...bList];
            });
            availableBranches = bList;
          }
        }
      } catch (err) {
        console.error('[CollegeMaster] Error loading branches on college change:', err);
      }
    }

    const courseBranches = getBranchesForCollegeAndCourse(selectedCol?.code || selectedCol?.id || cId, firstCourseId);
    const firstBranch = courseBranches[0];
    const defaultBranchCd = firstBranch?.branch_cd || firstBranch?.code || '1';

    setFormData((prev) => ({
      ...prev,
      collegeId: selectedCol?.code || selectedCol?.id || cId,
      academicSystem: isColIms ? 'professional' : 'semester',
      courseId: firstCourse?.course_cd || firstCourse?.code || firstCourseId,
      departmentId: '',
      batchId: '',
      sectionId: '',
      subjectId: '',
      branchId: defaultBranchCd,
      branchCd: defaultBranchCd,
      branchName: firstBranch?.name || (firstBranch ? firstBranch.name : 'General Branch'),
      academicYear: 1,
      semester: isProf ? '1st Professional MBBS (Phase I)' : '1st Semester',
      phaseName: isProf ? '1st Professional MBBS (Phase I)' : '1st Semester',
      durationYears: activeTab === 'courses' ? (isColIms ? 5.5 : 4.0) : 1,
      professionalPhase: isColIms ? '1st Professional (Phase I)' : '1st Semester',
    }));
  };

  // Handle Form Course Change -> Automatically determine Professional vs Semester options & refresh branches
  const handleFormCourseChange = async (crsId: string) => {
    const selectedCourse = courses.find((c) => c.id === crsId);
    const isProf = selectedCourse?.academic_system === 'professional';
    const targetSlug = selectedCourse?.college_slug || colleges.find(c => c.id === formData.collegeId)?.slug || 'all';

    let availableBranches = getBranchesForCollegeAndCourse(formData.collegeId || colleges[0]?.id, crsId);
    if (availableBranches.length === 0) {
      try {
        const bRes = await fetch(`${API_BASE}/branches?tenant=${targetSlug}`);
        if (bRes.ok) {
          const bJson = await bRes.json();
          const bList = bJson.data || (Array.isArray(bJson) ? bJson : []);
          if (bList.length > 0) {
            setBranches((prev) => {
              const others = prev.filter((b) => b.college_slug !== targetSlug);
              return [...others, ...bList];
            });
            availableBranches = bList;
          }
        }
      } catch (err) { }
    }

    const courseBranches = getBranchesForCollegeAndCourse(formData.collegeId || colleges[0]?.id, crsId);
    const firstBranch = courseBranches[0];
    const defaultBranchCd = firstBranch?.branch_cd || firstBranch?.code || '1';

    setFormData((prev) => {
      const currentYear = Number(prev.academicYear) || 1;
      const startSem = isProf ? '1st Professional MBBS (Phase I)' : (YEAR_SEMESTERS[currentYear]?.[0] || '1st Semester');
      return {
        ...prev,
        courseId: crsId,
        branchId: defaultBranchCd,
        branchCd: defaultBranchCd,
        branchName: firstBranch?.name || (firstBranch ? firstBranch.name : 'General Branch'),
        academicSystem: isProf ? 'professional' : 'semester',
        academicYear: currentYear,
        semester: startSem,
        phaseName: startSem,
        durationYears: isProf ? 1.5 : 1,
      };
    });
  };

  // Local State Update Fallback (React memory only)
  const updateLocalStateFallback = (isEdit: boolean) => {
    const targetId = editingItem?.id || editingItem?.slug || String(Date.now());

    if (activeTab === 'colleges') {
      const updatedCollege: College = {
        id: targetId,
        name: formData.name || editingItem?.name || 'New College',
        slug: formData.slug || editingItem?.slug || 'slug',
        domain: formData.domain || editingItem?.domain || '',
        plan: formData.plan || editingItem?.plan || 'Enterprise',
        primary_color: formData.primaryColor || formData.primary_color || editingItem?.primary_color || '#6366F1',
        is_active: formData.is_active ?? editingItem?.is_active ?? true,
      };

      setColleges((prev) => {
        const next = isEdit
          ? prev.map((c) => (c.id === targetId || c.slug === targetId ? updatedCollege : c))
          : [updatedCollege, ...prev];
        return next;
      });

      if (isEdit) {
        const oldCollegeName = editingItem?.name;
        setCourses((prev) => {
          const next = prev.map((crs) => (crs.college_id === targetId || crs.college_name === oldCollegeName ? { ...crs, college_name: updatedCollege.name } : crs));
          return next;
        });
        setProfessionals((prev) => {
          const next = prev.map((p) => (p.college_id === targetId || p.college_name === oldCollegeName ? { ...p, college_name: updatedCollege.name } : p));
          return next;
        });
        setBatches((prev) => {
          const next = prev.map((b) => (b.college_id === targetId || b.college_name === oldCollegeName ? { ...b, college_name: updatedCollege.name } : b));
          return next;
        });
        setBranches((prev) => {
          const next = prev.map((br) => (br.college_id === targetId || br.college_name === oldCollegeName ? { ...br, college_name: updatedCollege.name } : br));
          return next;
        });
        setSessions((prev) => {
          const next = prev.map((s) => (s.college_id === targetId || s.college_name === oldCollegeName ? { ...s, college_name: updatedCollege.name } : s));
          return next;
        });
        setResidencies((prev) => {
          const next = prev.map((r) => (r.college_id === targetId || r.college_name === oldCollegeName ? { ...r, college_name: updatedCollege.name } : r));
          return next;
        });
      }
      return;
    }

    const selectedCollege = colleges.find((c) => c.id === formData.collegeId) || colleges[0];
    const college_id = selectedCollege?.id;
    const college_name = selectedCollege?.name;

    const availableCourses = getCoursesForCollege(college_id);
    const selectedCourse = availableCourses.find((c) => c.id === formData.courseId) || availableCourses[0] || courses[0];
    const course_id = selectedCourse?.id;
    const course_code = selectedCourse?.code;
    const course_name = selectedCourse?.name;
    const academic_system = selectedCourse?.academic_system || (formData.academicSystem as any) || 'professional';

    if (activeTab === 'courses') {
      const item: Course = {
        id: targetId,
        code: formData.code || 'CODE',
        name: formData.name || 'Course Title',
        degree_level: formData.degreeLevel || 'UG',
        academic_system: formData.academicSystem || 'professional',
        college_id,
        college_name,
        is_active: true,
      };
      setCourses((prev) => {
        const next = isEdit ? prev.map((c) => (c.id === targetId ? item : c)) : [item, ...prev];
        return next;
      });
    } else if (activeTab === 'professionals') {
      const item: ProfessionalPhase = {
        id: targetId,
        college_id,
        college_name,
        course_id,
        course_code,
        course_name,
        academic_system,
        phase_name: formData.phaseName || (academic_system === 'semester' ? 'Semester 1 (1st Year)' : '1st Professional MBBS (Phase I)'),
        duration_years: Number(formData.durationYears) || (academic_system === 'semester' ? 0.5 : 1.5),
        is_active: true,
      };
      setProfessionals((prev) => {
        const next = isEdit ? prev.map((p) => (p.id === targetId ? item : p)) : [item, ...prev];
        return next;
      });
    } else if (activeTab === 'batches') {
      const item: Batch = {
        id: targetId,
        college_id,
        college_name,
        course_id,
        course_code,
        code: formData.code || 'BATCH',
        year: Number(formData.year) || 2024,
        start_date: formData.startDate,
        end_date: formData.endDate,
        is_active: true,
      };
      setBatches((prev) => {
        const next = isEdit ? prev.map((b) => (b.id === targetId ? item : b)) : [item, ...prev];
        return next;
      });
    } else if (activeTab === 'branches') {
      const item: Branch = {
        id: targetId,
        college_id,
        college_name,
        course_id,
        course_code,
        code: formData.code || 'BRANCH',
        name: formData.name || 'Branch Name',
        type: formData.type || 'Clinical',
        is_active: true,
      };
      setBranches((prev) => {
        const next = isEdit ? prev.map((b) => (b.id === targetId ? item : b)) : [item, ...prev];
        return next;
      });
    } else if (activeTab === 'groups') {
      const selectedCourse = courses.find(c => c.id === formData.courseId || c.course_cd === formData.courseId || c.code === formData.courseId);
      const selectedBatch = batches.find(b => b.id === formData.batchId || b.code === formData.batchId || b.batch_cd === formData.batchId);
      const selectedDept = branches.find(br => br.id === formData.departmentId || br.code === formData.departmentId || br.branch_cd === formData.departmentId);

      const item: Group = {
        id: targetId,
        code: formData.code || 'A',
        name: formData.name || 'Group A',
        college_id,
        college_name,
        course_id: selectedCourse?.id || formData.courseId,
        batch_id: selectedBatch?.id || formData.batchId,
        batch_code: selectedBatch?.code || selectedBatch?.batch_cd || '',
        department_id: selectedDept?.id || formData.departmentId,
        department_code: selectedDept?.code || selectedDept?.branch_cd || '',
        department_name: selectedDept?.name || (selectedDept as any)?.branch_name || '',
        capacity: Number(formData.capacity) || 50,
        is_active: formData.isActive ?? true,
      };
      setGroups((prev) => {
        const next = isEdit ? prev.map((g) => (g.id === targetId ? item : g)) : [item, ...prev];
        return next;
      });
    } else if (activeTab === 'sessions') {
      const item: AcademicSession = {
        id: targetId,
        college_id,
        college_name,
        name: formData.name || 'Session Name',
        start_date: formData.startDate || '',
        end_date: formData.endDate || '',
        is_current: Boolean(formData.isCurrent),
        is_active: true,
      };
      setSessions((prev) => {
        const next = isEdit ? prev.map((s) => (s.id === targetId ? item : s)) : [item, ...prev];
        return next;
      });
    } else if (activeTab === 'residencies') {
      const item: ResidencyCategory = {
        id: targetId,
        college_id,
        college_name,
        residency_type: formData.residencyType || 'Hosteller',
        category_name: formData.categoryName || 'New Residency Block',
        block_wing: formData.blockWing || '',
        total_capacity: Number(formData.totalCapacity) || 100,
        allocated_count: Number(formData.allocatedCount) || 0,
        monthly_fee: Number(formData.monthlyFee) || 0,
        is_active: true,
      };
      setResidencies((prev) => {
        const next = isEdit ? prev.map((r) => (r.id === targetId ? item : r)) : [item, ...prev];
        return next;
      });
    }
  };

  // Save Record — writes to PostgreSQL via backend API
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = Boolean(editingItem);
    const method = isEdit ? 'PUT' : 'POST';
    const recordId = editingItem?.id || editingItem?.slug || '';

    // Colleges → tenant schema endpoint
    if (activeTab === 'colleges') {
      const slug = getActiveTenantSlug() || userTenantSlug || 'srms-cet-bareilly';
      const bodyPayload: Record<string, any> = {
        code: formData.code?.trim() || undefined,
        name: formData.name?.trim(),
        slug: formData.slug?.trim(),
        domain: formData.domain?.trim() || '',
        plan: formData.plan || 'enterprise',
        primaryColor: formData.primaryColor || formData.primary_color || '#6366F1',
        tenant: slug,
        tenantId: userTenantId,
        action: isEdit ? 'update' : 'create',
        id: recordId,
      };
      if (isEdit) {
        bodyPayload.isActive = formData.isActive ?? formData.is_active ?? true;
      }
      try {
        // 1. Direct Next.js DB write
        await fetch('/api/srms/colleges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
        });

        // 2. Also write to backend API
        const url = isEdit
          ? `${API_BASE}/colleges/${recordId}?tenant=${encodeURIComponent(slug)}${userTenantId ? `&tenantId=${userTenantId}` : ''}`
          : `${API_BASE}/colleges?tenant=${encodeURIComponent(slug)}${userTenantId ? `&tenantId=${userTenantId}` : ''}`;
        await fetch(url, {
          method,
          headers: {
            ...getAuthHeaders(),
            ...(userTenantId ? { 'x-tenant-id': userTenantId } : {}),
            ...(slug ? { 'x-tenant-slug': slug } : {}),
          },
          body: JSON.stringify(bodyPayload),
        }).catch(() => {});

        console.log('[CollegeMaster] College saved under tenant schema ✅');
        const refreshed = await fetchCollegesFromDb(slug, userTenantId);
        if (refreshed.length > 0) setColleges(refreshed);
      } catch (err) {
        console.error('[CollegeMaster] Network error:', err);
      }
      setIsModalOpen(false);
      return;
    }

    // Tenant-scoped tabs: use the slug of the college selected in the form
    const slug = getFormCollegeSlug();
    if (!slug) {
      alert('Please select a college first.');
      return;
    }

    const saveEndpointMap: Record<string, string> = {
      courses: 'courses',
      professionals: 'professionals',
      batches: 'batches',
      branches: 'branches',
      sections: 'sections',
      groups: 'groups',
      sessions: 'sessions',
      residencies: 'residencies',
    };
    const saveEndpoint = saveEndpointMap[activeTab] || activeTab;
    const url = isEdit
      ? `${API_BASE}/${saveEndpoint}/${recordId}?tenant=${slug}`
      : `${API_BASE}/${saveEndpoint}?tenant=${slug}`;

    let bodyPayload: Record<string, any> = { ...formData };
    if (activeTab === 'courses') {
      const selectedFormCol = colleges.find(c => c.id === formData.collegeId || c.code === formData.collegeId || c.slug === formData.collegeId);
      const isIms = (slug === 'srms-ims' || selectedFormCol?.code === '11');
      const academicSystem = formData.academicSystem || (isIms ? 'professional' : 'semester');
      const courseCdVal = formData.course_cd?.trim() || formData.code?.trim();
      bodyPayload = {
        code: courseCdVal,
        course_cd: courseCdVal,
        name: formData.name?.trim(),
        degreeLevel: formData.degreeLevel || 'UG',
        durationYears: Number(formData.durationYears) || (isIms ? 5.5 : 4.0),
        professionalPhase: formData.professionalPhase || formData.phaseName || (isIms ? '1st Professional (Phase I)' : 'Semester 1 (1st Year)'),
        academicSystem,
        collegeId: formData.collegeId,
      };
      if (isEdit) {
        bodyPayload.isActive = formData.isActive ?? formData.is_active ?? true;
      }
    } else if (activeTab === 'professionals') {
      const selectedCourse = courses.find(c => c.id === formData.courseId || c.course_cd === formData.courseId || c.code === formData.courseId) || getCoursesForCollege(formData.collegeId || colleges[0]?.code || colleges[0]?.id)[0];
      const courseCd = selectedCourse?.course_cd || selectedCourse?.code || formData.courseId || '1';
      const academicSystem = selectedCourse?.academic_system || (formData.academicSystem as any) || (slug === 'srms-ims' ? 'professional' : 'semester');
      const academicYearNum = Number(formData.academicYear) || 1;
      const isSemester = academicSystem === 'semester';

      // Resolve branch accurately
      const availableBranches = getBranchesForCollegeAndCourse(formData.collegeId || colleges[0]?.code || colleges[0]?.id, formData.courseId);
      const selectedBranch = availableBranches.find(b => b.branch_cd === formData.branchCd || b.code === formData.branchCd || b.id === formData.branchCd) || availableBranches[0];
      const branchCd = formData.branchCd || selectedBranch?.branch_cd || selectedBranch?.code || '1';
      const branchId = branchCd;
      const branchName = formData.branchName || selectedBranch?.name || selectedBranch?.branch_name || (branchCd ? `Branch ${branchCd}` : 'General Branch');

      if (!isEdit && isSemester) {
        // Multi-semester provision for this Academic Year
        const targetSemesters: string[] = YEAR_SEMESTERS[academicYearNum] || ['1st Semester', '2nd Semester'];

        try {
          for (const sem of targetSemesters) {
            const semNumMatch = sem.match(/(\d+)/);
            const computedOrder = semNumMatch ? parseInt(semNumMatch[1], 10) : (academicYearNum * 2 - 1);
            const payload = {
              name: sem,
              phaseOrder: computedOrder,
              courseCd: courseCd,
              branchCd: branchCd,
              branchId: branchId,
              branchName: branchName,
              academicYear: academicYearNum,
              academicSystem: 'semester',
              collegeId: formData.collegeId,
              isActive: true,
            };
            await fetch(`${API_BASE}/professionals?tenant=${slug}`, {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify(payload),
            });
          }
          setSyncMessage('✅ Academic Year semesters saved to PostgreSQL!');
          setTimeout(() => setSyncMessage(''), 6000);
          await fetchData('professionals');
        } catch (e) {
          console.error('[CollegeMaster] error provisioning academic year semesters:', e);
        }
        setIsModalOpen(false);
        return;
      }

      const semesterName = isSemester ? (formData.semester || YEAR_SEMESTERS[academicYearNum]?.[0] || '1st Semester') : (formData.phaseName || '1st Professional MBBS (Phase I)');
      const semNumMatch = semesterName.match(/(\d+)/);
      const computedOrder = semNumMatch ? parseInt(semNumMatch[1], 10) : (academicYearNum * 2 - 1);

      bodyPayload = {
        name: semesterName,
        phaseOrder: computedOrder,
        courseCd: courseCd,
        branchCd: branchCd,
        branchId: branchId,
        branchName: branchName,
        academicYear: academicYearNum,
        academicSystem: academicSystem,
        collegeId: formData.collegeId,
      };
      if (isEdit) {
        bodyPayload.isActive = formData.isActive ?? formData.is_active ?? true;
      }
    } else if (activeTab === 'batches') {
      const selectedCourse = courses.find(c => c.id === formData.courseId || c.course_cd === formData.courseId || c.code === formData.courseId) || getCoursesForCollege(formData.collegeId || colleges[0]?.code || colleges[0]?.id)[0];
      const courseCd = selectedCourse?.course_cd || selectedCourse?.code || formData.courseId || '1';
      const batchCdVal = String(formData.code || formData.batch_cd || formData.year || '').trim();
      bodyPayload = {
        code: batchCdVal,
        year: Number(formData.year) || new Date().getFullYear(),
        courseCd,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        collegeId: formData.collegeId,
      };
    } else if (activeTab === 'branches') {
      const selectedCourse = courses.find(c => c.id === formData.courseId || c.course_cd === formData.courseId || c.code === formData.courseId) || getCoursesForCollege(formData.collegeId || colleges[0]?.code || colleges[0]?.id)[0];
      const courseCd = selectedCourse?.course_cd || selectedCourse?.code || formData.courseId || '1';
      const branchCdVal = String(formData.code || formData.branch_cd || '1').trim();
      bodyPayload = {
        code: branchCdVal,
        branchCd: branchCdVal,
        name: formData.name?.trim(),
        type: formData.type || 'General',
        courseCd,
        courseName: selectedCourse?.name || null,
        collegeId: formData.collegeId,
      };
      if (isEdit) {
        bodyPayload.isActive = formData.isActive ?? formData.is_active ?? true;
      }
    } else if (activeTab === 'sessions') {
      const sessionCdVal = String(formData.session_cd || formData.code || '').trim();
      bodyPayload = {
        name: formData.name,
        session_cd: sessionCdVal,
        code: sessionCdVal,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isCurrent: Boolean(formData.isCurrent),
        collegeId: formData.collegeId,
      };
      if (isEdit) {
        bodyPayload.isActive = formData.isActive ?? formData.is_active ?? true;
      }
    } else if (activeTab === 'sections') {
      const selectedCourse = courses.find(c => c.id === formData.courseId || c.course_cd === formData.courseId || c.code === formData.courseId);
      const secCrsCd = selectedCourse?.course_cd || selectedCourse?.code || '';
      const selectedBatch =
        batches.find(b => b.id === formData.batchId) ||
        batches.find(b => (!secCrsCd || (b as any).course_cd === secCrsCd || b.course_code === secCrsCd) && (b.code === formData.batchId || b.batch_cd === formData.batchId || String(b.year) === String(formData.batchId))) ||
        batches.find(b => b.code === formData.batchId || b.batch_cd === formData.batchId || String(b.year) === String(formData.batchId));
      const selectedDept = formData.departmentId
        ? (branches.find(br => br.id === formData.departmentId) ||
           branches.find(br => (!secCrsCd || (br as any).course_cd === secCrsCd || br.course_code === secCrsCd) && (br.code === formData.departmentId || br.branch_cd === formData.departmentId || br.name === formData.departmentId)) ||
           branches.find(br => br.code === formData.departmentId || br.branch_cd === formData.departmentId || br.name === formData.departmentId))
        : undefined;
      const courseBranchesForSec = getBranchesForCollegeAndCourse(formData.collegeId || '', selectedCourse?.course_cd || selectedCourse?.id || formData.courseId, Boolean(selectedCourse));
      if (courseBranchesForSec.length > 0 && !selectedDept && !formData.departmentId) {
        alert('Please choose a Branch / Department for this Section so it links properly to Branch & Semester.');
        return;
      }

      bodyPayload = {
        code: String(formData.code || '1').trim(),
        name: formData.name?.trim() || `Section ${formData.code || '1'}`,
        collegeId: formData.collegeId,
        courseId: selectedCourse?.id || formData.courseId || null,
        departmentId: selectedDept?.id || formData.departmentId || null,
        batchId: selectedBatch?.id || formData.batchId || null,
        phaseId: formData.phaseId || null,
        semester: formData.semester || null,
        capacity: Number(formData.capacity) || 60,
        isDefault: Boolean(formData.isDefault),
      };
      if (isEdit) {
        bodyPayload.isActive = formData.isActive ?? formData.is_active ?? true;
      }
    } else if (activeTab === 'groups') {
      const selectedCourse = courses.find(c => c.id === formData.courseId || c.course_cd === formData.courseId || c.code === formData.courseId);
      const grpCrsCd = selectedCourse?.course_cd || selectedCourse?.code || '';
      const selectedBatch =
        batches.find(b => b.id === formData.batchId) ||
        batches.find(b => (!grpCrsCd || (b as any).course_cd === grpCrsCd || b.course_code === grpCrsCd) && (b.code === formData.batchId || b.batch_cd === formData.batchId || String(b.year) === String(formData.batchId))) ||
        batches.find(b => b.code === formData.batchId || b.batch_cd === formData.batchId || String(b.year) === String(formData.batchId));
      const selectedDept = formData.departmentId
        ? (branches.find(br => br.id === formData.departmentId) ||
           branches.find(br => (!grpCrsCd || (br as any).course_cd === grpCrsCd || br.course_code === grpCrsCd) && (br.code === formData.departmentId || br.branch_cd === formData.departmentId || br.name === formData.departmentId)) ||
           branches.find(br => br.code === formData.departmentId || br.branch_cd === formData.departmentId || br.name === formData.departmentId))
        : undefined;
      const courseBranchesForGrp = getBranchesForCollegeAndCourse(formData.collegeId || '', selectedCourse?.course_cd || selectedCourse?.id || formData.courseId, Boolean(selectedCourse));

      if (courseBranchesForGrp.length > 0 && !selectedDept && !formData.departmentId) {
        alert('Step 1: Please choose Branch / Department first.');
        return;
      }
      if (!selectedBatch && !formData.batchId) {
        alert('Step 2: Please select Batch.');
        return;
      }
      if (!formData.semester) {
        alert('Step 3: Please select Semester / Phase.');
        return;
      }
      if (!formData.sectionId) {
        alert('Step 4: Section is required. You cannot save a Student Group without selecting a linked Section from Section Master.');
        return;
      }

      const linkedNumOptions = buildNumericSectionOptions(formLinkedSections);
      const matchedLinkedSec =
        linkedNumOptions.find((x) => x.numVal === String(formData.sectionId) || String(x.sec.id) === String(formData.sectionId))?.sec ||
        formLinkedSections.find(
          (s) => String(s.code) === String(formData.sectionId) || String(s.id) === String(formData.sectionId),
        );

      bodyPayload = {
        code: formData.code || 'A',
        name: formData.name,
        collegeId: formData.collegeId,
        courseId: selectedCourse?.id || formData.courseId || null,
        batchId: selectedBatch?.id || formData.batchId || null,
        departmentId: selectedDept?.id || formData.departmentId || null,
        sectionId: matchedLinkedSec?.id || formData.sectionId,
        subjectId: formData.subjectId || null,
        groupType: formData.groupType || 'PRACTICAL',
        phaseId: formData.phaseId || null,
        semester: formData.semester || null,
        capacity: Number(formData.capacity) || 50,
        studentIds: formSelectedStudentIds,
        replaceMembers: isEdit,
      };
      if (isEdit) {
        bodyPayload.isActive = formData.isActive ?? formData.is_active ?? true;
      }
    } else if (activeTab === 'residencies') {
      bodyPayload = {
        collegeId: formData.collegeId,
        courseId: formData.courseId || null,
        residencyType: formData.residencyType || 'Hosteller',
        categoryName: formData.categoryName,
        blockWing: formData.blockWing || null,
        totalCapacity: Number(formData.totalCapacity) || 100,
        allocatedCount: Number(formData.allocatedCount) || 0,
        monthlyFee: Number(formData.monthlyFee) || 0,
      };
      if (isEdit) {
        bodyPayload.isActive = formData.isActive ?? formData.is_active ?? true;
      }
    }

    setIsSaving(true);
    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(bodyPayload),
      });
      if (res.ok) {
        const resJson = await res.clone().json().catch(() => null);
        console.log(`[CollegeMaster] Saved ${activeTab} to tenant_${slug} in PostgreSQL ✅`);
        const isUpdate = Boolean(editingItem);
        if (activeTab === 'sections') {
          setSyncMessage(`✅ ${isUpdate ? 'Updated' : 'Saved'} Section "${formData.name || formData.code}" (#${formData.code}) to PostgreSQL!`);
        } else if (activeTab === 'groups') {
          const enrolledCnt = resJson?.assignedCount ?? formSelectedStudentIds.length;
          setSyncMessage(
            `✅ ${isUpdate ? 'Updated' : 'Saved'} Student Group "${formData.name || formData.code}" to PostgreSQL (${enrolledCnt} student(s) allocated)!`
          );
        } else {
          setSyncMessage(`✅ Successfully ${isUpdate ? 'updated' : 'saved'} record in PostgreSQL!`);
        }
        setTimeout(() => setSyncMessage(''), 7000);
        setIsModalOpen(false);
        await fetchData(activeTab);
      } else {
        const errText = await res.text();
        console.error(`[CollegeMaster] Save ${activeTab} failed (${res.status}):`, errText);
        alert(`Save failed: ${errText}`);
      }
    } catch (err) {
      console.error('[CollegeMaster] Network error during save:', err);
      alert('Network error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  // Restore / Reactivate College
  const handleRestore = async (col: College) => {
    const slug = getActiveTenantSlug() || userTenantSlug || 'srms-cet-bareilly';
    const targetId = col.id || col.code || col.slug;
    try {
      // 1. Direct Next.js DB update
      await fetch('/api/srms/colleges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant: slug,
          tenantId: userTenantId,
          action: 'restore',
          id: targetId,
        }),
      });

      // 2. Also backend update
      const urlParams = new URLSearchParams({ tenant: slug });
      if (userTenantId) urlParams.set('tenantId', userTenantId);
      await fetch(`${API_BASE}/colleges/${col.id}/restore?${urlParams.toString()}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          ...(userTenantId ? { 'x-tenant-id': userTenantId } : {}),
          ...(slug ? { 'x-tenant-slug': slug } : {}),
        },
      }).catch(() => {});

      setColleges((prev) => prev.map((c) => (c.id === col.id || c.code === col.code || c.slug === col.slug ? { ...c, is_active: true } : c)));
    } catch (err) {
      console.error('[CollegeMaster] Restore college error:', err);
    }
  };

  // Delete / Deactivate Record
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this record?')) return;

    if (activeTab === 'colleges') {
      const slug = getActiveTenantSlug() || userTenantSlug || 'srms-cet-bareilly';
      try {
        // 1. Direct Next.js DB update
        await fetch('/api/srms/colleges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant: slug,
            tenantId: userTenantId,
            action: 'deactivate',
            id,
          }),
        });

        // 2. Also backend update
        const urlParams = new URLSearchParams({ tenant: slug });
        if (userTenantId) urlParams.set('tenantId', userTenantId);
        await fetch(`${API_BASE}/colleges/${id}?${urlParams.toString()}`, {
          method: 'DELETE',
          headers: {
            ...getAuthHeaders(),
            ...(userTenantId ? { 'x-tenant-id': userTenantId } : {}),
            ...(slug ? { 'x-tenant-slug': slug } : {}),
          },
        }).catch(() => {});
      } catch (err) {
        console.error('[CollegeMaster] Delete college error:', err);
      }
      setColleges((prev) => prev.map((c) => (c.id === id || c.code === id || c.slug === id ? { ...c, is_active: false } : c)));
      return;
    }

    // Tenant-scoped: use the slug of the college owning this record
    const slug = getActiveTenantSlug();
    const token = localStorage.getItem('token') || '';
    const endpointMap: Record<string, string> = {
      colleges: 'colleges',
      courses: 'courses',
      professionals: 'professionals',
      batches: 'batches',
      branches: 'branches',
      sections: 'sections',
      groups: 'groups',
      sessions: 'sessions',
      residencies: 'residencies',
    };
    const endpoint = endpointMap[activeTab] || activeTab;

    try {
      const res = await fetch(`${API_BASE}/${endpoint}/${id}?tenant=${slug}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        console.log(`[CollegeMaster] Deleted ${activeTab} ${id} successfully ✅`);
        await fetchData(activeTab);
      } else {
        const errText = await res.text();
        console.error(`[CollegeMaster] Delete ${activeTab} failed (${res.status}):`, errText);
        alert(`Delete failed: ${errText}`);
      }
    } catch (err) {
      console.warn('[CollegeMaster] API error during delete:', err);
    }

    if (activeTab === 'courses') {
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } else if (activeTab === 'professionals') {
      setProfessionals((prev) => prev.filter((p) => p.id !== id));
    } else if (activeTab === 'batches') {
      setBatches((prev) => prev.filter((b) => b.id !== id));
    } else if (activeTab === 'branches') {
      setBranches((prev) => prev.filter((b) => b.id !== id));
    } else if (activeTab === 'sections') {
      setSections((prev) => prev.filter((s) => s.id !== id));
    } else if (activeTab === 'groups') {
      setGroups((prev) => prev.filter((g) => g.id !== id));
    } else if (activeTab === 'sessions') {
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } else if (activeTab === 'residencies') {
      setResidencies((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // Helper filter by selected college filter (handles ID, Code, Slug seamlessly)
  const isMatchCollege = (itemCollegeId?: string, itemCollegeCode?: string, itemCollegeSlug?: string) => {
    if (!selectedCollegeFilter || selectedCollegeFilter === 'all') return true;

    // Resolve the target filter college object from state if available
    const selectedCol = colleges.find(
      (c) => c.id === selectedCollegeFilter || c.code === selectedCollegeFilter || c.slug === selectedCollegeFilter
    );

    const filterId = selectedCol?.id || selectedCollegeFilter;
    const filterCode = selectedCol?.code || (selectedCollegeFilter.length <= 4 ? selectedCollegeFilter : undefined);
    const filterSlug = selectedCol?.slug;

    // 1. Exact match against filter ID
    if (filterId && itemCollegeId === filterId) return true;

    // 2. Match against college code (e.g. '1', '2', etc.)
    if (filterCode && (itemCollegeCode === filterCode || itemCollegeId === filterCode)) return true;

    // 3. Match against college slug (e.g. 'srms-cet-bareilly')
    if (filterSlug && (itemCollegeSlug === filterSlug || itemCollegeId === filterSlug)) return true;

    // 4. Fallback direct equality against selectedCollegeFilter
    if (
      itemCollegeId === selectedCollegeFilter ||
      itemCollegeCode === selectedCollegeFilter ||
      itemCollegeSlug === selectedCollegeFilter
    ) {
      return true;
    }

    // 5. If item has a foreign college ID, look up its code in colleges array and compare to filterCode
    if (itemCollegeId && (filterCode || filterSlug)) {
      const parentCol = colleges.find((c) => c.id === itemCollegeId);
      if (parentCol && ((filterCode && parentCol.code === filterCode) || (filterSlug && parentCol.slug === filterSlug))) {
        return true;
      }
    }

    // 6. Match when userTenantId equals itemCollegeId and filter matches user's active tenant
    if (itemCollegeId && userTenantId && itemCollegeId === userTenantId) {
      if (!filterSlug || filterSlug === userTenantSlug) return true;
    }

    return false;
  };

  const isMatchCourse = (item: { course_id?: string; course_code?: string; batch_course_cd?: string; course_name?: string }) => {
    if (!selectedCourseFilter || selectedCourseFilter === 'all') return true;
    const crs = courses.find(
      (c) => c.id === selectedCourseFilter || c.course_cd === selectedCourseFilter || c.code === selectedCourseFilter
    );
    const fId = crs?.id || selectedCourseFilter;
    const fCd = crs?.course_cd || crs?.code || selectedCourseFilter;
    const fName = (crs?.name || '').toLowerCase().trim();
    return Boolean(
      (item.course_id && (item.course_id === fId || item.course_id === fCd)) ||
      (item.course_code && String(item.course_code) === String(fCd)) ||
      (item.batch_course_cd && String(item.batch_course_cd) === String(fCd)) ||
      (fName && item.course_name && item.course_name.toLowerCase().trim() === fName)
    );
  };

  const isMatchBranch = (item: { department_id?: string; department_code?: string; department_name?: string }) => {
    if (!selectedBranchFilter || selectedBranchFilter === 'all') return true;
    const br = branches.find(
      (b) => b.id === selectedBranchFilter || b.branch_cd === selectedBranchFilter || b.code === selectedBranchFilter
    );
    const fId = br?.id || selectedBranchFilter;
    const fCd = br?.branch_cd || br?.code || selectedBranchFilter;
    const fName = (br?.name || br?.branch_name || '').toLowerCase().trim();
    return Boolean(
      (item.department_id && (item.department_id === fId || item.department_id === fCd)) ||
      (item.department_code && (String(item.department_code) === String(fCd) || String(item.department_code) === String(br?.code || ''))) ||
      (fName && item.department_name && item.department_name.toLowerCase().trim() === fName)
    );
  };

  const matchesSectionFilters = (sec: Section) =>
    isActiveCollegeRecord(sec.college_id, sec.college_code, sec.college_slug) &&
    isMatchCollege(sec.college_id, sec.college_code, sec.college_slug) &&
    isMatchCourse(sec) &&
    isMatchBranch(sec);

  const matchesGroupFilters = (g: Group) =>
    isActiveCollegeRecord(g.college_id, (g as any).college_code, (g as any).college_slug) &&
    isMatchCollege(g.college_id, (g as any).college_code, (g as any).college_slug) &&
    isMatchCourse(g as any) &&
    isMatchBranch(g as any);

  const { isAllowed } = useRolePermissions();

  // Sub-Category Definition Tabs
  const allCategories = [
    { key: 'colleges', label: '1. College', icon: '🏢', count: colleges.length, permissionKey: 'admin_college_master_colleges' },
    { key: 'courses', label: '2. Courses', icon: '🎓', count: courses.filter((c) => isMatchCollege(c.college_id, c.college_code, c.college_slug)).length, permissionKey: 'admin_college_master_courses' },
    { key: 'professionals', label: '3. Academic Year', icon: '📅', count: professionals.filter((p) => isMatchCollege(p.college_id, p.college_code, p.college_slug)).length, permissionKey: 'admin_college_master_professionals' },
    { key: 'batches', label: '4. Batch', icon: '📅', count: batches.filter((b) => isMatchCollege(b.college_id, b.college_code, b.college_slug)).length, permissionKey: 'admin_college_master_batches' },
    { key: 'branches', label: '5. Departments & Specialties', icon: '🩺', count: branches.filter((br) => isMatchCollege(br.college_id, br.college_code, br.college_slug)).length, permissionKey: 'admin_college_master_branches' },
    { key: 'sections', label: '6. Section Master', icon: '🏫', count: sections.filter(matchesSectionFilters).length, permissionKey: 'admin_college_master_sections' },
    { key: 'groups', label: '7. Student Group Master', icon: '👥', count: groups.filter(matchesGroupFilters).length, permissionKey: 'admin_college_master_groups' },
    { key: 'sessions', label: '8. Session', icon: '⏱️', count: sessions.filter((s) => isMatchCollege(s.college_id, (s as any).college_code, (s as any).college_slug)).length, permissionKey: 'admin_college_master_sessions' },
    { key: 'residencies', label: '9. Residency Category', icon: '🏥', count: residencies.filter((r) => isMatchCollege(r.college_id, (r as any).college_code, (r as any).college_slug)).length, permissionKey: 'admin_college_master_residencies' },
  ];

  const categories = allCategories.filter(
    (cat) =>
      isAllowed(cat.permissionKey, 'admin_college_master') ||
      (cat.key === 'sections' && isAllowed('admin_college_master_groups', 'admin_college_master'))
  );

  // Automatically select the first allowed tab if current activeTab is disallowed
  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.key === activeTab)) {
      setActiveTab(categories[0].key as SubCategory);
    }
  }, [categories, activeTab]);

  // Currently selected course object inside Form for dynamic rendering
  const formSelectedCourse = courses.find((c) => c.id === formData.courseId) || getCoursesForCollege(formData.collegeId || colleges[0]?.id)[0];
  const isSelectedCourseSemesterSystem = formSelectedCourse?.academic_system === 'semester';

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#0F172A] text-slate-800 dark:text-slate-900 dark:text-slate-100 font-sans transition-colors">
      <Sidebar role="admin" />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Campus Setup & Academic Hierarchy" />

        <main className="p-6 space-y-6 flex-1">
          {/* 8 Category Tabs — Dynamic Permission Filtered */}
          {categories.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-[#111827] rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-500">🔒 Access to College Master tabs is currently restricted for your role. Contact Platform SuperAdmin.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => {
                    setActiveTab(cat.key as SubCategory);
                    setSearchTerm('');
                    if (cat.key !== 'sections' && cat.key !== 'groups') {
                      setSelectedCourseFilter('all');
                      setSelectedBranchFilter('all');
                    }
                  }}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-between gap-1.5 text-center sm:text-left cursor-pointer ${activeTab === cat.key
                    ? 'bg-[#F36C21] text-white shadow-md shadow-orange-500/25 ring-2 ring-orange-400/40'
                    : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 hover:text-[#11141A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm'
                    }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-sm shrink-0">{cat.icon}</span>
                    <span className={`truncate text-[11px] font-bold ${activeTab === cat.key ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>{cat.label}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${activeTab === cat.key ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-[#F36C21] dark:text-[#F36C21] border border-[#F36C21]/20'
                    }`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Dynamic Cascading Dropdown: 3-Level Batch on Tab 4, 3-Level Dept on Tab 5, 2-Level on other tabs */}
          {activeTab === 'batches' ? (
            <LiveCollegeCourseBatchCascadingDropdown
              selectedCollegeCode={colleges.find(c => c.id === selectedCollegeFilter)?.code || userColgCd || ''}
              onCollegeSelect={async (colg) => {
                if (colg) {
                  const matched = colleges.find((c) => c.code === colg.colg_cd);
                  if (matched && matched.id !== selectedCollegeFilter) {
                    setSelectedCollegeFilter(matched.id);
                    await syncBatchesForCollege(matched, true);
                  }
                } else if (selectedCollegeFilter !== 'all') {
                  setSelectedCollegeFilter('all');
                }
              }}
            />
          ) : activeTab === 'branches' ? (
            <Live3LevelDepartmentCascadingDropdown
              selectedCollegeCode={colleges.find(c => c.id === selectedCollegeFilter)?.code || userColgCd || ''}
              onCollegeSelect={async (colg) => {
                if (colg) {
                  const matched = colleges.find((c) => c.code === colg.colg_cd);
                  if (matched) {
                    if (matched.id !== selectedCollegeFilter) {
                      setSelectedCollegeFilter(matched.id);
                    }
                    await syncBranchesForCollege(matched, true);
                  }
                } else if (selectedCollegeFilter !== 'all') {
                  setSelectedCollegeFilter('all');
                }
              }}
            />
          ) : (
            <LiveCollegeCourseCascadingDropdown
              selectedCollegeCode={colleges.find(c => c.id === selectedCollegeFilter)?.code || (selectedCollegeFilter !== 'all' ? selectedCollegeFilter : '') || userColgCd || ''}
              onCollegeSelect={async (colg) => {
                if (colg) {
                  const pool = (activeTab === 'sections' || activeTab === 'groups')
                    ? (activeColleges.length > 0 ? activeColleges : colleges)
                    : colleges;
                  const matched = pool.find((c) => c.code === colg.colg_cd || c.id === colg.colg_cd || c.slug === colg.colg_cd);
                  if (matched) {
                    if (matched.id !== selectedCollegeFilter) {
                      setSelectedCollegeFilter(matched.id);
                      setSelectedCourseFilter('all');
                      setSelectedBranchFilter('all');
                    }
                    if (activeTab === 'courses') {
                      await syncCoursesForCollege(matched, true);
                    }
                  }
                } else if (selectedCollegeFilter !== 'all') {
                  setSelectedCollegeFilter('all');
                  setSelectedCourseFilter('all');
                  setSelectedBranchFilter('all');
                }
              }}
              onCourseSelect={(crs) => {
                if ((activeTab === 'sections' || activeTab === 'groups') && crs) {
                  const matchedCourse = courses.find(
                    (c) =>
                      String(c.course_cd || c.code || '') === String(crs.course_cd || '') ||
                      (crs.course_name && c.name && c.name.toLowerCase().trim() === crs.course_name.toLowerCase().trim())
                  );
                  if (matchedCourse) {
                    const val = matchedCourse.id || matchedCourse.course_cd || matchedCourse.code || '';
                    if (val && val !== selectedCourseFilter) {
                      setSelectedCourseFilter(val);
                      setSelectedBranchFilter('all');
                    }
                  }
                }
              }}
            />
          )}

          {/* Top Controls: Filter by College, Course, Branch & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* College Filter Selector */}
              {(() => {
                const isSectionOrGroup = activeTab === 'sections' || activeTab === 'groups';
                const dropdownColleges = isSectionOrGroup
                  ? (activeColleges.length > 0 ? activeColleges : colleges)
                  : colleges;
                const toolbarCoursesRaw = selectedCollegeFilter !== 'all'
                  ? getCoursesForCollege(selectedCollegeFilter)
                  : courses.filter((c) => !isSectionOrGroup || isActiveCollegeRecord(c.college_id, c.college_code, c.college_slug));
                const toolbarCourses = toolbarCoursesRaw.filter((c, idx, arr) => {
                  const k = c.id || c.course_cd || c.code || '';
                  return k && arr.findIndex((x) => (x.id || x.course_cd || x.code || '') === k) === idx;
                });
                const toolbarBranchesRaw = getBranchesForCollegeAndCourse(
                  selectedCollegeFilter !== 'all' ? selectedCollegeFilter : '',
                  selectedCourseFilter !== 'all' ? selectedCourseFilter : '',
                  selectedCourseFilter !== 'all'
                ).filter((b) => !isSectionOrGroup || isActiveCollegeRecord(b.college_id, b.college_code, b.college_slug));
                const toolbarBranches = toolbarBranchesRaw.filter((b, idx, arr) => {
                  const k = b.id || b.branch_cd || b.code || '';
                  return k && arr.findIndex((x) => (x.id || x.branch_cd || x.code || '') === k) === idx;
                });

                return (
                  <>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs shadow-sm shrink-0">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                        <span>🏛️</span> College:
                      </span>
                      <select
                        value={selectedCollegeFilter}
                        onChange={(e) => handleCollegeFilterSelect(e.target.value)}
                        className="bg-transparent text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer max-w-[220px]"
                      >
                        <option value="all">
                          {isSectionOrGroup
                            ? `All Active Campuses (${dropdownColleges.length})`
                            : `All Campuses (${dropdownColleges.length})`}
                        </option>
                        {dropdownColleges.map((col) => (
                          <option key={col.id} value={col.id}>
                            {col.code ? `[#${col.code}] ` : ''}{col.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {isSectionOrGroup && (
                      <>
                        {/* Course-Wise Filter */}
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/70 rounded-lg px-3 py-2 text-xs shadow-sm shrink-0">
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                            <span>🎓</span> Course:
                          </span>
                          <select
                            value={selectedCourseFilter}
                            onChange={(e) => {
                              setSelectedCourseFilter(e.target.value);
                              setSelectedBranchFilter('all');
                            }}
                            className="bg-transparent text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer max-w-[200px]"
                          >
                            <option value="all">All Courses ({toolbarCourses.length})</option>
                            {toolbarCourses.map((crs) => {
                              const val = crs.id || crs.course_cd || crs.code || '';
                              return (
                                <option key={val} value={val}>
                                  {crs.code || crs.course_cd ? `[${crs.code || crs.course_cd}] ` : ''}{crs.name}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Branch-Wise Filter */}
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs shadow-sm shrink-0">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                            <span>🏢</span> Branch:
                          </span>
                          <select
                            value={selectedBranchFilter}
                            onChange={(e) => setSelectedBranchFilter(e.target.value)}
                            className="bg-transparent text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer max-w-[210px]"
                          >
                            <option value="all">All Branches ({toolbarBranches.length})</option>
                            {toolbarBranches.map((br) => {
                              const val = br.id || br.branch_cd || br.code || '';
                              return (
                                <option key={val} value={val}>
                                  {br.code || br.branch_cd ? `[${br.code || br.branch_cd}] ` : ''}{br.name || br.branch_name}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {(selectedCourseFilter !== 'all' || selectedBranchFilter !== 'all') && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCourseFilter('all');
                              setSelectedBranchFilter('all');
                            }}
                            className="px-2.5 py-2 rounded-lg text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shrink-0"
                            title="Clear Course & Branch filters"
                          >
                            ✕ Clear Filters
                          </button>
                        )}
                      </>
                    )}
                  </>
                );
              })()}

              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder={`Search in ${categories.find((c) => c.key === activeTab)?.label}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 text-xs bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 shadow-sm"
                />
                <svg className="w-4 h-4 absolute right-3 top-2.5 text-slate-600 dark:text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Add New Button */}
              <button
                onClick={handleAddNew}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add New {categories.find((c) => c.key === activeTab)?.label.split('. ')[1]}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === 'colleges' && (userTenantSlug || getActiveTenantSlug() || '').toLowerCase().includes('srms') && (
                <button
                  onClick={syncFromExternalApi}
                  disabled={syncing}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-lg shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 shrink-0"
                  title="Fetch & Sync latest 14 colleges from SRMS Portal API"
                >
                  <span className={syncing ? 'animate-spin' : ''}>🌐</span>
                  <span>{syncing ? 'Syncing Colleges...' : 'Sync SRMS Portal'}</span>
                </button>
              )}

              {activeTab === 'courses' && (
                <button
                  onClick={() => {
                    if (selectedCollegeFilter !== 'all') {
                      const col = colleges.find(c => c.id === selectedCollegeFilter || c.code === selectedCollegeFilter || c.slug === selectedCollegeFilter);
                      if (col) syncCoursesForCollege(col, true);
                    } else {
                      syncCoursesFromExternalApi();
                    }
                  }}
                  disabled={syncing}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-lg shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 shrink-0"
                  title="Sequentially fetch & sync courses for selected or all colleges from SRMS GetCourse API"
                >
                  <span className={syncing ? 'animate-spin' : ''}>⚡</span>
                  <span>
                    {syncing
                      ? 'Syncing Courses...'
                      : selectedCollegeFilter !== 'all'
                        ? `Sync ${colleges.find(c => c.id === selectedCollegeFilter || c.code === selectedCollegeFilter || c.slug === selectedCollegeFilter)?.code ? '#' + colleges.find(c => c.id === selectedCollegeFilter || c.code === selectedCollegeFilter || c.slug === selectedCollegeFilter)?.code : ''} Courses`
                        : 'Sync All from GetCourse'}
                  </span>
                </button>
              )}

              {activeTab === 'batches' && (
                <button
                  onClick={() => {
                    if (selectedCollegeFilter !== 'all') {
                      const col = colleges.find(c => c.id === selectedCollegeFilter);
                      if (col) syncBatchesForCollege(col, true);
                    } else {
                      syncBatchesFromExternalApi();
                    }
                  }}
                  disabled={syncing}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-lg shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 shrink-0"
                  title="Sequentially fetch & sync batches for selected or all colleges from SRMS OnlineAttend GetBatch API to PostgreSQL"
                >
                  <span className={syncing ? 'animate-spin' : ''}>📅</span>
                  <span>
                    {syncing
                      ? 'Syncing Batches...'
                      : selectedCollegeFilter !== 'all'
                        ? `Sync ${colleges.find(c => c.id === selectedCollegeFilter)?.code ? '#' + colleges.find(c => c.id === selectedCollegeFilter)?.code : ''} Batches`
                        : 'Sync All from GetBatch'}
                  </span>
                </button>
              )}

              {activeTab === 'branches' && (
                <button
                  onClick={() => {
                    if (selectedCollegeFilter !== 'all') {
                      const col = colleges.find(c => c.id === selectedCollegeFilter);
                      if (col) syncBranchesForCollege(col, true);
                    } else {
                      syncBranchesFromExternalApi();
                    }
                  }}
                  disabled={syncing}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-lg shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 shrink-0"
                  title="Sequentially fetch & sync branches/departments for selected or all colleges from SRMS GetBranch API to PostgreSQL"
                >
                  <span className={syncing ? 'animate-spin' : ''}>🌿</span>
                  <span>
                    {syncing
                      ? 'Syncing Branches...'
                      : selectedCollegeFilter !== 'all'
                        ? `Sync ${colleges.find(c => c.id === selectedCollegeFilter)?.code ? '#' + colleges.find(c => c.id === selectedCollegeFilter)?.code : ''} Branches`
                        : 'Sync All from GetBranch'}
                  </span>
                </button>
              )}

              {activeTab === 'sessions' && (
                <button
                  onClick={syncSessionsFromExternalApi}
                  disabled={syncing}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 rounded-lg shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 shrink-0"
                  title="Fetch & sync official academic sessions from SRMS FeeAdmin/GetSession API to PostgreSQL"
                >
                  <span className={syncing ? 'animate-spin' : ''}>🗓️</span>
                  <span>{syncing ? 'Syncing Sessions...' : 'Sync All from GetSession'}</span>
                </button>
              )}

              <button
                onClick={() => fetchData(activeTab)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-200/80 dark:bg-slate-800/80 rounded-lg border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 shadow-sm shrink-0"
              >
                <span>🔄</span> Refresh
              </button>
            </div>
          </div>

          {syncMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
              <span>{syncMessage}</span>
              <button onClick={() => setSyncMessage('')} className="text-emerald-500 hover:text-emerald-700">✕</button>
            </div>
          )}

          {/* Master DataTable */}
          <div className="glass-card overflow-hidden">
            {loading ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    {activeTab === 'colleges' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Code</th>
                        <th className="p-4 whitespace-nowrap">College / Institution Name</th>
                        <th className="p-4 whitespace-nowrap">Slug Code</th>
                        <th className="p-4 whitespace-nowrap">Domain</th>
                        <th className="p-4 whitespace-nowrap">Plan & Theme</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'courses' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Course Code</th>
                        <th className="p-4 whitespace-nowrap">Course Master Title</th>
                        <th className="p-4 whitespace-nowrap">Degree Level</th>
                        <th className="p-4 whitespace-nowrap">Academic System Type</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'professionals' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Mapped Course</th>
                        <th className="p-4 whitespace-nowrap">Mapped Branch</th>
                        <th className="p-4 whitespace-nowrap">Academic Year</th>
                        <th className="p-4 whitespace-nowrap">Semester / Phase</th>
                        <th className="p-4 whitespace-nowrap">Duration</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'batches' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Mapped Course</th>
                        <th className="p-4 whitespace-nowrap">Batch Code</th>
                        <th className="p-4 whitespace-nowrap">Admission Year</th>
                        <th className="p-4 whitespace-nowrap">Duration Dates</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'branches' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Mapped Course</th>
                        <th className="p-4 whitespace-nowrap">Branch Code</th>
                        <th className="p-4 whitespace-nowrap">Department / Specialty Name</th>
                        <th className="p-4 whitespace-nowrap">Specialty Type</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'sections' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Mapped Course</th>
                        <th className="p-4 whitespace-nowrap">Branch / Department</th>
                        <th className="p-4 whitespace-nowrap">Assigned Batch</th>
                        <th className="p-4 whitespace-nowrap">Semester / Phase</th>
                        <th className="p-4 whitespace-nowrap">Section Code</th>
                        <th className="p-4 whitespace-nowrap">Section Name</th>
                        <th className="p-4 whitespace-nowrap">Capacity &amp; Groups</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'groups' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Mapped Course</th>
                        <th className="p-4 whitespace-nowrap">Group Code</th>
                        <th className="p-4 whitespace-nowrap">Group Title / Name</th>
                        <th className="p-4 whitespace-nowrap">Linked Section</th>
                        <th className="p-4 whitespace-nowrap">Type / Stream</th>
                        <th className="p-4 whitespace-nowrap">Linked Subject</th>
                        <th className="p-4 whitespace-nowrap">Assigned Batch</th>
                        <th className="p-4 whitespace-nowrap">Branch / Department</th>
                        <th className="p-4 whitespace-nowrap">Enrolled / Capacity</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[200px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'sessions' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Session Title</th>
                        <th className="p-4 whitespace-nowrap">Start Date</th>
                        <th className="p-4 whitespace-nowrap">End Date</th>
                        <th className="p-4 whitespace-nowrap">Current Session</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'residencies' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Mapped Course</th>
                        <th className="p-4 whitespace-nowrap">Residency Type</th>
                        <th className="p-4 whitespace-nowrap">Hostel Block / Category Title</th>
                        <th className="p-4 whitespace-nowrap">Block / Wing Info</th>
                        <th className="p-4 whitespace-nowrap">Occupancy / Capacity</th>
                        <th className="p-4 whitespace-nowrap">Monthly Fee</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                  </thead>
                  <TableSkeleton colCount={
                    activeTab === 'groups' ? 12 :
                      activeTab === 'sections' ? 10 :
                        activeTab === 'residencies' ? 9 :
                          activeTab === 'professionals' || activeTab === 'batches' || activeTab === 'branches' || activeTab === 'courses' || activeTab === 'sessions' ? 7 :
                            6
                  } />
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-700 dark:text-slate-300 border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    {activeTab === 'colleges' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Code</th>
                        <th className="p-4 whitespace-nowrap">College / Institution Name</th>
                        <th className="p-4 whitespace-nowrap">Slug Code</th>
                        <th className="p-4 whitespace-nowrap">Domain</th>
                        <th className="p-4 whitespace-nowrap">Plan & Theme</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'courses' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Course Code</th>
                        <th className="p-4 whitespace-nowrap">Course Master Title</th>
                        <th className="p-4 whitespace-nowrap">Degree Level</th>
                        <th className="p-4 whitespace-nowrap">Academic System Type</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'professionals' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Mapped Course</th>
                        <th className="p-4 whitespace-nowrap">Mapped Branch</th>
                        <th className="p-4 whitespace-nowrap">Academic Year</th>
                        <th className="p-4 whitespace-nowrap">Included Semesters / Phases</th>
                        <th className="p-4 whitespace-nowrap">Duration</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'batches' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Mapped Course</th>
                        <th className="p-4 whitespace-nowrap">Batch Code</th>
                        <th className="p-4 whitespace-nowrap">Admission Year</th>
                        <th className="p-4 whitespace-nowrap">Duration Dates</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'branches' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Mapped Course</th>
                        <th className="p-4 whitespace-nowrap">Branch Code</th>
                        <th className="p-4 whitespace-nowrap">Department / Specialty Name</th>
                        <th className="p-4 whitespace-nowrap">Specialty Type</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'sections' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Mapped Course</th>
                        <th className="p-4 whitespace-nowrap">Branch / Department</th>
                        <th className="p-4 whitespace-nowrap">Assigned Batch</th>
                        <th className="p-4 whitespace-nowrap">Semester / Phase</th>
                        <th className="p-4 whitespace-nowrap">Section Code</th>
                        <th className="p-4 whitespace-nowrap">Section Name</th>
                        <th className="p-4 whitespace-nowrap">Capacity &amp; Groups</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'groups' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Mapped Course</th>
                        <th className="p-4 whitespace-nowrap">Group Code</th>
                        <th className="p-4 whitespace-nowrap">Group Title / Name</th>
                        <th className="p-4 whitespace-nowrap">Linked Section</th>
                        <th className="p-4 whitespace-nowrap">Type / Stream</th>
                        <th className="p-4 whitespace-nowrap">Linked Subject</th>
                        <th className="p-4 whitespace-nowrap">Assigned Batch</th>
                        <th className="p-4 whitespace-nowrap">Branch / Department</th>
                        <th className="p-4 whitespace-nowrap">Enrolled / Capacity</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[200px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'sessions' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Session Code</th>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Session Title</th>
                        <th className="p-4 whitespace-nowrap">Start Date</th>
                        <th className="p-4 whitespace-nowrap">End Date</th>
                        <th className="p-4 whitespace-nowrap">Current Session</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                    {activeTab === 'residencies' && (
                      <tr>
                        <th className="p-4 whitespace-nowrap">Mapped College</th>
                        <th className="p-4 whitespace-nowrap">Mapped Course</th>
                        <th className="p-4 whitespace-nowrap">Residency Type</th>
                        <th className="p-4 whitespace-nowrap">Hostel Block / Category Title</th>
                        <th className="p-4 whitespace-nowrap">Block / Wing Info</th>
                        <th className="p-4 whitespace-nowrap">Occupancy / Capacity</th>
                        <th className="p-4 whitespace-nowrap">Monthly Fee</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                      </tr>
                    )}
                  </thead>

                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {/* 1. COLLEGES */}
                    {activeTab === 'colleges' &&
                      colleges
                        .filter((c) =>
                          (c.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                          (c.slug || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                          (c.code ? String(c.code).toLowerCase().includes((searchTerm || '').toLowerCase()) : false)
                        )
                        .map((col) => (
                          <tr key={col.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-extrabold text-xs border border-indigo-500/20">
                                #{col.code || '—'}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-slate-900 dark:text-white">
                              <div className="flex items-center gap-2.5">
                                <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-black/10" style={{ backgroundColor: col.primary_color || '#6366F1' }} />
                                <span>{col.name}</span>
                                {col.slug === 'srms-ims' && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    Primary IMS
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 font-mono text-indigo-600 dark:text-indigo-400 font-semibold whitespace-nowrap">{col.slug}</td>
                            <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{col.domain || 'N/A'}</td>
                            <td className="p-4 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase text-[10px]">
                                {col.plan || 'Enterprise'}
                              </span>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${col.is_active ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                                {col.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-4 text-right whitespace-nowrap min-w-[140px]">
                              {!col.is_active ? (
                                <button
                                  type="button"
                                  onClick={() => handleRestore(col)}
                                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all inline-flex items-center gap-1.5 shadow-sm"
                                  title="Restore / Reactivate College"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Restore
                                </button>
                              ) : (
                                <ActionButtons onEdit={() => handleEdit(col)} onDelete={() => handleDelete(col.id)} />
                              )}
                            </td>
                          </tr>
                        ))}

                    {/* 2. COURSES */}
                    {activeTab === 'courses' &&
                      courses
                        .filter((c) => isMatchCollege(c.college_id, c.college_code || (c as any).colg_cd || (c as any).code, c.college_slug))
                        .filter((c) =>
                          (c.name || (c as any).course_name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                          (c.code || (c as any).course_cd || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                          (c.college_name || '').toLowerCase().includes((searchTerm || '').toLowerCase())
                        )
                        .map((crs) => {
                          const col = colleges.find((c) => c.id === crs.college_id || c.code === crs.college_code || c.slug === crs.college_slug);
                          const colName = col?.name || crs.college_name || 'SRMS Institution';
                          const colCode = col?.code || crs.college_code || '';
                          const isProf = crs.academic_system === 'professional';

                          return (
                            <tr key={crs.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  {colCode && (
                                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[10px] border border-indigo-500/20">
                                      #{colCode}
                                    </span>
                                  )}
                                  <span className="font-semibold text-slate-900 dark:text-white">{colName}</span>
                                </div>
                              </td>
                              <td className="p-4 font-bold font-mono text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                                <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                                  #{crs.course_cd || crs.code}
                                </span>
                              </td>
                              <td className="p-4 font-bold text-slate-900 dark:text-white">
                                <div className="flex items-center gap-2">
                                  <span>{crs.name}</span>
                                  {crs.code === 'MBBS' && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                      NMC Medical
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs uppercase">
                                  {crs.degree_level || 'UG'}
                                </span>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                {isProf ? (
                                  <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/25 font-bold text-[11px] flex items-center gap-1.5 w-fit">
                                    <span>🩺</span> Professional Phase ({crs.duration_years || 5.5} Yrs)
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/25 font-bold text-[11px] flex items-center gap-1.5 w-fit">
                                    <span>📚</span> Semester System ({crs.duration_years || 4} Yrs)
                                  </span>
                                )}
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${crs.is_active ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                                  {crs.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="p-4 text-right whitespace-nowrap min-w-[140px]">
                                <ActionButtons onEdit={() => handleEdit(crs)} onDelete={() => handleDelete(crs.id)} />
                              </td>
                            </tr>
                          );
                        })}

                    {/* 3. ACADEMIC YEAR (GROUPED ENTERPRISE VIEW) */}
                    {activeTab === 'professionals' &&
                      getGroupedAcademicYears(
                        professionals
                          .filter((p) => isMatchCollege(p.college_id, p.college_code, p.college_slug))
                          .filter((p) =>
                            (p.phase_name || (p as any).name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                            (p.course_code || (p as any).course_cd || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                            ((p as any).branch_name || '').toLowerCase().includes((searchTerm || '').toLowerCase())
                          )
                      ).map((grp) => (
                        <tr key={grp.groupKey} className="hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors group">
                          <td className="p-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>🏛️</span>
                              <span className="font-semibold">{colleges.find((c) => c.id === grp.college_id || c.code === grp.college_code || c.slug === grp.college_slug)?.name || grp.college_name}</span>
                            </div>
                          </td>
                          <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 font-bold text-[11px] inline-flex items-center gap-1.5">
                              🎓 {grp.course_name || grp.course_code}
                            </span>
                          </td>
                          <td className="p-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20 font-bold text-[11px] inline-flex items-center gap-1.5">
                              🏢 {grp.branch_name}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                            <span className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-extrabold inline-flex items-center gap-1.5 shadow-xs">
                              <span>📅</span> {grp.academic_year_name}
                            </span>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              {grp.semesters.map((sem) => (
                                <span
                                  key={sem.id}
                                  className="px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/25 font-bold text-[11px] inline-flex items-center gap-1.5 transition-all shadow-2xs"
                                  title={`Phase Order: #${sem.phase_order}`}
                                >
                                  <span>📚</span>
                                  <span>{sem.name}</span>
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {grp.duration_years || 1} Year
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${grp.is_active ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                              {grp.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4 text-right whitespace-nowrap min-w-[140px]">
                            <ActionButtons
                              onEdit={() => {
                                const firstSem = grp.semesters[0];
                                const fullPf = professionals.find((p) => p.id === firstSem?.id) || {
                                  id: firstSem?.id,
                                  college_id: grp.college_id,
                                  course_id: grp.course_id,
                                  branch_id: grp.branch_id,
                                  branch_cd: grp.branch_cd,
                                  branch_name: grp.branch_name,
                                  academic_year: grp.academic_year,
                                  phase_order: firstSem?.phase_order,
                                  phase_name: firstSem?.name,
                                  academic_system: grp.academic_system,
                                  duration_years: grp.duration_years,
                                  is_active: grp.is_active,
                                };
                                handleEdit(fullPf);
                              }}
                              onDelete={async () => {
                                if (confirm(`Are you sure you want to delete ${grp.academic_year_name} (${grp.semesters.map((s) => s.name).join(', ')}) for ${grp.course_name} — ${grp.branch_name}?`)) {
                                  for (const sem of grp.semesters) {
                                    await handleDelete(sem.id);
                                  }
                                }
                              }}
                            />
                          </td>
                        </tr>
                      ))}

                    {/* 4. BATCHES */}
                    {activeTab === 'batches' &&
                      batches
                        .filter((b) => isMatchCollege(b.college_id, b.college_code, b.college_slug))
                        .filter((b) =>
                          (b.code || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                          (b.course_code || (b as any).course_cd || (b as any).course_name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                          String(b.year || '').includes(searchTerm || '')
                        )
                        .map((bth) => (
                          <tr key={bth.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-4 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span>🏛️</span>
                                <span>{colleges.find((c) => c.id === bth.college_id)?.name || bth.college_name || 'SRMS Institution'}</span>
                              </div>
                            </td>
                            <td className="p-4 text-purple-600 dark:text-purple-300 font-bold font-mono whitespace-nowrap">
                              {(bth as any).course_name || bth.course_code || (bth as any).course_cd ? (
                                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-bold text-[10px]">
                                  🎓 {(bth as any).course_name || `Course #${bth.course_code || (bth as any).course_cd}`}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                  ⚠️ Unmapped Course
                                </span>
                              )}
                            </td>
                            <td className="p-4 font-bold font-mono text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                                #{bth.batch_cd || bth.code}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-extrabold">
                                Batch {bth.year || (bth as any).name || bth.code}
                              </span>
                            </td>
                            <td className="p-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                              {bth.start_date || bth.end_date ? (
                                `${formatDate(bth.start_date)} → ${formatDate(bth.end_date)}`
                              ) : (
                                <span className="text-slate-400 italic">Academic Year {bth.year}</span>
                              )}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${bth.is_active ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                                {bth.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-4 text-right whitespace-nowrap min-w-[140px]">
                              <ActionButtons onEdit={() => handleEdit(bth)} onDelete={() => handleDelete(bth.id)} />
                            </td>
                          </tr>
                        ))}

                    {/* 5. BRANCHES / DEPARTMENTS & SPECIALTIES */}
                    {activeTab === 'branches' &&
                      branches
                        .filter((br) => isMatchCollege(br.college_id, br.college_code, br.college_slug))
                        .filter((br) =>
                          (br.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                          (br.code || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                          ((br as any).course_name || (br as any).course_cd || '').toLowerCase().includes((searchTerm || '').toLowerCase())
                        )
                        .map((br) => (
                          <tr key={br.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-4 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span>🏛️</span>
                                <span>{colleges.find((c) => c.id === br.college_id || c.code === br.college_code || c.slug === br.college_slug)?.name || br.college_name || 'SRMS Institution'}</span>
                              </div>
                            </td>
                            <td className="p-4 text-purple-600 dark:text-purple-300 font-bold font-mono whitespace-nowrap">
                              {(br as any).course_name || (br as any).course_cd ? (
                                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-bold text-[10px]">
                                  🎓 {(br as any).course_name || `Course #${(br as any).course_cd}`}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal italic text-[10px]">General</span>
                              )}
                            </td>
                            <td className="p-4 font-bold font-mono text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                                #{br.branch_cd || br.code}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-slate-900 dark:text-white">{br.name}</td>
                            <td className="p-4 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10px]">
                                {br.type || 'General'}
                              </span>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${br.is_active ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                                {br.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-4 text-right whitespace-nowrap min-w-[140px]">
                              <ActionButtons onEdit={() => handleEdit(br)} onDelete={() => handleDelete(br.id)} />
                            </td>
                          </tr>
                        ))}

                    {/* 6. SECTIONS */}
                    {activeTab === 'sections' && (() => {
                      const q = (searchTerm || '').toLowerCase();
                      const filteredSections = sections
                        .filter(matchesSectionFilters)
                        .filter((sec) =>
                          !q ||
                          (sec.name || '').toLowerCase().includes(q) ||
                          (sec.code || '').toLowerCase().includes(q) ||
                          (sec.course_name || '').toLowerCase().includes(q) ||
                          (sec.department_name || '').toLowerCase().includes(q) ||
                          (sec.semester || '').toLowerCase().includes(q)
                        );
                      if (filteredSections.length === 0) {
                        return (
                          <tr>
                            <td colSpan={10} className="p-10 text-center text-xs text-slate-400">
                              <div className="text-2xl mb-1.5">🏫</div>
                              <p className="font-bold text-slate-600 dark:text-slate-300">No Sections found matching these filters.</p>
                              <p className="text-[11px] mt-0.5">Click &quot;+ Add New Section Master&quot; to create Sections (1–10), then link Groups under each Section.</p>
                            </td>
                          </tr>
                        );
                      }
                      return filteredSections.map((sec) => {
                        const course =
                          courses.find((c) => c.id === sec.course_id) ||
                          courses.find((c) => c.code === sec.course_id || c.course_cd === sec.course_id || c.code === sec.course_code || c.course_cd === (sec as any).batch_course_cd);
                        const batch =
                          batches.find((b) => b.id === sec.batch_id) ||
                          batches.find((b) =>
                            (!sec.course_code || b.course_code === sec.course_code || (b as any).course_cd === sec.course_code) &&
                            (b.code === sec.batch_code || String(b.year) === String(sec.batch_year))
                          ) ||
                          batches.find((b) => b.code === sec.batch_id || b.code === sec.batch_code || String(b.year) === String(sec.batch_year));
                        const dept =
                          branches.find((br) => sec.department_id && br.id === sec.department_id) ||
                          branches.find((br) =>
                            (!sec.course_code || br.course_code === sec.course_code || (br as any).course_cd === sec.course_code) &&
                            (br.name === sec.department_name || br.code === sec.department_code || br.branch_cd === sec.department_code)
                          ) ||
                          branches.find((br) => br.code === sec.department_id || br.branch_cd === sec.department_id || br.code === sec.department_code || br.name === sec.department_name);
                        return (
                          <tr key={sec.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-4 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span>🏛️</span>
                                <span>{colleges.find((c) => c.id === sec.college_id || (sec.college_code && c.code === sec.college_code) || (sec.college_slug && c.slug === sec.college_slug))?.name || sec.college_name || activeColleges[0]?.name || colleges[0]?.name || 'Institution'}</span>
                              </div>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs">
                                🎓 {course?.name || sec.course_name || 'General'}
                              </span>
                            </td>
                            <td className="p-4 text-slate-700 dark:text-slate-300 text-xs font-semibold whitespace-nowrap">
                              {dept?.name || sec.department_name || 'All Branches / General'}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-xs">
                                📅 {batch?.year ? `Batch ${batch.code ? `${batch.code} — ` : ''}${batch.year}` : (sec.batch_code ? `Batch ${sec.batch_code}` : '—')}
                              </span>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold">
                                📖 {sec.semester || sec.phase_name || 'All Semesters'}
                              </span>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-extrabold text-xs border border-indigo-500/20">
                                #{sec.code}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                              🏫 {sec.name}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-700 dark:text-slate-300">
                                  Cap: {sec.capacity || 60}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold">
                                  👥 {sec.group_count ?? 0} Groups
                                </span>
                              </div>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${sec.is_active ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                                {sec.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-4 text-right whitespace-nowrap min-w-[140px]">
                              <ActionButtons onEdit={() => handleEdit(sec)} onDelete={() => handleDelete(sec.id)} />
                            </td>
                          </tr>
                        );
                      });
                    })()}

                    {/* 7. GROUPS */}
                    {activeTab === 'groups' && (() => {
                      const q = (searchTerm || '').toLowerCase();
                      const filteredGroups = groups
                        .filter(matchesGroupFilters)
                        .filter((g) =>
                          !q ||
                          (g.name || '').toLowerCase().includes(q) ||
                          (g.code || '').toLowerCase().includes(q) ||
                          (g.course_name || '').toLowerCase().includes(q) ||
                          (g.department_name || '').toLowerCase().includes(q) ||
                          (g.section_name || '').toLowerCase().includes(q) ||
                          (g.subject_name || '').toLowerCase().includes(q) ||
                          (g.semester || '').toLowerCase().includes(q)
                        );
                      if (filteredGroups.length === 0) {
                        return (
                          <tr>
                            <td colSpan={12} className="p-10 text-center text-xs text-slate-400">
                              <div className="text-2xl mb-1.5">👥</div>
                              <p className="font-bold text-slate-600 dark:text-slate-300">No Student Groups found for these campus / course / branch filters.</p>
                              <p className="text-[11px] mt-0.5">Click &quot;+ Add New Student Group Master&quot; above to create Practical / Clinical groups and assign students.</p>
                            </td>
                          </tr>
                        );
                      }
                      return filteredGroups.map((grp) => {
                        const course = courses.find((c) =>
                          c.id === grp.course_id ||
                          c.code === grp.course_id ||
                          c.course_cd === grp.course_id ||
                          c.code === (grp as any).course_code ||
                          c.course_cd === (grp as any).course_code ||
                          c.code === (grp as any).batch_course_cd ||
                          c.course_cd === (grp as any).batch_course_cd
                        );
                        const batch = batches.find((b) =>
                          b.id === grp.batch_id ||
                          b.code === grp.batch_id ||
                          b.batch_cd === grp.batch_id ||
                          b.code === grp.batch_code ||
                          b.batch_cd === grp.batch_code ||
                          String(b.year) === String((grp as any).batch_year)
                        );
                        const dept = branches.find((br) =>
                          br.id === grp.department_id ||
                          br.code === grp.department_id ||
                          br.branch_cd === grp.department_id ||
                          br.code === grp.department_code ||
                          br.branch_cd === grp.department_code ||
                          br.name === grp.department_name
                        );

                        return (
                          <tr key={grp.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-4 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span>🏛️</span>
                                <span>{colleges.find((c) => c.id === grp.college_id || ((grp as any).college_code && c.code === (grp as any).college_code) || ((grp as any).college_slug && c.slug === (grp as any).college_slug))?.name || grp.college_name || activeColleges[0]?.name || colleges[0]?.name || 'Institution'}</span>
                              </div>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs">
                                🎓 {course?.name || (grp as any).course_name || (course?.code ? `Course #${course.code}` : (grp as any).course_code ? `Course #${(grp as any).course_code}` : 'General')}
                              </span>
                            </td>
                            <td className="p-4 font-bold font-mono text-purple-600 dark:text-purple-400 whitespace-nowrap">{grp.code}</td>
                            <td className="p-4 font-bold text-slate-900 dark:text-white">
                              <div>{grp.name}</div>
                              {(grp as any).semester && (
                                <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                                  📖 {(grp as any).semester}
                                </div>
                              )}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              {grp.section_name || grp.section_code ? (
                                <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-xs">
                                  🏫 {grp.section_code ? `[#${grp.section_code}] ` : ''}{grp.section_name}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs italic">General</span>
                              )}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                grp.group_type === 'CLINICAL'
                                  ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                                  : grp.group_type === 'COMMUNITY'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : grp.group_type === 'TUTORIAL' || grp.group_type === 'TH'
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                  : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                              }`}>
                                {getGroupPurposeLabel(grp.group_type)}
                              </span>
                            </td>
                            <td className="p-4 text-xs font-semibold whitespace-nowrap">
                              {grp.subject_name ? (
                                <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                  📘 {grp.subject_code ? `[${grp.subject_code}] ` : ''}{grp.subject_name}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs italic">All Subjects</span>
                              )}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-xs">
                                📅 {batch?.year
                                  ? `Batch ${batch.code && batch.code !== String(batch.year) ? `${batch.code} — ` : ''}${batch.year}`
                                  : (grp.batch_code ? `Batch ${grp.batch_code}` : (grp as any).batch_year ? `Batch ${(grp as any).batch_year}` : 'Batch 2026')
                                }
                              </span>
                            </td>
                            <td className="p-4 text-slate-700 dark:text-slate-300 text-xs font-semibold whitespace-nowrap">
                              {dept?.name || grp.department_name
                                ? `${dept?.name || grp.department_name}${dept?.code || grp.department_code || dept?.branch_cd ? ` (${dept?.code || grp.department_code || dept?.branch_cd})` : ''}`
                                : 'All Departments / General'}
                            </td>
                            <td className="p-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold">
                                👥 {grp.member_count ?? 0} / {grp.capacity || 50}
                              </span>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${grp.is_active ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                                {grp.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-4 text-right whitespace-nowrap min-w-[200px]">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openGroupMembersModal(grp)}
                                  className="px-2.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all flex items-center gap-1"
                                  title="Manage Student Members"
                                >
                                  <span>👥 Students</span>
                                </button>
                                <ActionButtons onEdit={() => handleEdit(grp)} onDelete={() => handleDelete(grp.id)} />
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}

                    {/* 7. SESSIONS */}
                    {activeTab === 'sessions' &&
                      sessions
                        .filter((s) => isMatchCollege(s.college_id, (s as any).college_code, (s as any).college_slug))
                        .filter((s) =>
                          (s.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                          (s.session_cd ? String(s.session_cd).toLowerCase().includes((searchTerm || '').toLowerCase()) : false) ||
                          (s.code ? String(s.code).toLowerCase().includes((searchTerm || '').toLowerCase()) : false)
                        )
                        .map((ses) => (
                          <tr key={ses.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-extrabold text-xs border border-indigo-500/20">
                                #{ses.session_cd || ses.code || '—'}
                              </span>
                            </td>
                            <td className="p-4 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span>🏛️</span>
                                <span>{colleges.find((c) => c.id === ses.college_id || c.code === (ses as any).college_code || c.slug === (ses as any).college_slug)?.name || ses.college_name || 'SRMS Institution'}</span>
                              </div>
                            </td>
                            <td className="p-4 font-bold text-slate-900 dark:text-white">{ses.name || ses.session_name}</td>
                            <td className="p-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">{formatDate(ses.start_date)}</td>
                            <td className="p-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">{formatDate(ses.end_date)}</td>
                            <td className="p-4 whitespace-nowrap">
                              {ses.is_current ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">CURRENT SESSION</span>
                              ) : (
                                <span className="text-slate-600 dark:text-slate-400 text-xs">Standard</span>
                              )}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${ses.is_active ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                                {ses.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-4 text-right whitespace-nowrap min-w-[140px]">
                              <ActionButtons onEdit={() => handleEdit(ses)} onDelete={() => handleDelete(ses.id)} />
                            </td>
                          </tr>
                        ))}

                    {/* 8. RESIDENCY / HOSTELLER / DAY SCHOLAR */}
                    {activeTab === 'residencies' &&
                      residencies
                        .filter((r) => isMatchCollege(r.college_id, (r as any).college_code, (r as any).college_slug))
                        .filter((r) =>
                          (r.category_name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                          (r.residency_type || '').toLowerCase().includes((searchTerm || '').toLowerCase())
                        )
                        .map((resItem) => {
                          const fillPct = Math.min(100, Math.round((resItem.allocated_count / (resItem.total_capacity || 1)) * 100));
                          return (
                            <tr key={resItem.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-200/40 dark:bg-slate-200 dark:bg-slate-800/40 transition-colors">
                              <td className="p-4 font-medium text-slate-600 dark:text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span>🏛️</span>
                                  <span>{colleges.find((c) => c.id === resItem.college_id)?.name || resItem.college_name}</span>
                                </div>
                              </td>
                              <td className="p-4 text-indigo-600 dark:text-indigo-300 font-bold font-mono whitespace-nowrap">
                                🎓 {resItem.course_code || 'ALL'}
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                {resItem.residency_type === 'Resident' && (
                                  <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 font-extrabold text-[11px]">
                                    🩺 PG Resident
                                  </span>
                                )}
                                {resItem.residency_type === 'Hosteller' && (
                                  <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-extrabold text-[11px]">
                                    🏠 Hosteller Inmate
                                  </span>
                                )}
                                {resItem.residency_type === 'Day Scholar' && (
                                  <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-extrabold text-[11px]">
                                    🚌 Day Scholar
                                  </span>
                                )}
                              </td>
                              <td className="p-4 font-bold text-slate-900 dark:text-slate-900 dark:text-white">{resItem.category_name}</td>
                              <td className="p-4 text-slate-500 dark:text-slate-600 dark:text-slate-400 whitespace-nowrap">{resItem.block_wing || 'General Block'}</td>
                              <td className="p-4 whitespace-nowrap">
                                <div className="space-y-1 min-w-[120px]">
                                  <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-700 dark:text-slate-300">
                                    <span>{resItem.allocated_count} / {resItem.total_capacity}</span>
                                    <span>{fillPct}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${fillPct > 90 ? 'bg-rose-500' : fillPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                                        }`}
                                      style={{ width: `${fillPct}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 font-bold text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                                ₹{(resItem.monthly_fee || 0).toLocaleString('en-IN')}/mo
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${resItem.is_active ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                                  {resItem.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="p-4 text-right whitespace-nowrap min-w-[140px]">
                                <ActionButtons onEdit={() => handleEdit(resItem)} onDelete={() => handleDelete(resItem.id)} />
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Premium Modal Form ─────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full ${activeTab === 'groups' ? 'max-w-6xl w-[95vw]' : 'max-w-xl'} bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/60 flex flex-col max-h-[92vh]`}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{categories.find((c) => c.key === activeTab)?.icon || '📋'}</span>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {editingItem ? 'Edit' : 'Create New'} {categories.find((c) => c.key === activeTab)?.label.split('. ')[1]}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Fill all required fields and save to PostgreSQL</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* ── Form Body ───────────────────────────────────────────────── */}
            <form onSubmit={handleSave} className="overflow-y-auto flex-1">
              <div className="p-5 space-y-4 text-xs">

                {/* College + Course selectors in compact grid */}
                {activeTab !== 'colleges' && activeTab !== 'groups' && activeTab !== 'sections' && (
                  <div className={`grid gap-3 ${['professionals','batches','branches','residencies'].includes(activeTab) ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {/* College */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        🏛️ College *
                        <span className="ml-1.5 text-indigo-500 font-normal normal-case">
                          #{colleges.find(c => c.id === formData.collegeId || c.code === formData.collegeId || c.slug === formData.collegeId)?.code || '—'}
                        </span>
                      </label>
                      <select
                        required
                        value={colleges.find(c => c.id === formData.collegeId || c.code === formData.collegeId || c.slug === formData.collegeId)?.code || formData.collegeId || colleges[0]?.code || colleges[0]?.id}
                        onChange={(e) => handleFormCollegeChange(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
                      >
                        {colleges.map((col) => (
                          <option key={col.id} value={col.code || col.id}>🏛️ {col.name} ({col.slug})</option>
                        ))}
                      </select>
                    </div>

                    {/* Course (cascading) */}
                    {['professionals','batches','branches','residencies'].includes(activeTab) && (
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          🎓 Course *
                          <span className="ml-1.5 text-indigo-500 font-normal normal-case">
                            #{getCoursesForCollege(formData.collegeId || colleges[0]?.code || colleges[0]?.id).find(c => c.id === formData.courseId || c.course_cd === formData.courseId || c.code === formData.courseId)?.course_cd || '—'}
                          </span>
                        </label>
                        <select
                          required
                          value={getCoursesForCollege(formData.collegeId || colleges[0]?.code || colleges[0]?.id).find(c => c.id === formData.courseId || c.course_cd === formData.courseId || c.code === formData.courseId)?.course_cd || formData.courseId || ''}
                          onChange={(e) => handleFormCourseChange(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
                        >
                          {getCoursesForCollege(formData.collegeId || colleges[0]?.code || colleges[0]?.id).length === 0 ? (
                            <option value="">-- No Courses Found --</option>
                          ) : (
                            getCoursesForCollege(formData.collegeId || colleges[0]?.code || colleges[0]?.id).map((crs: any) => (
                              <option key={crs.id} value={crs.course_cd || crs.code || crs.id}>
                                🎓 {crs.name} (#{crs.course_cd || crs.code}) — {crs.academic_system === 'semester' ? 'Semester' : 'Professional'}
                              </option>
                            ))
                          )}
                        </select>
                        {getCoursesForCollege(formData.collegeId || colleges[0]?.code || colleges[0]?.id).length === 0 && (
                          <p className="text-[10px] text-amber-500 font-medium pt-0.5">⚠️ No courses found. Add courses first.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Divider if we showed college/course ── */}
                {activeTab !== 'colleges' && activeTab !== 'groups' && activeTab !== 'sections' && (
                  <div className="border-t border-slate-100 dark:border-slate-800" />
                )}

                {/* ══════════════════ COLLEGE FORM ══════════════════ */}
                {activeTab === 'colleges' && (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">College Code *</label>
                        <input type="text" required value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
                          placeholder="e.g. 1, 11" />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">College Name *</label>
                        <input type="text" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
                          placeholder="e.g. SRMS IMS, BAREILLY" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Slug / Subdomain *</label>
                        <input type="text" required value={formData.slug || ''} onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
                          placeholder="e.g. srms-ims" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Domain</label>
                        <input type="text" value={formData.domain || ''} onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
                          placeholder="e.g. srms.mederp.app" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Plan</label>
                        <select value={formData.plan || 'Enterprise'} onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all">
                          <option value="Enterprise">Enterprise</option>
                          <option value="Standard">Standard</option>
                          <option value="Starter">Starter</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Primary Color</label>
                        <input type="color" value={formData.primary_color || formData.primaryColor || '#6366F1'} onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value, primary_color: e.target.value })}
                          className="w-full h-9 p-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer" />
                      </div>
                    </div>
                  </>
                )}

                {/* ══════════════════ COURSE FORM ══════════════════ */}
                {activeTab === 'courses' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Course Code (course_cd) *</label>
                        <input type="text" required value={formData.course_cd || formData.code || ''} onChange={(e) => setFormData({ ...formData, code: e.target.value, course_cd: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
                          placeholder="e.g. 1, 2, 3" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Degree Level</label>
                        <select value={formData.degreeLevel || 'UG'} onChange={(e) => setFormData({ ...formData, degreeLevel: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all">
                          <option value="UG">Undergraduate (UG)</option>
                          <option value="PG">Postgraduate (PG)</option>
                          <option value="Diploma">Diploma / Vocational</option>
                          <option value="Certificate">Certificate Program</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Course Title *</label>
                      <input type="text" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
                        placeholder="e.g. Bachelor of Technology (B.Tech)" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Duration (Years)</label>
                        <input type="number" step="0.5" min="0.5" max="8" value={formData.durationYears ?? 4.0} onChange={(e) => setFormData({ ...formData, durationYears: parseFloat(e.target.value) || 1.0 })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Starting Phase / Semester</label>
                        <input type="text" value={formData.professionalPhase || formData.phaseName || ''} onChange={(e) => setFormData({ ...formData, professionalPhase: e.target.value, phaseName: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
                          placeholder="e.g. Semester 1 / Phase I" />
                      </div>
                    </div>
                    <div className="space-y-1.5 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Academic System *
                        <span className="ml-1.5 text-indigo-400 font-normal normal-case">Only IMS is Professional; others Semester-based</span>
                      </label>
                      <select value={formData.academicSystem || 'semester'} onChange={(e) => setFormData({ ...formData, academicSystem: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all">
                        <option value="professional">🩺 Professional Phase System (NMC MBBS / Medical)</option>
                        <option value="semester">📚 Semester System (Engineering, Law, Nursing, etc.)</option>
                      </select>
                    </div>
                  </>
                )}

                {/* ══════════════════ ACADEMIC YEAR FORM ══════════════════ */}
                {activeTab === 'professionals' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Branch / Department *
                        <span className="ml-1.5 text-slate-400 font-normal normal-case">Filtered by College & Course</span>
                      </label>
                      <select required value={formData.branchCd || getBranchesForCollegeAndCourse(formData.collegeId || colleges[0]?.code || colleges[0]?.id, formData.courseId)[0]?.branch_cd || ''}
                        onChange={(e) => {
                          const bCd = e.target.value;
                          const bList = getBranchesForCollegeAndCourse(formData.collegeId || colleges[0]?.code || colleges[0]?.id, formData.courseId);
                          const bObj = bList.find(b => String(b.branch_cd) === String(bCd) || b.code === bCd || b.id === bCd);
                          const resolvedCd = bObj?.branch_cd || bObj?.code || bCd || '1';
                          setFormData({ ...formData, branchCd: resolvedCd, branchId: resolvedCd, branchName: bObj?.name || (bCd ? bCd : 'General Branch') });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all">
                        {getBranchesForCollegeAndCourse(formData.collegeId || colleges[0]?.code || colleges[0]?.id, formData.courseId).length === 0 ? (
                          <option value="">🏢 General Branch / Department</option>
                        ) : (
                          getBranchesForCollegeAndCourse(formData.collegeId || colleges[0]?.code || colleges[0]?.id, formData.courseId).map((b: any) => (
                            <option key={b.id || b.code || b.branch_cd} value={b.branch_cd || b.code || b.id}>🏢 {b.name} (#{b.branch_cd || b.code || '1'})</option>
                          ))
                        )}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Academic Year *</label>
                        <select required value={Number(formData.academicYear) || 1}
                          onChange={(e) => {
                            const yearNum = parseInt(e.target.value, 10) || 1;
                            const defaultSemForYear = YEAR_SEMESTERS[yearNum]?.[0] || '1st Semester';
                            setFormData({ ...formData, academicYear: yearNum, semester: isSelectedCourseSemesterSystem ? defaultSemForYear : formData.semester, phaseName: isSelectedCourseSemesterSystem ? defaultSemForYear : formData.phaseName });
                          }}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all">
                          <option value={1}>First Year</option>
                          <option value={2}>Second Year</option>
                          <option value={3}>Third Year</option>
                          <option value={4}>Fourth Year</option>
                          <option value={5}>Fifth Year</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Duration (Years) *</label>
                        <input type="number" step="1" min="1" max="6" value={formData.durationYears ?? 1} onChange={(e) => setFormData({ ...formData, durationYears: Number(e.target.value) || 1 })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all" placeholder="1" />
                      </div>
                    </div>
                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {isSelectedCourseSemesterSystem ? `Semesters for ${YEAR_NAMES[Number(formData.academicYear) || 1]}` : 'Professional Phase *'}
                        <span className="ml-1.5 text-indigo-500 font-semibold normal-case">{isSelectedCourseSemesterSystem ? 'Both Included' : 'NMC Standards'}</span>
                      </label>
                      {isSelectedCourseSemesterSystem ? (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {(YEAR_SEMESTERS[Number(formData.academicYear) || 1] || ['1st Semester', '2nd Semester']).map((semName) => (
                            <div key={semName} className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/80">
                              <span className="text-base">📚</span>
                              <div className="flex-1">
                                <p className="font-extrabold text-xs text-slate-900 dark:text-white">{semName}</p>
                                <p className="text-[10px] text-slate-500">{YEAR_NAMES[Number(formData.academicYear) || 1]}</p>
                              </div>
                              <span className="text-[10px] text-emerald-600 font-extrabold">✓ Included</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <select value={formData.phaseName || '1st Professional MBBS (Phase I)'} onChange={(e) => setFormData({ ...formData, phaseName: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all">
                          <option value="1st Professional MBBS (Phase I)">1st Professional MBBS (Phase I)</option>
                          <option value="2nd Professional MBBS (Phase II)">2nd Professional MBBS (Phase II)</option>
                          <option value="3rd Professional MBBS Part I (Phase III-1)">3rd Professional MBBS Part I (Phase III Part I)</option>
                          <option value="3rd Professional MBBS Part II (Final MBBS)">3rd Professional MBBS Part II (Final MBBS)</option>
                        </select>
                      )}
                    </div>
                  </>
                )}

                {/* ══════════════════ BATCH FORM ══════════════════ */}
                {activeTab === 'batches' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Batch Code (batch_cd) *</label>
                        <input type="text" required value={formData.code || formData.batch_cd || ''} onChange={(e) => setFormData({ ...formData, code: e.target.value, batch_cd: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
                          placeholder="e.g. 1, 2, 3" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Admission / Batch Year *</label>
                        <input type="number" required value={formData.year || new Date().getFullYear()} onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
                          placeholder="2024" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Start Date</label>
                        <input type="date" value={formData.startDate || ''} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">End Date</label>
                        <input type="date" value={formData.endDate || ''} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all" />
                      </div>
                    </div>
                  </>
                )}

                {/* ══════════════════ DEPARTMENT / BRANCH FORM ══════════════════ */}
                {activeTab === 'branches' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Branch Code (branch_cd) *</label>
                        <input type="text" required value={formData.code || formData.branch_cd || ''} onChange={(e) => setFormData({ ...formData, code: e.target.value, branch_cd: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
                          placeholder="e.g. 1, 2, 3" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Specialty / Discipline Type</label>
                        <select value={formData.type || 'General'} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all">
                          <option value="General">General / Core Discipline</option>
                          <option value="Engineering">Engineering & Technology</option>
                          <option value="Pharmacy">Pharmacy Sciences</option>
                          <option value="Management">Management Studies</option>
                          <option value="Law">Legal Studies</option>
                          <option value="Pre-Clinical">Pre-Clinical (Anatomy, Physiology, Biochemistry)</option>
                          <option value="Para-Clinical">Para-Clinical (Pathology, Pharmacology, Microbiology)</option>
                          <option value="Clinical">Clinical Specialties (Medicine, Surgery, Pediatrics)</option>
                          <option value="Administration">Administration / Support</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Department / Branch Name *</label>
                      <input type="text" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
                        placeholder="e.g. Computer Science & Engineering (CSE)" />
                    </div>
                  </>
                )}

                {/* ══════════════════ SECTION MASTER FORM (STRICT CASCADING 1-10) ══════════════════ */}
                {activeTab === 'sections' && (() => {
                  const modalColleges = activeColleges.length > 0 ? activeColleges : colleges;
                  const currentCollegeId = formData.collegeId || modalColleges[0]?.code || modalColleges[0]?.id || '';
                  const secCollegeCourses = getCoursesForCollege(currentCollegeId);
                  const selectedCrs = courses.find(c =>
                    c.id === formData.courseId || c.course_cd === formData.courseId || c.code === formData.courseId
                  ) || secCollegeCourses[0];
                  const resolvedCourseValue = selectedCrs?.course_cd || selectedCrs?.code || selectedCrs?.id || formData.courseId || '';
                  const selectedCourseCd = selectedCrs?.course_cd || selectedCrs?.code || '';
                  const isProfessional = selectedCrs?.academic_system === 'professional';

                  const availableBranches = getBranchesForCollegeAndCourse(
                    currentCollegeId,
                    selectedCrs?.course_cd || selectedCrs?.id,
                    Boolean(selectedCrs)
                  );
                  const deptList = availableBranches.filter((b, idx, arr) => {
                    const k = b.id || b.branch_cd || b.code || '';
                    return k && arr.findIndex((x) => (x.id || x.branch_cd || x.code || '') === k) === idx;
                  });
                  const selectedDept = formData.departmentId
                    ? deptList.find(br =>
                        br.id === formData.departmentId || br.branch_cd === formData.departmentId || br.code === formData.departmentId || br.name === formData.departmentId
                      )
                    : undefined;
                  const resolvedDeptValue = selectedDept?.id || selectedDept?.branch_cd || selectedDept?.code || '';

                  const secBatches = batches.filter((b) => {
                    const matchCourse = !selectedCourseCd && !selectedCrs?.id ? true : (b.course_code === selectedCourseCd || (b as any).course_cd === selectedCourseCd || b.course_id === selectedCrs?.id);
                    const matchDept = !resolvedDeptValue ? true : (!(b as any).department_id || (b as any).department_id === resolvedDeptValue || (b as any).branch_cd === resolvedDeptValue || (b as any).department_id === selectedDept?.id);
                    return matchCourse && matchDept;
                  });
                  const availableBatches = secBatches.length > 0 ? secBatches : batches.filter(b => !selectedCourseCd || b.course_code === selectedCourseCd || (b as any).course_cd === selectedCourseCd || b.course_id === selectedCrs?.id);
                  const selectedBch = availableBatches.find(b =>
                    b.id === formData.batchId || b.batch_cd === formData.batchId || b.code === formData.batchId || String(b.year) === String(formData.batchId)
                  ) || availableBatches[0];
                  const resolvedBatchValue = selectedBch?.id || selectedBch?.batch_cd || selectedBch?.code || formData.batchId || '';

                  const semesterOptions = isProfessional
                    ? ['1st Professional MBBS (Phase I)', '2nd Professional MBBS (Phase II)', '3rd Professional MBBS Part I (Phase III-1)', '3rd Professional MBBS Part II (Phase III-2)']
                    : ['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester', '7th Semester', '8th Semester'];
                  const resolvedSemester = formData.semester || semesterOptions[0];
                  const SECTION_CODES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

                  return (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            🏛️ 1. College * (Active Only)
                          </label>
                          <select
                            value={currentCollegeId}
                            onChange={(e) => handleFormCollegeChange(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-xs"
                          >
                            {modalColleges.map((col) => (
                              <option key={col.id} value={col.code || col.id}>🏛️ {col.name} ({col.slug})</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                            🎓 2. Course *
                          </label>
                          <select
                            value={resolvedCourseValue}
                            onChange={(e) => {
                              const val = e.target.value;
                              const newCrs = courses.find(c => c.course_cd === val || c.code === val || c.id === val);
                              const newBatches = batches.filter(b => {
                                const code = newCrs?.course_cd || newCrs?.code;
                                return !code || b.course_code === code || (b as any).course_cd === code || b.course_id === newCrs?.id;
                              });
                              const newBchId = newBatches[0]?.id || newBatches[0]?.batch_cd || newBatches[0]?.code || '';
                              const newSem = newCrs?.academic_system === 'professional' ? '1st Professional MBBS (Phase I)' : '1st Semester';
                              setFormData({
                                ...formData,
                                courseId: val,
                                departmentId: '',
                                batchId: newBchId,
                                semester: newSem,
                              });
                            }}
                            className="w-full px-3 py-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-xs"
                          >
                            <option value="">-- Select Course --</option>
                            {secCollegeCourses.map((c) => {
                              const cCode = c.course_cd || c.code || c.id;
                              return <option key={c.id || cCode} value={cCode}>[{c.code || cCode}] {c.name}</option>;
                            })}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            🏢 3. Branch / Department {deptList.length > 0 ? '*' : ''}
                          </label>
                          <select
                            required={deptList.length > 0}
                            value={resolvedDeptValue}
                            onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-xs"
                          >
                            <option value="">{deptList.length > 0 ? '-- Choose Branch / Department --' : '-- General / No Branches --'}</option>
                            {deptList.map((br) => {
                              const brCode = br.id || br.branch_cd || br.code;
                              return <option key={br.id || brCode} value={brCode}>[{br.code || br.branch_cd || '—'}] {br.name || (br as any).branch_name}</option>;
                            })}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-violet-500 dark:text-violet-400">
                            📅 4. Batch *
                          </label>
                          <select
                            required
                            value={resolvedBatchValue}
                            onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                            className="w-full px-3 py-2 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/40 text-xs"
                          >
                            <option value="">-- Select Batch --</option>
                            {availableBatches.map((b) => {
                              const bCode = b.id || b.batch_cd || b.code || String(b.year);
                              return <option key={b.id || bCode} value={bCode}>Batch {b.code || b.batch_cd || b.year} — {b.year}</option>;
                            })}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          📖 5. {isProfessional ? 'Professional Phase *' : 'Semester *'}
                        </label>
                        <select
                          value={resolvedSemester}
                          onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                          className="w-full px-3 py-2 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
                        >
                          {semesterOptions.map((sem) => (
                            <option key={sem} value={sem}>{sem}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                            🔢 6. Section Code *
                          </label>
                          <select
                            required
                            value={formData.code || '1'}
                            onChange={(e) => {
                              const cVal = e.target.value;
                              const prevDefault = `Section ${formData.code || '1'}`;
                              const shouldAutoName = !formData.name || formData.name === prevDefault || /^Section \d+$/.test(formData.name);
                              setFormData({
                                ...formData,
                                code: cVal,
                                name: shouldAutoName ? `Section ${cVal}` : formData.name,
                              });
                            }}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                          >
                            {SECTION_CODES.map((n) => (
                              <option key={n} value={n}>Section Code {n}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2 space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            🏫 7. Section Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-xs"
                            placeholder="e.g. Section 1 or CSE Section A"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          👥 Section Capacity
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.capacity ?? 60}
                          onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-xs"
                          placeholder="60"
                        />
                      </div>
                    </>
                  );
                })()}

                {/* ══════════════════ GROUP MASTER FORM (LARGE WIDTH + LIVE STUDENT CHECKBOXES) ══════════════════ */}
                {activeTab === 'groups' && (() => {
                  const modalColleges = activeColleges.length > 0 ? activeColleges : colleges;
                  const currentCollegeId = formData.collegeId || modalColleges[0]?.code || modalColleges[0]?.id || '';
                  const groupCollegeCourses = getCoursesForCollege(currentCollegeId);
                  const selectedCrs = courses.find(c =>
                    c.id === formData.courseId ||
                    c.course_cd === formData.courseId ||
                    c.code === formData.courseId
                  ) || groupCollegeCourses[0];

                  const resolvedCourseValue = selectedCrs?.course_cd || selectedCrs?.code || selectedCrs?.id || formData.courseId || '';
                  const selectedCourseCd = selectedCrs?.course_cd || selectedCrs?.code || '';
                  const isProfessional = selectedCrs?.academic_system === 'professional';

                  // Cascading Branches for this College and Course (strict course filtering + deduplication)
                  const availableBranches = getBranchesForCollegeAndCourse(
                    currentCollegeId,
                    selectedCrs?.course_cd || selectedCrs?.id,
                    Boolean(selectedCrs)
                  );
                  const deptList = availableBranches.filter((b, idx, arr) => {
                    const k = b.id || b.branch_cd || b.code || '';
                    return k && arr.findIndex((x) => (x.id || x.branch_cd || x.code || '') === k) === idx;
                  });
                  const selectedDept = formData.departmentId
                    ? deptList.find(br =>
                        br.id === formData.departmentId ||
                        br.branch_cd === formData.departmentId ||
                        br.code === formData.departmentId ||
                        br.name === formData.departmentId
                      )
                    : undefined;
                  const resolvedDeptValue = selectedDept?.id || selectedDept?.branch_cd || selectedDept?.code || '';

                  // Cascading Batches for this Course and Branch
                  const groupCourseBatches = batches.filter((b) => {
                    const matchCourse = !selectedCourseCd && !selectedCrs?.id ? true : (b.course_code === selectedCourseCd || (b as any).course_cd === selectedCourseCd || b.course_id === selectedCrs?.id || b.course_id === formData.courseId);
                    const matchDept = !resolvedDeptValue ? true : (!(b as any).department_id || (b as any).department_id === resolvedDeptValue || (b as any).branch_cd === resolvedDeptValue || (b as any).department_id === selectedDept?.id);
                    return matchCourse && matchDept;
                  });

                  const availableBatches = groupCourseBatches.length > 0 ? groupCourseBatches : batches.filter(b => !selectedCourseCd || b.course_code === selectedCourseCd || (b as any).course_cd === selectedCourseCd || b.course_id === selectedCrs?.id);
                  const shouldWaitForBranch = deptList.length > 0 && !resolvedDeptValue;
                  const selectedBch = shouldWaitForBranch
                    ? undefined
                    : (availableBatches.find(b =>
                        b.id === formData.batchId ||
                        b.batch_cd === formData.batchId ||
                        b.code === formData.batchId ||
                        String(b.year) === String(formData.batchId)
                      ) || availableBatches[0]);
                  const resolvedBatchValue = shouldWaitForBranch
                    ? ''
                    : (selectedBch?.id || selectedBch?.batch_cd || selectedBch?.code || formData.batchId || '');

                  // Semester / Phase options
                  const semesterOptions = isProfessional
                    ? ['1st Professional MBBS (Phase I)', '2nd Professional MBBS (Phase II)', '3rd Professional MBBS Part I (Phase III-1)', '3rd Professional MBBS Part II (Phase III-2)']
                    : ['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester', '7th Semester', '8th Semester'];
                  const resolvedSemester = formData.semester || semesterOptions[0];
                  const semNumMatch = resolvedSemester.match(/(\d+)/);
                  const semNum = semNumMatch ? semNumMatch[1] : '';

                  // Cascading Subjects for Course, Branch, and Semester (with numeric semester match support)
                  const filteredSubjects = liveSubjects.filter((s) => {
                    const matchCourse = !selectedCourseCd ? true : (
                      !s.course_cd ||
                      String(s.course_cd).toLowerCase() === String(selectedCourseCd).toLowerCase() ||
                      String((s as any).course_code || '').toLowerCase() === String(selectedCourseCd).toLowerCase() ||
                      String(s.course_name || '').toLowerCase() === String(selectedCrs?.name || '').toLowerCase()
                    );
                    const matchDept = !resolvedDeptValue || !selectedDept ? true : (
                      (!s.branch_cd && !s.department_id && !s.department_code) ||
                      String(s.branch_cd || '').toLowerCase() === String(selectedDept.branch_cd || '').toLowerCase() ||
                      String(s.branch_cd || '').toLowerCase() === String(selectedDept.code || '').toLowerCase() ||
                      String(s.department_id || '') === String(selectedDept.id || '') ||
                      (s.department_name && s.department_name === selectedDept.name)
                    );
                    const matchSem = !resolvedSemester ? true : (
                      (!s.sem_cd && !s.semester) ||
                      String(s.sem_cd || '').toLowerCase() === resolvedSemester.toLowerCase() ||
                      String(s.semester || '').toLowerCase() === resolvedSemester.toLowerCase() ||
                      (semNum && (
                        String(s.sem_cd || '') === semNum ||
                        String(s.sem_cd || '') === `0${semNum}` ||
                        String(s.semester || '').includes(semNum)
                      ))
                    );
                    return matchCourse && matchDept && matchSem;
                  });
                  const courseFallbackSubjects = liveSubjects.filter(s => !selectedCourseCd || !s.course_cd || String(s.course_cd).toLowerCase() === String(selectedCourseCd).toLowerCase() || String((s as any).course_code || '').toLowerCase() === String(selectedCourseCd).toLowerCase());
                  const hasSelectedSection = Boolean(String(formData.sectionId || '').trim());
                  const displaySubjects = !hasSelectedSection
                    ? []
                    : (filteredSubjects.length > 0 ? filteredSubjects : courseFallbackSubjects);

                  // Strictly linked sections (1..10 or saved codes) fetched for Course + Branch + Batch + Semester
                  const availableSections = shouldWaitForBranch || !resolvedBatchValue
                    ? []
                    : formLinkedSections.filter((sec) => {
                        const codeStr = String(sec.code || '').trim();
                        if (!codeStr) return false;
                        if (!sec.department_id || !sec.semester) return false;
                        if (selectedBch?.id && sec.batch_id && sec.batch_id !== selectedBch.id) {
                          const batchMatchByCode = Boolean(
                            sec.batch_code &&
                            (sec.batch_code === selectedBch.code || sec.batch_code === selectedBch.batch_cd) &&
                            (!selectedBch.year || !sec.batch_year || String(sec.batch_year) === String(selectedBch.year))
                          );
                          if (!batchMatchByCode) return false;
                        }
                        if (selectedDept?.id && sec.department_id !== selectedDept.id) {
                          const secDeptName = String(sec.department_name || '').toLowerCase().trim();
                          const selDeptName = String(selectedDept.name || '').toLowerCase().trim();
                          const secDeptCode = String(sec.department_code || '').toLowerCase().trim();
                          const selDeptCodes = [selectedDept.code, selectedDept.branch_cd].filter(Boolean).map(v => String(v).toLowerCase().trim());
                          const sameName = Boolean(secDeptName && selDeptName && secDeptName === selDeptName);
                          const sameCode = Boolean(secDeptCode && selDeptCodes.includes(secDeptCode));
                          if (!sameName && !sameCode) return false;
                        }
                        if (resolvedSemester) {
                          const secSemLower = sec.semester.toLowerCase().trim();
                          const resSemLower = resolvedSemester.toLowerCase().trim();
                          if (secSemLower !== resSemLower) {
                            const secNumMatch = secSemLower.match(/(\d+)/);
                            if (!(!isProfessional && semNum && secNumMatch && secNumMatch[1] === semNum)) {
                              return false;
                            }
                          }
                        }
                        return sec.is_active !== false;
                      });
                  const numericSectionOptions = buildNumericSectionOptions(availableSections);

                  // Group Code options: A through P and ALL
                  const GROUP_CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'ALL'];
                  const selectedCode = formData.code || 'A';

                  // Auto-name helper
                  const autoGenerateName = (code: string, grpType: string, subId: string, bchId: string, secId?: string) => {
                    const sub = liveSubjects.find(s => String(s.id) === String(subId));
                    const bch = availableBatches.find(b => b.id === bchId || b.code === bchId || b.batch_cd === bchId || String(b.year) === String(bchId));
                    const targetSecId = secId !== undefined ? secId : (formData.sectionId || '');
                    const sec =
                      numericSectionOptions.find(x => x.numVal === String(targetSecId) || String(x.sec.id) === String(targetSecId))?.sec ||
                      availableSections.find(s => String(s.code) === String(targetSecId) || String(s.id) === String(targetSecId)) ||
                      sections.find(s => String(s.id) === String(targetSecId));
                    const matchedDelivery = deliveryTypes.find((dt) => String(dt.code || '').toUpperCase() === String(grpType || '').toUpperCase());
                    const typeLabel = matchedDelivery?.name || (grpType === 'CLINICAL' ? 'Clinical Posting' : grpType === 'COMMUNITY' ? 'Community Posting' : grpType === 'TUTORIAL' ? 'Tutorial' : 'Practical');
                    const prefix = code === 'ALL' ? 'ALL Students' : `Group ${code}`;
                    const subLabel = sub ? sub.name : typeLabel;
                    const secLabel = sec ? ` [${sec.name}]` : '';
                    const bchYear = bch?.year || bch?.code || '';
                    return `${prefix} - ${subLabel}${secLabel}${bchYear ? ` (Batch ${bchYear})` : ''}`;
                  };

                  const isTargetAll = String(selectedCode || formData.code || '').trim().toUpperCase() === 'ALL';
                  const isStudentConflicting = (st: any) => {
                    if (!st.is_assigned_to_same_subject) return false;
                    const assignedCode = String(st.already_assigned_group_code || '').trim().toUpperCase();
                    // Group ALL is an entire-batch umbrella group: never conflicts with sub-groups (A–P)
                    if (assignedCode === 'ALL') return false;
                    if (isTargetAll) return false;
                    return true;
                  };

                  // Filter + Sort for Right-Side Student Checkbox List
                  let visibleFormStudents = formBatchStudents.filter((st) => {
                    if (formHideAssigned && isStudentConflicting(st)) return false;
                    if (formStudentSearch.trim()) {
                      const q = formStudentSearch.toLowerCase();
                      const matchName = (st.name || '').toLowerCase().includes(q);
                      const matchRoll = (st.rollno || '').toLowerCase().includes(q);
                      const matchReg = (st.registration_no || '').toLowerCase().includes(q);
                      if (!matchName && !matchRoll && !matchReg) return false;
                    }
                    return true;
                  });

                  visibleFormStudents = [...visibleFormStudents].sort((a, b) => {
                    if (formStudentSortBy === 'rollno') {
                      const aR = a.rollno || '';
                      const bR = b.rollno || '';
                      const aN = parseInt(aR, 10);
                      const bN = parseInt(bR, 10);
                      const cmp = (!isNaN(aN) && !isNaN(bN)) ? aN - bN : aR.localeCompare(bR);
                      return formStudentSortOrder === 'asc' ? cmp : -cmp;
                    }
                    const cmp = (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
                    return formStudentSortOrder === 'asc' ? cmp : -cmp;
                  });

                  const formSelectableStudents = visibleFormStudents.filter((st) => !isStudentConflicting(st));
                  const excludedFormCount = formBatchStudents.filter(isStudentConflicting).length;
                  const conflictingFormSample = formBatchStudents.find(isStudentConflicting);

                  const handleCheckRollRangeInForm = () => {
                    if (!formRangeStart || !formRangeEnd) return;
                    const sNum = parseInt(formRangeStart, 10);
                    const eNum = parseInt(formRangeEnd, 10);
                    const matched = formSelectableStudents
                      .filter((st) => {
                        const r = st.rollno || '';
                        const rNum = parseInt(r, 10);
                        if (!isNaN(sNum) && !isNaN(eNum) && !isNaN(rNum)) {
                          return rNum >= sNum && rNum <= eNum;
                        }
                        return r >= formRangeStart && r <= formRangeEnd;
                      })
                      .map((st) => st.id);
                    setFormSelectedStudentIds((prev) => Array.from(new Set([...prev, ...matched])));
                  };

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                      {/* ── LEFT COLUMN (5 cols): 10 CASCADING GROUP FIELDS ── */}
                      <div className="lg:col-span-5 space-y-3">
                        {/* Step 1 & 2: College & Course */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              🏛️ 1. College * (Active Only)
                            </label>
                            <select
                              value={currentCollegeId}
                              onChange={(e) => handleFormCollegeChange(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all text-xs"
                            >
                              {modalColleges.map((col) => (
                                <option key={col.id} value={col.code || col.id}>🏛️ {col.name} ({col.slug})</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                              🎓 2. Course *
                            </label>
                            <select
                              value={resolvedCourseValue}
                              onChange={(e) => {
                                const val = e.target.value;
                                const newCrs = courses.find(c => c.course_cd === val || c.code === val || c.id === val);
                                const newSem = newCrs?.academic_system === 'professional' ? '1st Professional MBBS (Phase I)' : '1st Semester';
                                const autoName = autoGenerateName(formData.code || 'A', formData.groupType || 'PRACTICAL', '', '', '');
                                setFormData({
                                  ...formData,
                                  courseId: val,
                                  batchId: '',
                                  departmentId: '',
                                  sectionId: '',
                                  semester: newSem,
                                  subjectId: '',
                                  name: autoName,
                                });
                              }}
                              className="w-full px-3 py-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all text-xs"
                            >
                              <option value="">-- Select Course --</option>
                              {groupCollegeCourses.map((c) => {
                                const cCode = c.course_cd || c.code || c.id;
                                return <option key={c.id || cCode} value={cCode}>[{c.code || cCode}] {c.name}</option>;
                              })}
                            </select>
                          </div>
                        </div>

                        {/* Step 3 & 4: Branch / Department (Choose first) & Batch (Fetched after Branch) */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                              🏢 3. Branch / Department {deptList.length > 0 ? '*' : ''}
                            </label>
                            <select
                              required={deptList.length > 0}
                              value={resolvedDeptValue}
                              onChange={(e) => {
                                const dVal = e.target.value;
                                const autoName = autoGenerateName(formData.code || 'A', formData.groupType || 'PRACTICAL', '', '', '');
                                setFormData({ ...formData, departmentId: dVal, batchId: '', sectionId: '', subjectId: '', name: autoName });
                              }}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all text-xs"
                            >
                              <option value="">{deptList.length > 0 ? '-- Choose Branch / Department --' : '-- General / No Branches --'}</option>
                              {deptList.map((br) => {
                                const brCode = br.id || br.branch_cd || br.code;
                                return <option key={br.id || brCode} value={brCode}>[{br.code || br.branch_cd || '—'}] {br.name || (br as any).branch_name}</option>;
                              })}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-violet-500 dark:text-violet-400">
                                📅 4. Batch *
                              </label>
                              <button
                                type="button"
                                disabled={shouldWaitForBranch || loadingFormBatches}
                                onClick={() => fetchFormBatches({
                                  collegeId: currentCollegeId,
                                  courseId: resolvedCourseValue,
                                  departmentId: resolvedDeptValue,
                                })}
                                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-40"
                                title="Fetch batches for selected Course & Branch"
                              >
                                {loadingFormBatches ? '⏳ Fetching...' : '🔄 Fetch'}
                              </button>
                            </div>
                            <select
                              required
                              disabled={shouldWaitForBranch || loadingFormBatches}
                              value={resolvedBatchValue}
                              onChange={(e) => {
                                const bVal = e.target.value;
                                const autoName = autoGenerateName(formData.code || 'A', formData.groupType || 'PRACTICAL', '', bVal, '');
                                setFormData({ ...formData, batchId: bVal, sectionId: '', subjectId: '', name: autoName });
                              }}
                              className="w-full px-3 py-2 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              <option value="">
                                {shouldWaitForBranch
                                  ? '-- Choose Branch First --'
                                  : loadingFormBatches
                                    ? '-- Fetching Batches... --'
                                    : '-- Select Batch --'}
                              </option>
                              {!shouldWaitForBranch && availableBatches.map((b) => {
                                const bCode = b.id || b.batch_cd || b.code || String(b.year);
                                return <option key={b.id || bCode} value={bCode}>Batch {b.code || b.batch_cd || b.year} — {b.year}</option>;
                              })}
                            </select>
                          </div>
                        </div>

                        {/* Step 5 & 6: Semester / Phase & Section (Required, Fetched from Section Master) */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                              📖 5. {isProfessional ? 'Professional Phase *' : 'Semester *'}
                            </label>
                            <select
                              disabled={shouldWaitForBranch || !resolvedBatchValue}
                              value={resolvedSemester}
                              onChange={(e) => {
                                const autoName = autoGenerateName(formData.code || 'A', formData.groupType || 'PRACTICAL', '', resolvedBatchValue, '');
                                setFormData({ ...formData, semester: e.target.value, sectionId: '', subjectId: '', name: autoName });
                              }}
                              className="w-full px-3 py-2 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {semesterOptions.map((sem) => (
                                <option key={sem} value={sem}>{sem}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                                🏫 6. Section * ({availableSections.length})
                              </label>
                              <button
                                type="button"
                                disabled={shouldWaitForBranch || !resolvedBatchValue || loadingFormSections}
                                onClick={() => {
                                  fetchData('sections', true);
                                  fetchFormLinkedSections({
                                    collegeId: currentCollegeId,
                                    courseId: resolvedCourseValue,
                                    departmentId: resolvedDeptValue,
                                    batchId: resolvedBatchValue,
                                    semester: resolvedSemester,
                                  });
                                }}
                                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-40"
                                title="Fetch linked numeric sections for selected Branch & Semester"
                              >
                                {loadingFormSections ? '⏳ Fetching...' : '🔄 Fetch'}
                              </button>
                            </div>
                            <select
                              required
                              disabled={shouldWaitForBranch || !resolvedBatchValue || loadingFormSections}
                              value={formData.sectionId || ''}
                              onChange={(e) => {
                                const secVal = e.target.value;
                                const autoName = autoGenerateName(formData.code || 'A', formData.groupType || 'PRACTICAL', '', resolvedBatchValue, secVal);
                                setFormData({ ...formData, sectionId: secVal, subjectId: '', name: autoName });
                              }}
                              className="w-full px-3 py-2 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              <option value="">
                                {shouldWaitForBranch
                                  ? '-- Choose Branch First --'
                                  : !resolvedBatchValue
                                    ? '-- Select Batch First --'
                                    : loadingFormSections
                                      ? '-- Loading Sections from Master... --'
                                      : availableSections.length === 0
                                        ? '-- No Sections Fed for Branch & Semester --'
                                        : '-- Choose Section --'}
                              </option>
                              {numericSectionOptions.map(({ sec, numVal }) => (
                                <option key={sec.id || numVal} value={numVal}>
                                  [{numVal}] {sec.name}
                                </option>
                              ))}
                            </select>
                            {!shouldWaitForBranch && resolvedBatchValue && !loadingFormSections && availableSections.length === 0 && (
                              <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                                ⚠️ No section found in Section Master for this Branch &amp; Semester. Add a section first before saving a group.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Step 7: Subject List (Fetched ONLY after Section Selection) */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                              📘 7. Subject List ({displaySubjects.length})
                            </label>
                            {hasSelectedSection && (
                              <button
                                type="button"
                                disabled={loadingFormSubjects}
                                onClick={() => fetchFormSubjects({ collegeId: currentCollegeId })}
                                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-40"
                                title="Re-fetch subjects for selected Section"
                              >
                                {loadingFormSubjects ? '⏳ Fetching...' : '🔄 Fetch'}
                              </button>
                            )}
                          </div>
                          <select
                            disabled={!hasSelectedSection || loadingFormSubjects}
                            value={formData.subjectId || ''}
                            onChange={(e) => {
                              const subVal = e.target.value;
                              const autoName = autoGenerateName(formData.code || 'A', formData.groupType || 'PRACTICAL', subVal, resolvedBatchValue, formData.sectionId || '');
                              setFormData({ ...formData, subjectId: subVal, name: autoName });
                            }}
                            className="w-full px-3 py-2 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <option value="">
                              {!hasSelectedSection
                                ? '-- Choose Section first to fetch Subjects --'
                                : loadingFormSubjects
                                  ? '-- Fetching Subjects... --'
                                  : '-- All Subjects / General --'}
                            </option>
                            {displaySubjects.map((s) => (
                              <option key={s.id} value={s.id}>
                                [{s.code || s.sub_cd || 'SUB'}] {s.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Step 8: Group Purpose / Type (Dynamic from Delivery Types when firm_mode = 'NONMED') */}
                        {(() => {
                          const currentColObj = modalColleges.find(
                            (c) => c.code === currentCollegeId || c.id === currentCollegeId || c.slug === currentCollegeId,
                          ) || modalColleges[0];
                          const useNonMedDelivery = isNonMedTenantMode(currentColObj?.slug, currentColObj);
                          const activeDeliveryList = deliveryTypes.filter((dt) => dt && dt.is_active !== false);
                          const purposeOptions = (useNonMedDelivery && activeDeliveryList.length > 0)
                            ? activeDeliveryList.map((dt) => ({
                                value: dt.code,
                                label: `[${dt.code}] ${dt.name}`,
                              }))
                            : [
                                { value: 'PRACTICAL', label: '🔬 Practical / Lab Batch (Laboratory Experiment Group)' },
                                { value: 'CLINICAL', label: '🏥 Clinical Posting (Hospital Ward / Medical Bedside)' },
                                { value: 'COMMUNITY', label: '🏡 Community / Field Posting (Primary Health / Outreach)' },
                                { value: 'TUTORIAL', label: '📖 Tutorial / SGT Group (Small Group Teaching)' },
                              ];
                          const activePurposeVal = formData.groupType || purposeOptions[0]?.value || 'PRACTICAL';

                          return (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                                  🎯 8. Group Purpose / Type *
                                </label>
                                {useNonMedDelivery && (
                                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                                    {loadingDeliveryTypes
                                      ? '⏳ Loading Delivery Types...'
                                      : `${activeDeliveryList.length} from Delivery Type Master (NONMED)`}
                                  </span>
                                )}
                              </div>
                              <select
                                value={activePurposeVal}
                                onChange={(e) => {
                                  const grpType = e.target.value;
                                  const autoName = autoGenerateName(formData.code || 'A', grpType, formData.subjectId || '', resolvedBatchValue);
                                  setFormData({ ...formData, groupType: grpType, name: autoName });
                                }}
                                className="w-full px-3 py-2 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all text-xs"
                              >
                                {purposeOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                                {editingItem && formData.groupType && !purposeOptions.some((o) => o.value === formData.groupType) && (
                                  <option value={formData.groupType}>
                                    {getGroupPurposeLabel(formData.groupType)} (Existing)
                                  </option>
                                )}
                              </select>
                            </div>
                          );
                        })()}

                        {/* Step 8 & 9: Group Code & Student Capacity */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                              🏷️ 9. Group Code * (A–P or ALL)
                            </label>
                            <select
                              required
                              value={selectedCode}
                              onChange={(e) => {
                                const codeVal = e.target.value;
                                // For ALL group: capacity = total students in section (all, not just unassigned)
                                const isNewAll = codeVal === 'ALL';
                                const allAvailIds = formBatchStudents.map((st) => st.id);
                                const exactBatchTotal = allAvailIds.length > 0 ? allAvailIds.length : 50;
                                const capVal = isNewAll
                                  ? exactBatchTotal
                                  : ((formData.code === 'ALL' || formData.capacity === formBatchStudents.length) ? 50 : (formData.capacity || 50));
                                const autoName = autoGenerateName(codeVal, formData.groupType || 'PRACTICAL', formData.subjectId || '', resolvedBatchValue);
                                if (codeVal === 'ALL') {
                                  // ALL group: select every student in the section
                                  setFormSelectedStudentIds(formBatchStudents.map((st) => st.id));
                                }
                                setFormData({
                                  ...formData,
                                  code: codeVal,
                                  capacity: capVal,
                                  name: autoName,
                                });
                              }}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                            >
                              {GROUP_CODES.map((cd) => (
                                <option key={cd} value={cd}>
                                  {cd === 'ALL' ? '⚡ ALL — Entire Batch (All Students)' : `Group ${cd}`}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              👥 10. Student Capacity *
                            </label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={formData.capacity ?? 50}
                              onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all text-sm"
                              placeholder="50"
                            />
                          </div>
                        </div>

                        {/* Step 10: Group Title / Name */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            📝 11. Group Title / Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all text-xs"
                            placeholder="e.g. Group A - Practical (Batch 2024)"
                          />
                        </div>
                      </div>

                      {/* ── RIGHT COLUMN (7 cols): LIVE FETCH STUDENTS CHECKBOX LIST ── */}
                      <div className="lg:col-span-7 flex flex-col border border-slate-200 dark:border-slate-700/80 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 overflow-hidden">
                        {/* Header Bar + Fetch Button */}
                        <div className="px-4 py-3 bg-white dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-base">👥</span>
                            <div>
                              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                                Select Students for Group {selectedCode}
                              </h4>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                Check students below to allocate on save • Auto-excludes already grouped students
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold ${
                              formSelectedStudentIds.length > (Number(formData.capacity) || 50)
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                            }`}>
                              ✓ {formSelectedStudentIds.length} Selected / {formData.capacity || 50}
                            </span>
                            <button
                              type="button"
                              disabled={!resolvedBatchValue || loadingFormStudents}
                              onClick={() => fetchFormBatchStudents({
                                batchId: resolvedBatchValue,
                                courseId: resolvedCourseValue,
                                departmentId: resolvedDeptValue,
                                subjectId: formData.subjectId || '',
                                groupType: formData.groupType || 'PRACTICAL',
                                currentGroupId: editingItem?.id || '',
                                groupCode: selectedCode,
                                sectionId: formData.sectionId || '',
                                isEditing: Boolean(editingItem?.id),
                              })}
                              className="px-3 py-1.5 rounded-xl bg-[#5B4BFF] hover:bg-[#493AE0] text-white font-bold text-[11px] shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <span className={loadingFormStudents ? 'animate-spin' : ''}>🔄</span>
                              <span>{loadingFormStudents ? 'Fetching...' : 'Fetch Students'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Search, Sort & Exclusion Controls */}
                        <div className="p-3 space-y-2.5 border-b border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/30">
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                            <div className="sm:col-span-7 relative">
                              <input
                                type="text"
                                value={formStudentSearch}
                                onChange={(e) => setFormStudentSearch(e.target.value)}
                                placeholder="Filter Roll No, Name, or Reg No..."
                                className="w-full pl-7 pr-7 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                              />
                              <span className="absolute left-2.5 top-1.5 text-slate-400">🔍</span>
                              {formStudentSearch && (
                                <button type="button" onClick={() => setFormStudentSearch('')} className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 font-bold">✕</button>
                              )}
                            </div>
                            <div className="sm:col-span-5 flex items-center gap-1.5">
                              <select
                                value={formStudentSortBy}
                                onChange={(e) => setFormStudentSortBy(e.target.value as any)}
                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                              >
                                <option value="rollno">Order: Roll No</option>
                                <option value="name">Order: Name</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => setFormStudentSortOrder(formStudentSortOrder === 'asc' ? 'desc' : 'asc')}
                                className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0"
                              >
                                {formStudentSortOrder === 'asc' ? '⬆️ Asc' : '⬇️ Desc'}
                              </button>
                            </div>
                          </div>

                          {/* Smart Exclusion Toggle & Banner */}
                          <div className="space-y-1.5">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={formHideAssigned}
                                onChange={(e) => setFormHideAssigned(e.target.checked)}
                                className="rounded accent-indigo-600 w-3.5 h-3.5"
                              />
                              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                Hide students already linked to another group (same Subject & Purpose Type)
                              </span>
                            </label>
                            {formHideAssigned && excludedFormCount > 0 && (
                              <div className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
                                <span>
                                  ⚠️ <strong>{excludedFormCount}</strong> student(s) already linked under {conflictingFormSample?.already_assigned_group_code ? `Group ${conflictingFormSample.already_assigned_group_code}` : 'another group'} are hidden. Showing <strong>{formSelectableStudents.length}</strong> remaining.
                                </span>
                                <button type="button" onClick={() => setFormHideAssigned(false)} className="underline font-bold ml-2 shrink-0">Show</button>
                              </div>
                            )}
                          </div>

                          {/* Range Selector + Select All */}
                          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200/70 dark:border-slate-700/70 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold uppercase text-slate-500">Roll Range:</span>
                              <input
                                type="text"
                                value={formRangeStart}
                                onChange={(e) => setFormRangeStart(e.target.value)}
                                placeholder="From"
                                className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-mono text-center"
                              />
                              <span className="text-slate-400">—</span>
                              <input
                                type="text"
                                value={formRangeEnd}
                                onChange={(e) => setFormRangeEnd(e.target.value)}
                                placeholder="To"
                                className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-mono text-center"
                              />
                              <button
                                type="button"
                                disabled={!formRangeStart || !formRangeEnd || formSelectableStudents.length === 0}
                                onClick={handleCheckRollRangeInForm}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold disabled:opacity-50"
                              >
                                ✓ Check Range
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={formSelectableStudents.length === 0}
                                onClick={() => setFormSelectedStudentIds(formSelectableStudents.map((s) => s.id))}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                                  selectedCode === 'ALL'
                                    ? 'bg-[#F36C21] text-white'
                                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-200'
                                } disabled:opacity-50`}
                              >
                                ⚡ Select All Remaining ({formSelectableStudents.length})
                              </button>
                              {formSelectedStudentIds.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setFormSelectedStudentIds([])}
                                  className="text-[10px] font-bold text-rose-500 hover:underline"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Checkbox Student List Table */}
                        <div className="h-[340px] lg:h-[380px] overflow-y-auto bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                          <div className="sticky top-0 z-10 px-3 py-2 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formSelectableStudents.length > 0 && formSelectableStudents.every((s) => formSelectedStudentIds.includes(s.id))}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormSelectedStudentIds(formSelectableStudents.map((s) => s.id));
                                  } else {
                                    const visSet = new Set(formSelectableStudents.map((s) => s.id));
                                    setFormSelectedStudentIds((prev) => prev.filter((id) => !visSet.has(id)));
                                  }
                                }}
                                className="rounded accent-indigo-600 w-3.5 h-3.5"
                              />
                              <span>Student ({visibleFormStudents.length} Shown)</span>
                            </label>
                            <span>Batch Total: {formBatchStudents.length}</span>
                          </div>

                          {loadingFormStudents ? (
                            <div className="p-10 text-center text-xs text-slate-400 animate-pulse">
                              Fetching students for Batch {selectedBch?.year || selectedBch?.code || '...'}...
                            </div>
                          ) : !resolvedBatchValue ? (
                            <div className="p-10 text-center text-xs text-slate-400">
                              Select a Batch on the left to fetch students.
                            </div>
                          ) : visibleFormStudents.length === 0 ? (
                            <div className="p-10 text-center text-xs text-slate-400 space-y-1.5">
                              <p className="font-semibold text-slate-600 dark:text-slate-300">No unallocated students found.</p>
                              {excludedFormCount > 0 ? (
                                <p className="text-[11px] text-amber-500">All {excludedFormCount} student(s) in this selection are already allocated to another group.</p>
                              ) : (
                                <p className="text-[11px]">Try clearing Branch filter or click &quot;Fetch Students&quot;.</p>
                              )}
                            </div>
                          ) : (
                            visibleFormStudents.map((st, idx) => {
                              const isChecked = formSelectedStudentIds.includes(st.id);
                              const isConflicting = isStudentConflicting(st);
                              const isUnderAll = String(st.already_assigned_group_code || '').trim().toUpperCase() === 'ALL';

                              return (
                                <div
                                  key={st.id || idx}
                                  onClick={() => {
                                    if (isConflicting) return;
                                    setFormSelectedStudentIds((prev) =>
                                      prev.includes(st.id) ? prev.filter((id) => id !== st.id) : [...prev, st.id]
                                    );
                                  }}
                                  className={`px-3 py-2 flex items-center justify-between gap-2 transition-colors ${
                                    isConflicting
                                      ? 'opacity-55 bg-amber-50/30 dark:bg-amber-950/10 cursor-not-allowed'
                                      : isChecked
                                      ? 'bg-indigo-50/80 dark:bg-indigo-950/30 cursor-pointer'
                                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <input
                                      type="checkbox"
                                      disabled={isConflicting}
                                      checked={isChecked}
                                      onChange={() => {}}
                                      className="rounded accent-indigo-600 w-4 h-4 shrink-0"
                                    />
                                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-[11px] text-indigo-600 dark:text-indigo-400 shrink-0">
                                      {st.rollno || '—'}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                        {st.name}
                                      </p>
                                      <p className="text-[10px] text-slate-400 font-mono truncate">
                                        Reg: {st.registration_no || '—'}{st.branch_code ? ` • ${st.branch_code}` : ''}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="shrink-0">
                                    {st.is_in_current_group && (
                                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                        Current Member
                                      </span>
                                    )}
                                    {isConflicting && (
                                      <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                                        Linked: Group {st.already_assigned_group_code || 'X'}
                                      </span>
                                    )}
                                    {!isConflicting && isUnderAll && !isTargetAll && (
                                      <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                                        In Group ALL
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ══════════════════ SESSION FORM ══════════════════ */}
                {activeTab === 'sessions' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Session Code *
                          <span className="ml-1 text-slate-400 font-normal normal-case">(Numeric)</span>
                        </label>
                        <input type="text" required value={formData.session_cd || formData.code || ''} onChange={(e) => setFormData({ ...formData, session_cd: e.target.value, code: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                          placeholder="e.g. 14, 15, 16" />
                        <p className="text-[10px] text-slate-400">SRMS FeeAdmin/GetSession Code</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Session Title / Year *</label>
                        <input type="text" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                          placeholder="e.g. 2026-2027" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Start Date</label>
                        <input type="date" required value={formData.startDate || ''} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">End Date</label>
                        <input type="date" required value={formData.endDate || ''} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all" />
                      </div>
                    </div>
                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 cursor-pointer">
                      <input type="checkbox" id="isCurrent" checked={Boolean(formData.isCurrent)} onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                        className="rounded accent-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Set as Current Active Session</span>
                    </label>
                  </>
                )}

                {/* ══════════════════ RESIDENCY FORM ══════════════════ */}
                {activeTab === 'residencies' && (
                  <>
                    <div className="space-y-1.5 p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">Residency Category Type *
                        <span className="ml-1.5 text-orange-400 font-normal normal-case">Student Occupancy Category</span>
                      </label>
                      <select value={formData.residencyType || 'Hosteller'} onChange={(e) => setFormData({ ...formData, residencyType: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all">
                        <option value="Resident">🩺 Resident (PG Resident Doctor / Intern)</option>
                        <option value="Hosteller">🏠 Hosteller (Hostel Inmate / Boarder)</option>
                        <option value="Day Scholar">🚌 Day Scholar (Non-Hostel Commuter)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Category / Block Title *</label>
                      <input type="text" required value={formData.categoryName || ''} onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-400 transition-all"
                        placeholder="e.g. PG Engineer Residency Block A / BTECH Boys Hostel" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Block / Wing / Route Info</label>
                      <input type="text" value={formData.blockWing || ''} onChange={(e) => setFormData({ ...formData, blockWing: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
                        placeholder="e.g. Block A - Single Room / City Bus Route 1" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Capacity</label>
                        <input type="number" value={formData.totalCapacity ?? 100} onChange={(e) => setFormData({ ...formData, totalCapacity: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Allocated Count</label>
                        <input type="number" value={formData.allocatedCount ?? 0} onChange={(e) => setFormData({ ...formData, allocatedCount: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Monthly Fee (₹)</label>
                        <input type="number" value={formData.monthlyFee ?? 0} onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all" />
                      </div>
                    </div>
                  </>
                )}

              </div>
              {/* ── Footer ─────────────────────────────────────────────────── */}
              <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0 bg-slate-50/60 dark:bg-slate-900/60 rounded-b-2xl">
                {activeTab === 'groups' && !formData.sectionId && (
                  <span className="mr-auto text-[11px] font-bold text-rose-600 dark:text-rose-400">
                    ⚠️ Select Branch &amp; Section to save Group
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || (activeTab === 'groups' && !formData.sectionId)}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#F36C21] hover:bg-[#E05B10] rounded-xl shadow-md shadow-orange-500/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                      </svg>
                      <span>Saving to PostgreSQL...</span>
                    </>
                  ) : (
                    <span>Save Record to PostgreSQL</span>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ── STUDENT GROUP MEMBER ALLOCATION MODAL ──────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isMemberModalOpen && selectedGroupForMembers && (() => {
        const grp = selectedGroupForMembers;
        const alreadyEnrolledIds = new Set(groupMembers.map(m => m.student_id || m.id));

        // isMemberConflicting: Group ALL never blocks sub-groups (A–P) and vice-versa
        const isMemberConflicting = (st: any) => {
          if (!st.is_assigned_to_same_subject) return false;
          const assignedCode = String(st.already_assigned_group_code || '').trim().toUpperCase();
          if (assignedCode === 'ALL') return false; // Student in ALL group → never conflicts sub-groups
          if (String(grp.code || '').trim().toUpperCase() === 'ALL') return false; // Creating ALL → shows all
          return true;
        };

        // Smart Exclusion + Filter + Search
        let filteredBatchStudents = batchStudents.filter(st => {
          // If already in THIS group, hide from available selection list
          if (alreadyEnrolledIds.has(st.id)) return false;

          // Smart exclusion: If hideAlreadyAssigned is true and student is assigned to another group for same subject & type
          if (hideAlreadyAssigned && isMemberConflicting(st)) {
            return false;
          }

          // Search query
          if (memberSearch.trim()) {
            const q = memberSearch.toLowerCase();
            const matchName = (st.name || '').toLowerCase().includes(q);
            const matchRoll = (st.rollno || '').toLowerCase().includes(q);
            const matchReg = (st.registration_no || '').toLowerCase().includes(q);
            if (!matchName && !matchRoll && !matchReg) return false;
          }

          return true;
        });

        // Sorting: Roll No or Name (Asc / Desc)
        filteredBatchStudents.sort((a, b) => {
          if (memberSortBy === 'rollno') {
            const aRoll = a.rollno || '';
            const bRoll = b.rollno || '';
            const aNum = parseInt(aRoll, 10);
            const bNum = parseInt(bRoll, 10);
            const cmp = (!isNaN(aNum) && !isNaN(bNum)) ? aNum - bNum : aRoll.localeCompare(bRoll);
            return memberSortOrder === 'asc' ? cmp : -cmp;
          } else {
            const aName = (a.name || '').toLowerCase();
            const bName = (b.name || '').toLowerCase();
            const cmp = aName.localeCompare(bName);
            return memberSortOrder === 'asc' ? cmp : -cmp;
          }
        });

        // Count of students excluded by smart filter
        const excludedCount = batchStudents.filter(st => !alreadyEnrolledIds.has(st.id) && isMemberConflicting(st)).length;
        const conflictingSample = batchStudents.find(st => !alreadyEnrolledIds.has(st.id) && isMemberConflicting(st));

        // Filtered Roster for right column
        const filteredRoster = groupMembers.filter(m => {
          if (!rosterSearch.trim()) return true;
          const q = rosterSearch.toLowerCase();
          return (m.student_name || '').toLowerCase().includes(q) ||
                 (m.rollno || '').toLowerCase().includes(q) ||
                 (m.registration_no || '').toLowerCase().includes(q);
        });

        const capacity = grp.capacity || 50;
        const enrolledCount = groupMembers.length;
        const capacityPct = Math.min(Math.round((enrolledCount / capacity) * 100), 100);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[94vh] overflow-hidden">
              
              {/* ── Modal Header ────────────────────────────────────────────── */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg">
                    👥
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {grp.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        Code: {grp.code}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                        {getGroupPurposeLabel(grp.group_type)}
                      </span>
                      {grp.subject_name && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          📘 {grp.subject_code ? `[${grp.subject_code}] ` : ''}{grp.subject_name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Allocate batch students to this practical/clinical group. Smart exclusion prevents overlapping group allocation.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Capacity Bar Indicator */}
                  <div className="hidden sm:flex flex-col items-end text-right">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 font-mono">
                      {enrolledCount} / {capacity} Enrolled ({capacityPct}%)
                    </span>
                    <div className="w-32 h-2 rounded-full bg-slate-200 dark:bg-slate-700 mt-1 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          capacityPct >= 100 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${capacityPct}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setIsMemberModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* ── Toast / Feedback Banner ─────────────────────────────────── */}
              {groupMemberMessage && (
                <div className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between shrink-0 ${
                  groupMemberMessage.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-b border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-b border-rose-200 dark:border-rose-800'
                }`}>
                  <span>{groupMemberMessage.text}</span>
                  <button onClick={() => setGroupMemberMessage(null)} className="text-xs font-bold underline ml-3">Dismiss</button>
                </div>
              )}

              {/* ── Main Dual-Column Body ──────────────────────────────────── */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0">
                
                {/* ── LEFT COLUMN: Available Batch Students (7 cols) ─────────── */}
                <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                  
                  {/* Toolbar: Search + Sort controls */}
                  <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      {/* Search */}
                      <div className="sm:col-span-7 relative">
                        <input
                          type="text"
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          placeholder="Search Roll No or Student Name..."
                          className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                        />
                        <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
                        {memberSearch && (
                          <button onClick={() => setMemberSearch('')} className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-slate-600">✕</button>
                        )}
                      </div>

                      {/* Sort Controls */}
                      <div className="sm:col-span-5 flex items-center gap-1.5">
                        <select
                          value={memberSortBy}
                          onChange={(e) => setMemberSortBy(e.target.value as any)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                        >
                          <option value="rollno">Sort: Roll No</option>
                          <option value="name">Sort: Name</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setMemberSortOrder(memberSortOrder === 'asc' ? 'desc' : 'asc')}
                          className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                          title={memberSortOrder === 'asc' ? 'Ascending Order' : 'Descending Order'}
                        >
                          {memberSortOrder === 'asc' ? '⬆️ Asc' : '⬇️ Desc'}
                        </button>
                      </div>
                    </div>

                    {/* Smart Exclusion Checkbox & Notice */}
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={hideAlreadyAssigned}
                          onChange={(e) => setHideAlreadyAssigned(e.target.checked)}
                          className="rounded accent-purple-600 w-3.5 h-3.5"
                        />
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          Smart Exclusion: Hide students already assigned to another group for this Subject & Type
                        </span>
                      </label>

                      {hideAlreadyAssigned && excludedCount > 0 && (
                        <div className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
                          <span>
                            ℹ️ <strong>{excludedCount} student(s)</strong> already assigned to another group (e.g. {conflictingSample?.already_assigned_group_code ? `Group ${conflictingSample.already_assigned_group_code}` : 'other group'}) are hidden.
                          </span>
                          <button
                            type="button"
                            onClick={() => setHideAlreadyAssigned(false)}
                            className="underline text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-900 ml-2 shrink-0"
                          >
                            Show all
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Quick Range Assigner & 1-Click All Button */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Roll Range:</span>
                        <input
                          type="text"
                          value={memberStartRoll}
                          onChange={(e) => setMemberStartRoll(e.target.value)}
                          placeholder="From"
                          className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-center"
                        />
                        <span className="text-slate-400">—</span>
                        <input
                          type="text"
                          value={memberEndRoll}
                          onChange={(e) => setMemberEndRoll(e.target.value)}
                          placeholder="To"
                          className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-center"
                        />
                        <button
                          type="button"
                          disabled={!memberStartRoll || !memberEndRoll || savingGroupMembers}
                          onClick={() => handleAssignGroupMembers({ startRollNo: memberStartRoll, endRollNo: memberEndRoll })}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-all shrink-0"
                        >
                          ⚡ Allocate Range
                        </button>
                      </div>

                      {/* 1-Click Enroll All Available */}
                      <button
                        type="button"
                        disabled={filteredBatchStudents.length === 0 || savingGroupMembers}
                        onClick={() => {
                          const ids = filteredBatchStudents.map(s => s.id);
                          handleAssignGroupMembers({ studentIds: ids });
                        }}
                        className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
                          grp.code === 'ALL'
                            ? 'text-white bg-[#F36C21] hover:bg-[#E05B10] shadow-sm shadow-orange-500/20'
                            : 'text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 hover:bg-purple-200 dark:hover:bg-purple-900/60'
                        } disabled:opacity-50`}
                      >
                        <span>⚡ Enroll All Available ({filteredBatchStudents.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Student Table / Selection List */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {/* Header Row */}
                    <div className="sticky top-0 z-10 px-4 py-2 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filteredBatchStudents.length > 0 && selectedStudentIds.length === filteredBatchStudents.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudentIds(filteredBatchStudents.map(s => s.id));
                            } else {
                              setSelectedStudentIds([]);
                            }
                          }}
                          className="rounded accent-purple-600 w-3.5 h-3.5"
                        />
                        <span>Select All Filtered ({filteredBatchStudents.length})</span>
                      </label>
                      <span>Batch Total: {batchStudents.length}</span>
                    </div>

                    {loadingGroupMembers ? (
                      <div className="p-8 text-center text-xs text-slate-400 animate-pulse">Loading batch students...</div>
                    ) : filteredBatchStudents.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                        <p>No available students matching filter criteria.</p>
                        {excludedCount > 0 && (
                          <p className="text-[11px] text-amber-500">({excludedCount} students are hidden because they are assigned to another group for this subject)</p>
                        )}
                      </div>
                    ) : (
                      filteredBatchStudents.map((st) => {
                        const isSelected = selectedStudentIds.includes(st.id);
                        const isConflicting = isMemberConflicting(st);

                        return (
                          <div
                            key={st.id}
                            onClick={() => {
                              setSelectedStudentIds(prev =>
                                prev.includes(st.id) ? prev.filter(id => id !== st.id) : [...prev, st.id]
                              );
                            }}
                            className={`px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-purple-50/70 dark:bg-purple-950/30'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}} // Controlled via row click
                                className="rounded accent-purple-600 w-4 h-4 shrink-0"
                              />
                              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                {(st.name || 'S').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-slate-900 dark:text-white">{st.name}</span>
                                  {isConflicting && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                                      In Group {st.already_assigned_group_code || 'X'}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">Roll: {st.rollno || '—'}</span>
                                  <span>•</span>
                                  <span>Reg: {st.registration_no || '—'}</span>
                                </div>
                              </div>
                            </div>

                            <span className="text-[10px] font-mono text-slate-400 font-semibold shrink-0">
                              {st.course_cd ? `[${st.course_cd}]` : ''}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Left Column Sticky Bottom Bar */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {selectedStudentIds.length} Student(s) Selected
                    </span>
                    <button
                      type="button"
                      disabled={selectedStudentIds.length === 0 || savingGroupMembers}
                      onClick={() => handleAssignGroupMembers({ studentIds: selectedStudentIds })}
                      className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
                    >
                      {savingGroupMembers ? (
                        <>
                          <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" /></svg>
                          <span>Allocating...</span>
                        </>
                      ) : (
                        <span>➕ Assign Selected ({selectedStudentIds.length})</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* ── RIGHT COLUMN: Current Enrolled Roster (5 cols) ─────────── */}
                <div className="lg:col-span-5 flex flex-col bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden">
                  
                  {/* Roster Header */}
                  <div className="p-4 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📋</span>
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                          Current Members ({groupMembers.length})
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                        Cap: {capacity}
                      </span>
                    </div>

                    <input
                      type="text"
                      value={rosterSearch}
                      onChange={(e) => setRosterSearch(e.target.value)}
                      placeholder="Filter enrolled members..."
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                  </div>

                  {/* Roster List */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {loadingGroupMembers ? (
                      <div className="p-8 text-center text-xs text-slate-400 animate-pulse">Loading enrolled members...</div>
                    ) : filteredRoster.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                        <div className="text-2xl">👥</div>
                        <p className="font-semibold text-slate-600 dark:text-slate-300">No students allocated yet</p>
                        <p className="text-[11px]">Select students from the left panel and click Assign, or use Allocate Range.</p>
                      </div>
                    ) : (
                      filteredRoster.map((m, idx) => (
                        <div
                          key={m.membership_id || m.student_id || idx}
                          className="px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0 w-5">
                              #{idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {m.student_name || 'Student'}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                <span className="font-bold text-purple-600 dark:text-purple-400">Roll: {m.rollno || '—'}</span>
                                <span>•</span>
                                <span>Reg: {m.registration_no || '—'}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveGroupMember(m.student_id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                            title="Remove from group"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Roster Footer */}
                  <div className="p-3 bg-slate-100/70 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                    <span className="text-xs text-slate-500 font-semibold">
                      Total Allocated: {groupMembers.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsMemberModalOpen(false)}
                      className="px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
