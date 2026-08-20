'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import { 
  Briefcase, 
  Plus, 
  Building2, 
  Users, 
  FolderGit2, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Award, 
  Filter, 
  FileSpreadsheet, 
  Sparkles,
  UserCheck
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
  total_applicants?: number;
  total_selected?: number;
}

interface Applicant {
  application_id: number;
  drive_id: number;
  student_reg_no: string;
  student_name: string;
  resume_link: string;
  cover_note?: string;
  status: string;
  applied_at: string;
}

interface NominatedProject {
  repo_id: number;
  title: string;
  student_name: string;
  student_reg_no: string;
  repo_link: string;
  tech_stack: string[];
  score: number;
  grade?: string;
}

interface StudentReport {
  registration_no: string;
  student_name: string;
  course_cd: string;
  batch_cd: string;
  total_drives_applied?: number;
  total_placements: number;
  companies_placed?: string;
  placement_status?: string;
}

export default function AdminPlacementPage() {
  const [activeTab, setActiveTab] = useState<'drives' | 'reports'>('drives');
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [loading, setLoading] = useState(true);

  // Drive Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [packageCtc, setPackageCtc] = useState('');
  const [description, setDescription] = useState('');
  const [courseCd, setCourseCd] = useState('13'); // BCA
  const [batchCd, setBatchCd] = useState('2025');
  const [minScore, setMinScore] = useState<number>(75);
  const [driveDate, setDriveDate] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [createMsg, setCreateMsg] = useState('');
  const [creating, setCreating] = useState(false);

  // Nominated Projects Popup Modal State
  const [showNominatedModal, setShowNominatedModal] = useState(false);
  const [nominatedDrive, setNominatedDrive] = useState<PlacementDrive | null>(null);
  const [nominatedProjects, setNominatedProjects] = useState<NominatedProject[]>([]);
  const [loadingNominated, setLoadingNominated] = useState(false);

  // Shortlisting Applicants Drawer State
  const [selectedDriveForApplicants, setSelectedDriveForApplicants] = useState<PlacementDrive | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');

  // Placement Reports State
  const [reportFilter, setReportFilter] = useState<'all' | 'zero' | 'multiple'>('all');
  const [studentReports, setStudentReports] = useState<StudentReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    fetchDrives();
  }, []);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    }
  }, [activeTab, reportFilter]);

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
      console.error('Failed to fetch drives:', err);
      setDrives([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoadingReports(true);
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    try {
      const res = await fetch(`http://localhost:3001/api/v1/placement-drive/reports/student-placement-status?filter_type=${reportFilter}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
      });

      if (res.ok) {
        const json = await res.json();
        const rawData = json.data || json;
        setStudentReports(rawData.studentReports || json.studentReports || []);
      }
    } catch (err) {
      console.error('Failed to fetch placement reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateMsg('');

    if (!companyName || !role || !description || !driveDate || !deadlineDate) {
      setCreateMsg('Please fill in all required fields.');
      return;
    }

    setCreating(true);
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    try {
      const res = await fetch(`http://localhost:3001/api/v1/placement-drive/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
        body: JSON.stringify({
          company_name: companyName,
          role,
          package_ctc: packageCtc,
          description,
          eligibility_course_cd: courseCd,
          eligibility_batch_cd: batchCd,
          min_score_required: Number(minScore),
          drive_date: driveDate,
          deadline_date: deadlineDate,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setCompanyName('');
        setRole('');
        setPackageCtc('');
        setDescription('');
        fetchDrives();
      } else {
        const errJson = await res.json();
        setCreateMsg(errJson.message || 'Failed to create drive');
      }
    } catch (err) {
      setCreateMsg('Network error creating placement drive');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenNominatedProjects = async (drive: PlacementDrive) => {
    setNominatedDrive(drive);
    setShowNominatedModal(true);
    setLoadingNominated(true);

    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    try {
      const res = await fetch(`http://localhost:3001/api/v1/placement-drive/${drive.drive_id}/nominated-projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
      });

      if (res.ok) {
        const json = await res.json();
        const rawData = json.data || json;
        setNominatedProjects(rawData.nominatedProjects || json.nominatedProjects || []);
      }
    } catch (err) {
      console.error('Failed to fetch nominated projects:', err);
    } finally {
      setLoadingNominated(false);
    }
  };

  const handleOpenApplicants = async (drive: PlacementDrive) => {
    setSelectedDriveForApplicants(drive);
    setLoadingApplicants(true);
    setNotificationMsg('');

    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    try {
      const res = await fetch(`http://localhost:3001/api/v1/placement-drive/${drive.drive_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
      });

      if (res.ok) {
        const json = await res.json();
        const rawData = json.data || json;
        setApplicants(rawData.applicants || json.applicants || []);
      }
    } catch (err) {
      console.error('Failed to fetch applicants:', err);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleUpdateStatus = async (appId: number, status: string, studentName?: string) => {
    setNotificationMsg('');
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    try {
      const res = await fetch(`http://localhost:3001/api/v1/placement-drive/shortlist`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
        body: JSON.stringify({
          application_id: appId,
          status,
        }),
      });

      if (res.ok) {
        setNotificationMsg(`Notification sent to ${studentName || 'student'}: Status updated to "${status}".`);
        if (selectedDriveForApplicants) {
          handleOpenApplicants(selectedDriveForApplicants);
          fetchDrives();
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <Header title="Placement Drive Management — MedERP" />
        <main className="p-6 space-y-6 flex-1 w-full max-w-full">

          {/* Top Header Banner & Tabs */}
          <div className="bg-gradient-to-r from-[#2D2575] via-[#5B4BFF] to-[#7867FF] rounded-[22px] p-6 text-white shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-2xl font-black tracking-tight flex items-center justify-center sm:justify-start gap-2.5">
                <Briefcase className="w-7 h-7 text-[#F36C21]" />
                <span>Placement Drive Administration</span>
              </h2>
              <p className="text-xs text-indigo-100 font-medium max-w-2xl">
                Create new recruitment drives, view nominated student repository projects, shortlist applicants, and generate zero &amp; multi-placement reports.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md p-1 rounded-xl flex items-center gap-1 border border-white/20">
                <button
                  onClick={() => setActiveTab('drives')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'drives' ? 'bg-[#F36C21] text-white shadow-md' : 'text-white/80 hover:text-white'
                  }`}
                >
                  Placement Drives
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'reports' ? 'bg-[#F36C21] text-white shadow-md' : 'text-white/80 hover:text-white'
                  }`}
                >
                  Placement Reports
                </button>
              </div>

              {activeTab === 'drives' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-white text-[#2D2575] hover:bg-slate-100 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all hover:scale-105"
                >
                  <Plus className="w-4 h-4 text-[#F36C21]" />
                  <span>Create New Drive</span>
                </button>
              )}
            </div>
          </div>

          {/* TAB 1: PLACEMENT DRIVES LIST & MANAGEMENT */}
          {activeTab === 'drives' && (
            <div className="space-y-6">
              {loading ? (
                <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-12 text-center text-[#4E5969] dark:text-slate-400 animate-pulse font-bold">
                  Loading placement drives...
                </div>
              ) : drives.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-12 text-center space-y-3 shadow-soft">
                  <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-[#1B1E28] dark:text-white">No Placement Drives Created</h3>
                  <p className="text-xs text-slate-400">Click "Create New Drive" to launch your first campus placement drive.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
                  {drives.map((drive) => (
                    <div
                      key={drive.drive_id}
                      className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-soft flex flex-col justify-between space-y-4 hover:shadow-xl transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-black text-lg text-[#1B1E28] dark:text-white">{drive.company_name}</h3>
                            <p className="text-xs font-bold text-[#5B4BFF]">{drive.role}</p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-950 text-[#5B4BFF] border border-[#5B4BFF]/30">
                            {drive.package_ctc || 'N/A'}
                          </span>
                        </div>

                        <p className="text-xs text-[#4E5969] dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {drive.description}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Applicants:</span>
                            <span className="font-black text-[#1B1E28] dark:text-white">{drive.total_applicants || 0}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Selected:</span>
                            <span className="font-black text-[#00C48C]">{drive.total_selected || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-[#E7EAF3] dark:border-slate-800 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleOpenNominatedProjects(drive)}
                          className="bg-[#FFF4EC] dark:bg-orange-950/40 text-[#F36C21] hover:bg-orange-100 font-bold text-[11px] py-2 rounded-xl border border-[#F36C21]/30 flex items-center justify-center gap-1.5 transition-all"
                        >
                          <FolderGit2 className="w-3.5 h-3.5" />
                          <span>View Nominated</span>
                        </button>

                        <button
                          onClick={() => handleOpenApplicants(drive)}
                          className="bg-[#5B4BFF] hover:bg-indigo-600 text-white font-bold text-[11px] py-2 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Applicants ({drive.total_applicants || 0})</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PLACEMENT REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Reports Filter */}
              <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-4 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#5B4BFF]" />
                  <h3 className="text-sm font-black text-[#1B1E28] dark:text-white">Student Placement Status Report</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReportFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      reportFilter === 'all' ? 'bg-[#5B4BFF] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    All Students
                  </button>
                  <button
                    onClick={() => setReportFilter('zero')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      reportFilter === 'zero' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Zero Placements (Unplaced)
                  </button>
                  <button
                    onClick={() => setReportFilter('multiple')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      reportFilter === 'multiple' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Multiple Placements (2+)
                  </button>
                </div>
              </div>

              {/* Reports Table */}
              {loadingReports ? (
                <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-12 text-center text-[#4E5969] animate-pulse font-bold">
                  Generating placement status report...
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-soft overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F6F8FC] dark:bg-slate-800/80 border-b border-[#E7EAF3] dark:border-slate-800 text-[#4E5969] dark:text-slate-400 font-extrabold uppercase">
                        <th className="py-3.5 px-4">Registration No</th>
                        <th className="py-3.5 px-4">Student Name</th>
                        <th className="py-3.5 px-4">Course / Batch</th>
                        <th className="py-3.5 px-4">Total Placements</th>
                        <th className="py-3.5 px-4">Recruiting Companies</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 font-medium">
                      {studentReports.map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#5B4BFF]">{r.registration_no}</td>
                          <td className="py-3.5 px-4 font-bold text-[#1B1E28] dark:text-white">{r.student_name}</td>
                          <td className="py-3.5 px-4">{r.course_cd} ({r.batch_cd})</td>
                          <td className="py-3.5 px-4">
                            {r.total_placements === 0 ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-50 text-red-600 border border-red-200">
                                0 (Unplaced)
                              </span>
                            ) : r.total_placements >= 2 ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-300">
                                {r.total_placements} Placements
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-600 border border-indigo-200">
                                1 Placement
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">
                            {r.companies_placed || 'None'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Modal 1: Create Placement Drive */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] max-w-lg w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                  <h3 className="text-base font-black text-[#1B1E28] dark:text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#5B4BFF]" />
                    <span>Create New Placement Drive</span>
                  </h3>
                  <button onClick={() => setShowCreateModal(false)} className="text-slate-400 text-sm font-bold">✕</button>
                </div>

                {createMsg && (
                  <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl font-bold">{createMsg}</div>
                )}

                <form onSubmit={handleCreateDrive} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Company Name *</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Google India / TCS"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Role / Position *</label>
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="Software Development Engineer"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Package CTC</label>
                      <input
                        type="text"
                        value={packageCtc}
                        onChange={(e) => setPackageCtc(e.target.value)}
                        placeholder="e.g. 12 LPA"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Min Repository Score %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={minScore}
                        onChange={(e) => setMinScore(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Drive Date *</label>
                      <input
                        type="date"
                        value={driveDate}
                        onChange={(e) => setDriveDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Deadline Date *</label>
                      <input
                        type="date"
                        value={deadlineDate}
                        onChange={(e) => setDeadlineDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Drive Description & Eligibility Criteria *</label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Outline Job description, skills required, round details..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-[#5B4BFF] text-white shadow-md"
                    >
                      {creating ? 'Creating...' : 'Create Drive'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal 2: View Nominated Projects for Drive */}
          {showNominatedModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] max-w-2xl w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-black text-[#1B1E28] dark:text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#F36C21]" />
                      <span>Nominated Projects for {nominatedDrive?.company_name}</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Projects marked <code className="text-[#F36C21]">is_placement_eligible = true</code> matching course &amp; score criteria.
                    </p>
                  </div>
                  <button onClick={() => setShowNominatedModal(false)} className="text-slate-400 text-sm font-bold">✕</button>
                </div>

                {loadingNominated ? (
                  <div className="p-8 text-center text-slate-400 animate-pulse font-bold text-xs">
                    Fetching nominated repository projects...
                  </div>
                ) : nominatedProjects.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <FolderGit2 className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-500">No nominated projects found matching this drive's criteria.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {nominatedProjects.map((p) => (
                      <div key={p.repo_id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-xs text-[#1B1E28] dark:text-white">{p.title}</h4>
                            <p className="text-[11px] text-[#5B4BFF] font-medium">By {p.student_name} ({p.student_reg_no})</p>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700">
                            Score: {p.score}% ({p.grade || 'A'})
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                          <div className="flex gap-1">
                            {p.tech_stack?.slice(0, 3).map((t, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white dark:bg-slate-700 border">
                                {t}
                              </span>
                            ))}
                          </div>
                          <a href={p.repo_link} target="_blank" rel="noreferrer" className="text-[#5B4BFF] font-bold flex items-center gap-1">
                            <span>Open Repository</span> <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Drawer / Section: Shortlisting & Applicants for Selected Drive */}
          {selectedDriveForApplicants && (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-black text-[#1B1E28] dark:text-white">
                    Applicants for {selectedDriveForApplicants.company_name} ({selectedDriveForApplicants.role})
                  </h3>
                  <p className="text-xs text-slate-400">Review student applications, update shortlisting status, and mark selected candidates.</p>
                </div>
                <button
                  onClick={() => setSelectedDriveForApplicants(null)}
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  Close Applicants Table
                </button>
              </div>

              {notificationMsg && (
                <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs p-3 rounded-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{notificationMsg}</span>
                </div>
              )}

              {loadingApplicants ? (
                <div className="p-8 text-center text-slate-400 font-bold animate-pulse text-xs">
                  Loading drive applicants...
                </div>
              ) : applicants.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-bold">
                  No applications received yet for this drive.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#F6F8FC] dark:bg-slate-800 border-b border-[#E7EAF3] dark:border-slate-800 text-slate-400 uppercase font-bold">
                        <th className="py-3 px-4">Student Reg No</th>
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4">Resume</th>
                        <th className="py-3 px-4">Applied Date</th>
                        <th className="py-3 px-4">Current Status</th>
                        <th className="py-3 px-4 text-right">Update Status &amp; Notify</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 font-medium">
                      {applicants.map((a) => (
                        <tr key={a.application_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-mono font-bold text-[#5B4BFF]">{a.student_reg_no}</td>
                          <td className="py-3 px-4 font-bold text-[#1B1E28] dark:text-white">{a.student_name}</td>
                          <td className="py-3 px-4">
                            <a href={a.resume_link} target="_blank" rel="noreferrer" className="text-[#5B4BFF] font-bold flex items-center gap-1">
                              <span>Resume</span> <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                          <td className="py-3 px-4">{new Date(a.applied_at).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              a.status === 'Selected' ? 'bg-emerald-100 text-emerald-700' :
                              a.status === 'Shortlisted' ? 'bg-indigo-100 text-indigo-700' :
                              a.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <select
                                value={a.status}
                                onChange={(e) => handleUpdateStatus(a.application_id, e.target.value, a.student_name)}
                                className="px-2.5 py-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                              >
                                <option value="Applied">Applied</option>
                                <option value="Shortlisted">Shortlisted</option>
                                <option value="Selected">Selected</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                              <button
                                onClick={() => handleUpdateStatus(a.application_id, a.status, a.student_name)}
                                className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-[#5B4BFF] hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-[#5B4BFF]/30 text-[11px] font-bold flex items-center gap-1 shrink-0 transition-all"
                                title="Send status update notification to student"
                              >
                                <UserCheck className="w-3.5 h-3.5 text-[#F36C21]" />
                                <span>Notify Student</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
