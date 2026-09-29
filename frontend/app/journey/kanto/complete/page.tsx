"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import { KANTO_GYMS, KANTO_BADGES, getEvolutionStage } from '../../data/kanto';
import { getRegionState, type JourneyRegionState } from '../../lib/journeyStorage';

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

export default function KantoCompletePage() {
  const { user } = useUserStore() as any;
  const router = useRouter();
  const [region, setRegion] = useState<JourneyRegionState | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    const state = getRegionState(user.username, 'kanto');
    if (!state.regionComplete) {
      router.push('/journey/kanto/map');
      return;
    }
    setRegion(state);
    setMounted(true);
  }, [user, router]);

  if (!mounted || !region || !user) return null;

  const team = region.team || [];
  const stats = region.stats;
  const days =
    stats.startedAt && stats.completedAt
      ? Math.max(
          1,
          Math.round(
            (new Date(stats.completedAt).getTime() - new Date(stats.startedAt).getTime()) /
              86400000
          )
        )
      : null;
  const highestLevel = team.length ? Math.max(...team.map((p) => p.level)) : 0;
  const fullyEvolved = team.filter((p) => getEvolutionStage(p.pokemonId) >= 2).length;

  return (
    <div className="journey-root min-h-screen p-3 md:p-8 text-slate-200">
      <div className="max-w-3xl mx-auto">

        {/* Title */}
        <div className="text-center mb-6">
          <p className="text-[9px] uppercase tracking-[0.35em] text-slate-500 mb-2">Hall of Fame</p>
          <h1 className="pixel-font text-base md:text-2xl text-yellow-300 hof-title">KANTO COMPLETE</h1>
          <p className="text-[11px] text-slate-400 mt-3 max-w-md mx-auto">
            Eight gyms, eight badges. {user.username} has conquered the Kanto region.
          </p>
        </div>

        {/* Badge collection */}
        <div className="panel p-4 md:p-6 mb-3">
          <p className="pixel-font text-[9px] text-slate-400 mb-4 text-center">BADGE COLLECTION</p>
          <div className="grid grid-cols-4 gap-3 md:gap-4">
            {KANTO_BADGES.map((b, i) => (
              <div
                key={b.gymId}
                className="badge-cell flex flex-col items-center px-2 py-3"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span className="text-2xl md:text-3xl mb-1">🏅</span>
                <span className="text-[8px] md:text-[9px] font-black uppercase text-yellow-300 text-center leading-tight">
                  {b.name.replace(' Badge', '')}
                </span>
                <span className="text-[7px] text-slate-500 mt-0.5">{b.leader}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Final team */}
        <div className="panel p-4 md:p-6 mb-3">
          <p className="pixel-font text-[9px] text-slate-400 mb-4 text-center">FINAL TEAM</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {team.map((p, i) => (
              <div key={i} className="team-cell flex flex-col items-center px-2 py-3">
                <img
                  src={p.spriteUrl || `${SPRITE_BASE}/${p.pokemonId}.png`}
                  alt={p.name}
                  className="w-16 h-16 object-contain image-pixelated"
                />
                <span className="text-[10px] font-black uppercase truncate w-full text-center mt-1">
                  {p.name}
                </span>
                <span className="text-[9px] text-yellow-400">Lv{p.level}</span>
                <div className="flex gap-1 mt-1">
                  {p.types.map((t) => (
                    <span key={t} className="type-chip">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Region stats */}
        <div className="panel p-4 md:p-6 mb-3">
          <p className="pixel-font text-[9px] text-slate-400 mb-4 text-center">REGION STATISTICS</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Stat label="Badges" value={`${region.completedGyms.length}/8`} />
            <Stat label="Gyms Won" value={stats.battlesWon} />
            <Stat label="Losses" value={stats.battlesLost} />
            <Stat label="Turns Fought" value={stats.totalTurns} />
            <Stat label="Highest Level" value={highestLevel} />
            <Stat label="Evolved" value={`${fullyEvolved}/${team.length}`} />
            {days !== null && <Stat label="Days on Journey" value={days} />}
          </div>
        </div>

        {/* What's next */}
        <div className="panel p-4 md:p-6 text-center">
          <p className="pixel-font text-[9px] text-green-400 mb-2">JOHTO UNLOCKED</p>
          <p className="text-[10px] text-slate-400 mb-1 max-w-md mx-auto">
            Your Kanto record is preserved. Johto starts fresh — you'll pick a new team of six
            from Johto-eligible Pokémon.
          </p>
          <p className="text-[9px] text-slate-600 mb-5">
            Johto isn't built yet, but the region will appear on the hub as soon as it ships.
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Link href="/journey" className="btn-green">Return to Region Hub</Link>
            <Link href="/journey/kanto/map" className="btn-grey">Revisit Kanto Map</Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .pixel-font { font-family: 'Press Start 2P', monospace; line-height: 1.7; }
        .image-pixelated { image-rendering: pixelated; }

        .journey-root {
          background:
            radial-gradient(circle at 50% -10%, rgba(250,204,21,0.10), transparent 55%),
            #0b1120;
          font-family: ui-monospace, monospace;
        }

        .panel {
          background: #0f172a;
          border: 3px solid #334155;
          box-shadow: inset -2px -2px 0 rgba(0,0,0,0.5), inset 2px 2px 0 rgba(255,255,255,0.05);
        }

        .hof-title { text-shadow: 3px 3px 0 rgba(0,0,0,0.9), 0 0 24px rgba(250,204,21,0.35); }

        .badge-cell {
          background: #020617;
          border: 2px solid #a16207;
          opacity: 0;
          animation: badgeIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes badgeIn {
          0% { opacity: 0; transform: scale(0.4) rotate(-20deg); }
          100% { opacity: 1; transform: scale(1) rotate(0); }
        }

        .team-cell {
          background: #020617;
          border: 2px solid #334155;
        }

        .type-chip {
          font-size: 7px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 1px 4px;
          border: 1px solid #334155;
          background: #0f172a;
          color: #94a3b8;
        }

        .stat-cell {
          background: #020617;
          border: 2px solid #1e293b;
          padding: 10px;
          text-align: center;
        }

        .btn-green, .btn-grey {
          display: inline-block;
          padding: 12px 24px;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border-bottom-width: 4px;
          border-bottom-style: solid;
        }
        .btn-green:active, .btn-grey:active { transform: translateY(3px); border-bottom-width: 1px; }
        .btn-green { background: #22c55e; color: #052e16; border-bottom-color: #15803d; }
        .btn-grey  { background: #475569; color: #ffffff; border-bottom-color: #1e293b; }
      `}</style>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat-cell">
      <p className="text-[8px] uppercase tracking-widest text-slate-500">{label}</p>
      <p className="text-base font-black text-yellow-300 mt-1">{value}</p>
    </div>
  );
}