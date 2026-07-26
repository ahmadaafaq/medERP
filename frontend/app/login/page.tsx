'use client';
import { useState } from 'react';

export default function LoginPage() {
  const [role, setRole] = useState<'STUDENT' | 'FACULTY' | 'ADMIN' | 'WARDEN'>('STUDENT');
  const [tenantSlug, setTenantSlug] = useState('srms');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate auth request to NestJS backend
    setTimeout(() => {
      setLoading(false);
      window.location.href = `/dashboard/${role.toLowerCase()}`;
    }, 800);
  };

  return (
    <div className="min-h-screen flex justify-center items-center p-4 bg-[#0F172A]">
      <div className="w-full max-w-md glass-card p-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-white">Sign In to MedERP</h2>
          <p className="text-sm text-slate-400">Select your portal role to continue</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/60 rounded-lg border border-slate-800 text-xs font-semibold">
          {(['STUDENT', 'FACULTY', 'ADMIN', 'WARDEN'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`py-2 rounded-md transition-all ${
                role === r ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {r === 'ADMIN' ? 'Admin' : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              College Tenant Subdomain
            </label>
            <input
              type="text"
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 text-sm"
              placeholder="e.g. srms, aiims"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Email / Roll No / Emp ID
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 text-sm"
              placeholder="user@college.edu"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all text-sm"
          >
            {loading ? 'Authenticating...' : `Login as ${role}`}
          </button>
        </form>
      </div>
    </div>
  );
}
