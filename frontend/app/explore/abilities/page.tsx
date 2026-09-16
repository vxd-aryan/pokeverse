"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AbilitiesDatabasePage() {
  const [abilities, setAbilities] = useState<any[]>([]);
  const [filteredAbilities, setFilteredAbilities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedAbility, setSelectedAbility] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Fetch master list of abilities
  useEffect(() => {
    async function fetchAbilities() {
      try {
        const res = await fetch('https://pokeapi.co/api/v2/ability?limit=500');
        const data = await res.json();
        // Filter out weird internal api abilities that have huge IDs
        const validAbilities = data.results.filter((a: any) => {
          const id = parseInt(a.url.split('/').filter(Boolean).pop());
          return id < 10000;
        });
        setAbilities(validAbilities);
        setFilteredAbilities(validAbilities);
      } catch (err) {
        console.error("Failed to fetch abilities", err);
      } finally {
        setLoadingInitial(false);
      }
    }
    fetchAbilities();
  }, []);

  // Search Filter
  useEffect(() => {
    const lowerQ = searchQuery.toLowerCase();
    const filtered = abilities.filter(a => a.name.includes(lowerQ));
    setFilteredAbilities(filtered);
  }, [searchQuery, abilities]);

  // Fetch ability details
  const handleSelectAbility = async (url: string) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(url);
      const data = await res.json();
      setSelectedAbility(data);
    } catch (err) {
      console.error("Failed to fetch ability details", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] pixel-font text-slate-800">
        <div className="rom-panel w-full max-w-md p-8 text-center animate-pulse">
          <p className="text-sm md:text-base leading-relaxed">
            ACCESSING PC...<br/><br/>
            COMPILING GENETIC DATA...
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
          Abilities Database
        </h1>
        <p className="text-[10px] md:text-xs text-white/90 mt-2 drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">
          Explore the genetic traits and passive effects of all species.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
        
        {/* Left Side: Searchable List */}
        <div className="col-span-1 rom-panel flex flex-col h-[600px] shadow-[8px_8px_0_rgba(0,0,0,0.3)]">
          
          <div className="p-3 border-b-4 border-slate-800 bg-[#e8e8e8] rounded-t-md">
            <input 
              type="text" 
              placeholder="SEARCH..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-slate-400 rounded-none px-3 py-2 text-[10px] md:text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-0 transition-colors shadow-inner"
            />
          </div>

          <div className="flex-1 overflow-y-auto rom-scrollbar p-2 bg-white rounded-b-md">
            {filteredAbilities.map((a) => {
              const isSelected = selectedAbility?.name === a.name;
              return (
                <button
                  key={a.name}
                  onClick={() => handleSelectAbility(a.url)}
                  className={`w-full text-left px-3 py-3 text-[10px] md:text-xs uppercase transition-all flex items-center gap-2 group ${
                    isSelected 
                      ? 'text-slate-900 font-bold bg-slate-200/50' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className={`text-[#d33] transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`}>
                    ▶
                  </span>
                  {a.name.replace(/-/g, ' ')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Ability Details Terminal */}
        <div className="col-span-1 md:col-span-2 flex flex-col h-[600px]">
          {loadingDetails ? (
            <div className="rom-panel h-full flex flex-col items-center justify-center text-slate-800 text-[10px] md:text-xs text-center p-6 animate-pulse shadow-[8px_8px_0_rgba(0,0,0,0.3)]">
              ▶ SEQUENCING DNA... PLEASE WAIT.
            </div>
          ) : selectedAbility ? (
            <div className="rom-panel flex flex-col h-full shadow-[8px_8px_0_rgba(0,0,0,0.3)] relative overflow-hidden">
              
              {/* Header Box */}
              <div className="bg-slate-800 text-white p-4 md:p-6 border-b-4 border-slate-600">
                <h2 className="text-lg md:text-xl uppercase drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)]">
                  {selectedAbility.name.replace(/-/g, ' ')}
                </h2>
                <span className="inline-block mt-3 bg-[#d33] border-2 border-white text-white text-[8px] md:text-[10px] uppercase px-2 py-1 shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                  Passive Trait
                </span>
              </div>

              {/* Description Box */}
              <div className="p-4 md:p-6 bg-white flex-shrink-0">
                <p className="text-[#d33] text-[10px] uppercase mb-2 drop-shadow-[1px_1px_0_rgba(0,0,0,0.1)]">▼ Effect</p>
                <div className="rom-text-box p-4 text-[10px] md:text-xs leading-[1.8] text-slate-800 bg-slate-100 border-2 border-slate-300 rounded-md shadow-inner">
                  {selectedAbility.flavor_text_entries.find((f: any) => f.language.name === 'en')?.flavor_text.replace(/\f/g, ' ') || 'No recorded data in the Pokedex.'}
                </div>
              </div>

              {/* Known Carriers Grid */}
              <div className="flex-1 flex flex-col min-h-0 bg-[#e8e8e8] border-t-4 border-slate-300 p-4 md:p-6 rounded-b-md">
                <p className="text-[#3b82f6] text-[10px] uppercase mb-3 drop-shadow-[1px_1px_0_rgba(0,0,0,0.1)]">▼ Known Carriers</p>
                
                <div className="flex-1 overflow-y-auto rom-scrollbar grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 pr-2">
                  {selectedAbility.pokemon.slice(0, 20).map((p: any) => {
                    const pokeId = p.pokemon.url.split('/').filter(Boolean).pop();
                    return (
                      <Link 
                        href={`/pokedex/${pokeId}`} 
                        key={p.pokemon.name}
                        className="bg-white border-2 border-slate-300 rounded-md p-2 flex flex-col items-center justify-center gap-2 hover:border-[#d33] hover:bg-red-50 transition-colors group cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,0.1)] hover:shadow-[2px_2px_0_rgba(211,51,51,0.3)] hover:-translate-y-0.5"
                      >
                        <div className="w-14 h-14 relative flex items-center justify-center bg-slate-50 rounded-full border border-slate-200">
                          <img 
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeId}.png`} 
                            alt={p.pokemon.name}
                            className="w-16 h-16 image-pixelated object-contain transform group-hover:scale-110 group-hover:animate-bounce transition-transform"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png' }}
                          />
                        </div>
                        <span className="text-[8px] md:text-[9px] text-slate-700 uppercase truncate w-full text-center">
                          {p.pokemon.name.replace(/-/g, ' ')}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="rom-panel h-full flex flex-col items-center justify-center text-slate-500 text-[10px] md:text-xs text-center p-6 shadow-[8px_8px_0_rgba(0,0,0,0.3)] bg-white">
              <span className="text-3xl block mb-6 animate-bounce">▲</span>
              <p className="leading-relaxed">
                SELECT AN ABILITY<br/>FROM THE DATABASE<br/><br/>
                TO VIEW ITS GENETIC EFFECTS.
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        .rom-root {
          background-color: #2b4c7e; /* Classic GBA Menu Blue */
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
        
        .image-pixelated { 
          image-rendering: pixelated; 
          image-rendering: crisp-edges;
        }

        /* Standard ROM Dialog Box */
        .rom-panel {
          background-color: #ffffff;
          border: 4px solid #1e293b;
          border-radius: 8px;
          box-shadow: inset -2px -2px 0px 0px rgba(0,0,0,0.1), inset 2px 2px 0px 0px rgba(255,255,255,1);
        }

        /* Inner Text Box for descriptions */
        .rom-text-box {
          position: relative;
        }
        .rom-text-box::after {
          content: '▼';
          position: absolute;
          bottom: 4px;
          right: 8px;
          font-size: 8px;
          color: #d33;
          animation: blink 1s step-end infinite;
        }

        /* Blocky Custom Scrollbar */
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