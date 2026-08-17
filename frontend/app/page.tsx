"use client";

import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const { user } = useUserStore() as any;
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // Optional: If you want to force logged-in users straight to the dashboard without seeing this page
    // if (user) { router.push('/dashboard'); }
  }, [user, router]);

  if (!mounted) return null;

  return (
    <div className="relative w-full min-h-[85vh] flex flex-col items-center justify-center overflow-hidden rounded-3xl mt-4 border border-slate-700/50 shadow-2xl bg-[#0b1120] py-12">
      
      {/* --- Background Decorative Elements --- */}
      {/* Glowing center orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Subtle Pokeball background silhouette */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.03] pointer-events-none border-[40px] border-white rounded-full flex flex-col justify-center items-center">
        <div className="w-full h-[40px] bg-white absolute" />
        <div className="w-[200px] h-[200px] bg-transparent border-[40px] border-white rounded-full absolute z-10 bg-[#0b1120]" />
      </div>

      {/* --- Main Content --- */}
      {/* Added pb-24 to ensure content never overlaps the absolute footer */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl pb-24 mt-8">
       
        {/* LOGO (Slightly resized and given more margin) */}
        <img
          src="/pokeverse-logo.png"
          alt="PokéVerse"
          className="w-full max-w-[280px] md:max-w-[400px] mb-8 drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]"
        />

        {/* TITLE */}
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-tight mb-6 drop-shadow-sm">
          Welcome to the Academy
        </h1>
        
        {/* DESCRIPTION */}
        <p className="text-base md:text-lg text-slate-400 mb-10 max-w-xl leading-relaxed">
          Test your knowledge, guess the Pokémon, and climb the ranks to become a Pokémon Master. Your journey begins right here.
        </p>

        {/* ACTION BUTTONS */}
        {user ? (
          <div className="flex flex-col items-center space-y-6 animate-fade-in-up w-full">
            <p className="text-slate-300 font-medium">
              Welcome back, <span className="font-bold text-white">{user.username}</span>!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <button className="w-full group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-lg uppercase tracking-widest rounded-2xl shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] transition-all hover:scale-105 active:scale-95 border border-blue-400/30">
                  Continue Journey ➔
                </button>
              </Link>
              
              <Link href="/battle" className="w-full sm:w-auto">
                <button className="w-full group relative px-8 py-4 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-lg uppercase tracking-widest rounded-2xl shadow-[0_0_40px_-10px_rgba(220,38,38,0.5)] transition-all hover:scale-105 active:scale-95 border border-red-400/30">
                  Enter Arena ⚔️
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href="/auth?mode=login" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm uppercase tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 border border-slate-600 shadow-lg">
                Sign In
              </button>
            </Link>
            
            <Link href="/auth?mode=register" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-[0_0_30px_-10px_rgba(239,68,68,0.6)] transition-all hover:scale-105 active:scale-95 border border-red-400/30">
                Create Account
              </button>
            </Link>
          </div>
        )}

      </div>

      {/* --- Footer Stats/Teaser --- */}
      <div className="absolute bottom-6 md:bottom-10 flex gap-6 md:gap-8 text-center divide-x divide-slate-700/50 opacity-60">
        <div className="px-4">
          <p className="text-xl md:text-2xl font-black text-slate-300">1000+</p>
          <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pokémon to Guess</p>
        </div>
        <div className="px-4">
          <p className="text-xl md:text-2xl font-black text-slate-300">9</p>
          <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Regions to Explore</p>
        </div>
        <div className="px-4 hidden md:block">
          <p className="text-xl md:text-2xl font-black text-slate-300">Infinite</p>
          <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Replayability</p>
        </div>
      </div>

    </div>
  );
}