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
    <div className="gate-root min-h-screen text-white flex flex-col justify-center items-center p-4 relative overflow-hidden">

      {/* sky decoration */}
      <div className="sun-glow" aria-hidden="true" />
      <div className="cloud cloud-a" aria-hidden="true" />
      <div className="cloud cloud-b" aria-hidden="true" />
      <div className="hills" aria-hidden="true" />
      <div className="grass-row" aria-hidden="true" />

      <div className="w-full max-w-md gate-sign relative z-10 rounded-[26px] p-[3px]">
        <div className="gate-sign-inner rounded-[23px] p-8">

          <div className="text-center mb-6">
            <div className="emblem mx-auto mb-3" aria-hidden="true">
              <span className="emblem-dot" />
            </div>
            <h1 className="gate-title text-2xl text-[#4a3423]">Academy Gateway</h1>
            <p className="gate-label text-[10px] text-[#8a7355] mt-1 tracking-[0.2em]">YOUR JOURNEY BEGINS HERE</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`path-tab py-2 text-xs rounded-xl transition-all ${isLogin ? 'path-tab--sign-in-active' : ''}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`path-tab py-2 text-xs rounded-xl transition-all ${!isLogin ? 'path-tab--register-active' : ''}`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="error-scroll text-xs p-3 rounded-xl mb-4 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="gate-label block text-[10px] text-[#8a7355] mb-1 tracking-wider">TRAINER NAME</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="AshKetchum"
                  className="gate-input w-full rounded-xl px-4 py-3 text-sm transition-colors"
                />
              </div>
            )}

            <div>
              <label className="gate-label block text-[10px] text-[#8a7355] mb-1 tracking-wider">EMAIL ADDRESS</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trainer@academy.com"
                className="gate-input w-full rounded-xl px-4 py-3 text-sm transition-colors"
              />
            </div>

            <div>
              <label className="gate-label block text-[10px] text-[#8a7355] mb-1 tracking-wider">PASSWORD</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="gate-input w-full rounded-xl px-4 py-3 text-sm transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="set-off-btn w-full py-3 rounded-xl text-sm font-bold shadow-lg transition-all flex justify-center items-center disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="mini-pokeball" aria-hidden="true" />
              ) : isLogin ? (
                'Enter Academy'
              ) : (
                'Create Profile'
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <Link href="/" className="dirt-path-link text-xs transition-colors">
              ← Continue as Guest
            </Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800&display=swap');

        .gate-root {
          font-family: 'Nunito', ui-sans-serif, sans-serif;
          background: linear-gradient(180deg, #241247 0%, #5a2f66 28%, #b4552f 52%, #e79a52 68%, #f6d9a5 84%, #f6d9a5 100%);
        }
        .gate-title {
          font-family: 'Fredoka', ui-sans-serif, sans-serif;
          font-weight: 700;
        }
        .gate-label {
          font-family: 'Nunito', ui-sans-serif, sans-serif;
          font-weight: 800;
        }

        .sun-glow {
          position: absolute;
          top: 8%;
          left: 50%;
          width: 260px;
          height: 260px;
          transform: translateX(-50%);
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(255,220,168,0.9), rgba(255,220,168,0.15) 60%, transparent 70%);
          filter: blur(2px);
          pointer-events: none;
        }

        .cloud {
          position: absolute;
          border-radius: 9999px;
          background: rgba(255,255,255,0.12);
          filter: blur(1px);
          pointer-events: none;
        }
        .cloud-a { width: 160px; height: 36px; top: 16%; left: 8%; }
        .cloud-b { width: 120px; height: 28px; top: 24%; right: 10%; }
        @media (prefers-reduced-motion: no-preference) {
          .cloud-a { animation: drift 22s ease-in-out infinite; }
          .cloud-b { animation: drift 26s ease-in-out infinite reverse; }
        }
        @keyframes drift {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(24px); }
        }

        .hills {
          position: absolute;
          bottom: 90px;
          left: 0;
          right: 0;
          height: 140px;
          background: linear-gradient(180deg, #3f6b46 0%, #2f5638 100%);
          border-radius: 50% 50% 0 0 / 100% 100% 0 0;
          transform: scaleX(1.4);
          opacity: 0.9;
          pointer-events: none;
        }

        .grass-row {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 90px;
          background: #234d35;
          pointer-events: none;
        }
        .grass-row::before {
          content: '';
          position: absolute;
          top: -18px;
          left: 0;
          right: 0;
          height: 20px;
          background:
            repeating-linear-gradient(
              70deg,
              #234d35 0px, #234d35 8px,
              transparent 8px, transparent 16px
            );
          background-size: 24px 20px;
        }

        .gate-sign {
          background: linear-gradient(155deg, #a5713f 0%, #6b4226 45%, #8a5a34 60%, #52341f 100%);
          box-shadow: 0 30px 60px -20px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.3);
        }
        .gate-sign-inner {
          background: linear-gradient(180deg, #f9f1de 0%, #ece0c4 100%);
        }

        .emblem {
          width: 46px;
          height: 46px;
          border-radius: 9999px;
          background: linear-gradient(180deg, #c9432f 0%, #c9432f 46%, #3a2a1c 46%, #3a2a1c 54%, #f9f1de 54%, #f9f1de 100%);
          box-shadow: 0 0 0 3px #f9f1de, 0 0 0 5px #a5713f;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .emblem-dot {
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: #f9f1de;
          border: 2px solid #3a2a1c;
        }

        .path-tab {
          background: #ece0c4;
          color: #8a7355;
          border: 1px solid #d9c69f;
          font-weight: 700;
        }
        .path-tab--sign-in-active {
          background: linear-gradient(180deg, #4f8c5f, #2f6b45);
          color: #f9f1de;
          border-color: #2f6b45;
          box-shadow: 0 6px 14px -6px rgba(47,107,69,0.6);
        }
        .path-tab--register-active {
          background: linear-gradient(180deg, #e0a13f, #c9862f);
          color: #3a2a1c;
          border-color: #c9862f;
          box-shadow: 0 6px 14px -6px rgba(201,134,47,0.6);
        }

        .error-scroll {
          background: #f6e2d9;
          border: 1px solid #d98a6f;
          color: #a1402c;
          font-weight: 700;
        }

        .gate-input {
          background: #fbf6ea;
          border: 1px solid #d9c69f;
          color: #4a3423;
        }
        .gate-input::placeholder { color: #b5a37f; }
        .gate-input:focus {
          outline: none;
          border-color: #c9862f;
          box-shadow: 0 0 0 3px rgba(201,134,47,0.2);
        }

        .set-off-btn {
          background: linear-gradient(180deg, #e0a13f, #b9722c);
          color: #3a2a1c;
          border: 1px solid #9c5f26;
        }
        .set-off-btn:hover:not(:disabled) {
          filter: brightness(1.05);
        }

        .mini-pokeball {
          display: inline-block;
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: linear-gradient(180deg, #c9432f 0%, #c9432f 46%, #3a2a1c 46%, #3a2a1c 54%, #f9f1de 54%, #f9f1de 100%);
          box-shadow: 0 0 0 1px rgba(0,0,0,0.3);
          position: relative;
        }
        .mini-pokeball::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 5px;
          height: 5px;
          border-radius: 9999px;
          background: #f9f1de;
          border: 1px solid #3a2a1c;
          transform: translate(-50%, -50%);
        }
        @media (prefers-reduced-motion: no-preference) {
          .mini-pokeball { animation: spin 0.9s linear infinite; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .dirt-path-link {
          color: #8a7355;
          text-decoration: underline;
        }
        .dirt-path-link:hover {
          color: #4a3423;
        }

        @media (prefers-reduced-motion: reduce) {
          .mini-pokeball { animation: none; }
          .cloud-a, .cloud-b { animation: none; }
        }
      `}</style>
    </div>
  );
}
