import { create } from 'zustand';

export interface User {
  id: number;       // <-- ADD THIS EXACT LINE
  username: string;
  email?: string;
  level: number;
  title: string;
  current_xp: number;
  guessed_pokemon: number[];
}

interface UserState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }), // Wipes data on logout
}));