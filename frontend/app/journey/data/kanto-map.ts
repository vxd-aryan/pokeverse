// ============================================================
// JOURNEY — KANTO OVERWORLD MAP
// ============================================================
// Node positions describe the classic Kanto layout in an SVG
// coordinate space (viewBox 0 0 900 780). North is up, so the
// east/west/north/south relationships of the real region hold:
// Pallet in the south-west, Pewter in the north-west, Cerulean
// in the north-east, Fuchsia and Cinnabar along the south coast.
//
// This is pure data. The map page renders it; nothing about
// gym order, badges or difficulty lives here.
// ============================================================

export type NodeKind = 'town' | 'city' | 'route' | 'forest' | 'cave' | 'water' | 'landmark';

export interface MapNode {
  id: string;
  label: string;
  kind: NodeKind;
  x: number;
  y: number;
  /**
   * Number of gyms that must be cleared before this node is
   * reachable. 0 = available from the start of the Journey.
   * This gates *travel*, which is separate from gym unlocking
   * (gyms are strictly sequential by their own order).
   */
  unlocksAfterGym: number;
  /** Gym id sitting in this node, if any. */
  gymId?: string;
  /** Notable landmark inside this node, shown as a sub-label. */
  landmark?: string;
  /** Short flavour line shown when the node is focused. */
  blurb?: string;
}

export interface MapEdge {
  from: string;
  to: string;
  /** Sea crossing — drawn as a dashed line. */
  water?: boolean;
}

// --- Nodes -------------------------------------------------

export const KANTO_MAP_NODES: MapNode[] = [
  // --- South-west: the starting stretch ---
  {
    id: 'pallet',
    label: 'Pallet Town',
    kind: 'town',
    x: 150, y: 500,
    unlocksAfterGym: 0,
    blurb: 'A quiet hometown with an unspoiled and peaceful atmosphere.',
  },
  { id: 'route-1', label: 'Route 1', kind: 'route', x: 150, y: 420, unlocksAfterGym: 0 },
  {
    id: 'viridian',
    label: 'Viridian City',
    kind: 'city',
    x: 150, y: 330,
    unlocksAfterGym: 0,
    gymId: 'viridian',
    blurb: 'The eternally green paradise. Its gym has stood shut for years.',
  },
  { id: 'route-2', label: 'Route 2', kind: 'route', x: 150, y: 245, unlocksAfterGym: 0 },
  {
    id: 'viridian-forest',
    label: 'Viridian Forest',
    kind: 'forest',
    x: 150, y: 165,
    unlocksAfterGym: 0,
    landmark: 'Viridian Forest',
    blurb: 'A natural maze of towering trees. Bug Pokémon thrive in the gloom.',
  },

  // --- North-west to north-east: Pewter across to Cerulean ---
  {
    id: 'pewter',
    label: 'Pewter City',
    kind: 'city',
    x: 150, y: 80,
    unlocksAfterGym: 0,
    gymId: 'pewter',
    blurb: 'A stone-grey city at the foot of the mountains.',
  },
  { id: 'route-3', label: 'Route 3', kind: 'route', x: 255, y: 80, unlocksAfterGym: 1 },
  {
    id: 'mt-moon',
    label: 'Mt. Moon',
    kind: 'cave',
    x: 355, y: 80,
    unlocksAfterGym: 1,
    landmark: 'Mt. Moon',
    blurb: 'A cavern where meteorites are said to have fallen long ago.',
  },
  { id: 'route-4', label: 'Route 4', kind: 'route', x: 455, y: 80, unlocksAfterGym: 1 },
  {
    id: 'cerulean',
    label: 'Cerulean City',
    kind: 'city',
    x: 555, y: 80,
    unlocksAfterGym: 1,
    gymId: 'cerulean',
    blurb: 'A mysterious blue aura surrounds it.',
  },

  // --- Central spine: Cerulean south to Vermilion ---
  { id: 'route-5', label: 'Route 5', kind: 'route', x: 555, y: 180, unlocksAfterGym: 2 },
  {
    id: 'saffron',
    label: 'Saffron City',
    kind: 'city',
    x: 555, y: 280,
    unlocksAfterGym: 2,
    gymId: 'saffron',
    landmark: 'Silph Co.',
    blurb: 'A shining, golden hub of commerce. Silph Co. towers over it.',
  },
  { id: 'route-6', label: 'Route 6', kind: 'route', x: 555, y: 380, unlocksAfterGym: 2 },
  {
    id: 'vermilion',
    label: 'Vermilion City',
    kind: 'city',
    x: 555, y: 470,
    unlocksAfterGym: 2,
    gymId: 'vermilion',
    blurb: 'The port of exquisite sunsets.',
  },

  // --- West of Saffron ---
  { id: 'route-7', label: 'Route 7', kind: 'route', x: 455, y: 280, unlocksAfterGym: 3 },
  {
    id: 'celadon',
    label: 'Celadon City',
    kind: 'city',
    x: 355, y: 280,
    unlocksAfterGym: 3,
    gymId: 'celadon',
    blurb: 'The city of rainbow dreams.',
  },

  // --- North-east arc: Rock Tunnel down to Lavender ---
  { id: 'route-9', label: 'Route 9', kind: 'route', x: 655, y: 80, unlocksAfterGym: 3 },
  {
    id: 'rock-tunnel',
    label: 'Rock Tunnel',
    kind: 'cave',
    x: 750, y: 115,
    unlocksAfterGym: 3,
    landmark: 'Rock Tunnel',
    blurb: 'Pitch black inside. No light reaches the tunnel floor.',
  },
  { id: 'route-10', label: 'Route 10', kind: 'route', x: 790, y: 195, unlocksAfterGym: 3 },
  {
    id: 'lavender',
    label: 'Lavender Town',
    kind: 'town',
    x: 790, y: 280,
    unlocksAfterGym: 3,
    landmark: 'Pokémon Tower',
    blurb: 'The noble purple town. Pokémon Tower rises above the rooftops.',
  },
  { id: 'route-8', label: 'Route 8', kind: 'route', x: 672, y: 280, unlocksAfterGym: 3 },

  // --- South-east coast: down to Fuchsia ---
  { id: 'route-12', label: 'Route 12', kind: 'route', x: 790, y: 380, unlocksAfterGym: 4 },
  { id: 'route-13', label: 'Route 13', kind: 'route', x: 760, y: 470, unlocksAfterGym: 4 },
  { id: 'route-14', label: 'Route 14', kind: 'route', x: 672, y: 540, unlocksAfterGym: 4 },
  { id: 'route-15', label: 'Route 15', kind: 'route', x: 565, y: 592, unlocksAfterGym: 4 },
  {
    id: 'safari-zone',
    label: 'Safari Zone',
    kind: 'landmark',
    x: 455, y: 500,
    unlocksAfterGym: 4,
    landmark: 'Safari Zone',
    blurb: 'A vast reserve where rare Pokémon roam free.',
  },
  {
    id: 'fuchsia',
    label: 'Fuchsia City',
    kind: 'city',
    x: 455, y: 592,
    unlocksAfterGym: 4,
    gymId: 'fuchsia',
    blurb: 'Behold! It is passion pink!',
  },

  // --- South-west sea route: out to Cinnabar ---
  { id: 'route-19', label: 'Route 19', kind: 'water', x: 360, y: 645, unlocksAfterGym: 6 },
  { id: 'route-20', label: 'Route 20', kind: 'water', x: 270, y: 688, unlocksAfterGym: 6 },
  {
    id: 'seafoam',
    label: 'Seafoam Islands',
    kind: 'cave',
    x: 185, y: 700,
    unlocksAfterGym: 6,
    landmark: 'Seafoam Islands',
    blurb: 'Twin islands hollowed out by the relentless current.',
  },
  {
    id: 'cinnabar',
    label: 'Cinnabar Island',
    kind: 'city',
    x: 90, y: 700,
    unlocksAfterGym: 6,
    gymId: 'cinnabar',
    landmark: 'Pokémon Mansion',
    blurb: 'The fiery town of burning desire. A derelict mansion sits on its edge.',
  },
  { id: 'route-21', label: 'Route 21', kind: 'water', x: 115, y: 600, unlocksAfterGym: 6 },
];

// --- Edges: the travel network -----------------------------

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

// --- Lookups -----------------------------------------------

export const KANTO_NODE_BY_ID: Record<string, MapNode> = Object.fromEntries(
  KANTO_MAP_NODES.map((n) => [n.id, n])
);

/** Every landmark called out on the map, for the landmark legend. */
export const KANTO_LANDMARKS = KANTO_MAP_NODES.filter((n) => n.landmark).map((n) => ({
  id: n.id,
  name: n.landmark!,
  location: n.label,
  unlocksAfterGym: n.unlocksAfterGym,
}));

/** Where the player marker sits, given how many gyms are cleared. */
export function playerLocationForProgress(
  completedGymCount: number,
  gymLocationIds: string[]
): string {
  if (completedGymCount === 0) return 'pallet';
  if (completedGymCount >= gymLocationIds.length) {
    return gymLocationIds[gymLocationIds.length - 1];
  }
  // Standing at the town whose gym is next.
  return gymLocationIds[completedGymCount];
}

export function isNodeReachable(node: MapNode, completedGymCount: number): boolean {
  return completedGymCount >= node.unlocksAfterGym;
}

/** Kind -> palette entry used by the map renderer. */
export const NODE_STYLE: Record<NodeKind, { fill: string; stroke: string; label: string }> = {
  town:     { fill: '#d6c9a8', stroke: '#8a7a55', label: 'Town' },
  city:     { fill: '#e2e8f0', stroke: '#94a3b8', label: 'City' },
  route:    { fill: '#84cc16', stroke: '#4d7c0f', label: 'Route' },
  forest:   { fill: '#166534', stroke: '#052e16', label: 'Forest' },
  cave:     { fill: '#78716c', stroke: '#292524', label: 'Cave' },
  water:    { fill: '#38bdf8', stroke: '#0369a1', label: 'Sea Route' },
  landmark: { fill: '#c084fc', stroke: '#6b21a8', label: 'Landmark' },
};
