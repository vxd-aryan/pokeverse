import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TrainerState {
  xp: number;
  level: number;
  gauntletHighScore: number;
  addXp: (amount: number) => { leveledUp: boolean; xpGained: number };
  updateGauntletHighScore: (score: number) => boolean; // Returns true if new high score
}

export const useTrainerStore = create<TrainerState>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      gauntletHighScore: 0,

      addXp: (amount) => {
        const currentXp = get().xp;
        const currentLevel = get().level;
        
        let newXp = currentXp + amount;
        let newLevel = currentLevel;
        let leveledUp = false;

        // Level up formula: 100 XP required per level
        const xpNeeded = 100; 

        while (newXp >= xpNeeded) {
          newXp -= xpNeeded;
          newLevel += 1;
          leveledUp = true;
        }

        set({ xp: newXp, level: newLevel });
        return { leveledUp, xpGained: amount };
      },

      updateGauntletHighScore: (score) => {
        const currentHighScore = get().gauntletHighScore;
        if (score > currentHighScore) {
          set({ gauntletHighScore: score });
          return true; // New record set!
        }
        return false;
      }
    }),
    {
      name: 'pokemon-trainer-progression',
    }
  )
);