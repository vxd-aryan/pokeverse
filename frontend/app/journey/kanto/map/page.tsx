"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import { KANTO_GYMS, KANTO_LEVEL_CURVE } from '../../data/kanto';
import { getRegionState } from '../../lib/journeyStorage';
import type { JourneyRegionState } from '../../lib/journeyStorage';

export default function KantoMapPage() {
  const { user } = useUserStore() as any;
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [regionState, setRegionState] = useState<JourneyRegionState | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    const state = getRegionState(user.username, 'kanto');
    if (!state.team || state.team.length !== 6) {
      router.push('/journey/kanto/team');
      return;
    }
    setRegionState(state);
    setMounted(true);
  }, [user, router]);

  if (!mounted || !user || !regionState) return null;

  const completedCount = regionState.completedGyms.length;
  const nextGym = KANTO_GYMS.find((g) => !regionState.completedGyms.includes(g.id));
  const team = regionState.team || [];
  const avgLevel = team.length > 0 ? Math.round(team.reduce((sum, p) => sum + p.level, 0) / team.length) : 0;

  return (
    <div className="journey-root min-h-screen p-4 md:p-8 text-white">
      <div className="max-w-2xl mx-auto">
        {/* --- PROGRESS HUD --- */}
        <div className="hud-panel rounded-xl p-4 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="pixel-font text-xs text-yellow-300">JOURNEY: KANTO</span>
            <Link href="/journey" className="text-[10px] text-slate-400 hover:text-white underline">
              ← All Regions
            </Link>
          </div>
          <div className="text-xs text-slate-300 mb-1 flex justify-between">
            <span>Gym Progress</span>
            <span>{completedCount} / {KANTO_GYMS.length}</span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-3 border border-slate-700">
            <div
              className="h-full bg-yellow-400 transition-all duration-500"
              style={{ width: `${(completedCount / KANTO_GYMS.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-wide">
            <span>Team Avg Lv: {avgLevel}</span>
            <span>
              Current Target:{' '}
              {nextGym ? (
                <span className="text-yellow-300 font-bold">{nextGym.gymName}</span>
              ) : (
                <span className="text-green-400 font-bold">Region Complete!</span>
              )}
            </span>
          </div>
        </div>

        {/* --- ROM-STYLE MAP --- */}
        <div className="rom-map-frame rounded-2xl p-6 md:p-10 relative">
          <div className="flex flex-col items-center gap-0">
            {KANTO_GYMS.map((gym, idx) => {
              const isCompleted = regionState.completedGyms.includes(gym.id);
              const isCurrent = !isCompleted && nextGym?.id === gym.id;
              const isLocked = !isCompleted && !isCurrent;

              return (
                <div key={gym.id} className="flex flex-col items-center w-full">
                  {/* Route connector line (skip before the first node) */}
                  {idx > 0 && (
                    <div className={`route-line ${isCompleted || isCurrent || KANTO_GYMS.slice(0, idx).every(g => regionState.completedGyms.includes(g.id)) ? 'route-line-active' : ''}`} />
                  )}

                  {/* Player marker sits just above the current gym */}
                  {isCurrent && (
                    <div className="player-marker mb-1" title="You are here">
                      <div className="player-face">
                        <span className="eye eye-left" />
                        <span className="eye eye-right" />
                      </div>
                    </div>
                  )}

                  <Link
                    href={isCurrent ? `/journey/kanto/gym/${gym.id}` : '#'}
                    onClick={(e) => {
                      if (!isCurrent) e.preventDefault();
                    }}
                    className={`gym-node w-full max-w-sm rounded-xl border-2 p-4 flex items-center justify-between transition-all ${
                      isCompleted
                        ? 'border-green-500 bg-green-900/20'
                        : isCurrent
                        ? 'border-yellow-400 bg-yellow-400/10 cursor-pointer hover:bg-yellow-400/20'
                        : 'border-slate-700 bg-slate-900/50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-slate-400">
                        Gym {gym.order} · {gym.type} Type
                      </p>
                      <p className="font-black uppercase text-sm">{gym.gymName}</p>
                      <p className="text-xs text-slate-400">Leader: {gym.name}</p>
                    </div>
                    <div className="text-2xl">
                      {isCompleted ? '🏅' : isCurrent ? '🏟️' : '🔒'}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          {!nextGym && (
            <div className="mt-8 text-center">
              <p className="pixel-font text-sm text-green-400 mb-3">KANTO COMPLETE!</p>
              <p className="text-xs text-slate-400">
                All 8 badges earned. More regions are on the way in a future update.
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .pixel-font { font-family: 'Press Start 2P', monospace; }
        .journey-root { background: radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 100%); }

        .hud-panel {
          background: #0f172a;
          border: 2px solid #334155;
        }

        .rom-map-frame {
          background-color: #14532d;
          background-image: repeating-linear-gradient(
            0deg,
            rgba(255,255,255,0.03) 0px,
            rgba(255,255,255,0.03) 2px,
            transparent 2px,
            transparent 10px
          );
          border: 4px solid #1e293b;
        }

        .route-line {
          width: 4px;
          height: 28px;
          background: #052e16;
        }
        .route-line-active {
          background: #facc15;
        }

        .gym-node {
          box-shadow: 0 4px 0 rgba(0,0,0,0.3);
        }

        .player-marker {
          animation: bob-marker 1.4s ease-in-out infinite;
        }
        @keyframes bob-marker {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .player-face {
          width: 28px;
          height: 28px;
          background: #fbbf24;
          border: 2px solid #78350f;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          image-rendering: pixelated;
        }
        .eye {
          width: 4px;
          height: 4px;
          background: #1c1917;
          display: inline-block;
          animation: blink-eyes 3s infinite;
        }
        @keyframes blink-eyes {
          0%, 92%, 100% { opacity: 1; height: 4px; }
          95% { opacity: 1; height: 1px; }
        }
      `}</style>
    </div>
  );
}