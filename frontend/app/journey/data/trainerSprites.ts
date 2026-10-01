// ============================================================
// JOURNEY — TRAINER SPRITE KEYS
// ============================================================
// Maps a trainer class to Pokémon Showdown's sprite archive.
// Shared across regions, since the same classes recur — a Bug
// Catcher is a Bug Catcher in Kanto and Johto alike.
// ============================================================

export const TRAINER_CLASS_SPRITE: Record<string, string> = {
  'Bug Catcher': 'bugcatcher',
  'Youngster': 'youngster',
  'Lass': 'lass',
  'Hiker': 'hiker',
  'Super Nerd': 'scientist',
  'Scientist': 'scientist',
  'Team Rocket Grunt': 'rocket',
  'Camper': 'camper',
  'Picnicker': 'picnicker',
  'Pokémaniac': 'pokemaniac',
  'Gambler': 'gambler',
  'Fisherman': 'fisherman',
  'Bird Keeper': 'birdkeeper',
  'Biker': 'biker',
  'Swimmer': 'swimmer',
  'Juggler': 'juggler',
  'Tamer': 'tamer',
  'Schoolboy': 'schoolboy',
  'Schoolgirl': 'lass',
  'Firebreather': 'firebreather',
  'Sailor': 'sailor',
  'Beauty': 'beauty',
  'Psychic': 'psychic',
  'Medium': 'medium',
  'Boarder': 'boarder',
  'Skier': 'skier',
  'Blackbelt': 'blackbelt',
  'Kimono Girl': 'kimonogirl',
  'Sage': 'sage',
  'Bug Maniac': 'bugmaniac',
  'Guitarist': 'guitarist',
  'Officer': 'officer',
  'Teacher': 'teacher',
  'Twins': 'twins',
  'Ace Trainer': 'acetrainer',
  'Hex Maniac': 'hexmaniac',
  'Ruin Maniac': 'ruinmaniac',
};

export function spriteKeyForClass(trainerClass: string): string {
  return TRAINER_CLASS_SPRITE[trainerClass] ?? 'youngster';
}
