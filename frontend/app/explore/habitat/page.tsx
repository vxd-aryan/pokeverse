"use client";

import { useState, useEffect } from 'react';

// The complete list of all 9 official PokeAPI habitats with thematic colors and icons
const habitatsList = [
  { name: 'cave', label: 'Cave', color: 'bg-stone-700/20 border-stone-500 text-stone-300' },
  { name: 'forest', label: 'Forest', color: 'bg-green-700/20 border-green-500 text-green-300' },
  { name: 'grassland', label: 'Grassland', color: 'bg-lime-500/20 border-lime-500 text-lime-400' },
  { name: 'mountain', label: 'Mountain', color: 'bg-slate-500/20 border-slate-500 text-slate-300' },
  { name: 'rare', label: 'Rare / Unknown', color: 'bg-purple-500/20 border-purple-500 text-purple-300' },
  { name: 'rough-terrain', label: 'Rough Terrain', color: 'bg-amber-700/20 border-amber-600 text-amber-500' },
  { name: 'sea', label: 'Sea', color: 'bg-blue-600/20 border-blue-500 text-blue-300' },
  { name: 'urban', label: 'Urban', color: 'bg-gray-600/20 border-gray-400 text-gray-300' },
  { name: 'waters-edge', label: 'Water\'s Edge', color: 'bg-cyan-500/20 border-cyan-400 text-cyan-300' },
];

export default function DynamicHabitatPage() {
  const [selectedHabitat, setSelectedHabitat] = useState(habitatsList[0]);
  const [pokemonList, setPokemonList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchHabitatPokemon() {
      setLoading(true);
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon-habitat/${selectedHabitat.name}`);
        const data = await res.json();
        
        const list = data.pokemon_species.map((p: any) => {
          const id = p.url.split('/').filter(Boolean).pop();
          return {
            id,
            name: p.name,
            image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
          };
        }).filter((p: any) => parseInt(p.id) <= 1025); // Cap at National Dex limit to prevent missing mega images
        
        // Sort by ID so they appear in numerical Pokédex order
        list.sort((a: any, b: any) => parseInt(a.id) - parseInt(b.id));

        setPokemonList(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchHabitatPokemon();
  }, [selectedHabitat]);

  return (
    <div className="space-y-8 pt-2">
      <div>
        <h1 className="text-3xl font-black text-white tracking-wider uppercase">Wild Habitats</h1>
        <p className="text-slate-400 mt-2">Filter the wilderness map to see which Pokémon inhabit different terrains.</p>
      </div>

      {/* Habitat Selection Tabs */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {habitatsList.map(h => (
          <button 
            key={h.name} 
            onClick={() => setSelectedHabitat(h)}
            className={`rounded-xl p-2 text-center font-black uppercase tracking-widest text-[10px] shadow-md transition-all border-2 ${
              selectedHabitat.name === h.name ? 'bg-slate-700 scale-105 border-white text-white' : h.color
            } hover:scale-105`}
          >
            {h.label}
          </button>
        ))}
      </div>

      {/* Grid Displaying All Loaded Pokémon */}
      <div>
        <div className="flex justify-between items-end mb-4 border-b border-slate-700 pb-2">
          <h2 className="text-xl font-bold text-slate-300 uppercase tracking-widest">
            Inhabitants of: <span className="text-green-400">{selectedHabitat.label}</span>
          </h2>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            {pokemonList.length} Found
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 font-bold animate-pulse">Scanning Wilderness Ecosystems...</div>
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
                <h3 className="text-sm font-bold text-white capitalize tracking-wide mt-1 group-hover:text-green-400 transition-colors w-full truncate">
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