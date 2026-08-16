'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '../../../../../components/Sidebar';
import Header from '../../../../../components/Header';
import FacultyReportsNav from '../../../../../components/FacultyReportsNav';


interface Department {
  id: string;
  name: string;
  code: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  department_id?: string;
}

interface Batch {
  id: string;
  code: string;
  year?: number;
  name?: string;
}

interface LogbookRow {
  id: string;
  rollno: string;
  studentName: string;
  competencyCode: string;
  activityTitle: string;
  clinicalDomain: string;
  submissionDate: string;
  verifiedBy?: string;
  verificationDate?: string;
  rating: number; // 1 - 5 stars
  status: 'VERIFIED' | 'PENDING' | 'REJECTED';
}

const API_BASE = 'http://localhost:3001/api/v1';

const getTenantSlug = (): string => {
  if (typeof window !== 'undefined') {
    return (
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('selectedTenant') ||
      localStorage.getItem('institutionSlug') ||
      localStorage.getItem('tenant') ||
      'srms-ims'
    );
  }
  return 'srms-ims';
};


const sampleLogbookData: LogbookRow[] = [
  {
    id: 'log-1',
    rollno: '#20260001',
    studentName: 'Shahnawaz Ahmad',
    competencyCode: 'PY1.1(2024)',
    activityTitle: 'Spirometry Practical — Forced Vital Capacity (FVC) Determination',
    clinicalDomain: 'Physiology Lab',
    submissionDate: '2026-08-02',
    verifiedBy: 'Prof. Dr. A. K. Sharma',
    verificationDate: '2026-08-03',
    rating: 5,
    status: 'VERIFIED',
  },
  {
    id: 'log-2',
    rollno: '#20260002',
    studentName: 'Priya M Nair',
    competencyCode: 'PY2.1(2024)',
    activityTitle: '12-Lead ECG Recording and PR Interval Analysis',
    clinicalDomain: 'Clinical Physiology',
    submissionDate: '2026-08-04',
    verifiedBy: 'Prof. Dr. A. K. Sharma',
    verificationDate: '2026-08-05',
    rating: 4,
    status: 'VERIFIED',
  },
  {
    id: 'log-3',
    rollno: '#20260003',
    studentName: 'Kabir Rao Deshmukh',
    competencyCode: 'PY3.1(2024)',
    activityTitle: 'Ergography & Muscle Fatigue Curve Analysis',
    clinicalDomain: 'Nerve-Muscle Lab',
    submissionDate: '2026-08-06',
    rating: 3,
    status: 'PENDING',
  },
  {
    id: 'log-4',
    rollno: '#20260004',
    studentName: 'Ananya Roy',
    competencyCode: 'AN10.11(2024)',
    activityTitle: 'Upper Limb Osteology Demonstration — Clavicle Attachments',
    clinicalDomain: 'Anatomy Dissection Hall',
    submissionDate: '2026-08-01',
    verifiedBy: 'Dr. R. K. Gupta',
    verificationDate: '2026-08-02',
    rating: 5,
    status: 'VERIFIED',
  },
  {
    id: 'log-5',
    rollno: '#20260005',
    studentName: 'Mohammed Farhan',
    competencyCode: 'AN11.5(2024)',
    activityTitle: 'Cubital Fossa Dissection & Nerve Bundle Identification',
    clinicalDomain: 'Anatomy Dissection Hall',
    submissionDate: '2026-08-07',
    rating: 0,
    status: 'PENDING',
  },
];

export default function FacultyUGLogbookReportPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [logbookEntries, setLogbookEntries] = useState<LogbookRow[]>(sampleLogbookData);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    const slug = getTenantSlug();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const h = { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug };

    try {
      const [dRes, sRes, bRes] = await Promise.all([
        fetch(`${API_BASE}/admin-master/departments?tenant=${slug}`, { headers: h }).catch(() => null),
        fetch(`${API_BASE}/admin-master/subjects?tenant=${slug}`, { headers: h }).catch(() => null),
        fetch(`${API_BASE}/college-master/batches?tenant=${slug}`, { headers: h }).catch(() => null),
      ]);

      const parseList = (j: any) => Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];
      if (dRes && dRes.ok) {
        const dList = parseList(await dRes.json());
        setDepartments(dList);
        if (dList.length > 0) setSelectedDept(dList[0].id);
      }
      if (sRes && sRes.ok) {
        const sList = parseList(await sRes.json());
        setSubjects(sList);
        if (sList.length > 0) setSelectedSubject(sList[0].id);
      }
      if (bRes && bRes.ok) {
        const bList = parseList(await bRes.json());
        const mapped: Batch[] = bList.map((b: any) => ({
          id: b.id,
          code: b.code || `${b.year}-MBBS`,
          name: b.name || `${b.code} Batch`,
        }));
        setBatches(mapped);
        if (mapped.length > 0) setSelectedBatch(mapped[0]);
      }
    } catch {}
  };

  const filteredEntries = useMemo(() => {
    return logbookEntries.filter(entry => {
      const matchStatus = statusFilter === 'ALL' || entry.status === statusFilter;
      const matchQuery = !searchQuery.trim() ||
        entry.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.rollno.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.competencyCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.activityTitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchQuery;
    });
  }, [logbookEntries, statusFilter, searchQuery]);

  const verifiedCount = logbookEntries.filter(e => e.status === 'VERIFIED').length;
  const pendingCount = logbookEntries.filter(e => e.status === 'PENDING').length;

  const pathname = usePathname();
  const currentRole: 'admin' | 'faculty' = (pathname && pathname.includes('/dashboard/admin/')) ? 'admin' : 'faculty';

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role={currentRole} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={currentRole === 'admin' ? 'Admin MIS Reports — UG LogBook Evaluation' : 'Faculty MIS Reports — UG LogBook Evaluation'} />
        <main className="p-6 space-y-6 flex-1">
          {/* Top Reports Suite Navigation Tabs */}
          <FacultyReportsNav
            activeReport="logbook"
            role={currentRole}
            stats={{
              attendanceCount: 'Sessions',
              logbookCount: `${verifiedCount} Sign-offs`,
              theoryCount: 'Assessment',
            }}
          />

          {/* Banner Card */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold text-[#5B4BFF] uppercase tracking-widest">
                  📚 MIS REPORT 2: UG LOGBOOK REPORT
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/20">
                  NMC CBME Logbook Verification
                </span>
              </div>
              <h2 className="text-xl font-black text-[#1B1E28] dark:text-white tracking-tight uppercase mt-1.5">
                Undergraduate Clinical &amp; Laboratory LogBook Ledger
              </h2>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
                Track student practical competence certifications, clinical procedures, and faculty sign-offs.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-2 rounded-xl text-xs font-black bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/30 shadow-sm">
                ✓ {verifiedCount} Verified
              </span>
              <span className="px-3.5 py-2 rounded-xl text-xs font-black bg-[#FFF8E6] text-[#FFB020] border border-[#FFB020]/30 shadow-sm">
                ● {pendingCount} Pending
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#5B4BFF] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center text-[10px] font-black">1</span>
                FILTER BY DEPARTMENT, SUBJECT, BATCH &amp; STATUS
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-black text-[#1B1E28] dark:text-slate-200 uppercase mb-1.5">Department</label>
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs shadow-sm"
                >
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-[#1B1E28] dark:text-slate-200 uppercase mb-1.5">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs shadow-sm"
                >
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-[#1B1E28] dark:text-slate-200 uppercase mb-1.5">Batch</label>
                <select
                  value={selectedBatch?.id || ''}
                  onChange={e => { const b = batches.find(b => b.id === e.target.value); setSelectedBatch(b || null); }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs shadow-sm"
                >
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name || b.code}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-[#1B1E28] dark:text-slate-200 uppercase mb-1.5">Status Filter</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs shadow-sm"
                >
                  <option value="ALL">All Submissions</option>
                  <option value="VERIFIED">Verified Only</option>
                  <option value="PENDING">Pending Sign-off</option>
                </select>
              </div>
            </div>
          </div>

          {/* Logbook Ledger Table */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center text-[10px] font-black">2</span>
                UG LOGBOOK ENTRIES &amp; VERIFICATION LEDGER ({filteredEntries.length} Records)
              </h3>

              <div className="w-full sm:w-72">
                <input
                  type="text"
                  placeholder="🔍 Search student, competency, title..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold focus:border-[#5B4BFF] focus:outline-none shadow-sm"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E7EAF3] dark:border-slate-800 text-[10px] font-black text-[#1B1E28] dark:text-slate-300 uppercase tracking-wider bg-[#F8FAFC] dark:bg-slate-800/60">
                    <th className="py-3.5 px-4 rounded-l-xl">Roll No</th>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Competency Code</th>
                    <th className="py-3.5 px-4">Practical / Clinical Activity</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Verified By</th>
                    <th className="py-3.5 px-4 text-center">Proficiency</th>
                    <th className="py-3.5 px-4 text-right rounded-r-xl">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 font-medium">
                  {filteredEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-[#F1F4F9]/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-black text-[#5B4BFF]">{entry.rollno}</td>
                      <td className="py-3.5 px-4 font-black text-[#1B1E28] dark:text-white">{entry.studentName}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full font-mono font-black text-[10px] bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/30">
                          🎯 {entry.competencyCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#1B1E28] dark:text-slate-200">
                        {entry.activityTitle}
                        <span className="block text-[10px] text-[#7B8794] font-medium">{entry.clinicalDomain}</span>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-[#4E5969] dark:text-slate-400 font-bold">{entry.submissionDate}</td>
                      <td className="py-3.5 px-4 text-[11px] text-[#5B4BFF] font-bold">{entry.verifiedBy || '—'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[#FFB020] font-black text-xs">
                          {'★'.repeat(entry.rating || 0)}{'☆'.repeat(5 - (entry.rating || 0))}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          entry.status === 'VERIFIED'
                            ? 'bg-[#E6F9F3] text-[#00C48C] border-[#00C48C]/30'
                            : 'bg-[#FFF8E6] text-[#FFB020] border-[#FFB020]/30'
                        }`}>
                          {entry.status === 'VERIFIED' ? '✓ Verified' : '● Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
