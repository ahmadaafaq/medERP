'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Plus,
  Tag,
  Building2,
  GraduationCap,
  GitBranch,
  Calendar,
  Layers,
  FlaskConical,
  Briefcase,
  Laptop,
} from 'lucide-react';

interface OptionItem {
  id: string;
  code: string;
  name: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type DisciplineType = 'ENGINEERING' | 'PHARMACEUTICAL' | 'MANAGEMENT';

interface CourseItem extends OptionItem {
  duration: number;
  branches: OptionItem[];
}

interface DisciplineConfig {
  name: string;
  badgeLabel: string;
  icon: any;
  modalTitle: string;
  modalSubtitle: string;
  topicTitleLabel: string;
  topicTitlePlaceholder: string;
  chipsLabel: string;
  chipsPlaceholder: string;
  defaultChips: string[];
  descriptionLabel: string;
  descriptionPlaceholder: string;
  promptLabel: string;
  promptPlaceholder: string;
  courses: CourseItem[];
}

const COLLEGES_STATIC: OptionItem[] = [
  { id: '1', code: '1', name: 'SRMS College of Engineering & Technology (CET Bareilly)' },
  { id: '2', code: '2', name: 'SRMS College of Engineering, Technology & Research (CETR Bareilly)' },
  { id: '3', code: '3', name: 'SRMS College of Engineering & Technology (CET Lucknow)' },
  { id: '4', code: '4', name: 'SRMS College of Pharmacy (Bareilly)' },
  { id: '6', code: '6', name: 'SRMS Institute of Business Studies (IBS Lucknow)' },
];

const DISCIPLINE_CONFIGS: Record<DisciplineType, DisciplineConfig> = {
  ENGINEERING: {
    name: 'Engineering & Technology',
    badgeLabel: 'Engineering Project',
    icon: Laptop,
    modalTitle: 'Assign Mini Project Topic & Technology Stack',
    modalSubtitle: 'Publish required topic, mandatory tech stack and prompt instructions for students',
    topicTitleLabel: 'Project Topic Title',
    topicTitlePlaceholder: 'e.g. React & PostgreSQL Full-Stack Hospital Asset Tracker',
    chipsLabel: 'Required Technologies Stack (Chips)',
    chipsPlaceholder: 'Type tech name (e.g. React, Docker, NestJS, Python) and press Enter...',
    defaultChips: ['React', 'Next.js', 'PostgreSQL', 'TailwindCSS', 'Node.js'],
    descriptionLabel: 'Project Description & System Architecture',
    descriptionPlaceholder: 'Explain the problem statement, system architecture requirements, and core functional features...',
    promptLabel: 'Student Coding Prompt & Weekly Milestone Guidelines',
    promptPlaceholder: 'Instructions for students to follow when building their project code and weekly milestones in the Mini Project tab...',
    courses: [
      {
        id: '1',
        code: '1',
        name: 'B.Tech (Bachelor of Technology)',
        duration: 8,
        branches: [
          { id: '1', code: '1', name: 'CS - Computer Science & Engineering' },
          { id: '2', code: '2', name: 'IT - Information Technology' },
          { id: '3', code: '3', name: 'EC - Electronics & Communication Engineering' },
          { id: '4', code: '4', name: 'EE - Electrical Engineering' },
          { id: '5', code: '5', name: 'EN - Electrical & Electronics Engineering' },
          { id: '6', code: '6', name: 'ME - Mechanical Engineering' },
          { id: '7', code: '7', name: 'AI & ML - Artificial Intelligence & Machine Learning' },
        ],
      },
      {
        id: '13',
        code: '13',
        name: 'BCA (Bachelor of Computer Applications)',
        duration: 6,
        branches: [
          { id: '1', code: '1', name: 'Computer Applications Core' },
          { id: '2', code: '2', name: 'Web & Mobile Application Development' },
          { id: '3', code: '3', name: 'Cloud Computing & DevOps' },
        ],
      },
      {
        id: '3',
        code: '3',
        name: 'MCA (Master of Computer Applications)',
        duration: 4,
        branches: [
          { id: '1', code: '1', name: 'Full-Stack Software Engineering' },
          { id: '2', code: '2', name: 'Enterprise Cloud & Distributed Systems' },
          { id: '3', code: '3', name: 'Data Science & Artificial Intelligence' },
        ],
      },
      {
        id: '5',
        code: '5',
        name: 'M.Tech (Master of Technology)',
        duration: 4,
        branches: [
          { id: '1', code: '1', name: 'Computer Science & Engineering' },
          { id: '2', code: '2', name: 'Software Engineering' },
          { id: '3', code: '3', name: 'VLSI & Embedded Systems' },
        ],
      },
    ],
  },
  PHARMACEUTICAL: {
    name: 'Pharmaceutical Sciences',
    badgeLabel: 'Pharmacy Formulation',
    icon: FlaskConical,
    modalTitle: 'Assign Pharmacy Mini Project & Formulation Research Topic',
    modalSubtitle: 'Publish formulation topic, active pharmaceutical ingredients (API), lab methodology and research guidelines',
    topicTitleLabel: 'Formulation / Drug Research Topic Title',
    topicTitlePlaceholder: 'e.g. Formulation and In-Vitro Evaluation of Sustained-Release Paracetamol Tablets',
    chipsLabel: 'Required Active Ingredients (API), Excipients & Lab Equipment (Chips)',
    chipsPlaceholder: 'Type API, excipient or instrument (e.g. Paracetamol, HPMC K100M, HPLC, Dissolution Tester) & press Enter...',
    defaultChips: ['Paracetamol API', 'HPMC Polymer', 'HPLC Analysis', 'Dissolution Testing', 'UV Spectrophotometry'],
    descriptionLabel: 'Formulation Methodology, Mechanism of Action & Therapeutic Rationale',
    descriptionPlaceholder: 'Explain the drug mechanism, dosage form design, excipient compatibility, and physicochemical evaluation criteria...',
    promptLabel: 'Laboratory SOP, Pharmacopoeial Monograph & Logbook Guidelines',
    promptPlaceholder: 'Instructions for students to follow during wet-lab synthesis, stability testing, pharmacopoeial compliance, and weekly logbook entries...',
    courses: [
      {
        id: '2',
        code: '2',
        name: 'B.Pharm (Bachelor of Pharmacy)',
        duration: 8,
        branches: [
          { id: '1', code: '1', name: 'Pharmaceutics & Novel Drug Delivery (NDDS)' },
          { id: '2', code: '2', name: 'Pharmacology & Toxicology' },
          { id: '3', code: '3', name: 'Pharmaceutical Chemistry & Synthesis' },
          { id: '4', code: '4', name: 'Pharmacognosy & Phytochemistry' },
          { id: '5', code: '5', name: 'Pharmaceutical Quality Assurance (QA)' },
        ],
      },
      {
        id: '21',
        code: '21',
        name: 'M.Pharm (Master of Pharmacy)',
        duration: 4,
        branches: [
          { id: '1', code: '1', name: 'M.Pharm - Pharmaceutics & Drug Delivery' },
          { id: '2', code: '2', name: 'M.Pharm - Pharmacology & Toxicology' },
          { id: '3', code: '3', name: 'M.Pharm - Pharmaceutical Chemistry' },
          { id: '4', code: '4', name: 'M.Pharm - Quality Assurance' },
        ],
      },
      {
        id: '24',
        code: '24',
        name: 'Pharm.D (Doctor of Pharmacy)',
        duration: 10,
        branches: [
          { id: '1', code: '1', name: 'Hospital & Clinical Pharmacy Practice' },
          { id: '2', code: '2', name: 'Pharmacotherapeutics & Patient Care' },
        ],
      },
    ],
  },
  MANAGEMENT: {
    name: 'Management & Business Studies',
    badgeLabel: 'Business Case Study',
    icon: Briefcase,
    modalTitle: 'Assign Business Case Study & Management Project Topic',
    modalSubtitle: 'Publish capstone business case, analytical frameworks, methodologies and executive presentation guidelines',
    topicTitleLabel: 'Management Project / Case Study Title',
    topicTitlePlaceholder: 'e.g. Market Penetration Strategy & Financial Feasibility Analysis for EV Fleet in Tier-2 Cities',
    chipsLabel: 'Required Analytical Tools, Frameworks & Software (Chips)',
    chipsPlaceholder: 'Type framework or tool (e.g. SWOT Analysis, SPSS, Tableau, PowerBI, Porter\'s 5 Forces) & press Enter...',
    defaultChips: ['SWOT & PESTEL Analysis', 'Financial Modeling', 'SPSS Statistics', 'Market Survey Analytics', 'PowerBI'],
    descriptionLabel: 'Business Problem Statement, Strategic Objectives & Scope',
    descriptionPlaceholder: 'Explain corporate problem background, market research hypotheses, quantitative/qualitative methodologies, and actionable KPIs...',
    promptLabel: 'Executive Research Framework & Capstone Milestone Guidelines',
    promptPlaceholder: 'Instructions for students on primary survey sampling, statistical data validation, financial projections, and weekly progress logs...',
    courses: [
      {
        id: '4',
        code: '4',
        name: 'MBA (Master of Business Administration)',
        duration: 4,
        branches: [
          { id: '1', code: '1', name: 'Marketing Management & Brand Strategy' },
          { id: '2', code: '2', name: 'Financial Management & Corporate Finance' },
          { id: '3', code: '3', name: 'Human Resource Management (HRM)' },
          { id: '4', code: '4', name: 'Operations & Supply Chain Logistics' },
          { id: '5', code: '5', name: 'Business Analytics & Data Intelligence' },
          { id: '6', code: '6', name: 'International Business' },
        ],
      },
      {
        id: '12',
        code: '12',
        name: 'BBA (Bachelor of Business Administration)',
        duration: 6,
        branches: [
          { id: '1', code: '1', name: 'General Business Administration' },
          { id: '2', code: '2', name: 'E-Commerce & Digital Marketing' },
          { id: '3', code: '3', name: 'Banking & Financial Services' },
        ],
      },
      {
        id: '32',
        code: '32',
        name: 'PGDM (Post Graduate Diploma in Management)',
        duration: 4,
        branches: [
          { id: '1', code: '1', name: 'Enterprise Strategy & Leadership' },
          { id: '2', code: '2', name: 'Financial Analytics & Risk Management' },
        ],
      },
    ],
  },
};

const BATCHES_STATIC: OptionItem[] = [
  { id: '2', code: '2', name: 'Batch 2025 (2025 - 2029)' },
  { id: '1', code: '1', name: 'Batch 2024 (2024 - 2028)' },
  { id: '3', code: '3', name: 'Batch 2023 (2023 - 2027)' },
  { id: '4', code: '4', name: 'Batch 2022 (2022 - 2026)' },
];

export default function LogbookAssignProjectModal({ isOpen, onClose, onSuccess }: Props) {
  // 1. College Selection (Locked to Logged-in Tenant)
  const [colgCd, setColgCd] = useState<string>('1');
  const [colgName, setColgName] = useState<string>('SRMS College of Engineering & Technology (CET Bareilly)');

  // 2. Discipline / Category Selection (Second, changes below labels & course list)
  const [discipline, setDiscipline] = useState<DisciplineType>('ENGINEERING');

  // 3. Academic Hierarchy
  const [courseCd, setCourseCd] = useState<string>('1');
  const [branchCd, setBranchCd] = useState<string>('1');
  const [batchCd, setBatchCd] = useState<string>('2');
  const [semesterCd, setSemesterCd] = useState<string>('5');

  // Dynamic Lists
  const [coursesList, setCoursesList] = useState<CourseItem[]>(DISCIPLINE_CONFIGS.ENGINEERING.courses);
  const [branchesList, setBranchesList] = useState<OptionItem[]>(DISCIPLINE_CONFIGS.ENGINEERING.courses[0].branches);
  const [batchesList, setBatchesList] = useState<OptionItem[]>(BATCHES_STATIC);
  const [semestersList, setSemestersList] = useState<OptionItem[]>([]);

  // 4. Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [promptInstructions, setPromptInstructions] = useState('');
  const [techInput, setTechInput] = useState('');
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [submissionDeadline, setSubmissionDeadline] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentConfig = DISCIPLINE_CONFIGS[discipline];
  const DisciplineIcon = currentConfig.icon;

  const getTenantSlug = () => {
    if (typeof window === 'undefined') return 'srms-cet-bareilly';
    const slug =
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('selectedTenant') ||
      localStorage.getItem('colg_slug') ||
      'srms-cet-bareilly';
    return (slug || 'srms-cet-bareilly').replace(/^tenant_/, '').replace(/^tenant-/, '');
  };

  const getActiveColgCd = () => {
    if (typeof window === 'undefined') return '1';
    return localStorage.getItem('colg_cd') || localStorage.getItem('colgCd') || '1';
  };

  const getActiveColgName = () => {
    if (typeof window === 'undefined') return 'SRMS College of Engineering & Technology (CET Bareilly)';
    return (
      localStorage.getItem('college_name') ||
      localStorage.getItem('colg_name') ||
      localStorage.getItem('tenantName') ||
      'SRMS College of Engineering & Technology (CET Bareilly)'
    );
  };

  // Build semesters list
  const buildSemesters = useCallback((duration: number) => {
    const sems: OptionItem[] = [];
    for (let i = 1; i <= duration; i++) {
      sems.push({ id: String(i), code: String(i), name: `Semester ${i}` });
    }
    setSemestersList(sems);
  }, []);

  // Filter courses by selected discipline tab
  const isCourseInDiscipline = (c: { code: string; name: string }, disc: DisciplineType) => {
    const code = String(c.code).trim();
    const name = (c.name || '').toLowerCase();

    if (disc === 'ENGINEERING') {
      return (
        code === '1' ||
        code === '13' ||
        code === '3' || // Course #3 is MCA in tenant database
        code === '5' ||
        name.includes('tech') ||
        name.includes('bca') ||
        name.includes('mca') ||
        name.includes('computer') ||
        name.includes('engineering')
      );
    }
    if (disc === 'PHARMACEUTICAL') {
      return (
        code === '2' ||
        code === '21' ||
        code === '24' ||
        name.includes('pharm') ||
        name.includes('drug') ||
        name.includes('medical')
      );
    }
    if (disc === 'MANAGEMENT') {
      // Strictly exclude MCA or Engineering courses
      if (code === '3' || name.includes('mca') || name.includes('computer') || name.includes('engineering') || name.includes('tech')) {
        return false;
      }
      return (
        code === '4' || // Course #4 is MBA
        code === '12' || // Course #12 is BBA
        code === '31' ||
        code === '32' ||
        name.includes('mba') ||
        name.includes('bba') ||
        name.includes('pgdm') ||
        name.includes('management') ||
        name.includes('business')
      );
    }
    return true;
  };

  const fetchCoursesForDiscipline = async (cd: string, slug: string, disc: DisciplineType): Promise<CourseItem[]> => {
    try {
      const res = await fetch(`/api/srms/courses?colgcd=${cd}&tenant=${slug}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const filtered = list.filter((c: any) => isCourseInDiscipline({ code: String(c.course_cd || c.code), name: c.course_name || c.name }, disc));
          if (filtered.length > 0) {
            return filtered.map((c: any) => {
              const code = String(c.course_cd || c.code || '1');
              const staticMatch = DISCIPLINE_CONFIGS[disc].courses.find((sc) => sc.code === code);
              return {
                id: code,
                code,
                name: c.course_name || c.name || `Course ${code}`,
                duration: staticMatch ? staticMatch.duration : (code === '1' || code === '2' ? 8 : code === '13' || code === '31' ? 6 : 4),
                branches: staticMatch ? staticMatch.branches : [{ id: '1', code: '1', name: `${c.course_name || 'Core'} General` }],
              };
            });
          }
        }
      }
    } catch {}
    return DISCIPLINE_CONFIGS[disc].courses;
  };

  const fetchBranchesForCourse = async (cd: string, crs: string, slug: string, allCourses: CourseItem[]): Promise<OptionItem[]> => {
    try {
      const res = await fetch(`/api/srms/branches?colgcd=${cd}&coursecd=${crs}&tenant=${slug}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const courseObj = allCourses.find((c) => String(c.code) === String(crs));
          const courseName = courseObj?.name || 'Core';
          return list.map((b: any) => {
            const rawName = (b.branch_name || b.name || '').trim();
            const validName =
              rawName && rawName !== '-' && rawName !== 'null' && rawName !== 'NONE'
                ? rawName
                : `${b.course_name || courseName} General`;
            return {
              id: String(b.branch_cd || b.code || '1'),
              code: String(b.branch_cd || b.code || '1'),
              name: validName,
            };
          });
        }
      }
    } catch {}
    const matched = allCourses.find((c) => c.code === crs);
    return matched?.branches && matched.branches.length > 0
      ? matched.branches
      : [{ id: '1', code: '1', name: 'General Branch' }];
  };

  const fetchBatchesForCourse = async (cd: string, crs: string, slug: string): Promise<OptionItem[]> => {
    try {
      const res = await fetch(`/api/srms/batches?colgcd=${cd}&coursecd=${crs}&tenant=${slug}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          return list.map((b: any) => ({
            id: String(b.batch_cd || b.code || b.batch_name || '1'),
            code: String(b.batch_cd || b.code || b.batch_name || '1'),
            name: b.batch_name ? (b.batch_name.toLowerCase().includes('batch') ? b.batch_name : `Batch ${b.batch_name}`) : `Batch ${b.year || b.code}`,
          }));
        }
      }
    } catch {}
    if (crs === '13') {
      return [
        { id: '3', code: '3', name: 'Batch 2026 (2026 - 2029)' },
        { id: '2', code: '2', name: 'Batch 2025 (2025 - 2028)' },
        { id: '1', code: '1', name: 'Batch 2024 (2024 - 2027)' },
      ];
    }
    return BATCHES_STATIC;
  };

  // Handle Category / Discipline Tab Change
  const handleDisciplineChange = async (newDiscipline: DisciplineType) => {
    setDiscipline(newDiscipline);
    const cfg = DISCIPLINE_CONFIGS[newDiscipline];
    const cd = getActiveColgCd();
    const slug = getTenantSlug();

    const newCourses = await fetchCoursesForDiscipline(cd, slug, newDiscipline);
    setCoursesList(newCourses);

    const firstCourse = newCourses[0];
    const initialCourseCd = firstCourse ? firstCourse.code : '1';
    setCourseCd(initialCourseCd);

    const [branches, batches] = await Promise.all([
      fetchBranchesForCourse(cd, initialCourseCd, slug, newCourses),
      fetchBatchesForCourse(cd, initialCourseCd, slug),
    ]);

    setBranchesList(branches);
    setBatchesList(batches);
    setBranchCd(branches[0]?.code || '1');
    setBatchCd(batches.find((b) => b.name.includes('2025'))?.code || batches[0]?.code || '2');

    setTechnologies([...cfg.defaultChips]);
    const duration = firstCourse ? firstCourse.duration : 8;
    buildSemesters(duration);
    setSemesterCd(duration >= 5 ? '5' : '1');
  };

  // Handle Course Change
  const handleCourseChange = async (newCourseCd: string) => {
    setCourseCd(newCourseCd);
    const cd = getActiveColgCd();
    const slug = getTenantSlug();

    const [branches, batches] = await Promise.all([
      fetchBranchesForCourse(cd, newCourseCd, slug, coursesList),
      fetchBatchesForCourse(cd, newCourseCd, slug),
    ]);

    setBranchesList(branches);
    setBatchesList(batches);
    setBranchCd(branches[0]?.code || '1');
    setBatchCd(batches.find((b) => b.name.includes('2025'))?.code || batches[0]?.code || '2');

    const selectedCourseObj = coursesList.find((c) => c.code === newCourseCd);
    const duration = selectedCourseObj ? selectedCourseObj.duration : 8;
    buildSemesters(duration);
    setSemesterCd(duration >= 5 ? '5' : '1');
  };

  // Initialize modal state on open
  useEffect(() => {
    if (isOpen) {
      const activeCd = getActiveColgCd();
      const activeName = getActiveColgName();
      const slug = getTenantSlug();

      setColgCd(activeCd);
      setColgName(activeName);

      const initData = async () => {
        const cfg = DISCIPLINE_CONFIGS[discipline];
        const courses = await fetchCoursesForDiscipline(activeCd, slug, discipline);
        setCoursesList(courses);

        const firstCourse = courses[0] || cfg.courses[0];
        const initialCourseCd = firstCourse.code;
        setCourseCd(initialCourseCd);

        const [branches, batches] = await Promise.all([
          fetchBranchesForCourse(activeCd, initialCourseCd, slug, courses),
          fetchBatchesForCourse(activeCd, initialCourseCd, slug),
        ]);

        setBranchesList(branches);
        setBatchesList(batches);
        setBranchCd(branches[0]?.code || '1');
        setBatchCd(batches.find((b) => b.name.includes('2025'))?.code || batches[0]?.code || '2');

        setTechnologies([...cfg.defaultChips]);
        buildSemesters(firstCourse.duration || 8);
        setSemesterCd(firstCourse.duration >= 5 ? '5' : '1');
        setError(null);
      };

      initData();
    }
  }, [isOpen, buildSemesters]);

  if (!isOpen) return null;

  const handleAddTech = () => {
    if (techInput.trim() && !technologies.includes(techInput.trim())) {
      setTechnologies([...technologies, techInput.trim()]);
      setTechInput('');
    }
  };

  const handleRemoveTech = (tech: string) => {
    setTechnologies(technologies.filter((t) => t !== tech));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(`Please enter the ${currentConfig.topicTitleLabel.toLowerCase()}.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    const slug = getTenantSlug();
    const token = localStorage.getItem('token') || '';

    const payload = {
      title,
      description,
      promptInstructions: promptInstructions || `Follow the ${currentConfig.name} standard guidelines and complete weekly milestones.`,
      technologies,
      disciplineType: discipline,
      collegeId: colgCd,
      courseId: courseCd,
      branchId: branchCd,
      batchId: batchCd,
      semesterId: semesterCd,
      maxMarks: Number(maxMarks) || 100,
      submissionDeadline: submissionDeadline || null,
    };

    try {
      const res = await fetch(`/api/v1/logbook/mini-project?tenant=${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to assign project topic');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong while publishing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Dynamic Gradient & Discipline Icon */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#2D2575] via-[#3730A3] to-[#4F46E5] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <DisciplineIcon className="w-5 h-5 text-[#F36C21]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg leading-tight">{currentConfig.modalTitle}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#F36C21] text-white shadow-sm">
                  {currentConfig.badgeLabel}
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">{currentConfig.modalSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: FIRST COLLEGE CARD / SELECTION (LOCKED TO LOGGED-IN TENANT) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#5B4BFF]" />
                <span>1. College / Institute</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                🔒 Active Tenant
              </span>
            </div>
            <select
              value={colgCd}
              disabled
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-not-allowed opacity-90 shadow-sm"
            >
              <option value={colgCd}>{colgName}</option>
            </select>
          </div>

          {/* STEP 2: CATEGORY / DISCIPLINE TO CHANGE BELOW LABELS */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F36C21]" />
              <span>2. Select Academic Category / Discipline (Updates Below Form Labels)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(['ENGINEERING', 'PHARMACEUTICAL', 'MANAGEMENT'] as DisciplineType[]).map((dType) => {
                const isSelected = discipline === dType;
                const dCfg = DISCIPLINE_CONFIGS[dType];
                const Icon = dCfg.icon;
                return (
                  <button
                    key={dType}
                    type="button"
                    onClick={() => handleDisciplineChange(dType)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#2D2575] text-white border-[#2D2575] shadow-md ring-2 ring-[#5B4BFF]/40 scale-[1.01]'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl ${
                        isSelected ? 'bg-white/20 text-[#F36C21]' : 'bg-white dark:bg-slate-700 text-[#5B4BFF]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs leading-snug">{dCfg.name}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                        {dType === 'PHARMACEUTICAL'
                          ? 'B.Pharm, M.Pharm'
                          : dType === 'MANAGEMENT'
                          ? 'BBA, MBA, PGDM'
                          : 'B.Tech, BCA, MCA, M.Tech'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 3: COURSE, BRANCH, BATCH, SEMESTER DROPDOWNS */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/80 p-4 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#5B4BFF] uppercase tracking-wider pb-1 border-b border-indigo-100 dark:border-indigo-900/60">
              <GraduationCap className="w-4 h-4" />
              <span>3. Target Degree, Branch &amp; Cohort</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Course Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  <span>🎓 Course *</span>
                </label>
                <select
                  value={courseCd}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  {coursesList.map((crs, idx) => (
                    <option key={crs.code || idx} value={crs.code}>
                      [#{crs.code}] {crs.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch / Specialization Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                  <span>🏢 Branch * <span className="text-[#5B4BFF]">({branchesList.length})</span></span>
                </label>
                <select
                  value={branchCd}
                  onChange={(e) => setBranchCd(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  {branchesList.map((b, idx) => (
                    <option key={b.code || idx} value={b.code}>
                      [#{b.code}] {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>👥 Batch * <span className="text-[#5B4BFF]">({batchesList.length})</span></span>
                </label>
                <select
                  value={batchCd}
                  onChange={(e) => setBatchCd(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  {batchesList.map((bt, idx) => (
                    <option key={bt.code || idx} value={bt.code}>
                      [#{bt.code}] Batch {bt.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Semester Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>📅 Semester</span>
                </label>
                <select
                  value={semesterCd}
                  onChange={(e) => setSemesterCd(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  <option value="all">All Semesters</option>
                  {semestersList.map((sem, idx) => (
                    <option key={sem.code || idx} value={sem.code}>
                      {sem.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* STEP 4: TOPIC TITLE (DYNAMIC LABEL & PLACEHOLDER) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {currentConfig.topicTitleLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={currentConfig.topicTitlePlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              required
            />
          </div>

          {/* STEP 5: CHIPS / REQUISITES (DYNAMIC LABELS FOR PHARMA / ENG / MANAGEMENT) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {currentConfig.chipsLabel}
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTech();
                  }
                }}
                placeholder={currentConfig.chipsPlaceholder}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
              <button
                type="button"
                onClick={handleAddTech}
                className="px-3.5 py-2 rounded-xl bg-[#5B4BFF]/10 text-[#5B4BFF] font-bold text-xs hover:bg-[#5B4BFF]/20 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {technologies.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-lg bg-[#2D2575]/10 dark:bg-[#2D2575]/40 text-[#2D2575] dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 border border-[#2D2575]/20 shadow-sm"
                >
                  <Tag className="w-3 h-3 text-[#F36C21]" />
                  {t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTech(t)}
                    className="text-slate-400 hover:text-red-500 font-bold ml-1 text-sm leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* STEP 6: DESCRIPTION & OBJECTIVE (DYNAMIC LABEL & PLACEHOLDER) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {currentConfig.descriptionLabel}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={currentConfig.descriptionPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] leading-relaxed"
            />
          </div>

          {/* STEP 7: GUIDELINES / PROMPT (DYNAMIC LABEL & PLACEHOLDER) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {currentConfig.promptLabel}
            </label>
            <textarea
              rows={3}
              value={promptInstructions}
              onChange={(e) => setPromptInstructions(e.target.value)}
              placeholder={currentConfig.promptPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] leading-relaxed"
            />
          </div>

          {/* STEP 8: MAX MARKS & DEADLINE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Max Marks (Rubric Score)
              </label>
              <input
                type="number"
                min="10"
                max="500"
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Final Submission Deadline
              </label>
              <input
                type="date"
                value={submissionDeadline}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#F36C21] hover:bg-[#E05B10] text-white text-xs font-bold shadow-md shadow-[#F36C21]/25 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? (
                'Assigning...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Assign {currentConfig.badgeLabel}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
