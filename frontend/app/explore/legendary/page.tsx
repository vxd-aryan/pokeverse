"use client";

import { useState, useEffect } from 'react';

// Grouping all official Legendary IDs by Generation
const legendaryGenerations = [
  { name: 'Gen I', ids: [144, 145, 146, 150], color: 'bg-red-500/20 border-red-500 text-red-400' },
  { name: 'Gen II', ids: [243, 244, 245, 249, 250], color: 'bg-yellow-500/20 border-yellow-500 text-yellow-400' },
  { name: 'Gen III', ids: [377, 378, 379, 380, 381, 382, 383, 384], color: 'bg-blue-500/20 border-blue-500 text-blue-400' },
  { name: 'Gen IV', ids: [480, 481, 482, 483, 484, 485, 486, 487, 488], color: 'bg-purple-500/20 border-purple-500 text-purple-400' },
  { name: 'Gen V', ids: [638, 639, 640, 641, 642, 643, 644, 645, 646], color: 'bg-gray-400/20 border-gray-400 text-gray-300' },
  { name: 'Gen VI', ids: [716, 717, 718], color: 'bg-pink-500/20 border-pink-500 text-pink-400' },
  { name: 'Gen VII', ids: [772, 773, 785, 786, 787, 788, 789, 790, 791, 792, 800], color: 'bg-orange-500/20 border-orange-500 text-orange-400' },
  { name: 'Gen VIII', ids: [888, 889, 890, 892, 894, 895, 896, 897, 898, 905], color: 'bg-cyan-500/20 border-cyan-500 text-cyan-400' },
  { name: 'Gen IX', ids: [1001, 1002, 1003, 1004, 1007, 1008, 1014, 1015, 1016, 1017, 1024], color: 'bg-emerald-500/20 border-emerald-500 text-emerald-400' },
];

export default function DynamicLegendaryPage() {
  const [selectedGen, setSelectedGen] = useState(legendaryGenerations[0]);
  const [legendaries, setLegendaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchLegendaries() {
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
          // Extract primary and secondary types to display them cleanly
          types: p.types.map((t: any) => t.type.name),
          image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`
        }));

        setLegendaries(formattedList);
      } catch (err) {
        console.error("Failed to load legendaries:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLegendaries();
  }, [selectedGen]);

  return (
    <div className="space-y-8 pt-2">
      <div>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 tracking-wider uppercase">Legendary Matrix</h1>
        <p className="text-slate-400 mt-2">Every godly entity cataloged in pristine Pokédex format profiles.</p>
      </div>

      {/* Generation Selection Tabs */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
        {legendaryGenerations.map(gen => (
          <button 
            key={gen.name} 
            onClick={() => setSelectedGen(gen)}
            className={`rounded-xl p-2 text-center font-black uppercase tracking-widest text-[10px] shadow-md transition-all border-2 ${
              selectedGen.name === gen.name ? 'bg-slate-700 scale-105 border-yellow-400 text-yellow-400' : gen.color
            } hover:scale-105`}
          >
            {gen.name}
          </button>
        ))}
      </div>

      {/* Grid Displaying All Loaded Legendaries */}
      <div>
        <div className="flex justify-between items-end mb-4 border-b border-slate-700 pb-2">
          <h2 className="text-xl font-bold text-slate-300 uppercase tracking-widest">
            Displaying: <span className="text-yellow-400">{selectedGen.name}</span> Legendaries
          </h2>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            {legendaries.length} Entities
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-yellow-600/50 font-black tracking-widest uppercase animate-pulse">
            Decrypting Ancient Texts...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {legendaries.map((poke) => (
              <div key={poke.id} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-lg hover:border-yellow-500 transition-all group p-4 flex flex-col items-center">
                
                <div className="h-28 w-28 relative flex justify-center items-center bg-slate-900 rounded-xl p-2 mb-3">
                  {/* Subtle golden glow behind the legendary */}
                  <div className="absolute inset-0 bg-yellow-500 opacity-0 group-hover:opacity-20 rounded-xl blur-xl transition-opacity"></div>
                  <img 
                    src={poke.image} 
                    alt={poke.name} 
                    className="h-full w-full object-contain z-10 transform group-hover:scale-110 transition-transform"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png' }}
                  />
                </div>
                
                <span className="text-[10px] font-bold text-slate-500 self-start">#{poke.id.padStart(3, '0')}</span>
                
                <h3 className="text-sm font-bold text-white capitalize tracking-wide mt-1 group-hover:text-yellow-400 transition-colors w-full truncate text-left">
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