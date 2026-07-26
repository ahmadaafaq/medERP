'use client';
import { useState } from 'react';

export default function CollegeSetupPage() {
  const [collegeName, setCollegeName] = useState('SRMS Medical College');
  const [slug, setSlug] = useState('srms');
  const [provisioning, setProvisioning] = useState(false);
  const [provisioned, setProvisioned] = useState(false);

  const handleProvision = () => {
    setProvisioning(true);
    setTimeout(() => {
      setProvisioning(false);
      setProvisioned(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-xl glass-card p-8 space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">Super Admin Wizard</span>
          <h2 className="text-xl font-extrabold text-white">Provision New Medical College Tenant</h2>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">College Full Name</label>
            <input
              type="text"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">Tenant Subdomain Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">Schema will be created as: <code className="text-indigo-400 font-mono">tenant_{slug}</code></p>
          </div>

          {provisioned && (
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 space-y-1">
              <p className="font-bold">✔ Schema Provisioned Successfully!</p>
              <p className="text-[11px] text-slate-300">Created schema <code className="font-mono">tenant_{slug}</code> with 28 core tables & default leave types seeded.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 text-xs">
          {!provisioned ? (
            <button
              onClick={handleProvision}
              disabled={provisioning}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow"
            >
              {provisioning ? 'Creating PostgreSQL Schema...' : 'Provision Schema & Setup College'}
            </button>
          ) : (
            <button
              onClick={() => window.location.href = '/dashboard/admin'}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow"
            >
              Launch College Admin Portal 🎉
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
