"use client";

import { useState } from 'react';

interface LibraryItem {
  title: string;
  category: 'TV Series' | 'Movie' | 'Special' | 'Spin-off';
  region: string;
  generation: string;
  releaseYear: number;
}

const MASTER_LIBRARY_SEARCH: LibraryItem[] = [
  { title: "Indigo League Saga", category: "TV Series", region: "Kanto", generation: "Gen I", releaseYear: 1997 },
  { title: "Mewtwo Strikes Back", category: "Movie", region: "Kanto", generation: "Gen I", releaseYear: 1998 },
  { title: "Diamond & Pearl Run", category: "TV Series", region: "Sinnoh", generation: "Gen IV", releaseYear: 2006 },
  { title: "The Rise of Darkrai", category: "Movie", region: "Sinnoh", generation: "Gen IV", releaseYear: 2007 },
  { title: "Pokémon Origins", category: "Spin-off", region: "Kanto", generation: "Gen I", releaseYear: 2013 },
  { title: "Mewtwo Returns", category: "Special", region: "Johto", generation: "Gen II", releaseYear: 2000 },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [regionFilter, setRegionFilter] = useState("All");

  const filteredResults = MASTER_LIBRARY_SEARCH.filter(item => {
    const matchQuery = item.title.toLowerCase().includes(query.toLowerCase()) || 
                       item.region.toLowerCase().includes(query.toLowerCase());
    const matchCat = categoryFilter === "All" || item.category === categoryFilter;
    const matchReg = regionFilter === "All" || item.region === regionFilter;
    return matchQuery && matchCat && matchReg;
  });

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-300">
      {/* Header section */}
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white">Global Archive Search</h2>
        <p className="text-slate-400 text-sm mt-1">Cross-examine variables across timelines, productions, and video game regions.</p>
      </div>

      {/* Control Panel Grid */}
      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Input Block */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-mono font-black text-slate-500 tracking-wider">Search Keyword</label>
          <input 
            type="text"
            placeholder="Type name, tag, or region..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-slate-950 border border-slate-850 focus:border-indigo-500 text-sm text-slate-200 outline-none p-2.5 rounded-xl transition-all"
          />
        </div>

        {/* Category Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-mono font-black text-slate-500 tracking-wider">Format Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-850 focus:border-indigo-500 text-sm text-slate-300 outline-none p-2.5 rounded-xl cursor-pointer"
          >
            <option value="All">All Formats</option>
            <option value="TV Series">TV Series</option>
            <option value="Movie">Movies</option>
            <option value="Special">Specials</option>
            <option value="Spin-off">Spin-offs</option>
          </select>
        </div>

        {/* Region Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-mono font-black text-slate-500 tracking-wider">Geographic Boundary</label>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-850 focus:border-indigo-500 text-sm text-slate-300 outline-none p-2.5 rounded-xl cursor-pointer"
          >
            <option value="All">All Regions</option>
            <option value="Kanto">Kanto</option>
            <option value="Johto">Johto</option>
            <option value="Sinnoh">Sinnoh</option>
          </select>
        </div>
      </div>

      {/* Results Rendering Panel */}
      <div className="space-y-3">
        <span className="text-xs font-mono text-slate-500 block mb-1">Found {filteredResults.length} Matching Records</span>
        {filteredResults.map((item, index) => (
          <div key={index} className="bg-slate-900/20 border border-slate-850 hover:border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4 transition-colors">
            <div>
              <h4 className="text-sm font-bold text-white mb-0.5">{item.title}</h4>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono">
                <span>{item.region}</span>
                <span>•</span>
                <span>{item.generation}</span>
                <span>•</span>
                <span>{item.releaseYear}</span>
              </div>
            </div>

            <span className={`text-[9px] uppercase tracking-widest font-mono font-black px-2 py-0.5 border rounded shrink-0 ${
              item.category === 'Movie' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
              item.category === 'TV Series' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
              'bg-purple-500/10 text-purple-400 border-purple-500/20'
            }`}>
              {item.category}
            </span>
          </div>
        ))}
        {filteredResults.length === 0 && (
          <div className="text-center py-12 border border-dashed border-slate-850 rounded-2xl text-slate-500 text-xs">
            No entries found matching current filter parameters.
          </div>
        )}
      </div>
    </div>
  );
}