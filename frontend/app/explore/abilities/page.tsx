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
      <div className="flex flex-col items-center justify-center min-h-[60vh] pixel-font text-white">
        <div className="rom-panel-dark w-full max-w-md p-8 text-center animate-pulse">
          <p className="text-sm md:text-base leading-relaxed text-purple-400">
            ACCESSING PC...<br/><br/>
            COMPILING GENETIC DATA...
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
          Abilities Database
        </h1>
        <p className="text-[10px] md:text-xs text-slate-400 mt-2 drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">
          Explore the genetic traits and passive effects of all species.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
        
        {/* Left Side: Searchable List */}
        <div className="col-span-1 rom-panel-dark flex flex-col h-[600px] shadow-[8px_8px_0_rgba(0,0,0,0.5)]">
          
          <div className="p-3 border-b-4 border-slate-700 bg-slate-900 rounded-t-md">
            <input 
              type="text" 
              placeholder="SEARCH ABILITIES..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border-2 border-slate-600 rounded-none px-3 py-2 text-[10px] md:text-xs text-purple-300 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-0 transition-colors shadow-inner"
            />
          </div>

          <div className="flex-1 overflow-y-auto rom-scrollbar-dark p-2 bg-slate-800 rounded-b-md">
            {filteredAbilities.map((a) => {
              const isSelected = selectedAbility?.name === a.name;
              return (
                <button
                  key={a.name}
                  onClick={() => handleSelectAbility(a.url)}
                  className={`w-full text-left px-3 py-3 text-[10px] md:text-xs uppercase transition-all flex items-center gap-2 group ${
                    isSelected 
                      ? 'text-white font-bold bg-purple-900/50' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <span className={`text-purple-400 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                    ▶
                  </span>
                  {a.name.replace(/-/g, ' ')}
                </button>
              );
            })}
            {filteredAbilities.length === 0 && (
              <p className="text-slate-500 text-center mt-6 text-[10px] uppercase">No abilities found.</p>
            )}
          </div>
        </div>

        {/* Right Side: Ability Details Terminal */}
        <div className="col-span-1 md:col-span-2 flex flex-col h-[600px]">
          {loadingDetails ? (
            <div className="rom-panel-dark h-full flex flex-col items-center justify-center text-purple-400 text-[10px] md:text-xs text-center p-6 animate-pulse shadow-[8px_8px_0_rgba(0,0,0,0.5)]">
              ▶ SEQUENCING DNA... PLEASE WAIT.
            </div>
          ) : selectedAbility ? (
            <div className="rom-panel-dark flex flex-col h-full shadow-[8px_8px_0_rgba(0,0,0,0.5)] relative overflow-hidden bg-slate-900">
              
              {/* Header Box */}
              <div className="bg-slate-950 text-white p-4 md:p-6 border-b-4 border-slate-700">
                <h2 className="text-lg md:text-xl uppercase text-purple-300 drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)]">
                  {selectedAbility.name.replace(/-/g, ' ')}
                </h2>
                <span className="inline-block mt-3 bg-slate-800 border-2 border-slate-500 text-slate-300 text-[8px] md:text-[10px] uppercase px-2 py-1 shadow-[2px_2px_0_rgba(0,0,0,0.8)]">
                  Passive Trait
                </span>
              </div>

              {/* Description Box */}
              <div className="p-4 md:p-6 bg-slate-800 flex-shrink-0">
                <p className="text-purple-400 text-[10px] uppercase mb-2 drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">▼ Field / Combat Effect</p>
                <div className="rom-text-box-dark p-4 text-[10px] md:text-xs leading-[2] text-slate-200 bg-slate-950 border-2 border-slate-600 rounded-md shadow-inner">
                  {selectedAbility.flavor_text_entries.find((f: any) => f.language.name === 'en')?.flavor_text.replace(/\f/g, ' ') || 'No recorded data in the Pokedex.'}
                </div>
              </div>

              {/* Known Carriers Grid */}
              <div className="flex-1 flex flex-col min-h-0 bg-slate-900 border-t-4 border-slate-700 p-4 md:p-6 rounded-b-md">
                <p className="text-slate-400 text-[10px] uppercase mb-3 drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">▼ Known Carriers (First 20)</p>
                
                <div className="flex-1 overflow-y-auto rom-scrollbar-dark grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 pr-2">
                  {selectedAbility.pokemon.slice(0, 20).map((p: any) => {
                    const pokeId = p.pokemon.url.split('/').filter(Boolean).pop();
                    return (
                      <Link 
                        href={`/pokedex/${pokeId}`} 
                        key={p.pokemon.name}
                        className="bg-slate-800 border-2 border-slate-600 rounded-md p-2 flex flex-col items-center justify-center gap-2 hover:border-purple-400 hover:bg-slate-700 transition-colors group cursor-pointer shadow-[2px_2px_0_rgba(0,0,0,0.5)] hover:shadow-[2px_2px_0_rgba(168,85,247,0.3)] hover:-translate-y-0.5"
                      >
                        <div className="w-14 h-14 relative flex items-center justify-center bg-slate-950 rounded-full border border-slate-700">
                          <img 
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeId}.png`} 
                            alt={p.pokemon.name}
                            className="w-16 h-16 image-pixelated object-contain transform group-hover:scale-110 group-hover:animate-bounce transition-transform"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png' }}
                          />
                        </div>
                        <span className="text-[8px] md:text-[9px] text-slate-300 uppercase truncate w-full text-center">
                          {p.pokemon.name.replace(/-/g, ' ')}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="rom-panel-dark h-full flex flex-col items-center justify-center text-slate-500 text-[10px] md:text-xs text-center p-6 shadow-[8px_8px_0_rgba(0,0,0,0.5)] bg-slate-900">
              <span className="text-3xl block mb-6 animate-bounce text-purple-500/50">▲</span>
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
        
        .image-pixelated { 
          image-rendering: pixelated; 
          image-rendering: crisp-edges;
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
          position: absolute;
          bottom: 6px;
          right: 8px;
          font-size: 8px;
          color: #c084fc;
          animation: blink 1s step-end infinite;
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