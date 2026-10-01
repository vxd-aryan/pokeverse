// ============================================================
// JOURNEY — POKÉMON CONSTRUCTION
// ============================================================
// Builds a battle-ready Pokémon from a species id and a level.
//
// Base stats come from PokeAPI, but only once per species: the
// results are cached in memory for the session, so a long route
// of Pidgey encounters costs one request, not forty. Moves are
// built locally from the species' types, which keeps a wild
// encounter instant rather than waiting on four move lookups.
// ============================================================

import {
  buildMoveset,
  getEvolutionStage,
  type JourneyPokemon,
} from '../data/kanto';
import { computeHp, computeStat } from './wild';

const POKEAPI = 'https://pokeapi.co/api/v2/pokemon';
const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

export const frontSprite = (id: number) => `${SPRITE_BASE}/${id}.png`;
export const backSprite = (id: number) => `${SPRITE_BASE}/back/${id}.png`;

export interface SpeciesData {
  id: number;
  name: string;
  types: string[];
  base: {
    hp: number;
    attack: number;
    defense: number;
    'special-attack': number;
    'special-defense': number;
    speed: number;
  };
}

// Session cache. Species data never changes, so once is enough.
const speciesCache = new Map<number, SpeciesData>();
const inFlight = new Map<number, Promise<SpeciesData>>();

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function getSpecies(id: number): Promise<SpeciesData> {
  const cached = speciesCache.get(id);
  if (cached) return cached;

  // Collapse duplicate requests for the same species.
  const pending = inFlight.get(id);
  if (pending) return pending;

  const promise = (async () => {
    const res = await fetch(`${POKEAPI}/${id}`);
    if (!res.ok) throw new Error(`PokeAPI returned ${res.status} for #${id}`);
    const data = await res.json();

    const statOf = (n: string) =>
      data.stats.find((s: any) => s.stat.name === n)?.base_stat ?? 50;

    const species: SpeciesData = {
      id,
      name: titleCase(data.name),
      types: data.types.map((t: any) => titleCase(t.type.name)),
      base: {
        hp: statOf('hp'),
        attack: statOf('attack'),
        defense: statOf('defense'),
        'special-attack': statOf('special-attack'),
        'special-defense': statOf('special-defense'),
        speed: statOf('speed'),
      },
    };
    speciesCache.set(id, species);
    inFlight.delete(id);
    return species;
  })();

  inFlight.set(id, promise);
  return promise;
}

/** A fresh Pokémon at the given level, at full health. */
export async function buildPokemon(
  id: number,
  level: number,
  opts: { name?: string; caughtAt?: string } = {}
): Promise<JourneyPokemon> {
  const species = await getSpecies(id);
  const maxHp = computeHp(species.base.hp, level);

  return {
    pokemonId: id,
    name: opts.name ?? species.name,
    level,
    types: species.types,
    stats: {
      attack: computeStat(species.base.attack, level),
      defense: computeStat(species.base.defense, level),
      'special-attack': computeStat(species.base['special-attack'], level),
      'special-defense': computeStat(species.base['special-defense'], level),
      speed: computeStat(species.base.speed, level),
    },
    maxHp,
    currentHp: maxHp,
    moves: buildMoveset(species.types),
    spriteUrl: frontSprite(id),
    frontSpriteUrl: frontSprite(id),
    status: null,
    evolutionStage: getEvolutionStage(id),
    xp: 0,
    caughtAt: opts.caughtAt,
  };
}

/**
 * Recomputes a Pokémon's stats at a new level, keeping its
 * damage, status, nickname and XP. Used on level-up.
 */
export async function relevel(mon: JourneyPokemon, level: number): Promise<JourneyPokemon> {
  const species = await getSpecies(mon.pokemonId);
  const maxHp = computeHp(species.base.hp, level);
  // Healing on level-up would make potions pointless, so damage
  // is preserved proportionally instead.
  const ratio = mon.maxHp > 0 ? mon.currentHp / mon.maxHp : 1;

  return {
    ...mon,
    level,
    maxHp,
    currentHp: mon.currentHp <= 0 ? 0 : Math.max(1, Math.round(maxHp * ratio)),
    stats: {
      attack: computeStat(species.base.attack, level),
      defense: computeStat(species.base.defense, level),
      'special-attack': computeStat(species.base['special-attack'], level),
      'special-defense': computeStat(species.base['special-defense'], level),
      speed: computeStat(species.base.speed, level),
    },
  };
}

/**
 * Turns a Pokémon into its evolved form, keeping level, XP,
 * nickname and proportional damage. New types bring a new moveset.
 */
export async function evolveInto(
  mon: JourneyPokemon,
  newId: number
): Promise<JourneyPokemon> {
  const species = await getSpecies(newId);
  const maxHp = computeHp(species.base.hp, mon.level);
  const ratio = mon.maxHp > 0 ? mon.currentHp / mon.maxHp : 1;

  return {
    ...mon,
    pokemonId: newId,
    // A nicknamed Pokémon keeps its name through evolution.
    name: mon.nickname ? mon.name : species.name,
    types: species.types,
    maxHp,
    currentHp: mon.currentHp <= 0 ? 0 : Math.max(1, Math.round(maxHp * ratio)),
    stats: {
      attack: computeStat(species.base.attack, mon.level),
      defense: computeStat(species.base.defense, mon.level),
      'special-attack': computeStat(species.base['special-attack'], mon.level),
      'special-defense': computeStat(species.base['special-defense'], mon.level),
      speed: computeStat(species.base.speed, mon.level),
    },
    moves: buildMoveset(species.types),
    spriteUrl: frontSprite(newId),
    frontSpriteUrl: frontSprite(newId),
    evolutionStage: getEvolutionStage(newId),
  };
}

/** Warms the cache for species the player is about to meet. */
export function prefetchSpecies(ids: number[]) {
  ids.forEach((id) => {
    if (!speciesCache.has(id) && !inFlight.has(id)) {
      getSpecies(id).catch(() => {
        /* a failed prefetch just means a slower first encounter */
      });
    }
  });
}
