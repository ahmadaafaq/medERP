'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

interface LogbookEntry {
  id: string;
  studentName: string;
  rollNo: string;
  competencyCode: string;
  activityTitle: string;
  submissionDate: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export default function FacultyLogbookPage() {
  const [deptName, setDeptName] = useState('Department');
  const [entries, setEntries] = useState<LogbookEntry[]>([]);

  useEffect(() => {
    fetchDepartmentContext();
  }, []);

  const fetchDepartmentContext = async () => {
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-ims' : 'srms';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    try {
      const meRes = await fetch(`http://localhost:3001/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
      });

      if (meRes.ok) {
        const json = await meRes.json();
        const meData = json.data || json;
        const profile = meData.profile || {};
        const dName = profile.department_name || meData.departmentName || 'Department of Physiology';
        setDeptName(dName);

        if (dName.includes('Anatomy')) {
          setEntries([
            { id: '1', studentName: 'Rahul Verma', rollNo: 'MBBS2023045', competencyCode: 'AN1.1', activityTitle: 'Upper Limb Osteology Demonstration — Clavicle Attachments', submissionDate: '2026-08-01', status: 'PENDING' },
            { id: '2', studentName: 'Ananya Roy', rollNo: 'MBBS2023012', competencyCode: 'AN2.3', activityTitle: 'Dissection — Brachial Plexus Trunks and Cords', submissionDate: '2026-08-03', status: 'PENDING' },
            { id: '3', studentName: 'Kabir Deshmukh', rollNo: 'MBBS2025008', competencyCode: 'AN10.1', activityTitle: 'Histology Practical — Hyaline Cartilage Identification', submissionDate: '2026-08-05', status: 'VERIFIED' },
          ]);
        } else {
          setEntries([
            { id: '1', studentName: 'Rahul Verma', rollNo: 'MBBS2023045', competencyCode: 'PY2.1', activityTitle: 'Spirometry Practical — Forced Vital Capacity (FVC) Determination', submissionDate: '2026-08-02', status: 'PENDING' },
            { id: '2', studentName: 'Ananya Roy', rollNo: 'MBBS2023012', competencyCode: 'PY3.1', activityTitle: '12-Lead ECG Recording and PR Interval Analysis', submissionDate: '2026-08-04', status: 'PENDING' },
            { id: '3', studentName: 'Kabir Deshmukh', rollNo: 'MBBS2025008', competencyCode: 'PY4.2', activityTitle: 'Ergography & Muscle Fatigue Curve Analysis', submissionDate: '2026-08-06', status: 'VERIFIED' },
          ]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch logbook context:', err);
    }
  };

  const handleStatusChange = (id: string, newStatus: 'VERIFIED' | 'REJECTED') => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="UG Logbook Evaluation — MedERP" />
        <main className="p-6 space-y-6 flex-1">
          <div className="glass-card p-6 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-indigo-400 uppercase tracking-widest">{deptName}</span>
              <h2 className="text-xl font-extrabold text-white mt-1">UG Logbook Verification Queue</h2>
              <p className="text-xs text-slate-400 mt-1">Verify and sign off NMC competency logbook entries for department students</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {entries.filter(e => e.status === 'PENDING').length} Pending Submissions
            </span>
          </div>

          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-white text-sm">{entry.studentName}</span>
                    <span className="text-xs text-indigo-400 font-mono">({entry.rollNo})</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {entry.competencyCode}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-300">{entry.activityTitle}</p>
                  <p className="text-[11px] text-slate-500">Submitted: {entry.submissionDate}</p>
                </div>

                <div className="flex items-center gap-2">
                  {entry.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => handleStatusChange(entry.id, 'VERIFIED')}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow transition-all"
                      >
                        Verify & Sign
                      </button>
                      <button
                        onClick={() => handleStatusChange(entry.id, 'REJECTED')}
                        className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow transition-all"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      entry.status === 'VERIFIED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {entry.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
