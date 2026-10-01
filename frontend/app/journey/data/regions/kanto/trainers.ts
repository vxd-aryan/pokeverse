// ============================================================
// KANTO — ROUTE TRAINERS
// ============================================================
// Placement follows FireRed / LeafGreen: trainers sit on the
// routes, forests and caves that actually have them. Routes 1, 2
// and 5 have none in the real games, so they have none here.
//
// Levels are BALANCING: each area's trainers sit a few levels
// under the player's expected level at that point, so route
// battles top you up rather than forming a wall of their own.
// ============================================================

import type { RouteTrainer } from '../../types';

export const KANTO_TRAINERS: RouteTrainer[] = [
  // ---------- Viridian Forest (pre-Brock, player ~Lv12) ----------
  {
    id: 'vf-rick',
    locationId: 'viridian-forest',
    trainerClass: 'Bug Catcher',
    name: 'Rick',
    quote: 'Hey! You have Pokémon! Come on, let’s battle!',
    defeatQuote: 'No! Caterpie can’t cut it!',
    team: [{ pokemonId: 10, name: 'Caterpie', level: 8 }, { pokemonId: 13, name: 'Weedle', level: 8 }],
  },
  {
    id: 'vf-doug',
    locationId: 'viridian-forest',
    trainerClass: 'Bug Catcher',
    name: 'Doug',
    quote: 'Yo! You can’t jam out on me!',
    defeatQuote: 'Huh? I ran out of Pokémon!',
    team: [{ pokemonId: 11, name: 'Metapod', level: 10 }, { pokemonId: 14, name: 'Kakuna', level: 10 }],
  },
  {
    id: 'vf-sammy',
    locationId: 'viridian-forest',
    trainerClass: 'Bug Catcher',
    name: 'Sammy',
    quote: 'Hey, wait up! What’s the hurry?',
    defeatQuote: 'Wow! You’re strong!',
    team: [{ pokemonId: 13, name: 'Weedle', level: 11 }],
  },

  // ---------- Route 3 (post-Brock, player ~Lv19) ----------
  {
    id: 'r3-ben',
    locationId: 'route-3',
    trainerClass: 'Bug Catcher',
    name: 'Ben',
    quote: 'I spotted you from afar! Let’s go!',
    defeatQuote: 'That was quick!',
    team: [{ pokemonId: 10, name: 'Caterpie', level: 14 }, { pokemonId: 13, name: 'Weedle', level: 14 }],
  },
  {
    id: 'r3-janice',
    locationId: 'route-3',
    trainerClass: 'Lass',
    name: 'Janice',
    quote: 'I like short Pokémon. That’s my policy!',
    defeatQuote: 'Oh! I lost!',
    team: [{ pokemonId: 16, name: 'Pidgey', level: 15 }, { pokemonId: 19, name: 'Rattata', level: 15 }],
  },
  {
    id: 'r3-calvin',
    locationId: 'route-3',
    trainerClass: 'Youngster',
    name: 'Calvin',
    quote: 'I’m good at Pokémon, you know!',
    defeatQuote: 'Ack! I lost after all that talk!',
    team: [{ pokemonId: 21, name: 'Spearow', level: 17 }, { pokemonId: 23, name: 'Ekans', level: 17 }],
  },

  // ---------- Mt. Moon (post-Brock, player ~Lv19) ----------
  {
    id: 'mm-marcos',
    locationId: 'mt-moon',
    trainerClass: 'Super Nerd',
    name: 'Marcos',
    quote: 'Have you heard about the fossils in this cave?',
    defeatQuote: 'My fossils! I mean, my Pokémon!',
    team: [{ pokemonId: 109, name: 'Koffing', level: 16 }, { pokemonId: 100, name: 'Voltorb', level: 16 }],
  },
  {
    id: 'mm-grunt-a',
    locationId: 'mt-moon',
    trainerClass: 'Team Rocket Grunt',
    name: 'Rocket Grunt',
    quote: 'Team Rocket is after the fossils. Out of our way!',
    defeatQuote: 'Ow! I blew it!',
    team: [{ pokemonId: 41, name: 'Zubat', level: 16 }, { pokemonId: 23, name: 'Ekans', level: 17 }],
  },
  {
    id: 'mm-miriam',
    locationId: 'mt-moon',
    trainerClass: 'Lass',
    name: 'Miriam',
    quote: 'Are you lost in here too?',
    defeatQuote: 'I’ll never find my way now!',
    team: [{ pokemonId: 35, name: 'Clefairy', level: 18 }],
  },

  // ---------- Route 4 (post-Brock) ----------
  {
    id: 'r4-ali',
    locationId: 'route-4',
    trainerClass: 'Lass',
    name: 'Ali',
    quote: 'Wow, your Pokémon look tough! Let’s see.',
    defeatQuote: 'They really were tough!',
    team: [{ pokemonId: 29, name: 'Nidoran♀', level: 17 }, { pokemonId: 32, name: 'Nidoran♂', level: 17 }],
  },

  // ---------- Route 6 (post-Misty, player ~Lv23) ----------
  {
    id: 'r6-keigo',
    locationId: 'route-6',
    trainerClass: 'Camper',
    name: 'Keigo',
    quote: 'Camping out is all about the battles!',
    defeatQuote: 'I need more practice.',
    team: [{ pokemonId: 52, name: 'Meowth', level: 20 }, { pokemonId: 56, name: 'Mankey', level: 20 }],
  },
  {
    id: 'r6-nancy',
    locationId: 'route-6',
    trainerClass: 'Picnicker',
    name: 'Nancy',
    quote: 'It’s such a nice day for a battle!',
    defeatQuote: 'Oh dear, my lunch is ruined.',
    team: [{ pokemonId: 43, name: 'Oddish', level: 21 }, { pokemonId: 69, name: 'Bellsprout', level: 21 }],
  },
  {
    id: 'r6-ariana',
    locationId: 'route-6',
    trainerClass: 'Bug Catcher',
    name: 'Ariana',
    quote: 'My bugs have grown since the forest!',
    defeatQuote: 'Back to the net for me.',
    team: [{ pokemonId: 48, name: 'Venonat', level: 22 }, { pokemonId: 46, name: 'Paras', level: 22 }],
  },

  // ---------- Route 7 (post-Surge, player ~Lv28) ----------
  {
    id: 'r7-dianne',
    locationId: 'route-7',
    trainerClass: 'Lass',
    name: 'Dianne',
    quote: 'Celadon is just ahead. Prove you’re ready!',
    defeatQuote: 'You’re ready. Go on through.',
    team: [{ pokemonId: 35, name: 'Clefairy', level: 25 }, { pokemonId: 39, name: 'Jigglypuff', level: 25 }],
  },
  {
    id: 'r7-frank',
    locationId: 'route-7',
    trainerClass: 'Gambler',
    name: 'Frank',
    quote: 'I’ll wager my whole team on this one!',
    defeatQuote: 'The house always wins. Except now.',
    team: [{ pokemonId: 58, name: 'Growlithe', level: 26 }, { pokemonId: 60, name: 'Poliwag', level: 26 }],
  },

  // ---------- Route 9 (post-Erika, player ~Lv38) ----------
  {
    id: 'r9-jeremy',
    locationId: 'route-9',
    trainerClass: 'Hiker',
    name: 'Jeremy',
    quote: 'My rock-hard Pokémon will crush you!',
    defeatQuote: 'Crushed... by you.',
    team: [{ pokemonId: 74, name: 'Geodude', level: 31 }, { pokemonId: 95, name: 'Onix', level: 33 }],
  },
  {
    id: 'r9-brenda',
    locationId: 'route-9',
    trainerClass: 'Bug Catcher',
    name: 'Brenda',
    quote: 'Bugs get stronger too, you know!',
    defeatQuote: 'Not strong enough, apparently.',
    team: [{ pokemonId: 12, name: 'Butterfree', level: 32 }, { pokemonId: 15, name: 'Beedrill', level: 32 }],
  },

  // ---------- Rock Tunnel (post-Erika) ----------
  {
    id: 'rt-lenny',
    locationId: 'rock-tunnel',
    trainerClass: 'Hiker',
    name: 'Lenny',
    quote: 'Can’t see a thing in here! Doesn’t matter.',
    defeatQuote: 'Beaten in the dark!',
    team: [{ pokemonId: 74, name: 'Geodude', level: 33 }, { pokemonId: 75, name: 'Graveler', level: 35 }],
  },
  {
    id: 'rt-ashton',
    locationId: 'rock-tunnel',
    trainerClass: 'Pokémaniac',
    name: 'Ashton',
    quote: 'I only collect the rarest specimens!',
    defeatQuote: 'My collection has been humbled.',
    team: [{ pokemonId: 105, name: 'Marowak', level: 34 }, { pokemonId: 112, name: 'Rhydon', level: 36 }],
  },

  // ---------- Route 10 ----------
  {
    id: 'r10-tara',
    locationId: 'route-10',
    trainerClass: 'Hiker',
    name: 'Tara',
    quote: 'The power plant is just off this route. Careful.',
    defeatQuote: 'Watch yourself out there.',
    team: [{ pokemonId: 100, name: 'Voltorb', level: 34 }, { pokemonId: 81, name: 'Magnemite', level: 34 }],
  },

  // ---------- Route 8 ----------
  {
    id: 'r8-sebastian',
    locationId: 'route-8',
    trainerClass: 'Super Nerd',
    name: 'Sebastian',
    quote: 'I calculated a ninety-percent chance I win.',
    defeatQuote: 'My maths was off by ninety percent.',
    team: [{ pokemonId: 88, name: 'Grimer', level: 34 }, { pokemonId: 109, name: 'Koffing', level: 36 }],
  },
  {
    id: 'r8-rosa',
    locationId: 'route-8',
    trainerClass: 'Lass',
    name: 'Rosa',
    quote: 'Saffron’s gates are shut. Battle me while you wait!',
    defeatQuote: 'Fine, fine. You win.',
    team: [{ pokemonId: 58, name: 'Growlithe', level: 35 }, { pokemonId: 37, name: 'Vulpix', level: 35 }],
  },

  // ---------- Route 12 (post-Koga, player ~Lv42) ----------
  {
    id: 'r12-edgar',
    locationId: 'route-12',
    trainerClass: 'Fisherman',
    name: 'Edgar',
    quote: 'Been fishing this pier for thirty years!',
    defeatQuote: 'Should have stuck to fishing.',
    team: [{ pokemonId: 129, name: 'Magikarp', level: 36 }, { pokemonId: 130, name: 'Gyarados', level: 40 }],
  },
  {
    id: 'r12-martha',
    locationId: 'route-12',
    trainerClass: 'Fisherman',
    name: 'Martha',
    quote: 'The big ones bite at dusk. So do I.',
    defeatQuote: 'The one that got away.',
    team: [{ pokemonId: 118, name: 'Goldeen', level: 38 }, { pokemonId: 119, name: 'Seaking', level: 39 }],
  },

  // ---------- Route 13 ----------
  {
    id: 'r13-perry',
    locationId: 'route-13',
    trainerClass: 'Bird Keeper',
    name: 'Perry',
    quote: 'My birds rule these skies!',
    defeatQuote: 'Grounded.',
    team: [{ pokemonId: 17, name: 'Pidgeotto', level: 39 }, { pokemonId: 22, name: 'Fearow', level: 40 }],
  },

  // ---------- Route 14 ----------
  {
    id: 'r14-hideo',
    locationId: 'route-14',
    trainerClass: 'Biker',
    name: 'Hideo',
    quote: 'This road belongs to the gang!',
    defeatQuote: 'Take the road. It’s yours.',
    team: [{ pokemonId: 109, name: 'Koffing', level: 39 }, { pokemonId: 110, name: 'Weezing', level: 41 }],
  },
  {
    id: 'r14-lola',
    locationId: 'route-14',
    trainerClass: 'Bird Keeper',
    name: 'Lola',
    quote: 'Doduo never looks away. Neither do I.',
    defeatQuote: 'Both heads are spinning.',
    team: [{ pokemonId: 84, name: 'Doduo', level: 39 }, { pokemonId: 85, name: 'Dodrio', level: 41 }],
  },

  // ---------- Route 15 ----------
  {
    id: 'r15-kiyo',
    locationId: 'route-15',
    trainerClass: 'Juggler',
    name: 'Kiyo',
    quote: 'Keep your eyes on all of them at once!',
    defeatQuote: 'Dropped the lot.',
    team: [{ pokemonId: 96, name: 'Drowzee', level: 40 }, { pokemonId: 97, name: 'Hypno', level: 42 }],
  },

  // ---------- Sea routes (post-Blaine's unlock, player ~Lv46+) ----------
  {
    id: 'r19-dean',
    locationId: 'route-19',
    trainerClass: 'Swimmer',
    name: 'Dean',
    quote: 'You can’t surf past me that easily!',
    defeatQuote: 'Go on, the island’s that way.',
    team: [{ pokemonId: 72, name: 'Tentacool', level: 43 }, { pokemonId: 73, name: 'Tentacruel', level: 45 }],
  },
  {
    id: 'r20-tanya',
    locationId: 'route-20',
    trainerClass: 'Swimmer',
    name: 'Tanya',
    quote: 'The current is strong here. So am I.',
    defeatQuote: 'Swept aside!',
    team: [{ pokemonId: 121, name: 'Starmie', level: 45 }, { pokemonId: 91, name: 'Cloyster', level: 46 }],
  },
  {
    id: 'sf-douglas',
    locationId: 'seafoam',
    trainerClass: 'Swimmer',
    name: 'Douglas',
    quote: 'It’s freezing in these caves. Warm me up!',
    defeatQuote: 'Colder than ever now.',
    team: [{ pokemonId: 86, name: 'Seel', level: 45 }, { pokemonId: 87, name: 'Dewgong', level: 47 }],
  },
  {
    id: 'r21-nora',
    locationId: 'route-21',
    trainerClass: 'Swimmer',
    name: 'Nora',
    quote: 'Pallet Town is just north. Get past me first.',
    defeatQuote: 'Say hello to Professor Oak for me.',
    team: [{ pokemonId: 98, name: 'Krabby', level: 46 }, { pokemonId: 99, name: 'Kingler', level: 48 }],
  },
];
