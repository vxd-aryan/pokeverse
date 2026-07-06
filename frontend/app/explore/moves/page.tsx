"use client";

import { useState, useEffect } from 'react';

export default function MovesDatabasePage() {
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

  // Handle Search Filter
  useEffect(() => {
    const lowerQ = searchQuery.toLowerCase();
    const filtered = moves.filter(m => m.name.includes(lowerQ));
    setFilteredMoves(filtered);
  }, [searchQuery, moves]);

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

  if (loadingInitial) {
    return <div className="text-center text-blue-400 font-bold mt-20 animate-pulse uppercase tracking-widest">Compiling Move Data...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-widest">Moves & Attacks</h1>
        <p className="text-slate-400 mt-2">Search the database of known combat maneuvers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Searchable List */}
        <div className="col-span-1 bg-slate-800 border border-slate-700 rounded-3xl p-4 shadow-xl flex flex-col h-[600px]">
          <input 
            type="text" 
            placeholder="Search moves..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors mb-4"
          />
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
            {filteredMoves.map((m) => (
              <button
                key={m.name}
                onClick={() => handleSelectMove(m.url)}
                className={`w-full text-left px-4 py-3 rounded-xl capitalize font-bold transition-all ${
                  selectedMove?.name === m.name 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {m.name.replace(/-/g, ' ')}
              </button>
            ))}
            {filteredMoves.length === 0 && (
              <p className="text-slate-500 text-center mt-4 text-sm font-medium">No moves found.</p>
            )}
          </div>
        </div>

        {/* Right Side: Move Details Terminal */}
        <div className="col-span-1 md:col-span-2 bg-slate-900/80 border-2 border-slate-700 rounded-3xl p-6 md:p-10 shadow-2xl flex flex-col items-center justify-center min-h-[600px]">
          {loadingDetails ? (
            <div className="text-blue-500 animate-pulse font-bold tracking-widest uppercase">Decrypting Move Stats...</div>
          ) : selectedMove ? (
            <div className="w-full h-full flex flex-col">
              <div className="flex justify-between items-start border-b border-slate-700 pb-6 mb-6">
                <div>
                  <h2 className="text-4xl font-black text-white capitalize">{selectedMove.name.replace(/-/g, ' ')}</h2>
                  <div className="flex gap-3 mt-4">
                    <span className="bg-slate-800 border border-slate-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded">
                      {selectedMove.type.name}
                    </span>
                    <span className="bg-slate-800 border border-slate-600 text-slate-300 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded">
                      {selectedMove.damage_class.name}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Base Power</p>
                  <p className="text-4xl font-black text-blue-400">{selectedMove.power || '--'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 text-center">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Accuracy</p>
                  <p className="text-2xl font-bold text-white">{selectedMove.accuracy ? `${selectedMove.accuracy}%` : '--'}</p>
                </div>
                <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 text-center">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Power Points (PP)</p>
                  <p className="text-2xl font-bold text-white">{selectedMove.pp}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">Combat Application Effect</p>
                <p className="text-slate-300 text-lg leading-relaxed bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                  {selectedMove.flavor_text_entries.find((f: any) => f.language.name === 'en')?.flavor_text.replace(/\f/g, ' ') || 'No combat data available.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 font-bold tracking-widest uppercase text-sm text-center">
              <span className="text-4xl block mb-4">🎯</span>
              Select a move from the database<br/>to view its combat statistics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}