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
                  className={`w-full text-left px-3 py-3 text-[10px] md:text-xs uppercase transition-all flex items-center gap-2 group ${
                    isSelected 
                      ? 'text-white font-bold bg-blue-900/50' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <span className={`text-blue-400 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                    ▶
                  </span>
                  {m.name.replace(/-/g, ' ')}
                </button>
              );
            })}
            {filteredMoves.length === 0 && (
              <p className="text-slate-500 text-center mt-6 text-[10px] uppercase">No moves found.</p>
            )}
          </div>
        </div>

        {/* Right Side: Move Details Terminal */}
        <div className="col-span-1 md:col-span-2 flex flex-col h-[600px]">
          {loadingDetails ? (
            <div className="rom-panel-dark h-full flex flex-col items-center justify-center text-blue-400 text-[10px] md:text-xs text-center p-6 animate-pulse shadow-[8px_8px_0_rgba(0,0,0,0.5)]">
              ▶ DECRYPTING MOVE STATS... PLEASE WAIT.
            </div>
          ) : selectedMove ? (
            <div className="rom-panel-dark flex flex-col h-full shadow-[8px_8px_0_rgba(0,0,0,0.5)] relative overflow-hidden bg-slate-900">
              
              {/* Header Box */}
              <div className="bg-slate-950 text-white p-4 md:p-6 border-b-4 border-slate-700 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                  <h2 className="text-lg md:text-xl uppercase text-blue-300 drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)]">
                    {selectedMove.name.replace(/-/g, ' ')}
                  </h2>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="bg-slate-800 border-2 border-slate-500 text-white text-[8px] md:text-[10px] uppercase px-2 py-1 shadow-[2px_2px_0_rgba(0,0,0,0.8)]">
                      TYPE: {selectedMove.type.name}
                    </span>
                    <span className="bg-slate-800 border-2 border-slate-500 text-slate-300 text-[8px] md:text-[10px] uppercase px-2 py-1 shadow-[2px_2px_0_rgba(0,0,0,0.8)]">
                      CLASS: {selectedMove.damage_class.name}
                    </span>
                  </div>
                </div>
                <div className="text-left sm:text-right bg-slate-900 p-3 border-2 border-slate-700">
                  <p className="text-slate-500 text-[8px] md:text-[10px] uppercase mb-2">Base Power</p>
                  <p className="text-xl md:text-2xl text-white drop-shadow-[2px_2px_0_rgba(59,130,246,0.5)]">
                    {selectedMove.power || '--'}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 md:p-6 bg-slate-800 flex-shrink-0">
                <div className="bg-slate-900 p-3 border-2 border-slate-600 text-center shadow-inner">
                  <p className="text-slate-500 text-[8px] md:text-[10px] uppercase mb-2">Accuracy</p>
                  <p className="text-sm md:text-base text-white">{selectedMove.accuracy ? `${selectedMove.accuracy}%` : '--'}</p>
                </div>
                <div className="bg-slate-900 p-3 border-2 border-slate-600 text-center shadow-inner">
                  <p className="text-slate-500 text-[8px] md:text-[10px] uppercase mb-2">Power Points (PP)</p>
                  <p className="text-sm md:text-base text-white">{selectedMove.pp}</p>
                </div>
              </div>

              {/* Description Box */}
              <div className="flex-1 p-4 md:p-6 bg-slate-900 border-t-4 border-slate-700 flex flex-col min-h-0">
                <p className="text-blue-400 text-[10px] uppercase mb-3 drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">▼ Combat Application</p>
                <div className="flex-1 rom-text-box-dark p-4 text-[10px] md:text-xs leading-[2] text-slate-200 bg-slate-950 border-2 border-slate-600 rounded-md shadow-inner overflow-y-auto rom-scrollbar-dark">
                  {selectedMove.flavor_text_entries.find((f: any) => f.language.name === 'en')?.flavor_text.replace(/\f/g, ' ') || 'No combat data available in records.'}
                </div>
              </div>

            </div>
          ) : (
            <div className="rom-panel-dark h-full flex flex-col items-center justify-center text-slate-500 text-[10px] md:text-xs text-center p-6 shadow-[8px_8px_0_rgba(0,0,0,0.5)] bg-slate-900">
              <span className="text-3xl block mb-6 animate-bounce text-blue-500/50">▲</span>
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
        
        /* Dark Theme Background */
        .rom-root {
          background-color: #0f172a; /* Slate 900 */
          background-image: 
            linear-gradient(45deg, #1e293b 25%, transparent 25%, transparent 75%, #1e293b 75%, #1e293b), 
            linear-gradient(45deg, #1e293b 25%, transparent 25%, transparent 75%, #1e293b 75%, #1e293b);
          background-size: 20px 20px;
          background-position: 0 0, 10px 10px;
        }

        .pixel-font { 
          font-family: 'Press Start 2P', monospace; 
          line-height: 1.4;
        }

        /* Dark ROM Dialog Box */
        .rom-panel-dark {
          background-color: #1e293b;
          border: 4px solid #475569;
          border-radius: 8px;
          box-shadow: inset -2px -2px 0px 0px rgba(0,0,0,0.5), inset 2px 2px 0px 0px rgba(255,255,255,0.1);
        }

        /* Inner Text Box for descriptions (Dark Mode) */
        .rom-text-box-dark {
          position: relative;
        }
        .rom-text-box-dark::after {
          content: '▼';
          position: sticky;
          float: right;
          bottom: 0px;
          right: 0px;
          font-size: 8px;
          color: #60a5fa;
          animation: blink 1s step-end infinite;
          margin-top: 10px;
        }

        /* Blocky Custom Scrollbar (Dark Theme) */
        .rom-scrollbar-dark::-webkit-scrollbar { width: 12px; }
        .rom-scrollbar-dark::-webkit-scrollbar-track { 
          background: #0f172a; 
          border-left: 2px solid #334155;
        }
        .rom-scrollbar-dark::-webkit-scrollbar-thumb { 
          background: #475569; 
          border: 2px solid #1e293b;
        }
        .rom-scrollbar-dark::-webkit-scrollbar-thumb:hover { 
          background: #64748b; 
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}