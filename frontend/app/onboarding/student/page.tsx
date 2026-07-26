'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function StudentOnboardingPage() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('+91-9876543210');
  const [address, setAddress] = useState('Medical College Hostel Block B, Room 204');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [emergencyContact, setEmergencyContact] = useState('+91-9123456789');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSimulatePhotoUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setPhotoUrl('https://mederp-files.s3.ap-south-1.amazonaws.com/srms/profiles/student-rahul.jpg');
      setUploading(false);
    }, 800);
  };

  const handleFinish = () => {
    window.location.href = '/dashboard/student';
  };

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-xl glass-card p-8 space-y-6">
        {/* Step Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">Student Onboarding</span>
            <h2 className="text-xl font-extrabold text-white">
              {step === 1 && 'Step 1: Profile & Photo Upload'}
              {step === 2 && 'Step 2: Contact & Medical Emergency'}
              {step === 3 && 'Step 3: Academic Summary Confirmation'}
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-400">Step {step} of 3</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Step 1: Profile & Photo */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-400">Upload your passport profile photo for your digital college ID & ERP card.</p>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-sm overflow-hidden">
                {photoUrl ? <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" /> : 'ID PHOTO'}
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleSimulatePhotoUpload}
                  disabled={uploading}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow"
                >
                  {uploading ? 'Generating S3 Presigned URL...' : 'Upload Photo (S3 Direct)'}
                </button>
                <p className="text-[10px] text-slate-500 mt-1">Accepted: JPG, PNG (Max 10MB)</p>
              </div>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Step 2: Emergency & Contact */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">Permanent / Hostel Address</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="O+">O positive (O+)</option>
                  <option value="A+">A positive (A+)</option>
                  <option value="B+">B positive (B+)</option>
                  <option value="AB+">AB positive (AB+)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">Emergency Contact Phone</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Summary Confirmation */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 space-y-1">
              <p className="font-bold">✔ Profile Setup Ready</p>
              <p className="text-[11px] text-slate-300">You are assigned to **2023-MBBS** (Pathology & Surgery Department).</p>
            </div>
            <div className="space-y-2 p-4 rounded-lg bg-slate-900/60 border border-slate-800">
              <p><span className="text-slate-400">Roll Number:</span> <span className="font-bold text-white">MBBS2023045</span></p>
              <p><span className="text-slate-400">Phone:</span> <span className="text-slate-200">{phone}</span></p>
              <p><span className="text-slate-400">Blood Group:</span> <span className="text-slate-200">{bloodGroup}</span></p>
              <p><span className="text-slate-400">Emergency Contact:</span> <span className="text-slate-200">{emergencyContact}</span></p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t border-slate-800 text-xs">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow"
            >
              Next Step →
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow"
            >
              Complete Onboarding & Enter Portal 🎉
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
