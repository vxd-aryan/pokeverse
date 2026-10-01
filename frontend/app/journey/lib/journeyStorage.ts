// ============================================================
// JOURNEY — SAVE FILE (v2)
// ============================================================
// A ROM-shaped save: one starter, a party of up to six, a box
// for everything else you catch, a bag, money, badges and where
// you currently are.
//
// Saves below the current version are discarded rather than
// migrated: each bump so far changed the shape too deeply to
// translate (v1 had no starter or bag; v2 named challenges
// "gyms" and assumed Kanto). A fresh start is honest about that.
// ============================================================

import type { JourneyPokemon, Challenge } from '../data/types';
import { STARTING_BAG, STARTING_MONEY, MAX_PER_ITEM } from '../data/items';

export const SAVE_VERSION = 3;
const STORAGE_KEY = 'pokeverse_journey_state';

export const PARTY_LIMIT = 6;
/** Keeps the box bounded so the save stays small. */
export const BOX_LIMIT = 30;

export interface RegionStats {
  wildBattles: number;
  trainerBattles: number;
  challengeBattles: number;
  battlesLost: number;
  pokemonCaught: number;
  stepsTaken: number;
  startedAt: string | null;
  completedAt: string | null;
}

export interface JourneyRegionState {
  /** National Dex id of the starter chosen from Oak. */
  starterId: number | null;
  party: JourneyPokemon[];
  box: JourneyPokemon[];
  bag: Record<string, number>;
  money: number;
  /** Where the player is standing on the Kanto map. */
  currentNode: string;
  /** Areas the player has set foot in — gates fast travel. */
  visitedNodes: string[];
  clearedChallenges: string[];
  defeatedTrainers: string[];
  /** Dex progress: species seen in battle, and species owned. */
  seen: number[];
  caught: number[];
  regionComplete: boolean;
  stats: RegionStats;
}

export interface JourneyState {
  version: number;
  regions: Record<string, JourneyRegionState>;
  currentRegion: string | null;
}

// --- Construction ------------------------------------------

function emptyStats(): RegionStats {
  return {
    wildBattles: 0,
    trainerBattles: 0,
    challengeBattles: 0,
    battlesLost: 0,
    pokemonCaught: 0,
    stepsTaken: 0,
    startedAt: null,
    completedAt: null,
  };
}

export function emptyRegionState(startNode = ''): JourneyRegionState {
  return {
    starterId: null,
    party: [],
    box: [],
    bag: { ...STARTING_BAG },
    money: STARTING_MONEY,
    currentNode: startNode,
    visitedNodes: startNode ? [startNode] : [],
    clearedChallenges: [],
    defeatedTrainers: [],
    seen: [],
    caught: [],
    regionComplete: false,
    stats: emptyStats(),
  };
}

// --- Raw IO ------------------------------------------------

function readAll(): Record<string, JourneyState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, JourneyState>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('[journey] could not save progress:', err);
  }
}

export function getJourneyState(username: string): JourneyState {
  const all = readAll();
  const existing = all[username] as any;

  // Anything older than v2 predates starters, bags and catching.
  // There is nothing meaningful to carry across, so it goes.
  if (!existing || existing.version !== SAVE_VERSION) {
    if (existing) {
      console.info('[journey] old save discarded — starting a fresh Journey.');
    }
    const fresh: JourneyState = { version: SAVE_VERSION, regions: {}, currentRegion: null };
    all[username] = fresh;
    writeAll(all);
    return fresh;
  }
  return existing as JourneyState;
}

export function getRegionState(
  username: string,
  regionId: string,
  startNode = ''
): JourneyRegionState {
  const state = getJourneyState(username);
  if (!state.regions[regionId]) {
    state.regions[regionId] = emptyRegionState(startNode);
  }
  const r = state.regions[regionId];

  // Defensive defaults — a save hand-edited or half-written
  // shouldn't take the whole page down.
  if (!Array.isArray(r.party)) r.party = [];
  if (!Array.isArray(r.box)) r.box = [];
  if (!r.bag || typeof r.bag !== 'object') r.bag = { ...STARTING_BAG };
  if (typeof r.money !== 'number') r.money = STARTING_MONEY;
  if (!Array.isArray(r.visitedNodes)) r.visitedNodes = startNode ? [startNode] : [];
  if (!Array.isArray(r.clearedChallenges)) r.clearedChallenges = [];
  if (!Array.isArray(r.defeatedTrainers)) r.defeatedTrainers = [];
  if (!Array.isArray(r.seen)) r.seen = [];
  if (!Array.isArray(r.caught)) r.caught = [];
  if (!r.currentNode) r.currentNode = startNode;
  if (!r.stats) r.stats = emptyStats();

  return r;
}

export function saveRegionState(username: string, regionId: string, region: JourneyRegionState) {
  const all = readAll();
  if (!all[username] || all[username].version !== SAVE_VERSION) {
    all[username] = { version: SAVE_VERSION, regions: {}, currentRegion: null };
  }
  all[username].regions[regionId] = region;
  all[username].currentRegion = regionId;
  writeAll(all);
}

/** Read, change, write — the shape most callers want. */
export function updateRegion(
  username: string,
  regionId: string,
  mutate: (region: JourneyRegionState) => void
): JourneyRegionState {
  const region = getRegionState(username, regionId);
  mutate(region);
  saveRegionState(username, regionId, region);
  return region;
}

// --- Starter -----------------------------------------------

export function setStarter(username: string, regionId: string, starter: JourneyPokemon) {
  return updateRegion(username, regionId, (r) => {
    r.starterId = starter.pokemonId;
    r.party = [starter];
    r.seen = Array.from(new Set([...r.seen, starter.pokemonId]));
    r.caught = Array.from(new Set([...r.caught, starter.pokemonId]));
    r.stats.startedAt = new Date().toISOString();
  });
}

export function hasStarted(region: JourneyRegionState): boolean {
  return region.starterId !== null && region.party.length > 0;
}

// --- Party & box -------------------------------------------

export function setParty(username: string, regionId: string, party: JourneyPokemon[]) {
  return updateRegion(username, regionId, (r) => {
    r.party = party.slice(0, PARTY_LIMIT);
  });
}

/**
 * Adds a caught Pokémon to the party, or to the box when the
 * party is full. Returns where it landed so the UI can say so.
 */
export function addCaught(
  username: string,
  regionId: string,
  mon: JourneyPokemon
): 'party' | 'box' | 'released' {
  let destination: 'party' | 'box' | 'released' = 'party';
  updateRegion(username, regionId, (r) => {
    if (r.party.length < PARTY_LIMIT) {
      r.party.push(mon);
      destination = 'party';
    } else if (r.box.length < BOX_LIMIT) {
      r.box.push(mon);
      destination = 'box';
    } else {
      destination = 'released';
    }
    r.seen = Array.from(new Set([...r.seen, mon.pokemonId]));
    r.caught = Array.from(new Set([...r.caught, mon.pokemonId]));
    r.stats.pokemonCaught += 1;
  });
  return destination;
}

/**
 * Moves a party member to the front. Slot one is the Pokémon that
 * leads every battle, so this is how the player picks their lead.
 */
export function setLead(username: string, regionId: string, index: number) {
  return updateRegion(username, regionId, (r) => {
    if (index <= 0 || !r.party[index]) return;
    const [mon] = r.party.splice(index, 1);
    r.party.unshift(mon);
  });
}

/** Reorders the party to the given sequence of current indices. */
export function reorderParty(username: string, regionId: string, order: number[]) {
  return updateRegion(username, regionId, (r) => {
    const next = order.map((i) => r.party[i]).filter(Boolean);
    if (next.length === r.party.length) r.party = next;
  });
}

/**
 * Commits a chosen party after a full-party catch: the six kept
 * become the party, everyone else goes to the PC.
 */
export function commitParty(
  username: string,
  regionId: string,
  keep: JourneyPokemon[],
  toBox: JourneyPokemon[]
) {
  return updateRegion(username, regionId, (r) => {
    r.party = keep.slice(0, PARTY_LIMIT);
    for (const mon of toBox) {
      if (r.box.length < BOX_LIMIT) r.box.push(mon);
    }
  });
}

/** Records a catch without deciding where it goes — the UI will. */
export function registerCatch(username: string, regionId: string, mon: JourneyPokemon) {
  return updateRegion(username, regionId, (r) => {
    if (!r.seen.includes(mon.pokemonId)) r.seen.push(mon.pokemonId);
    if (!r.caught.includes(mon.pokemonId)) r.caught.push(mon.pokemonId);
    r.stats.pokemonCaught += 1;
  });
}

/** Swap a party member with one in the box. */
export function swapPartyAndBox(
  username: string,
  regionId: string,
  partyIndex: number,
  boxIndex: number
) {
  return updateRegion(username, regionId, (r) => {
    if (!r.party[partyIndex] || !r.box[boxIndex]) return;
    const temp = r.party[partyIndex];
    r.party[partyIndex] = r.box[boxIndex];
    r.box[boxIndex] = temp;
  });
}

export function moveBoxToParty(username: string, regionId: string, boxIndex: number) {
  return updateRegion(username, regionId, (r) => {
    if (!r.box[boxIndex] || r.party.length >= PARTY_LIMIT) return;
    r.party.push(r.box.splice(boxIndex, 1)[0]);
  });
}

export function movePartyToBox(username: string, regionId: string, partyIndex: number) {
  return updateRegion(username, regionId, (r) => {
    // Never let the party empty out — there'd be nothing to battle with.
    if (r.party.length <= 1 || !r.party[partyIndex]) return;
    if (r.box.length >= BOX_LIMIT) return;
    r.box.push(r.party.splice(partyIndex, 1)[0]);
  });
}

export function markSeen(username: string, regionId: string, pokemonId: number) {
  return updateRegion(username, regionId, (r) => {
    if (!r.seen.includes(pokemonId)) r.seen.push(pokemonId);
  });
}

/** Full restore for the whole party — the Pokémon Center. */
export function healParty(username: string, regionId: string) {
  return updateRegion(username, regionId, (r) => {
    r.party = r.party.map((p) => ({ ...p, currentHp: p.maxHp, status: null }));
  });
}

export function partyIsWiped(region: JourneyRegionState): boolean {
  return region.party.length > 0 && region.party.every((p) => p.currentHp <= 0);
}

// --- Bag & money -------------------------------------------

/**
 * Replaces the whole bag — used after a battle, where the battle
 * scene owned the bag for its duration and hands back what's left.
 * Note that getRegionState returns a FRESH object parsed from
 * storage, so mutating one of those does nothing; changes have to
 * go through a writer like this.
 */
export function setBag(username: string, regionId: string, bag: Record<string, number>) {
  return updateRegion(username, regionId, (r) => {
    r.bag = { ...bag };
  });
}

/** Merges newly-encountered species into the dex. */
export function addSeen(username: string, regionId: string, ids: number[]) {
  return updateRegion(username, regionId, (r) => {
    for (const id of ids) {
      if (!r.seen.includes(id)) r.seen.push(id);
    }
  });
}

export function addItem(username: string, regionId: string, itemId: string, qty = 1) {
  return updateRegion(username, regionId, (r) => {
    r.bag[itemId] = Math.min(MAX_PER_ITEM, (r.bag[itemId] || 0) + qty);
  });
}

export function consumeItem(username: string, regionId: string, itemId: string, qty = 1) {
  return updateRegion(username, regionId, (r) => {
    const left = (r.bag[itemId] || 0) - qty;
    if (left > 0) r.bag[itemId] = left;
    else delete r.bag[itemId];
  });
}

export function hasItem(region: JourneyRegionState, itemId: string): boolean {
  return (region.bag[itemId] || 0) > 0;
}

export function addMoney(username: string, regionId: string, amount: number) {
  return updateRegion(username, regionId, (r) => {
    r.money = Math.max(0, r.money + amount);
  });
}

/** Buying returns false when they can't afford it or the bag is full. */
export function buyItem(
  username: string,
  regionId: string,
  itemId: string,
  price: number,
  qty = 1
): boolean {
  const region = getRegionState(username, regionId);
  const cost = price * qty;
  if (region.money < cost) return false;
  if ((region.bag[itemId] || 0) + qty > MAX_PER_ITEM) return false;
  updateRegion(username, regionId, (r) => {
    r.money -= cost;
    r.bag[itemId] = (r.bag[itemId] || 0) + qty;
  });
  return true;
}

/** Losing a battle costs money, as in the real games. */
export function payoutOnLoss(
  username: string,
  regionId: string,
  townIds: string[]
): number {
  const region = getRegionState(username, regionId);
  const lost = Math.floor(region.money * 0.25);
  updateRegion(username, regionId, (r) => {
    r.money -= lost;
    r.stats.battlesLost += 1;
    r.party = r.party.map((p) => ({ ...p, currentHp: p.maxHp, status: null }));
    // Blacking out sends you back to the last town you were in.
    r.currentNode = lastTownVisited(r, townIds);
  });
  return lost;
}

/**
 * Blacking out sends the player to the last town they set foot
 * in. The caller passes the region's town ids, so this stays
 * region-neutral.
 */
function lastTownVisited(r: JourneyRegionState, townIds: string[]): string {
  for (let i = r.visitedNodes.length - 1; i >= 0; i--) {
    if (townIds.includes(r.visitedNodes[i])) return r.visitedNodes[i];
  }
  return townIds[0] ?? r.visitedNodes[0] ?? '';
}

// --- Travel ------------------------------------------------

export function travelTo(username: string, regionId: string, nodeId: string) {
  return updateRegion(username, regionId, (r) => {
    r.currentNode = nodeId;
    if (!r.visitedNodes.includes(nodeId)) r.visitedNodes.push(nodeId);
  });
}

export function countStep(username: string, regionId: string) {
  return updateRegion(username, regionId, (r) => {
    r.stats.stepsTaken += 1;
  });
}

// --- Battles -----------------------------------------------

export function markChallengeComplete(username: string, regionId: string, challengeId: string) {
  return updateRegion(username, regionId, (r) => {
    if (!r.clearedChallenges.includes(challengeId)) r.clearedChallenges.push(challengeId);
    r.stats.challengeBattles += 1;
    r.party = r.party.map((p) => ({ ...p, currentHp: p.maxHp, status: null }));
  });
}

export function markTrainerDefeated(username: string, regionId: string, trainerId: string) {
  return updateRegion(username, regionId, (r) => {
    if (!r.defeatedTrainers.includes(trainerId)) r.defeatedTrainers.push(trainerId);
    r.stats.trainerBattles += 1;
  });
}

export function isTrainerDefeated(region: JourneyRegionState, trainerId: string): boolean {
  return region.defeatedTrainers.includes(trainerId);
}

export function countWildBattle(username: string, regionId: string) {
  return updateRegion(username, regionId, (r) => {
    r.stats.wildBattles += 1;
  });
}

export function markRegionComplete(username: string, regionId: string) {
  return updateRegion(username, regionId, (r) => {
    r.regionComplete = true;
    r.stats.completedAt = new Date().toISOString();
  });
}

export function resetRegion(username: string, regionId: string) {
  saveRegionState(username, regionId, emptyRegionState());
}

// --- Progress helpers --------------------------------------

export interface JourneyObjective {
  kind: 'pick-starter' | 'defeat-challenge' | 'region-complete';
  text: string;
  challengeId?: string;
}

export function getNextObjective(
  region: JourneyRegionState,
  challenges: { id: string; name: string; venue: string }[]
): JourneyObjective {
  if (!hasStarted(region)) {
    return { kind: 'pick-starter', text: 'Choose your first partner from Professor Oak' };
  }
  const next = challenges.find((g) => !region.clearedChallenges.includes(g.id));
  if (!next) return { kind: 'region-complete', text: 'All badges earned — region complete!' };
  return { kind: 'defeat-challenge', text: `Defeat ${next.name}`, challengeId: next.id };
}

export function isChallengeAvailable(
  region: JourneyRegionState,
  challenges: { id: string; order: number }[],
  challengeId: string
): boolean {
  const challenge = challenges.find((g) => g.id === challengeId);
  if (!challenge) return false;
  if (region.clearedChallenges.includes(challengeId)) return false;
  return challenges.filter((g) => g.order < challenge.order).every((g) => region.clearedChallenges.includes(g.id));
}

export type ChallengeUiState = 'locked' | 'available' | 'in-progress' | 'completed';

export function getChallengeUiState(
  region: JourneyRegionState,
  challenges: { id: string; order: number }[],
  challengeId: string
): ChallengeUiState {
  if (region.clearedChallenges.includes(challengeId)) return 'completed';
  if (!isChallengeAvailable(region, challenges, challengeId)) return 'locked';
  const damaged = region.party.some((p) => p.currentHp < p.maxHp);
  return damaged ? 'in-progress' : 'available';
}

// --- Regions -----------------------------------------------

/**
 * A region opens once the previous one is complete. The caller
 * supplies the previous region's id so this file doesn't need to
 * know the registry.
 */
export function isRegionUnlocked(
  username: string,
  previousRegionId: string | null
): boolean {
  if (!previousRegionId) return true;
  return getRegionState(username, previousRegionId).regionComplete;
}
