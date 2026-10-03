import { create } from 'zustand';

/**
 * The signed-in trainer.
 *
 * Shape mirrors the backend's `schemas.UserResponse`, with one
 * difference: almost everything is optional. The profile arrives in
 * stages — the auth response carries only email and username, and
 * the full record follows from /api/users/me. Marking fields as
 * required when a caller may not have them yet just pushes the
 * problem into `as any` casts, which is how the pages currently
 * sidestep this type entirely.
 */
export interface User {
  id?: number;
  username: string;
  email?: string;

  // Progression
  level: number;
  title: string;
  current_xp: number;

  // Battle record — present once /api/users/me has been read.
  battles_played?: number;
  wins?: number;
  losses?: number;
  win_rate?: number;

  // ROM mechanic telemetry
  total_critical_hits?: number;
  total_statuses_inflicted?: number;

  // Quiz state. The backend doesn't return this today, so it's
  // optional rather than a required field that's always missing.
  guessed_pokemon?: number[];
}

/**
 * XP needed to clear a level. Mirrors `crud.xp_threshold` on the
 * backend: 100 at level 1, 200 at level 2, and so on.
 *
 * This rule previously existed in three places that disagreed —
 * here (via layout.tsx's inline listener), in main.py's quiz routes,
 * and in crud.py, which treated current_xp as a lifetime total and
 * could demote a trainer on a win. Backend is now single-sourced in
 * crud.py; this is the frontend's one copy, kept deliberately
 * identical.
 */
export const xpThreshold = (level: number): number => Math.max(1, level) * 100;

interface UserState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
  /** Merge a partial update without replacing the whole profile. */
  patchUser: (patch: Partial<User>) => void;
  /**
   * Apply an XP change, rolling levels forward and carrying the
   * remainder. Negative values deduct without ever de-levelling,
   * matching `crud.apply_xp_loss`.
   */
  applyXpChange: (delta: number) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,

  setUser: (user) => set({ user }),

  clearUser: () => set({ user: null }), // Wipes data on logout

  patchUser: (patch) =>
    set((state) => (state.user ? { user: { ...state.user, ...patch } } : state)),

  applyXpChange: (delta) =>
    set((state) => {
      if (!state.user) return state;

      let level = state.user.level || 1;
      let xp = (state.user.current_xp || 0) + delta;

      if (delta >= 0) {
        while (xp >= xpThreshold(level)) {
          xp -= xpThreshold(level);
          level += 1;
        }
      } else {
        // Losing never costs a level, only progress toward the next.
        xp = Math.max(0, xp);
      }

      return { user: { ...state.user, level, current_xp: xp } };
    }),
}));