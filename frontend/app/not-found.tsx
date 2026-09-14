import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F8FC] dark:bg-[#0F121C] text-[#1B1E28] dark:text-white p-4 font-sans selection:bg-[#F36C21] selection:text-white">
      <div className="w-full max-w-md bg-white dark:bg-[#161926] rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6 text-center transition-all">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 flex items-center justify-center text-[#5B4BFF]">
          <span className="text-2xl font-black">404</span>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange-50 dark:bg-orange-950/40 text-[#F36C21] border border-orange-200 dark:border-orange-800/40">
            <span>● Page Not Found</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1B1E28] dark:text-white tracking-tight">
            Lost in the Campus?
          </h1>
          <p className="text-xs text-[#4E5969] dark:text-slate-400 leading-relaxed">
            The page or resource you are attempting to reach does not exist or has been relocated.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#5B4BFF] hover:bg-[#4838DF] active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all"
          >
            <span>Return to Login / Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

