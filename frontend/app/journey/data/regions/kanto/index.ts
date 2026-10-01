// ============================================================
// KANTO
// ============================================================
// Canon: Pokémon FireRed / LeafGreen.
// ============================================================

import type { RegionData, StarterOption } from '../../types';
import { KANTO_CANVAS, KANTO_MAP_NODES, KANTO_MAP_EDGES } from './map';
import { KANTO_CHALLENGES } from './challenges';
import { KANTO_TRAINERS } from './trainers';
import { KANTO_ENCOUNTERS } from './encounters';

export const KANTO_STARTERS: StarterOption[] = [
  {
    id: 1,
    name: 'Bulbasaur',
    types: ['Grass', 'Poison'],
    blurb:
      "A steady start. Its Grass typing walks over the first two gyms — Brock's rocks and Misty's water — which makes the early game noticeably kinder.",
    professorQuote: 'This one is quite docile. I rather like it.',
  },
  {
    id: 4,
    name: 'Charmander',
    types: ['Fire'],
    blurb:
      'The hard road. Weak to Brock and Misty both, but it grows into one of Kanto’s strongest and tears through Erika, Koga and Sabrina later on.',
    professorQuote: 'It has a fiery temperament. A challenge, but a rewarding one.',
  },
  {
    id: 7,
    name: 'Squirtle',
    types: ['Water'],
    blurb:
      'The dependable pick. Beats Brock outright, holds its own against Misty, and its defences make the whole first half forgiving.',
    professorQuote: 'A tough little Pokémon with a sturdy shell. Hard to go wrong.',
  },
];

export const KANTO: RegionData = {
  id: 'kanto',
  name: 'Kanto',
  canon: 'FireRed / LeafGreen',
  tagline: 'Where every trainer’s story starts.',
  professor: 'Professor Oak',
  homeTown: 'Pallet Town',
  labLocation: 'Pallet Town',
  starters: KANTO_STARTERS,
  starterLevel: 5,
  challenges: KANTO_CHALLENGES,
  rewardNoun: 'Badges',
  map: { canvas: KANTO_CANVAS, nodes: KANTO_MAP_NODES, edges: KANTO_MAP_EDGES },
  trainers: KANTO_TRAINERS,
  encounters: KANTO_ENCOUNTERS,
  dexRange: { from: 1, to: 151 },
};
