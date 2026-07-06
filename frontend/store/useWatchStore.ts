import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WatchState {
  watchedIds: string[];
  toggleWatched: (id: string) => void;
}

export const useWatchStore = create<WatchState>()(
  persist(
    (set) => ({
      // This array holds the IDs of every movie/series the user finishes
      watchedIds: [],
      
      // This function adds or removes an ID from the array
      toggleWatched: (id) => set((state) => ({
        watchedIds: state.watchedIds.includes(id)
          ? state.watchedIds.filter((watchId) => watchId !== id)
          : [...state.watchedIds, id],
      })),
    }),
    {
      name: 'pokemon-watch-storage', // The name of the key in local storage
    }
  )
);