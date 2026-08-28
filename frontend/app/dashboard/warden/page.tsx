'use client';

import React, { useState } from 'react';
import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import Link from 'next/link';
import HostelMessMenuWidget from '../../../components/warden/HostelMessMenuWidget';
import NoticeDashboardWidget from '../../../components/notices/NoticeDashboardWidget';
import ChatDashboardWidget from '../../../components/chat/ChatDashboardWidget';
import {
  Building2,
  Users,
  Utensils,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
} from 'lucide-react';

export default function WardenDashboardPage() {
  const [wardenKpis] = useState({
    totalRooms: 240,
    occupiedRooms: 226,
    occupancyRate: '94.2%',
    totalResidents: 452,
    eveningPunchedIn: 441,
    pendingCurfewPunch: 11,
    sickDietActive: 3,
    todayMealCount: 904,
  });

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role="warden" />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Hostel Warden Administration & Residential Dining Console" />

        <main className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1 max-w-[1600px] w-full mx-auto overflow-x-hidden">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-[#2D2575] via-[#3B2F99] to-[#5B4BFF] rounded-[22px] p-6 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 z-10">
              <div className="flex items-center gap-2">
                <span className="bg-[#F36C21] text-white text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full tracking-wider shadow-sm">
                  HOSTEL RESIDENCE CONTROL
                </span>
                <span className="text-white/70 text-xs font-mono">
                  Blocks A, B & Gargi Girls Wing
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
                <span>🏢</span>
                <span>Hostel Warden Console & Mess Operations</span>
              </h1>
              <p className="text-white/80 text-xs font-medium">
                Live resident occupancy, 4-course daily mess dining menu, evening attendance audit, and sick meal requests.
              </p>
            </div>

            <div className="flex items-center gap-3 z-10">
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center shrink-0">
                <p className="text-[10px] text-white/80 font-extrabold uppercase">Total Residents</p>
                <p className="text-xl font-black text-white">{wardenKpis.totalResidents} Students</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#F36C21]/90 backdrop-blur-md border border-white/20 text-center shrink-0">
                <p className="text-[10px] text-white/80 font-extrabold uppercase">Daily Meals</p>
                <p className="text-xl font-black text-white">{wardenKpis.todayMealCount} Servings</p>
              </div>
            </div>

            {/* Subtle decorative circles */}
            <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Quick KPI Overview Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* KPI 1: Occupancy */}
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-soft hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                  Room Occupancy
                </span>
                <span className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center text-base shadow-sm">
                  🏢
                </span>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-black text-[#1B1E28] dark:text-white tracking-tight">
                  {wardenKpis.occupancyRate}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs text-[#4E5969] dark:text-slate-400 font-bold">
                  <span>{wardenKpis.occupiedRooms} / {wardenKpis.totalRooms} Rooms Filled</span>
                  <span className="text-[#00C48C]">14 Vacant</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Evening Curfew Punches */}
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-soft hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                  Curfew Attendance
                </span>
                <span className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#00C48C] flex items-center justify-center text-base shadow-sm">
                  ⏱️
                </span>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-black text-[#00C48C] tracking-tight">
                  {wardenKpis.eveningPunchedIn}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">Punched Inside Block</span>
                  <span className="text-[#F04438]">{wardenKpis.pendingCurfewPunch} Pending Log</span>
                </div>
              </div>
            </div>

            {/* KPI 3: Daily Mess Meals */}
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-soft hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                  Mess Daily Meal Intake
                </span>
                <span className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-[#F36C21] flex items-center justify-center text-base shadow-sm">
                  🍽️
                </span>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-black text-[#F36C21] tracking-tight">
                  4 Courses
                </p>
                <div className="mt-2 flex items-center justify-between text-xs text-[#4E5969] dark:text-slate-400 font-bold">
                  <span>Morning • Lunch • Snacks • Dinner</span>
                </div>
              </div>
            </div>

            {/* KPI 4: Sick Diet Requisitions */}
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-soft hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                  Special / Sick Diets
                </span>
                <span className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center text-base shadow-sm">
                  🏥
                </span>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-black text-rose-500 tracking-tight">
                  {wardenKpis.sickDietActive} Active
                </p>
                <div className="mt-2 flex items-center justify-between text-xs text-[#4E5969] dark:text-slate-400 font-bold">
                  <span>Khichdi & Boiled Diet Prep</span>
                  <span className="text-[#5B4BFF] hover:underline cursor-pointer">View ➔</span>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN FOOD MENU COMPONENT (Morning, Lunch, Evening Snacks, Dinner) */}
          <div className="space-y-6">
            <HostelMessMenuWidget />
          </div>

          {/* 2-Column Communications & Circulars Hub */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <ChatDashboardWidget role="ADMIN" chatUrl="/dashboard/warden/chat" />
            <NoticeDashboardWidget role="warden" />
          </div>
        </main>
      </div>
    </div>
  );
}
