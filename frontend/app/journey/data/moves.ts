// ============================================================
// JOURNEY — MOVES
// ============================================================
// Region-neutral. Rather than fetching learnsets (four extra
// requests per Pokémon, on every wild encounter), each species
// gets a moveset built from its own types and level.
//
// Two tiers per type: one a Pokémon could plausibly know early,
// one it grows into. Without this a level-10 Geodude turns up
// holding a 75-power Rock Slide and the first gym becomes a coin
// flip. Balancing, not canon — tune freely.
// ============================================================

import type { JourneyMove } from './types';

interface MoveTier {
  early: JourneyMove;
  late: JourneyMove;
}

export const TYPE_MOVE_TIERS: Record<string, MoveTier> = {
  Normal: {
    early: { move_key: 'tackle', name: 'Tackle', type: 'Normal', power: 40, damage_class: 'physical' },
    late:  { move_key: 'body-slam', name: 'Body Slam', type: 'Normal', power: 85, damage_class: 'physical' },
  },
  Fire: {
    early: { move_key: 'ember', name: 'Ember', type: 'Fire', power: 40, damage_class: 'special' },
    late:  { move_key: 'flamethrower', name: 'Flamethrower', type: 'Fire', power: 90, damage_class: 'special' },
  },
  Water: {
    early: { move_key: 'water-gun', name: 'Water Gun', type: 'Water', power: 40, damage_class: 'special' },
    late:  { move_key: 'surf', name: 'Surf', type: 'Water', power: 90, damage_class: 'special' },
  },
  Electric: {
    early: { move_key: 'thunder-shock', name: 'Thunder Shock', type: 'Electric', power: 40, damage_class: 'special' },
    late:  { move_key: 'thunderbolt', name: 'Thunderbolt', type: 'Electric', power: 90, damage_class: 'special' },
  },
  Grass: {
    early: { move_key: 'vine-whip', name: 'Vine Whip', type: 'Grass', power: 45, damage_class: 'physical' },
    late:  { move_key: 'razor-leaf', name: 'Razor Leaf', type: 'Grass', power: 75, damage_class: 'physical' },
  },
  Ice: {
    early: { move_key: 'powder-snow', name: 'Powder Snow', type: 'Ice', power: 40, damage_class: 'special' },
    late:  { move_key: 'ice-beam', name: 'Ice Beam', type: 'Ice', power: 90, damage_class: 'special' },
  },
  Fighting: {
    early: { move_key: 'karate-chop', name: 'Karate Chop', type: 'Fighting', power: 50, damage_class: 'physical' },
    late:  { move_key: 'brick-break', name: 'Brick Break', type: 'Fighting', power: 75, damage_class: 'physical' },
  },
  Poison: {
    early: { move_key: 'acid', name: 'Acid', type: 'Poison', power: 40, damage_class: 'special' },
    late:  { move_key: 'sludge-bomb', name: 'Sludge Bomb', type: 'Poison', power: 90, damage_class: 'special' },
  },
  Ground: {
    early: { move_key: 'mud-slap', name: 'Mud-Slap', type: 'Ground', power: 40, damage_class: 'special' },
    late:  { move_key: 'earthquake', name: 'Earthquake', type: 'Ground', power: 100, damage_class: 'physical' },
  },
  Flying: {
    early: { move_key: 'gust', name: 'Gust', type: 'Flying', power: 40, damage_class: 'special' },
    late:  { move_key: 'wing-attack', name: 'Wing Attack', type: 'Flying', power: 60, damage_class: 'physical' },
  },
  Psychic: {
    early: { move_key: 'confusion', name: 'Confusion', type: 'Psychic', power: 50, damage_class: 'special' },
    late:  { move_key: 'psychic', name: 'Psychic', type: 'Psychic', power: 90, damage_class: 'special' },
  },
  Bug: {
    early: { move_key: 'bug-bite', name: 'Bug Bite', type: 'Bug', power: 40, damage_class: 'physical' },
    late:  { move_key: 'x-scissor', name: 'X-Scissor', type: 'Bug', power: 80, damage_class: 'physical' },
  },
  Rock: {
    early: { move_key: 'rock-throw', name: 'Rock Throw', type: 'Rock', power: 50, damage_class: 'physical' },
    late:  { move_key: 'rock-slide', name: 'Rock Slide', type: 'Rock', power: 75, damage_class: 'physical' },
  },
  Ghost: {
    early: { move_key: 'lick', name: 'Lick', type: 'Ghost', power: 30, damage_class: 'physical' },
    late:  { move_key: 'shadow-ball', name: 'Shadow Ball', type: 'Ghost', power: 80, damage_class: 'special' },
  },
  Dragon: {
    early: { move_key: 'dragon-breath', name: 'Dragon Breath', type: 'Dragon', power: 60, damage_class: 'special' },
    late:  { move_key: 'dragon-claw', name: 'Dragon Claw', type: 'Dragon', power: 80, damage_class: 'physical' },
  },
  Dark: {
    early: { move_key: 'bite', name: 'Bite', type: 'Dark', power: 60, damage_class: 'physical' },
    late:  { move_key: 'crunch', name: 'Crunch', type: 'Dark', power: 80, damage_class: 'physical' },
  },
  Steel: {
    early: { move_key: 'metal-claw', name: 'Metal Claw', type: 'Steel', power: 50, damage_class: 'physical' },
    late:  { move_key: 'iron-head', name: 'Iron Head', type: 'Steel', power: 80, damage_class: 'physical' },
  },
  Fairy: {
    early: { move_key: 'fairy-wind', name: 'Fairy Wind', type: 'Fairy', power: 40, damage_class: 'special' },
    late:  { move_key: 'dazzling-gleam', name: 'Dazzling Gleam', type: 'Fairy', power: 80, damage_class: 'special' },
  },
};

/** Stronger moves come in from here. */
export const LATE_MOVE_LEVEL = 26;

export const FILLER_MOVES: JourneyMove[] = [
  { move_key: 'tackle', name: 'Tackle', type: 'Normal', power: 40, damage_class: 'physical' },
  { move_key: 'quick-attack', name: 'Quick Attack', type: 'Normal', power: 40, damage_class: 'physical' },
];

/** Four moves for a Pokémon, from its own types and its level. */
export function buildMoveset(types: string[], level = 5): JourneyMove[] {
  const pick = (t: string): JourneyMove | undefined => {
    const tier = TYPE_MOVE_TIERS[t];
    if (!tier) return undefined;
    return level >= LATE_MOVE_LEVEL ? tier.late : tier.early;
  };

  const moves: JourneyMove[] = [];
  for (const t of types) {
    const m = pick(t);
    if (m && !moves.some((x) => x.move_key === m.move_key)) moves.push(m);
  }
  if (!moves.some((m) => m.type === 'Normal')) moves.push(pick('Normal')!);
  for (const f of FILLER_MOVES) {
    if (moves.length >= 4) break;
    if (!moves.some((m) => m.move_key === f.move_key)) moves.push(f);
  }
  return moves.slice(0, 4);
}
