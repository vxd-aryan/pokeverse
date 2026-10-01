// ============================================================
// JOHTO — WILD ENCOUNTERS
// ============================================================
// Following HeartGold / SoulSilver's route tables. Johto's
// defining quirk is how many Kanto species share its routes, so
// the lists mix freely — a Johto run is a Gen 1/2 run, not a pure
// Gen 2 one.
//
// Rarity uses the same three bands as every other region.
// ============================================================

import type { AreaEncounters } from '../../types';
import { COMMON, UNCOMMON, RARE, VERY_RARE } from '../../types';

export const JOHTO_ENCOUNTERS: Record<string, AreaEncounters> = {
  'route-29': {
    encounterRate: 0.55,
    slots: [
      { pokemonId: 161, name: 'Sentret', minLevel: 2, maxLevel: 4, weight: COMMON },
      { pokemonId: 16, name: 'Pidgey', minLevel: 2, maxLevel: 4, weight: COMMON },
      { pokemonId: 19, name: 'Rattata', minLevel: 2, maxLevel: 4, weight: UNCOMMON },
      { pokemonId: 163, name: 'Hoothoot', minLevel: 2, maxLevel: 4, weight: UNCOMMON },
    ],
    itemFinds: ['potion', 'poke-ball'],
  },

  'route-30': {
    encounterRate: 0.55,
    slots: [
      { pokemonId: 10, name: 'Caterpie', minLevel: 3, maxLevel: 5, weight: COMMON },
      { pokemonId: 13, name: 'Weedle', minLevel: 3, maxLevel: 5, weight: COMMON },
      { pokemonId: 165, name: 'Ledyba', minLevel: 3, maxLevel: 5, weight: UNCOMMON },
      { pokemonId: 167, name: 'Spinarak', minLevel: 3, maxLevel: 5, weight: UNCOMMON },
      { pokemonId: 179, name: 'Mareep', minLevel: 4, maxLevel: 6, weight: RARE },
    ],
    itemFinds: ['potion', 'poke-ball'],
  },

  'route-31': {
    encounterRate: 0.55,
    slots: [
      { pokemonId: 10, name: 'Caterpie', minLevel: 4, maxLevel: 6, weight: COMMON },
      { pokemonId: 13, name: 'Weedle', minLevel: 4, maxLevel: 6, weight: COMMON },
      { pokemonId: 163, name: 'Hoothoot', minLevel: 4, maxLevel: 6, weight: UNCOMMON },
      { pokemonId: 69, name: 'Bellsprout', minLevel: 4, maxLevel: 6, weight: UNCOMMON },
    ],
    itemFinds: ['potion', 'poke-ball'],
  },

  'dark-cave': {
    encounterRate: 0.65,
    slots: [
      { pokemonId: 41, name: 'Zubat', minLevel: 3, maxLevel: 6, weight: COMMON },
      { pokemonId: 74, name: 'Geodude', minLevel: 3, maxLevel: 6, weight: COMMON },
      { pokemonId: 206, name: 'Dunsparce', minLevel: 3, maxLevel: 6, weight: RARE },
      { pokemonId: 231, name: 'Phanpy', minLevel: 4, maxLevel: 7, weight: RARE },
    ],
    itemFinds: ['potion', 'poke-ball'],
  },

  'route-32': {
    encounterRate: 0.55,
    slots: [
      { pokemonId: 19, name: 'Rattata', minLevel: 6, maxLevel: 10, weight: COMMON },
      { pokemonId: 23, name: 'Ekans', minLevel: 6, maxLevel: 10, weight: UNCOMMON },
      { pokemonId: 41, name: 'Zubat', minLevel: 6, maxLevel: 10, weight: UNCOMMON },
      { pokemonId: 129, name: 'Magikarp', minLevel: 5, maxLevel: 10, weight: UNCOMMON },
      { pokemonId: 179, name: 'Mareep', minLevel: 7, maxLevel: 10, weight: RARE },
    ],
    itemFinds: ['potion', 'poke-ball'],
  },

  'union-cave': {
    encounterRate: 0.65,
    slots: [
      { pokemonId: 41, name: 'Zubat', minLevel: 6, maxLevel: 11, weight: COMMON },
      { pokemonId: 74, name: 'Geodude', minLevel: 6, maxLevel: 11, weight: COMMON },
      { pokemonId: 95, name: 'Onix', minLevel: 7, maxLevel: 11, weight: UNCOMMON },
      { pokemonId: 27, name: 'Sandshrew', minLevel: 6, maxLevel: 10, weight: UNCOMMON },
      { pokemonId: 194, name: 'Wooper', minLevel: 7, maxLevel: 11, weight: RARE },
    ],
    itemFinds: ['potion', 'super-potion', 'poke-ball'],
  },

  'route-33': {
    encounterRate: 0.5,
    slots: [
      { pokemonId: 41, name: 'Zubat', minLevel: 8, maxLevel: 12, weight: COMMON },
      { pokemonId: 21, name: 'Spearow', minLevel: 8, maxLevel: 12, weight: UNCOMMON },
      { pokemonId: 27, name: 'Sandshrew', minLevel: 8, maxLevel: 12, weight: UNCOMMON },
    ],
    itemFinds: ['potion', 'poke-ball'],
  },

  'ilex-forest': {
    encounterRate: 0.65,
    slots: [
      { pokemonId: 10, name: 'Caterpie', minLevel: 5, maxLevel: 8, weight: COMMON },
      { pokemonId: 13, name: 'Weedle', minLevel: 5, maxLevel: 8, weight: COMMON },
      { pokemonId: 11, name: 'Metapod', minLevel: 6, maxLevel: 9, weight: UNCOMMON },
      { pokemonId: 46, name: 'Paras', minLevel: 5, maxLevel: 8, weight: UNCOMMON },
      { pokemonId: 63, name: 'Abra', minLevel: 7, maxLevel: 9, weight: RARE },
      { pokemonId: 214, name: 'Heracross', minLevel: 10, maxLevel: 14, weight: VERY_RARE },
    ],
    itemFinds: ['poke-ball', 'potion', 'full-heal'],
  },

  'route-34': {
    encounterRate: 0.5,
    slots: [
      { pokemonId: 16, name: 'Pidgey', minLevel: 10, maxLevel: 14, weight: COMMON },
      { pokemonId: 19, name: 'Rattata', minLevel: 10, maxLevel: 14, weight: COMMON },
      { pokemonId: 48, name: 'Venonat', minLevel: 10, maxLevel: 14, weight: UNCOMMON },
      { pokemonId: 173, name: 'Cleffa', minLevel: 8, maxLevel: 12, weight: RARE },
      { pokemonId: 175, name: 'Togepi', minLevel: 10, maxLevel: 12, weight: VERY_RARE },
    ],
    itemFinds: ['super-potion', 'poke-ball'],
  },

  'route-35': {
    encounterRate: 0.5,
    slots: [
      { pokemonId: 16, name: 'Pidgey', minLevel: 12, maxLevel: 16, weight: COMMON },
      { pokemonId: 163, name: 'Hoothoot', minLevel: 12, maxLevel: 16, weight: UNCOMMON },
      { pokemonId: 56, name: 'Mankey', minLevel: 12, maxLevel: 16, weight: UNCOMMON },
      { pokemonId: 83, name: 'Farfetch’d', minLevel: 12, maxLevel: 16, weight: RARE },
      { pokemonId: 187, name: 'Hoppip', minLevel: 12, maxLevel: 16, weight: UNCOMMON },
    ],
    itemFinds: ['super-potion', 'great-ball'],
  },

  'national-park': {
    encounterRate: 0.7,
    slots: [
      { pokemonId: 10, name: 'Caterpie', minLevel: 12, maxLevel: 16, weight: COMMON },
      { pokemonId: 13, name: 'Weedle', minLevel: 12, maxLevel: 16, weight: COMMON },
      { pokemonId: 46, name: 'Paras', minLevel: 12, maxLevel: 16, weight: UNCOMMON },
      { pokemonId: 48, name: 'Venonat', minLevel: 12, maxLevel: 16, weight: UNCOMMON },
      { pokemonId: 193, name: 'Yanma', minLevel: 12, maxLevel: 16, weight: RARE },
      { pokemonId: 214, name: 'Heracross', minLevel: 14, maxLevel: 18, weight: VERY_RARE },
      { pokemonId: 123, name: 'Scyther', minLevel: 14, maxLevel: 18, weight: VERY_RARE },
    ],
    itemFinds: ['great-ball', 'super-potion', 'full-heal'],
  },

  'route-36': {
    encounterRate: 0.5,
    slots: [
      { pokemonId: 16, name: 'Pidgey', minLevel: 12, maxLevel: 16, weight: COMMON },
      { pokemonId: 161, name: 'Sentret', minLevel: 12, maxLevel: 16, weight: UNCOMMON },
      { pokemonId: 43, name: 'Oddish', minLevel: 12, maxLevel: 16, weight: UNCOMMON },
      { pokemonId: 191, name: 'Sunkern', minLevel: 12, maxLevel: 16, weight: UNCOMMON },
    ],
    itemFinds: ['super-potion', 'great-ball'],
  },

  'route-37': {
    encounterRate: 0.5,
    slots: [
      { pokemonId: 16, name: 'Pidgey', minLevel: 14, maxLevel: 18, weight: COMMON },
      { pokemonId: 191, name: 'Sunkern', minLevel: 14, maxLevel: 18, weight: UNCOMMON },
      { pokemonId: 37, name: 'Vulpix', minLevel: 14, maxLevel: 18, weight: RARE },
      { pokemonId: 234, name: 'Stantler', minLevel: 14, maxLevel: 18, weight: RARE },
    ],
    itemFinds: ['super-potion', 'great-ball'],
  },

  'burned-tower': {
    encounterRate: 0.6,
    slots: [
      { pokemonId: 19, name: 'Rattata', minLevel: 14, maxLevel: 18, weight: COMMON },
      { pokemonId: 41, name: 'Zubat', minLevel: 14, maxLevel: 18, weight: COMMON },
      { pokemonId: 109, name: 'Koffing', minLevel: 14, maxLevel: 18, weight: UNCOMMON },
      { pokemonId: 218, name: 'Slugma', minLevel: 14, maxLevel: 18, weight: UNCOMMON },
    ],
    itemFinds: ['super-potion', 'great-ball'],
  },

  'route-38': {
    encounterRate: 0.5,
    slots: [
      { pokemonId: 52, name: 'Meowth', minLevel: 16, maxLevel: 20, weight: COMMON },
      { pokemonId: 161, name: 'Sentret', minLevel: 16, maxLevel: 20, weight: UNCOMMON },
      { pokemonId: 128, name: 'Tauros', minLevel: 16, maxLevel: 20, weight: RARE },
      { pokemonId: 241, name: 'Miltank', minLevel: 16, maxLevel: 20, weight: RARE },
    ],
    itemFinds: ['super-potion', 'great-ball'],
  },

  'route-39': {
    encounterRate: 0.5,
    slots: [
      { pokemonId: 52, name: 'Meowth', minLevel: 16, maxLevel: 20, weight: COMMON },
      { pokemonId: 209, name: 'Snubbull', minLevel: 16, maxLevel: 20, weight: UNCOMMON },
      { pokemonId: 241, name: 'Miltank', minLevel: 16, maxLevel: 20, weight: RARE },
    ],
    itemFinds: ['super-potion', 'great-ball'],
  },

  'route-40': {
    encounterRate: 0.6,
    slots: [
      { pokemonId: 72, name: 'Tentacool', minLevel: 18, maxLevel: 24, weight: COMMON },
      { pokemonId: 129, name: 'Magikarp', minLevel: 10, maxLevel: 20, weight: UNCOMMON },
      { pokemonId: 226, name: 'Mantine', minLevel: 20, maxLevel: 24, weight: RARE },
    ],
    itemFinds: ['great-ball', 'super-potion'],
  },

  'route-41': {
    encounterRate: 0.6,
    slots: [
      { pokemonId: 72, name: 'Tentacool', minLevel: 20, maxLevel: 26, weight: COMMON },
      { pokemonId: 129, name: 'Magikarp', minLevel: 10, maxLevel: 20, weight: UNCOMMON },
      { pokemonId: 226, name: 'Mantine', minLevel: 22, maxLevel: 26, weight: RARE },
    ],
    itemFinds: ['great-ball', 'hyper-potion'],
  },

  'whirl-islands': {
    encounterRate: 0.65,
    slots: [
      { pokemonId: 41, name: 'Zubat', minLevel: 22, maxLevel: 28, weight: COMMON },
      { pokemonId: 42, name: 'Golbat', minLevel: 24, maxLevel: 30, weight: UNCOMMON },
      { pokemonId: 90, name: 'Shellder', minLevel: 22, maxLevel: 28, weight: UNCOMMON },
      { pokemonId: 211, name: 'Qwilfish', minLevel: 22, maxLevel: 28, weight: RARE },
    ],
    itemFinds: ['ultra-ball', 'hyper-potion'],
  },

  'route-42': {
    encounterRate: 0.5,
    slots: [
      { pokemonId: 21, name: 'Spearow', minLevel: 22, maxLevel: 26, weight: COMMON },
      { pokemonId: 161, name: 'Sentret', minLevel: 22, maxLevel: 26, weight: UNCOMMON },
      { pokemonId: 183, name: 'Marill', minLevel: 22, maxLevel: 26, weight: UNCOMMON },
      { pokemonId: 216, name: 'Teddiursa', minLevel: 22, maxLevel: 26, weight: RARE },
    ],
    itemFinds: ['hyper-potion', 'great-ball'],
  },

  'mt-mortar': {
    encounterRate: 0.65,
    slots: [
      { pokemonId: 41, name: 'Zubat', minLevel: 24, maxLevel: 30, weight: COMMON },
      { pokemonId: 74, name: 'Geodude', minLevel: 24, maxLevel: 30, weight: COMMON },
      { pokemonId: 66, name: 'Machop', minLevel: 24, maxLevel: 30, weight: UNCOMMON },
      { pokemonId: 67, name: 'Machoke', minLevel: 26, maxLevel: 32, weight: RARE },
      { pokemonId: 236, name: 'Tyrogue', minLevel: 24, maxLevel: 28, weight: VERY_RARE },
    ],
    itemFinds: ['hyper-potion', 'ultra-ball', 'full-heal'],
  },

  'lake-of-rage': {
    encounterRate: 0.6,
    slots: [
      { pokemonId: 129, name: 'Magikarp', minLevel: 15, maxLevel: 25, weight: COMMON },
      { pokemonId: 130, name: 'Gyarados', minLevel: 28, maxLevel: 34, weight: UNCOMMON },
      { pokemonId: 183, name: 'Marill', minLevel: 26, maxLevel: 30, weight: UNCOMMON },
    ],
    itemFinds: ['ultra-ball', 'hyper-potion'],
  },

  'route-44': {
    encounterRate: 0.5,
    slots: [
      { pokemonId: 43, name: 'Oddish', minLevel: 28, maxLevel: 32, weight: COMMON },
      { pokemonId: 114, name: 'Tangela', minLevel: 28, maxLevel: 32, weight: UNCOMMON },
      { pokemonId: 211, name: 'Qwilfish', minLevel: 28, maxLevel: 32, weight: UNCOMMON },
      { pokemonId: 44, name: 'Gloom', minLevel: 30, maxLevel: 34, weight: RARE },
    ],
    itemFinds: ['hyper-potion', 'ultra-ball'],
  },

  'ice-path': {
    encounterRate: 0.65,
    slots: [
      { pokemonId: 41, name: 'Zubat', minLevel: 30, maxLevel: 34, weight: COMMON },
      { pokemonId: 220, name: 'Swinub', minLevel: 30, maxLevel: 34, weight: COMMON },
      { pokemonId: 42, name: 'Golbat', minLevel: 32, maxLevel: 36, weight: UNCOMMON },
      { pokemonId: 215, name: 'Sneasel', minLevel: 32, maxLevel: 36, weight: RARE },
      { pokemonId: 225, name: 'Delibird', minLevel: 30, maxLevel: 34, weight: RARE },
    ],
    itemFinds: ['ultra-ball', 'full-restore', 'full-heal'],
  },

  'dragons-den': {
    encounterRate: 0.6,
    slots: [
      { pokemonId: 41, name: 'Zubat', minLevel: 32, maxLevel: 38, weight: COMMON },
      { pokemonId: 42, name: 'Golbat', minLevel: 34, maxLevel: 40, weight: UNCOMMON },
      { pokemonId: 183, name: 'Marill', minLevel: 32, maxLevel: 36, weight: UNCOMMON },
      { pokemonId: 147, name: 'Dratini', minLevel: 32, maxLevel: 38, weight: RARE },
      { pokemonId: 148, name: 'Dragonair', minLevel: 36, maxLevel: 40, weight: VERY_RARE },
    ],
    itemFinds: ['ultra-ball', 'full-restore'],
  },

  'route-45': {
    encounterRate: 0.55,
    slots: [
      { pokemonId: 74, name: 'Geodude', minLevel: 32, maxLevel: 38, weight: COMMON },
      { pokemonId: 75, name: 'Graveler', minLevel: 34, maxLevel: 40, weight: UNCOMMON },
      { pokemonId: 231, name: 'Phanpy', minLevel: 32, maxLevel: 38, weight: UNCOMMON },
      { pokemonId: 207, name: 'Gligar', minLevel: 32, maxLevel: 38, weight: RARE },
      { pokemonId: 232, name: 'Donphan', minLevel: 36, maxLevel: 40, weight: RARE },
    ],
    itemFinds: ['ultra-ball', 'full-restore'],
  },
};
