"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';

interface QuizData {
  pokemon_id: number;
  artwork_url: string;
  options: string[];
}

export default function WhosThatPokemon() {
  const { setUser } = useUserStore() as any;
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Helper helper to clean up API names (e.g., "mr-mime" -> "Mr Mime")
  const formatPokemonName = (rawName: string) => {
    return rawName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const fetchQuestion = async () => {
    setLoading(true);
    setSelected(null);
    setCorrectAnswer(null);
    setError("");
    try {
      const res = await fetch('https://pokeverse-backend-0o6t.onrender.com/api/quiz/whos-that');
      if (!res.ok) throw new Error(`API returned status ${res.status}`);
      const data = await res.json();
      setQuiz(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to stream next encounter from the backend matrix.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, []);

  const handleGuess = async (guess: string) => {
    if (selected) return;
    setSelected(guess);
    
    const token = localStorage.getItem('trainer_token') || localStorage.getItem('token');
    
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${quiz?.pokemon_id}`);
      const data = await res.json();
      const actualName = formatPokemonName(data.name);
      setCorrectAnswer(actualName);

      const isCorrect = formatPokemonName(guess) === actualName;

      if (isCorrect && token) {
        const xpRes = await fetch('https://pokeverse-backend-0o6t.onrender.com/api/quiz/practice/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            user_id: 0,
            is_correct: true,
            pokemon_id: quiz?.pokemon_id
          })
        });
        
        if (xpRes.ok) {
          const updatedUser = await xpRes.json();
          setUser(updatedUser);
        }
      }
    } catch (err) {
      console.error("Failed to process guess validation:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex justify-center items-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-32 h-32 bg-slate-800 rounded-full mb-6 animate-bounce"></div>
          <p className="text-amber-500 font-bold tracking-widest uppercase text-sm">Scanning National Pokédex (1-1025)...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col justify-center items-center p-6">
        <p className="text-red-400 font-bold mb-4">{error || "Connection Error"}</p>
        <button onClick={fetchQuestion} className="bg-slate-800 px-6 py-2 rounded-xl border border-slate-700">Retry Connection</button>
      </div>
    );
  }

  const isRevealed = selected !== null;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-black text-amber-400 tracking-widest uppercase flex items-center gap-2">
            🔍 Who's That Pokémon?
          </h1>
          <Link href="/quiz" className="text-sm font-bold text-slate-500 hover:text-slate-300">
            ← Abort Mission
          </Link>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-3xl shadow-2xl mb-8">
          <div className="bg-blue-200 rounded-2xl relative overflow-hidden aspect-video flex justify-center items-center">
            <img 
              src={quiz.artwork_url} 
              alt="Mystery Pokemon" 
              className={`relative z-10 w-48 h-48 md:w-56 md:h-56 object-contain drop-shadow-2xl transition-all duration-500
                ${!isRevealed ? 'brightness-0 contrast-200 drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] scale-95' : 'scale-100'}
              `}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {quiz.options.map((option) => {
            const formattedOption = formatPokemonName(option);
            let btnState = "bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200";
            
            if (isRevealed) {
              if (formattedOption === correctAnswer) {
                btnState = "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]";
              } else if (option === selected) {
                btnState = "bg-red-500 border-red-400 text-white opacity-70";
              } else {
                btnState = "bg-slate-800 border-slate-700 text-slate-600 opacity-50";
              }
            }

            return (
              <button
                key={option}
                onClick={() => handleGuess(option)}
                disabled={isRevealed}
                className={`border-2 p-4 rounded-2xl font-black text-base md:text-lg tracking-wider transition-all duration-300 ${btnState}`}
              >
                {formattedOption}
              </button>
            );
          })}
        </div>

        {isRevealed && (
          <div className="flex justify-center">
            <button 
              onClick={fetchQuestion}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 px-8 py-4 rounded-2xl font-black tracking-widest uppercase hover:scale-105 transition-transform"
            >
              Next Encounter →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}