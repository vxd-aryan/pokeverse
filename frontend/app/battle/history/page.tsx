"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/userStore";

// --- TypeScript Interfaces ---
interface MatchRecord {
  id: string | number;
  mode: string;
  status: 'active' | 'finished' | 'abandoned';
  turn_count: number;
  winner_id: string | number | null;
  created_at: string;
}

export default function BattleHistoryPage() {
  const [history, setHistory] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pull the active user from your global state
  // (Assuming user has an 'id' property)
  const { user } = useUserStore() as { user: { id: string | number } | null };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
       const res = await fetch("https://pokeverse-backend1.onrender.com/api/battle/history", {
          headers: { 
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        
        if (!res.ok) throw new Error("Failed to fetch history");
        
        const data: MatchRecord[] = await res.json();
        
        // Sort history so the newest matches appear at the top
        const sortedData = data.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        setHistory(sortedData);
      } catch (error) {
        console.error("Failed to load history", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 font-sans">
      
      <div className="mb-8 flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-black text-white uppercase tracking-widest flex items-center gap-3">
          <span className="text-4xl">📚</span> Battle Records
        </h1>
        <Link href="/battle" className="text-slate-400 hover:text-amber-400 transition-colors text-sm font-bold flex items-center gap-2 uppercase tracking-wide bg-slate-800/50 px-4 py-2 rounded-lg hover:bg-slate-800">
          <span>←</span> Back to Hub
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin"></div>
          <div className="text-slate-400 font-mono uppercase tracking-widest">Accessing Archives...</div>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-16 rounded-3xl text-center shadow-xl">
          <span className="text-5xl block mb-4">📜</span>
          <h2 className="text-2xl font-bold text-white mb-2">No Records Found</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Your battle history is empty. Step into the Arena to start logging your tactical encounters.
          </p>
          <Link href="/battle/create" className="inline-block mt-6 px-8 py-3 bg-[#00cc55] hover:bg-[#00e660] border-b-4 border-[#009940] hover:translate-y-[1px] active:translate-y-[4px] active:border-b-0 text-white font-black rounded-xl transition-all uppercase tracking-wide">
            Enter Matchmaking
          </Link>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-widest">
                  <th className="p-5 font-bold">Match ID</th>
                  <th className="p-5 font-bold">Mode</th>
                  <th className="p-5 font-bold">Status</th>
                  <th className="p-5 font-bold">Turns</th>
                  <th className="p-5 font-bold">Result</th>
                  <th className="p-5 font-bold text-right">Date</th>
                  <th className="p-5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {history.map((match) => {
                  
                  // Determine precise result and XP changes based on user ID
                  let resultElement = <span className="text-slate-500 font-bold uppercase tracking-wide">Unresolved</span>;
                  let xpBadge = null;

                  if (match.status === "finished" && match.winner_id !== null) {
                    if (user && match.winner_id === user.id) {
                      resultElement = <span className="text-[#00cc55] font-black uppercase tracking-widest drop-shadow-[0_0_5px_rgba(0,204,85,0.4)]">Victory</span>;
                      xpBadge = <span className="ml-2 bg-[#00cc55]/20 text-[#00cc55] px-2 py-0.5 rounded text-[10px] font-black">+50 XP</span>;
                    } else {
                      resultElement = <span className="text-[#ff3333] font-black uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,51,51,0.4)]">Defeat</span>;
                      xpBadge = <span className="ml-2 bg-[#ff3333]/20 text-[#ff3333] px-2 py-0.5 rounded text-[10px] font-black">-15 XP</span>;
                    }
                  } else if (match.status === "abandoned") {
                      resultElement = <span className="text-slate-500 font-bold uppercase tracking-wide">Fled</span>;
                  }

                  return (
                    <tr key={match.id} className="border-b border-slate-800/50 hover:bg-slate-800/80 transition-colors group">
                      <td className="p-5 font-mono text-slate-500 group-hover:text-amber-400 transition-colors">#{match.id}</td>
                      <td className="p-5 capitalize text-slate-300 font-bold tracking-wide">{match.mode}</td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                          match.status === 'active' ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse' : 
                          'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {match.status}
                        </span>
                      </td>
                      <td className="p-5 text-slate-300 font-mono font-bold">{match.turn_count}</td>
                      <td className="p-5 flex items-center mt-1">
                        {resultElement}
                        {xpBadge}
                      </td>
                      <td className="p-5 text-slate-500 text-sm font-mono text-right">
                        {new Date(match.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="p-5 text-right">
                        {match.status === "active" ? (
                          <Link href={`/battle/play?id=${match.id}`} className="inline-block text-black text-xs font-black uppercase tracking-widest px-4 py-2 bg-amber-400 border-b-2 border-amber-600 rounded hover:bg-amber-300 hover:translate-y-[1px] active:translate-y-[2px] active:border-b-0 transition-all shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                            Resume
                          </Link>
                        ) : (
                          <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-700 px-3 py-1 rounded bg-slate-800/50 cursor-not-allowed">Archived</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}