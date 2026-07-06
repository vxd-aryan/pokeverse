"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';

interface QuizData {
  pokemon_id: number;
  artwork_url: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  pokemon_name: string;
}

export default function TypeMatchups() {
  const { setUser } = useUserStore() as any;
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchQuestion = async () => {
    setLoading(true);
    setSelected(null);
    setError("");
    try {
      const res = await fetch('http://localhost:8000/api/quiz/type-match');
      if (!res.ok) throw new Error(`API standard returned status ${res.status}`);
      const data = await res.json();
      setQuiz(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load regional typing assessment matrix.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, []);

  const handleGuess = async (guess: string) => {
    if (selected || !quiz) return;
    setSelected(guess);
    
    const token = localStorage.getItem('trainer_token') || localStorage.getItem('token');
    const isCorrect = guess === quiz.correct_answer;

    if (isCorrect && token) {
      try {
        const xpRes = await fetch('http://localhost:8000/api/quiz/practice/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            user_id: 0, 
            is_correct: true,
            pokemon_id: quiz.pokemon_id
          })
        });
        
        if (xpRes.ok) {
          const updatedUser = await xpRes.json();
          setUser(updatedUser);
        }
      } catch (err) {
        console.error("Failed to sync XP.", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex justify-center items-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-32 h-32 bg-slate-800 rounded-full mb-6 animate-spin" style={{ animationDuration: '3s' }}></div>
          <p className="text-purple-400 font-bold tracking-widest uppercase text-sm">Calculating Damage Multipliers...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col justify-center items-center p-6">
        <p className="text-purple-400 font-bold mb-4">{error || "Connection Error"}</p>
        <button onClick={fetchQuestion} className="bg-slate-800 px-6 py-2 rounded-xl border border-slate-700">Retry Matrix</button>
      </div>
    );
  }

  const isRevealed = selected !== null;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-black text-purple-400 tracking-widest uppercase flex items-center gap-2">
            ⚔️ Tactical Matchups
          </h1>
          <Link href="/quiz" className="text-sm font-bold text-slate-500 hover:text-slate-300">
            ← Abort Mission
          </Link>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-6 md:p-8 rounded-3xl shadow-2xl mb-8 flex flex-col items-center">
          {/* Dynamic Question Rendered Here */}
          <h2 className="text-lg md:text-xl font-bold text-slate-200 mb-6 text-center leading-relaxed">
            {quiz.question_text.split(quiz.pokemon_name)[0]}
            <span className="text-purple-400 font-black">{quiz.pokemon_name}</span>
            {quiz.question_text.split(quiz.pokemon_name)[1]}
          </h2>
          
          <div className="bg-slate-900 rounded-2xl p-4 w-full flex justify-center border border-slate-700/50">
            <img 
              src={quiz.artwork_url} 
              alt={quiz.pokemon_name} 
              className="w-48 h-48 md:w-56 md:h-56 object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {quiz.options.map((option) => {
            let btnState = "bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200";
            
            if (isRevealed) {
              if (option === quiz.correct_answer) {
                btnState = "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]";
              } else if (option === selected) {
                btnState = "bg-rose-500 border-rose-400 text-white opacity-70";
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
                {option}
              </button>
            );
          })}
        </div>

        {isRevealed && (
          <div className="flex justify-center animate-fade-in-up">
            <button 
              onClick={fetchQuestion}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-4 rounded-2xl font-black tracking-widest uppercase hover:scale-105 transition-transform shadow-xl shadow-purple-500/20"
            >
              Next Calculation →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}