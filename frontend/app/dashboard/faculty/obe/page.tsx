'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import {
  Target, TrendingUp, AlertTriangle, CheckCircle2, XCircle,
  BookOpen, BarChart2, Award, ChevronDown, ChevronRight,
  Loader2, RefreshCw, Save, FileText, Activity, Info, Sparkles,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const getTenant = (): string => {
  if (typeof window === 'undefined') return 'srms-cet-bareilly';
  let slug = (
    localStorage.getItem('tenantSlug') ||
    localStorage.getItem('selectedTenant') ||
    localStorage.getItem('tenant') ||
    ''
  ).replace(/^tenant_/, '').replace(/^tenant-/, '').trim();
  if (!slug) {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        slug = (u.tenantSlug || u.tenant || u.firmSlug || '').replace(/^tenant_/, '').trim();
      }
    } catch {}
  }
  return slug || 'srms-cet-bareilly';
};

const getFacultyId = (): string => {
  if (typeof window === 'undefined') return '';
  const direct = localStorage.getItem('userId') || localStorage.getItem('facultyId') || '';
  if (direct) return direct;
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const u = JSON.parse(raw);
      return u.id || u.userId || u.usr_id || u.facultyId || '';
    }
  } catch {}
  return '';
};

const getHeaders = (): Record<string, string> => {
  const t = getTenant();
  return {
    'Content-Type': 'application/json',
    'x-tenant': t,
    'x-tenant-slug': t,
    Authorization: typeof window !== 'undefined' ? `Bearer ${localStorage.getItem('token') || ''}` : '',
  };
};

// ─── Level Badge ─────────────────────────────────────────────────────────────
const LevelBadge = ({ level, size = 'sm' }: { level: number | null; size?: 'sm' | 'lg' }) => {
  const configs: Record<number, { label: string; bg: string; text: string }> = {
    3: { label: 'Level 3', bg: '#e6f9f2', text: '#00875a' },
    2: { label: 'Level 2', bg: '#fff8e6', text: '#b45309' },
    1: { label: 'Level 1', bg: '#fef3f2', text: '#c0392b' },
    0: { label: 'Level 0', bg: '#f5f5f5', text: '#6b7280' },
  };
  if (level === null || level === undefined) return <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>;
  const cfg = configs[level] || configs[0];
  return (
    <span style={{
      background: cfg.bg, color: cfg.text, padding: size === 'lg' ? '6px 14px' : '3px 10px',
      borderRadius: 20, fontSize: size === 'lg' ? 14 : 12, fontWeight: 600,
    }}>
      {cfg.label}
    </span>
  );
};

// ─── Attainment Bar ───────────────────────────────────────────────────────────
const AttainmentBar = ({ value, max = 3, target }: { value: number; max?: number; target?: number }) => {
  const pct = Math.min((value / max) * 100, 100);
  const targetPct = target ? Math.min((target / max) * 100, 100) : null;
  const color = pct >= 83 ? '#00C48C' : pct >= 50 ? '#FFB020' : '#F04438';
  return (
    <div style={{ position: 'relative', height: 10, background: '#E7EAF3', borderRadius: 10, overflow: 'hidden', flex: 1 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 10, transition: 'width 0.5s ease' }} />
      {targetPct !== null && (
        <div style={{
          position: 'absolute', top: 0, left: `${targetPct}%`, width: 2,
          height: '100%', background: '#2D2575', transform: 'translateX(-50%)',
        }} />
      )}
    </div>
  );
};

// ─── Grade Badge ─────────────────────────────────────────────────────────────
const GradeBadge = ({ grade }: { grade: string }) => {
  const map: Record<string, { bg: string; text: string }> = {
    Excellent: { bg: '#e6f9f2', text: '#00875a' },
    Good: { bg: '#e8f4ff', text: '#1e5fa8' },
    Satisfactory: { bg: '#fff8e6', text: '#b45309' },
    'Needs Improvement': { bg: '#fef3f2', text: '#c0392b' },
    'No Data': { bg: '#f5f5f5', text: '#6b7280' },
  };
  const cfg = map[grade] || map['No Data'];
  return (
    <span style={{ background: cfg.bg, color: cfg.text, padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
      {grade}
    </span>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FacultyObePage() {
  const [activeTab, setActiveTab] = useState<'targets' | 'attainment' | 'surveys'>('targets');
  const [loading, setLoading] = useState(false);
  const [computing, setComputing] = useState(false);
  const [dashData, setDashData] = useState<any>(null);
  const [targets, setTargets] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [semester, setSemester] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingAction, setEditingAction] = useState<{ id: string; value: string } | null>(null);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [coAttainments, setCoAttainments] = useState<any>({});

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const tenant = getTenant();
  const facultyId = getFacultyId();

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tenant });
      if (facultyId) params.append('facultyId', facultyId);
      if (semester) params.append('semester', semester);

      const res = await fetch(`${API_BASE}/obe/faculty-dashboard?${params}`, { headers: getHeaders() });
      if (res.ok) {
        const json = await res.json();
        setDashData(json.data);
        setTargets(json.data?.gap_analysis || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tenant, facultyId, semester]);

  // Load subjects for target declaration
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin-master/subjects?tenant=${encodeURIComponent(tenant)}`, { headers: getHeaders() });
        if (res.ok) {
          const json = await res.json();
          const list: any[] = Array.isArray(json) ? json : json.data || [];
          const normalized = list.map((s: any) => ({
            code: String(s.code || s.sub_cd || s.id),
            name: String(s.name || s.sub_name || s.mst_sub_name || s.code || 'Subject'),
            sem_cd: s.sem_cd || s.semester,
          }));
          setSubjects(normalized);
          if (normalized.length > 0) {
            const preferred = normalized.find(s => s.code === '85185') || normalized[0];
            setSelectedSubject(preferred.code);
            if (preferred.sem_cd) {
              setSemester(String(preferred.sem_cd).replace(/^Semester\s*/i, ''));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load subjects:', err);
      }
    };
    loadSubjects();
    loadDashboard();
  }, [tenant, loadDashboard]);

  // Load surveys
  useEffect(() => {
    if (activeTab !== 'surveys') return;
    const load = async () => {
      const params = new URLSearchParams({ tenant });
      if (selectedSubject) params.append('subjectCode', selectedSubject);
      if (semester) params.append('semester', semester);
      const res = await fetch(`${API_BASE}/obe/surveys?${params}`, { headers: getHeaders() });
      if (res.ok) { const json = await res.json(); setSurveys(json.data || []); }
    };
    load();
  }, [activeTab, tenant, selectedSubject, semester]);

  // Compute CO attainment for selected subject
  const computeAttainment = async () => {
    if (!selectedSubject) return showToast('Please select a subject first.', 'error');
    setComputing(true);
    try {
      const params = new URLSearchParams({ tenant, subjectCode: selectedSubject });
      if (semester) params.append('semester', semester);
      const res = await fetch(`${API_BASE}/obe/attainment/co?${params}`, { headers: getHeaders() });
      const json = await res.json();
      if (json.success) {
        setCoAttainments(json.data);
        showToast(`Computed attainment for ${Object.keys(json.data).length} COs ✓`);
        await loadDashboard();
      } else {
        showToast(json.message || 'Computation failed', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    finally { setComputing(false); }
  };

  // Save CO target
  const saveTarget = async (subjectCode: string, unitCode: string, targetLevel: number) => {
    try {
      const body = {
        faculty_id: facultyId || undefined,
        subject_code: subjectCode,
        unit_code: unitCode,
        target_level: targetLevel,
        semester: semester || undefined,
      };
      const res = await fetch(`${API_BASE}/obe/targets?tenant=${tenant}`, {
        method: 'POST', headers: getHeaders(), body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Target Level ${targetLevel} saved for ${unitCode} ✓`);
        await loadDashboard();
      } else {
        showToast(json.message || 'Save failed', 'error');
      }
    } catch { showToast('Network error', 'error'); }
  };

  // 1-Click batch declare default targets
  const batchDeclareTargets = async (subjectCode: string, defaultLevel: number = 2) => {
    try {
      for (const co of ['CO1', 'CO2', 'CO3', 'CO4', 'CO5']) {
        await fetch(`${API_BASE}/obe/targets?tenant=${tenant}`, {
          method: 'POST', headers: getHeaders(),
          body: JSON.stringify({
            faculty_id: facultyId || undefined,
            subject_code: subjectCode,
            unit_code: co,
            target_level: defaultLevel,
            semester: semester || undefined,
          }),
        });
      }
      showToast(`Default targets (Level ${defaultLevel}) declared for ${subjectCode} ✓`);
      await loadDashboard();
    } catch {
      showToast('Network error', 'error');
    }
  };

  // Save corrective action
  const saveCorrectiveAction = async (targetId: string, action: string) => {
    try {
      const res = await fetch(`${API_BASE}/obe/targets/${targetId}/corrective-action?tenant=${tenant}`, {
        method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ corrective_action: action }),
      });
      const json = await res.json();
      if (json.success) { showToast('Corrective action saved ✓'); setEditingAction(null); await loadDashboard(); }
    } catch { showToast('Network error', 'error'); }
  };

  // Publish survey
  const publishSurvey = async () => {
    if (!selectedSubject) return showToast('Select a subject first', 'error');
    try {
      const res = await fetch(`${API_BASE}/obe/surveys?tenant=${tenant}`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ subject_code: selectedSubject, faculty_id: facultyId || undefined, semester: semester || undefined }),
      });
      const json = await res.json();
      if (json.success) { showToast('Survey published ✓'); setSurveys(prev => [json.data, ...prev]); }
    } catch { showToast('Network error', 'error'); }
  };

  const scoreColor = !dashData?.target_score_pct ? '#9ca3af'
    : dashData.target_score_pct >= 80 ? '#00C48C'
    : dashData.target_score_pct >= 60 ? '#FFB020' : '#F04438';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F6F8FC' }}>
      <Sidebar />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Header title="OBE Dashboard — Outcome Based Education" />

        <div style={{ padding: '24px 32px' }}>

          {/* Toast */}
          {toast && (
            <div style={{
              position: 'fixed', top: 24, right: 24, zIndex: 9999,
              background: toast.type === 'success' ? '#00C48C' : '#F04438',
              color: '#fff', padding: '12px 20px', borderRadius: 12,
              fontWeight: 600, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}>
              {toast.message}
            </div>
          )}

          {/* Score Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }}>
            {[
              {
                icon: <Target size={22} color="#5B4BFF" />, label: 'CO Targets Set',
                value: dashData?.targets_count ?? '—', bg: '#f0efff',
              },
              {
                icon: <CheckCircle2 size={22} color="#00C48C" />, label: 'Targets Met',
                value: dashData?.targets_met ?? '—', bg: '#e6f9f2',
              },
              {
                icon: <Award size={22} color={scoreColor} />, label: 'My OBE Score',
                value: dashData?.target_score_pct !== null && dashData?.target_score_pct !== undefined
                  ? `${dashData.target_score_pct}%` : '—',
                bg: '#fff8e6',
              },
              {
                icon: <Activity size={22} color="#F36C21" />, label: 'Grade',
                value: dashData?.grade ?? '—', bg: '#fff3ec', isGrade: true,
              },
            ].map((card, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {card.icon}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{card.label}</div>
                  {(card as any).isGrade
                    ? <GradeBadge grade={String(card.value)} />
                    : <div style={{ fontSize: 22, fontWeight: 700, color: '#1B1E28' }}>{String(card.value)}</div>
                  }
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid #E7EAF3', fontSize: 13, color: '#1B1E28', minWidth: 200 }}
            >
              <option value="">All Subjects</option>
              {subjects.map((s: any) => (
                <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
              ))}
            </select>
            <input
              type="text" placeholder="Semester (e.g. 5)"
              value={semester} onChange={e => setSemester(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid #E7EAF3', fontSize: 13, width: 140 }}
            />
            <button onClick={computeAttainment} disabled={computing || !selectedSubject}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 10, background: '#5B4BFF', color: '#fff', border: 'none', fontWeight: 600, fontSize: 13, cursor: computing || !selectedSubject ? 'not-allowed' : 'pointer', opacity: computing || !selectedSubject ? 0.7 : 1 }}>
              {computing ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
              Compute Attainment
            </button>
            <button onClick={loadDashboard} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: '#f5f5f5', color: '#4E5969', border: 'none', fontSize: 13, cursor: 'pointer' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: '#fff', borderRadius: 14, padding: 6, marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', width: 'fit-content' }}>
            {([['targets', 'CO Targets & Gap Analysis'], ['attainment', 'Attainment Results'], ['surveys', 'Exit Surveys']] as const).map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding: '8px 20px', borderRadius: 10, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', background: activeTab === tab ? '#5B4BFF' : 'transparent', color: activeTab === tab ? '#fff' : '#4E5969' }}>
                {label}
              </button>
            ))}
          </div>

          {/* TAB: TARGETS & GAP ANALYSIS */}
          {activeTab === 'targets' && (
            <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #E7EAF3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1B1E28', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Target size={18} color="#5B4BFF" /> CO Target vs Achieved — Gap Analysis
                </div>
                <span style={{ fontSize: 12, color: '#6b7280' }}>▲ Purple line = target threshold in bars</span>
              </div>

              {loading ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
                  <Loader2 size={28} style={{ margin: '0 auto 8px', animation: 'spin 1s linear infinite' }} />
                  <p>Loading gap analysis...</p>
                </div>
              ) : targets.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
                  <Info size={36} style={{ margin: '0 auto 12px', color: '#5B4BFF', opacity: 0.8 }} />
                  <p style={{ fontWeight: 700, fontSize: 16, color: '#1B1E28' }}>No Targets Declared for this Scope</p>
                  <p style={{ fontSize: 13, marginTop: 4, maxWidth: 460, margin: '6px auto 16px', color: '#4E5969' }}>
                    Select a subject above to set faculty target attainment levels (CO1 - CO5), or initialize baseline Level 2 targets.
                  </p>
                  {selectedSubject && (
                    <button
                      onClick={() => batchDeclareTargets(selectedSubject, 2)}
                      style={{
                        padding: '10px 24px', borderRadius: 12, background: '#5B4BFF', color: '#fff',
                        fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(91,75,255,0.25)'
                      }}
                    >
                      <Sparkles size={16} /> Initialize Baseline Targets (Level 2) for {selectedSubject}
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F6F8FC' }}>
                        {['Subject', 'CO', 'Target Level', 'Achieved', 'Attainment', 'Status', 'Gap', 'Corrective Action'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {targets.map((row: any, i: number) => (
                        <tr key={i} style={{ borderTop: '1px solid #F0F2F7', background: row.met ? 'transparent' : '#fff9f9' }}>
                          <td style={{ padding: '14px 16px', fontSize: 13, color: '#1B1E28', fontWeight: 600 }}>{row.subject_code}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ background: '#e8f4ff', color: '#1e5fa8', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{row.unit_code}</span>
                          </td>
                          <td style={{ padding: '14px 16px' }}><LevelBadge level={row.target_level} /></td>
                          <td style={{ padding: '14px 16px' }}>
                            {row.achieved_attainment !== null
                              ? <span style={{ fontWeight: 700, color: '#1B1E28' }}>{row.achieved_attainment.toFixed(2)} / 3</span>
                              : <span style={{ color: '#9ca3af' }}>Not computed</span>}
                          </td>
                          <td style={{ padding: '14px 16px', minWidth: 160 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <AttainmentBar value={row.achieved_attainment || 0} target={row.target_level} />
                              <LevelBadge level={row.achieved_level} />
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {row.achieved_attainment === null
                              ? <span style={{ color: '#9ca3af', fontSize: 12 }}>Pending</span>
                              : row.met
                              ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#00875a', fontWeight: 600, fontSize: 13 }}><CheckCircle2 size={14} /> Met</span>
                              : <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#c0392b', fontWeight: 600, fontSize: 13 }}><XCircle size={14} /> Not Met</span>}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {row.gap !== null && (
                              <span style={{ fontWeight: 700, color: row.gap > 0 ? '#c0392b' : '#00875a', fontSize: 14 }}>
                                {row.gap > 0 ? `−${row.gap}` : '✓'}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', maxWidth: 200 }}>
                            {!row.met && editingAction?.id === row.target_id ? (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <input
                                  value={editingAction?.value || ''}
                                  onChange={e => setEditingAction({ id: row.target_id, value: e.target.value })}
                                  style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1.5px solid #5B4BFF', fontSize: 12 }}
                                  placeholder="Describe corrective action..."
                                />
                                <button
                                  onClick={() => {
                                    if (editingAction) {
                                      saveCorrectiveAction(row.target_id, editingAction.value);
                                    }
                                  }}
                                  style={{ padding: '6px 12px', borderRadius: 8, background: '#5B4BFF', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer' }}>
                                  <Save size={12} />
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                {row.corrective_action
                                  ? <span style={{ fontSize: 12, color: '#4E5969', fontStyle: 'italic' }}>{row.corrective_action}</span>
                                  : !row.met
                                  ? <button onClick={() => setEditingAction({ id: row.target_id, value: '' })}
                                      style={{ fontSize: 12, color: '#5B4BFF', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                                      + Add Action
                                    </button>
                                  : null}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Quick Target Set Panel */}
              {selectedSubject && (
                <div style={{ padding: '20px 24px', borderTop: '1px solid #E7EAF3', background: '#F6F8FC' }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1B1E28', marginBottom: 12 }}>
                    <Target size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    Set Targets for <span style={{ color: '#5B4BFF' }}>{selectedSubject}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {['CO1', 'CO2', 'CO3', 'CO4', 'CO5'].map(co => (
                      <div key={co} style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', border: '1.5px solid #E7EAF3', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#1B1E28' }}>{co}</span>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>Target Level:</span>
                        {[1, 2, 3].map(lvl => (
                          <button key={lvl} onClick={() => saveTarget(selectedSubject, co, lvl)}
                            style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #E7EAF3', background: '#fff', color: '#4E5969', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}
                            onMouseEnter={e => { (e.target as any).style.background = '#5B4BFF'; (e.target as any).style.color = '#fff'; }}
                            onMouseLeave={e => { (e.target as any).style.background = '#fff'; (e.target as any).style.color = '#4E5969'; }}>
                            {lvl}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: ATTAINMENT RESULTS */}
          {activeTab === 'attainment' && (
            <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #E7EAF3', fontWeight: 700, fontSize: 16, color: '#1B1E28', display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart2 size={18} color="#5B4BFF" /> CO Attainment Results
              </div>
              {Object.keys(coAttainments).length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
                  <TrendingUp size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                  <p style={{ fontWeight: 600 }}>No computed attainments yet.</p>
                  <p style={{ fontSize: 13, marginTop: 4 }}>Select a subject and click "Compute Attainment" above.</p>
                </div>
              ) : (
                <div style={{ padding: '0 0 16px' }}>
                  {/* Header info */}
                  <div style={{ padding: '12px 24px', background: '#F6F8FC', borderBottom: '1px solid #E7EAF3', fontSize: 12, color: '#6b7280', display: 'flex', gap: 24 }}>
                    <span>Formula: <strong style={{ color: '#1B1E28' }}>CO = 80% Direct + 20% Indirect</strong></span>
                    <span>Direct: <strong style={{ color: '#1B1E28' }}>40% Internal + 60% ESE</strong></span>
                    <span>Threshold: <strong style={{ color: '#1B1E28' }}>40% of CO max marks</strong></span>
                  </div>
                  <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {Object.entries(coAttainments).map(([co, data]: [string, any]) => (
                      <div key={co} style={{ border: '1.5px solid #E7EAF3', borderRadius: 14, overflow: 'hidden' }}>
                        <div
                          style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', background: expandedRows.has(co) ? '#f8f6ff' : '#fff' }}
                          onClick={() => setExpandedRows(prev => { const n = new Set(prev); n.has(co) ? n.delete(co) : n.add(co); return n; })}
                        >
                          <span style={{ width: 44, height: 44, borderRadius: 12, background: '#e8f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1e5fa8', fontSize: 13, flexShrink: 0 }}>{co}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ fontWeight: 700, fontSize: 15, color: '#1B1E28' }}>{co}</span>
                              <span style={{ fontWeight: 700, fontSize: 15, color: '#5B4BFF' }}>{data.final_attainment} / 3</span>
                            </div>
                            <AttainmentBar value={data.final_attainment} />
                          </div>
                          <LevelBadge level={data.attainment_level} size="lg" />
                          {expandedRows.has(co) ? <ChevronDown size={16} color="#6b7280" /> : <ChevronRight size={16} color="#6b7280" />}
                        </div>

                        {expandedRows.has(co) && (
                          <div style={{ padding: '0 18px 16px', borderTop: '1px solid #E7EAF3', background: '#fafbff', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, paddingTop: 14 }}>
                            {[
                              { label: 'Direct Attainment', value: data.direct_attainment, suffix: ' / 3' },
                              { label: 'Indirect Attainment', value: data.indirect_attainment, suffix: ' / 3' },
                              { label: 'Final Attainment', value: data.final_attainment, suffix: ' / 3', highlight: true },
                              { label: 'Students Passed', value: data.students_passed, suffix: ` / ${data.total_students}` },
                              { label: 'Pass Rate', value: `${data.student_pass_pct}`, suffix: '%' },
                              { label: 'Survey Used', value: data.has_survey ? 'Yes' : 'No (Direct used)', suffix: '' },
                            ].map((item, i) => (
                              <div key={i} style={{ background: item.highlight ? '#f0efff' : '#fff', border: '1.5px solid #E7EAF3', borderRadius: 10, padding: '10px 14px' }}>
                                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{item.label}</div>
                                <div style={{ fontWeight: 700, fontSize: 16, color: item.highlight ? '#5B4BFF' : '#1B1E28' }}>
                                  {item.value}{item.suffix}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: SURVEYS */}
          {activeTab === 'surveys' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: '#fff', borderRadius: 18, padding: '20px 24px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1B1E28', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={18} color="#5B4BFF" /> Publish Course Exit Survey
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#4E5969' }}>Subject: <strong>{selectedSubject || 'Not selected'}</strong></span>
                  <span style={{ fontSize: 13, color: '#4E5969' }}>Semester: <strong>{semester || 'Not set'}</strong></span>
                  <button onClick={publishSurvey} disabled={!selectedSubject}
                    style={{ padding: '9px 20px', borderRadius: 10, background: !selectedSubject ? '#E7EAF3' : '#5B4BFF', color: !selectedSubject ? '#9ca3af' : '#fff', border: 'none', fontWeight: 600, fontSize: 13, cursor: !selectedSubject ? 'not-allowed' : 'pointer' }}>
                    Publish Survey
                  </button>
                </div>
              </div>

              <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid #E7EAF3', fontWeight: 700, fontSize: 15, color: '#1B1E28' }}>
                  Published Surveys
                </div>
                {surveys.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>No surveys published yet.</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F6F8FC' }}>
                        {['Subject', 'Semester', 'Responses', 'Closes', 'Status'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {surveys.map((s: any) => (
                        <tr key={s.id} style={{ borderTop: '1px solid #F0F2F7' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13 }}>{s.subject_code}</td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>{s.semester || '—'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ background: '#e8f4ff', color: '#1e5fa8', padding: '3px 10px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                              {s.response_count} students
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
                            {s.closes_at ? new Date(s.closes_at).toLocaleDateString() : 'Open'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ background: s.is_published ? '#e6f9f2' : '#f5f5f5', color: s.is_published ? '#00875a' : '#6b7280', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                              {s.is_published ? 'Published' : 'Draft'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
