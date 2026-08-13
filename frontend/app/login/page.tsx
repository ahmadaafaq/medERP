'use client';
import { useState } from 'react';

export default function LoginPage() {
  const [role, setRole] = useState<'STUDENT' | 'FACULTY' | 'ADMIN' | 'CLERK' | 'WARDEN'>('STUDENT');
  const [tenantSlug, setTenantSlug] = useState('srms-ims');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const targetSlug = tenantSlug.trim() || 'srms-ims';

    try {
      const res = await fetch(`http://localhost:3001/api/v1/auth/login?tenant=${targetSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': targetSlug,
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          role: role === 'ADMIN' ? 'COLLEGE_ADMIN' : role,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const authData = json.data || json;
        if (authData.accessToken) {
          localStorage.setItem('token', authData.accessToken);
          localStorage.setItem('refreshToken', authData.refreshToken || '');
          localStorage.setItem('tenantSlug', targetSlug);
          localStorage.setItem('role', role);
          if (authData.user) {
            localStorage.setItem('user', JSON.stringify(authData.user));
            const uDeptId = authData.user.departmentId || authData.user.department_id || authData.user.profile?.department_id || '';
            const uDeptName = authData.user.departmentName || authData.user.department_name || authData.user.profile?.department_name || '';
            const uSubjId = authData.user.subjectId || authData.user.subject_id || authData.user.profile?.subject_id || '';
            const uSubjName = authData.user.subjectName || authData.user.subject_name || authData.user.profile?.primary_subject_name || '';

            if (uDeptId) localStorage.setItem('departmentId', uDeptId);
            if (uDeptName) localStorage.setItem('departmentName', uDeptName);
            if (uSubjId) localStorage.setItem('subjectId', uSubjId);
            if (uSubjName) localStorage.setItem('subjectName', uSubjName);
          }
          window.location.href = `/dashboard/${role.toLowerCase()}`;
          return;
        }
      }

      const errData = await res.json().catch(() => ({}));
      const msg = errData.message || 'Invalid credentials or tenant ID';
      setErrorMsg(msg);
    } catch (err) {
      setErrorMsg('Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center p-4 bg-[#0F172A]">
      <div className="w-full max-w-md glass-card p-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-white">Sign In to MedERP</h2>
          <p className="text-sm text-slate-400">Select your portal role to continue</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-5 gap-1 p-1 bg-slate-900/60 rounded-lg border border-slate-800 text-xs font-semibold">
          {(['STUDENT', 'FACULTY', 'ADMIN', 'CLERK', 'WARDEN'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRole(r);
                setErrorMsg('');
                if (r === 'ADMIN') {
                  setEmail('admin');
                  setPassword('admin@123');
                } else if (r === 'CLERK') {
                  setEmail('1234');
                  setPassword('1234');
                } else if (r === 'STUDENT') {
                  setEmail('2023MBBS045');
                  setPassword('2023MBBS045');
                } else if (r === 'FACULTY') {
                  setEmail('EMP1001');
                  setPassword('Password@123');
                } else if (r === 'WARDEN') {
                  setEmail('warden');
                  setPassword('warden123');
                }
              }}
              className={`py-2 rounded-md transition-all text-center ${
                role === r ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {r === 'ADMIN' ? 'Admin' : r === 'CLERK' ? 'Clerk' : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Dynamic Role Banner Hint */}
        {role === 'STUDENT' && (
          <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2">
            <span>💡</span>
            <span>Student Login: Use <strong>Registration No</strong> (e.g. <code>2023MBBS045</code>) as Username & Password.</span>
          </div>
        )}
        {role === 'FACULTY' && (
          <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2">
            <span>💡</span>
            <span>Faculty Login: Use registered <strong>Emp ID</strong> (e.g. <code>EMP1001</code>) and password.</span>
          </div>
        )}
        {role === 'ADMIN' && (
          <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2">
            <span>💡</span>
            <span>Admin Login: Username <code>admin</code> and Password <code>admin@123</code>.</span>
          </div>
        )}
        {role === 'CLERK' && (
          <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2">
            <span>💡</span>
            <span>Clerk Login: Username <code>1234</code> and Password <code>1234</code>.</span>
          </div>
        )}
        {role === 'WARDEN' && (
          <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2">
            <span>💡</span>
            <span>Warden Login: Username <code>warden</code> and Password <code>warden123</code>.</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 text-center font-medium">
            {errorMsg}
          </div>
        )}

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
              {role === 'STUDENT' ? 'Registration No / Username' : role === 'FACULTY' ? 'Emp ID / Email' : 'Username / Email'}
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 text-sm"
              placeholder={
                role === 'STUDENT'
                  ? 'e.g. 2023MBBS045'
                  : role === 'FACULTY'
                  ? 'e.g. EMP1001'
                  : role === 'CLERK'
                  ? '1234'
                  : role === 'ADMIN'
                  ? 'admin'
                  : 'warden'
              }
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
            className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all text-sm flex items-center justify-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? 'Authenticating...' : `Login as ${role === 'ADMIN' ? 'Admin' : role.charAt(0) + role.slice(1).toLowerCase()}`}
          </button>
        </form>
      </div>
    </div>
  );
}

