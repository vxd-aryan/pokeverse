"use client";

import { useState, useEffect } from 'react';

// PokeAPI Evolution Chains are sequential. We map the ID ranges to their respective Generations.
const genEvolutionRanges = [
  { name: 'Gen I', min: 1, max: 77, color: 'bg-red-500/20 border-red-500 text-red-400' },
  { name: 'Gen II', min: 78, max: 134, color: 'bg-yellow-500/20 border-yellow-500 text-yellow-400' },
  { name: 'Gen III', min: 135, max: 212, color: 'bg-blue-500/20 border-blue-500 text-blue-400' },
  { name: 'Gen IV', min: 213, max: 257, color: 'bg-purple-500/20 border-purple-500 text-purple-400' },
  { name: 'Gen V', min: 258, max: 334, color: 'bg-gray-400/20 border-gray-400 text-gray-300' },
  { name: 'Gen VI', min: 335, max: 376, color: 'bg-pink-500/20 border-pink-500 text-pink-400' },
  { name: 'Gen VII', min: 377, max: 427, color: 'bg-orange-500/20 border-orange-500 text-orange-400' },
  { name: 'Gen VIII', min: 428, max: 475, color: 'bg-cyan-500/20 border-cyan-500 text-cyan-400' },
  { name: 'Gen IX', min: 476, max: 539, color: 'bg-emerald-500/20 border-emerald-500 text-emerald-400' },
];

export default function DynamicEvolutionPage() {
  const [selectedGen, setSelectedGen] = useState(genEvolutionRanges[0]);
  const [evolutionList, setEvolutionList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchAllChainsForGen() {
      setLoading(true);
      try {
        // Generate an array of fetch promises for the selected Generation's chain IDs
        const promises = [];
        for (let i = selectedGen.min; i <= selectedGen.max; i++) {
          promises.push(
            fetch(`https://pokeapi.co/api/v2/evolution-chain/${i}/`)
              .then(res => res.ok ? res.json() : null)
              .catch(() => null) // Catch any deleted/missing chain IDs gracefully
          );
        }
        
        const results = await Promise.all(promises);
        const formattedChains: any[] = [];

        results.forEach((data) => {
          if (!data || !data.chain) return;
          
          // If the base Pokémon doesn't evolve at all, skip it (like PokémonDB does)
          if (data.chain.evolves_to.length === 0) return;

          const stagesArr: any[][] = [];
          
          // Recursive function to flatten the tree into vertical columns (handles branches perfectly)
          const parseChain = (node: any, currentStage: number) => {
            if (!stagesArr[currentStage]) stagesArr[currentStage] = [];
            
            const id = node.species.url.split('/').filter(Boolean).pop();
            
            stagesArr[currentStage].push({
              id,
              name: node.species.name,
              image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
            });

            // Parse all next evolutions (if any) and push them to the next column
            if (node.evolves_to && node.evolves_to.length > 0) {
              node.evolves_to.forEach((child: any) => parseChain(child, currentStage + 1));
            }
          };

          parseChain(data.chain, 0);
          formattedChains.push({ id: data.id, stages: stagesArr });
        });

        setEvolutionList(formattedChains);
      } catch (err) {
        console.error("Error fetching evolution chains:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAllChainsForGen();
  }, [selectedGen]);

  return (
    <div className="space-y-8 pt-2 pb-12">
      <div>
        <h1 className="text-3xl font-black text-white tracking-wider uppercase">Evolution Matrices</h1>
        <p className="text-slate-400 mt-2">Comprehensive genetic pathways grouped by the generation they were introduced.</p>
        <p className="text-xs text-slate-500 mt-1 italic">* Note: Families containing later-gen evolutions (like Pichu or Sylveon) are grouped with their original base chain.</p>
      </div>

      {/* Generation Selection Tabs */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
        {genEvolutionRanges.map(gen => (
          <button 
            key={gen.name} 
            onClick={() => setSelectedGen(gen)}
            className={`rounded-xl p-2 text-center font-black uppercase tracking-widest text-[10px] shadow-md transition-all border-2 ${
              selectedGen.name === gen.name ? 'bg-slate-700 scale-105 border-white text-white' : gen.color
            } hover:scale-105`}
          >
            {gen.name}
          </button>
        ))}
      </div>

      {/* Display Evolution Families */}
      <div>
        <div className="flex justify-between items-end mb-6 border-b border-slate-700 pb-2">
          <h2 className="text-xl font-bold text-slate-300 uppercase tracking-widest">
            Family Trees: <span className="text-white">{selectedGen.name}</span>
          </h2>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            {evolutionList.length} Families
          </span>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500 font-bold animate-pulse uppercase tracking-widest">
            Sequencing Generation DNA... (This may take a moment)
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {evolutionList.map((chain) => (
              
              /* Single Evolution Family Card */
              <div key={chain.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl overflow-x-auto">
                <div className="flex flex-row items-center justify-start min-w-max gap-4 sm:gap-8">
                  
                  {chain.stages.map((stageGroup: any[], index: number) => (
                    <div key={index} className="flex flex-row items-center gap-4 sm:gap-8">
                      
                      {/* Column for Pokémon in this specific stage */}
                      <div className="flex flex-col gap-4 justify-center">
                        {stageGroup.map((poke) => (
                          <div key={poke.id} className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-lg hover:border-slate-400 transition-all group p-4 flex flex-col items-center w-36 sm:w-44">
                            <div className="h-20 w-20 sm:h-28 sm:w-28 relative flex justify-center items-center mb-3">
                              <div className={`absolute inset-0 opacity-10 rounded-full blur-xl ${index === 0 ? 'bg-white' : index === 1 ? 'bg-blue-400' : 'bg-purple-500'}`}></div>
                              <img 
                                src={poke.image} 
                                alt={poke.name} 
                                className="h-full w-full object-contain relative z-10 transform group-hover:scale-110 transition-transform"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png' }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">#{poke.id.padStart(3, '0')}</span>
                            <h3 className="text-sm font-bold text-white capitalize tracking-wide mt-1 truncate">
                              {poke.name.replace('-', ' ')}
                            </h3>
                          </div>
                        ))}
                      </div>

                      {/* Evolution Arrow (Hidden after the last stage) */}
                      {index < chain.stages.length - 1 && (
                        <div className="flex justify-center items-center text-slate-500">
                          <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}

                    </div>
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