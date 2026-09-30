"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import {
  KANTO_STARTER_ROSTER,
  KANTO_PLAYER_LEVEL_CURVE,
  buildMoveset,
  getEvolutionStage,
  type JourneyPokemon,
} from '../../data/kanto';
import { getRegionState, setTeam } from '../../lib/journeyStorage';

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const sprite = (id: number) => `${SPRITE_BASE}/${id}.png`;

const START_LEVEL = KANTO_PLAYER_LEVEL_CURVE[0];
const ALL_TYPES = Array.from(
  new Set(KANTO_STARTER_ROSTER.flatMap((p) => p.types))
).sort();

/** Standard HP formula, 31 IVs, no EVs. */
function computeHp(baseHp: number, level: number) {
  return Math.floor(((2 * baseHp + 31) * level) / 100) + level + 10;
}

export default function KantoTeamPage() {
  const { user } = useUserStore() as any;
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const [existingTeam, setExistingTeam] = useState<JourneyPokemon[] | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!user) {
      setSignedOut(true);
      return;
    }
    try {
      const region = getRegionState(user.username, 'kanto');
      if (region.team && region.team.length === 6) setExistingTeam(region.team);
    } catch (err) {
      console.error('[journey] could not read saved progress:', err);
    }
  }, [user]);

  const roster = useMemo(() => {
    const q = search.trim().toLowerCase();
    return KANTO_STARTER_ROSTER.filter((p) => {
      if (typeFilter && !p.types.includes(typeFilter)) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [typeFilter, search]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 6) return prev;
      return [...prev, id];
    });
  };

  const handleConfirm = async () => {
    if (selected.length !== 6 || confirming) return;
    setConfirming(true);
    setError(null);
    setProgress(0);

    try {
      const team: JourneyPokemon[] = [];
      for (let i = 0; i < selected.length; i++) {
        const id = selected[i];
        const entry = KANTO_STARTER_ROSTER.find((p) => p.id === id)!;

        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (!res.ok) throw new Error(`PokeAPI returned ${res.status} for #${id}`);
        const data = await res.json();

        const statOf = (n: string) =>
          data.stats.find((s: any) => s.stat.name === n)?.base_stat ?? 50;
        const maxHp = computeHp(statOf('hp'), START_LEVEL);

        team.push({
          pokemonId: id,
          name: entry.name,
          level: START_LEVEL,
          types: entry.types,
          stats: {
            attack: statOf('attack'),
            defense: statOf('defense'),
            'special-attack': statOf('special-attack'),
            'special-defense': statOf('special-defense'),
            speed: statOf('speed'),
          },
          maxHp,
          currentHp: maxHp,
          moves: buildMoveset(entry.types),
          spriteUrl: sprite(id),
          frontSpriteUrl: sprite(id),
          status: null,
          evolutionStage: getEvolutionStage(id),
        });

        setProgress(i + 1);
      }

      setTeam(user.username, 'kanto', team);
      router.push('/journey/kanto/map');
    } catch (err: any) {
      console.error('[journey] team confirmation failed:', err);
      setError(
        err?.message
          ? `Could not build your team: ${err.message}`
          : 'Could not build your team. Check your connection and try again.'
      );
      setConfirming(false);
    }
  };

  // ---------- Guarded states (never blank) ----------

  if (!mounted) return <Status title="LOADING" body="Preparing the Kanto roster…" />;

  if (signedOut) {
    return (
      <Status
        title="NOT SIGNED IN"
        body="Sign in to begin your Kanto Journey."
        action={{ href: '/auth', label: 'Sign In' }}
      />
    );
  }

  if (existingTeam) {
    return (
      <Status
        title="TEAM ALREADY CHOSEN"
        body={`Your Kanto team is locked in: ${existingTeam
          .map((p) => p.name)
          .join(', ')}. A region's team stays fixed for the whole run.`}
        action={{ href: '/journey/kanto/map', label: 'Go to Map' }}
      />
    );
  }

  // ---------- Selection UI ----------

  return (
    <div className="journey-root min-h-screen p-3 md:p-6 text-slate-200">
      <div className="max-w-5xl mx-auto">

        <div className="panel flex items-center justify-between px-3 py-2 mb-3">
          <div className="min-w-0">
            <p className="pixel-font text-[10px] text-yellow-300">CHOOSE YOUR SIX</p>
            <p className="text-[9px] text-slate-400 mt-1">
              Base-stage Kanto Pokémon only · No Legendaries · No duplicates · Fixed for the region
            </p>
          </div>
          <Link href="/journey" className="text-[10px] text-slate-400 hover:text-white underline shrink-0">
            ← Regions
          </Link>
        </div>

        {/* Selected slots */}
        <div className="panel p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="pixel-font text-[9px] text-slate-400">PARTY</span>
            <span className="text-[10px] text-slate-400">{selected.length}/6 · starts at Lv{START_LEVEL}</span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, i) => {
              const id = selected[i];
              const entry = id ? KANTO_STARTER_ROSTER.find((p) => p.id === id) : null;
              return (
                <button
                  key={i}
                  onClick={() => entry && toggle(entry.id)}
                  disabled={!entry}
                  className={`slot aspect-square flex flex-col items-center justify-center ${
                    entry ? 'slot-filled' : 'slot-empty'
                  }`}
                >
                  {entry ? (
                    <>
                      <img src={sprite(entry.id)} alt={entry.name} className="w-10 h-10 md:w-12 md:h-12 object-contain image-pixelated" />
                      <span className="text-[7px] md:text-[8px] font-bold uppercase truncate w-full text-center px-0.5">
                        {entry.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-700 text-lg">·</span>
                  )}
                </button>
              );
            })}
          </div>

          {error && <p className="text-[10px] text-red-400 mt-3">{error}</p>}

          <button
            onClick={handleConfirm}
            disabled={selected.length !== 6 || confirming}
            className="confirm-btn w-full mt-3"
          >
            {confirming
              ? `Preparing your team… ${progress}/6`
              : selected.length === 6
              ? 'Confirm Team & Set Out'
              : `Choose ${6 - selected.length} more`}
          </button>
        </div>

        {/* Filters */}
        <div className="panel p-3 mb-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="search-input w-full mb-2"
          />
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setTypeFilter(null)}
              className={`filter-chip ${!typeFilter ? 'filter-on' : ''}`}
            >
              All
            </button>
            {ALL_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(typeFilter === t ? null : t)}
                className={`filter-chip ${typeFilter === t ? 'filter-on' : ''}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Roster grid */}
        <div className="panel p-3">
          <p className="pixel-font text-[9px] text-slate-400 mb-3">
            ELIGIBLE · {roster.length}
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
            {roster.map((p) => {
              const isPicked = selected.includes(p.id);
              const full = selected.length >= 6 && !isPicked;
              return (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  disabled={full}
                  className={`mon-card flex flex-col items-center px-1 py-2 ${
                    isPicked ? 'mon-picked' : full ? 'mon-disabled' : ''
                  }`}
                >
                  <img
                    src={sprite(p.id)}
                    alt={p.name}
                    loading="lazy"
                    className="w-12 h-12 object-contain image-pixelated"
                  />
                  <span className="text-[8px] font-bold uppercase truncate w-full text-center">
                    {p.name}
                  </span>
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                    {p.types.map((t) => (
                      <span key={t} className="type-chip">{t.slice(0, 4)}</span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .pixel-font { font-family: 'Press Start 2P', monospace; line-height: 1.7; }
        .image-pixelated { image-rendering: pixelated; }

        .journey-root {
          background: #0b1120;
          background-image:
            linear-gradient(0deg, rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 16px 16px;
          font-family: ui-monospace, monospace;
        }

        .panel {
          background: #0f172a;
          border: 3px solid #334155;
          box-shadow: inset -2px -2px 0 rgba(0,0,0,0.5), inset 2px 2px 0 rgba(255,255,255,0.05);
        }

        .slot { background: #020617; border: 2px solid #1e293b; }
        .slot-filled { border-color: #facc15; }
        .slot-empty { cursor: default; }

        .mon-card {
          background: #020617;
          border: 2px solid #1e293b;
          transition: transform 0.1s ease;
        }
        .mon-card:hover:not(:disabled) { transform: translateY(-2px); border-color: #475569; }
        .mon-picked { border-color: #facc15; background: rgba(250,204,21,0.08); }
        .mon-disabled { opacity: 0.3; cursor: not-allowed; }

        .type-chip {
          font-size: 7px;
          text-transform: uppercase;
          padding: 0 3px;
          border: 1px solid #334155;
          color: #94a3b8;
        }

        .search-input {
          background: #020617;
          border: 2px solid #334155;
          color: #e2e8f0;
          padding: 8px 10px;
          font-size: 11px;
          font-family: ui-monospace, monospace;
        }
        .search-input:focus { outline: none; border-color: #facc15; }

        .filter-chip {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 4px 8px;
          border: 2px solid #334155;
          background: #020617;
          color: #94a3b8;
        }
        .filter-chip:hover { border-color: #475569; }
        .filter-on { border-color: #facc15; color: #facc15; background: rgba(250,204,21,0.1); }

        .confirm-btn {
          padding: 12px;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          background: #facc15;
          color: #1c1917;
          border-bottom: 4px solid #a16207;
        }
        .confirm-btn:disabled { background: #475569; color: #94a3b8; border-bottom-color: #1e293b; cursor: not-allowed; }
        .confirm-btn:active:not(:disabled) { transform: translateY(3px); border-bottom-width: 1px; }
      `}</style>
    </div>
  );
}

function Status({
  title, body, action,
}: { title: string; body: string; action?: { href: string; label: string } }) {
  return (
    <div className="status-root min-h-screen flex items-center justify-center p-6 text-slate-200">
      <div className="status-panel max-w-sm w-full p-6 text-center">
        <p className="status-title text-[11px] mb-3">{title}</p>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-5">{body}</p>
        <div className="flex gap-2 justify-center flex-wrap">
          {action && (
            <Link href={action.href} className="status-btn status-btn-primary">{action.label}</Link>
          )}
          <Link href="/journey" className="status-btn status-btn-quiet">All Regions</Link>
        </div>
      </div>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .status-root { background: #0b1120; font-family: ui-monospace, monospace; }
        .status-panel {
          background: #0f172a;
          border: 3px solid #334155;
          box-shadow: inset -2px -2px 0 rgba(0,0,0,0.5), inset 2px 2px 0 rgba(255,255,255,0.05);
        }
        .status-title { font-family: 'Press Start 2P', monospace; line-height: 1.7; color: #facc15; }
        .status-btn {
          display: inline-block;
          padding: 10px 18px;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border-bottom-width: 4px;
          border-bottom-style: solid;
        }
        .status-btn:active { transform: translateY(3px); border-bottom-width: 1px; }
        .status-btn-primary { background: #facc15; color: #1c1917; border-bottom-color: #a16207; }
        .status-btn-quiet { background: #475569; color: #ffffff; border-bottom-color: #1e293b; }
      `}</style>
    </div>
  );
}