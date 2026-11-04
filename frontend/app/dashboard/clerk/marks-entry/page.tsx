'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function ClerkMarksEntryRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/clerk/assessment'); }, [router]);
  return <div className="p-8 text-center text-slate-500">Redirecting to Assessment...</div>;
}
