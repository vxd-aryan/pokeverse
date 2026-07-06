"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TRIVIA_QUESTIONS } from '@/lib/quizData';
import { useTrainerStore } from '@/store/useTrainerStore'; // ◀ Imported our new store

export default function AcademyGauntletPage() {
  // Game States
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Rewards State Feedback
  const [xpEarned, setXpEarned] = useState(0);
  const [didLevelUp, setDidLevelUp] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const currentQuestion = TRIVIA_QUESTIONS[currentIndex];
  const { addXp, updateGauntletHighScore } = useTrainerStore();

  const difficultyColors = {
    Easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Hard: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    Expert: "bg-purple-500/10 text-purple-400 border-purple-500/20"
  };

  // Process score calculations safely when user hits the final screen
  useEffect(() => {
    if (isFinished) {
      const calculatedXp = score * 25; // 25 XP per correct answer
      setXpEarned(calculatedXp);
      
      // Commit rewards to global trainer state
      const rewardResults = addXp(calculatedXp);
      setDidLevelUp(rewardResults.leveledUp);

      const highscoreResult = updateGauntletHighScore(score);
      setIsNewRecord(highscoreResult);
    }
  }, [isFinished]);

  const handleOptionClick = (option: string) => {
    if (isSubmitted) return;
    setSelectedOption(option);
  };

  const handleSubmit = () => {
    if (!selectedOption || isSubmitted) return;
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
    setIsSubmitted(true);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsSubmitted(false);

    if (currentIndex < TRIVIA_QUESTIONS.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  // --- SCORECARD DISPLAY ---
  if (isFinished) {
    return (
      <div className="p-4 md:p-8 max-w-xl mx-auto text-center animate-in zoom-in-95 duration-300">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          
          {didLevelUp && (
            <div className="absolute inset-0 bg-indigo-600/10 pointer-events-none animate-pulse border border-indigo-500/30 rounded-3xl" />
          )}

          <span className="text-4xl block mb-4">{didLevelUp ? "🎉" : "🎓"}</span>
          <h2 className="text-3xl font-black text-white mb-2">
            {didLevelUp ? "Level Up!" : "Exam Completed"}
          </h2>
          <p className="text-slate-400 text-sm mb-6">Your Academy performance metrics have been processed.</p>
          
          {/* Main Core Score Display */}
          <div className="bg-slate-950 rounded-2xl p-6 border border-slate-850 mb-6 inline-block min-w-[240px]">
            <span className="text-xs font-mono uppercase text-slate-500 block tracking-wider mb-1">Correct Answers</span>
            <span className="text-5xl font-black text-amber-400">{score}</span>
            <span className="text-slate-500 font-bold text-lg"> / {TRIVIA_QUESTIONS.length}</span>
            
            {isNewRecord && (
              <div className="text-[10px] font-mono font-bold text-amber-400 mt-2 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-block">
                ⚡ NEW PERSONAL BEST RECORD
              </div>
            )}
          </div>

          {/* XP Rewards Bar Layout */}
          <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 mb-8 text-left space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Experience Allocated:</span>
              <span className="font-bold font-mono text-emerald-400">+{xpEarned} XP</span>
            </div>
            {didLevelUp && (
              <div className="text-[11px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg font-medium text-center">
                ✨ Your Trainer Rating improved! Check your new level status.
              </div>
            )}
          </div>

          <div className="flex gap-4 justify-center">
            <Link href="/quiz">
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 w-full sm:w-auto">
                Return to Academy Hub
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- ACTIVE GAMEPLAY VIEW ---
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-4 mb-4 text-xs font-mono">
        <span className="text-slate-500">Academy Test: Question {currentIndex + 1} of {TRIVIA_QUESTIONS.length}</span>
        <span className={`px-2 py-0.5 rounded border font-bold ${difficultyColors[currentQuestion.difficulty]}`}>
          {currentQuestion.difficulty}
        </span>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <h2 className="text-xl md:text-2xl font-bold text-white leading-snug mb-8">
          {currentQuestion.question}
        </h2>

        <div className="space-y-3 mb-8">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedOption === option;
            const isCorrect = option === currentQuestion.correctAnswer;
            
            let optionStyles = "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40";
            if (isSelected && !isSubmitted) optionStyles = "border-amber-500 bg-amber-500/5 text-amber-400";
            if (isSubmitted) {
              if (isCorrect) optionStyles = "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold";
              else if (isSelected && !isCorrect) optionStyles = "border-rose-500 bg-rose-500/10 text-rose-400 line-through";
              else optionStyles = "border-slate-900/40 bg-slate-950/20 text-slate-600 cursor-not-allowed";
            }

            return (
              <button
                key={option}
                disabled={isSubmitted}
                onClick={() => handleOptionClick(option)}
                className={`w-full text-left p-4 rounded-xl text-sm border font-medium transition-all ${optionStyles}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {isSubmitted ? (
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 animate-in slide-in-from-bottom-2">
            <p className="text-slate-300 text-xs leading-relaxed mb-4">💡 {currentQuestion.explanation}</p>
            <button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-lg">
              {currentIndex === TRIVIA_QUESTIONS.length - 1 ? "Finish Test ➔" : "Next Question ➔"}
            </button>
          </div>
        ) : (
          <button
            disabled={!selectedOption}
            onClick={handleSubmit}
            className={`w-full font-black text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all ${
              selectedOption ? "bg-amber-500 text-slate-900 cursor-pointer" : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            🔒 Submit Answer
          </button>
        )}
      </div>
    </div>
  );
}