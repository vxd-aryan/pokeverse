"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface LeaderboardUser {
  id: number;
  username: string;
  level: number;
  title: string;
  current_xp: number;
}

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Grab the user's token (must match how you saved it during login/register)
        const token = localStorage.getItem('trainer_token') || localStorage.getItem('token'); 
        
        if (!token) {
          router.push('/auth');
          return;
        }

        // Updated to match the backend route from your FastAPI engine
        const response = await fetch('https://pokeverse-backend-0o6t.onrender.com/api/users/leaderboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error("Failed to connect to the Academy ranking matrix.");
        }

        const data = await response.json();
        
        // Sort primarily by Level, using XP as a tiebreaker if trainers are the same level
        const sortedData = data.sort((a: LeaderboardUser, b: LeaderboardUser) => {
          if (b.level === a.level) {
            return b.current_xp - a.current_xp;
          }
          return b.level - a.level;
        });
        
        setLeaders(sortedData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600 uppercase tracking-widest flex items-center gap-3">
              <span className="text-4xl">🏆</span> Global Standings
            </h1>
            <p className="text-sm text-slate-400 mt-2 font-bold tracking-wide">
              ACADEMY RANKINGS DETERMINED BY TRAINER LEVEL
            </p>
          </div>
          <Link href="/quiz" className="bg-slate-800 hover:bg-slate-700 border border-slate-600 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors">
            ← Return to Hub
          </Link>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 text-sm text-center font-bold">
            {error}
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-700/50 bg-slate-900/50 text-xs font-black tracking-widest text-slate-400 uppercase">
            <div className="col-span-2 text-center">Rank</div>
            <div className="col-span-6">Trainer</div>
            <div className="col-span-4 text-right pr-4">Level / XP</div>
          </div>

          <div className="flex flex-col">
            {leaders.length === 0 ? (
              <div className="p-10 text-center text-slate-500 font-bold text-sm">
                No trainers found in the Academy database yet.
              </div>
            ) : (
              leaders.map((trainer, index) => {
                const isFirst = index === 0;
                const isSecond = index === 1;
                const isThird = index === 2;
                
                return (
                  <div 
                    key={trainer.id} 
                    className={`grid grid-cols-12 gap-4 p-5 items-center border-b border-slate-700/30 hover:bg-slate-800/60 transition-colors
                      ${isFirst ? 'bg-amber-500/5 border-amber-500/20' : ''}
                      ${isSecond ? 'bg-slate-300/5 border-slate-300/20' : ''}
                      ${isThird ? 'bg-orange-700/5 border-orange-700/20' : ''}
                    `}
                  >
                    <div className="col-span-2 flex justify-center">
                      {isFirst ? <span className="text-3xl drop-shadow-md">🥇</span> : 
                       isSecond ? <span className="text-3xl drop-shadow-md">🥈</span> : 
                       isThird ? <span className="text-3xl drop-shadow-md">🥉</span> : 
                       <span className="text-lg font-black text-slate-500">#{index + 1}</span>}
                    </div>
                    
                    <div className="col-span-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex justify-center items-center text-sm font-black border border-slate-600">
                          {trainer.username[0].toUpperCase()}
                        </div>
                        <div>
                          <div className={`font-black text-lg ${isFirst ? 'text-amber-400' : 'text-slate-200'}`}>
                            {trainer.username}
                          </div>
                          <div className="text-xs font-bold text-slate-400">
                            {trainer.title}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-4 text-right pr-4">
                      <div className="font-black text-xl text-blue-400 tracking-wider">
                        Level {trainer.level}
                      </div>
                      <div className="text-xs font-bold text-slate-500 mt-1">
                        {trainer.current_xp} XP
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}