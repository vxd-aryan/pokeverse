"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface PokemonItem {
  name: string;
  url: string;
  details?: {
    cost: number;
    effect_entries: { 
      effect: string; 
      short_effect: string; 
      language: { name: string }
    }[];
    sprites: { default: string };
  };
}

export default function ItemsExplorePage() {
  const [items, setItems] = useState<PokemonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // Store the URL for the next batch of items
  const [nextUrl, setNextUrl] = useState<string | null>("https://pokeapi.co/api/v2/item?limit=40");

  const fetchItems = async (url: string, isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      const res = await fetch(url);
      const data = await res.json();
      
      // Save the URL for the NEXT page provided by PokéAPI
      setNextUrl(data.next);
      
      // Fetch detailed data for this specific batch
      const detailedItems = await Promise.all(
        data.results.map(async (item: PokemonItem) => {
          const detailRes = await fetch(item.url);
          const detailData = await detailRes.json();
          return { ...item, details: detailData };
        })
      );
      
      // If it's the first load, set the items. Otherwise, append the new ones to the existing list.
      setItems(prev => isInitial ? detailedItems : [...prev, ...detailedItems]);
    } catch (error) {
      console.error("Failed to load items database:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchItems("https://pokeapi.co/api/v2/item?limit=40", true);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-10">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 uppercase tracking-widest mb-2">
            Item Database
          </h1>
          <p className="text-slate-400">Explore gear, medicine, and hold items from the Pokémon world.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item, index) => (
            <div 
              // Using index in the key alongside name to prevent duplicate key errors just in case
              key={`${item.name}-${index}`} 
              className="bg-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-2xl p-5 shadow-lg transition-all hover:-translate-y-1 group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700 group-hover:bg-slate-900 transition-colors">
                  {item.details?.sprites.default ? (
                    <img 
                      src={item.details.sprites.default} 
                      alt={item.name} 
                      className="w-10 h-10 object-contain drop-shadow-md"
                    />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center text-2xl">🎒</div>
                  )}
                </div>
                <span className="bg-slate-900 px-3 py-1 rounded-full text-xs font-bold text-amber-400 border border-amber-500/20">
                  ¥ {item.details?.cost || 0}
                </span>
              </div>
              
              <h2 className="text-lg font-bold capitalize text-slate-100 mb-2">
                {item.name.replace(/-/g, ' ')}
              </h2>
              
              <p className="text-sm text-slate-400 line-clamp-3">
                {item.details?.effect_entries.find(e => e.language?.name === 'en')?.short_effect || "No description available."}
              </p>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {nextUrl && (
          <div className="mt-12 flex justify-center">
            <button 
              onClick={() => fetchItems(nextUrl, false)}
              disabled={loadingMore}
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-400 font-black uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 shadow-md hover:shadow-lg flex items-center gap-2"
            >
              {loadingMore ? (
                <>
                  <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                  Searching Database...
                </>
              ) : (
                "Load More Items ↓"
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}