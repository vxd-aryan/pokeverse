"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
  grass: '#78C850', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
  ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
  rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
  steel: '#B8B8D0', fairy: '#EE99AC',
};

export default function PokemonProfilePage() {
  const { id } = useParams();

  const [pokemon, setPokemon] = useState<any>(null);
  const [species, setSpecies] = useState<any>(null);
  const [encounters, setEncounters] = useState<any[]>([]);
  const [evolutionChain, setEvolutionChain] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompleteProfile() {
      try {
        // 1. Fetch Core Pokémon Data
        const pokeRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const pokeData = await pokeRes.json();
        setPokemon(pokeData);

        // 2. Fetch Species Data
        const speciesRes = await fetch(pokeData.species.url);
        const speciesData = await speciesRes.json();
        setSpecies(speciesData);

        // 3. Fetch Encounters
        const encRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}/encounters`);
        const encData = await encRes.json();
        setEncounters(encData);

        // 4. Fetch Evolution Chain
        if (speciesData.evolution_chain?.url) {
          const evoRes = await fetch(speciesData.evolution_chain.url);
          const evoData = await evoRes.json();

          const evoList: any[] = [];
          const parseEvo = (node: any) => {
            evoList.push({
              name: node.species.name,
              id: node.species.url.split('/').filter(Boolean).pop(),
            });
            if (node.evolves_to && node.evolves_to.length > 0) {
              node.evolves_to.forEach((child: any) => parseEvo(child));
            }
          };
          parseEvo(evoData.chain);
          setEvolutionChain(evoList);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchCompleteProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="ball-root flex flex-col justify-center items-center h-[60vh] w-full gap-5">
        <div className="loading-ball" aria-hidden="true" />
        <div className="capsule-label text-[#F5D061] text-lg">
          Deploying Poké Ball…
        </div>
      </div>
    );
  }

  if (!pokemon) {
    return (
      <div className="ball-root flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="empty-ball" aria-hidden="true" />
        <div className="capsule-label text-[#E4E4E8] text-lg text-center">
          Entity broke free. Not found in registry.
        </div>
      </div>
    );
  }

  // Safe Formatting Helpers
  const profileImage = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;

  // Safely find the english flavor text, fallback if none exists
  const flavorEntry = species?.flavor_text_entries?.find((f: any) => f.language.name === 'en');
  const flavorText = flavorEntry ? flavorEntry.flavor_text.replace(/\f/g, ' ') : 'No archival data found for this entity.';

  // Safely find the english genus (category)
  const genusEntry = species?.genera?.find((g: any) => g.language.name === 'en');
  const genusText = genusEntry ? genusEntry.genus : 'Unknown Category';

  const tabs = ['stats', 'abilities', 'moves', 'locations', 'evolutions', 'forms'];
  const primaryType = pokemon.types?.[0]?.type?.name;
  const primaryColor = TYPE_COLORS[primaryType] || '#EE1515';

  return (
    <div className="ball-root">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Navigation & Header */}
        <div className="flex items-center gap-6">
          <Link href="/pokedex" className="nav-ball flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#232324]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="capsule-heading text-3xl md:text-4xl text-[#F5F5F5] capitalize flex items-center gap-4 flex-wrap">
              {pokemon.name.replace('-', ' ')}
              <span className="dex-no-chip">
                #{pokemon.id.toString().padStart(3, '0')}
              </span>
            </h1>
            <p className="text-[#A5A5AE] mt-1 italic">"{flavorText}"</p>
          </div>
        </div>

        {/* Top Section: Overview Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 flex justify-center items-center py-4">
            <div className="capture-orb" style={{ ['--glow' as any]: primaryColor }}>
              <div className="capture-window">
                <img
                  src={profileImage}
                  alt={pokemon.name}
                  className="w-full max-w-[150px] transform hover:scale-110 transition-transform duration-500"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png' }}
                />
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 panel-card rounded-3xl p-6 flex flex-col justify-center">
            <h2 className="capsule-label text-[#A5A5AE] mb-6 border-b border-white/10 pb-3">Capture Data</h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="capsule-label text-[#7A7A84] mb-2 text-[10px]">Elemental Types</p>
                <div className="flex flex-wrap gap-2">
                  {pokemon.types.map((t: any) => (
                    <span
                      key={t.type.name}
                      className="type-pill"
                      style={{ ['--type-color' as any]: TYPE_COLORS[t.type.name] || '#888' }}
                    >
                      {t.type.name}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="capsule-label text-[#7A7A84] mb-2 text-[10px]">Physical Build</p>
                <div className="flex gap-3 flex-wrap">
                  <span className="stat-chip">H: {pokemon.height / 10}m</span>
                  <span className="stat-chip">W: {pokemon.weight / 10}kg</span>
                </div>
              </div>

              <div className="col-span-2 mt-1">
                <p className="capsule-label text-[#7A7A84] mb-2 text-[10px]">Genera / Category</p>
                <p className="text-[#F5F5F5] text-lg font-medium">{genusText}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Interactive Data Terminal */}
        <div className="panel-card rounded-3xl overflow-hidden flex flex-col">
          <div className="flex flex-wrap gap-2 p-3 border-b border-white/10 bg-black/20">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`tab-btn flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                  activeTab === tab ? 'tab-btn--active' : ''
                }`}
              >
                <span className={`tab-ball ${activeTab === tab ? 'tab-ball--active' : ''}`} aria-hidden="true" />
                <span className="capsule-label text-[11px]">{tab}</span>
              </button>
            ))}
          </div>

          <div className="p-6 md:p-8 min-h-[300px]">
            {activeTab === 'stats' && (
              <div className="space-y-4 max-w-2xl mx-auto">
                {pokemon.stats.map((s: any) => (
                  <div key={s.stat.name} className="flex items-center gap-4">
                    <span className="w-32 capsule-label text-[#A5A5AE] text-[10px] text-right">
                      {s.stat.name.replace('-', ' ')}
                    </span>
                    <span className="w-8 text-sm font-black text-[#F5F5F5]">{s.base_stat}</span>
                    <div className="flex-1 h-3 rounded-full overflow-hidden stat-track">
                      <div
                        className={`h-full rounded-full ${s.base_stat >= 100 ? 'stat-fill--high' : s.base_stat >= 60 ? 'stat-fill--mid' : 'stat-fill--low'}`}
                        style={{ width: `${Math.min((s.base_stat / 255) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'abilities' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pokemon.abilities.map((a: any) => (
                  <div key={a.ability.name} className="tile-card flex justify-between items-center">
                    <span className="text-lg font-bold text-[#F5F5F5] capitalize">{a.ability.name.replace('-', ' ')}</span>
                    {a.is_hidden && <span className="hidden-chip">Hidden</span>}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'moves' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-2">
                {pokemon.moves.map((m: any) => (
                  <div key={m.move.name} className="tile-card text-center py-3">
                    <span className="text-sm font-medium text-[#D3D3DA] capitalize">{m.move.name.replace('-', ' ')}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'locations' && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {encounters.length === 0 ? (
                  <div className="text-center text-[#7A7A84] font-medium py-10 capsule-label text-sm">No known wild habitats.</div>
                ) : (
                  encounters.map((e: any, idx: number) => (
                    <div key={idx} className="tile-card flex items-center gap-3">
                      <span className="location-ball" aria-hidden="true" />
                      <span className="text-sm font-medium text-[#D3D3DA] capitalize">{e.location_area.name.replace(/-/g, ' ')}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'evolutions' && (
              <div className="flex flex-wrap justify-center gap-4">
                {evolutionChain.length === 0 ? (
                  <div className="text-center text-[#7A7A84] font-medium py-10 capsule-label text-sm">No evolutions found.</div>
                ) : (
                  evolutionChain.map((evo, idx) => (
                    <Link href={`/pokedex/${evo.id}`} key={evo.id} className="flex items-center gap-3">
                      <div className="tile-card flex flex-col items-center w-32 cursor-pointer">
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${evo.id}.png`}
                          alt={evo.name}
                          className="w-16 h-16 object-contain mb-2"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png' }}
                        />
                        <span className="text-xs font-bold text-[#7A7A84]">#{String(evo.id).padStart(3, '0')}</span>
                        <span className="text-sm font-bold text-[#F5F5F5] capitalize">{evo.name}</span>
                      </div>
                      {idx < evolutionChain.length - 1 && (
                        <span className="evo-arrow-ball hidden sm:block" aria-hidden="true" />
                      )}
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* FORMS / VARIETIES TAB */}
            {activeTab === 'forms' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {species?.varieties?.map((v: any) => {
                  const varId = v.pokemon.url.split('/').filter(Boolean).pop();
                  return (
                    <Link href={`/pokedex/${varId}`} key={v.pokemon.name}>
                      <div className="tile-card flex flex-col items-center text-center h-full group">
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${varId}.png`}
                          alt={v.pokemon.name}
                          className="w-24 h-24 object-contain mb-2 transform group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png' }}
                        />
                        <span className="text-xs font-bold text-[#F5F5F5] capitalize">{v.pokemon.name.replace(/-/g, ' ')}</span>
                        {v.is_default && (
                          <span className="base-form-chip">Base Form</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Inter:wght@400;600;700&display=swap');

        .ball-root {
          background:
            radial-gradient(circle at 50% -10%, rgba(238,21,21,0.12), transparent 45%),
            #17171A;
          font-family: 'Inter', ui-sans-serif, sans-serif;
          min-height: 100vh;
        }

        .capsule-heading {
          font-family: 'Baloo 2', ui-sans-serif, sans-serif;
          font-weight: 800;
        }
        .capsule-label {
          font-family: 'Inter', ui-sans-serif, sans-serif;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: 11px;
        }

        .dex-no-chip {
          font-family: 'Inter', ui-sans-serif, sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #A5A5AE;
          background: #0F0F11;
          border: 1px solid rgba(255,255,255,0.08);
          padding: 4px 12px;
          border-radius: 8px;
        }

        .nav-ball {
          width: 44px;
          height: 44px;
          border-radius: 9999px;
          background: linear-gradient(180deg, #F5F5F5 0%, #F5F5F5 46%, #232324 46%, #232324 54%, #EE1515 54%, #EE1515 100%);
          box-shadow: 0 0 0 2px #0F0F11, 0 4px 14px rgba(0,0,0,0.4);
          transition: transform 0.15s ease;
        }
        .nav-ball:hover { transform: scale(1.08) rotate(-8deg); }

        .panel-card {
          background: #1F1F23;
          border: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 20px 50px -30px rgba(0,0,0,0.7);
        }

        .capture-orb {
          position: relative;
          width: 220px;
          height: 220px;
          border-radius: 9999px;
          background: linear-gradient(180deg, #EE1515 0%, #EE1515 46%, #232324 46%, #232324 54%, #F5F5F5 54%, #F5F5F5 100%);
          box-shadow: 0 0 40px -6px var(--glow), 0 20px 40px -20px rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .capture-window {
          width: 158px;
          height: 158px;
          border-radius: 9999px;
          background: #0F0F11;
          border: 4px solid #F5F5F5;
          box-shadow: inset 0 4px 14px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .type-pill {
          font-family: 'Inter', ui-sans-serif, sans-serif;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #17171A;
          background: var(--type-color);
          padding: 6px 12px;
          border-radius: 999px;
          box-shadow: 0 2px 8px -2px rgba(0,0,0,0.5);
        }

        .stat-chip {
          color: #F5F5F5;
          font-weight: 600;
          background: #0F0F11;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          font-size: 13px;
        }

        .tab-btn {
          background: transparent;
          color: #8A8A94;
          border: 1px solid transparent;
        }
        .tab-btn:hover {
          background: rgba(255,255,255,0.04);
          color: #F5F5F5;
        }
        .tab-btn--active {
          background: linear-gradient(180deg, #EE1515, #C21111);
          color: #FFFFFF;
          box-shadow: 0 6px 16px -6px rgba(238,21,21,0.6);
        }

        .tab-ball {
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          flex-shrink: 0;
          background: linear-gradient(180deg, #6b6b74 0%, #6b6b74 46%, #232324 46%, #232324 54%, #45454c 54%, #45454c 100%);
        }
        .tab-ball--active {
          background: linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 46%, #232324 46%, #232324 54%, #FFE1E1 54%, #FFE1E1 100%);
        }

        .tile-card {
          background: #0F0F11;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 16px;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        a .tile-card:hover, .tile-card:hover {
          border-color: #EE1515;
          background: #17171A;
        }

        .hidden-chip {
          font-family: 'Inter', ui-sans-serif, sans-serif;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #C9A6FF;
          background: rgba(112,56,248,0.15);
          border: 1px solid rgba(112,56,248,0.5);
          padding: 3px 8px;
          border-radius: 6px;
        }

        .base-form-chip {
          margin-top: 10px;
          font-family: 'Inter', ui-sans-serif, sans-serif;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #7FE0A8;
          background: rgba(120,200,80,0.15);
          border: 1px solid rgba(120,200,80,0.5);
          padding: 2px 8px;
          border-radius: 6px;
        }

        .stat-track {
          background: #0F0F11;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .stat-fill--high { background: linear-gradient(90deg, #78C850, #58A83E); }
        .stat-fill--mid { background: linear-gradient(90deg, #F8D030, #E0B821); }
        .stat-fill--low { background: linear-gradient(90deg, #EE1515, #C21111); }

        .location-ball {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
          border-radius: 9999px;
          background: linear-gradient(180deg, #EE1515 0%, #EE1515 46%, #232324 46%, #232324 54%, #F5F5F5 54%, #F5F5F5 100%);
        }

        .evo-arrow-ball {
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: linear-gradient(180deg, #6b6b74 0%, #6b6b74 46%, #232324 46%, #232324 54%, #45454c 54%, #45454c 100%);
          position: relative;
        }
        .evo-arrow-ball::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 4px;
          height: 4px;
          border-radius: 9999px;
          background: #17171A;
          border: 1px solid #8A8A94;
          transform: translate(-50%, -50%);
        }

        .loading-ball, .empty-ball {
          width: 56px;
          height: 56px;
          border-radius: 9999px;
          background: linear-gradient(180deg, #EE1515 0%, #EE1515 46%, #232324 46%, #232324 54%, #F5F5F5 54%, #F5F5F5 100%);
          box-shadow: 0 0 30px rgba(238,21,21,0.4);
        }
        .empty-ball { opacity: 0.4; filter: grayscale(1); }
        @media (prefers-reduced-motion: no-preference) {
          .loading-ball { animation: shake 1.1s ease-in-out infinite; }
        }
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-18deg); }
          40% { transform: rotate(14deg); }
          60% { transform: rotate(-10deg); }
          80% { transform: rotate(6deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .loading-ball { animation: none; }
          .nav-ball:hover { transform: none; }
        }
      `}</style>
    </div>
  );
}