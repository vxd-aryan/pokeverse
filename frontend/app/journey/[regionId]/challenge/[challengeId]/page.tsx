"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import BattleScene, { type BattleOutcome } from '../../../components/BattleScene';
import { TrainerSprite } from '../../../components/TrainerSprite';
import { JourneyShell, StatusCard, journeyStyles, GlobalStyle } from '../../../components/JourneyShell';
import { getRegion } from '../../../data/regions';
import { CHALLENGE_STYLE, type JourneyPokemon } from '../../../data/types';
import { trainerPrize } from '../../../data/items';
import { buildPokemon, frontSprite } from '../../../lib/fetchMon';
import {
  getRegionState, hasStarted, isChallengeAvailable, markChallengeComplete,
  markRegionComplete, addMoney, setParty, setBag, addSeen, payoutOnLoss,
  type JourneyRegionState,
} from '../../../lib/journeyStorage';

// ============================================================
// CHALLENGE BATTLE
// ============================================================
// The milestone fights, whatever a region calls them: a Kanto gym
// leader, a Johto gym leader, later an Alola Kahuna or a Galar
// stadium. What they share is that you can't run, you can't
// catch, the party is restored on victory and something is
// awarded — so they share this page.
// ============================================================

export default function ChallengePage() {
  const { regionId, challengeId } = useParams();
  const router = useRouter();
  const { user } = useUserStore() as any;
  const rid = String(regionId);
  const cid = String(challengeId);

  const region = getRegion(rid);
  const challenge = region?.challenges.find((c) => c.id === cid);

  const [mounted, setMounted] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [state, setState] = useState<JourneyRegionState | null>(null);
  const [opponents, setOpponents] = useState<JourneyPokemon[] | null>(null);
  const [done, setDone] = useState<null | { prize: number; final: boolean }>(null);

  useEffect(() => {
    setMounted(true);
    if (!user) { setBlocked('no-user'); return; }
    if (!region || !challenge) { setBlocked('no-challenge'); return; }

    const s = getRegionState(user.username, rid, region.map.nodes[0]?.id);
    if (!hasStarted(s)) { setBlocked('no-starter'); return; }
    if (s.clearedChallenges.includes(challenge.id)) { setBlocked('already-won'); return; }
    if (!isChallengeAvailable(s, region.challenges, challenge.id)) { setBlocked('locked'); return; }
    if (!s.party.some((p) => p.currentHp > 0)) { setBlocked('party-fainted'); return; }

    setState(s);

    let cancelled = false;
    (async () => {
      try {
        const team = await Promise.all(
          challenge.team.map((m) => buildPokemon(m.pokemonId, m.level))
        );
        if (!cancelled) setOpponents(team);
      } catch (err) {
        console.error('[journey] challenge team failed to load:', err);
        if (!cancelled) setBlocked('load-failed');
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, rid, cid]);

  const handleEnd = (outcome: BattleOutcome) => {
    if (!region || !challenge || !state) return;
    setParty(user.username, rid, outcome.party);
    setBag(user.username, rid, outcome.bag);
    addSeen(user.username, rid, outcome.seenIds);

    if (outcome.result === 'win') {
      const top = Math.max(...challenge.team.map((m) => m.level));
      const prize = trainerPrize(top, true);
      markChallengeComplete(user.username, rid, challenge.id); // also fully heals
      addMoney(user.username, rid, prize);
      const final = challenge.order === region.challenges.length;
      if (final) markRegionComplete(user.username, rid);
      setDone({ prize, final });
      return;
    }

    if (outcome.result === 'loss') {
      payoutOnLoss(
        user.username,
        rid,
        region.map.nodes.filter((n) => n.isTown).map((n) => n.id)
      );
      setBlocked('lost');
      return;
    }

    router.push(`/journey/${rid}/area/${challenge.locationId}`);
  };

  // ---------- States ----------

  if (!mounted) {
    return <JourneyShell><StatusCard title="ENTERING" body="The doors swing open…" /></JourneyShell>;
  }

  if (blocked) {
    const style = challenge ? CHALLENGE_STYLE[challenge.kind] : null;
    const copy: Record<string, { title: string; body: string; href: string; label: string }> = {
      'no-user': { title: 'NOT SIGNED IN', body: 'Sign in to continue your Journey.', href: '/auth', label: 'Sign In' },
      'no-challenge': { title: 'NOT FOUND', body: 'There is no challenge by that name here.', href: `/journey/${rid}/map`, label: 'Back to Map' },
      'no-starter': {
        title: 'NO PARTNER YET',
        body: `${region?.professor ?? 'The professor'} is waiting for you in ${region?.labLocation ?? 'the lab'}.`,
        href: `/journey/${rid}/starter`, label: 'Go to the Lab',
      },
      'already-won': {
        title: 'ALREADY CLEARED',
        body: `You have already beaten ${challenge?.name}. ${style?.label ?? 'They'} battle you once.`,
        href: `/journey/${rid}/map`, label: 'Back to Map',
      },
      locked: { title: 'LOCKED', body: 'Clear the earlier challenges first.', href: `/journey/${rid}/map`, label: 'Back to Map' },
      'party-fainted': {
        title: 'YOUR PARTY IS IN NO SHAPE',
        body: 'Heal at a Pokémon Centre before taking this on.',
        href: `/journey/${rid}/map`, label: 'Back to Map',
      },
      'load-failed': {
        title: 'COULD NOT LOAD',
        body: 'The opposing team could not be fetched. Check your connection and try again.',
        href: `/journey/${rid}/map`, label: 'Back to Map',
      },
      lost: {
        title: 'YOU BLACKED OUT',
        body: `${challenge?.name} was too strong this time. Your Pokémon were healed and you lost some money — come back stronger.`,
        href: `/journey/${rid}/map`, label: 'Back to Map',
      },
    };
    const c = copy[blocked] ?? copy['no-challenge'];
    return <JourneyShell><StatusCard title={c.title} body={c.body} action={{ href: c.href, label: c.label }} /></JourneyShell>;
  }

  if (!region || !challenge) return null;
  const style = CHALLENGE_STYLE[challenge.kind];

  // ---------- Victory ----------
  if (done) {
    return (
      <JourneyShell>
        <div className="jr-panel p-6 md:p-8 text-center jr-fade" style={{ borderColor: '#16a34a' }}>
          <p className="jr-pixel text-xs md:text-sm text-green-400 mb-3">
            {style.label.toUpperCase()} DEFEATED
          </p>

          {challenge.spriteKey && (
            <div className="ch-portrait ch-beaten mx-auto mb-3">
              <TrainerSprite spriteKey={challenge.spriteKey} alt={challenge.name} className="w-20 h-20 object-contain" />
            </div>
          )}

          <p className="text-[11px] text-slate-300 italic mb-5 max-w-md mx-auto">“{challenge.defeatQuote}”</p>

          <div className="ch-reward mx-auto mb-5 px-5 py-4 inline-flex flex-col items-center">
            <span className="text-4xl mb-1 ch-pop">🏅</span>
            <span className="jr-pixel text-[10px] text-yellow-300">{challenge.rewardName.toUpperCase()}</span>
            <span className="text-[9px] text-slate-400 mt-1">
              {challenge.order} of {region.challenges.length}
            </span>
          </div>

          <p className="text-[10px] text-slate-400 mb-1">
            Prize money: <span className="text-yellow-300">₽{done.prize}</span>
          </p>
          <p className="text-[9px] text-slate-500 mb-6">Your party was fully restored.</p>

          {done.final ? (
            <Link href={`/journey/${rid}/complete`} className="jr-btn jr-btn-green">
              {region.name} Complete →
            </Link>
          ) : (
            <Link href={`/journey/${rid}/map`} className="jr-btn jr-btn-green">Continue Journey →</Link>
          )}
        </div>
        <GlobalStyle css={challengeStyles} />
      </JourneyShell>
    );
  }

  // ---------- Loading ----------
  if (!opponents || !state) {
    return (
      <JourneyShell>
        <StatusCard title="ENTERING" body={`${challenge.name} is waiting…`} />
      </JourneyShell>
    );
  }

  // ---------- The fight ----------
  return (
    <JourneyShell>
      <div className="jr-panel flex items-center justify-between px-3 py-2 mb-3">
        <div className="min-w-0">
          <p className="jr-pixel text-[9px] text-yellow-300 truncate">{challenge.venue.toUpperCase()}</p>
          <p className="text-[9px] text-slate-400">
            {style.label} {challenge.order} · {challenge.type} · {challenge.rewardName}
          </p>
        </div>
        <Link href={`/journey/${rid}/map`} className="text-[10px] text-slate-400 hover:text-white underline shrink-0">
          ← Map
        </Link>
      </div>

      <BattleScene
        mode="gym"
        playerName={user.username}
        party={state.party}
        bag={state.bag}
        opponents={opponents}
        trainer={{
          name: challenge.name,
          title: style.label,
          spriteKey: challenge.spriteKey ?? 'youngster',
          quote: challenge.quote,
          defeatQuote: challenge.defeatQuote,
        }}
        onEnd={handleEnd}
      />
      <GlobalStyle css={challengeStyles} />
    </JourneyShell>
  );
}

const challengeStyles = `
  .ch-portrait {
    display: inline-flex; padding: 8px;
    background: radial-gradient(circle at 50% 35%, rgba(250,204,21,0.18), transparent 70%), #020617;
    border: 3px solid #a16207;
  }
  .ch-beaten { border-color: #16a34a; filter: grayscale(0.55); }
  .ch-reward { background: #020617; border: 3px solid #a16207; }
  .ch-pop { display: inline-block; animation: chPop 600ms var(--ease-pop) both; }
  @keyframes chPop { from { opacity: 0; transform: scale(0.2) rotate(-25deg); } to { opacity: 1; transform: none; } }
`;
