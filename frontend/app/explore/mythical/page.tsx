"use client";

import { useState, useEffect } from 'react';

// Grouping all official Mythical IDs by Generation
const mythicalGenerations = [
  { name: 'Gen I', ids: [151], color: 'bg-pink-500/20 border-pink-500 text-pink-400' },
  { name: 'Gen II', ids: [251], color: 'bg-green-500/20 border-green-500 text-green-400' },
  { name: 'Gen III', ids: [385, 386], color: 'bg-teal-500/20 border-teal-500 text-teal-400' },
  { name: 'Gen IV', ids: [489, 490, 491, 492, 493], color: 'bg-purple-500/20 border-purple-500 text-purple-400' },
  { name: 'Gen V', ids: [494, 647, 648, 649], color: 'bg-orange-500/20 border-orange-500 text-orange-400' },
  { name: 'Gen VI', ids: [719, 720, 721], color: 'bg-rose-500/20 border-rose-500 text-rose-400' },
  { name: 'Gen VII', ids: [801, 802, 807, 808, 809], color: 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-400' },
  { name: 'Gen VIII', ids: [893], color: 'bg-emerald-500/20 border-emerald-500 text-emerald-400' },
  { name: 'Gen IX', ids: [1025], color: 'bg-violet-500/20 border-violet-500 text-violet-400' },
];

export default function DynamicMythicalPage() {
  const [selectedGen, setSelectedGen] = useState(mythicalGenerations[0]);
  const [mythicals, setMythicals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchMythicals() {
      setLoading(true);
      try {
        // Fetch full data for every ID in the selected generation simultaneously
        const promises = selectedGen.ids.map(id => 
          fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(res => res.json())
        );
        
        const results = await Promise.all(promises);
        
        const formattedList = results.map(p => ({
          id: p.id.toString(),
          name: p.name,
          types: p.types.map((t: any) => t.type.name),
          image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`
        }));

        setMythicals(formattedList);
      } catch (err) {
        console.error("Failed to load mythicals:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMythicals();
  }, [selectedGen]);

  return (
    <div className="space-y-8 pt-2">
      <div>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 tracking-wider uppercase">Mythical Matrix</h1>
        <p className="text-slate-400 mt-2">Elusive entities so rare that many trainers doubt their absolute existence.</p>
      </div>

      {/* Generation Selection Tabs */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
        {mythicalGenerations.map(gen => (
          <button 
            key={gen.name} 
            onClick={() => setSelectedGen(gen)}
            className={`rounded-xl p-2 text-center font-black uppercase tracking-widest text-[10px] shadow-md transition-all border-2 ${
              selectedGen.name === gen.name ? 'bg-slate-700 scale-105 border-pink-400 text-pink-400' : gen.color
            } hover:scale-105`}
          >
            {gen.name}
          </button>
        ))}
      </div>

      {/* Grid Displaying All Loaded Mythicals */}
      <div>
        <div className="flex justify-between items-end mb-4 border-b border-slate-700 pb-2">
          <h2 className="text-xl font-bold text-slate-300 uppercase tracking-widest">
            Displaying: <span className="text-pink-400">{selectedGen.name}</span> Mythicals
          </h2>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            {mythicals.length} Entities
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-pink-600/50 font-black tracking-widest uppercase animate-pulse">
            Chasing Illusions...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {mythicals.map((poke) => (
              <div key={poke.id} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-lg hover:border-pink-500 transition-all group p-4 flex flex-col items-center">
                
                <div className="h-28 w-28 relative flex justify-center items-center bg-slate-900 rounded-xl p-2 mb-3">
                  {/* Subtle pink/purple glow behind the mythical */}
                  <div className="absolute inset-0 bg-pink-500 opacity-0 group-hover:opacity-20 rounded-xl blur-xl transition-opacity"></div>
                  <img 
                    src={poke.image} 
                    alt={poke.name} 
                    className="h-full w-full object-contain z-10 transform group-hover:scale-110 transition-transform"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png' }}
                  />
                </div>
                
                <span className="text-[10px] font-bold text-slate-500 self-start">#{poke.id.padStart(3, '0')}</span>
                
                <h3 className="text-sm font-bold text-white capitalize tracking-wide mt-1 group-hover:text-pink-400 transition-colors w-full truncate text-left">
                  {poke.name.replace('-', ' ')}
                </h3>
                
                {/* Dynamically mapped type badges */}
                <div className="flex gap-1 w-full mt-2">
                  {poke.types.map((type: string) => (
                    <span key={type} className="text-[8px] font-black text-slate-300 uppercase tracking-widest bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                      {type}
                    </span>
                  ))}
                </div>
                
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}