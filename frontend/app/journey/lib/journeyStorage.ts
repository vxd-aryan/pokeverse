// ============================================================
// JOURNEY STATE — localStorage persistence.
// Keyed per-username so it survives refresh and doesn't collide
// between different logged-in accounts on the same browser.
//
// Everything the player would be upset to lose lives here:
// current region, the confirmed team (with levels and
// evolutions), completed gyms, badges and region stats. The
// current objective is derived from completedGyms rather than
// stored, so it can never drift out of sync.
// ============================================================

import type { JourneyPokemon } from '../data/kanto';

export interface RegionStats {
  battlesWon: number;
  battlesLost: number;
  totalTurns: number;
  startedAt: string | null;
  completedAt: string | null;
}

export interface JourneyRegionState {
  team: JourneyPokemon[] | null;
  completedGyms: string[]; // gym ids, in the order they were cleared
  regionComplete: boolean;
  stats: RegionStats;
}

export interface JourneyState {
  regions: Record<string, JourneyRegionState>;
  /** Region the player was last in, so we can resume straight there. */
  currentRegion: string | null;
}

const STORAGE_KEY = 'pokeverse_journey_state';

function emptyStats(): RegionStats {
  return {
    battlesWon: 0,
    battlesLost: 0,
    totalTurns: 0,
    startedAt: null,
    completedAt: null,
  };
}

function emptyRegionState(): JourneyRegionState {
  return { team: null, completedGyms: [], regionComplete: false, stats: emptyStats() };
}

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

export function getJourneyState(username: string): JourneyState {
  const all = getAllJourneyData();
  if (!all[username]) {
    all[username] = { regions: {}, currentRegion: null };
  }
  // Older saves predate currentRegion.
  if (all[username].currentRegion === undefined) {
    all[username].currentRegion = null;
  }
  return all[username];
}

export function getRegionState(username: string, regionId: string): JourneyRegionState {
  const state = getJourneyState(username);
  if (!state.regions[regionId]) {
    state.regions[regionId] = emptyRegionState();
  }
  // Migrate saves written before stats existed.
  if (!state.regions[regionId].stats) {
    state.regions[regionId].stats = emptyStats();
  }
  return state.regions[regionId];
}

export function saveRegionState(username: string, regionId: string, regionState: JourneyRegionState) {
  const all = getAllJourneyData();
  if (!all[username]) all[username] = { regions: {}, currentRegion: null };
  all[username].regions[regionId] = regionState;
  all[username].currentRegion = regionId;
  saveAllJourneyData(all);
}

export function setTeam(username: string, regionId: string, team: JourneyPokemon[]) {
  const region = getRegionState(username, regionId);
  region.team = team;
  if (!region.stats.startedAt) {
    region.stats.startedAt = new Date().toISOString();
  }
  saveRegionState(username, regionId, region);
}

export function updateTeam(username: string, regionId: string, team: JourneyPokemon[]) {
  const region = getRegionState(username, regionId);
  region.team = team;
  saveRegionState(username, regionId, region);
}

/** Fully restores HP and clears status on the whole party. */
export function healTeam(username: string, regionId: string) {
  const region = getRegionState(username, regionId);
  if (!region.team) return;
  region.team = region.team.map((p) => ({ ...p, currentHp: p.maxHp, status: null }));
  saveRegionState(username, regionId, region);
}

export function markGymComplete(username: string, regionId: string, gymId: string, turns = 0) {
  const region = getRegionState(username, regionId);
  if (!region.completedGyms.includes(gymId)) {
    region.completedGyms.push(gymId);
  }
  region.stats.battlesWon += 1;
  region.stats.totalTurns += turns;
  saveRegionState(username, regionId, region);
}

export function recordDefeat(username: string, regionId: string, turns = 0) {
  const region = getRegionState(username, regionId);
  region.stats.battlesLost += 1;
  region.stats.totalTurns += turns;
  saveRegionState(username, regionId, region);
}

export function markRegionComplete(username: string, regionId: string) {
  const region = getRegionState(username, regionId);
  region.regionComplete = true;
  region.stats.completedAt = new Date().toISOString();
  saveRegionState(username, regionId, region);
}

export function resetRegion(username: string, regionId: string) {
  saveRegionState(username, regionId, emptyRegionState());
}

// --- Region ordering ---------------------------------------
// Only Kanto exists so far; the rest are placeholders so the
// hub can show what's coming without being selectable. When a
// new region ships, add it to IMPLEMENTED_REGIONS — the unlock
// chain and per-region team rules already work generically.

export const REGION_ORDER = [
  'kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'paldea',
];
export const IMPLEMENTED_REGIONS = ['kanto'];

export function isRegionUnlocked(username: string, regionId: string): boolean {
  const idx = REGION_ORDER.indexOf(regionId);
  if (idx === 0) return true; // Kanto always unlocked
  if (idx < 0) return false;
  const prevState = getRegionState(username, REGION_ORDER[idx - 1]);
  return prevState.regionComplete;
}

// --- Derived progress --------------------------------------

export interface JourneyObjective {
  kind: 'pick-team' | 'defeat-gym' | 'region-complete';
  /** One-line objective string for the HUD. */
  text: string;
  /** Gym id to route to, when the objective is a gym. */
  gymId?: string;
}

/**
 * The player's current objective, derived from saved state so
 * it can never disagree with completedGyms.
 *
 * `gyms` is passed in rather than imported so this stays
 * region-agnostic.
 */
export function getNextObjective(
  region: JourneyRegionState,
  gyms: { id: string; name: string; gymName: string }[]
): JourneyObjective {
  if (!region.team || region.team.length !== 6) {
    return { kind: 'pick-team', text: 'Choose your team of six' };
  }
  const next = gyms.find((g) => !region.completedGyms.includes(g.id));
  if (!next) {
    return { kind: 'region-complete', text: 'All badges earned — region complete!' };
  }
  return { kind: 'defeat-gym', text: `Defeat ${next.name}`, gymId: next.id };
}

/** True when every gym before `gymId` has been cleared and this one hasn't. */
export function isGymAvailable(
  region: JourneyRegionState,
  gyms: { id: string; order: number }[],
  gymId: string
): boolean {
  const gym = gyms.find((g) => g.id === gymId);
  if (!gym) return false;
  if (region.completedGyms.includes(gymId)) return false;
  return gyms
    .filter((g) => g.order < gym.order)
    .every((g) => region.completedGyms.includes(g.id));
}

export type GymUiState = 'locked' | 'available' | 'in-progress' | 'completed';

/**
 * Gym state for the map indicators. `in-progress` means the
 * player has entered this gym and their party is damaged but
 * they haven't beaten it yet.
 */
export function getGymUiState(
  region: JourneyRegionState,
  gyms: { id: string; order: number }[],
  gymId: string
): GymUiState {
  if (region.completedGyms.includes(gymId)) return 'completed';
  if (!isGymAvailable(region, gyms, gymId)) return 'locked';
  const damaged = (region.team || []).some((p) => p.currentHp < p.maxHp);
  return damaged ? 'in-progress' : 'available';
}