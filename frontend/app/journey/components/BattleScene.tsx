"use client";

import { useEffect, useRef, useState } from 'react';
import { type JourneyPokemon } from '../data/types';
import { bagEntries, getItem } from '../data/items';
import { attemptCatch, applyXp, xpFromDefeat, xpProgress } from '../lib/wild';
import { relevel, evolveInto, frontSprite, backSprite } from '../lib/fetchMon';
import { resolveJourneyTurn, executeMove, chooseOpponentMove } from '../lib/battleEngine';
import { TrainerSprite, SendOutScene } from './TrainerSprite';
import { GlobalStyle } from '../components/JourneyShell';

// ============================================================
// BATTLE SCENE
// ============================================================
// One battle UI for all three kinds of fight. Wild encounters,
// route trainers and gym leaders differ only in what's allowed
// (catching, running) and what happens at the end — so they share
// everything else rather than living in three files that drift.
//
// The component owns the battle while it runs, then hands the
// final party, bag and outcome back through onEnd. It never
// touches storage itself; the page that opened it decides what
// to persist.
// ============================================================

export type BattleMode = 'wild' | 'trainer' | 'gym';

export interface BattleOpponentTrainer {
  name: string;
  title: string;
  spriteKey: string;
  quote: string;
  defeatQuote: string;
}

export interface BattleOutcome {
  result: 'win' | 'loss' | 'run' | 'caught';
  party: JourneyPokemon[];
  bag: Record<string, number>;
  /** Present when result is 'caught'. */
  caught?: JourneyPokemon;
  turns: number;
  /** Species met this battle, for the dex. */
  seenIds: number[];
}

interface Props {
  mode: BattleMode;
  playerName: string;
  party: JourneyPokemon[];
  bag: Record<string, number>;
  opponents: JourneyPokemon[];
  trainer?: BattleOpponentTrainer;
  /** Skip the trainer intro card — the page showed it already. */
  skipIntro?: boolean;
  onEnd: (outcome: BattleOutcome) => void;
}

type Phase = 'intro' | 'sendout' | 'active' | 'ending';
type Menu = 'root' | 'fight' | 'bag' | 'party' | 'forced-switch';

export default function BattleScene({
  mode, playerName, party: initialParty, bag: initialBag,
  opponents: initialOpponents, trainer, skipIntro, onEnd,
}: Props) {
  const [phase, setPhase] = useState<Phase>(
    mode === 'wild' ? 'active' : skipIntro ? 'sendout' : 'intro'
  );
  const [menu, setMenu] = useState<Menu>('root');

  const [party, setParty] = useState<JourneyPokemon[]>(() => initialParty.map((p) => ({ ...p })));
  const [bag, setBag] = useState<Record<string, number>>({ ...initialBag });
  const [opponents, setOpponents] = useState<JourneyPokemon[]>(() =>
    initialOpponents.map((p) => ({ ...p }))
  );

  const [activeIdx, setActiveIdx] = useState(() =>
    Math.max(0, initialParty.findIndex((p) => p.currentHp > 0))
  );
  const [oppIdx, setOppIdx] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [turns, setTurns] = useState(0);
  const [busy, setBusy] = useState(false);
  const [hitSide, setHitSide] = useState<'player' | 'opponent' | null>(null);
  const [ballState, setBallState] = useState<null | { shakes: number; caught: boolean }>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const player = party[activeIdx];
  const foe = opponents[oppIdx];
  const seenIds = useRef<Set<number>>(new Set(initialOpponents.map((o) => o.pokemonId)));

  // Opening line, once.
  useEffect(() => {
    if (mode === 'wild') setLogs([`A wild ${foe?.name ?? 'Pokémon'} appeared!`]);
    else setLogs([`${trainer?.title ?? ''} ${trainer?.name ?? ''} wants to battle!`.trim()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the message box pinned to the newest line.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [logs]);

  const say = (...lines: string[]) => setLogs((prev) => [...prev, ...lines]);
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const flash = async (side: 'player' | 'opponent') => {
    setHitSide(side);
    await wait(320);
    setHitSide(null);
  };

  const finish = (result: BattleOutcome['result'], caught?: JourneyPokemon) => {
    setPhase('ending');
    onEnd({ result, party, bag, caught, turns, seenIds: Array.from(seenIds.current) });
  };

  // ---------- Experience ----------

  const awardXp = async (defeated: JourneyPokemon): Promise<JourneyPokemon[]> => {
    const gain = xpFromDefeat(defeated.level, mode);
    const messages: string[] = [];
    const updated = await Promise.all(
      party.map(async (mon, i) => {
        // Only Pokémon that are conscious share in the experience.
        if (mon.currentHp <= 0) return mon;
        // The active Pokémon earns full XP; the rest of the party
        // gets half, so switching isn't punished but front-line
        // use still matters.
        const share = i === activeIdx ? gain : Math.floor(gain / 2);
        const grown = applyXp(mon, share);

        if (grown.levelsGained > 0) {
          let next = await relevel(grown.mon, grown.newLevel);
          messages.push(`${mon.name} grew to Lv${grown.newLevel}!`);
          if (grown.evolvedInto) {
            const before = next.name;
            next = await evolveInto(next, grown.evolvedInto);
            messages.push(`${before} evolved into ${next.name}!`);
          }
          return next;
        }
        return grown.mon;
      })
    );

    say(`${party[activeIdx]?.name} gained ${gain} EXP!`, ...messages);
    setParty(updated);
    return updated;
  };

  // ---------- Actions ----------

  const useMove = async (moveIdx: number) => {
    if (busy || !player || !foe) return;
    setBusy(true);
    setMenu('root');

    const nextParty = [...party];
    const nextOpps = [...opponents];
    const p = { ...nextParty[activeIdx] };
    const o = { ...nextOpps[oppIdx] };

    const result = resolveJourneyTurn(p, player.moves[moveIdx], o);
    nextParty[activeIdx] = p;
    nextOpps[oppIdx] = o;
    setParty(nextParty);
    setOpponents(nextOpps);
    say(...result.logs);
    setTurns((t) => t + 1);

    await flash('opponent');
    await wait(400);

    if (result.opponentFainted) {
      // The engine already logged the faint — just pause on it.
      await wait(500);
      const grown = await awardXp(o);

      const nextFoe = nextOpps.findIndex((m, i) => i !== oppIdx && m.currentHp > 0);
      if (nextFoe === -1) {
        setBusy(false);
        setPhase('ending');
        onEnd({
          result: 'win',
          party: grown,
          bag,
          turns,
          seenIds: Array.from(seenIds.current),
        });
        return;
      }
      setOppIdx(nextFoe);
      seenIds.current.add(nextOpps[nextFoe].pokemonId);
      say(`${trainer?.name} sent out ${nextOpps[nextFoe].name}!`);
      await wait(500);
    }

    if (result.playerFainted) {
      await flash('player');
      const nextMon = nextParty.findIndex((m, i) => i !== activeIdx && m.currentHp > 0);
      if (nextMon === -1) {
        setBusy(false);
        finish('loss');
        return;
      }
      setMenu('forced-switch');
    }

    setBusy(false);
  };

  const switchTo = async (idx: number) => {
    if (busy || idx === activeIdx || party[idx].currentHp <= 0) return;
    const forced = menu === 'forced-switch';
    setActiveIdx(idx);
    setMenu('root');
    say(`Go, ${party[idx].name}!`);

    // Switching mid-battle gives the opponent a free move; being
    // forced out after a faint does not.
    if (!forced && foe && foe.currentHp > 0) {
      setBusy(true);
      await wait(600);
      const nextParty = [...party];
      const p = { ...nextParty[idx] };
      const o = { ...opponents[oppIdx] };
      const foeMove = chooseOpponentMove(o, p);
      const result = executeMove(o, foeMove, p);
      nextParty[idx] = p;
      setParty(nextParty);
      say(...result.logs);
      await flash('player');
      if (p.currentHp <= 0) {
        say(`${p.name} fainted!`);
        const nextMon = nextParty.findIndex((m, i) => i !== idx && m.currentHp > 0);
        if (nextMon === -1) {
          setBusy(false);
          finish('loss');
          return;
        }
        setMenu('forced-switch');
      }
      setBusy(false);
    }
  };

  const useItem = async (itemId: string) => {
    if (busy) return;
    const item = getItem(itemId);
    if (!item || (bag[itemId] ?? 0) <= 0) return;

    // --- Throwing a ball ---
    if (item.category === 'ball') {
      if (mode !== 'wild') {
        say("You can't catch another trainer's Pokémon!");
        setMenu('root');
        return;
      }
      setBusy(true);
      setMenu('root');
      const nextBag = { ...bag, [itemId]: bag[itemId] - 1 };
      if (nextBag[itemId] <= 0) delete nextBag[itemId];
      setBag(nextBag);

      say(`You used a ${item.name}!`);
      const attempt = attemptCatch(foe, itemId);
      setBallState({ shakes: attempt.shakes, caught: attempt.caught });
      await wait(900 + attempt.shakes * 320);

      if (attempt.caught) {
        say(`Gotcha! ${foe.name} was caught!`);
        setBallState(null);
        setBusy(false);
        setPhase('ending');
        onEnd({
          result: 'caught',
          party,
          bag: nextBag,
          caught: { ...foe, caughtAt: foe.caughtAt },
          turns,
          seenIds: Array.from(seenIds.current),
        });
        return;
      }

      setBallState(null);
      say(
        attempt.shakes === 0 ? 'Oh no! The Pokémon broke free!' :
        attempt.shakes === 1 ? 'Aww! It appeared to be caught!' :
        attempt.shakes === 2 ? 'Aargh! Almost had it!' :
        'Shoot! It was so close too!'
      );
      await wait(400);
      await foeTurn();
      setBusy(false);
      return;
    }

    // --- Healing and status items ---
    setMenu('party');
    setPendingItem(itemId);
  };

  const [pendingItem, setPendingItem] = useState<string | null>(null);

  const applyItemTo = async (targetIdx: number) => {
    const itemId = pendingItem;
    if (!itemId) return;
    const item = getItem(itemId)!;
    const target = party[targetIdx];

    const fainted = target.currentHp <= 0;
    if (item.category === 'revive' && !fainted) {
      say(`${target.name} doesn't need that.`);
      return;
    }
    if (item.category !== 'revive' && fainted) {
      say(`${target.name} has fainted — use a Revive.`);
      return;
    }
    if (item.category === 'medicine' && target.currentHp >= target.maxHp && !item.curesStatus) {
      say(`${target.name} is already at full health.`);
      return;
    }

    setBusy(true);
    setPendingItem(null);
    setMenu('root');

    const nextBag = { ...bag, [itemId]: bag[itemId] - 1 };
    if (nextBag[itemId] <= 0) delete nextBag[itemId];
    setBag(nextBag);

    const nextParty = [...party];
    const mon = { ...nextParty[targetIdx] };

    if (item.category === 'revive') {
      mon.currentHp = Math.max(1, Math.round(mon.maxHp * (item.reviveFraction ?? 0.5)));
      mon.status = null;
      say(`${mon.name} was revived!`);
    } else {
      if (typeof item.heal === 'number') {
        const before = mon.currentHp;
        mon.currentHp = item.heal === -1
          ? mon.maxHp
          : Math.min(mon.maxHp, mon.currentHp + item.heal);
        say(`${mon.name} recovered ${mon.currentHp - before} HP!`);
      }
      if (item.curesStatus && mon.status) {
        say(`${mon.name} was cured of its ${mon.status}!`);
        mon.status = null;
      } else if (item.curesStatus && !item.heal) {
        say(`${mon.name} has no status condition.`);
      }
    }

    nextParty[targetIdx] = mon;
    setParty(nextParty);

    // Using an item takes your turn.
    await wait(500);
    await foeTurn(nextParty);
    setBusy(false);
  };

  /** The opponent's free attack after a catch attempt or item use. */
  const foeTurn = async (currentParty?: JourneyPokemon[]) => {
    const working = currentParty ? [...currentParty] : [...party];
    const o = { ...opponents[oppIdx] };
    if (o.currentHp <= 0) return;
    const p = { ...working[activeIdx] };
    if (p.currentHp <= 0) return;

    const foeMove = chooseOpponentMove(o, p);
    const result = executeMove(o, foeMove, p);
    working[activeIdx] = p;
    setParty(working);
    say(...result.logs);
    await flash('player');

    if (p.currentHp <= 0) {
      say(`${p.name} fainted!`);
      const nextMon = working.findIndex((m, i) => i !== activeIdx && m.currentHp > 0);
      if (nextMon === -1) {
        finish('loss');
        return;
      }
      setMenu('forced-switch');
    }
  };

  const tryRun = async () => {
    if (busy) return;
    if (mode !== 'wild') {
      say("You can't run from a trainer battle!");
      return;
    }
    setBusy(true);
    setMenu('root');
    // Faster Pokémon escape more reliably, but it's never certain.
    const odds = Math.min(0.95, 0.4 + (player.stats.speed - foe.stats.speed) * 0.01);
    if (Math.random() < odds) {
      say('Got away safely!');
      await wait(600);
      setBusy(false);
      finish('run');
      return;
    }
    say("Can't escape!");
    await wait(400);
    await foeTurn();
    setBusy(false);
  };

  // ---------- Render ----------

  if (!player || !foe) return null;

  if (phase === 'intro' && trainer) {
    return (
      <div className="bs-panel p-6 text-center bs-fade">
        <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500 mb-2">{trainer.title}</p>
        <div className="bs-portrait mx-auto mb-3">
          <TrainerSprite spriteKey={trainer.spriteKey} alt={trainer.name} className="w-24 h-24 object-contain" />
        </div>
        <p className="bs-pixel text-sm text-yellow-300 mb-4">{trainer.name}</p>
        <div className="bs-quote mx-auto max-w-md px-4 py-3 mb-5">
          <p className="text-[11px] italic text-slate-200">“{trainer.quote}”</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {opponents.map((o, i) => (
            <div key={i} className="bs-chip flex flex-col items-center px-2 py-1.5 w-20">
              <img src={frontSprite(o.pokemonId)} alt={o.name} className="w-11 h-11 object-contain bs-pixelated" />
              <span className="text-[8px] uppercase font-bold truncate w-full text-center">{o.name}</span>
              <span className="text-[8px] text-yellow-400">Lv{o.level}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setPhase('sendout')} className="bs-btn bs-btn-yellow">Battle</button>
        <BattleStyles />
      </div>
    );
  }

  if (phase === 'sendout' && trainer) {
    return (
      <div className="bs-panel overflow-hidden bs-fade">
        <SendOutScene
          opponentSpriteKey={trainer.spriteKey}
          opponentName={trainer.name}
          playerName={playerName}
          onDone={() => {
            say(`${trainer.name} sent out ${foe.name}!`, `Go, ${player.name}!`);
            setPhase('active');
          }}
        />
        <div className="bg-stone-900 p-2 md:p-3">
          <div className="bs-message p-3 text-[10px] md:text-[11px]">
            <p>▶ {trainer.name} is about to send out a Pokémon!</p>
          </div>
        </div>
        <BattleStyles />
      </div>
    );
  }

  const aliveParty = party.filter((p) => p.currentHp > 0).length;
  const aliveOpps = opponents.filter((p) => p.currentHp > 0).length;

  return (
    <div className="bs-panel overflow-hidden bs-fade">
      {/* Battlefield */}
      <div className={`bs-field relative h-56 md:h-64 ${mode === 'wild' ? 'bs-field-wild' : ''}`}>
        <div className="absolute top-3 left-3">
          <HpBox mon={foe} />
          {mode !== 'wild' && <Pips total={opponents.length} alive={aliveOpps} align="left" />}
        </div>
        <img
          key={`o-${foe.pokemonId}-${oppIdx}`}
          src={frontSprite(foe.pokemonId)}
          alt={foe.name}
          className={`absolute top-6 right-6 w-24 h-24 md:w-28 md:h-28 object-contain bs-pixelated bs-enter-right
            ${hitSide === 'opponent' ? 'bs-hit' : ''} ${foe.currentHp <= 0 ? 'bs-faint' : ''}
            ${ballState ? 'bs-absorbed' : ''}`}
        />

        {/* Ball wobble */}
        {ballState && (
          <span
            className={`bs-ball bs-ball-shake-${ballState.shakes} ${ballState.caught ? 'bs-ball-caught' : ''}`}
          />
        )}

        <div className="absolute bottom-3 right-3">
          <HpBox mon={player} showNumbers showXp />
          <Pips total={party.length} alive={aliveParty} align="right" />
        </div>
        <img
          key={`p-${player.pokemonId}-${activeIdx}`}
          src={backSprite(player.pokemonId)}
          alt={player.name}
          onError={(e) => { (e.target as HTMLImageElement).src = frontSprite(player.pokemonId); }}
          className={`absolute bottom-6 left-6 w-28 h-28 md:w-32 md:h-32 object-contain bs-pixelated bs-enter-left
            ${hitSide === 'player' ? 'bs-hit' : ''} ${player.currentHp <= 0 ? 'bs-faint' : ''}`}
        />
      </div>

      {/* Message + commands */}
      <div className="bg-stone-900 p-2 md:p-3 flex flex-col sm:flex-row gap-2 min-h-[11rem]">
        <div ref={logRef} className="bs-message sm:w-1/2 p-3 overflow-y-auto text-[10px] md:text-[11px] max-h-44">
          {logs.slice(-9).map((l, i) => (
            <p key={`${i}-${l}`} className="mb-1 leading-snug bs-log">▶ {l}</p>
          ))}
        </div>

        <div className="sm:w-1/2">
          {menu === 'root' && (
            <div className="grid grid-cols-2 gap-1.5 h-full">
              <Cmd label="Fight" onClick={() => setMenu('fight')} disabled={busy} />
              <Cmd label="Bag" onClick={() => setMenu('bag')} disabled={busy} />
              <Cmd label="Pokémon" onClick={() => setMenu('party')} disabled={busy} />
              <Cmd
                label="Run"
                onClick={tryRun}
                disabled={busy || mode !== 'wild'}
                note={mode === 'wild' ? 'Escape' : 'No escape'}
              />
            </div>
          )}

          {menu === 'fight' && (
            <div className="h-full flex flex-col gap-1.5">
              <div className="grid grid-cols-2 gap-1.5 flex-1">
                {player.moves.slice(0, 4).map((m, i) => (
                  <button key={i} onClick={() => useMove(i)} disabled={busy} className="bs-move">
                    <span className="text-[10px] font-black uppercase leading-tight">{m.name}</span>
                    <span className="text-[8px] text-stone-600 uppercase">{m.type} · {m.power}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setMenu('root')} className="bs-back">← Back</button>
            </div>
          )}

          {menu === 'bag' && (
            <div className="h-full flex flex-col gap-1.5">
              <div className="flex-1 overflow-y-auto flex flex-col gap-1 max-h-32">
                {bagEntries(bag, { inBattle: true }).length === 0 && (
                  <p className="text-[10px] text-stone-500 p-2">Your bag is empty.</p>
                )}
                {bagEntries(bag, { inBattle: true }).map(({ item, count }) => (
                  <button
                    key={item.id}
                    onClick={() => useItem(item.id)}
                    disabled={busy || (item.category === 'ball' && mode !== 'wild')}
                    className="bs-item flex items-center justify-between px-2 py-1.5"
                  >
                    <span className="text-[10px] font-bold truncate">{item.name}</span>
                    <span className="text-[9px] text-stone-600 shrink-0">×{count}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setMenu('root')} className="bs-back">← Back</button>
            </div>
          )}

          {(menu === 'party' || menu === 'forced-switch') && (
            <div className="h-full flex flex-col gap-1.5">
              {menu === 'forced-switch' && (
                <p className="text-[9px] uppercase font-black text-yellow-300 tracking-wider">
                  Choose your next Pokémon!
                </p>
              )}
              {pendingItem && (
                <p className="text-[9px] uppercase font-black text-sky-300 tracking-wider">
                  Use {getItem(pendingItem)?.name} on who?
                </p>
              )}
              <div className="grid grid-cols-2 gap-1 flex-1 overflow-y-auto max-h-32">
                {party.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => (pendingItem ? applyItemTo(i) : switchTo(i))}
                    disabled={busy || (!pendingItem && (i === activeIdx || p.currentHp <= 0))}
                    className="bs-switch"
                  >
                    <span className="text-[9px] font-bold uppercase truncate w-full">{p.name}</span>
                    <span className="text-[8px] text-stone-500">
                      {p.currentHp <= 0 ? 'FNT' : i === activeIdx ? 'ACTIVE' : `${p.currentHp}/${p.maxHp}`}
                    </span>
                  </button>
                ))}
              </div>
              {menu !== 'forced-switch' && (
                <button
                  onClick={() => { setPendingItem(null); setMenu('root'); }}
                  className="bs-back"
                >
                  ← Back
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <BattleStyles />
    </div>
  );
}

// ============================================================

function HpBox({
  mon, showNumbers, showXp,
}: { mon: JourneyPokemon; showNumbers?: boolean; showXp?: boolean }) {
  const pct = Math.max(0, (mon.currentHp / mon.maxHp) * 100);
  const color = pct > 50 ? '#22c55e' : pct > 20 ? '#facc15' : '#ef4444';
  return (
    <div className="bs-hp px-2 py-1.5 w-44 md:w-52">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-black uppercase truncate">{mon.name}</span>
        <span className="text-[9px] shrink-0">Lv{mon.level}</span>
      </div>
      <div className="flex items-center gap-1 mt-1">
        <span className="text-[7px] font-black text-amber-600">HP</span>
        <div className="h-2 flex-1 bg-gray-400 border border-gray-700 overflow-hidden">
          <div className="h-full bs-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
      {showXp && (
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[7px] font-black text-sky-700">XP</span>
          <div className="h-1 flex-1 bg-gray-400 border border-gray-600 overflow-hidden">
            <div className="h-full bs-fill" style={{ width: `${xpProgress(mon) * 100}%`, background: '#38bdf8' }} />
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mt-0.5">
        {mon.status
          ? <span className={`bs-status bs-status-${mon.status}`}>{mon.status.slice(0, 3).toUpperCase()}</span>
          : <span />}
        {showNumbers && (
          <span className="text-[8px] font-bold text-gray-700">{mon.currentHp}/{mon.maxHp}</span>
        )}
      </div>
    </div>
  );
}

function Pips({ total, alive, align }: { total: number; alive: number; align: 'left' | 'right' }) {
  return (
    <div className={`flex gap-1 mt-1 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`bs-pip ${i < alive ? 'bs-pip-alive' : 'bs-pip-out'}`} />
      ))}
    </div>
  );
}

function Cmd({
  label, onClick, disabled, note,
}: { label: string; onClick?: () => void; disabled?: boolean; note?: string }) {
  return (
    <button onClick={onClick} disabled={disabled} className="bs-cmd">
      <span className="text-[11px] font-black uppercase">{label}</span>
      {note && <span className="text-[7px] uppercase text-stone-500">{note}</span>}
    </button>
  );
}

function BattleStyles() {
  return (
    <GlobalStyle css={`
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      :root {
        --ease: cubic-bezier(0.22, 0.61, 0.36, 1);
        --ease-pop: cubic-bezier(0.34, 1.4, 0.64, 1);
        --t-fast: 140ms;
        --t-base: 260ms;
        --t-slow: 520ms;
      }
      .bs-pixel { font-family: 'Press Start 2P', monospace; line-height: 1.6; }
      .bs-pixelated { image-rendering: pixelated; }

      .bs-panel {
        background: #0f172a;
        border: 3px solid #334155;
        box-shadow: inset -2px -2px 0 rgba(0,0,0,0.5), inset 2px 2px 0 rgba(255,255,255,0.05);
      }
      .bs-quote { background: #020617; border: 2px solid #334155; }
      .bs-chip { background: #020617; border: 2px solid #334155; }
      .bs-portrait {
        display: inline-flex; padding: 8px;
        background: radial-gradient(circle at 50% 35%, rgba(250,204,21,0.18), transparent 70%), #020617;
        border: 3px solid #a16207;
      }

      .bs-field { background: linear-gradient(180deg, #7dd3fc 0%, #bae6fd 55%, #bbf7d0 55%, #86efac 100%); }
      .bs-field-wild { background: linear-gradient(180deg, #a5b4fc 0%, #c7d2fe 55%, #86efac 55%, #4ade80 100%); }

      .bs-hp {
        background: #f8fafc; color: #1c1917;
        border: 3px solid #44403c; box-shadow: 2px 2px 0 rgba(0,0,0,0.4);
      }
      .bs-fill { transition: width var(--t-slow) var(--ease), background var(--t-base) linear; }

      .bs-pip { width: 8px; height: 8px; border: 1px solid #1c1917; display: inline-block;
                transition: background var(--t-base) var(--ease); }
      .bs-pip-alive { background: #f8fafc; }
      .bs-pip-out { background: #57534e; }

      .bs-message {
        background: #f5f5f4; color: #1c1917;
        border: 3px solid #44403c;
        box-shadow: inset 0 0 0 2px #f5f5f4, inset 0 0 0 3px #a8a29e;
      }
      .bs-log { animation: bsLog var(--t-base) var(--ease) both; }
      @keyframes bsLog { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: none; } }

      .bs-cmd, .bs-move, .bs-switch, .bs-back, .bs-item {
        background: #f5f5f4; color: #1c1917; border: 3px solid #44403c;
        display: flex; align-items: center; justify-content: center; gap: 1px;
        transition: background var(--t-fast) var(--ease), transform var(--t-fast) var(--ease);
      }
      .bs-cmd, .bs-move, .bs-switch, .bs-back { flex-direction: column; }
      .bs-cmd:hover:not(:disabled), .bs-move:hover:not(:disabled),
      .bs-switch:hover:not(:disabled), .bs-back:hover, .bs-item:hover:not(:disabled) {
        background: #fde68a; transform: translateY(-1px);
      }
      .bs-cmd:disabled, .bs-move:disabled, .bs-switch:disabled, .bs-item:disabled {
        opacity: 0.4; cursor: not-allowed;
      }
      .bs-move { padding: 4px; }
      .bs-switch { padding: 3px; }
      .bs-item { border-width: 2px; }
      .bs-back { padding: 4px; font-size: 9px; font-weight: 900; text-transform: uppercase; }

      .bs-status { font-size: 7px; font-weight: 900; padding: 1px 3px; color: #0b1120; }
      .bs-status-burn { background: #f97316; }
      .bs-status-poison { background: #a855f7; }
      .bs-status-paralysis { background: #eab308; }
      .bs-status-sleep { background: #94a3b8; }
      .bs-status-freeze { background: #38bdf8; }

      .bs-fade { animation: bsFade var(--t-base) var(--ease) both; }
      @keyframes bsFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

      .bs-enter-right { animation: bsInRight var(--t-slow) var(--ease) both; }
      .bs-enter-left  { animation: bsInLeft  var(--t-slow) var(--ease) both; }
      @keyframes bsInRight { from { opacity: 0; transform: translateX(40px) scale(0.9); } to { opacity: 1; transform: none; } }
      @keyframes bsInLeft  { from { opacity: 0; transform: translateX(-40px) scale(0.9); } to { opacity: 1; transform: none; } }

      .bs-hit { animation: bsShake 320ms var(--ease) both; }
      @keyframes bsShake {
        0%,100% { transform: translateX(0); filter: none; }
        20% { transform: translateX(-7px); filter: brightness(2.2); }
        40% { transform: translateX(6px); }
        60% { transform: translateX(-4px); filter: brightness(1.8); }
        80% { transform: translateX(3px); }
      }

      .bs-faint { animation: bsFaint var(--t-slow) var(--ease) forwards; }
      @keyframes bsFaint { to { opacity: 0; transform: translateY(34px); } }

      /* Pokémon vanishes into the ball, then reappears if it escapes. */
      .bs-absorbed { animation: bsAbsorb 420ms var(--ease) forwards; }
      @keyframes bsAbsorb { to { opacity: 0; transform: scale(0.25) translateY(10px); } }

      .bs-ball {
        position: absolute; top: 34%; right: 24%;
        width: 18px; height: 18px; border-radius: 50%;
        background: linear-gradient(#ef4444 0 47%, #1c1917 47% 53%, #f8fafc 53% 100%);
        border: 2px solid #1c1917;
      }
      .bs-ball-shake-0 { animation: bsWobble 600ms var(--ease) 0s 1 both; }
      .bs-ball-shake-1 { animation: bsWobble 600ms var(--ease) 0s 1 both; }
      .bs-ball-shake-2 { animation: bsWobble 600ms var(--ease) 0s 2 both; }
      .bs-ball-shake-3 { animation: bsWobble 600ms var(--ease) 0s 3 both; }
      .bs-ball-caught { animation: bsWobble 600ms var(--ease) 0s 3 both, bsClick 400ms var(--ease) 1.8s both; }
      @keyframes bsWobble {
        0%, 100% { transform: rotate(0); }
        25% { transform: rotate(-22deg); }
        75% { transform: rotate(22deg); }
      }
      @keyframes bsClick {
        0% { box-shadow: 0 0 0 0 rgba(250,204,21,0.9); }
        100% { box-shadow: 0 0 0 22px rgba(250,204,21,0); }
      }

      .bs-btn {
        display: inline-block; padding: 12px 26px;
        font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em;
        border-bottom-width: 4px; border-bottom-style: solid;
        transition: transform var(--t-fast) var(--ease), filter var(--t-fast) var(--ease);
      }
      .bs-btn:hover { filter: brightness(1.1); }
      .bs-btn:active { transform: translateY(3px); border-bottom-width: 1px; }
      .bs-btn-yellow { background: #facc15; color: #1c1917; border-bottom-color: #a16207; }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `} />
  );
}
