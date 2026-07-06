"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const WATCH_NAV = [
  { name: 'Home', path: '/watch' },
  { name: 'TV Series', path: '/watch/series' },
  { name: 'Movies', path: '/watch/movies' },
  { name: 'Specials', path: '/watch/specials' },
  { name: 'Timeline', path: '/watch/timeline' },
  { name: 'Characters', path: '/watch/characters' },
  { name: 'Regions', path: '/watch/regions' },
];

export default function WatchLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#1e293b] text-slate-200 font-sans selection:bg-red-500/30">
      
      {/* 🔴 POKÉDEX HARDWARE HEADER 🔴 */}
      <header className="sticky top-0 z-50 bg-[#dc2626] border-b-[6px] border-slate-900 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
          
          {/* Top Panel: Lenses and LEDs */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-start gap-4">
              
              {/* Giant Blue Lens */}
              <div className="relative w-16 h-16 rounded-full bg-slate-100 border-[3px] border-slate-900 flex items-center justify-center shadow-lg">
                <div className="w-12 h-12 rounded-full bg-blue-500 border-2 border-slate-900 shadow-[inset_-4px_-4px_10px_rgba(0,0,0,0.5)] overflow-hidden relative">
                  <div className="absolute top-1 left-2 w-4 h-4 bg-white/60 rounded-full blur-[1px]"></div>
                </div>
              </div>

              {/* 3 Status LEDs */}
              <div className="flex items-center gap-2 pt-1">
                <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-slate-900 shadow-sm"></div>
                <div className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-slate-900 shadow-sm"></div>
                <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-slate-900 shadow-sm"></div>
              </div>
            </div>

            {/* Title / Search */}
            <div className="flex flex-col items-end gap-2 pt-2">
              <h1 className="text-xl md:text-2xl font-black tracking-widest text-white drop-shadow-md italic">
                POKÉ-ARCHIVE
              </h1>
              <Link href="/watch/search">
                <button className="bg-slate-900 text-white p-2 rounded-full hover:bg-slate-800 transition-colors border-2 border-black/20 shadow-inner">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Hardware Bezel & Navigation Tabs */}
        <div className="bg-[#b91c1c] border-t-2 border-red-400/30 px-4 md:px-8 py-2 rounded-b-xl shadow-inner">
          <nav className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {WATCH_NAV.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link 
                  key={item.name} 
                  href={item.path}
                  className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all border-[2px] ${
                    isActive 
                      ? "bg-yellow-400 text-slate-900 border-slate-900 shadow-[2px_2px_0px_rgba(0,0,0,1)]" 
                      : "bg-slate-900/50 text-red-100 border-transparent hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Screen Area (Dark Blue / Slate) */}
      <main className="max-w-7xl mx-auto w-full pb-20 pt-6 px-4 md:px-8">
        {/* Inner Screen Bezel Border */}
        <div className="bg-[#0f172a] rounded-[2rem] border-[6px] border-slate-900 shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden min-h-[70vh]">
          {children}
        </div>
      </main>
    </div>
  );
}