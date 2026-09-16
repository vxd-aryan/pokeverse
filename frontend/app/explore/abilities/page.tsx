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
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
        <div className="text-purple-400 font-bold animate-pulse uppercase tracking-widest text-sm">
          Compiling Genetic Data...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
          Abilities Database
        </h1>
        <p className="text-slate-400 max-w-xl">
          Explore the genetic traits and passive effects of all species.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Left Side: Searchable List */}
        <div className="col-span-1 bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-[24px] p-5 shadow-2xl flex flex-col h-[650px] relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-[-50px] left-[-50px] w-40 h-40 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative mb-5 z-10">
            <input 
              type="text" 
              placeholder="Search abilities..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-700/80 rounded-xl px-4 py-3.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/60 transition-all shadow-inner"
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 space-y-2 z-10">
            {filteredAbilities.map((a) => {
              const isSelected = selectedAbility?.name === a.name;
              return (
                <button
                  key={a.name}
                  onClick={() => handleSelectAbility(a.url)}
                  className={`w-full text-left px-4 py-3 rounded-xl capitalize font-semibold tracking-wide transition-all duration-200 ${
                    isSelected 
                      ? 'bg-purple-600/20 border border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                      : 'bg-slate-800/40 border border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {a.name.replace(/-/g, ' ')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Ability Details Terminal */}
        <div className="col-span-1 lg:col-span-2 bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-[24px] p-6 md:p-10 shadow-2xl flex flex-col h-[650px] relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute bottom-[-50px] right-[-50px] w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>

          {loadingDetails ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              <div className="text-indigo-400 animate-pulse font-bold tracking-widest uppercase text-sm">
                Sequencing DNA...
              </div>
            </div>
          ) : selectedAbility ? (
            <div className="flex flex-col h-full relative z-10">
              <div className="border-b border-slate-800/80 pb-6 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h2 className="text-4xl md:text-5xl font-black text-slate-100 capitalize tracking-tight">
                    {selectedAbility.name.replace(/-/g, ' ')}
                  </h2>
                </div>
                <span className="inline-flex shrink-0 items-center justify-center bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg">
                  Passive Trait
                </span>
              </div>

              <div>
                <h3 className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  Field / Combat Effect
                </h3>
                <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-5 md:p-6 shadow-inner">
                  <p className="text-slate-300 text-base md:text-lg leading-relaxed font-medium">
                    {selectedAbility.flavor_text_entries.find((f: any) => f.language.name === 'en')?.flavor_text.replace(/\f/g, ' ') || 'No recorded data available in the current database.'}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex-1 flex flex-col min-h-0">
                <h3 className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  Known Carriers (First 20)
                </h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 shadow-inner">
                  {selectedAbility.pokemon.slice(0, 20).map((p: any) => {
                    const pokeId = p.pokemon.url.split('/').filter(Boolean).pop();
                    return (
                      <Link 
                        href={`/pokedex/${pokeId}`} 
                        key={p.pokemon.name}
                        className="bg-slate-800/50 hover:bg-slate-700/80 rounded-xl p-3 flex flex-col items-center gap-2 border border-slate-700/30 hover:border-indigo-500/50 transition-all duration-300 group cursor-pointer"
                      >
                        <div className="w-14 h-14 relative flex items-center justify-center">
                          <img 
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeId}.png`} 
                            alt={p.pokemon.name}
                            className="w-full h-full object-contain filter drop-shadow-md transform group-hover:scale-110 transition-transform duration-300"
                            style={{ imageRendering: 'pixelated' }}
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png' }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-300 capitalize truncate w-full text-center group-hover:text-indigo-300 transition-colors">
                          {p.pokemon.name.replace(/-/g, ' ')}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 font-medium tracking-widest uppercase text-sm text-center opacity-70">
              <span className="text-5xl block mb-6 drop-shadow-lg">🧬</span>
              Select an ability from the database<br/>to view its genetic effects.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}