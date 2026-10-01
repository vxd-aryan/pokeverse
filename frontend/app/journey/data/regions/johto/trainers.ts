// ============================================================
// JOHTO — ROUTE TRAINERS
// ============================================================
// Placement follows HeartGold / SoulSilver. Johto's trainer
// classes carry the region's flavour: Sages on the tower floors,
// Kimono Girls near Ecruteak, Bird Keepers along the northern
// routes, Fishermen on the Olivine crossings.
//
// Levels are BALANCING, set a few under the player's expected
// level at that point in the run.
// ============================================================

import type { RouteTrainer } from '../../types';

export const JOHTO_TRAINERS: RouteTrainer[] = [
  // ---------- Route 30 / 31 (pre-Falkner) ----------
  {
    id: 'r30-joey',
    locationId: 'route-30',
    trainerClass: 'Youngster',
    name: 'Joey',
    quote: 'My Rattata is in the top percentage of all Rattata!',
    defeatQuote: 'No! My Rattata!',
    team: [{ pokemonId: 19, name: 'Rattata', level: 4 }],
  },
  {
    id: 'r30-mikey',
    locationId: 'route-30',
    trainerClass: 'Youngster',
    name: 'Mikey',
    quote: 'I just started, but I think I’m pretty good!',
    defeatQuote: 'Maybe I need more practice.',
    team: [
      { pokemonId: 16, name: 'Pidgey', level: 4 },
      { pokemonId: 161, name: 'Sentret', level: 4 },
    ],
  },
  {
    id: 'r31-don',
    locationId: 'route-31',
    trainerClass: 'Bug Catcher',
    name: 'Don',
    quote: 'Bug Pokémon are the best! Want to see?',
    defeatQuote: 'My bugs!',
    team: [{ pokemonId: 10, name: 'Caterpie', level: 6 }],
  },

  // ---------- Route 32 (post-Falkner) ----------
  {
    id: 'r32-ralph',
    locationId: 'route-32',
    trainerClass: 'Fisherman',
    name: 'Ralph',
    quote: 'I’ve been fishing here since dawn. Don’t scare them off!',
    defeatQuote: 'Nothing’s biting today.',
    team: [{ pokemonId: 129, name: 'Magikarp', level: 10 }, { pokemonId: 118, name: 'Goldeen', level: 10 }],
  },
  {
    id: 'r32-liz',
    locationId: 'route-32',
    trainerClass: 'Picnicker',
    name: 'Liz',
    quote: 'Hi! Want to battle while the kettle boils?',
    defeatQuote: 'That was quick. Tea?',
    team: [{ pokemonId: 16, name: 'Pidgey', level: 9 }, { pokemonId: 161, name: 'Sentret', level: 11 }],
  },
  {
    id: 'r32-jin',
    locationId: 'route-32',
    trainerClass: 'Sage',
    name: 'Jin',
    quote: 'The path to Azalea tests the spirit. Let me test yours.',
    defeatQuote: 'Your spirit is strong. Pass freely.',
    team: [{ pokemonId: 69, name: 'Bellsprout', level: 10 }, { pokemonId: 69, name: 'Bellsprout', level: 10 }],
  },

  // ---------- Union Cave ----------
  {
    id: 'uc-russell',
    locationId: 'union-cave',
    trainerClass: 'Hiker',
    name: 'Russell',
    quote: 'These tunnels are my home. You’re the visitor here.',
    defeatQuote: 'Mind your head on the way out.',
    team: [{ pokemonId: 74, name: 'Geodude', level: 11 }, { pokemonId: 74, name: 'Geodude', level: 11 }],
  },
  {
    id: 'uc-daniel',
    locationId: 'union-cave',
    trainerClass: 'Pokémaniac',
    name: 'Daniel',
    quote: 'Do you hear it? On Fridays, something cries down here.',
    defeatQuote: 'Maybe I imagined it...',
    team: [{ pokemonId: 95, name: 'Onix', level: 13 }],
  },

  // ---------- Route 33 ----------
  {
    id: 'r33-anthony',
    locationId: 'route-33',
    trainerClass: 'Hiker',
    name: 'Anthony',
    quote: 'Azalea’s just down the hill. Beat me and it’s yours.',
    defeatQuote: 'Downhill from here. For me, anyway.',
    team: [{ pokemonId: 74, name: 'Geodude', level: 13 }, { pokemonId: 27, name: 'Sandshrew', level: 13 }],
  },

  // ---------- Ilex Forest (post-Bugsy) ----------
  {
    id: 'if-wayne',
    locationId: 'ilex-forest',
    trainerClass: 'Bug Catcher',
    name: 'Wayne',
    quote: 'Shh! You’ll scare the Heracross off the trees!',
    defeatQuote: 'There they go. Thanks a lot.',
    team: [{ pokemonId: 11, name: 'Metapod', level: 15 }, { pokemonId: 14, name: 'Kakuna', level: 15 }],
  },
  {
    id: 'if-kent',
    locationId: 'ilex-forest',
    trainerClass: 'Bug Maniac',
    name: 'Kent',
    quote: 'The shrine protects this forest. So do I.',
    defeatQuote: 'The forest chose you, then.',
    team: [{ pokemonId: 46, name: 'Paras', level: 16 }, { pokemonId: 48, name: 'Venonat', level: 16 }],
  },

  // ---------- Route 34 ----------
  {
    id: 'r34-irene',
    locationId: 'route-34',
    trainerClass: 'Lass',
    name: 'Irene',
    quote: 'Goldenrod is huge! Don’t get lost in there.',
    defeatQuote: 'You’ll be fine in the city, clearly.',
    team: [{ pokemonId: 16, name: 'Pidgey', level: 16 }, { pokemonId: 19, name: 'Rattata', level: 16 }],
  },
  {
    id: 'r34-samuel',
    locationId: 'route-34',
    trainerClass: 'Camper',
    name: 'Samuel',
    quote: 'The day care is just up the road. Battle first!',
    defeatQuote: 'Off you go then.',
    team: [
      { pokemonId: 52, name: 'Meowth', level: 15 },
      { pokemonId: 56, name: 'Mankey', level: 17 },
    ],
  },

  // ---------- Route 35 / National Park (post-Whitney) ----------
  {
    id: 'r35-ian',
    locationId: 'route-35',
    trainerClass: 'Bird Keeper',
    name: 'Ian',
    quote: 'My birds circle this route all day. They know every tree.',
    defeatQuote: 'Grounded, the lot of them.',
    team: [{ pokemonId: 17, name: 'Pidgeotto', level: 20 }, { pokemonId: 163, name: 'Hoothoot', level: 20 }],
  },
  {
    id: 'np-jonah',
    locationId: 'national-park',
    trainerClass: 'Schoolboy',
    name: 'Jonah',
    quote: 'The Bug-Catching Contest is on! But a battle first, yes?',
    defeatQuote: 'I’ll win the contest instead.',
    team: [{ pokemonId: 193, name: 'Yanma', level: 21 }, { pokemonId: 46, name: 'Paras', level: 21 }],
  },
  {
    id: 'np-beverly',
    locationId: 'national-park',
    trainerClass: 'Lass',
    name: 'Beverly',
    quote: 'Isn’t the park lovely? Let’s make it livelier.',
    defeatQuote: 'Lovely and quiet again.',
    team: [{ pokemonId: 187, name: 'Hoppip', level: 20 }, { pokemonId: 43, name: 'Oddish', level: 22 }],
  },

  // ---------- Route 36 / 37 ----------
  {
    id: 'r36-arnie',
    locationId: 'route-36',
    trainerClass: 'Bug Catcher',
    name: 'Arnie',
    quote: 'There’s a huge tree blocking the way. Battle me while you think.',
    defeatQuote: 'Still blocked, mind you.',
    team: [{ pokemonId: 165, name: 'Ledyba', level: 21 }, { pokemonId: 167, name: 'Spinarak', level: 21 }],
  },
  {
    id: 'r37-tully',
    locationId: 'route-37',
    trainerClass: 'Twins',
    name: 'Ann & Anne',
    quote: 'We battle together! That’s allowed, isn’t it?',
    defeatQuote: 'Together we lost, too.',
    team: [{ pokemonId: 191, name: 'Sunkern', level: 22 }, { pokemonId: 191, name: 'Sunkern', level: 22 }],
  },

  // ---------- Burned Tower (post-Morty's unlock) ----------
  {
    id: 'bt-sage-troy',
    locationId: 'burned-tower',
    trainerClass: 'Sage',
    name: 'Troy',
    quote: 'Three beasts woke in this tower. Are you worthy to follow them?',
    defeatQuote: 'Then follow them you shall.',
    team: [{ pokemonId: 92, name: 'Gastly', level: 24 }, { pokemonId: 92, name: 'Gastly', level: 24 }],
  },
  {
    id: 'bt-shawn',
    locationId: 'burned-tower',
    trainerClass: 'Firebreather',
    name: 'Shawn',
    quote: 'Everything here burned once. I keep the tradition alive.',
    defeatQuote: 'Put out, for now.',
    team: [{ pokemonId: 218, name: 'Slugma', level: 24 }, { pokemonId: 109, name: 'Koffing', level: 25 }],
  },

  // ---------- Route 38 / 39 (post-Morty) ----------
  {
    id: 'r38-dana',
    locationId: 'route-38',
    trainerClass: 'Lass',
    name: 'Dana',
    quote: 'The farm up ahead has the best milk in Johto!',
    defeatQuote: 'Have a glass. You’ve earned it.',
    team: [{ pokemonId: 52, name: 'Meowth', level: 26 }, { pokemonId: 209, name: 'Snubbull', level: 26 }],
  },
  {
    id: 'r39-marcus',
    locationId: 'route-39',
    trainerClass: 'Sailor',
    name: 'Marcus',
    quote: 'Olivine port is my home. Prove you belong there.',
    defeatQuote: 'Welcome to Olivine, then.',
    team: [{ pokemonId: 118, name: 'Goldeen', level: 27 }, { pokemonId: 61, name: 'Poliwhirl', level: 28 }],
  },

  // ---------- Sea routes (post-Jasmine's unlock) ----------
  {
    id: 'r40-paul',
    locationId: 'route-40',
    trainerClass: 'Swimmer',
    name: 'Paul',
    quote: 'Cianwood’s a long swim. Think you’ll make it?',
    defeatQuote: 'Go on then, swim.',
    team: [{ pokemonId: 72, name: 'Tentacool', level: 28 }, { pokemonId: 73, name: 'Tentacruel', level: 30 }],
  },
  {
    id: 'r41-kaylee',
    locationId: 'route-41',
    trainerClass: 'Swimmer',
    name: 'Kaylee',
    quote: 'The whirlpools out here swallow boats. Not me, though.',
    defeatQuote: 'Mind the whirlpools.',
    team: [{ pokemonId: 226, name: 'Mantine', level: 30 }, { pokemonId: 73, name: 'Tentacruel', level: 31 }],
  },
  {
    id: 'wi-mariah',
    locationId: 'whirl-islands',
    trainerClass: 'Swimmer',
    name: 'Mariah',
    quote: 'Few come this deep. Something old lives below.',
    defeatQuote: 'Don’t go any deeper. Not yet.',
    team: [{ pokemonId: 42, name: 'Golbat', level: 31 }, { pokemonId: 90, name: 'Shellder', level: 31 }],
  },

  // ---------- Route 42 / Mt. Mortar (post-Chuck) ----------
  {
    id: 'r42-benjamin',
    locationId: 'route-42',
    trainerClass: 'Fisherman',
    name: 'Benjamin',
    quote: 'Mt. Mortar’s waterfall feeds this stream. Good fishing.',
    defeatQuote: 'Back to the rod.',
    team: [{ pokemonId: 118, name: 'Goldeen', level: 30 }, { pokemonId: 119, name: 'Seaking', level: 32 }],
  },
  {
    id: 'mm-kiyo',
    locationId: 'mt-mortar',
    trainerClass: 'Blackbelt',
    name: 'Kiyo',
    quote: 'I have trained in this cave for years. Show me what you have.',
    defeatQuote: 'Strong. Truly strong. Keep training.',
    team: [
      { pokemonId: 66, name: 'Machop', level: 31 },
      { pokemonId: 67, name: 'Machoke', level: 33 },
      { pokemonId: 57, name: 'Primeape', level: 34 },
    ],
  },

  // ---------- Lake of Rage / Route 44 (post-Pryce's unlock) ----------
  {
    id: 'lor-andre',
    locationId: 'lake-of-rage',
    trainerClass: 'Fisherman',
    name: 'Andre',
    quote: 'The water’s been churning for days. Something’s wrong here.',
    defeatQuote: 'Someone should look into that lake.',
    team: [{ pokemonId: 129, name: 'Magikarp', level: 32 }, { pokemonId: 130, name: 'Gyarados', level: 35 }],
  },
  {
    id: 'r44-wilton',
    locationId: 'route-44',
    trainerClass: 'Fisherman',
    name: 'Wilton',
    quote: 'Blackthorn’s just past the Ice Path. Cold up there.',
    defeatQuote: 'Wrap up warm.',
    team: [{ pokemonId: 211, name: 'Qwilfish', level: 34 }, { pokemonId: 119, name: 'Seaking', level: 34 }],
  },
  {
    id: 'r44-cybil',
    locationId: 'route-44',
    trainerClass: 'Picnicker',
    name: 'Cybil',
    quote: 'I come here for the quiet. You’ve ruined it, so battle me.',
    defeatQuote: 'Quiet again, at last.',
    team: [{ pokemonId: 114, name: 'Tangela', level: 35 }, { pokemonId: 44, name: 'Gloom', level: 35 }],
  },

  // ---------- Ice Path (post-Pryce) ----------
  {
    id: 'ip-roland',
    locationId: 'ice-path',
    trainerClass: 'Boarder',
    name: 'Roland',
    quote: 'Watch your footing. The floor isn’t always a floor.',
    defeatQuote: 'Told you about the floor.',
    team: [{ pokemonId: 220, name: 'Swinub', level: 36 }, { pokemonId: 221, name: 'Piloswine', level: 38 }],
  },

  // ---------- Dragon's Den / Route 45 (post-Clair) ----------
  {
    id: 'dd-darin',
    locationId: 'dragons-den',
    trainerClass: 'Ace Trainer',
    name: 'Darin',
    quote: 'The clan tests everyone who comes down here. Including you.',
    defeatQuote: 'The clan would approve of you.',
    team: [{ pokemonId: 147, name: 'Dratini', level: 38 }, { pokemonId: 148, name: 'Dragonair', level: 40 }],
  },
  {
    id: 'r45-erik',
    locationId: 'route-45',
    trainerClass: 'Hiker',
    name: 'Erik',
    quote: 'This mountain road breaks most trainers. Let’s see about you.',
    defeatQuote: 'Unbroken. Good.',
    team: [
      { pokemonId: 75, name: 'Graveler', level: 38 },
      { pokemonId: 232, name: 'Donphan', level: 40 },
    ],
  },
];
