"use client";

import { useState, useEffect } from 'react';

// The complete list of all 18 Pokémon types with their official colors
const typesList = [
  { name: 'normal', color: 'bg-gray-400/20 border-gray-400 text-gray-400' },
  { name: 'fire', color: 'bg-red-500/20 border-red-500 text-red-400' },
  { name: 'water', color: 'bg-blue-500/20 border-blue-500 text-blue-400' },
  { name: 'grass', color: 'bg-green-500/20 border-green-500 text-green-400' },
  { name: 'electric', color: 'bg-yellow-500/20 border-yellow-500 text-yellow-400' },
  { name: 'ice', color: 'bg-cyan-300/20 border-cyan-300 text-cyan-300' },
  { name: 'fighting', color: 'bg-orange-700/20 border-orange-700 text-orange-600' },
  { name: 'poison', color: 'bg-purple-500/20 border-purple-500 text-purple-400' },
  { name: 'ground', color: 'bg-amber-600/20 border-amber-600 text-amber-500' },
  { name: 'flying', color: 'bg-sky-400/20 border-sky-400 text-sky-400' },
  { name: 'psychic', color: 'bg-pink-500/20 border-pink-500 text-pink-400' },
  { name: 'bug', color: 'bg-lime-500/20 border-lime-500 text-lime-400' },
  { name: 'rock', color: 'bg-stone-500/20 border-stone-500 text-stone-400' },
  { name: 'ghost', color: 'bg-indigo-800/20 border-indigo-800 text-indigo-400' },
  { name: 'dragon', color: 'bg-indigo-500/20 border-indigo-500 text-indigo-400' },
  { name: 'dark', color: 'bg-slate-800/50 border-slate-500 text-slate-400' },
  { name: 'steel', color: 'bg-slate-400/20 border-slate-400 text-slate-300' },
  { name: 'fairy', color: 'bg-rose-400/20 border-rose-400 text-rose-400' },
];

export default function DynamicTypePage() {
  const [selectedType, setSelectedType] = useState('fire');
  const [pokemonList, setPokemonList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchTypePokemon() {
      setLoading(true);
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/type/${selectedType}`);
        const data = await res.json();
        
        const list = data.pokemon.map((p: any) => {
          const id = p.pokemon.url.split('/').filter(Boolean).pop();
          return {
            id,
            name: p.pokemon.name,
            image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
          };
        }).filter((p: any) => parseInt(p.id) <= 1025); // Cap at 1025 to include all 9 generations, but block 10001+ Mega forms!
        
        setPokemonList(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTypePokemon();
  }, [selectedType]);

  return (
    <div className="space-y-8 pt-2">
      <div>
        <h1 className="text-3xl font-black text-white tracking-wider uppercase">Elemental Types</h1>
        <p className="text-slate-400 mt-2">Select a type to view every matching Pokémon in uniform data format.</p>
      </div>

      {/* 18 Type Selection Tabs */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {typesList.map(t => (
          <button 
            key={t.name} 
            onClick={() => setSelectedType(t.name)}
            className={`rounded-xl p-2 text-center font-black uppercase tracking-widest text-[10px] shadow-md transition-all border-2 ${
              selectedType === t.name ? 'bg-slate-700 scale-105 border-white text-white' : t.color
            } hover:scale-105`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Grid Displaying All Loaded Pokémon */}
      <div>
        <div className="flex justify-between items-end mb-4 border-b border-slate-700 pb-2">
          <h2 className="text-xl font-bold text-slate-300 uppercase tracking-widest">
            Displaying: <span className="text-yellow-400">{selectedType}</span> Type
          </h2>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            {pokemonList.length} Found
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 font-bold animate-pulse">Scanning Pokédex Waves...</div>
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
                <h3 className="text-sm font-bold text-white capitalize tracking-wide mt-1 group-hover:text-yellow-400 transition-colors w-full truncate">
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