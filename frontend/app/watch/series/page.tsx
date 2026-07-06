"use client";

import { useState } from 'react';
import Link from 'next/link';
import { getTVSeriesList } from '@/lib/animeService';
import { useWatchStore } from '@/store/useWatchStore'; 

export default function TVSeriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const allSeries = getTVSeriesList();
  
  const { watchedIds } = useWatchStore();

  const filteredSeries = allSeries.filter(series => 
    series.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    series.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-300 min-h-screen bg-[#080c14] text-cyan-50 font-sans">
      
      {/* Header Section - Rotom-Dex Theme */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b-2 border-cyan-800/50 pb-6 relative">
        <div className="relative z-10">
          <div className="text-cyan-500 text-xs font-mono font-bold tracking-widest uppercase mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            
          </div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight">
            TV Series
          </h2>
          <p className="text-slate-400 text-sm mt-2 font-mono">
            
          </p>
        </div>
        
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <span className="text-cyan-500 font-mono text-sm">►</span>
          </div>
          <input 
            type="text" 
            placeholder="Query by title or region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#0b101a] border border-cyan-900/50 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-lg pl-8 pr-4 py-2.5 text-sm text-cyan-100 placeholder-slate-600 outline-none w-full transition-all font-mono shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]"
          />
        </div>
      </div>

      {/* Registry Grid Layout */}
      <div className="grid grid-cols-1 gap-6 relative">
        {filteredSeries.map((series) => {
          const isWatched = watchedIds.includes(series.id);

          return (
            <div 
              key={series.id} 
              className={`relative overflow-hidden bg-gradient-to-br from-[#0f172a] to-[#0b0f19] border rounded-xl p-5 flex flex-col lg:flex-row gap-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] hover:-translate-y-0.5 group ${
                isWatched 
                  ? 'border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.05)]' 
                  : 'border-cyan-900/40 hover:border-cyan-500/50'
              }`}
            >
              {/* Image Container - Dynamically pulling from public/images/series/ */}
              <div className="w-full lg:w-56 h-40 shrink-0 bg-black rounded-lg overflow-hidden relative border border-slate-800 group-hover:border-cyan-800/50 transition-colors">
                <img 
                     src={`/images/series/${series.id}.jpg`} 
                     alt={series.title}
                     onError={(e) => { 
     e.currentTarget.onerror = null; // <-- THIS PREVENTS THE INFINITE LOOP
    e.currentTarget.src = '/images/series/placeholder.jpg'; 
  }} 
  className={`w-full h-full object-cover transition-all duration-500 ${
    isWatched ? 'opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-60' : 'opacity-75 group-hover:opacity-100 group-hover:scale-105'
  }`} 
/>
                
                {/* Image Overlays */}
                <div className="absolute top-0 left-0 w-full h-full shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] pointer-events-none"></div>
                
                <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-[10px] font-mono font-bold px-2 py-1 rounded border border-cyan-900/50 text-cyan-400 tracking-wider">
                  EP: {series.episodesCount}
                </span>
                
                {isWatched && (
                  <div className="absolute top-2 left-2 bg-emerald-500/90 backdrop-blur text-[#0b0f19] text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-[0_0_10px_rgba(16,185,129,0.5)] flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    CLEARED
                  </div>
                )}
              </div>

              {/* Data Readout Container */}
              <div className="flex-grow flex flex-col justify-between z-10">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-blue-300 bg-blue-900/30 border border-blue-800/50 px-2 py-0.5 rounded uppercase">
                       {series.region}
                    </span>
                    {/* Only render if release year exists in future data expansions */}
                    {(series as any).releaseYear && (
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        INIT: {(series as any).releaseYear}
                      </span>
                    )}
                  </div>
                  <h3 className={`text-2xl font-black mb-2 tracking-tight ${isWatched ? 'text-slate-300' : 'text-cyan-50'}`}>
                    {series.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4 max-w-3xl line-clamp-3">
                    {series.description}
                  </p>
                </div>

                <div className="mt-2 pt-4 flex justify-end border-t border-slate-800/60">
                  <Link href={`/watch/series/${series.id}`}>
                    <button className="relative overflow-hidden bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 hover:text-cyan-100 font-mono font-bold text-xs px-5 py-2.5 rounded border border-cyan-800/50 hover:border-cyan-400/50 transition-all duration-300 group/btn shadow-[0_0_0_rgba(34,211,238,0)] hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                      <span className="relative z-10 flex items-center gap-2">
                        INITIALIZE GUIDE 
                        <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                      </span>
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}