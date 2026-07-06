export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: Difficulty;
  explanation: string; // Shows up after they guess!
}