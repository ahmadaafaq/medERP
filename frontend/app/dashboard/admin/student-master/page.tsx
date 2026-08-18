'use client';

import { useState, useEffect, useMemo } from 'react';
import { X } from "lucide-react";

import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

const ActionButtons = ({ onView, onEdit, onDelete }: { onView: () => void, onEdit: () => void, onDelete: () => void }) => (
  <div className="flex items-center justify-end gap-1.5">
    <button
      onClick={onView}
      className="p-1.5 text-[var(--color-success)] hover:text-white bg-[var(--color-success-tint)] hover:bg-[var(--color-success)] rounded-lg transition-all"
      title="View Detail"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
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
            <div className="w-7 h-7 bg-slate-200 dark:bg-slate-800/80 rounded-lg animate-pulse"></div>
            <div className="w-7 h-7 bg-slate-200 dark:bg-slate-800/80 rounded-lg animate-pulse"></div>
            <div className="w-7 h-7 bg-slate-200 dark:bg-slate-800/80 rounded-lg animate-pulse"></div>
          </div>
        </td>
      </tr>
    ))}
  </tbody>
);

const FormSkeleton = () => (
  <div className="animate-pulse space-y-6 w-full py-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 bg-slate-200 dark:bg-slate-800/80 rounded w-1/4"></div>
          <div className="h-10 bg-slate-100 dark:bg-slate-900/60 rounded-xl w-full border border-[var(--color-border)]/50"></div>
        </div>
      ))}
    </div>
  </div>
);

const SlideOverSkeleton = () => (
  <div className="animate-pulse space-y-6 py-4 w-full">
    {[...Array(3)].map((_, sIdx) => (
      <div key={sIdx} className="space-y-3">
        <div className="h-3.5 bg-slate-800/80 rounded w-1/5"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 space-y-2">
              <div className="h-2.5 bg-slate-700/80 rounded w-1/2"></div>
              <div className="h-3.5 bg-slate-600/60 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

interface Student {
  id: string;
  name: string;
  rollno?: string;
  registration_no: string;
  is_active: boolean;
  created_at: string;
  college_name: string;
  course_code: string;
  academic_session: string;
  batch_code: string;
  residency_type?: string;
  admission_type?: string;
  photo_url?: string;
  batch_id?: string;
  professional_id?: string;
  professional_phase?: string;
  group_id?: string;
  group_code?: string;
  group_name?: string;
  branch_id?: string;
  branch_code?: string;
}

interface ProfessionalPhase {
  id: string;
  name: string;
  phase_order?: number;
  course_cd?: string;
  academic_system?: string;
}

interface Group {
  id: string;
  code: string;
  name: string;
  college_id?: string;
  course_id?: string;
  batch_id?: string;
  department_id?: string;
  capacity?: number;
}

interface College {
  id: string;
  name: string;
  slug: string;
  code?: string;
  colg_cd?: string;
}

interface Course {
  id: string;
  code: string;
  name: string;
  college_id?: string;
  course_cd?: string;
  colg_cd?: string;
}

interface Batch {
  id: string;
  code: string;
  year: number;
  course_cd?: string;
  course_code?: string;
  college_id?: string;
  colg_cd?: string;
  batch_cd?: string;
}

interface AcademicSession {
  id: string;
  name: string;
  college_id?: string;
  colg_cd?: string;
  session_cd?: string;
  code?: string;
  session_name?: string;
}

interface Branch {
  id: string;
  code: string;
  name: string;
  college_id?: string;
  colg_cd?: string;
  branch_cd?: string;
  course_cd?: string;
}

const API_BASE = 'http://localhost:3001/api/v1';


export default function StudentMasterPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allBatches, setAllBatches] = useState<Batch[]>([]);
  const [allSessions, setAllSessions] = useState<AcademicSession[]>([]);
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);

  // Filter console tenant-specific data (per selected college in filter)
  const [filterCourses, setFilterCourses] = useState<Course[]>([]);
  const [filterBatches, setFilterBatches] = useState<Batch[]>([]);
  const [filterBranches, setFilterBranches] = useState<Branch[]>([]);
  const [filterSessions, setFilterSessions] = useState<AcademicSession[]>([]);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [selectedSession, setSelectedSession] = useState('all');
  const [selectedResidency, setSelectedResidency] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [linkedOnly, setLinkedOnly] = useState(false);

  // View Mode switcher ('roster' vs 'linker') and phase/group linker state
  const [viewMode, setViewMode] = useState<'roster' | 'linker'>('roster');
  const [linkerMode, setLinkerMode] = useState<'phase' | 'group'>('phase');
  const [allProfessionals, setAllProfessionals] = useState<ProfessionalPhase[]>([]);
  const [selectedProfessionalFilter, setSelectedProfessionalFilter] = useState('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [targetProfessionalId, setTargetProfessionalId] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [isGroupLinking, setIsGroupLinking] = useState(false);

  const [metadataLoading, setMetadataLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [editModeId, setEditModeId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Form State matching CreateStudentDto
  const [formData, setFormData] = useState({
    // Step 1: Academic & College Enrollment
    collegeId: '',
    collegeName: '',
    courseId: '',
    courseCode: '',
    professionalId: 'p1',
    professionalPhase: '1st Professional MBBS (Phase I)',
    sessionId: '',
    academicSession: '',
    batchId: '',
    batchCode: '',
    branchId: '',
    residencyType: 'Hosteller',
    admissionType: 'Government Quota',
    registrationNo: '',
    rollNo: '',
    admissionDate: new Date().toISOString().split('T')[0],

    // Step 2: Personal Information
    firstName: '',
    middleName: '',
    lastName: '',
    gender: 'Male',
    dob: '2002-05-15',
    bloodGroup: 'B+',
    nationality: 'Indian',
    religion: 'Hinduism',
    category: 'General',
    caste: '',
    aadhaarNo: '',
    panNo: '',
    passportNo: '',
    maritalStatus: 'Single',
    mobileNumber: '',
    emailAddress: '',

    // Step 3: Parents & Addresses
    fatherName: '',
    fatherOccupation: '',
    fatherMobile: '',
    motherName: '',
    motherOccupation: '',
    motherMobile: '',
    annualIncome: 800000,
    permanentAddress1: '',
    permanentAddress2: '',
    permanentCity: '',
    permanentDistrict: '',
    permanentState: '',
    permanentPincode: '',
    sameAsPermanent: true,

    // Step 4: Academic History & NEET
    class10Board: 'CBSE',
    class10Pct: 90,
    class12Board: 'CBSE',
    class12Physics: 90,
    class12Chemistry: 90,
    class12Biology: 95,
    class12English: 85,
    class12Pct: 90,
    neetRollNo: '',
    neetScore: 600,
    neetPercentile: 98.5,
    neetAirRank: 5000,

    // Step 5: Hostel, Transport & Banking
    hostelRequired: true,
    hostelName: 'Charak Hostel Block A',
    roomNumber: 'A-201',
    busRequired: false,
    libraryCardNo: '',
    bankName: 'State Bank of India',
    accountNumber: '',
    ifscCode: '',

    // Step 6: Medical & Declaration
    vaccinationStatus: 'Fully Vaccinated',
    admissionStatus: 'CONFIRMED',
    declarationSigned: false,
    photoUrl: '',
  });

  // â”€â”€ View Student Modal State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [viewStudent, setViewStudent] = useState<any | null>(null);
  const [viewStudentIdx, setViewStudentIdx] = useState<number>(0);
  const [viewLoading, setViewLoading] = useState(false);

  const handleViewStudent = async (studentId: string) => {
    const idx = students.findIndex((s) => s.id === studentId);
    setViewStudentIdx(idx >= 0 ? idx : 0);
    setViewLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const tenantSlug = getActiveTenantSlug();
      const res = await fetch(`${API_BASE}/student-master/${studentId}?tenant=${tenantSlug}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await res.json();
      setViewStudent(result.data || null);
    } catch (err) {
      console.error('Failed to fetch student detail', err);
    } finally {
      setViewLoading(false);
    }
  };

  const handleViewNav = async (direction: 'prev' | 'next') => {
    const newIdx = direction === 'prev' ? viewStudentIdx - 1 : viewStudentIdx + 1;
    if (newIdx < 0 || newIdx >= students.length) return;
    setViewStudentIdx(newIdx);
    await handleViewStudent(students[newIdx].id);
  };

  const handlePrint = () => {
    window.print();
  };

  // Fetch initial master lists
  useEffect(() => {
    fetchMetadata();
    fetchStudents();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCollege, selectedCourse, selectedBatch, selectedBranch, selectedSession, selectedResidency, selectedGroup, selectedProfessionalFilter, linkedOnly, viewMode]);

  // Form-level tenant-specific data (loaded when college is selected in form)
  const filteredCourses = allCourses;
  const filteredSessions = allSessions;
  const filteredBranches = allBranches;

  // Dynamically filter batches in wizard form modal based on selected course
  const filteredBatches = useMemo(() => {
    if (!formData.courseId) return allBatches;
    const filtered = allBatches.filter(b => b.course_cd === formData.courseId || b.course_code === formData.courseId);
    return filtered.length > 0 ? filtered : allBatches;
  }, [allBatches, formData.courseId]);

  // Dynamically filter batches in filter console based on selectedCourse
  const displayedFilterBatches = useMemo(() => {
    if (selectedCourse === 'all') return filterBatches;
    const filtered = filterBatches.filter(b => b.course_cd === selectedCourse || b.course_code === selectedCourse);
    return filtered.length > 0 ? filtered : filterBatches;
  }, [filterBatches, selectedCourse]);

  // Load all tenant master data for a given college slug
  const loadTenantData = async (slug: string) => {
    setMetadataLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const headers = { 'Authorization': `Bearer ${token}` };
      const [resCrs, resBat, resSess, resBr, resProf, resGrp] = await Promise.all([
        fetch(`${API_BASE}/college-master/courses?tenant=${slug}`, { headers }),
        fetch(`${API_BASE}/college-master/batches?tenant=${slug}`, { headers }),
        fetch(`/api/srms/sessions?tenant=${slug}`).catch(() => fetch(`${API_BASE}/college-master/sessions?tenant=${slug}`, { headers })),
        fetch(`${API_BASE}/college-master/branches?tenant=${slug}`, { headers }),
        fetch(`${API_BASE}/college-master/professionals?tenant=${slug}`, { headers }),
        fetch(`${API_BASE}/college-master/groups?tenant=${slug}`, { headers }),
      ]);
      const [crs, bats, sess, branches, profs, grps] = await Promise.all([
        resCrs.json().catch(() => ({ data: [] })),
        resBat.json().catch(() => ({ data: [] })),
        resSess.json().catch(() => ({ data: [] })),
        resBr.json().catch(() => ({ data: [] })),
        resProf.json().catch(() => ({ data: [] })),
        resGrp.json().catch(() => ({ data: [] })),
      ]);

      const crsList = Array.isArray(crs) ? crs : (crs.data || []);
      const batsList = Array.isArray(bats) ? bats : (bats.data || []);
      const sessList = Array.isArray(sess) ? sess : (sess.data || []);
      const brList = Array.isArray(branches) ? branches : (branches.data || []);

      const mappedCourses: Course[] = crsList.map((c: any) => ({
        id: String(c.course_cd || c.code || c.id),
        code: String(c.course_cd || c.code || c.id),
        course_cd: String(c.course_cd || c.code || c.id),
        name: c.name || c.course_name,
        college_id: c.college_id || c.colg_cd,
      }));

      const mappedBatches: Batch[] = batsList.map((b: any) => ({
        id: String(b.batch_cd || b.code || b.year || b.id),
        code: String(b.batch_cd || b.code || b.year),
        batch_cd: String(b.batch_cd || b.code || b.year),
        year: Number(b.year) || Number(b.code) || 2025,
        course_cd: b.course_cd || b.course_code,
        college_id: b.college_id || b.colg_cd,
      }));

      const mappedSessions: AcademicSession[] = sessList.map((s: any) => ({
        id: String(s.session_cd || s.code || s.name || s.id),
        code: String(s.session_cd || s.code || s.name),
        session_cd: String(s.session_cd || s.code || s.name),
        name: s.session_name || s.name || s.code,
        college_id: s.college_id || s.colg_cd,
      }));

      const mappedBranches: Branch[] = brList.map((b: any) => ({
        id: String(b.branch_cd || b.code || b.id),
        code: String(b.branch_cd || b.code || b.id),
        branch_cd: String(b.branch_cd || b.code || b.id),
        name: b.name || b.branch_name,
        college_id: b.college_id || b.colg_cd,
      }));

      return {
        courses: mappedCourses,
        batches: mappedBatches,
        sessions: mappedSessions,
        branches: mappedBranches,
        professionals: profs.data || [],
        groups: grps.data || [],
      };
    } catch (err) {
      console.error('Failed to load tenant data for slug:', slug, err);
      return { courses: [], batches: [], sessions: [], branches: [], professionals: [], groups: [] };
    } finally {
      setMetadataLoading(false);
    }
  };

  // When college selection changes in form, fetch that college's data
  const handleCollegeChange = async (cId: string) => {
    const college = colleges.find((c) => c.code === cId || c.colg_cd === cId || c.slug === cId || c.id === cId);
    const colCode = college?.code || college?.colg_cd || cId;
    const colName = college?.name || '';
    const colSlug = college?.slug || '';
    setFormData((prev) => ({
      ...prev,
      collegeId: colCode,
      collegeName: colName,
      courseId: '',
      courseCode: '',
      sessionId: '',
      academicSession: '',
      batchId: '',
      batchCode: '',
      branchId: '',
    }));
    if (colSlug) {
      const data = await loadTenantData(colSlug);
      setAllCourses(data.courses);
      setAllBatches(data.batches);
      setAllSessions(data.sessions);
      setAllBranches(data.branches);
      setAllProfessionals(data.professionals);
      if (data.professionals && data.professionals.length > 0) {
        setTargetProfessionalId(data.professionals[0].id);
      }
    }
  };

  // When filter console college changes, load that college's data & fetch students
  const handleFilterCollegeChange = async (cId: string) => {
    setSelectedCollege(cId);
    setSelectedCourse('all');
    setSelectedBatch('all');
    setSelectedBranch('all');
    setSelectedSession('all');
    setSelectedGroup('all');
    setSelectedProfessionalFilter('all');
    if (cId === 'all') {
      setFilterCourses([]);
      setFilterBatches([]);
      setFilterBranches([]);
      setFilterSessions([]);
      fetchStudents({
        collegeId: 'all',
        courseId: 'all',
        batchId: 'all',
        branchId: 'all',
        sessionId: 'all',
        residencyType: 'all',
        groupId: 'all',
        professionalPhase: 'all',
      });
      return;
    }
    const college = colleges.find((c) => c.code === cId || c.colg_cd === cId || c.slug === cId || c.id === cId);
    if (college?.slug) {
      const data = await loadTenantData(college.slug);
      setFilterCourses(data.courses || []);
      setFilterBatches(data.batches || []);
      setFilterBranches(data.branches || []);
      setFilterSessions(data.sessions || []);
      setAllProfessionals(data.professionals || []);
      setAllGroups(data.groups || []);
      if (data.professionals && data.professionals.length > 0) {
        setTargetProfessionalId(data.professionals[0].id);
      }
      if (data.groups && data.groups.length > 0) {
        setTargetGroupId(data.groups[0].id);
      }
      fetchStudents({
        overrideTenant: college.slug,
        collegeId: college.code || college.colg_cd || cId,
        courseId: 'all',
        batchId: 'all',
        branchId: 'all',
        sessionId: 'all',
        residencyType: 'all',
        groupId: 'all',
        professionalPhase: 'all',
      });
    }
  };

  // When course selection changes in filter console
  const handleFilterCourseChange = async (crsVal: string) => {
    setSelectedCourse(crsVal);
    setSelectedBatch('all');

    if (crsVal !== 'all') {
      try {
        const activeCol = colleges.find(c => c.code === selectedCollege || c.colg_cd === selectedCollege || c.slug === selectedCollege || c.id === selectedCollege);
        const colCd = activeCol?.code || activeCol?.colg_cd || '1';
        const tenantSlug = activeCol?.slug || 'srms-cet-bareilly';
        const res = await fetch(`/api/srms/batches?colgcd=${colCd}&coursecd=${crsVal}&tenant=${tenantSlug}`);
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const mapped: Batch[] = list.map((b: any) => ({
            id: String(b.batch_cd || b.code || b.batch_name || b.id),
            code: String(b.batch_cd || b.code || b.batch_name),
            batch_cd: String(b.batch_cd || b.code || b.batch_name),
            year: Number(b.batch_name) || Number(b.year) || 2025,
            course_cd: String(b.course_cd || crsVal),
            colg_cd: String(b.colg_cd || colCd),
          }));
          setFilterBatches(prev => {
            const other = prev.filter(b => b.course_cd !== crsVal);
            return [...mapped, ...other];
          });
        }
      } catch (err) {
        console.warn('Live GetBatch fetch error in filter:', err);
      }
    }

    fetchStudents({ courseId: crsVal, batchId: 'all' });
  };

  // When course selection changes in modal form
  const handleCourseChange = async (crsId: string) => {
    const crs = allCourses.find((c) => c.course_cd === crsId || c.code === crsId || c.id === crsId);
    const crsCode = crs ? (crs.course_cd || crs.code) : crsId;
    setFormData((prev) => ({
      ...prev,
      courseId: crsCode,
      courseCode: crsCode,
      batchId: '',
      batchCode: '',
    }));

    if (crsCode) {
      try {
        const colCd = formData.collegeId || '1';
        const formCollege = colleges.find((c) => c.code === colCd || c.colg_cd === colCd || c.id === colCd);
        const tenantSlug = formCollege?.slug || 'srms-cet-bareilly';
        const res = await fetch(`/api/srms/batches?colgcd=${colCd}&coursecd=${crsCode}&tenant=${tenantSlug}`);
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const mapped: Batch[] = list.map((b: any) => ({
            id: String(b.batch_cd || b.code || b.batch_name || b.id),
            code: String(b.batch_cd || b.code || b.batch_name),
            batch_cd: String(b.batch_cd || b.code || b.batch_name),
            year: Number(b.batch_name) || Number(b.year) || 2025,
            course_cd: String(b.course_cd || crsCode),
            colg_cd: String(b.colg_cd || colCd),
          }));
          setAllBatches(prev => {
            const other = prev.filter(b => b.course_cd !== crsCode);
            return [...mapped, ...other];
          });
        }
      } catch (err) {
        console.warn('Live GetBatch form fetch error:', err);
      }
    }
  };

  // When session selection changes, generate auto-reg number
  const handleSessionChange = async (sessId: string) => {
    const sess = allSessions.find((s) => s.session_cd === sessId || s.code === sessId || s.name === sessId || s.id === sessId);
    const sessCode = sess ? (sess.session_cd || sess.code || sess.name) : sessId;
    const sessName = sess ? sess.name : sessId;
    setFormData((prev) => ({
      ...prev,
      sessionId: sessCode,
      academicSession: sessName,
    }));

    if (sessName && !editModeId) {
      const match = sessName.match(/\d{4}/);
      const year = match ? match[0] : new Date().getFullYear().toString();
      try {
        // Use the selected college's slug for registration number generation
        const formCollege = colleges.find((c) => c.code === formData.collegeId || c.id === formData.collegeId);
        const tenantSlug = formCollege?.slug || colleges[0]?.slug || 'srms-ims';
        const res = await fetch(`${API_BASE}/student-master/next-registration-no?tenant=${tenantSlug}&sessionYear=${year}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          },
        });
        const result = await res.json();
        if (result.data && result.data.registrationNo) {
          setFormData((prev) => ({
            ...prev,
            registrationNo: result.data.registrationNo,
          }));
        } else if (result.registrationNo) {
          setFormData((prev) => ({
            ...prev,
            registrationNo: result.registrationNo,
          }));
        }
      } catch (err) {
        console.error('Failed to generate registration number', err);
      }
    }
  };

  const handleBatchChange = (bId: string) => {
    const bat = allBatches.find((b) => b.batch_cd === bId || b.code === bId || String(b.year) === bId || b.id === bId);
    const batchCode = bat ? (bat.batch_cd || bat.code || String(bat.year)) : bId;
    setFormData((prev) => ({
      ...prev,
      batchId: batchCode,
      batchCode: batchCode,
    }));
  };

  const fetchMetadata = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Fetch all colleges (tenants) from public schema
      const resCol = await fetch(`${API_BASE}/college-master/colleges`, { headers });
      const cols = await resCol.json();
      const rawCols = cols.data || [];
      const collegeList: College[] = rawCols.map((c: any) => ({
        id: String(c.code || c.colg_cd || c.slug || c.id),
        code: String(c.code || c.colg_cd || c.id),
        colg_cd: String(c.colg_cd || c.code || c.id),
        name: c.name,
        slug: c.slug || c.id,
      }));
      setColleges(collegeList);

      // 2. Auto-load data from active college (from localStorage or default srms-cet-bareilly)
      if (collegeList.length > 0) {
        const savedSlug = typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant')) : null;
        const savedColgCd = typeof window !== 'undefined' ? localStorage.getItem('colg_cd') : null;
        const defaultCollege = collegeList.find(c =>
          (savedSlug && (c.slug === savedSlug || c.id === savedSlug)) ||
          (savedColgCd && (String((c as any).colg_cd) === savedColgCd || String(c.id) === savedColgCd || String(c.code) === savedColgCd)) ||
          c.slug === 'srms-cet-bareilly' ||
          String(c.code) === '1'
        ) || collegeList[0];

        setSelectedCollege(defaultCollege.code || defaultCollege.colg_cd || defaultCollege.slug || 'all');

        const data = await loadTenantData(defaultCollege.slug);
        setAllCourses(data.courses || []);
        setAllBatches(data.batches || []);
        setAllSessions(data.sessions || []);
        setAllBranches(data.branches || []);
        setAllProfessionals(data.professionals || []);
        setAllGroups(data.groups || []);

        // Also set filter state for default college
        setFilterCourses(data.courses || []);
        setFilterBatches(data.batches || []);
        setFilterBranches(data.branches || []);
        setFilterSessions(data.sessions || []);

        if (data.professionals && data.professionals.length > 0) {
          setTargetProfessionalId(data.professionals[0].id);
        }
        if (data.groups && data.groups.length > 0) {
          setTargetGroupId(data.groups[0].id);
        }

        // Fetch students for the active college
        fetchStudents({
          overrideTenant: defaultCollege.slug,
          collegeId: defaultCollege.code || defaultCollege.colg_cd || defaultCollege.slug,
          courseId: 'all',
          batchId: 'all',
          branchId: 'all',
          sessionId: 'all',
          residencyType: 'all',
          groupId: 'all',
          professionalPhase: 'all',
        });
      }
    } catch (err) {
      console.error('Failed to fetch metadata', err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  const getActiveTenantSlug = () => {
    const savedSlug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') : null;
    const activeCollege = selectedCollege !== 'all'
      ? colleges.find((c) => c.code === selectedCollege || c.colg_cd === selectedCollege || c.id === selectedCollege || c.slug === selectedCollege)
      : colleges.find((c) => c.slug === savedSlug || c.slug === 'srms-cet-bareilly') || colleges[0];
    return activeCollege?.slug || savedSlug || 'srms-cet-bareilly';
  };

  const fetchStudents = async (overrides?: {
    overrideTenant?: string;
    collegeId?: string;
    courseId?: string;
    batchId?: string;
    branchId?: string;
    sessionId?: string;
    residencyType?: string;
    groupId?: string;
    professionalPhase?: string;
    linkedOnly?: boolean;
    search?: string;
  }) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const cId = overrides?.collegeId !== undefined ? overrides.collegeId : selectedCollege;
      const targetCollege = cId !== 'all' ? colleges.find(c => c.code === cId || c.colg_cd === cId || c.id === cId || c.slug === cId) : colleges[0];
      const tenantSlug = overrides?.overrideTenant || targetCollege?.slug || getActiveTenantSlug();

      const crsId = overrides?.courseId !== undefined ? overrides.courseId : selectedCourse;
      const batId = overrides?.batchId !== undefined ? overrides.batchId : selectedBatch;
      const brId = overrides?.branchId !== undefined ? overrides.branchId : selectedBranch;
      const sessId = overrides?.sessionId !== undefined ? overrides.sessionId : selectedSession;
      const resType = overrides?.residencyType !== undefined ? overrides.residencyType : selectedResidency;
      const grpId = overrides?.groupId !== undefined ? overrides.groupId : selectedGroup;
      const profFilter = overrides?.professionalPhase !== undefined ? overrides.professionalPhase : selectedProfessionalFilter;
      const lkOnly = overrides?.linkedOnly !== undefined ? overrides.linkedOnly : linkedOnly;
      const qSearch = overrides?.search !== undefined ? overrides.search : searchQuery;

      let url = `${API_BASE}/student-master?tenant=${tenantSlug}`;
      if (qSearch) url += `&search=${encodeURIComponent(qSearch)}`;
      if (cId !== 'all') {
        const colgCode = targetCollege?.code || targetCollege?.colg_cd || cId;
        url += `&collegeId=${encodeURIComponent(colgCode)}`;
      }
      if (crsId !== 'all') {
        const crsObj = filterCourses.find(c => c.course_cd === crsId || c.code === crsId || c.id === crsId);
        url += `&courseId=${encodeURIComponent(crsObj?.course_cd || crsObj?.code || crsId)}`;
      }
      if (batId !== 'all') {
        const batObj = filterBatches.find(b => b.batch_cd === batId || b.code === batId || String(b.year) === batId || b.id === batId);
        url += `&batchId=${encodeURIComponent(batObj?.batch_cd || batObj?.code || batId)}`;
      }
      if (brId !== 'all') {
        const brObj = filterBranches.find(b => b.branch_cd === brId || b.code === brId || b.id === brId);
        url += `&branchId=${encodeURIComponent(brObj?.branch_cd || brObj?.code || brId)}`;
      }
      if (sessId !== 'all') {
        const sessObj = filterSessions.find(s => s.session_cd === sessId || s.code === sessId || s.name === sessId || s.id === sessId);
        url += `&sessionId=${encodeURIComponent(sessObj?.session_cd || sessObj?.code || sessId)}`;
      }
      if (resType !== 'all') url += `&residencyType=${encodeURIComponent(resType)}`;
      if (grpId !== 'all') url += `&groupId=${encodeURIComponent(grpId)}`;
      if (profFilter !== 'all') url += `&professionalPhase=${encodeURIComponent(profFilter)}`;
      if (lkOnly) url += `&linkedOnly=true`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await res.json();
      const list: Student[] = Array.isArray(result)
        ? result
        : Array.isArray(result?.data?.data)
          ? result.data.data
          : Array.isArray(result?.data)
            ? result.data
            : [];
      const seen = new Set<string>();
      const deduped = list.filter((s) => {
        const key = s.id || s.registration_no || s.rollno;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setStudents(deduped);
    } catch (err) {
      console.error('Failed to fetch students', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (studentId: string) => {
    try {
      const token = localStorage.getItem('token') || '';
      const tenantSlug = getActiveTenantSlug();
      const res = await fetch(`${API_BASE}/student-master/${studentId}?tenant=${tenantSlug}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.data) {
        const studentData = result.data;
        setFormData({
          ...studentData,
          declarationSigned: true, // Auto sign declaration for edit
        });
        // Load tenant data for the student's college
        const studentCollege = colleges.find((c) => c.id === studentData.collegeId);
        if (studentCollege?.slug) {
          const data = await loadTenantData(studentCollege.slug);
          setAllCourses(data.courses);
          setAllBatches(data.batches);
          setAllSessions(data.sessions);
          setAllBranches(data.branches);
          setAllProfessionals(data.professionals);
        }
        setEditModeId(studentId);
        setCurrentStep(1);
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to fetch student details for edit', err);
    }
  };

  const handleDelete = async (studentId: string) => {
    if (!window.confirm('Are you sure you want to delete this student record? This operation is irreversible.')) {
      return;
    }
    try {
      const token = localStorage.getItem('token') || '';
      const tenantSlug = getActiveTenantSlug();
      const res = await fetch(`${API_BASE}/student-master/${studentId}?tenant=${tenantSlug}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        alert('Student profile deleted successfully from database.');
        fetchStudents();
      } else {
        const json = await res.json();
        alert(json.message || 'Failed to delete student record.');
      }
    } catch (err) {
      console.error('Failed to delete student', err);
      alert('Network error while deleting student record.');
    }
  };

  const handleFormSubmit = async () => {
    if (!formData.declarationSigned) {
      alert('Please check the digital declaration box in Step 6 to confirm candidate details validation.');
      return;
    }

    try {
      const token = localStorage.getItem('token') || '';
      // Use the college slug from the form's selected college
      const formCollege = colleges.find((c) => c.id === formData.collegeId);
      const tenantSlug = formCollege?.slug || colleges[0]?.slug || 'srms-ims';
      const url = editModeId
        ? `${API_BASE}/student-master/${editModeId}?tenant=${tenantSlug}`
        : `${API_BASE}/student-master?tenant=${tenantSlug}`;

      const method = editModeId ? 'PUT' : 'POST';

      // Sanitize payload before submitting to satisfy class-validator constraints
      const payload: any = { ...formData };
      delete payload.declarationSigned;
      delete payload.id;

      // Fields that are strictly required (do not delete if empty)
      const mandatoryFields = [
        'collegeId',
        'collegeName',
        'courseId',
        'courseCode',
        'firstName',
        'lastName',
        'gender',
        'dob'
      ];

      // Delete optional fields if they are empty strings, null, or undefined so class-validator ignores them
      Object.keys(payload).forEach((key) => {
        if (!mandatoryFields.includes(key)) {
          if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
            delete payload[key];
          }
        }
      });

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok) {
        alert(editModeId ? 'Student profile updated successfully.' : 'Student registration completed successfully.');
        setIsModalOpen(false);
        setEditModeId(null);
        fetchStudents();
      } else {
        const errorDetail = Array.isArray(result.message) ? result.message.join(', ') : result.message;
        alert(`Error: ${errorDetail || 'Failed to save student profile.'}`);
      }
    } catch (err) {
      console.error('Failed to submit student form', err);
    }
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!formData.collegeId || !formData.courseId || !formData.sessionId || !formData.batchId || !formData.registrationNo) {
        alert('Please complete all academic enrollments, including Course, Session, Batch and generated Registration Number.');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.firstName || !formData.lastName || !formData.mobileNumber) {
        alert('First Name, Last Name and Mobile Number are required.');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 6));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleBulkLink = async () => {
    if (selectedStudentIds.length === 0) {
      alert('Please select at least one student from the table.');
      return;
    }
    if (!targetProfessionalId) {
      alert('Please select a target Professional Phase to link and promote.');
      return;
    }
    const prof = allProfessionals.find(p => p.id === targetProfessionalId);
    if (!prof) {
      alert('Target professional phase not found.');
      return;
    }
    const tenantSlug = getActiveTenantSlug();
    setIsLinking(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE}/student-master/bulk-link-phase?tenant=${tenantSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentIds: selectedStudentIds,
          professionalId: prof.id,
          professionalPhase: prof.name,
          batchId: selectedBatch !== 'all' ? selectedBatch : undefined,
          academicYear: new Date().getFullYear().toString(),
        }),
      });
      const result = await res.json();
      if (res.ok) {
        alert(`Successfully linked & promoted ${selectedStudentIds.length} students to "${prof.name}" in PostgreSQL!`);
        setSelectedStudentIds([]);
        fetchStudents();
      } else {
        alert(`Promotion failed: ${result.message || 'Server error'}`);
      }
    } catch (err) {
      console.error('Error during bulk linking:', err);
      alert('Network error occurred.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleBulkLinkGroup = async () => {
    if (selectedStudentIds.length === 0) {
      alert('Please select at least one student from the table.');
      return;
    }
    if (!targetGroupId) {
      alert('Please select an Academic Group (e.g. Group A, Group B) to assign.');
      return;
    }
    const grp = allGroups.find((g) => g.id === targetGroupId);
    if (!grp) {
      alert('Target academic group not found.');
      return;
    }
    const tenantSlug = getActiveTenantSlug();
    setIsGroupLinking(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE}/student-master/bulk-link-group?tenant=${tenantSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentIds: selectedStudentIds,
          groupId: grp.id,
          groupCode: grp.code,
          groupName: grp.name,
          batchId: selectedBatch !== 'all' ? selectedBatch : undefined,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        alert(`Successfully assigned ${selectedStudentIds.length} students to "Group ${grp.code} (${grp.name})"!`);
        setSelectedStudentIds([]);
        fetchStudents();
      } else {
        alert(result.message || 'Failed to assign students to group.');
      }
    } catch (err) {
      console.error('Failed to link group', err);
      alert('Network error while linking group.');
    } finally {
      setIsGroupLinking(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQ =
          (st.name || '').toLowerCase().includes(q) ||
          (st.rollno || '').toLowerCase().includes(q) ||
          (st.registration_no || '').toLowerCase().includes(q);
        if (!matchesQ) return false;
      }

      // 2. Course Filter
      if (selectedCourse !== 'all') {
        const crsObj = filterCourses.find((c) => c.id === selectedCourse);
        const matchCode = (crsObj?.code || '').toLowerCase();
        const matchName = (crsObj?.name || '').toLowerCase();
        const stCourse = (st.course_code || '').toLowerCase();
        if (
          matchCode &&
          !stCourse.includes(matchCode) &&
          !matchName.includes(stCourse) &&
          st.course_code !== selectedCourse &&
          st.course_code !== crsObj?.code
        ) {
          return false;
        }
      }

      // 3. Batch Filter
      if (selectedBatch !== 'all') {
        const batObj = filterBatches.find((b) => b.id === selectedBatch);
        const matchBatCode = (batObj?.code || '').toLowerCase();
        const matchBatYear = String(batObj?.year || '');
        const stBatch = (st.batch_code || '').toLowerCase();
        if (
          matchBatCode &&
          !stBatch.includes(matchBatCode) &&
          !stBatch.includes(matchBatYear) &&
          st.batch_code !== selectedBatch &&
          st.batch_id !== selectedBatch &&
          st.batch_code !== batObj?.code
        ) {
          return false;
        }
      }

      // 4. Branch Filter
      if (selectedBranch !== 'all') {
        const brObj = filterBranches.find((b) => b.id === selectedBranch);
        const matchBrCode = (brObj?.code || '').toLowerCase();
        const stBranch = (st.branch_code || '').toLowerCase();
        if (
          matchBrCode &&
          !stBranch.includes(matchBrCode) &&
          st.branch_code !== selectedBranch &&
          st.branch_code !== brObj?.code
        ) {
          return false;
        }
      }

      // 5. Session Filter
      if (selectedSession !== 'all') {
        const sessObj = filterSessions.find((s) => s.id === selectedSession);
        const matchSess = (sessObj?.name || '').toLowerCase();
        const stSess = (st.academic_session || '').toLowerCase();
        if (matchSess && !stSess.includes(matchSess) && st.academic_session !== selectedSession) {
          return false;
        }
      }

      // 6. Residency Filter
      if (selectedResidency !== 'all' && st.residency_type !== selectedResidency) {
        return false;
      }

      // 7. Group Filter
      if (selectedGroup !== 'all' && st.group_id !== selectedGroup && st.group_code !== selectedGroup) {
        return false;
      }

      // 8. Prof Phase Filter
      if (selectedProfessionalFilter !== 'all') {
        const stPhase = (st.professional_phase || '').toLowerCase();
        const filterPhase = selectedProfessionalFilter.toLowerCase();
        if (!stPhase.includes(filterPhase)) {
          return false;
        }
      }

      // 9. Linked Only
      if (linkedOnly && (!st.professional_phase || !st.professional_id)) {
        return false;
      }

      return true;
    });
  }, [
    students,
    searchQuery,
    selectedCourse,
    selectedBatch,
    selectedBranch,
    selectedSession,
    selectedResidency,
    selectedGroup,
    selectedProfessionalFilter,
    linkedOnly,
    filterCourses,
    filterBatches,
    filterBranches,
    filterSessions,
  ]);

  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role="admin" />
      <main className="flex-1 overflow-y-auto pb-10">
        <Header title="Student Master" />

        <div className="w-full px-4 sm:px-6 lg:px-8 mt-6">
          {/* Filtering Console */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1 shadow-md hover:shadow-lg transition-all mb-8">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-ink-500)] mb-4 flex items-center justify-between">
              <span>Search & Query Console</span>
              <span className="text-[10px] font-bold text-[var(--color-primary-700)] normal-case">
                Showing {filteredStudents.length} of {students.length} Total Loaded Students
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
              {/* 1. Search Query */}
              <div>
                <label className="block text-[10px] font-bold text-[var(--color-ink-500)] uppercase tracking-wider mb-1.5">Search Query</label>
                <input
                  type="text"
                  placeholder="Name, Reg, Roll..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="premium-input w-full !h-8 !py-1 !px-2.5 !text-[11px]"
                />
              </div>

              {/* 2. College */}
              <div>
                <label className="block text-[10px] font-bold text-[var(--color-ink-500)] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>College</span>
                  {(typeof window !== 'undefined' && localStorage.getItem('role') !== 'SUPER_ADMIN') && (
                    <span className="text-[9px] text-[#5B4BFF] font-black uppercase tracking-widest">Locked</span>
                  )}
                </label>
                <select
                  value={selectedCollege}
                  onChange={(e) => handleFilterCollegeChange(e.target.value)}
                  disabled={typeof window !== 'undefined' && localStorage.getItem('role') !== 'SUPER_ADMIN'}
                  className="premium-input w-full disabled:opacity-75 disabled:cursor-not-allowed !h-8 !py-1 !px-2.5 !text-[11px] font-bold"
                >
                  {(typeof window !== 'undefined' && localStorage.getItem('role') === 'SUPER_ADMIN') && (
                    <option value="all">All Colleges</option>
                  )}
                  {colleges.map((c) => {
                    const val = c.code || c.colg_cd || c.slug || c.id;
                    return (
                      <option key={c.id || val} value={val}>[#{c.code || c.colg_cd || '1'}] {c.name}</option>
                    );
                  })}
                </select>
              </div>

              {/* 3. Course */}
              <div>
                <label className="block text-[10px] font-bold text-[var(--color-ink-500)] uppercase tracking-wider mb-1.5">Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => handleFilterCourseChange(e.target.value)}
                  disabled={selectedCollege === 'all'}
                  className="premium-input w-full disabled:opacity-50 !h-8 !py-1 !px-2.5 !text-[11px] font-bold"
                >
                  <option value="all">All Courses ({filterCourses.length})</option>
                  {filterCourses.map((c) => {
                    const val = c.course_cd || c.code;
                    return (
                      <option key={c.id || val} value={val}>[#{val}] {c.name}</option>
                    );
                  })}
                </select>
              </div>

              {/* 4. Branch / Dept */}
              <div>
                <label className="block text-[10px] font-bold text-[var(--color-ink-500)] uppercase tracking-wider mb-1.5">Branch / Dept</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedBranch(val);
                    fetchStudents({ branchId: val });
                  }}
                  disabled={selectedCollege === 'all'}
                  className="premium-input w-full disabled:opacity-50 !h-8 !py-1 !px-2.5 !text-[11px]"
                >
                  <option value="all">All Branches ({filterBranches.length})</option>
                  {filterBranches.map((b) => {
                    const val = b.branch_cd || b.code;
                    return (
                      <option key={b.id || val} value={val}>[#{val}] {b.name}</option>
                    );
                  })}
                </select>
              </div>

              {/* 5. Batch */}
              <div>
                <label className="block text-[10px] font-bold text-[var(--color-ink-500)] uppercase tracking-wider mb-1.5">Batch</label>
                <select
                  value={selectedBatch}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedBatch(val);
                    fetchStudents({ batchId: val });
                  }}
                  disabled={selectedCollege === 'all'}
                  className="premium-input w-full disabled:opacity-50 !h-8 !py-1 !px-2.5 !text-[11px] font-bold"
                >
                  <option value="all">All Batches ({displayedFilterBatches.length})</option>
                  {displayedFilterBatches.map((b) => {
                    const val = b.batch_cd || b.code || String(b.year);
                    return (
                      <option key={b.id || val} value={val}>[#{val}] {b.code} ({b.year})</option>
                    );
                  })}
                </select>
              </div>

              {/* 6. Session */}
              <div>
                <label className="block text-[10px] font-bold text-[var(--color-ink-500)] uppercase tracking-wider mb-1.5">Session</label>
                <select
                  id="ddl_session"
                  value={selectedSession}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedSession(val);
                    fetchStudents({ sessionId: val });
                  }}
                  disabled={selectedCollege === 'all'}
                  className="premium-input w-full disabled:opacity-50 !h-8 !py-1 !px-2.5 !text-[11px]"
                >
                  <option value="all">All Sessions</option>
                  {filterSessions.map((s) => {
                    const val = s.session_cd || s.code || s.name;
                    return (
                      <option key={s.id || val} value={val}>[#{val}] {s.name || s.session_name}</option>
                    );
                  })}
                </select>
              </div>

              {/* 7. Residency */}
              <div>
                <label className="block text-[10px] font-bold text-[var(--color-ink-500)] uppercase tracking-wider mb-1.5">Residency</label>
                <select
                  value={selectedResidency}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedResidency(val);
                    fetchStudents({ residencyType: val });
                  }}
                  className="premium-input w-full !h-8 !py-1 !px-2.5 !text-[11px]"
                >
                  <option value="all">All Types</option>
                  <option value="Hosteller">Hosteller</option>
                  <option value="Day Scholar">Day Scholar</option>
                  <option value="Resident">Resident</option>
                </select>
              </div>

              {/* 8. Group */}
              <div>
                <label className="block text-[10px] font-bold text-[var(--color-ink-500)] uppercase tracking-wider mb-1.5">Group</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedGroup(val);
                    fetchStudents({ groupId: val });
                  }}
                  className="premium-input w-full !h-8 !py-1 !px-2.5 !text-[11px]"
                >
                  <option value="all">All Groups</option>
                  {allGroups.map((g) => (
                    <option key={g.id} value={g.id}>Group {g.code} ({g.name})</option>
                  ))}
                </select>
              </div>

              {/* 9. Prof Phase */}
              <div>
                <label className="block text-[10px] font-bold text-[var(--color-ink-500)] uppercase tracking-wider mb-1.5">Prof Phase</label>
                <select
                  value={selectedProfessionalFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedProfessionalFilter(val);
                    fetchStudents({ professionalPhase: val });
                  }}
                  className="premium-input w-full !h-8 !py-1 !px-2.5 !text-[11px]"
                >
                  <option value="all">All Phases</option>
                  {allProfessionals.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Linked Only toggle + view mode + action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-[var(--color-border)]">
              {/* Left: Linked Only toggle & View Mode */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const next = !linkedOnly;
                    setLinkedOnly(next);
                    fetchStudents({ linkedOnly: next });
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold text-[11px] transition-all ${linkedOnly
                    ? 'bg-[var(--color-primary-700)] text-white border-[var(--color-primary-700)] shadow-sm'
                    : 'bg-[var(--color-bg-surface)] text-[var(--color-ink-700)] border-[var(--color-border)] hover:border-[var(--color-primary-700)] hover:text-[var(--color-primary-700)]'
                    }`}
                >
                  <span className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-all ${linkedOnly ? 'bg-white border-white' : 'border-[var(--color-ink-500)]'
                    }`}>
                    {linkedOnly && (
                      <svg className="w-2.5 h-2.5 text-[var(--color-primary-700)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  Linked Phase Students Only
                  {linkedOnly && (
                    <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">ACTIVE</span>
                  )}
                </button>

                <div className="bg-[var(--color-bg-sunken)] p-1 rounded-xl flex items-center border border-[var(--color-border)] gap-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('roster')}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${viewMode === 'roster'
                      ? 'bg-[var(--color-primary-700)] text-white shadow-sm border-[var(--color-primary-700)]'
                      : 'text-[var(--color-ink-700)] hover:text-[var(--color-ink-900)] hover:bg-[var(--color-primary-100)]'
                      }`}
                  >
                    📋 Roster View
                  </button>
                  <button
                    type="button"
                    onClick={() => { setViewMode('linker'); setLinkerMode('phase'); }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${viewMode === 'linker' && linkerMode === 'phase'
                      ? 'bg-[var(--color-primary-700)] text-white shadow-sm border-[var(--color-primary-700)]'
                      : 'text-[var(--color-ink-700)] hover:text-[var(--color-ink-900)] hover:bg-[var(--color-primary-100)]'
                      }`}
                  >
                    🎓 Batch Phase Linker
                  </button>
                  <button
                    type="button"
                    onClick={() => { setViewMode('linker'); setLinkerMode('group'); }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${viewMode === 'linker' && linkerMode === 'group'
                      ? 'bg-purple-700 text-white shadow-sm border-purple-700'
                      : 'text-[var(--color-ink-700)] hover:text-[var(--color-ink-900)] hover:bg-purple-100 dark:hover:bg-purple-900/40'
                      }`}
                  >
                    👥 Batch Group Linker
                  </button>
                </div>
              </div>

              {/* Right: Reset / Apply / Register */}
              <div className="flex items-center gap-2">
                {metadataLoading && (
                  <span className="flex items-center gap-1.5 text-[10px] text-[var(--color-primary-700)] font-semibold mr-2">
                    <span className="w-3 h-3 border-2 border-[var(--color-primary-700)] border-t-transparent rounded-full animate-spin inline-block" />
                    Loading tenant...
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCollege('all');
                    setSelectedCourse('all');
                    setSelectedBranch('all');
                    setSelectedBatch('all');
                    setSelectedSession('all');
                    setSelectedResidency('all');
                    setSelectedGroup('all');
                    setSelectedProfessionalFilter('all');
                    setLinkedOnly(false);
                    setFilterCourses([]);
                    setFilterBatches([]);
                    setFilterBranches([]);
                    setFilterSessions([]);
                    fetchStudents({
                      collegeId: 'all',
                      courseId: 'all',
                      batchId: 'all',
                      branchId: 'all',
                      sessionId: 'all',
                      residencyType: 'all',
                      groupId: 'all',
                      professionalPhase: 'all',
                      linkedOnly: false,
                      search: '',
                    });
                  }}
                  className="premium-btn-secondary py-1.5 px-3 rounded-lg font-bold text-[11px] border border-[var(--color-border)] text-[var(--color-ink-700)] hover:border-[var(--color-primary-700)] hover:text-[var(--color-primary-700)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-primary-50)] transition-all"
                >
                  Reset Filters
                </button>
                <button
                  type="button"
                  onClick={() => fetchStudents()}
                  className="premium-btn-primary py-1.5 px-3 rounded-lg font-bold text-[11px] bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-900)] text-white border-[var(--color-primary-700)] shadow-sm transition-all"
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditModeId(null);
                    setFormData((prev) => ({
                      ...prev,
                      firstName: '',
                      middleName: '',
                      lastName: '',
                      registrationNo: '',
                      rollNo: '',
                      mobileNumber: '',
                      emailAddress: '',
                      declarationSigned: false,
                    }));
                    setCurrentStep(1);
                    setIsModalOpen(true);
                  }}
                  className="premium-btn-primary py-1.5 px-3 rounded-lg font-bold text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm flex items-center gap-1 shrink-0 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  Register Student
                </button>
              </div>
            </div>
          </div>

          {/* Batch Phase / Group Linker Action Bar */}
          {viewMode === 'linker' && (
            <div className="bg-gradient-to-r from-slate-900/90 via-indigo-950/90 to-slate-900/90 border-2 border-indigo-500/40 p-6 rounded-2xl mb-8 shadow-2xl backdrop-blur-md">
              {/* Inner Mode Switcher Tabs */}
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-700/50">
                <button
                  onClick={() => setLinkerMode('phase')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${linkerMode === 'phase'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                >
                  <span>🎓</span> Professional Phase Promotion
                </button>
                <button
                  onClick={() => setLinkerMode('group')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${linkerMode === 'group'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                >
                  <span>👥</span> Academic Group Allocation
                </button>
              </div>

              {linkerMode === 'phase' ? (
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div>
                    <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                      <span className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30 text-indigo-400">⚡</span>
                      Batch-wise Professional Phase Linker & Promotion Engine
                    </h3>
                    <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
                      Filter by a specific batch above, click <b>Select All</b>, choose the required Professional Phase (e.g., <i>Prof 1, Prof 2, Prof 3 Part 1</i>), and save. When advancing academic years, re-filter the batch already linked with Prof 1 and promote them to Prof 2 in PostgreSQL.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    <button
                      onClick={() => {
                        if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
                          setSelectedStudentIds([]);
                        } else {
                          setSelectedStudentIds(filteredStudents.map(s => s.id));
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-xs text-white transition-all whitespace-nowrap flex items-center justify-center gap-2 shadow-sm"
                    >
                      <input
                        type="checkbox"
                        checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                        readOnly
                        className="rounded border-slate-600 bg-slate-900 text-indigo-600 pointer-events-none w-3.5 h-3.5"
                      />
                      <span>{selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? 'Deselect All' : 'Select All Batch'} ({selectedStudentIds.length})</span>
                    </button>

                    <select
                      value={targetProfessionalId}
                      onChange={(e) => setTargetProfessionalId(e.target.value)}
                      className="bg-slate-900 border-2 border-indigo-500/80 hover:border-indigo-400 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all flex-1 sm:w-64"
                    >
                      <option value="" disabled>Select Target Professional Phase...</option>
                      {allProfessionals.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleBulkLink}
                      disabled={isLinking || selectedStudentIds.length === 0 || !targetProfessionalId}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:pointer-events-none font-black text-xs text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 transition-all flex items-center justify-center gap-2 whitespace-nowrap border border-indigo-400/30"
                    >
                      {isLinking ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>Promoting Batch...</span>
                        </>
                      ) : (
                        <>
                          <span>💾</span> Save & Activate Phase
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div>
                    <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                      <span className="p-2 bg-purple-500/20 rounded-xl border border-purple-500/30 text-purple-400">👥</span>
                      Batch-wise Academic Group Linker & Allocation Engine
                    </h3>
                    <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
                      Filter students by batch or course, select students using checkboxes (e.g. <b>Group A</b> first 50 students, <b>Group B</b> next 50 students), choose the Academic Group from Group Master, and click <b>Save & Assign Group</b>.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    <button
                      onClick={() => {
                        if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
                          setSelectedStudentIds([]);
                        } else {
                          setSelectedStudentIds(filteredStudents.map(s => s.id));
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-xs text-white transition-all whitespace-nowrap flex items-center justify-center gap-2 shadow-sm"
                    >
                      <input
                        type="checkbox"
                        checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                        readOnly
                        className="rounded border-slate-600 bg-slate-900 text-purple-600 pointer-events-none w-3.5 h-3.5"
                      />
                      <span>{selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? 'Deselect All' : 'Select Batch Students'} ({selectedStudentIds.length})</span>
                    </button>

                    <select
                      value={targetGroupId}
                      onChange={(e) => setTargetGroupId(e.target.value)}
                      className="bg-slate-900 border-2 border-purple-500/80 hover:border-purple-400 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all flex-1 sm:w-64"
                    >
                      <option value="" disabled>Select Target Academic Group...</option>
                      {allGroups.map((g) => (
                        <option key={g.id} value={g.id}>Group {g.code} ({g.name})</option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleBulkLinkGroup}
                      disabled={isGroupLinking || selectedStudentIds.length === 0 || !targetGroupId}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 disabled:opacity-50 disabled:pointer-events-none font-black text-xs text-white shadow-lg shadow-purple-600/30 hover:shadow-purple-500/50 transition-all flex items-center justify-center gap-2 whitespace-nowrap border border-purple-400/30"
                    >
                      {isGroupLinking ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>Assigning Group...</span>
                        </>
                      ) : (
                        <>
                          <span>👥</span> Save & Assign Group
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Directory DataTable */}
          <div className="premium-table-wrapper">
            <div className="overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr>
                    {viewMode === 'linker' && (
                      <th className="pl-5 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedStudentIds(filteredStudents.map(s => s.id));
                            else setSelectedStudentIds([]);
                          }}
                          className="rounded border-[var(--color-border)] bg-[var(--color-bg-sunken)] text-[var(--color-primary-700)] focus:ring-[var(--color-primary-700)] w-4 h-4 cursor-pointer"
                        />
                      </th>
                    )}
                    <th className={viewMode === 'linker' ? 'w-12' : 'pl-5 w-12'}>Photo</th>
                    <th>Reg No</th>
                    <th>Roll No</th>
                    <th>Name</th>
                    <th>College</th>
                    <th>Course / Batch</th>
                    <th>Session</th>
                    <th>Residency</th>
                    <th>Quota</th>
                    <th>Status</th>
                    <th className="pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-xs font-medium">
                  {loading ? (
                    <TableSkeleton colCount={viewMode === 'linker' ? 12 : 11} />
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={viewMode === 'linker' ? 12 : 11} className="p-12 text-center text-slate-500 font-medium">
                        <div className="max-w-md mx-auto space-y-3">
                          <span className="text-3xl">👥</span>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">No Registered Students Found</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            No students match the current filter selection ({selectedCollege !== 'all' ? (colleges.find(c => c.id === selectedCollege || c.slug === selectedCollege)?.name || selectedCollege) : 'All Colleges'}
                            {selectedCourse !== 'all' ? ` • ${filterCourses.find(c => c.id === selectedCourse)?.name || selectedCourse}` : ''}
                            {selectedBranch !== 'all' ? ` • ${filterBranches.find(b => b.id === selectedBranch)?.name || selectedBranch}` : ''}
                            {selectedBatch !== 'all' ? ` • Batch ${filterBatches.find(b => b.id === selectedBatch)?.code || selectedBatch}` : ''}).
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setEditModeId(null);
                              setFormData((prev) => ({
                                ...prev,
                                firstName: '',
                                middleName: '',
                                lastName: '',
                                registrationNo: '',
                                rollNo: '',
                                mobileNumber: '',
                                emailAddress: '',
                                declarationSigned: false,
                              }));
                              setCurrentStep(1);
                              setIsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-primary-700)] text-white text-xs font-bold shadow hover:bg-[var(--color-primary-800)]"
                          >
                            + Register Student Under This Selection
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((student) => (
                      <tr key={student.id} className="transition-colors">
                        {viewMode === 'linker' && (
                          <td className="pl-5 text-center">
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.includes(student.id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedStudentIds(prev => [...prev, student.id]);
                                else setSelectedStudentIds(prev => prev.filter(id => id !== student.id));
                              }}
                              className="rounded border-[var(--color-border)] bg-[var(--color-bg-sunken)] text-[var(--color-primary-700)] focus:ring-[var(--color-primary-700)] w-4 h-4 cursor-pointer"
                            />
                          </td>
                        )}
                        <td className={viewMode === 'linker' ? '' : 'pl-5'}>
                          {student.photo_url ? (
                            <img
                              src={student.photo_url}
                              alt={student.name}
                              loading="lazy"
                              className="w-8 h-8 rounded-full object-cover border border-[var(--color-border)]"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                                const fb = (e.target as HTMLElement).parentElement?.querySelector('.avatar-fallback') as HTMLElement;
                                if (fb) fb.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-8 h-8 rounded-full bg-[var(--color-primary-700)] text-white flex items-center justify-center text-[10px] font-extrabold avatar-fallback ${student.photo_url ? 'hidden' : ''}`}
                          >
                            {student.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        </td>
                        <td className="font-extrabold text-[var(--color-primary-700)] font-mono">{student.registration_no}</td>
                        <td className="font-mono text-[var(--color-ink-700)]">{student.rollno || '—'}</td>
                        <td className="font-bold text-[var(--color-ink-900)]">{student.name}</td>
                        <td className="text-[var(--color-ink-700)]">{student.college_name || '—'}</td>
                        <td>
                          <div className="font-bold text-[var(--color-ink-900)]">{student.course_code}</div>
                          <div className="text-[10px] text-[var(--color-ink-500)] block font-mono">{student.batch_code}</div>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {student.professional_phase && (
                              <span className="premium-badge bg-[var(--color-primary-100)] text-[var(--color-primary-700)] inline-block">
                                {student.professional_phase.match(/^(1st|2nd|3rd|4th|5th)/i) ? `${student.professional_phase.match(/^(1st|2nd|3rd|4th|5th)/i)?.[0]} Prof` : student.professional_phase}
                              </span>
                            )}
                            {student.group_code && (
                              <span className="premium-badge bg-purple-500/20 text-purple-700 dark:text-purple-300 inline-block border border-purple-400/30 font-bold">
                                👥 Group {student.group_code}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="font-mono text-[var(--color-ink-700)]">{student.academic_session ? student.academic_session.split(' ')[0] : '—'}</td>
                        <td>
                          <span className={`premium-badge ${student.residency_type === 'Hosteller'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : student.residency_type === 'Resident'
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                              : 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
                            }`}>
                            {student.residency_type || 'Day Scholar'}
                          </span>
                        </td>
                        <td className="text-[var(--color-ink-500)] font-mono text-[10px]">{student.admission_type || '—'}</td>
                        <td>
                          <span className={`premium-badge ${student.is_active
                            ? 'bg-[var(--color-success-tint)] text-[var(--color-success)] border border-[var(--color-success)]/10'
                            : 'bg-[var(--color-danger-tint)] text-[var(--color-danger)] border border-[var(--color-danger)]/10'
                            }`}>
                            {student.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="pr-5 text-right whitespace-nowrap">
                          <ActionButtons
                            onView={() => handleViewStudent(student.id)}
                            onEdit={() => handleEdit(student.id)}
                            onDelete={() => handleDelete(student.id)}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            {totalItems > 0 && (
              <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-sunken)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-[var(--color-ink-700)]">
                <div>
                  Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} of {totalItems} records
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 rounded bg-[var(--color-bg-surface)] hover:bg-[var(--color-primary-100)] text-[var(--color-primary-700)] border border-[var(--color-border)] disabled:opacity-50 disabled:hover:bg-[var(--color-bg-surface)] transition-all font-bold"
                  >
                    ← Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => (
                      <button
                        key={pg}
                        type="button"
                        onClick={() => setCurrentPage(pg)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${currentPage === pg
                          ? 'bg-[var(--color-accent-brass)] text-white font-bold'
                          : 'hover:bg-[var(--color-primary-100)] text-[var(--color-ink-700)] hover:text-[var(--color-primary-700)]'
                          }`}
                      >
                        {pg}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 rounded bg-[var(--color-bg-surface)] hover:bg-[var(--color-primary-100)] text-[var(--color-primary-700)] border border-[var(--color-border)] disabled:opacity-50 disabled:hover:bg-[var(--color-bg-surface)] transition-all font-bold"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 6-Step Progressive Wizard Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-3xl w-full max-w-4xl p-6 md:p-8 max-h-[90vh] overflow-y-auto flex flex-col justify-between shadow-2xl glass-card">
            {/* Stepper Progress Bar */}
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-slate-300 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {editModeId ? 'Edit Student Profile' : 'Engineering Student Registration'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Step {currentStep} of 6 — {
                      currentStep === 1 ? 'Academic & College Enrollment' :
                        currentStep === 2 ? 'Personal Details' :
                          currentStep === 3 ? 'Guardian & Addresses' :
                            currentStep === 4 ? 'NEET & Educational Qualifications' :
                              currentStep === 5 ? 'Hostel, Transport & Bank Details' :
                                'Medical Fitness & Digital Declaration'
                    }
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-200 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
                  aria-label="Close modal"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>

              {/* Stepper Wizard Indicator */}
              <div className="flex items-center justify-between w-full max-w-2xl mx-auto mb-8 px-4">
                {[1, 2, 3, 4, 5, 6].map((step, idx) => (
                  <div key={step} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentStep === step
                        ? 'bg-indigo-600 text-slate-900 dark:text-white ring-4 ring-indigo-500/30'
                        : currentStep > step
                          ? 'bg-emerald-500 text-slate-900 dark:text-white font-black'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}>
                        {currentStep > step ? 'âœ“' : step}
                      </div>
                    </div>
                    {idx < 5 && (
                      <div className={`flex-1 h-0.5 mx-2 transition-all ${currentStep > step ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                        }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step Forms */}
              <div className="space-y-6 min-h-[40vh]">
                {/* STEP 1: Academic & College Enrollment */}
                {currentStep === 1 && (
                  metadataLoading ? (
                    <FormSkeleton />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">College Name *</label>
                        <select
                          value={formData.collegeId}
                          onChange={(e) => handleCollegeChange(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors"
                        >
                          <option value="">Select College</option>
                          {colleges.map((c) => (
                            <option key={c.id} value={c.code}>[#{c.code || '1'}] {c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Course *</label>
                        <select
                          value={formData.courseId}
                          onChange={(e) => handleCourseChange(e.target.value)}
                          disabled={!formData.collegeId || metadataLoading}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors disabled:opacity-50"
                        >
                          <option value="">{metadataLoading ? 'Loading courses...' : 'Select Course'}</option>
                          {filteredCourses.map((c) => (
                            <option key={c.id} value={c.course_cd || c.code}>[#{c.course_cd || c.code}] {c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Academic Session *</label>
                        <select
                          value={formData.sessionId}
                          onChange={(e) => handleSessionChange(e.target.value)}
                          disabled={!formData.collegeId || metadataLoading}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors disabled:opacity-50"
                        >
                          <option value="">{metadataLoading ? 'Loading sessions...' : 'Select Academic Session'}</option>
                          {filteredSessions.map((s) => {
                            const val = s.session_cd || s.code || s.name;
                            return (
                              <option key={s.id || val} value={val}>[#{val}] {s.name || s.session_name}</option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Batch *</label>
                        <select
                          value={formData.batchId}
                          onChange={(e) => handleBatchChange(e.target.value)}
                          disabled={!formData.courseId || metadataLoading}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors disabled:opacity-50"
                        >
                          <option value="">{metadataLoading ? 'Loading batches...' : (!formData.courseId ? 'Select Course First' : 'Select Batch')}</option>
                          {filteredBatches.map((b) => {
                            const val = b.batch_cd || b.code || String(b.year);
                            return (
                              <option key={b.id || val} value={val}>[#{val}] {b.code} ({b.year})</option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Branch / Department</label>
                        <select
                          value={formData.branchId}
                          onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                          disabled={!formData.collegeId || metadataLoading}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors disabled:opacity-50"
                        >
                          <option value="">{metadataLoading ? 'Loading branches...' : 'Select Branch (Optional)'}</option>
                          {filteredBranches.map((b) => {
                            const val = b.branch_cd || b.code;
                            return (
                              <option key={b.id || val} value={val}>[#{val}] {b.name}</option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Professional Phase</label>
                        <select
                          value={formData.professionalPhase}
                          onChange={(e) => setFormData({ ...formData, professionalPhase: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors"
                        >
                          <option value="1st Professional MBBS (Phase I)">1st Professional MBBS (Phase I)</option>
                          <option value="2nd Professional MBBS (Phase II)">2nd Professional MBBS (Phase II)</option>
                          <option value="3rd Professional MBBS Part I (Phase III-1)">3rd Professional MBBS Part I (Phase III-1)</option>
                          <option value="4th Professional MBBS Part II (Phase III-2)">4th Professional MBBS Part II (Phase III-2)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Residency Category *</label>
                        <select
                          value={formData.residencyType}
                          onChange={(e) => setFormData({ ...formData, residencyType: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors"
                        >
                          <option value="Hosteller">Hosteller</option>
                          <option value="Day Scholar">Day Scholar</option>
                          <option value="Resident">Resident</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Admission Quota</label>
                        <select
                          value={formData.admissionType}
                          onChange={(e) => setFormData({ ...formData, admissionType: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors"
                        >
                          <option value="Government Quota">Government Quota</option>
                          <option value="Management Quota">Management Quota</option>
                          <option value="NRI Quota">NRI Quota</option>
                          <option value="AIQ">All India Quota (AIQ)</option>
                          <option value="State Quota">State Quota</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Registration Number *</label>
                        <input
                          type="text"
                          disabled
                          value={formData.registrationNo}
                          placeholder="Auto-generated based on Session"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 focus:outline-none cursor-not-allowed font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Roll Number (Optional for new entry)</label>
                        <input
                          type="number"
                          value={formData.rollNo}
                          onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                          placeholder="Assign roll number (numeric)"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors font-mono"
                        />
                      </div>
                    </div>
                  )
                )}

                {/* STEP 2: Personal Information */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    {/* Photo Upload */}
                    <div className="flex items-center gap-6 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                      <div className="relative flex-shrink-0">
                        {formData.photoUrl ? (
                          <img
                            src={formData.photoUrl}
                            alt="Student Photo"
                            className="w-24 h-28 rounded-xl object-cover border-2 border-indigo-500 shadow-lg shadow-indigo-500/20"
                          />
                        ) : (
                          <div className="w-24 h-28 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-dashed border-slate-600 flex flex-col items-center justify-center gap-2">
                            <span className="text-3xl">ðŸ“·</span>
                            <span className="text-[9px] text-slate-500 uppercase font-bold">No Photo</span>
                          </div>
                        )}
                        {formData.photoUrl && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, photoUrl: '' })}
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center shadow"
                          >âœ•</button>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white mb-1 uppercase tracking-wider">Student Passport Photo</h4>
                        <p className="text-[10px] text-slate-500 mb-3">Upload a recent passport-size photo (JPG/PNG, max 2MB). This will appear on the student ID card and printed profile.</p>
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-all shadow">
                          ðŸ“ Choose Photo
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 2 * 1024 * 1024) { alert('Photo must be under 2MB'); return; }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFormData({ ...formData, photoUrl: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">First Name *</label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          placeholder="Rahul"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Middle Name</label>
                        <input
                          type="text"
                          value={formData.middleName}
                          onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                          placeholder="Kumar"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Last Name *</label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          placeholder="Sharma"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Gender</label>
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Date of Birth</label>
                        <input
                          type="date"
                          value={formData.dob}
                          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Blood Group</label>
                        <select
                          value={formData.bloodGroup}
                          onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors"
                        >
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Aadhaar Number (12 digits)</label>
                        <input
                          type="text"
                          maxLength={12}
                          value={formData.aadhaarNo}
                          onChange={(e) => setFormData({ ...formData, aadhaarNo: e.target.value })}
                          placeholder="123456789012"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">PAN Number (Optional)</label>
                        <input
                          type="text"
                          value={formData.panNo}
                          onChange={(e) => setFormData({ ...formData, panNo: e.target.value.toUpperCase() })}
                          placeholder="ABCDE1234F"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Mobile Number *</label>
                        <input
                          type="text"
                          value={formData.mobileNumber}
                          onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                          placeholder="9876543210"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors font-mono"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                        <input
                          type="email"
                          value={formData.emailAddress}
                          onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                          placeholder="rahul.sharma@mederp.edu"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Parents & Address */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Father's Name</label>
                        <input
                          type="text"
                          value={formData.fatherName}
                          onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                          placeholder="Rakesh Sharma"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Father's Occupation</label>
                        <input
                          type="text"
                          value={formData.fatherOccupation}
                          onChange={(e) => setFormData({ ...formData, fatherOccupation: e.target.value })}
                          placeholder="Doctor"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Father's Mobile</label>
                        <input
                          type="text"
                          value={formData.fatherMobile}
                          onChange={(e) => setFormData({ ...formData, fatherMobile: e.target.value })}
                          placeholder="9876543211"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Mother's Name</label>
                        <input
                          type="text"
                          value={formData.motherName}
                          onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                          placeholder="Sunita Sharma"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Mother's Occupation</label>
                        <input
                          type="text"
                          value={formData.motherOccupation}
                          onChange={(e) => setFormData({ ...formData, motherOccupation: e.target.value })}
                          placeholder="Professor"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Annual Family Income (INR)</label>
                        <input
                          type="number"
                          value={formData.annualIncome}
                          onChange={(e) => setFormData({ ...formData, annualIncome: Number(e.target.value) })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors font-mono"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-300/40 dark:border-slate-300 dark:border-slate-800/40 pt-4">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Permanent Address</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Address Line 1</label>
                          <input
                            type="text"
                            value={formData.permanentAddress1}
                            onChange={(e) => setFormData({ ...formData, permanentAddress1: e.target.value })}
                            placeholder="123 Civil Lines"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Address Line 2 (Optional)</label>
                          <input
                            type="text"
                            value={formData.permanentAddress2}
                            onChange={(e) => setFormData({ ...formData, permanentAddress2: e.target.value })}
                            placeholder="Near Central Park"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">City</label>
                          <input
                            type="text"
                            value={formData.permanentCity}
                            onChange={(e) => setFormData({ ...formData, permanentCity: e.target.value })}
                            placeholder="Bareilly"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">State</label>
                          <input
                            type="text"
                            value={formData.permanentState}
                            onChange={(e) => setFormData({ ...formData, permanentState: e.target.value })}
                            placeholder="Uttar Pradesh"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Pincode</label>
                          <input
                            type="text"
                            value={formData.permanentPincode}
                            onChange={(e) => setFormData({ ...formData, permanentPincode: e.target.value })}
                            placeholder="243001"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Educational & NEET Qualification */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Class 10 Qualifications</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Board</label>
                            <input
                              type="text"
                              value={formData.class10Board}
                              onChange={(e) => setFormData({ ...formData, class10Board: e.target.value })}
                              placeholder="CBSE / ICSE / UP Board"
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Percentage Obtained</label>
                            <input
                              type="number"
                              value={formData.class10Pct}
                              onChange={(e) => setFormData({ ...formData, class10Pct: Number(e.target.value) })}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Class 12 Marks Checklist</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Physics (%)</label>
                            <input
                              type="number"
                              value={formData.class12Physics}
                              onChange={(e) => setFormData({ ...formData, class12Physics: Number(e.target.value) })}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Chemistry (%)</label>
                            <input
                              type="number"
                              value={formData.class12Chemistry}
                              onChange={(e) => setFormData({ ...formData, class12Chemistry: Number(e.target.value) })}
                              className="w-full bg-slate-955 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Biology (%)</label>
                            <input
                              type="number"
                              value={formData.class12Biology}
                              onChange={(e) => setFormData({ ...formData, class12Biology: Number(e.target.value) })}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">English (%)</label>
                            <input
                              type="number"
                              value={formData.class12English}
                              onChange={(e) => setFormData({ ...formData, class12English: Number(e.target.value) })}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-300/40 dark:border-slate-300 dark:border-slate-800/40 pt-4">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">NEET Score & Rank Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">NEET Roll Number</label>
                          <input
                            type="text"
                            value={formData.neetRollNo}
                            onChange={(e) => setFormData({ ...formData, neetRollNo: e.target.value })}
                            placeholder="24041012345"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">NEET Score (out of 720)</label>
                          <input
                            type="number"
                            value={formData.neetScore}
                            onChange={(e) => setFormData({ ...formData, neetScore: Number(e.target.value) })}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">NEET Percentile</label>
                          <input
                            type="number"
                            step="0.001"
                            value={formData.neetPercentile}
                            onChange={(e) => setFormData({ ...formData, neetPercentile: Number(e.target.value) })}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">NEET All India Rank (AIR)</label>
                          <input
                            type="number"
                            value={formData.neetAirRank}
                            onChange={(e) => setFormData({ ...formData, neetAirRank: Number(e.target.value) })}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5: Hostel, Transport & Bank Details */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-300 dark:border-slate-800">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Hostel & Campus Facilities</h4>
                        <div className="space-y-4">
                          <label className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.hostelRequired}
                              onChange={(e) => setFormData({ ...formData, hostelRequired: e.target.checked })}
                              className="w-4 h-4 rounded border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                            />
                            Hostel Accommodation Required
                          </label>

                          {formData.hostelRequired && (
                            <div className="grid grid-cols-2 gap-4 pt-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Hostel Block Name</label>
                                <input
                                  type="text"
                                  value={formData.hostelName}
                                  onChange={(e) => setFormData({ ...formData, hostelName: e.target.value })}
                                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Room Number</label>
                                <input
                                  type="text"
                                  value={formData.roomNumber}
                                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-300 dark:border-slate-800">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Library & RFID System</h4>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Library Card RFID No</label>
                          <input
                            type="text"
                            value={formData.libraryCardNo}
                            onChange={(e) => setFormData({ ...formData, libraryCardNo: e.target.value })}
                            placeholder="LIB-9988-RFID"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-300/40 dark:border-slate-300 dark:border-slate-800/40 pt-4">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Student Bank Account Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Bank Name</label>
                          <input
                            type="text"
                            value={formData.bankName}
                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                            placeholder="SBI / HDFC / ICICI"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Account Number</label>
                          <input
                            type="text"
                            value={formData.accountNumber}
                            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                            placeholder="123456789012"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">IFSC Code</label>
                          <input
                            type="text"
                            value={formData.ifscCode}
                            onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                            placeholder="SBIN0001234"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 6: Medical Fitness & Declarations */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Vaccination Status</label>
                        <select
                          value={formData.vaccinationStatus}
                          onChange={(e) => setFormData({ ...formData, vaccinationStatus: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors"
                        >
                          <option value="Fully Vaccinated">Fully Vaccinated (Double Dose)</option>
                          <option value="Partially Vaccinated">Partially Vaccinated (Single Dose)</option>
                          <option value="Not Vaccinated">Not Vaccinated</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Admission Status</label>
                        <select
                          value={formData.admissionStatus}
                          onChange={(e) => setFormData({ ...formData, admissionStatus: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition-colors"
                        >
                          <option value="CONFIRMED">CONFIRMED (Admission Completed)</option>
                          <option value="PROVISIONAL">PROVISIONAL (Documents Pending)</option>
                          <option value="PENDING">PENDING</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-300 dark:border-slate-800">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wider">Candidate Verification & Compliance</h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                        By checking the box below, you verify that all details provided in this NMC medical student registration form (Steps 1 to 5) have been verified against original certificates, NEET rank letters, and eligibility certificates.
                      </p>
                      <label className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formData.declarationSigned}
                          onChange={(e) => setFormData({ ...formData, declarationSigned: e.target.checked })}
                          className="w-4.5 h-4.5 mt-0.5 rounded border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>I confirm that the applicant's credentials, physical medical fitness, and documents have been checked and verified in compliance with medical university regulations.</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stepper Footer Controls */}
            <div className="flex justify-between items-center border-t border-slate-300 dark:border-slate-800 pt-6 mt-6">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Back
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-transparent hover:bg-slate-200 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                {currentStep < 6 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-slate-900 dark:text-white shadow-md shadow-indigo-600/10 transition-colors"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFormSubmit}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 font-black text-xs text-slate-900 dark:text-white shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    Save Student Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ Student View Drawer ════════════════════════════════════════════ */}
      {viewStudent !== null && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={() => setViewStudent(null)}
          />

          {/* Slide-over panel */}
          <div className="fixed inset-y-0 right-0 z-[70] w-full max-w-2xl flex flex-col bg-slate-900 border-l border-slate-700 shadow-2xl overflow-hidden animate-slide-in-right">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex-shrink-0">
              <div className="flex items-center gap-4">
                {(viewStudent?.photoUrl || (viewStudent as any)?.photo_url) ? (
                  <img
                    src={viewStudent?.photoUrl || (viewStudent as any)?.photo_url}
                    alt={viewStudent?.name}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-indigo-500 shadow-lg"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                      const fb = (e.target as HTMLElement).parentElement?.querySelector('.drawer-avatar-fallback') as HTMLElement;
                      if (fb) fb.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xl drawer-avatar-fallback ${(viewStudent?.photoUrl || (viewStudent as any)?.photo_url) ? 'hidden' : ''}`}>
                  {viewStudent?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h2 className="text-base font-black text-white">{viewStudent?.name || 'Loading…'}</h2>
                  <p className="text-[11px] text-slate-400 font-mono">{viewStudent?.registrationNo || viewStudent?.registration_no}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Prev / Next */}
                <button
                  disabled={viewStudentIdx <= 0}
                  onClick={() => handleViewNav('prev')}
                  className="w-8 h-8 rounded-lg border border-slate-700 text-slate-400 hover:border-indigo-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center"
                  title="Previous Student"
                >‹</button>
                <span className="text-[10px] text-slate-500">{viewStudentIdx + 1}/{students.length}</span>
                <button
                  disabled={viewStudentIdx >= students.length - 1}
                  onClick={() => handleViewNav('next')}
                  className="w-8 h-8 rounded-lg border border-slate-700 text-slate-400 hover:border-indigo-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center"
                  title="Next Student"
                >›</button>
                {/* Print */}
                <button
                  onClick={() => {
                    const s = viewStudent;
                    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Student Profile – ${s?.name}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', sans-serif; color: #0f172a; background:#fff; padding:32px; }
    .header { display:flex; align-items:flex-start; gap:24px; border-bottom:3px solid #6366f1; padding-bottom:20px; margin-bottom:24px; }
    .photo { width:100px; height:120px; object-fit:cover; border-radius:8px; border:2px solid #6366f1; }
    .photo-placeholder { width:100px; height:120px; border-radius:8px; background:#e0e7ff; display:flex; align-items:center; justify-content:center; font-size:48px; font-weight:900; color:#6366f1; border:2px solid #6366f1; }
    .college-name { font-size:18px; font-weight:900; color:#6366f1; }
    .student-name { font-size:22px; font-weight:900; margin:4px 0; color:#0f172a; }
    .reg-no { font-size:13px; color:#475569; font-family:monospace; }
    .badge { display:inline-block; padding:2px 10px; border-radius:4px; background:#e0e7ff; color:#4338ca; font-size:11px; font-weight:700; margin-top:6px; }
    h3 { font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:#6366f1; margin:20px 0 10px; border-bottom:1px solid #e2e8f0; padding-bottom:4px; }
    .grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px 20px; }
    .field label { font-size:9px; font-weight:700; text-transform:uppercase; color:#94a3b8; letter-spacing:0.06em; display:block; }
    .field span { font-size:12px; color:#0f172a; font-weight:600; }
    .footer { margin-top:32px; border-top:1px solid #e2e8f0; padding-top:12px; display:flex; justify-content:space-between; font-size:9px; color:#94a3b8; }
    @media print { body { padding:20px; } }
  </style>
</head>
<body>
<div class="header">
  ${s?.photoUrl ? `<img class="photo" src="${s.photoUrl}" alt="photo"/>` : `<div class="photo-placeholder">${s?.name?.charAt(0) || '?'}</div>`}
  <div>
    <div class="college-name">${s?.collegeName || s?.college_name || ''}</div>
    <div class="student-name">${s?.name || ''}</div>
    <div class="reg-no">Reg No: ${s?.registrationNo || s?.registration_no || ''} &nbsp;|&nbsp; Roll No: ${s?.rollNo || s?.rollno || '—'}</div>
    <div class="badge">${s?.courseCode || s?.course_code || ''} &bull; ${s?.batchCode || s?.batch_code || ''} &bull; ${s?.academicSession || s?.academic_session || ''}</div>
  </div>
</div>

<h3>Personal Information</h3>
<div class="grid">
  <div class="field"><label>Gender</label><span>${s?.gender || '—'}</span></div>
  <div class="field"><label>Date of Birth</label><span>${s?.dob || '—'}</span></div>
  <div class="field"><label>Blood Group</label><span>${s?.bloodGroup || '—'}</span></div>
  <div class="field"><label>Aadhaar No</label><span>${s?.aadhaarNo || '—'}</span></div>
  <div class="field"><label>Mobile</label><span>${s?.mobileNo || '—'}</span></div>
  <div class="field"><label>Email</label><span>${s?.emailAddress || '—'}</span></div>
</div>

<h3>Academic Details</h3>
<div class="grid">
  <div class="field"><label>College</label><span>${s?.collegeName || s?.college_name || '—'}</span></div>
  <div class="field"><label>Branch</label><span>${s?.branchName || '—'}</span></div>
  <div class="field"><label>Residency</label><span>${s?.residencyType || s?.residency_type || '—'}</span></div>
  <div class="field"><label>Admission Type</label><span>${s?.admissionType || s?.admission_type || '—'}</span></div>
  <div class="field"><label>Admission Status</label><span>${s?.admissionStatus || '—'}</span></div>
  <div class="field"><label>Category</label><span>${s?.categoryCode || '—'}</span></div>
</div>

<h3>Guardian Information</h3>
<div class="grid">
  <div class="field"><label>Father's Name</label><span>${s?.fatherName || '—'}</span></div>
  <div class="field"><label>Father's Mobile</label><span>${s?.fatherMobile || '—'}</span></div>
  <div class="field"><label>Father's Occupation</label><span>${s?.fatherOccupation || '—'}</span></div>
  <div class="field"><label>Mother's Name</label><span>${s?.motherName || '—'}</span></div>
  <div class="field"><label>Mother's Mobile</label><span>${s?.motherMobile || '—'}</span></div>
  <div class="field"><label>Mother's Occupation</label><span>${s?.motherOccupation || '—'}</span></div>
</div>

<h3>NEET & Qualifications</h3>
<div class="grid">
  <div class="field"><label>NEET Roll No</label><span>${s?.neetRollNo || '—'}</span></div>
  <div class="field"><label>NEET Score</label><span>${s?.neetScore || '—'}</span></div>
  <div class="field"><label>NEET Rank</label><span>${s?.neetRank || '—'}</span></div>
  <div class="field"><label>10th %</label><span>${s?.tenthPercent || '—'}</span></div>
  <div class="field"><label>12th %</label><span>${s?.twelfthPercent || '—'}</span></div>
  <div class="field"><label>12th Board</label><span>${s?.twelfthBoard || '—'}</span></div>
</div>

<div class="footer">
  <span>Printed on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
  <span>MedERP – Student Profile Sheet</span>
</div>
</body>
</html>`;
                    const win = window.open('', '_blank');
                    if (win) {
                      win.document.write(html);
                      win.document.close();
                      win.onload = () => { win.focus(); win.print(); };
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition-all shadow"
                  title="Print A4 Profile Sheet"
                >
                  🖨 Print
                </button>
                <button
                  onClick={() => setViewStudent(null)}
                  className="w-8 h-8 rounded-lg border border-slate-700 text-slate-400 hover:border-rose-500 hover:text-rose-400 transition-all flex items-center justify-center text-lg"
                >✕</button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {viewLoading ? (
                <SlideOverSkeleton />
              ) : (
                <>
                  {/* Personal Info Section */}
                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2">
                      <span className="w-4 h-0.5 bg-indigo-500 rounded" /> Personal Information
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        ['Gender', viewStudent?.gender],
                        ['Date of Birth', viewStudent?.dob],
                        ['Blood Group', viewStudent?.bloodGroup],
                        ['Aadhaar No', viewStudent?.aadhaarNo],
                        ['PAN No', viewStudent?.panNo],
                        ['Mobile', viewStudent?.mobileNo],
                        ['Alt Mobile', viewStudent?.alternateMobile],
                        ['Email', viewStudent?.emailAddress],
                        ['Nationality', viewStudent?.nationality],
                        ['Religion', viewStudent?.religion],
                        ['Category', viewStudent?.categoryCode],
                        ['Domicile', viewStudent?.domicileState],
                      ].map(([label, val]) => (
                        <div key={label as string} className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">{label}</p>
                          <p className="text-xs font-semibold text-white truncate">{val || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Academic Info Section */}
                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-3 flex items-center gap-2">
                      <span className="w-4 h-0.5 bg-purple-500 rounded" /> Academic Details
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        ['College', viewStudent?.collegeName || viewStudent?.college_name],
                        ['Course', viewStudent?.courseCode || viewStudent?.course_code],
                        ['Branch', viewStudent?.branchName],
                        ['Batch', viewStudent?.batchCode || viewStudent?.batch_code],
                        ['Session', viewStudent?.academicSession || viewStudent?.academic_session],
                        ['Residency', viewStudent?.residencyType || viewStudent?.residency_type],
                        ['Admission Type', viewStudent?.admissionType || viewStudent?.admission_type],
                        ['Admission Status', viewStudent?.admissionStatus],
                        ['Vaccination', viewStudent?.vaccinationStatus],
                      ].map(([label, val]) => (
                        <div key={label as string} className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">{label}</p>
                          <p className="text-xs font-semibold text-white truncate">{val || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Guardian Info */}
                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
                      <span className="w-4 h-0.5 bg-amber-500 rounded" /> Guardian Information
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        ["Father's Name", viewStudent?.fatherName],
                        ["Father's Mobile", viewStudent?.fatherMobile],
                        ["Father's Occupation", viewStudent?.fatherOccupation],
                        ["Mother's Name", viewStudent?.motherName],
                        ["Mother's Mobile", viewStudent?.motherMobile],
                        ["Mother's Occupation", viewStudent?.motherOccupation],
                        ["Guardian Name", viewStudent?.guardianName],
                        ["Guardian Mobile", viewStudent?.guardianMobile],
                        ["Guardian Relation", viewStudent?.guardianRelation],
                      ].map(([label, val]) => (
                        <div key={label as string} className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">{label}</p>
                          <p className="text-xs font-semibold text-white truncate">{val || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* NEET & Qualifications */}
                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-2">
                      <span className="w-4 h-0.5 bg-emerald-500 rounded" /> NEET & Qualifications
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        ['NEET Roll No', viewStudent?.neetRollNo],
                        ['NEET Score', viewStudent?.neetScore],
                        ['NEET Rank', viewStudent?.neetRank],
                        ['NEET Percentile', viewStudent?.neetPercentile],
                        ['10th %', viewStudent?.tenthPercent],
                        ['10th Board', viewStudent?.tenthBoard],
                        ['12th %', viewStudent?.twelfthPercent],
                        ['12th Board', viewStudent?.twelfthBoard],
                        ['12th PCB %', viewStudent?.twelfthPcbPercent],
                      ].map(([label, val]) => (
                        <div key={label as string} className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">{label}</p>
                          <p className="text-xs font-semibold text-white">{val || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Address */}
                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-3 flex items-center gap-2">
                      <span className="w-4 h-0.5 bg-rose-500 rounded" /> Address
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        ['Permanent Address', viewStudent?.permanentAddress],
                        ['Local Address', viewStudent?.localAddress],
                        ['City', viewStudent?.city],
                        ['State', viewStudent?.state],
                        ['PIN Code', viewStudent?.pincode],
                      ].map(([label, val]) => (
                        <div key={label as string} className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">{label}</p>
                          <p className="text-xs font-semibold text-white">{val || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Hostel & Bank */}
                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-3 flex items-center gap-2">
                      <span className="w-4 h-0.5 bg-cyan-500 rounded" /> Hostel & Bank Details
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        ['Hostel Block', viewStudent?.hostelBlock],
                        ['Room No', viewStudent?.roomNo],
                        ['Bank Name', viewStudent?.bankName],
                        ['Account No', viewStudent?.accountNo],
                        ['IFSC Code', viewStudent?.ifscCode],
                        ['Transport Route', viewStudent?.transportRoute],
                      ].map(([label, val]) => (
                        <div key={label as string} className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">{label}</p>
                          <p className="text-xs font-semibold text-white">{val || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                Student {viewStudentIdx + 1} of {students.length}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={viewStudentIdx <= 0}
                  onClick={() => handleViewNav('prev')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-bold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >← Previous</button>
                <button
                  disabled={viewStudentIdx >= students.length - 1}
                  onClick={() => handleViewNav('next')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-bold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >Next →</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Slide-in animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .animate-slide-in-right { animation: slide-in-right 0.28s cubic-bezier(0.22,1,0.36,1); }
      ` }} />

    </div>

  );
}
