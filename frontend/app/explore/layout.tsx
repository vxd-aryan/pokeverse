import Link from 'next/link';

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      {/* Global Navigation Row */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg border border-slate-700 transition-all shadow-md"
        >
          ← Back to Dashboard
        </Link>
      </div>
      
      {/* Active Sub-Page Content */}
      <div>
        {children}
      </div>
    </div>
  );
}