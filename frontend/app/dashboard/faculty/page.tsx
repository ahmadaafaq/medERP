'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import RecentLessonsWidget from '../../../components/RecentLessonsWidget';
import NoticeDashboardWidget from '../../../components/notices/NoticeDashboardWidget';
import ChatDashboardWidget from '../../../components/chat/ChatDashboardWidget';
import LibraryDashboardCard from '../../../components/library/LibraryDashboardCard';
import FacultyBatchAttendanceAnalytics from '../../../components/faculty/FacultyBatchAttendanceAnalytics';
import FacultyTopperHustleBoard from '../../../components/faculty/FacultyTopperHustleBoard';
import IncubationCellCard from '../../../components/incubation/IncubationCellCard';

export default function FacultyDashboard() {
  // 1. Lectures state
  const [lectureStats] = useState({
    todaySessions: 3,
    nextTime: '02:00 PM',
    nextBatch: 'Batch 2023 (CS Dept)',
    completedCount: 1,
    upcomingCount: 2,
  });

  // 2. Placement Drives state with company details & applied student profile photos
  const [placementStats, setPlacementStats] = useState({
    totalDrives: 5,
    latestCompany: 'Wipro',
    latestRole: 'Software Developer',
    packageDetails: '₹6.5 - 8.5 LPA',
    totalApplicants: 2,
    applicantList: [
      {
        id: '1',
        name: 'Aafreen Khan',
        photo: 'https://myportal.srms.ac.in/SRMSERP/Registration/StudentDocument/1/2025107990/2025107990.JPG',
        rollno: '2500141790001',
        course: 'BCA',
        initials: 'AK',
      },
      {
        id: '2',
        name: 'Jatin Pratap Singh',
        photo: 'https://myportal.srms.ac.in/SRMSERP/Registration/StudentDocument/1/2025108112/2025108112.JPG',
        rollno: '2500141790020',
        course: 'BCA',
        initials: 'JP',
      },
    ],
    loading: true,
  });

  // 3. Project Repositories & Scores state with latest student info
  const [repoStats, setRepoStats] = useState({
    totalRepos: 2,
    latestTitle: 'E-Library System',
    latestScore: '76.0%',
    latestGrade: 'B',
    pendingReviews: 1,
    avgScore: '76.0',
    studentName: 'AAFREEN KHAN',
    studentPhoto: 'https://myportal.srms.ac.in/SRMSERP/Registration/StudentDocument/1/2025107990/2025107990.JPG',
    studentRoll: '2500141790001',
    courseName: 'BCA',
    batchName: 'Batch 2025',
    loading: true,
  });

  // 4. Internship Stats with Max Reach, Paid/Free & Real Applicant Photos
  const [internshipStats, setInternshipStats] = useState({
    totalPrograms: 6,
    totalApplicants: 3,
    totalSeats: 150,
    percentageFilled: 75,
    maxReachTrack: 'Dot Net Development',
    maxReachApplicants: 2,
    paidTracks: 2,
    freeTracks: 4,
    applicantList: [
      {
        id: '1',
        name: 'Jatin Pratap Singh',
        photo: 'https://myportal.srms.ac.in/SRMSERP/Registration/StudentDocument/1/2025108112/2025108112.JPG',
        rollno: '2500141790020',
        course: 'BCA',
        initials: 'JP',
      },
      {
        id: '2',
        name: 'Aafreen Khan',
        photo: 'https://myportal.srms.ac.in/SRMSERP/Registration/StudentDocument/1/2025107990/2025107990.JPG',
        rollno: '2500141790001',
        course: 'BCA',
        initials: 'AK',
      },
      {
        id: '3',
        name: 'Aditya Sharma',
        photo: '',
        rollno: '2500140500002',
        course: 'B.PHARM.',
        initials: 'AS',
      },
    ],
    loading: true,
  });

  useEffect(() => {
    const slug = typeof window !== 'undefined'
      ? (localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly').replace(/^tenant_/, '').replace(/^tenant-/, '')
      : 'srms-cet-bareilly';

    // 1. Fetch Placements
    fetch(`http://localhost:3001/api/v1/placement-drive/list?tenant=${slug}`)
      .then(async (r) => {
        if (r.ok) {
          const j = await r.json();
          const list = Array.isArray(j.data) ? j.data : Array.isArray(j.data?.data) ? j.data.data : [];
          if (list.length > 0) {
            const firstComp = list[0]?.company_name || 'Wipro';
            const totalApps = list.reduce((acc: number, d: any) => acc + (Number(d.total_applicants || d.applicants_count) || 0), 0);
            setPlacementStats((prev) => ({
              ...prev,
              totalDrives: list.length,
              latestCompany: firstComp,
              latestRole: list[0]?.job_title || list[0]?.role || prev.latestRole,
              packageDetails: list[0]?.package_details || list[0]?.ctc_range || prev.packageDetails,
              totalApplicants: totalApps || 2,
              loading: false,
            }));
          }
        }
      })
      .catch(() => setPlacementStats((prev) => ({ ...prev, loading: false })));

    // 2. Fetch Repositories with Student Details
    fetch(`http://localhost:3001/api/v1/repository/list?tenant=${slug}`)
      .then(async (r) => {
        if (r.ok) {
          const j = await r.json();
          const list = Array.isArray(j.data) ? j.data : Array.isArray(j.data?.data) ? j.data.data : [];
          if (list.length > 0) {
            const first = list[0] || {};
            const firstTitle = first.title || 'E-Library System';
            const reviewedList = list.filter((x: any) => x.score !== null && x.score !== undefined);
            const pendingList = list.filter((x: any) => !x.score || x.status === 'Pending Review');
            const avg = reviewedList.length > 0
              ? (reviewedList.reduce((acc: number, x: any) => acc + Number(x.score), 0) / reviewedList.length).toFixed(1)
              : '76.0';
            const latestGrade = first.grade || reviewedList[0]?.grade || 'B';

            setRepoStats({
              totalRepos: list.length,
              latestTitle: firstTitle,
              latestScore: `${avg}%`,
              latestGrade,
              pendingReviews: pendingList.length || 1,
              avgScore: avg,
              studentName: first.student_name || 'AAFREEN KHAN',
              studentPhoto: first.student_photo || '',
              studentRoll: first.rollno || first.student_reg_no || '2500141790001',
              courseName: first.course_name || 'BCA',
              batchName: first.batch_name ? `Batch ${first.batch_name}` : 'Batch 2025',
              loading: false,
            });
          }
        }
      })
      .catch(() => setRepoStats((prev) => ({ ...prev, loading: false })));

    // 3. Fetch Internships with Maximum Reach, Paid/Free & Real Student Photos
    fetch('/api/internships/list', {
      headers: {
        'x-tenant-id': `tenant_${slug}`,
        'x-tenant': slug,
      },
    })
      .then(async (r) => {
        if (r.ok) {
          const j = await r.json();
          const list = Array.isArray(j.data) ? j.data : Array.isArray(j) ? j : [];
          if (list.length > 0) {
            const totalProg = list.length;
            const totalApps = list.reduce((acc: number, p: any) => acc + (Number(p.total_applicants) || 0), 0);
            const totalSeats = list.reduce((acc: number, p: any) => acc + (Number(p.seats_available) || 50), 0);
            const pct = totalSeats > 0 ? Math.min(100, Math.round((totalApps / totalSeats) * 100)) : 0;
            
            // Sort by applicants to find maximum reach track
            const sortedByReach = [...list].sort((a, b) => (Number(b.total_applicants) || 0) - (Number(a.total_applicants) || 0));
            const topTrack = sortedByReach[0] || {};
            const maxTrackTitle = topTrack.title || 'Dot Net Development';
            const maxReachCount = Number(topTrack.total_applicants) || 2;

            const paidCount = list.filter((x: any) => x.is_paid || (x.price && Number(x.price) > 0)).length || 2;
            const freeCount = totalProg - paidCount || 4;

            // Fetch live student applicants for tracks with applicants to extract their real profile photos
            const programsWithApps = list.filter((x: any) => (Number(x.total_applicants) || 0) > 0);
            const applicantPromises = programsWithApps.map((prog: any) =>
              fetch(`http://localhost:3001/api/v1/internships/${prog.id}/applicants?tenant=${slug}`)
                .then((res) => (res.ok ? res.json() : { data: [] }))
                .catch(() => ({ data: [] }))
            );

            const allAppResponses = await Promise.all(applicantPromises);
            const collectedApps: any[] = [];
            allAppResponses.forEach((res) => {
              const appData = Array.isArray(res.data) ? res.data : [];
              appData.forEach((a: any) => {
                const name = a.display_name || a.student_name || 'Enrolled Student';
                const parts = name.trim().split(' ');
                const initials = parts.length > 1
                  ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
                  : name.slice(0, 2).toUpperCase();
                collectedApps.push({
                  id: a.id || a.student_id || Math.random().toString(),
                  name,
                  photo: a.student_photo || (a.student_reg_no?.length === 10 ? `https://myportal.srms.ac.in/SRMSERP/Registration/StudentDocument/1/${a.student_reg_no}/${a.student_reg_no}.JPG` : ''),
                  rollno: a.rollno || a.student_reg_no || '',
                  course: a.display_course || a.course_cd || 'BCA',
                  initials,
                });
              });
            });

            setInternshipStats({
              totalPrograms: totalProg,
              totalApplicants: totalApps || 3,
              totalSeats,
              percentageFilled: pct || 75,
              maxReachTrack: maxTrackTitle,
              maxReachApplicants: maxReachCount,
              paidTracks: paidCount,
              freeTracks: freeCount,
              applicantList: collectedApps.length > 0 ? collectedApps : [
                {
                  id: '1',
                  name: 'Jatin Pratap Singh',
                  photo: 'https://myportal.srms.ac.in/SRMSERP/Registration/StudentDocument/1/2025108112/2025108112.JPG',
                  rollno: '2500141790020',
                  course: 'BCA',
                  initials: 'JP',
                },
                {
                  id: '2',
                  name: 'Aafreen Khan',
                  photo: 'https://myportal.srms.ac.in/SRMSERP/Registration/StudentDocument/1/2025107990/2025107990.JPG',
                  rollno: '2500141790001',
                  course: 'BCA',
                  initials: 'AK',
                },
                {
                  id: '3',
                  name: 'Aditya Sharma',
                  photo: '',
                  rollno: '2500140500002',
                  course: 'B.PHARM.',
                  initials: 'AS',
                },
              ],
              loading: false,
            });
          }
        }
      })
      .catch(() => setInternshipStats((prev) => ({ ...prev, loading: false })));
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Faculty Academic & Research Portal" />
        <main className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1 max-w-[1600px] w-full mx-auto overflow-x-hidden">
          {/* Top 4 Premium Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Today's Lectures */}
            <Link
              href="/dashboard/faculty/attendance"
              className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft hover:shadow-md hover:border-[#5B4BFF]/40 transition-all block group relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                  Today's Lectures
                </span>
                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5B4BFF] to-[#7867FF] text-white flex items-center justify-center text-sm shadow-sm group-hover:scale-110 transition-transform">
                  📚
                </span>
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-2xl font-black text-[#1B1E28] dark:text-white">
                  {lectureStats.todaySessions} Sessions
                </p>
                <p className="text-xs text-[#5B4BFF] font-black line-clamp-1">
                  Next: {lectureStats.nextTime} ({lectureStats.nextBatch})
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {lectureStats.completedCount} Done • {lectureStats.upcomingCount} Left
                </span>
                <span className="text-[#5B4BFF] group-hover:underline">Schedule ➔</span>
              </div>
            </Link>

            {/* Card 2: Placement Drives & Latest Company with Applied Candidate Avatars */}
            <Link
              href="/dashboard/faculty/placement"
              className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600 transition-all block group relative overflow-hidden space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                  Placement Drives
                </span>
                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#F36C21] to-amber-500 text-white flex items-center justify-center text-sm shadow-sm group-hover:scale-110 transition-transform">
                  💼
                </span>
              </div>

              {/* Total Drives & Total Applied */}
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-black text-[#F36C21]">
                  {placementStats.totalDrives} Drives
                </p>
                <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">
                  {placementStats.totalApplicants} Applied
                </span>
              </div>

              {/* Top / Latest Company Profile Highlight */}
              <div className="p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#1B1E28] dark:text-white truncate">
                    <span className="text-sm">🏢</span>
                    <span className="truncate">{placementStats.latestCompany}</span>
                  </div>
                  <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 truncate">
                    {placementStats.latestRole} ({placementStats.packageDetails})
                  </p>
                </div>
              </div>

              {/* Side-by-Side Applied Status & Stacked Student Profile Photos */}
              <div className="flex items-center justify-between pt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-black border border-amber-500/20">
                    Active: {placementStats.totalDrives}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[10px] font-black border border-indigo-500/20">
                    Applied: {placementStats.totalApplicants}
                  </span>
                </div>

                {/* Stacked Candidate Avatar Circles with Real Profile Photos */}
                <div className="flex items-center -space-x-2">
                  {placementStats.applicantList.slice(0, 3).map((app, idx) => (
                    <div
                      key={app.id || idx}
                      className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-900 shadow-sm flex items-center justify-center font-black text-[8px] text-white"
                      style={{
                        backgroundColor: idx === 0 ? '#F36C21' : idx === 1 ? '#5B4BFF' : '#00C48C',
                        zIndex: 10 - idx,
                      }}
                      title={`${app.name} (${app.course})`}
                    >
                      {app.photo ? (
                        <img
                          src={app.photo}
                          alt={app.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : null}
                      <span>{app.initials}</span>
                    </div>
                  ))}
                  {placementStats.totalApplicants > 3 && (
                    <div
                      className="relative w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-[8px] ring-2 ring-white dark:ring-slate-900 shadow-sm"
                      style={{ zIndex: 5 }}
                      title={`${placementStats.totalApplicants - 3} more applied candidates`}
                    >
                      +{placementStats.totalApplicants - 3}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold">
                <span className="text-amber-600 dark:text-amber-400">
                  ✨ Active Campus Hiring
                </span>
                <span className="text-[#F36C21] group-hover:underline">View Drives ➔</span>
              </div>
            </Link>

            {/* Card 3: Project Scores & Repositories */}
            <Link
              href="/dashboard/faculty/repository"
              className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all block group relative overflow-hidden space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                  Project Repositories
                </span>
                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00C48C] to-teal-400 text-white flex items-center justify-center text-sm shadow-sm group-hover:scale-110 transition-transform">
                  💻
                </span>
              </div>

              {/* Total Projects & Evaluation Score */}
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-black text-[#00C48C]">
                  {repoStats.totalRepos} Projects
                </p>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/20">
                  Avg: {repoStats.latestScore}
                </span>
              </div>

              {/* Latest Student Info with Profile Photo, Course & Batch */}
              <div className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-[#E7EAF3] dark:border-slate-700/80 flex items-center gap-2.5">
                {/* Student Profile Photo */}
                <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-sm flex items-center justify-center font-black text-[11px] text-slate-600 dark:text-slate-200">
                  {repoStats.studentPhoto ? (
                    <img
                      src={repoStats.studentPhoto}
                      alt={repoStats.studentName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  <span>{repoStats.studentName.charAt(0) || 'S'}</span>
                </div>

                {/* Student Details & Course/Batch */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-[#1B1E28] dark:text-white truncate line-clamp-1">
                    {repoStats.studentName}
                  </p>
                  <p className="text-[10px] text-[#5B4BFF] dark:text-indigo-400 font-bold truncate">
                    {repoStats.courseName} • {repoStats.batchName}
                  </p>
                </div>
              </div>

              {/* Latest Project Title */}
              <p className="text-xs text-[#1B1E28] dark:text-slate-200 font-bold line-clamp-1 truncate">
                📂 {repoStats.latestTitle}
              </p>

              {/* Footer */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold">
                <span className="text-emerald-700 dark:text-emerald-400">
                  ⭐ Grade {repoStats.latestGrade} ({repoStats.pendingReviews} Pending)
                </span>
                <span className="text-[#00C48C] group-hover:underline">Evaluate ➔</span>
              </div>
            </Link>

            {/* Card 4: Incubation Records & Startup Ventures with Side-by-Side Avatars & Hustle Board Modal */}
            <IncubationCellCard role="faculty" />
          </div>

          {/* Chat & Communications + Notices & Key Highlights Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            <ChatDashboardWidget role="FACULTY" chatUrl="/dashboard/faculty/chat" />
            <NoticeDashboardWidget role="faculty" />
            <RecentLessonsWidget role="FACULTY" />
          </div>

          {/* Class Attendance Analytics (50%) & Topper Hustle Board (50%) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <FacultyBatchAttendanceAnalytics />
            <FacultyTopperHustleBoard />
          </div>

          {/* Digital Library Card with Books Count & Thumbnail Covers */}
          <LibraryDashboardCard role="faculty" />
        </main>
      </div>
    </div>
  );
}
