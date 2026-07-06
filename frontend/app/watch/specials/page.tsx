"use client";

import { useState } from 'react';

export interface SpecialData {
  id: string;
  title: string;
  category: 'TV Special' | 'OVA' | 'Web Series' | 'Mini Series';
  releaseYear: number;
  episodesOrRuntime: string;
  description: string;
  timelinePlacement: string;
  image: string;
}

const SPECIALS_DATA: SpecialData[] = [
  {
    id: "pokemon-origins",
    title: "Pokémon Origins",
    category: "Mini Series",
    releaseYear: 2013,
    episodesOrRuntime: "4 Episodes",
    description: "A stunning and remarkably faithful adaptation of the original Pokémon Red and Blue video games. The story follows Red, a young trainer from Pallet Town, as he chooses Charmander and embarks on a quest to complete the Pokédex. It features fierce battles against his arrogant rival Blue, the systematic dismantling of the villainous Team Rocket and their leader Giovanni, and culminates in a legendary showdown at the Pokémon League and the capture of Mewtwo using Mega Evolution.",
    timelinePlacement: "Alternate Universe / Standalone classic lore",
    image: "/images/specials/origins.jpg"
  },
  {
    id: "pokemon-generations",
    title: "Pokémon Generations",
    category: "Web Series",
    releaseYear: 2016,
    episodesOrRuntime: "18 Episodes",
    description: "A series of bite-sized, high-budget compilation shorts that shed light on untold historical moments from the core video games. Spanning every generation from Kanto to Kalos, these episodes explore the perspectives of familiar characters other than the main protagonist. Witness the International Police hunting Giovanni, Lance raiding Team Rocket's hideout, and Zygarde's awakening, all animated with incredible cinematic flair.",
    timelinePlacement: "Lore Anthology / Game Canon",
    image: "/images/specials/generations.jpg"
  },
  {
    id: "twilight-wings",
    title: "Pokémon: Twilight Wings",
    category: "Web Series",
    releaseYear: 2020,
    episodesOrRuntime: "8 Episodes",
    description: "Set in the Galar region, this beautifully animated mini-series focuses on the dreams, struggles, and daily lives of the region's residents and Gym Leaders. Connected by a Flying Taxi service, the emotional narrative highlights the deeper, human side of the Pokémon world, showing the pressure of competition and the quiet moments of companionship.",
    timelinePlacement: "Galar Region Standalone",
    image: "/images/specials/twilight-wings.jpg"
  },
  {
    id: "pokemon-concierge",
    title: "Pokémon Concierge",
    category: "Web Series",
    releaseYear: 2023,
    episodesOrRuntime: "4 Episodes",
    description: "A breathtaking, stop-motion animated slice-of-life masterpiece. The series follows Haru, an overworked woman who takes a job as a new concierge at a peaceful, sun-drenched island resort catering exclusively to Pokémon. Teaming up with a shy Psyduck, Haru learns how to relax, let go of her anxieties, and discover what truly makes both Pokémon and people happy.",
    timelinePlacement: "Standalone / Passive relaxing viewing",
    image: "/images/specials/concierge.jpg"
  },
  {
    id: "mewtwo-returns",
    title: "Mewtwo Returns",
    category: "TV Special",
    releaseYear: 2000,
    episodesOrRuntime: "1h 03m",
    description: "The direct narrative sequel to 'Pokémon: The First Movie'. Mewtwo and his clone companions have isolated themselves on the remote, harsh peak of Mt. Quena to live in peace away from humanity. However, Team Rocket's Giovanni finally tracks them down. Ash and his friends are inadvertently caught in the crossfire, leading to a profound conflict about the right to exist, culminating in Mewtwo learning to trust the world.",
    timelinePlacement: "Directly after Johto Journeys Episode 178",
    image: "/images/specials/mewtwo-returns.jpg"
  },
  {
    id: "pokemon-chronicles",
    title: "Pokémon Chronicles",
    category: "TV Special",
    releaseYear: 2006,
    episodesOrRuntime: "22 Episodes",
    description: "An anthology series focused entirely on the side characters of the Pokémon anime universe. While Ash Ketchum continues his journey elsewhere, this series explores what his friends, rivals, and family are up to. It features iconic episodes focusing on Jimmy and Marina in Johto, Misty's struggles running the Cerulean Gym, and the origins of Team Rocket's Jessie and James.",
    timelinePlacement: "Various points during the Johto & Hoenn eras",
    image: "/images/specials/chronicles.jpg"
  }
];

export default function SpecialsPage() {
  const [activeTab, setActiveTab] = useState<'All' | 'TV Special' | 'Web Series' | 'Mini Series'>('All');
  const [selectedSpecial, setSelectedSpecial] = useState<SpecialData | null>(null);

  const filteredSpecials = activeTab === 'All' 
    ? SPECIALS_DATA 
    : SPECIALS_DATA.filter(s => s.category === activeTab);

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-300 min-h-screen relative">
      
      {/* --- HEADER --- */}
      <div className="mb-10 border-b-2 border-slate-800 pb-6 max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.6)]">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider">
              Specials Archive
            </h2>
          </div>
          <p className="text-slate-400 text-sm mt-2 font-mono">
            // Anthology series, high-budget web projects, and canonical TV specials.
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 font-mono text-xs text-purple-400 shadow-inner">
          ARCHIVE STATUS: <span className="text-purple-400 font-bold">UNLOCKED</span>
        </div>
      </div>

      {/* --- CATEGORY TABS --- */}
      <div className="max-w-6xl mx-auto flex gap-2 border-b border-slate-800 pb-6 mb-8 overflow-x-auto no-scrollbar">
        {(['All', 'TV Special', 'Web Series', 'Mini Series'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap border ${
              activeTab === tab 
                ? "bg-purple-500/10 text-purple-400 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)]" 
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            {tab === 'All' ? '🌌 Show All Categories' : tab}
          </button>
        ))}
      </div>

      {/* --- GRID LIST --- */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSpecials.map((special) => (
          <div 
            key={special.id} 
            onClick={() => setSelectedSpecial(special)}
            className="group cursor-pointer bg-slate-900/50 border-2 border-slate-800 rounded-2xl overflow-hidden hover:border-purple-500/50 hover:-translate-y-1 transition-all duration-300 shadow-lg flex flex-col"
          >
            {/* Image Banner */}
            <div className="relative h-40 w-full bg-slate-800 border-b-2 border-slate-800 group-hover:border-purple-500/50 overflow-hidden transition-colors">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#a855f7 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
              <img 
                src={special.image || '/images/specials/placeholder.jpg'} 
                alt={special.title}
                className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
              
              {/* Category Badge overlay */}
              <div className="absolute top-3 right-3 bg-purple-900/80 backdrop-blur-sm border border-purple-500/50 rounded px-2 py-1">
                <span className="text-[10px] font-mono font-bold tracking-wider text-purple-200 uppercase">
                  {special.category}
                </span>
              </div>
            </div>

            {/* Text Content */}
            <div className="p-5 flex-grow flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-mono text-slate-400">{special.releaseYear}</span>
                  <span className="text-xs font-mono text-slate-400">{special.episodesOrRuntime}</span>
                </div>
                <h3 className="text-lg font-black text-white mb-2 group-hover:text-purple-400 transition-colors">{special.title}</h3>
                {/* Truncated description for grid */}
                <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-3">{special.description}</p>
              </div>

              <div className="bg-slate-950/80 border border-slate-800/50 p-3 rounded-xl mt-2 group-hover:border-purple-500/30 transition-colors">
                <span className="text-[10px] text-purple-400/80 uppercase font-black tracking-wider block mb-1">Timeline Placement</span>
                <span className="text-xs text-slate-300 font-medium">{special.timelinePlacement}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- MASTER BALL MODAL OVERLAY --- */}
      {selectedSpecial && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedSpecial(null)}
        >
          {/* Modal Container */}
          <div 
            className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900 border-4 border-purple-700 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.2)] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header (Master Ball Theme) */}
            <div className="bg-purple-800 px-6 py-4 flex justify-between items-center border-b-4 border-purple-950 shrink-0 relative overflow-hidden">
              {/* Decorative 'M' styling hinting at a Master Ball */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <span className="text-8xl font-black text-white">M</span>
              </div>

              <div className="flex items-center gap-3 z-10">
                <div className="w-10 h-10 bg-fuchsia-400 rounded-full border-4 border-slate-200 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full opacity-70 absolute top-2 left-2" />
                </div>
                <div className="w-4 h-4 bg-pink-400 rounded-full border-2 border-pink-800 shadow-[0_0_8px_rgba(244,114,182,0.8)]" />
              </div>
              
              <button 
                onClick={() => setSelectedSpecial(null)}
                className="w-8 h-8 z-10 flex items-center justify-center bg-purple-950 hover:bg-black text-purple-300 font-black rounded-full transition-colors border border-purple-700 shadow-inner"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-2 bg-slate-950 overflow-y-auto">
              <div className="bg-slate-800 p-4 rounded-xl border-b-8 border-slate-900 h-full flex flex-col">
                
                {/* Main Image (object-contain ensures nothing gets cut off) */}
                <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border-4 border-purple-900/50 mb-4 shadow-inner shrink-0 flex items-center justify-center">
                  <img 
                    src={selectedSpecial.image || '/images/specials/placeholder.jpg'} 
                    alt={selectedSpecial.title}
                    className="absolute inset-0 w-full h-full object-contain" 
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0),rgba(255,255,255,0)_50%,rgba(168,85,247,0.05)_50%,rgba(168,85,247,0.05))] bg-[length:100%_4px] pointer-events-none" />
                </div>

                {/* Data Display */}
                <div className="bg-slate-900 rounded-lg p-5 border-2 border-slate-700/50 flex-grow relative overflow-hidden">
                  
                  {/* Tech Lines Decoration */}
                  <div className="absolute top-0 right-4 w-16 h-1 bg-purple-500/30 rounded-b-md" />
                  
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider">
                      {selectedSpecial.title}
                    </h2>
                    <span className="text-[10px] font-mono font-bold tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-1 rounded">
                      {selectedSpecial.category}
                    </span>
                  </div>

                  <div className="flex gap-4 mb-4 font-mono text-xs text-slate-400 border-b border-slate-800 pb-4">
                    <span><strong className="text-purple-400">YEAR:</strong> {selectedSpecial.releaseYear}</span>
                    <span><strong className="text-purple-400">RUNTIME:</strong> {selectedSpecial.episodesOrRuntime}</span>
                  </div>

                  <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6">
                    {selectedSpecial.description}
                  </p>

                  <div className="bg-purple-950/30 rounded-lg p-4 border border-purple-500/20">
                    <h4 className="text-[11px] uppercase font-black tracking-widest text-purple-400 mb-1">Recommended Viewing Placement</h4>
                    <p className="text-slate-300 text-sm font-medium">{selectedSpecial.timelinePlacement}</p>
                  </div>
                </div>
                
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}