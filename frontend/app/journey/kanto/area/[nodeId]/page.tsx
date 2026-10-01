"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import BattleScene, { type BattleOutcome } from '../../../components/BattleScene';
import GrassField, { type FieldTerrain } from '../../../components/GrassField';
import { TrainerSprite } from '../../../components/TrainerSprite';
import { KANTO_GYMS, type JourneyPokemon } from '../../../data/kanto';
import { KANTO_NODE_BY_ID, isNodeReachable } from '../../../data/kanto-map';
import { encountersFor, isTown } from '../../../data/kanto-encounters';
import { trainersAt, trainerSpriteKey } from '../../../data/kanto-trainers';
import { getItem, MART_STOCK, ITEMS, bagEntries } from '../../../data/kanto-items';
import { takeStep } from '../../../lib/wild';
import { buildPokemon, frontSprite, prefetchSpecies } from '../../../lib/fetchMon';
import {
  getRegionState, hasStarted, travelTo, countStep, addItem, addMoney,
  addCaught, setParty, healParty, buyItem, countWildBattle, payoutOnLoss,
  markSeen, markTrainerDefeated, isTrainerDefeated, getGymUiState,
  movePartyToBox, moveBoxToParty, PARTY_LIMIT, setLead,
  commitParty, registerCatch,
  type JourneyRegionState,
} from '../../../lib/journeyStorage';
import { trainerPrize } from '../../../data/kanto-items';

// ============================================================
// AREA VIEW
// ============================================================
// Where the Journey actually happens. The map is the travel
// layer; this is the place you stand in. Exploring takes steps,
// steps turn up wild Pokémon and items, trainers wait to be
// challenged, and towns offer healing and a shop.
// ============================================================

type View = 'area' | 'wild' | 'trainer' | 'party' | 'bag' | 'mart' | 'keep-six';

interface ActiveBattle {
  kind: 'wild' | 'trainer';
  opponents: JourneyPokemon[];
  trainerId?: string;
}

export default function AreaPage() {
  const { nodeId } = useParams();
  const router = useRouter();
  const { user } = useUserStore() as any;
  const id = String(nodeId);

  const [mounted, setMounted] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [region, setRegion] = useState<JourneyRegionState | null>(null);
  const [view, setView] = useState<View>('area');
  const [battle, setBattle] = useState<ActiveBattle | null>(null);
  const [feed, setFeed] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  /** A catch made with a full party, waiting on the keep-six choice. */
  const [overflowCatch, setOverflowCatch] = useState<JourneyPokemon | null>(null);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  const node = KANTO_NODE_BY_ID[id];
  const area = encountersFor(id);
  const town = isTown(id);
  const locals = trainersAt(id);
  const gym = KANTO_GYMS.find((g) => g.locationId === id);

  const refresh = () => {
    if (!user) return null;
    const r = getRegionState(user.username, 'kanto');
    setRegion({ ...r });
    return r;
  };

  useEffect(() => {
    setMounted(true);
    if (!user) { setBlocked('no-user'); return; }
    if (!node) { setBlocked('no-node'); return; }

    const r = getRegionState(user.username, 'kanto');
    if (!hasStarted(r)) { setBlocked('no-starter'); return; }
    if (!isNodeReachable(node, r.completedGyms.length)) { setBlocked('locked'); return; }

    travelTo(user.username, 'kanto', id);
    setRegion({ ...getRegionState(user.username, 'kanto') });
    setFeed([town ? `You arrive in ${node.label}.` : `You step onto ${node.label}.`]);

    // Warm the species cache for this area so the first encounter
    // doesn't stall on a network round trip.
    if (area) prefetchSpecies(area.slots.map((s) => s.pokemonId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  const push = (line: string) => setFeed((prev) => [...prev.slice(-30), line]);
  const flashToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  // ---------- Exploring ----------

  /**
   * One step. Returns true when the walk should stop — i.e. an
   * encounter or a find interrupted it.
   */
  const explore = async (): Promise<boolean> => {
    if (!region || !area) return true;
    countStep(user.username, 'kanto');

    const result = takeStep(id);

    if (result.kind === 'nothing') {
      const line = randomQuiet();
      setLastEvent(line);
      refresh();
      return false; // keep walking
    }

    if (result.kind === 'item') {
      const item = getItem(result.itemId)!;
      addItem(user.username, 'kanto', result.itemId, 1);
      push(`You found a ${item.name}!`);
      setLastEvent(`You found a ${item.name}!`);
      flashToast(`Found ${item.name}`);
      refresh();
      return true; // stop so the find registers
    }

    // Wild encounter
    try {
      const wild = await buildPokemon(result.slot.pokemonId, result.level, {
        caughtAt: node.label,
      });
      markSeen(user.username, 'kanto', wild.pokemonId);
      countWildBattle(user.username, 'kanto');
      push(`A wild ${wild.name} (Lv${wild.level}) appeared!`);
      setLastEvent(`A wild ${wild.name} appeared!`);
      setBattle({ kind: 'wild', opponents: [wild] });
      setView('wild');
    } catch (err) {
      console.error('[journey] could not build wild Pokémon:', err);
      setLastEvent('Something rustled, but got away.');
    }
    return true;
  };

  /** Which field art this area gets. */
  const terrain: FieldTerrain =
    node?.kind === 'cave' ? 'cave' : node?.kind === 'water' ? 'water' : 'grass';

  // ---------- Trainers ----------

  const challengeTrainer = async (trainerId: string) => {
    const t = locals.find((x) => x.id === trainerId);
    if (!t || !region) return;
    try {
      const team = await Promise.all(t.team.map((m) => buildPokemon(m.pokemonId, m.level)));
      setBattle({ kind: 'trainer', opponents: team, trainerId });
      setView('trainer');
    } catch (err) {
      console.error('[journey] could not load trainer team:', err);
      flashToast('Could not start that battle.');
    }
  };

  // ---------- Battle results ----------

  const handleBattleEnd = (outcome: BattleOutcome) => {
    if (!region) return;

    // Party and bag always carry back, whatever happened.
    setParty(user.username, 'kanto', outcome.party);
    getRegionState(user.username, 'kanto');
    const r = getRegionState(user.username, 'kanto');
    r.bag = outcome.bag;
    outcome.seenIds.forEach((sid) => {
      if (!r.seen.includes(sid)) r.seen.push(sid);
    });
    setParty(user.username, 'kanto', outcome.party);

    const trainer = battle?.trainerId ? locals.find((t) => t.id === battle.trainerId) : null;

    if (outcome.result === 'caught' && outcome.caught) {
      // A full party means the player decides who stays, rather
      // than the newcomer being silently filed away.
      if (outcome.party.length >= PARTY_LIMIT) {
        registerCatch(user.username, 'kanto', outcome.caught);
        push(`${outcome.caught.name} was caught! Your party is full — choose six to carry.`);
        flashToast(`Caught ${outcome.caught.name}!`);
        setOverflowCatch(outcome.caught);
        setBattle(null);
        setView('keep-six');
        refresh();
        return;
      }
      const where = addCaught(user.username, 'kanto', outcome.caught);
      push(
        where === 'party'
          ? `${outcome.caught.name} joined your party!`
          : `${outcome.caught.name} was sent to the PC.`
      );
      flashToast(`Caught ${outcome.caught.name}!`);
    } else if (outcome.result === 'win') {
      if (trainer) {
        const top = Math.max(...trainer.team.map((m) => m.level));
        const prize = trainerPrize(top, false);
        markTrainerDefeated(user.username, 'kanto', trainer.id);
        addMoney(user.username, 'kanto', prize);
        push(`You defeated ${trainer.name}! Won ₽${prize}.`);
        flashToast(`+₽${prize}`);
      } else {
        push('The wild Pokémon fainted.');
      }
    } else if (outcome.result === 'run') {
      push('You got away safely.');
    } else if (outcome.result === 'loss') {
      const lost = payoutOnLoss(user.username, 'kanto');
      push(`You blacked out! You paid ₽${lost} and were rushed to a Pokémon Center.`);
      flashToast('You blacked out!');
      setBattle(null);
      setView('area');
      refresh();
      router.push('/journey/kanto/map');
      return;
    }

    setBattle(null);
    setView('area');
    refresh();
  };

  // ---------- Town services ----------

  const heal = () => {
    healParty(user.username, 'kanto');
    push('Your Pokémon were restored to full health.');
    flashToast('Party healed');
    refresh();
  };

  const buy = (itemId: string) => {
    const price = ITEMS[itemId].price;
    const ok = buyItem(user.username, 'kanto', itemId, price, 1);
    flashToast(ok ? `Bought ${ITEMS[itemId].name}` : 'Not enough money');
    if (ok) push(`Bought a ${ITEMS[itemId].name} for ₽${price}.`);
    refresh();
  };

  // ---------- Guards ----------

  if (!mounted) return <Status title="LOADING" body="Finding your way…" />;
  if (blocked === 'no-user') return <Status title="NOT SIGNED IN" body="Sign in to continue." action={{ href: '/auth', label: 'Sign In' }} />;
  if (blocked === 'no-node') return <Status title="NOWHERE TO GO" body="That place isn't on the Kanto map." action={{ href: '/journey/kanto/map', label: 'Back to Map' }} />;
  if (blocked === 'no-starter') return <Status title="NO PARTNER YET" body="Professor Oak is waiting for you in Pallet Town." action={{ href: '/journey/kanto/starter', label: "Go to Oak's Lab" }} />;
  if (blocked === 'locked') return <Status title="YOU CAN'T GO THERE YET" body="Earn more badges to open the way." action={{ href: '/journey/kanto/map', label: 'Back to Map' }} />;
  if (!region || !node) return <Status title="LOADING" body="Finding your way…" />;

  // ---------- Battle takes over the screen ----------

  if ((view === 'wild' || view === 'trainer') && battle) {
    const t = battle.trainerId ? locals.find((x) => x.id === battle.trainerId) : null;
    return (
      <div className="ar-root min-h-screen p-3 md:p-6">
        <div className="max-w-2xl mx-auto">
          <BattleScene
            mode={battle.kind}
            playerName={user.username}
            party={region.party}
            bag={region.bag}
            opponents={battle.opponents}
            trainer={t ? {
              name: t.name,
              title: t.trainerClass,
              spriteKey: trainerSpriteKey(t),
              quote: t.quote,
              defeatQuote: t.defeatQuote,
            } : undefined}
            onEnd={handleBattleEnd}
          />
        </div>
        <AreaStyles />
      </div>
    );
  }

  const partyAlive = region.party.some((p) => p.currentHp > 0);
  const trainersLeft = locals.filter((t) => !isTrainerDefeated(region, t.id));

  return (
    <div className="ar-root min-h-screen p-3 md:p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="ar-panel flex items-center justify-between px-3 py-2 mb-3">
          <div className="min-w-0">
            <p className="ar-pixel text-[9px] text-yellow-300 truncate">{node.label.toUpperCase()}</p>
            <p className="text-[9px] text-slate-400">
              {town ? 'Town' : area ? 'Wild Pokémon live here' : 'Quiet ground'}
              {node.landmark ? ` · ${node.landmark}` : ''}
            </p>
          </div>
          <Link href="/journey/kanto/map" className="text-[10px] text-slate-400 hover:text-white underline shrink-0">
            ← Map
          </Link>
        </div>

        {/* Trainer / money strip */}
        <div className="ar-panel flex items-center justify-between px-3 py-2 mb-3 gap-3">
          <div className="flex gap-1.5 min-w-0 overflow-x-auto">
            {region.party.map((p, i) => {
              const pct = Math.max(0, (p.currentHp / p.maxHp) * 100);
              return (
                <div key={i} className="ar-mini shrink-0 px-1.5 py-1 flex items-center gap-1.5">
                  <img src={frontSprite(p.pokemonId)} alt={p.name} className="w-7 h-7 object-contain ar-pixelated" />
                  <div className="w-12">
                    <span className="block text-[8px] uppercase font-bold truncate">{p.name}</span>
                    <div className="h-1 bg-slate-900 border border-slate-700 overflow-hidden">
                      <div
                        className={`h-full ar-fill ${pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-yellow-400' : 'bg-red-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <span className="text-[10px] font-bold text-yellow-300 shrink-0">₽{region.money}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-3">

          {/* Main column */}
          <div className="flex flex-col gap-3">

            {/* Explore */}
            {area && (
              <div className="ar-panel p-3 md:p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="ar-pixel text-[9px] text-slate-400">
                    {terrain === 'cave' ? 'DARK CAVE' : terrain === 'water' ? 'OPEN WATER' : 'TALL GRASS'}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    Lead: {region.party[0]?.name ?? '—'}
                  </span>
                </div>
                <GrassField
                  terrain={terrain}
                  onStep={explore}
                  disabled={!partyAlive}
                  disabledReason="Your Pokémon need healing"
                  stepsTaken={region.stats.stepsTaken}
                  lastEvent={lastEvent}
                />
              </div>
            )}

            {/* Town services */}
            {town && (
              <div className="ar-panel p-4">
                <p className="ar-pixel text-[9px] text-slate-400 mb-3">IN TOWN</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={heal} className="ar-service">
                    <span className="text-lg">🏥</span>
                    <span className="text-[10px] font-black uppercase">Pokémon Center</span>
                    <span className="text-[8px] text-slate-500">Full heal, free</span>
                  </button>
                  <button onClick={() => setView('mart')} className="ar-service">
                    <span className="text-lg">🏪</span>
                    <span className="text-[10px] font-black uppercase">Poké Mart</span>
                    <span className="text-[8px] text-slate-500">Buy items</span>
                  </button>
                </div>
              </div>
            )}

            {/* Gym */}
            {gym && (() => {
              const state = getGymUiState(region, KANTO_GYMS, gym.id);
              return (
                <div className={`ar-panel p-4 ${state === 'locked' ? 'opacity-60' : ''}`}>
                  <p className="ar-pixel text-[9px] text-slate-400 mb-3">{gym.gymName.toUpperCase()}</p>
                  <div className="flex items-center gap-3">
                    <TrainerSprite spriteKey={gym.spriteKey} alt={gym.name} className="w-14 h-14 object-contain shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black uppercase">{gym.name}</p>
                      <p className="text-[9px] text-slate-400">{gym.type} · {gym.badgeName}</p>
                    </div>
                    {state === 'completed' ? (
                      <span className="ar-tag ar-tag-done shrink-0">Badge Earned</span>
                    ) : state === 'locked' ? (
                      <span className="ar-tag shrink-0">Locked</span>
                    ) : (
                      <Link href={`/journey/kanto/gym/${gym.id}`} className="ar-tag ar-tag-go shrink-0">
                        Challenge
                      </Link>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Trainers */}
            {locals.length > 0 && (
              <div className="ar-panel p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="ar-pixel text-[9px] text-slate-400">TRAINERS</span>
                  <span className="text-[9px] text-slate-500">
                    {locals.length - trainersLeft.length}/{locals.length} beaten
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {locals.map((t) => {
                    const done = isTrainerDefeated(region, t.id);
                    const top = Math.max(...t.team.map((m) => m.level));
                    return (
                      <button
                        key={t.id}
                        onClick={() => !done && partyAlive && challengeTrainer(t.id)}
                        disabled={done || !partyAlive}
                        className={`ar-trainer flex items-center gap-2 px-2 py-1.5 ${done ? 'ar-trainer-done' : ''}`}
                      >
                        <TrainerSprite spriteKey={trainerSpriteKey(t)} alt={t.name} className="w-9 h-9 object-contain shrink-0" />
                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-[8px] uppercase tracking-wider text-slate-500">{t.trainerClass}</p>
                          <p className="text-[10px] font-bold uppercase truncate">{t.name}</p>
                        </div>
                        <span className={`ar-tag shrink-0 ${done ? 'ar-tag-done' : 'ar-tag-go'}`}>
                          {done ? 'Beaten' : `Lv${top}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Feed */}
            <div className="ar-panel p-3">
              <p className="ar-pixel text-[9px] text-slate-400 mb-2">LOG</p>
              <div className="ar-feed p-2 max-h-40 overflow-y-auto flex flex-col-reverse gap-1">
                {[...feed].reverse().map((f, i) => (
                  <p key={i} className="text-[10px] text-slate-300 ar-log">▸ {f}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Side column */}
          <div className="flex flex-col gap-3">
            <div className="ar-panel p-3">
              <button onClick={() => setView('party')} className="ar-side mb-1.5">
                Party ({region.party.length}/{PARTY_LIMIT})
              </button>
              <button onClick={() => setView('bag')} className="ar-side mb-1.5">
                Bag ({bagEntries(region.bag).reduce((s, e) => s + e.count, 0)})
              </button>
              <Link href="/journey/kanto/map" className="ar-side block text-center">Travel</Link>
            </div>

            <div className="ar-panel p-3">
              <p className="ar-pixel text-[9px] text-slate-400 mb-2">DEX</p>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Seen</span><span className="text-slate-200">{region.seen.length}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Caught</span><span className="text-slate-200">{region.caught.length}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-800">
                <span>Badges</span><span className="text-yellow-300">{region.completedGyms.length}/8</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlays */}
      {view === 'party' && (
        <Overlay title="PARTY" onClose={() => setView('area')}>
          <PartyPanel
            region={region}
            onBox={(i) => { movePartyToBox(user.username, 'kanto', i); refresh(); }}
            onRetrieve={(i) => { moveBoxToParty(user.username, 'kanto', i); refresh(); }}
            onLead={(i) => {
              setLead(user.username, 'kanto', i);
              const r = refresh();
              if (r) flashToast(`${r.party[0]?.name} now leads`);
            }}
          />
        </Overlay>
      )}

      {view === 'keep-six' && overflowCatch && (
        <KeepSixChooser
          party={region.party}
          newcomer={overflowCatch}
          onConfirm={(keep, toBox) => {
            commitParty(user.username, 'kanto', keep, toBox);
            const boxed = toBox.map((m) => m.name).join(', ');
            push(boxed ? `${boxed} sent to the PC.` : 'Party unchanged.');
            setOverflowCatch(null);
            setView('area');
            refresh();
          }}
        />
      )}

      {view === 'bag' && (
        <Overlay title="BAG" onClose={() => setView('area')}>
          {bagEntries(region.bag).length === 0 ? (
            <p className="text-[11px] text-slate-500">Your bag is empty.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {bagEntries(region.bag).map(({ item, count }) => (
                <div key={item.id} className="ar-row px-3 py-2">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-[11px] font-bold">{item.name}</span>
                    <span className="text-[10px] text-slate-400">×{count}</span>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-0.5">{item.description}</p>
                </div>
              ))}
            </div>
          )}
        </Overlay>
      )}

      {view === 'mart' && (
        <Overlay title={`POKÉ MART · ₽${region.money}`} onClose={() => setView('area')}>
          <div className="flex flex-col gap-1.5">
            {MART_STOCK.map((itemId) => {
              const item = ITEMS[itemId];
              const afford = region.money >= item.price;
              return (
                <button
                  key={itemId}
                  onClick={() => buy(itemId)}
                  disabled={!afford}
                  className={`ar-row px-3 py-2 text-left ${!afford ? 'opacity-40' : 'hover:border-yellow-500'}`}
                >
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-[11px] font-bold">{item.name}</span>
                    <span className="text-[10px] text-yellow-300">₽{item.price}</span>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-0.5">{item.description}</p>
                </button>
              );
            })}
          </div>
        </Overlay>
      )}

      {toast && <div className="ar-toast">{toast}</div>}
      <AreaStyles />
    </div>
  );
}

// ============================================================

function PartyPanel({
  region, onBox, onRetrieve, onLead,
}: {
  region: JourneyRegionState;
  onBox: (i: number) => void;
  onRetrieve: (i: number) => void;
  onLead: (i: number) => void;
}) {
  return (
    <>
      <p className="text-[9px] text-slate-500 mb-2">
        Slot one leads every battle. Tap <span className="text-yellow-300">Lead</span> to move a
        Pokémon to the front.
      </p>
      <div className="flex flex-col gap-1.5 mb-4">
        {region.party.map((p, i) => {
          const pct = Math.max(0, (p.currentHp / p.maxHp) * 100);
          const isLead = i === 0;
          return (
            <div key={i} className={`ar-row px-3 py-2 flex items-center gap-3 ${isLead ? 'ar-lead' : ''}`}>
              <div className="relative shrink-0">
                <img src={frontSprite(p.pokemonId)} alt={p.name} className="w-11 h-11 object-contain ar-pixelated" />
                {isLead && <span className="ar-leadtag">LEAD</span>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-[11px] font-black uppercase truncate">{p.name}</span>
                  <span className="text-[9px] text-slate-400 shrink-0">Lv{p.level}</span>
                </div>
                <div className="h-1.5 bg-slate-900 border border-slate-700 overflow-hidden mt-1">
                  <div
                    className={`h-full ar-fill ${pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-yellow-400' : 'bg-red-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[8px] text-slate-500">{p.currentHp}/{p.maxHp} HP</span>
                  <span className="text-[8px] text-slate-600">{p.types.join('/')}</span>
                  {p.caughtAt && <span className="text-[8px] text-slate-700 ml-auto">{p.caughtAt}</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {!isLead && (
                  <button
                    onClick={() => onLead(i)}
                    disabled={p.currentHp <= 0}
                    className="ar-tag ar-tag-go disabled:opacity-40"
                    title={p.currentHp <= 0 ? 'A fainted Pokémon cannot lead' : 'Move to slot one'}
                  >
                    Lead
                  </button>
                )}
                {region.party.length > 1 && (
                  <button onClick={() => onBox(i)} className="ar-tag">Box</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="ar-pixel text-[9px] text-slate-400 mb-2">BOX ({region.box.length})</p>
      {region.box.length === 0 ? (
        <p className="text-[10px] text-slate-600">Nothing stored.</p>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {region.box.map((p, i) => (
            <button
              key={i}
              onClick={() => onRetrieve(i)}
              disabled={region.party.length >= PARTY_LIMIT}
              className="ar-row px-2 py-1.5 flex items-center gap-2 disabled:opacity-40"
            >
              <img src={frontSprite(p.pokemonId)} alt={p.name} className="w-8 h-8 object-contain ar-pixelated shrink-0" />
              <div className="min-w-0 text-left">
                <span className="block text-[9px] font-bold uppercase truncate">{p.name}</span>
                <span className="block text-[8px] text-slate-500">Lv{p.level}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

/**
 * Shown when a catch lands on a full party. Seven candidates, six
 * slots — the player picks who travels and who goes to the PC.
 * There's no cancel: the Pokémon has already been caught, so the
 * only question is which six are carried.
 */
function KeepSixChooser({
  party, newcomer, onConfirm,
}: {
  party: JourneyPokemon[];
  newcomer: JourneyPokemon;
  onConfirm: (keep: JourneyPokemon[], toBox: JourneyPokemon[]) => void;
}) {
  const candidates = [...party, newcomer];
  const newcomerIdx = candidates.length - 1;
  // Starts on the current party, so keeping things as they are is
  // one tap away.
  const [picked, setPicked] = useState<number[]>(party.map((_, i) => i));

  const toggle = (i: number) => {
    setPicked((prev) => {
      if (prev.includes(i)) return prev.filter((x) => x !== i);
      if (prev.length >= PARTY_LIMIT) return prev;
      return [...prev, i];
    });
  };

  const full = picked.length === PARTY_LIMIT;
  const boxed = candidates.filter((_, i) => !picked.includes(i));

  return (
    <div className="ar-overlay">
      <div className="ar-sheet" onClick={(e) => e.stopPropagation()}>
        <p className="ar-pixel text-[10px] text-yellow-300 mb-1">PARTY FULL</p>
        <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
          You caught <span className="text-yellow-300">{newcomer.name}</span>, but you can only
          carry six. Choose which six travel with you — the rest go to the PC and can be collected
          from your party screen later.
        </p>

        <div className="grid grid-cols-2 gap-1.5 mb-3 max-h-[46vh] overflow-y-auto pr-1">
          {candidates.map((p, i) => {
            const isPicked = picked.includes(i);
            const isNew = i === newcomerIdx;
            const blockedByFull = !isPicked && full;
            return (
              <button
                key={i}
                onClick={() => toggle(i)}
                disabled={blockedByFull}
                className={`ar-pick px-2 py-2 flex items-center gap-2 ${isPicked ? 'ar-pick-on' : ''} ${
                  blockedByFull ? 'opacity-35' : ''
                }`}
              >
                <img src={frontSprite(p.pokemonId)} alt={p.name} className="w-10 h-10 object-contain ar-pixelated shrink-0" />
                <div className="min-w-0 text-left flex-1">
                  <span className="block text-[9px] font-black uppercase truncate">{p.name}</span>
                  <span className="block text-[8px] text-slate-500">Lv{p.level} · {p.types.join('/')}</span>
                  {isNew && <span className="block text-[7px] text-yellow-400 uppercase tracking-wider">New</span>}
                </div>
                <span className={`ar-checkbox ${isPicked ? 'ar-checkbox-on' : ''}`}>
                  {isPicked ? '✓' : ''}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] text-slate-500">
            {picked.length}/{PARTY_LIMIT} chosen
          </span>
          <span className="text-[9px] text-slate-500 truncate ml-2">
            {boxed.length > 0 ? `To PC: ${boxed.map((b) => b.name).join(', ')}` : ''}
          </span>
        </div>

        <button
          onClick={() => onConfirm(picked.map((i) => candidates[i]), boxed)}
          disabled={!full}
          className="ar-confirm w-full"
        >
          {full ? 'Confirm Party' : `Choose ${PARTY_LIMIT - picked.length} more`}
        </button>
      </div>
    </div>
  );
}

function Overlay({
  title, onClose, children,
}: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="ar-overlay" onClick={onClose}>
      <div className="ar-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <p className="ar-pixel text-[10px] text-yellow-300">{title}</p>
          <button onClick={onClose} className="ar-tag">Close</button>
        </div>
        <div className="overflow-y-auto max-h-[65vh] pr-1">{children}</div>
      </div>
    </div>
  );
}

function Status({
  title, body, action,
}: { title: string; body: string; action?: { href: string; label: string } }) {
  return (
    <div className="ar-root min-h-screen flex items-center justify-center p-6">
      <div className="ar-panel max-w-sm w-full p-6 text-center">
        <p className="ar-pixel text-[11px] text-yellow-300 mb-3">{title}</p>
        <p className="text-[11px] text-slate-400 mb-5">{body}</p>
        <div className="flex gap-2 justify-center flex-wrap">
          {action && <Link href={action.href} className="ar-btn ar-btn-yellow">{action.label}</Link>}
          <Link href="/journey/kanto/map" className="ar-btn ar-btn-grey">Map</Link>
        </div>
      </div>
      <AreaStyles />
    </div>
  );
}

const QUIET = [
  'Nothing but rustling leaves.',
  'The grass is still.',
  'You walk on. Nothing stirs.',
  'A breeze, and nothing else.',
  'Quiet here.',
];
function randomQuiet() {
  return QUIET[Math.floor(Math.random() * QUIET.length)];
}

function AreaStyles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      :root {
        --ease: cubic-bezier(0.22, 0.61, 0.36, 1);
        --t-fast: 140ms;
        --t-base: 260ms;
        --t-slow: 520ms;
      }
      .ar-pixel { font-family: 'Press Start 2P', monospace; line-height: 1.7; }
      .ar-pixelated { image-rendering: pixelated; }

      .ar-root {
        background: #0b1120;
        background-image:
          linear-gradient(0deg, rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
        background-size: 16px 16px;
        color: #e2e8f0;
        font-family: ui-monospace, monospace;
      }

      .ar-panel {
        background: #0f172a;
        border: 3px solid #334155;
        box-shadow: inset -2px -2px 0 rgba(0,0,0,0.5), inset 2px 2px 0 rgba(255,255,255,0.05);
      }

      .ar-mini, .ar-row, .ar-feed, .ar-service, .ar-trainer {
        background: #020617;
        border: 2px solid #1e293b;
      }
      .ar-row, .ar-service, .ar-trainer {
        transition: border-color var(--t-fast) var(--ease), transform var(--t-fast) var(--ease);
      }
      .ar-service { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 12px 8px; }
      .ar-service:hover, .ar-trainer:hover:not(:disabled) { border-color: #facc15; transform: translateY(-2px); }
      .ar-trainer-done { opacity: 0.5; }
      .ar-trainer:disabled { cursor: not-allowed; }

      .ar-fill { transition: width var(--t-slow) var(--ease); }

      .ar-explore {
        padding: 16px;
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        background: #22c55e;
        color: #052e16;
        border-bottom: 5px solid #15803d;
        transition: filter var(--t-fast) var(--ease), transform var(--t-fast) var(--ease);
      }
      .ar-explore:hover:not(:disabled) { filter: brightness(1.1); }
      .ar-explore:active:not(:disabled) { transform: translateY(4px); border-bottom-width: 1px; }
      .ar-explore:disabled { background: #475569; color: #94a3b8; border-bottom-color: #1e293b; cursor: not-allowed; }

      .ar-side {
        display: block;
        width: 100%;
        padding: 10px;
        font-size: 10px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        background: #1e293b;
        color: #e2e8f0;
        border: 2px solid #334155;
        transition: background var(--t-fast) var(--ease);
      }
      .ar-side:hover { background: #334155; }

      .ar-tag {
        font-size: 8px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 5px 8px;
        border: 1px solid #334155;
        color: #94a3b8;
        background: #0f172a;
      }
      .ar-tag-go { color: #facc15; border-color: #a16207; background: rgba(250,204,21,0.1); }
      .ar-tag-done { color: #4ade80; border-color: #15803d; background: rgba(34,197,94,0.1); }

      /* Lead slot reads differently from the rest of the party. */
      .ar-lead { border-color: #a16207; background: rgba(250,204,21,0.06); }
      .ar-leadtag {
        position: absolute; bottom: -4px; left: 50%;
        transform: translateX(-50%);
        font-size: 6px; font-weight: 900; letter-spacing: 0.1em;
        background: #facc15; color: #1c1917;
        padding: 1px 4px;
      }

      .ar-pick {
        background: #020617;
        border: 2px solid #1e293b;
        transition: border-color var(--t-fast) var(--ease), background var(--t-fast) var(--ease),
                    transform var(--t-fast) var(--ease);
      }
      .ar-pick:hover:not(:disabled) { transform: translateY(-2px); }
      .ar-pick-on { border-color: #facc15; background: rgba(250,204,21,0.08); }

      .ar-checkbox {
        width: 16px; height: 16px; shrink: 0;
        border: 2px solid #334155;
        display: flex; align-items: center; justify-content: center;
        font-size: 10px; font-weight: 900;
        color: #1c1917;
      }
      .ar-checkbox-on { background: #facc15; border-color: #a16207; }

      .ar-confirm {
        padding: 12px;
        font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em;
        background: #facc15; color: #1c1917; border-bottom: 4px solid #a16207;
      }
      .ar-confirm:active:not(:disabled) { transform: translateY(3px); border-bottom-width: 1px; }
      .ar-confirm:disabled {
        background: #475569; color: #94a3b8; border-bottom-color: #1e293b; cursor: not-allowed;
      }

      .ar-log { animation: arLog var(--t-base) var(--ease) both; }
      @keyframes arLog { from { opacity: 0; transform: translateX(-5px); } to { opacity: 1; transform: none; } }

      .ar-overlay {
        position: fixed; inset: 0; z-index: 50;
        background: rgba(2,6,23,0.85);
        display: flex; align-items: center; justify-content: center;
        padding: 16px;
        animation: arFade var(--t-base) var(--ease) both;
      }
      @keyframes arFade { from { opacity: 0; } to { opacity: 1; } }
      .ar-sheet {
        background: #0f172a;
        border: 3px solid #334155;
        padding: 16px;
        width: 100%;
        max-width: 480px;
        animation: arRise var(--t-base) var(--ease) both;
      }
      @keyframes arRise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }

      .ar-toast {
        position: fixed;
        bottom: 20px; left: 50%;
        transform: translateX(-50%);
        z-index: 60;
        background: #facc15;
        color: #1c1917;
        font-size: 10px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 10px 18px;
        border-bottom: 4px solid #a16207;
        animation: arToast 2.2s var(--ease) both;
      }
      @keyframes arToast {
        0% { opacity: 0; transform: translate(-50%, 16px); }
        12%, 85% { opacity: 1; transform: translate(-50%, 0); }
        100% { opacity: 0; transform: translate(-50%, -8px); }
      }

      .ar-btn {
        display: inline-block; padding: 10px 18px;
        font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em;
        border-bottom-width: 4px; border-bottom-style: solid;
      }
      .ar-btn:active { transform: translateY(3px); border-bottom-width: 1px; }
      .ar-btn-yellow { background: #facc15; color: #1c1917; border-bottom-color: #a16207; }
      .ar-btn-grey { background: #475569; color: #fff; border-bottom-color: #1e293b; }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `}</style>
  );
}
