"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';

interface DailyQuestion {
  id: number;
  question_text: string;
  artwork_url: string;
  options: string[];
  correct_answer: string;
  is_silhouette: boolean;
}

export default function DailyGauntlet() {
  const { user, setUser } = useUserStore() as any;
  const router = useRouter();
  
  const [questions, setQuestions] = useState<DailyQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  
  // Game Management States
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [earnedXp, setEarnedXp] = useState(0);
  
  // Timer State (3 minutes = 180 seconds)
  const [timeLeft, setTimeLeft] = useState(180);
  const [timerActive, setTimerActive] = useState(false);

  // Verification & initialization lifecycle
  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }

    // Evaluate locking constraints matching database tracking variables
    // Using en-CA ensures we get the local YYYY-MM-DD format, preventing timezone bypasses
    const today = new Date().toLocaleDateString('en-CA');
    
    if (user.last_quiz_date === today) {
      setLocked(true);
      setLoading(false);
      return; // Stop execution here so it doesn't fetch questions!
    }

    const fetchGauntlet = async () => {
      try {
        const res = await fetch('https://pokeverse-backend-0o6t.onrender.com/api/quiz/daily/questions');
        if (!res.ok) throw new Error("Failed to sync evaluation questions.");
        const data = await res.json();
        setQuestions(data);
        setTimerActive(true); 
      } catch (err) {
        console.error("Matrix download error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGauntlet();
  }, [user, router]);

  // Clock countdown ticker loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      handleFinalSubmit(score); 
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, score]);

  const handleFinalSubmit = async (finalScore: number) => {
    setTimerActive(false);
    const token = localStorage.getItem('trainer_token') || localStorage.getItem('token');
    
    try {
      const res = await fetch('https://pokeverse-backend-0o6t.onrender.com/api/quiz/daily/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ daily_correct: finalScore }) 
      });
      
      if (res.ok) {
        const updatedUser = await res.json();
        
        // Calculate incremental difference to reveal exact evaluation rewards
        const baseCorrect = finalScore;
        setEarnedXp(baseCorrect * 50);
        
        setUser(updatedUser);
        setIsFinished(true);
      } else {
        const errData = await res.json();
        console.error("Backend Rejection Data:", errData);
        
        let errorMessage = "Profile progression synchronization failure.";
        if (errData.detail) {
          errorMessage = typeof errData.detail === 'string' 
            ? errData.detail 
            : JSON.stringify(errData.detail);
        } else if (typeof errData === 'object') {
          errorMessage = JSON.stringify(errData);
        }
        
        alert("Sync Error: " + errorMessage);
      }
    } catch (err) {
      console.error("Submission failed:", err);
    }
  };

  const handleAnswer = (guess: string) => {
    const currentQ = questions[currentIndex];
    let newScore = score;
    
    if (guess === currentQ.correct_answer) {
      newScore += 1;
      setScore(newScore);
    }

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleFinalSubmit(newScore);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex justify-center items-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-amber-500 font-black tracking-widest uppercase text-xs">Downloading Daily Assessment Matrix...</p>
        </div>
      </div>
    );
  }

  // --- LOCKOUT OVERLAY SCREEN ---
  if (locked) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col justify-center items-center p-6">
        <div className="bg-slate-800 p-10 rounded-3xl border border-slate-700 text-center max-w-lg shadow-2xl">
          <div className="text-6xl mb-6">⏳</div>
          <h1 className="text-2xl font-black text-amber-500 tracking-widest uppercase mb-4">Gauntlet Locked</h1>
          <p className="text-slate-400 leading-relaxed mb-8">
            Your official evaluation has already been recorded for today. The mainframe will compile your next gauntlet at <span className="text-slate-200 font-bold">00:00 server time</span>.
          </p>
          <Link href="/quiz" className="bg-slate-700 hover:bg-slate-600 px-8 py-3 rounded-xl font-bold transition-all inline-block border border-slate-600">
            Return to Headquarters
          </Link>
        </div>
      </div>
    );
  }

  // --- SCORE REVEAL SCREEN ---
  if (isFinished) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col justify-center items-center p-6">
        <div className="bg-slate-800 p-10 rounded-3xl border border-amber-500/30 text-center max-w-lg shadow-[0_0_50px_rgba(245,158,11,0.1)]">
          <div className="text-5xl mb-4">🏆</div>
          <h1 className="text-3xl font-black text-amber-400 tracking-widest uppercase mb-2">Sync Complete</h1>
          <p className="text-slate-300 font-bold text-lg mb-8">Final Rating: {score} / 10 Coordinates</p>
          
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-6 mb-8">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-black mb-1">Telemetry Experience Allocated</p>
            <p className="text-4xl font-black text-emerald-400">+{earnedXp} XP</p>
          </div>

          <Link href="/quiz" className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] transition-transform inline-block shadow-lg shadow-orange-500/20">
            Secure Terminal Connection
          </Link>
        </div>
      </div>
    );
  }

  // --- ACTIVE QUIZ RUNTIME INTERFACE ---
  // Ensure we don't try to access undefined questions if an error occurred
  if (!questions || questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const timeWarning = timeLeft <= 30 ? "text-rose-500 animate-pulse font-black" : "text-amber-400 font-black";

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-6 flex flex-col items-center">
      <div className="max-w-3xl w-full mt-4 md:mt-10">
        
        {/* Header telemetry hub */}
        <div className="flex justify-between items-center mb-6 bg-slate-800/80 backdrop-blur p-4 rounded-2xl border border-slate-700/80 shadow-lg">
          <div className="font-black text-sm text-slate-400 tracking-widest uppercase">
            Assessment <span className="text-amber-400 font-black">{currentIndex + 1}</span> <span className="text-slate-600">/ 10</span>
          </div>
          <div className={`text-xl md:text-2xl tracking-widest flex items-center gap-2 ${timeWarning}`}>
            <span>⏱</span> {formatTime(timeLeft)}
          </div>
        </div>

        {/* Tactical Query Matrix */}
        <div className="bg-slate-800 border border-slate-700 p-6 md:p-8 rounded-3xl shadow-2xl mb-6 flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-50"></div>
          
          <h2 className="text-xl md:text-2xl font-bold text-slate-100 mb-6 text-center leading-relaxed max-w-2xl">
            {currentQ.question_text}
          </h2>
          
          <div className="bg-slate-900 rounded-2xl p-4 w-full flex justify-center items-center border border-slate-700/40 h-64 shadow-inner relative">
            <img 
              src={currentQ.artwork_url} 
              alt="Subject Matrix Data" 
              className={`w-48 h-48 md:w-52 md:h-52 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-all duration-300 select-none pointer-events-none ${
                currentQ.is_silhouette ? 'brightness-0 contrast-200 opacity-90' : 'brightness-100'
              }`}
            />
            {currentQ.is_silhouette && (
              <span className="absolute bottom-3 right-4 text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                Encrypted Silhouette Mode
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Selection Input Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQ.options.map((option) => (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              className="bg-slate-800 hover:bg-slate-750 border-2 border-slate-700 hover:border-amber-500/60 text-slate-200 p-5 rounded-2xl font-bold text-base md:text-lg tracking-wide text-left md:text-center transition-all active:scale-[0.99] hover:-translate-y-0.5 shadow-md flex items-center justify-between md:justify-center px-6"
            >
              <span className="truncate">{option}</span>
              <span className="text-slate-600 text-xs font-mono md:hidden">↳ Select</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}