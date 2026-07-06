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
    return <div className="text-center text-purple-400 font-bold mt-20 animate-pulse uppercase tracking-widest">Compiling Genetic Data...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-widest">Abilities Database</h1>
        <p className="text-slate-400 mt-2">Explore the genetic traits and passive effects of all species.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Searchable List */}
        <div className="col-span-1 bg-slate-800 border border-slate-700 rounded-3xl p-4 shadow-xl flex flex-col h-[600px]">
          <input 
            type="text" 
            placeholder="Search abilities..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors mb-4"
          />
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
            {filteredAbilities.map((a) => (
              <button
                key={a.name}
                onClick={() => handleSelectAbility(a.url)}
                className={`w-full text-left px-4 py-3 rounded-xl capitalize font-bold transition-all ${
                  selectedAbility?.name === a.name 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {a.name.replace(/-/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Ability Details Terminal */}
        <div className="col-span-1 md:col-span-2 bg-slate-900/80 border-2 border-slate-700 rounded-3xl p-6 md:p-10 shadow-2xl flex flex-col h-[600px]">
          {loadingDetails ? (
            <div className="flex-1 flex items-center justify-center text-purple-500 animate-pulse font-bold tracking-widest uppercase">Sequencing DNA...</div>
          ) : selectedAbility ? (
            <div className="flex flex-col h-full">
              <div className="border-b border-slate-700 pb-6 mb-6">
                <h2 className="text-4xl font-black text-white capitalize">{selectedAbility.name.replace(/-/g, ' ')}</h2>
                <span className="inline-block mt-3 bg-purple-500/20 border border-purple-500 text-purple-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded">
                  Passive Trait
                </span>
              </div>

              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">Field / Combat Effect</p>
                <p className="text-slate-300 text-lg leading-relaxed bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                  {selectedAbility.flavor_text_entries.find((f: any) => f.language.name === 'en')?.flavor_text.replace(/\f/g, ' ') || 'No recorded data.'}
                </p>
              </div>

              <div className="mt-8 flex-1 flex flex-col min-h-0">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">Known Carriers (First 20)</p>
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-800 border border-slate-700 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedAbility.pokemon.slice(0, 20).map((p: any) => {
                    const pokeId = p.pokemon.url.split('/').filter(Boolean).pop();
                    return (
                      <Link 
                        href={`/pokedex/${pokeId}`} 
                        key={p.pokemon.name}
                        className="bg-slate-900 rounded-xl p-2 flex items-center gap-3 hover:border-purple-500 border border-transparent transition-colors group cursor-pointer"
                      >
                        <img 
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeId}.png`} 
                          alt={p.pokemon.name}
                          className="w-10 h-10 transform group-hover:scale-110 transition-transform"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png' }}
                        />
                        <span className="text-xs font-bold text-slate-300 capitalize truncate">{p.pokemon.name.replace(/-/g, ' ')}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 font-bold tracking-widest uppercase text-sm text-center">
              <span className="text-4xl block mb-4">🧬</span>
              Select an ability from the database<br/>to view its genetic effects.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}