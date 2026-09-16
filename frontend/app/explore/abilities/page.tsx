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
      <div className="min-h-screen bg-[#030712] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-purple-900/20 blur-[150px] rounded-full animate-pulse pointer-events-none" />
        <div className="text-center relative z-10">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-6 shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
          <div className="text-purple-400 font-bold text-lg animate-pulse uppercase tracking-[0.3em]">Compiling Genetic Data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] relative text-slate-200 px-4 py-10 md:py-16 font-sans">
      {/* Ambient Background Orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header Section */}
        <div className="text-center md:text-left mb-10">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 drop-shadow-sm">
            Abilities Database
          </h1>
          <p className="text-slate-400 mt-3 font-medium tracking-wide">
            Explore the genetic traits and passive effects of all species.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Left Side: Searchable List */}
          <div className="col-span-1 glass-panel rounded-[32px] p-5 flex flex-col h-[650px] shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
            
            <div className="relative z-10 mb-5">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Search abilities..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0f172a]/80 border border-slate-700/60 rounded-2xl pl-12 pr-4 py-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/70 transition-all shadow-inner"
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 space-y-2 relative z-10">
              {filteredAbilities.map((a) => {
                const isSelected = selectedAbility?.name === a.name;
                return (
                  <button
                    key={a.name}
                    onClick={() => handleSelectAbility(a.url)}
                    className={`w-full text-left px-5 py-4 rounded-2xl capitalize font-bold tracking-wide transition-all duration-300 relative group overflow-hidden ${
                      isSelected 
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] border-transparent' 
                        : 'bg-[#0f172a]/40 text-slate-300 border border-slate-700/50 hover:bg-[#1e293b]/60 hover:border-purple-500/30'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
                    )}
                    <span className="relative z-10">{a.name.replace(/-/g, ' ')}</span>
                  </button>
                );
              })}
              {filteredAbilities.length === 0 && (
                <div className="text-center text-slate-500 mt-10 font-medium tracking-wide">
                  No abilities found.
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Ability Details Terminal */}
          <div className="col-span-1 lg:col-span-2 glass-panel border border-slate-700/50 rounded-[32px] p-6 md:p-10 shadow-2xl flex flex-col h-[650px] relative overflow-hidden group/terminal">
            
            {/* Holographic scanning line effect */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-0 group-hover/terminal:opacity-100 group-hover/terminal:animate-scan pointer-events-none" />

            {loadingDetails ? (
              <div className="flex-1 flex flex-col items-center justify-center text-purple-400 space-y-4">
                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                <span className="animate-pulse font-bold tracking-[0.2em] uppercase text-sm">Sequencing DNA...</span>
              </div>
            ) : selectedAbility ? (
              <div className="flex flex-col h-full relative z-10 animate-fadeIn">
                
                {/* Header */}
                <div className="border-b border-slate-700/60 pb-6 mb-8 flex flex-col items-start gap-4">
                  <h2 className="text-4xl md:text-5xl font-black text-white capitalize tracking-wide drop-shadow-md">
                    {selectedAbility.name.replace(/-/g, ' ')}
                  </h2>
                  <div className="bg-purple-500/10 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-[0.15em] px-4 py-1.5 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.15)] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    Passive Trait
                  </div>
                </div>

                {/* Effect Box */}
                <div className="mb-8">
                  <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] mb-3 ml-2 flex items-center gap-2">
                    <span className="w-1 h-3 bg-purple-500 rounded-full" />
                    Field / Combat Effect
                  </p>
                  <div className="text-slate-200 text-lg md:text-xl leading-relaxed bg-[#020617]/60 p-6 md:p-8 rounded-3xl border border-slate-700/50 shadow-inner backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
                    <p className="relative z-10 font-medium">
                      {selectedAbility.flavor_text_entries.find((f: any) => f.language.name === 'en')?.flavor_text.replace(/\f/g, ' ') || 'No recorded data available in the current genetic registry.'}
                    </p>
                  </div>
                </div>

                {/* Known Carriers Grid */}
                <div className="flex-1 flex flex-col min-h-0">
                  <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] mb-3 ml-2 flex items-center gap-2">
                    <span className="w-1 h-3 bg-indigo-500 rounded-full" />
                    Known Carriers (First 20)
                  </p>
                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#020617]/40 border border-slate-700/50 rounded-3xl p-5 shadow-inner">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {selectedAbility.pokemon.slice(0, 20).map((p: any) => {
                        const pokeId = p.pokemon.url.split('/').filter(Boolean).pop();
                        return (
                          <Link 
                            href={`/pokedex/${pokeId}`} 
                            key={p.pokemon.name}
                            className="bg-[#0f172a]/80 backdrop-blur-md rounded-2xl p-3 flex flex-col items-center justify-center gap-2 border border-slate-700/50 hover:border-purple-500/50 hover:bg-[#1e293b] hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all duration-300 group cursor-pointer"
                          >
                            <div className="relative w-14 h-14">
                              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-900/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                              <img 
                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeId}.png`} 
                                alt={p.pokemon.name}
                                className="w-full h-full object-contain transform group-hover:scale-125 group-hover:-translate-y-1 transition-all duration-300 drop-shadow-lg image-pixelated"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png' }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-slate-300 group-hover:text-purple-300 capitalize truncate w-full text-center tracking-wider transition-colors">
                              {p.pokemon.name.replace(/-/g, ' ')}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 font-bold tracking-[0.15em] uppercase text-sm text-center relative z-10">
                <div className="w-24 h-24 mb-6 opacity-20 bg-[url('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dna-splicers.png')] bg-contain bg-center bg-no-repeat image-pixelated animate-pulse" />
                <p className="leading-relaxed">
                  Select an ability from the database<br/>to sequence its genetic effects.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* --- Base Typography & Rendering --- */
        .image-pixelated { image-rendering: pixelated; }

        /* --- Glassmorphism Panels --- */
        .glass-panel {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        /* --- Custom Scrollbar --- */
        .custom-scrollbar::-webkit-scrollbar { 
          width: 6px; 
        }
        .custom-scrollbar::-webkit-scrollbar-track { 
          background: rgba(2, 6, 23, 0.4); 
          border-radius: 8px; 
          margin: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: rgba(168, 85, 247, 0.3); 
          border-radius: 8px; 
          border: 1px solid rgba(255,255,255,0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
          background: rgba(168, 85, 247, 0.6); 
        }

        /* --- Animations --- */
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(650px); opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s ease-in-out infinite;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}