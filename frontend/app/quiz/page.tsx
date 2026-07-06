"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';

export default function QuizHub() {
  const { user, clearUser } = useUserStore() as any;
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth');
    }
  }, [user, router]);

  const handleLogout = () => {
    localStorage.removeItem('trainer_token');
    localStorage.removeItem('token');
    clearUser();
    router.push('/auth');
  };

  if (!user) return null;

  const xpProgress = user.current_xp % (user.level * 100);
  const xpRequired = user.level * 100;
  const progressPercent = Math.min((xpProgress / xpRequired) * 100, 100);

  const trainingModules = [
    {
      no: '001',
      href: '/quiz/whos-that-pokemon',
      icon: '🔍',
      title: "Who's That?",
      desc: 'Identify silhouettes and scrambled data.',
      color: '#F85888',
      glow: 'rgba(248,88,136,0.25)',
    },
    {
      no: '002',
      href: '/quiz/type-matchups',
      icon: '⚔️',
      title: 'Type Matchups',
      desc: 'Master weaknesses and resistances.',
      color: '#F0A030',
      glow: 'rgba(240,160,48,0.25)',
    },
    {
      no: '003',
      href: '/quiz/region',
      icon: '🗺️',
      title: 'Region Mastery',
      desc: 'Map species to their origin regions.',
      color: '#78C850',
      glow: 'rgba(120,200,80,0.25)',
    },
    {
      no: '004',
      href: '/quiz/evolution',
      icon: '🧬',
      title: 'Evolutions',
      desc: 'Chart genetic progression lines.',
      color: '#7038F8',
      glow: 'rgba(112,56,248,0.25)',
    },
  ];

  return (
    <div className="dex-root min-h-screen flex flex-col items-center p-4 md:p-10">
      <div className="max-w-5xl w-full">

        {/* --- DEX SHELL --- */}
        <div className="dex-shell relative rounded-[2rem] md:rounded-[2.5rem] p-3 md:p-5 mb-10 shadow-2xl">

          {/* lens cluster, top-left corner of the device */}
          <div className="flex items-center gap-2 px-3 pt-2 pb-3">
            <div className="lens-main" aria-hidden="true" />
            <div className="w-2 h-2 rounded-full bg-[#F85888] shadow-[0_0_6px_rgba(248,88,136,0.8)]" aria-hidden="true" />
            <div className="w-2 h-2 rounded-full bg-[#F8D030] shadow-[0_0_6px_rgba(248,208,48,0.8)]" aria-hidden="true" />
            <div className="w-2 h-2 rounded-full bg-[#78C850] shadow-[0_0_6px_rgba(120,200,80,0.8)]" aria-hidden="true" />
            <span className="dex-label ml-auto pr-2 text-[10px] md:text-xs tracking-[0.3em] text-white/70">
             
            </span>
          </div>

          {/* --- SCREEN --- */}
          <div className="dex-screen relative rounded-2xl md:rounded-3xl overflow-hidden px-5 py-6 md:px-8 md:py-8">
            <div className="scanline" aria-hidden="true" />

            {/* status row */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="live-dot" aria-hidden="true" />
                <span className="dex-label text-[10px] md:text-xs text-[#9BE564] tracking-[0.25em]">
                  LIVE LINK
                </span>
              </div>
              <div className="flex gap-1" aria-hidden="true">
                <span className="signal-bar h-2" />
                <span className="signal-bar h-3" />
                <span className="signal-bar h-4" />
                <span className="signal-bar h-5" />
              </div>
            </div>

            {/* trainer profile */}
            <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6">
              <div className="flex items-center gap-5 flex-1">
                <div className="avatar-frame flex items-center justify-center flex-shrink-0">
                  <span className="dex-display text-2xl md:text-3xl text-[#12161f]">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <h1 className="dex-display text-lg md:text-2xl text-[#F4EFD8] truncate">
                    {user.username}
                  </h1>
                  <p className="dex-label text-[10px] md:text-xs text-[#8fa0b8] tracking-[0.2em] mt-2">
                    {user.title} · LV. {user.level}
                  </p>
                </div>
              </div>

              <div className="w-full md:w-72 bg-[#0b0e15] p-4 rounded-xl border border-white/5">
                <div className="flex justify-between dex-label text-[9px] md:text-[10px] tracking-[0.2em] text-[#8fa0b8] mb-2">
                  <span>XP POOL</span>
                  <span>{xpProgress} / {xpRequired}</span>
                </div>
                <div className="h-3 w-full bg-[#1c2230] rounded-full overflow-hidden xp-track">
                  <div
                    className="h-full xp-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- TRAINING SIMULATOR --- */}
        <div className="flex items-center gap-3 mb-5 ml-1">
          <span className="dex-display text-[10px] text-[#8fa0b8]">§</span>
          <h2 className="dex-label text-xs md:text-sm text-[#c7d2e0] tracking-[0.3em]">
            Training Simulator
          </h2>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {trainingModules.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className="entry-card group relative flex flex-col p-5 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ ['--accent' as any]: mod.color, ['--glow' as any]: mod.glow }}
            >
              <span className="dex-label absolute top-4 right-4 text-[9px] tracking-widest text-white/25">
                No.{mod.no}
              </span>
              <div className="text-3xl mb-4 origin-left group-hover:scale-110 transition-transform">
                {mod.icon}
              </div>
              <h3 className="dex-display text-sm mb-2" style={{ color: mod.color }}>
                {mod.title}
              </h3>
              <p className="text-[#8fa0b8] text-xs font-medium leading-relaxed">
                {mod.desc}
              </p>
              <div className="entry-underline mt-4" />
            </Link>
          ))}
        </div>

        {/* --- OFFICIAL ASSESSMENTS --- */}
        <div className="flex items-center gap-3 mb-5 ml-1">
          <span className="dex-display text-[10px] text-[#8fa0b8]">§</span>
          <h2 className="dex-label text-xs md:text-sm text-[#c7d2e0] tracking-[0.3em]">
            Official Assessments
          </h2>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">

          <Link
            href="/quiz/daily"
            className="assessment-card group relative overflow-hidden p-8 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ ['--accent' as any]: '#F8D030', ['--glow' as any]: 'rgba(248,208,48,0.18)' }}
          >
            <div className="bolt-icon absolute -right-4 -top-4 text-8xl opacity-[0.07] group-hover:opacity-[0.14] transition-opacity rotate-12">
              ⚡
            </div>
            <span className="dex-label text-[9px] tracking-widest text-[#F8D030]/70 relative z-10">
              ELECTRIC TYPE · DAILY
            </span>
            <h3 className="dex-display text-lg md:text-xl text-[#F8D030] mt-3 mb-3 relative z-10">
              Daily Gauntlet
            </h3>
            <p className="text-[#8fa0b8] text-sm font-medium relative z-10 max-w-sm">
              Complete your official 10-question assessment. Earn XP, build your streak, and rank up.
            </p>
          </Link>

          <Link
            href="/quiz/leaderboard"
            className="assessment-card group relative overflow-hidden p-8 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ ['--accent' as any]: '#9B7EDE', ['--glow' as any]: 'rgba(155,126,222,0.18)' }}
          >
            <div className="bolt-icon absolute -right-4 -top-4 text-8xl opacity-[0.07] group-hover:opacity-[0.14] transition-opacity -rotate-12">
              👻
            </div>
            <span className="dex-label text-[9px] tracking-widest text-[#9B7EDE]/70 relative z-10">
              GHOST TYPE · RANKINGS
            </span>
            <h3 className="dex-display text-lg md:text-xl text-[#9B7EDE] mt-3 mb-3 relative z-10">
              Global Leaderboard
            </h3>
            <p className="text-[#8fa0b8] text-sm font-medium relative z-10 max-w-sm">
              View live server rankings. Compare your power rating, speed, and accuracy with other trainers.
            </p>
          </Link>

        </div>

        {/* --- LOGOUT --- */}
        <div className="flex justify-center pb-4">
          <button
            onClick={handleLogout}
            className="logout-btn group flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            <span className="pokeball" aria-hidden="true" />
            <span className="dex-label text-[10px] md:text-xs tracking-[0.3em] text-[#8fa0b8] group-hover:text-[#F85858] transition-colors">
              Release Trainer Session
            </span>
          </button>
        </div>

      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Space+Mono:wght@400;700&display=swap');

        .dex-root {
          background:
            radial-gradient(circle at 15% 10%, rgba(227,53,13,0.06), transparent 40%),
            radial-gradient(circle at 85% 90%, rgba(112,56,248,0.06), transparent 40%),
            #0a0c10;
          font-family: 'Space Mono', ui-monospace, monospace;
        }

        .dex-display {
          font-family: 'Press Start 2P', ui-monospace, monospace;
          line-height: 1.6;
        }

        .dex-label {
          font-family: 'Space Mono', ui-monospace, monospace;
          font-weight: 700;
        }

        .dex-shell {
          background: linear-gradient(180deg, #ea3d16 0%, #c72a09 100%);
          border: 1px solid rgba(0,0,0,0.35);
          box-shadow: 0 20px 50px -20px rgba(227,53,13,0.4), inset 0 1px 0 rgba(255,255,255,0.15);
        }

        .lens-main {
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: radial-gradient(circle at 35% 30%, #bfe9ff, #4a90d9 55%, #1c4e7a 100%);
          box-shadow: 0 0 10px rgba(74,144,217,0.7), inset 0 0 3px rgba(255,255,255,0.6);
        }

        .dex-screen {
          background: #12161f;
          border: 1px solid rgba(0,0,0,0.5);
          box-shadow: inset 0 2px 12px rgba(0,0,0,0.6);
        }

        .scanline {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: repeating-linear-gradient(
            180deg,
            rgba(255,255,255,0.02) 0px,
            rgba(255,255,255,0.02) 1px,
            transparent 1px,
            transparent 3px
          );
        }

        .live-dot {
          width: 7px;
          height: 7px;
          border-radius: 9999px;
          background: #9BE564;
          box-shadow: 0 0 6px rgba(155,229,100,0.9);
        }
        @media (prefers-reduced-motion: no-preference) {
          .live-dot { animation: pulse-dot 1.8s ease-in-out infinite; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }

        .signal-bar {
          width: 3px;
          background: #2c3648;
          border-radius: 1px;
          align-self: flex-end;
        }
        .signal-bar:nth-child(4) { background: #9BE564; }

        .avatar-frame {
          width: 64px;
          height: 64px;
          background: linear-gradient(160deg, #F4EFD8, #cfd8e8);
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          box-shadow: 0 0 0 3px #12161f, 0 0 0 4px rgba(244,239,216,0.25);
        }

        .xp-track {
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.4);
        }
        .xp-fill {
          background: linear-gradient(90deg, #F8D030, #E3350D);
          transition: width 0.5s ease-out;
        }

        .entry-card {
          background: #12161f;
          border: 1px solid rgba(255,255,255,0.06);
          transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
          outline-color: var(--accent);
        }
        .entry-card:hover {
          transform: translateY(-3px);
          border-color: var(--accent);
          box-shadow: 0 12px 30px -12px var(--glow);
        }
        .entry-underline {
          height: 2px;
          width: 24px;
          background: var(--accent);
          border-radius: 2px;
          transition: width 0.2s ease;
        }
        .entry-card:hover .entry-underline {
          width: 44px;
        }

        .assessment-card {
          background: #12161f;
          border: 1px solid rgba(255,255,255,0.06);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          outline-color: var(--accent);
        }
        .assessment-card:hover {
          border-color: var(--accent);
          box-shadow: 0 16px 40px -16px var(--glow);
        }

        .logout-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 8px 16px;
        }

        .pokeball {
          display: inline-block;
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          background: linear-gradient(180deg, #E3350D 0%, #E3350D 48%, #12161f 48%, #12161f 52%, #F4EFD8 52%, #F4EFD8 100%);
          box-shadow: 0 0 0 1px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(0,0,0,0.3);
          position: relative;
          transition: transform 0.2s ease;
        }
        .pokeball::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 5px;
          height: 5px;
          border-radius: 9999px;
          background: #12161f;
          border: 1px solid #F4EFD8;
          transform: translate(-50%, -50%);
        }
        .logout-btn:hover .pokeball {
          transform: rotate(180deg);
        }

        @media (prefers-reduced-motion: reduce) {
          .logout-btn:hover .pokeball { transform: none; }
          .entry-card:hover, .assessment-card:hover { transform: none; }
        }
      `}</style>
    </div>
  );
}