// ============================================================
// JOURNEY — EVOLUTION
// ============================================================
// One national table rather than a per-region one, because
// evolution follows the species, not the place: a Geodude caught
// in Johto evolves exactly as a Kanto one does.
//
// Real level-up evolutions use their in-game level. Trade and
// stone evolutions have no level in the real games, so they get
// one chosen to land naturally on a Journey level curve. `to: -1`
// means the line ends here.
//
// Covers Gens 1-2. Later gens are appended as their regions land.
// ============================================================

export interface EvolutionStep {
  to: number;
  level: number;
}

export const EVOLUTION_MAP: Record<number, EvolutionStep> = {
  // --- Gen 1 -----------------------------------------------
  1: { to: 2, level: 16 }, 2: { to: 3, level: 32 },
  4: { to: 5, level: 16 }, 5: { to: 6, level: 36 },
  7: { to: 8, level: 16 }, 8: { to: 9, level: 36 },
  10: { to: 11, level: 7 }, 11: { to: 12, level: 10 },
  13: { to: 14, level: 7 }, 14: { to: 15, level: 10 },
  16: { to: 17, level: 18 }, 17: { to: 18, level: 36 },
  19: { to: 20, level: 20 },
  21: { to: 22, level: 20 },
  23: { to: 24, level: 22 },
  25: { to: 26, level: 30 },              // Thunder Stone
  27: { to: 28, level: 22 },
  29: { to: 30, level: 16 }, 30: { to: 31, level: 36 },  // Moon Stone
  32: { to: 33, level: 16 }, 33: { to: 34, level: 36 },  // Moon Stone
  35: { to: 36, level: 34 },              // Moon Stone
  37: { to: 38, level: 34 },              // Fire Stone
  39: { to: 40, level: 34 },              // Moon Stone
  41: { to: 42, level: 22 }, 42: { to: 169, level: 42 }, // Crobat via friendship
  43: { to: 44, level: 21 }, 44: { to: 45, level: 40 },  // Leaf Stone
  46: { to: 47, level: 24 },
  48: { to: 49, level: 31 },
  50: { to: 51, level: 26 },
  52: { to: 53, level: 28 },
  54: { to: 55, level: 33 },
  56: { to: 57, level: 28 },
  58: { to: 59, level: 34 },              // Fire Stone
  60: { to: 61, level: 25 }, 61: { to: 62, level: 40 },  // Water Stone
  63: { to: 64, level: 16 }, 64: { to: 65, level: 36 },  // Trade
  66: { to: 67, level: 28 }, 67: { to: 68, level: 40 },  // Trade
  69: { to: 70, level: 21 }, 70: { to: 71, level: 40 },  // Leaf Stone
  72: { to: 73, level: 30 },
  74: { to: 75, level: 25 }, 75: { to: 76, level: 40 },  // Trade
  77: { to: 78, level: 40 },
  79: { to: 80, level: 37 },
  81: { to: 82, level: 30 }, 82: { to: 462, level: 50 }, // Magnezone, Gen 4
  83: { to: -1, level: 999 },
  84: { to: 85, level: 31 },
  86: { to: 87, level: 34 },
  88: { to: 89, level: 38 },
  90: { to: 91, level: 34 },              // Water Stone
  92: { to: 93, level: 25 }, 93: { to: 94, level: 40 },  // Trade
  95: { to: 208, level: 45 },             // Steelix via trade
  96: { to: 97, level: 26 },
  98: { to: 99, level: 28 },
  100: { to: 101, level: 30 },
  102: { to: 103, level: 34 },            // Leaf Stone
  104: { to: 105, level: 28 },
  108: { to: 463, level: 45 },            // Lickilicky, Gen 4
  109: { to: 110, level: 35 },
  111: { to: 112, level: 42 }, 112: { to: 464, level: 52 }, // Rhyperior, Gen 4
  113: { to: 242, level: 40 },            // Blissey via friendship
  114: { to: 465, level: 42 },            // Tangrowth, Gen 4
  116: { to: 117, level: 32 }, 117: { to: 230, level: 45 }, // Kingdra via trade
  118: { to: 119, level: 33 },
  120: { to: 121, level: 34 },            // Water Stone
  123: { to: 212, level: 42 },            // Scizor via trade
  129: { to: 130, level: 20 },
  133: { to: -1, level: 999 },            // branching evolutions unsupported
  137: { to: 233, level: 40 }, 233: { to: 474, level: 50 },
  138: { to: 139, level: 40 },
  140: { to: 141, level: 40 },
  147: { to: 148, level: 30 }, 148: { to: 149, level: 55 },

  // --- Gen 2 -----------------------------------------------
  152: { to: 153, level: 16 }, 153: { to: 154, level: 32 },
  155: { to: 156, level: 14 }, 156: { to: 157, level: 36 },
  158: { to: 159, level: 18 }, 159: { to: 160, level: 30 },
  161: { to: 162, level: 15 },
  163: { to: 164, level: 20 },
  165: { to: 166, level: 18 },
  167: { to: 168, level: 22 },
  170: { to: 171, level: 27 },
  172: { to: 25, level: 12 },             // Pichu → Pikachu
  173: { to: 35, level: 14 },             // Cleffa → Clefairy
  174: { to: 39, level: 14 },             // Igglybuff → Jigglypuff
  175: { to: 176, level: 16 }, 176: { to: 468, level: 40 },
  177: { to: 178, level: 25 },
  179: { to: 180, level: 15 }, 180: { to: 181, level: 30 },
  183: { to: 184, level: 18 },
  187: { to: 188, level: 18 }, 188: { to: 189, level: 27 },
  191: { to: 192, level: 25 },            // Sun Stone
  193: { to: 469, level: 40 },            // Yanmega, Gen 4
  194: { to: 195, level: 20 },
  198: { to: 430, level: 38 },            // Honchkrow, Gen 4
  200: { to: 429, level: 40 },            // Mismagius, Gen 4
  204: { to: 205, level: 31 },
  207: { to: 472, level: 45 },            // Gliscor, Gen 4
  209: { to: 210, level: 23 },
  211: { to: 904, level: 45 },            // Overqwil, Gen 9
  215: { to: 461, level: 40 },            // Weavile, Gen 4
  216: { to: 217, level: 30 },
  218: { to: 219, level: 38 },
  220: { to: 221, level: 33 }, 221: { to: 473, level: 48 },
  223: { to: 224, level: 25 },
  228: { to: 229, level: 24 },
  231: { to: 232, level: 25 },
  236: { to: 237, level: 20 },            // Tyrogue — branching, simplified
  238: { to: 124, level: 25 },            // Smoochum → Jynx
  239: { to: 125, level: 30 },            // Elekid → Electabuzz
  240: { to: 126, level: 30 },            // Magby → Magmar
  246: { to: 247, level: 30 }, 247: { to: 248, level: 55 },
};

/** Which stage of its line a species sits at (1 base, 2, 3). */
export function getEvolutionStage(pokemonId: number): number {
  let stage = 1;
  for (const [fromId, evo] of Object.entries(EVOLUTION_MAP)) {
    if (evo.to === pokemonId) {
      stage = getEvolutionStage(Number(fromId)) + 1;
      break;
    }
  }
  return Math.min(stage, 3);
}

/**
 * Walks the chain forward as far as `level` allows. Returns the
 * resulting species and whether anything changed.
 */
export function resolveEvolution(
  pokemonId: number,
  level: number
): { id: number; evolved: boolean } {
  let currentId = pokemonId;
  let evolved = false;
  let evo = EVOLUTION_MAP[currentId];
  let guard = 0;
  while (evo && evo.to !== -1 && level >= evo.level && guard++ < 5) {
    currentId = evo.to;
    evolved = true;
    evo = EVOLUTION_MAP[currentId];
  }
  return { id: currentId, evolved };
}
