// ============================================================
// KANTO — OVERWORLD MAP
// ============================================================
// Node positions describe the classic Kanto layout. North is up,
// so the real region's east/west/north/south relationships hold:
// Pallet in the south-west, Pewter in the north-west, Cerulean in
// the north-east, Fuchsia and Cinnabar along the south coast.
// ============================================================

import type { MapNode, MapEdge, MapCanvas } from '../../types';

export const KANTO_CANVAS: MapCanvas = {
  viewBox: '0 0 900 780',
  sea: '#0c4a6e',
  land: [
    {
      d: 'M 60 30 L 620 30 L 700 60 L 840 130 L 860 330 L 830 520 L 700 600 L 520 640 L 400 660 L 300 640 L 230 560 L 210 430 L 190 300 L 120 240 L 70 140 Z',
      fill: '#15803d', stroke: '#14532d',
    },
    // Seafoam Islands
    { ellipse: { cx: 185, cy: 700, rx: 46, ry: 30 }, fill: '#15803d', stroke: '#14532d' },
    // Cinnabar — volcanic, so it reads red
    { ellipse: { cx: 90, cy: 700, rx: 48, ry: 32 }, fill: '#7f1d1d', stroke: '#450a0a' },
  ],
};

export const KANTO_MAP_NODES: MapNode[] = [
  // --- South-west: the starting stretch ---
  {
    id: 'pallet',
    label: 'Pallet Town',
    kind: 'town',
    isTown: true,
    x: 150, y: 500,
    unlocksAfterChallenge: 0,
    blurb: 'A quiet hometown with an unspoiled and peaceful atmosphere.',
  },
  { id: 'route-1', label: 'Route 1', kind: 'route', x: 150, y: 420, unlocksAfterChallenge: 0 },
  {
    id: 'viridian',
    label: 'Viridian City',
    kind: 'city',
    isTown: true,
    x: 150, y: 330,
    unlocksAfterChallenge: 0,
    challengeId: 'viridian',
    blurb: 'The eternally green paradise. Its gym has stood shut for years.',
  },
  { id: 'route-2', label: 'Route 2', kind: 'route', x: 150, y: 245, unlocksAfterChallenge: 0 },
  {
    id: 'viridian-forest',
    label: 'Viridian Forest',
    kind: 'forest',
    x: 150, y: 165,
    unlocksAfterChallenge: 0,
    landmark: 'Viridian Forest',
    blurb: 'A natural maze of towering trees. Bug Pokémon thrive in the gloom.',
  },

  // --- North-west to north-east: Pewter across to Cerulean ---
  {
    id: 'pewter',
    label: 'Pewter City',
    kind: 'city',
    isTown: true,
    x: 150, y: 80,
    unlocksAfterChallenge: 0,
    challengeId: 'pewter',
    blurb: 'A stone-grey city at the foot of the mountains.',
  },
  { id: 'route-3', label: 'Route 3', kind: 'route', x: 255, y: 80, unlocksAfterChallenge: 1 },
  {
    id: 'mt-moon',
    label: 'Mt. Moon',
    kind: 'cave',
    x: 355, y: 80,
    unlocksAfterChallenge: 1,
    landmark: 'Mt. Moon',
    blurb: 'A cavern where meteorites are said to have fallen long ago.',
  },
  { id: 'route-4', label: 'Route 4', kind: 'route', x: 455, y: 80, unlocksAfterChallenge: 1 },
  {
    id: 'cerulean',
    label: 'Cerulean City',
    kind: 'city',
    isTown: true,
    x: 555, y: 80,
    unlocksAfterChallenge: 1,
    challengeId: 'cerulean',
    blurb: 'A mysterious blue aura surrounds it.',
  },

  // --- Central spine: Cerulean south to Vermilion ---
  { id: 'route-5', label: 'Route 5', kind: 'route', x: 555, y: 180, unlocksAfterChallenge: 2 },
  {
    id: 'saffron',
    label: 'Saffron City',
    kind: 'city',
    isTown: true,
    x: 555, y: 280,
    unlocksAfterChallenge: 2,
    challengeId: 'saffron',
    landmark: 'Silph Co.',
    blurb: 'A shining, golden hub of commerce. Silph Co. towers over it.',
  },
  { id: 'route-6', label: 'Route 6', kind: 'route', x: 555, y: 380, unlocksAfterChallenge: 2 },
  {
    id: 'vermilion',
    label: 'Vermilion City',
    kind: 'city',
    isTown: true,
    x: 555, y: 470,
    unlocksAfterChallenge: 2,
    challengeId: 'vermilion',
    blurb: 'The port of exquisite sunsets.',
  },

  // --- West of Saffron ---
  { id: 'route-7', label: 'Route 7', kind: 'route', x: 455, y: 280, unlocksAfterChallenge: 3 },
  {
    id: 'celadon',
    label: 'Celadon City',
    kind: 'city',
    isTown: true,
    x: 355, y: 280,
    unlocksAfterChallenge: 3,
    challengeId: 'celadon',
    blurb: 'The city of rainbow dreams.',
  },

  // --- North-east arc: Rock Tunnel down to Lavender ---
  { id: 'route-9', label: 'Route 9', kind: 'route', x: 655, y: 80, unlocksAfterChallenge: 3 },
  {
    id: 'rock-tunnel',
    label: 'Rock Tunnel',
    kind: 'cave',
    x: 750, y: 115,
    unlocksAfterChallenge: 3,
    landmark: 'Rock Tunnel',
    blurb: 'Pitch black inside. No light reaches the tunnel floor.',
  },
  { id: 'route-10', label: 'Route 10', kind: 'route', x: 790, y: 195, unlocksAfterChallenge: 3 },
  {
    id: 'lavender',
    label: 'Lavender Town',
    kind: 'town',
    isTown: true,
    x: 790, y: 280,
    unlocksAfterChallenge: 3,
    landmark: 'Pokémon Tower',
    blurb: 'The noble purple town. Pokémon Tower rises above the rooftops.',
  },
  { id: 'route-8', label: 'Route 8', kind: 'route', x: 672, y: 280, unlocksAfterChallenge: 3 },

  // --- South-east coast: down to Fuchsia ---
  { id: 'route-12', label: 'Route 12', kind: 'route', x: 790, y: 380, unlocksAfterChallenge: 4 },
  { id: 'route-13', label: 'Route 13', kind: 'route', x: 760, y: 470, unlocksAfterChallenge: 4 },
  { id: 'route-14', label: 'Route 14', kind: 'route', x: 672, y: 540, unlocksAfterChallenge: 4 },
  { id: 'route-15', label: 'Route 15', kind: 'route', x: 565, y: 592, unlocksAfterChallenge: 4 },
  {
    id: 'safari-zone',
    label: 'Safari Zone',
    kind: 'landmark',
    x: 455, y: 500,
    unlocksAfterChallenge: 4,
    landmark: 'Safari Zone',
    blurb: 'A vast reserve where rare Pokémon roam free.',
  },
  {
    id: 'fuchsia',
    label: 'Fuchsia City',
    kind: 'city',
    isTown: true,
    x: 455, y: 592,
    unlocksAfterChallenge: 4,
    challengeId: 'fuchsia',
    blurb: 'Behold! It is passion pink!',
  },

  // --- South-west sea route: out to Cinnabar ---
  { id: 'route-19', label: 'Route 19', kind: 'water', x: 360, y: 645, unlocksAfterChallenge: 6 },
  { id: 'route-20', label: 'Route 20', kind: 'water', x: 270, y: 688, unlocksAfterChallenge: 6 },
  {
    id: 'seafoam',
    label: 'Seafoam Islands',
    kind: 'cave',
    x: 185, y: 700,
    unlocksAfterChallenge: 6,
    landmark: 'Seafoam Islands',
    blurb: 'Twin islands hollowed out by the relentless current.',
  },
  {
    id: 'cinnabar',
    label: 'Cinnabar Island',
    kind: 'city',
    isTown: true,
    x: 90, y: 700,
    unlocksAfterChallenge: 6,
    challengeId: 'cinnabar',
    landmark: 'Pokémon Mansion',
    blurb: 'The fiery town of burning desire. A derelict mansion sits on its edge.',
  },
  { id: 'route-21', label: 'Route 21', kind: 'water', x: 115, y: 600, unlocksAfterChallenge: 6 },
];

export const KANTO_MAP_EDGES: MapEdge[] = [
  // Opening stretch, south to north
  { from: 'pallet', to: 'route-1' },
  { from: 'route-1', to: 'viridian' },
  { from: 'viridian', to: 'route-2' },
  { from: 'route-2', to: 'viridian-forest' },
  { from: 'viridian-forest', to: 'pewter' },

  // Pewter east to Cerulean
  { from: 'pewter', to: 'route-3' },
  { from: 'route-3', to: 'mt-moon' },
  { from: 'mt-moon', to: 'route-4' },
  { from: 'route-4', to: 'cerulean' },

  // Cerulean south through Saffron to Vermilion
  { from: 'cerulean', to: 'route-5' },
  { from: 'route-5', to: 'saffron' },
  { from: 'saffron', to: 'route-6' },
  { from: 'route-6', to: 'vermilion' },

  // Saffron west to Celadon
  { from: 'saffron', to: 'route-7' },
  { from: 'route-7', to: 'celadon' },

  // Cerulean east, through Rock Tunnel, down to Lavender
  { from: 'cerulean', to: 'route-9' },
  { from: 'route-9', to: 'rock-tunnel' },
  { from: 'rock-tunnel', to: 'route-10' },
  { from: 'route-10', to: 'lavender' },

  // Saffron east to Lavender
  { from: 'saffron', to: 'route-8' },
  { from: 'route-8', to: 'lavender' },

  // Lavender south along the coast to Fuchsia
  { from: 'lavender', to: 'route-12' },
  { from: 'route-12', to: 'route-13' },
  { from: 'route-13', to: 'route-14' },
  { from: 'route-14', to: 'route-15' },
  { from: 'route-15', to: 'fuchsia' },
  { from: 'fuchsia', to: 'safari-zone' },

  // Fuchsia west by sea to Cinnabar
  { from: 'fuchsia', to: 'route-19', water: true },
  { from: 'route-19', to: 'route-20', water: true },
  { from: 'route-20', to: 'seafoam', water: true },
  { from: 'seafoam', to: 'cinnabar', water: true },

  // Cinnabar north by sea back to Pallet — closes the loop
  { from: 'cinnabar', to: 'route-21', water: true },
  { from: 'route-21', to: 'pallet', water: true },
];
