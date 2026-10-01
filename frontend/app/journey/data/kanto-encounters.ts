// ============================================================
// JOURNEY — WILD ENCOUNTERS & FIELD ITEMS
// ============================================================
// Which Pokémon appear where, following FireRed/LeafGreen's
// route tables. Species lists and level ranges are canon-shaped;
// the rarity weights are simplified into three bands rather than
// copying each slot's exact percentage, which keeps the tables
// readable without changing how an area feels.
//
// Towns have no encounters — you explore them for items, shops
// and the Pokémon Center instead.
// ============================================================

export interface WildSlot {
  pokemonId: number;
  name: string;
  minLevel: number;
  maxLevel: number;
  /** Relative weight. Higher means more common. */
  weight: number;
}

export interface AreaEncounters {
  /** Chance per step that anything appears at all, 0-1. */
  encounterRate: number;
  slots: WildSlot[];
  /** Item ids that can be found while exploring here. */
  itemFinds?: string[];
}

// Rarity bands — use these rather than ad-hoc numbers so the
// tables stay consistent with each other.
const COMMON = 10;
const UNCOMMON = 5;
const RARE = 2;
const VERY_RARE = 1;

export const KANTO_ENCOUNTERS: Record<string, AreaEncounters> = {
  'route-1': {
    encounterRate: 0.55,
    slots: [
      { pokemonId: 16, name: 'Pidgey', minLevel: 2, maxLevel: 5, weight: COMMON },
      { pokemonId: 19, name: 'Rattata', minLevel: 2, maxLevel: 4, weight: COMMON },
    ],
    itemFinds: ['potion', 'poke-ball'],
  },

  'route-2': {
    encounterRate: 0.55,
    slots: [
      { pokemonId: 16, name: 'Pidgey', minLevel: 3, maxLevel: 5, weight: COMMON },
      { pokemonId: 19, name: 'Rattata', minLevel: 3, maxLevel: 5, weight: COMMON },
      { pokemonId: 10, name: 'Caterpie', minLevel: 4, maxLevel: 5, weight: UNCOMMON },
      { pokemonId: 13, name: 'Weedle', minLevel: 4, maxLevel: 5, weight: UNCOMMON },
    ],
    itemFinds: ['potion', 'poke-ball'],
  },

  'viridian-forest': {
    encounterRate: 0.65,
    slots: [
      { pokemonId: 10, name: 'Caterpie', minLevel: 3, maxLevel: 6, weight: COMMON },
      { pokemonId: 13, name: 'Weedle', minLevel: 3, maxLevel: 6, weight: COMMON },
      { pokemonId: 11, name: 'Metapod', minLevel: 4, maxLevel: 6, weight: UNCOMMON },
      { pokemonId: 14, name: 'Kakuna', minLevel: 4, maxLevel: 6, weight: UNCOMMON },
      { pokemonId: 25, name: 'Pikachu', minLevel: 3, maxLevel: 5, weight: VERY_RARE },
    ],
    itemFinds: ['poke-ball', 'potion', 'full-heal'],
  },

  'route-3': {
    encounterRate: 0.55,
    slots: [
      { pokemonId: 21, name: 'Spearow', minLevel: 6, maxLevel: 10, weight: COMMON },
      { pokemonId: 16, name: 'Pidgey', minLevel: 6, maxLevel: 9, weight: UNCOMMON },
      { pokemonId: 56, name: 'Mankey', minLevel: 7, maxLevel: 9, weight: UNCOMMON },
      { pokemonId: 39, name: 'Jigglypuff', minLevel: 3, maxLevel: 7, weight: RARE },
    ],
    itemFinds: ['potion', 'poke-ball'],
  },

  'mt-moon': {
    encounterRate: 0.6,
    slots: [
      { pokemonId: 41, name: 'Zubat', minLevel: 6, maxLevel: 10, weight: COMMON },
      { pokemonId: 74, name: 'Geodude', minLevel: 7, maxLevel: 10, weight: UNCOMMON },
      { pokemonId: 46, name: 'Paras', minLevel: 8, maxLevel: 10, weight: RARE },
      { pokemonId: 35, name: 'Clefairy', minLevel: 8, maxLevel: 12, weight: VERY_RARE },
    ],
    itemFinds: ['potion', 'super-potion', 'poke-ball'],
  },

  'route-4': {
    encounterRate: 0.5,
    slots: [
      { pokemonId: 19, name: 'Rattata', minLevel: 8, maxLevel: 12, weight: COMMON },
      { pokemonId: 21, name: 'Spearow', minLevel: 8, maxLevel: 12, weight: COMMON },
      { pokemonId: 23, name: 'Ekans', minLevel: 6, maxLevel: 12, weight: UNCOMMON },
      { pokemonId: 27, name: 'Sandshrew', minLevel: 6, maxLevel: 12, weight: UNCOMMON },
    ],
    itemFinds: ['potion', 'poke-ball'],
  },

  'route-5': {
    encounterRate: 0.5,
    slots: [
      { pokemonId: 16, name: 'Pidgey', minLevel: 10, maxLevel: 14, weight: COMMON },
      { pokemonId: 52, name: 'Meowth', minLevel: 10, maxLevel: 16, weight: UNCOMMON },
      { pokemonId: 43, name: 'Oddish', minLevel: 12, maxLevel: 16, weight: UNCOMMON },
      { pokemonId: 69, name: 'Bellsprout', minLevel: 12, maxLevel: 16, weight: UNCOMMON },
    ],
    itemFinds: ['super-potion', 'poke-ball'],
  },

  'route-6': {
    encounterRate: 0.5,
    slots: [
      { pokemonId: 16, name: 'Pidgey', minLevel: 10, maxLevel: 14, weight: COMMON },
      { pokemonId: 52, name: 'Meowth', minLevel: 10, maxLevel: 16, weight: UNCOMMON },
      { pokemonId: 60, name: 'Poliwag', minLevel: 12, maxLevel: 16, weight: UNCOMMON },
      { pokemonId: 43, name: 'Oddish', minLevel: 13, maxLevel: 16, weight: UNCOMMON },
    ],
    itemFinds: ['super-potion', 'great-ball'],
  },

  'route-7': {
    encounterRate: 0.5,
    slots: [
      { pokemonId: 16, name: 'Pidgey', minLevel: 17, maxLevel: 20, weight: COMMON },
      { pokemonId: 52, name: 'Meowth', minLevel: 17, maxLevel: 20, weight: UNCOMMON },
      { pokemonId: 43, name: 'Oddish', minLevel: 19, maxLevel: 22, weight: UNCOMMON },
      { pokemonId: 63, name: 'Abra', minLevel: 15, maxLevel: 18, weight: RARE },
    ],
    itemFinds: ['super-potion', 'great-ball'],
  },

  'route-8': {
    encounterRate: 0.5,
    slots: [
      { pokemonId: 19, name: 'Rattata', minLevel: 18, maxLevel: 22, weight: COMMON },
      { pokemonId: 52, name: 'Meowth', minLevel: 18, maxLevel: 22, weight: UNCOMMON },
      { pokemonId: 37, name: 'Vulpix', minLevel: 18, maxLevel: 22, weight: RARE },
      { pokemonId: 58, name: 'Growlithe', minLevel: 18, maxLevel: 22, weight: RARE },
    ],
    itemFinds: ['super-potion', 'great-ball'],
  },

  'route-9': {
    encounterRate: 0.55,
    slots: [
      { pokemonId: 19, name: 'Rattata', minLevel: 14, maxLevel: 18, weight: COMMON },
      { pokemonId: 21, name: 'Spearow', minLevel: 14, maxLevel: 18, weight: COMMON },
      { pokemonId: 23, name: 'Ekans', minLevel: 14, maxLevel: 18, weight: UNCOMMON },
      { pokemonId: 27, name: 'Sandshrew', minLevel: 14, maxLevel: 18, weight: UNCOMMON },
    ],
    itemFinds: ['super-potion', 'great-ball'],
  },

  'rock-tunnel': {
    encounterRate: 0.65,
    slots: [
      { pokemonId: 41, name: 'Zubat', minLevel: 15, maxLevel: 20, weight: COMMON },
      { pokemonId: 74, name: 'Geodude', minLevel: 15, maxLevel: 20, weight: COMMON },
      { pokemonId: 95, name: 'Onix', minLevel: 13, maxLevel: 17, weight: UNCOMMON },
      { pokemonId: 66, name: 'Machop', minLevel: 15, maxLevel: 17, weight: RARE },
    ],
    itemFinds: ['super-potion', 'full-heal', 'great-ball'],
  },

  'route-10': {
    encounterRate: 0.55,
    slots: [
      { pokemonId: 100, name: 'Voltorb', minLevel: 16, maxLevel: 20, weight: UNCOMMON },
      { pokemonId: 81, name: 'Magnemite', minLevel: 16, maxLevel: 20, weight: UNCOMMON },
      { pokemonId: 19, name: 'Rattata', minLevel: 16, maxLevel: 20, weight: COMMON },
      { pokemonId: 104, name: 'Cubone', minLevel: 15, maxLevel: 18, weight: RARE },
    ],
    itemFinds: ['super-potion', 'great-ball'],
  },

  'route-12': {
    encounterRate: 0.5,
    slots: [
      { pokemonId: 16, name: 'Pidgey', minLevel: 22, maxLevel: 28, weight: COMMON },
      { pokemonId: 43, name: 'Oddish', minLevel: 22, maxLevel: 28, weight: UNCOMMON },
      { pokemonId: 48, name: 'Venonat', minLevel: 24, maxLevel: 26, weight: UNCOMMON },
      { pokemonId: 129, name: 'Magikarp', minLevel: 5, maxLevel: 15, weight: RARE },
    ],
    itemFinds: ['hyper-potion', 'great-ball'],
  },

  'route-13': {
    encounterRate: 0.5,
    slots: [
      { pokemonId: 16, name: 'Pidgey', minLevel: 22, maxLevel: 28, weight: COMMON },
      { pokemonId: 48, name: 'Venonat', minLevel: 24, maxLevel: 28, weight: UNCOMMON },
      { pokemonId: 132, name: 'Ditto', minLevel: 25, maxLevel: 30, weight: RARE },
    ],
    itemFinds: ['hyper-potion', 'ultra-ball'],
  },

  'route-14': {
    encounterRate: 0.5,
    slots: [
      { pokemonId: 43, name: 'Oddish', minLevel: 24, maxLevel: 30, weight: COMMON },
      { pokemonId: 48, name: 'Venonat', minLevel: 24, maxLevel: 30, weight: UNCOMMON },
      { pokemonId: 132, name: 'Ditto', minLevel: 26, maxLevel: 32, weight: RARE },
    ],
    itemFinds: ['hyper-potion', 'ultra-ball'],
  },

  'route-15': {
    encounterRate: 0.5,
    slots: [
      { pokemonId: 16, name: 'Pidgey', minLevel: 24, maxLevel: 30, weight: COMMON },
      { pokemonId: 43, name: 'Oddish', minLevel: 24, maxLevel: 30, weight: UNCOMMON },
      { pokemonId: 132, name: 'Ditto', minLevel: 26, maxLevel: 32, weight: RARE },
    ],
    itemFinds: ['hyper-potion', 'ultra-ball'],
  },

  'safari-zone': {
    encounterRate: 0.7,
    slots: [
      { pokemonId: 102, name: 'Exeggcute', minLevel: 22, maxLevel: 26, weight: COMMON },
      { pokemonId: 111, name: 'Rhyhorn', minLevel: 25, maxLevel: 30, weight: UNCOMMON },
      { pokemonId: 127, name: 'Pinsir', minLevel: 25, maxLevel: 28, weight: RARE },
      { pokemonId: 123, name: 'Scyther', minLevel: 25, maxLevel: 28, weight: RARE },
      { pokemonId: 113, name: 'Chansey', minLevel: 26, maxLevel: 26, weight: VERY_RARE },
      { pokemonId: 147, name: 'Dratini', minLevel: 15, maxLevel: 20, weight: VERY_RARE },
    ],
    itemFinds: ['ultra-ball', 'hyper-potion', 'full-heal'],
  },

  'route-19': {
    encounterRate: 0.6,
    slots: [
      { pokemonId: 72, name: 'Tentacool', minLevel: 28, maxLevel: 35, weight: COMMON },
      { pokemonId: 129, name: 'Magikarp', minLevel: 10, maxLevel: 25, weight: UNCOMMON },
    ],
    itemFinds: ['ultra-ball', 'hyper-potion'],
  },

  'route-20': {
    encounterRate: 0.6,
    slots: [
      { pokemonId: 72, name: 'Tentacool', minLevel: 30, maxLevel: 38, weight: COMMON },
      { pokemonId: 129, name: 'Magikarp', minLevel: 10, maxLevel: 25, weight: UNCOMMON },
    ],
    itemFinds: ['ultra-ball', 'hyper-potion'],
  },

  seafoam: {
    encounterRate: 0.65,
    slots: [
      { pokemonId: 41, name: 'Zubat', minLevel: 28, maxLevel: 34, weight: COMMON },
      { pokemonId: 86, name: 'Seel', minLevel: 28, maxLevel: 34, weight: UNCOMMON },
      { pokemonId: 54, name: 'Psyduck', minLevel: 28, maxLevel: 34, weight: UNCOMMON },
      { pokemonId: 90, name: 'Shellder', minLevel: 28, maxLevel: 34, weight: RARE },
    ],
    itemFinds: ['ultra-ball', 'full-restore'],
  },

  'route-21': {
    encounterRate: 0.6,
    slots: [
      { pokemonId: 72, name: 'Tentacool', minLevel: 30, maxLevel: 38, weight: COMMON },
      { pokemonId: 129, name: 'Magikarp', minLevel: 10, maxLevel: 25, weight: UNCOMMON },
      { pokemonId: 131, name: 'Lapras', minLevel: 30, maxLevel: 35, weight: VERY_RARE },
    ],
    itemFinds: ['ultra-ball', 'hyper-potion'],
  },
};

// Towns and cities: no wild Pokémon, but services.
export const TOWN_NODES = [
  'pallet', 'viridian', 'pewter', 'cerulean', 'vermilion',
  'lavender', 'celadon', 'fuchsia', 'saffron', 'cinnabar',
];

export function isTown(nodeId: string): boolean {
  return TOWN_NODES.includes(nodeId);
}

export function encountersFor(nodeId: string): AreaEncounters | undefined {
  return KANTO_ENCOUNTERS[nodeId];
}

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
