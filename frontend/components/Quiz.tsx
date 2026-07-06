"use client";

import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '@/store/userStore';
import Image from 'next/image';

interface QuizQuestion {
  pokemon_id: number;
  artwork_url: string;
  options: string[];
}

const REGIONS = [
  { id: 'kanto', name: 'Kanto (Gen 1)' },
  { id: 'johto', name: 'Johto (Gen 2)' },
];

export default function Quiz() {
  const { user, setUser } = useUserStore();
  
  const [region, setRegion] = useState<string>('kanto');
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [correctName, setCorrectName] = useState<string>('');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const fetchQuiz = useCallback(async () => {
    setLoading(true);
    setSelectedAnswer(null);
    setErrorMessage(null);
    
    try {
      const userId = user?.id || 1;
      // 1. Fetch filtered regional quiz data from our FastAPI backend
      const res = await fetch(`${API_URL}/api/quiz/daily?region=${region}&user_id=${userId}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to load question");
      }

      const data: QuizQuestion = await res.json();
      setQuestion(data);

      // 2. Fetch the correct name from PokeAPI to evaluate the answer locally
      const pokeRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${data.pokemon_id}`);
      const pokeData = await pokeRes.json();
      
      const capitalizedName = pokeData.name.charAt(0).toUpperCase() + pokeData.name.slice(1);
      setCorrectName(capitalizedName);
    } catch (error: any) {
      console.error("Failed to load quiz data:", error);
      setErrorMessage(error.message || "An error occurred");
      setQuestion(null);
    } finally {
      setLoading(false);
    }
  }, [region, user?.id]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

 const handleGuess = async (guess: string) => {
    if (selectedAnswer || !question || !user) return; 
    
    setSelectedAnswer(guess);
    const isCorrect = guess === correctName;

    try {
    const res = await fetch(`${API_URL}/api/quiz/submit`,{
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          pokemon_id: question.pokemon_id, 
          is_correct: isCorrect
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        // --- THE FIX IS HERE ---
        // Grab the existing list of caught Pokemon from the current state
        const currentCaughtList = useUserStore.getState().user?.guessed_pokemon || [];
        
        // If the guess was correct AND the ID isn't already in the list, add it!
        let updatedCaughtList = [...currentCaughtList];
        if (isCorrect && !updatedCaughtList.includes(question.pokemon_id)) {
          updatedCaughtList.push(question.pokemon_id);
        }

        // Merge the backend's XP/Level updates with our updated frontend ID list
        setUser({
          ...data.user,
          guessed_pokemon: updatedCaughtList
        });
      }
    } catch (error) {
      console.error("Failed to submit quiz:", error);
    }
  };

  const isRevealed = selectedAnswer !== null;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
      
      {/* Region Selector Bar */}
      <div className="flex bg-slate-900 p-1.5 rounded-xl gap-2 mb-8 w-full max-w-md">
        {REGIONS.map((r) => (
          <button
            key={r.id}
            onClick={() => setRegion(r.id)}
            disabled={loading}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              region === r.id
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {r.name}
          </button>
        ))}
      </div>

      <h2 className="text-3xl font-black text-white mb-8 tracking-wider text-center drop-shadow-md">
        Who&apos;s That Pokémon?
      </h2>

      {/* Conditional States: Loading, Error, and Quiz Interface */}
      {loading ? (
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold animate-pulse">Encountering wild Pokémon...</p>
        </div>
      ) : errorMessage ? (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-900/50 rounded-xl border border-dashed border-slate-600 my-4 w-full">
          <p className="text-amber-400 font-black text-xl mb-2">🎉 Region Cleared! 🎉</p>
          <p className="text-slate-300 font-medium max-w-sm">{errorMessage}</p>
        </div>
      ) : question ? (
        <>
          {/* Pokémon Image */}
          <div className="relative w-64 h-64 mb-10">
            <Image
              src={question.artwork_url}
              alt="Mystery Pokemon"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              priority
              className={`object-contain transition-all duration-700 ease-in-out ${
                isRevealed 
                  ? "brightness-100 scale-110 drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]" 
                  : "brightness-0 scale-100 drop-shadow-none"
              }`}
            />
          </div>

          {/* Answer Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {question.options.map((option, index) => {
              let buttonClass = "bg-slate-700 hover:bg-slate-600 border-slate-600 text-white";
              
              if (isRevealed) {
                if (option === correctName) {
                  buttonClass = "bg-green-500 border-green-400 text-white scale-105 shadow-[0_0_15px_rgba(34,197,94,0.5)] z-10";
                } else if (option === selectedAnswer) {
                  buttonClass = "bg-red-500 border-red-400 text-white scale-95 opacity-80";
                } else {
                  buttonClass = "bg-slate-800 border-slate-700 text-slate-500 opacity-50";
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleGuess(option)}
                  disabled={isRevealed}
                  className={`py-4 px-6 rounded-xl border-b-4 font-bold text-lg tracking-wide transition-all duration-300 ${buttonClass}`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Next Question Button */}
          <div className={`mt-8 h-12 transition-all duration-500 ${isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <button 
              onClick={fetchQuiz}
              className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Keep Exploring ➔
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}