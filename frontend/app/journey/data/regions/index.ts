// ============================================================
// JOURNEY — REGION REGISTRY
// ============================================================
// The only file that knows which regions exist. Pages read from
// here and never import a region directly, which is what lets one
// set of routes serve all of them.
//
// Adding a region means: build its data package under
// data/regions/<id>/, import it here, and add it to REGIONS.
// No page changes, no new routes.
// ============================================================

import type { RegionData } from '../types';
import { KANTO } from './kanto';
import { JOHTO } from './johto';

/** Playable regions, in the order they unlock. */
export const REGIONS: RegionData[] = [KANTO, JOHTO];

/**
 * Every region in canonical order, including ones not built yet.
 * The hub shows these as "coming soon" so the shape of the whole
 * Journey is visible from the start.
 */
export const REGION_ORDER = [
  'kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'paldea',
];

/** Display names for regions that have no data yet. */
export const PLANNED_REGION_NAMES: Record<string, string> = {
  hoenn: 'Hoenn',
  sinnoh: 'Sinnoh',
  unova: 'Unova',
  kalos: 'Kalos',
  alola: 'Alola',
  galar: 'Galar',
  paldea: 'Paldea',
};

const BY_ID: Record<string, RegionData> = Object.fromEntries(
  REGIONS.map((r) => [r.id, r])
);

export function getRegion(id: string): RegionData | undefined {
  return BY_ID[id];
}

export function isImplemented(id: string): boolean {
  return id in BY_ID;
}

/** Display name, whether or not the region is built. */
export function regionName(id: string): string {
  return BY_ID[id]?.name ?? PLANNED_REGION_NAMES[id] ?? id;
}

/**
 * A region opens once the previous one in REGION_ORDER is
 * complete. Kanto is always open.
 */
export function previousRegionId(id: string): string | null {
  const idx = REGION_ORDER.indexOf(id);
  return idx > 0 ? REGION_ORDER[idx - 1] : null;
}
