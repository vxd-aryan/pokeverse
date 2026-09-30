"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import {
  KANTO_GYMS,
  KANTO_PLAYER_LEVEL_CURVE,
  resolveEvolution,
  getEvolutionStage,
  type JourneyPokemon,
} from '../../../data/kanto';
import { getTrainerById, trainerLevelCap } from '../../../data/kanto-trainers';
import { KANTO_NODE_BY_ID } from '../../../data/kanto-map';
import { fetchJourneyPokemon, relevelJourneyPokemon } from '../../../lib/pokemonFetch';
import { resolveJourneyTurn } from '../../../lib/battleEngine';
import {
  getRegionState,
  updateTeam,
  healTeam,
  recordDefeat,
  markTrainerDefeated,
  isTrainerDefeated,
} from '../../../lib/journeyStorage';

type Phase = 'loading' | 'intro' | 'battling' | 'victory' | 'defeat' | 'fled';
type Menu = 'root' | 'fight' | 'switch';

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const frontSprite = (id: number) => `${SPRITE_BASE}/${id}.png`;
const backSprite = (id: number) => `${SPRITE_BASE}/back/${id}.png`;

interface LevelUpEvent {
  name: string;
  fromLevel: number;
  toLevel: number;
  evolved: boolean;
  newName?: string;
  capped?: boolean;
}

export default function TrainerBattlePage() {
  const { trainerId } = useParams();
  const router = useRouter();
  const { user } = useUserStore() as any;

  const [phase, setPhase] = useState<Phase>('loading');
  const [menu, setMenu] = useState<Menu>('root');
  const [blocked, setBlocked] = useState<string | null>(null);
  const [playerTeam, setPlayerTeam] = useState<JourneyPokemon[]>([]);
  const [playerActiveIdx, setPlayerActiveIdx] = useState(0);
  const [opponentTeam, setOpponentTeam] = useState<JourneyPokemon[]>([]);
  const [opponentActiveIdx, setOpponentActiveIdx] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [turnCount, setTurnCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [needsSwitch, setNeedsSwitch] = useState(false);
  const [levelUps, setLevelUps] = useState<LevelUpEvent[]>([]);
  const [hitSide, setHitSide] = useState<'player' | 'opponent' | null>(null);

  const trainer = getTrainerById(String(trainerId));
  const place = trainer ? KANTO_NODE_BY_ID[trainer.locationId] : null;

  useEffect(() => {
    if (!user) {
      setBlocked('no-user');
      return;
    }
    if (!trainer) {
      setBlocked('no-trainer');
      return;
    }

    const region = getRegionState(user.username, 'kanto');
    if (!region.team || region.team.length !== 6) {
      setBlocked('no-team');
      return;
    }
    if (isTrainerDefeated(region, trainer.id)) {
      setBlocked('already-beaten');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const opponents = await Promise.all(
          trainer.team.map((t) => fetchJourneyPokemon(t.pokemonId, t.level))
        );
        if (cancelled) return;
        setPlayerTeam(region.team!.map((p) => ({ ...p })));
        setPlayerActiveIdx(region.team!.findIndex((p) => p.currentHp > 0) || 0);
        setOpponentTeam(opponents);
        setOpponentActiveIdx(0);
        setLogs([`${trainer.trainerClass} ${trainer.name} wants to battle!`]);
        setTurnCount(0);
        setPhase('intro');
      } catch (err) {
        console.error('[journey] trainer battle setup failed:', err);
        if (!cancelled) setBlocked('load-failed');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, trainerId]);

  const playerMon = playerTeam[playerActiveIdx];
  const opponentMon = opponentTeam[opponentActiveIdx];
  const opponentRemaining = opponentTeam.filter((m) => m.currentHp > 0).length;
  const playerRemaining = playerTeam.filter((m) => m.currentHp > 0).length;

  // ---------- Actions ----------

  const flash = async (side: 'player' | 'opponent') => {
    setHitSide(side);
    await new Promise((r) => setTimeout(r, 320));
    setHitSide(null);
  };

  const handleMove = async (moveIdx: number) => {
    if (busy || !playerMon || !opponentMon) return;
    setBusy(true);
    setMenu('root');

    const move = playerMon.moves[moveIdx];
    const nextPlayers = [...playerTeam];
    const nextOpponents = [...opponentTeam];
    const pMon = { ...nextPlayers[playerActiveIdx] };
    const oMon = { ...nextOpponents[opponentActiveIdx] };

    const result = resolveJourneyTurn(pMon, move, oMon);
    nextPlayers[playerActiveIdx] = pMon;
    nextOpponents[opponentActiveIdx] = oMon;
    setPlayerTeam(nextPlayers);
    setOpponentTeam(nextOpponents);
    setLogs((prev) => [...prev, ...result.logs]);
    setTurnCount((t) => t + 1);

    await flash('opponent');
    await new Promise((r) => setTimeout(r, 420));

    if (result.opponentFainted) {
      const nextIdx = nextOpponents.findIndex((m, i) => i !== opponentActiveIdx && m.currentHp > 0);
      if (nextIdx === -1) {
        await handleVictory(nextPlayers);
        setBusy(false);
        return;
      }
      setOpponentActiveIdx(nextIdx);
      setLogs((prev) => [...prev, `${trainer!.name} sent out ${nextOpponents[nextIdx].name}!`]);
      await new Promise((r) => setTimeout(r, 500));
    }

    if (result.playerFainted) {
      await flash('player');
      const nextIdx = nextPlayers.findIndex((m, i) => i !== playerActiveIdx && m.currentHp > 0);
      if (nextIdx === -1) {
        recordDefeat(user.username, 'kanto', turnCount);
        healTeam(user.username, 'kanto');
        setPhase('defeat');
        setBusy(false);
        return;
      }
      setNeedsSwitch(true);
      setMenu('switch');
    }

    setBusy(false);
  };

  const handleSwitch = (idx: number) => {
    if (busy) return;
    if (idx === playerActiveIdx || playerTeam[idx].currentHp <= 0) return;
    setPlayerActiveIdx(idx);
    setNeedsSwitch(false);
    setMenu('root');
    setLogs((prev) => [...prev, `Go, ${playerTeam[idx].name}!`]);
  };

  const handleRun = () => {
    if (busy) return;
    // Route battles are escapable — party keeps its damage, so
    // running has a cost without being punishing.
    updateTeam(user.username, 'kanto', playerTeam);
    setPhase('fled');
  };

  const handleVictory = async (finalTeam: JourneyPokemon[]) => {
    const region = getRegionState(user.username, 'kanto');
    const cap = trainerLevelCap(KANTO_PLAYER_LEVEL_CURVE, region.completedGyms.length);
    const events: LevelUpEvent[] = [];

    const grown = await Promise.all(
      finalTeam.map(async (mon) => {
        const capped = mon.level >= cap;
        const target = capped ? mon.level : mon.level + 1;

        if (capped) {
          events.push({
            name: mon.name,
            fromLevel: mon.level,
            toLevel: mon.level,
            evolved: false,
            capped: true,
          });
          return mon;
        }

        const { id: evolvedId, evolved } = resolveEvolution(mon.pokemonId, target);
        const updated = evolved
          ? await fetchJourneyPokemon(evolvedId, target)
          : await relevelJourneyPokemon(mon, target);

        events.push({
          name: mon.name,
          fromLevel: mon.level,
          toLevel: target,
          evolved,
          newName: evolved ? updated.name : undefined,
        });

        // Damage carries over between route battles — only gyms
        // and defeats fully restore the party.
        const hpRatio = mon.maxHp > 0 ? mon.currentHp / mon.maxHp : 1;
        return {
          ...updated,
          currentHp: Math.max(1, Math.round(updated.maxHp * hpRatio)),
          status: mon.status ?? null,
          evolutionStage: getEvolutionStage(updated.pokemonId),
        };
      })
    );

    updateTeam(user.username, 'kanto', grown);
    markTrainerDefeated(user.username, 'kanto', trainer!.id, turnCount);
    setLevelUps(events);
    setLogs((prev) => [...prev, `${trainer!.name} was defeated!`]);
    setPhase('victory');
  };

  // ---------- Blocked states ----------

  if (blocked) {
    const copy: Record<string, { title: string; body: string; href: string; label: string }> = {
      'no-user': {
        title: 'NOT SIGNED IN',
        body: 'Sign in to continue your Journey.',
        href: '/auth', label: 'Sign In',
      },
      'no-trainer': {
        title: 'TRAINER NOT FOUND',
        body: 'There is nobody by that name on this route.',
        href: '/journey/kanto/map', label: 'Back to Map',
      },
      'no-team': {
        title: 'NO TEAM CHOSEN',
        body: 'Pick your six before taking on route trainers.',
        href: '/journey/kanto/team', label: 'Choose Your Six',
      },
      'already-beaten': {
        title: 'ALREADY DEFEATED',
        body: `You have already beaten ${trainer?.name}. Route trainers battle you once.`,
        href: '/journey/kanto/map', label: 'Back to Map',
      },
      'load-failed': {
        title: 'COULD NOT LOAD BATTLE',
        body: 'The opposing Pokémon could not be fetched. Check your connection and try again.',
        href: '/journey/kanto/map', label: 'Back to Map',
      },
    };
    const c = copy[blocked] ?? copy['no-trainer'];
    return (
      <Shell>
        <div className="panel p-6 text-center fade-up">
          <p className="pixel-font text-[11px] text-yellow-300 mb-3">{c.title}</p>
          <p className="text-[11px] text-slate-400 mb-5">{c.body}</p>
          <Link href={c.href} className="btn-grey">{c.label}</Link>
        </div>
      </Shell>
    );
  }

  if (phase === 'loading' || !trainer) {
    return (
      <Shell>
        <div className="panel p-10 text-center">
          <p className="pixel-font text-[10px] text-yellow-300 pulse-soft">APPROACHING...</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {/* Header */}
      <div className="panel flex items-center justify-between px-3 py-2 mb-3 fade-up">
        <div className="min-w-0">
          <p className="pixel-font text-[9px] text-yellow-300 truncate">
            {trainer.trainerClass.toUpperCase()} {trainer.name.toUpperCase()}
          </p>
          <p className="text-[9px] text-slate-400">{place?.label ?? 'Kanto'}</p>
        </div>
        <Link href="/journey/kanto/map" className="text-[10px] text-slate-400 hover:text-white underline shrink-0">
          ← Map
        </Link>
      </div>

      {/* Intro */}
      {phase === 'intro' && (
        <div className="panel p-6 text-center fade-up">
          <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500 mb-2">
            {trainer.trainerClass}
          </p>
          <p className="pixel-font text-sm text-yellow-300 mb-5 name-pop">{trainer.name}</p>

          <div className="quote-box mx-auto max-w-md px-4 py-3 mb-6">
            <p className="text-[11px] text-slate-200 italic leading-relaxed">“{trainer.quote}”</p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {trainer.team.map((t, i) => (
              <div
                key={i}
                className="roster-chip flex flex-col items-center px-2 py-1.5 w-20 stagger-in"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <img src={frontSprite(t.pokemonId)} alt={t.name} className="w-11 h-11 object-contain image-pixelated" />
                <span className="text-[8px] uppercase font-bold truncate w-full text-center">{t.name}</span>
                <span className="text-[8px] text-yellow-400">Lv{t.level}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 justify-center flex-wrap">
            <button onClick={() => setPhase('battling')} className="btn-yellow">Battle</button>
            <Link href="/journey/kanto/map" className="btn-grey">Walk Away</Link>
          </div>
        </div>
      )}

      {/* Battle */}
      {phase === 'battling' && playerMon && opponentMon && (
        <div className="panel overflow-hidden fade-up">
          <div className="battlefield relative h-56 md:h-64">
            <div className="absolute top-3 left-3 slide-in-left">
              <HpBox mon={opponentMon} />
              <PipRow total={opponentTeam.length} remaining={opponentRemaining} align="left" />
            </div>
            <img
              key={`o-${opponentMon.pokemonId}`}
              src={frontSprite(opponentMon.pokemonId)}
              alt={opponentMon.name}
              className={`absolute top-6 right-6 w-24 h-24 md:w-28 md:h-28 object-contain image-pixelated sprite-enter-right ${
                hitSide === 'opponent' ? 'sprite-hit' : ''
              } ${opponentMon.currentHp <= 0 ? 'sprite-faint' : ''}`}
            />

            <div className="absolute bottom-3 right-3 slide-in-right">
              <HpBox mon={playerMon} showNumbers />
              <PipRow total={playerTeam.length} remaining={playerRemaining} align="right" />
            </div>
            <img
              key={`p-${playerMon.pokemonId}`}
              src={backSprite(playerMon.pokemonId)}
              alt={playerMon.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = frontSprite(playerMon.pokemonId);
              }}
              className={`absolute bottom-6 left-6 w-28 h-28 md:w-32 md:h-32 object-contain image-pixelated sprite-enter-left ${
                hitSide === 'player' ? 'sprite-hit' : ''
              } ${playerMon.currentHp <= 0 ? 'sprite-faint' : ''}`}
            />
          </div>

          <div className="bg-stone-900 p-2 md:p-3 flex flex-col sm:flex-row gap-2 min-h-[10rem]">
            <div className="message-box sm:w-1/2 p-3 overflow-y-auto text-[10px] md:text-[11px] max-h-40">
              {logs.slice(-7).map((l, i) => (
                <p key={`${i}-${l}`} className="mb-1 leading-snug log-line">▶ {l}</p>
              ))}
            </div>

            <div className="sm:w-1/2">
              {menu === 'root' && !needsSwitch && (
                <div className="grid grid-cols-2 gap-1.5 h-full">
                  <Cmd label="Fight" onClick={() => setMenu('fight')} />
                  <Cmd label="Pokémon" onClick={() => setMenu('switch')} />
                  <Cmd label="Bag" disabled note="Empty" />
                  <Cmd label="Run" onClick={handleRun} note="Escape" />
                </div>
              )}

              {menu === 'fight' && (
                <div className="h-full flex flex-col gap-1.5">
                  <div className="grid grid-cols-2 gap-1.5 flex-1">
                    {playerMon.moves.slice(0, 4).map((m, idx) => (
                      <button key={idx} onClick={() => handleMove(idx)} disabled={busy} className="move-btn">
                        <span className="text-[10px] font-black uppercase leading-tight">{m.name}</span>
                        <span className="text-[8px] text-slate-600 uppercase">{m.type} · {m.power}</span>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setMenu('root')} className="back-btn">← Back</button>
                </div>
              )}

              {menu === 'switch' && (
                <div className="h-full flex flex-col gap-1.5">
                  {needsSwitch && (
                    <p className="text-[9px] uppercase font-black text-yellow-300 tracking-wider">
                      Choose your next Pokémon!
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-1 flex-1 overflow-y-auto">
                    {playerTeam.map((p, idx) => {
                      const fainted = p.currentHp <= 0;
                      const active = idx === playerActiveIdx;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSwitch(idx)}
                          disabled={fainted || active || busy}
                          className="switch-btn"
                        >
                          <span className="text-[9px] font-bold uppercase truncate w-full">{p.name}</span>
                          <span className="text-[8px] text-slate-500">
                            {fainted ? 'FNT' : active ? 'ACTIVE' : `${p.currentHp}/${p.maxHp}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {!needsSwitch && <button onClick={() => setMenu('root')} className="back-btn">← Back</button>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Victory */}
      {phase === 'victory' && (
        <div className="panel p-6 text-center fade-up border-green-600">
          <p className="pixel-font text-[11px] text-green-400 mb-3">TRAINER DEFEATED</p>
          <p className="text-[11px] text-slate-300 italic mb-5 max-w-md mx-auto">“{trainer.defeatQuote}”</p>

          <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-2">Party Gained a Level</p>
          <div className="max-w-sm mx-auto flex flex-col gap-1 mb-5">
            {levelUps.map((e, i) => (
              <div
                key={i}
                className="levelup-row flex items-center justify-between px-3 py-1.5 stagger-in"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <span className="text-[10px] font-bold uppercase truncate">
                  {e.evolved ? (<>{e.name} <span className="text-yellow-300">→ {e.newName}</span></>) : e.name}
                </span>
                <span className={`text-[10px] shrink-0 ${e.capped ? 'text-slate-500' : 'text-green-400'}`}>
                  {e.capped ? `Lv${e.toLevel} · capped` : `Lv${e.fromLevel} → Lv${e.toLevel}`}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[9px] text-slate-500 mb-5">
            Damage carries over — your party heals fully at the next gym.
          </p>
          <Link href="/journey/kanto/map" className="btn-green">Continue →</Link>
        </div>
      )}

      {/* Defeat */}
      {phase === 'defeat' && (
        <div className="panel p-6 text-center fade-up">
          <p className="pixel-font text-[11px] text-red-400 mb-3">YOUR PARTY FAINTED</p>
          <p className="text-[11px] text-slate-400 mb-6 max-w-sm mx-auto">
            {trainer.name} got the better of you. Your Pokémon have been fully restored — try again whenever you like.
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <button onClick={() => router.refresh()} className="btn-red">Rematch</button>
            <Link href="/journey/kanto/map" className="btn-grey">Back to Map</Link>
          </div>
        </div>
      )}

      {/* Fled */}
      {phase === 'fled' && (
        <div className="panel p-6 text-center fade-up">
          <p className="pixel-font text-[11px] text-slate-300 mb-3">GOT AWAY SAFELY</p>
          <p className="text-[11px] text-slate-400 mb-6 max-w-sm mx-auto">
            You slipped past {trainer.name}. They'll still be there if you come back.
          </p>
          <Link href="/journey/kanto/map" className="btn-grey">Back to Map</Link>
        </div>
      )}
    </Shell>
  );
}

// ============================================================

function HpBox({ mon, showNumbers }: { mon: JourneyPokemon; showNumbers?: boolean }) {
  const pct = Math.max(0, (mon.currentHp / mon.maxHp) * 100);
  const color = pct > 50 ? '#22c55e' : pct > 20 ? '#facc15' : '#ef4444';
  return (
    <div className="hp-box px-2 py-1.5 w-44 md:w-52">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-black uppercase truncate">{mon.name}</span>
        <span className="text-[9px] shrink-0">Lv{mon.level}</span>
      </div>
      <div className="flex items-center gap-1 mt-1">
        <span className="text-[7px] font-black text-amber-600">HP</span>
        <div className="h-2 flex-1 bg-gray-400 border border-gray-700 overflow-hidden">
          <div className="h-full hp-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
      <div className="flex items-center justify-between mt-0.5">
        {mon.status ? (
          <span className={`status-chip status-${mon.status}`}>{mon.status.slice(0, 3).toUpperCase()}</span>
        ) : <span />}
        {showNumbers && (
          <span className="text-[8px] font-bold text-gray-700">{mon.currentHp}/{mon.maxHp}</span>
        )}
      </div>
    </div>
  );
}

function PipRow({ total, remaining, align }: { total: number; remaining: number; align: 'left' | 'right' }) {
  return (
    <div className={`flex gap-1 mt-1 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`pip ${i < remaining ? 'pip-alive' : 'pip-fainted'}`} />
      ))}
    </div>
  );
}

function Cmd({ label, onClick, disabled, note }: { label: string; onClick?: () => void; disabled?: boolean; note?: string }) {
  return (
    <button onClick={onClick} disabled={disabled} className="cmd-btn">
      <span className="text-[11px] font-black uppercase">{label}</span>
      {note && <span className="text-[7px] uppercase text-slate-500">{note}</span>}
    </button>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="journey-root min-h-screen p-3 md:p-6 text-slate-200">
      <div className="max-w-2xl mx-auto">{children}</div>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

        /* One easing curve and one set of durations across the
           whole Journey, so nothing feels out of step. */
        :root {
          --ease: cubic-bezier(0.22, 0.61, 0.36, 1);
          --ease-pop: cubic-bezier(0.34, 1.4, 0.64, 1);
          --t-fast: 140ms;
          --t-base: 260ms;
          --t-slow: 520ms;
        }

        .pixel-font { font-family: 'Press Start 2P', monospace; line-height: 1.6; }
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

        .quote-box { background: #020617; border: 2px solid #334155; }
        .roster-chip { background: #020617; border: 2px solid #334155; }

        .battlefield {
          background: linear-gradient(180deg, #7dd3fc 0%, #bae6fd 55%, #bbf7d0 55%, #86efac 100%);
        }

        .hp-box {
          background: #f8fafc;
          color: #1c1917;
          border: 3px solid #44403c;
          box-shadow: 2px 2px 0 rgba(0,0,0,0.4);
        }
        /* HP drains rather than jumping. */
        .hp-fill { transition: width var(--t-slow) var(--ease), background var(--t-base) linear; }

        .pip { width: 8px; height: 8px; border: 1px solid #1c1917; display: inline-block;
               transition: background var(--t-base) var(--ease); }
        .pip-alive { background: #f8fafc; }
        .pip-fainted { background: #57534e; }

        .message-box {
          background: #f5f5f4;
          color: #1c1917;
          border: 3px solid #44403c;
          box-shadow: inset 0 0 0 2px #f5f5f4, inset 0 0 0 3px #a8a29e;
          scroll-behavior: smooth;
        }
        .log-line { animation: logIn var(--t-base) var(--ease) both; }
        @keyframes logIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .cmd-btn, .move-btn, .switch-btn, .back-btn {
          background: #f5f5f4;
          color: #1c1917;
          border: 3px solid #44403c;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 1px;
          transition: background var(--t-fast) var(--ease), transform var(--t-fast) var(--ease);
        }
        .cmd-btn:hover:not(:disabled), .move-btn:hover:not(:disabled),
        .switch-btn:hover:not(:disabled), .back-btn:hover {
          background: #fde68a; transform: translateY(-1px);
        }
        .cmd-btn:active:not(:disabled), .move-btn:active:not(:disabled) { transform: translateY(1px); }
        .cmd-btn:disabled, .move-btn:disabled, .switch-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .move-btn { padding: 4px; }
        .switch-btn { padding: 3px; }
        .back-btn { padding: 4px; font-size: 9px; font-weight: 900; text-transform: uppercase; }

        .status-chip { font-size: 7px; font-weight: 900; padding: 1px 3px; color: #0b1120; }
        .status-burn { background: #f97316; }
        .status-poison { background: #a855f7; }
        .status-paralysis { background: #eab308; }
        .status-sleep { background: #94a3b8; }
        .status-freeze { background: #38bdf8; }

        .levelup-row { background: #020617; border: 1px solid #1e293b; }

        /* --- Motion --- */
        .fade-up { animation: fadeUp var(--t-base) var(--ease) both; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .stagger-in { animation: fadeUp var(--t-base) var(--ease) both; }

        .name-pop { animation: namePop 420ms var(--ease-pop) both; }
        @keyframes namePop {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }

        .slide-in-left  { animation: slideLeft var(--t-slow) var(--ease) both; }
        .slide-in-right { animation: slideRight var(--t-slow) var(--ease) both; }
        @keyframes slideLeft  { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: none; } }
        @keyframes slideRight { from { opacity: 0; transform: translateX(24px); }  to { opacity: 1; transform: none; } }

        .sprite-enter-right { animation: spriteInRight var(--t-slow) var(--ease) both; }
        .sprite-enter-left  { animation: spriteInLeft  var(--t-slow) var(--ease) both; }
        @keyframes spriteInRight { from { opacity: 0; transform: translateX(40px) scale(0.9); } to { opacity: 1; transform: none; } }
        @keyframes spriteInLeft  { from { opacity: 0; transform: translateX(-40px) scale(0.9); } to { opacity: 1; transform: none; } }

        .sprite-hit { animation: hitShake 320ms var(--ease) both; }
        @keyframes hitShake {
          0%, 100% { transform: translateX(0); filter: none; }
          20% { transform: translateX(-7px); filter: brightness(2.2); }
          40% { transform: translateX(6px); filter: none; }
          60% { transform: translateX(-4px); filter: brightness(1.8); }
          80% { transform: translateX(3px); filter: none; }
        }

        .sprite-faint { animation: faint var(--t-slow) var(--ease) forwards; }
        @keyframes faint {
          to { opacity: 0; transform: translateY(34px); }
        }

        .pulse-soft { animation: pulseSoft 1.6s var(--ease) infinite; }
        @keyframes pulseSoft { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }

        .btn-yellow, .btn-green, .btn-red, .btn-grey {
          display: inline-block;
          padding: 12px 26px;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border-bottom-width: 4px;
          border-bottom-style: solid;
          transition: transform var(--t-fast) var(--ease), filter var(--t-fast) var(--ease);
        }
        .btn-yellow:hover, .btn-green:hover, .btn-red:hover, .btn-grey:hover { filter: brightness(1.1); }
        .btn-yellow:active, .btn-green:active, .btn-red:active, .btn-grey:active {
          transform: translateY(3px); border-bottom-width: 1px;
        }
        .btn-yellow { background: #facc15; color: #1c1917; border-bottom-color: #a16207; }
        .btn-green  { background: #22c55e; color: #052e16; border-bottom-color: #15803d; }
        .btn-red    { background: #ef4444; color: #ffffff; border-bottom-color: #991b1b; }
        .btn-grey   { background: #475569; color: #ffffff; border-bottom-color: #1e293b; }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}