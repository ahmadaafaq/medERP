'use client';

import React, { useState } from 'react';
import { Database, BookOpen, Presentation, Sparkles } from 'lucide-react';
import ActivityMasterTab from '@/components/medical-logbook/ActivityMasterTab';
import SeminarMasterTab from '@/components/medical-logbook/SeminarMasterTab';

export default function MedicalLogbookDataDirectoryPage() {
  const [activeTab, setActiveTab] = useState<'activity' | 'seminar'>('activity');

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto bg-[#F6F8FC] min-h-screen">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[22px] border border-[#E7EAF3] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5B4BFF] uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" />
            Medical Logbook Curriculum Setup
          </div>
          <h1 className="text-2xl font-bold text-[#1B1E28]">Medical Logbook Data Directory</h1>
          <p className="text-sm text-[#4E5969] mt-0.5">
            Configure CBME competency-mapped curriculum activities and department seminars for logbook evaluations.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1 bg-[#F6F8FC] p-1.5 rounded-2xl border border-[#E7EAF3] self-start md:self-auto">
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'activity'
                ? 'bg-[#2D2575] text-white shadow-md'
                : 'text-[#4E5969] hover:text-[#1B1E28] hover:bg-white/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Activity Master
          </button>
          <button
            onClick={() => setActiveTab('seminar')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'seminar'
                ? 'bg-[#2D2575] text-white shadow-md'
                : 'text-[#4E5969] hover:text-[#1B1E28] hover:bg-white/60'
            }`}
          >
            <Presentation className="w-4 h-4" />
            Seminar Master
          </button>
        </div>
      </div>

      {/* Render Current Tab */}
      <div className="transition-all duration-300">
        {activeTab === 'activity' ? (
          <ActivityMasterTab />
        ) : (
          <SeminarMasterTab />
        )}
      </div>
    </div>
  );
}
