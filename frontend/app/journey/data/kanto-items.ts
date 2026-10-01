// ============================================================
// JOURNEY — ITEMS & BAG
// ============================================================
// A deliberately small item set. Every item here does something
// the player actually needs during a Kanto run, and nothing is
// included just for completeness — a short list keeps the bag
// readable on a phone and keeps the battle menu one screen.
//
// Prices follow FireRed. Effects are Journey balancing.
// ============================================================

export type ItemCategory = 'ball' | 'medicine' | 'status' | 'revive' | 'key';

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  /** Shop price in Poké Dollars. 0 means it can't be bought. */
  price: number;
  /** Ball only: multiplier on the catch roll. */
  catchBonus?: number;
  /** Medicine only: HP restored. -1 restores everything. */
  heal?: number;
  /** Revive only: fraction of max HP restored on revival. */
  reviveFraction?: number;
  /** True if it clears any status condition. */
  curesStatus?: boolean;
  /** Can it be used while a battle is in progress? */
  usableInBattle: boolean;
  /** Can it be used from the party screen outside battle? */
  usableOutsideBattle: boolean;
}

export const ITEMS: Record<string, ItemDef> = {
  'poke-ball': {
    id: 'poke-ball',
    name: 'Poké Ball',
    category: 'ball',
    description: 'A device for catching wild Pokémon.',
    price: 200,
    catchBonus: 1,
    usableInBattle: true,
    usableOutsideBattle: false,
  },
  'great-ball': {
    id: 'great-ball',
    name: 'Great Ball',
    category: 'ball',
    description: 'A good Ball with a higher catch rate than a Poké Ball.',
    price: 600,
    catchBonus: 1.5,
    usableInBattle: true,
    usableOutsideBattle: false,
  },
  'ultra-ball': {
    id: 'ultra-ball',
    name: 'Ultra Ball',
    category: 'ball',
    description: 'A better Ball with a higher catch rate than a Great Ball.',
    price: 1200,
    catchBonus: 2,
    usableInBattle: true,
    usableOutsideBattle: false,
  },

  potion: {
    id: 'potion',
    name: 'Potion',
    category: 'medicine',
    description: 'Restores 20 HP to one Pokémon.',
    price: 300,
    heal: 20,
    usableInBattle: true,
    usableOutsideBattle: true,
  },
  'super-potion': {
    id: 'super-potion',
    name: 'Super Potion',
    category: 'medicine',
    description: 'Restores 60 HP to one Pokémon.',
    price: 700,
    heal: 60,
    usableInBattle: true,
    usableOutsideBattle: true,
  },
  'hyper-potion': {
    id: 'hyper-potion',
    name: 'Hyper Potion',
    category: 'medicine',
    description: 'Restores 120 HP to one Pokémon.',
    price: 1200,
    heal: 120,
    usableInBattle: true,
    usableOutsideBattle: true,
  },
  'full-restore': {
    id: 'full-restore',
    name: 'Full Restore',
    category: 'medicine',
    description: 'Fully restores HP and cures any status condition.',
    price: 3000,
    heal: -1,
    curesStatus: true,
    usableInBattle: true,
    usableOutsideBattle: true,
  },

  // One cure-all instead of five single-status items. The real
  // games split these; here it would be five near-identical bag
  // entries for the same decision.
  'full-heal': {
    id: 'full-heal',
    name: 'Full Heal',
    category: 'status',
    description: 'Cures any status condition — burn, poison, paralysis, sleep or freeze.',
    price: 600,
    curesStatus: true,
    usableInBattle: true,
    usableOutsideBattle: true,
  },

  revive: {
    id: 'revive',
    name: 'Revive',
    category: 'revive',
    description: 'Revives a fainted Pokémon with half its HP.',
    price: 1500,
    reviveFraction: 0.5,
    usableInBattle: true,
    usableOutsideBattle: true,
  },
};

export const ITEM_LIST = Object.values(ITEMS);

/** What Oak sends you off with. */
export const STARTING_BAG: Record<string, number> = {
  'poke-ball': 5,
  potion: 3,
};

export const STARTING_MONEY = 3000;

/** What the Poké Mart stocks. Towns only. */
export const MART_STOCK = [
  'poke-ball',
  'great-ball',
  'ultra-ball',
  'potion',
  'super-potion',
  'hyper-potion',
  'full-heal',
  'revive',
];

/** Bag cap per item, so inventory stays bounded and readable. */
export const MAX_PER_ITEM = 99;

export function getItem(id: string): ItemDef | undefined {
  return ITEMS[id];
}

/** Items of a category the player actually holds, for the bag UI. */
export function bagEntries(
  bag: Record<string, number>,
  opts: { inBattle?: boolean; category?: ItemCategory } = {}
): { item: ItemDef; count: number }[] {
  return Object.entries(bag)
    .filter(([, count]) => count > 0)
    .map(([id, count]) => ({ item: ITEMS[id], count }))
    .filter((e) => !!e.item)
    .filter((e) => (opts.category ? e.item.category === opts.category : true))
    .filter((e) => (opts.inBattle ? e.item.usableInBattle : true))
    .sort((a, b) => {
      const order: ItemCategory[] = ['ball', 'medicine', 'status', 'revive', 'key'];
      return order.indexOf(a.item.category) - order.indexOf(b.item.category);
    });
}

/** Prize money for beating a trainer, scaled off their strongest Pokémon. */
export function trainerPrize(topLevel: number, isGymLeader: boolean): number {
  const base = isGymLeader ? 120 : 45;
  return topLevel * base;
}
