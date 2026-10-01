# Journey

A ROM-style Pokémon run inside Pokéverse: pick a starter, explore
routes, catch your own team, earn every badge, then move on to the
next region.

## Structure

```
journey/
├── page.tsx                  region hub
├── [regionId]/               every page is region-agnostic
│   ├── starter/              the professor's lab
│   ├── map/                  travel layer
│   ├── area/[nodeId]/        explore, catch, shop, trainers
│   ├── challenge/[id]/       gym leaders and their equivalents
│   └── complete/             hall of fame
├── components/
│   ├── BattleScene.tsx       one battle UI for wild/trainer/gym
│   ├── GrassField.tsx        the walking loop
│   ├── TrainerSprite.tsx     trainer art + send-out animation
│   └── JourneyShell.tsx      shared chrome and styles
├── lib/
│   ├── battleEngine.ts       damage, types, status, turn order
│   ├── fetchMon.ts           species fetch + cache, level/evolve
│   ├── wild.ts               steps, catching, experience
│   └── journeyStorage.ts     the save file
└── data/
    ├── types.ts              every shared interface
    ├── moves.ts              level-tiered movesets
    ├── evolution.ts          national evolution map
    ├── items.ts              bag, shop, prices
    ├── trainerSprites.ts     class → sprite key
    └── regions/
        ├── index.ts          the registry
        ├── kanto/            map, challenges, trainers, encounters
        └── johto/
```

## Adding a region

Pages never import a region directly — they read it from the
registry. So adding one is data only:

1. Create `data/regions/<id>/` with `map.ts`, `challenges.ts`,
   `trainers.ts`, `encounters.ts` and an `index.ts` exporting a
   `RegionData`.
2. Import it in `data/regions/index.ts` and add it to `REGIONS`.

No new routes, no page changes.

Regions that don't use gyms are already accounted for: a
`Challenge` carries a `kind` (`gym`, `trial`, `grand-trial`,
`stadium`, `titan`, `star-base`) and names its own reward, so
Alola's trials and Galar's stadiums fit the same shape.

## Checking a region

`validate-regions.mjs` checks what TypeScript can't: that every
edge connects real nodes, every challenge sits on a node that
points back at it, challenge order has no gaps, trainers and
encounter tables reference real places, the level curve trends
upward, and — the one that matters most — that every challenge is
actually **reachable** on foot with only the nodes unlocked at
that point.

```
npx esbuild data/regions/index.ts --bundle --format=esm \
  --outfile=_regions-bundle.mjs
node validate-regions.mjs
```

Run it after adding or editing a region. A map that looks fine can
still strand the player behind a gate.

## Save data

Saves are versioned (`SAVE_VERSION` in `journeyStorage.ts`). Each
bump so far changed the shape too deeply to migrate, so older
saves are discarded and the run starts fresh. Bump the version
whenever the save shape changes.
