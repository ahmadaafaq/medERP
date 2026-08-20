'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import { 
  Briefcase, 
  Building2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  FileText, 
  Sparkles, 
  IndianRupee,
  Send
} from 'lucide-react';

interface PlacementDrive {
  drive_id: number;
  company_name: string;
  role: string;
  package_ctc?: string;
  description: string;
  eligibility_course_cd: string;
  eligibility_branch_cd?: string;
  eligibility_batch_cd: string;
  min_score_required?: number;
  drive_date: string;
  deadline_date: string;
  status: string;
  my_application?: {
    status: string;
    applied_at: string;
    selected_company?: string;
    selected_role?: string;
  } | null;
}

export default function StudentPlacementPage() {
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrive, setSelectedDrive] = useState<PlacementDrive | null>(null);
  const [resumeLink, setResumeLink] = useState('');
  const [coverNote, setCoverNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    setLoading(true);
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    try {
      const res = await fetch(`http://localhost:3001/api/v1/placement-drive/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
      });

      if (res.ok) {
        const json = await res.json();
        let drivesList: any[] = [];
        if (Array.isArray(json.data?.data)) {
          drivesList = json.data.data;
        } else if (Array.isArray(json.data)) {
          drivesList = json.data;
        } else if (Array.isArray(json)) {
          drivesList = json;
        }
        setDrives(drivesList);
      }
    } catch (err) {
      console.error('Failed to fetch placement drives:', err);
      setDrives([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedDrive || !resumeLink) {
      setErrorMsg('Please enter a valid resume URL link.');
      return;
    }

    setSubmitting(true);
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    try {
      const res = await fetch(`http://localhost:3001/api/v1/placement-drive/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
        body: JSON.stringify({
          drive_id: selectedDrive.drive_id,
          resume_link: resumeLink,
          cover_note: coverNote,
        }),
      });

      if (res.ok) {
        setSuccessMsg(`Successfully applied for ${selectedDrive.company_name}!`);
        setResumeLink('');
        setCoverNote('');
        setSelectedDrive(null);
        fetchDrives();
      } else {
        const errJson = await res.json();
        setErrorMsg(errJson.message || 'Failed to submit application');
      }
    } catch (err) {
      setErrorMsg('Network error submitting application');
    } finally {
      setSubmitting(false);
    }
  };

  const [filterTab, setFilterTab] = useState<'all' | 'applied'>('all');

  const displayedDrives = filterTab === 'applied'
    ? drives.filter((d) => d.my_application)
    : drives;

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="student" />
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <Header title="Placement Drive Portal — MedERP" />
        <main className="p-6 space-y-6 flex-1 w-full max-w-full">

          {/* Banner */}
          <div className="bg-gradient-to-r from-[#2D2575] via-[#5B4BFF] to-[#7867FF] rounded-[22px] p-6 text-white shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-2xl font-black tracking-tight flex items-center justify-center sm:justify-start gap-2.5">
                <Briefcase className="w-7 h-7 text-[#F36C21]" />
                <span>Campus Placement Drives</span>
              </h2>
              <p className="text-xs text-indigo-100 font-medium max-w-2xl">
                Browse active recruitment drives matching your program &amp; batch, submit your resume, and track your application status in real-time.
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  filterTab === 'all'
                    ? 'bg-[#5B4BFF] text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 text-[#4E5969] dark:text-slate-400 border border-[#E7EAF3] dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                All Campus Drives ({drives.length})
              </button>
              <button
                onClick={() => setFilterTab('applied')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  filterTab === 'applied'
                    ? 'bg-[#5B4BFF] text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 text-[#4E5969] dark:text-slate-400 border border-[#E7EAF3] dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>My Applications ({drives.filter((d) => d.my_application).length})</span>
              </button>
            </div>
          </div>

          {/* Placement Drives List */}
          {loading ? (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-12 text-center text-[#4E5969] dark:text-slate-400 animate-pulse font-bold">
              Loading placement drives...
            </div>
          ) : displayedDrives.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-12 text-center space-y-3 shadow-soft">
              <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="text-base font-bold text-[#1B1E28] dark:text-white">
                {filterTab === 'applied' ? 'No Applications Submitted Yet' : 'No Active Placement Drives'}
              </h3>
              <p className="text-xs text-[#4E5969] dark:text-slate-400">
                {filterTab === 'applied'
                  ? 'You have not submitted an application for any drive yet.'
                  : 'There are currently no open recruitment drives. Check back soon!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
              {displayedDrives.map((drive) => (
                <div
                  key={drive.drive_id}
                  className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-soft flex flex-col justify-between space-y-4 hover:shadow-xl transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-black text-lg text-[#1B1E28] dark:text-white">
                          {drive.company_name}
                        </h3>
                        <p className="text-xs font-bold text-[#5B4BFF]">{drive.role}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-950 text-[#5B4BFF] border border-[#5B4BFF]/30 shrink-0">
                        {drive.package_ctc || 'CTC Disclosed Later'}
                      </span>
                    </div>

                    <p className="text-xs text-[#4E5969] dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {drive.description}
                    </p>

                    <div className="space-y-1.5 text-[11px] text-[#4E5969] dark:text-slate-400 pt-1 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#F36C21]" />
                        <span>Drive Date: <strong>{new Date(drive.drive_date).toLocaleDateString()}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Apply Before: <strong>{new Date(drive.deadline_date).toLocaleDateString()}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Application Status / Action */}
                  <div className="pt-3 border-t border-[#E7EAF3] dark:border-slate-800">
                    {drive.my_application ? (
                      <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60 space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-[#4E5969] dark:text-slate-300">Status:</span>
                          {drive.my_application.status === 'Selected' ? (
                            <span className="px-3 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-700 border border-emerald-300">
                              🎉 SELECTED!
                            </span>
                          ) : drive.my_application.status === 'Shortlisted' ? (
                            <span className="px-3 py-0.5 rounded-full text-[11px] font-black bg-indigo-100 text-indigo-700 border border-indigo-300">
                              ⭐ SHORTLISTED
                            </span>
                          ) : drive.my_application.status === 'Rejected' ? (
                            <span className="px-3 py-0.5 rounded-full text-[11px] font-black bg-red-100 text-red-700 border border-red-300">
                              Not Selected
                            </span>
                          ) : (
                            <span className="px-3 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ Application Received
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          Submitted on {new Date(drive.my_application.applied_at).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedDrive(drive)}
                        className="w-full bg-[#5B4BFF] hover:bg-indigo-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Apply for Drive</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Apply Drive Modal */}
          {selectedDrive && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-black text-[#1B1E28] dark:text-white">
                      Apply for {selectedDrive.company_name}
                    </h3>
                    <p className="text-xs text-[#5B4BFF] font-bold">{selectedDrive.role}</p>
                  </div>
                  <button
                    onClick={() => setSelectedDrive(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                {errorMsg && (
                  <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs p-3 rounded-xl font-bold">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleApply} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1B1E28] dark:text-slate-200 mb-1">
                      Resume Document Link (Google Drive / Cloud URL) *
                    </label>
                    <input
                      type="url"
                      value={resumeLink}
                      onChange={(e) => setResumeLink(e.target.value)}
                      placeholder="https://drive.google.com/file/d/your-resume-link"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-medium text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1B1E28] dark:text-slate-200 mb-1">
                      Optional Cover Note / Key Highlights
                    </label>
                    <textarea
                      rows={3}
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      placeholder="Briefly highlight your core skills, projects, or certifications..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-medium text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDrive(null)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#5B4BFF] hover:bg-indigo-600 text-white shadow-md disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Submit Application'}
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
