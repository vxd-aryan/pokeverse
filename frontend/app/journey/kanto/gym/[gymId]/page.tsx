"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import {
  KANTO_GYMS,
  GYM_BATTLE_COMMANDS,
  playerLevelBeforeGym,
  playerLevelAfterGym,
  resolveEvolution,
  getEvolutionStage,
  type JourneyPokemon,
} from '../../../data/kanto';
import { fetchJourneyPokemon, relevelJourneyPokemon } from '../../../lib/pokemonFetch';
import { resolveJourneyTurn } from '../../../lib/battleEngine';
import {
  getRegionState,
  markGymComplete,
  markRegionComplete,
  recordDefeat,
  updateTeam,
  healTeam,
  isGymAvailable,
} from '../../../lib/journeyStorage';

type Phase = 'loading' | 'intro' | 'battling' | 'victory' | 'defeat';
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
}

export default function KantoGymBattlePage() {
  const { gymId } = useParams();
  const router = useRouter();
  const { user } = useUserStore() as any;

  const [phase, setPhase] = useState<Phase>('loading');
  const [menu, setMenu] = useState<Menu>('root');
  const [playerTeam, setPlayerTeam] = useState<JourneyPokemon[]>([]);
  const [playerActiveIdx, setPlayerActiveIdx] = useState(0);
  const [opponentTeam, setOpponentTeam] = useState<JourneyPokemon[]>([]);
  const [opponentActiveIdx, setOpponentActiveIdx] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [turnCount, setTurnCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [needsSwitch, setNeedsSwitch] = useState(false);
  const [levelUps, setLevelUps] = useState<LevelUpEvent[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const gym = KANTO_GYMS.find((g) => g.id === gymId);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    if (!gym) {
      router.push('/journey/kanto/map');
      return;
    }

    const region = getRegionState(user.username, 'kanto');
    if (!region.team || region.team.length !== 6) {
      router.push('/journey/kanto/team');
      return;
    }
    // Sequential gating lives in storage, so the map and this
    // page can never disagree about which gym is open.
    if (!isGymAvailable(region, KANTO_GYMS, gym.id)) {
      router.push('/journey/kanto/map');
      return;
    }

    async function setupBattle() {
      try {
        // Party always enters a gym at full health.
        setPlayerTeam(region.team!.map((p) => ({ ...p, currentHp: p.maxHp, status: null })));
        setPlayerActiveIdx(0);

        // Gym team levels come straight from canon, per Pokémon.
        const opponents = await Promise.all(
          gym!.team.map((t) => fetchJourneyPokemon(t.pokemonId, t.level))
        );
        setOpponentTeam(opponents);
        setOpponentActiveIdx(0);
        setLogs([`${gym!.name} would like to battle!`]);
        setTurnCount(0);
        setPhase('intro');
      } catch (err) {
        console.error('Failed to set up gym battle:', err);
        setErrorMsg('Could not load this gym battle. Check your connection and try again.');
      }
    }
    setupBattle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, gymId]);

  if (!user || !gym) return null;

  const playerMon = playerTeam[playerActiveIdx];
  const opponentMon = opponentTeam[opponentActiveIdx];
  const opponentRemaining = opponentTeam.filter((m) => m.currentHp > 0).length;
  const playerRemaining = playerTeam.filter((m) => m.currentHp > 0).length;

  // ---------- Battle actions ----------

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

    await new Promise((r) => setTimeout(r, 900));

    if (result.opponentFainted) {
      const nextIdx = nextOpponents.findIndex((m, i) => i !== opponentActiveIdx && m.currentHp > 0);
      if (nextIdx === -1) {
        await handleVictory(nextPlayers);
        setBusy(false);
        return;
      }
      setOpponentActiveIdx(nextIdx);
      setLogs((prev) => [...prev, `${gym.name} sent out ${nextOpponents[nextIdx].name}!`]);
    }

    if (result.playerFainted) {
      const nextIdx = nextPlayers.findIndex((m, i) => i !== playerActiveIdx && m.currentHp > 0);
      if (nextIdx === -1) {
        handleDefeat();
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

  const handleVictory = async (finalTeam: JourneyPokemon[]) => {
    const targetLevel = playerLevelAfterGym(gym.order);
    const events: LevelUpEvent[] = [];

    const grown = await Promise.all(
      finalTeam.map(async (mon) => {
        const { id: evolvedId, evolved } = resolveEvolution(mon.pokemonId, targetLevel);
        const updated = evolved
          ? await fetchJourneyPokemon(evolvedId, targetLevel)
          : await relevelJourneyPokemon(mon, targetLevel);

        events.push({
          name: mon.name,
          fromLevel: mon.level,
          toLevel: targetLevel,
          evolved,
          newName: evolved ? updated.name : undefined,
        });

        // Full heal at the milestone — no grind between gyms.
        return {
          ...updated,
          currentHp: updated.maxHp,
          status: null,
          evolutionStage: getEvolutionStage(updated.pokemonId),
        };
      })
    );

    updateTeam(user.username, 'kanto', grown);
    markGymComplete(user.username, 'kanto', gym.id, turnCount);
    healTeam(user.username, 'kanto');

    if (gym.order === KANTO_GYMS.length) {
      markRegionComplete(user.username, 'kanto');
    }

    setLevelUps(events);
    setLogs((prev) => [...prev, `${gym.name} was defeated!`]);
    setPhase('victory');
  };

  const handleDefeat = () => {
    recordDefeat(user.username, 'kanto', turnCount);
    // Party is restored so a loss costs progress, not patience.
    healTeam(user.username, 'kanto');
    setPhase('defeat');
  };

  const handleRetry = () => {
    setPlayerTeam((prev) => prev.map((p) => ({ ...p, currentHp: p.maxHp, status: null })));
    setOpponentTeam((prev) => prev.map((p) => ({ ...p, currentHp: p.maxHp, status: null })));
    setPlayerActiveIdx(0);
    setOpponentActiveIdx(0);
    setLogs([`${gym.name} would like to battle!`]);
    setTurnCount(0);
    setNeedsSwitch(false);
    setMenu('root');
    setPhase('intro');
  };

  // ---------- Render ----------

  if (errorMsg) {
    return (
      <Shell>
        <div className="panel p-6 text-center">
          <p className="text-red-400 text-sm mb-4">{errorMsg}</p>
          <Link href="/journey/kanto/map" className="btn-grey">Back to Map</Link>
        </div>
      </Shell>
    );
  }

  if (phase === 'loading') {
    return (
      <Shell>
        <div className="panel p-10 text-center">
          <p className="pixel-font text-[10px] text-yellow-300 animate-pulse">ENTERING THE GYM...</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {/* Gym header */}
      <div className="panel flex items-center justify-between px-3 py-2 mb-3">
        <div className="min-w-0">
          <p className="pixel-font text-[9px] text-yellow-300 truncate">{gym.gymName.toUpperCase()}</p>
          <p className="text-[9px] text-slate-400">
            Gym {gym.order} · {gym.type} · {gym.badgeName}
          </p>
        </div>
        <Link href="/journey/kanto/map" className="text-[10px] text-slate-400 hover:text-white underline shrink-0">
          ← Map
        </Link>
      </div>

      {/* ---------- BOSS INTRO ---------- */}
      {phase === 'intro' && (
        <div className="panel boss-intro p-6 md:p-8 text-center">
          <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500 mb-2">Gym Leader</p>
          <p className="pixel-font text-base md:text-xl text-yellow-300 mb-1 boss-name">{gym.name}</p>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-5">
            {gym.type}-type Specialist
          </p>

          <div className="quote-box mx-auto max-w-md px-4 py-3 mb-6">
            <p className="text-[11px] text-slate-200 leading-relaxed italic">“{gym.quote}”</p>
          </div>

          <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-2">
            Roster · {gym.team.length} Pokémon
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-7">
            {gym.team.map((t, i) => (
              <div key={i} className="roster-chip flex flex-col items-center px-2 py-1.5 w-20">
                <img
                  src={frontSprite(t.pokemonId)}
                  alt={t.name}
                  className="w-12 h-12 object-contain image-pixelated"
                />
                <span className="text-[8px] uppercase font-bold truncate w-full text-center">{t.name}</span>
                <span className="text-[8px] text-yellow-400">Lv{t.level}</span>
              </div>
            ))}
          </div>

          <p className="text-[9px] text-slate-500 mb-4">
            Your party enters at Lv{playerLevelBeforeGym(gym.order)} · Running is not an option in a gym battle.
          </p>

          <button onClick={() => setPhase('battling')} className="btn-yellow">
            Begin Battle
          </button>
        </div>
      )}

      {/* ---------- BATTLE ---------- */}
      {phase === 'battling' && playerMon && opponentMon && (
        <div className="panel overflow-hidden">
          {/* Battlefield */}
          <div className="battlefield relative h-56 md:h-64">
            {/* Opponent */}
            <div className="absolute top-3 left-3">
              <HpBox mon={opponentMon} />
              <PokeballRow total={opponentTeam.length} remaining={opponentRemaining} align="left" />
            </div>
            <img
              src={frontSprite(opponentMon.pokemonId)}
              alt={opponentMon.name}
              className="absolute top-6 right-6 w-24 h-24 md:w-28 md:h-28 object-contain image-pixelated drop-shadow-lg"
            />

            {/* Player */}
            <div className="absolute bottom-3 right-3">
              <HpBox mon={playerMon} showNumbers />
              <PokeballRow total={playerTeam.length} remaining={playerRemaining} align="right" />
            </div>
            <img
              src={backSprite(playerMon.pokemonId)}
              alt={playerMon.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = frontSprite(playerMon.pokemonId);
              }}
              className="absolute bottom-6 left-6 w-28 h-28 md:w-32 md:h-32 object-contain image-pixelated drop-shadow-lg"
            />
          </div>

          {/* Message box + commands */}
          <div className="bg-stone-900 p-2 md:p-3 flex flex-col sm:flex-row gap-2 min-h-[10rem]">
            <div className="message-box sm:w-1/2 p-3 overflow-y-auto text-[10px] md:text-[11px] max-h-40">
              {logs.slice(-7).map((l, i) => (
                <p key={i} className="mb-1 leading-snug">▶ {l}</p>
              ))}
            </div>

            <div className="sm:w-1/2">
              {menu === 'root' && !needsSwitch && (
                <div className="grid grid-cols-2 gap-1.5 h-full">
                  <CommandButton label="Fight" onClick={() => setMenu('fight')} />
                  <CommandButton label="Pokémon" onClick={() => setMenu('switch')} />
                  <CommandButton label="Bag" disabled note="Empty" />
                  <CommandButton
                    label="Run"
                    disabled={!GYM_BATTLE_COMMANDS.run}
                    note="No escape"
                  />
                </div>
              )}

              {menu === 'fight' && (
                <div className="h-full flex flex-col gap-1.5">
                  <div className="grid grid-cols-2 gap-1.5 flex-1">
                    {playerMon.moves.slice(0, 4).map((m, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleMove(idx)}
                        disabled={busy}
                        className="move-btn"
                      >
                        <span className="text-[10px] font-black uppercase leading-tight">{m.name}</span>
                        <span className="text-[8px] text-slate-600 uppercase">
                          {m.type} · {m.power}
                        </span>
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
                  {!needsSwitch && (
                    <button onClick={() => setMenu('root')} className="back-btn">← Back</button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------- VICTORY ---------- */}
      {phase === 'victory' && (
        <div className="panel p-6 md:p-8 text-center victory-panel">
          <p className="pixel-font text-xs md:text-sm text-green-400 mb-3">GYM LEADER DEFEATED</p>
          <p className="text-[11px] text-slate-300 italic mb-5 max-w-md mx-auto">
            “{gym.defeatQuote}”
          </p>

          <div className="badge-award mx-auto mb-6 px-5 py-4 inline-flex flex-col items-center">
            <span className="text-4xl mb-1 badge-pop">🏅</span>
            <span className="pixel-font text-[10px] text-yellow-300">{gym.badgeName.toUpperCase()}</span>
            <span className="text-[9px] text-slate-400 mt-1">Badge {gym.order} of {KANTO_GYMS.length}</span>
          </div>

          <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-2">Party Grew Stronger</p>
          <div className="max-w-sm mx-auto flex flex-col gap-1 mb-6">
            {levelUps.map((e, i) => (
              <div key={i} className="levelup-row flex items-center justify-between px-3 py-1.5">
                <span className="text-[10px] font-bold uppercase truncate">
                  {e.evolved ? (
                    <>
                      {e.name} <span className="text-yellow-300">→ {e.newName}</span>
                    </>
                  ) : (
                    e.name
                  )}
                </span>
                <span className="text-[10px] text-green-400 shrink-0">
                  Lv{e.fromLevel} → Lv{e.toLevel}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[9px] text-slate-500 mb-5">
            Your party was fully restored. {turnCount} turns fought.
          </p>

          {gym.order === KANTO_GYMS.length ? (
            <Link href="/journey/kanto/complete" className="btn-green">
              Kanto Complete →
            </Link>
          ) : (
            <Link href="/journey/kanto/map" className="btn-green">
              Continue Journey →
            </Link>
          )}
        </div>
      )}

      {/* ---------- DEFEAT ---------- */}
      {phase === 'defeat' && (
        <div className="panel p-6 md:p-8 text-center">
          <p className="pixel-font text-xs text-red-400 mb-3">YOUR PARTY FAINTED</p>
          <p className="text-[11px] text-slate-400 mb-6 max-w-sm mx-auto">
            {gym.name} was too strong this time. Your Pokémon have been fully restored — nothing was lost.
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <button onClick={handleRetry} className="btn-red">Rematch</button>
            <Link href="/journey/kanto/map" className="btn-grey">Back to Map</Link>
          </div>
        </div>
      )}
    </Shell>
  );
}

// ============================================================
// Small presentational pieces
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
          <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
      <div className="flex items-center justify-between mt-0.5">
        {mon.status ? (
          <span className={`status-chip status-${mon.status}`}>{mon.status.slice(0, 3).toUpperCase()}</span>
        ) : (
          <span />
        )}
        {showNumbers && (
          <span className="text-[8px] font-bold text-gray-700">
            {mon.currentHp}/{mon.maxHp}
          </span>
        )}
      </div>
    </div>
  );
}

function PokeballRow({
  total, remaining, align,
}: { total: number; remaining: number; align: 'left' | 'right' }) {
  return (
    <div className={`flex gap-1 mt-1 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`pokeball-pip ${i < remaining ? 'pip-alive' : 'pip-fainted'}`} />
      ))}
    </div>
  );
}

function CommandButton({
  label, onClick, disabled, note,
}: { label: string; onClick?: () => void; disabled?: boolean; note?: string }) {
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

        .boss-intro {
          background:
            radial-gradient(circle at 50% 0%, rgba(250,204,21,0.10), transparent 60%),
            #0f172a;
          border-color: #a16207;
        }
        .boss-name { text-shadow: 3px 3px 0 rgba(0,0,0,0.9); }

        .quote-box {
          background: #020617;
          border: 2px solid #334155;
        }

        .roster-chip {
          background: #020617;
          border: 2px solid #334155;
        }

        .battlefield {
          background: linear-gradient(180deg, #7dd3fc 0%, #bae6fd 55%, #bbf7d0 55%, #86efac 100%);
        }

        .hp-box {
          background: #f8fafc;
          color: #1c1917;
          border: 3px solid #44403c;
          box-shadow: 2px 2px 0 rgba(0,0,0,0.4);
        }

        .pokeball-pip {
          width: 8px; height: 8px;
          border: 1px solid #1c1917;
          display: inline-block;
        }
        .pip-alive { background: #f8fafc; }
        .pip-fainted { background: #57534e; }

        .message-box {
          background: #f5f5f4;
          color: #1c1917;
          border: 3px solid #44403c;
          box-shadow: inset 0 0 0 2px #f5f5f4, inset 0 0 0 3px #a8a29e;
        }

        .cmd-btn, .move-btn, .switch-btn, .back-btn {
          background: #f5f5f4;
          color: #1c1917;
          border: 3px solid #44403c;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1px;
          transition: background 0.1s;
        }
        .cmd-btn:hover:not(:disabled),
        .move-btn:hover:not(:disabled),
        .switch-btn:hover:not(:disabled),
        .back-btn:hover { background: #fde68a; }
        .cmd-btn:disabled, .move-btn:disabled, .switch-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .move-btn { padding: 4px; }
        .switch-btn { padding: 3px; }
        .back-btn {
          padding: 4px;
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .status-chip {
          font-size: 7px;
          font-weight: 900;
          padding: 1px 3px;
          color: #0b1120;
        }
        .status-burn { background: #f97316; }
        .status-poison { background: #a855f7; }
        .status-paralysis { background: #eab308; }
        .status-sleep { background: #94a3b8; }
        .status-freeze { background: #38bdf8; }

        .victory-panel { border-color: #16a34a; }
        .badge-award {
          background: #020617;
          border: 3px solid #a16207;
        }
        .badge-pop { animation: pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); display: inline-block; }
        @keyframes pop {
          0% { transform: scale(0.2) rotate(-25deg); opacity: 0; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }

        .levelup-row {
          background: #020617;
          border: 1px solid #1e293b;
        }

        .btn-yellow, .btn-green, .btn-red, .btn-grey {
          display: inline-block;
          padding: 12px 28px;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border-bottom-width: 4px;
          border-bottom-style: solid;
        }
        .btn-yellow:active, .btn-green:active, .btn-red:active, .btn-grey:active {
          transform: translateY(3px);
          border-bottom-width: 1px;
        }
        .btn-yellow { background: #facc15; color: #1c1917; border-bottom-color: #a16207; }
        .btn-green  { background: #22c55e; color: #052e16; border-bottom-color: #15803d; }
        .btn-red    { background: #ef4444; color: #ffffff; border-bottom-color: #991b1b; }
        .btn-grey   { background: #475569; color: #ffffff; border-bottom-color: #1e293b; }
      `}</style>
    </div>
  );
}