"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import {
  REGION_ORDER, getRegion, regionName, isImplemented, previousRegionId,
} from './data/regions';
import {
  getRegionState, hasStarted, isRegionUnlocked, syncJourneyWithAccount,
} from './lib/journeyStorage';
import { journeyStyles, GlobalStyle } from './components/JourneyShell';

// ============================================================
// REGION HUB
// ============================================================
// Lists every region in canonical order. Built ones are playable;
// the rest show as coming soon, so the shape of the whole Journey
// is visible from the first visit.
//
// This page is also where the save is reconciled with the account.
// It is the entry point to every region, so a trainer arriving on
// a new browser passes through here before they can start a run —
// which is the moment to restore their progress, and the last
// moment before they would otherwise be offered a fresh starter.
// ============================================================

/**
 * What the account sync is doing.
 *
 *  checking  — asking the server, cards not drawn yet
 *  restored  — a newer save came down and replaced the local one
 *  local     — local save kept (it was newer, or the only one)
 *  offline   — server unreachable; playing from localStorage
 */
type SyncStatus = 'checking' | 'restored' | 'local' | 'offline';

export default function JourneyHubPage() {
  const { user } = useUserStore() as any;
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sync, setSync] = useState<SyncStatus>('checking');

  // Bumped once the sync finishes so the cards below re-read
  // localStorage. Without it, a restored save would sit in storage
  // while the already-rendered cards kept showing the old one —
  // the progress would be there, but only after a manual refresh.
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    setMounted(true);
  }, [user, router]);

  useEffect(() => {
    if (!user?.username) return;

    let cancelled = false;

    (async () => {
      try {
        const result = await syncJourneyWithAccount(user.username);
        if (cancelled) return;

        if (result.action === 'adopted-server') {
          setSync('restored');
          setRevision((n) => n + 1);
        } else if (result.action === 'failed') {
          setSync('offline');
        } else {
          // kept-local, no-server-save, signed-out — in all three
          // the local save is the one being played.
          setSync('local');
        }
      } catch {
        if (!cancelled) setSync('offline');
      }
    })();

    // Guards against setting state after the player has navigated
    // away, which React warns about and which would also stomp on
    // the next page's state.
    return () => { cancelled = true; };
  }, [user?.username]);

  if (!mounted || !user) return null;

  // Deliberately blocking rather than rendering the cards straight
  // away. Drawing "Choose your starter" and then flipping it to
  // "4/8 badges" a second later looks like a bug, and a trainer who
  // clicked in that first second would be offered a new starter
  // over the top of a finished run.
  if (sync === 'checking') {
    return (
      <div className="jr-root min-h-screen p-4 md:p-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="jr-pixel text-sm md:text-xl mb-2 text-yellow-300">TRAINER JOURNEY</h1>
          <div className="jr-panel p-6 text-center jr-fade mt-8">
            <p className="jr-pixel text-[11px] text-yellow-300 mb-3">CHECKING YOUR RECORDS</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Looking up your saved progress…
            </p>
          </div>
        </div>
        <GlobalStyle css={journeyStyles} />
      </div>
    );
  }

  return (
    <div className="jr-root min-h-screen p-4 md:p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="jr-pixel text-sm md:text-xl mb-2 text-yellow-300">TRAINER JOURNEY</h1>
        <p className="text-[11px] text-slate-400 mb-4 max-w-lg leading-relaxed">
          Pick a starter, explore the routes, catch your own team and earn every badge.
          Each region is its own run, with its own starters, leaders and wild Pokémon.
        </p>

        {sync === 'restored' && (
          <div className="mb-6 border-2 border-green-500 bg-green-900/20 p-3 jr-fade">
            <p className="text-[10px] text-green-300 uppercase tracking-wide">
              Progress restored from your account
            </p>
          </div>
        )}

        {sync === 'offline' && (
          <div className="mb-6 border-2 border-slate-700 bg-slate-900/60 p-3 jr-fade">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">
              Playing offline — progress is saved on this device and will sync later
            </p>
          </div>
        )}

        {sync === 'local' && <div className="mb-4" />}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {REGION_ORDER.map((rid, i) => {
            const built = isImplemented(rid);
            const region = getRegion(rid);
            const unlocked = built && isRegionUnlocked(user.username, previousRegionId(rid));
            // `revision` is read here only so this block re-runs after
            // a restore; the value itself is not otherwise used.
            void revision;
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