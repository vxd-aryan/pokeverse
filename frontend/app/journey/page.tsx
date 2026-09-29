"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { REGION_ORDER, IMPLEMENTED_REGIONS, isRegionUnlocked, getRegionState } from './lib/journeyStorage';
import { KANTO_GYMS } from './data/kanto';

const REGION_LABELS: Record<string, string> = {
  kanto: 'Kanto', johto: 'Johto', hoenn: 'Hoenn', sinnoh: 'Sinnoh',
  unova: 'Unova', kalos: 'Kalos', alola: 'Alola', galar: 'Galar', paldea: 'Paldea',
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
    <div className="journey-root min-h-screen p-4 md:p-10 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="pixel-font text-xl md:text-2xl mb-2 text-yellow-300 drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)]">
          Trainer Journey
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          Travel region by region, earn every gym badge, and grow your team from scratch each time.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {REGION_ORDER.map((regionId) => {
            const isImplemented = IMPLEMENTED_REGIONS.includes(regionId);
            const unlocked = isImplemented && isRegionUnlocked(user.username, regionId);
            const regionState = isImplemented ? getRegionState(user.username, regionId) : null;
            const complete = regionState?.regionComplete;
            const gymCount = regionId === 'kanto' ? KANTO_GYMS.length : 0;
            const gymsDone = regionState?.completedGyms.length || 0;

            const content = (
              <div
                className={`journey-region-card p-4 rounded-xl border-2 h-32 flex flex-col justify-between ${
                  !unlocked
                    ? 'border-slate-700 bg-slate-900/50 opacity-60'
                    : complete
                    ? 'border-green-500 bg-green-900/20'
                    : 'border-yellow-500 bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black uppercase tracking-wide text-sm">
                    {REGION_LABELS[regionId]}
                  </span>
                  {!unlocked && <span className="text-lg">🔒</span>}
                  {complete && <span className="text-lg">✅</span>}
                </div>
                {isImplemented ? (
                  <div className="text-xs text-slate-400">
                    {complete ? 'Region complete!' : unlocked ? `Gyms: ${gymsDone}/${gymCount}` : 'Locked'}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic">Coming soon</div>
                )}
              </div>
            );

            return unlocked ? (
              <Link key={regionId} href={`/journey/${regionId}/map`}>
                {content}
              </Link>
            ) : (
              <div key={regionId} className="cursor-not-allowed">
                {content}
              </div>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .pixel-font { font-family: 'Press Start 2P', monospace; }
        .journey-root {
          background: radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 100%);
        }
        .journey-region-card {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        a:hover .journey-region-card {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px -8px rgba(250, 204, 21, 0.3);
        }
      `}</style>
    </div>
  );
}