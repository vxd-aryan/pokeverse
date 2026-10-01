// ============================================================
// JOURNEY — KANTO CANON DATA
// ============================================================
// Canon source: Pokémon FireRed / LeafGreen (Gen III Kanto).
// Gym leader rosters and their levels below are the real FRLG
// teams, unmodified.
//
// IMPORTANT — canon vs. balancing:
//   * Everything in the CANON section is game-accurate and should
//     only ever change if we switch canon (e.g. to RBY or LGPE).
//   * Everything in the BALANCING section is Journey-specific
//     tuning and is safe to tweak for difficulty.
// Keep the two apart. Do not bake balancing numbers into the
// canon tables.
// ============================================================

export interface JourneyMove {
  move_key: string;
  name: string;
  type: string;
  power: number;
  damage_class: string;
}

export type StatusCondition =
  | 'burn'
  | 'poison'
  | 'paralysis'
  | 'sleep'
  | 'freeze'
  | null;

export interface JourneyPokemon {
  pokemonId: number; // National Dex #
  name: string;
  level: number;
  types: string[];
  stats: {
    attack: number;
    defense: number;
    'special-attack': number;
    'special-defense': number;
    speed: number;
  };
  maxHp: number;
  currentHp: number;
  moves: JourneyMove[];
  spriteUrl: string;
  /** Front-facing sprite, used for the opponent side of the battlefield. */
  frontSpriteUrl?: string;
  status?: StatusCondition;
  /** 1 = base stage, 2 = middle, 3 = final. Shown on the party screen. */
  evolutionStage?: number;
  /** Experience toward the NEXT level, not a lifetime total. */
  xp?: number;
  /** Remaining turns of sleep, or turns spent frozen. */
  statusTurns?: number;
  /** Nickname, if the player gave one on capture. */
  nickname?: string;
  /** Where it came from — shown on the summary screen. */
  caughtAt?: string;
}

// ============================================================
// CANON — Kanto gyms (FireRed / LeafGreen)
// ============================================================

export interface GymTeamMember {
  pokemonId: number;
  name: string;
  level: number;
}

export interface GymLeader {
  id: string;
  /** 1-8, sequential unlock order. */
  order: number;
  name: string;
  gymName: string;
  /** Map node this gym sits in — see kanto-map.ts. */
  locationId: string;
  type: string;
  badgeName: string;
  /** Pokémon Showdown trainer-sprite key. See TRAINER_SPRITE_BASE. */
  spriteKey: string;
  /** Short boss-intro line shown before the battle starts. */
  quote: string;
  /** Line shown on defeat. */
  defeatQuote: string;
  team: GymTeamMember[];
}

export const KANTO_GYMS: GymLeader[] = [
  {
    id: 'pewter',
    order: 1,
    name: 'Brock',
    gymName: 'Pewter Gym',
    locationId: 'pewter',
    type: 'Rock',
    badgeName: 'Boulder Badge',
    spriteKey: 'brock',
    quote: "I believe in rock-hard defense and determination. Show me what you've got!",
    defeatQuote: 'I took you for granted, and so I lost. Take the Boulder Badge.',
    team: [
      { pokemonId: 74, name: 'Geodude', level: 12 },
      { pokemonId: 95, name: 'Onix', level: 14 },
    ],
  },
  {
    id: 'cerulean',
    order: 2,
    name: 'Misty',
    gymName: 'Cerulean Gym',
    locationId: 'cerulean',
    type: 'Water',
    badgeName: 'Cascade Badge',
    spriteKey: 'misty',
    quote: 'My policy is an all-out offensive with Water-type Pokémon!',
    defeatQuote: "Wow! You're too much! All right, take the Cascade Badge.",
    team: [
      { pokemonId: 120, name: 'Staryu', level: 18 },
      { pokemonId: 121, name: 'Starmie', level: 21 },
    ],
  },
  {
    id: 'vermilion',
    order: 3,
    name: 'Lt. Surge',
    gymName: 'Vermilion Gym',
    locationId: 'vermilion',
    type: 'Electric',
    badgeName: 'Thunder Badge',
    spriteKey: 'ltsurge',
    quote: "Electric Pokémon saved me during the war! I'll shock you into surrender!",
    defeatQuote: 'Whoa! You have great Pokémon! Take the Thunder Badge!',
    team: [
      { pokemonId: 100, name: 'Voltorb', level: 21 },
      { pokemonId: 25, name: 'Pikachu', level: 18 },
      { pokemonId: 26, name: 'Raichu', level: 24 },
    ],
  },
  {
    id: 'celadon',
    order: 4,
    name: 'Erika',
    gymName: 'Celadon Gym',
    locationId: 'celadon',
    type: 'Grass',
    badgeName: 'Rainbow Badge',
    spriteKey: 'erika',
    quote: 'I teach the art of flower arranging. My Pokémon are of the Grass type.',
    defeatQuote: 'Oh! I concede defeat. You are remarkably strong. The Rainbow Badge is yours.',
    team: [
      { pokemonId: 71, name: 'Victreebel', level: 29 },
      { pokemonId: 114, name: 'Tangela', level: 24 },
      { pokemonId: 45, name: 'Vileplume', level: 29 },
    ],
  },
  {
    id: 'fuchsia',
    order: 5,
    name: 'Koga',
    gymName: 'Fuchsia Gym',
    locationId: 'fuchsia',
    type: 'Poison',
    badgeName: 'Soul Badge',
    spriteKey: 'koga',
    quote: 'A ninja should be able to track his prey through darkness! Fear the poison!',
    defeatQuote: 'Humph! You have proven your worth! Here is the Soul Badge!',
    team: [
      { pokemonId: 109, name: 'Koffing', level: 37 },
      { pokemonId: 89, name: 'Muk', level: 39 },
      { pokemonId: 109, name: 'Koffing', level: 37 },
      { pokemonId: 110, name: 'Weezing', level: 43 },
    ],
  },
  {
    id: 'saffron',
    order: 6,
    name: 'Sabrina',
    gymName: 'Saffron Gym',
    locationId: 'saffron',
    type: 'Psychic',
    badgeName: 'Marsh Badge',
    spriteKey: 'sabrina',
    quote: 'I had a vision of your arrival. My psychic power is unbeatable.',
    defeatQuote: "Your power... it's amazing. You deserve the Marsh Badge.",
    team: [
      { pokemonId: 64, name: 'Kadabra', level: 38 },
      { pokemonId: 122, name: 'Mr. Mime', level: 37 },
      { pokemonId: 49, name: 'Venomoth', level: 38 },
      { pokemonId: 65, name: 'Alakazam', level: 43 },
    ],
  },
  {
    id: 'cinnabar',
    order: 7,
    name: 'Blaine',
    gymName: 'Cinnabar Gym',
    locationId: 'cinnabar',
    type: 'Fire',
    badgeName: 'Volcano Badge',
    spriteKey: 'blaine',
    quote: 'Hah! I am Blaine! My fiery Pokémon will incinerate all challengers!',
    defeatQuote: "I've burned out! You've earned the Volcano Badge!",
    team: [
      { pokemonId: 58, name: 'Growlithe', level: 42 },
      { pokemonId: 77, name: 'Ponyta', level: 40 },
      { pokemonId: 78, name: 'Rapidash', level: 42 },
      { pokemonId: 59, name: 'Arcanine', level: 47 },
    ],
  },
  {
    id: 'viridian',
    order: 8,
    name: 'Giovanni',
    gymName: 'Viridian Gym',
    locationId: 'viridian',
    type: 'Ground',
    badgeName: 'Earth Badge',
    spriteKey: 'giovanni',
    quote: 'So! I must show you that my Pokémon skills are superior. This will be your final battle.',
    defeatQuote: 'Ha! That was a truly intense fight! You have won. Take the Earth Badge.',
    team: [
      { pokemonId: 111, name: 'Rhyhorn', level: 45 },
      { pokemonId: 51, name: 'Dugtrio', level: 42 },
      { pokemonId: 31, name: 'Nidoqueen', level: 44 },
      { pokemonId: 34, name: 'Nidoking', level: 45 },
      { pokemonId: 112, name: 'Rhydon', level: 50 },
    ],
  },
];

/** Badge display order, matching gym order. */
export const KANTO_BADGES = KANTO_GYMS.map((g) => ({
  gymId: g.id,
  order: g.order,
  name: g.badgeName,
  type: g.type,
  leader: g.name,
}));

// --- Legendary/mythical Kanto species, excluded from team selection ---
export const KANTO_EXCLUDED_IDS = [144, 145, 146, 150, 151];

// ============================================================
// BALANCING — Journey-specific progression tuning
// ============================================================
// Player level targets. Index 0 is the level the starting six
// begin at; index N is the level the team is raised to after
// clearing gym N. Each value is set just under the top level of
// the NEXT gym's canon team, so the player fights slightly
// under-levelled but with a six-vs-two-to-five advantage.
//
// Gym top levels for reference: 14, 21, 24, 29, 43, 43, 47, 50.
export const KANTO_PLAYER_LEVEL_CURVE = [12, 19, 23, 28, 38, 42, 46, 50, 54];

/** Kept as an alias so existing imports don't break. */
export const KANTO_LEVEL_CURVE = KANTO_PLAYER_LEVEL_CURVE;

/** Player team is fully restored after each gym — no healing grind. */
export const HEAL_AFTER_GYM = true;

/** Gym battles disable Run, per classic boss-encounter rules. */
export const GYM_BATTLE_COMMANDS = {
  fight: true,
  pokemon: true,
  bag: false, // not implemented yet
  run: false,
};

/** Level the player's team is at when they walk into gym N (1-indexed). */
export function playerLevelBeforeGym(order: number): number {
  return KANTO_PLAYER_LEVEL_CURVE[order - 1];
}

/** Level the player's team is raised to after clearing gym N (1-indexed). */
export function playerLevelAfterGym(order: number): number {
  return KANTO_PLAYER_LEVEL_CURVE[order];
}

// ============================================================
// TEAM SELECTION RULES
// ============================================================
// Base-stage (first evolution stage) Kanto species eligible for
// the player's starting six. Non-legendary, non-mythical, and
// duplicates are blocked at the UI level.
export const KANTO_BASE_STAGE_IDS = [
  1, 4, 7, 10, 13, 16, 19, 21, 23, 25, 27, 29, 32, 35, 37, 39, 41, 43, 46, 48, 50,
  52, 54, 56, 58, 60, 63, 66, 69, 72, 74, 77, 79, 81, 83, 84, 86, 88, 90, 92, 96,
  98, 100, 102, 104, 108, 109, 111, 114, 116, 118, 120, 127, 129, 131, 133, 137,
  138, 140, 142, 143, 147,
];

/**
 * Name and types for every eligible starter, held locally so the
 * selection grid draws instantly instead of firing 60+ requests at
 * PokeAPI. Full stats are fetched only for the six a player picks.
 */
export const KANTO_STARTER_ROSTER: { id: number; name: string; types: string[] }[] = [
  { id: 1,   name: 'Bulbasaur',  types: ['Grass', 'Poison'] },
  { id: 4,   name: 'Charmander', types: ['Fire'] },
  { id: 7,   name: 'Squirtle',   types: ['Water'] },
  { id: 10,  name: 'Caterpie',   types: ['Bug'] },
  { id: 13,  name: 'Weedle',     types: ['Bug', 'Poison'] },
  { id: 16,  name: 'Pidgey',     types: ['Normal', 'Flying'] },
  { id: 19,  name: 'Rattata',    types: ['Normal'] },
  { id: 21,  name: 'Spearow',    types: ['Normal', 'Flying'] },
  { id: 23,  name: 'Ekans',      types: ['Poison'] },
  { id: 25,  name: 'Pikachu',    types: ['Electric'] },
  { id: 27,  name: 'Sandshrew',  types: ['Ground'] },
  { id: 29,  name: 'Nidoran♀',   types: ['Poison'] },
  { id: 32,  name: 'Nidoran♂',   types: ['Poison'] },
  { id: 35,  name: 'Clefairy',   types: ['Fairy'] },
  { id: 37,  name: 'Vulpix',     types: ['Fire'] },
  { id: 39,  name: 'Jigglypuff', types: ['Normal', 'Fairy'] },
  { id: 41,  name: 'Zubat',      types: ['Poison', 'Flying'] },
  { id: 43,  name: 'Oddish',     types: ['Grass', 'Poison'] },
  { id: 46,  name: 'Paras',      types: ['Bug', 'Grass'] },
  { id: 48,  name: 'Venonat',    types: ['Bug', 'Poison'] },
  { id: 50,  name: 'Diglett',    types: ['Ground'] },
  { id: 52,  name: 'Meowth',     types: ['Normal'] },
  { id: 54,  name: 'Psyduck',    types: ['Water'] },
  { id: 56,  name: 'Mankey',     types: ['Fighting'] },
  { id: 58,  name: 'Growlithe',  types: ['Fire'] },
  { id: 60,  name: 'Poliwag',    types: ['Water'] },
  { id: 63,  name: 'Abra',       types: ['Psychic'] },
  { id: 66,  name: 'Machop',     types: ['Fighting'] },
  { id: 69,  name: 'Bellsprout', types: ['Grass', 'Poison'] },
  { id: 72,  name: 'Tentacool',  types: ['Water', 'Poison'] },
  { id: 74,  name: 'Geodude',    types: ['Rock', 'Ground'] },
  { id: 77,  name: 'Ponyta',     types: ['Fire'] },
  { id: 79,  name: 'Slowpoke',   types: ['Water', 'Psychic'] },
  { id: 81,  name: 'Magnemite',  types: ['Electric', 'Steel'] },
  { id: 83,  name: "Farfetch'd", types: ['Normal', 'Flying'] },
  { id: 84,  name: 'Doduo',      types: ['Normal', 'Flying'] },
  { id: 86,  name: 'Seel',       types: ['Water'] },
  { id: 88,  name: 'Grimer',     types: ['Poison'] },
  { id: 90,  name: 'Shellder',   types: ['Water'] },
  { id: 92,  name: 'Gastly',     types: ['Ghost', 'Poison'] },
  { id: 96,  name: 'Drowzee',    types: ['Psychic'] },
  { id: 98,  name: 'Krabby',     types: ['Water'] },
  { id: 100, name: 'Voltorb',    types: ['Electric'] },
  { id: 102, name: 'Exeggcute',  types: ['Grass', 'Psychic'] },
  { id: 104, name: 'Cubone',     types: ['Ground'] },
  { id: 108, name: 'Lickitung',  types: ['Normal'] },
  { id: 109, name: 'Koffing',    types: ['Poison'] },
  { id: 111, name: 'Rhyhorn',    types: ['Ground', 'Rock'] },
  { id: 114, name: 'Tangela',    types: ['Grass'] },
  { id: 116, name: 'Horsea',     types: ['Water'] },
  { id: 118, name: 'Goldeen',    types: ['Water'] },
  { id: 120, name: 'Staryu',     types: ['Water'] },
  { id: 127, name: 'Pinsir',     types: ['Bug'] },
  { id: 129, name: 'Magikarp',   types: ['Water'] },
  { id: 131, name: 'Lapras',     types: ['Water', 'Ice'] },
  { id: 133, name: 'Eevee',      types: ['Normal'] },
  { id: 137, name: 'Porygon',    types: ['Normal'] },
  { id: 138, name: 'Omanyte',    types: ['Rock', 'Water'] },
  { id: 140, name: 'Kabuto',     types: ['Rock', 'Water'] },
  { id: 142, name: 'Aerodactyl', types: ['Rock', 'Flying'] },
  { id: 143, name: 'Snorlax',    types: ['Normal'] },
  { id: 147, name: 'Dratini',    types: ['Dragon'] },
];

/**
 * Two attacking moves per type: one a Pokémon could plausibly know
 * early, one it grows into. Journey picks by level, because giving
 * a level-10 Geodude a 75-power Rock Slide makes the first gym a
 * coin flip rather than a fight.
 *
 * Balancing, not canon — tune freely.
 */
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
  const normal = pick('Normal')!;
  if (!moves.some((m) => m.type === 'Normal')) moves.push(normal);
  for (const f of FILLER_MOVES) {
    if (moves.length >= 4) break;
    if (!moves.some((m) => m.move_key === f.move_key)) moves.push(f);
  }
  return moves.slice(0, 4);
}

// ============================================================
// EVOLUTION
// ============================================================
// Base species -> next stage, plus the level it evolves at for
// Journey purposes. Real level-up evolutions use their in-game
// level. Trade and stone evolutions (which have no level in the
// real games) get a level chosen to land naturally on this
// region's curve. `to: -1` means the line ends here.
export const KANTO_EVOLUTION_MAP: Record<number, { to: number; level: number }> = {
  1: { to: 2, level: 16 }, 2: { to: 3, level: 32 },
  4: { to: 5, level: 16 }, 5: { to: 6, level: 36 },
  7: { to: 8, level: 16 }, 8: { to: 9, level: 36 },
  10: { to: 11, level: 7 }, 11: { to: 12, level: 10 },
  13: { to: 14, level: 7 }, 14: { to: 15, level: 10 },
  16: { to: 17, level: 18 }, 17: { to: 18, level: 36 },
  19: { to: 20, level: 20 },
  21: { to: 22, level: 20 },
  23: { to: 24, level: 22 },
  25: { to: 26, level: 30 },   // Thunder Stone in-game
  27: { to: 28, level: 22 },
  29: { to: 30, level: 16 }, 30: { to: 31, level: 36 },  // Moon Stone
  32: { to: 33, level: 16 }, 33: { to: 34, level: 36 },  // Moon Stone
  35: { to: 36, level: 34 },   // Moon Stone
  37: { to: 38, level: 34 },   // Fire Stone
  39: { to: 40, level: 34 },   // Moon Stone
  41: { to: 42, level: 22 },
  43: { to: 44, level: 21 }, 44: { to: 45, level: 40 },  // Leaf Stone
  46: { to: 47, level: 24 },
  48: { to: 49, level: 31 },
  50: { to: 51, level: 26 },
  52: { to: 53, level: 28 },
  54: { to: 55, level: 33 },
  56: { to: 57, level: 28 },
  58: { to: 59, level: 34 },   // Fire Stone
  60: { to: 61, level: 25 }, 61: { to: 62, level: 40 },  // Water Stone
  63: { to: 64, level: 16 }, 64: { to: 65, level: 36 },  // Trade
  66: { to: 67, level: 28 }, 67: { to: 68, level: 40 },  // Trade
  69: { to: 70, level: 21 }, 70: { to: 71, level: 40 },  // Leaf Stone
  72: { to: 73, level: 30 },
  74: { to: 75, level: 25 }, 75: { to: 76, level: 40 },  // Trade
  77: { to: 78, level: 40 },
  79: { to: 80, level: 37 },
  81: { to: 82, level: 30 },
  84: { to: 85, level: 31 },
  86: { to: 87, level: 34 },
  88: { to: 89, level: 38 },
  90: { to: 91, level: 34 },   // Water Stone
  92: { to: 93, level: 25 }, 93: { to: 94, level: 40 },  // Trade
  96: { to: 97, level: 26 },
  98: { to: 99, level: 28 },
  100: { to: 101, level: 30 },
  102: { to: 103, level: 34 }, // Leaf Stone
  104: { to: 105, level: 28 },
  108: { to: -1, level: 999 },
  109: { to: 110, level: 35 },
  111: { to: 112, level: 42 },
  114: { to: -1, level: 999 },
  116: { to: 117, level: 32 },
  118: { to: 119, level: 33 },
  120: { to: 121, level: 34 }, // Water Stone
  127: { to: -1, level: 999 },
  129: { to: 130, level: 20 },
  131: { to: -1, level: 999 },
  133: { to: -1, level: 999 }, // branching evolutions not supported yet
  137: { to: -1, level: 999 },
  138: { to: 139, level: 40 },
  140: { to: 141, level: 40 },
  142: { to: -1, level: 999 },
  143: { to: -1, level: 999 },
  147: { to: 148, level: 30 }, 148: { to: 149, level: 55 },
};

/**
 * Which stage of its line a species sits at (1 = base, 2 = middle,
 * 3 = final). Derived from the evolution map so it stays in sync.
 */
export function getEvolutionStage(pokemonId: number): number {
  let stage = 1;
  for (const [fromId, evo] of Object.entries(KANTO_EVOLUTION_MAP)) {
    if (evo.to === pokemonId) {
      stage = getEvolutionStage(Number(fromId)) + 1;
      break;
    }
  }
  return stage;
}

/**
 * Walks the evolution chain forward as far as `level` allows.
 * Returns the resulting species id and whether anything changed.
 */
export function resolveEvolution(
  pokemonId: number,
  level: number
): { id: number; evolved: boolean } {
  let currentId = pokemonId;
  let evolved = false;
  let evo = KANTO_EVOLUTION_MAP[currentId];
  while (evo && evo.to !== -1 && level >= evo.level) {
    currentId = evo.to;
    evolved = true;
    evo = KANTO_EVOLUTION_MAP[currentId];
  }
  return { id: currentId, evolved };
}

// --- Deprecated: the old flat offset is replaced by per-Pokémon
// canon levels on each gym team. Kept only so stale imports don't
// break the build; remove once nothing references it. ---
/** @deprecated gym levels now come from canon team data */
export const KANTO_GYM_LEVEL_OFFSET = 0;
