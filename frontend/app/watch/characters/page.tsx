"use client";

import { useState, useEffect } from 'react';

interface Character {
  id: string;
  name: string;
  role: 'Protagonist' | 'Companion' | 'Rival' | 'Champion' | 'Villain' | 'Professor' | 'Elite Four' | 'Gym Leader' | 'Team Rocket';
  homeRegion: string;
  firstAppearance: string;
  signaturePokemon: string[];
  bio: string;
  thumbnail: string;
}

// ------------------------------------------------------------------
// SMART IMAGE COMPONENT
// Tries to load your local image. If you haven't downloaded it yet,
// it safely falls back to the colored initials.
// ------------------------------------------------------------------
const FallbackImage = ({ src, name, className, type = "cover" }: { src: string, name: string, className: string, type?: "cover" | "thumbnail" | "modal" }) => {
  const [hasFailed, setHasFailed] = useState(false);

  let fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e293b&color=cbd5e1&size=150`;
  if (type === "cover") fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f172a&color=4f46e5&size=400&bold=true`;
  if (type === "modal") fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e293b&color=cbd5e1&size=600&bold=true`;

  return (
    <img 
      src={hasFailed ? fallbackUrl : src} 
      alt={name} 
      className={className}
      onError={() => setHasFailed(true)}
    />
  );
}

const ALL_CHARACTERS: Character[] = [
  // --- PROTAGONISTS ---
  { id: "ash-ketchum", name: "Ash Ketchum", role: "Protagonist", homeRegion: "Kanto", firstAppearance: "Pokémon - I Choose You! (Ep. 1)", signaturePokemon: ["Pikachu", "Charizard", "Lucario", "Greninja"], bio: "A determined Trainer from Pallet Town whose ultimate goal was to become a Pokémon Master.", thumbnail: "/images/characters/ash-ketchum.jpg" },
  { id: "liko", name: "Liko", role: "Protagonist", homeRegion: "Paldea", firstAppearance: "The Pendant That Starts It All (Hz Ep. 1)", signaturePokemon: ["Floragato", "Hatenna"], bio: "A quiet yet profoundly observant student at Indigo Academy who holds a mysterious pendant.", thumbnail: "/images/characters/liko.jpg" },
  { id: "roy", name: "Roy", role: "Protagonist", homeRegion: "Kanto", firstAppearance: "The Boy from the Remote Island (Hz Ep. 4)", signaturePokemon: ["Fuecoco", "Wattrel"], bio: "An energetic boy with a mysterious ancient Poké Ball who dreams of challenging legends.", thumbnail: "/images/characters/roy.jpg" },

  // --- COMPANIONS ---
  { id: "misty", name: "Misty", role: "Companion", homeRegion: "Kanto", firstAppearance: "Pokémon - I Choose You! (Ep. 1)", signaturePokemon: ["Starmie", "Psyduck", "Togepi"], bio: "The tomboyish Gym Leader of Cerulean City and Ash's first human travel companion.", thumbnail: "/images/characters/misty.jpg" },
  { id: "brock", name: "Brock", role: "Companion", homeRegion: "Kanto", firstAppearance: "Showdown in Pewter City (Ep. 5)", signaturePokemon: ["Onix", "Geodude", "Croagunk"], bio: "The former Pewter City Gym Leader who transitioned his dream to becoming a Pokémon Doctor.", thumbnail: "/images/characters/brock.jpg" },
  { id: "tracey", name: "Tracey Sketchit", role: "Companion", homeRegion: "Orange Islands", firstAppearance: "The Lost Lapras (Ep. 84)", signaturePokemon: ["Marill", "Venonat", "Scyther"], bio: "A passionate Pokémon Watcher who traveled with Ash through the Orange Islands.", thumbnail: "/images/characters/tracey.jpg" },
  { id: "may", name: "May", role: "Companion", homeRegion: "Hoenn", firstAppearance: "Get the Show on the Road! (AG Ep. 1)", signaturePokemon: ["Blaziken", "Beautifly", "Venusaur"], bio: "The daughter of the Petalburg Gym Leader. She discovered her passion for Pokémon Contests.", thumbnail: "/images/characters/may.jpg" },
  { id: "max", name: "Max", role: "Companion", homeRegion: "Hoenn", firstAppearance: "There's no Place Like Hoenn (AG Ep. 3)", signaturePokemon: ["None"], bio: "May's younger brother. Highly knowledgeable about Pokémon stats and facts.", thumbnail: "/images/characters/max.jpg" },
  { id: "dawn", name: "Dawn", role: "Companion", homeRegion: "Sinnoh", firstAppearance: "Following a Maiden's Voyage! (DP Ep. 1)", signaturePokemon: ["Piplup", "Buneary", "Mamoswine"], bio: "A confident Pokémon Coordinator aiming to follow in her mother's footsteps.", thumbnail: "/images/characters/dawn.jpg" },
  { id: "iris", name: "Iris", role: "Companion", homeRegion: "Unova", firstAppearance: "In the Shadow of Zekrom! (BW Ep. 1)", signaturePokemon: ["Axew", "Excadrill", "Dragonite"], bio: "A wild and energetic Dragon-type specialist who later achieves her dream of becoming Champion.", thumbnail: "/images/characters/iris.jpg" },
  { id: "cilan", name: "Cilan", role: "Companion", homeRegion: "Unova", firstAppearance: "Triple Leaders, Team Threats! (BW Ep. 5)", signaturePokemon: ["Pansage", "Crustle", "Stunfisk"], bio: "An A-class Pokémon Connoisseur and former Gym Leader.", thumbnail: "/images/characters/cilan.jpg" },
  { id: "serena", name: "Serena", role: "Companion", homeRegion: "Kalos", firstAppearance: "Kalos, Where Dreams and Adventures Begin! (XY Ep. 1)", signaturePokemon: ["Braixen", "Pancham", "Sylveon"], bio: "A passionate Pokémon Performer who traveled with Ash through Kalos.", thumbnail: "/images/characters/serena.jpg" },
  { id: "clemont", name: "Clemont", role: "Companion", homeRegion: "Kalos", firstAppearance: "Kalos, Where Dreams and Adventures Begin! (XY Ep. 1)", signaturePokemon: ["Bunnelby", "Chespin", "Luxray"], bio: "The young genius Gym Leader of Lumiose City. He constantly invents gadgets.", thumbnail: "/images/characters/clemont.jpg" },
  { id: "bonnie", name: "Bonnie", role: "Companion", homeRegion: "Kalos", firstAppearance: "Kalos, Where Dreams and Adventures Begin! (XY Ep. 1)", signaturePokemon: ["Dedenne", "Squishy"], bio: "Clemont's energetic younger sister.", thumbnail: "/images/characters/bonnie.jpg" },
  { id: "lillie", name: "Lillie", role: "Companion", homeRegion: "Alola", firstAppearance: "Alola to New Adventure! (SM Ep. 1)", signaturePokemon: ["Snowy (Alolan Vulpix)"], bio: "A polite student at the Pokémon School who initially had a phobia of touching Pokémon.", thumbnail: "/images/characters/lillie.jpg" },
  { id: "kiawe", name: "Kiawe", role: "Companion", homeRegion: "Alola", firstAppearance: "Alola to New Adventure! (SM Ep. 1)", signaturePokemon: ["Turtonator", "Marowak (Alolan)", "Charizard"], bio: "A fiery specialist who helps run his family's farm.", thumbnail: "/images/characters/kiawe.jpg" },
  { id: "lana", name: "Lana", role: "Companion", homeRegion: "Alola", firstAppearance: "Alola to New Adventure! (SM Ep. 1)", signaturePokemon: ["Primarina", "Eevee (Sandy)"], bio: "A quiet but incredibly strong-willed Water-type specialist.", thumbnail: "/images/characters/lana.jpg" },
  { id: "mallow", name: "Mallow", role: "Companion", homeRegion: "Alola", firstAppearance: "Alola to New Adventure! (SM Ep. 1)", signaturePokemon: ["Tsareena"], bio: "A cheerful Grass-type specialist and aspiring chef.", thumbnail: "/images/characters/mallow.jpg" },
  { id: "sophocles", name: "Sophocles", role: "Companion", homeRegion: "Alola", firstAppearance: "Alola to New Adventure! (SM Ep. 1)", signaturePokemon: ["Togedemaru", "Vikavolt"], bio: "A tech-savvy Electric-type specialist who dreams of becoming an astronaut.", thumbnail: "/images/characters/sophocles.jpg" },
  { id: "goh", name: "Goh", role: "Companion", homeRegion: "Kanto", firstAppearance: "Enter Pikachu! (JN Ep. 1)", signaturePokemon: ["Cinderace", "Inteleon", "Grookey"], bio: "A brilliant researcher traveling with Ash. His ultimate goal is to catch Mew.", thumbnail: "/images/characters/goh.jpg" },
  { id: "chloe", name: "Chloe Cerise", role: "Companion", homeRegion: "Kanto", firstAppearance: "Enter Pikachu! (JN Ep. 1)", signaturePokemon: ["Eevee"], bio: "Professor Cerise's daughter and Goh's childhood friend.", thumbnail: "/images/characters/chloe.jpg" },

  // --- RIVALS ---
  { id: "gary", name: "Gary Oak", role: "Rival", homeRegion: "Kanto", firstAppearance: "Pokémon - I Choose You! (Ep. 1)", signaturePokemon: ["Blastoise", "Umbreon", "Electivire"], bio: "Ash's childhood rival and grandson of Professor Oak, who eventually becomes a Pokémon Researcher.", thumbnail: "/images/characters/gary.jpg" },
  { id: "ritchie", name: "Ritchie", role: "Rival", homeRegion: "Kanto", firstAppearance: "A Friend In Deed (Ep. 78)", signaturePokemon: ["Sparky (Pikachu)", "Zippo (Charmeleon)"], bio: "A friendly rival to Ash who shares very similar tastes in Pokémon.", thumbnail: "/images/characters/ritchie.jpg" },
  { id: "harrison", name: "Harrison", role: "Rival", homeRegion: "Hoenn", firstAppearance: "Pop Goes The Sneasel (Ep. 265)", signaturePokemon: ["Blaziken", "Houndoom"], bio: "A powerful Trainer from Littleroot Town who inspired Ash to travel to the Hoenn region.", thumbnail: "/images/characters/harrison.jpg" },
  { id: "tyson", name: "Tyson", role: "Rival", homeRegion: "Hoenn", firstAppearance: "Like a Meowth to a Flame (AG Ep. 125)", signaturePokemon: ["Meowth (In Boots)", "Sceptile"], bio: "The winner of the Ever Grande Conference who fights alongside his signature Meowth in boots.", thumbnail: "/images/characters/tyson.jpg" },
  { id: "paul", name: "Paul", role: "Rival", homeRegion: "Sinnoh", firstAppearance: "Two Degrees of Separation! (DP Ep. 2)", signaturePokemon: ["Electivire", "Ursaring", "Drapion"], bio: "Ash's harsh, pragmatic rival in Sinnoh who values raw strength over the bond with Pokémon.", thumbnail: "/images/characters/paul.jpg" },
  { id: "barry", name: "Barry", role: "Rival", homeRegion: "Sinnoh", firstAppearance: "Barry's Busting Out All Over! (DP Ep. 101)", signaturePokemon: ["Empoleon", "Staraptor"], bio: "An incredibly impatient Trainer from Twinleaf Town who is always rushing everywhere.", thumbnail: "/images/characters/barry.jpg" },
  { id: "trip", name: "Trip", role: "Rival", homeRegion: "Unova", firstAppearance: "In the Shadow of Zekrom! (BW Ep. 1)", signaturePokemon: ["Serperior", "Conkeldurr"], bio: "A calculating Pokémon Photographer and Ash's main rival in the Unova region.", thumbnail: "/images/characters/trip.jpg" },
  { id: "bianca", name: "Bianca", role: "Rival", homeRegion: "Unova", firstAppearance: "Minccino—Neat and Tidy! (BW Ep. 13)", signaturePokemon: ["Emboar", "Escavalier"], bio: "A clumsy but sweet Trainer sent by Professor Juniper to deliver a Badge case to Ash.", thumbnail: "/images/characters/bianca.jpg" },
  { id: "cameron", name: "Cameron", role: "Rival", homeRegion: "Unova", firstAppearance: "Goodbye, Junior Cup - Hello Adventure! (BW Ep. 93)", signaturePokemon: ["Lucario", "Hydreigon"], bio: "An energetic but forgetful Trainer with a secret weapon in his Riolu.", thumbnail: "/images/characters/cameron.jpg" },
  { id: "sawyer", name: "Sawyer", role: "Rival", homeRegion: "Hoenn", firstAppearance: "A Fashionable Battle! (XY Ep. 73)", signaturePokemon: ["Sceptile", "Slurpuff"], bio: "An analytical Trainer who meticulously takes notes on his opponents' battle styles.", thumbnail: "/images/characters/sawyer.jpg" },
  { id: "alain", name: "Alain", role: "Rival", homeRegion: "Kalos", firstAppearance: "Mega Evolution Special I", signaturePokemon: ["Charizard", "Metagross"], bio: "Professor Sycamore's former assistant who travels to master Mega Evolution.", thumbnail: "/images/characters/alain.jpg" },
  { id: "gladion", name: "Gladion", role: "Rival", homeRegion: "Alola", firstAppearance: "A Glaring Rivalry! (SM Ep. 27)", signaturePokemon: ["Silvally", "Lycanroc (Midnight)"], bio: "Lillie's serious older brother and a powerful rival in the Alola region.", thumbnail: "/images/characters/gladion.jpg" },
  { id: "hop", name: "Hop", role: "Rival", homeRegion: "Galar", firstAppearance: "Sword and Shield: 'From Here to Eternatus!' (JN Ep. 42)", signaturePokemon: ["Wooloo", "Cinderace"], bio: "Leon's younger brother who looks up to the Champion and strives to match his strength.", thumbnail: "/images/characters/hop.jpg" },

  // --- PROFESSORS ---
  { id: "prof-oak", name: "Professor Oak", role: "Professor", homeRegion: "Kanto", firstAppearance: "Pokémon - I Choose You! (Ep. 1)", signaturePokemon: ["Dragonite", "Rotom"], bio: "The world-renowned Pokémon researcher located in Pallet Town.", thumbnail: "/images/characters/prof-oak.jpg" },
  { id: "prof-elm", name: "Professor Elm", role: "Professor", homeRegion: "Johto", firstAppearance: "Don't Touch That 'dile (Ep. 117)", signaturePokemon: ["Corsola"], bio: "A student of Professor Oak specializing in Pokémon breeding and Eggs.", thumbnail: "/images/characters/prof-elm.jpg" },
  { id: "prof-birch", name: "Professor Birch", role: "Professor", homeRegion: "Hoenn", firstAppearance: "Get the Show on the Road! (AG Ep. 1)", signaturePokemon: ["Poochyena"], bio: "A field researcher known for studying Pokémon in their natural habitats.", thumbnail: "/images/characters/prof-birch.jpg" },
  { id: "prof-rowan", name: "Professor Rowan", role: "Professor", homeRegion: "Sinnoh", firstAppearance: "Following a Maiden's Voyage! (DP Ep. 1)", signaturePokemon: ["Staraptor"], bio: "A stern and distinguished professor who researches Pokémon evolution.", thumbnail: "/images/characters/prof-rowan.jpg" },
  { id: "prof-juniper", name: "Professor Juniper", role: "Professor", homeRegion: "Unova", firstAppearance: "In the Shadow of Zekrom! (BW Ep. 1)", signaturePokemon: ["Accelgor", "Minccino"], bio: "An energetic researcher studying the origins of Pokémon.", thumbnail: "/images/characters/prof-juniper.jpg" },
  { id: "prof-sycamore", name: "Professor Sycamore", role: "Professor", homeRegion: "Kalos", firstAppearance: "Kalos, Where Dreams and Adventures Begin! (XY Ep. 1)", signaturePokemon: ["Garchomp"], bio: "A charming professor who focuses heavily on the mystery of Mega Evolution.", thumbnail: "/images/characters/prof-sycamore.jpg" },
  { id: "prof-kukui", name: "Professor Kukui", role: "Professor", homeRegion: "Alola", firstAppearance: "Alola to New Adventure! (SM Ep. 1)", signaturePokemon: ["Incineroar", "Braviary"], bio: "A passionate professor researching Pokémon moves, and the founder of Alola's Pokémon League.", thumbnail: "/images/characters/prof-kukui.jpg" },
  { id: "prof-magnolia", name: "Professor Magnolia", role: "Professor", homeRegion: "Galar", firstAppearance: "Sword and Shield: Slumbering Weald! (JN Ep. 42)", signaturePokemon: [], bio: "An esteemed researcher who uncovered the secrets of the Dynamax phenomenon.", thumbnail: "/images/characters/prof-magnolia.jpg" },
  { id: "prof-cerise", name: "Professor Cerise", role: "Professor", homeRegion: "Kanto", firstAppearance: "Legend? Go! Friends? Go! (JN Ep. 2)", signaturePokemon: ["Yamper"], bio: "The head of the Cerise Laboratory in Vermilion City who employs Ash and Goh.", thumbnail: "/images/characters/prof-cerise.jpg" },
  { id: "prof-friede", name: "Friede", role: "Professor", homeRegion: "Kanto", firstAppearance: "The Pendant That Starts It All (Hz Ep. 1)", signaturePokemon: ["Captain Pikachu", "Charizard"], bio: "A skilled Pokémon Professor and the leader of the Rising Volt Tacklers.", thumbnail: "/images/characters/prof-friede.jpg" },

  // --- CHAMPIONS ---
  { id: "lance", name: "Lance", role: "Champion", homeRegion: "Johto", firstAppearance: "Talkin' 'Bout an Evolution (Ep. 235)", signaturePokemon: ["Dragonite", "Gyarados (Red)"], bio: "A member of the Pokémon G-Men and the Champion of the Indigo Elite Four.", thumbnail: "/images/characters/lance.jpg" },
  { id: "steven", name: "Steven Stone", role: "Champion", homeRegion: "Hoenn", firstAppearance: "A Hole Lotta Trouble (AG Ep. 22)", signaturePokemon: ["Metagross", "Aggron"], bio: "The Champion of the Hoenn region, known for his obsession with rare stones.", thumbnail: "/images/characters/steven.jpg" },
  { id: "cynthia", name: "Cynthia", role: "Champion", homeRegion: "Sinnoh", firstAppearance: "Top-Down Training! (DP Ep. 43)", signaturePokemon: ["Garchomp", "Milotic", "Lucario"], bio: "The widely revered Champion of the Sinnoh region with an immense interest in mythology.", thumbnail: "/images/characters/cynthia.jpg" },
  { id: "alder", name: "Alder", role: "Champion", homeRegion: "Unova", firstAppearance: "Ash Versus the Champion! (BW Ep. 52)", signaturePokemon: ["Bouffalant", "Volcarona"], bio: "The wandering Champion of the Unova region who values the bond between people and Pokémon.", thumbnail: "/images/characters/alder.jpg" },
  { id: "diantha", name: "Diantha", role: "Champion", homeRegion: "Kalos", firstAppearance: "The Bonds of Evolution! (XY Ep. 28)", signaturePokemon: ["Gardevoir"], bio: "A world-famous actress and the reigning Champion of the Kalos region.", thumbnail: "/images/characters/diantha.jpg" },
  { id: "leon", name: "Leon", role: "Champion", homeRegion: "Galar", firstAppearance: "Flash of the Titans! (JN Ep. 12)", signaturePokemon: ["Charizard", "Dragapult"], bio: "The undefeated Champion of the Galar region and former Monarch of the World Coronation Series.", thumbnail: "/images/characters/leon.jpg" },
  { id: "geeta", name: "Geeta", role: "Champion", homeRegion: "Paldea", firstAppearance: "Pokémon Horizons", signaturePokemon: ["Glimmora"], bio: "The Top Champion of the Paldea region and chairwoman of the Pokémon League.", thumbnail: "/images/characters/geeta.jpg" },

  // --- ELITE FOUR ---
  { id: "lorelei", name: "Lorelei", role: "Elite Four", homeRegion: "Kanto", firstAppearance: "The Mandarin Island Miss Match (Ep. 99)", signaturePokemon: ["Cloyster", "Lapras"], bio: "An Ice-type specialist and member of the Indigo Plateau Elite Four.", thumbnail: "/images/characters/lorelei.jpg" },
  { id: "bruno", name: "Bruno", role: "Elite Four", homeRegion: "Kanto", firstAppearance: "To Master the Onixpected! (Ep. 71)", signaturePokemon: ["Machamp", "Onix"], bio: "A highly disciplined Fighting-type specialist.", thumbnail: "/images/characters/bruno.jpg" },
  { id: "agatha", name: "Agatha", role: "Elite Four", homeRegion: "Kanto", firstAppearance: "The Scheme Team (AG Ep. 132)", signaturePokemon: ["Gengar", "Golbat"], bio: "A mysterious elderly Ghost-type specialist and former rival of Professor Oak.", thumbnail: "/images/characters/agatha.jpg" },
  { id: "drake", name: "Drake", role: "Elite Four", homeRegion: "Hoenn", firstAppearance: "Vanity Affair (AG Ep. 101)", signaturePokemon: ["Salamence", "Altaria"], bio: "A rough sea captain and Dragon-type expert from the Hoenn region.", thumbnail: "/images/characters/drake.jpg" },
  { id: "aaron", name: "Aaron", role: "Elite Four", homeRegion: "Sinnoh", firstAppearance: "A Trainer and Child Reunion! (DP Ep. 99)", signaturePokemon: ["Drapion", "Vespiquen"], bio: "A Bug-type master who respects the beauty of insect Pokémon.", thumbnail: "/images/characters/aaron.jpg" },
  { id: "flint", name: "Flint", role: "Elite Four", homeRegion: "Sinnoh", firstAppearance: "Flint Sparks the Fire! (DP Ep. 165)", signaturePokemon: ["Infernape"], bio: "A fiery Trainer and close childhood friend of Volkner.", thumbnail: "/images/characters/flint.jpg" },
  { id: "lucian", name: "Lucian", role: "Elite Four", homeRegion: "Sinnoh", firstAppearance: "An Elite Meet and Greet! (DP Ep. 35)", signaturePokemon: ["Bronzong", "Girafarig"], bio: "An intellectual Psychic-type expert who loves reading literature.", thumbnail: "/images/characters/lucian.jpg" },
  { id: "malva", name: "Malva", role: "Elite Four", homeRegion: "Kalos", firstAppearance: "Cloudy Fate, Bright Future! (XY Ep. 92)", signaturePokemon: ["Houndoom", "Talonflame"], bio: "A famous news reporter and Fire-type user with hidden ties to Team Flare.", thumbnail: "/images/characters/malva.jpg" },

  // --- TEAM ROCKET & VILLAINS ---
  { id: "jessie", name: "Jessie", role: "Team Rocket", homeRegion: "Kanto", firstAppearance: "Pokémon Emergency! (Ep. 2)", signaturePokemon: ["Wobbuffet", "Arbok", "Seviper", "Mimikyu"], bio: "A vain but determined agent of Team Rocket with a flair for the dramatic.", thumbnail: "/images/characters/jessie.jpg" },
  { id: "james", name: "James", role: "Team Rocket", homeRegion: "Kanto", firstAppearance: "Pokémon Emergency! (Ep. 2)", signaturePokemon: ["Weezing", "Carnivine", "Inkay", "Mareanie"], bio: "A runaway heir to a massive fortune who treats his Pokémon like beloved family.", thumbnail: "/images/characters/james.jpg" },
  { id: "giovanni", name: "Giovanni", role: "Team Rocket", homeRegion: "Kanto", firstAppearance: "Battle Aboard the St. Anne (Ep. 15)", signaturePokemon: ["Persian", "Rhydon"], bio: "The ruthless boss of Team Rocket and the former Gym Leader of Viridian City.", thumbnail: "/images/characters/giovanni.jpg" },
  { id: "cassidy", name: "Cassidy", role: "Team Rocket", homeRegion: "Kanto", firstAppearance: "The Breeding Center Secret (Ep. 57)", signaturePokemon: ["Raticate", "Houndour"], bio: "Jessie's primary rival within the Team Rocket organization.", thumbnail: "/images/characters/cassidy.jpg" },
  { id: "butch", name: "Butch", role: "Team Rocket", homeRegion: "Kanto", firstAppearance: "The Breeding Center Secret (Ep. 57)", signaturePokemon: ["Primeape", "Hitmontop"], bio: "Cassidy's partner, whom everyone constantly addresses by the wrong name.", thumbnail: "/images/characters/butch.jpg" },
  { id: "lysandre", name: "Lysandre", role: "Villain", homeRegion: "Kalos", firstAppearance: "Mega Evolution Special I", signaturePokemon: ["Gyarados", "Pyroar"], bio: "The visionary leader of Team Flare who seeks to create a 'beautiful' world through destruction.", thumbnail: "/images/characters/lysandre.jpg" },
  { id: "ghetsis", name: "Ghetsis", role: "Villain", homeRegion: "Unova", firstAppearance: "Team Plasma's Pokémon Power Plot! (BW Ep. 112)", signaturePokemon: ["Hydreigon"], bio: "The cruel mastermind behind Team Plasma who manipulated N to conquer Unova.", thumbnail: "/images/characters/ghetsis.jpg" },
  { id: "cyrus", name: "Cyrus", role: "Villain", homeRegion: "Sinnoh", firstAppearance: "Losing Its Lustrous! (DP Ep. 97)", signaturePokemon: ["Weavile", "Honchkrow"], bio: "The emotionless leader of Team Galactic aiming to rebuild the universe without spirit.", thumbnail: "/images/characters/cyrus.jpg" },
  { id: "archie", name: "Archie", role: "Villain", homeRegion: "Hoenn", firstAppearance: "Gaining Groudon (AG Ep. 97)", signaturePokemon: ["Kyogre (Temporary)"], bio: "The head of Team Aqua, wishing to expand the oceans for marine life.", thumbnail: "/images/characters/archie.jpg" },
  { id: "maxie", name: "Maxie", role: "Villain", homeRegion: "Hoenn", firstAppearance: "Gaining Groudon (AG Ep. 97)", signaturePokemon: ["Mightyena", "Camerupt"], bio: "The leader of Team Magma, aiming to expand the landmass for terrestrial life.", thumbnail: "/images/characters/maxie.jpg" },
  { id: "lusamine", name: "Lusamine", role: "Villain", homeRegion: "Alola", firstAppearance: "A Dream Encounter! (SM Ep. 44)", signaturePokemon: ["Clefable", "Salazzle"], bio: "The president of Aether Foundation, corrupted by her obsession with Ultra Beasts.", thumbnail: "/images/characters/lusamine.jpg" },
  { id: "rose", name: "Chairman Rose", role: "Villain", homeRegion: "Galar", firstAppearance: "Toughing It Out! (JN Ep. 27)", signaturePokemon: ["Copperajah", "Ferrothorn"], bio: "The misguided chairman of the Galar Pokémon League who seeks to solve a future energy crisis by any means.", thumbnail: "/images/characters/rose.jpg" },

  // --- GYM LEADERS ---
  { id: "erika", name: "Erika", role: "Gym Leader", homeRegion: "Kanto", firstAppearance: "Pokémon Scent-sation! (Ep. 26)", signaturePokemon: ["Vileplume", "Gloom", "Tangela"], bio: "The Grass-type Gym Leader of Celadon City who also runs a successful perfume shop.", thumbnail: "/images/characters/erika.jpg" },
  { id: "sabrina", name: "Sabrina", role: "Gym Leader", homeRegion: "Kanto", firstAppearance: "Abra and the Psychic Showdown (Ep. 22)", signaturePokemon: ["Alakazam", "Kadabra"], bio: "The powerful and intimidating Psychic-type Gym Leader of Saffron City.", thumbnail: "/images/characters/sabrina.jpg" },
  { id: "surge", name: "Lt. Surge", role: "Gym Leader", homeRegion: "Kanto", firstAppearance: "Electric Shock Showdown (Ep. 14)", signaturePokemon: ["Raichu"], bio: "A towering military veteran and Electric-type Gym Leader of Vermilion City.", thumbnail: "/images/characters/surge.jpg" },
  { id: "blaine", name: "Blaine", role: "Gym Leader", homeRegion: "Kanto", firstAppearance: "Riddle Me This (Ep. 58)", signaturePokemon: ["Magmar", "Ninetales"], bio: "The hot-headed Fire-type Gym Leader of Cinnabar Island who loves riddles.", thumbnail: "/images/characters/blaine.jpg" },
  { id: "roxanne", name: "Roxanne", role: "Gym Leader", homeRegion: "Hoenn", firstAppearance: "Gonna Rule The School! (AG Ep. 15)", signaturePokemon: ["Nosepass", "Geodude"], bio: "A strict teacher and the Rock-type Gym Leader of Rustboro City.", thumbnail: "/images/characters/roxanne.jpg" },
  { id: "gardenia", name: "Gardenia", role: "Gym Leader", homeRegion: "Sinnoh", firstAppearance: "The Grass Menagerie! (DP Ep. 31)", signaturePokemon: ["Roserade", "Turtwig"], bio: "The energetic Grass-type Gym Leader of Eterna City.", thumbnail: "/images/characters/gardenia.jpg" },
  { id: "volkner", name: "Volkner", role: "Gym Leader", homeRegion: "Sinnoh", firstAppearance: "Flint Sparks the Fire! (DP Ep. 165)", signaturePokemon: ["Electivire", "Luxray"], bio: "The apathetic but powerful Electric-type Gym Leader of Sunyshore City.", thumbnail: "/images/characters/volkner.jpg" },
  { id: "raihan", name: "Raihan", role: "Gym Leader", homeRegion: "Galar", firstAppearance: "Toughing It Out! (JN Ep. 27)", signaturePokemon: ["Duraludon", "Flygon"], bio: "The Dragon-type Gym Leader of Hammerlocke and Leon's self-proclaimed greatest rival.", thumbnail: "/images/characters/raihan.jpg" }
];

export default function CharacterDirectory() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  useEffect(() => {
    if (selectedCharacter) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; }
  }, [selectedCharacter]);

  const filteredCharacters = ALL_CHARACTERS.filter(char => {
    const matchesSearch = char.name.toLowerCase().includes(search.toLowerCase()) || 
                          char.homeRegion.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "All" || char.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-300 relative min-h-screen bg-[#0b0f19]">
      
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-black text-white">Character Directory</h2>
          <p className="text-slate-400 text-sm mt-1">Historical profiles and signature teams.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search characters or regions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none w-full sm:w-56 transition-all"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none cursor-pointer"
          >
            <option value="All">All Roles</option>
            <option value="Protagonist">Protagonists</option>
            <option value="Companion">Companions</option>
            <option value="Rival">Rivals</option>
            <option value="Professor">Professors</option>
            <option value="Champion">Champions</option>
            <option value="Elite Four">Elite Four</option>
            <option value="Gym Leader">Gym Leaders</option>
            <option value="Team Rocket">Team Rocket</option>
            <option value="Villain">Villains</option>
          </select>
        </div>
      </div>

      {/* Roster Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCharacters.map((char) => (
          <div 
            key={char.id} 
            onClick={() => setSelectedCharacter(char)}
            className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-indigo-500/50 hover:shadow-lg transition-all flex flex-col group cursor-pointer"
          >
            {/* Split Top Accent Card */}
            <div className="h-32 bg-slate-850 relative overflow-hidden shrink-0">
              {/* Background Blur Image */}
              <FallbackImage 
                src={char.thumbnail} 
                name={char.name}
                type="cover"
                className="w-full h-full object-cover opacity-30 blur-sm scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] to-transparent" />
              
              <div className="absolute bottom-3 left-4 flex items-end gap-3">
                {/* Clean Thumbnail */}
                <div className="w-14 h-14 bg-slate-800 rounded-xl border-2 border-slate-700 overflow-hidden shrink-0 shadow-md">
                  <FallbackImage 
                    src={char.thumbnail} 
                    name={char.name}
                    type="thumbnail"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform bg-slate-800"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 block w-max mb-1">
                    {char.role}
                  </span>
                  <h3 className="text-md font-bold text-white leading-tight">{char.name}</h3>
                </div>
              </div>
            </div>

            {/* Profile Snippet */}
            <div className="p-4 flex-grow flex flex-col justify-between">
              <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-4">{char.bio}</p>
              
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Origin:</span>
                  <span className="text-slate-300 truncate ml-2">{char.homeRegion}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- CHARACTER MODAL OVERLAY --- */}
      {selectedCharacter && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedCharacter(null)}
        >
          <div 
            className="bg-[#0b0f19] border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedCharacter(null)}
              className="absolute top-4 right-4 z-10 bg-slate-900/80 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Modal Image */}
            <div className="w-full md:w-2/5 h-64 md:h-auto bg-slate-900 relative">
              <FallbackImage 
                src={selectedCharacter.thumbnail} 
                name={selectedCharacter.name}
                type="modal"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#0b0f19] to-transparent opacity-80" />
            </div>

            {/* Modal Content */}
            <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col justify-center">
              <span className="text-xs font-mono tracking-widest text-indigo-400 uppercase mb-2 block">
                {selectedCharacter.role}
              </span>
              <h2 className="text-3xl font-black text-white mb-6">{selectedCharacter.name}</h2>
              <p className="text-slate-300 leading-relaxed mb-8">{selectedCharacter.bio}</p>

              <div className="space-y-4 border-t border-slate-800 pt-6">
                <div>
                  <span className="text-slate-500 text-xs block mb-1">Origin Region</span>
                  <span className="text-white font-medium">{selectedCharacter.homeRegion}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block mb-1">First Appearance</span>
                  <span className="text-white font-medium">{selectedCharacter.firstAppearance}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block mb-2">Signature Partners</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedCharacter.signaturePokemon.map((poke) => (
                      <span key={poke} className="bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1 rounded-full text-xs font-medium shadow-sm">
                        {poke}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}