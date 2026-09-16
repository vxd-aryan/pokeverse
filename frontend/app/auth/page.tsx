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
      if (typeof clearUser === 'function') {
        clearUser();
      }
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      localStorage.removeItem('trainer_token');

      const endpoint = isLogin
        ? 'https://pokeverse-backend1.onrender.com/api/auth/login'
        : 'https://pokeverse-backend1.onrender.com/api/auth/register';

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
        throw new Error(data.detail || data.message || "Authentication Failed. Check your credentials.");
      }

      // Extract token or fallback to email (backend session identifier)
      const authToken = 
        data.access_token || 
        data.token || 
        data.accessToken || 
        data.email;

      if (!authToken) {
        throw new Error("Unable to establish user session from backend response.");
      }

      // Store active session identifier
      localStorage.setItem('access_token', authToken);
      localStorage.setItem('token', authToken);
      localStorage.setItem('trainer_token', authToken);

      if (typeof setUser === 'function') {
        setUser({
          username: data.username || username || email.split('@')[0],
          email: data.email || email,
          level: data.level || 1,
          title: data.title || "Novice Trainer",
          current_xp: data.current_xp || 0,
          guessed_pokemon: data.guessed_pokemon || []
        });
      }

      router.refresh();
      router.push('/quiz');

    } catch (err: any) {
      console.error("Login Error Catch:", err);
      setError(err.message || "Failed to establish a terminal bridge with the Academy.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gate-root min-h-screen text-white flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      {/* Dynamic Sky & Scenery Decoration */}
      <div className="stars" aria-hidden="true" />
      <div className="sun-glow" aria-hidden="true" />
      <div className="cloud cloud-a" aria-hidden="true" />
      <div className="cloud cloud-b" aria-hidden="true" />
      <div className="hills" aria-hidden="true" />
      <div className="grass-row" aria-hidden="true" />

      <div className="w-full max-w-md gate-sign relative z-10 rounded-[28px] p-[2px] transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
        <div className="gate-sign-inner rounded-[26px] p-8 sm:p-10 backdrop-blur-xl">
          
          <div className="text-center mb-8">
            <div className="emblem mx-auto mb-4" aria-hidden="true">
              <span className="emblem-dot" />
            </div>
            <h1 className="gate-title text-3xl text-gray-800 tracking-tight">Academy Gateway</h1>
            <p className="gate-label text-[11px] font-semibold text-gray-500 mt-2 tracking-[0.25em] uppercase">Your Journey Begins Here</p>
          </div>

          <div className="relative flex p-1.5 bg-gray-100/50 rounded-2xl mb-8 backdrop-blur-sm border border-gray-200/50 shadow-inner">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 z-10 ${isLogin ? 'path-tab--active' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 z-10 ${!isLogin ? 'path-tab--active' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="error-scroll text-sm p-4 rounded-xl mb-6 flex items-start gap-3 animate-in fade-in zoom-in-95 duration-300 shadow-sm border-l-4">
              <span className="mt-0.5 text-lg">⚠️</span> 
              <p className="leading-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className={`transition-all duration-300 overflow-hidden ${!isLogin ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
              <label className="gate-label block text-xs font-bold text-gray-600 mb-1.5 tracking-wider">TRAINER NAME</label>
              <input
                type="text"
                required={!isLogin}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. AshKetchum"
                className="gate-input w-full rounded-xl px-4 py-3 text-sm transition-all duration-200"
              />
            </div>

            <div>
              <label className="gate-label block text-xs font-bold text-gray-600 mb-1.5 tracking-wider">EMAIL ADDRESS</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trainer@academy.com"
                className="gate-input w-full rounded-xl px-4 py-3 text-sm transition-all duration-200"
              />
            </div>

            <div>
              <label className="gate-label block text-xs font-bold text-gray-600 mb-1.5 tracking-wider">PASSWORD</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="gate-input w-full rounded-xl px-4 py-3 text-sm transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="set-off-btn w-full py-3.5 rounded-xl text-sm font-bold shadow-lg transition-all flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed mt-4 group overflow-hidden relative"
            >
              <span className="absolute inset-0 w-full h-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <span className="mini-pokeball" aria-hidden="true" />
                ) : isLogin ? (
                  'Enter Academy'
                ) : (
                  'Create Profile'
                )}
              </span>
            </button>
          </form>

          <div className="text-center mt-8">
            <Link href="/" className="dirt-path-link text-sm font-semibold transition-colors inline-flex items-center gap-1 group">
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Continue as Guest
            </Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

        .gate-root {
          font-family: 'Outfit', ui-sans-serif, system-ui, sans-serif;
          background: linear-gradient(180deg, #1a0b2e 0%, #3e1f47 30%, #8b3a20 60%, #c46d3b 80%, #e8bc82 100%);
        }

        .stars {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 50%;
          background-image: 
            radial-gradient(2px 2px at 20px 30px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 40px 70px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 50px 160px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 90px 40px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 130px 80px, #ffffff, rgba(0,0,0,0));
          background-repeat: repeat;
          background-size: 200px 200px;
          opacity: 0.3;
          pointer-events: none;
        }

        .gate-title {
          font-weight: 800;
          background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .gate-label {
          font-family: 'Outfit', ui-sans-serif, sans-serif;
        }

        .sun-glow {
          position: absolute;
          top: 15%;
          left: 50%;
          width: 320px;
          height: 320px;
          transform: translateX(-50%);
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(255,230,180,0.8), rgba(255,200,100,0.2) 50%, transparent 70%);
          filter: blur(8px);
          pointer-events: none;
          animation: pulse-glow 4s ease-in-out infinite alternate;
        }

        @keyframes pulse-glow {
          0% { transform: translateX(-50%) scale(1); opacity: 0.8; }
          100% { transform: translateX(-50%) scale(1.05); opacity: 1; }
        }

        .cloud {
          position: absolute;
          border-radius: 9999px;
          background: linear-gradient(180deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05));
          backdrop-filter: blur(2px);
          pointer-events: none;
        }
        .cloud-a { width: 180px; height: 42px; top: 18%; left: 5%; }
        .cloud-b { width: 140px; height: 32px; top: 28%; right: 5%; }
        
        @media (prefers-reduced-motion: no-preference) {
          .cloud-a { animation: drift 25s ease-in-out infinite; }
          .cloud-b { animation: drift 30s ease-in-out infinite reverse; }
        }
        @keyframes drift {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(30px); }
        }

        .hills {
          position: absolute;
          bottom: 70px;
          left: -10%;
          right: -10%;
          height: 160px;
          background: linear-gradient(180deg, #2d5a35 0%, #1a3821 100%);
          border-radius: 50% 50% 0 0 / 100% 100% 0 0;
          opacity: 0.95;
          pointer-events: none;
          box-shadow: inset 0 10px 30px rgba(0,0,0,0.2);
        }

        .grass-row {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 70px;
          background: #1e4229;
          pointer-events: none;
        }
        .grass-row::before {
          content: '';
          position: absolute;
          top: -15px;
          left: 0;
          right: 0;
          height: 15px;
          background: repeating-linear-gradient(
            60deg,
            #1e4229 0px, #1e4229 10px,
            transparent 10px, transparent 20px
          );
          background-size: 30px 15px;
        }

        .gate-sign {
          background: linear-gradient(145deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1));
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.2) inset;
        }
        
        .gate-sign-inner {
          background: linear-gradient(135deg, rgba(253,24bf,235,0.95) 0%, rgba(245,235,215,0.98) 100%);
          box-shadow: inset 0 2px 20px rgba(255,255,255,0.5);
        }

        .emblem {
          width: 54px;
          height: 54px;
          border-radius: 9999px;
          background: linear-gradient(180deg, #e53e3e 0%, #e53e3e 47%, #1a202c 47%, #1a202c 53%, #ffffff 53%, #ffffff 100%);
          box-shadow: 0 0 0 3px #ffffff, 0 0 0 6px #cbd5e0, 0 8px 16px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
        }
        .gate-sign:hover .emblem {
          transform: rotate(180deg);
        }

        .emblem-dot {
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          background: #ffffff;
          border: 3px solid #1a202c;
          box-shadow: inset 0 0 2px rgba(0,0,0,0.2);
        }

        .path-tab--active {
          background: #ffffff;
          color: #2d3748;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05);
        }

        .error-scroll {
          background: #fff5f5;
          border-color: #feb2b2;
          color: #c53030;
        }

        .gate-input {
          background: rgba(255,255,255,0.7);
          border: 2px solid transparent;
          color: #2d3748;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);
        }
        .gate-input::placeholder { color: #a0aec0; font-weight: 500; }
        .gate-input:focus {
          outline: none;
          background: #ffffff;
          border-color: #4299e1;
          box-shadow: 0 0 0 4px rgba(66,153,225,0.15), inset 0 2px 4px rgba(0,0,0,0.02);
        }

        .set-off-btn {
          background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
          color: #ffffff;
          border: none;
          box-shadow: 0 4px 14px rgba(49, 130, 206, 0.4);
        }
        .set-off-btn:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(49, 130, 206, 0.5);
        }

        .mini-pokeball {
          display: inline-block;
          width: 20px;
          height: 20px;
          border-radius: 9999px;
          background: linear-gradient(180deg, #fc8181 0%, #e53e3e 46%, #2d3748 46%, #2d3748 54%, #ffffff 54%, #edf2f7 100%);
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          position: relative;
        }
        .mini-pokeball::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: #ffffff;
          border: 1.5px solid #2d3748;
          transform: translate(-50%, -50%);
        }
        
        @media (prefers-reduced-motion: no-preference) {
          .mini-pokeball { animation: spin-bounce 1s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        }
        @keyframes spin-bounce {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }

        .dirt-path-link {
          color: #718096;
        }
        .dirt-path-link:hover {
          color: #2d3748;
        }

        @media (prefers-reduced-motion: reduce) {
          .mini-pokeball { animation: none; }
          .cloud-a, .cloud-b, .sun-glow { animation: none; }
          .gate-sign:hover .emblem { transform: none; }
        }
      `}</style>
    </div>
  );
}