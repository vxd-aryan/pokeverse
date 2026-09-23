"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function MovesContent() {
  const searchParams = useSearchParams();
  const initialMoveParam = searchParams.get('move') || searchParams.get('selected');

  const [moves, setMoves] = useState<any[]>([]);
  const [filteredMoves, setFilteredMoves] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedMove, setSelectedMove] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Fetch the master list of all moves
  useEffect(() => {
    async function fetchMoves() {
      try {
        const res = await fetch('https://pokeapi.co/api/v2/move?limit=1000');
        const data = await res.json();
        setMoves(data.results);
        setFilteredMoves(data.results);
      } catch (err) {
        console.error("Failed to fetch moves", err);
      } finally {
        setLoadingInitial(false);
      }
    }
    fetchMoves();
  }, []);

  // Fetch specific move details
  const handleSelectMove = async (url: string) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(url);
      const data = await res.json();
      setSelectedMove(data);
    } catch (err) {
      console.error("Failed to fetch move details", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // If a move URL param is provided (from Pokedex click), select it automatically
  useEffect(() => {
    if (initialMoveParam) {
      handleSelectMove(`https://pokeapi.co/api/v2/move/${initialMoveParam.toLowerCase()}`);
    }
  }, [initialMoveParam]);

  // Handle Search Filter
  useEffect(() => {
    const lowerQ = searchQuery.toLowerCase();
    const filtered = moves.filter(m => m.name.includes(lowerQ));
    setFilteredMoves(filtered);
  }, [searchQuery, moves]);

  if (loadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] pixel-font text-white">
        <div className="rom-panel-dark w-full max-w-md p-8 text-center animate-pulse">
          <p className="text-sm md:text-base leading-relaxed text-blue-400">
            CONNECTING TO NETWORK...<br/><br/>
            COMPILING MOVE DATA...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rom-root min-h-screen p-4 md:p-8 pixel-font text-slate-200">

      {/* Header */}
      <div className="mb-6 ml-2">
        <h1 className="text-xl md:text-2xl text-white uppercase tracking-widest drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
          Moves & Attacks
        </h1>
        <p className="text-[10px] md:text-xs text-slate-400 mt-2 drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">
          Search the database of known combat maneuvers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">

        {/* Left Side: Searchable List */}
        <div className="col-span-1 rom-panel-dark flex flex-col h-[600px] shadow-[8px_8px_0_rgba(0,0,0,0.5)]">

          <div className="p-3 border-b-4 border-slate-700 bg-slate-900 rounded-t-md">
            <input 
              type="text" 
              placeholder="SEARCH MOVES..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border-2 border-slate-600 rounded-none px-3 py-2 text-[10px] md:text-xs text-blue-300 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-0 transition-colors shadow-inner"
            />
          </div>

          <div className="flex-1 overflow-y-auto rom-scrollbar-dark p-2 bg-slate-800 rounded-b-md">
            {filteredMoves.map((m) => {
              const isSelected = selectedMove?.name === m.name;
              return (
                <button
                  key={m.name}
                  onClick={() => handleSelectMove(m.url)}
                  className={`w-full text-left px-3 py-3 text-[10px] md:text-xs uppercase transition-all flex items-center gap-2 group mb-1 rounded ${
                    isSelected 
                      ? 'text-white font-bold bg-blue-900/50 border-l-4 border-blue-400' 
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <span>{m.name.replace(/-/g, ' ')}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Move Detail Card */}
        <div className="col-span-1 md:col-span-2 rom-panel-dark h-[600px] p-6 flex flex-col justify-between overflow-y-auto shadow-[8px_8px_0_rgba(0,0,0,0.5)]">
          {loadingDetails ? (
            <div className="h-full flex items-center justify-center text-blue-400 animate-pulse text-xs">
              LOADING MOVE SPECS...
            </div>
          ) : selectedMove ? (
            <div className="space-y-6">
              {/* Move Header */}
              <div className="border-b-4 border-slate-700 pb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg md:text-xl text-yellow-400 uppercase tracking-wider">
                    {selectedMove.name.replace(/-/g, ' ')}
                  </h2>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase">
                    ID: #{selectedMove.id} | Class: {selectedMove.damage_class?.name || 'N/A'}
                  </p>
                </div>
                {selectedMove.type && (
                  <span className="px-3 py-1 bg-slate-900 border-2 border-slate-600 text-xs font-bold uppercase tracking-wider text-blue-300">
                    {selectedMove.type.name}
                  </span>
                )}
              </div>

              {/* Combat Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900 p-3 border-2 border-slate-700 text-center">
                  <div className="text-[9px] text-slate-400 uppercase">Power</div>
                  <div className="text-sm text-white font-bold mt-1">
                    {selectedMove.power !== null ? selectedMove.power : '—'}
                  </div>
                </div>
                <div className="bg-slate-900 p-3 border-2 border-slate-700 text-center">
                  <div className="text-[9px] text-slate-400 uppercase">Accuracy</div>
                  <div className="text-sm text-white font-bold mt-1">
                    {selectedMove.accuracy !== null ? `${selectedMove.accuracy}%` : '—'}
                  </div>
                </div>
                <div className="bg-slate-900 p-3 border-2 border-slate-700 text-center">
                  <div className="text-[9px] text-slate-400 uppercase">PP</div>
                  <div className="text-sm text-white font-bold mt-1">
                    {selectedMove.pp !== null ? selectedMove.pp : '—'}
                  </div>
                </div>
                <div className="bg-slate-900 p-3 border-2 border-slate-700 text-center">
                  <div className="text-[9px] text-slate-400 uppercase">Priority</div>
                  <div className="text-sm text-white font-bold mt-1">
                    {selectedMove.priority}
                  </div>
                </div>
              </div>

              {/* Effect Description */}
              <div className="bg-slate-900/80 p-4 border-2 border-slate-700 space-y-2">
                <h3 className="text-xs text-blue-400 uppercase tracking-wider">Effect Description</h3>
                <p className="text-[11px] md:text-xs text-slate-300 leading-relaxed font-sans">
                  {selectedMove.effect_entries?.find((e: any) => e.language.name === 'en')?.effect.replace(/\$effect_chance%/g, `${selectedMove.effect_chance}%`) ||
                    selectedMove.flavor_text_entries?.find((f: any) => f.language.name === 'en')?.flavor_text ||
                    "No operational description available."}
                </p>
              </div>

              {/* Target & Stat Changes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900 p-3 border-2 border-slate-700">
                  <div className="text-[9px] text-slate-400 uppercase">Target</div>
                  <div className="text-xs text-slate-200 mt-1 capitalize">
                    {selectedMove.target?.name.replace(/-/g, ' ') || 'N/A'}
                  </div>
                </div>
                <div className="bg-slate-900 p-3 border-2 border-slate-700">
                  <div className="text-[9px] text-slate-400 uppercase">Stat Changes</div>
                  <div className="text-xs text-slate-200 mt-1">
                    {selectedMove.stat_changes?.length > 0 
                      ? selectedMove.stat_changes.map((sc: any) => `${sc.stat.name}: ${sc.change > 0 ? '+' : ''}${sc.change}`).join(', ')
                      : 'None'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
              <div className="text-xs uppercase">Select a move from the registry</div>
              <div className="text-[10px] text-slate-600">Details will display here</div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function MovesDatabasePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] pixel-font text-white">
        <div className="rom-panel-dark w-full max-w-md p-8 text-center animate-pulse">
          <p className="text-sm md:text-base leading-relaxed text-blue-400">
            LOADING MOVES ARCHIVE...
          </p>
        </div>
      </div>
    }>
      <MovesContent />
    </Suspense>
  );
}