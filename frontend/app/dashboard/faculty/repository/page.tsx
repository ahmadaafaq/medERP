'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import { 
  FolderGit2, 
  Search, 
  Filter, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Award, 
  Sparkles, 
  MessageSquare, 
  Star,
  User
} from 'lucide-react';

interface Repository {
  repo_id: number;
  title: string;
  description: string;
  repo_link: string;
  tech_stack: string[];
  student_reg_no: string;
  student_name: string;
  course_cd: string;
  branch_cd: string;
  batch_cd: string;
  sem_cd: string;
  status: string;
  is_placement_eligible: boolean;
  score?: number;
  grade?: string;
  submitted_at: string;
}

export default function FacultyRepositoryPage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Selected Repository for Review
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [score, setScore] = useState<number>(85);
  const [remarks, setRemarks] = useState('');
  const [isPlacementEligible, setIsPlacementEligible] = useState<boolean>(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  useEffect(() => {
    fetchRepositories();
  }, [statusFilter]);

  const fetchRepositories = async () => {
    setLoading(true);
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    try {
      const queryParams = new URLSearchParams();
      if (statusFilter) queryParams.append('status', statusFilter);
      if (search) queryParams.append('search', search);

      const res = await fetch(`http://localhost:3001/api/v1/repository/list?${queryParams.toString()}`, {
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

  const handleOpenReview = (repo: Repository) => {
    setSelectedRepo(repo);
    setScore(repo.score || 85);
    setRemarks('');
    setIsPlacementEligible(repo.is_placement_eligible || (repo.score ? repo.score >= 75 : true));
    setReviewMsg('');
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepo) return;

    if (!remarks.trim()) {
      setReviewMsg('Please enter faculty remarks for the project.');
      return;
    }

    setSubmittingReview(true);
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    try {
      const res = await fetch(`http://localhost:3001/api/v1/repository/${selectedRepo.repo_id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
        body: JSON.stringify({
          score: Number(score),
          remarks,
          is_placement_eligible: isPlacementEligible,
        }),
      });

      if (res.ok) {
        setSelectedRepo(null);
        fetchRepositories();
      } else {
        const errJson = await res.json();
        setReviewMsg(errJson.message || 'Failed to save review');
      }
    } catch (err) {
      setReviewMsg('Network error saving review');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <Header title="Repository Evaluation & Nomination — MedERP" />
        <main className="p-6 space-y-6 flex-1 w-full max-w-full">

          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#2D2575] via-[#5B4BFF] to-[#7867FF] rounded-[22px] p-6 text-white shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-2xl font-black tracking-tight flex items-center justify-center sm:justify-start gap-2.5">
                <FolderGit2 className="w-7 h-7 text-[#F36C21]" />
                <span>Student Project Evaluation</span>
              </h2>
              <p className="text-xs text-indigo-100 font-medium max-w-2xl">
                Evaluate student repository submissions, assign scores and remarks, and nominate high-quality projects to appear in Placement Drives!
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-4 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchRepositories()}
                  placeholder="Search project title or student..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                />
              </div>
              <button
                onClick={fetchRepositories}
                className="bg-[#5B4BFF] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shrink-0"
              >
                Search
              </button>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <span className="text-xs font-bold text-[#4E5969] dark:text-slate-400 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" /> Filter Status:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-bold text-[#1B1E28] dark:text-white"
              >
                <option value="">All Statuses</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Reviewed">Reviewed</option>
              </select>
            </div>
          </div>

          {/* Repositories Table */}
          {loading ? (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-12 text-center text-[#4E5969] dark:text-slate-400 animate-pulse font-bold">
              Loading student repositories...
            </div>
          ) : repositories.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-12 text-center space-y-2 shadow-soft">
              <FolderGit2 className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-[#1B1E28] dark:text-white">No Repositories Found</h3>
              <p className="text-xs text-[#4E5969] dark:text-slate-400">No project submissions match your search criteria.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F6F8FC] dark:bg-slate-800/80 border-b border-[#E7EAF3] dark:border-slate-800 text-[#4E5969] dark:text-slate-400 font-extrabold uppercase tracking-wider">
                      <th className="py-3.5 px-4">Project Title</th>
                      <th className="py-3.5 px-4">Student Info</th>
                      <th className="py-3.5 px-4">Tech Stack</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Score & Nomination</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 font-medium">
                    {repositories.map((repo) => (
                      <tr key={repo.repo_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#1B1E28] dark:text-white max-w-xs truncate">
                          <div>{repo.title}</div>
                          <a
                            href={repo.repo_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-normal text-[#5B4BFF] hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <span>Repository Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#1B1E28] dark:text-slate-200">{repo.student_name}</div>
                          <div className="text-[10px] font-mono text-slate-400">REG: {repo.student_reg_no}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {repo.tech_stack?.slice(0, 3).map((t, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800">
                                {t}
                              </span>
                            ))}
                            {repo.tech_stack?.length > 3 && (
                              <span className="text-[10px] text-slate-400">+{repo.tech_stack.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {repo.status === 'Reviewed' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950 text-[#00C48C] border border-[#00C48C]/30 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" /> Reviewed
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 dark:bg-amber-950 text-[#FFB020] border border-[#FFB020]/30 flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3 animate-spin" /> Pending Review
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {repo.score !== undefined && repo.score !== null ? (
                            <div className="space-y-1">
                              <div className="font-black text-[#5B4BFF]">{repo.score}% ({repo.grade || 'A'})</div>
                              {repo.is_placement_eligible && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#FFF4EC] text-[#F36C21] border border-[#F36C21]/30 block w-fit">
                                  Placement Eligible
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Not evaluated</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenReview(repo)}
                            className="bg-[#5B4BFF] hover:bg-indigo-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm transition-all"
                          >
                            {repo.status === 'Reviewed' ? 'Edit Review' : 'Evaluate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Review Panel Modal */}
          {selectedRepo && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] max-w-lg w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-black text-[#1B1E28] dark:text-white">
                      Evaluate: {selectedRepo.title}
                    </h3>
                    <p className="text-xs text-[#5B4BFF] font-bold">
                      Student: {selectedRepo.student_name} ({selectedRepo.student_reg_no})
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedRepo(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                {reviewMsg && (
                  <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs p-3 rounded-xl font-bold">
                    {reviewMsg}
                  </div>
                )}

                <form onSubmit={handleSaveReview} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1B1E28] dark:text-slate-200 mb-1">
                      Project Score (0 – 100%) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={score}
                      onChange={(e) => setScore(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1B1E28] dark:text-slate-200 mb-1">
                      Faculty Remarks & Evaluation Notes *
                    </label>
                    <textarea
                      rows={4}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Add detailed feedback on code quality, architecture, design, and suitability for placement..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-medium text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                      required
                    />
                  </div>

                  {/* Toggle: Eligible for Placement Drive */}
                  <div className="bg-[#FFF4EC] dark:bg-orange-950/40 border border-[#F36C21]/30 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#F36C21]" />
                      <div>
                        <div className="text-xs font-black text-[#F36C21]">Eligible for Placement Drive</div>
                        <div className="text-[10px] text-slate-500">Nominate this project to show in company placement drive modals.</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isPlacementEligible}
                      onChange={(e) => setIsPlacementEligible(e.target.checked)}
                      className="w-5 h-5 accent-[#F36C21] rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRepo(null)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#5B4BFF] hover:bg-indigo-600 text-white shadow-md disabled:opacity-50"
                    >
                      {submittingReview ? 'Saving Evaluation...' : 'Save Evaluation'}
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
