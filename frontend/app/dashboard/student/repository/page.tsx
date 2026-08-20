'use client';

import { useState, useEffect } from 'react';
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
  Globe 
} from 'lucide-react';

interface Repository {
  repo_id: number;
  title: string;
  description: string;
  repo_link: string;
  tech_stack: string[];
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

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [repoLink, setRepoLink] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [colgCd, setColgCd] = useState('1');
  const [courseCd, setCourseCd] = useState('13');
  const [branchCd, setBranchCd] = useState('1301');
  const [batchCd, setBatchCd] = useState('2025');
  const [semCd, setSemCd] = useState('1');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    setLoading(true);
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    try {
      const res = await fetch(`http://localhost:3001/api/v1/repository/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
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

    try {
      const res = await fetch(`http://localhost:3001/api/v1/repository/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
        body: JSON.stringify({
          title,
          description,
          repo_link: repoLink,
          tech_stack: techStack,
          colg_cd: colgCd,
          course_cd: courseCd,
          branch_cd: branchCd,
          batch_cd: batchCd,
          sem_cd: semCd,
        }),
      });

      if (res.ok) {
        setFormSuccess('Project repository submitted successfully!');
        setTitle('');
        setDescription('');
        setRepoLink('');
        setTechStackInput('');
        setShowSubmitModal(false);
        fetchRepositories();
      } else {
        const errJson = await res.json();
        setFormError(errJson.message || 'Failed to submit repository');
      }
    } catch (err: any) {
      setFormError('Network error while submitting repository');
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
                Submit your software engineering & academic projects. Faculty-evaluated projects with score &ge; 75% become nominated for exclusive Campus Placement Drives!
              </p>
            </div>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="bg-[#F36C21] hover:bg-orange-600 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-orange-500/30 flex items-center gap-2 transition-all shrink-0 hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Submit New Repository</span>
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
                  Click "Submit New Repository" to add your GitHub or GitLab project repository for faculty evaluation & placement nomination.
                </p>
              </div>
              <button
                onClick={() => setShowSubmitModal(true)}
                className="bg-[#5B4BFF] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md"
              >
                Submit First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
              {repositories.map((repo) => (
                <div
                  key={repo.repo_id}
                  className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-soft flex flex-col justify-between space-y-4 hover:shadow-xl transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-black text-base text-[#1B1E28] dark:text-white line-clamp-1">
                        {repo.title}
                      </h3>
                      {repo.status === 'Reviewed' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/80 text-[#00C48C] border border-[#00C48C]/30 shrink-0 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Reviewed</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 dark:bg-amber-950/80 text-[#FFB020] border border-[#FFB020]/30 shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3 animate-spin" />
                          <span>Pending Review</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#4E5969] dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {repo.description}
                    </p>

                    {/* Tech Stack Tags */}
                    {repo.tech_stack && repo.tech_stack.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {repo.tech_stack.map((tech, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer & Placement Nomination Indicator */}
                  <div className="pt-3 border-t border-[#E7EAF3] dark:border-slate-800 space-y-2">
                    {repo.is_placement_eligible && (
                      <div className="bg-[#FFF4EC] dark:bg-orange-950/40 border border-[#F36C21]/30 text-[#F36C21] p-2 rounded-xl text-[11px] font-bold flex items-center gap-2">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span>Nominated for Placement Drives</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      {repo.score !== undefined && repo.score !== null ? (
                        <div className="flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-[#5B4BFF]" />
                          <span className="text-xs font-black text-[#1B1E28] dark:text-white">
                            Score: {repo.score}% ({repo.grade || 'N/A'})
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400">Awaiting Evaluation</span>
                      )}

                      <a
                        href={repo.repo_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-[#5B4BFF] hover:underline flex items-center gap-1"
                      >
                        <span>View Link</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Submit Repository Modal */}
          {showSubmitModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
                <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                  <h3 className="text-lg font-black text-[#1B1E28] dark:text-white flex items-center gap-2">
                    <FolderGit2 className="w-5 h-5 text-[#5B4BFF]" />
                    <span>Submit New Repository</span>
                  </h3>
                  <button
                    onClick={() => setShowSubmitModal(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm font-bold"
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
                  {/* Academic & College Program Scoping */}
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

                  <div>
                    <label className="block text-xs font-bold text-[#1B1E28] dark:text-slate-200 mb-1">
                      Project Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. MedERP Multi-Tenant Health Portal"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-medium text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1B1E28] dark:text-slate-200 mb-1">
                      Repository URL (GitHub / GitLab / Hosted URL) *
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
                      placeholder="e.g. Next.js, NestJS, TypeScript, PostgreSQL, TailwindCSS"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-medium text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1B1E28] dark:text-slate-200 mb-1">
                      Project Description *
                    </label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Briefly describe the key features, architecture, and problem solved by this project..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-medium text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#5B4BFF] hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/20 disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Submit Repository'}
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
