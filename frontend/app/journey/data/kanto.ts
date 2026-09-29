// ============================================================
// JOURNEY — KANTO REGION DATA
// ============================================================
// Canon source: original Generation I games (Red/Blue/Yellow),
// species and types only — gym team SIZE is trimmed to 2 per
// leader for this v1 slice (real games have larger late-game
// teams); levels are an illustrative Journey balancing curve,
// not exact in-game values.

export interface JourneyMove {
  move_key: string;
  name: string;
  type: string;
  power: number;
  damage_class: string;
}

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
}

export interface GymLeader {
  id: string;
  order: number; // 1-8, sequential unlock order
  name: string;
  gymName: string;
  type: string;
  team: { pokemonId: number; name: string }[]; // levels come from LEVEL_CURVE
  badgeName: string;
}

// --- Level curve: player team level target after clearing each gym ---
// Index 0 = starting level (before Gym 1), index 8 = after final gym.
export const KANTO_LEVEL_CURVE = [5, 12, 18, 24, 29, 34, 39, 44, 50];

// Gym leader team levels run a couple points below the player's target
// for that checkpoint, keeping fights "not too easy, not too hard".
export const KANTO_GYM_LEVEL_OFFSET = -2;

export const KANTO_GYMS: GymLeader[] = [
  {
    id: 'pewter', order: 1, name: 'Brock', gymName: 'Pewter Gym', type: 'Rock', badgeName: 'Boulder Badge',
    team: [{ pokemonId: 74, name: 'Geodude' }, { pokemonId: 95, name: 'Onix' }],
  },
  {
    id: 'cerulean', order: 2, name: 'Misty', gymName: 'Cerulean Gym', type: 'Water', badgeName: 'Cascade Badge',
    team: [{ pokemonId: 120, name: 'Staryu' }, { pokemonId: 121, name: 'Starmie' }],
  },
  {
    id: 'vermilion', order: 3, name: 'Lt. Surge', gymName: 'Vermilion Gym', type: 'Electric', badgeName: 'Thunder Badge',
    team: [{ pokemonId: 100, name: 'Voltorb' }, { pokemonId: 26, name: 'Raichu' }],
  },
  {
    id: 'celadon', order: 4, name: 'Erika', gymName: 'Celadon Gym', type: 'Grass', badgeName: 'Rainbow Badge',
    team: [{ pokemonId: 114, name: 'Tangela' }, { pokemonId: 45, name: 'Vileplume' }],
  },
  {
    id: 'fuchsia', order: 5, name: 'Koga', gymName: 'Fuchsia Gym', type: 'Poison', badgeName: 'Soul Badge',
    team: [{ pokemonId: 89, name: 'Muk' }, { pokemonId: 110, name: 'Weezing' }],
  },
  {
    id: 'saffron', order: 6, name: 'Sabrina', gymName: 'Saffron Gym', type: 'Psychic', badgeName: 'Marsh Badge',
    team: [{ pokemonId: 122, name: 'Mr. Mime' }, { pokemonId: 65, name: 'Alakazam' }],
  },
  {
    id: 'cinnabar', order: 7, name: 'Blaine', gymName: 'Cinnabar Gym', type: 'Fire', badgeName: 'Volcano Badge',
    team: [{ pokemonId: 78, name: 'Rapidash' }, { pokemonId: 59, name: 'Arcanine' }],
  },
  {
    id: 'viridian', order: 8, name: 'Giovanni', gymName: 'Viridian Gym', type: 'Ground', badgeName: 'Earth Badge',
    team: [{ pokemonId: 31, name: 'Nidoqueen' }, { pokemonId: 112, name: 'Rhydon' }],
  },
];

// --- Legendary/mythical Kanto species excluded from team selection ---
export const KANTO_EXCLUDED_IDS = [144, 145, 146, 150, 151]; // Articuno, Zapdos, Moltres, Mewtwo, Mew

// --- Base-stage (first evolution stage) Kanto species eligible for the
// player's starting team of 6 ---
export const KANTO_BASE_STAGE_IDS = [
  1, 4, 7, 10, 13, 16, 19, 21, 23, 25, 27, 29, 32, 35, 37, 39, 41, 43, 46, 48, 50,
  52, 54, 56, 58, 60, 63, 66, 69, 72, 74, 77, 79, 81, 83, 84, 86, 88, 90, 92, 96,
  98, 100, 102, 104, 108, 109, 111, 114, 116, 118, 120, 127, 129, 131, 133, 137,
  138, 140, 142, 143, 147,
];

// --- Evolution map: base species -> next stage + the level at which it
// evolves for Journey purposes. Real level-up evolutions use their actual
// in-game level; trade/stone evolutions (which have no level in the real
// games) are assigned a level matching this region's balancing curve so
// they trigger naturally as the player's team levels up through gyms. ---
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
  25: { to: 26, level: 30 }, // Pikachu -> Raichu (Thunder Stone in-game)
  27: { to: 28, level: 22 },
  29: { to: 30, level: 16 }, 30: { to: 31, level: 36 }, // Nidorina->Nidoqueen (Moon Stone)
  32: { to: 33, level: 16 }, 33: { to: 34, level: 36 }, // Nidorino->Nidoking (Moon Stone)
  35: { to: 36, level: 34 }, // Clefairy -> Clefable (Moon Stone)
  37: { to: 38, level: 34 }, // Vulpix -> Ninetales (Fire Stone)
  39: { to: 40, level: 34 }, // Jigglypuff -> Wigglytuff (Moon Stone)
  41: { to: 42, level: 22 },
  43: { to: 44, level: 21 }, 44: { to: 45, level: 40 }, // Gloom->Vileplume (Leaf Stone)
  46: { to: 47, level: 24 },
  48: { to: 49, level: 31 },
  50: { to: 51, level: 26 },
  52: { to: 53, level: 28 },
  54: { to: 55, level: 33 },
  56: { to: 57, level: 28 },
  58: { to: 59, level: 34 }, // Growlithe -> Arcanine (Fire Stone)
  60: { to: 61, level: 25 }, 61: { to: 62, level: 40 }, // Poliwhirl->Poliwrath (Water Stone)
  63: { to: 64, level: 16 }, 64: { to: 65, level: 36 }, // Kadabra->Alakazam (Trade)
  66: { to: 67, level: 28 }, 67: { to: 68, level: 40 }, // Machoke->Machamp (Trade)
  69: { to: 70, level: 21 }, 70: { to: 71, level: 40 }, // Weepinbell->Victreebel (Leaf Stone)
  72: { to: 73, level: 30 },
  74: { to: 75, level: 25 }, 75: { to: 76, level: 40 }, // Graveler->Golem (Trade)
  77: { to: 78, level: 40 },
  79: { to: 80, level: 37 },
  81: { to: 82, level: 30 },
  84: { to: 85, level: 31 },
  86: { to: 87, level: 34 },
  88: { to: 89, level: 38 },
  90: { to: 91, level: 34 }, // Shellder -> Cloyster (Water Stone)
  92: { to: 93, level: 25 }, 93: { to: 94, level: 40 }, // Haunter->Gengar (Trade)
  96: { to: 97, level: 26 },
  98: { to: 99, level: 28 },
  100: { to: 101, level: 30 },
  102: { to: 103, level: 34 }, // Exeggcute -> Exeggutor (Leaf Stone)
  104: { to: 105, level: 28 },
  108: { to: -1, level: 999 }, // Lickitung: no evolution
  109: { to: 110, level: 35 },
  111: { to: 112, level: 42 },
  114: { to: -1, level: 999 }, // Tangela: no evolution
  116: { to: 117, level: 32 },
  118: { to: 119, level: 33 },
  120: { to: 121, level: 34 }, // Staryu -> Starmie (Water Stone)
  127: { to: -1, level: 999 }, // Pinsir: no evolution
  129: { to: 130, level: 20 },
  131: { to: -1, level: 999 }, // Lapras: no evolution
  133: { to: -1, level: 999 }, // Eevee: branching evolutions skipped in v1
  137: { to: -1, level: 999 }, // Porygon: no evolution (Gen1)
  138: { to: 139, level: 40 },
  140: { to: 141, level: 40 },
  142: { to: -1, level: 999 }, // Aerodactyl: no evolution
  143: { to: -1, level: 999 }, // Snorlax: no evolution
  147: { to: 148, level: 30 }, 148: { to: 149, level: 55 },
};