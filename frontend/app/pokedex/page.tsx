"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PokedexDatabasePage() {
  const [allPokemon, setAllPokemon] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEntirePokedex() {
      try {
        // Fetching the base list of all 1025 Pokémon (just names and URLs for lightning-fast loading)
        const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');
        const data = await res.json();

        const formattedList = data.results.map((p: any) => {
          const id = p.url.split('/').filter(Boolean).pop();
          return {
            id,
            name: p.name,
            image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
          };
        });

        setAllPokemon(formattedList);
      } catch (err) {
        console.error("Failed to load Pokédex:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEntirePokedex();
  }, []);

  // Live Search Filter (Filters by name OR National Dex ID)
  const filteredPokemon = allPokemon.filter(poke =>
    poke.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    poke.id.includes(searchQuery)
  );

  return (
    <div className="term-root min-h-screen space-y-6 pt-6 pb-16 max-w-7xl mx-auto px-4">

      {/* Terminal title bar */}
      <div className="term-titlebar flex items-center gap-3 px-4 py-2 rounded-t-lg">
        <span className="term-tab" />
        <span className="term-tab" />
        <span className="term-tab" />
        <span className="term-label text-[11px] tracking-[0.25em] text-[#5c7080] ml-2">
          BILL&apos;S PC — NATIONAL STORAGE SYSTEM
        </span>
        <span className="ml-auto term-label text-[10px] text-[#4CE0B3]/70 hidden sm:inline">
          {loading ? 'CONNECTING…' : 'LINK ESTABLISHED'}
        </span>
      </div>

      {/* Header + search, inside the terminal frame */}
      <div className="term-frame rounded-b-lg rounded-tr-lg -mt-6 pt-8 px-5 md:px-8 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            <h1 className="term-display text-3xl md:text-4xl text-[#E7F3EC] tracking-wide flex items-center gap-3">
              National Dex<span className="term-cursor" aria-hidden="true" />
            </h1>
            <p className="term-label text-[#5c7080] mt-2 text-xs md:text-sm">
              Query the full storage archive. Select any record for a deep-dive readout.
            </p>
          </div>

          <div className="relative w-full md:w-96">
            <span className="term-prompt absolute left-4 top-1/2 -translate-y-1/2 text-[#4CE0B3] term-label">
              &gt;
            </span>
            <input
              type="text"
              placeholder="search name or dex no."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="term-input w-full rounded-lg pl-9 pr-4 py-3 text-sm term-label tracking-wide"
            />
          </div>
        </div>
      </div>

      {/* Database grid panel */}
      <div className="term-panel relative rounded-2xl p-5 md:p-7 overflow-hidden">
        <div className="term-scanline" aria-hidden="true" />

        <div className="relative z-10 flex justify-between items-center mb-6 border-b border-[#16202e] pb-3">
          <h2 className="term-label text-xs md:text-sm text-[#5c7080] tracking-[0.3em]">
            STORAGE RECORDS
          </h2>
          <span className="term-label text-[10px] tracking-[0.2em] text-[#4CE0B3] bg-[#0a0f18] px-3 py-1 rounded-md border border-[#16202e]">
            {filteredPokemon.length} FOUND
          </span>
        </div>

        {loading ? (
          <div className="relative z-10 text-center py-24">
            <p className="term-label text-[#4CE0B3] tracking-[0.2em] text-sm">
              LOADING NATIONAL DEX<span className="term-dots" aria-hidden="true" />
            </p>
            <p className="term-label text-[#5c7080] text-[10px] mt-2 tracking-[0.2em]">
              1025 RECORDS INBOUND
            </p>
          </div>
        ) : filteredPokemon.length === 0 ? (
          <div className="relative z-10 text-center py-24">
            <p className="term-label text-[#FFB13C] text-sm tracking-[0.2em]">
              NO RECORD MATCHES &quot;{searchQuery}&quot;
            </p>
            <p className="term-label text-[#5c7080] text-[10px] mt-2 tracking-[0.2em]">
              CHECK SPELLING OR DEX NUMBER
            </p>
          </div>
        ) : (
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredPokemon.map((poke) => (
              /* Link wrapper to navigate to the deep-dive detail page */
              <Link href={`/pokedex/${poke.id}`} key={poke.id}>
                <div className="slot-card group relative rounded-xl p-3 flex flex-col items-center h-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4CE0B3] cursor-pointer">
                  <span className="corner corner-tl" aria-hidden="true" />
                  <span className="corner corner-tr" aria-hidden="true" />
                  <span className="corner corner-bl" aria-hidden="true" />
                  <span className="corner corner-br" aria-hidden="true" />

                  <div className="h-24 w-24 relative flex justify-center items-center rounded-lg p-2 mb-3 slot-well">
                    <img
                      src={poke.image}
                      alt={poke.name}
                      className="h-full w-full object-contain z-10 transform group-hover:scale-110 transition-transform duration-200"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png' }}
                    />
                  </div>
                  <span className="term-label text-[10px] text-[#4CE0B3]/80 self-start group-hover:text-[#4CE0B3] transition-colors">
                    #{poke.id.padStart(3, '0')}
                  </span>
                  <h3 className="text-sm font-bold text-[#E7F3EC] capitalize tracking-wide mt-1 w-full truncate">
                    {poke.name.replace('-', ' ')}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&family=JetBrains+Mono:wght@400;500;700&display=swap');

        .term-root {
          background: #05070a;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
        }
        .term-display {
          font-family: 'VT323', ui-monospace, monospace;
          font-weight: 400;
        }
        .term-label {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-weight: 600;
        }

        .term-titlebar {
          background: #0d1420;
          border: 1px solid #16202e;
          border-bottom: none;
        }
        .term-tab {
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: #1c2a3a;
        }

        .term-frame {
          background: #0a0f18;
          border: 1px solid #16202e;
        }

        .term-cursor {
          display: inline-block;
          width: 10px;
          height: 1.4rem;
          background: #4CE0B3;
          margin-left: 8px;
          vertical-align: -4px;
          box-shadow: 0 0 8px rgba(76,224,179,0.7);
        }
        @media (prefers-reduced-motion: no-preference) {
          .term-cursor { animation: blink 1s steps(1) infinite; }
        }
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }

        .term-dots::after {
          content: '';
          display: inline-block;
          width: 1.2em;
          text-align: left;
        }
        @media (prefers-reduced-motion: no-preference) {
          .term-dots::after { animation: dots 1.4s steps(4, end) infinite; }
        }
        @keyframes dots {
          0% { content: ''; }
          25% { content: '.'; }
          50% { content: '..'; }
          75% { content: '...'; }
        }

        .term-prompt {
          text-shadow: 0 0 6px rgba(76,224,179,0.6);
        }
        .term-input {
          background: #0a0f18;
          border: 1px solid #16202e;
          color: #E7F3EC;
        }
        .term-input::placeholder {
          color: #3c4a5a;
        }
        .term-input:focus {
          outline: none;
          border-color: #4CE0B3;
          box-shadow: 0 0 0 3px rgba(76,224,179,0.15);
        }

        .term-panel {
          background: #0d1420;
          border: 1px solid #16202e;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
        }
        .term-scanline {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: repeating-linear-gradient(
            180deg,
            rgba(76,224,179,0.015) 0px,
            rgba(76,224,179,0.015) 1px,
            transparent 1px,
            transparent 3px
          );
        }

        .slot-card {
          background: #0a0f18;
          border: 1px solid #16202e;
          transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
        }
        .slot-card:hover {
          border-color: #1e2c3d;
          transform: translateY(-2px);
          box-shadow: 0 10px 24px -14px rgba(76,224,179,0.35);
        }
        .slot-well {
          background: #05070a;
          border: 1px solid #16202e;
        }

        .corner {
          position: absolute;
          width: 10px;
          height: 10px;
          border-color: #4CE0B3;
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .slot-card:hover .corner { opacity: 0.9; }
        .corner-tl { top: 4px; left: 4px; border-top: 2px solid; border-left: 2px solid; border-radius: 3px 0 0 0; }
        .corner-tr { top: 4px; right: 4px; border-top: 2px solid; border-right: 2px solid; border-radius: 0 3px 0 0; }
        .corner-bl { bottom: 4px; left: 4px; border-bottom: 2px solid; border-left: 2px solid; border-radius: 0 0 0 3px; }
        .corner-br { bottom: 4px; right: 4px; border-bottom: 2px solid; border-right: 2px solid; border-radius: 0 0 3px 0; }

        @media (prefers-reduced-motion: reduce) {
          .slot-card:hover { transform: none; }
        }
      `}</style>
    </div>
  );
}