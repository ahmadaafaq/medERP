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
  const [colgCd, setColgCd] = useState('1');
  const [courseCd, setCourseCd] = useState('13');
  const [branchCd, setBranchCd] = useState('1301');
  const [batchCd, setBatchCd] = useState('2025');
  const [semCd, setSemCd] = useState('3');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Image lightbox preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchRepositories();
  }, []);

  const getStudentIdentity = () => {
    let regNo = '2025107990';
    let name = 'AAFREEN KHAN';
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
            regNo;
          name = cached?.name || p.name || cached?.student_name || name;
        }
      } catch {}
    }
    return { regNo, name };
  };

  const fetchRepositories = async () => {
    setLoading(true);
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const { regNo, name } = getStudentIdentity();

    try {
      const res = await fetch(`http://localhost:3001/api/v1/repository/list?student_reg_no=${regNo}&tenant=${slug}`, {
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
        setRepositories(Array.isArray(rawData) ? rawData : []);
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
        const res = await fetch(`http://localhost:3001/api/v1/repository/${editingRepo.repo_id}`, {
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
        const res = await fetch(`http://localhost:3001/api/v1/repository/submit`, {
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

          {/* Submit / Edit Repository Modal */}
          {showSubmitModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] max-w-xl w-full p-6 shadow-2xl space-y-5 relative my-8">
                <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                  <h3 className="text-lg font-black text-[#1B1E28] dark:text-white flex items-center gap-2">
                    <FolderGit2 className="w-5 h-5 text-[#5B4BFF]" />
                    <span>{editingRepo ? 'Edit Repository (Pending Review)' : 'Submit New Repository'}</span>
                  </h3>
                  <button
                    onClick={() => setShowSubmitModal(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {formError && (
                  <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs p-3 rounded-xl font-bold">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Academic & Program Context */}
                  {!editingRepo && (
                    <div className="bg-[#F6F8FC] dark:bg-slate-800/70 p-3.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 space-y-3">
                      <h4 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider">
                        Academic Scope &amp; Program Context
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            College Campus *
                          </label>
                          <select
                            value={colgCd}
                            onChange={(e) => setColgCd(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-[#1B1E28] dark:text-white"
                          >
                            <option value="1">SRMS CET, Bareilly</option>
                            <option value="2">SRMS CETR, Bareilly</option>
                            <option value="3">SRMS IMS, Bareilly</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Course Program *
                          </label>
                          <select
                            value={courseCd}
                            onChange={(e) => setCourseCd(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-[#1B1E28] dark:text-white"
                          >
                            <option value="13">BCA</option>
                            <option value="1">B.Tech</option>
                            <option value="2">MCA</option>
                            <option value="3">M.Tech</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Branch / Dept *
                          </label>
                          <select
                            value={branchCd}
                            onChange={(e) => setBranchCd(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-[#1B1E28] dark:text-white"
                          >
                            <option value="1301">BCA General</option>
                            <option value="101">CSE</option>
                            <option value="102">IT</option>
                            <option value="103">ECE</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Batch *
                          </label>
                          <select
                            value={batchCd}
                            onChange={(e) => setBatchCd(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-[#1B1E28] dark:text-white"
                          >
                            <option value="2025">Batch 2025</option>
                            <option value="2024">Batch 2024</option>
                            <option value="2023">Batch 2023</option>
                            <option value="2022">Batch 2022</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Semester *
                          </label>
                          <select
                            value={semCd}
                            onChange={(e) => setSemCd(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-[#1B1E28] dark:text-white"
                          >
                            <option value="1">Sem 1</option>
                            <option value="2">Sem 2</option>
                            <option value="3">Sem 3</option>
                            <option value="4">Sem 4</option>
                            <option value="5">Sem 5</option>
                            <option value="6">Sem 6</option>
                            <option value="7">Sem 7</option>
                            <option value="8">Sem 8</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#1B1E28] dark:text-slate-200 mb-1">
                      Project Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. E-Commerce Multi-Vendor Microservices Architecture"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-medium text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1B1E28] dark:text-slate-200 mb-1">
                      Repository URL (GitHub / GitLab / Live Deployment) *
                    </label>
                    <input
                      type="url"
                      value={repoLink}
                      onChange={(e) => setRepoLink(e.target.value)}
                      placeholder="https://github.com/username/project-name"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-medium text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1B1E28] dark:text-slate-200 mb-1">
                      Tech Stack Tags (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={techStackInput}
                      onChange={(e) => setTechStackInput(e.target.value)}
                      placeholder="e.g. Next.js, TypeScript, PostgreSQL, NestJS, TailwindCSS, Docker"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-medium text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1B1E28] dark:text-slate-200 mb-1">
                      Project Description *
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Briefly describe what this software accomplishes, its modules, database schema, and technical highlights..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-medium text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                      required
                    />
                  </div>

                  {/* Project Screenshots & Media Upload Section */}
                  <div className="bg-[#F6F8FC] dark:bg-slate-800/70 p-4 rounded-xl border border-[#E7EAF3] dark:border-slate-700 space-y-3">
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
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#5B4BFF] hover:bg-[#5B4BFF]/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
                          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-[#1B1E28] dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={handleAddImageUrl}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#5B4BFF] text-white hover:bg-indigo-600 cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#5B4BFF] hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
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
              className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
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

        </main>
      </div>
    </div>
  );
}
