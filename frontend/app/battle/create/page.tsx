"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BattleCreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("practice");

  const startBattle = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token"); // Assuming JWT is stored here
      const res = await fetch("https://pokeverse-backend1.onrender.com/api/battle/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: mode,
          player_team_ids: [25], // Example: Pikachu ID. In a full version, fetch from user's Collection.
          opponent_team_ids: null // Null triggers AI team generation
        }),
      });

      if (!res.ok) throw new Error("Failed to initialize arena");
      const data = await res.json();
      
      // Redirect to the active match
      router.push(`/battle/play?id=${data.battle_id}`);
    } catch (error) {
      console.error(error);
      alert("Error starting battle. Ensure you are logged in.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 mt-10">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-3xl font-black text-white mb-6 uppercase tracking-wide border-b border-slate-800 pb-4">
          Configure Match
        </h1>

        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-400 uppercase mb-3">Select Mode</label>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setMode("practice")}
              className={`p-4 rounded-xl border-2 font-bold transition-all ${mode === "practice" ? "border-amber-500 bg-amber-500/10 text-amber-400" : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"}`}
            >
              Practice (vs AI)
            </button>
            <button 
              onClick={() => setMode("random")}
              className={`p-4 rounded-xl border-2 font-bold transition-all ${mode === "random" ? "border-amber-500 bg-amber-500/10 text-amber-400" : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"}`}
            >
              Randomized Teams
            </button>
          </div>
        </div>

        <button 
          onClick={startBattle}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-lg rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] disabled:opacity-50 flex justify-center items-center gap-3"
        >
          {loading ? (
            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : "ENTER ARENA"}
        </button>
      </div>
    </div>
  );
}