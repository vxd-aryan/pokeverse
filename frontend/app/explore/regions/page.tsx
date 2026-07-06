"use client";

import { useState, useEffect } from 'react';

// The 9 core Pokémon regions mapped to their PokeAPI Generation IDs
const regionsList = [
  { name: 'Kanto', gen: 1, color: 'bg-red-500/20 border-red-500 text-red-400' },
  { name: 'Johto', gen: 2, color: 'bg-yellow-500/20 border-yellow-500 text-yellow-400' },
  { name: 'Hoenn', gen: 3, color: 'bg-blue-500/20 border-blue-500 text-blue-400' },
  { name: 'Sinnoh', gen: 4, color: 'bg-purple-500/20 border-purple-500 text-purple-400' },
  { name: 'Unova', gen: 5, color: 'bg-gray-400/20 border-gray-400 text-gray-300' },
  { name: 'Kalos', gen: 6, color: 'bg-pink-500/20 border-pink-500 text-pink-400' },
  { name: 'Alola', gen: 7, color: 'bg-orange-500/20 border-orange-500 text-orange-400' },
  { name: 'Galar', gen: 8, color: 'bg-cyan-500/20 border-cyan-500 text-cyan-400' },
  { name: 'Paldea', gen: 9, color: 'bg-emerald-500/20 border-emerald-500 text-emerald-400' },
];

export default function DynamicRegionsPage() {
  const [selectedRegion, setSelectedRegion] = useState(regionsList[0]);
  const [pokemonList, setPokemonList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchRegionPokemon() {
      setLoading(true);
      try {
        // Fetch all species introduced in this generation/region
        const res = await fetch(`https://pokeapi.co/api/v2/generation/${selectedRegion.gen}`);
        const data = await res.json();
        
        const list = data.pokemon_species.map((p: any) => {
          const id = p.url.split('/').filter(Boolean).pop();
          return {
            id,
            name: p.name,
            image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
          };
        }).filter((p: any) => parseInt(p.id) <= 1025); // Cap at 1025 to maintain National Dex purity
        
        // PokeAPI sometimes returns species out of order, so we force sort them by ID
        list.sort((a: any, b: any) => parseInt(a.id) - parseInt(b.id));

        setPokemonList(list);
      } catch (err) {
        console.error("Failed to load region:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRegionPokemon();
  }, [selectedRegion]);

  return (
    <div className="space-y-8 pt-2">
      <div>
        <h1 className="text-3xl font-black text-white tracking-wider uppercase">Pokémon Regions</h1>
        <p className="text-slate-400 mt-2">Explore the original native species discovered across the Pokémon world.</p>
      </div>

      {/* Region Selection Tabs */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
        {regionsList.map(region => (
          <button 
            key={region.name} 
            onClick={() => setSelectedRegion(region)}
            className={`rounded-xl p-2 flex flex-col items-center justify-center font-black uppercase tracking-widest shadow-md transition-all border-2 ${
              selectedRegion.name === region.name ? 'bg-slate-700 scale-105 border-white text-white' : region.color
            } hover:scale-105`}
          >
            <span className="text-[11px]">{region.name}</span>
            <span className="text-[8px] opacity-70 mt-0.5">Gen {region.gen}</span>
          </button>
        ))}
      </div>

      {/* Grid Displaying All Loaded Pokémon */}
      <div>
        <div className="flex justify-between items-end mb-4 border-b border-slate-700 pb-2">
          <h2 className="text-xl font-bold text-slate-300 uppercase tracking-widest">
            Native to: <span className="text-white">{selectedRegion.name}</span>
          </h2>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            {pokemonList.length} Species Discovered
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 font-bold animate-pulse uppercase tracking-widest">
            Mapping Regional Topography...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {pokemonList.map((poke) => (
              <div key={poke.id} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-lg hover:border-slate-500 transition-all group p-4 flex flex-col items-center">
                <div className="h-28 w-28 relative flex justify-center items-center bg-slate-900 rounded-xl p-2 mb-3">
                  <img 
                    src={poke.image} 
                    alt={poke.name} 
                    className="h-full w-full object-contain z-10 transform group-hover:scale-110 transition-transform"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png' }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-500 self-start">#{poke.id.padStart(3, '0')}</span>
                <h3 className="text-sm font-bold text-white capitalize tracking-wide mt-1 group-hover:text-white transition-colors w-full truncate">
                  {poke.name.replace('-', ' ')}
                </h3>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}