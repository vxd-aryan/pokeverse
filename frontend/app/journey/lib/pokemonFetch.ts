// ============================================================
// JOURNEY POKEMON FETCHER — builds a level-scaled JourneyPokemon
// directly from PokeAPI, since Journey needs arbitrary levels
// (5, 12, 18...) rather than the Arena's fixed level 50.
// ============================================================

import type { JourneyPokemon, JourneyMove } from '../data/kanto';

function calcStatAtLevel(base: number, level: number): number {
  const iv = 31;
  const ev = 84;
  return Math.floor(0.01 * (2 * base + iv + Math.floor(0.25 * ev)) * level) + 5;
}

function calcMaxHpAtLevel(base: number, level: number): number {
  if (base <= 1) return 1;
  const iv = 31;
  const ev = 84;
  return Math.floor(0.01 * (2 * base + iv + Math.floor(0.25 * ev)) * level) + level + 10;
}

const moveDetailCache: Record<string, JourneyMove | null> = {};

async function fetchMoveDetail(moveName: string): Promise<JourneyMove | null> {
  if (moveName in moveDetailCache) return moveDetailCache[moveName];
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/move/${moveName}`);
    const data = await res.json();
    const power = data.power;
    if (!power) {
      moveDetailCache[moveName] = null;
      return null;
    }
    const detail: JourneyMove = {
      move_key: moveName,
      name: data.name.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      type: data.type.name.replace(/\b\w/g, (c: string) => c.toUpperCase()),
      power,
      damage_class: data.damage_class?.name || 'physical',
    };
    moveDetailCache[moveName] = detail;
    return detail;
  } catch {
    moveDetailCache[moveName] = null;
    return null;
  }
}

export interface KantoSpeciesLookup {
  id: number;
  name: string;
}

export async function fetchJourneyPokemon(pokemonId: number, level: number): Promise<JourneyPokemon> {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
  const data = await res.json();

  const baseStats: Record<string, number> = {};
  data.stats.forEach((s: any) => {
    baseStats[s.stat.name] = s.base_stat;
  });

  const types = data.types.map((t: any) => t.type.name.replace(/\b\w/g, (c: string) => c.toUpperCase()));

  const stats = {
    attack: calcStatAtLevel(baseStats.attack || 80, level),
    defense: calcStatAtLevel(baseStats.defense || 80, level),
    'special-attack': calcStatAtLevel(baseStats['special-attack'] || 80, level),
    'special-defense': calcStatAtLevel(baseStats['special-defense'] || 80, level),
    speed: calcStatAtLevel(baseStats.speed || 80, level),
  };
  const maxHp = calcMaxHpAtLevel(baseStats.hp || 80, level);

  // Pick up to 4 real damaging moves, shuffled so repeated fetches at
  // higher levels don't always land on the exact same set.
  const candidateNames: string[] = data.moves.map((m: any) => m.move.name);
  const shuffled = [...candidateNames].sort(() => Math.random() - 0.5).slice(0, 25);

  const results = await Promise.all(shuffled.map((name) => fetchMoveDetail(name)));
  const moves = results.filter((m): m is JourneyMove => m !== null).slice(0, 4);

  // Guarantee at least one move even if fetching failed for everything.
  if (moves.length === 0) {
    moves.push({ move_key: 'tackle', name: 'Tackle', type: 'Normal', power: 40, damage_class: 'physical' });
  }

  const spriteUrl =
    data.sprites?.other?.['official-artwork']?.front_default ||
    data.sprites?.front_default ||
    '';

  return {
    pokemonId,
    name: data.name.replace(/\b\w/g, (c: string) => c.toUpperCase()),
    level,
    types,
    stats,
    maxHp,
    currentHp: maxHp,
    moves,
    spriteUrl,
  };
}

// Re-scales an existing JourneyPokemon to a new level (used after a gym
// win), keeping the same species/moves but recalculating stats/HP - moves
// are also refreshed since a higher level may open up stronger options.
export async function relevelJourneyPokemon(mon: JourneyPokemon, newLevel: number): Promise<JourneyPokemon> {
  const fresh = await fetchJourneyPokemon(mon.pokemonId, newLevel);
  // Preserve current HP as a proportion of the old max, so a mon that was
  // damaged going into level-up doesn't suddenly show full HP.
  const hpFraction = mon.maxHp > 0 ? mon.currentHp / mon.maxHp : 1;
  fresh.currentHp = Math.max(1, Math.round(fresh.maxHp * hpFraction));
  return fresh;
}