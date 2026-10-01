"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import BattleScene, { type BattleOutcome } from '../../../components/BattleScene';
import { TrainerSprite } from '../../../components/TrainerSprite';
import { KANTO_GYMS, type JourneyPokemon } from '../../../data/kanto';
import { trainerPrize } from '../../../data/kanto-items';
import { buildPokemon, frontSprite } from '../../../lib/fetchMon';
import {
  getRegionState, hasStarted, isGymAvailable, markGymComplete,
  markRegionComplete, addMoney, setParty, payoutOnLoss,
  type JourneyRegionState,
} from '../../../lib/journeyStorage';

// ============================================================
// GYM BATTLE
// ============================================================
// The milestone fights. Same battle scene as everything else —
// what makes a gym different is that you can't run, you can't
// catch, the party is fully restored on victory, and a badge
// comes out the other side.
// ============================================================

export default function GymPage() {
  const { gymId } = useParams();
  const router = useRouter();
  const { user } = useUserStore() as any;

  const [mounted, setMounted] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [region, setRegion] = useState<JourneyRegionState | null>(null);
  const [opponents, setOpponents] = useState<JourneyPokemon[] | null>(null);
  const [done, setDone] = useState<null | { prize: number; finalGym: boolean }>(null);

  const gym = KANTO_GYMS.find((g) => g.id === String(gymId));

  useEffect(() => {
    setMounted(true);
    if (!user) { setBlocked('no-user'); return; }
    if (!gym) { setBlocked('no-gym'); return; }

    const r = getRegionState(user.username, 'kanto');
    if (!hasStarted(r)) { setBlocked('no-starter'); return; }
    if (r.completedGyms.includes(gym.id)) { setBlocked('already-won'); return; }
    if (!isGymAvailable(r, KANTO_GYMS, gym.id)) { setBlocked('locked'); return; }
    if (!r.party.some((p) => p.currentHp > 0)) { setBlocked('party-fainted'); return; }

    setRegion(r);

    let cancelled = false;
    (async () => {
      try {
        const team = await Promise.all(gym.team.map((m) => buildPokemon(m.pokemonId, m.level)));
        if (!cancelled) setOpponents(team);
      } catch (err) {
        console.error('[journey] gym team failed to load:', err);
        if (!cancelled) setBlocked('load-failed');
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, gymId]);

  const handleEnd = (outcome: BattleOutcome) => {
    if (!gym || !region) return;
    setParty(user.username, 'kanto', outcome.party);

    if (outcome.result === 'win') {
      const top = Math.max(...gym.team.map((m) => m.level));
      const prize = trainerPrize(top, true);
      markGymComplete(user.username, 'kanto', gym.id); // also fully heals
      addMoney(user.username, 'kanto', prize);
      const finalGym = gym.order === KANTO_GYMS.length;
      if (finalGym) markRegionComplete(user.username, 'kanto');
      setDone({ prize, finalGym });
      return;
    }

    if (outcome.result === 'loss') {
      payoutOnLoss(user.username, 'kanto');
      setBlocked('lost');
      return;
    }

    router.push(`/journey/kanto/area/${gym.locationId}`);
  };

  // ---------- States ----------

  if (!mounted) return <Shell><Card title="ENTERING THE GYM" body="The doors swing open…" /></Shell>;

  const messages: Record<string, { title: string; body: string; href: string; label: string }> = {
    'no-user': { title: 'NOT SIGNED IN', body: 'Sign in to continue your Journey.', href: '/auth', label: 'Sign In' },
    'no-gym': { title: 'NO SUCH GYM', body: 'There is no gym by that name in Kanto.', href: '/journey/kanto/map', label: 'Back to Map' },
    'no-starter': { title: 'NO PARTNER YET', body: 'Professor Oak is waiting for you in Pallet Town.', href: '/journey/kanto/starter', label: "Oak's Lab" },
    'already-won': { title: 'BADGE ALREADY EARNED', body: `You have already beaten ${gym?.name}. Gym leaders battle you once.`, href: '/journey/kanto/map', label: 'Back to Map' },
    locked: { title: 'GYM LOCKED', body: 'Earn the earlier badges before challenging this leader.', href: '/journey/kanto/map', label: 'Back to Map' },
    'party-fainted': { title: 'YOUR PARTY IS IN NO SHAPE', body: 'Heal at a Pokémon Center before challenging a gym.', href: '/journey/kanto/map', label: 'Back to Map' },
    'load-failed': { title: 'COULD NOT LOAD THE GYM', body: 'The leader\'s team could not be fetched. Check your connection and try again.', href: '/journey/kanto/map', label: 'Back to Map' },
    lost: { title: 'YOU BLACKED OUT', body: `${gym?.name} was too strong this time. Your Pokémon were healed and you lost some money — come back stronger.`, href: '/journey/kanto/map', label: 'Back to Map' },
  };

  if (blocked) {
    const c = messages[blocked] ?? messages['no-gym'];
    return <Shell><Card title={c.title} body={c.body} action={{ href: c.href, label: c.label }} /></Shell>;
  }

  if (!gym) return null;

  // ---------- Victory ----------
  if (done) {
    return (
      <Shell>
        <div className="gm-panel p-6 md:p-8 text-center gm-fade" style={{ borderColor: '#16a34a' }}>
          <p className="gm-pixel text-xs md:text-sm text-green-400 mb-3">GYM LEADER DEFEATED</p>

          <div className="gm-portrait gm-beaten mx-auto mb-3">
            <TrainerSprite spriteKey={gym.spriteKey} alt={gym.name} className="w-20 h-20 object-contain" />
          </div>

          <p className="text-[11px] text-slate-300 italic mb-5 max-w-md mx-auto">“{gym.defeatQuote}”</p>

          <div className="gm-badge mx-auto mb-5 px-5 py-4 inline-flex flex-col items-center">
            <span className="text-4xl mb-1 gm-pop">🏅</span>
            <span className="gm-pixel text-[10px] text-yellow-300">{gym.badgeName.toUpperCase()}</span>
            <span className="text-[9px] text-slate-400 mt-1">Badge {gym.order} of {KANTO_GYMS.length}</span>
          </div>

          <p className="text-[10px] text-slate-400 mb-1">Prize money: <span className="text-yellow-300">₽{done.prize}</span></p>
          <p className="text-[9px] text-slate-500 mb-6">Your party was fully restored.</p>

          {done.finalGym ? (
            <Link href="/journey/kanto/complete" className="gm-btn gm-btn-green">Kanto Complete →</Link>
          ) : (
            <Link href="/journey/kanto/map" className="gm-btn gm-btn-green">Continue Journey →</Link>
          )}
        </div>
      </Shell>
    );
  }

  // ---------- Loading the team ----------
  if (!opponents || !region) {
    return (
      <Shell>
        <Card title="ENTERING THE GYM" body={`${gym.name} is waiting…`} />
      </Shell>
    );
  }

  // ---------- The fight ----------
  return (
    <Shell>
      <div className="gm-panel flex items-center justify-between px-3 py-2 mb-3">
        <div className="min-w-0">
          <p className="gm-pixel text-[9px] text-yellow-300 truncate">{gym.gymName.toUpperCase()}</p>
          <p className="text-[9px] text-slate-400">Gym {gym.order} · {gym.type} · {gym.badgeName}</p>
        </div>
        <Link href="/journey/kanto/map" className="text-[10px] text-slate-400 hover:text-white underline shrink-0">← Map</Link>
      </div>

      <BattleScene
        mode="gym"
        playerName={user.username}
        party={region.party}
        bag={region.bag}
        opponents={opponents}
        trainer={{
          name: gym.name,
          title: 'Gym Leader',
          spriteKey: gym.spriteKey,
          quote: gym.quote,
          defeatQuote: gym.defeatQuote,
        }}
        onEnd={handleEnd}
      />
    </Shell>
  );
}

function Card({
  title, body, action,
}: { title: string; body: string; action?: { href: string; label: string } }) {
  return (
    <div className="gm-panel p-6 text-center gm-fade">
      <p className="gm-pixel text-[11px] text-yellow-300 mb-3">{title}</p>
      <p className="text-[11px] text-slate-400 mb-5">{body}</p>
      {action && <Link href={action.href} className="gm-btn gm-btn-grey">{action.label}</Link>}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="gm-root min-h-screen p-3 md:p-6">
      <div className="max-w-2xl mx-auto">{children}</div>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        :root {
          --ease: cubic-bezier(0.22, 0.61, 0.36, 1);
          --ease-pop: cubic-bezier(0.34, 1.4, 0.64, 1);
          --t-base: 260ms;
        }
        .gm-pixel { font-family: 'Press Start 2P', monospace; line-height: 1.7; }
        .gm-root {
          background: #0b1120;
          background-image:
            linear-gradient(0deg, rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 16px 16px;
          color: #e2e8f0;
          font-family: ui-monospace, monospace;
        }
        .gm-panel {
          background: #0f172a;
          border: 3px solid #334155;
          box-shadow: inset -2px -2px 0 rgba(0,0,0,0.5), inset 2px 2px 0 rgba(255,255,255,0.05);
        }
        .gm-portrait {
          display: inline-flex; padding: 8px;
          background: radial-gradient(circle at 50% 35%, rgba(250,204,21,0.18), transparent 70%), #020617;
          border: 3px solid #a16207;
        }
        .gm-beaten { border-color: #16a34a; filter: grayscale(0.55); }
        .gm-badge { background: #020617; border: 3px solid #a16207; }
        .gm-pop { display: inline-block; animation: gmPop 600ms var(--ease-pop) both; }
        @keyframes gmPop { from { opacity: 0; transform: scale(0.2) rotate(-25deg); } to { opacity: 1; transform: none; } }
        .gm-fade { animation: gmFade var(--t-base) var(--ease) both; }
        @keyframes gmFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .gm-btn {
          display: inline-block; padding: 12px 26px;
          font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em;
          border-bottom-width: 4px; border-bottom-style: solid;
        }
        .gm-btn:active { transform: translateY(3px); border-bottom-width: 1px; }
        .gm-btn-green { background: #22c55e; color: #052e16; border-bottom-color: #15803d; }
        .gm-btn-grey { background: #475569; color: #fff; border-bottom-color: #1e293b; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}
