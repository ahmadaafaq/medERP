'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function ClerkAttImportRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/clerk/attendance'); }, [router]);
  return <div className="p-8 text-center text-slate-500">Redirecting to Attendance...</div>;
}
