'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import { 
  FolderGit2, 
  Plus, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Award, 
  Sparkles, 
  Code2, 
  Globe,
  Edit3,
  Image as ImageIcon,
  Trash2,
  Lock,
  Layers,
  Eye,
  X
} from 'lucide-react';

interface Repository {
  repo_id: number;
  title: string;
  description: string;
  repo_link: string;
  tech_stack: string[];
  screenshots?: string[];
  status: string;
  is_placement_eligible: boolean;
  score?: number;
  grade?: string;
  submitted_at: string;
}

export default function StudentRepositoryPage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [editingRepo, setEditingRepo] = useState<Repository | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [repoLink, setRepoLink] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  
  // Academic Hierarchy States
  const [collegesList, setCollegesList] = useState<any[]>([]);
  const [colgCd, setColgCd] = useState('1');
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [courseCd, setCourseCd] = useState('13');
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [branchCd, setBranchCd] = useState('1');
  const [batchesList, setBatchesList] = useState<any[]>([]);
  const [batchCd, setBatchCd] = useState('2025');
  const [semCd, setSemCd] = useState('3');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Image lightbox preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getTenantSlug = () => {
    if (typeof window === 'undefined') return 'srms-cet-bareilly';
    const slug =
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('selectedTenant') ||
      localStorage.getItem('colg_slug') ||
      'srms-cet-bareilly';
    return (slug || 'srms-cet-bareilly').replace(/^tenant_/, '').replace(/^tenant-/, '');
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

  const fetchBranchesForCourse = async (colgcd: string, coursecd: string, currentCoursesList?: any[]) => {
    const cd = colgcd || '1';
    const crs = coursecd || '13';
    const slug = getTenantSlug();
    try {
      const res = await fetch(`/api/srms/branches?colgcd=${cd}&coursecd=${crs}&tenant=${slug}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const courseListToUse = currentCoursesList || coursesList;
          const courseObj = courseListToUse.find((c) => String(c.code) === String(crs));
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

  const handleCourseChange = async (newCourseCd: string) => {
    setCourseCd(newCourseCd);
    const branches = await fetchBranchesForCourse(colgCd, newCourseCd, coursesList);
    const batches = await fetchBatchesForCourse(colgCd, newCourseCd);
    const defaultBranch = branches[0]?.code || '1';
    const defaultBatch = batches.find((b) => b.name === '2025' || b.year === 2025)?.code || batches[0]?.code || '2025';
    setBranchCd(defaultBranch);
    setBatchCd(defaultBatch);
  };

  const initAcademicHierarchy = async () => {
    const userColg = typeof window !== 'undefined' ? (localStorage.getItem('colg_cd') || localStorage.getItem('colgCd') || '1') : '1';
    const userSlug = getTenantSlug();
    const { studentCourse, studentBranch, studentBatch, studentSem } = getStudentIdentity();

    const allColleges = await fetchColleges();
    const myCol = allColleges.find(
      (c: any) => String(c.colg_cd || c.code) === String(userColg) || String(c.code) === String(userColg) || c.slug === userSlug
    ) || {
      code: userColg,
      name: 'SRMS College of Engineering & Technology, Bareilly',
      slug: userSlug,
    };
    setCollegesList([myCol]);
    setColgCd(myCol.code);

    const courses = await fetchCoursesForCollege(myCol.code);
    const initialCourseCd = (studentCourse && courses.some((c) => String(c.code) === String(studentCourse)))
      ? studentCourse
      : (courses.find((c) => c.code === '13' || c.name === 'BCA')?.code || courses[0]?.code || '13');
    setCourseCd(initialCourseCd);

    const branches = await fetchBranchesForCourse(myCol.code, initialCourseCd, courses);
    const initialBranchCd = (studentBranch && branches.some((b) => String(b.code) === String(studentBranch)))
      ? studentBranch
      : (branches[0]?.code || '1');
    setBranchCd(initialBranchCd);

    const batches = await fetchBatchesForCourse(myCol.code, initialCourseCd);
    const initialBatchCd = (studentBatch && batches.some((b) => String(b.code) === String(studentBatch)))
      ? studentBatch
      : (batches.find((b) => b.name === '2025' || b.year === 2025)?.code || batches[0]?.code || '2025');
    setBatchCd(initialBatchCd);

    if (studentSem) {
      setSemCd(studentSem.replace(/^Sem\s*/i, '').replace(/^Semester\s*/i, ''));
    }
  };

  useEffect(() => {
    fetchRepositories();
    initAcademicHierarchy();
  }, []);

  const getStudentIdentity = () => {
    let regNo = '';
    let name = '';
    let studentCourse = '';
    let studentBranch = '1';
    let studentBatch = '2025';
    let studentSem = '3';

    if (typeof window !== 'undefined') {
      try {
        const cachedUserStr = localStorage.getItem('user');
        if (cachedUserStr) {
          const cached = JSON.parse(cachedUserStr);
          const p = cached?.profile || cached || {};
          regNo =
            p.registration_no ||
            cached?.registrationNo ||
            cached?.registration_no ||
            p.reg_no ||
            p.rollno ||
            cached?.rollno ||
            '';
          name = cached?.name || p.name || cached?.student_name || '';
          studentCourse = String(p.course_cd || cached?.courseCd || cached?.course_cd || '');
          studentBranch = String(p.branch_cd || cached?.branchCd || cached?.branch_cd || '1');
          studentBatch = String(p.batch_cd || cached?.batchCd || cached?.batch_cd || '2025');
          studentSem = String(p.sem_cd || cached?.semCd || cached?.semester || '3');
        }
      } catch {}
    }
    return { regNo, name, studentCourse, studentBranch, studentBatch, studentSem };
  };

  const fetchRepositories = async () => {
    setLoading(true);
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const { regNo, name } = getStudentIdentity();

    if (!regNo) {
      setRepositories([]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/repository/list?student_reg_no=${regNo}&tenant=${slug}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
          'x-user-reg-no': regNo,
          'x-user-id': regNo,
          'x-user-name': name,
          'x-user-role': 'STUDENT',
        },
      });

      if (res.ok) {
        const json = await res.json();
        const rawData = json.data?.data || json.data || json;
        const arr = Array.isArray(rawData) ? rawData : [];
        const unique = Array.from(new Map(arr.map((item: any) => [item.repo_id, item])).values());
        setRepositories(unique);
      }
    } catch (err) {
      console.error('Failed to fetch repositories:', err);
      setRepositories([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingRepo(null);
    setTitle('');
    setDescription('');
    setRepoLink('');
    setTechStackInput('');
    setScreenshots([]);
    setNewImageUrl('');
    setFormError('');
    setFormSuccess('');
    setShowSubmitModal(true);
  };

  const openEditModal = (repo: Repository) => {
    if (repo.status !== 'Pending Review' && repo.status !== 'Pending') {
      alert('This project has already been evaluated and locked. Evaluated projects cannot be edited.');
      return;
    }
    setEditingRepo(repo);
    setTitle(repo.title || '');
    setDescription(repo.description || '');
    setRepoLink(repo.repo_link || '');
    setTechStackInput(Array.isArray(repo.tech_stack) ? repo.tech_stack.join(', ') : '');
    setScreenshots(Array.isArray(repo.screenshots) ? repo.screenshots : []);
    setNewImageUrl('');
    setFormError('');
    setFormSuccess('');
    setShowSubmitModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 5MB limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setScreenshots((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    if (!newImageUrl.startsWith('http://') && !newImageUrl.startsWith('https://')) {
      alert('Image URL must start with http:// or https://');
      return;
    }
    setScreenshots((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  const handleRemoveScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!title || !description || !repoLink) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (!repoLink.startsWith('http://') && !repoLink.startsWith('https://')) {
      setFormError('Repository link must start with http:// or https://');
      return;
    }

    const techStack = techStackInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    setSubmitting(true);
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const { regNo, name } = getStudentIdentity();

    try {
      if (editingRepo) {
        // UPDATE Existing Repository (Only if Pending)
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/repository/${editingRepo.repo_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-tenant-slug': slug,
            'x-user-reg-no': regNo,
            'x-user-id': regNo,
            'x-user-name': name,
            'x-user-role': 'STUDENT',
          },
          body: JSON.stringify({
            title,
            description,
            repo_link: repoLink,
            tech_stack: techStack,
            screenshots,
          }),
        });

        if (res.ok) {
          setFormSuccess('Project repository updated successfully!');
          setShowSubmitModal(false);
          fetchRepositories();
        } else {
          const errJson = await res.json();
          setFormError(errJson.message || 'Failed to update repository');
        }
      } else {
        // CREATE New Repository
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/repository/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-tenant-slug': slug,
            'x-user-reg-no': regNo,
            'x-user-id': regNo,
            'x-user-name': name,
            'x-user-role': 'STUDENT',
          },
          body: JSON.stringify({
            title,
            description,
            repo_link: repoLink,
            tech_stack: techStack,
            screenshots,
            student_reg_no: regNo,
            student_name: name,
            colg_cd: colgCd,
            course_cd: courseCd,
            branch_cd: branchCd,
            batch_cd: batchCd,
            sem_cd: semCd,
          }),
        });

        if (res.ok) {
          setFormSuccess('Project repository submitted successfully!');
          setShowSubmitModal(false);
          fetchRepositories();
        } else {
          const errJson = await res.json();
          setFormError(errJson.message || 'Failed to submit repository');
        }
      }
    } catch (err: any) {
      setFormError('Network error while saving repository');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="student" />
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <Header title="My Project Repository — MedERP" />
        <main className="p-6 space-y-6 flex-1 w-full max-w-full">
          
          {/* Header Banner & Action */}
          <div className="bg-gradient-to-r from-[#2D2575] via-[#5B4BFF] to-[#7867FF] rounded-[22px] p-6 text-white shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-2xl font-black tracking-tight flex items-center justify-center sm:justify-start gap-2.5">
                <FolderGit2 className="w-7 h-7 text-[#F36C21]" />
                <span>My Project Repositories</span>
              </h2>
              <p className="text-xs text-indigo-100 font-medium max-w-2xl">
                Showcase your software engineering work, upload UI screenshots, and submit projects for faculty review. Evaluated projects (&ge; 75%) get nominated for Campus Placement Drives!
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-[#F36C21] hover:bg-orange-600 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-orange-500/30 flex items-center gap-2 transition-all shrink-0 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Submit New Project</span>
            </button>
          </div>

          {/* Repository Cards List */}
          {loading ? (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-12 text-center text-[#4E5969] dark:text-slate-400 animate-pulse font-bold">
              Loading your repositories...
            </div>
          ) : repositories.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-12 text-center space-y-4 shadow-soft">
              <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] flex items-center justify-center mx-auto">
                <FolderGit2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#1B1E28] dark:text-white">No Repositories Submitted Yet</h3>
                <p className="text-xs text-[#4E5969] dark:text-slate-400 max-w-md mx-auto">
                  Click "Submit New Project" to add your GitHub repository, UI screenshots, and architecture description for faculty evaluation.
                </p>
              </div>
              <button
                onClick={openCreateModal}
                className="bg-[#5B4BFF] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md cursor-pointer"
              >
                Submit First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
              {repositories.map((repo) => {
                const isPending = repo.status === 'Pending Review' || repo.status === 'Pending';
                const hasScreenshots = Array.isArray(repo.screenshots) && repo.screenshots.length > 0;

                return (
                  <div
                    key={repo.repo_id}
                    className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] overflow-hidden shadow-soft flex flex-col justify-between hover:shadow-xl transition-all group"
                  >
                    {/* Project Hero / Screenshot Carousel Card Top */}
                    <div className="relative h-44 bg-gradient-to-br from-[#2D2575]/90 via-[#5B4BFF]/80 to-indigo-950 flex items-center justify-center overflow-hidden">
                      {hasScreenshots ? (
                        <div className="w-full h-full relative group/img cursor-pointer" onClick={() => setPreviewImage(repo.screenshots![0])}>
                          <img
                            src={repo.screenshots![0]}
                            alt={repo.title}
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3.5">
                            <span className="text-[10px] font-bold text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-white/20">
                              <ImageIcon className="w-3 h-3 text-[#F36C21]" />
                              <span>{repo.screenshots!.length} Screenshot{repo.screenshots!.length > 1 ? 's' : ''}</span>
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-white/70 space-y-2 p-4 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
                            <Code2 className="w-6 h-6 text-[#F36C21]" />
                          </div>
                          <span className="text-xs font-mono font-bold tracking-wider uppercase text-indigo-100">
                            {repo.title}
                          </span>
                        </div>
                      )}

                      {/* Status Tag Overlay */}
                      <div className="absolute top-3 right-3 z-10">
                        {repo.status === 'Reviewed' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/90 backdrop-blur-md text-white border border-emerald-400/30 shrink-0 flex items-center gap-1 shadow-sm">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Reviewed</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/90 backdrop-blur-md text-white border border-amber-400/30 shrink-0 flex items-center gap-1 shadow-sm">
                            <Clock className="w-3 h-3 animate-spin" />
                            <span>Pending Review</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Screenshot Thumbnails Row (if multiple) */}
                    {hasScreenshots && repo.screenshots!.length > 1 && (
                      <div className="flex gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-850/60 border-b border-[#E7EAF3] dark:border-slate-800 overflow-x-auto">
                        {repo.screenshots!.map((shot, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => setPreviewImage(shot)}
                            className="w-10 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 hover:border-[#5B4BFF] transition-all cursor-pointer"
                          >
                            <img src={shot} alt="thumbnail" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Card Body */}
                    <div className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                      <div className="space-y-2.5">
                        <h3 className="font-black text-base text-[#1B1E28] dark:text-white line-clamp-1 group-hover:text-[#5B4BFF] transition-colors">
                          {repo.title}
                        </h3>

                        <p className="text-xs text-[#4E5969] dark:text-slate-400 line-clamp-3 leading-relaxed">
                          {repo.description}
                        </p>

                        {/* Tech Stack Tags */}
                        {repo.tech_stack && repo.tech_stack.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {repo.tech_stack.map((tech, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#F6F8FC] dark:bg-slate-800 text-[#5B4BFF] dark:text-indigo-300 border border-[#E7EAF3] dark:border-slate-700"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer Actions & Placement Banner */}
                      <div className="pt-3 border-t border-[#E7EAF3] dark:border-slate-800 space-y-2.5">
                        {repo.is_placement_eligible && (
                          <div className="bg-[#FFF4EC] dark:bg-orange-950/40 border border-[#F36C21]/30 text-[#F36C21] p-2 rounded-xl text-[11px] font-bold flex items-center gap-2">
                            <Sparkles className="w-4 h-4 shrink-0" />
                            <span>Nominated for Campus Placement Drives</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          {repo.score !== undefined && repo.score !== null ? (
                            <div className="flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-[#5B4BFF]" />
                              <span className="text-xs font-black text-[#1B1E28] dark:text-white">
                                Score: {repo.score}% ({repo.grade || 'A'})
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] font-bold text-slate-400">Awaiting Evaluation</span>
                          )}

                          <div className="flex items-center gap-2">
                            {/* Edit Button (Only active when Pending) */}
                            {isPending ? (
                              <button
                                type="button"
                                onClick={() => openEditModal(repo)}
                                className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] hover:bg-[#5B4BFF] hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                                title="Edit Project Details"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                            ) : (
                              <span
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center gap-1 cursor-not-allowed"
                                title="Evaluated projects are locked from editing"
                              >
                                <Lock className="w-3 h-3" />
                                <span>Locked</span>
                              </span>
                            )}

                            {/* GitHub Repo External Link */}
                            <a
                              href={repo.repo_link}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-[#2D2575] hover:text-white transition-all flex items-center gap-1"
                            >
                              <span>Code</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </main>
      </div>

      {/* Submit / Edit Repository Modal — Spacious & Premium */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[28px] max-w-2xl sm:max-w-3xl w-full p-6 sm:p-7 shadow-2xl space-y-4.5 relative max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2D2575] to-[#5B4BFF] text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                  <FolderGit2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {editingRepo ? 'Edit Repository (Pending Review)' : 'Submit New Project Repository'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Provide project details, GitHub codebase repository link, and UI screenshots for faculty review.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Academic Scope & Program Context */}
              {!editingRepo && (
                <div className="bg-[#F6F8FC] dark:bg-slate-800/70 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider flex items-center gap-1.5">
                      <span>🎯</span> Academic Scope &amp; Program Context
                    </h4>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#5B4BFF]/10 text-[#5B4BFF] border border-[#5B4BFF]/20">
                      Tenant Scoped
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        🏛️ College Campus *
                      </label>
                      <div className="relative">
                        <select
                          value={colgCd}
                          disabled
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/90 text-xs font-bold text-slate-900 dark:text-white cursor-not-allowed appearance-none"
                        >
                          {collegesList.map((colg, idx) => (
                            <option key={colg.code || idx} value={colg.code}>
                              {colg.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
                          <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-black px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                            🔒 Locked
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        🎓 Course Program * <span className="text-[#5B4BFF]">({coursesList.length})</span>
                      </label>
                      <select
                        value={courseCd}
                        onChange={(e) => handleCourseChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                      >
                        {coursesList.map((crs, idx) => (
                          <option key={crs.code || idx} value={crs.code}>
                            [#{crs.code}] {crs.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        🏢 Branch / Dept * <span className="text-[#5B4BFF]">({branchesList.length})</span>
                      </label>
                      <select
                        value={branchCd}
                        onChange={(e) => setBranchCd(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                      >
                        {branchesList.map((br: any, idx: number) => (
                          <option key={br.code || idx} value={br.code}>
                            [#{br.code}] {br.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        👥 Batch * <span className="text-[#5B4BFF]">({batchesList.length})</span>
                      </label>
                      <select
                        value={batchCd}
                        onChange={(e) => setBatchCd(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                      >
                        {batchesList.map((batch: any, idx: number) => (
                          <option key={batch.code || idx} value={batch.code}>
                            [#{batch.code}] Batch {batch.name || batch.year} {batch.year && batch.name !== String(batch.year) ? `(${batch.year})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        📖 Semester *
                      </label>
                      <select
                        value={semCd}
                        onChange={(e) => setSemCd(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                          <option key={sem} value={String(sem)}>
                            [#{sem}] Semester {sem}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Project Title & Repository Link Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. E-Commerce Multi-Vendor Microservices Architecture"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Repository URL (GitHub / GitLab / Live Deployment) *
                  </label>
                  <input
                    type="url"
                    value={repoLink}
                    onChange={(e) => setRepoLink(e.target.value)}
                    placeholder="https://github.com/username/project-name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                    required
                  />
                </div>
              </div>

              {/* Tech Stack Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tech Stack Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={techStackInput}
                  onChange={(e) => setTechStackInput(e.target.value)}
                  placeholder="e.g. Next.js, TypeScript, PostgreSQL, NestJS, TailwindCSS, Docker"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                />
              </div>

              {/* Project Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Project Description *
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what this software accomplishes, its modules, database schema, and technical highlights..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  required
                />
              </div>

              {/* Project Screenshots & Media Upload Section */}
              <div className="bg-[#F6F8FC] dark:bg-slate-800/70 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-[#5B4BFF] uppercase tracking-wider">
                    📸 Project UI Screenshots &amp; Diagrams (Optional)
                  </label>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {screenshots.length} uploaded
                  </span>
                </div>

                {/* Screenshot Preview Grid */}
                {screenshots.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
                    {screenshots.map((shot, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-black/40">
                        <img src={shot} alt="preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveScreenshot(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer"
                          title="Remove image"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#5B4BFF] hover:bg-[#5B4BFF]/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Upload Images from Device</span>
                  </button>

                  <div className="flex-1 flex gap-1.5">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Or paste screenshot image URL..."
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#5B4BFF] text-white hover:bg-indigo-600 cursor-pointer shadow-xs shrink-0"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#F36C21] hover:bg-orange-600 text-white shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer transition-all"
                >
                  {submitting ? 'Saving Project...' : editingRepo ? 'Update Repository' : 'Submit Repository'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Image Preview Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-orange-400 font-black text-xl bg-black/40 p-2 rounded-full cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImage}
              alt="Project Screenshot Full Preview"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}
    </div>
  );
}
