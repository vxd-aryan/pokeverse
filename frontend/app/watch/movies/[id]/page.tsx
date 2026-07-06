"use client";

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getMovieById } from '@/lib/animeService';
import { useWatchStore } from '@/store/useWatchStore';

export default function MovieDetailPage() {
  const params = useParams();
  const movieId = params.id as string;
  
  const movie = getMovieById(movieId);
  
  // Connect to the global watch state manager
  const { watchedIds, toggleWatched } = useWatchStore();
  const isWatched = watchedIds.includes(movieId);

  // Database error/missing records template
  if (!movie) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-500">
        <div className="bg-slate-900 border-4 border-red-600 rounded-3xl p-8 max-w-lg w-full text-center shadow-[0_0_50px_rgba(220,38,38,0.25)] relative overflow-hidden">
          {/* Diagnostic Corner Trim */}
          <div className="absolute top-0 left-0 w-4 h-4 bg-red-600" />
          <div className="absolute top-0 right-0 w-4 h-4 bg-red-600" />
          
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-red-500/30 animate-pulse">
            <span className="text-3xl text-red-500">⚠️</span>
          </div>
          
          <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-3">
            LOG NOT FOUND
          </h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed font-mono">
            CRITICAL ERROR: The requested theatrical archive entry [ID: {movieId}] could not be located inside our system files.
          </p>
          
          <Link href="/watch/movies">
            <button className="bg-slate-950 hover:bg-slate-800 text-red-400 border-2 border-red-900 hover:border-red-500 font-mono font-black text-xs px-6 py-3.5 rounded-xl transition-all w-full uppercase tracking-widest shadow-inner">
              ◀ Return to Movie Directory
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto p-4 md:p-8 min-h-screen relative">
      
      {/* --- BACK TO NAV ARROW --- */}
      <Link href="/watch/movies" className="group inline-flex mb-8">
        <div className="flex items-center gap-3 bg-slate-900 border-2 border-slate-800 group-hover:border-amber-500/50 pr-5 pl-4 py-2.5 rounded-2xl transition-all shadow-md">
          <div className="w-5 h-5 bg-slate-800 group-hover:bg-amber-500/20 rounded-lg flex items-center justify-center border border-slate-700 group-hover:border-amber-500/50 transition-colors">
            <span className="text-slate-400 group-hover:text-amber-400 text-xs font-bold transform group-hover:-translate-x-0.5 transition-all">◀</span>
          </div>
          <span className="text-xs font-mono font-black text-slate-400 group-hover:text-amber-400 tracking-wider uppercase transition-colors">
            RETURN TO ARCHIVES
          </span>
        </div>
      </Link>

      {/* --- MAIN MODULE VIEWPORTS --- */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        
        {/* --- LEFT HAND VIEWPORT: PREMIUM CINEMATIC CASING --- */}
        <div className="w-full lg:w-[38%] shrink-0">
          <div className="relative w-full aspect-[2/3] bg-slate-950 rounded-[32px] overflow-hidden border-4 border-slate-800 shadow-[0_0_50px_rgba(245,158,11,0.12)] group">
            
            {/* Ultra Ball Mechanical Top Accents */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 z-20 shadow-[0_3px_12px_rgba(0,0,0,0.6)]" />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-2 bg-slate-900 rounded-b-md z-20 border-x border-b border-slate-700" />
            
            {/* Main Poster Image Component */}
            <img 
              src={movie.thumbnail || '/images/movies/placeholder.jpg'} 
              alt={movie.title} 
              className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-[1.04] transition-all duration-700 ease-out" 
            />
            
            {/* CRT Display Glass Filter Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0),rgba(255,255,255,0)_50%,rgba(0,0,0,0.15)_50%,rgba(0,0,0,0.15))] bg-[length:100%_4px] pointer-events-none z-10 mix-blend-overlay opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent z-10" />

            {/* Floating Index Identifier */}
            <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-end">
              <div className="bg-amber-500/95 backdrop-blur-md text-slate-950 font-black text-xl px-4 py-2 rounded-xl border-2 border-yellow-300 shadow-[0_4px_20px_rgba(245,158,11,0.4)] transform -rotate-1 font-mono tracking-tight">
                FILM #{String(movie.chronologicalOrder).padStart(2, '0')}
              </div>
              <div className="w-3 h-3 bg-emerald-400 rounded-full border border-white animate-ping opacity-70 mb-2" />
            </div>
          </div>
        </div>

        {/* --- RIGHT HAND VIEWPORT: DATA CORE SCANNER TERMINAL --- */}
        <div className="w-full lg:w-[62%] flex flex-col justify-between">
          
          <div>
            {/* System Status Banner Row */}
            <div className="flex flex-wrap items-center gap-2 mb-4 font-mono text-[11px] font-black">
              <span className="bg-slate-900 text-amber-400 border border-slate-800 px-3 py-1.5 rounded-lg tracking-widest shadow-inner uppercase">
                RELEASE: {movie.releaseYear}
              </span>
              <span className="bg-slate-900 text-sky-400 border border-slate-800 px-3 py-1.5 rounded-lg tracking-widest shadow-inner uppercase">
                LENGTH: {movie.runtimeMinutes} MIN
              </span>
              <div className="h-2 w-2 rounded-full bg-amber-500 ml-auto animate-pulse" />
              <span className="text-slate-500 tracking-tighter uppercase hidden sm:inline">RADAR LINK ESTABLISHED</span>
            </div>
            
            {/* Title & Interactive Verification Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6 pb-6 border-b-2 border-slate-800">
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-wide uppercase leading-tight max-w-xl">
                {movie.title}
              </h1>
              
              {/* INTERACTIVE MARK AS WATCHED LOG SWITCH */}
              <button 
                onClick={() => toggleWatched(movie.id)}
                className={`group relative overflow-hidden shrink-0 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 border-2 shadow-md flex items-center gap-3 font-mono w-full sm:w-auto justify-center ${
                  isWatched 
                    ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/40 hover:bg-emerald-900/40 shadow-[0_0_25px_rgba(16,185,129,0.15)]" 
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:border-amber-500/50 hover:text-amber-400"
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 ${
                  isWatched ? "bg-emerald-400 border-emerald-200 shadow-[0_0_10px_#34d399]" : "bg-transparent border-slate-600 group-hover:border-amber-400"
                }`} />
                <span className="relative z-10">
                  {isWatched ? "LOGGED COMPLETED" : "MARK AS WATCHED"}
                </span>
                
                {!isWatched && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                )}
              </button>
            </div>
            
            {/* Primary Lore/Summary Paragraph Console */}
            <div className="relative bg-slate-900/40 p-6 md:p-8 rounded-[24px] border border-slate-800 shadow-inner mb-8">
              <div className="absolute top-0 right-8 w-12 h-1 bg-amber-500/30 rounded-b-md" />
              <div className="absolute top-0 right-22 w-4 h-1 bg-amber-500/15 rounded-b-md" />
              
              <h3 className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest mb-3 block">
                // MOVIE LORE FILE SYNTHESIS
              </h3>
              <p className="text-slate-300 text-base md:text-lg leading-relaxed font-normal">
                {movie.description}
              </p>
            </div>
          </div>

         
            
          </div>

        </div>
      </div>

    
  );
}