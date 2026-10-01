// ============================================================
// JOHTO
// ============================================================
// Canon: Pokémon HeartGold / SoulSilver.
// ============================================================

import type { RegionData, StarterOption } from '../../types';
import { JOHTO_CANVAS, JOHTO_MAP_NODES, JOHTO_MAP_EDGES } from './map';
import { JOHTO_CHALLENGES } from './challenges';
import { JOHTO_TRAINERS } from './trainers';
import { JOHTO_ENCOUNTERS } from './encounters';

export const JOHTO_STARTERS: StarterOption[] = [
  {
    id: 152,
    name: 'Chikorita',
    types: ['Grass'],
    blurb:
      'The hardest road in Johto. Falkner, Bugsy and Morty all hold the advantage, and Grass covers little of what the region throws at you — but Meganium is a wall that outlasts almost anything.',
    professorQuote: 'A gentle Pokémon, slow to anger. It asks patience of its trainer.',
  },
  {
    id: 155,
    name: 'Cyndaquil',
    types: ['Fire'],
    blurb:
      'The smooth run. Bugsy folds to it, Jasmine’s Steel melts, and Pryce’s ice is no trouble. Typhlosion’s speed carries most of the mid-game on its own.',
    professorQuote: 'Timid until roused. Then the flames on its back speak for it.',
  },
  {
    id: 158,
    name: 'Totodile',
    types: ['Water'],
    blurb:
      'The brawler. Nothing early resists it, Chuck is its only real wall, and Feraligatr hits hard enough to brute-force the climb to Blackthorn.',
    professorQuote: 'It bites anything that moves. Including, I am afraid, its trainer.',
  },
];

export const JOHTO: RegionData = {
  id: 'johto',
  name: 'Johto',
  canon: 'HeartGold / SoulSilver',
  tagline: 'Old towers, older legends, and a road that loops home.',
  professor: 'Professor Elm',
  homeTown: 'New Bark Town',
  labLocation: 'New Bark Town',
  starters: JOHTO_STARTERS,
  starterLevel: 5,
  challenges: JOHTO_CHALLENGES,
  rewardNoun: 'Badges',
  map: { canvas: JOHTO_CANVAS, nodes: JOHTO_MAP_NODES, edges: JOHTO_MAP_EDGES },
  trainers: JOHTO_TRAINERS,
  encounters: JOHTO_ENCOUNTERS,
  dexRange: { from: 152, to: 251 },
};
