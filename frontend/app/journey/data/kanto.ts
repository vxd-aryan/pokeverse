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