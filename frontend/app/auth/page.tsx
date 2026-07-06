"use client";

import { useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthPage() {
  const { setUser, clearUser } = useUserStore() as any; 
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 🛡️ Safe Execution: Only call clearUser if it is properly configured in your store
      if (typeof clearUser === 'function') {
        clearUser();
      }
      localStorage.removeItem('trainer_token');

      const endpoint = isLogin 
        ? 'https://pokeverse-backend-0o6t.onrender.com/api/auth/login' 
        : 'https://pokeverse-backend-0o6t.onrender.com/api/auth/register';
        
      const payload = isLogin 
        ? { email, password } 
        : { username, email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Authentication Failed. Check your credentials.");
      }

      // Save token to local storage (Backend uses email as the bearer verification)
      localStorage.setItem('trainer_token', data.email);

      // Set user in global state with reliable fallback metrics
      if (typeof setUser === 'function') {
        setUser({
          username: data.username,
          email: data.email,
          level: data.level || 1,
          title: data.title || "Novice Trainer",
          current_xp: data.current_xp || 0,
          guessed_pokemon: data.guessed_pokemon || []
        });
      }

      // Sync state across routing components and cross into the main hub
      router.refresh();
      router.push('/quiz'); 
      
    } catch (err: any) {
      console.error("Login Error Catch:", err);
      setError(err.message || "Failed to establish a terminal bridge with the Academy.");
    } finally {
      // 🚨 CRITICAL: Always release the loading latch, even on failure states
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-800/60 backdrop-blur-md rounded-3xl border border-slate-700/80 p-8 shadow-2xl">
        <div className="text-center mb-6">
          <span className="text-4xl block mb-2">🎓</span>
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Academy Gateway</h1>
        </div>

        <div className="grid grid-cols-2 bg-slate-900 p-1 rounded-xl mb-6 border border-slate-700/50">
          <button 
            type="button" 
            onClick={() => { setIsLogin(true); setError(null); }} 
            className={`py-2 text-xs font-bold rounded-lg transition-all ${isLogin ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Sign In
          </button>
          <button 
            type="button" 
            onClick={() => { setIsLogin(false); setError(null); }} 
            className={`py-2 text-xs font-bold rounded-lg transition-all ${!isLogin ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl mb-4 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 tracking-wider">TRAINER NAME</label>
              <input 
                type="text" 
                required 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="AshKetchum" 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-slate-200 placeholder-slate-600 transition-colors" 
              />
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 tracking-wider">EMAIL ADDRESS</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="trainer@academy.com" 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-slate-200 placeholder-slate-600 transition-colors" 
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 tracking-wider">PASSWORD</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-slate-200 placeholder-slate-600 transition-colors" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 py-3 rounded-xl text-sm font-bold shadow-lg hover:opacity-95 transition-all flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-b-white rounded-full animate-spin" />
            ) : isLogin ? (
              'Enter Academy'
            ) : (
              'Create Profile'
            )}
          </button>
        </form>
        
        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-400 underline transition-colors">
            ← Continue as Guest
          </Link>
        </div>
      </div>
    </div>
  );
}