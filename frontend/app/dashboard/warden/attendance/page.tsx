'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function WardenAttRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/warden'); }, [router]);
  return <div className="p-8 text-center text-slate-500">Redirecting to Hostel Attendance...</div>;
}
