// ============================================================
// JOURNEY — BATTLE ENGINE
// ============================================================
// The single source of truth for damage, type effectiveness,
// turn order, critical hits, status conditions and fainting.
// Everything that fights — wild Pokémon, route trainers, gym
// leaders — resolves through here.
//
// Two entry points:
//   executeMove()         one Pokémon attacks once
//   resolveJourneyTurn()  a full turn: both sides act in speed
//                         order, then end-of-turn status ticks
//
// Mutates the Pokémon objects it's given, so callers should pass
// copies they intend to keep.
// ============================================================

import type { JourneyMove, JourneyPokemon, StatusCondition } from '../data/kanto';

// --- Type chart ---------------------------------------------
// Attacker type -> defender type -> multiplier. Anything absent
// is 1x, so only the interesting matchups are listed.

type Chart = Record<string, Record<string, number>>;

export const TYPE_CHART: Chart = {
  Normal:   { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire:     { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
  Water:    { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Grass:    { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
  Ice:      { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
  Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: 0.5 },
  Poison:   { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
  Ground:   { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
  Flying:   { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic:  { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug:      { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5, Fairy: 0.5 },
  Rock:     { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost:    { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Dragon:   { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark:     { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
  Steel:    { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
  Fairy:    { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 },
};

export function typeEffectiveness(moveType: string, defenderTypes: string[]): number {
  const row = TYPE_CHART[moveType];
  if (!row) return 1;
  return defenderTypes.reduce((mult, t) => mult * (row[t] ?? 1), 1);
}

// --- Tuning --------------------------------------------------

const CRIT_CHANCE = 1 / 16;
const CRIT_MULTIPLIER = 1.5;
const STAB = 1.5;
/** Moves land reliably; weak moves always land. */
const ACCURACY = 0.95;

/** Chance a damaging move of this type also inflicts its status. */
const STATUS_CHANCE: Record<string, { status: StatusCondition; chance: number }> = {
  Fire:     { status: 'burn', chance: 0.1 },
  Electric: { status: 'paralysis', chance: 0.1 },
  Poison:   { status: 'poison', chance: 0.15 },
  Ice:      { status: 'freeze', chance: 0.07 },
  Psychic:  { status: 'sleep', chance: 0.07 },
};

/** Types that can't catch a given status. */
const STATUS_IMMUNE: Record<string, string[]> = {
  burn: ['Fire'],
  poison: ['Poison', 'Steel'],
  paralysis: ['Electric', 'Ground'],
  freeze: ['Ice'],
  sleep: [],
};

// --- Results -------------------------------------------------

export interface MoveResult {
  logs: string[];
  damage: number;
  critical: boolean;
  effectiveness: number;
  missed: boolean;
  /** The Pokémon being attacked dropped to 0 HP. */
  defenderFainted: boolean;
  /** The attacker dropped to 0 HP — from burn or poison this turn. */
  attackerFainted: boolean;
}

export interface TurnResult {
  logs: string[];
  playerFainted: boolean;
  opponentFainted: boolean;
}

// --- Core ----------------------------------------------------

function damageRoll(
  attacker: JourneyPokemon,
  move: JourneyMove,
  defender: JourneyPokemon,
  critical: boolean,
  rng: () => number
): number {
  const special = move.damage_class === 'special';
  let atk = special ? attacker.stats['special-attack'] : attacker.stats.attack;
  const def = special ? defender.stats['special-defense'] : defender.stats.defense;

  // A burn halves physical output — the main reason burn matters.
  if (attacker.status === 'burn' && !special) atk = Math.floor(atk / 2);

  const base =
    Math.floor(
      (((2 * attacker.level) / 5 + 2) * move.power * (atk / Math.max(1, def))) / 50
    ) + 2;

  const stab = attacker.types.includes(move.type) ? STAB : 1;
  const eff = typeEffectiveness(move.type, defender.types);
  const crit = critical ? CRIT_MULTIPLIER : 1;
  const spread = 0.85 + rng() * 0.15;

  return Math.max(1, Math.floor(base * stab * eff * crit * spread));
}

function effectivenessLine(eff: number, name: string): string | null {
  if (eff === 0) return `It doesn't affect ${name}...`;
  if (eff >= 2) return "It's super effective!";
  if (eff > 0 && eff < 1) return "It's not very effective...";
  return null;
}

/**
 * Can this Pokémon act? Handles sleep, freeze and paralysis,
 * including waking and thawing. Returns a line to show when the
 * answer is no.
 */
function checkCanAct(mon: JourneyPokemon, rng: () => number): string | null {
  if (mon.status === 'sleep') {
    const left = (mon.statusTurns ?? 1) - 1;
    if (left <= 0) {
      mon.status = null;
      mon.statusTurns = undefined;
      return `${mon.name} woke up!`;
    }
    mon.statusTurns = left;
    return `${mon.name} is fast asleep.`;
  }
  if (mon.status === 'freeze') {
    if (rng() < 0.2) {
      mon.status = null;
      mon.statusTurns = undefined;
      return `${mon.name} thawed out!`;
    }
    return `${mon.name} is frozen solid!`;
  }
  if (mon.status === 'paralysis' && rng() < 0.25) {
    return `${mon.name} is paralysed! It can't move!`;
  }
  return null;
}

/** One attack, start to finish. */
export function executeMove(
  attacker: JourneyPokemon,
  move: JourneyMove,
  defender: JourneyPokemon,
  rng: () => number = Math.random
): MoveResult {
  const logs: string[] = [];
  const result: MoveResult = {
    logs, damage: 0, critical: false, effectiveness: 1,
    missed: false, defenderFainted: false, attackerFainted: false,
  };

  // Blocked by its own status?
  const blocked = checkCanAct(attacker, rng);
  if (blocked) {
    logs.push(blocked);
    // Waking or thawing still costs the turn.
    if (blocked.includes('woke up') || blocked.includes('thawed')) {
      logs.push(`${attacker.name} is ready to move.`);
    }
    return result;
  }

  logs.push(`${attacker.name} used ${move.name}!`);

  const accuracy = move.power <= 40 ? 1 : ACCURACY;
  if (rng() > accuracy) {
    logs.push(`${attacker.name}'s attack missed!`);
    result.missed = true;
    return result;
  }

  const eff = typeEffectiveness(move.type, defender.types);
  result.effectiveness = eff;

  if (eff === 0) {
    logs.push(`It doesn't affect ${defender.name}...`);
    return result;
  }

  const critical = rng() < CRIT_CHANCE;
  const dmg = damageRoll(attacker, move, defender, critical, rng);

  defender.currentHp = Math.max(0, defender.currentHp - dmg);
  result.damage = dmg;
  result.critical = critical;

  if (critical) logs.push('A critical hit!');
  const line = effectivenessLine(eff, defender.name);
  if (line) logs.push(line);

  // Status chance, only on a landed hit against a healthy target.
  const chance = STATUS_CHANCE[move.type];
  if (
    chance &&
    chance.status &&
    !defender.status &&
    defender.currentHp > 0 &&
    !(STATUS_IMMUNE[chance.status] ?? []).some((t) => defender.types.includes(t)) &&
    rng() < chance.chance
  ) {
    defender.status = chance.status;
    if (chance.status === 'sleep') defender.statusTurns = 1 + Math.floor(rng() * 3);
    logs.push(statusLine(defender.name, chance.status));
  }

  if (defender.currentHp <= 0) result.defenderFainted = true;
  return result;
}

function statusLine(name: string, status: StatusCondition): string {
  switch (status) {
    case 'burn': return `${name} was burned!`;
    case 'poison': return `${name} was poisoned!`;
    case 'paralysis': return `${name} is paralysed! It may be unable to move!`;
    case 'freeze': return `${name} was frozen solid!`;
    case 'sleep': return `${name} fell asleep!`;
    default: return '';
  }
}

/** End-of-turn chip damage from burn and poison. */
function tickStatus(mon: JourneyPokemon): string[] {
  const logs: string[] = [];
  if (mon.currentHp <= 0) return logs;
  if (mon.status === 'burn') {
    const dmg = Math.max(1, Math.floor(mon.maxHp / 16));
    mon.currentHp = Math.max(0, mon.currentHp - dmg);
    logs.push(`${mon.name} is hurt by its burn!`);
  } else if (mon.status === 'poison') {
    const dmg = Math.max(1, Math.floor(mon.maxHp / 8));
    mon.currentHp = Math.max(0, mon.currentHp - dmg);
    logs.push(`${mon.name} is hurt by poison!`);
  }
  return logs;
}

/** Paralysis quarters speed, which can flip the turn order. */
function effectiveSpeed(mon: JourneyPokemon): number {
  const base = mon.stats.speed;
  return mon.status === 'paralysis' ? Math.floor(base / 4) : base;
}

/**
 * Picks the opponent's move. Type-aware: it favours whatever
 * would hurt most, but not every time, so it stays beatable.
 */
export function chooseOpponentMove(
  attacker: JourneyPokemon,
  defender: JourneyPokemon,
  rng: () => number = Math.random
): JourneyMove {
  const moves = attacker.moves.slice(0, 4);
  if (moves.length === 0) {
    return { move_key: 'struggle', name: 'Struggle', type: 'Normal', power: 50, damage_class: 'physical' };
  }
  // A quarter of the time it just picks something, which keeps
  // fights from feeling scripted.
  if (rng() < 0.25) return moves[Math.floor(rng() * moves.length)];

  let best = moves[0];
  let bestScore = -1;
  for (const m of moves) {
    const eff = typeEffectiveness(m.type, defender.types);
    const stab = attacker.types.includes(m.type) ? STAB : 1;
    const score = m.power * eff * stab;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}

/**
 * A full turn. The player's move is given; the opponent picks its
 * own. Both act in speed order, a fainted Pokémon doesn't get to
 * swing back, and burn/poison tick at the end.
 *
 * Returns which SIDE fainted, named from the player's point of
 * view, because that's what the UI needs to react to.
 */
export function resolveJourneyTurn(
  player: JourneyPokemon,
  playerMove: JourneyMove,
  opponent: JourneyPokemon,
  rng: () => number = Math.random
): TurnResult {
  const logs: string[] = [];
  const playerFirst =
    effectiveSpeed(player) === effectiveSpeed(opponent)
      ? rng() < 0.5
      : effectiveSpeed(player) > effectiveSpeed(opponent);

  const opponentMove = chooseOpponentMove(opponent, player, rng);

  const first = playerFirst
    ? { atk: player, mv: playerMove, def: opponent }
    : { atk: opponent, mv: opponentMove, def: player };
  const second = playerFirst
    ? { atk: opponent, mv: opponentMove, def: player }
    : { atk: player, mv: playerMove, def: opponent };

  const r1 = executeMove(first.atk, first.mv, first.def, rng);
  logs.push(...r1.logs);
  if (first.def.currentHp <= 0) {
    logs.push(`${first.def.name} fainted!`);
  } else {
    const r2 = executeMove(second.atk, second.mv, second.def, rng);
    logs.push(...r2.logs);
    if (second.def.currentHp <= 0) logs.push(`${second.def.name} fainted!`);
  }

  // End of turn: chip damage, faster Pokémon first.
  if (player.currentHp > 0 && opponent.currentHp > 0) {
    const order = playerFirst ? [player, opponent] : [opponent, player];
    for (const mon of order) {
      const tick = tickStatus(mon);
      logs.push(...tick);
      if (mon.currentHp <= 0) logs.push(`${mon.name} fainted!`);
    }
  }

  return {
    logs,
    playerFainted: player.currentHp <= 0,
    opponentFainted: opponent.currentHp <= 0,
  };
}
