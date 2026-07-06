"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';

interface QuizData {
  pokemon_id: number;
  artwork_url: string;
  options: string[];
}

export default function EvolutionChainsQuiz() {
  const { setUser } = useUserStore() as any;
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [pokemonName, setPokemonName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchQuestion = async () => {
    setLoading(true);
    setSelected(null);
    setCorrectAnswer(null);
    try {
      const res = await fetch('http://localhost:8000/api/quiz/evolution');
      const data = await res.json();
      setQuiz(data);
      
      const nameRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${data.pokemon_id}`);
      const nameData = await nameRes.json();
      setPokemonName(nameData.name.charAt(0).toUpperCase() + nameData.name.slice(1));
    } catch (err) {
      console.error(err);
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
    
    // Validate answer by traversing the PokeAPI evolution chain
    const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${quiz?.pokemon_id}`);
    const speciesData = await speciesRes.json();
    const chainRes = await fetch(speciesData.evolution_chain.url);
    const chainData = await chainRes.json();
    
    const actualEvo = chainData.chain.evolves_to[0].species.name;
    const formattedEvo = actualEvo.charAt(0).toUpperCase() + actualEvo.slice(1);
    setCorrectAnswer(formattedEvo);

    const isCorrect = guess === formattedEvo;

    if (isCorrect) {
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
            pokemon_id: quiz?.pokemon_id
          })
        });
        
        if (xpRes.ok) {
          const updatedUser = await xpRes.json();
          setUser(updatedUser);
        }
      } catch (err) {
        console.error("Failed to sync XP updates:", err);
      }
    }
  };

  if (loading || !quiz) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  const isRevealed = selected !== null;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-black text-rose-400 tracking-widest uppercase flex items-center gap-2">
            🧬 Evolution Chains
          </h1>
          <Link href="/quiz" className="text-sm font-bold text-slate-500 hover:text-slate-300">
            ← Abort Mission
          </Link>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-6 rounded-3xl shadow-2xl mb-8 flex flex-col items-center">
          <h2 className="text-xl font-bold text-slate-300 mb-4 text-center">
            What does <span className="text-rose-400">{pokemonName}</span> evolve into?
          </h2>
          <div className="bg-slate-900 rounded-2xl p-4 w-full flex justify-center border border-slate-700/50">
            <img 
              src={quiz.artwork_url} 
              alt={pokemonName} 
              className="w-48 h-48 object-contain drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {quiz.options.map((option) => {
            let btnState = "bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200";
            
            if (isRevealed) {
              if (option === correctAnswer) {
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
                className={`border-2 p-4 rounded-2xl font-black text-lg tracking-wider transition-all duration-300 ${btnState}`}
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
              className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-8 py-4 rounded-2xl font-black tracking-widest uppercase hover:scale-105 transition-transform shadow-xl shadow-rose-500/20"
            >
              Next Subject →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}