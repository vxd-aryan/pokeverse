"use client";

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getTVSeriesById } from '@/lib/animeService'; 
import { useWatchStore } from '@/store/useWatchStore'; // Added state management

export default function SeriesDetailPage() {
  const params = useParams();
  const router = useRouter();
  const seriesId = params.id as string;
  
  const series = getTVSeriesById(seriesId);
  const { watchedIds, toggleWatched } = useWatchStore();

 

  const isWatched = series ? watchedIds.includes(series.id) : false;

  // Fallbacks: If your data model doesn't have these yet, we prevent crashes and show default data!
  const featuredPokemon = (series as any).featuredPokemon || ["Pikachu", "Regional Starters"];
  const villains = (series as any).villains || ["Team Rocket"];

  return (
    <div className="min-h-screen bg-[#080c14] animate-in fade-in duration-500 font-sans pb-12">
      {/* Hero Banner Area */}
      <div className="relative w-full h-72 md:h-[26rem] bg-black border-b-2 border-cyan-900/50 overflow-hidden">
        <img 
          src={`/images/series/${series.id}.jpg`} 
          alt={series.title} 
          onError={(e) => { 
            e.currentTarget.onerror = null; 
            e.currentTarget.src = '/images/series/placeholder.jpg'; 
          }} 
          className={`w-full h-full object-cover transition-all duration-700 ${isWatched ? 'opacity-30 grayscale' : 'opacity-60'}`} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/60 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-8 max-w-7xl mx-auto flex flex-col justify-end h-full">
          <button 
            onClick={() => router.push('/watch/series')}
            className="text-xs font-mono font-bold text-cyan-500 hover:text-cyan-300 mb-6 flex items-center gap-2 transition-colors w-max"
          >
            <span>◄</span> SYSTEM REGISTRY
          </button>
          
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="text-xs font-mono font-bold bg-blue-900/40 text-blue-300 border border-blue-500/30 px-3 py-1 rounded uppercase tracking-widest shadow-[0_0_10px_rgba(59,130,246,0.2)]">
              SAGA CLASSIFICATION
            </span>
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
              LOC // {series.region}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight mb-4">
            {series.title}
          </h1>
        </div>
      </div>

      {/* Grid Specs */}
      <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 -mt-4">
        
        <div className="md:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-[#0f172a] to-[#0b0f19] border border-cyan-900/40 rounded-2xl p-6 md:p-8 shadow-lg">
            <h2 className="text-xl font-black text-cyan-50 mb-4 flex items-center gap-2">
              <span className="text-cyan-500 font-mono text-lg">/</span> Synopsis Log
            </h2>
            <p className="text-slate-300 leading-relaxed text-base">{series.description}</p>
          </div>
          
          <div className="bg-gradient-to-br from-[#0b101a] to-[#080c14] border border-cyan-900/30 rounded-2xl p-6 md:p-8">
            <h3 className="text-sm font-bold text-cyan-100 mb-2 uppercase tracking-widest font-mono">Episode Sequence Details</h3>
            <p className="text-sm text-slate-400 mb-6">
              This regional saga chronicles a calculated total sequence of <strong className="text-cyan-400">{series.episodesCount} episodes</strong>.
            </p>
            
            <div className="flex flex-wrap gap-4">
              
              
              <button 
                onClick={() => toggleWatched(series.id)}
                className={`text-xs font-mono font-bold px-6 py-3 rounded-lg transition-all border ${
                  isWatched 
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400 hover:bg-emerald-900/40' 
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isWatched ? '✓ CLEARANCE SECURED (CLICK TO REVERT)' : 'MARK REGION AS CLEARED'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-b from-[#0b101a] to-[#080c14] border border-cyan-900/40 rounded-2xl p-6 h-max space-y-6 text-sm">
          <h3 className="text-xs font-black text-cyan-500 mb-4 uppercase tracking-widest font-mono border-b border-cyan-900/50 pb-2">
            Historical Archiving
          </h3>
          
          <div>
            <span className="text-slate-500 block mb-2 font-mono text-xs uppercase">Key Partner Roster:</span>
            <div className="flex flex-wrap gap-2">
              {featuredPokemon.map((p: string) => (
                <span key={p} className="bg-[#0f172a] px-2.5 py-1 border border-cyan-900/30 rounded text-cyan-100 text-xs shadow-sm">
                  {p}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <span className="text-slate-500 block mb-2 font-mono text-xs uppercase">Active Opposition Forces:</span>
            <div className="bg-red-950/20 border border-red-900/30 rounded p-3 text-red-400/90 font-medium text-xs shadow-[inset_0_0_10px_rgba(220,38,38,0.05)]">
              {villains.join(', ')}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}