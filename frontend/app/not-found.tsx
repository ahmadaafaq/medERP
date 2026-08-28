import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
      <div className="glass-card max-w-md p-6 space-y-4 text-center">
        <h2 className="text-2xl font-extrabold text-indigo-400">404 - Page Not Found</h2>
        <p className="text-xs text-slate-400">
          The page or resource you are looking for does not exist.
        </p>
        <Link
          href="/dashboard/faculty"
          className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg shadow"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
