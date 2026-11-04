'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function SuperadminLicensingRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/superadmin/firms'); }, [router]);
  return <div className="p-8 text-center text-slate-500">Redirecting to Firms & Licensing...</div>;
}
