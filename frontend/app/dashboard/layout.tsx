'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AccessDenied from '@/components/auth/AccessDenied';
import {
  getRolePermissionsForTenant,
  verifyRouteAccess,
  invalidatePermissionsCache,
  normalizeRole,
} from '@/lib/routeRegistry';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [authStatus, setAuthStatus] = useState<'checking' | 'authorized' | 'denied'>('checking');
  const [deniedDetails, setDeniedDetails] = useState<{
    pathname: string;
    moduleLabel?: string;
    reason?: string;
    userRole?: string;
    tenantSlug?: string;
  }>({ pathname: '' });

  const evaluateAccess = useCallback(
    async (forceRefresh = false) => {
      if (typeof window === 'undefined') return;

      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role') || localStorage.getItem('user_role') || '';
      const isOwner = localStorage.getItem('isOwner') === 'true';

      // 1. Unauthenticated -> Redirect to appropriate login
      if (!token) {
        if (pathname?.startsWith('/dashboard/owner') || pathname?.startsWith('/dashboard/superadmin')) {
          router.replace('/access/superadmin');
        } else {
          router.replace('/login');
        }
        return;
      }

      // 2. Superadmin / Owner -> Unrestricted access
      const roleUpper = normalizeRole(role);
      if (roleUpper === 'SUPERADMIN' || isOwner) {
        setAuthStatus('authorized');
        return;
      }

      // 3. Overview pages for each user role are always permitted instantly (zero login lockout)
      const cleanPath = (pathname || '').split('?')[0].split('#')[0].toLowerCase().trim();
      if (
        (roleUpper === 'ADMIN' && (cleanPath === '/dashboard/admin' || cleanPath === '/dashboard')) ||
        (roleUpper === 'FACULTY' && (cleanPath === '/dashboard/faculty' || cleanPath === '/dashboard')) ||
        (roleUpper === 'STUDENT' && (cleanPath === '/dashboard/student' || cleanPath === '/dashboard')) ||
        (roleUpper === 'CLERK' && (cleanPath === '/dashboard/clerk' || cleanPath === '/dashboard')) ||
        (roleUpper === 'WARDEN' && (cleanPath === '/dashboard/warden' || cleanPath === '/dashboard'))
      ) {
        setAuthStatus('authorized');
        return;
      }

      // 4. Normal Role Namespace & Tenant Permissions Verification
      let tenantSlug =
        localStorage.getItem('tenantSlug') ||
        localStorage.getItem('selectedTenant') ||
        localStorage.getItem('college_slug') ||
        'srms-cet-bareilly';

      tenantSlug = tenantSlug.replace(/^tenant_/, '').replace(/^tenant-/, '').trim();
      if (!tenantSlug || tenantSlug === 'all' || tenantSlug === '1' || tenantSlug === 'srms' || tenantSlug === 'srms-cet') {
        tenantSlug = 'srms-cet-bareilly';
      }

      try {
        const enabledKeys = await getRolePermissionsForTenant(tenantSlug, roleUpper, forceRefresh);
        const check = verifyRouteAccess({
          pathname: pathname || '',
          userRole: roleUpper,
          isOwner,
          enabledKeys,
        });

        if (check.allowed) {
          setAuthStatus('authorized');
        } else {
          setDeniedDetails({
            pathname: pathname || '',
            moduleLabel: check.moduleLabel,
            reason: check.reason,
            userRole: roleUpper,
            tenantSlug,
          });
          setAuthStatus('denied');
        }
      } catch (err) {
        console.warn('DashboardRootLayout permission check error:', err);
        // Fallback: If network error occurs while checking, avoid total lockout if on own overview
        if (
          (roleUpper === 'ADMIN' && pathname === '/dashboard/admin') ||
          (roleUpper === 'FACULTY' && pathname === '/dashboard/faculty') ||
          (roleUpper === 'STUDENT' && pathname === '/dashboard/student') ||
          (roleUpper === 'CLERK' && pathname === '/dashboard/clerk') ||
          (roleUpper === 'WARDEN' && pathname === '/dashboard/warden')
        ) {
          setAuthStatus('authorized');
        } else {
          setAuthStatus('denied');
        }
      }
    },
    [pathname, router]
  );

  useEffect(() => {
    evaluateAccess();

    const handlePermissionsUpdated = () => {
      invalidatePermissionsCache();
      evaluateAccess(true);
    };

    window.addEventListener('permissionsUpdated', handlePermissionsUpdated);
    window.addEventListener('tenantChange', handlePermissionsUpdated);
    window.addEventListener('storage', handlePermissionsUpdated);

    return () => {
      window.removeEventListener('permissionsUpdated', handlePermissionsUpdated);
      window.removeEventListener('tenantChange', handlePermissionsUpdated);
      window.removeEventListener('storage', handlePermissionsUpdated);
    };
  }, [evaluateAccess]);

  // Loading state
  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen bg-[#F6F8FC] dark:bg-[#0E131F] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#5B4BFF] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[#4E5969] dark:text-gray-400 tracking-wider uppercase">
          Verifying Authorization...
        </p>
      </div>
    );
  }

  // Access Denied state: Prevents loading of child component completely
  if (authStatus === 'denied') {
    return (
      <AccessDenied
        pathname={deniedDetails.pathname}
        moduleLabel={deniedDetails.moduleLabel}
        reason={deniedDetails.reason}
        userRole={deniedDetails.userRole}
        tenantSlug={deniedDetails.tenantSlug}
      />
    );
  }

  return <>{children}</>;
}
