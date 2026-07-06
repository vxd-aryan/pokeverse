"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Pre-calculated geography and location logic pool
const GEOGRAPHY_DATABASE = [
  { question: "Where is Professor Oak's primary research laboratory located?", answer: "Pallet Town", decoys: ["Viridian City", "Celadon City", "Cinnabar Island"] },
  { question: "Which massive mountain range divides the Sinnoh region in half?", answer: "Mt. Coronet", decoys: ["Mt. Moon", "Stark Mountain", "Spear Pillar"] },
  { question: "In the Hoenn region, where does the Legendary Pokémon Rayquaza reside?", answer: "Sky Pillar", decoys: ["Meteor Falls", "Cave of Origin", "Mt. Pyre"] },
  { question: "The famous 'Red Gyarados' is encountered in which specific Johto location?", answer: "Lake of Rage", decoys: ["Slowpoke Well", "Whirl Islands", "Mt. Silver"] },
  { question: "Which region features the snowy expanse known as the Crown Tundra?", answer: "Galar", decoys: ["Sinnoh", "Kalos", "Paldea"] },
  { question: "Where must a trainer go in Kanto to revive Fossil Pokémon?", answer: "Cinnabar Island", decoys: ["Pewter City", "Fuchsia City", "Saffron City"] },
  { question: "Which Alolan island is home to the guardian deity Tapu Koko?", answer: "Melemele Island", decoys: ["Akala Island", "Ula'ula Island", "Poni Island"] },
  { question: "The mysterious Area Zero is hidden within the Great Crater of which region?", answer: "Paldea", decoys: ["Unova", "Kalos", "Galar"] },
  { question: "In Kanto, which route is notoriously known as 'Silence Bridge' and blocks passage with a Snorlax?", answer: "Route 12", decoys: ["Route 11", "Route 16", "Route 1"] },
  { question: "Castelia City, a sprawling metropolis with skyscrapers, is the heart of which region?", answer: "Unova", decoys: ["Kalos", "Galar", "Johto"] }
];

export default function GeographySimulatorPage() {
  const [currentScenario, setCurrentScenario] = useState<any>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const generateScenario = () => {
    setSelectedAnswer(null);
    setIsAnswered(false);

    // Pick a random question from the database
    const randomIndex = Math.floor(Math.random() * GEOGRAPHY_DATABASE.length);
    const scenario = GEOGRAPHY_DATABASE[randomIndex];

    // Shuffle answer and decoys
    const shuffledOptions = [scenario.answer, ...scenario.decoys].sort(() => Math.random() - 0.5);

    setCurrentScenario(scenario);
    setOptions(shuffledOptions);
  };

  useEffect(() => {
    generateScenario();
  }, []);

  const handleSelection = (option: string) => {
    if (isAnswered || !currentScenario) return;
    
    setSelectedAnswer(option);
    setIsAnswered(true);
    setAttempts(prev => prev + 1);

    if (option === currentScenario.answer) {
      setScore(prev => prev + 1);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-8 animate-in fade-in duration-500 text-white">
      
      {/* HUD Navigation */}
      <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800 mb-8 shadow-lg">
        <Link href="/quiz" className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-2 transition-colors">
          ← Return to Hub
        </Link>
        <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-xl font-bold">
          🗺️ Nav Accuracy: {score} / {attempts}
        </div>
      </div>

      {/* Main Matrix Interface */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        
        {/* Background Accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-10 relative z-10">
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-md uppercase font-mono tracking-widest font-black">
            Spatial Coordinate Logic
          </span>
          <h2 className="text-2xl sm:text-3xl font-black mt-4 text-slate-100 leading-tight">
            {currentScenario ? currentScenario.question : "Mapping Topography..."}
          </h2>
        </div>

        {currentScenario && (
          <div className="relative z-10">
            {/* Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
              {options.map((option) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentScenario.answer;

                let btnStyle = "bg-slate-950/60 hover:bg-slate-800 border-slate-700 text-slate-300 hover:border-emerald-500/50";

                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]";
                  } else if (isSelected) {
                    btnStyle = "bg-red-500/20 border-red-500 text-red-400";
                  } else {
                    btnStyle = "bg-slate-950/20 border-slate-800/50 text-slate-600 pointer-events-none";
                  }
                }

                return (
                  <button
                    key={option}
                    disabled={isAnswered}
                    onClick={() => handleSelection(option)}
                    className={`p-5 rounded-xl border-2 font-bold text-sm transition-all duration-200 flex justify-between items-center ${btnStyle}`}
                  >
                    <span>{option}</span>
                    {isAnswered && isCorrect && <span className="text-lg font-black">✓</span>}
                    {isAnswered && isSelected && !isCorrect && <span className="text-lg font-black">✗</span>}
                  </button>
                );
              })}
            </div>

            {/* Next Module Trigger */}
            {isAnswered && (
              <div className="mt-10 text-center animate-in fade-in zoom-in-95 duration-300">
                <button
                  onClick={generateScenario}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-950/50 active:scale-95"
                >
                  Calculate Next Coordinates ➔
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}