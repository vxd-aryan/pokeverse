// lib/animeData.ts
import { WatchEntry, TVSeries, Movie } from '@/types/anime';

export const TV_SERIES_REGISTRY: Record<string, TVSeries> = {
  "original-series": {
    id: "original-series",
    title: "Pokémon: The Original Series",
    region: "Kanto, Orange Islands, Johto",
    seasons: 5,
    type: "TV Series",
    releaseYear: 1997,
    thumbnail: "/images/series/original-series.jpg",
    chronologicalOrder: 1,
    episodeCount: 274,
    mainCharacters: ["Ash", "Misty", "Brock", "Tracey"],
    featuredPokemon: ["Pikachu", "Charizard", "Bulbasaur", "Squirtle"],
    villains: ["Team Rocket"],
    description: "Ash Ketchum, a passionate but deeply stubborn ten-year-old from Pallet Town, wakes up late on the most important day of his life. Forced to partner with a highly uncooperative Pikachu, Ash embarks on a defining journey across the Kanto, Orange Islands, and Johto regions. This saga chronicles the foundation of a Pokémon Master. It covers Ash’s early struggles to earn his gym badges, his legendary rivalries with Gary Oak, and the formation of his iconic travel trio alongside Cerulean City Gym Leader Misty and Pewter City Gym Leader Brock. From releasing his Butterfree to battling the relentless Team Rocket trio, this is the era that established the unbreakable bond between a boy and his Pikachu."
  },
  "advanced-generation": {
    id: "advanced-generation",
    title: "Pokémon: Advanced Generation",
    region: "Hoenn, Kanto (Battle Frontier)",
    seasons: 4,
    type: "TV Series",
    releaseYear: 2002,
    thumbnail: "/images/series/advanced-generation.jpg",
    chronologicalOrder: 2,
    episodeCount: 192,
    mainCharacters: ["Ash", "May", "Max", "Brock"],
    featuredPokemon: ["Pikachu", "Sceptile", "Blaziken", "Swellow"],
    villains: ["Team Rocket", "Team Aqua", "Team Magma"],
    description: "Leaving all his Pokémon behind except Pikachu, Ash travels to the lush, nature-rich Hoenn region for a completely fresh start. The dynamic shifts dramatically as Ash steps into a mentor role for May, a novice trainer who discovers her passion for the newly introduced Pokémon Contests, and her hyper-intelligent little brother, Max. This era is defined by extreme environmental conflicts, as Ash and his friends find themselves caught in the crossfire between two eco-terrorist organizations: Team Magma and Team Aqua, who seek to awaken the legendary titans Groudon and Kyogre. After conquering the Hoenn League, Ash returns to Kanto to face his most grueling challenge yet: the elite Battle Frontier."
  },
  "diamond-pearl": {
    id: "diamond-pearl",
    title: "Pokémon: Diamond and Pearl",
    region: "Sinnoh",
    seasons: 4,
    type: "TV Series",
    releaseYear: 2006,
    thumbnail: "/images/series/diamond-pearl.jpg",
    chronologicalOrder: 3,
    episodeCount: 191,
    mainCharacters: ["Ash", "Dawn", "Brock"],
    featuredPokemon: ["Pikachu", "Infernape", "Piplup", "Lucario"],
    villains: ["Team Rocket", "Team Galactic"],
    description: "Widely regarded as one of the most intense and strategically complex arcs in the database, the Sinnoh saga pushes Ash to his absolute limits. Joined by Dawn, a fiercely ambitious Coordinator striving to honor her mother's legacy, Ash faces off against Paul—a ruthlessly calculating rival whose ideology on Pokémon training opposes everything Ash stands for. The lore deepens immensely as the group uncovers the creation myths of the Pokémon universe. They must repeatedly thwart Team Galactic, a terrifying syndicate led by Cyrus, who intends to use the god-like entities Dialga and Palkia to erase the current universe and forge a new one devoid of spirit and emotion."
  },
  "black-white": {
    id: "black-white",
    title: "Pokémon: Black & White",
    region: "Unova",
    seasons: 3,
    type: "TV Series",
    releaseYear: 2010,
    thumbnail: "/images/series/black-white.jpg",
    chronologicalOrder: 4,
    episodeCount: 142,
    mainCharacters: ["Ash", "Iris", "Cilan"],
    featuredPokemon: ["Pikachu", "Axew", "Oshawott", "Snivy"],
    villains: ["Team Rocket", "Team Plasma"],
    description: "Traveling to the distant Unova region, Ash finds himself in a land where classic Pokémon are entirely absent. Partnering with Iris, a wild and spirited Dragon-type prodigy, and Cilan, an eccentric Pokémon Connoisseur and Gym Leader, Ash faces a 'soft reset' of his journey, dealing with wildly unpredictable new species and a faster-paced adventure. The region is shadowed by the looming threat of Team Plasma, an organization that masquerades as an animal liberation front. This arc deeply explores the philosophical question of whether Pokémon should be kept in Poké Balls at all, culminating in clashes with N, a tragic anti-hero who can speak directly to the hearts of Pokémon."
  },
  "xy": {
    id: "xy",
    title: "Pokémon the Series: XY & XYZ",
    region: "Kalos",
    seasons: 3,
    type: "TV Series",
    releaseYear: 2013,
    thumbnail: "/images/series/xy.jpg",
    chronologicalOrder: 5,
    episodeCount: 140,
    mainCharacters: ["Ash", "Serena", "Clemont", "Bonnie"],
    featuredPokemon: ["Pikachu", "Greninja", "Braixen", "Lucario"],
    villains: ["Team Rocket", "Team Flare"],
    description: "A cinematic, high-octane era that pushes the animation and stakes to their absolute peak. Ash arrives in the Kalos region radiating confidence and battle-hardened competence. He is joined by Serena, a childhood friend harboring a deep crush who seeks her own path as a Performer; Clemont, an anxiety-prone genius inventor; and his adorable sister, Bonnie. This saga focuses heavily on the mysteries of Mega Evolution and the unique, legendary 'Ash-Greninja' phenomenon—a rare Bond Phenomenon that merges Ash's consciousness with his Pokémon during combat. The series concludes with a massive, region-wide war against Team Flare and Lysandre, who attempt to use the legendary Zygarde to enact a global genocide and 'beautify' the world."
  },
  "sun-moon": {
    id: "sun-moon",
    title: "Pokémon: Sun & Moon",
    region: "Alola",
    seasons: 3,
    type: "TV Series",
    releaseYear: 2016,
    thumbnail: "/images/series/sun-moon.jpg",
    chronologicalOrder: 6,
    episodeCount: 146,
    mainCharacters: ["Ash", "Lillie", "Kiawe", "Mallow", "Lana", "Sophocles"],
    featuredPokemon: ["Pikachu", "Rowlet", "Lycanroc", "Incineroar"],
    villains: ["Team Rocket", "Team Skull", "Aether Foundation"],
    description: "A massive departure from the traditional traveling formula, Ash arrives in the tropical paradise of Alola and actually settles down, enrolling in the Pokémon School under the guidance of Professor Kukui. This era trades traditional gym battles for a deeply emotional, slice-of-life 'found family' narrative, blending absurd comedy with surprisingly heavy themes of grief, loss, and community. Ash masters the explosive Z-Move mechanics, tackles the cultural Island Challenge, and joins the Ultra Guardians to defend the region from extra-dimensional Ultra Beasts. It is here, after two decades of failure, that Ash finally shatters his ceiling and wins a regional League, becoming the first-ever Champion of Alola."
  },
  "journeys": {
    id: "journeys",
    title: "Pokémon Journeys",
    region: "All Regions",
    seasons: 3,
    type: "TV Series",
    releaseYear: 2019,
    thumbnail: "/images/series/journeys.jpg",
    chronologicalOrder: 7,
    episodeCount: 147,
    mainCharacters: ["Ash", "Goh", "Chloe"],
    featuredPokemon: ["Pikachu", "Lucario", "Gengar", "Cinderace"],
    villains: ["Team Rocket"],
    description: "The culmination of a 25-year legacy. Instead of focusing on a single region, Ash is appointed as a research fellow for the Cerise Laboratory alongside Goh, a brilliant but socially isolated boy whose singular goal is to catch every Pokémon in existence—including the mythical Mew. Together, they globe-trot across all eight known regions. Ash enters the World Coronation Series, a global ranking system to determine the absolute strongest trainer on the planet. This saga brings back legendary companions, old rivals, and forgotten Pokémon, culminating in the Masters Eight Tournament. Here, Ash must battle the reigning regional Champions to finally achieve his dream and defeat the undefeated Monarch, Leon."
  },
  "horizons": {
    id: "horizons",
    title: "Pokémon Horizons: The Series",
    region: "Paldea and Beyond",
    seasons: 3,
    type: "TV Series",
    releaseYear: 2023,
    thumbnail: "/images/series/horizons.jpg",
    chronologicalOrder: 8,
    episodeCount: 68,
    mainCharacters: ["Liko", "Roy", "Friede"],
    featuredPokemon: ["Sprigatito", "Fuecoco", "Captain Pikachu"],
    villains: ["The Explorers"],
    description: "A brand-new epoch begins. Ash Ketchum’s journey has concluded, and the torch is passed to Liko, a timid but highly observant girl from Paldea partnered with Sprigatito, and Roy, an energetic boy from Kanto partnered with Fuecoco. Instead of traditional gym battles, the duo joins the Rising Volt Tacklers—a ragtag crew of adventurers traveling the skies aboard the airship Brave Asagi, led by Friede and the formidable Captain Pikachu. Pursued by a shadowy and dangerous organization known as the Explorers, Liko and Roy must unlock the secrets of an ancient, mysterious pendant and a cryptic, ancient Poké Ball that holds the key to the legendary Terapagos and the Six Heroes of Lucius."
  }
};

export const MOVIE_REGISTRY: Record<string, Movie> = {
  "mewtwo-strikes-back": { 
    id: "mewtwo-strikes-back", 
    title: "Pokémon: The First Movie - Mewtwo Strikes Back", 
    chronologicalOrder: 1,
    releaseYear: 1998,
    runtimeMinutes: 75,
    description: "Driven by an intense existential crisis, the genetically engineered clone Mewtwo rebels against human exploitation and issues a fierce battle invitation to the world's strongest trainers on New Island. Ash must demonstrate that true strength comes from the choices a soul makes, not the circumstances of its birth.",
    featuredLegendary: "Mewtwo & Mew",
    relatedSeriesId: "indigo-league",
    thumbnail: "/images/movies/mewtwo-strikes-back.jpg",
    type: "Movie",
    region: "Kanto"
  },
  "movie-2000": { 
    id: "movie-2000", 
    title: "Pokémon The Movie 2000", 
    chronologicalOrder: 2,
    releaseYear: 1999,
    runtimeMinutes: 81,
    description: "A reckless collector disrupts the natural order by capturing the legendary birds to awaken Lugia, triggering catastrophic climate anomalies. Prophesied as the Chosen One, Ash Ketchum must journey through the raging elemental storms of the Orange Archipelago to retrieve three mystical orbs and restore global balance.",
    featuredLegendary: "Lugia & Legendary Birds",
    relatedSeriesId: "orange-islands",
    thumbnail: "/images/movies/movie-2000.jpg",
    type: "Movie",
    region: "Orange Islands"
  },
  "spell-of-unknown": { 
    id: "spell-of-unknown", 
    title: "Pokémon 3: The Movie - Spell of the Unown", 
    chronologicalOrder: 3,
    releaseYear: 2000,
    runtimeMinutes: 74,
    description: "When a young girl's loneliness awakens the reality-warping psychic entities known as the Unown, Greenfield is encased in a surreal crystal barrier. To build her perfect family, an illusionary Entei kidnaps Ash's mother, forcing Ash to infiltrate the crystalline palace in a high-stakes rescue mission.",
    featuredLegendary: "Entei & Unown",
    relatedSeriesId: "johto-journeys",
    thumbnail: "/images/movies/spell-of-unknown.jpg",
    type: "Movie",
    region: "Johto"
  },
  "mewtwo-returns": { 
    id: "mewtwo-returns", 
    title: "Pokémon: Mewtwo Returns", 
    chronologicalOrder: 4,
    releaseYear: 2000,
    runtimeMinutes: 63,
    description: "Hidden away in the remote Mount Quena, Mewtwo and his fellow clones seek a peaceful existence away from humanity. However, Giovanni and Team Rocket discover their sanctuary, forcing Ash and his friends to help Mewtwo defend his newfound home and overcome his lingering distrust of humans.",
    featuredLegendary: "Mewtwo",
    relatedSeriesId: "johto-league-champions",
    thumbnail: "/images/movies/mewtwo-returns.jpg",
    type: "Movie",
    region: "Johto"
  },
  "celebi": { 
    id: "celebi", 
    title: "Pokémon 4Ever: Celebi - Voice of the Forest", 
    chronologicalOrder: 5,
    releaseYear: 2001,
    runtimeMinutes: 79,
    description: "Pulled forty years forward through time while fleeing an aggressive hunter, a young boy named Sammy and the mythical Celebi materialize in the modern era. Ash must team up with Sammy and the legendary beast Suicune to save Celebi from a vicious Team Rocket marauder and his corrupting Dark Ball.",
    featuredLegendary: "Celebi & Suicune",
    relatedSeriesId: "johto-league-champions",
    thumbnail: "/images/movies/celebi.jpg",
    type: "Movie",
    region: "Johto"
  },
  "heroes": { 
    id: "heroes", 
    title: "Pokémon Heroes", 
    chronologicalOrder: 6,
    releaseYear: 2002,
    runtimeMinutes: 71,
    description: "In the beautiful water capital of Alto Mare, Ash and his friends encounter the secretive Eon Pokémon, Latias and Latios. When two cunning thieves attempt to steal the Soul Dew to activate a deadly ancient mechanism, Ash must race through the city's canals to prevent a catastrophic tidal wave.",
    featuredLegendary: "Latias & Latios",
    relatedSeriesId: "master-quest",
    thumbnail: "/images/movies/heroes.jpg",
    type: "Movie",
    region: "Johto"
  },
  "jirachi": { 
    id: "jirachi", 
    title: "Pokémon: Jirachi - Wish Maker", 
    chronologicalOrder: 7,
    releaseYear: 2003,
    runtimeMinutes: 81,
    description: "The Millennium Comet only appears in the night sky once every thousand years. During its passing, the mythical wish-granting Pokémon Jirachi awakens. Ash, Max, and their friends must protect Jirachi from a rogue former Team Magma scientist who wishes to exploit its energy to resurrect an ancient terror.",
    featuredLegendary: "Jirachi & Groudon",
    relatedSeriesId: "advanced",
    thumbnail: "/images/movies/jirachi.jpg",
    type: "Movie",
    region: "Hoenn"
  },
  "deoxys": { 
    id: "deoxys", 
    title: "Pokémon: Destiny Deoxys", 
    chronologicalOrder: 8,
    releaseYear: 2004,
    runtimeMinutes: 98,
    description: "A colossal meteorite crashes into Earth, bringing with it the alien Pokémon Deoxys. Four years later, Deoxys descends upon the high-tech LaRousse City seeking its lost companion, triggering a furious territorial battle with the ozone guardian Rayquaza that traps Ash and his friends in a city-wide lockdown.",
    featuredLegendary: "Deoxys & Rayquaza",
    relatedSeriesId: "advanced-challenge",
    thumbnail: "/images/movies/deoxys.jpg",
    type: "Movie",
    region: "Hoenn"
  },
  "lucario": { 
    id: "lucario", 
    title: "Pokémon: Lucario and the Mystery of Mew", 
    chronologicalOrder: 9,
    releaseYear: 2005,
    runtimeMinutes: 100,
    description: "An ancient Lucario is unexpectedly released from a mystical staff. Embittered by what it perceives as its master's historical betrayal, Lucario reluctantly guides Ash to the colossal Tree of Beginning to rescue Pikachu from Mew, leading to a heartbreaking revelation about self-sacrifice and Aura power.",
    featuredLegendary: "Mew & Regi Trio",
    relatedSeriesId: "advanced-battle",
    thumbnail: "/images/movies/lucario.jpg",
    type: "Movie",
    region: "Kanto"
  },
  "mirage": { 
    id: "mirage", 
    title: "The Mastermind of Mirage Pokémon", 
    chronologicalOrder: 10,
    releaseYear: 2006,
    runtimeMinutes: 42,
    description: "In this 10th-anniversary special, Ash and his friends are invited by Dr. Yung to witness his new Mirage System, which can digitally construct flawless holographic Pokémon. When a mysterious Mirage Master hijacks the technology to create a terrifyingly powerful digital Mewtwo, Ash must intervene.",
    featuredLegendary: "Mirage Mewtwo",
    relatedSeriesId: "battle-frontier",
    thumbnail: "/images/movies/mirage.jpg",
    type: "Movie",
    region: "Kanto"
  },
  "ranger": { 
    id: "ranger", 
    title: "Pokémon Ranger and the Temple of the Sea", 
    chronologicalOrder: 11,
    releaseYear: 2006,
    runtimeMinutes: 105,
    description: "Ash teams up with Pokémon Ranger Jack Walker to protect a rare Manaphy egg from an obsessed pirate captain. The group must escort the newly hatched Prince of the Sea to an ancient underwater temple before the pirate can seize the Sea Crown and rule the oceans.",
    featuredLegendary: "Manaphy & Kyogre",
    relatedSeriesId: "battle-frontier",
    thumbnail: "/images/movies/ranger.jpg",
    type: "Movie",
    region: "Kanto"
  },
  "darkrai": { 
    id: "darkrai", 
    title: "Pokémon: The Rise of Darkrai", 
    chronologicalOrder: 12,
    releaseYear: 2007,
    runtimeMinutes: 90,
    description: "Alamos Town becomes the collateral damage in a terrifying interdimensional clash between the deities of time and space, Dialga and Palkia. As the town begins to fade from existence, the misunderstood shadowy Pokémon Darkrai steps up to defend the beautiful gardens it calls home.",
    featuredLegendary: "Dialga, Palkia & Darkrai",
    relatedSeriesId: "diamond-and-pearl",
    thumbnail: "/images/movies/darkrai.jpg",
    type: "Movie",
    region: "Sinnoh"
  },
  "giratina": { 
    id: "giratina", 
    title: "Pokémon: Giratina and the Sky Warrior", 
    chronologicalOrder: 13,
    releaseYear: 2008,
    runtimeMinutes: 96,
    description: "Furious at the pollution leaking into its Reverse World, the renegade deity Giratina attacks Dialga. The conflict drags Ash, Dawn, and the gratitude Pokémon Shaymin into a bizarre alternate dimension, where they must stop an ambitious villain trying to steal Giratina's power.",
    featuredLegendary: "Giratina & Shaymin",
    relatedSeriesId: "battle-dimension",
    thumbnail: "/images/movies/giratina.jpg",
    type: "Movie",
    region: "Sinnoh"
  },
  "arceus": { 
    id: "arceus", 
    title: "Pokémon: Arceus and the Jewel of Life", 
    chronologicalOrder: 14,
    releaseYear: 2009,
    runtimeMinutes: 94,
    description: "The Alpha Pokémon Arceus awakens from a long slumber to cast judgment upon humanity for an ancient betrayal involving the Jewel of Life. Ash, Dawn, and Brock are sent back in time to uncover the truth of Michina Town's history and stop Arceus's unstoppable rampage.",
    featuredLegendary: "Arceus",
    relatedSeriesId: "galactic-battles",
    thumbnail: "/images/movies/arceus.jpg",
    type: "Movie",
    region: "Sinnoh"
  },
  "zoroark": { 
    id: "zoroark", 
    title: "Pokémon: Zoroark: Master of Illusions", 
    chronologicalOrder: 15,
    releaseYear: 2010,
    runtimeMinutes: 95,
    description: "Crown City falls under chaos as the illusion fox Zoroark is blackmailed into terrorizing the populace by a corrupt businessman looking to capture the time-traveling Celebi. Ash and friends work alongside the playful Zorua to break the businessman's hold and clear Zoroark's name.",
    featuredLegendary: "Zoroark, Zorua & Legendary Beasts",
    relatedSeriesId: "sinnoh-league-victors",
    thumbnail: "/images/movies/zoroark.jpg",
    type: "Movie",
    region: "Sinnoh"
  },
  "victini": { 
    id: "victini", 
    title: "Pokémon The Movie: White - Victini and Zekrom", 
    chronologicalOrder: 16,
    releaseYear: 2011,
    runtimeMinutes: 92,
    description: "In the town of Eindoak, a well-meaning descendant of the People of the Vale attempts to harness the power of the mythical Victini to restore his homeland. His actions inadvertently unleash chaotic dragon energy, forcing Ash to seek the legendary Zekrom to stop the destruction.",
    featuredLegendary: "Victini & Zekrom",
    relatedSeriesId: "black-and-white",
    thumbnail: "/images/movies/victini.jpg",
    type: "Movie",
    region: "Unova"
  },
  "kyurem": { 
    id: "kyurem", 
    title: "Pokémon The Movie: Kyurem vs. The Sword of Justice", 
    chronologicalOrder: 17,
    releaseYear: 2012,
    runtimeMinutes: 71,
    description: "The young apprentice Keldeo recklessly challenges the terrifying ice dragon Kyurem before completing its training. Defeated and fleeing in terror, Keldeo crashes into Ash and his friends, who must help the young fighter find its courage and save the captured Swords of Justice.",
    featuredLegendary: "Kyurem & Swords of Justice",
    relatedSeriesId: "rival-destinies",
    thumbnail: "/images/movies/kyurem.jpg",
    type: "Movie",
    region: "Unova"
  },
  "genesect": { 
    id: "genesect", 
    title: "Pokémon The Movie: Genesect and the Legend Awakened", 
    chronologicalOrder: 18,
    releaseYear: 2013,
    runtimeMinutes: 71,
    description: "An army of ancient, mechanically enhanced Genesect descends upon New Tork City, fiercely claiming the urban center as their new nest. When their hostile takeover endangers the city's power grid, a new Mewtwo intervenes, leading to a high-speed clash of engineered titans.",
    featuredLegendary: "Genesect & Mewtwo",
    relatedSeriesId: "adventures-in-unova",
    thumbnail: "/images/movies/genesect.jpg",
    type: "Movie",
    region: "Unova"
  },
  "diancie": { 
    id: "diancie", 
    title: "Pokémon The Movie: Diancie and the Cocoon of Destruction", 
    chronologicalOrder: 19,
    releaseYear: 2014,
    runtimeMinutes: 76,
    description: "The subterranean Diamond Domain is dying as its sacred Heart Diamond fades. The naive princess Diancie sets out to find the life-giving Xerneas to learn how to create a new diamond, but her journey awakens the terrifying destruction Pokémon, Yveltal.",
    featuredLegendary: "Diancie, Xerneas & Yveltal",
    relatedSeriesId: "xy",
    thumbnail: "/images/movies/diancie.jpg",
    type: "Movie",
    region: "Kalos"
  },
  "hoopa": { 
    id: "hoopa", 
    title: "Pokémon The Movie: Hoopa and the Clash of Ages", 
    chronologicalOrder: 20,
    releaseYear: 2015,
    runtimeMinutes: 78,
    description: "Ash meets the mischievous Hoopa, a mythical Pokémon capable of summoning objects—and other Pokémon—through its magical rings. When a dark power that was sealed away decades ago breaches its containment, a colossal battle erupts involving multiple Legendary Pokémon across the desert city.",
    featuredLegendary: "Hoopa & Multiple Legendaries",
    relatedSeriesId: "kalos-quest",
    thumbnail: "/images/movies/hoopa.jpg",
    type: "Movie",
    region: "Kalos"
  },
  "volcanion": { 
    id: "volcanion", 
    title: "Pokémon The Movie: Volcanion and the Mechanical Marvel", 
    chronologicalOrder: 21,
    releaseYear: 2016,
    runtimeMinutes: 90,
    description: "A mysterious magnetic band suddenly tethers Ash to the mythical Volcanion, a gruff Pokémon who despises humans. Bound together, they must infiltrate the mechanical Azimuth Kingdom to rescue the man-made Pokémon Magearna from a corrupt minister plotting to weaponize her Soul-Heart.",
    featuredLegendary: "Volcanion & Magearna",
    relatedSeriesId: "xyz",
    thumbnail: "/images/movies/volcanion.jpg",
    type: "Movie",
    region: "Kalos"
  }
};

export const CHRONOLOGICAL_WATCH_ORDER: WatchEntry[] = [
  {
    chronologicalOrder: 1,
    type: "series",
    title: "SEASON 1: INDIGO LEAGUE (Ep 1-69)",
    region: "Kanto",
    description: "Ash Ketchum begins his journey with Pikachu. Winning Gym Badges turns out to be tough, but he's got Brock, Misty, and new Pokémon friends by his side."
  },
  {
    chronologicalOrder: 2,
    type: "movie",
    title: "THE FIRST MOVIE: MEWTWO STRIKES BACK (1998)",
    region: "Kanto",
    description: "Scientists genetically create a new Pokémon, Mewtwo, but the results are horrific and disastrous."
  },
  {
    chronologicalOrder: 3,
    type: "series",
    title: "SEASON 1: INDIGO LEAGUE (Ep 70-82)",
    region: "Kanto",
    description: "The exciting conclusion of Ash’s journey in the Pokémon League, setting the stage for new adventures."
  },
  {
    chronologicalOrder: 4,
    type: "series",
    title: "SEASON 2: ORANGE ISLANDS (Ep 1-24)",
    region: "Orange Islands",
    description: "Ash journeys to the Orange Islands. Brock stays with Professor Ivy, leaving Ash and Misty to travel with intrepid Pokémon watcher Tracey Sketchit."
  },
  {
    chronologicalOrder: 5,
    type: "movie",
    title: "THE MOVIE 2000 (1999)",
    region: "Orange Islands",
    description: "Ash must gather the three spheres of fire, ice, and lightning in order to restore balance to the Orange Islands."
  },
  {
    chronologicalOrder: 6,
    type: "series",
    title: "SEASON 2: ORANGE ISLANDS (Ep 25-36)",
    region: "Orange Islands",
    description: "Focuses on Ash’s growth as a Trainer with standalone adventures, setting up future storylines for Johto."
  },
  {
    chronologicalOrder: 7,
    type: "series",
    title: "SEASON 3: THE JOHTO JOURNEYS (Ep 1-38)",
    region: "Johto",
    description: "Ash and Misty reunite with Brock and set out on the next stage of their Pokémon journey—the Johto region!"
  },
  {
    chronologicalOrder: 8,
    type: "movie",
    title: "SPELL OF THE UNOWN (2000)",
    region: "Johto",
    description: "In Greenfield, a young, lonely girl’s dreams and wishes are brought into reality by a collective of reality-warping Pokémon."
  },
  {
    chronologicalOrder: 9,
    type: "series",
    title: "SEASON 3: THE JOHTO JOURNEYS (Ep 39-41)",
    region: "Johto",
    description: "Introduces a variety of new Johto Pokémon and focuses on character development and Team Rocket's scams."
  },
  {
    chronologicalOrder: 10,
    type: "series",
    title: "SEASON 4: JOHTO LEAGUE CHAMPIONS (Ep 1-21)",
    region: "Johto",
    description: "Ash, Misty, and Brock face exciting new adventures, meet old friends, and tackle three more Gyms."
  },
  {
    chronologicalOrder: 11,
    type: "movie",
    title: "MEWTWO RETURNS (2000)",
    region: "Johto",
    description: "Team Rocket tracks down Mewtwo in Johto. Ash and company meet Giovanni for the first time."
  },
  {
    chronologicalOrder: 12,
    type: "series",
    title: "SEASON 4: JOHTO LEAGUE CHAMPIONS (Ep 22-48)",
    region: "Johto",
    description: "Deepens Ash’s journey with Gym Battles, competitions, and encounters with rare and legendary Pokémon."
  },
  {
    chronologicalOrder: 13,
    type: "movie",
    title: "4EVER CELEBI: VOICE OF THE FOREST (2001)",
    region: "Johto",
    description: "Ash must stop a hunter who forces the mythical Pokémon Celebi to help him destroy a forest."
  },
  {
    chronologicalOrder: 14,
    type: "series",
    title: "SEASON 4: JOHTO LEAGUE CHAMPIONS (Ep 49-52)",
    region: "Johto",
    description: "The gang make their way to Olivine City for Ash’s next Gym challenge."
  },
  {
    chronologicalOrder: 15,
    type: "series",
    title: "SEASON 5: MASTER QUEST (Ep 1-47)",
    region: "Johto",
    description: "The Whirl Cup Competition calls! Ash moves on to the Silver Conference to finally take on his old rival, Gary."
  },
  {
    chronologicalOrder: 16,
    type: "movie",
    title: "POKÉMON HEROES (2002)",
    region: "Johto",
    description: "Two thieves take control of an ancient weapon designed to defend the canal city of Altomare."
  },
  {
    chronologicalOrder: 17,
    type: "series",
    title: "SEASON 5: MASTER QUEST (Ep 48-65)",
    region: "Johto",
    description: "Brings Ash’s Johto journey to a conclusion with high-stakes battles and emotional farewells."
  },
  {
    chronologicalOrder: 18,
    type: "series",
    title: "POKÉMON CHRONICLES: MINI SERIES (Ep 1-22)",
    region: "Various",
    description: "Stories focusing on researchers, Gym Leaders, Team Rocket members, and other familiar faces."
  },
  {
    chronologicalOrder: 19,
    type: "series",
    title: "SEASON 6: ADVANCED (Ep 1-35)",
    region: "Hoenn",
    description: "Ash heads to the Hoenn region, making the acquaintance of May and her brother Max alongside Brock."
  },
  {
    chronologicalOrder: 20,
    type: "movie",
    title: "JIRACHI: WISH MAKER (2003)",
    region: "Hoenn",
    description: "A magician attempts to use the power of the Millennium Comet to awaken the legendary Pokémon Groudon."
  },
  {
    chronologicalOrder: 21,
    type: "series",
    title: "SEASON 6: ADVANCED (Ep 36-40)",
    region: "Hoenn",
    description: "Introduces the rivalry between Team Magma and Team Aqua."
  },
  {
    chronologicalOrder: 22,
    type: "series",
    title: "SEASON 7: ADVANCED CHALLENGE (Ep 1-45)",
    region: "Hoenn",
    description: "Ash battles for three more Gym Badges while May wins her first three Contest Ribbons."
  },
  {
    chronologicalOrder: 23,
    type: "movie",
    title: "DESTINY DEOXYS (2004)",
    region: "Hoenn",
    description: "A comet bearing a deadly creature crash-lands onto Earth, terrorizing a high-tech city."
  },
  {
    chronologicalOrder: 24,
    type: "series",
    title: "SEASON 7: ADVANCED CHALLENGE (Ep 46-52)",
    region: "Hoenn",
    description: "Balances battles, contests, and new friendships as Ash and his friends grow as trainers."
  },
  {
    chronologicalOrder: 25,
    type: "series",
    title: "SEASON 8: ADVANCED BATTLE (Ep 1-43)",
    region: "Hoenn",
    description: "Ash secures a spot in the Hoenn League Championships, and May faces epic showdowns in the Grand Festival."
  },
  {
    chronologicalOrder: 26,
    type: "movie",
    title: "LUCARIO AND THE MYSTERY OF MEW (2005)",
    region: "Kanto",
    description: "Ash and friends are guided to the Tree of Beginnings by Lucario to rescue Pikachu from Mew."
  },
  {
    chronologicalOrder: 27,
    type: "series",
    title: "SEASON 8: ADVANCED BATTLE (Ep 44-52)",
    region: "Hoenn",
    description: "Culminates with the Hoenn League competition where Ash reaches the Top 8."
  },
  {
    chronologicalOrder: 28,
    type: "series",
    title: "SEASON 9: BATTLE FRONTIER (Ep 1-5)",
    region: "Kanto",
    description: "Ash and Brock find surprises in their home region of Kanto, dealing with a Pokémon Ranger and Legendary Pokémon."
  },
  {
    chronologicalOrder: 29,
    type: "movie",
    title: "THE MASTERMIND OF MIRAGE POKÉMON (2006)",
    region: "Kanto",
    description: "Ash visits Dr. Yung's laboratory to witness the creation of incredibly powerful Mirage-Pokémon."
  },
  {
    chronologicalOrder: 30,
    type: "series",
    title: "SEASON 9: BATTLE FRONTIER (Ep 6-38)",
    region: "Kanto",
    description: "May blazes a trail to the Kanto Grand Festival while Ash seeks out the hidden facilities of the Battle Frontier."
  },
  {
    chronologicalOrder: 31,
    type: "movie",
    title: "RANGER AND THE TEMPLE OF THE SEA (2006)",
    region: "Unknown",
    description: "Our heroes must protect the Prince of the Sea, Manaphy, from the evil pirate Phantom."
  },
  {
    chronologicalOrder: 32,
    type: "series",
    title: "SEASON 9: BATTLE FRONTIER (Ep 39-47)",
    region: "Kanto",
    description: "Ash’s Frontier Battle journey comes to a close before an unofficial Pokémon Contest in Terracotta Town."
  },
  {
    chronologicalOrder: 33,
    type: "series",
    title: "SEASON 10: DIAMOND AND PEARL (Ep 1-39)",
    region: "Sinnoh",
    description: "Ash heads to the Sinnoh region, teaming up with Brock and novice Coordinator Dawn."
  },
  {
    chronologicalOrder: 34,
    type: "movie",
    title: "THE RISE OF DARKRAI (2007)",
    region: "Sinnoh",
    description: "An idyllic town is thrown into chaos when Dialga and Palkia battle, with Darkrai being their only hope."
  },
  {
    chronologicalOrder: 35,
    type: "series",
    title: "SEASON 10: DIAMOND AND PEARL (Ep 40-52)",
    region: "Sinnoh",
    description: "Ash and Dawn struggle with their paths but make new friends, gaining Pokémon like Turtwig and Piplup."
  },
  {
    chronologicalOrder: 36,
    type: "series",
    title: "SEASON 11: DP BATTLE DIMENSION (Ep 1-34)",
    region: "Sinnoh",
    description: "Ash works on Gym Badges while Dawn recovers from Contest defeats, eventually attending the Pokémon Summer Academy."
  },
  {
    chronologicalOrder: 37,
    type: "movie",
    title: "GIRATINA AND THE SKY WARRIOR (2008)",
    region: "Sinnoh",
    description: "Ash must stop a mysterious stranger from using Giratina's parallel dimension powers for evil."
  },
  {
    chronologicalOrder: 38,
    type: "series",
    title: "SEASON 11: DP BATTLE DIMENSION (Ep 35-52)",
    region: "Sinnoh",
    description: "New tactics help our heroes succeed against Pokémon Hunter J and the emerging threat of Team Galactic."
  },
  {
    chronologicalOrder: 39,
    type: "series",
    title: "SEASON 12: DP GALACTIC BATTLES (Ep 1-31)",
    region: "Sinnoh",
    description: "The menace of Team Galactic looms over Sinnoh as Ash and Dawn get caught in their schemes."
  },
  {
    chronologicalOrder: 40,
    type: "movie",
    title: "ARCEUS AND THE JEWEL OF LIFE (2009)",
    region: "Sinnoh",
    description: "Arceus comes to pass judgement on humanity, sending Ash and friends back in time to reverse the events."
  },
  {
    chronologicalOrder: 41,
    type: "series",
    title: "SEASON 12: DP GALACTIC BATTLES (Ep 32-53)",
    region: "Sinnoh",
    description: "Ash’s ongoing rivalry with Paul finally comes to a head in a full 6-on-6 ultimate test of training styles!"
  },
  {
    chronologicalOrder: 42,
    type: "series",
    title: "SEASON 13: DP SINNOH LEAGUE VICTORS (Ep 1-21)",
    region: "Sinnoh",
    description: "Ash, Dawn, and Brock continue traveling Sinnoh facing challenges, battles, and Team Rocket."
  },
  {
    chronologicalOrder: 43,
    type: "movie",
    title: "ZOROARK: MASTER OF ILLUSIONS (2010)",
    region: "Sinnoh",
    description: "A media mogul seeks to capture Celebi using the shape-shifting Pokémon Zoroark."
  },
  {
    chronologicalOrder: 44,
    type: "series",
    title: "SEASON 13: DP SINNOH LEAGUE VICTORS (Ep 22-34)",
    region: "Sinnoh",
    description: "Ash focuses on qualifying for the Sinnoh League while Dawn trains for her final Contest Ribbon."
  },
  {
    chronologicalOrder: 45,
    type: "series",
    title: "SEASON 14: BLACK AND WHITE (Ep 1-39)",
    region: "Unova",
    description: "Ash discovers new Pokémon in the Unova region, traveling with new friends Iris and Cilan."
  },
  {
    chronologicalOrder: 46,
    type: "movie",
    title: "WHITE: VICTINI AND ZEKROM (2011)",
    region: "Unova",
    description: "The greatest adventure in Pokémon history approaches as Ash encounters Victini and Zekrom."
  },
  {
    chronologicalOrder: 47,
    type: "series",
    title: "SEASON 14: BLACK AND WHITE (Ep 40-48)",
    region: "Unova",
    description: "Ash's quest to become a Pokémon Master gets even tougher in Unova."
  },
  {
    chronologicalOrder: 48,
    type: "series",
    title: "SEASON 15: BW RIVAL DESTINIES (Ep 1-49)",
    region: "Unova",
    description: "Ash faces the ultimate battle challenge against Alder, the Champion Master of Unova."
  },
  {
    chronologicalOrder: 49,
    type: "movie",
    title: "KYUREM VS. THE SWORD OF JUSTICE (2012)",
    region: "Unova",
    description: "Keldeo enrages Kyurem. Ash and Pikachu help Keldeo become a sword of justice."
  },
  {
    chronologicalOrder: 50,
    type: "series",
    title: "SEASON 16: BW ADVENTURES IN UNOVA (Ep 1-25)",
    region: "Unova",
    description: "With eight Gym badges in hand, Ash takes on the Unova League."
  },
  {
    chronologicalOrder: 51,
    type: "movie",
    title: "GENESECT AND THE LEGEND AWAKENED (2013)",
    region: "Unova",
    description: "Ash, Pikachu, and friends must stop Mewtwo and a group of Genesect from destroying the city."
  },
  {
    chronologicalOrder: 52,
    type: "series",
    title: "SEASON 16: BW ADVENTURES IN UNOVA (Ep 26-45)",
    region: "Unova",
    description: "Iris visits the Village of Dragons to connect with her stubborn Dragonite."
  },
  {
    chronologicalOrder: 53,
    type: "series",
    title: "SEASON 17: XY (Ep 1-37)",
    region: "Kalos",
    description: "Ash sets off in Kalos, joined by inventor Clemont, Bonnie, and new Trainer Serena."
  },
  {
    chronologicalOrder: 54,
    type: "movie",
    title: "DIANCIE AND THE COCOON OF DESTRUCTION (2014)",
    region: "Kalos",
    description: "Ash and friends help Diancie find Xerneas to create a heart diamond and save her home."
  },
  {
    chronologicalOrder: 55,
    type: "series",
    title: "SEASON 17: XY (Ep 38-48)",
    region: "Kalos",
    description: "Exploring the region, meeting new Pokémon, and looking into a fascinating new Pokémon mystery."
  },
  {
    chronologicalOrder: 56,
    type: "series",
    title: "SEASON 18: XY KALOS QUEST (Ep 1-33)",
    region: "Kalos",
    description: "Ash continues his quest to win eight Gym badges to enter the Kalos League."
  },
  {
    chronologicalOrder: 57,
    type: "movie",
    title: "HOOPA AND THE CLASH OF AGES (2015)",
    region: "Kalos",
    description: "The crew meets Hoopa, a mythical Pokémon whose true unbound power is terrifying."
  },
  {
    chronologicalOrder: 58,
    type: "series",
    title: "SEASON 18: XY KALOS QUEST (Ep 34-45)",
    region: "Kalos",
    description: "Serena takes on the Pokémon Showcase world while Clemont continues to create inventions."
  },
  {
    chronologicalOrder: 59,
    type: "movie",
    title: "VOLCANION AND THE MECHANICAL MARVEL (2016)",
    region: "Kalos",
    description: "Volcanion must accept Ash’s help to rescue the Azoth Kingdom."
  },
  {
    chronologicalOrder: 60,
    type: "series",
    title: "SEASON 19: XYZ (Ep 1-47)",
    region: "Kalos",
    description: "Team Flare hunts Zygarde, Alain searches for Mega Evolution, and Ash's Frogadier reaches new heights."
  },
  {
    chronologicalOrder: 61,
    type: "series",
    title: "SEASON 20: SUN & MOON (Ep 1-43)",
    region: "Alola",
    description: "Ash enters the Pokémon School in tropical Alola, meeting Lillie, Kiawe, Lana, Mallow, and Sophocles."
  },
  {
    chronologicalOrder: 62,
    type: "series",
    title: "SEASON 21: SM ULTRA ADVENTURES (Ep 1-49)",
    region: "Alola",
    description: "Ash explores the Aether Foundation and protects people and Pokémon from mysterious Ultra Beasts."
  },
  {
    chronologicalOrder: 63,
    type: "series",
    title: "SEASON 22: SM ULTRA LEGENDS (Ep 1-54)",
    region: "Alola",
    description: "The Ultra Guardians protect Wela Volcano and Professor Kukui starts the Alola Pokémon League."
  },
  {
    chronologicalOrder: 64,
    type: "series",
    title: "SEASON 23: JOURNEYS (Ep 1-48)",
    region: "All Regions",
    description: "Ash and Goh become research fellows for Cerise Laboratory, traveling the world to study Pokémon."
  },
  {
    chronologicalOrder: 65,
    type: "series",
    title: "SEASON 24: MASTER JOURNEYS (Ep 1-42)",
    region: "All Regions",
    description: "Ash climbs the World Coronation Series rankings while Goh attempts to catch Mew."
  },
  {
    chronologicalOrder: 66,
    type: "series",
    title: "SEASON 25: ULTIMATE JOURNEYS (Ep 1-4)",
    region: "All Regions",
    description: "Intensive training for Ash as the World Coronation Series heats up. Goh embarks on Project Mew."
  },
  {
    chronologicalOrder: 67,
    type: "series",
    title: "ARCEUS CHRONICLES (ULTIMATE JOURNEYS Ep 1-4 Arc)",
    region: "Sinnoh",
    description: "Investigating Arceus, Ash, Goh, and Dawn uncover a plot by Team Galactic."
  },
  {
    chronologicalOrder: 68,
    type: "series",
    title: "SEASON 25: ULTIMATE JOURNEYS (Ep 5-54)",
    region: "All Regions",
    description: "The incredible climax of the World Coronation Series as Ash Ketchum fights for the title of Monarch."
  },
  {
    chronologicalOrder: 69,
    type: "series",
    title: "TO BE A POKÉMON MASTER (Ep 1-11)",
    region: "Various",
    description: "A special 11-episode epilogue honoring Ash's 25-year journey, journeying with Misty and Brock one last time."
  },
  {
    chronologicalOrder: 70,
    type: "series",
    title: "HORIZONS: SEASON 1 (Ep 1-45)",
    region: "Paldea",
    description: "Liko and Roy embark on a globe-spanning adventure aboard the Brave Asagi with the Rising Volt Tacklers."
  },
  {
    chronologicalOrder: 71,
    type: "series",
    title: "HORIZONS: SEASON 2 - THE SEARCH FOR LAQUA (Ep 1-44)",
    region: "Paldea",
    description: "Liko and Roy hone their Terastallization skills, challenge Gym Leaders, and race the Explorers to Laqua."
  },
  {
    chronologicalOrder: 72,
    type: "series",
    title: "HORIZONS: SEASON 3 - RISING HOPE",
    region: "Various",
    description: "A year after Laqua, the team rebuilds the Rising Volt Tacklers to chase a mysterious pink mist and fight the Explorers."
  }
];

export interface TimelineEntry {
  title: string;
  dateRange: string;
  description: string;
  image: string;
}

export const POKEMON_TIMELINE: TimelineEntry[] = [
  {
    title: "Indigo League",
    dateRange: "Apr 1, 1997 – Jan 21, 1999",
    description: "Ash Ketchum begins his iconic journey in the Kanto region with a notoriously stubborn Pikachu. Teaming up with Gym Leaders Misty and Brock, Ash learns the ropes of Pokémon training, battles the nefarious Team Rocket, catches his first partners like Bulbasaur, Charmander, and Squirtle, and ultimately faces harsh realities at the Indigo Plateau Conference.",
    image: "/images/timeline/indigo-league.jpg"
  },
  {
    title: "Adventures in the Orange Islands",
    dateRange: "Jan 28, 1999 – Oct 7, 1999",
    description: "Tasked with retrieving the mysterious GS Ball for Professor Oak, Ash travels to the tropical Orange Archipelago. Alongside Misty and new companion Tracey Sketchit, Ash takes on the unconventional Gym challenges of the Orange Crew. The journey culminates in a thrilling 6-on-6 battle against Drake, earning Ash his very first Championship trophy.",
    image: "/images/timeline/orange-islands.jpg"
  },
  {
    title: "The Johto Journeys",
    dateRange: "Oct 14, 1999 – Jul 27, 2000",
    description: "Leaving Kanto behind, Ash, Misty, and Brock head to the Johto region to deliver the GS Ball to Kurt and register for the Silver Conference. Ash encounters a whole new generation of Pokémon, capturing favorites like Chikorita, Cyndaquil, and Totodile, while continuing his bitter rivalry with Gary Oak.",
    image: "/images/timeline/johto-journeys.jpg"
  },
  {
    title: "Johto League Champions",
    dateRange: "Aug 3, 2000 – Aug 2, 2001",
    description: "The Johto adventure continues as Ash traverses the diverse landscapes of the region, battling tougher Gym Leaders to collect his badges. The trio explores ancient ruins, encounters mysterious Legendary Pokémon like Suicune, and helps various Pokémon in need, all while Team Rocket continues their relentless pursuit of Pikachu.",
    image: "/images/timeline/johto-league-champions.jpg"
  },
  {
    title: "Master Quest",
    dateRange: "Aug 9, 2001 – Nov 14, 2002",
    description: "The thrilling conclusion to the Johto era. Ash finally secures his final Gym Badges and enters the highly anticipated Silver Conference. The tournament features some of Ash's greatest battles yet, including an unforgettable, highly strategic 6-on-6 showdown against his longtime rival, Gary Oak, marking a major turning point in their relationship.",
    image: "/images/timeline/master-quest.jpg"
  },
  {
    title: "Advanced",
    dateRange: "Nov 21, 2002 – Aug 28, 2003",
    description: "Ash leaves all his Pokémon behind (except Pikachu) to start fresh in the Hoenn region. He meets May, a rookie trainer who discovers her passion for the newly introduced Pokémon Contests, and her little brother Max. Brock rejoins the group as they navigate a region filled with new mechanics like Double Battles.",
    image: "/images/timeline/advanced.jpg"
  },
  {
    title: "Advanced Challenge",
    dateRange: "Sep 4, 2003 – Sep 2, 2004",
    description: "The Hoenn journey deepens as Ash and May continue to hone their respective skills in Gym Battles and Pokémon Contests. The group finds themselves increasingly entangled in the dangerous, region-wide conflict between two rival villainous organizations: Team Magma and Team Aqua, who seek to expand the land and sea.",
    image: "/images/timeline/advanced-challenge.jpg"
  },
  {
    title: "Advanced Battle",
    dateRange: "Sep 9, 2004 – Sep 29, 2005",
    description: "The climax of the Hoenn region arc. The ecological war between Team Magma and Team Aqua reaches its boiling point with the awakening of Groudon and Kyogre. Afterward, Ash competes fiercely in the Ever Grande Conference, showcasing how much he has matured as a tactician and trainer.",
    image: "/images/timeline/advanced-battle.jpg"
  },
  {
    title: "Battle Frontier",
    dateRange: "Oct 6, 2005 – Sep 14, 2006",
    description: "Ash returns to Kanto for a unique challenge: conquering the Battle Frontier. Instead of Gyms, he must defeat seven incredibly powerful Frontier Brains. To do so, Ash relies not only on his current Hoenn team but also reunites with his veteran Pokémon from Kanto and Johto, proving his mastery over all his partners.",
    image: "/images/timeline/battle-frontier.jpg"
  },
  {
    title: "Diamond & Pearl",
    dateRange: "Sep 28, 2006 – Oct 25, 2007",
    description: "Ash travels to the mountainous Sinnoh region and meets Dawn, an aspiring Pokémon Coordinator. This era introduces Paul, Ash's most ruthless and philosophically opposed rival yet. Their conflicting ideologies on how to raise Pokémon—love and trust versus strict, cold discipline—form the emotional core of this incredibly highly-praised series.",
    image: "/images/timeline/diamond-pearl.jpg"
  },
  {
    title: "Battle Dimension",
    dateRange: "Nov 8, 2007 – Dec 4, 2008",
    description: "The Sinnoh journey pushes Ash and Dawn to their limits. Ash struggles to counter Paul's brutal tactics, especially regarding Chimchar, a Pokémon Paul abandoned that Ash takes in. Meanwhile, Dawn faces heavy losses in her Contests, forcing her to rebuild her confidence. The lore of Sinnoh's legendary deities begins to unfold.",
    image: "/images/timeline/battle-dimension.jpg"
  },
  {
    title: "Galactic Battles",
    dateRange: "Dec 4, 2008 – Dec 24, 2009",
    description: "The sinister Team Galactic steps out of the shadows, initiating their plot to destroy the universe and rebuild it in the image of their leader, Cyrus. Ash, Dawn, and Brock are drawn into a massive, world-ending conflict involving the creation trio—Dialga, Palkia, and Giratina—requiring everything they have to save the region.",
    image: "/images/timeline/galactic-battles.jpg"
  },
  {
    title: "Sinnoh League Victors",
    dateRange: "Jan 7, 2010 – Sep 9, 2010",
    description: "Dawn competes in the Sinnoh Grand Festival, showcasing her immense growth. Ash enters the Lily of the Valley Conference, leading to what many consider the greatest battle in anime history: an emotionally charged, strategic masterclass against Paul. Ash finally proves that his bond of friendship can overcome Paul's sheer power.",
    image: "/images/timeline/sinnoh-league-victors.jpg"
  },
  {
    title: "Black and White",
    dateRange: "Sep 23, 2010 – Sep 15, 2011",
    description: "Acting as a soft reboot, Ash travels to the distant Unova region with only Pikachu. He adopts a more energetic, beginner-like attitude and travels with Iris, a wild Dragon-type specialist, and Cilan, a sophisticated Pokémon Connoisseur and Gym Leader. The series focuses entirely on newly discovered Pokémon native only to Unova.",
    image: "/images/timeline/black-and-white.jpg"
  },
  {
    title: "Rival Destinies",
    dateRange: "Sep 22, 2011 – Oct 4, 2012",
    description: "Ash's Unova journey continues as his team expands and his rivalries heat up, particularly with the arrogant photographer Trip. Ash and his friends participate in various Club Battle tournaments, allowing for intense, action-packed mini-arcs. The mythology of Unova's Legendary Dragons, Zekrom and Reshiram, begins to heavily influence their path.",
    image: "/images/timeline/rival-destinies.jpg"
  },
  {
    title: "Unova and Beyond",
    dateRange: "Oct 11, 2012 – Sep 26, 2013",
    description: "Following the Vertress Conference, Ash and friends foil the grand, destructive schemes of Team Plasma and their manipulated leader, N. Afterward, they journey through the Decolore Islands on a cruise back to Kanto, capping off the Unova era with lighthearted adventures and a tearful farewell to Iris and Cilan.",
    image: "/images/timeline/unova-and-beyond.jpg"
  },
  {
    title: "XY",
    dateRange: "Oct 17, 2013 – Oct 30, 2014",
    description: "Ash arrives in the French-inspired Kalos region, portraying a highly competent, mature, and heroic version of himself. He travels with inventor Clemont, his little sister Bonnie, and Serena, a childhood friend harboring a deep crush on Ash. The stunning animation and dynamic camera work redefine the anime's battle sequences.",
    image: "/images/timeline/xy.jpg"
  },
  {
    title: "Kalos Quest",
    dateRange: "Nov 6, 2014 – Oct 22, 2015",
    description: "Serena finds her calling in Pokémon Showcases, aiming to become Kalos Queen. Ash continues his quest for badges, capturing powerful regional Pokémon like Hawlucha and Goomy. The mysteries of Mega Evolution are explored heavily, and Ash discovers a unique, mysterious phenomenon linking him to his Froakie, who soon evolves into Frogadier.",
    image: "/images/timeline/kalos-quest.jpg"
  },
  {
    title: "XYZ",
    dateRange: "Oct 29, 2015 – Oct 27, 2016",
    description: "The peak of Kalos. Ash achieves the legendary 'Ash-Greninja' transformation, rivaling Mega Evolution. The Lumiose Conference offers spectacular battles, particularly against Ash's powerful rival Alain. Immediately after the league, the apocalyptic Team Flare arc begins, forcing Ash, his friends, and all the Gym Leaders to save Kalos from Zygarde's rampage.",
    image: "/images/timeline/xyz.jpg"
  },
  {
    title: "Sun and Moon",
    dateRange: "Nov 17, 2016 – Sep 21, 2017",
    description: "A drastic shift in art style and format! Ash stays in one place, enrolling in the Pokémon School in the Alola region. He lives with Professor Kukui and makes a close-knit group of friends: Lillie, Lana, Mallow, Kiawe, and Sophocles. The tone is heavily comedic, focusing on slice-of-life adventures and unlocking Z-Moves.",
    image: "/images/timeline/sun-and-moon.jpg"
  },
  {
    title: "Ultra Adventures",
    dateRange: "Oct 5, 2017 – Oct 14, 2018",
    description: "The peaceful Alolan life is disrupted by the appearance of Ultra Wormholes. Ash and his classmates become the 'Ultra Guardians,' tasked with rescuing and returning interdimensional Ultra Beasts. Lillie faces deep family trauma involving her mother Lusamine and the Aether Foundation, leading to incredible character development for the entire cast.",
    image: "/images/timeline/ultra-adventures.jpg"
  },
  {
    title: "Ultra Legends",
    dateRange: "Oct 21, 2018 – Nov 3, 2019",
    description: "History is made! Alola hosts its very first Pokémon League, allowing everyone to compete in an all-out battle royale. Ash overcomes his fierce rival Gladion and is officially crowned the Champion of the Alola region, securing his first-ever main series League victory after 22 years of real-world broadcasting.",
    image: "/images/timeline/ultra-legends.jpg"
  },
  {
    title: "Journeys",
    dateRange: "Nov 17, 2019 – Dec 4, 2020",
    description: "Instead of exploring a single new region, Ash becomes a research fellow for Professor Cerise, traveling the entire globe. He is joined by Goh, a boy whose singular dream is to catch every Pokémon, including the mythical Mew. Ash enters the World Coronation Series to battle his way to the absolute top.",
    image: "/images/timeline/journeys.jpg"
  },
  {
    title: "Master Journeys",
    dateRange: "Dec 11, 2020 – Dec 10, 2021",
    description: "Ash climbs the ranks of the World Coronation Series, reuniting with past traveling companions, rivals, and Gym Leaders from all previous generations. Goh joins 'Project Mew,' undertaking difficult trials to prove his worth as a chaser. The duo continues to strengthen their teams, catching powerhouses like Lucario, Gengar, and Inteleon.",
    image: "/images/timeline/master-journeys.jpg"
  },
  {
    title: "Ultimate Journeys",
    dateRange: "Dec 17, 2021 – Mar 24, 2023",
    description: "The culmination of Ash Ketchum's 25-year story. Ash enters the Masters Eight Tournament, facing off against the greatest Champions in the world, including Steven, Cynthia, and Leon. In an earth-shattering finale, Ash defeats Leon to become the undisputed Pokémon World Monarch. An 11-episode epilogue finally bids a bittersweet farewell to Ash and Pikachu.",
    image: "/images/timeline/ultimate-journeys.jpg"
  },
  {
    title: "Horizons",
    dateRange: "Apr 14, 2023 – Present",
    description: "A brand new era begins with dual protagonists: Liko, a girl from Paldea with a mysterious pendant, and Roy, a boy from Kanto with an ancient Poké Ball. Hunted by the enigmatic Explorers, they join the Rising Volt Tacklers, an adventurous crew traveling the world on an airship captained by Friede and Captain Pikachu.",
    image: "/images/timeline/horizons.jpg"
  },
  {
    title: "Horizons - The Search for Laqua",
    dateRange: "TBA",
    description: "As Liko and Roy's bonds with their Pokémon deepen, their objective becomes clear: uncover the secrets of the ancient adventurer Lucius and find the mythical paradise known as Laqua. The Explorers become more aggressive, leading to high-stakes encounters and pushing the young trainers to unlock their true potential.",
    image: "/images/timeline/horizons-laqua.jpg"
  }
];
// Add these types to your existing types, or right above the data
export interface Character {
  name: string;
  imageUrl: string;
  description?: string;
}

export interface CharacterCategory {
  category: string;
  characters: Character[];
}

export const POKEMON_CHARACTERS: CharacterCategory[] = [
  {
    category: "Main Protagonists",
    characters: [
      { name: "Ash Ketchum", imageUrl: "/images/characters/ash-ketchum.jpg" },
      { name: "Liko", imageUrl: "/images/characters/liko.jpg" },
      { name: "Roy", imageUrl: "/images/characters/roy.jpg" }
    ]
  },
  {
    category: "Main Companions",
    characters: [
      { name: "Misty", imageUrl: "/images/characters/misty.jpg" },
      { name: "Brock", imageUrl: "/images/characters/brock.jpg" },
      { name: "Tracey Sketchit", imageUrl: "/images/characters/tracey-sketchit.jpg" },
      { name: "May", imageUrl: "/images/characters/may.jpg" },
      { name: "Max", imageUrl: "/images/characters/max.jpg" },
      { name: "Dawn", imageUrl: "/images/characters/dawn.jpg" },
      { name: "Iris", imageUrl: "/images/characters/iris.jpg" },
      { name: "Cilan", imageUrl: "/images/characters/cilan.jpg" },
      { name: "Serena", imageUrl: "/images/characters/serena.jpg" },
      { name: "Clemont", imageUrl: "/images/characters/clemont.jpg" },
      { name: "Bonnie", imageUrl: "/images/characters/bonnie.jpg" },
      { name: "Lillie", imageUrl: "/images/characters/lillie.jpg" },
      { name: "Kiawe", imageUrl: "/images/characters/kiawe.jpg" },
      { name: "Lana", imageUrl: "/images/characters/lana.jpg" },
      { name: "Mallow", imageUrl: "/images/characters/mallow.jpg" },
      { name: "Sophocles", imageUrl: "/images/characters/sophocles.jpg" },
      { name: "Goh", imageUrl: "/images/characters/goh.jpg" },
      { name: "Chloe Cerise", imageUrl: "/images/characters/chloe-cerise.jpg" }
    ]
  },
  {
    category: "Main Rivals",
    characters: [
      { name: "Gary Oak", imageUrl: "/images/characters/gary-oak.jpg" },
      { name: "Ritchie", imageUrl: "/images/characters/ritchie.jpg" },
      { name: "Harrison", imageUrl: "/images/characters/harrison.jpg" },
      { name: "Tyson", imageUrl: "/images/characters/tyson.jpg" },
      { name: "Paul", imageUrl: "/images/characters/paul.jpg" },
      { name: "Barry", imageUrl: "/images/characters/barry.jpg" },
      { name: "Trip", imageUrl: "/images/characters/trip.jpg" },
      { name: "Bianca", imageUrl: "/images/characters/bianca.jpg" },
      { name: "Cameron", imageUrl: "/images/characters/cameron.jpg" },
      { name: "Sawyer", imageUrl: "/images/characters/sawyer.jpg" },
      { name: "Alain", imageUrl: "/images/characters/alain.jpg" },
      { name: "Gladion", imageUrl: "/images/characters/gladion.jpg" },
      { name: "Hop", imageUrl: "/images/characters/hop.jpg" }
    ]
  },
  {
    category: "Professors",
    characters: [
      { name: "Professor Oak", imageUrl: "/images/characters/professor-oak.jpg" },
      { name: "Professor Elm", imageUrl: "/images/characters/professor-elm.jpg" },
      { name: "Professor Birch", imageUrl: "/images/characters/professor-birch.jpg" },
      { name: "Professor Rowan", imageUrl: "/images/characters/professor-rowan.jpg" },
      { name: "Professor Juniper", imageUrl: "/images/characters/professor-juniper.jpg" },
      { name: "Professor Sycamore", imageUrl: "/images/characters/professor-sycamore.jpg" },
      { name: "Professor Kukui", imageUrl: "/images/characters/professor-kukui.jpg" },
      { name: "Professor Magnolia", imageUrl: "/images/characters/professor-magnolia.jpg" },
      { name: "Professor Cerise", imageUrl: "/images/characters/professor-cerise.jpg" },
      { name: "Professor Friede", imageUrl: "/images/characters/professor-friede.jpg" }
    ]
  },
  {
    category: "Champions",
    characters: [
      { name: "Lance", imageUrl: "/images/characters/lance.jpg" },
      { name: "Steven Stone", imageUrl: "/images/characters/steven-stone.jpg" },
      { name: "Cynthia", imageUrl: "/images/characters/cynthia.jpg" },
      { name: "Alder", imageUrl: "/images/characters/alder.jpg" },
      { name: "Diantha", imageUrl: "/images/characters/diantha.jpg" },
      { name: "Leon", imageUrl: "/images/characters/leon.jpg" },
      { name: "Geeta", imageUrl: "/images/characters/geeta.jpg" }
    ]
  },
  {
    category: "Elite Four",
    characters: [
      { name: "Lorelei", imageUrl: "/images/characters/lorelei.jpg" },
      { name: "Bruno", imageUrl: "/images/characters/bruno.jpg" },
      { name: "Agatha", imageUrl: "/images/characters/agatha.jpg" },
      { name: "Drake", imageUrl: "/images/characters/drake.jpg" },
      { name: "Aaron", imageUrl: "/images/characters/aaron.jpg" },
      { name: "Flint", imageUrl: "/images/characters/flint.jpg" },
      { name: "Lucian", imageUrl: "/images/characters/lucian.jpg" },
      { name: "Malva", imageUrl: "/images/characters/malva.jpg" }
    ]
  },
  {
    category: "Team Rocket",
    characters: [
      { name: "Jessie", imageUrl: "/images/characters/jessie.jpg" },
      { name: "James", imageUrl: "/images/characters/james.jpg" },
      { name: "Giovanni", imageUrl: "/images/characters/giovanni.jpg" },
      { name: "Cassidy", imageUrl: "/images/characters/cassidy.jpg" },
      { name: "Butch", imageUrl: "/images/characters/butch.jpg" }
    ]
  },
  {
    category: "Notable Villains",
    characters: [
      { name: "Lysandre", imageUrl: "/images/characters/lysandre.jpg" },
      { name: "Ghetsis", imageUrl: "/images/characters/ghetsis.jpg" },
      { name: "Cyrus", imageUrl: "/images/characters/cyrus.jpg" },
      { name: "Archie", imageUrl: "/images/characters/archie.jpg" },
      { name: "Maxie", imageUrl: "/images/characters/maxie.jpg" },
      { name: "Lusamine", imageUrl: "/images/characters/lusamine.jpg" },
      { name: "Chairman Rose", imageUrl: "/images/characters/chairman-rose.jpg" }
    ]
  },
  {
    category: "Gym Leaders",
    characters: [
      { name: "Erika", imageUrl: "/images/characters/erika.jpg" },
      { name: "Sabrina", imageUrl: "/images/characters/sabrina.jpg" },
      { name: "Lt. Surge", imageUrl: "/images/characters/lt-surge.jpg" },
      { name: "Blaine", imageUrl: "/images/characters/blaine.jpg" },
      { name: "Roxanne", imageUrl: "/images/characters/roxanne.jpg" },
      { name: "Gardenia", imageUrl: "/images/characters/gardenia.jpg" },
      { name: "Volkner", imageUrl: "/images/characters/volkner.jpg" },
      { name: "Raihan", imageUrl: "/images/characters/raihan.jpg" }
    ]
  }
];