// ============================================================
// JOHTO — OVERWORLD MAP
// ============================================================
// Johto's real geography: New Bark in the far east, the road
// running west through Cherrygrove and Violet, south to Azalea
// and across to Goldenrod in the centre, north to Ecruteak, then
// west to Olivine and over the sea to Cianwood. Mahogany sits in
// the north-east and Blackthorn behind the mountains in the far
// east, which is why the route loops back on itself.
//
// The map is mirrored from Kanto's: Johto's start is east, not
// west, and the player travels right-to-left for the first half.
// ============================================================

import type { MapNode, MapEdge, MapCanvas } from '../../types';

export const JOHTO_CANVAS: MapCanvas = {
  viewBox: '0 0 900 780',
  sea: '#0c4a6e',
  land: [
    {
      d: 'M 70 180 L 180 120 L 330 90 L 520 70 L 700 90 L 820 150 L 850 320 L 810 470 L 700 560 L 540 610 L 380 600 L 250 540 L 150 440 L 90 320 Z',
      fill: '#15803d', stroke: '#14532d',
    },
    // Cianwood sits alone off the west coast
    { ellipse: { cx: 95, cy: 520, rx: 55, ry: 34 }, fill: '#15803d', stroke: '#14532d' },
    // Whirl Islands
    { ellipse: { cx: 215, cy: 585, rx: 30, ry: 20 }, fill: '#166534', stroke: '#052e16' },
  ],
};

export const JOHTO_MAP_NODES: MapNode[] = [
  // --- The opening road, east to west ---
  {
    id: 'new-bark',
    label: 'New Bark Town',
    kind: 'town',
    isTown: true,
    x: 790, y: 300,
    unlocksAfterChallenge: 0,
    blurb: 'The town where the winds of a new beginning blow.',
  },
  { id: 'route-29', label: 'Route 29', kind: 'route', x: 700, y: 300, unlocksAfterChallenge: 0 },
  {
    id: 'cherrygrove',
    label: 'Cherrygrove City',
    kind: 'city',
    isTown: true,
    x: 615, y: 300,
    unlocksAfterChallenge: 0,
    blurb: 'The city of cute, fragrant flowers.',
  },
  { id: 'route-30', label: 'Route 30', kind: 'route', x: 615, y: 220, unlocksAfterChallenge: 0 },
  { id: 'route-31', label: 'Route 31', kind: 'route', x: 540, y: 180, unlocksAfterChallenge: 0 },
  {
    id: 'dark-cave',
    label: 'Dark Cave',
    kind: 'cave',
    x: 625, y: 160,
    unlocksAfterChallenge: 0,
    landmark: 'Dark Cave',
    blurb: 'A pitch-black cavern cutting under the mountains.',
  },
  {
    id: 'violet',
    label: 'Violet City',
    kind: 'city',
    isTown: true,
    x: 455, y: 180,
    unlocksAfterChallenge: 0,
    challengeId: 'violet',
    landmark: 'Sprout Tower',
    blurb: 'The city of nostalgic scents. Sprout Tower sways above it.',
  },

  // --- South to Azalea ---
  { id: 'route-32', label: 'Route 32', kind: 'route', x: 455, y: 270, unlocksAfterChallenge: 1 },
  {
    id: 'union-cave',
    label: 'Union Cave',
    kind: 'cave',
    x: 455, y: 350,
    unlocksAfterChallenge: 1,
    landmark: 'Union Cave',
    blurb: 'Damp and echoing. Something is said to cry out here on Fridays.',
  },
  { id: 'route-33', label: 'Route 33', kind: 'route', x: 400, y: 410, unlocksAfterChallenge: 1 },
  {
    id: 'azalea',
    label: 'Azalea Town',
    kind: 'town',
    isTown: true,
    x: 320, y: 440,
    unlocksAfterChallenge: 1,
    challengeId: 'azalea',
    landmark: 'Slowpoke Well',
    blurb: 'Where people and Pokémon live in happy harmony. Slowpoke Well lies beneath.',
  },
  {
    id: 'ilex-forest',
    label: 'Ilex Forest',
    kind: 'forest',
    x: 250, y: 400,
    unlocksAfterChallenge: 2,
    landmark: 'Ilex Forest',
    blurb: 'A protected wood, guarded by its shrine and shadowed by ancient trees.',
  },
  { id: 'route-34', label: 'Route 34', kind: 'route', x: 250, y: 320, unlocksAfterChallenge: 2 },

  // --- Goldenrod, the heart of the region ---
  {
    id: 'goldenrod',
    label: 'Goldenrod City',
    kind: 'city',
    isTown: true,
    x: 250, y: 250,
    unlocksAfterChallenge: 2,
    challengeId: 'goldenrod',
    landmark: 'Radio Tower',
    blurb: 'The festive city of opulent charm. The Radio Tower broadcasts across Johto.',
  },
  { id: 'route-35', label: 'Route 35', kind: 'route', x: 250, y: 175, unlocksAfterChallenge: 3 },
  {
    id: 'national-park',
    label: 'National Park',
    kind: 'landmark',
    x: 320, y: 140,
    unlocksAfterChallenge: 3,
    landmark: 'National Park',
    blurb: 'Where the Bug-Catching Contest is held, and nobody minds the noise.',
  },
  { id: 'route-36', label: 'Route 36', kind: 'route', x: 330, y: 110, unlocksAfterChallenge: 3 },
  { id: 'route-37', label: 'Route 37', kind: 'route', x: 255, y: 105, unlocksAfterChallenge: 3 },

  // --- Ecruteak and the towers ---
  {
    id: 'ecruteak',
    label: 'Ecruteak City',
    kind: 'city',
    isTown: true,
    x: 180, y: 140,
    unlocksAfterChallenge: 3,
    challengeId: 'ecruteak',
    landmark: 'Bell Tower',
    blurb: 'A historical city. Bell Tower and the Burned Tower stand at its edges.',
  },
  {
    id: 'burned-tower',
    label: 'Burned Tower',
    kind: 'landmark',
    x: 130, y: 100,
    unlocksAfterChallenge: 3,
    landmark: 'Burned Tower',
    blurb: 'Charred beams and a hole in the floor. Three shapes bolt past you.',
  },

  // --- West to Olivine, then across the sea ---
  { id: 'route-38', label: 'Route 38', kind: 'route', x: 180, y: 230, unlocksAfterChallenge: 4 },
  { id: 'route-39', label: 'Route 39', kind: 'route', x: 180, y: 320, unlocksAfterChallenge: 4 },
  {
    id: 'olivine',
    label: 'Olivine City',
    kind: 'city',
    isTown: true,
    x: 180, y: 400,
    unlocksAfterChallenge: 4,
    challengeId: 'olivine',
    landmark: 'Glitter Lighthouse',
    blurb: 'The port closest to the sea. The Glitter Lighthouse has gone dim.',
  },
  { id: 'route-40', label: 'Route 40', kind: 'water', x: 140, y: 460, unlocksAfterChallenge: 4 },
  {
    id: 'whirl-islands',
    label: 'Whirl Islands',
    kind: 'cave',
    x: 215, y: 585,
    unlocksAfterChallenge: 5,
    landmark: 'Whirl Islands',
    blurb: 'Four islands around a whirlpool, hollow all the way down.',
  },
  { id: 'route-41', label: 'Route 41', kind: 'water', x: 120, y: 500, unlocksAfterChallenge: 4 },
  {
    id: 'cianwood',
    label: 'Cianwood City',
    kind: 'city',
    isTown: true,
    x: 95, y: 520,
    unlocksAfterChallenge: 4,
    challengeId: 'cianwood',
    blurb: 'A port surrounded by rough seas and rougher training.',
  },

  // --- North-east to Mahogany ---
  { id: 'route-42', label: 'Route 42', kind: 'route', x: 300, y: 85, unlocksAfterChallenge: 5 },
  {
    id: 'mt-mortar',
    label: 'Mt. Mortar',
    kind: 'cave',
    x: 375, y: 70,
    unlocksAfterChallenge: 5,
    landmark: 'Mt. Mortar',
    blurb: 'A vast cave system with a waterfall at its heart. Someone trains in there.',
  },
  {
    id: 'mahogany',
    label: 'Mahogany Town',
    kind: 'town',
    isTown: true,
    x: 460, y: 85,
    unlocksAfterChallenge: 5,
    challengeId: 'mahogany',
    blurb: 'Home of the ninja. A suspiciously busy souvenir shop fronts the place.',
  },
  {
    id: 'lake-of-rage',
    label: 'Lake of Rage',
    kind: 'water',
    x: 525, y: 55,
    unlocksAfterChallenge: 6,
    landmark: 'Lake of Rage',
    blurb: 'The water churns. Something red thrashes at its centre.',
  },
  { id: 'route-44', label: 'Route 44', kind: 'route', x: 560, y: 110, unlocksAfterChallenge: 6 },
  {
    id: 'ice-path',
    label: 'Ice Path',
    kind: 'cave',
    x: 640, y: 125,
    unlocksAfterChallenge: 6,
    landmark: 'Ice Path',
    blurb: 'Every surface is frozen. The floor gives way if you choose wrong.',
  },
  {
    id: 'blackthorn',
    label: 'Blackthorn City',
    kind: 'city',
    isTown: true,
    x: 715, y: 170,
    unlocksAfterChallenge: 6,
    challengeId: 'blackthorn',
    landmark: 'Dragon’s Den',
    blurb: 'A quiet mountain city. The Dragon’s Den lies behind the gym.',
  },
  {
    id: 'dragons-den',
    label: 'Dragon’s Den',
    kind: 'cave',
    x: 790, y: 180,
    unlocksAfterChallenge: 7,
    landmark: 'Dragon’s Den',
    blurb: 'A still pool deep in the rock, where the dragon clan tests its own.',
  },
  { id: 'route-45', label: 'Route 45', kind: 'route', x: 735, y: 260, unlocksAfterChallenge: 7 },
];

export const JOHTO_MAP_EDGES: MapEdge[] = [
  { from: 'new-bark', to: 'route-29' },
  { from: 'route-29', to: 'cherrygrove' },
  { from: 'cherrygrove', to: 'route-30' },
  { from: 'route-30', to: 'route-31' },
  { from: 'route-31', to: 'dark-cave' },
  { from: 'route-31', to: 'violet' },

  { from: 'violet', to: 'route-32' },
  { from: 'route-32', to: 'union-cave' },
  { from: 'union-cave', to: 'route-33' },
  { from: 'route-33', to: 'azalea' },
  { from: 'azalea', to: 'ilex-forest' },
  { from: 'ilex-forest', to: 'route-34' },
  { from: 'route-34', to: 'goldenrod' },

  { from: 'goldenrod', to: 'route-35' },
  { from: 'route-35', to: 'national-park' },
  { from: 'national-park', to: 'route-36' },
  { from: 'route-36', to: 'route-37' },
  { from: 'route-37', to: 'ecruteak' },
  { from: 'ecruteak', to: 'burned-tower' },

  { from: 'ecruteak', to: 'route-38' },
  { from: 'route-38', to: 'route-39' },
  { from: 'route-39', to: 'olivine' },
  { from: 'olivine', to: 'route-40', water: true },
  { from: 'route-40', to: 'route-41', water: true },
  { from: 'route-41', to: 'cianwood', water: true },
  { from: 'route-40', to: 'whirl-islands', water: true },

  { from: 'ecruteak', to: 'route-42' },
  { from: 'route-42', to: 'mt-mortar' },
  { from: 'mt-mortar', to: 'mahogany' },
  { from: 'mahogany', to: 'lake-of-rage' },
  { from: 'mahogany', to: 'route-44' },
  { from: 'route-44', to: 'ice-path' },
  { from: 'ice-path', to: 'blackthorn' },
  { from: 'blackthorn', to: 'dragons-den' },
  { from: 'blackthorn', to: 'route-45' },
];
