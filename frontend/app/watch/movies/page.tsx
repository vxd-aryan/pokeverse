"use client";

import Link from 'next/link';
import { getMoviesList } from '@/lib/animeService';
import { useWatchStore } from '@/store/useWatchStore'; // ◀ Imported state

export default function MoviesPage() {
  const movies = getMoviesList();
  
  // Hook into our global store
  const { watchedIds } = useWatchStore();

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-300">
      <div className="mb-8 border-b border-slate-800 pb-6">
        <h2 className="text-3xl font-black text-white">The Movie Library</h2>
        <p className="text-slate-400 text-sm mt-1">Theatrical entries running directly through our data service middleware.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {movies.map((movie) => {
          const isWatched = watchedIds.includes(movie.id); // Check status

          return (
            <div key={movie.id} className={`bg-slate-900/20 border rounded-2xl p-5 flex flex-col justify-between transition-all group relative overflow-hidden ${isWatched ? 'border-emerald-500/40' : 'border-slate-800 hover:border-amber-500/30'}`}>
              
              {/* Subtle watched background overlay */}
              {isWatched && <div className="absolute inset-0 bg-emerald-500/5 z-0 pointer-events-none" />}

              <div className="relative z-10">
                <div className="flex justify-between items-start gap-4 mb-3">
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${isWatched ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                    {isWatched ? '✓ Watched' : `Movie #${movie.chronologicalOrder}`}
                  </span>
                  <span className="text-xs font-mono text-slate-500">{movie.runtimeMinutes} mins • {movie.releaseYear}</span>
                </div>

                <h3 className={`text-lg font-bold mb-2 transition-colors ${isWatched ? 'text-slate-300 group-hover:text-emerald-400' : 'text-white group-hover:text-amber-400'}`}>
                  {movie.title}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-4 line-clamp-3">
                  {movie.description}
                </p>
              </div>

              <div className="border-t border-slate-800/60 pt-3 mt-2 text-xs flex justify-between items-center relative z-10">
                <span className="text-slate-500 font-mono text-[11px]">Stars: {movie.featuredLegendary}</span>
                <Link href={`/watch/movies/${movie.id}`}>
                  <button className={`${isWatched ? 'text-emerald-400 hover:text-emerald-300' : 'text-amber-400 hover:text-amber-300'} font-bold transition-colors`}>
                    Details ➔
                  </button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}