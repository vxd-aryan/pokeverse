"use client";

import { useState, useEffect } from 'react';

// --- DATA ---
const ALL_REGIONS = [
  {
    id: "kanto",
    name: "Kanto",
    generation: "Generation I",
    starters: ["Bulbasaur", "Charmander", "Squirtle"],
    professor: "Professor Oak",
    evilTeam: "Team Rocket",
    champion: "Lance / Blue",
    description: "The region where it all began. Kanto is a temperate region heavily inspired by the real-world Kantō region of Japan.",
    thumbnail: "/images/regions/kanto.jpg" // FIXED PATH
  },
  {
    id: "johto",
    name: "Johto",
    generation: "Generation II",
    starters: ["Chikorita", "Cyndaquil", "Totodile"],
    professor: "Professor Elm",
    evilTeam: "Team Rocket",
    champion: "Lance",
    description: "Located west of Kanto, Johto is deeply steeped in history, mythology, and tradition. It is famous for the Burned Tower and Tin Tower.",
    thumbnail: "/images/regions/johto.jpg" // FIXED PATH
  },
  {
    id: "hoenn",
    name: "Hoenn",
    generation: "Generation III",
    starters: ["Treecko", "Torchic", "Mudkip"],
    professor: "Professor Birch",
    evilTeam: "Team Aqua & Team Magma",
    champion: "Steven Stone",
    description: "A lush region with a massive ocean, diverse climates, and sprawling nature defined by the ancient clash of Groudon and Kyogre.",
    thumbnail: "/images/regions/hoenn.jpg" // FIXED PATH
  },
  {
    id: "sinnoh",
    name: "Sinnoh",
    generation: "Generation IV",
    starters: ["Turtwig", "Chimchar", "Piplup"],
    professor: "Professor Rowan",
    evilTeam: "Team Galactic",
    champion: "Cynthia",
    description: "A northern, mountainous region divided by Mt. Coronet. Widely considered the origin point of the entire Pokémon universe.",
    thumbnail: "/images/regions/sinnoh.jpg" // FIXED PATH
  },
  {
    id: "unova",
    name: "Unova",
    generation: "Generation V",
    starters: ["Snivy", "Tepig", "Oshawott"],
    professor: "Professor Juniper",
    evilTeam: "Team Plasma",
    champion: "Alder",
    description: "A highly urbanized region inspired by the New York metropolitan area, featuring bustling cities and massive bridges.",
    thumbnail: "/images/regions/unova.jpg" // FIXED PATH
  },
  {
    id: "kalos",
    name: "Kalos",
    generation: "Generation VI",
    starters: ["Chespin", "Fennekin", "Froakie"],
    professor: "Professor Sycamore",
    evilTeam: "Team Flare",
    champion: "Diantha",
    description: "A beautiful region inspired by France, known for its fashion, art, and being the birthplace of Mega Evolution.",
    thumbnail: "/images/regions/kalos.jpg" // FIXED PATH
  },
  {
    id: "alola",
    name: "Alola",
    generation: "Generation VII",
    starters: ["Rowlet", "Litten", "Popplio"],
    professor: "Professor Kukui",
    evilTeam: "Team Skull",
    champion: "Ash Ketchum",
    description: "A tropical archipelago of four main islands that relies on Island Challenges rather than a traditional Gym system.",
    thumbnail: "/images/regions/alola.jpg" // FIXED PATH
  },
  {
    id: "galar",
    name: "Galar",
    generation: "Generation VIII",
    starters: ["Grookey", "Scorbunny", "Sobble"],
    professor: "Professor Magnolia",
    evilTeam: "Macro Cosmos",
    champion: "Leon",
    description: "An industrialized region inspired by the UK. Galar treats Pokémon battles as massive stadium sporting events.",
    thumbnail: "/images/regions/galar.jpg" // FIXED PATH
  },
  {
    id: "paldea",
    name: "Paldea",
    generation: "Generation IX",
    starters: ["Sprigatito", "Fuecoco", "Quaxly"],
    professor: "Sada / Turo",
    evilTeam: "Team Star",
    champion: "Geeta",
    description: "A vast, open-world region centered around the Great Crater of Paldea, known for its prestigious academies.",
    thumbnail: "/images/regions/paldea.jpg" // FIXED PATH
  }
];

// --- BULLETPROOF IMAGE COMPONENT ---
const SafeImage = ({ src, alt, className }: { src: string, alt: string, className: string }) => {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => {
        // If local JPG fails, show a clean, stable text placeholder
        setImgSrc(`https://placehold.co/600x400/1e293b/818cf8?text=${alt}`);
      }}
    />
  );
};

// --- MAIN PAGE ---
export default function RegionDirectory() {
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<typeof ALL_REGIONS[0] | null>(null);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (selectedRegion) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; }
  }, [selectedRegion]);

  const filteredRegions = ALL_REGIONS.filter(region => 
    region.name.toLowerCase().includes(search.toLowerCase()) ||
    region.generation.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Pokémon Regions</h1>
          <p className="text-slate-400 text-sm mt-1">Explore the diverse landscapes and native starters.</p>
        </div>
        
        <input 
          type="text" 
          placeholder="Search regions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          suppressHydrationWarning={true}
          className="w-full md:w-64 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-lg px-4 py-2 text-slate-200 outline-none transition-colors"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRegions.map((region) => (
          <div 
            key={region.id} 
            onClick={() => setSelectedRegion(region)}
            className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer group flex flex-col"
          >
            {/* Banner Image */}
            <div className="h-48 relative overflow-hidden bg-slate-800 shrink-0">
              <SafeImage 
                src={region.thumbnail} 
                alt={region.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-1">
                  {region.generation}
                </span>
                <h2 className="text-2xl font-black text-white">{region.name}</h2>
              </div>
            </div>

            {/* Content Snippet */}
            <div className="p-5 flex-grow flex flex-col justify-between gap-4">
              <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
                {region.description}
              </p>
              <div className="text-xs text-slate-500 border-t border-slate-800 pt-3">
                <span className="font-bold">Starters: </span> 
                <span className="text-slate-300">{region.starters.join(", ")}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedRegion && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedRegion(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedRegion(null)}
              className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black transition-colors"
            >
              ✕
            </button>

            {/* Modal Image */}
            <div className="w-full h-56 sm:h-72 relative bg-slate-800 shrink-0">
              <SafeImage 
                src={selectedRegion.thumbnail} 
                alt={selectedRegion.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
              <div className="absolute bottom-6 left-6 md:left-8">
                <span className="text-sm font-bold text-indigo-400 uppercase tracking-widest block mb-1">
                  {selectedRegion.generation}
                </span>
                <h2 className="text-4xl md:text-5xl font-black text-white">{selectedRegion.name}</h2>
              </div>
            </div>

            {/* Modal Details (Scrollable) */}
            <div className="p-6 md:p-8 overflow-y-auto">
              <p className="text-slate-300 leading-relaxed text-lg mb-8">
                {selectedRegion.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-950 p-6 rounded-xl border border-slate-800">
                <div>
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">Native Starters</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRegion.starters.map((starter) => (
                      <span key={starter} className="bg-indigo-900/30 text-indigo-300 border border-indigo-800/50 px-3 py-1 rounded-full text-sm font-medium">
                        {starter}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">Key Details</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Professor</span>
                      <span className="text-white font-medium">{selectedRegion.professor}</span>
                    </li>
                    <li className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Champion</span>
                      <span className="text-white font-medium">{selectedRegion.champion}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-400">Villain Team</span>
                      <span className="text-red-400 font-medium">{selectedRegion.evilTeam}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}