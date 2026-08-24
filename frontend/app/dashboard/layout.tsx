'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      const isOwner = localStorage.getItem('isOwner') === 'true';

      if (!token) {
        // If not logged in -> redirect immediately
        if (pathname?.startsWith('/dashboard/owner') || pathname?.startsWith('/dashboard/superadmin')) {
          router.replace('/access/owner');
        } else {
          router.replace('/login');
        }
        return;
      }

      // Check owner route permission
      if (pathname?.startsWith('/dashboard/owner') && role !== 'owner' && role !== 'superadmin' && role !== 'SUPER_ADMIN' && !isOwner) {
        router.replace('/access/owner');
        return;
      }

      setAuthorized(true);
    }
  }, [pathname, router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#5B4BFF] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[#4E5969] tracking-wider uppercase">Verifying Authorization...</p>
      </div>
    );
  }

  return <>{children}</>;
}
