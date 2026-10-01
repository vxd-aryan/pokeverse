"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import {
  REGION_ORDER,
  IMPLEMENTED_REGIONS,
  isRegionUnlocked,
  getRegionState,
  hasStarted,
} from './lib/journeyStorage';
import { KANTO_GYMS } from './data/kanto';

const REGION_LABELS: Record<string, string> = {
  kanto: 'Kanto', johto: 'Johto', hoenn: 'Hoenn', sinnoh: 'Sinnoh',
  unova: 'Unova', kalos: 'Kalos', alola: 'Alola', galar: 'Galar', paldea: 'Paldea',
};

/** Gym count per region, for the hub cards. Only Kanto is real so far. */
const REGION_GYM_COUNT: Record<string, number> = {
  kanto: KANTO_GYMS.length,
};

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
    <div className="journey-root min-h-screen p-4 md:p-10 text-slate-200">
      <div className="max-w-4xl mx-auto">
        <h1 className="pixel-font text-sm md:text-xl mb-2 text-yellow-300">TRAINER JOURNEY</h1>
        <p className="text-[11px] text-slate-400 mb-8 max-w-lg">
          Pick a starter, explore the routes, catch your own team and earn every badge.
          Kanto follows FireRed / LeafGreen.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {REGION_ORDER.map((regionId) => {
            const implemented = IMPLEMENTED_REGIONS.includes(regionId);
            const unlocked = implemented && isRegionUnlocked(user.username, regionId);
            const state = implemented ? getRegionState(user.username, regionId) : null;
            const complete = state?.regionComplete;
            const gymCount = REGION_GYM_COUNT[regionId] ?? 8;
            const gymsDone = state?.completedGyms.length ?? 0;
            const started = !!state && hasStarted(state);

            const href = !unlocked
              ? '#'
              : complete
              ? `/journey/${regionId}/complete`
              : started
              ? `/journey/${regionId}/map`
              : `/journey/${regionId}/starter`;

            const card = (
              <div
                className={`region-card p-3 h-32 flex flex-col justify-between border-2 ${
                  !unlocked
                    ? 'border-slate-800 bg-slate-900/50 opacity-60'
                    : complete
                    ? 'border-green-500 bg-green-900/20'
                    : 'border-yellow-500 bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-black uppercase tracking-wide text-xs">
                    {REGION_LABELS[regionId]}
                  </span>
                  <span className="text-base leading-none">
                    {!unlocked ? '🔒' : complete ? '🏆' : '🗺️'}
                  </span>
                </div>

                {implemented ? (
                  <div>
                    {unlocked && (
                      <div className="h-1.5 bg-slate-950 border border-slate-700 overflow-hidden mb-1.5">
                        <div
                          className={`h-full ${complete ? 'bg-green-500' : 'bg-yellow-400'}`}
                          style={{ width: `${(gymsDone / gymCount) * 100}%` }}
                        />
                      </div>
                    )}
                    <p className="text-[9px] text-slate-400 uppercase tracking-wide">
                      {complete
                        ? `All ${gymCount} badges earned`
                        : !unlocked
                        ? 'Locked'
                        : !started
                        ? 'Choose your starter'
                        : `Badges ${gymsDone}/${gymCount}`}
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
              <Link key={regionId} href={href}>{card}</Link>
            ) : (
              <div key={regionId} className="cursor-not-allowed">{card}</div>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .pixel-font { font-family: 'Press Start 2P', monospace; line-height: 1.7; }
        .journey-root {
          background: #0b1120;
          background-image:
            linear-gradient(0deg, rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 16px 16px;
          font-family: ui-monospace, monospace;
        }
        .region-card {
          box-shadow: 0 4px 0 rgba(0,0,0,0.4);
          transition: transform 0.12s ease;
        }
        a:hover .region-card { transform: translateY(-3px); }
      `}</style>
    </div>
  );
}
