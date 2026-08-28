'use client';

import React, { useState, useEffect } from 'react';

export type RoleType = 'STUDENT' | 'FACULTY' | 'ADMIN' | 'CLERK' | 'WARDEN' | 'SUPERADMIN';

interface MenuItem {
  id?: string;
  role: RoleType;
  menu_key: string;
  menu_label: string;
  route_path: string;
  parent_menu_key: string | null;
  sort_order: number;
  applicable_firm_mode: 'MED' | 'NONMED' | 'BOTH';
}

interface Step5Props {
  firmId?: string;
  firmMode: 'MED' | 'NONMED';
  rolePermissions: Record<RoleType, string[]>;
  updateRolePermissions: (role: RoleType, keys: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const ROLES: Array<{ key: RoleType; label: string; icon: string }> = [
  { key: 'STUDENT', label: '1. Student Portal', icon: '🎓' },
  { key: 'FACULTY', label: '2. Faculty Space', icon: '👨‍🏫' },
  { key: 'ADMIN', label: '3. College Admin', icon: '🏛️' },
  { key: 'CLERK', label: '4. Data Entry Clerk', icon: '📋' },
  { key: 'WARDEN', label: '5. Hostel Warden', icon: '🏢' },
  { key: 'SUPERADMIN', label: '6. Central SuperAdmin', icon: '⚡' },
];

export default function Step5RoleMenuAccess({
  firmId,
  firmMode,
  rolePermissions,
  updateRolePermissions,
  onNext,
  onBack,
}: Step5Props) {
  const [activeRoleIndex, setActiveRoleIndex] = useState<number>(0);
  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const currentRoleObj = ROLES[activeRoleIndex];
  const currentRole = currentRoleObj.key;
  const selectedKeys = rolePermissions[currentRole] || [];

  useEffect(() => {
    fetchMenusForRole(currentRole);
  }, [currentRole, firmMode]);

  const fetchMenusForRole = async (role: RoleType) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/menu-registry?role=${role}&firm_mode=${firmMode}`);
      if (res.ok) {
        const rawJson = await res.json();
        const data: MenuItem[] = Array.isArray(rawJson)
          ? rawJson
          : Array.isArray(rawJson?.data)
          ? rawJson.data
          : [];
        
        if (data.length > 0) {
          setMenuList(data);
          // If nothing is selected yet for this role, default select all applicable menus
          if (!rolePermissions[role] || rolePermissions[role].length === 0) {
            const allKeys = data.map((m) => m.menu_key);
            updateRolePermissions(role, allKeys);
          }
        } else {
          generateFallbackMenus(role);
        }
      } else {
        generateFallbackMenus(role);
      }
    } catch {
      generateFallbackMenus(role);
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackMenus = (role: RoleType) => {
    const fallbacks: Record<RoleType, MenuItem[]> = {
      STUDENT: [
        { role: 'STUDENT', menu_key: 'student.dashboard', menu_label: 'Student Dashboard', route_path: '/dashboard/student', parent_menu_key: null, sort_order: 10, applicable_firm_mode: 'BOTH' },
        { role: 'STUDENT', menu_key: 'student.attendance', menu_label: 'My Attendance', route_path: '/dashboard/student/attendance', parent_menu_key: null, sort_order: 20, applicable_firm_mode: 'BOTH' },
        { role: 'STUDENT', menu_key: 'student.timetable', menu_label: 'My Timetable', route_path: '/dashboard/student/timetable', parent_menu_key: null, sort_order: 30, applicable_firm_mode: 'BOTH' },
        { role: 'STUDENT', menu_key: 'student.assessment', menu_label: 'Assessment & Marks', route_path: '/dashboard/student/assessment', parent_menu_key: null, sort_order: 40, applicable_firm_mode: 'BOTH' },
        { role: 'STUDENT', menu_key: 'student.fees', menu_label: 'Fee Receipts', route_path: '/dashboard/student/fees', parent_menu_key: null, sort_order: 50, applicable_firm_mode: 'BOTH' },
        { role: 'STUDENT', menu_key: 'student.library', menu_label: 'Digital Library', route_path: '/dashboard/student/library', parent_menu_key: null, sort_order: 60, applicable_firm_mode: 'BOTH' },
      ],
      FACULTY: [
        { role: 'FACULTY', menu_key: 'faculty.dashboard', menu_label: 'Faculty Dashboard', route_path: '/dashboard/faculty', parent_menu_key: null, sort_order: 10, applicable_firm_mode: 'BOTH' },
        { role: 'FACULTY', menu_key: 'faculty.attendance', menu_label: 'Mark Attendance', route_path: '/dashboard/faculty/attendance', parent_menu_key: null, sort_order: 20, applicable_firm_mode: 'BOTH' },
        { role: 'FACULTY', menu_key: 'faculty.logbook', menu_label: 'Logbook Verification', route_path: '/dashboard/faculty/logbook', parent_menu_key: null, sort_order: 30, applicable_firm_mode: 'MED' },
        { role: 'FACULTY', menu_key: 'faculty.lessons', menu_label: 'Lesson Planner', route_path: '/dashboard/faculty/lessons', parent_menu_key: null, sort_order: 40, applicable_firm_mode: 'BOTH' },
        { role: 'FACULTY', menu_key: 'faculty.reports', menu_label: 'Faculty MIS Reports', route_path: '/dashboard/faculty/reports', parent_menu_key: null, sort_order: 50, applicable_firm_mode: 'BOTH' },
      ],
      ADMIN: [
        { role: 'ADMIN', menu_key: 'admin.dashboard', menu_label: 'College KPIs', route_path: '/dashboard/admin', parent_menu_key: null, sort_order: 10, applicable_firm_mode: 'BOTH' },
        { role: 'ADMIN', menu_key: 'admin.college-master', menu_label: 'College Master', route_path: '/dashboard/admin/college-master', parent_menu_key: null, sort_order: 20, applicable_firm_mode: 'BOTH' },
        { role: 'ADMIN', menu_key: 'admin.admin-master', menu_label: 'Admin Master', route_path: '/dashboard/admin/admin-master', parent_menu_key: null, sort_order: 30, applicable_firm_mode: 'BOTH' },
        { role: 'ADMIN', menu_key: 'admin.student-master', menu_label: 'Student Master', route_path: '/dashboard/admin/student-master', parent_menu_key: null, sort_order: 40, applicable_firm_mode: 'BOTH' },
        { role: 'ADMIN', menu_key: 'admin.staff-master', menu_label: 'Staff Master', route_path: '/dashboard/admin/staff-master', parent_menu_key: null, sort_order: 50, applicable_firm_mode: 'BOTH' },
        { role: 'ADMIN', menu_key: 'admin.subject-linker', menu_label: 'Subject Linker', route_path: '/dashboard/admin/subject-linker', parent_menu_key: null, sort_order: 60, applicable_firm_mode: 'BOTH' },
        { role: 'ADMIN', menu_key: 'admin.timetable-design', menu_label: 'Timetable Design', route_path: '/dashboard/admin/timetable-design', parent_menu_key: null, sort_order: 70, applicable_firm_mode: 'BOTH' },
        { role: 'ADMIN', menu_key: 'admin.placement', menu_label: 'Placement Drives', route_path: '/dashboard/admin/placement', parent_menu_key: null, sort_order: 80, applicable_firm_mode: 'NONMED' },
      ],
      CLERK: [
        { role: 'CLERK', menu_key: 'clerk.dashboard', menu_label: 'Clerk Portal', route_path: '/dashboard/clerk', parent_menu_key: null, sort_order: 10, applicable_firm_mode: 'BOTH' },
        { role: 'CLERK', menu_key: 'clerk.attendance-import', menu_label: 'Attendance Import', route_path: '/dashboard/clerk/attendance-import', parent_menu_key: null, sort_order: 20, applicable_firm_mode: 'BOTH' },
        { role: 'CLERK', menu_key: 'clerk.marks-entry', menu_label: 'Marks Entry', route_path: '/dashboard/clerk/marks-entry', parent_menu_key: null, sort_order: 30, applicable_firm_mode: 'BOTH' },
      ],
      WARDEN: [
        { role: 'WARDEN', menu_key: 'warden.dashboard', menu_label: 'Hostel Dashboard', route_path: '/dashboard/warden', parent_menu_key: null, sort_order: 10, applicable_firm_mode: 'BOTH' },
        { role: 'WARDEN', menu_key: 'warden.rooms', menu_label: 'Room Allocation', route_path: '/dashboard/warden/rooms', parent_menu_key: null, sort_order: 20, applicable_firm_mode: 'BOTH' },
        { role: 'WARDEN', menu_key: 'warden.attendance', menu_label: 'Night Attendance', route_path: '/dashboard/warden/attendance', parent_menu_key: null, sort_order: 30, applicable_firm_mode: 'BOTH' },
      ],
      SUPERADMIN: [
        { role: 'SUPERADMIN', menu_key: 'superadmin.firms', menu_label: 'Firm Directory', route_path: '/dashboard/superadmin/firms', parent_menu_key: null, sort_order: 10, applicable_firm_mode: 'BOTH' },
        { role: 'SUPERADMIN', menu_key: 'superadmin.firms.register', menu_label: 'Register New Firm', route_path: '/dashboard/superadmin/firms/register', parent_menu_key: null, sort_order: 20, applicable_firm_mode: 'BOTH' },
        { role: 'SUPERADMIN', menu_key: 'superadmin.licensing', menu_label: 'License Keys & Keys Vault', route_path: '/dashboard/superadmin/licensing', parent_menu_key: null, sort_order: 30, applicable_firm_mode: 'BOTH' },
      ],
    };

    const items = fallbacks[role].filter(
      (m) => m.applicable_firm_mode === 'BOTH' || m.applicable_firm_mode === firmMode,
    );
    setMenuList(items);
    if (!rolePermissions[role] || rolePermissions[role].length === 0) {
      updateRolePermissions(role, items.map((m) => m.menu_key));
    }
  };

  const handleToggleKey = (key: string) => {
    let next: string[];
    if (selectedKeys.includes(key)) {
      next = selectedKeys.filter((k) => k !== key);
    } else {
      next = [...selectedKeys, key];
    }
    updateRolePermissions(currentRole, next);
  };

  const handleSelectAll = () => {
    const list = Array.isArray(menuList) ? menuList : [];
    const allKeys = list.map((m) => m.menu_key);
    updateRolePermissions(currentRole, allKeys);
  };

  const handleClearAll = () => {
    updateRolePermissions(currentRole, []);
  };

  const handleSaveAndContinueRole = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);

    if (activeRoleIndex < ROLES.length - 1) {
      setActiveRoleIndex(activeRoleIndex + 1);
    } else {
      onNext();
    }
  };

  const safeMenuList = Array.isArray(menuList) ? menuList : [];

  return (
    <div className="bg-white rounded-[22px] border border-[#E7EAF3] p-8 shadow-sm transition-all">
      <div className="border-b border-[#E7EAF3] pb-5 mb-6">
        <h2 className="text-xl font-extrabold text-[#1B1E28]">Step 5 — Role Menu Access Permissions</h2>
        <p className="text-sm text-[#4E5969] mt-1">
          Control exactly which sidebar navigation links and backend API routes are active for each role in this firm.
        </p>
      </div>

      {/* Role Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 border-b border-[#E7EAF3]">
        {ROLES.map((r, idx) => {
          const count = rolePermissions[r.key]?.length || 0;
          const isActive = idx === activeRoleIndex;
          return (
            <button
              key={r.key}
              onClick={() => setActiveRoleIndex(idx)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#5B4BFF] text-white shadow-md shadow-indigo-500/20'
                  : 'bg-[#F6F8FC] text-[#4E5969] hover:text-[#1B1E28] hover:bg-white border border-[#E7EAF3]'
              }`}
            >
              <span>{r.icon}</span>
              <span>{r.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#E7EAF3] text-[#1B1E28]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Role Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-[#F6F8FC] p-4 rounded-2xl border border-[#E7EAF3]">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{currentRoleObj.icon}</span>
          <div>
            <h3 className="font-extrabold text-sm text-[#1B1E28]">
              Configuring: {currentRoleObj.label}
            </h3>
            <p className="text-xs text-[#4E5969]">
              {selectedKeys.length} of {safeMenuList.length} menu items enabled for {firmMode} mode
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#5B4BFF] bg-white border border-[#5B4BFF]/30 hover:bg-[#5B4BFF]/10 transition-all"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#F04438] bg-white border border-red-200 hover:bg-red-50 transition-all"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Menu Checkbox Tree */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-[#4E5969] text-sm">
          <div className="w-8 h-8 border-3 border-[#5B4BFF] border-t-transparent rounded-full animate-spin mb-3" />
          <span>Loading menu registry for {currentRole}...</span>
        </div>
      ) : safeMenuList.length === 0 ? (
        <div className="py-12 text-center text-[#4E5969] text-sm bg-[#F6F8FC] rounded-2xl border border-dashed border-[#E7EAF3]">
          No menu items registered for this role and mode.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
          {safeMenuList.map((item) => {
            const isChecked = selectedKeys.includes(item.menu_key);
            return (
              <div
                key={item.menu_key}
                onClick={() => handleToggleKey(item.menu_key)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                  isChecked
                    ? 'border-[#5B4BFF] bg-[#5B4BFF]/5 ring-2 ring-[#5B4BFF]/10'
                    : 'border-[#E7EAF3] bg-white hover:border-[#5B4BFF]/40'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  className="w-4 h-4 mt-0.5 rounded text-[#5B4BFF] focus:ring-[#5B4BFF]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm text-[#1B1E28]">{item.menu_label}</p>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E7EAF3] text-[#4E5969]">
                      {item.applicable_firm_mode}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#4E5969] truncate mt-0.5">{item.route_path}</p>
                  <p className="text-[11px] text-[#4E5969]/80 font-mono mt-0.5">{item.menu_key}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Navigation & Role Step Progression */}
      <div className="flex justify-between items-center pt-4 border-t border-[#E7EAF3]">
        <button
          onClick={() => {
            if (activeRoleIndex > 0) {
              setActiveRoleIndex(activeRoleIndex - 1);
            } else {
              onBack();
            }
          }}
          className="px-6 py-2.5 rounded-full font-bold text-sm text-[#4E5969] hover:text-[#1B1E28] hover:bg-[#F6F8FC] transition-all border border-[#E7EAF3]"
        >
          {activeRoleIndex > 0 ? `Back to ${ROLES[activeRoleIndex - 1].label}` : 'Back to Firm Mode'}
        </button>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-bold text-[#00C48C] animate-fade-in flex items-center gap-1">
              ✓ Saved {currentRole}
            </span>
          )}
          <button
            onClick={handleSaveAndContinueRole}
            className="px-8 py-3 rounded-full font-bold text-sm text-white bg-[#5B4BFF] hover:bg-[#4a3ae0] transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 group"
          >
            <span>
              {activeRoleIndex < ROLES.length - 1
                ? `Save & Continue to ${ROLES[activeRoleIndex + 1].label}`
                : 'Save & Continue to License & Trial'}
            </span>
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
