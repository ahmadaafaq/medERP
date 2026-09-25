'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

interface AcademicCourse {
  code: string;
  name: string;
}

interface AcademicBranch {
  code: string;
  name: string;
}

interface AcademicBatch {
  code: string;
  name: string;
  year?: number;
}

interface Lesson {
  id: number;
  title: string;
  description?: string;
  colg_cd: string;
  course_cd: string;
  branch_cd: string;
  batch_cd: string;
  sem_cd: string;
  subject_id?: string;
  unit_id?: string;
  topic_id?: string;
  subtopic_id?: string;
  empid: string;
  faculty_name?: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

interface CurriculumUnit {
  id: string;
  code: string;
  name: string;
  description?: string;
}

interface CurriculumTopic {
  id: string;
  code: string;
  name: string;
}

interface CurriculumSubtopic {
  id: string;
  code: string;
  name: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

// Helper function to generate syllabus units tailored dynamically to a specific subject
function generateSyllabusUnits(code: string, name: string): CurriculumUnit[] {
  const n = (name || '').toLowerCase();
  const c = (code || '').trim();

  // 1. Universal Human Values & Professional Ethics
  if (c === '88536' || n.includes('human value') || n.includes('ethics') || n.includes('values')) {
    return [
      { id: 'U1', code: 'Unit 1', name: 'Unit 1: Introduction to Value Education & Self Exploration' },
      { id: 'U2', code: 'Unit 2', name: 'Unit 2: Harmony in the Human Being - Understanding Myself' },
      { id: 'U3', code: 'Unit 3', name: 'Unit 3: Harmony in the Family and Society - Relationship & Trust' },
      { id: 'U4', code: 'Unit 4', name: 'Unit 4: Harmony in Nature & Existence - Whole Existence as Co-existence' },
      { id: 'U5', code: 'Unit 5', name: 'Unit 5: Implications of Holistic Understanding - Professional Ethics' },
    ];
  }

  // 2. Computer Organization & Architecture
  if (c === '88535' || n.includes('computer organization') || n.includes('architecture')) {
    return [
      { id: 'U1', code: 'Unit 1', name: 'Unit 1: Introduction to Computer System, Data Representation & Logic' },
      { id: 'U2', code: 'Unit 2', name: 'Unit 2: Central Processing Unit & Instruction Cycle' },
      { id: 'U3', code: 'Unit 3', name: 'Unit 3: Memory Hierarchy, Cache Memory & Virtual Memory' },
      { id: 'U4', code: 'Unit 4', name: 'Unit 4: Input-Output Organization & DMA Controllers' },
      { id: 'U5', code: 'Unit 5', name: 'Unit 5: Pipelining, Instruction Hazards & Parallel Processing' },
    ];
  }

  // 3. Web Technology & Front End Development
  if (c === '88534' || c === '88539' || c === '88541' || n.includes('web') || n.includes('front end') || n.includes('html') || n.includes('css')) {
    return [
      { id: 'CO1', code: 'CO1', name: 'CO1: Fundamentals of Web Architecture, HTML5 & CSS3 Styling' },
      { id: 'CO2', code: 'CO2', name: 'CO2: JavaScript Essentials, DOM Manipulation & Event Handling' },
      { id: 'CO3', code: 'CO3', name: 'CO3: Responsive Layouts, Flexbox, Grid & UI Components' },
      { id: 'CO4', code: 'CO4', name: 'CO4: Client-Server Architecture, REST APIs & Asynchronous JS' },
      { id: 'CO5', code: 'CO5', name: 'CO5: Full Stack Integration, Web Security & Project Deployment' },
    ];
  }

  // 4. Object Oriented Programming in C++ / Java
  if (c === '88532' || c === '88538' || n.includes('c++') || n.includes('java') || n.includes('object oriented')) {
    return [
      { id: 'U1', code: 'Unit 1', name: 'Unit 1: Principles of OOP, Data Types & Control Structures' },
      { id: 'U2', code: 'Unit 2', name: 'Unit 2: Classes, Objects, Constructors & Destructors' },
      { id: 'U3', code: 'Unit 3', name: 'Unit 3: Operator Overloading & Type Conversion Mechanisms' },
      { id: 'U4', code: 'Unit 4', name: 'Unit 4: Inheritance, Virtual Functions & Dynamic Polymorphism' },
      { id: 'U5', code: 'Unit 5', name: 'Unit 5: Templates, Exception Handling & File Stream I/O' },
    ];
  }

  // 5. Business Communication / Soft Skills
  if (c === '88533' || n.includes('communication') || n.includes('english')) {
    return [
      { id: 'U1', code: 'Unit 1', name: 'Unit 1: Basics of Communication & Structural Language Skills' },
      { id: 'U2', code: 'Unit 2', name: 'Unit 2: Business Writing: Letters, Emails, Memos & Resumes' },
      { id: 'U3', code: 'Unit 3', name: 'Unit 3: Oral Presentations, Phonetics & Body Language' },
      { id: 'U4', code: 'Unit 4', name: 'Unit 4: Group Discussions, Interview Preparation & Meetings' },
      { id: 'U5', code: 'Unit 5', name: 'Unit 5: Technical Report Writing & Proposal Drafting' },
    ];
  }

  // 6. Operating System
  if (c === '88537' || c === '87665' || c === '87659' || n.includes('operating system') || n.includes('os')) {
    return [
      { id: 'U1', code: 'Unit 1', name: 'Unit 1: Introduction to Operating Systems & System Structures' },
      { id: 'U2', code: 'Unit 2', name: 'Unit 2: Process Management, Threads & CPU Scheduling Algorithms' },
      { id: 'U3', code: 'Unit 3', name: 'Unit 3: Process Synchronization, Semaphores & Deadlock Handling' },
      { id: 'U4', code: 'Unit 4', name: 'Unit 4: Memory Management, Paging, Segmentation & Virtual Memory' },
      { id: 'U5', code: 'Unit 5', name: 'Unit 5: Storage Management, File Systems & Disk Scheduling' },
    ];
  }

  // 7. Mathematics
  if (c === '88595' || n.includes('math') || n.includes('discrete')) {
    return [
      { id: 'U1', code: 'Unit 1', name: 'Unit 1: Matrices, Determinants & Systems of Linear Equations' },
      { id: 'U2', code: 'Unit 2', name: 'Unit 2: Differential Calculus, Limits & Mean Value Theorems' },
      { id: 'U3', code: 'Unit 3', name: 'Unit 3: Integral Calculus & Numerical Integration Methods' },
      { id: 'U4', code: 'Unit 4', name: 'Unit 4: Discrete Structures, Set Theory & Boolean Algebra' },
      { id: 'U5', code: 'Unit 5', name: 'Unit 5: Probability Distributions & Statistical Analysis' },
    ];
  }

  // 8. Digital Marketing & SEO
  if (c === '88540' || n.includes('marketing') || n.includes('seo')) {
    return [
      { id: 'U1', code: 'Unit 1', name: 'Unit 1: Digital Marketing Landscape & Consumer Conversion Funnels' },
      { id: 'U2', code: 'Unit 2', name: 'Unit 2: Search Engine Optimization (On-Page, Off-Page & Technical)' },
      { id: 'U3', code: 'Unit 3', name: 'Unit 3: Search Engine Marketing, Google Ads & PPC Campaigns' },
      { id: 'U4', code: 'Unit 4', name: 'Unit 4: Social Media Marketing & Content Strategy' },
      { id: 'U5', code: 'Unit 5', name: 'Unit 5: Web Analytics, Conversion Tracking & ROI Measurement' },
    ];
  }

  // 9. Practical / Lab Subjects
  if (n.includes('lab') || n.includes('workshop') || n.includes('seminar')) {
    return [
      { id: 'L1', code: 'Lab Unit 1', name: 'Lab Unit 1: Environment Setup, Tool Configuration & Foundation' },
      { id: 'L2', code: 'Lab Unit 2', name: 'Lab Unit 2: Implementation of Core Algorithmic Techniques' },
      { id: 'L3', code: 'Lab Unit 3', name: 'Lab Unit 3: Intermediate Problem Solving & Module Testing' },
      { id: 'L4', code: 'Lab Unit 4', name: 'Lab Unit 4: Complex Application Scenarios & Mini-Project Build' },
      { id: 'L5', code: 'Lab Unit 5', name: 'Lab Unit 5: Viva Voce, Project Evaluation & Code Optimization' },
    ];
  }

  // 10. Default dynamic units for any other subject
  return [
    { id: 'U1', code: 'Unit 1', name: `Unit 1: ${name || 'Subject'} - Fundamental Concepts & Architecture` },
    { id: 'U2', code: 'Unit 2', name: `Unit 2: ${name || 'Subject'} - Core Methodologies & Mechanics` },
    { id: 'U3', code: 'Unit 3', name: `Unit 3: ${name || 'Subject'} - Analytical Formulation & Design` },
    { id: 'U4', code: 'Unit 4', name: `Unit 4: ${name || 'Subject'} - Practical Applications & Case Studies` },
    { id: 'U5', code: 'Unit 5', name: `Unit 5: ${name || 'Subject'} - Advanced Trends, Assessment & Review` },
  ];
}

// Helper to generate contextual topics for a chosen unit
function generateSyllabusTopics(unitCode: string, unitName: string, subjectCode: string): CurriculumTopic[] {
  const cleanU = unitCode.replace(/\s+/g, '');
  return [
    {
      id: `${subjectCode}-${cleanU}-T01`,
      code: `${subjectCode}-${cleanU}-T01`,
      name: `${unitCode}: Conceptual Foundations & Principles`,
    },
    {
      id: `${subjectCode}-${cleanU}-T02`,
      code: `${subjectCode}-${cleanU}-T02`,
      name: `${unitCode}: Detailed Methodology, Architecture & Analysis`,
    },
    {
      id: `${subjectCode}-${cleanU}-T03`,
      code: `${subjectCode}-${cleanU}-T03`,
      name: `${unitCode}: Applied Case Studies & Problem Solving`,
    },
  ];
}

// Helper to generate competencies for a chosen topic
function generateSyllabusSubtopics(topicCode: string): CurriculumSubtopic[] {
  return [
    {
      id: `${topicCode}-C01`,
      code: `${topicCode}-C01`,
      name: `Core Competency 1: Conceptual Knowledge & Definitions`,
    },
    {
      id: `${topicCode}-C02`,
      code: `${topicCode}-C02`,
      name: `Core Competency 2: Application, Modeling & Analysis`,
    },
    {
      id: `${topicCode}-C03`,
      code: `${topicCode}-C03`,
      name: `Core Competency 3: Practical Demonstration, Verification & Viva`,
    },
  ];
}

export default function FacultyLessonsPage() {
  const [colgCd, setColgCd] = useState<string>('1');
  const [colgName, setColgName] = useState<string>('SRMS College of Engineering & Technology (CET Bareilly)');

  // Academic Cascading Selectors
  const [coursesList, setCoursesList] = useState<AcademicCourse[]>([]);
  const [branchesList, setBranchesList] = useState<AcademicBranch[]>([]);
  const [batchesList, setBatchesList] = useState<AcademicBatch[]>([]);
  const [semestersList, setSemestersList] = useState<{ code: string; label: string }[]>([]);

  const [selectedCourse, setSelectedCourse] = useState<string>('13'); // Default BCA
  const [selectedBranch, setSelectedBranch] = useState<string>('1');
  const [selectedBatch, setSelectedBatch] = useState<string>('2');
  const [selectedSem, setSelectedSem] = useState<string>('3');
  const [selectedSection, setSelectedSection] = useState<string>('1'); // Section 1 = A, 2 = B, 3 = C, 4 = D

  // Curriculum State
  const [rawSubjects, setRawSubjects] = useState<any[]>([]);
  const [subjectsLoaded, setSubjectsLoaded] = useState<boolean>(false);
  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(false);

  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>('');

  // Dynamic Units, Topics, Subtopics lists for active subject & unit
  const [subjectUnits, setSubjectUnits] = useState<CurriculumUnit[]>([]);
  const [unitTopics, setUnitTopics] = useState<CurriculumTopic[]>([]);
  const [topicSubtopics, setTopicSubtopics] = useState<CurriculumSubtopic[]>([]);

  const [loadingUnits, setLoadingUnits] = useState<boolean>(false);
  const [loadingTopics, setLoadingTopics] = useState<boolean>(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Lessons List & UI State
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const getTenantSlug = () => {
    if (typeof window === 'undefined') return 'srms-cet-bareilly';
    const slug =
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('selectedTenant') ||
      localStorage.getItem('colg_slug') ||
      'srms-cet-bareilly';
    return (slug || 'srms-cet-bareilly').replace(/^tenant_/, '').replace(/^tenant-/, '');
  };

  const getColgCd = () => {
    if (typeof window === 'undefined') return '1';
    return localStorage.getItem('colg_cd') || localStorage.getItem('colgCd') || '1';
  };

  const getColgName = () => {
    if (typeof window === 'undefined') return 'SRMS College of Engineering & Technology (CET Bareilly)';
    const savedName =
      localStorage.getItem('college_name') ||
      localStorage.getItem('colg_name') ||
      localStorage.getItem('tenantName');
    if (savedName) return savedName;
    const slug = getTenantSlug();
    if (slug.includes('cetr')) return 'SRMS College of Engineering, Technology & Research (CETR Bareilly)';
    if (slug.includes('cet-lucknow') || slug.includes('cetl')) return 'SRMS College of Engineering & Technology (CET Lucknow)';
    if (slug.includes('pharm')) return 'SRMS College of Pharmacy (Bareilly)';
    if (slug.includes('ibs')) return 'SRMS Institute of Business Studies (IBS Lucknow)';
    if (slug.includes('ims')) return 'SRMS Institute of Medical Sciences (IMS Bareilly)';
    return 'SRMS College of Engineering & Technology (CET Bareilly)';
  };

  const getFacultyUser = () => {
    if (typeof window === 'undefined') return { name: 'VINAY KUMAR', empid: '202616658' };
    try {
      const cached = localStorage.getItem('user');
      if (cached) {
        const u = JSON.parse(cached);
        const p = u.profile || {};
        const name = p.name || u.name || p.faculty_name || u.faculty_name || localStorage.getItem('faculty_name') || localStorage.getItem('userName') || localStorage.getItem('name') || 'VINAY KUMAR';
        const empid = p.emp_id || p.empId || u.emp_id || u.empId || u.sub || localStorage.getItem('empid') || localStorage.getItem('emp_id') || '202616658';
        return { name: (name && name !== 'undefined' && name !== 'null') ? name : 'VINAY KUMAR', empid };
      }
    } catch {}
    const name = localStorage.getItem('faculty_name') || localStorage.getItem('userName') || localStorage.getItem('name') || 'VINAY KUMAR';
    const empid = localStorage.getItem('empid') || localStorage.getItem('emp_id') || '202616658';
    return { name: (name && name !== 'undefined' && name !== 'null') ? name : 'VINAY KUMAR', empid };
  };

  const formatAcademicScope = (item: Lesson) => {
    // 1. Course Name
    const courseMatch = coursesList.find((c) => String(c.code) === String(item.course_cd));
    let courseName = courseMatch?.name;
    if (!courseName) {
      if (item.course_cd === '13') courseName = 'BCA';
      else if (item.course_cd === '1') courseName = 'B.Tech';
      else if (item.course_cd === '2') courseName = 'B.Pharm';
      else if (item.course_cd === '3') courseName = 'MCA';
      else if (item.course_cd === '4') courseName = 'MBA';
      else courseName = `Course #${item.course_cd}`;
    }

    // 2. Branch Name (Format short code in parentheses like BCA • (CSE))
    const branchMatch = branchesList.find((b) => String(b.code) === String(item.branch_cd));
    let branchName = branchMatch?.name;
    if (!branchName) {
      if (item.course_cd === '13') branchName = '(CSE)';
      else if (item.course_cd === '3') branchName = '(MCA)';
      else if (item.course_cd === '2') branchName = '(Pharmacy)';
      else if (item.course_cd === '4') branchName = '(MBA)';
      else if (item.branch_cd === '1') branchName = '(CSE)';
      else if (item.branch_cd === '2') branchName = '(IT)';
      else if (item.branch_cd === '3') branchName = '(ME)';
      else if (item.branch_cd === '4') branchName = '(EE)';
      else if (item.branch_cd === '5') branchName = '(EC)';
      else branchName = `(Branch #${item.branch_cd})`;
    } else {
      const matchParen = branchName.match(/\(([^)]+)\)/);
      if (matchParen) {
        branchName = `(${matchParen[1]})`;
      } else if (!branchName.startsWith('(')) {
        branchName = `(${branchName})`;
      }
    }

    // 3. Batch Name
    const batchMatch = batchesList.find((b) => String(b.code) === String(item.batch_cd));
    let batchName = batchMatch?.name;
    if (!batchName) {
      if (item.batch_cd === '2' || item.batch_cd === '18') batchName = '2025';
      else if (item.batch_cd === '15' || item.batch_cd === '17') batchName = '2024';
      else if (item.batch_cd === '1' || item.batch_cd === '19' || item.batch_cd === '3') batchName = '2026';
      else batchName = item.batch_cd;
    }

    // 4. Sem Name
    const semClean = String(item.sem_cd || '').replace(/\D/g, '');
    const semLabel = semClean ? `Sem ${semClean}` : (item.sem_cd || 'Sem 1');

    return {
      primary: `${courseName} • ${branchName}`,
      secondary: `Batch ${batchName} • ${semLabel}`,
    };
  };

  const fetchCourses = async (cd: string, slug: string): Promise<AcademicCourse[]> => {
    try {
      const res = await fetch(`/api/srms/courses?colgcd=${cd}&tenant=${slug}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          return list.map((c: any) => ({
            code: String(c.course_cd || c.code || '1'),
            name: c.course_name || c.name || `Course ${c.course_cd}`,
          }));
        }
      }
    } catch {}
    return [
      { code: '13', name: 'BCA' },
      { code: '1', name: 'B.Tech' },
      { code: '3', name: 'MCA' },
      { code: '2', name: 'B.Pharm' },
      { code: '4', name: 'MBA' },
    ];
  };

  const fetchBranches = async (cd: string, crs: string, slug: string, allCourses: AcademicCourse[]): Promise<AcademicBranch[]> => {
    try {
      const res = await fetch(`/api/srms/branches?colgcd=${cd}&coursecd=${crs}&tenant=${slug}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const courseObj = allCourses.find((c) => String(c.code) === String(crs));
          const courseName = courseObj?.name || 'BCA';
          return list.map((b: any) => {
            const rawName = (b.branch_name || b.name || '').trim();
            const validName =
              rawName && rawName !== '-' && rawName !== 'null' && rawName !== 'NONE'
                ? rawName
                : `${b.course_name || courseName} General`;
            return {
              code: String(b.branch_cd || b.code || '1'),
              name: validName,
            };
          });
        }
      }
    } catch {}
    if (crs === '13') return [{ code: '1', name: 'BCA Department' }];
    if (crs === '1') {
      return [
        { code: '1', name: 'Computer Science & Engineering (CSE)' },
        { code: '2', name: 'Information Technology (IT)' },
        { code: '3', name: 'Electronics & Communication (ECE)' },
        { code: '4', name: 'Mechanical Engineering (ME)' },
      ];
    }
    if (crs === '3') return [{ code: '1', name: 'MCA Core' }];
    if (crs === '2') return [{ code: '1', name: 'B.Pharm Core' }];
    if (crs === '4') return [{ code: '1', name: 'MBA Core' }];
    return [{ code: '1', name: 'General Branch' }];
  };

  const fetchBatches = async (cd: string, crs: string, slug: string): Promise<AcademicBatch[]> => {
    try {
      const res = await fetch(`/api/srms/batches?colgcd=${cd}&coursecd=${crs}&tenant=${slug}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          return list.map((b: any) => ({
            code: String(b.batch_cd || b.code || b.batch_name || '1'),
            name: String(b.batch_name || b.name || b.year || b.batch_cd),
            year: Number(b.batch_name || b.year || 2025),
          }));
        }
      }
    } catch {}
    if (crs === '13') {
      return [
        { code: '3', name: '2026', year: 2026 },
        { code: '2', name: '2025', year: 2025 },
        { code: '1', name: '2024', year: 2024 },
      ];
    }
    if (crs === '1') {
      return [
        { code: '19', name: '2026', year: 2026 },
        { code: '18', name: '2025', year: 2025 },
        { code: '17', name: '2024', year: 2024 },
      ];
    }
    return [
      { code: '1', name: '2025', year: 2025 },
      { code: '2', name: '2024', year: 2024 },
    ];
  };

  const getSemestersForCourse = (courseCd: string, courseName?: string) => {
    const cName = (courseName || '').toLowerCase();
    let maxSem = 6;
    if (courseCd === '1' || courseCd === '2' || cName.includes('b.tech') || cName.includes('b.pharm')) {
      maxSem = 8;
    } else if (courseCd === '13' || cName.includes('bca')) {
      maxSem = 6;
    } else if (courseCd === '3' || courseCd === '4' || courseCd === '5' || courseCd === '21' || cName.includes('mca') || cName.includes('mba') || cName.includes('m.tech') || cName.includes('m.pharm')) {
      maxSem = 4;
    } else if (courseCd === '24' || cName.includes('pharm.d')) {
      maxSem = 10;
    } else {
      maxSem = 8;
    }

    const sems: { code: string; label: string }[] = [];
    for (let i = 1; i <= maxSem; i++) {
      const year = Math.ceil(i / 2);
      sems.push({ code: String(i), label: `${i}${i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'} Semester (Year ${year})` });
    }
    return sems;
  };

  // 1. All subject list load on button press
  const handleGetSubjects = async () => {
    try {
      setLoadingSubjects(true);
      setAlert(null);
      const tenant = getTenantSlug();
      const cd = getColgCd();
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';
      const headers = { 'Authorization': `Bearer ${token}` };

      // A. Fetch from Curriculum Subject Master in PostgreSQL
      const subjRes = await fetch(`${API_BASE}/admin-master/subjects?tenant=${tenant}`, { headers }).catch(() => null);
      let backendSubjects: any[] = [];
      if (subjRes && subjRes.ok) {
        const j = await subjRes.json();
        backendSubjects = Array.isArray(j.data) ? j.data : Array.isArray(j) ? j : [];
      }

      // B. Fetch from live SRMS portal proxy
      let liveSubjects: any[] = [];
      try {
        const secParam = selectedSection === 'ALL' ? '1' : selectedSection;
        const liveRes = await fetch(
          `/api/srms/all-subjects?colgcd=${cd}&coursecd=${selectedCourse}&branchcd=${selectedBranch}&batchcd=${selectedBatch}&semcd=${selectedSem}&section=${secParam}&tenant=${tenant}`
        );
        if (liveRes.ok) {
          const liveData = await liveRes.json();
          if (Array.isArray(liveData)) {
            liveSubjects = liveData.map((s: any) => ({
              id: String(s.sub_cd || s.code || s.id),
              code: String(s.sub_cd || s.code || s.id),
              name: s.sub_name || s.name,
              course_cd: String(selectedCourse),
              branch_cd: String(selectedBranch),
              batch_cd: String(selectedBatch),
              sem_cd: String(selectedSem),
              section: String(selectedSection),
              mst_sub_name: s.mst_sub_name,
            }));
          }
        }
      } catch (err) {
        console.warn('Live SRMS portal subjects fetch error:', err);
      }

      // C. Filter backend subjects by current academic scope (course & sem)
      const cleanSem = String(selectedSem).replace(/\D/g, '');
      const filteredBackend = backendSubjects.filter((s: any) => {
        const matchCourse = !selectedCourse || !s.course_cd || String(s.course_cd) === String(selectedCourse);
        const sSem = String(s.sem_cd || s.semester || '').replace(/\D/g, '');
        const matchSem = !cleanSem || !sSem || sSem === cleanSem;
        return matchCourse && matchSem;
      });

      // Merge and deduplicate by code
      const mergedMap = new Map<string, any>();
      (filteredBackend.length > 0 ? filteredBackend : backendSubjects).forEach((s: any) => {
        const key = String(s.code || s.id).trim().toUpperCase();
        mergedMap.set(key, s);
      });
      liveSubjects.forEach((s: any) => {
        const key = String(s.code || s.id).trim().toUpperCase();
        if (!mergedMap.has(key)) {
          mergedMap.set(key, s);
        }
      });

      const subjectsList = Array.from(mergedMap.values()).map((s: any) => ({
        id: String(s.id || s.code || s.sub_cd),
        code: String(s.code || s.sub_cd || s.id),
        name: s.name || s.sub_name || s.mst_sub_name || `Subject #${s.code || s.id}`,
        sem_cd: s.sem_cd || s.semester,
      }));

      setRawSubjects(subjectsList);
      setSubjectsLoaded(true);
      setSelectedSubject('');
      setSelectedUnit('');
      setSelectedTopic('');
      setSelectedSubtopic('');
      setSubjectUnits([]);
      setUnitTopics([]);
      setTopicSubtopics([]);

      const secLabel = selectedSection === 'ALL' ? 'All Sections' : `Section ${selectedSection === '1' ? 'A' : selectedSection === '2' ? 'B' : selectedSection === '3' ? 'C' : 'D'}`;
      if (subjectsList.length > 0) {
        setAlert({
          type: 'success',
          message: `Loaded ${subjectsList.length} subjects for Course #${selectedCourse} • Sem ${selectedSem} • ${secLabel}. Please choose a subject below.`,
        });
      } else {
        setAlert({
          type: 'error',
          message: `No curriculum subjects found for Course #${selectedCourse} • Sem ${selectedSem}.`,
        });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to fetch subjects from curriculum master.' });
    } finally {
      setLoadingSubjects(false);
    }
  };

  // 2. On subject select: dynamically fetch & load units specifically for the selected subject
  const handleSubjectChange = async (newSubjectCode: string) => {
    setSelectedSubject(newSubjectCode);
    setSelectedUnit('');
    setSelectedTopic('');
    setSelectedSubtopic('');
    setSubjectUnits([]);
    setUnitTopics([]);
    setTopicSubtopics([]);

    if (!newSubjectCode) return;

    try {
      setLoadingUnits(true);
      const tenant = getTenantSlug();
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';
      const headers = { 'Authorization': `Bearer ${token}` };

      // Find subject details from loaded rawSubjects
      const subjObj = rawSubjects.find(
        (s: any) => String(s.code).toLowerCase() === String(newSubjectCode).toLowerCase() ||
                    String(s.id).toLowerCase() === String(newSubjectCode).toLowerCase()
      );
      const subName = (subjObj?.name || '').trim();
      const subCode = (subjObj?.code || newSubjectCode).trim();
      const subId = subjObj?.id || '';

      // A. Fetch custom units from backend PostgreSQL for this specific subject
      const res = await fetch(
        `${API_BASE}/admin-master/units?tenant=${tenant}&subjectCode=${encodeURIComponent(subCode)}&subjectId=${encodeURIComponent(subId)}`,
        { headers }
      ).catch(() => null);

      let fetchedUnits: any[] = [];
      if (res && res.ok) {
        const j = await res.json();
        const list = Array.isArray(j.data) ? j.data : Array.isArray(j) ? j : [];
        fetchedUnits = list.filter((u: any) => {
          const uSubCode = String(u.subject_code || '').toLowerCase();
          const uSubId = String(u.subject_id || '').toLowerCase();
          return (
            (subCode && uSubCode === subCode.toLowerCase()) ||
            (subId && uSubId === subId.toLowerCase()) ||
            (subCode && u.code && String(u.code).toLowerCase().includes(subCode.toLowerCase()))
          );
        });
      }

      // If DB has custom units for this subject, use them!
      if (fetchedUnits.length > 0) {
        setSubjectUnits(
          fetchedUnits.map((u: any) => ({
            id: String(u.id || u.code),
            code: String(u.code || u.unit_code || u.id),
            name: u.name || u.unit_name || `Unit ${u.code}`,
            description: u.description || '',
          }))
        );
      } else {
        // Dynamically generate syllabus units tailored to this specific subject!
        const dynamicUnits = generateSyllabusUnits(subCode, subName);
        setSubjectUnits(dynamicUnits);
      }
    } catch (err) {
      console.warn('Error loading dynamic units for subject:', err);
    } finally {
      setLoadingUnits(false);
    }
  };

  // 3. On unit select: dynamically fetch & load topics specifically for the selected unit & subject
  const handleUnitChange = async (newUnitCode: string) => {
    setSelectedUnit(newUnitCode);
    setSelectedTopic('');
    setSelectedSubtopic('');
    setUnitTopics([]);
    setTopicSubtopics([]);

    if (!newUnitCode) return;

    try {
      setLoadingTopics(true);
      const tenant = getTenantSlug();
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';
      const headers = { 'Authorization': `Bearer ${token}` };

      // Query topics from backend
      const res = await fetch(
        `${API_BASE}/admin-master/topics?tenant=${tenant}&subjectCode=${encodeURIComponent(selectedSubject)}&unitCode=${encodeURIComponent(newUnitCode)}`,
        { headers }
      ).catch(() => null);

      let fetchedTopics: any[] = [];
      if (res && res.ok) {
        const j = await res.json();
        const list = Array.isArray(j.data) ? j.data : Array.isArray(j) ? j : [];
        fetchedTopics = list.filter((t: any) => {
          const matchSub = !selectedSubject || String(t.subject_code || '').toLowerCase() === selectedSubject.toLowerCase();
          const matchUnit = String(t.unit_code || t.unit_id || '').toLowerCase() === newUnitCode.toLowerCase();
          return matchSub && matchUnit;
        });
      }

      if (fetchedTopics.length > 0) {
        setUnitTopics(
          fetchedTopics.map((t: any) => ({
            id: String(t.id || t.code),
            code: String(t.code || t.topic_code || t.id),
            name: t.name || t.topic_name || `Topic ${t.code}`,
          }))
        );
      } else {
        const selectedUnitObj = subjectUnits.find((u) => u.code === newUnitCode);
        const dynamicTopics = generateSyllabusTopics(newUnitCode, selectedUnitObj?.name || newUnitCode, selectedSubject);
        setUnitTopics(dynamicTopics);
      }
    } catch (err) {
      console.warn('Error loading topics for unit:', err);
    } finally {
      setLoadingTopics(false);
    }
  };

  // 4. On topic select: dynamically load competencies / subtopics
  const handleTopicChange = (newTopicCode: string) => {
    setSelectedTopic(newTopicCode);
    setSelectedSubtopic('');
    setTopicSubtopics([]);

    if (!newTopicCode) return;

    const dynamicSubtopics = generateSyllabusSubtopics(newTopicCode);
    setTopicSubtopics(dynamicSubtopics);
  };

  // Dynamic Lessons Fetching Scoped to Selection
  const fetchLessons = async (
    crs = selectedCourse,
    br = selectedBranch,
    bat = selectedBatch,
    sem = selectedSem,
    sub = selectedSubject,
    sec = selectedSection,
  ) => {
    try {
      setLoading(true);
      const tenant = getTenantSlug();
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';

      const queryParams = new URLSearchParams({ tenant });
      if (crs) queryParams.append('courseCd', crs);
      if (br) queryParams.append('branchCd', br);
      if (bat) queryParams.append('batchCd', bat);
      if (sem) queryParams.append('semCd', sem);
      if (sub) queryParams.append('subjectId', sub);
      if (sec && sec !== 'ALL') queryParams.append('section', sec);

      const res = await fetch(`${API_BASE}/lessons?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        setLessons(json.data || []);
      }
    } catch (err) {
      console.warn('Error loading lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  // Academic cascading change handlers
  const handleCourseChange = async (newCourseCd: string) => {
    setSelectedCourse(newCourseCd);
    setSubjectsLoaded(false);
    setRawSubjects([]);
    setSelectedSubject('');
    setSelectedUnit('');
    setSelectedTopic('');
    setSelectedSubtopic('');
    setSubjectUnits([]);
    setUnitTopics([]);
    setTopicSubtopics([]);

    const cd = getColgCd();
    const slug = getTenantSlug();

    const selectedCourseObj = coursesList.find((c) => String(c.code) === String(newCourseCd));
    const [branches, batches] = await Promise.all([
      fetchBranches(cd, newCourseCd, slug, coursesList),
      fetchBatches(cd, newCourseCd, slug),
    ]);

    setBranchesList(branches);
    setBatchesList(batches);

    const sems = getSemestersForCourse(newCourseCd, selectedCourseObj?.name);
    setSemestersList(sems);

    const defaultBranch = branches[0]?.code || '1';
    const defaultBatch = batches.find((b) => b.name === '2025' || b.name === '2026' || b.year === 2025 || b.year === 2026)?.code || batches[0]?.code || '1';
    const defaultSem = sems.some((s) => s.code === '3') ? '3' : (sems[0]?.code || '1');

    setSelectedBranch(defaultBranch);
    setSelectedBatch(defaultBatch);
    setSelectedSem(defaultSem);

    fetchLessons(newCourseCd, defaultBranch, defaultBatch, defaultSem, '', selectedSection);
  };

  const handleBranchChange = (newBranchCd: string) => {
    setSelectedBranch(newBranchCd);
    setSubjectsLoaded(false);
    setRawSubjects([]);
    setSelectedSubject('');
    setSelectedUnit('');
    setSelectedTopic('');
    setSelectedSubtopic('');
    setSubjectUnits([]);
    setUnitTopics([]);
    setTopicSubtopics([]);
    fetchLessons(selectedCourse, newBranchCd, selectedBatch, selectedSem, '', selectedSection);
  };

  const handleBatchChange = (newBatchCd: string) => {
    setSelectedBatch(newBatchCd);
    setSubjectsLoaded(false);
    setRawSubjects([]);
    setSelectedSubject('');
    setSelectedUnit('');
    setSelectedTopic('');
    setSelectedSubtopic('');
    setSubjectUnits([]);
    setUnitTopics([]);
    setTopicSubtopics([]);
    fetchLessons(selectedCourse, selectedBranch, newBatchCd, selectedSem, '', selectedSection);
  };

  const handleSemChange = (newSemCd: string) => {
    setSelectedSem(newSemCd);
    setSubjectsLoaded(false);
    setRawSubjects([]);
    setSelectedSubject('');
    setSelectedUnit('');
    setSelectedTopic('');
    setSelectedSubtopic('');
    setSubjectUnits([]);
    setUnitTopics([]);
    setTopicSubtopics([]);
    fetchLessons(selectedCourse, selectedBranch, selectedBatch, newSemCd, '', selectedSection);
  };

  const handleSectionChange = (newSecCd: string) => {
    setSelectedSection(newSecCd);
    setSubjectsLoaded(false);
    setRawSubjects([]);
    setSelectedSubject('');
    setSelectedUnit('');
    setSelectedTopic('');
    setSelectedSubtopic('');
    setSubjectUnits([]);
    setUnitTopics([]);
    setTopicSubtopics([]);
    fetchLessons(selectedCourse, selectedBranch, selectedBatch, selectedSem, '', newSecCd);
  };

  // Initial Data Load
  useEffect(() => {
    const cd = getColgCd();
    const name = getColgName();
    const slug = getTenantSlug();

    setColgCd(cd);
    setColgName(name);

    const initAcademicMetadata = async () => {
      try {
        const courses = await fetchCourses(cd, slug);
        setCoursesList(courses);

        const defaultCourse = courses.find((c) => c.code === '13' || c.name.toLowerCase().includes('bca')) || courses[0];
        const initialCourseCd = defaultCourse ? defaultCourse.code : '13';
        setSelectedCourse(initialCourseCd);

        const [branches, batches] = await Promise.all([
          fetchBranches(cd, initialCourseCd, slug, courses),
          fetchBatches(cd, initialCourseCd, slug),
        ]);

        setBranchesList(branches);
        setBatchesList(batches);

        const sems = getSemestersForCourse(initialCourseCd, defaultCourse?.name);
        setSemestersList(sems);

        const defaultBranch = branches[0]?.code || '1';
        const defaultBatch = batches.find((b) => b.name === '2025' || b.name === '2026' || b.year === 2025 || b.year === 2026)?.code || batches[0]?.code || '1';
        const defaultSem = sems.some((s) => s.code === '3') ? '3' : (sems[0]?.code || '1');

        setSelectedBranch(defaultBranch);
        setSelectedBatch(defaultBatch);
        setSelectedSem(defaultSem);

        fetchLessons(initialCourseCd, defaultBranch, defaultBatch, defaultSem, '', '1');
      } catch (err) {
        console.warn('Error loading academic metadata:', err);
      }
    };

    initAcademicMetadata();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const max25MB = 25 * 1024 * 1024;
      if (file.size > max25MB) {
        setAlert({ type: 'error', message: 'Selected file exceeds the 25MB maximum limit. Please choose a smaller file.' });
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setAlert(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setAlert({ type: 'error', message: 'Please enter a lesson title.' });
      return;
    }
    if (!selectedFile) {
      setAlert({ type: 'error', message: 'Please select a document or study material file to upload.' });
      return;
    }

    try {
      setUploading(true);
      setAlert(null);

      const tenant = getTenantSlug();
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';
      const facultyUser = getFacultyUser();

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('colgCd', colgCd);
      formData.append('courseCd', selectedCourse);
      formData.append('branchCd', selectedBranch);
      formData.append('batchCd', selectedBatch);
      formData.append('semCd', selectedSem);
      if (selectedSection && selectedSection !== 'ALL') {
        formData.append('section', selectedSection);
      }
      if (selectedSubject) {
        formData.append('subjectId', selectedSubject);
      }
      formData.append('unitId', selectedUnit);
      formData.append('topicId', selectedTopic);
      formData.append('subtopicId', selectedSubtopic);
      formData.append('facultyName', facultyUser.name);
      formData.append('empid', facultyUser.empid);
      formData.append('file', selectedFile);

      const res = await fetch(`${API_BASE}/lessons?tenant=${tenant}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-name': facultyUser.name,
          'x-user-id': facultyUser.empid,
          'x-user-role': 'FACULTY',
        },
        body: formData,
      });

      if (res.ok) {
        setAlert({ type: 'success', message: 'Lesson study material uploaded successfully!' });
        setTitle('');
        setDescription('');
        setSelectedFile(null);
        fetchLessons(selectedCourse, selectedBranch, selectedBatch, selectedSem, selectedSubject, selectedSection);
      } else {
        const json = await res.json();
        setAlert({ type: 'error', message: json.message || 'Failed to upload lesson material.' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Network error while uploading lesson file.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lesson material?')) return;
    try {
      const tenant = getTenantSlug();
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';

      const res = await fetch(`${API_BASE}/lessons/${id}?tenant=${tenant}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setAlert({ type: 'success', message: 'Lesson deleted successfully.' });
        fetchLessons(selectedCourse, selectedBranch, selectedBatch, selectedSem, selectedSubject, selectedSection);
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to delete lesson.' });
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileMeta = (fileType?: string, fileName?: string) => {
    const typeStr = `${fileType || ''} ${fileName || ''}`.toLowerCase();
    if (typeStr.includes('pdf')) {
      return { icon: '📄', label: 'PDF', bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-500 border border-rose-200 dark:border-rose-800' };
    }
    if (typeStr.includes('doc') || typeStr.includes('word')) {
      return { icon: '📝', label: 'DOC', bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-500 border border-blue-200 dark:border-blue-800' };
    }
    if (typeStr.includes('xls') || typeStr.includes('excel') || typeStr.includes('sheet')) {
      return { icon: '📊', label: 'XLS', bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800' };
    }
    if (typeStr.includes('jpg') || typeStr.includes('jpeg') || typeStr.includes('png') || typeStr.includes('image')) {
      return { icon: '🖼️', label: 'IMG', bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 border border-purple-200 dark:border-purple-800' };
    }
    if (typeStr.includes('txt')) {
      return { icon: '📑', label: 'TXT', bg: 'bg-slate-50 dark:bg-slate-800 text-slate-600 border border-slate-200 dark:border-slate-700' };
    }
    return { icon: '📎', label: (fileType || 'FILE').toUpperCase(), bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-[#5B4BFF] border border-indigo-200 dark:border-indigo-800' };
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-[#0F172A] text-[#1B1E28] dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Faculty Lesson & Study Material Upload" />
        <main className="p-6 space-y-6 flex-1 flex flex-col">

          {alert && (
            <div className={`p-4 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 ${
              alert.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
            }`}>
              <span>{alert.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{alert.message}</span>
            </div>
          )}

          {/* STEP 1: Academic & Semester Scoping with Section Dropdown & Get Subject Button */}
          <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft space-y-5">
            <div className="border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>🎓</span>
                <span>STEP 1: ACADEMIC & SEMESTER SCOPING</span>
              </h3>
              <p className="text-xs text-[#7B8794] mt-0.5 font-medium">
                Select target Academic Hierarchy (College, Course, Branch, Batch, Semester, Section) then click &quot;Get Subject&quot;.
              </p>
            </div>

            {/* Cascading Selectors: College, Course, Branch, Batch, Semester, Section, and Get Subject Button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 text-xs items-end">

              {/* 1. College (Locked to Active Tenant) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">1. College</label>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 rounded border border-emerald-200 dark:border-emerald-800">
                    🔒 Active Tenant
                  </span>
                </div>
                <select
                  value={colgCd}
                  disabled
                  className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold cursor-not-allowed opacity-90 text-slate-800 dark:text-slate-200 shadow-sm"
                >
                  <option value={colgCd}>[{colgCd}] {colgName}</option>
                </select>
              </div>

              {/* 2. Course */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">2. Course *</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  {coursesList.map((crs) => (
                    <option key={crs.code} value={crs.code}>
                      [#{crs.code}] {crs.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Branch */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  3. Branch * <span className="text-[#F36C21]">({branchesList.length})</span>
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  {branchesList.map((br) => (
                    <option key={br.code} value={br.code}>
                      [#{br.code}] {br.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Batch */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">4. Batch *</label>
                <select
                  value={selectedBatch}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  {batchesList.map((bt) => (
                    <option key={bt.code} value={bt.code}>
                      [#{bt.code}] {bt.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Semester */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">5. Semester *</label>
                <select
                  value={selectedSem}
                  onChange={(e) => handleSemChange(e.target.value)}
                  className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-[#F36C21] dark:text-orange-400 focus:outline-none focus:border-[#F36C21]"
                >
                  {semestersList.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Section Dropdown (Right side of Semester) */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">6. Section *</label>
                <select
                  value={selectedSection}
                  onChange={(e) => handleSectionChange(e.target.value)}
                  className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  <option value="1">[#1] Section A</option>
                  <option value="2">[#2] Section B</option>
                  <option value="3">[#3] Section C</option>
                  <option value="4">[#4] Section D</option>
                  <option value="ALL">All Sections</option>
                </select>
              </div>

              {/* 7. Get Subject Button */}
              <div>
                <button
                  type="button"
                  onClick={handleGetSubjects}
                  disabled={loadingSubjects}
                  className="w-full h-[42px] px-3 rounded-xl bg-gradient-to-r from-[#5B4BFF] to-[#7867FF] hover:opacity-90 text-white font-black text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                  title="Click to load subjects for selected course, branch, batch, semester, and section"
                >
                  <span>{loadingSubjects ? '⏳' : '📚'}</span>
                  <span>{loadingSubjects ? 'Loading...' : 'Get Subject'}</span>
                </button>
              </div>

            </div>

            {/* STEP 2: Curriculum Topic Mapping (Subject ➔ Unit ➔ Topic ➔ Sub-Topic) */}
            <div className="border-t border-[#E7EAF3] dark:border-slate-800 pt-4 space-y-3">
              <h4 className="text-xs font-black uppercase text-[#F36C21] tracking-wider flex items-center gap-2">
                <span>📖</span>
                <span>STEP 2: CURRICULUM TOPIC MAPPING</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">

                {/* 1. Subject Dropdown (Loads on Get Subject button press) */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subject * {subjectsLoaded ? (
                      <span className="text-[#5B4BFF]">({rawSubjects.length})</span>
                    ) : (
                      <span className="text-[#F36C21] font-semibold text-[10px]">(Click &quot;Get Subject&quot; Above)</span>
                    )}
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    disabled={!subjectsLoaded || rawSubjects.length === 0}
                    className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {!subjectsLoaded ? (
                      <option value="">-- Click &quot;Get Subject&quot; button above to load --</option>
                    ) : rawSubjects.length === 0 ? (
                      <option value="">-- No subjects found for this selection --</option>
                    ) : (
                      <>
                        <option value="">-- Select Curriculum Subject --</option>
                        {rawSubjects.map((sub) => (
                          <option key={sub.id || sub.code} value={sub.code}>
                            [#{sub.code}] {sub.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                {/* 2. Unit Dropdown (Loads dynamically on Subject selection) */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unit {selectedSubject && (
                      <span className="text-[#5B4BFF]">({subjectUnits.length})</span>
                    )}
                  </label>
                  <select
                    value={selectedUnit}
                    onChange={(e) => handleUnitChange(e.target.value)}
                    disabled={!selectedSubject || loadingUnits}
                    className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold disabled:opacity-50 disabled:cursor-not-allowed text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                  >
                    {loadingUnits ? (
                      <option value="">⏳ Loading units for {selectedSubject}...</option>
                    ) : !selectedSubject ? (
                      <option value="">-- Select Subject First --</option>
                    ) : subjectUnits.length === 0 ? (
                      <option value="">-- No units available --</option>
                    ) : (
                      <>
                        <option value="">-- Select Curriculum Unit / Chapter --</option>
                        {subjectUnits.map((u) => (
                          <option key={u.id || u.code} value={u.code}>
                            [{u.code}] {u.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                {/* 3. Topic Dropdown (Loads dynamically on Unit selection) */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Topic {selectedUnit && (
                      <span className="text-[#5B4BFF]">({unitTopics.length})</span>
                    )}
                  </label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => handleTopicChange(e.target.value)}
                    disabled={!selectedUnit || loadingTopics}
                    className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold disabled:opacity-50 disabled:cursor-not-allowed text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                  >
                    {loadingTopics ? (
                      <option value="">⏳ Loading topics...</option>
                    ) : !selectedUnit ? (
                      <option value="">-- Select Unit First --</option>
                    ) : unitTopics.length === 0 ? (
                      <option value="">-- No topics available --</option>
                    ) : (
                      <>
                        <option value="">-- Select Teaching Topic --</option>
                        {unitTopics.map((t) => (
                          <option key={t.id || t.code} value={t.code}>
                            [{t.code}] {t.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                {/* 4. Sub-Topic / Competency Dropdown (Loads dynamically on Topic selection) */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sub-Topic / Competency {selectedTopic && (
                      <span className="text-[#5B4BFF]">({topicSubtopics.length})</span>
                    )}
                  </label>
                  <select
                    value={selectedSubtopic}
                    onChange={(e) => setSelectedSubtopic(e.target.value)}
                    disabled={!selectedTopic}
                    className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold disabled:opacity-50 disabled:cursor-not-allowed text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                  >
                    {!selectedTopic ? (
                      <option value="">-- Select Topic First --</option>
                    ) : topicSubtopics.length === 0 ? (
                      <option value="">-- No sub-topics available --</option>
                    ) : (
                      <>
                        <option value="">-- Select Sub-Topic / Competency --</option>
                        {topicSubtopics.map((st) => (
                          <option key={st.id || st.code} value={st.code}>
                            [{st.code}] {st.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

              </div>
            </div>
          </div>

          {/* STEP 3: File Upload & Details Form */}
          <form onSubmit={handleUploadSubmit} className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft space-y-4">
            <div className="border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>📥</span>
                <span>STEP 3: UPLOAD LESSON FILE (MAX 25MB)</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Lesson Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unit 3 - BCNF & Relational Algebra Lecture Notes"
                  className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Lesson Material File * (.pdf, .xls, .doc, .txt, .jpg, .png)</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.xls,.xlsx,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 font-bold cursor-pointer"
                  required
                />
                {selectedFile && (
                  <p className="text-[11px] text-[#F36C21] font-semibold mt-1">
                    Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">Description / Instructions</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add additional guidelines, assignment references, or reading instructions for students..."
                rows={3}
                className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-xs"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F36C21] to-[#E05A10] hover:opacity-90 text-white font-black text-xs shadow-lg shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                <span>{uploading ? '⏳ Uploading...' : '🚀 Upload Lesson Material'}</span>
              </button>
            </div>
          </form>

          {/* Lessons List Table (Filtered dynamically by academic scope) */}
          <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>📑</span>
                <span>UPLOADED LESSONS LIBRARY</span>
              </h3>
              <button
                type="button"
                onClick={() => fetchLessons(selectedCourse, selectedBranch, selectedBatch, selectedSem, selectedSubject, selectedSection)}
                className="text-xs font-bold text-[#5B4BFF] hover:text-[#4335e6] dark:text-indigo-400 flex items-center gap-1 transition"
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-[#7B8794] font-medium animate-pulse">
                Fetching uploaded lessons from PostgreSQL...
              </div>
            ) : lessons.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#7B8794] border border-dashed border-[#E7EAF3] dark:border-slate-800 rounded-2xl">
                No lessons uploaded for this selection yet. Use the form above to upload study materials.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F6F8FC] dark:bg-slate-800/80 text-[#7B8794] uppercase tracking-wider border-b border-[#E7EAF3] dark:border-slate-700">
                      <th className="p-3 font-extrabold">LESSON TITLE</th>
                      <th className="p-3 font-extrabold">ACADEMIC SCOPE</th>
                      <th className="p-3 font-extrabold">FILE & SIZE</th>
                      <th className="p-3 font-extrabold">FACULTY / DATE</th>
                      <th className="p-3 font-extrabold text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                    {lessons.map((item) => (
                      <tr key={item.id} className="hover:bg-[#F6F8FC]/50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3">
                          <p className="font-extrabold text-[#1B1E28] dark:text-white text-xs">{item.title}</p>
                          {item.topic_id && (
                            <p className="text-[11px] text-[#F36C21] font-bold flex items-center gap-1 mt-0.5">
                              <span>📖</span>
                              <span>{item.topic_id}</span>
                            </p>
                          )}
                        </td>
                        <td className="p-3">
                          {(() => {
                            const scope = formatAcademicScope(item);
                            return (
                              <div>
                                <p className="font-extrabold text-[#1B1E28] dark:text-slate-100 text-xs">
                                  {scope.primary}
                                </p>
                                <p className="text-[11px] font-bold text-[#F36C21] mt-0.5">
                                  {scope.secondary}
                                </p>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="p-3">
                          {(() => {
                            const meta = getFileMeta(item.file_type, item.file_name);
                            return (
                              <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1.5 shadow-2xs ${meta.bg}`}>
                                <span>{meta.icon}</span>
                                <span>{meta.label}</span>
                                <span className="opacity-80 font-semibold">({formatBytes(item.file_size)})</span>
                              </span>
                            );
                          })()}
                        </td>
                        <td className="p-3 text-[#7B8794]">
                          <p className="font-bold text-[#1B1E28] dark:text-slate-200">
                            {(() => {
                              const fn = item.faculty_name?.trim();
                              if (fn && fn !== 'Faculty Member' && fn !== 'FACULTY' && fn !== 'USER') {
                                return fn;
                              }
                              if (item.empid === '202616658') return 'VINAY KUMAR';
                              if (item.empid === '202616680' || item.empid === 'FAC001' || item.topic_id?.includes('88534')) return 'UPENDRA KUMAR';
                              if (item.empid === '202616665') return 'SUNIL SHARMA';
                              if (item.empid === '201910009') return 'JYOTIRMAY PATEL';
                              return item.faculty_name || item.empid || 'Faculty Member';
                            })()}
                          </p>
                          <p className="text-[10px] font-medium">{new Date(item.created_at || Date.now()).toLocaleDateString()}</p>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => window.open(`${API_BASE}/lessons/${item.id}/download?tenant=${getTenantSlug()}`, '_blank')}
                            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#F36C21] to-[#E05A10] hover:opacity-90 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                          >
                            Download
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-500 border border-rose-200 dark:border-rose-800 font-bold text-xs transition cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
