'use client';

import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import HodScopeManager from '../../../../components/admin/HodScopeManager';

export default function ClerkHodLinkerPage() {
  return (
    <div className="flex h-screen bg-[#F6F8FC] dark:bg-[#0F172A] overflow-hidden">
      <Sidebar role="clerk" />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="HOD Department Scope" />
        <main className="p-6 flex-1 space-y-6">
          <HodScopeManager role="clerk" />
        </main>
      </div>
    </div>
  );
}

