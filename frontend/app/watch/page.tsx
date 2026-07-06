"use client";

import Link from 'next/link';

const DIRECTORIES = [
  {
    title: "Regional Sagas",
    description: "Mainline broadcast logs and historical era records.",
    href: "/watch/series",
    icon: "📺",
    bgColor: "bg-blue-500",
    shadowColor: "shadow-blue-900"
  },
  {
    title: "Theatrical Archives",
    description: "Standalone cinematic events cross-referenced by timeline.",
    href: "/watch/movies",
    icon: "🍿",
    bgColor: "bg-red-500",
    shadowColor: "shadow-red-900"
  },
  {
    title: "Classified Specials",
    description: "Anthologies, web projects, and rare localized broadcasts.",
    href: "/watch/specials",
    icon: "🌟",
    bgColor: "bg-purple-500",
    shadowColor: "shadow-purple-900"
  },
  {
    title: "Timeline Matrix",
    description: "A chronological mapping sequence connecting all visual media.",
    href: "/watch/timeline",
    icon: "🗺️",
    bgColor: "bg-emerald-500",
    shadowColor: "shadow-emerald-900"
  },
  {
    title: "Personnel Database",
    description: "Historical profiles and registered partner team compositions.",
    href: "/watch/characters",
    icon: "🧢",
    bgColor: "bg-orange-500",
    shadowColor: "shadow-orange-900"
  },
  {
    title: "Geographic Data",
    description: "Topographical data and landmark indices for all known regions.",
    href: "/watch/regions",
    icon: "🧭",
    bgColor: "bg-cyan-500",
    shadowColor: "shadow-cyan-900"
  }
];

export default function WatchDashboard() {
  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500 relative min-h-full">
      
      {/* 🔴⚪ CSS POKÉBALL BACKGROUND WATERMARK 🔴⚪ */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.03] pointer-events-none z-0">
        <div className="w-full h-full rounded-full border-[40px] border-white relative overflow-hidden">
          <div className="absolute top-0 w-full h-1/2 bg-white"></div>
          <div className="absolute top-1/2 left-0 w-full h-[40px] bg-white -mt-[20px]"></div>
          <div className="absolute top-1/2 left-1/2 w-[160px] h-[160px] bg-[#0f172a] rounded-full border-[40px] border-white -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>

      {/* Hero Welcome Section */}
      <div className="relative rounded-3xl bg-slate-800 border-[4px] border-slate-700 overflow-hidden mb-10 shadow-xl z-10">
        {/* Soft diagonal split for visual flair */}
        <div className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-gradient-to-bl from-red-500/20 to-transparent skew-x-12 translate-x-20"></div>
        
        <div className="relative z-20 p-8 md:p-12 lg:w-3/4">
          <div className="inline-flex items-center gap-2 bg-yellow-400 text-slate-900 font-bold px-4 py-1.5 rounded-full text-xs tracking-widest uppercase mb-6 shadow-md border-2 border-yellow-500">
            <span className="w-2 h-2 bg-slate-900 rounded-full animate-pulse"></span>
            
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            The Master <br />
            <span className="text-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
              Animation Index
            </span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-8 max-w-xl font-medium">
            Welcome to the centralized regional hub. Select a directory below to access over 25 years of documented history, cross-reference regional events, and track your watch progress.
          </p>
          
          <Link href="/watch/timeline">
            <button className="bg-white hover:bg-slate-200 text-slate-900 font-black text-sm px-8 py-4 rounded-full transition-all shadow-[0_4px_0_rgb(148,163,184)] active:shadow-none active:translate-y-1 uppercase tracking-widest border-2 border-slate-300 flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-[3px] border-slate-900 relative">
                <div className="absolute top-1/2 left-0 w-full h-[3px] bg-slate-900 -translate-y-1/2"></div>
                <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-slate-900 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              </div>
              Launch Timeline
            </button>
          </Link>
        </div>
      </div>

      {/* Navigation Grid */}
      <div className="mb-6 z-10 relative">
        <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-3">
          <span className="w-4 h-8 bg-red-500 rounded-sm inline-block"></span>
          System Directories
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {DIRECTORIES.map((dir) => (
          <Link key={dir.href} href={dir.href}>
            {/* Chunky "Tactile" Button Cards */}
            <div className={`h-full bg-slate-800 rounded-2xl p-6 transition-all duration-200 cursor-pointer border-[3px] border-slate-700 hover:border-slate-500 hover:-translate-y-2 relative overflow-hidden group shadow-[0_8px_0_rgb(51,65,85)] hover:shadow-[0_12px_0_rgb(71,85,105)] active:translate-y-2 active:shadow-none`}>
              
              <div className="relative z-10 flex flex-col h-full">
                {/* Header Row: Icon + Title */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 ${dir.bgColor} rounded-full flex items-center justify-center text-2xl shadow-inner border-2 border-black/20 text-white shadow-[0_4px_0_var(--tw-shadow-color)] ${dir.shadowColor}`}>
                    {dir.icon}
                  </div>
                  <h3 className="text-lg font-black text-white tracking-wide">
                    {dir.title}
                  </h3>
                </div>
                
                {/* Description */}
                <p className="text-slate-400 text-sm font-medium leading-relaxed flex-grow">
                  {dir.description}
                </p>
                
                {/* Bottom Accents */}
                <div className="mt-6 flex justify-between items-end">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-red-500 transition-colors"></span>
                    <span className="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-yellow-400 transition-colors delay-75"></span>
                  </div>
                  <span className="text-slate-500 font-bold group-hover:text-white transition-colors">
                    ➔
                  </span>
                </div>
              </div>

            </div>
          </Link>
        ))}
      </div>
      
    </div>
  );
}