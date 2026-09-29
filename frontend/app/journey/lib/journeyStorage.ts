// ============================================================
// JOURNEY STATE — localStorage persistence.
// Keyed per-username so it survives refresh and doesn't collide
// between different logged-in accounts on the same browser.
// ============================================================

import type { JourneyPokemon } from '../data/kanto';

export interface JourneyRegionState {
  team: JourneyPokemon[] | null;
  completedGyms: string[]; // gym ids
  regionComplete: boolean;
}

export interface JourneyState {
  regions: Record<string, JourneyRegionState>;
}

const STORAGE_KEY = 'pokeverse_journey_state';

function getAllJourneyData(): Record<string, JourneyState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllJourneyData(data: Record<string, JourneyState>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save Journey progress:', err);
  }
}

function emptyRegionState(): JourneyRegionState {
  return { team: null, completedGyms: [], regionComplete: false };
}

export function getJourneyState(username: string): JourneyState {
  const all = getAllJourneyData();
  if (!all[username]) {
    all[username] = { regions: {} };
  }
  return all[username];
}

export function getRegionState(username: string, regionId: string): JourneyRegionState {
  const state = getJourneyState(username);
  if (!state.regions[regionId]) {
    state.regions[regionId] = emptyRegionState();
  }
  return state.regions[regionId];
}

export function saveRegionState(username: string, regionId: string, regionState: JourneyRegionState) {
  const all = getAllJourneyData();
  if (!all[username]) all[username] = { regions: {} };
  all[username].regions[regionId] = regionState;
  saveAllJourneyData(all);
}

export function setTeam(username: string, regionId: string, team: JourneyPokemon[]) {
  const region = getRegionState(username, regionId);
  region.team = team;
  saveRegionState(username, regionId, region);
}

export function markGymComplete(username: string, regionId: string, gymId: string) {
  const region = getRegionState(username, regionId);
  if (!region.completedGyms.includes(gymId)) {
    region.completedGyms.push(gymId);
  }
  saveRegionState(username, regionId, region);
}

export function markRegionComplete(username: string, regionId: string) {
  const region = getRegionState(username, regionId);
  region.regionComplete = true;
  saveRegionState(username, regionId, region);
}

export function updateTeam(username: string, regionId: string, team: JourneyPokemon[]) {
  const region = getRegionState(username, regionId);
  region.team = team;
  saveRegionState(username, regionId, region);
}

export function resetRegion(username: string, regionId: string) {
  saveRegionState(username, regionId, emptyRegionState());
}

// Region unlock order - only Kanto exists in Phase 1, the rest are
// placeholders so the hub can show what's coming without being selectable.
export const REGION_ORDER = ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'paldea'];
export const IMPLEMENTED_REGIONS = ['kanto'];

export function isRegionUnlocked(username: string, regionId: string): boolean {
  const idx = REGION_ORDER.indexOf(regionId);
  if (idx === 0) return true; // Kanto always unlocked
  if (idx < 0) return false;
  const prevRegionId = REGION_ORDER[idx - 1];
  const prevState = getRegionState(username, prevRegionId);
  return prevState.regionComplete;
}