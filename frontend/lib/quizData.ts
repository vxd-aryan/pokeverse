import { QuizQuestion } from '@/types/quiz';

export const TRIVIA_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    question: "Which of these Pokémon was the first one Ash ever caught in the wild?",
    options: ["Pidgeotto", "Caterpie", "Bulbasaur", "Weedle"],
    correctAnswer: "Caterpie",
    difficulty: "Easy",
    explanation: "Ash caught a Caterpie in the Viridian Forest without even battling it, making it his very first wild capture!"
  },
  {
    id: "q2",
    question: "In the Diamond & Pearl series, what unique strategy does Ash develop using his Pokémon's spinning moves?",
    options: ["The Cyclone Strike", "The Counter Shield", "The Spin Dodge", "The Vortex Barrier"],
    correctAnswer: "The Counter Shield",
    difficulty: "Medium",
    explanation: "Inspired by Dawn's contest combinations, Ash invented the Counter Shield to simultaneously attack and defend."
  },
  {
    id: "q3",
    question: "Who was the only opponent to defeat Ash's Greninja during the Kalos League finals?",
    options: ["Sawyer's Sceptile", "Alain's Charizard", "Diantha's Gardevoir", "Lysandre's Gyarados"],
    correctAnswer: "Alain's Charizard",
    difficulty: "Hard",
    explanation: "In a heartbreaking finale, Alain's Mega Charizard X narrowly defeated Ash-Greninja with a Blast Burn attack."
  }
];