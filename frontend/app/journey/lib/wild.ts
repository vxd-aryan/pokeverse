// ============================================================
// JOURNEY — WILD ENCOUNTERS, CATCHING AND EXPERIENCE
// ============================================================
// The rules that turn exploring into progress: what a step turns
// up, whether a thrown ball holds, and how a Pokémon levels.
//
// Pure functions where possible, so the pages stay about UI.
// ============================================================

import type { AreaEncounters, JourneyPokemon, WildSlot } from '../data/types';
import { getEvolutionStage, resolveEvolution } from '../data/evolution';
import { getItem } from '../data/items';

// --- Encounter rolls ----------------------------------------

/** Picks one wild slot using the rarity weights. */
export function rollWildSlot(area: AreaEncounters, rng = Math.random): WildSlot | null {
  if (!area.slots.length) return null;
  const total = area.slots.reduce((s, x) => s + x.weight, 0);
  let roll = rng() * total;
  for (const slot of area.slots) {
    roll -= slot.weight;
    if (roll <= 0) return slot;
  }
  return area.slots[area.slots.length - 1];
}

export function rollLevel(slot: WildSlot, rng = Math.random): number {
  return slot.minLevel + Math.floor(rng() * (slot.maxLevel - slot.minLevel + 1));
}

/** Chance per step of finding an item rather than a Pokémon. */
export const ITEM_FIND_CHANCE = 0.08;

/** Rough catch rate by how far evolved a species is. */
export function catchRateFor(evolutionStage: number): number {
  if (evolutionStage >= 3) return 45;
  if (evolutionStage === 2) return 90;
  return 190;
}

// --- Stepping ----------------------------------------------

export type StepResult =
  | { kind: 'nothing' }
  | { kind: 'wild'; slot: WildSlot; level: number }
  | { kind: 'item'; itemId: string };

/**
 * One step through an area. Item finds are checked first and are
 * rarer, so a step is usually either a Pokémon or quiet grass.
 */
export function takeStep(area: AreaEncounters | undefined, rng = Math.random): StepResult {
  if (!area) return { kind: 'nothing' };

  if (area.itemFinds?.length && rng() < ITEM_FIND_CHANCE) {
    const itemId = area.itemFinds[Math.floor(rng() * area.itemFinds.length)];
    if (getItem(itemId)) return { kind: 'item', itemId };
  }

  if (rng() < area.encounterRate) {
    const slot = rollWildSlot(area, rng);
    if (slot) return { kind: 'wild', slot, level: rollLevel(slot, rng) };
  }

  return { kind: 'nothing' };
}

// --- Catching ----------------------------------------------

/** Status conditions make a Pokémon easier to catch. */
function statusBonus(status: string | null | undefined): number {
  if (status === 'sleep' || status === 'freeze') return 2.0;
  if (status === 'paralysis' || status === 'poison' || status === 'burn') return 1.5;
  return 1;
}

export interface CatchAttempt {
  caught: boolean;
  /** 0-3 wobbles before breaking out, 4 means it held. */
  shakes: number;
  /** Rough odds, for showing the player how close they are. */
  chance: number;
}

/**
 * Simplified Gen-III capture maths. The shape is the real one —
 * low HP, status and better balls all help — without reproducing
 * every constant.
 */
export function attemptCatch(
  target: JourneyPokemon,
  ballId: string,
  rng = Math.random
): CatchAttempt {
  const ball = getItem(ballId);
  const ballBonus = ball?.catchBonus ?? 1;
  const stage = target.evolutionStage ?? getEvolutionStage(target.pokemonId);
  const speciesRate = catchRateFor(stage);

  const maxHp = Math.max(1, target.maxHp);
  const hp = Math.max(1, target.currentHp);

  // a = ((3*max - 2*current) * rate * ball) / (3*max), then status.
  const a =
    (((3 * maxHp - 2 * hp) * speciesRate * ballBonus) / (3 * maxHp)) *
    statusBonus(target.status);

  // Higher-level targets resist a little, so a level-30 Tentacool
  // isn't as easy as a level-5 Pidgey with the same species rate.
  const levelResist = Math.max(0.45, 1 - (target.level - 5) * 0.012);
  const effective = a * levelResist;

  if (effective >= 255) return { caught: true, shakes: 4, chance: 1 };

  const b = 65536 / Math.pow(255 / Math.max(1, effective), 0.1875);
  const chance = Math.min(1, Math.pow(b / 65536, 4));

  let shakes = 0;
  for (let i = 0; i < 4; i++) {
    if (rng() * 65536 < b) shakes++;
    else break;
  }
  return { caught: shakes === 4, shakes, chance };
}

// --- Experience --------------------------------------------
// A compact curve rather than the real growth groups: a flat
// cubic would make early levels crawl and late levels stall, and
// nothing here needs cross-game accuracy. Each Pokémon tracks xp
// toward its next level, not a lifetime total.

export function xpToNextLevel(level: number): number {
  return 24 + level * 14;
}

/** XP awarded for beating one opponent. */
export function xpFromDefeat(
  opponentLevel: number,
  kind: 'wild' | 'trainer' | 'gym'
): number {
  const multiplier = kind === 'gym' ? 22 : kind === 'trainer' ? 16 : 10;
  return Math.max(1, Math.round(opponentLevel * multiplier * 0.35));
}

export interface GrowthResult {
  /** The Pokémon after levelling, before any stat refetch. */
  mon: JourneyPokemon;
  levelsGained: number;
  newLevel: number;
  /** Species it should become, if it evolved along the way. */
  evolvedInto: number | null;
}

/**
 * Applies XP and rolls levels forward. Stat recalculation is the
 * caller's job — it needs a network fetch, and this stays pure.
 */
export function applyXp(mon: JourneyPokemon, gained: number, levelCap = 100): GrowthResult {
  let level = mon.level;
  let xp = (mon.xp ?? 0) + gained;
  let levelsGained = 0;

  while (level < levelCap && xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level++;
    levelsGained++;
  }

  const { id: evolvedId, evolved } = resolveEvolution(mon.pokemonId, level);

  return {
    mon: { ...mon, level, xp },
    levelsGained,
    newLevel: level,
    evolvedInto: evolved ? evolvedId : null,
  };
}

/** How far through the current level a Pokémon is, 0-1. */
export function xpProgress(mon: JourneyPokemon): number {
  const need = xpToNextLevel(mon.level);
  return Math.max(0, Math.min(1, (mon.xp ?? 0) / need));
}

// --- Wild Pokémon construction -----------------------------

/** Standard HP formula, 31 IVs, no EVs. */
export function computeHp(baseHp: number, level: number): number {
  return Math.floor(((2 * baseHp + 31) * level) / 100) + level + 10;
}

/** Non-HP stat formula, matching the HP one's assumptions. */
export function computeStat(base: number, level: number): number {
  return Math.floor(((2 * base + 31) * level) / 100) + 5;
}
