// ============================================================
// JOURNEY — SERVER SYNC
// ============================================================
// The save still lives in localStorage and the game still plays
// from it. This module keeps a copy on the account so that
// progress survives a new browser, a different machine, or
// cleared site data — none of which localStorage survives.
//
// The split matters: localStorage is the source of truth DURING
// play, because a battle must not wait on the network between
// turns, and the game should keep working when the backend is
// asleep (the free tier spins down after ~15 minutes idle). The
// server copy is the source of truth ACROSS sessions.
//
// Writes are debounced rather than immediate. Catching a Pokémon
// touches the save several times in a second, and a request per
// touch would be wasteful and racy.
// ============================================================

import { apiUrl, authHeaders, getToken } from '@/lib/api';

/** Per-username timestamp of the last local write, in localStorage. */
const SYNC_META_KEY = 'pokeverse_journey_sync_meta';

/** Quiet period after the last change before a push goes out. */
const PUSH_DEBOUNCE_MS = 3000;

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pendingUsername: string | null = null;
let flushHooksInstalled = false;

type SyncMeta = Record<string, { updatedAt: string }>;

function readMeta(): SyncMeta {
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeMeta(meta: SyncMeta) {
  try {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
  } catch {
    // Storage full or blocked. Sync degrades to last-write-wins,
    // which is survivable; the game itself must not break over it.
  }
}

/** When this browser last changed the save for `username`. */
export function getLocalUpdatedAt(username: string): string | null {
  return readMeta()[username]?.updatedAt ?? null;
}

export function markLocallyUpdated(username: string) {
  const meta = readMeta();
  meta[username] = { updatedAt: new Date().toISOString() };
  writeMeta(meta);
}

// ------------------------------------------------------------
// Pull
// ------------------------------------------------------------

export interface PullResult {
  /** What the caller should do with its local save. */
  action: 'adopted-server' | 'kept-local' | 'no-server-save' | 'signed-out' | 'failed';
  state?: unknown;
  message?: string;
}

/**
 * Fetch the account's save and decide which copy wins.
 *
 * Called on sign-in and when the Journey tab is opened. The
 * decision is deliberately simple — newer timestamp wins — rather
 * than trying to merge two divergent saves. Merging party members
 * and badges from two timelines produces a state neither player
 * recognises; picking one is at least explicable.
 */
export async function pullJourneyFromServer(
  username: string,
  localState: unknown,
): Promise<PullResult> {
  if (!getToken()) return { action: 'signed-out' };

  try {
    const res = await fetch(apiUrl('/api/journey/state'), {
      headers: { ...authHeaders() },
    });

    if (res.status === 401) return { action: 'signed-out' };
    if (!res.ok) return { action: 'failed', message: `server returned ${res.status}` };

    const body = await res.json();

    // Never seen a save for this account: keep whatever is local
    // and push it up. Crucially NOT treated as "your save is gone".
    if (body.empty) {
      await pushJourneyToServer(username, localState, { immediate: true });
      return { action: 'no-server-save' };
    }

    const serverAt = body.updated_at ? Date.parse(body.updated_at) : 0;
    const localAt = Date.parse(getLocalUpdatedAt(username) || '') || 0;

    // A local save with no recorded timestamp predates syncing.
    // The server copy is the one that was deliberately uploaded,
    // so it wins — but only when it actually exists, which the
    // `empty` branch above has already established.
    if (serverAt > localAt) {
      return { action: 'adopted-server', state: body.state };
    }

    // Local is newer or equal: push it so the server catches up.
    await pushJourneyToServer(username, localState, { immediate: true });
    return { action: 'kept-local' };
  } catch (err) {
    // Offline, or the backend is still waking up. The game plays
    // from localStorage regardless, so this is not fatal.
    console.warn('[journey] could not reach the server for sync:', err);
    return { action: 'failed', message: String(err) };
  }
}

// ------------------------------------------------------------
// Push
// ------------------------------------------------------------

/**
 * Upload the save.
 *
 * A 409 means another device has written something newer. That is
 * not an error to retry — retrying would overwrite the newer save,
 * which is exactly what the check exists to prevent. It is left
 * for the next pull to resolve.
 */
export async function pushJourneyToServer(
  username: string,
  state: unknown,
  opts: { immediate?: boolean } = {},
): Promise<boolean> {
  if (!getToken()) return false;
  if (!state) return false;

  const updatedAt = getLocalUpdatedAt(username) || new Date().toISOString();

  try {
    const res = await fetch(apiUrl('/api/journey/state'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        state,
        save_version: (state as any)?.version ?? 3,
        updated_at: updatedAt,
      }),
      // Lets the browser finish the request during page unload.
      keepalive: opts.immediate === true,
    });

    if (res.status === 409) {
      console.info('[journey] server holds a newer save; leaving it alone.');
      return false;
    }
    if (res.status === 413) {
      console.warn('[journey] save too large to store on the server.');
      return false;
    }
    return res.ok;
  } catch (err) {
    console.warn('[journey] could not upload progress:', err);
    return false;
  }
}

/**
 * Queue a push a few seconds from now, replacing any pending one.
 *
 * `journeyStorage.writeAll` calls this on every change, so one
 * action that touches the save several times still results in a
 * single request.
 */
export function scheduleJourneyPush(username: string, getState: () => unknown) {
  if (typeof window === 'undefined') return;
  pendingUsername = username;

  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushJourneyToServer(username, getState());
  }, PUSH_DEBOUNCE_MS);

  installFlushHooks(getState);
}

/**
 * Flush a pending push when the page is going away.
 *
 * Without this, closing the tab within the debounce window loses
 * the last few seconds of progress — which is precisely when
 * people close it, having just beaten a gym.
 *
 * `visibilitychange` is used rather than `unload`: mobile browsers
 * frequently kill a backgrounded tab without ever firing `unload`.
 */
function installFlushHooks(getState: () => unknown) {
  if (flushHooksInstalled || typeof window === 'undefined') return;
  flushHooksInstalled = true;

  const flush = () => {
    if (!pushTimer || !pendingUsername) return;
    clearTimeout(pushTimer);
    pushTimer = null;
    void pushJourneyToServer(pendingUsername, getState(), { immediate: true });
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('pagehide', flush);
}

/** Clear the account's stored save, for "start a new adventure". */
export async function clearServerJourney(): Promise<boolean> {
  if (!getToken()) return false;
  try {
    const res = await fetch(apiUrl('/api/journey/state'), {
      method: 'DELETE',
      headers: { ...authHeaders() },
    });
    return res.ok;
  } catch {
    return false;
  }
}