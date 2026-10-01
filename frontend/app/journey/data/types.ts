// ============================================================
// JOURNEY — SHARED REGION TYPES
// ============================================================
// Every region implements these interfaces and nothing else. The
// pages read a RegionData object from the registry and never
// import a specific region, which is what lets one set of routes
// serve all nine.
//
// The shapes deliberately cover more than Kanto needs, because
// later regions don't all use gyms: Alola runs island trials and
// grand trials, Galar runs stadium gyms, Paldea runs three
// parallel paths. Those are all "challenges" here, differing by
// `kind` and by what they award.
// ============================================================

// --- Pokémon in battle -------------------------------------

export interface JourneyMove {
  move_key: string;
  name: string;
  type: string;
  power: number;
  damage_class: string;
}

export type StatusCondition =
  | 'burn' | 'poison' | 'paralysis' | 'sleep' | 'freeze' | null;

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
  frontSpriteUrl?: string;
  status?: StatusCondition;
  /** 1 = base stage, 2 = middle, 3 = final. */
  evolutionStage?: number;
  /** Experience toward the NEXT level, not a lifetime total. */
  xp?: number;
  /** Remaining turns of sleep, or turns spent frozen. */
  statusTurns?: number;
  nickname?: string;
  caughtAt?: string;
}

/** A roster entry: species and level, before stats are built. */
export interface TeamMember {
  pokemonId: number;
  name: string;
  level: number;
}

// --- Challenges (gyms and their equivalents) ---------------

export type ChallengeKind =
  | 'gym'          // Kanto, Johto, Hoenn, Sinnoh, Unova, Kalos
  | 'trial'        // Alola island trial — a Totem Pokémon, not a trainer
  | 'grand-trial'  // Alola Kahuna
  | 'stadium'      // Galar — a gym leader with a Dynamax finale
  | 'titan'        // Paldea Path of Legends
  | 'star-base';   // Paldea Starfall Street

/**
 * One milestone battle. `kind` decides how it's presented and
 * what it awards; everything else is common.
 */
export interface Challenge {
  id: string;
  kind: ChallengeKind;
  /** 1-8 (or 1-n). Strictly sequential within a region. */
  order: number;
  /** Leader, Kahuna, Captain, or the Totem's name. */
  name: string;
  /** "Pewter Gym", "Verdant Cavern", "Motostoke Stadium". */
  venue: string;
  /** Map node this sits in. */
  locationId: string;
  /** Specialist type. */
  type: string;
  /** Badge, Z-Crystal, Stamp — whatever this awards. */
  rewardName: string;
  /** What to call the reward collectively: "Badges", "Z-Crystals". */
  rewardNoun: string;
  /** Pokémon Showdown trainer-sprite key. Totems have none. */
  spriteKey?: string;
  quote: string;
  defeatQuote: string;
  team: TeamMember[];
  /**
   * The one that gets stronger at the end — a Dynamax finale, a
   * Totem's aura, a Mega Evolution. Index into `team`.
   */
  aceIndex?: number;
  /** Shown when the ace powers up. */
  aceFlourish?: string;
}

// --- Map ----------------------------------------------------

export type NodeKind =
  | 'town' | 'city' | 'route' | 'forest' | 'cave' | 'water' | 'landmark';

export interface MapNode {
  id: string;
  label: string;
  kind: NodeKind;
  x: number;
  y: number;
  /** Challenges cleared before this becomes reachable. */
  unlocksAfterChallenge: number;
  /** Challenge sitting in this node, if any. */
  challengeId?: string;
  landmark?: string;
  blurb?: string;
  /** Towns offer a Centre and a Mart. */
  isTown?: boolean;
}

export interface MapEdge {
  from: string;
  to: string;
  water?: boolean;
}

/** The landmass drawing behind the nodes. */
export interface MapCanvas {
  /** SVG viewBox, e.g. "0 0 900 780". */
  viewBox: string;
  /** Sea colour. */
  sea: string;
  /** One or more land shapes. */
  land: { d?: string; ellipse?: { cx: number; cy: number; rx: number; ry: number }; fill: string; stroke: string }[];
}

// --- Trainers -----------------------------------------------

export interface RouteTrainer {
  id: string;
  locationId: string;
  trainerClass: string;
  name: string;
  quote: string;
  defeatQuote: string;
  team: TeamMember[];
  /** Showdown sprite key; falls back to the class lookup. */
  spriteKey?: string;
}

// --- Wild encounters ----------------------------------------

export interface WildSlot {
  pokemonId: number;
  name: string;
  minLevel: number;
  maxLevel: number;
  weight: number;
}

export interface AreaEncounters {
  /** Chance per step that anything appears, 0-1. */
  encounterRate: number;
  slots: WildSlot[];
  itemFinds?: string[];
}

// --- Starters -----------------------------------------------

export interface StarterOption {
  id: number;
  name: string;
  types: string[];
  /** Why a player might pick it — matchups, difficulty. */
  blurb: string;
  /** What the region's professor says about it. */
  professorQuote: string;
}

// --- The region itself --------------------------------------

export interface RegionData {
  id: string;
  name: string;
  /** Which mainline games this follows. */
  canon: string;
  /** One line for the region hub card. */
  tagline: string;
  /** Professor who hands out starters. */
  professor: string;
  /** Where the Journey begins. */
  homeTown: string;
  /** Lab location label, e.g. "New Bark Town". */
  labLocation: string;
  starters: StarterOption[];
  /** Level the starter is received at. */
  starterLevel: number;
  challenges: Challenge[];
  /** Plural noun for this region's rewards. */
  rewardNoun: string;
  map: {
    canvas: MapCanvas;
    nodes: MapNode[];
    edges: MapEdge[];
  };
  trainers: RouteTrainer[];
  encounters: Record<string, AreaEncounters>;
  /** Species eligible as wild catches — used for dex totals. */
  dexRange?: { from: number; to: number };
}

// --- Derived helpers ----------------------------------------

export function nodeById(region: RegionData): Record<string, MapNode> {
  return Object.fromEntries(region.map.nodes.map((n) => [n.id, n]));
}

export function challengeById(region: RegionData, id: string): Challenge | undefined {
  return region.challenges.find((c) => c.id === id);
}

export function trainersAt(region: RegionData, locationId: string): RouteTrainer[] {
  return region.trainers.filter((t) => t.locationId === locationId);
}

export function encountersFor(region: RegionData, nodeId: string): AreaEncounters | undefined {
  return region.encounters[nodeId];
}

export function isTown(region: RegionData, nodeId: string): boolean {
  return !!nodeById(region)[nodeId]?.isTown;
}

export function isNodeReachable(node: MapNode, cleared: number): boolean {
  return cleared >= node.unlocksAfterChallenge;
}

export function landmarksOf(region: RegionData) {
  return region.map.nodes
    .filter((n) => n.landmark)
    .map((n) => ({
      id: n.id,
      name: n.landmark!,
      location: n.label,
      unlocksAfterChallenge: n.unlocksAfterChallenge,
    }));
}

/** Rewards in order, for the badge case. */
export function rewardsOf(region: RegionData) {
  return region.challenges.map((c) => ({
    challengeId: c.id,
    order: c.order,
    name: c.rewardName,
    type: c.type,
    leader: c.name,
    kind: c.kind,
  }));
}

/** Where the player stands given how many challenges are cleared. */
export function locationForProgress(region: RegionData, cleared: number): string {
  const locations = region.challenges.map((c) => c.locationId);
  if (cleared === 0) {
    return region.map.nodes[0]?.id ?? locations[0];
  }
  if (cleared >= locations.length) return locations[locations.length - 1];
  return locations[cleared];
}

/** Node palette, shared across regions so maps read alike. */
export const NODE_STYLE: Record<NodeKind, { fill: string; stroke: string; label: string }> = {
  town:     { fill: '#d6c9a8', stroke: '#8a7a55', label: 'Town' },
  city:     { fill: '#e2e8f0', stroke: '#94a3b8', label: 'City' },
  route:    { fill: '#84cc16', stroke: '#4d7c0f', label: 'Route' },
  forest:   { fill: '#166534', stroke: '#052e16', label: 'Forest' },
  cave:     { fill: '#78716c', stroke: '#292524', label: 'Cave' },
  water:    { fill: '#38bdf8', stroke: '#0369a1', label: 'Sea Route' },
  landmark: { fill: '#c084fc', stroke: '#6b21a8', label: 'Landmark' },
};

/** How each challenge kind presents itself. */
export const CHALLENGE_STYLE: Record<ChallengeKind, { icon: string; label: string; verb: string }> = {
  gym:           { icon: '🏟️', label: 'Gym Leader', verb: 'Challenge' },
  trial:         { icon: '🔥', label: 'Island Trial', verb: 'Attempt' },
  'grand-trial': { icon: '🗿', label: 'Island Kahuna', verb: 'Challenge' },
  stadium:       { icon: '🏆', label: 'Stadium Leader', verb: 'Challenge' },
  titan:         { icon: '⛰️', label: 'Titan Pokémon', verb: 'Confront' },
  'star-base':   { icon: '⭐', label: 'Star Base Boss', verb: 'Raid' },
};

// --- Rarity bands, shared by all encounter tables ----------
export const COMMON = 10;
export const UNCOMMON = 5;
export const RARE = 2;
export const VERY_RARE = 1;
