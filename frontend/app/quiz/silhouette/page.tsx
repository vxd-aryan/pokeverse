"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SilhouetteQuestion {
  id: number;
  name: string;
  imageUrl: string;
  options: string[];
}

export default function SilhouetteQuizPage() {
  const [question, setQuestion] = useState<SilhouetteQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  // Core generation logic fetching live data from PokéAPI
  const generateQuestion = async () => {
    setLoading(true);
    setSelectedAnswer(null);
    setIsAnswered(false);

    try {
      // Pick a random ID across Generations 1-8
      const randomId = Math.floor(Math.random() * 898) + 1;
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
      if (!res.ok) throw new Error("Network error fetching subject data.");
      const data = await res.json();

      // Curated dynamic pool of decoys to challenge the trainer
      const alternatePool = [
        "Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard",
        "Squirtle", "Wartortle", "Blastoise", "Caterpie", "Metapod", "Butterfree",
        "Weedle", "Kakuna", "Beedrill", "Pidgey", "Pidgeotto", "Pidgeot", "Rattata",
        "Raticate", "Spearow", "Fearow", "Ekans", "Arbok", "Pikachu", "Raichu"
      ];

      const cleanName = data.name.charAt(0).toUpperCase() + data.name.slice(1);
      
      const decoys = alternatePool
        .filter(n => n.toLowerCase() !== data.name.toLowerCase())
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const options = [cleanName, ...decoys].sort(() => Math.random() - 0.5);

      setQuestion({
        id: data.id,
        name: cleanName,
        imageUrl: data.sprites.other['official-artwork'].front_default,
        options
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateQuestion();
  }, []);

  const handleGuess = (option: string) => {
    if (isAnswered || !question) return;
    setSelectedAnswer(option);
    setIsAnswered(true);
    setAttempts(prev => prev + 1);

    if (option.toLowerCase() === question.name.toLowerCase()) {
      setScore(prev => prev + 1);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-8 animate-in fade-in duration-500 text-white">
      
      {/* Return Navigation HUD */}
      <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800 mb-8 shadow-lg">
        <Link href="/quiz" className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-2 transition-colors">
          ← Return to Hub
        </Link>
        <div className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-4 py-1.5 rounded-xl font-bold">
          🎯 Score: {score} / {attempts}
        </div>
      </div>

      {/* Main Simulator Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        
        {/* Decorative Radar Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <span className="text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-md uppercase font-mono tracking-widest font-black">
            Visual Signal Processing
          </span>
          <h2 className="text-2xl sm:text-3xl font-black mt-3 text-slate-100 uppercase tracking-wide">
            Analyze Structural Silhouette
          </h2>
        </div>

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 font-bold animate-pulse">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
            Decoding Imaging Array...
          </div>
        ) : question ? (
          <div className="relative z-10">
            
            {/* The Silhouette Wrapper */}
            <div className="w-56 h-56 mx-auto bg-slate-950/60 rounded-full border border-slate-800 flex items-center justify-center p-6 mb-10 shadow-inner relative group">
              <img 
                src={question.imageUrl} 
                alt="Target silhouette" 
                className={`w-full h-full object-contain transition-all duration-700 select-none ${
                  isAnswered 
                    ? 'brightness-100 drop-shadow-[0_0_25px_rgba(59,130,246,0.4)] scale-105' 
                    : 'brightness-0 contrast-200 pointer-events-none'
                }`}
              />
              {/* Scanline Overlay */}
              {!isAnswered && (
                <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent animate-pulse rounded-full pointer-events-none" />
              )}
            </div>

            {/* Multiple Choice Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
              {question.options.map((option) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option.toLowerCase() === question.name.toLowerCase();

                let btnStyle = "bg-slate-950/40 hover:bg-slate-800/80 border-slate-800 text-slate-300 hover:border-slate-600";

                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = "bg-emerald-500/20 border-emerald-500/80 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]";
                  } else if (isSelected) {
                    btnStyle = "bg-red-500/20 border-red-500/80 text-red-400";
                  } else {
                    btnStyle = "bg-slate-950/10 border-slate-900/50 text-slate-600 pointer-events-none";
                  }
                }

                return (
                  <button
                    key={option}
                    disabled={isAnswered}
                    onClick={() => handleGuess(option)}
                    className={`p-4 rounded-xl border font-bold capitalize text-base tracking-wide transition-all duration-200 flex justify-between items-center ${btnStyle}`}
                  >
                    <span>{option}</span>
                    {isAnswered && isCorrect && <span className="text-sm">✓</span>}
                    {isAnswered && isSelected && !isCorrect && <span className="text-sm">✗</span>}
                  </button>
                );
              })}
            </div>

            {/* Next Action Module */}
            {isAnswered && (
              <div className="mt-8 text-center animate-in fade-in zoom-in-95 duration-300">
                <button
                  onClick={generateQuestion}
                  className="px-10 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-cyan-950"
                >
                  Load Next Subject ➔
                </button>
              </div>
            )}

          </div>
        ) : (
          <div className="text-center text-red-400 font-bold p-6">
            Error configuring local core matrix.
          </div>
        )}

      </div>
    </div>
  );
}