"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Explicitly matches your folder structures in the explore directory
  const exploreTabs = [
    { name: 'Abilities', path: '/explore/abilities' },
    { name: 'Evolution', path: '/explore/evolution' },
    { name: 'Habitat', path: '/explore/habitat' },
    { name: 'Items', path: '/explore/items' },
    { name: 'Legendary', path: '/explore/legendary' },
    { name: 'Moves', path: '/explore/moves' },
    { name: 'Mythical', path: '/explore/mythical' },
    { name: 'Regions', path: '/explore/regions' },
    { name: 'Types', path: '/explore/type' }, // Matches your 'type' folder name
  ];

  return (
    <div className="space-y-6 min-h-screen bg-[#0f172a] text-white p-2">
      
      {/* Global Navigation Row */}
      <div className="flex flex-col gap-4 border-b border-slate-700 pb-4">
        <div>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg border border-slate-700 transition-all shadow-md"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Horizontal Sub-Navigation Tabs Container */}
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none snap-x">
          {exploreTabs.map((tab) => {
            const isActive = pathname === tab.path;
            return (
              <Link
                key={tab.name}
                href={tab.path}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                  isActive 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                    : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Active Sub-Page Content */}
      <div className="transition-all duration-300">
        {children}
      </div>
    </div>
  );
}