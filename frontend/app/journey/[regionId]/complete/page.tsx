"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import { getRegion, REGION_ORDER, regionName, isImplemented } from '../../data/regions';
import { rewardsOf } from '../../data/types';
import { getEvolutionStage } from '../../data/evolution';
import { frontSprite } from '../../lib/fetchMon';
import { getRegionState, type JourneyRegionState } from '../../lib/journeyStorage';
import { JourneyShell, StatusCard, journeyStyles, GlobalStyle } from '../../components/JourneyShell';

// ============================================================
// HALL OF FAME
// ============================================================
// Shown once a region's last challenge falls. Region-agnostic:
// the rewards, the count and the name all come from region data.
// ============================================================

export default function CompletePage() {
  const { regionId } = useParams();
  const { user } = useUserStore() as any;
  const rid = String(regionId);
  const region = getRegion(rid);

  const [mounted, setMounted] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [state, setState] = useState<JourneyRegionState | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!user) { setBlocked('no-user'); return; }
    if (!region) { setBlocked('no-region'); return; }
    const s = getRegionState(user.username, rid, region.map.nodes[0]?.id);
    if (!s.regionComplete) { setBlocked('not-complete'); return; }
    setState(s);
  }, [user, rid, region]);

  if (!mounted) return <JourneyShell><StatusCard title="HALL OF FAME" body="Opening the doors…" /></JourneyShell>;

  if (blocked) {
    const copy: Record<string, { title: string; body: string; href: string; label: string }> = {
      'no-user': { title: 'NOT SIGNED IN', body: 'Sign in to view your record.', href: '/auth', label: 'Sign In' },
      'no-region': { title: 'UNKNOWN REGION', body: 'There is no region by that name.', href: '/journey', label: 'All Regions' },
      'not-complete': {
        title: 'NOT YET',
        body: `The Hall of Fame opens once every ${region?.rewardNoun.toLowerCase() ?? 'badge'} is earned.`,
        href: `/journey/${rid}/map`, label: 'Back to Map',
      },
    };
    const c = copy[blocked] ?? copy['no-region'];
    return <JourneyShell><StatusCard title={c.title} body={c.body} action={{ href: c.href, label: c.label }} /></JourneyShell>;
  }

  if (!region || !state) return null;

  const party = state.party;
  const stats = state.stats;
  const rewards = rewardsOf(region);
  const days =
    stats.startedAt && stats.completedAt
      ? Math.max(1, Math.round(
          (new Date(stats.completedAt).getTime() - new Date(stats.startedAt).getTime()) / 86400000
        ))
      : null;
  const highestLevel = party.length ? Math.max(...party.map((p) => p.level)) : 0;
  const evolved = party.filter((p) => getEvolutionStage(p.pokemonId) >= 2).length;

  // What comes next in the chain.
  const idx = REGION_ORDER.indexOf(rid);
  const nextId = idx >= 0 && idx < REGION_ORDER.length - 1 ? REGION_ORDER[idx + 1] : null;
  const nextBuilt = nextId ? isImplemented(nextId) : false;

  return (
    <div className="jr-root hof-root min-h-screen p-3 md:p-8">
      <div className="max-w-3xl mx-auto">

        <div className="text-center mb-6">
          <p className="text-[9px] uppercase tracking-[0.35em] text-slate-500 mb-2">Hall of Fame</p>
          <h1 className="jr-pixel text-base md:text-2xl text-yellow-300 hof-title">
            {region.name.toUpperCase()} COMPLETE
          </h1>
          <p className="text-[11px] text-slate-400 mt-3 max-w-md mx-auto">
            {region.challenges.length} challenges, {region.challenges.length}{' '}
            {region.rewardNoun.toLowerCase()}. {user.username} has conquered {region.name}.
          </p>
        </div>

        <div className="jr-panel p-4 md:p-6 mb-3">
          <p className="jr-pixel text-[9px] text-slate-400 mb-4 text-center">
            {region.rewardNoun.toUpperCase()}
          </p>
          <div className="grid grid-cols-4 gap-3 md:gap-4">
            {rewards.map((b, i) => (
              <div
                key={b.challengeId}
                className="hof-cell flex flex-col items-center px-2 py-3"
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

        <div className="jr-panel p-4 md:p-6 mb-3">
          <p className="jr-pixel text-[9px] text-slate-400 mb-4 text-center">FINAL TEAM</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {party.map((p, i) => (
              <div key={i} className="jr-inset flex flex-col items-center px-2 py-3">
                <img src={frontSprite(p.pokemonId)} alt={p.name} className="w-16 h-16 object-contain jr-pixelated" />
                <span className="text-[10px] font-black uppercase truncate w-full text-center mt-1">{p.name}</span>
                <span className="text-[9px] text-yellow-400">Lv{p.level}</span>
                <div className="flex gap-1 mt-1">
                  {p.types.map((t) => <span key={t} className="jr-type">{t}</span>)}
                </div>
                {p.caughtAt && <span className="text-[7px] text-slate-600 mt-1">{p.caughtAt}</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="jr-panel p-4 md:p-6 mb-3">
          <p className="jr-pixel text-[9px] text-slate-400 mb-4 text-center">REGION STATISTICS</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Stat label={region.rewardNoun} value={`${state.clearedChallenges.length}/${region.challenges.length}`} />
            <Stat label="Caught" value={state.caught.length} />
            <Stat label="Seen" value={state.seen.length} />
            <Stat label="Wild Battles" value={stats.wildBattles} />
            <Stat label="Trainers Beaten" value={stats.trainerBattles} />
            <Stat label="Steps Taken" value={stats.stepsTaken} />
            <Stat label="Blackouts" value={stats.battlesLost} />
            <Stat label="Highest Level" value={highestLevel} />
            <Stat label="Evolved" value={`${evolved}/${party.length}`} />
            {days !== null && <Stat label="Days" value={days} />}
          </div>
        </div>

        <div className="jr-panel p-4 md:p-6 text-center">
          {nextId ? (
            <>
              <p className="jr-pixel text-[9px] text-green-400 mb-2">
                {regionName(nextId).toUpperCase()} UNLOCKED
              </p>
              <p className="text-[10px] text-slate-400 mb-1 max-w-md mx-auto">
                Your {region.name} record is preserved. {regionName(nextId)} starts fresh — a new
                starter, a new team, caught from scratch.
              </p>
              {!nextBuilt && (
                <p className="text-[9px] text-slate-600 mb-4">
                  {regionName(nextId)} isn’t built yet. It appears on the hub the moment it ships.
                </p>
              )}
              <div className="flex gap-2 justify-center flex-wrap mt-4">
                {nextBuilt && (
                  <Link href={`/journey/${nextId}/starter`} className="jr-btn jr-btn-green">
                    Begin {regionName(nextId)} →
                  </Link>
                )}
                <Link href="/journey" className="jr-btn jr-btn-grey">Region Hub</Link>
              </div>
            </>
          ) : (
            <>
              <p className="jr-pixel text-[9px] text-yellow-300 mb-2">EVERY REGION CONQUERED</p>
              <p className="text-[10px] text-slate-400 mb-4">
                There is nowhere left to go. Well done.
              </p>
              <Link href="/journey" className="jr-btn jr-btn-grey">Region Hub</Link>
            </>
          )}
        </div>
      </div>

      <GlobalStyle css={journeyStyles} />
      <GlobalStyle css={`
        .hof-root {
          background:
            radial-gradient(circle at 50% -10%, rgba(250,204,21,0.10), transparent 55%),
            #0b1120;
        }
        .hof-title { text-shadow: 3px 3px 0 rgba(0,0,0,0.9), 0 0 24px rgba(250,204,21,0.35); }
        .hof-cell {
          background: #020617;
          border: 2px solid #a16207;
          opacity: 0;
          animation: hofIn 0.45s var(--ease-pop) forwards;
        }
        @keyframes hofIn {
          from { opacity: 0; transform: scale(0.4) rotate(-20deg); }
          to   { opacity: 1; transform: none; }
        }
        .hof-stat { background: #020617; border: 2px solid #1e293b; padding: 10px; text-align: center; }
      `} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="hof-stat">
      <p className="text-[8px] uppercase tracking-widest text-slate-500">{label}</p>
      <p className="text-base font-black text-yellow-300 mt-1">{value}</p>
    </div>
  );
}
