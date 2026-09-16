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
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] pixel-font text-slate-800">
        <div className="rom-panel w-full max-w-md p-8 text-center animate-pulse">
          <p className="text-[10px] md:text-xs leading-relaxed uppercase">
            Accessing TM/HM Case...<br/><br/>
            Compiling Move Data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rom-root min-h-screen p-4 md:p-8 pixel-font text-slate-800">
      
      {/* Header */}
      <div className="mb-6 ml-2">
        <h1 className="text-xl md:text-2xl text-white uppercase tracking-widest drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
          Moves & Attacks
        </h1>
        <p className="text-[10px] md:text-xs text-white/90 mt-2 drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">
          Search the database of known combat maneuvers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
        
        {/* Left Side: Searchable List */}
        <div className="col-span-1 rom-panel flex flex-col h-[600px] shadow-[8px_8px_0_rgba(0,0,0,0.3)]">
          
          <div className="p-3 border-b-4 border-slate-800 bg-[#e8e8e8] rounded-t-md">
            <input 
              type="text" 
              placeholder="SEARCH MOVES..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-slate-400 rounded-none px-3 py-2 text-[10px] md:text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-0 transition-colors shadow-inner"
            />
          </div>

          <div className="flex-1 overflow-y-auto rom-scrollbar p-2 bg-white rounded-b-md">
            {filteredMoves.map((m) => {
              const isSelected = selectedMove?.name === m.name;
              return (
                <button
                  key={m.name}
                  onClick={() => handleSelectMove(m.url)}
                  className={`w-full text-left px-3 py-3 text-[10px] md:text-xs uppercase transition-all flex items-center gap-2 group ${
                    isSelected 
                      ? 'text-slate-900 font-bold bg-slate-200/50' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className={`text-[#3b82f6] transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`}>
                    ▶
                  </span>
                  {m.name.replace(/-/g, ' ')}
                </button>
              );
            })}
            {filteredMoves.length === 0 && (
              <p className="text-slate-500 text-center mt-4 text-[10px] uppercase">No moves found.</p>
            )}
          </div>
        </div>

        {/* Right Side: Move Details Terminal */}
        <div className="col-span-1 md:col-span-2 flex flex-col h-[600px]">
          {loadingDetails ? (
            <div className="rom-panel h-full flex flex-col items-center justify-center text-slate-800 text-[10px] md:text-xs text-center p-6 animate-pulse shadow-[8px_8px_0_rgba(0,0,0,0.3)] bg-white">
              ▶ DECRYPTING MOVE STATS... PLEASE WAIT.
            </div>
          ) : selectedMove ? (
            <div className="rom-panel flex flex-col h-full shadow-[8px_8px_0_rgba(0,0,0,0.3)] relative overflow-hidden bg-[#e8e8e8]">
              
              {/* Header Box */}
              <div className="bg-slate-800 text-white p-4 md:p-6 border-b-4 border-slate-600 flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                  <h2 className="text-lg md:text-xl uppercase drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)]">
                    {selectedMove.name.replace(/-/g, ' ')}
                  </h2>
                  <div className="flex gap-2 mt-3">
                    <span className="bg-slate-700 border-2 border-slate-500 text-white text-[8px] md:text-[10px] uppercase px-2 py-1 shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                      TYPE / {selectedMove.type.name}
                    </span>
                    <span className="bg-slate-700 border-2 border-slate-500 text-white text-[8px] md:text-[10px] uppercase px-2 py-1 shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                      CLASS / {selectedMove.damage_class.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Combat Stats Grid */}
              <div className="p-4 md:p-6 bg-[#e8e8e8] border-b-4 border-slate-300">
                <p className="text-[#3b82f6] text-[10px] uppercase mb-3 drop-shadow-[1px_1px_0_rgba(0,0,0,0.1)]">▼ Combat Statistics</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white border-2 border-slate-400 p-3 rounded-md shadow-[2px_2px_0_rgba(0,0,0,0.1)] text-center">
                    <p className="text-slate-500 text-[8px] md:text-[10px] uppercase mb-2">POWER</p>
                    <p className="text-[12px] md:text-sm text-slate-800">{selectedMove.power || '--'}</p>
                  </div>
                  <div className="bg-white border-2 border-slate-400 p-3 rounded-md shadow-[2px_2px_0_rgba(0,0,0,0.1)] text-center">
                    <p className="text-slate-500 text-[8px] md:text-[10px] uppercase mb-2">ACCURACY</p>
                    <p className="text-[12px] md:text-sm text-slate-800">{selectedMove.accuracy ? `${selectedMove.accuracy}%` : '--'}</p>
                  </div>
                  <div className="bg-white border-2 border-slate-400 p-3 rounded-md shadow-[2px_2px_0_rgba(0,0,0,0.1)] text-center">
                    <p className="text-slate-500 text-[8px] md:text-[10px] uppercase mb-2">PP</p>
                    <p className="text-[12px] md:text-sm text-slate-800">{selectedMove.pp}</p>
                  </div>
                </div>
              </div>

              {/* Description Box */}
              <div className="p-4 md:p-6 flex-1 bg-white rounded-b-md flex flex-col">
                <p className="text-[#d33] text-[10px] uppercase mb-2 drop-shadow-[1px_1px_0_rgba(0,0,0,0.1)]">▼ Application Effect</p>
                <div className="flex-1 rom-text-box p-4 text-[10px] md:text-xs leading-[1.8] text-slate-800 bg-slate-100 border-2 border-slate-300 rounded-md shadow-inner">
                  {selectedMove.flavor_text_entries.find((f: any) => f.language.name === 'en')?.flavor_text.replace(/\f/g, ' ') || 'No combat data available.'}
                </div>
              </div>

            </div>
          ) : (
            <div className="rom-panel h-full flex flex-col items-center justify-center text-slate-500 text-[10px] md:text-xs text-center p-6 shadow-[8px_8px_0_rgba(0,0,0,0.3)] bg-white">
              <span className="text-3xl block mb-6 animate-bounce">▲</span>
              <p className="leading-relaxed">
                SELECT A MOVE<br/>FROM THE DATABASE<br/><br/>
                TO VIEW ITS COMBAT STATS.
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        .rom-root {
          background-color: #2b4c7e;
          background-image: 
            linear-gradient(45deg, #32588f 25%, transparent 25%, transparent 75%, #32588f 75%, #32588f), 
            linear-gradient(45deg, #32588f 25%, transparent 25%, transparent 75%, #32588f 75%, #32588f);
          background-size: 20px 20px;
          background-position: 0 0, 10px 10px;
        }

        .pixel-font { 
          font-family: 'Press Start 2P', monospace; 
          line-height: 1.4;
        }
        
        .rom-panel {
          background-color: #ffffff;
          border: 4px solid #1e293b;
          border-radius: 8px;
          box-shadow: inset -2px -2px 0px 0px rgba(0,0,0,0.1), inset 2px 2px 0px 0px rgba(255,255,255,1);
        }

        .rom-text-box {
          position: relative;
        }
        
        .rom-text-box::after {
          content: '▼';
          position: absolute;
          bottom: 8px;
          right: 12px;
          font-size: 10px;
          color: #d33;
          animation: blink 1s step-end infinite;
        }

        .rom-scrollbar::-webkit-scrollbar { width: 12px; }
        .rom-scrollbar::-webkit-scrollbar-track { 
          background: #e2e8f0; 
          border-left: 2px solid #cbd5e1;
        }
        .rom-scrollbar::-webkit-scrollbar-thumb { 
          background: #64748b; 
          border: 2px solid #e2e8f0;
        }
        .rom-scrollbar::-webkit-scrollbar-thumb:hover { 
          background: #475569; 
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}