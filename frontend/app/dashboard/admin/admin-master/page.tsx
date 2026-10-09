'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import { useRolePermissions } from '../../../../lib/useRolePermissions';

const ActionButtons = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
  <div className="flex items-center justify-end gap-1.5">
    <button
      onClick={onEdit}
      className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:text-white bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-600 rounded-lg transition-all"
      title="Edit"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
      </svg>
    </button>
    <button
      onClick={onDelete}
      className="p-1.5 text-rose-600 dark:text-rose-400 hover:text-white bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 rounded-lg transition-all"
      title="Delete"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
    </button>
  </div>
);

const TableSkeleton = ({ colCount = 6 }: { colCount?: number }) => (
  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
    {[...Array(5)].map((_, rIdx) => (
      <tr key={rIdx} className="animate-pulse bg-white dark:bg-slate-900">
        <td className="p-4 pl-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div></td>
        {[...Array(colCount - 1)].map((_, cIdx) => (
          <td key={cIdx} className="p-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

type SubCategory = 'departments' | 'subjects' | 'professional-linkers' | 'subject-offerings' | 'delivery-types' | 'units' | 'topics' | 'competencies';

interface Unit {
  id: string;
  code: string;
  name?: string;
  description: string;
  subject_id?: string;
  subject_name?: string;
  subject_code?: string;
  course_cd?: string;
  course_name?: string;
  branch_cd?: string;
  batch_id?: string;
  batch_year?: number;
  bloom_level: string;
  unit_order?: number;
  hours?: number;
  college_id?: string;
  college_code?: string;
  college_name?: string;
  college_slug?: string;
  is_active: boolean;
}

interface College {
  id: string;
  code?: string;
  name: string;
  slug: string;
  domain?: string;
  plan?: string;
  primary_color?: string;
  is_active: boolean;
}

interface ProfessionalLinker {
  id: string;
  code: string;
  name: string;
  course_cd?: string;
  professional_phase?: string;
  academic_session?: string;
  description?: string;
  is_active: boolean;
}

interface Department {
  id: string;
  code: string;
  name: string;
  type: string;
  branch_cd?: string;
  course_cd?: string;
  course_code?: string;
  course_name?: string;
  colg_cd?: string;
  college_id?: string;
  college_name?: string;
  college_code?: string;
  college_slug?: string;
  hod_user_id?: string;
  hod_email?: string;
  is_active: boolean;
}

interface Subject {
  id: string;
  code: string;
  name: string;
  department_id?: string;
  department_name?: string;
  department_code?: string;
  department_course_name?: string;
  course_cd?: string;
  course_name?: string;
  branch_cd?: string;
  batch_id?: string;
  batch_code?: string;
  batch_cd?: string;
  sem_cd?: string;
  semester?: string;
  semester_name?: string;
  college_id?: string;
  colg_cd?: string;
  college_name?: string;
  college_code?: string;
  college_slug?: string;
  credits: number;
  type: string;
  is_longitudinal?: boolean;
  is_active: boolean;
}

interface Topic {
  id: string;
  code: string;
  name: string;
  subject_id?: string;
  subject_name?: string;
  subject_code?: string;
  unit_id?: string;
  unit_code?: string;
  unit_name?: string;
  unit_bloom_level?: string;
  bloom_level?: string;
  course_cd?: string;
  branch_cd?: string;
  batch_year?: number;
  description?: string;
  hours: number;
  linker_id?: string;
  cbme_code?: string;
  cbme_name?: string;
  college_id?: string;
  college_name?: string;
  college_code?: string;
  college_slug?: string;
  is_active: boolean;
}

interface Competency {
  id: string;
  code: string;
  name?: string;
  description: string;
  subject_id?: string;
  subject_name?: string;
  subject_code?: string;
  unit_id?: string;
  unit_code?: string;
  unit_name?: string;
  topic_id?: string;
  topic_name?: string;
  topic_code?: string;
  topic_description?: string;
  course_cd?: string;
  branch_cd?: string;
  batch_year?: number;
  domain: string;
  level: string;
  bloom_level?: string;
  is_core: boolean;
  linker_id?: string;
  cbme_code?: string;
  cbme_name?: string;
  college_id?: string;
  college_name?: string;
  college_code?: string;
  college_slug?: string;
  is_active: boolean;
}


const MEDICAL_LEARNING_METHODS = [
  "LGT",
  "SGT",
  "LGT SGT",
  "LGT, SGT/Tutorials",
  "LGT Student Seminars",
  "Lecture",
  "Lectures",
  "Small Group Teaching",
  "Tutorial",
  "Tutorials",
  "Seminar",
  "Seminars",
  "Student Seminar",
  "Demonstration",
  "Practical",
  "Practical Demonstration",
  "Laboratory",
  "Clinical Demonstration",
  "Bedside Teaching",
  "Bedside Clinical Teaching",
  "Case-Based Learning",
  "Case Discussion",
  "Case Presentation",
  "Problem-Based Learning",
  "Team-Based Learning",
  "Group Discussion",
  "Interactive Session",
  "Discussion",
  "Workshop",
  "Skill Lab",
  "Simulation",
  "Simulation-Based Learning",
  "Clinical Skills Training",
  "Self-Directed Learning",
  "Self-Learning",
  "E-Learning",
  "Online Learning",
  "Blended Learning",
  "Flipped Classroom",
  "Demonstration and Practice",
  "Field Visit",
  "Community-Based Learning",
  "Community Visit",
  "Integrated Teaching",
  "Integrated Learning",
  "Interdisciplinary Teaching",
  "AETCOM Session",
  "Role Play",
  "Reflective Learning",
  "Experiential Learning",
  "Peer Learning",
  "Peer Teaching",
  "Assignment",
  "Project-Based Learning",
  "Other"
];

const MEDICAL_ASSESSMENT_METHODS = [
  "Written Assessment",
  "Written Examination",
  "Written Test",
  "Written/ Viva voce",
  "Viva voce",
  "Viva",
  "Oral Examination",
  "MCQ",
  "Multiple Choice Questions",
  "SAQ",
  "Short Answer Questions",
  "LAQ",
  "Long Answer Questions",
  "Theory Examination",
  "Practical Examination",
  "Practical Assessment",
  "Clinical Assessment",
  "Clinical Examination",
  "OSCE",
  "OSPE",
  "Objective Structured Clinical Examination",
  "Objective Structured Practical Examination",
  "Skill Assessment",
  "Skill-Based Assessment",
  "Case-Based Assessment",
  "Case Presentation",
  "Case Discussion",
  "Assignment Assessment",
  "Seminar Assessment",
  "Presentation",
  "Project Assessment",
  "Group Assessment",
  "Individual Assessment",
  "Formative Assessment",
  "Summative Assessment",
  "Continuous Assessment",
  "Internal Assessment",
  "End-Term Assessment",
  "Mid-Term Examination",
  "Class Test",
  "Unit Test",
  "Quiz",
  "Online Assessment",
  "Practical/Viva voce",
  "Written/Practical/Viva voce",
  "Written/Practical",
  "Portfolio Assessment",
  "Logbook Assessment",
  "Direct Observation",
  "Workplace-Based Assessment",
  "Peer Assessment",
  "Self-Assessment",
  "Reflective Assessment",
  "Attendance/Participation",
  "Other"
];

const ENGINEERING_LEARNING_METHODS = [
  "LGT",
  "SGT",
  "LGT SGT",
  "Lecture",
  "Lectures",
  "Tutorial",
  "Practical",
  "Laboratory",
  "Lab Session",
  "Workshop",
  "Seminar",
  "Student Seminar",
  "Presentation",
  "Group Discussion",
  "Case Study",
  "Case Discussion",
  "Case-Based Learning",
  "Problem-Based Learning",
  "Project-Based Learning",
  "Experiential Learning",
  "Activity-Based Learning",
  "Self-Learning",
  "E-Learning",
  "Blended Learning",
  "Flipped Classroom",
  "Simulation",
  "Demonstration",
  "Industrial Training",
  "Industrial Visit",
  "Field Visit",
  "Internship",
  "Project Work",
  "Mini Project",
  "Major Project",
  "Capstone Project",
  "Research-Based Learning",
  "Coding Practice",
  "Problem Solving",
  "Hands-on Training",
  "Software Lab",
  "Computer Lab",
  "Management Game",
  "Role Play",
  "Team Activity",
  "Brainstorming",
  "Debate",
  "Quiz",
  "Assignment",
  "Mentoring",
  "Guest Lecture",
  "Expert Lecture",
  "Industry Interaction",
  "Entrepreneurship Activity",
  "Innovation Activity",
  "Other"
];

const ENGINEERING_ASSESSMENT_METHODS = [
  "Written Assessment",
  "Written Examination",
  "Written Test",
  "Theory Examination",
  "Internal Assessment",
  "Continuous Assessment",
  "Formative Assessment",
  "Summative Assessment",
  "Mid-Term Examination",
  "End-Term Examination",
  "Class Test",
  "Unit Test",
  "Quiz",
  "MCQ",
  "Multiple Choice Questions",
  "Short Answer Questions",
  "Long Answer Questions",
  "Assignment Assessment",
  "Tutorial Assessment",
  "Practical Assessment",
  "Laboratory Assessment",
  "Lab Examination",
  "Project Assessment",
  "Mini Project Assessment",
  "Major Project Assessment",
  "Capstone Project Assessment",
  "Internship Assessment",
  "Industrial Training Assessment",
  "Seminar Assessment",
  "Presentation Assessment",
  "Case Study Assessment",
  "Case Analysis",
  "Group Discussion Assessment",
  "Viva voce",
  "Viva",
  "Oral Examination",
  "Practical/Viva voce",
  "Written/Viva voce",
  "Written/Practical",
  "Written/Practical/Viva voce",
  "Coding Assessment",
  "Programming Test",
  "Design Assessment",
  "Technical Assessment",
  "Skill Assessment",
  "Performance Assessment",
  "Simulation Assessment",
  "Portfolio Assessment",
  "Logbook Assessment",
  "Research Assessment",
  "Research Paper Assessment",
  "Attendance/Participation",
  "Peer Assessment",
  "Self-Assessment",
  "Team Assessment",
  "Field Work Assessment",
  "Industrial Visit Assessment",
  "Innovation Assessment",
  "Entrepreneurship Assessment",
  "Case Presentation",
  "Project Presentation",
  "Report Assessment",
  "Final Project Defense",
  "Other"
];

interface TempCompetencyItem {
  code: string;
  name?: string;
  description: string;
  domain: string;
  level: string;
  bloom_level?: string;
  is_core: boolean;
}

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/admin-master`;
const COLLEGE_API_BASE = `${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/college-master`;

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export default function AdminMasterPage() {
  const [activeTab, setActiveTab] = useState<SubCategory>('departments');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState<string>('all');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('all');
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState<string>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('all');

  const [colleges, setColleges] = useState<College[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [linkers, setLinkers] = useState<ProfessionalLinker[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [deliveryTypes, setDeliveryTypes] = useState<any[]>([]);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [profPhases, setProfPhases] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // SRMS Live Subjects Integration State
  const [srmsLiveSubjects, setSrmsLiveSubjects] = useState<any[]>([]);
  const [loadingSrmsSubjects, setLoadingSrmsSubjects] = useState(false);

  // Unit Master live subjects, search & cascading state
  const [unitLiveSubjects, setUnitLiveSubjects] = useState<any[]>([]);
  const [loadingUnitSubjects, setLoadingUnitSubjects] = useState<boolean>(false);
  const [unitSubjectSearch, setUnitSubjectSearch] = useState<string>('');
  const [isUnitSubjectDropdownOpen, setIsUnitSubjectDropdownOpen] = useState<boolean>(false);

  // Topic Master live subjects, search & cascading state
  const [topicLiveSubjects, setTopicLiveSubjects] = useState<any[]>([]);
  const [loadingTopicSubjects, setLoadingTopicSubjects] = useState<boolean>(false);
  const [topicSubjectSearch, setTopicSubjectSearch] = useState<string>('');
  const [isTopicSubjectDropdownOpen, setIsTopicSubjectDropdownOpen] = useState<boolean>(false);

  // Sub-Topic / Competency Master live subjects, search & cascading state
  const [subTopicLiveSubjects, setSubTopicLiveSubjects] = useState<any[]>([]);
  const [loadingSubTopicSubjects, setLoadingSubTopicSubjects] = useState<boolean>(false);
  const [subTopicSubjectSearch, setSubTopicSubjectSearch] = useState<string>('');
  const [isSubTopicSubjectDropdownOpen, setIsSubTopicSubjectDropdownOpen] = useState<boolean>(false);

  // Sub-Topic / Competency temporary queue state
  const [tempCompetencies, setTempCompetencies] = useState<TempCompetencyItem[]>([]);
  const [subTopicCode, setSubTopicCode] = useState('');
  const [subTopicName, setSubTopicName] = useState('');
  const [subTopicDesc, setSubTopicDesc] = useState('');
  const [subTopicDomain, setSubTopicDomain] = useState('Knowledge');
  const [subTopicLevel, setSubTopicLevel] = useState('Knows How');
  const [subTopicBloom, setSubTopicBloom] = useState('KL-2 (Understand)');
  const [subTopicCore, setSubTopicCore] = useState(true);
  const [subTopicLearningMethod, setSubTopicLearningMethod] = useState('');
  const [subTopicAssessmentMethod, setSubTopicAssessmentMethod] = useState('');

  const getActiveTenantSlug = (): string => {
    if (selectedCollegeFilter !== 'all') {
      const col = colleges.find((c) => c.id === selectedCollegeFilter || c.slug === selectedCollegeFilter || c.code === selectedCollegeFilter);
      return col?.slug || selectedCollegeFilter;
    }
    return 'all';
  };

  const getFormCollegeSlug = (collegeIdOrSlug?: string): string => {
    const target = collegeIdOrSlug || formData.college_id || formData.college_slug;
    return colleges.find((c) => c.id === target || c.slug === target || c.code === target)?.slug
      || colleges[0]?.slug
      || 'srms-cet-bareilly';
  };

  const fetchColleges = async () => {
    try {
      const res = await fetch(`${COLLEGE_API_BASE}/colleges`);
      if (res.ok) {
        const json = await res.json();
        const list: College[] = json.data || json || [];
        setColleges(list);
      }
    } catch (err) {
      console.error('[AdminMaster] Error loading colleges:', err);
    }
  };

  const fetchCategoryData = async (cat?: SubCategory, collegeFilter?: string) => {
    const targetCat = cat || activeTab;
    const filter = collegeFilter !== undefined ? collegeFilter : selectedCollegeFilter;
    let targetTenant = 'all';
    if (filter !== 'all') {
      const matched = colleges.find(c => c.id === filter || c.slug === filter || c.code === filter);
      targetTenant = matched?.slug || filter;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${targetCat}?tenant=${targetTenant}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json || [];
        if (targetCat === 'departments') setDepartments(data);
        if (targetCat === 'subjects') setSubjects(data);
        if (targetCat === 'professional-linkers') setLinkers(data);
        if (targetCat === 'topics') setTopics(data);
        if (targetCat === 'competencies') setCompetencies(data);
        if (targetCat === 'delivery-types') setDeliveryTypes(data);
        if (targetCat === 'subject-offerings') setOfferings(data);
        if (targetCat === 'units') setUnits(data);
      }
    } catch (err) {
      console.error(`[AdminMaster] Error loading ${targetCat}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${COLLEGE_API_BASE}/courses?tenant=all`);
      if (res.ok) {
        const json = await res.json();
        setCourses(json.data || json || []);
      }
    } catch (err) {
      console.error('[AdminMaster] Error loading courses:', err);
    }
  };

  const getCoursesForCollege = (collegeIdOrSlug?: string) => {
    if (!collegeIdOrSlug) return courses;
    const col = colleges.find(c => c.id === collegeIdOrSlug || c.slug === collegeIdOrSlug || c.code === collegeIdOrSlug);
    const targetId = col?.id || collegeIdOrSlug;
    const targetSlug = col?.slug;
    const targetCode = col?.code;

    const filtered = courses.filter((c: any) =>
      c.college_id === targetId ||
      (targetCode && c.college_id === targetCode) ||
      (targetSlug && c.college_slug === targetSlug) ||
      (targetCode && c.college_code === targetCode)
    );
    return filtered.length > 0 ? filtered : courses;
  };

  const fetchProfessionals = async (collegeFilter?: string) => {
    try {
      const filter = collegeFilter !== undefined ? collegeFilter : selectedCollegeFilter;
      let targetTenant = 'all';
      if (filter !== 'all') {
        const matched = colleges.find(c => c.id === filter || c.slug === filter || c.code === filter);
        targetTenant = matched?.slug || filter;
      }
      const res = await fetch(`${COLLEGE_API_BASE}/professionals?tenant=${targetTenant}`);
      if (res.ok) {
        const json = await res.json();
        setProfPhases(json.data || json || []);
      }
    } catch (err) {
      console.error('[AdminMaster] Error loading professionals:', err);
    }
  };

  const fetchBatches = async (collegeFilter?: string) => {
    try {
      const filter = collegeFilter !== undefined ? collegeFilter : selectedCollegeFilter;
      let targetTenant = 'all';
      if (filter !== 'all') {
        const matched = colleges.find(c => c.id === filter || c.slug === filter || c.code === filter);
        targetTenant = matched?.slug || filter;
      }
      const res = await fetch(`${COLLEGE_API_BASE}/batches?tenant=${targetTenant}`);
      if (res.ok) {
        const json = await res.json();
        setBatches(json.data || json || []);
      }
    } catch (err) {
      console.error('[AdminMaster] Error loading batches:', err);
    }
  };

  const syncDepartmentsFromPortal = async () => {
    setSyncing(true);
    setSyncMessage('🔄 Copying & syncing branch data to Department Master in PostgreSQL...');
    try {
      const targetSlug = getActiveTenantSlug() === 'all' ? 'all' : getActiveTenantSlug();
      const res = await fetch(`${API_BASE}/departments/sync-from-branches?tenant=${targetSlug}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        setSyncMessage(`⚡ Successfully synced ${json.count ?? ''} Departments from Branch data into PostgreSQL ✅`);
        await fetchCategoryData('departments');
        setTimeout(() => setSyncMessage(''), 5000);
      } else {
        // Fallback to college-master sync if needed
        const fallbackRes = await fetch(`${COLLEGE_API_BASE}/branches/sync-external?tenant=${targetSlug}`, {
          method: 'POST',
          headers: getAuthHeaders(),
        });
        if (fallbackRes.ok) {
          setSyncMessage(`Departments & Specialties synced successfully from Branch data ✅`);
          await fetchCategoryData('departments');
          setTimeout(() => setSyncMessage(''), 5000);
        } else {
          setSyncMessage('Failed to sync departments.');
        }
      }
    } catch (err) {
      console.error('[AdminMaster] Sync error:', err);
      setSyncMessage('Error syncing departments.');
    } finally {
      setSyncing(false);
    }
  };

  const fetchSrmsLiveSubjects = async (colgcd?: string, coursecd?: string, branchcd?: string, batchcd?: string, semcd?: string) => {
    setLoadingSrmsSubjects(true);
    const payload = {
      colgcd: String(colgcd || '1'),
      coursecd: String(coursecd || '13'),
      branchcd: String(branchcd || '1'),
      batchcd: String(batchcd || '2'),
      semcd: String(semcd || '3'),
      tenant: getActiveTenantSlug(),
    };

    // 1. Try Backend NestJS Proxy endpoint
    try {
      const res = await fetch(`${COLLEGE_API_BASE}/proxy/all-subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (Array.isArray(data) && data.length > 0) {
          setSrmsLiveSubjects(data);
          setLoadingSrmsSubjects(false);
          return data;
        }
      }
    } catch (err) {
      console.warn('[AdminMaster] Backend proxy/all-subjects fetch error:', err);
    }

    // 2. Fallback to Next.js API route
    try {
      const res = await fetch('/api/srms/all-subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSrmsLiveSubjects(data);
          setLoadingSrmsSubjects(false);
          return data;
        }
      }
    } catch (e) {
      console.warn('[AdminMaster] Frontend /api/srms/all-subjects fetch error:', e);
    } finally {
      setLoadingSrmsSubjects(false);
    }
    return [];
  };

  const getSubjectPaperCode = (s: any): string => {
    if (!s) return '';
    const addinfo = String(s.sub_addinfo || '').trim();
    if (addinfo && addinfo !== '-' && addinfo !== 'null' && addinfo !== 'undefined') return addinfo;
    const code = String(s.code || s.subject_code || '').trim();
    if (code && code !== '-' && code !== 'null' && code !== 'undefined') return code;
    return String(s.sub_cd || s.id || '').trim();
  };

  const getSubjectTitle = (s: any): string => {
    if (!s) return '';
    const mst = String(s.mst_sub_name || '').trim();
    if (mst && mst !== '-' && mst !== 'null' && mst !== 'undefined') return mst;
    const name = String(s.name || s.sub_name || '').trim();
    return name || 'Subject';
  };

  const getSubjectDisplayLabel = (s: any): string => {
    if (!s) return '';
    const paper = getSubjectPaperCode(s);
    const title = getSubjectTitle(s);
    if (paper && title) {
      if (title.toUpperCase().includes(paper.toUpperCase())) return title;
      return `[${paper}] ${title}`;
    }
    return title || paper || 'Selected Subject';
  };

  const getSubjectNumericCode = (s: any, fallbackId?: string | number): string => {
    if (s) {
      const subCd = String(s.sub_cd || '').trim();
      if (subCd && /^\d+$/.test(subCd)) return subCd;
      const code = String(s.code || s.subject_code || '').trim();
      if (code && /^\d+$/.test(code)) return code;
      const id = String(s.id || '').trim();
      if (id && /^\d+$/.test(id)) return id;
    }
    if (fallbackId !== undefined && fallbackId !== null) {
      const fb = String(fallbackId).trim();
      if (fb && /^\d+$/.test(fb)) return fb;
    }
    return '';
  };

  const getNextUnitCodeForSubject = (
    subjectCodeOrId: string | number,
    allUnits: Unit[] = units,
    subjectObjOrPaperCode?: any
  ): { code: string; order: number } => {
    // 1. Resolve raw subject paper code (e.g. 'BCS 055' or 'BNC 501')
    let rawPaperCode = '';
    if (typeof subjectObjOrPaperCode === 'string') {
      rawPaperCode = subjectObjOrPaperCode;
    } else if (subjectObjOrPaperCode && typeof subjectObjOrPaperCode === 'object') {
      rawPaperCode = subjectObjOrPaperCode.sub_addinfo || subjectObjOrPaperCode.code || subjectObjOrPaperCode.sub_name || '';
    }

    const target = String(subjectCodeOrId || '').trim();
    const targetLower = target.toLowerCase();

    // 2. Resolve dynamic numeric subject code (e.g. "88623", "88626")
    let numericSubCd = '';
    if (typeof subjectObjOrPaperCode === 'object' && subjectObjOrPaperCode) {
      numericSubCd = getSubjectNumericCode(subjectObjOrPaperCode, subjectCodeOrId);
    } else if (typeof subjectObjOrPaperCode === 'string' && /^\d+$/.test(subjectObjOrPaperCode.trim())) {
      numericSubCd = subjectObjOrPaperCode.trim();
    }
    if (!numericSubCd && target && /^\d+$/.test(target)) {
      numericSubCd = target;
    }

    // Search in unitLiveSubjects if not passed directly
    const foundInLive = unitLiveSubjects.find((s: any) =>
      (target && (
        String(s.sub_cd).toLowerCase() === targetLower ||
        String(s.id).toLowerCase() === targetLower ||
        String(s.code).toLowerCase() === targetLower ||
        String(s.sub_addinfo).toLowerCase() === targetLower ||
        String(s.sub_name).toLowerCase() === targetLower
      )) ||
      (rawPaperCode && String(s.sub_addinfo).toLowerCase() === rawPaperCode.toLowerCase())
    );
    if (!rawPaperCode && foundInLive) {
      rawPaperCode = foundInLive.sub_addinfo || foundInLive.code || foundInLive.sub_name || '';
    }
    if (!numericSubCd && foundInLive) {
      numericSubCd = getSubjectNumericCode(foundInLive);
    }

    // Search in master subjects
    const foundInSubjects = subjects.find(s =>
      (target && (
        String(s.id).toLowerCase() === targetLower ||
        String(s.code).toLowerCase() === targetLower ||
        String(s.name).toLowerCase() === targetLower
      )) ||
      (rawPaperCode && String(s.code).toLowerCase() === rawPaperCode.toLowerCase())
    );
    if (!rawPaperCode && foundInSubjects) {
      rawPaperCode = (foundInSubjects as any).sub_addinfo || foundInSubjects.code || '';
    }
    if (!numericSubCd && foundInSubjects) {
      numericSubCd = getSubjectNumericCode(foundInSubjects);
    }

    // Strip all whitespace and uppercase: "BCS 055" -> "BCS055", "BNC 501" -> "BNC501"
    const cleanPaperCode = (rawPaperCode || '').replace(/\s+/g, '').toUpperCase();

    // Dynamic prefix: Prioritize numeric subject code (e.g. "88623"), fallback to paper code ("BCS055") if no numeric code
    const prefixToUse = numericSubCd || cleanPaperCode;

    if (!target && !prefixToUse) {
      return { code: 'UNIT1-CO1', order: 1 };
    }

    // Build comprehensive match set
    const targetSet = new Set<string>();
    if (target) {
      targetSet.add(targetLower);
      targetSet.add(target.replace(/\s+/g, '').toLowerCase());
    }
    if (numericSubCd) {
      targetSet.add(numericSubCd.toLowerCase());
    }
    if (rawPaperCode) {
      targetSet.add(rawPaperCode.trim().toLowerCase());
      targetSet.add(rawPaperCode.replace(/\s+/g, '').toLowerCase());
    }
    if (cleanPaperCode) {
      targetSet.add(cleanPaperCode.toLowerCase());
    }
    if (foundInLive) {
      if (foundInLive.sub_cd) targetSet.add(String(foundInLive.sub_cd).toLowerCase());
      if (foundInLive.id) targetSet.add(String(foundInLive.id).toLowerCase());
      if (foundInLive.sub_addinfo) {
        targetSet.add(String(foundInLive.sub_addinfo).toLowerCase());
        targetSet.add(String(foundInLive.sub_addinfo).replace(/\s+/g, '').toLowerCase());
      }
      if (foundInLive.sub_name) {
        targetSet.add(String(foundInLive.sub_name).toLowerCase());
        targetSet.add(String(foundInLive.sub_name).replace(/\s+/g, '').toLowerCase());
      }
    }
    if (foundInSubjects) {
      if (foundInSubjects.id) targetSet.add(String(foundInSubjects.id).toLowerCase());
      if (foundInSubjects.code) {
        targetSet.add(String(foundInSubjects.code).toLowerCase());
        targetSet.add(String(foundInSubjects.code).replace(/\s+/g, '').toLowerCase());
      }
    }

    // Find all existing units belonging to this subject
    const matchingUnits = allUnits.filter((u: any) => {
      const uSubId = String(u.subject_id || '').trim().toLowerCase();
      const uSubCode = String(u.subject_code || '').trim().toLowerCase();
      const uSubCd = String(u.sub_cd || '').trim().toLowerCase();
      const uCodeClean = String(u.code || '').replace(/\s+/g, '').toUpperCase();

      const matchesTarget =
        (uSubId && targetSet.has(uSubId)) ||
        (uSubCode && (targetSet.has(uSubCode) || targetSet.has(uSubCode.replace(/\s+/g, '')))) ||
        (uSubCd && targetSet.has(uSubCd));

      const matchesPrefix =
        (numericSubCd && uCodeClean.startsWith(numericSubCd)) ||
        (cleanPaperCode && cleanPaperCode.length >= 2 && uCodeClean.startsWith(cleanPaperCode));

      return matchesTarget || matchesPrefix;
    });

    let maxNum = 0;
    matchingUnits.forEach((u: any) => {
      const code = String(u.code || '').trim().toUpperCase();
      const match =
        code.match(/UNIT\s*-?\s*(\d+)/i) ||
        code.match(/(?:^|[-_\s])U(\d+)(?:[-_\s]|$)/i) ||
        code.match(/(?:^|[-_\s])CO(\d+)(?:[-_\s]|$)/i) ||
        code.match(/(?:^|[-_\s])(\d+)$/);

      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      } else if (u.unit_order && typeof u.unit_order === 'number' && u.unit_order > maxNum && u.unit_order <= 30) {
        maxNum = u.unit_order;
      }
    });

    if (maxNum < matchingUnits.length) {
      maxNum = matchingUnits.length;
    }

    const nextNum = maxNum + 1;
    const generatedCode = prefixToUse
      ? `${prefixToUse}-UNIT${nextNum}-CO${nextNum}`
      : `UNIT${nextNum}-CO${nextNum}`;

    return {
      code: generatedCode,
      order: nextNum,
    };
  };

  const getNextTopicCodeForSubject = (
    subjectCodeOrId: string,
    allTopics: any[],
    unitCode?: string,
    subjectObj?: any
  ): string => {
    const target = String(subjectCodeOrId || '').trim();

    // 1. Resolve numeric subject code xx (e.g. "88626", "85185")
    let numericSubCd = '';
    const rawObjCd = String(subjectObj?.sub_cd || '').trim();
    if (rawObjCd && /^\d+$/.test(rawObjCd)) {
      numericSubCd = rawObjCd;
    } else if (subjectObj?.code && /^\d+$/.test(String(subjectObj.code).trim())) {
      numericSubCd = String(subjectObj.code).trim();
    } else if (target && /^\d+$/.test(target)) {
      numericSubCd = target;
    }

    // If not found directly, search live or database subjects
    if (!numericSubCd && (target || subjectObj)) {
      const foundInLive = topicLiveSubjects.find((s: any) =>
        (target && (String(s.sub_cd) === target || String(s.id) === target || String(s.code) === target || String(s.sub_addinfo) === target || String(s.sub_name) === target)) ||
        (subjectObj?.sub_addinfo && String(s.sub_addinfo) === String(subjectObj.sub_addinfo)) ||
        (subjectObj?.id && String(s.id) === String(subjectObj.id))
      ) || unitLiveSubjects.find((s: any) =>
        (target && (String(s.sub_cd) === target || String(s.id) === target || String(s.code) === target || String(s.sub_addinfo) === target || String(s.sub_name) === target)) ||
        (subjectObj?.sub_addinfo && String(s.sub_addinfo) === String(subjectObj.sub_addinfo))
      );
      if (foundInLive) {
        const liveCd = String(foundInLive.sub_cd || foundInLive.code || '').trim();
        if (liveCd && /^\d+$/.test(liveCd)) {
          numericSubCd = liveCd;
        }
      }
    }

    if (!numericSubCd && target) {
      const foundInSubjects = subjects.find(s =>
        s.id === target || s.code === target || s.name === target || (s as any).sub_cd === target || (s as any).sub_addinfo === target
      );
      if (foundInSubjects) {
        const subCd = String((foundInSubjects as any).sub_cd || foundInSubjects.code || '').trim();
        if (subCd && /^\d+$/.test(subCd)) {
          numericSubCd = subCd;
        }
      }
    }

    // 2. If numeric subject code xx is found (e.g. "88626"):
    // Auto topic code becomes xx1, xx2, xx3...
    if (numericSubCd) {
      let maxNum = 0;
      let matchingCount = 0;

      allTopics.forEach((t: any) => {
        const tCode = String(t.code || '').trim().toUpperCase();
        const tSub = String(t.subject_code || t.subject_id || '').trim();

        // If code starts with the exact numeric subject code (e.g. "886261", "886262")
        if (tCode.startsWith(numericSubCd)) {
          matchingCount++;
          const remainder = tCode.slice(numericSubCd.length).replace(/^[-_T\s]+/, '');
          const n = parseInt(remainder, 10);
          if (!isNaN(n) && n > maxNum) {
            maxNum = n;
          }
        }
        // Or if topic's subject matches numericSubCd or target
        else if (tSub === numericSubCd || (target && tSub === target)) {
          matchingCount++;
          const match = tCode.match(/(\d+)$/);
          if (match && match[1]) {
            const n = parseInt(match[1], 10);
            if (!isNaN(n) && n > maxNum) {
              maxNum = n;
            }
          }
        }
      });

      const nextOrder = Math.max(maxNum + 1, matchingCount + 1);
      return `${numericSubCd}${nextOrder}`;
    }

    // 3. Fallback for non-numeric subjects (e.g. custom non-SRMS paper codes)
    let rawPaperCode = subjectObj?.sub_addinfo || subjectObj?.code || '';
    if (!rawPaperCode && target) {
      const foundInSubjects = subjects.find(s => s.id === target || s.code === target || s.name === target);
      if (foundInSubjects) rawPaperCode = foundInSubjects.code || (foundInSubjects as any).sub_addinfo || '';
    }
    const cleanPaperCode = (rawPaperCode || target || 'TOPIC').replace(/\s+/g, '').toUpperCase();

    let fallbackMax = 0;
    let fallbackCount = 0;
    allTopics.forEach((t: any) => {
      const tCode = String(t.code || '').trim().toUpperCase();
      const tSub = String(t.subject_code || t.subject_id || '').trim().toUpperCase();
      if (cleanPaperCode && tCode.startsWith(cleanPaperCode)) {
        fallbackCount++;
        const remainder = tCode.slice(cleanPaperCode.length).replace(/^[-_T\s]+/, '');
        const n = parseInt(remainder, 10);
        if (!isNaN(n) && n > fallbackMax) fallbackMax = n;
      } else if (tSub === cleanPaperCode || (target && tSub === target.toUpperCase())) {
        fallbackCount++;
        const match = tCode.match(/(\d+)$/);
        if (match && match[1]) {
          const n = parseInt(match[1], 10);
          if (!isNaN(n) && n > fallbackMax) fallbackMax = n;
        }
      }
    });

    const fallbackOrder = Math.max(fallbackMax + 1, fallbackCount + 1);
    if (/^\d+$/.test(cleanPaperCode)) {
      return `${cleanPaperCode}${fallbackOrder}`;
    }
    return `${cleanPaperCode}-T${fallbackOrder}`;
  };

  const getNextSubTopicCodeForTopic = (
    topicCodeOrId: string,
    allCompetencies: any[],
    subjectObj?: any,
    tempQueue?: TempCompetencyItem[]
  ): string => {
    const targetTopic = String(topicCodeOrId || '').trim();
    const cleanTopic = targetTopic.replace(/[-_]ST\d+$/i, '').trim();

    // 1. Gather all existing subtopic codes for this topic or subject
    const matchingCodes: string[] = [];

    allCompetencies.forEach((c: any) => {
      const cTopic = String(c.topic_code || c.topic_id || '').trim();
      const cCode = String(c.code || '').trim().toUpperCase();

      if (cleanTopic && (cTopic === cleanTopic || cCode.startsWith(cleanTopic.toUpperCase()))) {
        matchingCodes.push(cCode);
      } else if (!cleanTopic) {
        matchingCodes.push(cCode);
      }
    });

    if (tempQueue && tempQueue.length > 0) {
      tempQueue.forEach(it => {
        if (it.code) matchingCodes.push(it.code.trim().toUpperCase());
      });
    }

    let maxNum = 0;
    matchingCodes.forEach(code => {
      const stMatch = code.match(/ST(\d+)/i) || code.match(/(?:^|[-_\s])(\d+)$/);
      if (stMatch && stMatch[1]) {
        const n = parseInt(stMatch[1], 10);
        if (!isNaN(n) && n > maxNum) {
          maxNum = n;
        }
      }
    });

    const nextSeq = String(Math.max(maxNum + 1, matchingCodes.length + 1)).padStart(2, '0');
    if (cleanTopic) {
      return `${cleanTopic}-ST${nextSeq}`;
    }
    return `ST${nextSeq}`;
  };

  const fetchUnitSubjects = async (
    colgcd?: string,
    coursecd?: string,
    branchcd?: string,
    batchcd?: string,
    semcd?: string,
    seccd?: string,
    tenantSlug?: string
  ) => {
    setLoadingUnitSubjects(true);
    setUnitLiveSubjects([]);
    const targetSlug = getFormCollegeSlug(tenantSlug || formData.college_id || formData.college_slug || selectedCollegeFilter);
    const isSrms = targetSlug.toLowerCase().includes('srms');

    // Resolve clean integer codes
    let cd = '1';
    const rawCd = String(colgcd || formData.college_id || '').trim();
    if (rawCd && /^\d+$/.test(rawCd)) {
      cd = rawCd;
    } else if (targetSlug.includes('cetr')) {
      cd = '2';
    } else if (targetSlug.includes('ims')) {
      cd = '11';
    } else if (targetSlug.includes('unnao')) {
      cd = '3';
    } else if (targetSlug.includes('law')) {
      cd = '4';
    } else if (targetSlug.includes('ibs')) {
      cd = '5';
    } else if (targetSlug.includes('iahs')) {
      cd = '6';
    } else if (targetSlug.includes('nursing-school')) {
      cd = '8';
    } else if (targetSlug.includes('nursing')) {
      cd = '9';
    } else {
      cd = '1';
    }

    const crs = String(coursecd || formData.course_cd || '1').match(/\d+/)?.[0] || '1';
    const br = String(branchcd || formData.branch_cd || '1').match(/\d+/)?.[0] || '1';

    let bat = '17';
    const rawBat = String(batchcd || formData.batch_cd || formData.batch_id || '17').trim();
    if (rawBat === '2024') {
      bat = '17';
    } else {
      bat = rawBat.match(/\d+/)?.[0] || '17';
    }

    const sem = String(semcd || formData.sem_cd || '5').match(/\d+/)?.[0] || '5';
    const sec = String(seccd || formData.sec_cd || '1').match(/\d+/)?.[0] || '1';

    // 1. If SRMS tenant: use SRMS live API (https://myportal.srms.ac.in/SRMSERP/AdminAttendance/GetAllSubjectDetail)
    if (isSrms) {
      try {
        const payload = {
          colgcd: cd,
          coursecd: crs,
          branchcd: br,
          batchcd: bat,
          semcd: sem,
          seccd: sec,
          tenant: targetSlug,
        };
        const res = await fetch('/api/srms/all-subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            // Strictly enforce semester matching on live API response
            const semFiltered = data.filter((s: any) =>
              !sem || String(s.sem_cd) === String(sem) || String(s.semester_name || '').includes(String(sem))
            );
            const finalList = semFiltered.length > 0 ? semFiltered : data;
            setUnitLiveSubjects(finalList);
            setLoadingUnitSubjects(false);
            return finalList;
          }
        }
      } catch (err) {
        console.warn('[AdminMaster] SRMS live subjects fetch error:', err);
      }
    }

    // 2. Non-SRMS Tenant: get it from Subject Linker (faculty-subjects) in ERP / Master
    try {
      const linkRes = await fetch(`${API_BASE}/faculty-subjects?tenant=${encodeURIComponent(targetSlug)}`, {
        headers: getAuthHeaders(),
      }).catch(() => null);
      if (linkRes && linkRes.ok) {
        const linkJson = await linkRes.json();
        const linkList = linkJson.data || linkJson;
        if (Array.isArray(linkList) && linkList.length > 0) {
          const filteredLinks = linkList.filter((l: any) =>
            (!br || String(l.subject_department_code) === String(br) || String(l.department_id) === String(br)) &&
            (!sem || String(l.semester || l.sem_cd || '').includes(String(sem)))
          );
          const activeList = filteredLinks.length > 0 ? filteredLinks : linkList;
          const mapped = activeList.map((l: any) => ({
            colg_cd: Number(cd) || 1,
            sub_cd: String(l.subject_code || l.subject_id),
            sub_name: l.subject_name,
            mst_sub_name: `${l.subject_name} (Linked: ${l.faculty_name || 'Staff'})`,
            sub_addinfo: l.subject_code || l.subject_id,
            course_cd: Number(crs) || 1,
            branch_cd: Number(br) || 1,
            batch_cd: Number(bat) || 1,
            sem_cd: Number(sem) || 1,
            id: l.subject_id,
            faculty_name: l.faculty_name,
            SubTyp: 'THEORY',
          }));
          setUnitLiveSubjects(mapped);
          setLoadingUnitSubjects(false);
          return mapped;
        }
      }
    } catch (linkErr) {
      console.warn('[AdminMaster] Subject linker fetch error:', linkErr);
    }

    // 3. Fallback: filter master subjects in memory strictly by semester
    const filteredMaster = subjects.filter(s =>
      (!formData.college_id || s.college_id === formData.college_id || s.college_slug === targetSlug) &&
      (!crs || String(s.course_cd) === String(crs)) &&
      (!br || String(s.branch_cd) === String(br) || String(s.department_id) === String(br)) &&
      (!sem || String(s.sem_cd) === String(sem) || String(s.semester || '').includes(String(sem)))
    );
    const mappedFallback = filteredMaster.map(s => ({
      colg_cd: Number(cd) || 1,
      sub_cd: String(s.code || s.id),
      sub_name: s.name,
      mst_sub_name: `${s.name} ${s.type || 'THEORY'}`,
      sub_addinfo: s.code || '',
      course_cd: Number(crs) || 1,
      branch_cd: Number(br) || 1,
      batch_cd: Number(bat) || 1,
      sem_cd: Number(sem) || 1,
      id: s.id,
      SubTyp: s.type || 'THEORY',
    }));
    setUnitLiveSubjects(mappedFallback);
    setLoadingUnitSubjects(false);
    return mappedFallback;
  };

  const fetchTopicSubjects = async (
    colgcd?: string,
    coursecd?: string,
    branchcd?: string,
    batchcd?: string,
    semcd?: string,
    seccd?: string,
    tenantSlug?: string
  ) => {
    setLoadingTopicSubjects(true);
    setTopicLiveSubjects([]);
    const targetSlug = getFormCollegeSlug(tenantSlug || formData.college_id || formData.college_slug || selectedCollegeFilter);
    const isSrms = targetSlug.toLowerCase().includes('srms');

    // Resolve clean integer codes
    let cd = '1';
    const rawCd = String(colgcd || formData.college_id || '').trim();
    if (rawCd && /^\d+$/.test(rawCd)) {
      cd = rawCd;
    } else if (targetSlug.includes('cetr')) {
      cd = '2';
    } else if (targetSlug.includes('ims')) {
      cd = '11';
    } else if (targetSlug.includes('unnao')) {
      cd = '3';
    } else if (targetSlug.includes('law')) {
      cd = '4';
    } else if (targetSlug.includes('ibs')) {
      cd = '5';
    } else if (targetSlug.includes('iahs')) {
      cd = '6';
    } else if (targetSlug.includes('nursing-school')) {
      cd = '8';
    } else if (targetSlug.includes('nursing')) {
      cd = '9';
    } else {
      cd = '1';
    }

    const crs = String(coursecd || formData.course_cd || '1').match(/\d+/)?.[0] || '1';
    const br = String(branchcd || formData.branch_cd || '1').match(/\d+/)?.[0] || '1';

    let bat = '17';
    const rawBat = String(batchcd || formData.batch_cd || formData.batch_id || '17').trim();
    if (rawBat === '2024') {
      bat = '17';
    } else {
      bat = rawBat.match(/\d+/)?.[0] || '17';
    }

    const sem = String(semcd || formData.sem_cd || '5').match(/\d+/)?.[0] || '5';
    const sec = String(seccd || formData.sec_cd || '1').match(/\d+/)?.[0] || '1';

    // 1. If SRMS tenant: use SRMS live API (https://myportal.srms.ac.in/SRMSERP/AdminAttendance/GetAllSubjectDetail)
    if (isSrms) {
      try {
        const payload = {
          colgcd: cd,
          coursecd: crs,
          branchcd: br,
          batchcd: bat,
          semcd: sem,
          seccd: sec,
          tenant: targetSlug,
        };
        const res = await fetch('/api/srms/all-subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            // Strictly enforce semester matching on live API response
            const semFiltered = data.filter((s: any) =>
              !sem || String(s.sem_cd) === String(sem) || String(s.semester_name || '').includes(String(sem))
            );
            const finalList = semFiltered.length > 0 ? semFiltered : data;
            setTopicLiveSubjects(finalList);
            setLoadingTopicSubjects(false);
            return finalList;
          }
        }
      } catch (err) {
        console.warn('[AdminMaster] SRMS live topic subjects fetch error:', err);
      }
    }

    // 2. Non-SRMS Tenant: get it from Subject Linker (faculty-subjects) in ERP / Master
    try {
      const linkRes = await fetch(`${API_BASE}/faculty-subjects?tenant=${encodeURIComponent(targetSlug)}`, {
        headers: getAuthHeaders(),
      }).catch(() => null);
      if (linkRes && linkRes.ok) {
        const linkJson = await linkRes.json();
        const linkList = linkJson.data || linkJson;
        if (Array.isArray(linkList) && linkList.length > 0) {
          const filteredLinks = linkList.filter((l: any) =>
            (!br || String(l.subject_department_code) === String(br) || String(l.department_id) === String(br)) &&
            (!sem || String(l.semester || l.sem_cd || '').includes(String(sem)))
          );
          const activeList = filteredLinks.length > 0 ? filteredLinks : linkList;
          const mapped = activeList.map((l: any) => ({
            colg_cd: Number(cd) || 1,
            sub_cd: String(l.subject_code || l.subject_id),
            sub_name: l.subject_name,
            mst_sub_name: `${l.subject_name} (Linked: ${l.faculty_name || 'Staff'})`,
            sub_addinfo: l.subject_code || l.subject_id,
            course_cd: Number(crs) || 1,
            branch_cd: Number(br) || 1,
            batch_cd: Number(bat) || 1,
            sem_cd: Number(sem) || 1,
            id: l.subject_id,
            faculty_name: l.faculty_name,
            SubTyp: 'THEORY',
          }));
          setTopicLiveSubjects(mapped);
          setLoadingTopicSubjects(false);
          return mapped;
        }
      }
    } catch (linkErr) {
      console.warn('[AdminMaster] Topic subject linker fetch error:', linkErr);
    }

    // 3. Fallback: filter master subjects in memory strictly by semester
    const filteredMaster = subjects.filter(s =>
      (!formData.college_id || s.college_id === formData.college_id || s.college_slug === targetSlug) &&
      (!crs || String(s.course_cd) === String(crs)) &&
      (!br || String(s.branch_cd) === String(br) || String(s.department_id) === String(br)) &&
      (!sem || String(s.sem_cd) === String(sem) || String(s.semester || '').includes(String(sem)))
    );
    const mappedFallback = filteredMaster.map(s => ({
      colg_cd: Number(cd) || 1,
      sub_cd: String(s.code || s.id),
      sub_name: s.name,
      mst_sub_name: `${s.name} ${s.type || 'THEORY'}`,
      sub_addinfo: s.code || '',
      course_cd: Number(crs) || 1,
      branch_cd: Number(br) || 1,
      batch_cd: Number(bat) || 1,
      sem_cd: Number(sem) || 1,
      id: s.id,
      SubTyp: s.type || 'THEORY',
    }));
    setTopicLiveSubjects(mappedFallback);
    setLoadingTopicSubjects(false);
    return mappedFallback;
  };

  const fetchSubTopicSubjects = async (
    colgcd?: string,
    coursecd?: string,
    branchcd?: string,
    batchcd?: string,
    semcd?: string,
    seccd?: string,
    tenantSlug?: string
  ) => {
    setLoadingSubTopicSubjects(true);
    setSubTopicLiveSubjects([]);
    const targetSlug = getFormCollegeSlug(tenantSlug || formData.college_id || formData.college_slug || selectedCollegeFilter);
    const isSrms = targetSlug.toLowerCase().includes('srms');

    // Resolve clean integer codes
    let cd = '1';
    const rawCd = String(colgcd || formData.college_id || '').trim();
    if (rawCd && /^\d+$/.test(rawCd)) {
      cd = rawCd;
    } else if (targetSlug.includes('cetr')) {
      cd = '2';
    } else if (targetSlug.includes('ims')) {
      cd = '11';
    } else if (targetSlug.includes('unnao')) {
      cd = '3';
    } else if (targetSlug.includes('law')) {
      cd = '4';
    } else if (targetSlug.includes('ibs')) {
      cd = '5';
    } else if (targetSlug.includes('iahs')) {
      cd = '6';
    } else if (targetSlug.includes('nursing-school')) {
      cd = '8';
    } else if (targetSlug.includes('nursing')) {
      cd = '9';
    } else {
      cd = '1';
    }

    const crs = String(coursecd || formData.course_cd || '1').match(/\d+/)?.[0] || '1';
    const br = String(branchcd || formData.branch_cd || '1').match(/\d+/)?.[0] || '1';

    let bat = '17';
    const rawBat = String(batchcd || formData.batch_cd || formData.batch_id || '17').trim();
    if (rawBat === '2024') {
      bat = '17';
    } else {
      bat = rawBat.match(/\d+/)?.[0] || '17';
    }

    const sem = String(semcd || formData.sem_cd || '5').match(/\d+/)?.[0] || '5';
    const sec = String(seccd || formData.sec_cd || '1').match(/\d+/)?.[0] || '1';

    // 1. If SRMS tenant: use SRMS live API (https://myportal.srms.ac.in/SRMSERP/AdminAttendance/GetAllSubjectDetail)
    if (isSrms) {
      try {
        const payload = {
          colgcd: cd,
          coursecd: crs,
          branchcd: br,
          batchcd: bat,
          semcd: sem,
          seccd: sec,
          tenant: targetSlug,
        };
        const res = await fetch('/api/srms/all-subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            // Strictly enforce semester matching on live API response
            const semFiltered = data.filter((s: any) =>
              !sem || String(s.sem_cd) === String(sem) || String(s.semester_name || '').includes(String(sem))
            );
            const finalList = semFiltered.length > 0 ? semFiltered : data;
            setSubTopicLiveSubjects(finalList);
            setLoadingSubTopicSubjects(false);
            return finalList;
          }
        }
      } catch (err) {
        console.warn('[AdminMaster] SRMS live subtopic subjects fetch error:', err);
      }
    }

    // 2. Non-SRMS Tenant: get it from Subject Linker (faculty-subjects) in ERP / Master
    try {
      const linkRes = await fetch(`${API_BASE}/faculty-subjects?tenant=${encodeURIComponent(targetSlug)}`, {
        headers: getAuthHeaders(),
      }).catch(() => null);
      if (linkRes && linkRes.ok) {
        const linkJson = await linkRes.json();
        const linkList = linkJson.data || linkJson;
        if (Array.isArray(linkList) && linkList.length > 0) {
          const filteredLinks = linkList.filter((l: any) =>
            (!br || String(l.subject_department_code) === String(br) || String(l.department_id) === String(br)) &&
            (!sem || String(l.semester || l.sem_cd || '').includes(String(sem)))
          );
          const activeList = filteredLinks.length > 0 ? filteredLinks : linkList;
          const mapped = activeList.map((l: any) => ({
            colg_cd: Number(cd) || 1,
            sub_cd: String(l.subject_code || l.subject_id),
            sub_name: l.subject_name,
            mst_sub_name: `${l.subject_name} (Linked: ${l.faculty_name || 'Staff'})`,
            sub_addinfo: l.subject_code || l.subject_id,
            course_cd: Number(crs) || 1,
            branch_cd: Number(br) || 1,
            batch_cd: Number(bat) || 1,
            sem_cd: Number(sem) || 1,
            id: l.subject_id,
            faculty_name: l.faculty_name,
            SubTyp: 'THEORY',
          }));
          setSubTopicLiveSubjects(mapped);
          setLoadingSubTopicSubjects(false);
          return mapped;
        }
      }
    } catch (linkErr) {
      console.warn('[AdminMaster] Subtopic subject linker fetch error:', linkErr);
    }

    // 3. Fallback: filter master subjects in memory strictly by semester
    const filteredMaster = subjects.filter(s =>
      (!formData.college_id || s.college_id === formData.college_id || s.college_slug === targetSlug) &&
      (!crs || String(s.course_cd) === String(crs)) &&
      (!br || String(s.branch_cd) === String(br) || String(s.department_id) === String(br)) &&
      (!sem || String(s.sem_cd) === String(sem) || String(s.semester || '').includes(String(sem)))
    );
    const mappedFallback = filteredMaster.map(s => ({
      colg_cd: Number(cd) || 1,
      sub_cd: String(s.code || s.id),
      sub_name: s.name,
      mst_sub_name: `${s.name} ${s.type || 'THEORY'}`,
      sub_addinfo: s.code || '',
      course_cd: Number(crs) || 1,
      branch_cd: Number(br) || 1,
      batch_cd: Number(bat) || 1,
      sem_cd: Number(sem) || 1,
      id: s.id,
      SubTyp: s.type || 'THEORY',
    }));
    setSubTopicLiveSubjects(mappedFallback);
    setLoadingSubTopicSubjects(false);
    return mappedFallback;
  };

  const handleBulkSyncSrmsSubjects = async (subList?: any[]) => {
    const listToSync = subList && subList.length > 0 ? subList : srmsLiveSubjects;
    if (!listToSync || listToSync.length === 0) {
      alert('No SRMS live subjects available to sync. Please ensure College, Course, Branch, Batch and Semester are selected.');
      return;
    }
    setSyncing(true);
    setSyncMessage('');
    const targetSlug = getFormCollegeSlug(formData.college_id || formData.college_slug || selectedCollegeFilter);
    let successCount = 0;
    try {
      for (const item of listToSync) {
        const payload = {
          code: String(item.sub_cd || item.sub_addinfo || '').trim(),
          name: String(item.sub_name || item.mst_sub_name || '').trim(),
          mst_sub_name: item.mst_sub_name || null,
          sub_addinfo: item.sub_addinfo || null,
          department_id: formData.department_id || String(item.branch_cd || '1'),
          course_cd: String(item.course_cd || formData.course_cd || '13'),
          course_name: item.course_name || formData.course_name || 'BCA',
          branch_cd: String(item.branch_cd || formData.branch_cd || '1'),
          batch_cd: String(item.batch_cd || formData.batch_cd || '2'),
          sem_cd: String(item.sem_cd || formData.sem_cd || '3'),
          semester: item.semester_name || String(item.sem_cd || formData.sem_cd || '3'),
          credits: 4,
          type: item.SubTyp || 'THEORY',
          is_longitudinal: false,
          is_active: item.active_flg !== undefined ? Boolean(item.active_flg) : true,
        };
        const res = await fetch(`${API_BASE}/subjects?tenant=${targetSlug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) successCount++;
      }
      setSyncMessage(`Successfully synced ${successCount} of ${listToSync.length} subjects from SRMS ERP! 🎉`);
      await fetchCategoryData('subjects', selectedCollegeFilter);
      setTimeout(() => setSyncMessage(''), 6000);
    } catch (err: any) {
      console.error('Bulk sync subjects error:', err);
      setSyncMessage('Error syncing some subjects from SRMS ERP.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncSubjectsAndOfferings = async () => {
    setSyncing(true);
    setSyncMessage('⚡ Intelligently syncing subjects and offerings from SRMS ERP (Preserving attendance)...');
    try {
      const colCourses = getCoursesForCollege(selectedCollegeFilter);
      const targetCourseCd = selectedCourseFilter !== 'all' ? selectedCourseFilter : (colCourses[0]?.course_cd || colCourses[0]?.code || '');
      const availableDepts = departments.filter(d => (d.college_id === selectedCollegeFilter || d.college_slug === selectedCollegeFilter || String(d.colg_cd) === String(selectedCollegeFilter)) && (d.course_cd === targetCourseCd || d.course_code === targetCourseCd));
      const targetBranchCd = selectedBranchFilter !== 'all' ? selectedBranchFilter : (availableDepts[0]?.branch_cd || availableDepts[0]?.code || '');
      const targetBatchCd = selectedBatchFilter !== 'all' ? selectedBatchFilter : '';
      const targetSemCd = selectedSemesterFilter !== 'all' ? selectedSemesterFilter : '';

      const queryParams = new URLSearchParams();
      const slug = getActiveTenantSlug();
      if (slug && slug !== 'all') queryParams.append('tenant', slug);
      if (targetCourseCd) queryParams.append('coursecd', targetCourseCd);
      if (targetBranchCd) queryParams.append('branchcd', targetBranchCd);
      if (targetBatchCd) queryParams.append('batchcd', targetBatchCd);
      if (targetSemCd) queryParams.append('semcd', targetSemCd);

      const res = await fetch(`${API_BASE}/subject-offerings/sync-external?${queryParams.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const json = await res.json();
        const list = json.data || [];
        setOfferings(list);
        await Promise.all([
          fetchCategoryData('subjects', selectedCollegeFilter),
          fetchCategoryData('subject-offerings', selectedCollegeFilter),
        ]);
        setSyncMessage(`⚡ Successfully synced ${list.length} Subject Offerings & linked existing attendance records ✅`);
        setTimeout(() => setSyncMessage(''), 6000);
      } else {
        setSyncMessage('⚠️ Could not sync from external SRMS API. Please verify server connection.');
      }
    } catch (err: any) {
      console.error('Sync error:', err);
      setSyncMessage(`❌ Sync failed: ${err.message || 'Network error'}`);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      let initialCollegeCode = '1';
      try {
        const res = await fetch(`${COLLEGE_API_BASE}/colleges`);
        if (res.ok) {
          const json = await res.json();
          const list: College[] = json.data || json || [];
          setColleges(list);

          const savedSlug = typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant')) : null;
          const savedColgCd = typeof window !== 'undefined' ? localStorage.getItem('colg_cd') : null;

          const defaultCol = list.find(c =>
            (savedSlug && (c.slug === savedSlug || c.id === savedSlug)) ||
            (savedColgCd && (String((c as any).colg_cd) === savedColgCd || String(c.id) === savedColgCd || String(c.code) === savedColgCd)) ||
            c.slug === 'srms-cet-bareilly' ||
            String(c.code) === '1'
          ) || list[0];

          if (defaultCol) {
            initialCollegeCode = defaultCol.code || defaultCol.id || defaultCol.slug;
            setSelectedCollegeFilter(initialCollegeCode);
          }
        }
      } catch (err) {
        console.error('[AdminMaster] Error loading colleges:', err);
      }

      await Promise.all([
        fetchCourses(),
        fetchCategoryData('departments', initialCollegeCode),
        fetchCategoryData('subjects', initialCollegeCode),
        fetchCategoryData('professional-linkers', initialCollegeCode),
        fetchCategoryData('units', initialCollegeCode),
        fetchCategoryData('topics', initialCollegeCode),
        fetchCategoryData('competencies', initialCollegeCode),
        fetchCategoryData('delivery-types', initialCollegeCode),
        fetchCategoryData('subject-offerings', initialCollegeCode),
        fetchProfessionals(initialCollegeCode),
        fetchBatches(initialCollegeCode),
      ]);
    };
    loadAll();
  }, []);

  const handleCollegeFilterChange = async (newColgFilter: string) => {
    setSelectedCollegeFilter(newColgFilter);
    setSelectedCourseFilter('all');
    setSelectedBranchFilter('all');
    setSelectedBatchFilter('all');
    setSelectedSemesterFilter('all');
    setSelectedSubjectFilter('all');
    setSelectedUnitFilter('all');
    setSelectedTopicFilter('all');
    setCurrentPage(1);
    await Promise.all([
      fetchCourses(),
      fetchCategoryData(activeTab, newColgFilter),
      fetchCategoryData('departments', newColgFilter),
      fetchCategoryData('subjects', newColgFilter),
      fetchCategoryData('delivery-types', newColgFilter),
      fetchCategoryData('subject-offerings', newColgFilter),
      fetchCategoryData('professional-linkers', newColgFilter),
      fetchCategoryData('units', newColgFilter),
      fetchCategoryData('topics', newColgFilter),
      fetchCategoryData('competencies', newColgFilter),
      fetchProfessionals(newColgFilter),
      fetchBatches(newColgFilter),
    ]);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  // Keep unit code synchronized with selected subject's dynamic numeric code if available
  useEffect(() => {
    if (activeTab === 'units' && !editingItem && (formData.subject_id || formData.subject_code)) {
      const selectedSubjectObj = unitLiveSubjects.find((s: any) =>
        String(s.sub_cd || s.code || s.id) === String(formData.subject_id || formData.subject_code) ||
        String(s.sub_addinfo || '') === String(formData.subject_code)
      ) || subjects.find(s => s.id === formData.subject_id || s.code === formData.subject_id || s.code === formData.subject_code);

      const numCd = getSubjectNumericCode(selectedSubjectObj, formData.subject_id || formData.subject_code);
      if (numCd) {
        if (!formData.code || !formData.code.startsWith(numCd)) {
          const nextU = getNextUnitCodeForSubject(numCd, units, selectedSubjectObj);
          setFormData(prev => ({
            ...prev,
            code: nextU.code,
            name: (!prev.name || prev.name === prev.code || prev.name.startsWith('UNIT') || prev.name.includes('-UNIT')) ? nextU.code : prev.name,
            unit_order: nextU.order,
          }));
        }
      }
    }
  }, [activeTab, editingItem, formData.subject_id, formData.subject_code, unitLiveSubjects, units]);

  const isMatchCollege = (item: any) => {
    if (activeTab === 'delivery-types') return true;
    if (selectedCollegeFilter === 'all') return true;
    const targetCol = colleges.find(c => c.id === selectedCollegeFilter || c.code === selectedCollegeFilter || c.slug === selectedCollegeFilter);
    const targetId = targetCol?.id;
    const targetSlug = targetCol?.slug || selectedCollegeFilter;
    const targetCode = targetCol?.code;
    return (
      (targetId && item.college_id === targetId) ||
      (targetCode && String(item.college_id) === String(targetCode)) ||
      (targetCode && String(item.colg_cd) === String(targetCode)) ||
      (targetCode && String(item.college_code) === String(targetCode)) ||
      (targetSlug && item.college_slug === targetSlug) ||
      item.college_slug === selectedCollegeFilter ||
      item.college_id === selectedCollegeFilter
    );
  };

  const handleAddNew = () => {
    setEditingItem(null);
    const defaultCol = selectedCollegeFilter !== 'all'
      ? colleges.find(c => c.id === selectedCollegeFilter || c.code === selectedCollegeFilter || c.slug === selectedCollegeFilter) || colleges[0]
      : colleges[0];

    const defaultCollegeId = defaultCol?.code || defaultCol?.id || '1';
    const defaultCollegeSlug = defaultCol?.slug || 'srms-cet-bareilly';

    if (activeTab === 'departments') {
      const colCourses = getCoursesForCollege(defaultCollegeId || defaultCollegeSlug);
      const defaultCourseCd = colCourses[0]?.course_cd || colCourses[0]?.code || '1';
      setFormData({
        college_id: defaultCollegeId,
        college_slug: defaultCollegeSlug,
        course_cd: defaultCourseCd,
        code: '',
        branch_cd: '',
        name: '',
        type: 'General',
        is_active: true,
      });
    } else if (activeTab === 'subjects') {
      const colCourses = getCoursesForCollege(defaultCollegeId || defaultCollegeSlug);
      const firstCourseCd = colCourses[0]?.course_cd || colCourses[0]?.code || '13';
      const availableDepts = departments.filter(d =>
        (d.college_id === defaultCollegeId || d.college_slug === defaultCollegeSlug || String(d.colg_cd) === String(defaultCollegeId)) &&
        (!firstCourseCd || d.course_cd === firstCourseCd || d.course_code === firstCourseCd)
      );
      const firstBranchCd = availableDepts[0]?.branch_cd || availableDepts[0]?.code || availableDepts[0]?.id || '1';
      const targetColCd = colleges.find(c => c.id === defaultCollegeId || c.slug === defaultCollegeSlug || c.code === defaultCollegeId)?.code || defaultCollegeId || '1';

      setFormData({
        college_id: targetColCd,
        college_slug: defaultCollegeSlug,
        course_cd: firstCourseCd,
        department_id: firstBranchCd,
        branch_cd: firstBranchCd,
        batch_cd: '2',
        sem_cd: '3',
        code: '',
        name: '',
        credits: 4,
        type: 'THEORY',
        is_longitudinal: false,
      });
      fetchSrmsLiveSubjects(targetColCd, firstCourseCd, firstBranchCd, '2', '3');
    } else if (activeTab === 'professional-linkers') {
      setFormData({
        college_id: defaultCollegeId,
        college_slug: defaultCollegeSlug,
        code: 'LINK-BTECH-P1',
        name: '',
        course_cd: '',
        professional_phase: '1st Professional (Phase I)',
        academic_session: '2024-2025',
        description: '',
      });
    } else if (activeTab === 'subject-offerings') {
      const colCourses = getCoursesForCollege(defaultCollegeId || defaultCollegeSlug);
      const firstCourseCd = colCourses[0]?.course_cd || colCourses[0]?.code || '1';
      const availableDepts = departments.filter(d =>
        (d.college_id === defaultCollegeId || d.college_slug === defaultCollegeSlug || String(d.colg_cd) === String(defaultCollegeId)) &&
        (!firstCourseCd || d.course_cd === firstCourseCd || d.course_code === firstCourseCd)
      );
      const firstBranchCd = availableDepts[0]?.branch_cd || availableDepts[0]?.code || availableDepts[0]?.id || '1';
      const availableSubjects = subjects.filter(s =>
        (!defaultCollegeId || s.college_id === defaultCollegeId || s.college_slug === defaultCollegeSlug || String(s.colg_cd) === String(defaultCollegeId)) &&
        (!firstCourseCd || s.course_cd === firstCourseCd) &&
        (!firstBranchCd || s.branch_cd === firstBranchCd || s.department_id === firstBranchCd)
      );
      const availableBatches = batches.filter(b =>
        (!defaultCollegeId || b.college_id === defaultCollegeId || b.college_slug === defaultCollegeSlug || String(b.colg_cd) === String(defaultCollegeId)) &&
        (!firstCourseCd || b.course_cd === firstCourseCd)
      );
      const availablePhases = profPhases.filter(p =>
        (!defaultCollegeId || p.college_id === defaultCollegeId || p.college_slug === defaultCollegeSlug) &&
        (!firstCourseCd || p.course_cd === firstCourseCd)
      );

      setFormData({
        college_id: defaultCollegeId,
        college_slug: defaultCollegeSlug,
        course_cd: firstCourseCd,
        branch_cd: firstBranchCd,
        department_id: firstBranchCd,
        subject_id: availableSubjects[0]?.id || subjects[0]?.id || '',
        batch_id: availableBatches[0]?.id || '',
        batch_year: availableBatches[0]?.year || 2024,
        prof_id: availablePhases[0]?.id || profPhases[0]?.id || '',
        dtype_id: deliveryTypes[0]?.id || '',
        hours_allotted: 100,
        is_active: true,
      });
    } else if (activeTab === 'delivery-types') {
      setFormData({ code: '', name: '' });
    } else if (activeTab === 'units') {
      const targetCol = colleges.find(c => c.code === selectedCollegeFilter || c.id === selectedCollegeFilter || c.slug === selectedCollegeFilter) || colleges[0];
      const targetColCd = targetCol?.code || targetCol?.id || defaultCollegeId || '1';
      const targetColSlug = targetCol?.slug || defaultCollegeSlug || '';
      const colCourses = getCoursesForCollege(targetCol?.id || targetCol?.slug);
      const chosenCourseCd = selectedCourseFilter !== 'all' ? selectedCourseFilter : (colCourses[0]?.course_cd || colCourses[0]?.code || '1');

      const availableDepts = departments.filter(d =>
        (d.college_id === targetCol?.id || d.college_slug === targetCol?.slug || String(d.colg_cd) === String(targetColCd)) &&
        (!chosenCourseCd || d.course_cd === chosenCourseCd || d.course_code === chosenCourseCd)
      );
      const chosenBranchCd = selectedBranchFilter !== 'all' ? selectedBranchFilter : (availableDepts[0]?.branch_cd || availableDepts[0]?.code || '1');

      const availableBatches = batches.filter(b =>
        (!targetCol || b.college_id === targetCol.id || b.college_slug === targetCol.slug || String(b.colg_cd) === String(targetColCd)) &&
        (!chosenCourseCd || b.course_cd === chosenCourseCd)
      );
      const chosenBatch = availableBatches[0];
      const chosenBatchCd = chosenBatch?.batch_cd || chosenBatch?.code || '17';
      const chosenBatchYear = chosenBatch?.year || 2024;
      const chosenSemCd = '5';
      const chosenSecCd = '1';

      setUnitSubjectSearch('');
      setIsUnitSubjectDropdownOpen(false);

      const initialUnit = getNextUnitCodeForSubject('', units);

      setFormData({
        college_id: targetColCd,
        college_slug: targetColSlug,
        course_cd: chosenCourseCd,
        branch_cd: chosenBranchCd,
        department_id: chosenBranchCd,
        batch_id: chosenBatchCd,
        batch_cd: chosenBatchCd,
        batch_year: chosenBatchYear,
        sem_cd: chosenSemCd,
        semester: `Semester ${chosenSemCd}`,
        sec_cd: chosenSecCd,
        section: 'Section A',
        subject_id: '',
        subject_code: '',
        code: initialUnit.code,
        name: '',
        description: '',
        bloom_level: 'KL-2 (Understand)',
        unit_order: initialUnit.order,
        hours: 10,
        is_active: true,
      });

      fetchUnitSubjects(targetColCd, chosenCourseCd, chosenBranchCd, chosenBatchCd, chosenSemCd, chosenSecCd, targetColSlug);
    } else if (activeTab === 'topics') {
      const targetCol = colleges.find(c => c.code === selectedCollegeFilter || c.id === selectedCollegeFilter || c.slug === selectedCollegeFilter) || colleges[0];
      const targetColCd = targetCol?.code || targetCol?.id || defaultCollegeId || '1';
      const targetColSlug = targetCol?.slug || defaultCollegeSlug || '';
      const colCourses = getCoursesForCollege(targetCol?.id || targetCol?.slug);
      const chosenCourseCd = selectedCourseFilter !== 'all' ? selectedCourseFilter : (colCourses[0]?.course_cd || colCourses[0]?.code || '1');

      const availableDepts = departments.filter(d =>
        (d.college_id === targetCol?.id || d.college_slug === targetCol?.slug || String(d.colg_cd) === String(targetColCd)) &&
        (!chosenCourseCd || d.course_cd === chosenCourseCd || d.course_code === chosenCourseCd)
      );
      const chosenBranchCd = selectedBranchFilter !== 'all' ? selectedBranchFilter : (availableDepts[0]?.branch_cd || availableDepts[0]?.code || '1');

      const availableBatches = batches.filter(b =>
        (!targetCol || b.college_id === targetCol.id || b.college_slug === targetCol.slug || String(b.colg_cd) === String(targetColCd)) &&
        (!chosenCourseCd || b.course_cd === chosenCourseCd)
      );
      const chosenBatch = availableBatches[0];
      const chosenBatchCd = chosenBatch?.batch_cd || chosenBatch?.code || '17';
      const chosenBatchYear = chosenBatch?.year || 2024;
      const chosenSemCd = '5';
      const chosenSecCd = '1';

      setTopicSubjectSearch('');
      setIsTopicSubjectDropdownOpen(false);

      setFormData({
        college_id: targetColCd,
        college_slug: targetColSlug,
        course_cd: chosenCourseCd,
        branch_cd: chosenBranchCd,
        department_id: chosenBranchCd,
        batch_id: chosenBatchCd,
        batch_cd: chosenBatchCd,
        batch_year: chosenBatchYear,
        sem_cd: chosenSemCd,
        semester: `Semester ${chosenSemCd}`,
        sec_cd: chosenSecCd,
        section: 'Section A',
        subject_id: '',
        subject_code: '',
        unit_id: '',
        unit_code: '',
        bloom_level: 'KL-2 (Understand)',
        code: '',
        name: '',
        description: '',
        hours: 2,
        learning_method: 'Lecture',
        assessment_method: 'Written Assessment',
        linker_id: linkers[0]?.id || '',
        is_active: true,
      });

      fetchTopicSubjects(targetColCd, chosenCourseCd, chosenBranchCd, chosenBatchCd, chosenSemCd, chosenSecCd, targetColSlug);
    } else if (activeTab === 'competencies') {
      const targetCol = colleges.find(c => c.code === selectedCollegeFilter || c.id === selectedCollegeFilter || c.slug === selectedCollegeFilter) || colleges[0];
      const targetColCd = targetCol?.code || targetCol?.id || defaultCollegeId || '1';
      const targetColSlug = targetCol?.slug || defaultCollegeSlug || '';
      const colCourses = getCoursesForCollege(targetCol?.id || targetCol?.slug);
      const chosenCourseCd = selectedCourseFilter !== 'all' ? selectedCourseFilter : (colCourses[0]?.course_cd || colCourses[0]?.code || '1');

      const availableDepts = departments.filter(d =>
        (d.college_id === targetCol?.id || d.college_slug === targetCol?.slug || String(d.colg_cd) === String(targetColCd)) &&
        (!chosenCourseCd || d.course_cd === chosenCourseCd || d.course_code === chosenCourseCd)
      );
      const chosenBranchCd = selectedBranchFilter !== 'all' ? selectedBranchFilter : (availableDepts[0]?.branch_cd || availableDepts[0]?.code || '1');

      const availableBatches = batches.filter(b =>
        (!targetCol || b.college_id === targetCol.id || b.college_slug === targetCol.slug || String(b.colg_cd) === String(targetColCd)) &&
        (!chosenCourseCd || b.course_cd === chosenCourseCd)
      );
      const chosenBatch = availableBatches[0];
      const chosenBatchCd = chosenBatch?.batch_cd || chosenBatch?.code || '17';
      const chosenBatchYear = chosenBatch?.year || 2024;
      const chosenSemCd = '5';
      const chosenSecCd = '1';

      setSubTopicSubjectSearch('');
      setIsSubTopicSubjectDropdownOpen(false);

      setTempCompetencies([]);
      setSubTopicCode('ST01');
      setSubTopicName('');
      setSubTopicDesc('');
      setSubTopicDomain('Knowledge');
      setSubTopicLevel('Knows How');
      setSubTopicBloom('KL-2 (Understand)');
      setSubTopicCore(true);
      setSubTopicLearningMethod('Lecture');
      setSubTopicAssessmentMethod('Written Assessment');

      setFormData({
        college_id: targetColCd,
        college_slug: targetColSlug,
        course_cd: chosenCourseCd,
        branch_cd: chosenBranchCd,
        department_id: chosenBranchCd,
        batch_id: chosenBatchCd,
        batch_cd: chosenBatchCd,
        batch_year: chosenBatchYear,
        sem_cd: chosenSemCd,
        semester: `Semester ${chosenSemCd}`,
        sec_cd: chosenSecCd,
        section: 'Section A',
        subject_id: '',
        subject_code: '',
        unit_id: '',
        unit_code: '',
        topic_id: '',
        topic_code: '',
        bloom_level: 'KL-2 (Understand)',
        code: 'ST01',
        name: '',
        description: '',
        domain: 'Knowledge',
        level: 'Knows How',
        is_core: true,
        learning_method: 'Lecture',
        assessment_method: 'Written Assessment',
        linker_id: linkers[0]?.id || '',
        is_active: true,
      });

      fetchSubTopicSubjects(targetColCd, chosenCourseCd, chosenBranchCd, chosenBatchCd, chosenSemCd, chosenSecCd, targetColSlug);
    }
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    const matchedCol = colleges.find(c => c.id === item.college_id || c.code === item.college_id || c.slug === item.college_slug || c.code === item.college_code) || colleges[0];
    const collegeCodeOrId = matchedCol?.code || matchedCol?.id || item.college_id || '1';
    const collegeSlug = matchedCol?.slug || item.college_slug || 'srms-cet-bareilly';

    if (activeTab === 'departments') {
      setFormData({
        ...item,
        college_id: collegeCodeOrId,
        college_slug: collegeSlug,
        course_cd: item.course_cd || item.course_code || '',
        code: item.branch_cd || item.code || '',
        branch_cd: item.branch_cd || item.code || '',
        name: item.name || '',
        type: item.type || 'General',
        is_active: item.is_active !== false,
      });
      setIsModalOpen(true);
      return;
    }

    if (activeTab === 'subjects') {
      const matchedCourse = courses.find(c => c.course_cd === item.course_cd || c.code === item.course_cd || c.id === item.course_cd);
      setFormData({
        ...item,
        college_id: collegeCodeOrId,
        college_slug: collegeSlug,
        course_cd: item.course_cd || matchedCourse?.course_cd || matchedCourse?.code || '',
        department_id: item.branch_cd || item.department_code || item.department_id || '',
        code: item.code || '',
        name: item.name || '',
        credits: item.credits !== undefined ? Number(item.credits) : 4,
        type: item.type || 'Combined',
        is_longitudinal: Boolean(item.is_longitudinal),
        is_active: item.is_active !== false,
      });
      setIsModalOpen(true);
      return;
    }

    if (activeTab === 'professional-linkers') {
      setFormData({
        ...item,
        college_id: collegeCodeOrId,
        college_slug: collegeSlug,
        code: item.code || '',
        name: item.name || '',
        course_cd: item.course_cd || '',
        professional_phase: item.professional_phase || '',
        academic_session: item.academic_session || '',
        description: item.description || '',
        is_active: item.is_active !== false,
      });
      setIsModalOpen(true);
      return;
    }

    if (activeTab === 'subject-offerings') {
      const matchedSubject = subjects.find(s => s.id === item.subject_id);
      const matchedCourseCd = item.course_cd || matchedSubject?.course_cd || '';
      const matchedBranchCd = item.branch_cd || matchedSubject?.branch_cd || matchedSubject?.department_id || '';

      setFormData({
        ...item,
        college_id: collegeCodeOrId,
        college_slug: collegeSlug,
        course_cd: matchedCourseCd,
        branch_cd: matchedBranchCd,
        department_id: matchedBranchCd,
        subject_id: item.subject_id || '',
        prof_id: item.prof_id || '',
        dtype_id: item.dtype_id || '',
        batch_year: item.batch_year ? Number(item.batch_year) : 2024,
        hours_allotted: item.hours_allotted !== undefined ? Number(item.hours_allotted) : 100,
        is_active: item.is_active !== false,
      });
      setIsModalOpen(true);
      return;
    }

    if (activeTab === 'units') {
      const matchedSubject = subjects.find(s => s.id === item.subject_id || s.code === item.subject_code || (s as any).sub_cd === item.subject_id || (s as any).sub_cd === item.subject_code);
      const subCode = item.subject_code || matchedSubject?.code || '';
      const subId = item.subject_id || (matchedSubject as any)?.sub_cd || matchedSubject?.code || item.subject_code || '';
      const subName = matchedSubject?.name || item.subject_name || '';
      const displayLabel = getSubjectDisplayLabel(matchedSubject) || (subCode && subName ? (subName.includes(subCode) ? subName : `[${subCode}] ${subName}`) : (subName || subCode || ''));
      setUnitSubjectSearch(displayLabel);
      setIsUnitSubjectDropdownOpen(false);
      setFormData({
        ...item,
        college_id: collegeCodeOrId,
        college_slug: collegeSlug,
        course_cd: item.course_cd || matchedSubject?.course_cd || '',
        branch_cd: item.branch_cd || matchedSubject?.branch_cd || '1',
        department_id: item.branch_cd || matchedSubject?.branch_cd || '1',
        batch_id: item.batch_id || item.batch_cd || item.batch_year || '17',
        batch_cd: item.batch_cd || item.batch_id || '17',
        batch_year: item.batch_year || 2024,
        sem_cd: item.sem_cd || '5',
        semester: item.semester || (item.sem_cd ? `Semester ${item.sem_cd}` : 'Semester 5'),
        sec_cd: item.sec_cd || '1',
        section: item.section || 'Section A',
        subject_id: subId,
        subject_code: subCode || subId,
        code: item.code || '',
        name: item.name || item.code || '',
        description: item.description || item.name || '',
        bloom_level: item.bloom_level || 'KL-2 (Understand)',
        unit_order: item.unit_order || 1,
        hours: item.hours || 10,
        is_active: item.is_active !== false,
      });
      fetchUnitSubjects(
        collegeCodeOrId,
        item.course_cd || matchedSubject?.course_cd || '1',
        item.branch_cd || matchedSubject?.branch_cd || '1',
        item.batch_cd || item.batch_id || '17',
        item.sem_cd || '5',
        item.sec_cd || '1',
        collegeSlug
      );
      setIsModalOpen(true);
      return;
    }

    if (activeTab === 'topics') {
      const matchedSubject = subjects.find(s => s.id === item.subject_id || s.code === item.subject_code || (s as any).sub_cd === item.subject_id || (s as any).sub_cd === item.subject_code);
      const matchedUnit = units.find(u => u.id === item.unit_id || u.code === item.unit_code);
      const subCode = item.subject_code || matchedSubject?.code || '';
      const subId = item.subject_id || (matchedSubject as any)?.sub_cd || matchedSubject?.code || item.subject_code || '';
      const subName = matchedSubject?.name || item.subject_name || '';
      const displayLabel = getSubjectDisplayLabel(matchedSubject) || (subCode && subName ? (subName.includes(subCode) ? subName : `[${subCode}] ${subName}`) : (subName || subCode || ''));
      setTopicSubjectSearch(displayLabel);
      setIsTopicSubjectDropdownOpen(false);
      setFormData({
        ...item,
        college_id: collegeCodeOrId,
        college_slug: collegeSlug,
        course_cd: item.course_cd || matchedSubject?.course_cd || '',
        branch_cd: item.branch_cd || matchedSubject?.branch_cd || '1',
        department_id: item.branch_cd || matchedSubject?.branch_cd || '1',
        batch_id: item.batch_cd || item.batch_id || '17',
        batch_cd: item.batch_cd || item.batch_id || '17',
        batch_year: item.batch_year || 2024,
        sem_cd: item.sem_cd || '5',
        semester: item.semester || `Semester ${item.sem_cd || '5'}`,
        sec_cd: item.sec_cd || '1',
        section: item.section || 'Section A',
        subject_id: subId,
        subject_code: subCode || subId,
        subject_name: subName,
        unit_id: item.unit_code || matchedUnit?.code || item.unit_id || '',
        unit_code: item.unit_code || matchedUnit?.code || '',
        code: item.code || '',
        name: item.name || '',
        description: item.description || '',
        bloom_level: item.bloom_level || matchedUnit?.bloom_level || 'KL-2 (Understand)',
        hours: item.hours !== undefined ? Number(item.hours) : 2,
        linker_id: item.linker_id || '',
        learning_method: item.learning_method || '',
        assessment_method: item.assessment_method || '',
        is_active: item.is_active !== false,
      });
      fetchTopicSubjects(
        collegeCodeOrId,
        item.course_cd || matchedSubject?.course_cd || '1',
        item.branch_cd || matchedSubject?.branch_cd || '1',
        item.batch_cd || item.batch_id || '17',
        item.sem_cd || '5',
        item.sec_cd || '1',
        collegeSlug
      );
      setIsModalOpen(true);
      return;
    }

    if (activeTab === 'delivery-types') {
      setFormData({
        ...item,
        college_id: collegeCodeOrId,
        college_slug: collegeSlug,
        code: item.code || '',
        name: item.name || '',
        is_active: item.is_active !== false,
      });
      setIsModalOpen(true);
      return;
    }

    if (activeTab === 'competencies') {
      const matchedSubject = subjects.find(s => s.id === item.subject_id || s.code === item.subject_code || (s as any).sub_cd === item.subject_id || (s as any).sub_cd === item.subject_code);
      const matchedUnit = units.find(u => u.id === item.unit_id || u.code === item.unit_code);
      const matchedTopic = topics.find(t => t.id === item.topic_id || t.code === item.topic_code);
      const subCode = item.subject_code || matchedSubject?.code || '';
      const subId = item.subject_id || (matchedSubject as any)?.sub_cd || matchedSubject?.code || item.subject_code || '';
      const subName = matchedSubject?.name || item.subject_name || '';
      const displayLabel = getSubjectDisplayLabel(matchedSubject) || (subCode && subName ? (subName.includes(subCode) ? subName : `[${subCode}] ${subName}`) : (subName || subCode || ''));
      setSubTopicSubjectSearch(displayLabel);
      setIsSubTopicSubjectDropdownOpen(false);

      setTempCompetencies([]);
      setSubTopicCode(item.code || '');
      setSubTopicName(item.name || '');
      setSubTopicDesc(item.description || '');
      setSubTopicDomain(item.domain || 'Knowledge');
      setSubTopicLevel(item.level || 'Knows How');
      setSubTopicBloom(item.bloom_level || 'KL-2 (Understand)');
      setSubTopicCore(item.is_core !== false);
      setSubTopicLearningMethod(item.learning_method || '');
      setSubTopicAssessmentMethod(item.assessment_method || '');

      setFormData({
        ...item,
        college_id: collegeCodeOrId,
        college_slug: collegeSlug,
        course_cd: item.course_cd || matchedSubject?.course_cd || '',
        branch_cd: item.branch_cd || matchedSubject?.branch_cd || '1',
        department_id: item.branch_cd || matchedSubject?.branch_cd || '1',
        batch_id: item.batch_cd || item.batch_id || '17',
        batch_cd: item.batch_cd || item.batch_id || '17',
        batch_year: item.batch_year || 2024,
        sem_cd: item.sem_cd || '5',
        semester: item.semester || `Semester ${item.sem_cd || '5'}`,
        sec_cd: item.sec_cd || '1',
        section: item.section || 'Section A',
        subject_id: subId,
        subject_code: subCode || subId,
        subject_name: subName,
        unit_id: item.unit_code || matchedUnit?.code || item.unit_id || '',
        unit_code: item.unit_code || matchedUnit?.code || '',
        topic_id: item.topic_code || matchedTopic?.code || item.topic_id || '',
        topic_code: item.topic_code || matchedTopic?.code || '',
        bloom_level: item.bloom_level || matchedTopic?.bloom_level || matchedUnit?.bloom_level || 'KL-2 (Understand)',
        code: item.code || '',
        name: item.name || '',
        description: item.description || '',
        domain: item.domain || 'Knowledge',
        level: item.level || 'Knows How',
        is_core: item.is_core !== false,
        learning_method: item.learning_method || '',
        assessment_method: item.assessment_method || '',
        linker_id: item.linker_id || '',
        is_active: item.is_active !== false,
      });

      fetchSubTopicSubjects(
        collegeCodeOrId,
        item.course_cd || matchedSubject?.course_cd || '1',
        item.branch_cd || matchedSubject?.branch_cd || '1',
        item.batch_cd || item.batch_id || '17',
        item.sem_cd || '5',
        item.sec_cd || '1',
        collegeSlug
      );
      setIsModalOpen(true);
      return;
    }
  };

  const handleDelete = async (id: string, itemCollegeSlug?: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    const targetSlug = getFormCollegeSlug(itemCollegeSlug || selectedCollegeFilter);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    try {
      const res = await fetch(`${API_BASE}/${activeTab}/${id}?tenant=${targetSlug}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        await Promise.all([
          fetchCategoryData(activeTab, selectedCollegeFilter),
          fetchCategoryData('departments', selectedCollegeFilter),
          fetchCategoryData('subjects', selectedCollegeFilter),
          fetchCategoryData('units', selectedCollegeFilter),
          fetchCategoryData('topics', selectedCollegeFilter),
          fetchCategoryData('competencies', selectedCollegeFilter),
        ]);
      } else {
        const err = await res.text();
        alert(`Delete failed: ${err}`);
      }
    } catch (err) {
      console.error('[AdminMaster] Delete error:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = Boolean(editingItem && editingItem.id);
    const targetSlug = getFormCollegeSlug(formData.college_id || formData.college_slug);
    const url = isEdit
      ? `${API_BASE}/${activeTab}/${editingItem.id}?tenant=${targetSlug}`
      : `${API_BASE}/${activeTab}?tenant=${targetSlug}`;
    const method = isEdit ? 'PUT' : 'POST';

    let payload: any = {};
    if (activeTab === 'departments') {
      const selectedCourse = courses.find(c => c.course_cd === formData.course_cd || c.code === formData.course_cd || c.id === formData.course_cd);
      const branchCdVal = String(formData.code || formData.branch_cd || '1').trim();
      payload = {
        code: branchCdVal,
        branch_cd: branchCdVal,
        name: formData.name?.trim(),
        type: formData.type || 'General',
        course_cd: selectedCourse?.course_cd || selectedCourse?.code || formData.course_cd || null,
        course_name: selectedCourse?.name || null,
        college_id: formData.college_id,
        hod_user_id: formData.hod_user_id || null,
      };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'subjects') {
      const selectedCourse = courses.find(c => c.course_cd === formData.course_cd || c.code === formData.course_cd || c.id === formData.course_cd);
      payload = {
        code: formData.code?.trim(),
        name: formData.name?.trim(),
        department_id: formData.department_id || null,
        course_cd: selectedCourse?.course_cd || selectedCourse?.code || formData.course_cd || null,
        course_name: selectedCourse?.name || null,
        branch_cd: formData.department_id || null,
        batch_id: formData.batch_id || null,
        credits: formData.credits !== undefined ? Number(formData.credits) : 4,
        type: formData.type || 'Combined',
        is_longitudinal: Boolean(formData.is_longitudinal),
      };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'professional-linkers') {
      payload = {
        code: formData.code?.trim(),
        name: formData.name?.trim(),
        course_cd: formData.course_cd?.trim() || null,
        professional_phase: formData.professional_phase?.trim() || null,
        academic_session: formData.academic_session?.trim() || null,
        description: formData.description?.trim() || null,
      };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'subject-offerings') {
      const selectedCourse = courses.find(c => c.course_cd === formData.course_cd || c.code === formData.course_cd || c.id === formData.course_cd);
      const subCode = subjects.find(s => s.id === formData.subject_id || s.code === formData.subject_id)?.code || formData.subject_id;
      const phaseOrder = profPhases.find(p => p.id === formData.prof_id || String(p.phase_order) === String(formData.prof_id))?.phase_order || formData.prof_id;
      const dtypeCode = deliveryTypes.find(dt => dt.id === formData.dtype_id || dt.code === formData.dtype_id)?.code || formData.dtype_id;
      const batchCd = batches.find(b => b.id === formData.batch_id || String(b.batch_cd) === String(formData.batch_id) || String(b.year) === String(formData.batch_id))?.batch_cd || formData.batch_id;

      payload = {
        college_id: formData.college_id,
        course_cd: selectedCourse?.course_cd || selectedCourse?.code || formData.course_cd || null,
        branch_cd: formData.branch_cd || formData.department_id || null,
        subject_id: subCode,
        subject_code: subCode,
        prof_id: phaseOrder ? String(phaseOrder) : null,
        phase_order: phaseOrder ? String(phaseOrder) : null,
        dtype_id: dtypeCode,
        dtype_code: dtypeCode,
        batch_year: Number(formData.batch_year || 2024),
        hours_allotted: formData.hours_allotted !== undefined ? Number(formData.hours_allotted) : 0,
        batch_id: batchCd ? String(batchCd) : null,
      };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'delivery-types') {
      payload = { code: formData.code, name: formData.name };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'units') {
      const selectedCourse = courses.find(c => c.course_cd === formData.course_cd || c.code === formData.course_cd || c.id === formData.course_cd);
      const matchedLiveSub = unitLiveSubjects.find((s: any) =>
        String(s.sub_cd || s.code || s.id) === String(formData.subject_id || formData.subject_code) ||
        String(s.sub_addinfo || '') === String(formData.subject_code)
      );
      const matchedSubject = subjects.find(s => s.id === formData.subject_id || s.code === formData.subject_id || s.code === formData.subject_code);
      const subNumericCd = getSubjectNumericCode(matchedLiveSub, formData.subject_id) || getSubjectNumericCode(matchedSubject);
      const subCode = subNumericCd || formData.subject_code || formData.subject_id || matchedSubject?.code || '';
      const batchCd = batches.find(b => b.id === formData.batch_id || String(b.batch_cd) === String(formData.batch_id) || String(b.year) === String(formData.batch_id))?.batch_cd || formData.batch_id || formData.batch_cd;

      if (!subCode) {
        alert('Please select a subject for the unit');
        return;
      }
      if (!formData.code || !formData.code.trim()) {
        alert('Unit Code is required (e.g. 88623-UNIT1-CO1)');
        return;
      }

      payload = {
        college_id: formData.college_id,
        course_cd: selectedCourse?.course_cd || selectedCourse?.code || formData.course_cd || null,
        branch_cd: formData.branch_cd || formData.department_id || null,
        batch_id: batchCd ? String(batchCd) : null,
        batch_year: Number(formData.batch_year || 2024),
        semester: formData.semester || (formData.sem_cd ? `Semester ${formData.sem_cd}` : null),
        sem_cd: formData.sem_cd || null,
        section: formData.section || null,
        sec_cd: formData.sec_cd || null,
        subject_id: matchedSubject?.id || (formData.subject_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(formData.subject_id)) ? formData.subject_id : (subNumericCd || subCode)),
        subject_code: subNumericCd || subCode,
        code: formData.code?.trim().toUpperCase(),
        name: formData.name?.trim() || formData.code?.trim(),
        description: formData.description?.trim() || '',
        bloom_level: formData.bloom_level || 'KL-2 (Understand)',
        unit_order: Number(formData.unit_order || 1),
        hours: Number(formData.hours || 0),
      };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'topics') {
      const matchedLiveSub = topicLiveSubjects.find((s: any) =>
        String(s.sub_cd || s.code || s.id) === String(formData.subject_id || formData.subject_code) ||
        String(s.sub_addinfo || '') === String(formData.subject_code)
      );
      const matchedSubject = subjects.find(s => s.id === formData.subject_id || s.code === formData.subject_id || s.code === formData.subject_code);
      const subCode = matchedLiveSub?.sub_addinfo || matchedLiveSub?.code || matchedSubject?.code || formData.subject_code || formData.subject_id;
      const subNumericCd = matchedLiveSub?.sub_cd || (formData.subject_id && /^\d+$/.test(String(formData.subject_id)) ? formData.subject_id : null);
      const matchedUnit = units.find(u => u.id === formData.unit_id || u.code === formData.unit_id || u.code === formData.unit_code);
      const unitCode = matchedUnit?.code || formData.unit_code || formData.unit_id;
      const resolvedLinker = linkers.find(l => l.id === formData.linker_id || l.code === formData.linker_id || l.id === formData._resolved_linker_id);

      payload = {
        college_id: formData.college_id,
        course_cd: formData.course_cd || null,
        branch_cd: formData.branch_cd || null,
        batch_year: formData.batch_year ? Number(formData.batch_year) : 2024,
        subject_id: matchedSubject?.id || (formData.subject_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(formData.subject_id)) ? formData.subject_id : null),
        subject_code: subNumericCd || subCode,
        unit_id: matchedUnit?.id || (formData._resolved_unit_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(formData._resolved_unit_id)) ? formData._resolved_unit_id : null),
        unit_code: unitCode || null,
        bloom_level: formData.bloom_level || 'KL-2 (Understand)',
        code: formData.code?.trim().toUpperCase(),
        name: formData.name?.trim(),
        description: formData.description?.trim() || null,
        hours: formData.hours !== undefined ? Number(formData.hours) : 2,
        linker_id: resolvedLinker?.id || formData.linker_id || null,
        learning_method: formData.learning_method || null,
        assessment_method: formData.assessment_method || null,
      };
      if (isEdit) payload.is_active = formData.is_active !== false;
    } else if (activeTab === 'competencies') {
      const matchedLiveSub = subTopicLiveSubjects.find((s: any) =>
        String(s.sub_cd || s.code || s.id) === String(formData.subject_id || formData.subject_code) ||
        String(s.sub_addinfo || '') === String(formData.subject_code)
      );
      const subCode = matchedLiveSub?.sub_addinfo || matchedLiveSub?.code || matchedLiveSub?.sub_cd ||
        subjects.find(s => s.id === formData.subject_id || s.code === formData.subject_id)?.code ||
        formData.subject_code || formData.subject_id;
      const subId = matchedLiveSub?.id || matchedLiveSub?.sub_cd || formData.subject_id;

      const matchedUnit = units.find(u => u.id === formData.unit_id || u.code === formData.unit_id || u.code === formData.unit_code);
      const unitCode = matchedUnit?.code || formData.unit_code || formData.unit_id;
      const unitId = matchedUnit?.id || (formData._resolved_unit_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(formData._resolved_unit_id)) ? formData._resolved_unit_id : null);

      const matchedTopic = topics.find(t => t.id === formData.topic_id || t.code === formData.topic_id || t.code === formData.topic_code);
      const topicCode = matchedTopic?.code || formData.topic_code || formData.topic_id;
      const topicId = matchedTopic?.id || (formData._resolved_topic_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(formData._resolved_topic_id)) ? formData._resolved_topic_id : null);

      const resolvedLinker = linkers.find(l => l.id === formData.linker_id || l.code === formData.linker_id || l.id === formData._resolved_linker_id);

      if (tempCompetencies.length > 0 && !isEdit) {
        payload = {
          college_id: formData.college_id,
          course_cd: formData.course_cd || null,
          branch_cd: formData.branch_cd || null,
          subject_id: subId || subCode,
          subject_code: subCode,
          unit_id: unitId || null,
          unit_code: unitCode || null,
          topic_id: topicId || null,
          topic_code: topicCode || null,
          linker_id: resolvedLinker?.id || formData.linker_id || null,
          batch_year: formData.batch_year ? Number(formData.batch_year) : undefined,
          items: tempCompetencies.map(it => ({
            code: it.code?.trim().toUpperCase(),
            name: it.name?.trim() || null,
            description: it.description?.trim(),
            domain: it.domain || 'Knowledge',
            level: it.level || 'Knows How',
            bloom_level: it.bloom_level || formData.bloom_level || 'KL-2 (Understand)',
            is_core: it.is_core !== false,
          })),
        };
      } else {
        payload = {
          college_id: formData.college_id,
          course_cd: formData.course_cd || null,
          branch_cd: formData.branch_cd || null,
          subject_id: subId || subCode,
          subject_code: subCode,
          unit_id: unitId || null,
          unit_code: unitCode || null,
          topic_id: topicId || null,
          topic_code: topicCode || null,
          code: (subTopicCode || formData.code)?.trim().toUpperCase(),
          name: (subTopicName || formData.name)?.trim() || null,
          description: (subTopicDesc || formData.description)?.trim(),
          domain: subTopicDomain || formData.domain || 'Knowledge',
          level: subTopicLevel || formData.level || 'Knows How',
          bloom_level: subTopicBloom || formData.bloom_level || 'KL-2 (Understand)',
          is_core: subTopicCore ?? (formData.is_core !== false),
          learning_method: subTopicLearningMethod || formData.learning_method || null,
          assessment_method: subTopicAssessmentMethod || formData.assessment_method || null,
          batch_year: formData.batch_year ? Number(formData.batch_year) : undefined,
          linker_id: resolvedLinker?.id || formData.linker_id || null,
        };
      }
      if (isEdit) payload.is_active = formData.is_active !== false;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    setIsSaving(true);
    try {
      let res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      // Backward-compatibility: If target backend has older DTO forbidding new fields
      if (!res.ok && activeTab === 'units') {
        const cloned = res.clone();
        const errText = await cloned.text();
        if (errText.includes('should not exist') && (errText.includes('semester') || errText.includes('section') || errText.includes('sem_cd') || errText.includes('sec_cd'))) {
          const fallbackPayload = { ...payload };
          delete fallbackPayload.semester;
          delete fallbackPayload.sem_cd;
          delete fallbackPayload.section;
          delete fallbackPayload.sec_cd;
          res = await fetch(url, {
            method,
            headers,
            body: JSON.stringify(fallbackPayload),
          });
        }
      }

      if (res.ok) {
        setIsModalOpen(false);
        await Promise.all([
          fetchCategoryData(activeTab, selectedCollegeFilter),
          fetchCategoryData('departments', selectedCollegeFilter),
          fetchCategoryData('subjects', selectedCollegeFilter),
          fetchCategoryData('delivery-types', selectedCollegeFilter),
          fetchCategoryData('subject-offerings', selectedCollegeFilter),
          fetchCategoryData('units', selectedCollegeFilter),
          fetchCategoryData('topics', selectedCollegeFilter),
          fetchCategoryData('competencies', selectedCollegeFilter),
        ]);
      } else {
        const err = await res.text();
        alert(`Save failed: ${err}`);
      }
    } catch (err) {
      alert('Network error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const { isAllowed } = useRolePermissions();

  const allCategories = [
    { key: 'departments', label: '1. Department Master', icon: '🩺', count: departments.filter(isMatchCollege).length, permissionKey: 'admin_admin_master_departments' },
    { key: 'subjects', label: '2. Subject Master', icon: '📚', count: subjects.filter(isMatchCollege).length, permissionKey: 'admin_admin_master_subjects' },
    { key: 'professional-linkers', label: '3. Guidelines', icon: '📋', count: linkers.length, permissionKey: 'admin_admin_master_guidelines' },
    { key: 'subject-offerings', label: '4. Subject Offerings', icon: '🎓', count: offerings.length, permissionKey: 'admin_admin_master_offerings' },
    { key: 'delivery-types', label: '5. Delivery Types', icon: '📖', count: deliveryTypes.length, permissionKey: 'admin_admin_master_delivery_types' },
    { key: 'units', label: '6. Unit Master', icon: '📑', count: units.length, permissionKey: 'admin_admin_master_units' },
    { key: 'topics', label: '7. Topic Master', icon: '📝', count: topics.length, permissionKey: 'admin_admin_master_topics' },
    { key: 'competencies', label: '8. Sub Topics', icon: '🎯', count: competencies.length, permissionKey: 'admin_admin_master_competencies' },
  ];

  const categories = allCategories.filter((cat) => isAllowed(cat.permissionKey, 'admin_admin_master'));

  // Automatically select the first allowed tab if current activeTab is disallowed
  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.key === activeTab)) {
      setActiveTab(categories[0].key as SubCategory);
    }
  }, [categories, activeTab]);

  const getFilteredItemsList = () => {
    switch (activeTab) {
      case 'departments': return departments;
      case 'subjects': return subjects;
      case 'professional-linkers': return linkers;
      case 'subject-offerings': return offerings;
      case 'delivery-types': return deliveryTypes;
      case 'units': return units;
      case 'topics': return topics;
      case 'competencies': return competencies;
      default: return [];
    }
  };

  const availableFilterCourses = useMemo(() => {
    if (selectedCollegeFilter === 'all') return courses;
    const targetCol = colleges.find(c => c.code === selectedCollegeFilter || c.id === selectedCollegeFilter || c.slug === selectedCollegeFilter);
    return getCoursesForCollege(targetCol?.id || targetCol?.slug);
  }, [selectedCollegeFilter, colleges, courses]);

  const availableFilterBranches = useMemo(() => {
    const targetCol = colleges.find(c => c.code === selectedCollegeFilter || c.id === selectedCollegeFilter || c.slug === selectedCollegeFilter);
    const targetColCd = targetCol?.code || targetCol?.id;
    return departments.filter(d => {
      const matchCol = selectedCollegeFilter === 'all' ||
        d.college_id === targetCol?.id ||
        d.college_slug === targetCol?.slug ||
        String(d.colg_cd) === String(targetColCd);
      if (!matchCol) return false;
      if (selectedCourseFilter === 'all') return true;
      return d.course_cd === selectedCourseFilter || d.course_code === selectedCourseFilter;
    });
  }, [selectedCollegeFilter, selectedCourseFilter, departments, colleges]);

  const availableFilterBatches = useMemo(() => {
    const targetCol = colleges.find(c => c.code === selectedCollegeFilter || c.id === selectedCollegeFilter || c.slug === selectedCollegeFilter);
    const targetColCd = targetCol?.code || targetCol?.id;
    const colBatches = batches.filter(b => {
      const matchCol = selectedCollegeFilter === 'all' ||
        b.college_id === targetCol?.id ||
        b.college_slug === targetCol?.slug ||
        String(b.colg_cd) === String(targetColCd);
      if (!matchCol) return false;
      if (selectedCourseFilter !== 'all' && b.course_cd && String(b.course_cd) !== String(selectedCourseFilter)) return false;
      return true;
    });
    if (colBatches.length > 0) return colBatches;
    return [
      { id: '1', batch_cd: '1', code: '1', name: 'Batch 2024' },
      { id: '2', batch_cd: '2', code: '2', name: 'Batch 2025' },
      { id: '3', batch_cd: '3', code: '3', name: 'Batch 2026' },
    ];
  }, [selectedCollegeFilter, selectedCourseFilter, batches, colleges]);

  const availableFilterSubjects = useMemo(() => {
    const targetCol = colleges.find(c => c.code === selectedCollegeFilter || c.id === selectedCollegeFilter || c.slug === selectedCollegeFilter);
    const targetColCd = targetCol?.code || targetCol?.id;
    return subjects.filter(s => {
      const matchCol = selectedCollegeFilter === 'all' ||
        s.college_id === targetCol?.id ||
        s.college_slug === targetCol?.slug ||
        String(s.colg_cd) === String(targetColCd);
      if (!matchCol) return false;
      if (selectedCourseFilter !== 'all' && s.course_cd !== selectedCourseFilter) return false;
      if (selectedBranchFilter !== 'all' && s.branch_cd !== selectedBranchFilter && s.department_id !== selectedBranchFilter) return false;
      if (selectedBatchFilter !== 'all' && s.batch_cd && String(s.batch_cd) !== String(selectedBatchFilter)) return false;
      if (selectedSemesterFilter !== 'all' && s.sem_cd && String(s.sem_cd) !== String(selectedSemesterFilter)) return false;
      return true;
    });
  }, [selectedCollegeFilter, selectedCourseFilter, selectedBranchFilter, selectedBatchFilter, selectedSemesterFilter, subjects, colleges]);

  const availableFilterUnits = useMemo(() => {
    const targetCol = colleges.find(c => c.code === selectedCollegeFilter || c.id === selectedCollegeFilter || c.slug === selectedCollegeFilter);
    const targetColCd = targetCol?.code || targetCol?.id;
    return units.filter(u => {
      const matchCol = selectedCollegeFilter === 'all' ||
        u.college_id === targetCol?.id ||
        u.college_slug === targetCol?.slug ||
        String(u.college_code) === String(targetColCd);
      if (!matchCol) return false;
      if (selectedCourseFilter !== 'all' && u.course_cd !== selectedCourseFilter) return false;
      if (selectedBranchFilter !== 'all' && u.branch_cd !== selectedBranchFilter) return false;
      if (selectedSubjectFilter !== 'all' && u.subject_code !== selectedSubjectFilter && u.subject_id !== selectedSubjectFilter) return false;
      return true;
    });
  }, [selectedCollegeFilter, selectedCourseFilter, selectedBranchFilter, selectedSubjectFilter, units, colleges]);

  const availableFilterTopics = useMemo(() => {
    const targetCol = colleges.find(c => c.code === selectedCollegeFilter || c.id === selectedCollegeFilter || c.slug === selectedCollegeFilter);
    const targetColCd = targetCol?.code || targetCol?.id;
    return topics.filter(t => {
      const matchCol = selectedCollegeFilter === 'all' ||
        t.college_id === targetCol?.id ||
        t.college_slug === targetCol?.slug ||
        String(t.college_code) === String(targetColCd);
      if (!matchCol) return false;
      if (selectedCourseFilter !== 'all' && t.course_cd !== selectedCourseFilter) return false;
      if (selectedBranchFilter !== 'all' && t.branch_cd !== selectedBranchFilter) return false;
      if (selectedSubjectFilter !== 'all' && t.subject_code !== selectedSubjectFilter && t.subject_id !== selectedSubjectFilter) return false;
      if (selectedUnitFilter !== 'all' && t.unit_code !== selectedUnitFilter && t.unit_id !== selectedUnitFilter) return false;
      return true;
    });
  }, [selectedCollegeFilter, selectedCourseFilter, selectedBranchFilter, selectedSubjectFilter, selectedUnitFilter, topics, colleges]);

  const filteredList = getFilteredItemsList().filter((item: any) => {
    if (activeTab === 'delivery-types') {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (item.name && item.name.toLowerCase().includes(term)) || (item.code && item.code.toLowerCase().includes(term));
    }

    if (!isMatchCollege(item)) return false;

    // Filter by Course
    if (selectedCourseFilter !== 'all') {
      const itemCourse = item.course_cd || item.course_code;
      if (!itemCourse || String(itemCourse) !== String(selectedCourseFilter)) return false;
    }

    // Filter by Branch
    if (selectedBranchFilter !== 'all') {
      const itemBranch = item.branch_cd || item.department_id || (activeTab === 'departments' ? (item.branch_cd || item.code) : null);
      if (!itemBranch || String(itemBranch) !== String(selectedBranchFilter)) return false;
    }

    // Filter by Batch
    if (selectedBatchFilter !== 'all') {
      const itemBatch = item.batch_cd || item.batch_code || item.batch_id;
      if (itemBatch && String(itemBatch) !== String(selectedBatchFilter)) return false;
    }

    // Filter by Semester
    if (selectedSemesterFilter !== 'all') {
      const itemSem = item.sem_cd || item.semester;
      if (itemSem && String(itemSem) !== String(selectedSemesterFilter)) return false;
    }

    // Filter by Subject
    if (selectedSubjectFilter !== 'all') {
      const isSubMatch = (item.subject_code && String(item.subject_code) === String(selectedSubjectFilter)) ||
        (item.subject_id && String(item.subject_id) === String(selectedSubjectFilter)) ||
        (activeTab === 'subjects' && (String(item.code) === String(selectedSubjectFilter) || String(item.id) === String(selectedSubjectFilter)));
      if (!isSubMatch) return false;
    }

    // Filter by Unit
    if (selectedUnitFilter !== 'all') {
      const isUnitMatch = (item.unit_code && String(item.unit_code) === String(selectedUnitFilter)) ||
        (item.unit_id && String(item.unit_id) === String(selectedUnitFilter)) ||
        (activeTab === 'units' && (String(item.code) === String(selectedUnitFilter) || String(item.id) === String(selectedUnitFilter)));
      if (!isUnitMatch) return false;
    }

    // Filter by Topic (for Competencies / Sub-Topics & Topics)
    if (selectedTopicFilter !== 'all') {
      const isTopicMatch = (item.topic_code && String(item.topic_code) === String(selectedTopicFilter)) ||
        (item.topic_id && String(item.topic_id) === String(selectedTopicFilter)) ||
        (activeTab === 'topics' && (String(item.code) === String(selectedTopicFilter) || String(item.id) === String(selectedTopicFilter)));
      if (!isTopicMatch) return false;
    }

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.code && item.code.toLowerCase().includes(term)) ||
      (item.name && item.name.toLowerCase().includes(term)) ||
      (item.description && item.description.toLowerCase().includes(term)) ||
      (item.department_name && item.department_name.toLowerCase().includes(term)) ||
      (item.subject_name && item.subject_name.toLowerCase().includes(term)) ||
      (item.college_name && item.college_name.toLowerCase().includes(term))
    );
  });

  const totalItems = filteredList.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedList = filteredList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const modalDepartments = useMemo(() => {
    const targetColId = formData.college_id;
    const targetColSlug = formData.college_slug || colleges.find(c => c.id === targetColId)?.slug;
    if (!targetColId && !targetColSlug) return departments;
    return departments.filter(d => (targetColId && d.college_id === targetColId) || (targetColSlug && d.college_slug === targetColSlug));
  }, [formData.college_id, formData.college_slug, departments, colleges]);

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-[#0F172A] text-[#1B1E28] dark:text-slate-100 font-sans transition-colors">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Curriculum & Subject Configuration" />
        <main className="p-6 space-y-6 flex-1">
          {categories.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-500">🔒 Access to Curriculum & Subject tabs is currently restricted for your role. Contact Platform SuperAdmin.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => { setActiveTab(cat.key as SubCategory); setSearchTerm(''); }}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 text-left border ${activeTab === cat.key
                    ? 'bg-[#F36C21] text-white shadow-md border-[#F36C21] relative after:absolute after:left-3 after:bottom-1 after:w-5 after:h-[2px] after:bg-white'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800'
                    }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-sm shrink-0">{cat.icon}</span>
                    <span className="truncate text-[11px] font-bold">{cat.label.split('. ')[1]}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 border ${activeTab === cat.key
                    ? 'bg-white/20 text-white border-transparent'
                    : 'bg-slate-100 dark:bg-slate-800 text-[#5B4BFF] dark:text-indigo-400 border-slate-200 dark:border-slate-700'
                    }`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {syncMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-between animate-fadeIn">
              <span>{syncMessage}</span>
              <button onClick={() => setSyncMessage('')} className="text-emerald-600 font-bold hover:underline">✕</button>
            </div>
          )}

          {/* Top Filter Bar with Cascading College -> Course -> Branch -> Subject */}
          <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 p-4 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* 1. College Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-inner">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1"><span>🏛️</span> College:</span>
                <select
                  value={selectedCollegeFilter}
                  onChange={(e) => handleCollegeFilterChange(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[200px] truncate"
                >
                  <option value="all">All Colleges ({colleges.length})</option>
                  {colleges.map((col) => (
                    <option key={col.id} value={col.code || col.id}>[#{col.code || '1'}] {col.name}</option>
                  ))}
                </select>
              </div>

              {/* 2. Course Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-inner">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1"><span>🎓</span> Course:</span>
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => {
                    setSelectedCourseFilter(e.target.value);
                    setSelectedBranchFilter('all');
                    setSelectedSubjectFilter('all');
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[170px] truncate"
                >
                  <option value="all">All Courses ({availableFilterCourses.length})</option>
                  {availableFilterCourses.map((crs: any) => (
                    <option key={crs.id || crs.code} value={crs.course_cd || crs.code}>[#{crs.course_cd || crs.code}] {crs.name}</option>
                  ))}
                </select>
              </div>

              {/* 3. Branch / Department Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-inner">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1"><span>🏢</span> Branch:</span>
                <select
                  value={selectedBranchFilter}
                  onChange={(e) => {
                    setSelectedBranchFilter(e.target.value);
                    setSelectedSubjectFilter('all');
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[170px] truncate"
                >
                  <option value="all">All Branches ({availableFilterBranches.length})</option>
                  {availableFilterBranches.map((br: any) => (
                    <option key={br.id} value={br.branch_cd || br.code}>[#{br.branch_cd || br.code}] {br.name}</option>
                  ))}
                </select>
              </div>

              {/* 4. Batch Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-inner">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1"><span>📅</span> Batch:</span>
                <select
                  value={selectedBatchFilter}
                  onChange={(e) => {
                    setSelectedBatchFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[150px] truncate"
                >
                  <option value="all">All Batches ({availableFilterBatches.length})</option>
                  {availableFilterBatches.map((b: any) => (
                    <option key={b.id || b.batch_cd || b.code} value={b.batch_cd || b.code || b.id}>[#{b.batch_cd || b.code}] {b.name || b.year}</option>
                  ))}
                </select>
              </div>

              {/* 5. Dynamic Semester / Professional Phase Selector */}
              {(() => {
                const activeCol = colleges.find(c => c.id === selectedCollegeFilter || c.slug === selectedCollegeFilter || c.code === selectedCollegeFilter);
                const activeCrs = courses.find(c => c.course_cd === selectedCourseFilter || c.code === selectedCourseFilter || c.id === selectedCourseFilter);
                const isMedicalFilter = (
                  activeCrs?.academic_system === 'professional' ||
                  activeCrs?.academicSystem === 'professional' ||
                  activeCrs?.name?.toUpperCase().includes('MBBS') ||
                  activeCrs?.name?.toUpperCase().includes('BAMS') ||
                  activeCrs?.name?.toUpperCase().includes('MD') ||
                  activeCrs?.name?.toUpperCase().includes('MS') ||
                  activeCrs?.name?.toUpperCase().includes('BDS') ||
                  activeCrs?.code === '100' ||
                  activeCol?.slug === 'srms-ims' ||
                  activeCol?.slug === 'rmribar'
                );

                return (
                  <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-inner">
                    <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                      <span>{isMedicalFilter ? '🩺' : '🔢'}</span> {isMedicalFilter ? 'Phase:' : 'Sem:'}
                    </span>
                    <select
                      value={selectedSemesterFilter}
                      onChange={(e) => {
                        setSelectedSemesterFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[160px] truncate"
                    >
                      {isMedicalFilter ? (
                        <>
                          <option value="all">All Phases</option>
                          <option value="1">Phase I (1st Prof)</option>
                          <option value="2">Phase II (2nd Prof)</option>
                          <option value="3">Phase III Part 1 (3rd Prof P1)</option>
                          <option value="4">Phase III Part 2 (3rd Prof P2)</option>
                        </>
                      ) : (
                        <>
                          <option value="all">All Semesters</option>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                            <option key={s} value={String(s)}>Sem #{s}</option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                );
              })()}

              {/* 6. Subject Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-inner">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1"><span>📚</span> Subject:</span>
                <select
                  value={selectedSubjectFilter}
                  onChange={(e) => {
                    setSelectedSubjectFilter(e.target.value);
                    setSelectedUnitFilter('all');
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[200px] truncate"
                >
                  <option value="all">All Subjects ({availableFilterSubjects.length})</option>
                  {availableFilterSubjects.map((sub: any) => (
                    <option key={sub.id} value={sub.code || sub.id}>[#{sub.code || 'N/A'}] {sub.name}</option>
                  ))}
                </select>
              </div>

              {/* 7. Unit Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-inner">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1"><span>📑</span> Unit:</span>
                <select
                  value={selectedUnitFilter}
                  onChange={(e) => {
                    setSelectedUnitFilter(e.target.value);
                    setSelectedTopicFilter('all');
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[180px] truncate"
                >
                  <option value="all">All Units ({availableFilterUnits.length})</option>
                  {availableFilterUnits.map((u: any) => (
                    <option key={u.id} value={u.code || u.id}>[#{u.code}] {u.name && u.name !== u.code ? u.name : (u.description ? u.description.slice(0, 20) : u.code)}</option>
                  ))}
                </select>
              </div>

              {/* 8. Topic Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-inner">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1"><span>📌</span> Topic:</span>
                <select
                  value={selectedTopicFilter}
                  onChange={(e) => {
                    setSelectedTopicFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[180px] truncate"
                >
                  <option value="all">All Topics ({availableFilterTopics.length})</option>
                  {availableFilterTopics.map((t: any) => (
                    <option key={t.id} value={t.code || t.id}>[#{t.code}] {t.name ? t.name.slice(0, 25) : t.code}</option>
                  ))}
                </select>
              </div>

              {/* Search Box */}
              <div className="relative flex-1 min-w-[180px]">
                <input
                  type="text"
                  placeholder={activeTab === 'competencies' ? 'Search in sub-topics...' : `Search in ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#5B4BFF] transition-all"
                />
                <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-auto">
                {activeTab === 'departments' && (
                  <button
                    onClick={syncDepartmentsFromPortal}
                    disabled={syncing}
                    title="Copy and Sync from Branch data to Department Master in PostgreSQL"
                    className="px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95"
                  >
                    <span className={syncing ? 'animate-spin' : ''}>🔄</span>
                    <span>{syncing ? 'Syncing...' : 'Sync Dept'}</span>
                  </button>
                )}
                {(activeTab === 'subjects' || activeTab === 'subject-offerings') && (
                  <button
                    onClick={handleSyncSubjectsAndOfferings}
                    disabled={syncing || loadingSrmsSubjects}
                    className="px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95"
                    title="Pull all subjects & offerings from SRMS ERP API and link attendance without losing data"
                  >
                    <span className={syncing || loadingSrmsSubjects ? 'animate-spin' : ''}>⚡</span>
                    <span>{syncing ? 'Syncing...' : loadingSrmsSubjects ? 'Fetching...' : activeTab === 'subject-offerings' ? 'Sync SRMS Offerings' : 'Sync SRMS Subjects'}</span>
                  </button>
                )}
                <button onClick={handleAddNew} className="px-4 py-2 rounded-xl bg-[#F36C21] hover:bg-[#E05B10] text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 active:scale-95">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                  <span>Add New</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {loading ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F6F8FC] dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4 pl-5">Code</th>
                      <th className="p-4">Mapped College</th>
                      <th className="p-4">Course / Specialty</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Classification</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <TableSkeleton colCount={7} />
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {activeTab === 'departments' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F6F8FC] dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4 pl-5">Code</th>
                        <th className="p-4">Mapped College</th>
                        <th className="p-4">Course / Specialty</th>
                        <th className="p-4">Department Name</th>
                        <th className="p-4">Classification Type</th>
                        <th className="p-4">HOD Assigned</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 pr-5 text-right min-w-[120px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                      {paginatedList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-10 text-center text-slate-500 font-semibold">
                            No departments found for the selected college filter. Click &apos;Sync Dept&apos; or &apos;Add New&apos;.
                          </td>
                        </tr>
                      ) : (
                        paginatedList.map((d: any) => {
                          const col = colleges.find(c => c.id === d.college_id || c.slug === d.college_slug);
                          const colName = col?.name || d.college_name || 'SRMS Institution';
                          const colCode = col?.code || d.college_code || '';

                          return (
                            <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-4 pl-5 whitespace-nowrap">
                                <span className="font-extrabold font-mono text-[#5B4BFF] dark:text-indigo-400 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                                  #{d.branch_cd || d.code}
                                </span>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span>🏛️</span>
                                  {colCode && (
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[10px] border border-indigo-500/20">
                                      #{colCode}
                                    </span>
                                  )}
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{colName}</span>
                                </div>
                              </td>
                              <td className="p-4 whitespace-nowrap text-purple-600 dark:text-purple-300 font-bold font-mono">
                                {d.course_name || d.course_cd ? (
                                  <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-bold text-[10px]">
                                    🎓 {d.course_name || `Course #${d.course_cd}`}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-normal italic text-[10px]">General / Pre-Clinical</span>
                                )}
                              </td>
                              <td className="p-4 font-bold text-slate-900 dark:text-white">
                                {d.name}
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10px] border border-slate-200 dark:border-slate-700">
                                  {d.type || 'General'}
                                </span>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                {d.hod_email ? (
                                  <code className="text-[#5B4BFF] font-mono text-[11px] font-bold">{d.hod_email}</code>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">Unassigned</span>
                                )}
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${d.is_active !== false ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
                                  {d.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </td>
                              <td className="p-4 pr-5 text-right whitespace-nowrap">
                                <ActionButtons onEdit={() => handleEdit(d)} onDelete={() => handleDelete(d.id, d.college_slug)} />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'subjects' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F6F8FC] dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4 pl-5">Subject Code</th>
                        <th className="p-4">Subject Name & Details</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Batch & Term / Phase</th>
                        <th className="p-4">Mapped College & Dept</th>
                        <th className="p-4">Longitudinal?</th>
                        <th className="p-4">Credits</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 pr-5 text-right min-w-[100px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                      {paginatedList.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-10 text-center text-slate-500 font-semibold">
                            No academic subjects found for the selected filter. Click &apos;Sync SRMS Subjects&apos; to pull all subjects from portal or &apos;Add New&apos; to create.
                          </td>
                        </tr>
                      ) : (
                        paginatedList.map((s: any) => {
                          const col = colleges.find(c => c.id === s.college_id || c.slug === s.college_slug);
                          const colName = col?.name || s.college_name || 'SRMS Institution';
                          const colCode = col?.code || s.college_code || '';
                          const isMedicalSub = Boolean(
                            s.professional_phase ||
                            s.course_name?.toUpperCase().includes('MBBS') ||
                            s.course_name?.toUpperCase().includes('BAMS') ||
                            s.course_cd === '100' ||
                            col?.slug === 'srms-ims' ||
                            col?.slug === 'rmribar'
                          );

                          return (
                            <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-4 pl-5 font-extrabold text-[#5B4BFF] dark:text-indigo-400 font-mono whitespace-nowrap">
                                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                                  {s.code}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-slate-900 dark:text-white text-xs">{s.name}</div>
                                {(s.mst_sub_name || s.sub_addinfo) && (
                                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                                    {s.sub_addinfo && <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px] text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">{s.sub_addinfo}</span>}
                                    {s.mst_sub_name && <span>{s.mst_sub_name}</span>}
                                  </div>
                                )}
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                                  s.type === 'PRACTICAL'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                    : s.type === 'VALUE ADDITION'
                                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                }`}>
                                  {s.type || 'THEORY'}
                                </span>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <div className="flex flex-col gap-0.5 text-[11px] font-semibold">
                                  <span className="text-slate-800 dark:text-slate-200">📅 Batch #{s.batch_cd || s.batch_code || '—'}</span>
                                  <span className="text-slate-500 dark:text-slate-400">
                                    {isMedicalSub ? `🩺 Phase #${s.sem_cd || s.semester || '1'}` : `🔢 Sem #${s.sem_cd || s.semester || '—'}`}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <div className="flex flex-col gap-0.5 text-[11px]">
                                  <div className="flex items-center gap-1">
                                    <span>🏛️</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{colName}</span>
                                    {colCode && <span className="text-[10px] font-mono text-indigo-500">#{colCode}</span>}
                                  </div>
                                  <div className="text-slate-500 text-[10px]">
                                    🏢 {s.department_name || 'General'} {s.course_name ? `(${s.course_name})` : ''}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                {s.is_longitudinal || s.code === 'CM' ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    YES
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                                    NO
                                  </span>
                                )}
                              </td>
                              <td className="p-4 font-mono font-bold text-[#5B4BFF] dark:text-indigo-400 whitespace-nowrap">
                                {s.credits || 4} Credits
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${s.is_active !== false ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
                                  {s.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </td>
                              <td className="p-4 pr-5 text-right whitespace-nowrap">
                                <ActionButtons onEdit={() => handleEdit(s)} onDelete={() => handleDelete(s.id, s.college_slug)} />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'professional-linkers' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F6F8FC] dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4 pl-5">SNo</th>
                        <th className="p-4">Guideline Code</th>
                        <th className="p-4">Guideline Name</th>
                        <th className="p-4">Mapped College</th>
                        <th className="p-4">Academic Session</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={7} className="p-8 text-center text-slate-500 font-medium">No Academic Guidelines defined in tenant schema. Click &apos;Add New&apos; to create one.</td></tr>
                      ) : (
                        paginatedList.map((l: any, idx: number) => {
                          const col = colleges.find(c => c.id === l.college_id || c.slug === l.college_slug || c.code === l.college_code);
                          const colName = col?.name || l.college_name || 'SRMS Institution';
                          const colCode = col?.code || l.college_code || '';

                          return (
                            <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-4 pl-5 font-bold">{startIndex + idx + 1}</td>
                              <td className="p-4 font-extrabold text-[#5B4BFF] font-mono">{l.code}</td>
                              <td className="p-4">
                                <div className="font-bold text-slate-900 dark:text-white">{l.name}</div>
                                <div className="text-[11px] text-slate-500 line-clamp-1">{l.description || 'No additional details'}</div>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span>🏛️</span>
                                  {colCode && (
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[10px] border border-indigo-500/20">
                                      #{colCode}
                                    </span>
                                  )}
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{colName}</span>
                                </div>
                              </td>
                              <td className="p-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">{l.academic_session || 'N/A'}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${l.is_active !== false ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
                                  {l.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </td>
                              <td className="p-4 pr-5 text-right">
                                <ActionButtons onEdit={() => handleEdit(l)} onDelete={() => handleDelete(l.id, l.college_slug)} />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'subject-offerings' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F6F8FC] dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4 pl-5">Subject</th>
                        <th className="p-4">Mapped College</th>
                        <th className="p-4">Course & Branch</th>
                        <th className="p-4">Academic Year / Phase</th>
                        <th className="p-4">Delivery Type</th>
                        <th className="p-4">Batch Year</th>
                        <th className="p-4">Hours Allotted</th>
                        <th className="p-4">Attendance Status</th>
                        <th className="p-4 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={9} className="p-8 text-center text-slate-500 font-medium">No subject offerings configured. Click &apos;Add New&apos; or &apos;Sync SRMS Offerings&apos; to create.</td></tr>
                      ) : (
                        paginatedList.map((o: any) => {
                          const col = colleges.find(c => c.id === o.college_id || c.slug === o.college_slug || c.code === o.college_code);
                          const colName = col?.name || o.college_name || 'SRMS Institution';
                          const colCode = col?.code || o.college_code || '';

                          return (
                            <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-4 pl-5 font-bold text-slate-900 dark:text-white">
                                <div className="font-bold text-slate-900 dark:text-white">{o.subject_name || 'Subject'}</div>
                                <div className="text-[#5B4BFF] font-mono text-[11px]">Code: {o.subject_code || 'N/A'}</div>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span>🏛️</span>
                                  {colCode && (
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[10px] border border-indigo-500/20">
                                      #{colCode}
                                    </span>
                                  )}
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{colName}</span>
                                </div>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <div className="font-semibold text-slate-800 dark:text-slate-200">
                                  🎓 {o.course_name || (o.course_cd ? `Course #${o.course_cd}` : 'General Course')}
                                </div>
                                {o.branch_cd && (
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    🏢 Branch: #{o.branch_cd}
                                  </div>
                                )}
                              </td>
                              <td className="p-4 text-slate-700 dark:text-slate-300 font-semibold">
                                {o.prof_name || 'Academic Phase'}
                                {o.academic_year ? <span className="text-[10px] text-slate-500 block font-normal">Year {o.academic_year}</span> : null}
                              </td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-[#5B4BFF] font-mono text-[11px] font-bold border border-indigo-200 dark:border-indigo-800">
                                  {o.dtype_code} ({o.dtype_name})
                                </span>
                              </td>
                              <td className="p-4 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                                {o.batch_year} Admission
                              </td>
                              <td className="p-4 font-mono text-amber-600 dark:text-amber-400 font-bold">
                                {o.hours_allotted} hrs
                              </td>
                              <td className="p-4">
                                {Number(o.attendance_sessions_count) > 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20 whitespace-nowrap">
                                    <span>🟢</span> {o.attendance_sessions_count} Sessions Marked
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-medium border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                                    <span>⚪</span> 0 Sessions
                                  </span>
                                )}
                              </td>
                              <td className="p-4 pr-5 text-right whitespace-nowrap">
                                <ActionButtons onEdit={() => handleEdit(o)} onDelete={() => handleDelete(o.id, o.college_slug)} />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'delivery-types' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F6F8FC] dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4 pl-5">Code</th>
                        <th className="p-4">Delivery Type Name</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-medium">No delivery types registered. Click &apos;Add New&apos; to create.</td></tr>
                      ) : (
                        paginatedList.map((dt: any) => (
                          <tr key={dt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-4 pl-5 font-extrabold text-[#5B4BFF] font-mono">{dt.code}</td>
                            <td className="p-4 font-bold text-slate-900 dark:text-white">{dt.name}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${dt.is_active ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-600'}`}>
                                {dt.is_active ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td className="p-4 pr-5 text-right">
                              <ActionButtons onEdit={() => handleEdit(dt)} onDelete={() => handleDelete(dt.id, dt.college_slug)} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'units' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F6F8FC] dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4 pl-5">Unit Code & Order</th>
                        <th className="p-4">Unit Description / Title</th>
                        <th className="p-4">Bloom&apos;s Knowledge Level (KL)</th>
                        <th className="p-4">Hours</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-medium">No units registered matching the selected filter. Click &apos;Add New&apos; to create one.</td></tr>
                      ) : (
                        paginatedList.map((u: any) => (
                          <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-4 pl-5 font-bold text-slate-900 dark:text-white">
                              <div className="font-extrabold text-[#5B4BFF] font-mono text-sm">{u.code}</div>
                              <div className="text-[11px] text-slate-500 font-mono">Order: #{u.unit_order || 1}</div>
                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                {u.subject_code && (
                                  <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                    {u.subject_code}
                                  </span>
                                )}
                                {(u.semester || u.sem_cd) && (
                                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                    {u.semester || `Sem ${u.sem_cd}`}
                                  </span>
                                )}
                                {(u.section || u.sec_cd) && (
                                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    {u.section || `Sec ${u.sec_cd}`}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              {u.name && u.name !== u.code && (
                                <div className="font-bold text-slate-900 dark:text-white text-xs mb-1">{u.name}</div>
                              )}
                              <div className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed max-w-xl">
                                {u.description || 'No description provided.'}
                              </div>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800 inline-flex items-center gap-1.5 shadow-sm">
                                <span>🧠</span>
                                {u.bloom_level || 'KL-2 (Understand)'}
                              </span>
                            </td>
                            <td className="p-4 whitespace-nowrap font-mono font-bold text-amber-600 dark:text-amber-400">
                              {u.hours ? `${u.hours} hrs` : '—'}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${u.is_active !== false ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
                                {u.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td className="p-4 pr-5 text-right whitespace-nowrap">
                              <ActionButtons onEdit={() => handleEdit(u)} onDelete={() => handleDelete(u.id, u.college_slug)} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'topics' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F6F8FC] dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4 pl-5">Topic Code</th>
                        <th className="p-4">Topic Title / Description</th>
                        <th className="p-4">Mapped Unit</th>
                        <th className="p-4">Bloom&apos;s Knowledge Level (KL)</th>
                        <th className="p-4">Hours</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                      {paginatedList.length === 0 ? (
                        <tr><td colSpan={7} className="p-8 text-center text-slate-500 font-medium">No curriculum topics registered matching the selected filter. Click &apos;Add New&apos; to start.</td></tr>
                      ) : (
                        paginatedList.map((t: any) => (
                          <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-4 pl-5 font-bold text-slate-900 dark:text-white">
                              <div className="font-extrabold text-[#5B4BFF] font-mono text-sm">{t.code}</div>
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-slate-900 dark:text-white text-xs mb-1">{t.name}</div>
                              {t.description && (
                                <div className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed max-w-xl line-clamp-2">
                                  {t.description}
                                </div>
                              )}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              {t.unit_code ? (
                                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-[#5B4BFF] font-mono font-bold text-xs border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 w-fit">
                                  <span>📑</span>
                                  {t.unit_code} {t.unit_name && t.unit_name !== t.unit_code ? `(${t.unit_name})` : ''}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal">General Topic</span>
                              )}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800 inline-flex items-center gap-1.5 shadow-sm">
                                <span>🧠</span>
                                {t.bloom_level || t.unit_bloom_level || 'KL-2 (Understand)'}
                              </span>
                            </td>
                            <td className="p-4 whitespace-nowrap font-mono font-bold text-amber-600 dark:text-amber-400">
                              {t.hours} hrs
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${t.is_active !== false ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
                                {t.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td className="p-4 pr-5 text-right whitespace-nowrap">
                              <ActionButtons onEdit={() => handleEdit(t)} onDelete={() => handleDelete(t.id, t.college_slug)} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'competencies' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse min-w-[1150px]">
                      <thead className="bg-[#F6F8FC] dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3.5 px-4 pl-5 w-32">Sub-Topic Code</th>
                          <th className="py-3.5 px-4 min-w-[340px]">Sub-Topic Title & Statement</th>
                          <th className="py-3.5 px-4 w-44">Subject</th>
                          <th className="py-3.5 px-4 w-36">Unit</th>
                          <th className="py-3.5 px-4 w-48">Topic</th>
                          <th className="py-3.5 px-4 w-44">Pedagogy & Assessment</th>
                          <th className="py-3.5 px-4 w-36">Domain & Mastery</th>
                          <th className="py-3.5 px-4 w-24 text-center">Status</th>
                          <th className="py-3.5 px-4 pr-5 text-right w-24">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60 font-medium">
                        {paginatedList.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="p-12 text-center text-slate-500 font-medium">
                              <div className="flex flex-col items-center justify-center gap-2">
                                <span className="text-3xl">📋</span>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">No sub-topics registered matching the selected filter</span>
                                <span className="text-xs text-slate-400">Click &apos;Add New&apos; above to register a new sub-topic or competency.</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          paginatedList.map((c: any) => {
                            const hasDuplicateText = c.name && c.description && c.name.trim().toLowerCase() === c.description.trim().toLowerCase();
                            const displayName = c.name && !hasDuplicateText ? c.name.trim() : '';
                            const displayDesc = c.description ? c.description.trim() : (c.name || '—');

                            return (
                              <tr key={c.id} className="hover:bg-indigo-50/25 dark:hover:bg-slate-800/40 transition-colors group">
                                {/* Sub-Topic Code */}
                                <td className="py-3.5 px-4 pl-5 align-top whitespace-nowrap">
                                  <span className="font-extrabold text-[#5B4BFF] font-mono text-xs bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs inline-block">
                                    {c.code}
                                  </span>
                                  {c.batch_year && (
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      Batch: {c.batch_year}
                                    </div>
                                  )}
                                </td>

                                {/* Sub-Topic Title & Statement */}
                                <td className="py-3.5 px-4 align-top">
                                  {displayName && (
                                    <div className="font-extrabold text-slate-900 dark:text-white text-xs mb-1 group-hover:text-[#5B4BFF] transition-colors leading-snug">
                                      {displayName}
                                    </div>
                                  )}
                                  <div className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                                    {displayDesc}
                                  </div>
                                </td>

                                {/* Subject */}
                                <td className="py-3.5 px-4 align-top whitespace-nowrap">
                                  <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                                    <span className="text-sm">📚</span>
                                    <span className="truncate max-w-[140px]">{c.subject_name || c.subject_code || 'General Subject'}</span>
                                  </div>
                                  {c.subject_code && (
                                    <div className="text-[11px] text-slate-500 font-mono mt-0.5 ml-5">
                                      Code: #{c.subject_code}
                                    </div>
                                  )}
                                </td>

                                {/* Unit */}
                                <td className="py-3.5 px-4 align-top whitespace-nowrap">
                                  {c.unit_code ? (
                                    <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-bold text-xs border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1">
                                      <span>📑</span> {c.unit_code}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                  {c.unit_name && c.unit_name !== c.unit_code && (
                                    <div className="text-[10px] text-slate-500 truncate max-w-[130px] mt-0.5">
                                      {c.unit_name}
                                    </div>
                                  )}
                                </td>

                                {/* Topic */}
                                <td className="py-3.5 px-4 align-top">
                                  {c.topic_name ? (
                                    <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1">
                                      <span className="text-rose-500 text-xs">📌</span>
                                      <span className="truncate max-w-[160px]">{c.topic_name}</span>
                                    </div>
                                  ) : c.topic_code ? (
                                    <div className="font-bold text-slate-900 dark:text-white text-xs font-mono">
                                      📌 [{c.topic_code}]
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic text-[11px]">General Topic</span>
                                  )}
                                  {c.topic_description && c.topic_description !== 'Nill' && c.topic_description !== c.topic_name && (
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2 mt-0.5">
                                      {c.topic_description}
                                    </div>
                                  )}
                                </td>

                                {/* Pedagogy & Assessment */}
                                <td className="py-3.5 px-4 align-top">
                                  <div className="space-y-1">
                                    {c.learning_method ? (
                                      <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200/60 dark:border-indigo-800/60 truncate max-w-[160px]" title={`Learning: ${c.learning_method}`}>
                                        📖 {c.learning_method}
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 italic">Method: —</span>
                                    )}
                                    {c.assessment_method && (
                                      <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60 truncate max-w-[160px]" title={`Assessment: ${c.assessment_method}`}>
                                        📝 {c.assessment_method}
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* Domain & Mastery */}
                                <td className="py-3.5 px-4 align-top whitespace-nowrap">
                                  <div className="space-y-1">
                                    <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-[11px] border border-purple-200 dark:border-purple-800 inline-flex items-center gap-1">
                                      <span>🧠</span>
                                      {c.domain || 'Knowledge'} • {c.bloom_level || 'KL-2'}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">{c.level || 'Knows How'}</span>
                                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${c.is_core ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>
                                        {c.is_core ? '⭐ CORE' : 'OPT'}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Status */}
                                <td className="py-3.5 px-4 align-top text-center whitespace-nowrap">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase inline-block ${c.is_active !== false ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
                                    {c.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                                  </span>
                                </td>

                                {/* Actions */}
                                <td className="py-3.5 px-4 pr-5 align-top text-right whitespace-nowrap">
                                  <ActionButtons onEdit={() => handleEdit(c)} onDelete={() => handleDelete(c.id, c.college_slug)} />
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {totalItems > 0 && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-[#F6F8FC] dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <div>
                      Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} of {totalItems} records
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 text-[#5B4BFF] border border-slate-200 dark:border-slate-700 disabled:opacity-40 transition-all font-bold"
                      >
                        ← Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => (
                          <button
                            key={pg}
                            type="button"
                            onClick={() => setCurrentPage(pg)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${currentPage === pg
                              ? 'bg-[#5B4BFF] text-white font-bold'
                              : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
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
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 text-[#5B4BFF] border border-slate-200 dark:border-slate-700 disabled:opacity-40 transition-all font-bold"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dynamic Popup Form Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
              <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full ${activeTab === 'competencies' || activeTab === 'topics' || activeTab === 'units' || activeTab === 'subject-offerings' ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] flex flex-col overflow-hidden shadow-2xl`}>
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-[#F6F8FC] dark:bg-slate-800/60 shrink-0">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <span>{categories.find(c => c.key === activeTab)?.icon}</span>
                    <span>{editingItem ? `Edit ${categories.find(c => c.key === activeTab)?.label.split('. ')[1]}` : `Create New ${categories.find(c => c.key === activeTab)?.label.split('. ')[1]}`}</span>
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-900 text-lg font-bold px-2 py-0.5 rounded transition-colors">✕</button>
                </div>

                <form onSubmit={handleSave} className="p-4 space-y-3 text-xs font-medium overflow-y-auto flex-1">
                  {/* Form fields for Departments */}
                  {activeTab === 'departments' && (() => {
                    const colCourses = getCoursesForCollege(formData.college_id || formData.college_slug);
                    return (
                      <>
                        <div className="space-y-1 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                          <label className="text-indigo-900 dark:text-indigo-300 font-extrabold flex items-center justify-between">
                            <span>Step 1: Select College *</span>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">
                              colg_cd: #{colleges.find(c => c.id === formData.college_id || c.slug === formData.college_slug || c.code === formData.college_id)?.code || '1'}
                            </span>
                          </label>
                          <select
                            required
                            value={
                              colleges.find(c => c.id === formData.college_id || c.code === formData.college_id || c.slug === formData.college_id)?.code ||
                              formData.college_id ||
                              colleges[0]?.code ||
                              colleges[0]?.id
                            }
                            onChange={(e) => {
                              const newColCd = e.target.value;
                              const newCol = colleges.find(c => c.code === newColCd || c.id === newColCd || c.slug === newColCd);
                              const newCourses = getCoursesForCollege(newColCd);
                              setFormData({
                                ...formData,
                                college_id: newCol?.code || newCol?.id || newColCd,
                                college_slug: newCol?.slug || '',
                                course_cd: newCourses[0]?.course_cd || newCourses[0]?.code || '',
                              });
                            }}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            {colleges.map(c => (
                              <option key={c.id} value={c.code || c.id}>
                                🏛️ {c.name} ({c.slug})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                          <label className="text-slate-700 dark:text-slate-300 font-extrabold flex items-center justify-between">
                            <span>Step 2: Map to Course *</span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              course_cd: #{colCourses.find(c => c.course_cd === formData.course_cd || c.code === formData.course_cd || c.id === formData.course_cd)?.course_cd || formData.course_cd || '1'}
                            </span>
                          </label>
                          <select
                            required
                            value={formData.course_cd || ''}
                            onChange={(e) => setFormData({ ...formData, course_cd: e.target.value })}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            {colCourses.length === 0 ? (
                              <option value="">-- No Courses Found for this College --</option>
                            ) : (
                              colCourses.map((crs: any) => (
                                <option key={crs.id} value={crs.course_cd || crs.code || crs.id}>
                                  🎓 {crs.name} (Code: #{crs.course_cd || crs.code})
                                </option>
                              ))
                            )}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Branch Code (branch_cd) *</label>
                            <input
                              type="text"
                              required
                              value={formData.code || formData.branch_cd || ''}
                              onChange={e => setFormData({ ...formData, code: e.target.value, branch_cd: e.target.value })}
                              placeholder="e.g. 1, 2, 3"
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Classification Type *</label>
                            <select
                              required
                              value={formData.type || 'General'}
                              onChange={e => setFormData({ ...formData, type: e.target.value })}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="General">General / Core Discipline</option>
                              <option value="Engineering">Engineering & Technology</option>
                              <option value="Pharmacy">Pharmacy Sciences</option>
                              <option value="Management">Management Studies</option>
                              <option value="Law">Legal Studies</option>
                              <option value="Administrative">Administrative / Support</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Department / Branch Name *</label>
                          <input
                            type="text"
                            required
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. (CSE) / BCA Department"
                            className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          />
                        </div>
                      </>
                    );
                  })()}

                  {/* Form fields for Subjects (With College, Course, Branch, Batch, Semester & Live SRMS ERP Dynamic Feed) */}
                  {activeTab === 'subjects' && (() => {
                    const currentCol = colleges.find(c => c.code === formData.college_id || c.id === formData.college_id || c.slug === formData.college_slug) || colleges[0];
                    const targetColCd = currentCol?.code || currentCol?.id || '1';
                    const targetColSlug = currentCol?.slug || 'srms-cet-bareilly';
                    const colCourses = getCoursesForCollege(currentCol?.id || currentCol?.slug);
                    const selectedCourseCd = formData.course_cd || colCourses[0]?.course_cd || colCourses[0]?.code || '13';
                    const colDepts = departments.filter(d => {
                      const matchCol = !currentCol || d.college_id === currentCol.id || d.college_slug === currentCol.slug || String(d.colg_cd) === String(targetColCd);
                      if (!matchCol) return false;
                      if (!selectedCourseCd) return true;
                      return (
                        d.course_cd === selectedCourseCd ||
                        d.course_code === selectedCourseCd ||
                        (d.course_name && colCourses.find(c => c.course_cd === selectedCourseCd || c.code === selectedCourseCd)?.name?.toLowerCase() === d.course_name?.toLowerCase())
                      );
                    });
                    const selectedBranchCd = formData.branch_cd || formData.department_id || colDepts[0]?.branch_cd || colDepts[0]?.code || '1';
                    const selectedBatchCd = formData.batch_cd || '2';
                    const selectedSemCd = formData.sem_cd || '3';

                    const colBatches = batches.filter(b => {
                      const matchCol = !currentCol || b.college_id === currentCol.id || b.college_slug === currentCol.slug || String(b.colg_cd) === String(targetColCd);
                      const matchCourse = !selectedCourseCd || b.course_cd === selectedCourseCd;
                      return matchCol && matchCourse;
                    });

                    const selectedCourseObj = colCourses.find((c: any) => c.course_cd === selectedCourseCd || c.code === selectedCourseCd || c.id === selectedCourseCd);
                    const isMedical = Boolean(
                      selectedCourseObj?.academic_system === 'professional' ||
                      selectedCourseObj?.academicSystem === 'professional' ||
                      selectedCourseObj?.name?.toUpperCase().includes('MBBS') ||
                      selectedCourseObj?.name?.toUpperCase().includes('BAMS') ||
                      selectedCourseObj?.name?.toUpperCase().includes('MD') ||
                      selectedCourseObj?.name?.toUpperCase().includes('MS') ||
                      selectedCourseObj?.name?.toUpperCase().includes('BDS') ||
                      selectedCourseObj?.code === '100' ||
                      selectedCourseObj?.course_cd === '100' ||
                      targetColSlug === 'srms-ims' ||
                      targetColSlug === 'rmribar'
                    );

                    const availablePhases = profPhases.filter((p: any) => {
                      const matchCol = !currentCol || p.college_id === currentCol.id || p.college_slug === currentCol.slug || String(p.colg_cd) === String(targetColCd);
                      const matchCourse = !selectedCourseCd || p.course_cd === selectedCourseCd || p.course_code === selectedCourseCd;
                      return matchCol && matchCourse;
                    });

                    return (
                      <>
                        {/* Step 1: Select College */}
                        <div className="space-y-1 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                          <label className="text-indigo-900 dark:text-indigo-300 font-extrabold flex items-center justify-between">
                            <span>Step 1: Select College *</span>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">
                              colgcd: #{targetColCd}
                            </span>
                          </label>
                          <select
                            required
                            value={targetColCd}
                            onChange={(e) => {
                              const newColCd = e.target.value;
                              const newCol = colleges.find(c => c.code === newColCd || c.id === newColCd || c.slug === newColCd);
                              const newCourses = getCoursesForCollege(newCol?.id || newCol?.slug);
                              const firstCourseCd = newCourses[0]?.course_cd || newCourses[0]?.code || '13';
                              const newDepts = departments.filter(d => (d.college_id === newCol?.id || d.college_slug === newCol?.slug || String(d.colg_cd) === String(newColCd)) && (!firstCourseCd || d.course_cd === firstCourseCd));
                              const firstBranchCd = newDepts[0]?.branch_cd || newDepts[0]?.code || '1';
                              setFormData({
                                ...formData,
                                college_id: newColCd,
                                college_slug: newCol?.slug || '',
                                course_cd: firstCourseCd,
                                branch_cd: firstBranchCd,
                                department_id: firstBranchCd,
                              });
                              fetchSrmsLiveSubjects(newColCd, firstCourseCd, firstBranchCd, selectedBatchCd, selectedSemCd);
                            }}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            {colleges.map(c => (
                              <option key={c.id} value={c.code || c.id}>
                                🏛️ {c.name} ({c.slug}) — [#{c.code || '1'}]
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Step 2 & 3: Course & Department / Branch */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                            <label className="text-slate-700 dark:text-slate-300 font-extrabold flex items-center justify-between">
                              <span>Step 2: Map Course *</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                coursecd: #{selectedCourseCd}
                              </span>
                            </label>
                            <select
                              required
                              value={selectedCourseCd}
                              onChange={(e) => {
                                const newCrsCd = e.target.value;
                                const newCrsObj = colCourses.find((c: any) => c.course_cd === newCrsCd || c.code === newCrsCd || c.id === newCrsCd);
                                const isNewMed = Boolean(
                                  newCrsObj?.academic_system === 'professional' ||
                                  newCrsObj?.name?.toUpperCase().includes('MBBS') ||
                                  newCrsObj?.name?.toUpperCase().includes('BAMS') ||
                                  newCrsObj?.code === '100' ||
                                  newCrsObj?.course_cd === '100'
                                );
                                const newDepts = departments.filter(d => (d.college_id === currentCol?.id || d.college_slug === currentCol?.slug || String(d.colg_cd) === String(targetColCd)) && (d.course_cd === newCrsCd || d.course_code === newCrsCd));
                                const firstBranchCd = newDepts[0]?.branch_cd || newDepts[0]?.code || '1';
                                const defaultSemOrPhase = isNewMed ? '1' : (formData.sem_cd || '1');
                                setFormData({
                                  ...formData,
                                  course_cd: newCrsCd,
                                  branch_cd: firstBranchCd,
                                  department_id: firstBranchCd,
                                  sem_cd: defaultSemOrPhase,
                                  semester: isNewMed ? `Phase ${defaultSemOrPhase}` : `Semester ${defaultSemOrPhase}`,
                                });
                                fetchSrmsLiveSubjects(targetColCd, newCrsCd, firstBranchCd, selectedBatchCd, defaultSemOrPhase);
                              }}
                              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              {colCourses.length === 0 ? (
                                <option value="13">BCA (Code: #13)</option>
                              ) : (
                                colCourses.map((crs: any) => (
                                  <option key={crs.id} value={crs.course_cd || crs.code || crs.id}>
                                    🎓 {crs.name} (Code: #{crs.course_cd || crs.code})
                                  </option>
                                ))
                              )}
                            </select>
                          </div>

                          <div className="space-y-1 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                            <label className="text-slate-700 dark:text-slate-300 font-extrabold flex items-center justify-between">
                              <span>Step 3: Branch / Dept *</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                branchcd: #{selectedBranchCd}
                              </span>
                            </label>
                            <select
                              required
                              value={selectedBranchCd}
                              onChange={e => {
                                const newBranchCd = e.target.value;
                                setFormData({ ...formData, branch_cd: newBranchCd, department_id: newBranchCd });
                                fetchSrmsLiveSubjects(targetColCd, selectedCourseCd, newBranchCd, selectedBatchCd, selectedSemCd);
                              }}
                              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              {colDepts.length === 0 ? (
                                <option value="1">🏢 General / Dept #1</option>
                              ) : (
                                colDepts.map(d => (
                                  <option key={d.id} value={d.branch_cd || d.code || d.id}>
                                    🏢 {d.name && d.name !== '-' ? d.name : `Dept ${d.branch_cd || d.code}`} (#{d.branch_cd || d.code})
                                  </option>
                                ))
                              )}
                            </select>
                          </div>
                        </div>

                        {/* Step 4: Batch & Dynamic (Professional Phase vs Semester) Selectors */}
                        <div className="grid grid-cols-2 gap-3 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <div>
                            <label className="text-emerald-900 dark:text-emerald-300 font-extrabold text-xs block mb-1 flex items-center justify-between">
                              <span>📅 Batch *</span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">batchcd: #{selectedBatchCd}</span>
                            </label>
                            <select
                              value={selectedBatchCd}
                              onChange={(e) => {
                                const newBatCd = e.target.value;
                                setFormData({ ...formData, batch_cd: newBatCd, batch_id: newBatCd });
                                fetchSrmsLiveSubjects(targetColCd, selectedCourseCd, selectedBranchCd, newBatCd, selectedSemCd);
                              }}
                              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              {colBatches.length > 0 ? (
                                colBatches.map((b: any) => (
                                  <option key={b.id || b.batch_cd} value={b.batch_cd || b.code || b.year}>
                                    Batch {b.batch_name || b.name || b.year} (Code: #{b.batch_cd || b.code})
                                  </option>
                                ))
                              ) : (
                                <>
                                  <option value="2">Batch 2025 (Code: #2)</option>
                                  <option value="1">Batch 2024 (Code: #1)</option>
                                  <option value="3">Batch 2026 (Code: #3)</option>
                                  <option value="4">Batch 2027 (Code: #4)</option>
                                </>
                              )}
                            </select>
                          </div>

                          <div>
                            <label className="text-emerald-900 dark:text-emerald-300 font-extrabold text-xs block mb-1 flex items-center justify-between">
                              <span>{isMedical ? '🩺 Professional Phase *' : '📖 Semester *'}</span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                                {isMedical ? `phase: #${selectedSemCd}` : `semcd: #${selectedSemCd}`}
                              </span>
                            </label>
                            <select
                              value={selectedSemCd}
                              onChange={(e) => {
                                const newSemCd = e.target.value;
                                setFormData({
                                  ...formData,
                                  sem_cd: newSemCd,
                                  semester: isMedical ? `Phase ${newSemCd}` : `Semester ${newSemCd}`,
                                  professional_phase: isMedical ? `Phase ${newSemCd}` : undefined,
                                });
                                fetchSrmsLiveSubjects(targetColCd, selectedCourseCd, selectedBranchCd, selectedBatchCd, newSemCd);
                              }}
                              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              {isMedical ? (
                                availablePhases.length > 0 ? (
                                  availablePhases.map((p: any) => (
                                    <option key={p.id || p.phase_order} value={String(p.phase_order || p.code || p.id)}>
                                      🩺 {p.phase_name || p.name || `Phase ${p.phase_order}`} (Code: #{p.phase_order || p.code || p.id})
                                    </option>
                                  ))
                                ) : (
                                  <>
                                    <option value="1">🩺 1st Professional (Phase I) (Code: #1)</option>
                                    <option value="2">🩺 2nd Professional (Phase II) (Code: #2)</option>
                                    <option value="3">🩺 3rd Professional Part 1 (Phase III Part 1) (Code: #3)</option>
                                    <option value="4">🩺 4th Professional Part 2 (Phase III Part 2) (Code: #4)</option>
                                  </>
                                )
                              ) : (
                                <>
                                  <option value="1">📖 Semester 1 (Code: #1)</option>
                                  <option value="2">📖 Semester 2 (Code: #2)</option>
                                  <option value="3">📖 Semester 3 (Code: #3)</option>
                                  <option value="4">📖 Semester 4 (Code: #4)</option>
                                  <option value="5">📖 Semester 5 (Code: #5)</option>
                                  <option value="6">📖 Semester 6 (Code: #6)</option>
                                  <option value="7">📖 Semester 7 (Code: #7)</option>
                                  <option value="8">📖 Semester 8 (Code: #8)</option>
                                </>
                              )}
                            </select>
                          </div>
                        </div>

                        {/* Step 5: Live SRMS ERP API Integration & Live Subject Pull */}
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 p-3.5 rounded-xl border border-purple-200 dark:border-purple-800 space-y-2.5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-purple-600 dark:text-purple-400 text-sm">⚡</span>
                              <span className="text-xs font-extrabold text-purple-900 dark:text-purple-200">
                                SRMS ERP Live API Feed
                              </span>
                              <span className="text-[10px] bg-purple-200 dark:bg-purple-900/80 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">
                                {loadingSrmsSubjects ? 'Fetching...' : `${srmsLiveSubjects.length} subjects found`}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => fetchSrmsLiveSubjects(targetColCd, selectedCourseCd, selectedBranchCd, selectedBatchCd, selectedSemCd)}
                                disabled={loadingSrmsSubjects}
                                className="text-[11px] text-purple-700 dark:text-purple-300 hover:text-purple-900 font-bold flex items-center gap-1 hover:underline disabled:opacity-50"
                              >
                                <span className={loadingSrmsSubjects ? 'animate-spin' : ''}>🔄</span>
                                <span>Refresh</span>
                              </button>
                              {srmsLiveSubjects.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleBulkSyncSrmsSubjects()}
                                  disabled={syncing}
                                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                                >
                                  <span>📥</span>
                                  <span>Sync All ({srmsLiveSubjects.length})</span>
                                </button>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-purple-900 dark:text-purple-300 mb-1">
                              Select from SRMS Live Subjects (Auto-fills Code, Name & Classification):
                            </label>
                            <select
                              value=""
                              onChange={(e) => {
                                const chosenSubCd = e.target.value;
                                if (!chosenSubCd) return;
                                const subItem = srmsLiveSubjects.find(s => String(s.sub_cd) === String(chosenSubCd) || s.sub_addinfo === chosenSubCd);
                                if (subItem) {
                                  setFormData({
                                    ...formData,
                                    code: subItem.sub_cd || subItem.sub_addinfo || '',
                                    name: subItem.sub_name || subItem.mst_sub_name || '',
                                    type: subItem.SubTyp || 'THEORY',
                                    credits: 4,
                                    is_longitudinal: false,
                                  });
                                }
                              }}
                              disabled={loadingSrmsSubjects || srmsLiveSubjects.length === 0}
                              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="">
                                {loadingSrmsSubjects
                                  ? '⏳ Loading live subjects from SRMS ERP...'
                                  : srmsLiveSubjects.length === 0
                                  ? '-- No subjects returned for selected parameters --'
                                  : `-- Pick a Subject to Auto-Fill Form (${srmsLiveSubjects.length} available) --`}
                              </option>
                              {srmsLiveSubjects.map((s, idx) => (
                                <option key={`${s.sub_cd}-${idx}`} value={s.sub_cd}>
                                  [#{s.sub_cd}] {s.sub_name} ({s.SubTyp || 'THEORY'}{s.sub_addinfo ? ` • ${s.sub_addinfo}` : ''})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Step 6: Subject Code & Credits */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subject Code *</label>
                            <input
                              type="text"
                              required
                              value={formData.code || ''}
                              onChange={e => setFormData({ ...formData, code: e.target.value })}
                              placeholder="e.g. 88534 or CS101"
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold uppercase focus:outline-none focus:border-[#5B4BFF]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Course Credits / Units</label>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={formData.credits || 4}
                              onChange={e => setFormData({ ...formData, credits: Number(e.target.value) })}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]"
                            />
                          </div>
                        </div>

                        {/* Step 7: Subject Name & Type */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subject Name *</label>
                            <input
                              type="text"
                              required
                              value={formData.name || ''}
                              onChange={e => setFormData({ ...formData, name: e.target.value })}
                              placeholder="e.g. Web Technology"
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Type / SubTyp</label>
                            <select
                              value={formData.type || (deliveryTypes[0]?.code || 'THEORY')}
                              onChange={e => {
                                const val = e.target.value;
                                const matched = deliveryTypes.find(dt => dt.code === val || dt.name === val || dt.id === val);
                                setFormData({
                                  ...formData,
                                  type: matched?.code || matched?.name || val,
                                  sub_typ: matched?.code || matched?.name || val,
                                  delivery_type_id: matched?.id,
                                });
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              {deliveryTypes.length > 0 ? (
                                deliveryTypes.map(dt => (
                                  <option key={dt.id || dt.code} value={dt.code || dt.name}>
                                    {dt.name || dt.code} {dt.code && dt.name !== dt.code ? `(${dt.code})` : ''}
                                  </option>
                                ))
                              ) : (
                                <>
                                  <option value="THEORY">THEORY</option>
                                  <option value="PRACTICAL">PRACTICAL</option>
                                  <option value="CLINICAL">CLINICAL</option>
                                  <option value="SDL">SDL (Self Directed Learning)</option>
                                  <option value="AETCOM">AETCOM</option>
                                  <option value="SGD">SGD (Small Group Discussion)</option>
                                  <option value="TUTORIAL">TUTORIAL</option>
                                  <option value="VALUE ADDITION">VALUE ADDITION</option>
                                  <option value="COMBINED">COMBINED</option>
                                </>
                              )}
                            </select>
                          </div>
                        </div>

                        {/* Step 8 (LAST FIELD): Is Longitudinal Subject? */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Is Longitudinal Subject? *</label>
                          <select
                            required
                            value={formData.is_longitudinal ? 'true' : 'false'}
                            onChange={e => setFormData({ ...formData, is_longitudinal: e.target.value === 'true' })}
                            className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            <option value="false">No (Standard Phase-Bound / Semester Subject)</option>
                            <option value="true">Yes (Longitudinal Subject runs across multiple phases)</option>
                          </select>
                        </div>
                      </>
                    );
                  })()}

                  {/* Form fields for ProfessionalLinker */}
                  {activeTab === 'professional-linkers' && (
                    <>
                      <div className="space-y-1 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                        <label className="text-indigo-900 dark:text-indigo-300 font-extrabold flex items-center justify-between">
                          <span>Select College *</span>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">
                            colg_cd: #{colleges.find(c => c.id === formData.college_id || c.code === formData.college_id || c.slug === formData.college_slug)?.code || '1'}
                          </span>
                        </label>
                        <select
                          required
                          value={
                            colleges.find(c => c.id === formData.college_id || c.code === formData.college_id || c.slug === formData.college_slug)?.code ||
                            formData.college_id ||
                            colleges[0]?.code ||
                            colleges[0]?.id
                          }
                          onChange={(e) => {
                            const newColCd = e.target.value;
                            const newCol = colleges.find(c => c.code === newColCd || c.id === newColCd || c.slug === newColCd);
                            setFormData({
                              ...formData,
                              college_id: newCol?.code || newCol?.id || newColCd,
                              college_slug: newCol?.slug || '',
                            });
                          }}
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                        >
                          {colleges.map(c => (
                            <option key={c.id} value={c.code || c.id}>
                              🏛️ {c.name} ({c.slug})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Guideline Code *</label>
                          <input type="text" required value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. 2026, GUIDE-01" className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Course Code</label>
                          <input type="text" value={formData.course_cd || ''} onChange={e => setFormData({ ...formData, course_cd: e.target.value })} placeholder="e.g. BTECH, BCA" className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Guideline Name *</label>
                        <input type="text" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. 2026 Academic Guidelines / Phase I Curriculum" className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Academic Phase / Year</label>
                          <input type="text" value={formData.professional_phase || ''} onChange={e => setFormData({ ...formData, professional_phase: e.target.value })} placeholder="e.g. 2026 / 1st Professional" className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Academic Session</label>
                          <input type="text" value={formData.academic_session || ''} onChange={e => setFormData({ ...formData, academic_session: e.target.value })} placeholder="2026-2027" className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Guidelines Description</label>
                        <textarea rows={3} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Curricular guidelines, module linking, and regulations..." className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#5B4BFF] resize-none"></textarea>
                      </div>
                    </>
                  )}

                  {/* Form fields for Subject Offerings */}
                  {activeTab === 'subject-offerings' && (() => {
                    const currentCollege = colleges.find(c => c.id === formData.college_id || c.code === formData.college_id || c.slug === formData.college_slug) || colleges[0];
                    const availableCourses = getCoursesForCollege(formData.college_id || formData.college_slug);
                    const selectedCourseCd = formData.course_cd || availableCourses[0]?.course_cd || availableCourses[0]?.code || '';

                    const availableDepts = departments.filter(d => {
                      const isColMatch = !currentCollege || d.college_id === currentCollege.id || d.college_slug === currentCollege.slug || String(d.colg_cd) === String(currentCollege.code);
                      const isCourseMatch = !selectedCourseCd || d.course_cd === selectedCourseCd || d.course_code === selectedCourseCd;
                      return isColMatch && isCourseMatch;
                    });
                    const selectedBranchCd = formData.branch_cd || formData.department_id || availableDepts[0]?.branch_cd || availableDepts[0]?.code || availableDepts[0]?.id || '';

                    const availableSubjects = subjects.filter(s => {
                      const isColMatch = !currentCollege || s.college_id === currentCollege.id || s.college_slug === currentCollege.slug || String(s.colg_cd) === String(currentCollege.code);
                      const isCourseMatch = !selectedCourseCd || s.course_cd === selectedCourseCd;
                      const isBranchMatch = !selectedBranchCd || s.branch_cd === selectedBranchCd || s.department_id === selectedBranchCd;
                      return isColMatch && isCourseMatch && isBranchMatch;
                    });

                    const availableBatches = batches.filter(b => {
                      const isColMatch = !currentCollege || b.college_id === currentCollege.id || b.college_slug === currentCollege.slug || String(b.colg_cd) === String(currentCollege.code);
                      const isCourseMatch = !selectedCourseCd || b.course_cd === selectedCourseCd;
                      return isColMatch && isCourseMatch;
                    });

                    const availablePhases = profPhases.filter(p => {
                      const isColMatch = !currentCollege || p.college_id === currentCollege.id || p.college_slug === currentCollege.slug;
                      const isCourseMatch = !selectedCourseCd || p.course_cd === selectedCourseCd;
                      const isBranchMatch = !selectedBranchCd || !p.branch_cd || p.branch_cd === selectedBranchCd;
                      return isColMatch && isCourseMatch && isBranchMatch;
                    });

                    return (
                      <>
                        {/* 1. Select College */}
                        <div className="space-y-1 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                          <label className="text-indigo-900 dark:text-indigo-300 font-extrabold flex items-center justify-between">
                            <span>Step 1: Select College *</span>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">
                              colg_cd: #{currentCollege?.code || '1'}
                            </span>
                          </label>
                          <select
                            required
                            value={currentCollege?.code || currentCollege?.id || formData.college_id}
                            onChange={(e) => {
                              const newColCd = e.target.value;
                              const newCol = colleges.find(c => c.code === newColCd || c.id === newColCd || c.slug === newColCd);
                              const colCourses = getCoursesForCollege(newCol?.id || newCol?.slug);
                              const firstCourseCd = colCourses[0]?.course_cd || colCourses[0]?.code || '';
                              const newDepts = departments.filter(d =>
                                (d.college_id === newCol?.id || d.college_slug === newCol?.slug || String(d.colg_cd) === String(newCol?.code)) &&
                                (!firstCourseCd || d.course_cd === firstCourseCd)
                              );
                              const firstBranchCd = newDepts[0]?.branch_cd || newDepts[0]?.code || newDepts[0]?.id || '';
                              const newSubjects = subjects.filter(s =>
                                (s.college_id === newCol?.id || s.college_slug === newCol?.slug) &&
                                (!firstCourseCd || s.course_cd === firstCourseCd) &&
                                (!firstBranchCd || s.branch_cd === firstBranchCd || s.department_id === firstBranchCd)
                              );

                              setFormData({
                                ...formData,
                                college_id: newCol?.code || newCol?.id || newColCd,
                                college_slug: newCol?.slug || '',
                                course_cd: firstCourseCd,
                                branch_cd: firstBranchCd,
                                department_id: firstBranchCd,
                                subject_id: newSubjects[0]?.id || '',
                              });
                            }}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            {colleges.map(c => (
                              <option key={c.id} value={c.code || c.id}>
                                🏛️ {c.name} ({c.slug})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 2. Select Course */}
                        <div className="space-y-1 bg-amber-50/50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                          <label className="text-amber-900 dark:text-amber-300 font-extrabold flex items-center justify-between">
                            <span>Step 2: Select Course *</span>
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                              course_cd: #{selectedCourseCd || '1'}
                            </span>
                          </label>
                          <select
                            required
                            value={selectedCourseCd}
                            onChange={(e) => {
                              const newCourseCd = e.target.value;
                              const newDepts = departments.filter(d =>
                                (d.college_id === currentCollege?.id || d.college_slug === currentCollege?.slug || String(d.colg_cd) === String(currentCollege?.code)) &&
                                (!newCourseCd || d.course_cd === newCourseCd || d.course_code === newCourseCd)
                              );
                              const firstBranchCd = newDepts[0]?.branch_cd || newDepts[0]?.code || newDepts[0]?.id || '';
                              const newSubjects = subjects.filter(s =>
                                (s.college_id === currentCollege?.id || s.college_slug === currentCollege?.slug) &&
                                (!newCourseCd || s.course_cd === newCourseCd) &&
                                (!firstBranchCd || s.branch_cd === firstBranchCd || s.department_id === firstBranchCd)
                              );

                              setFormData({
                                ...formData,
                                course_cd: newCourseCd,
                                branch_cd: firstBranchCd,
                                department_id: firstBranchCd,
                                subject_id: newSubjects[0]?.id || '',
                              });
                            }}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            {availableCourses.map(c => (
                              <option key={c.id || c.code} value={c.course_cd || c.code}>
                                🎓 {c.name} (Code: #{c.course_cd || c.code})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 3. Select Branch / Department */}
                        <div className="space-y-1 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <label className="text-emerald-900 dark:text-emerald-300 font-extrabold flex items-center justify-between">
                            <span>Step 3: Select Branch / Department *</span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                              branch_cd: #{selectedBranchCd || '1'}
                            </span>
                          </label>
                          <select
                            required
                            value={selectedBranchCd}
                            onChange={(e) => {
                              const newBranchCd = e.target.value;
                              const newSubjects = subjects.filter(s =>
                                (s.college_id === currentCollege?.id || s.college_slug === currentCollege?.slug) &&
                                (!selectedCourseCd || s.course_cd === selectedCourseCd) &&
                                (!newBranchCd || s.branch_cd === newBranchCd || s.department_id === newBranchCd)
                              );
                              setFormData({
                                ...formData,
                                branch_cd: newBranchCd,
                                department_id: newBranchCd,
                                subject_id: newSubjects[0]?.id || '',
                              });
                            }}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            {availableDepts.length === 0 ? (
                              <option value="1">🏢 Default Course Department (Code: #1)</option>
                            ) : (
                              availableDepts.map(d => {
                                const displayCode = d.branch_cd || d.code || '1';
                                const displayName = (d.name && d.name !== '-') ? d.name : `${selectedCourseCd} Department`;
                                return (
                                  <option key={d.id} value={displayCode}>
                                    🏢 {displayName} (Code: #{displayCode})
                                  </option>
                                );
                              })
                            )}
                          </select>
                        </div>

                        {/* 4. Select Subject */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Step 4: Select Subject * ({availableSubjects.length} available)
                          </label>
                          <select
                            required
                            value={subjects.find(s => s.id === formData.subject_id || s.code === formData.subject_id)?.code || formData.subject_id || ''}
                            onChange={e => {
                              const val = e.target.value;
                              const found = availableSubjects.find(s => s.code === val || s.id === val);
                              setFormData({
                                ...formData,
                                subject_id: found?.code || found?.id || val,
                                _resolved_subject_id: found?.id,
                              });
                            }}
                            className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            <option value="">-- Choose Subject for Offering --</option>
                            {availableSubjects.map(s => (
                              <option key={s.id} value={s.code || s.id}>
                                📚 {s.name} (Code: #{s.code || 'N/A'}, {s.credits || 4} Credits)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 5. Select Batch */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Step 5: Select Batch *
                            </label>
                            <select
                              value={batches.find(b => b.id === formData.batch_id || String(b.batch_cd) === formData.batch_id || String(b.year) === formData.batch_id)?.batch_cd || batches.find(b => b.id === formData.batch_id)?.year || formData.batch_id || ''}
                              onChange={e => {
                                const val = e.target.value;
                                const selectedB = availableBatches.find(b => String(b.batch_cd) === val || String(b.year) === val || b.code === val || b.id === val);
                                setFormData({
                                  ...formData,
                                  batch_id: selectedB?.batch_cd || selectedB?.year || selectedB?.id || val,
                                  _resolved_batch_id: selectedB?.id,
                                  batch_year: selectedB?.year || formData.batch_year || 2024,
                                });
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="">-- Select Batch --</option>
                              {availableBatches.map(b => (
                                <option key={b.id} value={b.batch_cd || b.code || b.year || b.id}>
                                  📅 {b.name || `Batch ${b.year}`} (Code: #{b.batch_cd || b.year})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Batch Admission Year *
                            </label>
                            <input
                              type="number"
                              required
                              min="2000"
                              max="2100"
                              value={formData.batch_year || 2024}
                              onChange={e => setFormData({ ...formData, batch_year: Number(e.target.value) })}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]"
                            />
                          </div>
                        </div>

                        {/* 6. Academic Year / Semester / Phase & Delivery Type */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Step 6: Academic Year / Semester / Phase *
                            </label>
                            <select
                              required
                              value={profPhases.find(p => p.id === formData.prof_id || String(p.phase_order) === formData.prof_id)?.phase_order || formData.prof_id || ''}
                              onChange={e => {
                                const val = e.target.value;
                                const found = (availablePhases.length > 0 ? availablePhases : profPhases).find(p => String(p.phase_order) === val || p.id === val);
                                setFormData({
                                  ...formData,
                                  prof_id: found?.phase_order || found?.id || val,
                                  _resolved_prof_id: found?.id,
                                });
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="">-- Select Academic Phase / Sem --</option>
                              {(availablePhases.length > 0 ? availablePhases : profPhases).map(p => (
                                <option key={p.id} value={p.phase_order || p.code || p.id}>
                                  📖 {p.academic_year ? `Year ${p.academic_year} — ` : ''}{p.name} {p.phase_order ? `(Order: #${p.phase_order})` : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Step 7: Delivery Type *
                            </label>
                            <select
                              required
                              value={deliveryTypes.find(dt => dt.id === formData.dtype_id || dt.code === formData.dtype_id)?.code || formData.dtype_id || ''}
                              onChange={e => {
                                const val = e.target.value;
                                const found = deliveryTypes.find(dt => dt.code === val || dt.id === val);
                                setFormData({
                                  ...formData,
                                  dtype_id: found?.code || found?.id || val,
                                  _resolved_dtype_id: found?.id,
                                });
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="">-- Select Delivery Type --</option>
                              {deliveryTypes.map(dt => (
                                <option key={dt.id} value={dt.code || dt.id}>
                                  {dt.name} ({dt.code})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* 7. Hours Allotted */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Step 8: Hours Allotted *
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="1000"
                            required
                            value={formData.hours_allotted ?? 100}
                            onChange={e => setFormData({ ...formData, hours_allotted: Number(e.target.value) })}
                            placeholder="e.g. 100"
                            className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]"
                          />
                        </div>
                      </>
                    );
                  })()}

                  {/* Form fields for Delivery Types */}
                  {activeTab === 'delivery-types' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Code *</label>
                          <input type="text" required value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. TH, PR" className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold uppercase focus:outline-none focus:border-[#5B4BFF]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Name *</label>
                          <input type="text" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Theory, Practical" className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Form fields for Units (With 5-Step Cascading Selectors & Bloom's KL) */}
                  {activeTab === 'units' && (() => {
                    const currentCollege = colleges.find(c => c.code === formData.college_id || c.id === formData.college_id || c.slug === formData.college_slug) || colleges[0];
                    const availableCourses = getCoursesForCollege(currentCollege?.id || currentCollege?.slug);
                    const selectedCourseCd = formData.course_cd || availableCourses[0]?.course_cd || availableCourses[0]?.code || '';

                    const availableDepts = departments.filter(d => {
                      const isColMatch = !currentCollege || d.college_id === currentCollege.id || d.college_slug === currentCollege.slug || String(d.colg_cd) === String(currentCollege.code);
                      const isCourseMatch = !selectedCourseCd || d.course_cd === selectedCourseCd || d.course_code === selectedCourseCd;
                      return isColMatch && isCourseMatch;
                    });
                    const selectedBranchCd = formData.branch_cd || availableDepts[0]?.branch_cd || availableDepts[0]?.code || '1';

                    const availableSubjects = subjects.filter(s => {
                      const isColMatch = !currentCollege || s.college_id === currentCollege.id || s.college_slug === currentCollege.slug;
                      const isCourseMatch = !selectedCourseCd || s.course_cd === selectedCourseCd;
                      const isBranchMatch = !selectedBranchCd || s.branch_cd === selectedBranchCd || s.department_id === selectedBranchCd;
                      const isSemMatch = !formData.sem_cd || String(s.sem_cd) === String(formData.sem_cd) || String(s.semester || '').includes(String(formData.sem_cd));
                      return isColMatch && isCourseMatch && isBranchMatch && isSemMatch;
                    });

                    const availableBatches = batches.filter(b => {
                      const isColMatch = !currentCollege || b.college_id === currentCollege.id || b.college_slug === currentCollege.slug || String(b.colg_cd) === String(currentCollege.code);
                      const isCourseMatch = !selectedCourseCd || b.course_cd === selectedCourseCd;
                      return isColMatch && isCourseMatch;
                    });

                    return (
                      <>
                        {/* Step 1: Select College */}
                        <div className="space-y-1 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                          <label className="text-indigo-900 dark:text-indigo-300 font-extrabold flex items-center justify-between">
                            <span>Step 1: Select College *</span>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">
                              colg_cd: #{currentCollege?.code || '1'}
                            </span>
                          </label>
                          <select
                            required
                            value={currentCollege?.code || currentCollege?.id || formData.college_id}
                            onChange={(e) => {
                              const newColCd = e.target.value;
                              const newCol = colleges.find(c => c.code === newColCd || c.id === newColCd || c.slug === newColCd);
                              const colCourses = getCoursesForCollege(newCol?.id || newCol?.slug);
                              const firstCourseCd = colCourses[0]?.course_cd || colCourses[0]?.code || '';
                              const newDepts = departments.filter(d =>
                                (d.college_id === newCol?.id || d.college_slug === newCol?.slug || String(d.colg_cd) === String(newCol?.code)) &&
                                (!firstCourseCd || d.course_cd === firstCourseCd)
                              );
                              const firstBranchCd = newDepts[0]?.branch_cd || newDepts[0]?.code || '1';
                              const newBatches = batches.filter(b =>
                                (b.college_id === newCol?.id || b.college_slug === newCol?.slug || String(b.colg_cd) === String(newCol?.code)) &&
                                (!firstCourseCd || b.course_cd === firstCourseCd)
                              );
                              const firstBatch = newBatches[0];
                              const firstBatchCd = firstBatch?.batch_cd || firstBatch?.code || '17';
                              const firstBatchYear = firstBatch?.year || 2024;
                              const initialUnit = getNextUnitCodeForSubject('', units);

                              setFormData({
                                ...formData,
                                college_id: newCol?.code || newCol?.id || newColCd,
                                college_slug: newCol?.slug || '',
                                course_cd: firstCourseCd,
                                branch_cd: firstBranchCd,
                                department_id: firstBranchCd,
                                batch_id: firstBatchCd,
                                batch_cd: firstBatchCd,
                                batch_year: firstBatchYear,
                                sem_cd: '5',
                                semester: 'Semester 5',
                                sec_cd: '1',
                                section: 'Section A',
                                subject_id: '',
                                subject_code: '',
                                code: initialUnit.code,
                                unit_order: initialUnit.order,
                              });
                              setUnitSubjectSearch('');
                              setIsUnitSubjectDropdownOpen(false);
                              fetchUnitSubjects(newCol?.code || newCol?.id || newColCd, firstCourseCd, firstBranchCd, firstBatchCd, '5', '1', newCol?.slug);
                            }}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            {colleges.map(c => (
                              <option key={c.id} value={c.code || c.id}>
                                🏛️ {c.name} ({c.slug})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Step 2: Select Course */}
                        <div className="space-y-1 bg-amber-50/50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                          <label className="text-amber-900 dark:text-amber-300 font-extrabold flex items-center justify-between">
                            <span>Step 2: Select Course *</span>
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                              course_cd: #{selectedCourseCd || '1'}
                            </span>
                          </label>
                          <select
                            required
                            value={selectedCourseCd}
                            onChange={(e) => {
                              const newCourseCd = e.target.value;
                              const newDepts = departments.filter(d =>
                                (d.college_id === currentCollege?.id || d.college_slug === currentCollege?.slug || String(d.colg_cd) === String(currentCollege?.code)) &&
                                (!newCourseCd || d.course_cd === newCourseCd || d.course_code === newCourseCd)
                              );
                              const firstBranchCd = newDepts[0]?.branch_cd || newDepts[0]?.code || '1';
                              const newBatches = batches.filter(b =>
                                (b.college_id === currentCollege?.id || b.college_slug === currentCollege?.slug || String(b.colg_cd) === String(currentCollege?.code)) &&
                                (!newCourseCd || b.course_cd === newCourseCd)
                              );
                              const firstBatch = newBatches[0];
                              const firstBatchCd = firstBatch?.batch_cd || firstBatch?.code || '17';
                              const firstBatchYear = firstBatch?.year || 2024;
                              const initialUnit = getNextUnitCodeForSubject('', units);

                              setFormData({
                                ...formData,
                                course_cd: newCourseCd,
                                branch_cd: firstBranchCd,
                                department_id: firstBranchCd,
                                batch_id: firstBatchCd,
                                batch_cd: firstBatchCd,
                                batch_year: firstBatchYear,
                                sem_cd: '5',
                                semester: 'Semester 5',
                                sec_cd: '1',
                                section: 'Section A',
                                subject_id: '',
                                subject_code: '',
                                code: initialUnit.code,
                                unit_order: initialUnit.order,
                              });
                              setUnitSubjectSearch('');
                              setIsUnitSubjectDropdownOpen(false);
                              fetchUnitSubjects(currentCollege?.code || formData.college_id, newCourseCd, firstBranchCd, firstBatchCd, '5', '1', currentCollege?.slug);
                            }}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            {availableCourses.map(c => (
                              <option key={c.id || c.code} value={c.course_cd || c.code}>
                                🎓 {c.name} (Code: #{c.course_cd || c.code})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Step 3: Select Branch / Department */}
                        <div className="space-y-1 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <label className="text-emerald-900 dark:text-emerald-300 font-extrabold flex items-center justify-between">
                            <span>Step 3: Select Branch / Department *</span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                              branch_cd: #{selectedBranchCd || '1'}
                            </span>
                          </label>
                          <select
                            required
                            value={selectedBranchCd}
                            onChange={(e) => {
                              const newBranchCd = e.target.value;
                              const initialUnit = getNextUnitCodeForSubject('', units);
                              setFormData({
                                ...formData,
                                branch_cd: newBranchCd,
                                department_id: newBranchCd,
                                subject_id: '',
                                subject_code: '',
                                code: initialUnit.code,
                                unit_order: initialUnit.order,
                              });
                              setUnitSubjectSearch('');
                              setIsUnitSubjectDropdownOpen(false);
                              fetchUnitSubjects(
                                currentCollege?.code || formData.college_id,
                                selectedCourseCd,
                                newBranchCd,
                                formData.batch_id || formData.batch_cd || '17',
                                formData.sem_cd || '5',
                                formData.sec_cd || '1',
                                currentCollege?.slug
                              );
                            }}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            {availableDepts.length === 0 ? (
                              <option value="1">🏢 Default Course Department (Code: #1)</option>
                            ) : (
                              availableDepts.map(d => {
                                const displayCode = d.branch_cd || d.code || '1';
                                const displayName = (d.name && d.name !== '-') ? d.name : `${selectedCourseCd} Department`;
                                return (
                                  <option key={d.id} value={displayCode}>
                                    🏢 {displayName} (Code: #{displayCode})
                                  </option>
                                );
                              })
                            )}
                          </select>
                        </div>

                        {/* Step 4: Select Batch */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Step 4: Select Batch *
                            </label>
                            <select
                              value={batches.find(b => b.id === formData.batch_id || String(b.batch_cd) === formData.batch_id || String(b.year) === formData.batch_id)?.batch_cd || batches.find(b => b.id === formData.batch_id)?.year || formData.batch_id || ''}
                              onChange={e => {
                                const val = e.target.value;
                                const selectedB = availableBatches.find(b => String(b.batch_cd) === val || String(b.year) === val || b.code === val || b.id === val);
                                const chosenBatchCd = selectedB?.batch_cd || selectedB?.year || selectedB?.id || val;
                                const chosenYear = selectedB?.year || formData.batch_year || 2024;
                                const initialUnit = getNextUnitCodeForSubject('', units);

                                setFormData({
                                  ...formData,
                                  batch_id: chosenBatchCd,
                                  batch_cd: chosenBatchCd,
                                  _resolved_batch_id: selectedB?.id,
                                  batch_year: chosenYear,
                                  subject_id: '',
                                  subject_code: '',
                                  code: initialUnit.code,
                                  unit_order: initialUnit.order,
                                });
                                setUnitSubjectSearch('');
                                setIsUnitSubjectDropdownOpen(false);
                                fetchUnitSubjects(
                                  currentCollege?.code || formData.college_id,
                                  selectedCourseCd,
                                  selectedBranchCd,
                                  chosenBatchCd,
                                  formData.sem_cd || '5',
                                  formData.sec_cd || '1',
                                  currentCollege?.slug
                                );
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="">-- Select Batch --</option>
                              {availableBatches.map(b => (
                                <option key={b.id} value={b.batch_cd || b.code || b.year || b.id}>
                                  📅 {b.name || `Batch ${b.year}`} (Code: #{b.batch_cd || b.year})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Batch Admission Year
                            </label>
                            <input
                              type="number"
                              min="2000"
                              max="2100"
                              value={formData.batch_year || 2024}
                              onChange={e => setFormData({ ...formData, batch_year: Number(e.target.value) })}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]"
                            />
                          </div>
                        </div>

                        {/* Step 5: Select Semester & Step 6: Select Section (Cascading) */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                              <span>Step 5: Select Semester *</span>
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                                sem_cd: #{formData.sem_cd || '5'}
                              </span>
                            </label>
                            <select
                              required
                              value={formData.sem_cd || '5'}
                              onChange={(e) => {
                                const newSemCd = e.target.value;
                                const semName = `Semester ${newSemCd}`;
                                const initialUnit = getNextUnitCodeForSubject('', units);
                                setFormData({
                                  ...formData,
                                  sem_cd: newSemCd,
                                  semester: semName,
                                  subject_id: '',
                                  subject_code: '',
                                  code: initialUnit.code,
                                  unit_order: initialUnit.order,
                                });
                                setUnitSubjectSearch('');
                                setIsUnitSubjectDropdownOpen(false);
                                fetchUnitSubjects(
                                  currentCollege?.code || formData.college_id,
                                  selectedCourseCd,
                                  selectedBranchCd,
                                  formData.batch_id || formData.batch_cd || '17',
                                  newSemCd,
                                  formData.sec_cd || '1',
                                  currentCollege?.slug
                                );
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                <option key={s} value={String(s)}>
                                  📖 Semester {s} (Code: #{s})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                              <span>Step 6: Select Section *</span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                                sec_cd: #{formData.sec_cd || '1'}
                              </span>
                            </label>
                            <select
                              required
                              value={formData.sec_cd || '1'}
                              onChange={(e) => {
                                const newSecCd = e.target.value;
                                const secMap: Record<string, string> = {
                                  '1': 'Section A',
                                  '2': 'Section B',
                                  '3': 'Section C',
                                  '4': 'Section D',
                                  'all': 'All Sections',
                                };
                                const newSecName = secMap[newSecCd] || `Section ${newSecCd}`;
                                const initialUnit = getNextUnitCodeForSubject('', units);
                                setFormData({
                                  ...formData,
                                  sec_cd: newSecCd,
                                  section: newSecName,
                                  subject_id: '',
                                  subject_code: '',
                                  code: initialUnit.code,
                                  unit_order: initialUnit.order,
                                });
                                setUnitSubjectSearch('');
                                setIsUnitSubjectDropdownOpen(false);
                                fetchUnitSubjects(
                                  currentCollege?.code || formData.college_id,
                                  selectedCourseCd,
                                  selectedBranchCd,
                                  formData.batch_id || formData.batch_cd || '17',
                                  formData.sem_cd || '5',
                                  newSecCd,
                                  currentCollege?.slug
                                );
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="1">🏷️ Section A (Code: #1)</option>
                              <option value="2">🏷️ Section B (Code: #2)</option>
                              <option value="3">🏷️ Section C (Code: #3)</option>
                              <option value="4">🏷️ Section D (Code: #4)</option>
                              <option value="all">🏷️ All Sections</option>
                            </select>
                          </div>
                        </div>

                        {/* Step 7: Select Subject (SRMS Live API GetAllSubjectDetail / Subject Linker with Autocomplete Search) */}
                        <div className="space-y-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                          {(() => {
                            const isSrmsTenant = (currentCollege?.slug || formData.college_slug || '').toLowerCase().includes('srms');
                            const rawSubjectList = unitLiveSubjects.length > 0 ? unitLiveSubjects : availableSubjects;
                            const displaySubjectList = rawSubjectList.filter((s: any) => {
                              if (!formData.sem_cd) return true;
                              const sSem = String(s.sem_cd ?? s.semester ?? s.semester_name ?? '');
                              return sSem === String(formData.sem_cd) || sSem.includes(String(formData.sem_cd));
                            });
                            const filteredSubjects = displaySubjectList.filter((s: any) => {
                              if (!unitSubjectSearch.trim()) return true;
                              const q = unitSubjectSearch.toLowerCase().trim();
                              const qClean = q.replace(/\s+/g, '');
                              const paper = getSubjectPaperCode(s).toLowerCase();
                              const paperClean = paper.replace(/\s+/g, '');
                              const title = getSubjectTitle(s).toLowerCase();
                              const numCode = String(s.sub_cd || s.code || s.id || '').toLowerCase();
                              return paper.includes(q) || paperClean.includes(qClean) || title.includes(q) || numCode.includes(q);
                            });

                            const selectedSubjectObj = displaySubjectList.find((s: any) =>
                              String(s.sub_cd || s.code || s.id) === String(formData.subject_id || formData.subject_code) ||
                              String(s.sub_addinfo || '') === String(formData.subject_code) ||
                              (getSubjectPaperCode(s) && getSubjectPaperCode(s) === String(formData.subject_code || formData.subject_id))
                            ) || subjects.find(s => s.id === formData.subject_id || s.code === formData.subject_id || s.code === formData.subject_code);

                            const cardPaperCode = getSubjectPaperCode(selectedSubjectObj) || formData.subject_code || '';
                            const cardNumericCode = getSubjectNumericCode(selectedSubjectObj, formData.subject_id || formData.subject_code);
                            const cardTitle = getSubjectTitle(selectedSubjectObj) || formData.subject_name || 'Selected Subject';
                            const cardSubType = selectedSubjectObj?.SubTyp || selectedSubjectObj?.type || 'THEORY';

                            return (
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <span>Step 7: Select Subject *</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                      {loadingUnitSubjects ? 'Fetching subjects...' : `${displaySubjectList.length} available`}
                                    </span>
                                  </label>
                                  <div className="flex items-center gap-1.5 text-[10px]">
                                    {isSrmsTenant ? (
                                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        SRMS Live API (GetAllSubjectDetail)
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                        Subject Linker (Faculty Linked)
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Confirmed Selected Subject Card */}
                                {formData.subject_id ? (
                                  <div className="bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/60 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800/80 rounded-xl p-3 shadow-xs">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                          {cardPaperCode && (
                                            <span className="px-2.5 py-1 text-xs font-mono font-black bg-indigo-600 text-white rounded-lg shadow-xs flex items-center gap-1">
                                              <span>📄</span>
                                              <span>{cardPaperCode}</span>
                                            </span>
                                          )}
                                          {cardNumericCode && (
                                            <span className="px-2.5 py-1 text-xs font-mono font-black bg-purple-600 text-white dark:bg-purple-700 rounded-lg shadow-xs flex items-center gap-1" title={`Numeric Subject Code: ${cardNumericCode}`}>
                                              <span className="text-[10px] uppercase font-sans font-extrabold opacity-85">Code:</span>
                                              <span>#{cardNumericCode}</span>
                                            </span>
                                          )}
                                          {cardSubType && (
                                            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded-md border border-amber-200 dark:border-amber-800">
                                              {cardSubType}
                                            </span>
                                          )}
                                          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-md border border-emerald-300 dark:border-emerald-800 font-mono">
                                            Auto Unit: {formData.code}
                                          </span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                          {cardTitle}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const initialUnit = getNextUnitCodeForSubject('', units);
                                          setFormData({
                                            ...formData,
                                            subject_id: '',
                                            subject_code: '',
                                            code: initialUnit.code,
                                            unit_order: initialUnit.order,
                                          });
                                          setUnitSubjectSearch('');
                                          setIsUnitSubjectDropdownOpen(true);
                                        }}
                                        className="shrink-0 text-xs px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                        </svg>
                                        <span>Change Subject</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Autocomplete Search Input & Dropdown */
                                  <div className="relative">
                                    <div className="relative">
                                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                      </svg>
                                      <input
                                        type="text"
                                        value={unitSubjectSearch}
                                        onFocus={() => setIsUnitSubjectDropdownOpen(true)}
                                        onChange={(e) => {
                                          setUnitSubjectSearch(e.target.value);
                                          setIsUnitSubjectDropdownOpen(true);
                                        }}
                                        placeholder="🔍 Search subject by paper code (e.g. BCS 052), code (e.g. 88622), or title..."
                                        className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#5B4BFF] shadow-xs"
                                      />
                                      {unitSubjectSearch && (
                                        <button
                                          type="button"
                                          onClick={() => setUnitSubjectSearch('')}
                                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                                        >
                                          ✕
                                        </button>
                                      )}
                                    </div>

                                    {/* Dropdown list */}
                                    {isUnitSubjectDropdownOpen && (
                                      <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl divide-y divide-slate-100 dark:divide-slate-750">
                                        {loadingUnitSubjects ? (
                                          <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                                            <span className="w-3 h-3 rounded-full border-2 border-[#5B4BFF] border-t-transparent animate-spin"></span>
                                            <span>Fetching live subjects for Semester {formData.sem_cd || '5'}...</span>
                                          </div>
                                        ) : filteredSubjects.length === 0 ? (
                                          <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                                            No subjects found matching "{unitSubjectSearch}".
                                          </div>
                                        ) : (
                                          filteredSubjects.map((s: any) => {
                                            const subCodeOrId = String(s.sub_cd || s.code || s.id);
                                            const subNumericCode = getSubjectNumericCode(s, subCodeOrId);
                                            const paperCode = getSubjectPaperCode(s);
                                            const cleanPaperCode = paperCode.replace(/\s+/g, '').toUpperCase();
                                            const fullTitle = getSubjectTitle(s);
                                            const displayLabel = getSubjectDisplayLabel(s);
                                            const subType = s.SubTyp || s.type || 'THEORY';

                                            // Count existing units for this subject to display preview
                                            const existingUnitsForSub = units.filter(u => {
                                              const uTarget = String(subCodeOrId).toLowerCase();
                                              const uCodeClean = String(u.code || '').replace(/\s+/g, '').toUpperCase();
                                              return String(u.subject_id || '').toLowerCase() === uTarget ||
                                                     String(u.subject_code || '').toLowerCase() === uTarget ||
                                                     (paperCode && String(u.subject_code || '').toLowerCase() === paperCode.toLowerCase()) ||
                                                     (cleanPaperCode && cleanPaperCode.length >= 2 && uCodeClean.startsWith(cleanPaperCode));
                                            });

                                            const previewNext = getNextUnitCodeForSubject(subCodeOrId, units, s);

                                            return (
                                              <button
                                                key={`${subCodeOrId}-${paperCode}`}
                                                type="button"
                                                onClick={() => {
                                                  const nextUnit = getNextUnitCodeForSubject(subCodeOrId, units, s);
                                                  setFormData({
                                                    ...formData,
                                                    subject_id: subCodeOrId,
                                                    subject_code: subNumericCode || paperCode || subCodeOrId,
                                                    subject_name: fullTitle,
                                                    code: nextUnit.code,
                                                    name: (!formData.name || formData.name === formData.code || formData.name.startsWith('UNIT') || formData.name.includes('-UNIT')) ? nextUnit.code : formData.name,
                                                    unit_order: nextUnit.order,
                                                  });
                                                  setUnitSubjectSearch(displayLabel);
                                                  setIsUnitSubjectDropdownOpen(false);
                                                }}
                                                className="w-full text-left p-2.5 hover:bg-indigo-50/80 dark:hover:bg-slate-700/60 transition-colors flex items-center justify-between gap-3 group"
                                              >
                                                <div className="min-w-0 flex-1">
                                                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                                    {paperCode && (
                                                      <span className="px-2 py-0.5 text-xs font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800">
                                                        📄 {paperCode}
                                                      </span>
                                                    )}
                                                    {subNumericCode && (
                                                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-800">
                                                        #{subNumericCode}
                                                      </span>
                                                    )}
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                      {subType}
                                                    </span>
                                                  </div>
                                                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-[#5B4BFF]">
                                                    {fullTitle}
                                                  </p>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                    Next: {previewNext.code}
                                                  </span>
                                                  <span className="block text-[9px] text-slate-400 mt-0.5">
                                                    {existingUnitsForSub.length} existing unit{existingUnitsForSub.length === 1 ? '' : 's'}
                                                  </span>
                                                </div>
                                              </button>
                                            );
                                          })
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Unit Code & Dynamic (Competency Count vs Bloom's Level) */}
                        {(() => {
                          const selectedCourseObj = availableCourses.find((c: any) => c.course_cd === formData.course_cd || c.code === formData.course_cd || c.id === formData.course_cd);
                          const isMedicalUnit = Boolean(
                            selectedCourseObj?.academic_system === 'professional' ||
                            selectedCourseObj?.name?.toUpperCase().includes('MBBS') ||
                            selectedCourseObj?.name?.toUpperCase().includes('BAMS') ||
                            selectedCourseObj?.code === '100' ||
                            currentCollege?.slug === 'srms-ims' ||
                            currentCollege?.slug === 'rmribar'
                          );

                          const selectedSubObj = unitLiveSubjects.find((s: any) =>
                            String(s.sub_cd || s.code || s.id) === String(formData.subject_id || formData.subject_code) ||
                            String(s.sub_addinfo || '') === String(formData.subject_code)
                          ) || subjects.find(s => s.id === formData.subject_id || s.code === formData.subject_id || s.code === formData.subject_code);
                          const currentNumericCode = getSubjectNumericCode(selectedSubObj, formData.subject_id || formData.subject_code);

                          return (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                                  <span>Unit Code *</span>
                                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950/50 px-1.5 py-0.5 rounded">
                                    Dynamic: {formData.code || (currentNumericCode ? `${currentNumericCode}-UNIT1-CO1` : 'UNIT1-CO1')}
                                  </span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={formData.code || ''}
                                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                  placeholder={currentNumericCode ? `e.g. ${currentNumericCode}-UNIT1-CO1, ${currentNumericCode}-UNIT2-CO2` : "e.g. 88623-UNIT1-CO1, 88623-UNIT2-CO2"}
                                  className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold uppercase focus:outline-none focus:border-[#5B4BFF]"
                                />
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                                  Dynamic numeric subject code + Unit (e.g. {currentNumericCode ? `${currentNumericCode}-UNIT1-CO1, ${currentNumericCode}-UNIT2-CO2...` : '88623-UNIT1-CO1, 88623-UNIT2-CO2...'})
                                </span>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  {isMedicalUnit ? 'Enter No of Competencies Under This Unit *' : "Bloom's Knowledge Level (KL) *"}
                                </label>
                                {isMedicalUnit ? (
                                  <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    required
                                    value={formData.competency_count || formData.competencies_count || (formData.bloom_level && !isNaN(Number(formData.bloom_level)) ? formData.bloom_level : '')}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setFormData({
                                        ...formData,
                                        competency_count: val,
                                        competencies_count: val,
                                        bloom_level: val ? `Competencies: ${val}` : '',
                                      });
                                    }}
                                    placeholder="e.g. 10"
                                    className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                                  />
                                ) : (
                                  <select
                                    required
                                    value={formData.bloom_level || 'KL-2 (Understand)'}
                                    onChange={e => setFormData({ ...formData, bloom_level: e.target.value })}
                                    className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                                  >
                                    <option value="KL-1 (Remember)">KL-1 (Remember) — Recall facts & basic concepts</option>
                                    <option value="KL-2 (Understand)">KL-2 (Understand) — Explain ideas or concepts</option>
                                    <option value="KL-3 (Apply)">KL-3 (Apply) — Use information in new situations</option>
                                    <option value="KL-4 (Analyze)">KL-4 (Analyze) — Draw connections among ideas</option>
                                    <option value="KL-5 (Evaluate)">KL-5 (Evaluate) — Justify a stand or decision</option>
                                    <option value="KL-6 (Create)">KL-6 (Create) — Produce new or original work</option>
                                  </select>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Unit Description / Syllabus Content *</label>
                          <textarea
                            rows={3}
                            required
                            value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Provide comprehensive topics and unit syllabus content..."
                            className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#5B4BFF] resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Unit Sequence Order</label>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={formData.unit_order || 1}
                              onChange={e => setFormData({ ...formData, unit_order: Number(e.target.value) })}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Allocated Hours</label>
                            <input
                              type="number"
                              min="0"
                              max="200"
                              value={formData.hours || 10}
                              onChange={e => setFormData({ ...formData, hours: Number(e.target.value) })}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]"
                            />
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  {/* Form fields for Topics (With 8-Step Cascading Selectors & Auto Topic Code) */}
                  {activeTab === 'topics' && (() => {
                    const currentCollege = colleges.find(c => c.code === formData.college_id || c.id === formData.college_id || c.slug === formData.college_slug) || colleges[0];
                    const availableCourses = getCoursesForCollege(currentCollege?.id || currentCollege?.slug);
                    const selectedCourseCd = formData.course_cd || availableCourses[0]?.course_cd || availableCourses[0]?.code || '';

                    const availableDepts = departments.filter(d => {
                      const isColMatch = !currentCollege || d.college_id === currentCollege.id || d.college_slug === currentCollege.slug || String(d.colg_cd) === String(currentCollege.code);
                      const isCourseMatch = !selectedCourseCd || d.course_cd === selectedCourseCd || d.course_code === selectedCourseCd;
                      return isColMatch && isCourseMatch;
                    });
                    const selectedBranchCd = formData.branch_cd || availableDepts[0]?.branch_cd || availableDepts[0]?.code || '1';

                    const availableBatches = batches.filter(b => {
                      const isColMatch = !currentCollege || b.college_id === currentCollege.id || b.college_slug === currentCollege.slug || String(b.colg_cd) === String(currentCollege.code);
                      const isCourseMatch = !selectedCourseCd || b.course_cd === selectedCourseCd;
                      return isColMatch && isCourseMatch;
                    });

                    const availableSubjects = subjects.filter(s => {
                      const isColMatch = !currentCollege || s.college_id === currentCollege.id || s.college_slug === currentCollege.slug;
                      const isCourseMatch = !selectedCourseCd || s.course_cd === selectedCourseCd;
                      const isBranchMatch = !selectedBranchCd || s.branch_cd === selectedBranchCd || s.department_id === selectedBranchCd;
                      const isSemMatch = !formData.sem_cd || String(s.sem_cd) === String(formData.sem_cd) || String(s.semester || '').includes(String(formData.sem_cd));
                      return isColMatch && isCourseMatch && isBranchMatch && isSemMatch;
                    });

                    // Strict matching for availableUnits for the selected subject:
                    const selectedSubCd = String(formData.subject_id || formData.subject_code || '').trim();
                    const selectedSubPaper = String(formData.subject_code || '').trim();
                    const cleanSubPaper = selectedSubPaper.replace(/\s+/g, '').toUpperCase();
                    const currentSubjectObj = topicLiveSubjects.find((s: any) =>
                      String(s.sub_cd || s.code || s.id) === String(formData.subject_id || formData.subject_code) ||
                      String(s.sub_addinfo || '') === String(formData.subject_code)
                    ) || subjects.find(s => s.id === formData.subject_id || s.code === formData.subject_id || s.code === formData.subject_code);

                    const availableUnits = units.filter(u => {
                      const isColMatch = !currentCollege || u.college_id === currentCollege.id || u.college_slug === currentCollege.slug;
                      const isCourseMatch = !selectedCourseCd || u.course_cd === selectedCourseCd;
                      const isBranchMatch = !selectedBranchCd || u.branch_cd === selectedBranchCd;
                      if (!selectedSubCd && !selectedSubPaper) return isColMatch && isCourseMatch && isBranchMatch;

                      const uSubId = String(u.subject_id || '').trim();
                      const uSubCode = String(u.subject_code || '').trim();
                      const uCode = String(u.code || '').replace(/\s+/g, '').toUpperCase();

                      const isSubMatch =
                        (selectedSubCd && (uSubId === selectedSubCd || uSubCode === selectedSubCd)) ||
                        (selectedSubPaper && (uSubCode === selectedSubPaper || uSubId === selectedSubPaper)) ||
                        (cleanSubPaper && cleanSubPaper.length >= 2 && uCode.startsWith(cleanSubPaper));

                      return isColMatch && isCourseMatch && isBranchMatch && isSubMatch;
                    });

                    const selectedCourseObj = availableCourses.find((c: any) => c.course_cd === selectedCourseCd || c.code === selectedCourseCd || c.id === selectedCourseCd);
                    const isMedicalTopic = Boolean(
                      selectedCourseObj?.academic_system === 'professional' ||
                      selectedCourseObj?.academicSystem === 'professional' ||
                      selectedCourseObj?.name?.toUpperCase().includes('MBBS') ||
                      selectedCourseObj?.name?.toUpperCase().includes('BAMS') ||
                      selectedCourseObj?.name?.toUpperCase().includes('MD') ||
                      selectedCourseObj?.name?.toUpperCase().includes('MS') ||
                      selectedCourseObj?.name?.toUpperCase().includes('BDS') ||
                      selectedCourseObj?.code === '100' ||
                      selectedCourseObj?.course_cd === '100' ||
                      currentCollege?.slug === 'srms-ims' ||
                      currentCollege?.slug === 'rmribar'
                    );

                    return (
                      <>
                        {/* Step 1: Select College */}
                        <div className="space-y-1 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                          <label className="text-indigo-900 dark:text-indigo-300 font-extrabold flex items-center justify-between">
                            <span>Step 1: Select College *</span>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">
                              colg_cd: #{currentCollege?.code || '1'}
                            </span>
                          </label>
                          <select
                            required
                            value={currentCollege?.code || currentCollege?.id || formData.college_id}
                            onChange={(e) => {
                              const newColCd = e.target.value;
                              const newCol = colleges.find(c => c.code === newColCd || c.id === newColCd || c.slug === newColCd);
                              const colCourses = getCoursesForCollege(newCol?.id || newCol?.slug);
                              const firstCourseCd = colCourses[0]?.course_cd || colCourses[0]?.code || '';
                              const newDepts = departments.filter(d =>
                                (d.college_id === newCol?.id || d.college_slug === newCol?.slug || String(d.colg_cd) === String(newCol?.code)) &&
                                (!firstCourseCd || d.course_cd === firstCourseCd)
                              );
                              const firstBranchCd = newDepts[0]?.branch_cd || newDepts[0]?.code || '1';
                              const newBatches = batches.filter(b =>
                                (b.college_id === newCol?.id || b.college_slug === newCol?.slug || String(b.colg_cd) === String(newCol?.code)) &&
                                (!firstCourseCd || b.course_cd === firstCourseCd)
                              );
                              const firstBatch = newBatches[0];
                              const firstBatchCd = firstBatch?.batch_cd || firstBatch?.code || '17';
                              const firstBatchYear = firstBatch?.year || 2024;

                              setFormData({
                                ...formData,
                                college_id: newCol?.code || newCol?.id || newColCd,
                                college_slug: newCol?.slug || '',
                                course_cd: firstCourseCd,
                                branch_cd: firstBranchCd,
                                department_id: firstBranchCd,
                                batch_id: firstBatchCd,
                                batch_cd: firstBatchCd,
                                batch_year: firstBatchYear,
                                sem_cd: '5',
                                semester: 'Semester 5',
                                sec_cd: '1',
                                section: 'Section A',
                                subject_id: '',
                                subject_code: '',
                                unit_id: '',
                                unit_code: '',
                                code: '',
                              });
                              setTopicSubjectSearch('');
                              setIsTopicSubjectDropdownOpen(false);
                              fetchTopicSubjects(newCol?.code || newCol?.id || newColCd, firstCourseCd, firstBranchCd, firstBatchCd, '5', '1', newCol?.slug);
                            }}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            {colleges.map(c => (
                              <option key={c.id} value={c.code || c.id}>
                                🏛️ {c.name} ({c.slug})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Step 2: Select Course */}
                        <div className="space-y-1 bg-amber-50/50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                          <label className="text-amber-900 dark:text-amber-300 font-extrabold flex items-center justify-between">
                            <span>Step 2: Select Course *</span>
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                              course_cd: #{selectedCourseCd || '1'}
                            </span>
                          </label>
                          <select
                            required
                            value={selectedCourseCd}
                            onChange={(e) => {
                              const newCourseCd = e.target.value;
                              const newDepts = departments.filter(d =>
                                (d.college_id === currentCollege?.id || d.college_slug === currentCollege?.slug || String(d.colg_cd) === String(currentCollege?.code)) &&
                                (!newCourseCd || d.course_cd === newCourseCd || d.course_code === newCourseCd)
                              );
                              const firstBranchCd = newDepts[0]?.branch_cd || newDepts[0]?.code || '1';
                              const newBatches = batches.filter(b =>
                                (b.college_id === currentCollege?.id || b.college_slug === currentCollege?.slug || String(b.colg_cd) === String(currentCollege?.code)) &&
                                (!newCourseCd || b.course_cd === newCourseCd)
                              );
                              const firstBatch = newBatches[0];
                              const firstBatchCd = firstBatch?.batch_cd || firstBatch?.code || '17';
                              const firstBatchYear = firstBatch?.year || 2024;

                              setFormData({
                                ...formData,
                                course_cd: newCourseCd,
                                branch_cd: firstBranchCd,
                                department_id: firstBranchCd,
                                batch_id: firstBatchCd,
                                batch_cd: firstBatchCd,
                                batch_year: firstBatchYear,
                                sem_cd: '5',
                                semester: 'Semester 5',
                                sec_cd: '1',
                                section: 'Section A',
                                subject_id: '',
                                subject_code: '',
                                unit_id: '',
                                unit_code: '',
                                code: '',
                              });
                              setTopicSubjectSearch('');
                              setIsTopicSubjectDropdownOpen(false);
                              fetchTopicSubjects(currentCollege?.code || formData.college_id, newCourseCd, firstBranchCd, firstBatchCd, '5', '1', currentCollege?.slug);
                            }}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            {availableCourses.map(c => (
                              <option key={c.id || c.code} value={c.course_cd || c.code}>
                                🎓 {c.name} (Code: #{c.course_cd || c.code})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Step 3: Select Branch / Department */}
                        <div className="space-y-1 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <label className="text-emerald-900 dark:text-emerald-300 font-extrabold flex items-center justify-between">
                            <span>Step 3: Select Branch / Department *</span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                              branch_cd: #{selectedBranchCd || '1'}
                            </span>
                          </label>
                          <select
                            required
                            value={selectedBranchCd}
                            onChange={(e) => {
                              const newBranchCd = e.target.value;
                              setFormData({
                                ...formData,
                                branch_cd: newBranchCd,
                                department_id: newBranchCd,
                                subject_id: '',
                                subject_code: '',
                                unit_id: '',
                                unit_code: '',
                                code: '',
                              });
                              setTopicSubjectSearch('');
                              setIsTopicSubjectDropdownOpen(false);
                              fetchTopicSubjects(
                                currentCollege?.code || formData.college_id,
                                selectedCourseCd,
                                newBranchCd,
                                formData.batch_id || formData.batch_cd || '17',
                                formData.sem_cd || '5',
                                formData.sec_cd || '1',
                                currentCollege?.slug
                              );
                            }}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            {availableDepts.length === 0 ? (
                              <option value="1">Dept #1</option>
                            ) : (
                              availableDepts.map(d => {
                                const displayCode = d.branch_cd || d.code || '1';
                                const displayName = (d.name && d.name !== '-') ? d.name : `Dept ${displayCode}`;
                                return (
                                  <option key={d.id} value={displayCode}>
                                    🏢 {displayName} (Code: #{displayCode})
                                  </option>
                                );
                              })
                            )}
                          </select>
                        </div>

                        {/* Step 4: Select Batch (Cascading) */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                              <span>Step 4: Select Batch *</span>
                              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                                batch_cd: #{formData.batch_cd || '17'}
                              </span>
                            </label>
                            <select
                              required
                              value={formData.batch_cd || formData.batch_id || '17'}
                              onChange={(e) => {
                                const chosenBatchCd = e.target.value;
                                const selectedB = availableBatches.find(b =>
                                  String(b.batch_cd) === chosenBatchCd || String(b.code) === chosenBatchCd || String(b.year) === chosenBatchCd || String(b.id) === chosenBatchCd
                                );
                                const chosenYear = selectedB?.year || formData.batch_year || 2024;

                                setFormData({
                                  ...formData,
                                  batch_id: chosenBatchCd,
                                  batch_cd: chosenBatchCd,
                                  _resolved_batch_id: selectedB?.id,
                                  batch_year: chosenYear,
                                  subject_id: '',
                                  subject_code: '',
                                  unit_id: '',
                                  unit_code: '',
                                  code: '',
                                });
                                setTopicSubjectSearch('');
                                setIsTopicSubjectDropdownOpen(false);
                                fetchTopicSubjects(
                                  currentCollege?.code || formData.college_id,
                                  selectedCourseCd,
                                  selectedBranchCd,
                                  chosenBatchCd,
                                  formData.sem_cd || '5',
                                  formData.sec_cd || '1',
                                  currentCollege?.slug
                                );
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="">-- Select Batch --</option>
                              {availableBatches.map(b => (
                                <option key={b.id} value={b.batch_cd || b.code || b.year || b.id}>
                                  📅 {b.name || `Batch ${b.year}`} (Code: #{b.batch_cd || b.year})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Batch Admission Year
                            </label>
                            <input
                              type="number"
                              min="2000"
                              max="2100"
                              value={formData.batch_year || 2024}
                              onChange={e => setFormData({ ...formData, batch_year: Number(e.target.value) })}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]"
                            />
                          </div>
                        </div>

                        {/* Step 5: Select Semester & Step 6: Select Section (Cascading) */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                              <span>Step 5: Select Semester *</span>
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                                sem_cd: #{formData.sem_cd || '5'}
                              </span>
                            </label>
                            <select
                              required
                              value={formData.sem_cd || '5'}
                              onChange={(e) => {
                                const newSemCd = e.target.value;
                                const semName = `Semester ${newSemCd}`;
                                setFormData({
                                  ...formData,
                                  sem_cd: newSemCd,
                                  semester: semName,
                                  subject_id: '',
                                  subject_code: '',
                                  unit_id: '',
                                  unit_code: '',
                                  code: '',
                                });
                                setTopicSubjectSearch('');
                                setIsTopicSubjectDropdownOpen(false);
                                fetchTopicSubjects(
                                  currentCollege?.code || formData.college_id,
                                  selectedCourseCd,
                                  selectedBranchCd,
                                  formData.batch_id || formData.batch_cd || '17',
                                  newSemCd,
                                  formData.sec_cd || '1',
                                  currentCollege?.slug
                                );
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                <option key={s} value={String(s)}>
                                  📖 Semester {s} (Code: #{s})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                              <span>Step 6: Select Section *</span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                                sec_cd: #{formData.sec_cd || '1'}
                              </span>
                            </label>
                            <select
                              required
                              value={formData.sec_cd || '1'}
                              onChange={(e) => {
                                const newSecCd = e.target.value;
                                const secMap: Record<string, string> = {
                                  '1': 'Section A',
                                  '2': 'Section B',
                                  '3': 'Section C',
                                  '4': 'Section D',
                                  'all': 'All Sections',
                                };
                                const newSecName = secMap[newSecCd] || `Section ${newSecCd}`;
                                setFormData({
                                  ...formData,
                                  sec_cd: newSecCd,
                                  section: newSecName,
                                  subject_id: '',
                                  subject_code: '',
                                  unit_id: '',
                                  unit_code: '',
                                  code: '',
                                });
                                setTopicSubjectSearch('');
                                setIsTopicSubjectDropdownOpen(false);
                                fetchTopicSubjects(
                                  currentCollege?.code || formData.college_id,
                                  selectedCourseCd,
                                  selectedBranchCd,
                                  formData.batch_id || formData.batch_cd || '17',
                                  formData.sem_cd || '5',
                                  newSecCd,
                                  currentCollege?.slug
                                );
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="1">🏷️ Section A (Code: #1)</option>
                              <option value="2">🏷️ Section B (Code: #2)</option>
                              <option value="3">🏷️ Section C (Code: #3)</option>
                              <option value="4">🏷️ Section D (Code: #4)</option>
                              <option value="all">🏷️ All Sections</option>
                            </select>
                          </div>
                        </div>

                        {/* Step 7: Select Subject (SRMS Live API GetAllSubjectDetail / Subject Linker with Autocomplete Search) */}
                        <div className="space-y-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                          {(() => {
                            const isSrmsTenant = (currentCollege?.slug || formData.college_slug || '').toLowerCase().includes('srms');
                            const rawSubjectList = topicLiveSubjects.length > 0 ? topicLiveSubjects : availableSubjects;
                            const displaySubjectList = rawSubjectList.filter((s: any) => {
                              if (!formData.sem_cd) return true;
                              const sSem = String(s.sem_cd ?? s.semester ?? s.semester_name ?? '');
                              return sSem === String(formData.sem_cd) || sSem.includes(String(formData.sem_cd));
                            });
                            const filteredSubjects = displaySubjectList.filter((s: any) => {
                              if (!topicSubjectSearch.trim()) return true;
                              const q = topicSubjectSearch.toLowerCase().trim();
                              const qClean = q.replace(/\s+/g, '');
                              const paper = getSubjectPaperCode(s).toLowerCase();
                              const paperClean = paper.replace(/\s+/g, '');
                              const title = getSubjectTitle(s).toLowerCase();
                              const numCode = getSubjectNumericCode(s).toLowerCase();
                              return paper.includes(q) || paperClean.includes(qClean) || title.includes(q) || numCode.includes(q);
                            });

                            const selectedSubjectObj = displaySubjectList.find((s: any) =>
                              String(s.sub_cd || s.code || s.id) === String(formData.subject_id || formData.subject_code) ||
                              String(s.sub_addinfo || '') === String(formData.subject_code) ||
                              (getSubjectPaperCode(s) && getSubjectPaperCode(s) === String(formData.subject_code || formData.subject_id))
                            ) || subjects.find(s => s.id === formData.subject_id || s.code === formData.subject_id || s.code === formData.subject_code);

                            const cardPaperCode = getSubjectPaperCode(selectedSubjectObj) || formData.subject_code || '';
                            const cardNumericCode = getSubjectNumericCode(selectedSubjectObj, formData.subject_id || formData.subject_code);
                            const cardTitle = getSubjectTitle(selectedSubjectObj) || formData.subject_name || 'Selected Subject';
                            const cardSubType = selectedSubjectObj?.SubTyp || selectedSubjectObj?.type || 'THEORY';

                            return (
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <span>Step 7: Select Subject *</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                      {loadingTopicSubjects ? 'Fetching subjects...' : `${displaySubjectList.length} available`}
                                    </span>
                                  </label>
                                  <div className="flex items-center gap-1.5 text-[10px]">
                                    {isSrmsTenant ? (
                                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        SRMS Live API (GetAllSubjectDetail)
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                        Subject Linker (Faculty Linked)
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Confirmed Selected Subject Card */}
                                {formData.subject_id ? (
                                  <div className="bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/60 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800/80 rounded-xl p-3 shadow-xs">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                          {cardPaperCode && (
                                            <span className="px-2.5 py-1 text-xs font-mono font-black bg-indigo-600 text-white rounded-lg shadow-xs flex items-center gap-1">
                                              <span>📄</span>
                                              <span>{cardPaperCode}</span>
                                            </span>
                                          )}
                                          {cardNumericCode && (
                                            <span className="px-2.5 py-1 text-xs font-mono font-black bg-purple-600 text-white dark:bg-purple-700 rounded-lg shadow-xs flex items-center gap-1" title={`Numeric Subject Code: ${cardNumericCode}`}>
                                              <span className="text-[10px] uppercase font-sans font-extrabold opacity-85">Code:</span>
                                              <span>#{cardNumericCode}</span>
                                            </span>
                                          )}
                                          {cardSubType && (
                                            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded-md border border-amber-200 dark:border-amber-800">
                                              {cardSubType}
                                            </span>
                                          )}
                                          {formData.code && (
                                            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-md border border-emerald-300 dark:border-emerald-800 font-mono">
                                              Auto Topic: {formData.code}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                          {cardTitle}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFormData({
                                            ...formData,
                                            subject_id: '',
                                            subject_code: '',
                                            subject_name: '',
                                            unit_id: '',
                                            unit_code: '',
                                            code: '',
                                          });
                                          setTopicSubjectSearch('');
                                          setIsTopicSubjectDropdownOpen(true);
                                        }}
                                        className="shrink-0 text-xs px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                        </svg>
                                        <span>Change Subject</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Autocomplete Search Input & Dropdown */
                                  <div className="relative">
                                    <div className="relative">
                                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                      </svg>
                                      <input
                                        type="text"
                                        value={topicSubjectSearch}
                                        onFocus={() => setIsTopicSubjectDropdownOpen(true)}
                                        onChange={(e) => {
                                          setTopicSubjectSearch(e.target.value);
                                          setIsTopicSubjectDropdownOpen(true);
                                        }}
                                        placeholder="🔍 Search subject by paper code (e.g. BCS 052), code (e.g. 88622), or title..."
                                        className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#5B4BFF] shadow-xs"
                                      />
                                      {topicSubjectSearch && (
                                        <button
                                          type="button"
                                          onClick={() => setTopicSubjectSearch('')}
                                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                                        >
                                          ✕
                                        </button>
                                      )}
                                    </div>

                                    {/* Dropdown list */}
                                    {isTopicSubjectDropdownOpen && (
                                      <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl divide-y divide-slate-100 dark:divide-slate-750">
                                        {loadingTopicSubjects ? (
                                          <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                                            <span className="w-3 h-3 rounded-full border-2 border-[#5B4BFF] border-t-transparent animate-spin"></span>
                                            <span>Fetching live subjects for Semester {formData.sem_cd || '5'}...</span>
                                          </div>
                                        ) : filteredSubjects.length === 0 ? (
                                          <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                                            No subjects found matching "{topicSubjectSearch}".
                                          </div>
                                        ) : (
                                          filteredSubjects.map((s: any) => {
                                            const subCodeOrId = String(s.sub_cd || s.code || s.id);
                                            const subNumericCode = getSubjectNumericCode(s, subCodeOrId);
                                            const paperCode = getSubjectPaperCode(s);
                                            const cleanPaperCode = paperCode.replace(/\s+/g, '').toUpperCase();
                                            const fullTitle = getSubjectTitle(s);
                                            const displayLabel = getSubjectDisplayLabel(s);
                                            const subType = s.SubTyp || s.type || 'THEORY';

                                            const previewTopicCode = getNextTopicCodeForSubject(subCodeOrId, topics, '', s);

                                            return (
                                              <button
                                                key={`${subCodeOrId}-${paperCode}`}
                                                type="button"
                                                onClick={() => {
                                                  // Find units belonging to this subject
                                                  const subUnits = units.filter(u => {
                                                    const uSubId = String(u.subject_id || '').trim();
                                                    const uSubCode = String(u.subject_code || '').trim();
                                                    const uCode = String(u.code || '').replace(/\s+/g, '').toUpperCase();
                                                    return (
                                                      uSubId === subCodeOrId ||
                                                      uSubCode === subCodeOrId ||
                                                      (paperCode && (uSubCode === paperCode || uSubId === paperCode)) ||
                                                      (cleanPaperCode && cleanPaperCode.length >= 2 && uCode.startsWith(cleanPaperCode))
                                                    );
                                                  });
                                                  const firstUnit = subUnits[0];
                                                  const nextTopicCode = getNextTopicCodeForSubject(subCodeOrId, topics, firstUnit?.code, s);

                                                  setFormData({
                                                    ...formData,
                                                    subject_id: subCodeOrId,
                                                    subject_code: paperCode || subCodeOrId,
                                                    subject_name: fullTitle,
                                                    unit_id: firstUnit?.code || firstUnit?.id || '',
                                                    unit_code: firstUnit?.code || '',
                                                    bloom_level: firstUnit?.bloom_level || formData.bloom_level || 'KL-2 (Understand)',
                                                    code: nextTopicCode,
                                                    name: (!formData.name || formData.name.startsWith('TOPIC')) ? nextTopicCode : formData.name,
                                                  });
                                                  setTopicSubjectSearch(displayLabel);
                                                  setIsTopicSubjectDropdownOpen(false);
                                                }}
                                                className="w-full text-left p-2.5 hover:bg-indigo-50/80 dark:hover:bg-slate-700/60 transition-colors flex items-center justify-between gap-3 group"
                                              >
                                                <div className="min-w-0 flex-1">
                                                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                                    {paperCode && (
                                                      <span className="px-2 py-0.5 text-xs font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800">
                                                        📄 {paperCode}
                                                      </span>
                                                    )}
                                                    {subNumericCode && (
                                                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-800">
                                                        #{subNumericCode}
                                                      </span>
                                                    )}
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                      {subType}
                                                    </span>
                                                  </div>
                                                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-[#5B4BFF]">
                                                    {fullTitle}
                                                  </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-800">
                                                    Next: {previewTopicCode}
                                                  </span>
                                                </div>
                                              </button>
                                            );
                                          })
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Step 8: Select Unit (Cascading from Selected Subject), Topic Code (Auto) & Bloom's Level */}
                        <div className="grid grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                              <span>Step 8: Select Unit *</span>
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                                {availableUnits.length} units
                              </span>
                            </label>
                            <select
                              required
                              value={units.find(u => u.id === formData.unit_id || u.code === formData.unit_id)?.code || formData.unit_id || ''}
                              onChange={e => {
                                const val = e.target.value;
                                const found = availableUnits.find(u => u.code === val || u.id === val);
                                const unitCode = found?.code || val;
                                const subCode = formData.subject_code || formData.subject_id || '';
                                const nextTopicCode = getNextTopicCodeForSubject(subCode, topics, unitCode, currentSubjectObj);

                                setFormData({
                                  ...formData,
                                  unit_id: found?.code || found?.id || val,
                                  unit_code: found?.code || '',
                                  _resolved_unit_id: found?.id,
                                  bloom_level: found?.bloom_level || formData.bloom_level || 'KL-2 (Understand)',
                                  code: (!formData.code || formData.code.startsWith('TOPIC') || (nextTopicCode && /^\d+$/.test(nextTopicCode))) ? nextTopicCode : formData.code,
                                });
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="">-- Choose Unit --</option>
                              {availableUnits.map(u => (
                                <option key={u.id} value={u.code || u.id}>
                                  📑 {u.code} — {u.name && u.name !== u.code ? u.name : (u.description ? u.description.slice(0, 25) : u.code)}
                                </option>
                              ))}
                            </select>
                            {availableUnits.length === 0 && formData.subject_id && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
                                ⚠️ No units found for this subject yet. You can still create the topic or add a Unit first.
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Topic Code (Auto) *
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.code || ''}
                              onChange={e => setFormData({ ...formData, code: e.target.value })}
                              placeholder="e.g. BCS502-T1 or 851851"
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold uppercase focus:outline-none focus:border-[#5B4BFF]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 truncate" title={isMedicalTopic ? 'Enter No of Competency Under This Topic' : "Bloom's Knowledge Level"}>
                              {isMedicalTopic ? 'Enter No of Competency Under This Topic *' : "Bloom's Knowledge Level *"}
                            </label>
                            {isMedicalTopic ? (
                              <input
                                type="number"
                                min="1"
                                max="100"
                                required
                                value={formData.competency_count || formData.competencies_count || (formData.bloom_level && !isNaN(Number(formData.bloom_level)) ? formData.bloom_level : '')}
                                onChange={e => {
                                  const val = e.target.value;
                                  setFormData({
                                    ...formData,
                                    competency_count: val,
                                    competencies_count: val,
                                    bloom_level: val ? `Competencies: ${val}` : '',
                                  });
                                }}
                                placeholder="e.g. 5"
                                className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                              />
                            ) : (
                              <select
                                required
                                value={formData.bloom_level || 'KL-2 (Understand)'}
                                onChange={e => setFormData({ ...formData, bloom_level: e.target.value })}
                                className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                              >
                                <option value="KL-1 (Remember)">KL-1 (Remember)</option>
                                <option value="KL-2 (Understand)">KL-2 (Understand)</option>
                                <option value="KL-3 (Apply)">KL-3 (Apply)</option>
                                <option value="KL-4 (Analyze)">KL-4 (Analyze)</option>
                                <option value="KL-5 (Evaluate)">KL-5 (Evaluate)</option>
                                <option value="KL-6 (Create)">KL-6 (Create)</option>
                              </select>
                            )}
                          </div>
                        </div>

                        {/* Row: Topic Title (col-span-2), Allocated Hours (col-span-1) */}
                        <div className="grid grid-cols-3 gap-2.5">
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Topic Title / Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.name || ''}
                              onChange={e => setFormData({ ...formData, name: e.target.value })}
                              placeholder="e.g. Introduction to HTML5 and Web Standards"
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Allocated Hours
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={formData.hours || 2}
                              onChange={e => setFormData({ ...formData, hours: Number(e.target.value) })}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]"
                            />
                          </div>
                        </div>

                        {/* Row: Learning Method & Assessment Method */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Learning Method
                            </label>
                            <select
                              value={formData.learning_method || ''}
                              onChange={e => setFormData({ ...formData, learning_method: e.target.value })}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="">-- Select Learning Method --</option>
                              {(isMedicalTopic ? MEDICAL_LEARNING_METHODS : ENGINEERING_LEARNING_METHODS).map(opt => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Assessment Method
                            </label>
                            <select
                              value={formData.assessment_method || ''}
                              onChange={e => setFormData({ ...formData, assessment_method: e.target.value })}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="">-- Select Assessment Method --</option>
                              {(isMedicalTopic ? MEDICAL_ASSESSMENT_METHODS : ENGINEERING_ASSESSMENT_METHODS).map(opt => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Row: Topic Description (col-span-2), Linked Guideline (col-span-1) */}
                        <div className="grid grid-cols-3 gap-2.5">
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Topic Description / Syllabus Details
                            </label>
                            <textarea
                              rows={2}
                              value={formData.description || ''}
                              onChange={e => setFormData({ ...formData, description: e.target.value })}
                              placeholder="Provide details about syllabus coverage, milestones, key concepts..."
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#5B4BFF] resize-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Linked Guideline (Optional)
                            </label>
                            <select
                              value={linkers.find(l => l.id === formData.linker_id || l.code === formData.linker_id)?.code || formData.linker_id || ''}
                              onChange={e => {
                                const val = e.target.value;
                                const found = linkers.find(l => l.code === val || l.id === val);
                                setFormData({ ...formData, linker_id: found?.code || found?.id || val, _resolved_linker_id: found?.id });
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="">-- Select Guideline --</option>
                              {linkers.map(l => (
                                <option key={l.id} value={l.code || l.id}>📋 {l.name} ({l.code})</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  {/* Form fields for Competencies / Sub-Topics (With Cascading Selectors, SRMS Live API & Auto Sub-Topic Code) */}
                  {activeTab === 'competencies' && (() => {
                    const currentCollege = colleges.find(c => c.code === formData.college_id || c.id === formData.college_id || c.slug === formData.college_slug) || colleges[0];
                    const availableCourses = getCoursesForCollege(currentCollege?.id || currentCollege?.slug);
                    const selectedCourseCd = formData.course_cd || availableCourses[0]?.course_cd || availableCourses[0]?.code || '';

                    const availableDepts = departments.filter(d => {
                      const isColMatch = !currentCollege || d.college_id === currentCollege.id || d.college_slug === currentCollege.slug || String(d.colg_cd) === String(currentCollege.code);
                      const isCourseMatch = !selectedCourseCd || d.course_cd === selectedCourseCd || d.course_code === selectedCourseCd;
                      return isColMatch && isCourseMatch;
                    });
                    const selectedBranchCd = formData.branch_cd || availableDepts[0]?.branch_cd || availableDepts[0]?.code || '1';

                    const availableBatches = batches.filter(b => {
                      const isColMatch = !currentCollege || b.college_id === currentCollege.id || b.college_slug === currentCollege.slug || String(b.colg_cd) === String(currentCollege.code);
                      const isCourseMatch = !selectedCourseCd || b.course_cd === selectedCourseCd;
                      return isColMatch && isCourseMatch;
                    });

                    const availableSubjects = subjects.filter(s => {
                      const isColMatch = !currentCollege || s.college_id === currentCollege.id || s.college_slug === currentCollege.slug;
                      const isCourseMatch = !selectedCourseCd || s.course_cd === selectedCourseCd;
                      const isBranchMatch = !selectedBranchCd || s.branch_cd === selectedBranchCd || s.department_id === selectedBranchCd;
                      const isSemMatch = !formData.sem_cd || String(s.sem_cd) === String(formData.sem_cd) || String(s.semester || '').includes(String(formData.sem_cd));
                      return isColMatch && isCourseMatch && isBranchMatch && isSemMatch;
                    });

                    // Strict matching for availableUnits for the selected subject:
                    const selectedSubCd = String(formData.subject_id || formData.subject_code || '').trim();
                    const selectedSubPaper = String(formData.subject_code || '').trim();
                    const cleanSubPaper = selectedSubPaper.replace(/\s+/g, '').toUpperCase();
                    const currentSubjectObj = subTopicLiveSubjects.find((s: any) =>
                      String(s.sub_cd || s.code || s.id) === String(formData.subject_id || formData.subject_code) ||
                      String(s.sub_addinfo || '') === String(formData.subject_code)
                    ) || subjects.find(s => s.id === formData.subject_id || s.code === formData.subject_id || s.code === formData.subject_code);

                    const availableUnits = units.filter(u => {
                      const isColMatch = !currentCollege || u.college_id === currentCollege.id || u.college_slug === currentCollege.slug;
                      const isCourseMatch = !selectedCourseCd || u.course_cd === selectedCourseCd;
                      const isBranchMatch = !selectedBranchCd || u.branch_cd === selectedBranchCd;
                      if (!selectedSubCd && !selectedSubPaper) return isColMatch && isCourseMatch && isBranchMatch;

                      const uSubId = String(u.subject_id || '').trim();
                      const uSubCode = String(u.subject_code || '').trim();
                      const uCode = String(u.code || '').replace(/\s+/g, '').toUpperCase();

                      const isSubMatch =
                        (selectedSubCd && (uSubId === selectedSubCd || uSubCode === selectedSubCd)) ||
                        (selectedSubPaper && (uSubCode === selectedSubPaper || uSubId === selectedSubPaper)) ||
                        (cleanSubPaper && cleanSubPaper.length >= 2 && uCode.startsWith(cleanSubPaper));

                      return isColMatch && isCourseMatch && isBranchMatch && isSubMatch;
                    });
                    const selectedUnitCode = formData.unit_code || formData.unit_id || availableUnits[0]?.code || '';

                    // Strict matching for availableTopics for the selected unit and subject:
                    const availableTopics = topics.filter(t => {
                      const isColMatch = !currentCollege || t.college_id === currentCollege.id || t.college_slug === currentCollege.slug;
                      const isCourseMatch = !selectedCourseCd || t.course_cd === selectedCourseCd;
                      const isBranchMatch = !selectedBranchCd || t.branch_cd === selectedBranchCd;
                      if (!selectedSubCd && !selectedSubPaper) return isColMatch && isCourseMatch && isBranchMatch;

                      const tSubId = String(t.subject_id || '').trim();
                      const tSubCode = String(t.subject_code || '').trim();
                      const tUnitId = String(t.unit_id || '').trim();
                      const tUnitCode = String(t.unit_code || '').trim();

                      const isSubMatch =
                        (selectedSubCd && (tSubId === selectedSubCd || tSubCode === selectedSubCd)) ||
                        (selectedSubPaper && (tSubCode === selectedSubPaper || tSubId === selectedSubPaper));

                      const isUnitMatch = !selectedUnitCode || tUnitCode === selectedUnitCode || tUnitId === selectedUnitCode;

                      return isColMatch && isCourseMatch && isBranchMatch && isSubMatch && isUnitMatch;
                    });
                    const selectedTopicCode = formData.topic_code || formData.topic_id || availableTopics[0]?.code || '';

                    // Check if current typed code already exists in this subject
                    const activeCheckCode = (subTopicCode || formData.code || '').trim().toUpperCase();
                    const codeExistsInSubject = activeCheckCode ? competencies.some(c =>
                      c.code?.toUpperCase() === activeCheckCode &&
                      (c.subject_code === selectedSubCd || c.subject_id === selectedSubCd || !selectedSubCd)
                    ) : false;

                    const handleAddSubTopicToQueue = () => {
                      const code = (subTopicCode || formData.code)?.trim().toUpperCase();
                      const desc = (subTopicDesc || formData.description)?.trim();
                      const name = (subTopicName || formData.name)?.trim();
                      if (!code) {
                        alert('Please enter a Sub-Topic / Competency Code');
                        return;
                      }
                      if (!desc) {
                        alert('Please enter a Competency Statement / Objective');
                        return;
                      }

                      if (tempCompetencies.some(it => it.code === code)) {
                        alert(`Sub-Topic code "${code}" is already in the queue.`);
                        return;
                      }

                      const newItem: TempCompetencyItem = {
                        code,
                        name,
                        description: desc,
                        domain: subTopicDomain || formData.domain || 'Knowledge',
                        level: subTopicLevel || formData.level || 'Knows How',
                        bloom_level: subTopicBloom || formData.bloom_level || 'KL-2 (Understand)',
                        is_core: subTopicCore,
                      };

                      const newQueue = [...tempCompetencies, newItem];
                      setTempCompetencies(newQueue);

                      const nextCode = getNextSubTopicCodeForTopic(
                        selectedTopicCode || formData.topic_code || formData.topic_id,
                        competencies,
                        currentSubjectObj,
                        newQueue
                      );
                      setSubTopicCode(nextCode);
                      setFormData(prev => ({ ...prev, code: nextCode }));
                      setSubTopicName('');
                      setSubTopicDesc('');
                    };

                    const selectedCourseObj = availableCourses.find((c: any) => c.course_cd === selectedCourseCd || c.code === selectedCourseCd || c.id === selectedCourseCd);
                    const isMedicalTopic = Boolean(
                      selectedCourseObj?.academic_system === 'professional' ||
                      selectedCourseObj?.academicSystem === 'professional' ||
                      selectedCourseObj?.name?.toUpperCase().includes('MBBS') ||
                      selectedCourseObj?.name?.toUpperCase().includes('BAMS') ||
                      selectedCourseObj?.name?.toUpperCase().includes('MD') ||
                      selectedCourseObj?.name?.toUpperCase().includes('MS') ||
                      selectedCourseObj?.name?.toUpperCase().includes('BDS') ||
                      selectedCourseObj?.code === '100' ||
                      selectedCourseObj?.course_cd === '100' ||
                      currentCollege?.slug === 'srms-ims' ||
                      currentCollege?.slug === 'rmribar'
                    );
                    const learningOptions = isMedicalTopic ? MEDICAL_LEARNING_METHODS : ENGINEERING_LEARNING_METHODS;
                    const assessmentOptions = isMedicalTopic ? MEDICAL_ASSESSMENT_METHODS : ENGINEERING_ASSESSMENT_METHODS;

                    return (
                      <>
                        {/* Step 1: Select College */}
                        <div className="space-y-1 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                          <label className="text-indigo-900 dark:text-indigo-300 font-extrabold flex items-center justify-between">
                            <span>Step 1: Select College *</span>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">
                              colg_cd: #{currentCollege?.code || '1'}
                            </span>
                          </label>
                          <select
                            required
                            value={currentCollege?.code || currentCollege?.id || formData.college_id}
                            onChange={(e) => {
                              const newColCd = e.target.value;
                              const newCol = colleges.find(c => c.code === newColCd || c.id === newColCd || c.slug === newColCd);
                              const colCourses = getCoursesForCollege(newCol?.id || newCol?.slug);
                              const firstCourseCd = colCourses[0]?.course_cd || colCourses[0]?.code || '';
                              const newDepts = departments.filter(d =>
                                (d.college_id === newCol?.id || d.college_slug === newCol?.slug || String(d.colg_cd) === String(newCol?.code)) &&
                                (!firstCourseCd || d.course_cd === firstCourseCd)
                              );
                              const firstBranchCd = newDepts[0]?.branch_cd || newDepts[0]?.code || '1';
                              const newBatches = batches.filter(b =>
                                (b.college_id === newCol?.id || b.college_slug === newCol?.slug || String(b.colg_cd) === String(newCol?.code)) &&
                                (!firstCourseCd || b.course_cd === firstCourseCd)
                              );
                              const firstBatch = newBatches[0];
                              const firstBatchCd = firstBatch?.batch_cd || firstBatch?.code || '17';
                              const firstBatchYear = firstBatch?.year || 2024;

                              setFormData({
                                ...formData,
                                college_id: newCol?.code || newCol?.id || newColCd,
                                college_slug: newCol?.slug || '',
                                course_cd: firstCourseCd,
                                branch_cd: firstBranchCd,
                                department_id: firstBranchCd,
                                batch_id: firstBatchCd,
                                batch_cd: firstBatchCd,
                                batch_year: firstBatchYear,
                                sem_cd: '5',
                                semester: 'Semester 5',
                                sec_cd: '1',
                                section: 'Section A',
                                subject_id: '',
                                subject_code: '',
                                unit_id: '',
                                unit_code: '',
                                topic_id: '',
                                topic_code: '',
                                code: 'ST01',
                              });
                              setSubTopicCode('ST01');
                              setSubTopicSubjectSearch('');
                              setIsSubTopicSubjectDropdownOpen(false);
                              fetchSubTopicSubjects(newCol?.code || newCol?.id || newColCd, firstCourseCd, firstBranchCd, firstBatchCd, '5', '1', newCol?.slug);
                            }}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            {colleges.map(c => (
                              <option key={c.id} value={c.code || c.id}>
                                🏛️ {c.name} ({c.slug})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Step 2: Select Course */}
                        <div className="space-y-1 bg-amber-50/50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                          <label className="text-amber-900 dark:text-amber-300 font-extrabold flex items-center justify-between">
                            <span>Step 2: Select Course *</span>
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                              course_cd: #{selectedCourseCd || '1'}
                            </span>
                          </label>
                          <select
                            required
                            value={selectedCourseCd}
                            onChange={(e) => {
                              const newCourseCd = e.target.value;
                              const newDepts = departments.filter(d =>
                                (d.college_id === currentCollege?.id || d.college_slug === currentCollege?.slug || String(d.colg_cd) === String(currentCollege?.code)) &&
                                (!newCourseCd || d.course_cd === newCourseCd || d.course_code === newCourseCd)
                              );
                              const firstBranchCd = newDepts[0]?.branch_cd || newDepts[0]?.code || '1';
                              const newBatches = batches.filter(b =>
                                (b.college_id === currentCollege?.id || b.college_slug === currentCollege?.slug || String(b.colg_cd) === String(currentCollege?.code)) &&
                                (!newCourseCd || b.course_cd === newCourseCd)
                              );
                              const firstBatch = newBatches[0];
                              const firstBatchCd = firstBatch?.batch_cd || firstBatch?.code || '17';
                              const firstBatchYear = firstBatch?.year || 2024;

                              setFormData({
                                ...formData,
                                course_cd: newCourseCd,
                                branch_cd: firstBranchCd,
                                department_id: firstBranchCd,
                                batch_id: firstBatchCd,
                                batch_cd: firstBatchCd,
                                batch_year: firstBatchYear,
                                sem_cd: '5',
                                semester: 'Semester 5',
                                sec_cd: '1',
                                section: 'Section A',
                                subject_id: '',
                                subject_code: '',
                                unit_id: '',
                                unit_code: '',
                                topic_id: '',
                                topic_code: '',
                                code: 'ST01',
                              });
                              setSubTopicCode('ST01');
                              setSubTopicSubjectSearch('');
                              setIsSubTopicSubjectDropdownOpen(false);
                              fetchSubTopicSubjects(currentCollege?.code || formData.college_id, newCourseCd, firstBranchCd, firstBatchCd, '5', '1', currentCollege?.slug);
                            }}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            {availableCourses.map(c => (
                              <option key={c.id || c.code} value={c.course_cd || c.code}>
                                🎓 {c.name} (Code: #{c.course_cd || c.code})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Step 3: Select Branch / Department */}
                        <div className="space-y-1 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <label className="text-emerald-900 dark:text-emerald-300 font-extrabold flex items-center justify-between">
                            <span>Step 3: Select Branch / Department *</span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                              branch_cd: #{selectedBranchCd || '1'}
                            </span>
                          </label>
                          <select
                            required
                            value={selectedBranchCd}
                            onChange={(e) => {
                              const newBranchCd = e.target.value;
                              setFormData({
                                ...formData,
                                branch_cd: newBranchCd,
                                department_id: newBranchCd,
                                subject_id: '',
                                subject_code: '',
                                unit_id: '',
                                unit_code: '',
                                topic_id: '',
                                topic_code: '',
                                code: 'ST01',
                              });
                              setSubTopicCode('ST01');
                              setSubTopicSubjectSearch('');
                              setIsSubTopicSubjectDropdownOpen(false);
                              fetchSubTopicSubjects(
                                currentCollege?.code || formData.college_id,
                                selectedCourseCd,
                                newBranchCd,
                                formData.batch_id || formData.batch_cd || '17',
                                formData.sem_cd || '5',
                                formData.sec_cd || '1',
                                currentCollege?.slug
                              );
                            }}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                          >
                            {availableDepts.length === 0 ? (
                              <option value="1">Dept #1</option>
                            ) : (
                              availableDepts.map(d => {
                                const displayCode = d.branch_cd || d.code || '1';
                                const displayName = (d.name && d.name !== '-') ? d.name : `Dept ${displayCode}`;
                                return (
                                  <option key={d.id} value={displayCode}>
                                    🏢 {displayName} (Code: #{displayCode})
                                  </option>
                                );
                              })
                            )}
                          </select>
                        </div>

                        {/* Step 4: Select Batch (Cascading) */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                              <span>Step 4: Select Batch *</span>
                              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                                batch_cd: #{formData.batch_cd || '17'}
                              </span>
                            </label>
                            <select
                              required
                              value={formData.batch_cd || formData.batch_id || '17'}
                              onChange={(e) => {
                                const chosenBatchCd = e.target.value;
                                const selectedB = availableBatches.find(b =>
                                  String(b.batch_cd) === chosenBatchCd || String(b.code) === chosenBatchCd || String(b.year) === chosenBatchCd || String(b.id) === chosenBatchCd
                                );
                                const chosenYear = selectedB?.year || formData.batch_year || 2024;

                                setFormData({
                                  ...formData,
                                  batch_id: chosenBatchCd,
                                  batch_cd: chosenBatchCd,
                                  _resolved_batch_id: selectedB?.id,
                                  batch_year: chosenYear,
                                  subject_id: '',
                                  subject_code: '',
                                  unit_id: '',
                                  unit_code: '',
                                  topic_id: '',
                                  topic_code: '',
                                  code: 'ST01',
                                });
                                setSubTopicCode('ST01');
                                setSubTopicSubjectSearch('');
                                setIsSubTopicSubjectDropdownOpen(false);
                                fetchSubTopicSubjects(
                                  currentCollege?.code || formData.college_id,
                                  selectedCourseCd,
                                  selectedBranchCd,
                                  chosenBatchCd,
                                  formData.sem_cd || '5',
                                  formData.sec_cd || '1',
                                  currentCollege?.slug
                                );
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="">-- Select Batch --</option>
                              {availableBatches.map(b => (
                                <option key={b.id} value={b.batch_cd || b.code || b.year || b.id}>
                                  📅 {b.name || `Batch ${b.year}`} (Code: #{b.batch_cd || b.year})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Batch Admission Year
                            </label>
                            <input
                              type="number"
                              min="2000"
                              max="2100"
                              value={formData.batch_year || 2024}
                              onChange={e => setFormData({ ...formData, batch_year: Number(e.target.value) })}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-[#5B4BFF]"
                            />
                          </div>
                        </div>

                        {/* Step 5: Select Semester & Step 6: Select Section (Cascading) */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                              <span>Step 5: Select Semester *</span>
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                                sem_cd: #{formData.sem_cd || '5'}
                              </span>
                            </label>
                            <select
                              required
                              value={formData.sem_cd || '5'}
                              onChange={(e) => {
                                const newSemCd = e.target.value;
                                const semName = `Semester ${newSemCd}`;
                                setFormData({
                                  ...formData,
                                  sem_cd: newSemCd,
                                  semester: semName,
                                  subject_id: '',
                                  subject_code: '',
                                  unit_id: '',
                                  unit_code: '',
                                  topic_id: '',
                                  topic_code: '',
                                  code: 'ST01',
                                });
                                setSubTopicCode('ST01');
                                setSubTopicSubjectSearch('');
                                setIsSubTopicSubjectDropdownOpen(false);
                                fetchSubTopicSubjects(
                                  currentCollege?.code || formData.college_id,
                                  selectedCourseCd,
                                  selectedBranchCd,
                                  formData.batch_id || formData.batch_cd || '17',
                                  newSemCd,
                                  formData.sec_cd || '1',
                                  currentCollege?.slug
                                );
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                <option key={s} value={String(s)}>
                                  📖 Semester {s} (Code: #{s})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                              <span>Step 6: Select Section *</span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                                sec_cd: #{formData.sec_cd || '1'}
                              </span>
                            </label>
                            <select
                              required
                              value={formData.sec_cd || '1'}
                              onChange={(e) => {
                                const newSecCd = e.target.value;
                                const secMap: Record<string, string> = {
                                  '1': 'Section A',
                                  '2': 'Section B',
                                  '3': 'Section C',
                                  '4': 'Section D',
                                  'all': 'All Sections',
                                };
                                const newSecName = secMap[newSecCd] || `Section ${newSecCd}`;
                                setFormData({
                                  ...formData,
                                  sec_cd: newSecCd,
                                  section: newSecName,
                                  subject_id: '',
                                  subject_code: '',
                                  unit_id: '',
                                  unit_code: '',
                                  topic_id: '',
                                  topic_code: '',
                                  code: 'ST01',
                                });
                                setSubTopicCode('ST01');
                                setSubTopicSubjectSearch('');
                                setIsSubTopicSubjectDropdownOpen(false);
                                fetchSubTopicSubjects(
                                  currentCollege?.code || formData.college_id,
                                  selectedCourseCd,
                                  selectedBranchCd,
                                  formData.batch_id || formData.batch_cd || '17',
                                  formData.sem_cd || '5',
                                  newSecCd,
                                  currentCollege?.slug
                                );
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="1">🏷️ Section A (Code: #1)</option>
                              <option value="2">🏷️ Section B (Code: #2)</option>
                              <option value="3">🏷️ Section C (Code: #3)</option>
                              <option value="4">🏷️ Section D (Code: #4)</option>
                              <option value="all">🏷️ All Sections</option>
                            </select>
                          </div>
                        </div>

                        {/* Step 7: Select Subject (SRMS Live API GetAllSubjectDetail / Subject Linker with Autocomplete Search) */}
                        <div className="space-y-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                          {(() => {
                            const isSrmsTenant = (currentCollege?.slug || formData.college_slug || '').toLowerCase().includes('srms');
                            const rawSubjectList = subTopicLiveSubjects.length > 0 ? subTopicLiveSubjects : availableSubjects;
                            const displaySubjectList = rawSubjectList.filter((s: any) => {
                              if (!formData.sem_cd) return true;
                              const sSem = String(s.sem_cd ?? s.semester ?? s.semester_name ?? '');
                              return sSem === String(formData.sem_cd) || sSem.includes(String(formData.sem_cd));
                            });
                            const filteredSubjects = displaySubjectList.filter((s: any) => {
                              if (!subTopicSubjectSearch.trim()) return true;
                              const q = subTopicSubjectSearch.toLowerCase().trim();
                              const qClean = q.replace(/\s+/g, '');
                              const paper = getSubjectPaperCode(s).toLowerCase();
                              const paperClean = paper.replace(/\s+/g, '');
                              const title = getSubjectTitle(s).toLowerCase();
                              const numCode = getSubjectNumericCode(s).toLowerCase();
                              return paper.includes(q) || paperClean.includes(qClean) || title.includes(q) || numCode.includes(q);
                            });

                            const selectedSubjectObj = displaySubjectList.find((s: any) =>
                              String(s.sub_cd || s.code || s.id) === String(formData.subject_id || formData.subject_code) ||
                              String(s.sub_addinfo || '') === String(formData.subject_code) ||
                              (getSubjectPaperCode(s) && getSubjectPaperCode(s) === String(formData.subject_code || formData.subject_id))
                            ) || subjects.find(s => s.id === formData.subject_id || s.code === formData.subject_id || s.code === formData.subject_code);

                            const cardPaperCode = getSubjectPaperCode(selectedSubjectObj) || formData.subject_code || '';
                            const cardNumericCode = getSubjectNumericCode(selectedSubjectObj, formData.subject_id || formData.subject_code);
                            const cardTitle = getSubjectTitle(selectedSubjectObj) || formData.subject_name || 'Selected Subject';
                            const cardSubType = selectedSubjectObj?.SubTyp || selectedSubjectObj?.type || 'THEORY';

                            return (
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <span>Step 7: Select Subject *</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                      {loadingSubTopicSubjects ? 'Fetching subjects...' : `${displaySubjectList.length} available`}
                                    </span>
                                  </label>
                                  <div className="flex items-center gap-1.5 text-[10px]">
                                    {isSrmsTenant ? (
                                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        SRMS Live API (GetAllSubjectDetail)
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                        Subject Linker (Faculty Linked)
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Confirmed Selected Subject Card */}
                                {formData.subject_id ? (
                                  <div className="bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/60 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800/80 rounded-xl p-3 shadow-xs">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                          {cardPaperCode && (
                                            <span className="px-2.5 py-1 text-xs font-mono font-black bg-indigo-600 text-white rounded-lg shadow-xs flex items-center gap-1">
                                              <span>📄</span>
                                              <span>{cardPaperCode}</span>
                                            </span>
                                          )}
                                          {cardNumericCode && (
                                            <span className="px-2.5 py-1 text-xs font-mono font-black bg-purple-600 text-white dark:bg-purple-700 rounded-lg shadow-xs flex items-center gap-1" title={`Numeric Subject Code: ${cardNumericCode}`}>
                                              <span className="text-[10px] uppercase font-sans font-extrabold opacity-85">Code:</span>
                                              <span>#{cardNumericCode}</span>
                                            </span>
                                          )}
                                          {cardSubType && (
                                            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded-md border border-amber-200 dark:border-amber-800">
                                              {cardSubType}
                                            </span>
                                          )}
                                          {formData.code && (
                                            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-md border border-emerald-300 dark:border-emerald-800 font-mono">
                                              Auto Sub-Topic: {formData.code}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                          {cardTitle}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFormData({
                                            ...formData,
                                            subject_id: '',
                                            subject_code: '',
                                            subject_name: '',
                                            unit_id: '',
                                            unit_code: '',
                                            topic_id: '',
                                            topic_code: '',
                                            code: 'ST01',
                                          });
                                          setSubTopicCode('ST01');
                                          setSubTopicSubjectSearch('');
                                          setIsSubTopicSubjectDropdownOpen(true);
                                        }}
                                        className="shrink-0 text-xs px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                        </svg>
                                        <span>Change Subject</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Autocomplete Search Input & Dropdown */
                                  <div className="relative">
                                    <div className="relative">
                                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                      </svg>
                                      <input
                                        type="text"
                                        value={subTopicSubjectSearch}
                                        onFocus={() => setIsSubTopicSubjectDropdownOpen(true)}
                                        onChange={(e) => {
                                          setSubTopicSubjectSearch(e.target.value);
                                          setIsSubTopicSubjectDropdownOpen(true);
                                        }}
                                        placeholder="🔍 Search subject by paper code (e.g. BCS 052), code (e.g. 88622), or title..."
                                        className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#5B4BFF] shadow-xs"
                                      />
                                      {subTopicSubjectSearch && (
                                        <button
                                          type="button"
                                          onClick={() => setSubTopicSubjectSearch('')}
                                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                                        >
                                          ✕
                                        </button>
                                      )}
                                    </div>

                                    {/* Dropdown list */}
                                    {isSubTopicSubjectDropdownOpen && (
                                      <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl divide-y divide-slate-100 dark:divide-slate-750">
                                        {loadingSubTopicSubjects ? (
                                          <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                                            <span className="w-3 h-3 rounded-full border-2 border-[#5B4BFF] border-t-transparent animate-spin"></span>
                                            <span>Fetching live subjects for Semester {formData.sem_cd || '5'}...</span>
                                          </div>
                                        ) : filteredSubjects.length === 0 ? (
                                          <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                                            No subjects found matching "{subTopicSubjectSearch}".
                                          </div>
                                        ) : (
                                          filteredSubjects.map((s: any) => {
                                            const subCodeOrId = String(s.sub_cd || s.code || s.id);
                                            const subNumericCode = getSubjectNumericCode(s, subCodeOrId);
                                            const paperCode = getSubjectPaperCode(s);
                                            const cleanPaperCode = paperCode.replace(/\s+/g, '').toUpperCase();
                                            const fullTitle = getSubjectTitle(s);
                                            const displayLabel = getSubjectDisplayLabel(s);
                                            const subType = s.SubTyp || s.type || 'THEORY';

                                            // Find units belonging to this subject
                                            const subUnits = units.filter(u => {
                                              const uSubId = String(u.subject_id || '').trim();
                                              const uSubCode = String(u.subject_code || '').trim();
                                              const uCode = String(u.code || '').replace(/\s+/g, '').toUpperCase();
                                              return (
                                                uSubId === subCodeOrId ||
                                                uSubCode === subCodeOrId ||
                                                (paperCode && (uSubCode === paperCode || uSubId === paperCode)) ||
                                                (cleanPaperCode && cleanPaperCode.length >= 2 && uCode.startsWith(cleanPaperCode))
                                              );
                                            });
                                            const firstUnit = subUnits[0];
                                            const unitCode = firstUnit?.code || '';

                                            // Find topics belonging to firstUnit
                                            const subTopics = topics.filter(t => {
                                              const tSubId = String(t.subject_id || '').trim();
                                              const tSubCode = String(t.subject_code || '').trim();
                                              const tUnitId = String(t.unit_id || '').trim();
                                              const tUnitCode = String(t.unit_code || '').trim();
                                              const isSubMatch = tSubId === subCodeOrId || tSubCode === subCodeOrId || (paperCode && (tSubCode === paperCode || tSubId === paperCode));
                                              const isUnitMatch = !unitCode || tUnitCode === unitCode || tUnitId === unitCode || tUnitId === firstUnit?.id;
                                              return isSubMatch && isUnitMatch;
                                            });
                                            const firstTopic = subTopics[0];
                                            const previewSubCode = getNextSubTopicCodeForTopic(firstTopic?.code, competencies, s, tempCompetencies);

                                            return (
                                              <button
                                                key={`${subCodeOrId}-${paperCode}`}
                                                type="button"
                                                onClick={() => {
                                                  setFormData({
                                                    ...formData,
                                                    subject_id: subCodeOrId,
                                                    subject_code: paperCode || subCodeOrId,
                                                    subject_name: fullTitle,
                                                    unit_id: firstUnit?.code || firstUnit?.id || '',
                                                    unit_code: firstUnit?.code || '',
                                                    _resolved_unit_id: firstUnit?.id,
                                                    topic_id: firstTopic?.code || firstTopic?.id || '',
                                                    topic_code: firstTopic?.code || '',
                                                    _resolved_topic_id: firstTopic?.id,
                                                    bloom_level: firstTopic?.bloom_level || firstUnit?.bloom_level || formData.bloom_level || 'KL-2 (Understand)',
                                                    code: previewSubCode,
                                                  });
                                                  setSubTopicCode(previewSubCode);
                                                  setSubTopicSubjectSearch(displayLabel);
                                                  setIsSubTopicSubjectDropdownOpen(false);
                                                }}
                                                className="w-full text-left p-2.5 hover:bg-indigo-50/80 dark:hover:bg-slate-700/60 transition-colors flex items-center justify-between gap-3 group"
                                              >
                                                <div className="min-w-0 flex-1">
                                                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                                    {paperCode && (
                                                      <span className="px-2 py-0.5 text-xs font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800">
                                                        📄 {paperCode}
                                                      </span>
                                                    )}
                                                    {subNumericCode && (
                                                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-800">
                                                        #{subNumericCode}
                                                      </span>
                                                    )}
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                      {subType}
                                                    </span>
                                                  </div>
                                                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-[#5B4BFF]">
                                                    {fullTitle}
                                                  </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-800">
                                                    Next: {previewSubCode}
                                                  </span>
                                                </div>
                                              </button>
                                            );
                                          })
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Step 8: Select Unit, Step 9: Select Topic & Step 10: Linked Guideline */}
                        <div className="grid grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                              <span>Step 8: Select Unit *</span>
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                                {availableUnits.length} in subject
                              </span>
                            </label>
                            <select
                              required
                              value={units.find(u => u.id === formData.unit_id || u.code === formData.unit_id)?.code || formData.unit_id || ''}
                              onChange={e => {
                                const val = e.target.value;
                                const found = availableUnits.find(u => u.code === val || u.id === val);
                                const unitCode = found?.code || val;
                                const subCode = formData.subject_code || formData.subject_id || '';

                                const unitTopics = topics.filter(t => {
                                  const isColMatch = !currentCollege || t.college_id === currentCollege.id || t.college_slug === currentCollege.slug;
                                  const isCourseMatch = !selectedCourseCd || t.course_cd === selectedCourseCd;
                                  const isBranchMatch = !selectedBranchCd || t.branch_cd === selectedBranchCd;
                                  const isSubMatch = !subCode || t.subject_code === subCode || t.subject_id === subCode;
                                  const isUnitMatch = !unitCode || t.unit_code === unitCode || t.unit_id === unitCode || t.unit_id === found?.id;
                                  return isColMatch && isCourseMatch && isBranchMatch && isSubMatch && isUnitMatch;
                                });
                                const firstTopic = unitTopics[0];
                                const topicCode = firstTopic?.code || '';
                                const nextSubCode = getNextSubTopicCodeForTopic(topicCode, competencies, currentSubjectObj, tempCompetencies);

                                setFormData({
                                  ...formData,
                                  unit_id: found?.code || found?.id || val,
                                  unit_code: found?.code || '',
                                  _resolved_unit_id: found?.id,
                                  topic_id: firstTopic?.code || firstTopic?.id || '',
                                  topic_code: firstTopic?.code || '',
                                  _resolved_topic_id: firstTopic?.id,
                                  bloom_level: firstTopic?.bloom_level || found?.bloom_level || formData.bloom_level || 'KL-2 (Understand)',
                                  code: nextSubCode,
                                });
                                setSubTopicCode(nextSubCode);
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="">-- Choose Unit --</option>
                              {availableUnits.map(u => (
                                <option key={u.id} value={u.code || u.id}>
                                  📑 {u.code} — {u.name && u.name !== u.code ? u.name : (u.description ? u.description.slice(0, 20) : u.code)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                              <span>Step 9: Select Topic *</span>
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                                {availableTopics.length} in unit
                              </span>
                            </label>
                            <select
                              required
                              value={topics.find(t => t.id === formData.topic_id || t.code === formData.topic_id)?.code || formData.topic_id || ''}
                              onChange={e => {
                                const val = e.target.value;
                                const found = availableTopics.find(t => t.code === val || t.id === val);
                                const topicCode = found?.code || val;
                                const nextSubCode = getNextSubTopicCodeForTopic(topicCode, competencies, currentSubjectObj, tempCompetencies);

                                setFormData({
                                  ...formData,
                                  topic_id: found?.code || found?.id || val,
                                  topic_code: found?.code || '',
                                  _resolved_topic_id: found?.id,
                                  bloom_level: found?.bloom_level || formData.bloom_level || 'KL-2 (Understand)',
                                  code: nextSubCode,
                                });
                                setSubTopicCode(nextSubCode);
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="">-- Choose Topic --</option>
                              {availableTopics.map(t => (
                                <option key={t.id} value={t.code || t.id}>
                                  📌 [{t.code}] {t.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              📋 Linked Guideline
                            </label>
                            <select
                              value={linkers.find(l => l.id === formData.linker_id || l.code === formData.linker_id)?.code || formData.linker_id || ''}
                              onChange={e => {
                                const val = e.target.value;
                                const found = linkers.find(l => l.code === val || l.id === val);
                                setFormData({ ...formData, linker_id: found?.code || found?.id || val, _resolved_linker_id: found?.id });
                              }}
                              className="w-full px-3 py-2 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                            >
                              <option value="">-- Select Guideline (Optional) --</option>
                              {linkers.map(l => (
                                <option key={l.id} value={l.code || l.id}>📋 {l.name} ({l.code})</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Sub-Topic / Competency Entry Card */}
                        <div className="bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/80 p-3.5 rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                              <span>✨</span> Sub-Topic / Competency Details
                            </span>
                            <div className="flex items-center gap-2">
                              {activeCheckCode && (
                                codeExistsInSubject ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                    <span>⚠️</span> Code exists in subject
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                    <span>✅</span> Code available
                                  </span>
                                )
                              )}
                            </div>
                          </div>

                          {/* Row 3: Code, Domain, Mastery, Core */}
                          <div className="grid grid-cols-4 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Sub-Topic Code *
                              </label>
                              <input
                                type="text"
                                value={subTopicCode || formData.code || ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  setSubTopicCode(val);
                                  setFormData({ ...formData, code: val });
                                }}
                                placeholder="e.g. ST01 / AN1.1"
                                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold uppercase focus:outline-none focus:border-[#5B4BFF]"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Blooms Domain *
                              </label>
                              <select
                                value={subTopicDomain || formData.domain || 'Knowledge'}
                                onChange={e => {
                                  setSubTopicDomain(e.target.value);
                                  setFormData({ ...formData, domain: e.target.value });
                                }}
                                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                              >
                                <option value="Knowledge">Knowledge (Cognitive)</option>
                                <option value="Skills">Skills (Psychomotor)</option>
                                <option value="Attitude">Attitude (Affective)</option>
                                <option value="Communication">Communication</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Mastery Level
                              </label>
                              <select
                                value={subTopicLevel || formData.level || 'Knows How'}
                                onChange={e => {
                                  setSubTopicLevel(e.target.value);
                                  setFormData({ ...formData, level: e.target.value });
                                }}
                                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                              >
                                <option value="Knows">Knows (K)</option>
                                <option value="Knows How">Knows How (KH)</option>
                                <option value="Shows How">Shows How (SH)</option>
                                <option value="Performs">Performs (P)</option>
                              </select>
                            </div>

                            <div className="flex items-center pt-5">
                              <label className="flex items-center gap-2 cursor-pointer text-slate-900 dark:text-white font-bold text-xs select-none">
                                <input
                                  type="checkbox"
                                  checked={subTopicCore}
                                  onChange={e => {
                                    setSubTopicCore(e.target.checked);
                                    setFormData({ ...formData, is_core: e.target.checked });
                                  }}
                                  className="w-4 h-4 rounded text-[#5B4BFF] focus:ring-[#5B4BFF] bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                                />
                                Core Sub-Topic
                              </label>
                            </div>
                          </div>

                          
                          {/* Row: Learning Method & Assessment Method */}
                          {(() => {
                            const selectedCourseObj = availableCourses.find((c: any) => c.course_cd === selectedCourseCd || c.code === selectedCourseCd || c.id === selectedCourseCd);
                            const isMedicalComp = Boolean(
                              selectedCourseObj?.academic_system === 'professional' ||
                              selectedCourseObj?.academicSystem === 'professional' ||
                              selectedCourseObj?.name?.toUpperCase().includes('MBBS') ||
                              selectedCourseObj?.name?.toUpperCase().includes('BAMS') ||
                              selectedCourseObj?.name?.toUpperCase().includes('MD') ||
                              selectedCourseObj?.name?.toUpperCase().includes('MS') ||
                              selectedCourseObj?.name?.toUpperCase().includes('BDS') ||
                              selectedCourseObj?.code === '100' ||
                              selectedCourseObj?.course_cd === '100' ||
                              currentCollege?.slug === 'srms-ims' ||
                              currentCollege?.slug === 'rmribar'
                            );
                            const learningOptions = isMedicalComp ? MEDICAL_LEARNING_METHODS : ENGINEERING_LEARNING_METHODS;
                            const assessmentOptions = isMedicalComp ? MEDICAL_ASSESSMENT_METHODS : ENGINEERING_ASSESSMENT_METHODS;

                            return (
                              <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Learning Method
                                  </label>
                                  <select
                                    value={subTopicLearningMethod || formData.learning_method || ''}
                                    onChange={e => {
                                      setSubTopicLearningMethod(e.target.value);
                                      setFormData({ ...formData, learning_method: e.target.value });
                                    }}
                                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                                  >
                                    <option value="">-- Select Learning Method --</option>
                                    {learningOptions.map(opt => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Assessment Method
                                  </label>
                                  <select
                                    value={subTopicAssessmentMethod || formData.assessment_method || ''}
                                    onChange={e => {
                                      setSubTopicAssessmentMethod(e.target.value);
                                      setFormData({ ...formData, assessment_method: e.target.value });
                                    }}
                                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                                  >
                                    <option value="">-- Select Assessment Method --</option>
                                    {assessmentOptions.map(opt => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Row 4: Title, Statement, Add Button */}
                          <div className="grid grid-cols-12 gap-2.5 items-end">
                            <div className="col-span-4">
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Sub-Topic Title / Name (Optional)
                              </label>
                              <input
                                type="text"
                                value={subTopicName || formData.name || ''}
                                onChange={e => {
                                  setSubTopicName(e.target.value);
                                  setFormData({ ...formData, name: e.target.value });
                                }}
                                placeholder="e.g. Introduction to Python"
                                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                              />
                            </div>

                            <div className="col-span-6">
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Competency Statement / Objective *
                              </label>
                              <input
                                type="text"
                                value={subTopicDesc || formData.description || ''}
                                onChange={e => {
                                  setSubTopicDesc(e.target.value);
                                  setFormData({ ...formData, description: e.target.value });
                                }}
                                placeholder="Describe the importance..."
                                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#5B4BFF]"
                              />
                            </div>

                            <div className="col-span-2">
                              <button
                                type="button"
                                onClick={handleAddSubTopicToQueue}
                                className="w-full py-1.5 px-3 text-xs font-bold text-white bg-[#5B4BFF] hover:bg-indigo-600 rounded-lg shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1"
                              >
                                <span>➕</span> Add
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Temporary Sub-Topics Queue List Table (When multiple added) */}
                        {tempCompetencies.length > 0 && (
                          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                            <div className="flex items-center justify-between text-xs font-extrabold text-slate-900 dark:text-white">
                              <span className="flex items-center gap-1.5">
                                <span>📋</span> Queued Sub-Topics for Topic ({tempCompetencies.length} items ready to save)
                              </span>
                              <button
                                type="button"
                                onClick={() => setTempCompetencies([])}
                                className="text-[11px] text-rose-500 hover:underline font-bold"
                              >
                                Clear All
                              </button>
                            </div>

                            <div className="max-h-36 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700">
                              {tempCompetencies.map((item, idx) => (
                                <div key={idx} className="py-1.5 flex items-center justify-between gap-3 text-xs">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="font-mono font-extrabold text-[#5B4BFF] bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded text-[11px] border border-indigo-200 dark:border-indigo-800">
                                      {item.code}
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                      {item.name ? `${item.name} — ` : ''}{item.description}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-medium">
                                      ({item.domain} • {item.level})
                                    </span>
                                    {item.is_core && (
                                      <span className="text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/40 px-1 rounded">
                                        ⭐ Core
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setTempCompetencies(tempCompetencies.filter((_, i) => i !== idx))}
                                    className="text-rose-500 hover:text-rose-700 font-bold text-sm px-1"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2 text-xs font-bold text-white bg-[#5B4BFF] hover:bg-indigo-600 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                          </svg>
                          <span>Saving record to PostgreSQL...</span>
                        </>
                      ) : (
                        <span>
                          {activeTab === 'competencies' && tempCompetencies.length > 0
                            ? `Save (${tempCompetencies.length}) Sub-Topics to PostgreSQL`
                            : 'Save Record to PostgreSQL'}
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
