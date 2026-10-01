"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import {
  REGION_ORDER, getRegion, regionName, isImplemented, previousRegionId,
} from './data/regions';
import { getRegionState, hasStarted, isRegionUnlocked } from './lib/journeyStorage';
import { journeyStyles, GlobalStyle } from './components/JourneyShell';

// ============================================================
// REGION HUB
// ============================================================
// Lists every region in canonical order. Built ones are playable;
// the rest show as coming soon, so the shape of the whole Journey
// is visible from the first visit.
// ============================================================

export default function JourneyHubPage() {
  const { user } = useUserStore() as any;
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    setMounted(true);
  }, [user, router]);

  if (!mounted || !user) return null;

  return (
    <div className="jr-root min-h-screen p-4 md:p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="jr-pixel text-sm md:text-xl mb-2 text-yellow-300">TRAINER JOURNEY</h1>
        <p className="text-[11px] text-slate-400 mb-8 max-w-lg leading-relaxed">
          Pick a starter, explore the routes, catch your own team and earn every badge.
          Each region is its own run, with its own starters, leaders and wild Pokémon.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {REGION_ORDER.map((rid, i) => {
            const built = isImplemented(rid);
            const region = getRegion(rid);
            const unlocked = built && isRegionUnlocked(user.username, previousRegionId(rid));
            const state = built ? getRegionState(user.username, rid, region!.map.nodes[0]?.id) : null;
            const complete = state?.regionComplete;
            const total = region?.challenges.length ?? 8;
            const cleared = state?.clearedChallenges.length ?? 0;
            const started = state ? hasStarted(state) : false;

            const href = !unlocked
              ? '#'
              : complete
              ? `/journey/${rid}/complete`
              : started
              ? `/journey/${rid}/map`
              : `/journey/${rid}/starter`;

            const card = (
              <div
                className={`hub-card p-3 h-36 flex flex-col justify-between border-2 jr-stagger ${
                  !built
                    ? 'border-slate-800 bg-slate-900/40 opacity-50'
                    : !unlocked
                    ? 'border-slate-800 bg-slate-900/50 opacity-60'
                    : complete
                    ? 'border-green-500 bg-green-900/20'
                    : 'border-yellow-500 bg-slate-900'
                }`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-black uppercase tracking-wide text-xs">
                      {regionName(rid)}
                    </span>
                    <span className="text-base leading-none">
                      {!built ? '🔧' : !unlocked ? '🔒' : complete ? '🏆' : '🗺️'}
                    </span>
                  </div>
                  {region && (
                    <p className="text-[8px] text-slate-500 mt-1 leading-snug line-clamp-2">
                      {region.tagline}
                    </p>
                  )}
                </div>

                {built ? (
                  <div>
                    {unlocked && (
                      <div className="h-1.5 bg-slate-950 border border-slate-700 overflow-hidden mb-1.5">
                        <div
                          className={`h-full jr-fill ${complete ? 'bg-green-500' : 'bg-yellow-400'}`}
                          style={{ width: `${(cleared / total) * 100}%` }}
                        />
                      </div>
                    )}
                    <p className="text-[9px] text-slate-400 uppercase tracking-wide">
                      {complete
                        ? `All ${total} earned`
                        : !unlocked
                        ? 'Locked'
                        : !started
                        ? 'Choose your starter'
                        : `${region!.rewardNoun} ${cleared}/${total}`}
                    </p>
                  </div>
                ) : (
                  <p className="text-[9px] text-slate-600 italic uppercase tracking-wide">
                    Coming soon
                  </p>
                )}
              </div>
            );

            return unlocked ? (
              <Link key={rid} href={href}>{card}</Link>
            ) : (
              <div key={rid} className="cursor-not-allowed">{card}</div>
            );
          })}
        </div>
      </div>

      <GlobalStyle css={journeyStyles} />
      <GlobalStyle css={`
        .hub-card {
          box-shadow: 0 4px 0 rgba(0,0,0,0.4);
          transition: transform var(--t-fast) var(--ease);
        }
        a:hover .hub-card { transform: translateY(-3px); }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `} />
    </div>
  );
}
