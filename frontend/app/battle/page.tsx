"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateBattlePage() {
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(false);

  const handleStartMatch = () => {
    setIsInitializing(true);
    
    // We route to the play screen. 
    // The play screen will handle the WebSocket connection and matchmaking queue!
    router.push(`/battle/play`);
  };

  return (
    <div className="arena-root min-h-screen relative overflow-hidden">
      {/* stadium lighting decoration */}
      <div className="spotlight spotlight-red" aria-hidden="true" />
      <div className="spotlight spotlight-blue" aria-hidden="true" />
      <div className="arena-floor" aria-hidden="true" />

      <div className="max-w-3xl mx-auto p-6 md:p-10 relative z-10">
        <div className="mb-8">
          <Link href="/battle" className="exit-link text-sm flex items-center gap-2 w-fit">
            <span>←</span> Exit Arena
          </Link>
        </div>

        <div className="arena-panel relative rounded-3xl p-8 shadow-2xl text-center overflow-hidden">
          <span className="vs-watermark" aria-hidden="true">VS</span>
          <span className="hud-corner hud-corner-tl" aria-hidden="true" />
          <span className="hud-corner hud-corner-tr" aria-hidden="true" />
          <span className="hud-corner hud-corner-bl" aria-hidden="true" />
          <span className="hud-corner hud-corner-br" aria-hidden="true" />

          <div className="relative z-10">
            <div className="power-orb mx-auto mb-6">
              <span className="text-5xl">⚡</span>
            </div>

            <h1 className="arena-title text-3xl text-white uppercase tracking-wide mb-4">
              Multiplayer Arena
            </h1>

            <p className="text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
              Connect to the WebSocket servers and face off against a live opponent.
            </p>

            <button
              onClick={handleStartMatch}
              disabled={isInitializing}
              className={`enter-btn w-full md:w-auto px-12 py-4 rounded-xl font-black text-lg uppercase tracking-widest transition-all ${
                isInitializing
                  ? "enter-btn--charging cursor-wait"
                  : "enter-btn--ready"
              }`}
            >
              {isInitializing ? "Warming Up System…" : "Enter Matchmaking"}
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Inter:wght@400;600;700&display=swap');

        .arena-root {
          font-family: 'Inter', ui-sans-serif, sans-serif;
          background:
            radial-gradient(ellipse 900px 500px at 50% -10%, rgba(255,255,255,0.05), transparent 60%),
            #090c12;
        }
        .arena-title {
          font-family: 'Rajdhani', ui-sans-serif, sans-serif;
          font-weight: 700;
          letter-spacing: 0.06em;
        }

        .spotlight {
          position: absolute;
          top: -120px;
          width: 420px;
          height: 620px;
          pointer-events: none;
          filter: blur(6px);
        }
        .spotlight-red {
          left: -60px;
          background: linear-gradient(200deg, rgba(232,41,31,0.16), transparent 65%);
        }
        .spotlight-blue {
          right: -60px;
          background: linear-gradient(-200deg, rgba(47,125,255,0.16), transparent 65%);
        }

        .arena-floor {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 260px;
          background: radial-gradient(ellipse 700px 200px at 50% 100%, rgba(255,255,255,0.04), transparent 70%);
          pointer-events: none;
        }

        .exit-link {
          color: #94a3b8;
          font-weight: 600;
          transition: color 0.15s ease;
        }
        .exit-link:hover { color: #ffb020; }

        .arena-panel {
          background: linear-gradient(155deg, #10141c 0%, #0d1017 100%);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 30px 70px -30px rgba(0,0,0,0.8);
        }

        .vs-watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-family: 'Rajdhani', ui-sans-serif, sans-serif;
          font-weight: 700;
          font-size: 220px;
          line-height: 1;
          color: rgba(255,255,255,0.02);
          pointer-events: none;
          user-select: none;
        }

        .hud-corner {
          position: absolute;
          width: 22px;
          height: 22px;
          border-color: rgba(255,255,255,0.18);
        }
        .hud-corner-tl { top: 14px; left: 14px; border-top: 2px solid; border-left: 2px solid; border-radius: 4px 0 0 0; }
        .hud-corner-tr { top: 14px; right: 14px; border-top: 2px solid; border-right: 2px solid; border-radius: 0 4px 0 0; }
        .hud-corner-bl { bottom: 14px; left: 14px; border-bottom: 2px solid; border-left: 2px solid; border-radius: 0 0 0 4px; }
        .hud-corner-br { bottom: 14px; right: 14px; border-bottom: 2px solid; border-right: 2px solid; border-radius: 0 0 4px 0; }

        .power-orb {
          width: 96px;
          height: 96px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at 35% 30%, #2a2f3d, #12151d 70%);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08), 0 0 0 8px rgba(255,176,32,0.06);
          position: relative;
        }
        .power-orb::before {
          content: '';
          position: absolute;
          inset: -10px;
          border-radius: 9999px;
          border: 1px solid rgba(255,176,32,0.25);
        }
        @media (prefers-reduced-motion: no-preference) {
          .power-orb::before { animation: pulse-ring 2.2s ease-out infinite; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 0.7; }
          100% { transform: scale(1.35); opacity: 0; }
        }

        .enter-btn {
          font-family: 'Rajdhani', ui-sans-serif, sans-serif;
          letter-spacing: 0.12em;
        }
        .enter-btn--ready {
          background: linear-gradient(180deg, #ff4b3e, #d81e14);
          color: #fff;
          box-shadow: 0 10px 30px -10px rgba(216,30,20,0.6);
        }
        .enter-btn--ready:hover {
          filter: brightness(1.08);
          box-shadow: 0 14px 36px -10px rgba(216,30,20,0.75);
        }
        .enter-btn--charging {
          background: repeating-linear-gradient(
            135deg,
            #1c212c 0px, #1c212c 10px,
            #171b24 10px, #171b24 20px
          );
          color: #64748b;
        }

        @media (prefers-reduced-motion: reduce) {
          .power-orb::before { animation: none; }
        }
      `}</style>
    </div>
  );
}