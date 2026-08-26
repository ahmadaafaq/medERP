'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { 
  X, 
  GraduationCap, 
  Building2, 
  Building, 
  MapPin, 
  Briefcase, 
  Award, 
  DollarSign, 
  Clock, 
  Users, 
  Calendar, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  CheckCircle2,
  FileCheck,
  UploadCloud
} from 'lucide-react';

interface ProgramComposerModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ON_CAMPUS_FIRMS = [
  'SRMS In-house Software & Cloud Cell',
  'SRMS Innovation & Entrepreneurship Incubation Cell',
  'SRMS IMS & Hospital Paramedical Unit',
  'Robotics, Automation & Embedded IoT Lab',
  'AI, Machine Learning & Big Data Research Center',
  'Department Industrial Fabrication & Central Workshop',
  'College Media, Design & Communications Bureau',
];

const OFF_CAMPUS_SECTORS = [
  { id: 'Companies', label: 'Companies (IT / MNC / Corporate)', icon: '💼' },
  { id: 'Hospitals', label: 'Hospitals & Medical Centers', icon: '🏥' },
  { id: 'Factories', label: 'Factories & Manufacturing Plants', icon: '🏭' },
  { id: 'Research Center', label: 'Research Centers & Laboratories', icon: '🔬' },
  { id: 'Industry', label: 'Core Engineering & Heavy Industries', icon: '⚙️' },
  { id: 'Govt/PSU', label: 'Government & Public Sector (PSU)', icon: '🏛️' },
];

export default function ProgramComposerModal({ onClose, onSuccess }: ProgramComposerModalProps) {
  // Campus Mode: ON_CAMPUS vs OFF_CAMPUS
  const [campusType, setCampusType] = useState<'ON_CAMPUS' | 'OFF_CAMPUS'>('ON_CAMPUS');

  // Basic Details
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'IT' | 'MANAGEMENT' | 'PARAMEDICAL'>('IT');
  const [duration, setDuration] = useState('3_MONTH');

  // Off-Campus Specific Fields
  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState('Companies');
  const [offCampusTitle, setOffCampusTitle] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState<'ON_SITE' | 'REMOTE' | 'HYBRID'>('ON_SITE');
  const [workingConditions, setWorkingConditions] = useState('');

  // Compensation Type: FREE | PAID | STIPEND
  const [feeType, setFeeType] = useState<'FREE' | 'PAID' | 'STIPEND'>('FREE');
  const [feeAmount, setFeeAmount] = useState<number>(2500);
  const [stipendAmount, setStipendAmount] = useState<number>(15000);

  // Certification Mode
  const [certificationMode, setCertificationMode] = useState<'IN_HOUSE_AUTO' | 'OFF_CAMPUS_UPLOAD' | 'DUAL'>('IN_HOUSE_AUTO');

  // Intake & Deadlines
  const [seats, setSeats] = useState<number>(50);
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a program title.');
      return;
    }

    if (campusType === 'OFF_CAMPUS' && !organizationName.trim()) {
      setError('Please specify the host Company / Hospital / Factory / Organization name.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        title,
        category,
        duration,
        fee_type: feeType,
        fee_amount: feeType === 'PAID' ? Number(feeAmount) : 0,
        stipend_amount: feeType === 'STIPEND' ? Number(stipendAmount) : 0,
        campus_type: campusType,
        organization_name: campusType === 'OFF_CAMPUS' ? organizationName : (organizationName || 'SRMS In-house Innovation & Research Cell'),
        organization_type: organizationType,
        off_campus_title: offCampusTitle || title,
        location: location || (campusType === 'ON_CAMPUS' ? 'SRMS Bareilly Campus' : 'Corporate Headquarters'),
        work_mode: workMode,
        working_conditions: workingConditions || (campusType === 'ON_CAMPUS' ? 'Standard Academic Lab Hours & Protocols' : 'Standard Industry Protocols & Shift Timings'),
        certification_mode: certificationMode,
        seats_available: Number(seats),
        application_deadline: deadline,
        description,
      };

      const tenantSlug = typeof window !== 'undefined'
        ? (localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly').replace(/^tenant_/, '').replace(/^tenant-/, '')
        : 'srms-cet-bareilly';

      await axios.post('/api/internships/create', payload, {
        headers: {
          'x-tenant-id': `tenant_${tenantSlug}`,
          'x-tenant': tenantSlug,
        },
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to publish internship program.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#5B4BFF]/10 text-[#5B4BFF] dark:bg-[#5B4BFF]/20 dark:text-[#7867FF]">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Publish Internship / Training Program
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure On-Campus in-house labs or Off-Campus external corporate/hospital internships with certification options.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* ========================================================================= */}
          {/* 1. CAMPUS TYPE SELECTOR: On Campus vs Off Campus */}
          {/* ========================================================================= */}
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
              1. Internship Campus Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* On-Campus Card */}
              <div
                onClick={() => {
                  setCampusType('ON_CAMPUS');
                  if (certificationMode === 'OFF_CAMPUS_UPLOAD') setCertificationMode('IN_HOUSE_AUTO');
                }}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 select-none ${
                  campusType === 'ON_CAMPUS'
                    ? 'border-[#5B4BFF] bg-indigo-50/70 dark:bg-indigo-950/40 shadow-sm ring-2 ring-[#5B4BFF]/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${campusType === 'ON_CAMPUS' ? 'bg-[#5B4BFF] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-black text-xs text-slate-900 dark:text-white">
                    <span>🏛️ On Campus Internship</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    Conducted inside College / Institute internal innovation cells, university research labs, or hospital units.
                  </p>
                </div>
              </div>

              {/* Off-Campus Card */}
              <div
                onClick={() => {
                  setCampusType('OFF_CAMPUS');
                  if (certificationMode === 'IN_HOUSE_AUTO') setCertificationMode('OFF_CAMPUS_UPLOAD');
                }}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 select-none ${
                  campusType === 'OFF_CAMPUS'
                    ? 'border-[#F36C21] bg-orange-50/70 dark:bg-orange-950/40 shadow-sm ring-2 ring-[#F36C21]/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${campusType === 'OFF_CAMPUS' ? 'bg-[#F36C21] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-black text-xs text-slate-900 dark:text-white">
                    <span>🏢 Off Campus Internship</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    Conducted externally in Companies, Hospitals, Factories, Research Centers, or Heavy Industries.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* Dynamic Context Fields based on Campus Mode */}
          {/* ========================================================================= */}
          {campusType === 'ON_CAMPUS' ? (
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/80 space-y-3">
              <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                Internal Firm / College Department Facility
              </label>
              <select
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              >
                {ON_CAMPUS_FIRMS.map((firm, idx) => (
                  <option key={idx} value={firm}>{firm}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-orange-50/50 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-orange-900 dark:text-orange-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🏢</span> Off-Campus Organization & Working Conditions
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200 font-bold">
                  External Placement
                </span>
              </div>

              {/* Sector Selection Chips */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">
                  Organization Sector / Domain
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {OFF_CAMPUS_SECTORS.map((sec) => (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setOrganizationType(sec.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 text-left border ${
                        organizationType === sec.id
                          ? 'bg-[#F36C21] text-white border-[#F36C21] shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-orange-100/50'
                      }`}
                    >
                      <span>{sec.icon}</span>
                      <span className="truncate">{sec.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Company / Hospital / Factory Name & Off-Campus Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">
                    Host Organization Name
                  </label>
                  <input
                    type="text"
                    required={campusType === 'OFF_CAMPUS'}
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F36C21]"
                    placeholder="e.g. Tata Consultancy Services (TCS) / Apollo Hospitals"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">
                    Off-Campus Internship Title / Role
                  </label>
                  <input
                    type="text"
                    value={offCampusTitle}
                    onChange={(e) => setOffCampusTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F36C21]"
                    placeholder="e.g. Full-Stack Trainee / Clinical Pharmacology Resident"
                  />
                </div>
              </div>

              {/* Location & Work Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">
                    Location / City / Country
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F36C21]"
                    placeholder="e.g. Noida, Bangalore, Bareilly, Remote"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">
                    Work Mode
                  </label>
                  <select
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F36C21]"
                  >
                    <option value="ON_SITE">🏢 On-Site (Facility / Plant / Ward)</option>
                    <option value="REMOTE">🏠 Remote / Work-From-Home</option>
                    <option value="HYBRID">🔄 Hybrid (2 Days Office / 3 Days Remote)</option>
                  </select>
                </div>
              </div>

              {/* Working Conditions & Safety protocols */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">
                  Working Conditions, Shift Hours & Guidelines
                </label>
                <input
                  type="text"
                  value={workingConditions}
                  onChange={(e) => setWorkingConditions(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F36C21]"
                  placeholder="e.g. 5 days/week, 9:00 AM - 5:30 PM, Factory safety gear provided, Transport facility available"
                />
              </div>
            </div>
          )}

          {/* Program Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              2. Main Program Title / Workshop Name
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              placeholder="e.g. Cloud Native Engineering & Microservices Traineeship"
            />
          </div>

          {/* Category & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Category Domain
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              >
                <option value="IT">IT & Computer Sciences</option>
                <option value="MANAGEMENT">Management & Analytics</option>
                <option value="PARAMEDICAL">Para-Medical & Clinical Hospital</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              >
                <option value="1_MONTH">1 Month</option>
                <option value="2_MONTH">2 Months</option>
                <option value="3_MONTH">3 Months</option>
                <option value="6_MONTH">6 Months</option>
                <option value="1_YEAR">1 Year</option>
              </select>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. COMPENSATION & PRICING: FREE vs PAID vs STIPEND */}
          {/* ========================================================================= */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              3. Compensation & Fee Model
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFeeType('FREE')}
                className={`py-2.5 rounded-xl text-xs font-black transition-all border ${
                  feeType === 'FREE'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-[#F6F8FC] dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                100% Free
              </button>

              <button
                type="button"
                onClick={() => setFeeType('STIPEND')}
                className={`py-2.5 rounded-xl text-xs font-black transition-all border ${
                  feeType === 'STIPEND'
                    ? 'bg-[#00C48C] text-white border-[#00C48C] shadow-sm'
                    : 'bg-[#F6F8FC] dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                💰 Stipend Offered
              </button>

              <button
                type="button"
                onClick={() => setFeeType('PAID')}
                className={`py-2.5 rounded-xl text-xs font-black transition-all border ${
                  feeType === 'PAID'
                    ? 'bg-[#5B4BFF] text-white border-[#5B4BFF] shadow-sm'
                    : 'bg-[#F6F8FC] dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                Paid Training Fee
              </button>
            </div>

            {feeType === 'PAID' && (
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">
                  Enrollment Fee Amount (₹ INR)
                </label>
                <input
                  type="number"
                  min="100"
                  required
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  placeholder="e.g. 2500"
                />
              </div>
            )}

            {feeType === 'STIPEND' && (
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1 uppercase">
                  Monthly Stipend Amount to Student (₹ INR / Month)
                </label>
                <input
                  type="number"
                  min="1000"
                  required
                  value={stipendAmount}
                  onChange={(e) => setStipendAmount(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/30 text-xs font-bold text-emerald-900 dark:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. 15000"
                />
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 4. CERTIFICATION OPTIONS: In-House Auto Generated vs Off Campus Upload */}
          {/* ========================================================================= */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              4. Completion Certificate Issuance Model
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option A: In-House Auto */}
              <div
                onClick={() => setCertificationMode('IN_HOUSE_AUTO')}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  certificationMode === 'IN_HOUSE_AUTO'
                    ? 'border-[#5B4BFF] bg-indigo-50/60 dark:bg-indigo-950/40'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                  <Award className="w-4 h-4 text-[#5B4BFF]" />
                  <span>In-House Auto Generated</span>
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                  Verifiable digital certificate with QR code, credential ID, and official college seal.
                </p>
              </div>

              {/* Option B: Off-Campus Upload */}
              <div
                onClick={() => setCertificationMode('OFF_CAMPUS_UPLOAD')}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  certificationMode === 'OFF_CAMPUS_UPLOAD'
                    ? 'border-[#F36C21] bg-orange-50/60 dark:bg-orange-950/40'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                  <UploadCloud className="w-4 h-4 text-[#F36C21]" />
                  <span>Off-Campus Upload</span>
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                  Coordinator uploads company certificate PDF for students to download directly.
                </p>
              </div>

              {/* Option C: Dual */}
              <div
                onClick={() => setCertificationMode('DUAL')}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  certificationMode === 'DUAL'
                    ? 'border-[#00C48C] bg-emerald-50/60 dark:bg-emerald-950/40'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                  <FileCheck className="w-4 h-4 text-[#00C48C]" />
                  <span>Dual Certification</span>
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                  Provides both institutional completion verification & host organization certificate.
                </p>
              </div>
            </div>
          </div>

          {/* Seats & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Intake Capacity / Seats Available
              </label>
              <input
                type="number"
                min="5"
                max="500"
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Application Deadline
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Program Scope & Project Expectations
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              placeholder="Outline project milestones, mentor expectations, supervisor contact, and certificate criteria..."
            />
          </div>

          {/* Submit Action Bar */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#5B4BFF] to-[#7867FF] hover:from-[#4a3ae0] hover:to-[#6756EC] text-white shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Publish Program</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
