"use client";

import { useEffect, useRef, useState } from 'react';
import { PLAYER_SPRITE_KEY, TrainerSprite } from './TrainerSprite';

// ============================================================
// GRASS FIELD
// ============================================================
// Replaces the press-a-button-repeatedly loop. The player walks
// continuously while Walk is toggled on: the field scrolls, the
// grass sways, the trainer bobs, and the walk stops by itself the
// moment something turns up.
//
// One step fires every STEP_MS while walking. The parent decides
// what a step produces; this component only reports that one
// happened and shows the result.
// ============================================================

export type FieldTerrain = 'grass' | 'cave' | 'water';

const STEP_MS = 850;

interface Props {
  terrain: FieldTerrain;
  /** Called once per step. Return true to stop walking (something happened). */
  onStep: () => boolean | Promise<boolean>;
  /** Walking is refused while this is true — e.g. the party is fainted. */
  disabled?: boolean;
  disabledReason?: string;
  stepsTaken: number;
  /** Shown in the banner under the field. */
  lastEvent?: string | null;
}

export default function GrassField({
  terrain, onStep, disabled, disabledReason, stepsTaken, lastEvent,
}: Props) {
  const [walking, setWalking] = useState(false);
  const [rustle, setRustle] = useState(false);
  const busy = useRef(false);

  // The walk loop. Cleared whenever walking stops, so a step can
  // never fire after the player has been pulled into a battle.
  useEffect(() => {
    if (!walking || disabled) return;
    let cancelled = false;

    const tick = async () => {
      if (cancelled || busy.current) return;
      busy.current = true;
      setRustle(true);
      setTimeout(() => setRustle(false), 260);
      try {
        const stop = await onStep();
        if (stop && !cancelled) setWalking(false);
      } finally {
        busy.current = false;
      }
    };

    const id = setInterval(tick, STEP_MS);
    // Take the first step immediately rather than waiting a beat.
    tick();
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walking, disabled]);

  // Walking stops as soon as the field is disabled mid-walk.
  useEffect(() => {
    if (disabled) setWalking(false);
  }, [disabled]);

  const palette = TERRAIN[terrain];

  return (
    <div className="gf-wrap">
      {/* The field */}
      <div className={`gf-field gf-${terrain} ${walking ? 'gf-moving' : ''}`}>
        {/* Parallax layers: far scenery, then the ground the player walks on */}
        <div className="gf-sky" style={{ background: palette.sky }} />
        <div className="gf-far">
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className="gf-far-item" style={{ left: `${i * 7.5}%` }}>
              {palette.far}
            </span>
          ))}
        </div>

        <div className="gf-ground" style={{ background: palette.ground }}>
          {/* Tufts scroll right to left while walking */}
          <div className="gf-tufts">
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className="gf-tuft"
                style={{
                  left: `${(i * 4.3) % 100}%`,
                  bottom: `${6 + ((i * 13) % 34)}px`,
                  animationDelay: `${(i % 7) * 140}ms`,
                  fontSize: `${12 + ((i * 5) % 8)}px`,
                  opacity: 0.55 + ((i % 4) * 0.15),
                }}
              >
                {palette.tuft}
              </span>
            ))}
          </div>

          {/* The trainer, always centred — the world moves, not them */}
          <div className={`gf-player ${walking ? 'gf-walk' : ''}`}>
            <TrainerSprite
              spriteKey={PLAYER_SPRITE_KEY}
              alt="You"
              className="gf-sprite"
            />
            <span className={`gf-rustle ${rustle ? 'gf-rustle-on' : ''}`}>{palette.tuft}</span>
          </div>
        </div>

        {/* Step counter sits on the field itself */}
        <div className="gf-hud">
          <span className="gf-steps">{stepsTaken} steps</span>
          {walking && <span className="gf-walking">walking…</span>}
        </div>
      </div>

      {/* Event banner */}
      <div className="gf-banner">
        <p className="gf-banner-text" key={lastEvent ?? 'idle'}>
          {disabled
            ? disabledReason ?? 'You cannot explore right now.'
            : lastEvent ?? (walking ? 'You push through the grass…' : 'Ready when you are.')}
        </p>
      </div>

      {/* The one control */}
      <button
        onClick={() => setWalking((w) => !w)}
        disabled={disabled}
        className={`gf-toggle ${walking ? 'gf-toggle-on' : ''}`}
      >
        {disabled ? (disabledReason ?? 'Can’t explore') : walking ? '■ Stop Walking' : '▸ Start Walking'}
      </button>

      <GrassStyles />
    </div>
  );
}

const TERRAIN: Record<FieldTerrain, { sky: string; ground: string; tuft: string; far: string }> = {
  grass: {
    sky: 'linear-gradient(180deg, #7dd3fc 0%, #bae6fd 100%)',
    ground: 'linear-gradient(180deg, #4ade80 0%, #16a34a 100%)',
    tuft: '❧',
    far: '🌲',
  },
  cave: {
    sky: 'linear-gradient(180deg, #1c1917 0%, #292524 100%)',
    ground: 'linear-gradient(180deg, #57534e 0%, #292524 100%)',
    tuft: '▲',
    far: '⛰️',
  },
  water: {
    sky: 'linear-gradient(180deg, #7dd3fc 0%, #e0f2fe 100%)',
    ground: 'linear-gradient(180deg, #38bdf8 0%, #0369a1 100%)',
    tuft: '≈',
    far: '🌊',
  },
};

function GrassStyles() {
  return (
    <style jsx global>{`
      :root {
        --ease: cubic-bezier(0.22, 0.61, 0.36, 1);
        --t-fast: 140ms;
        --t-base: 260ms;
      }

      .gf-wrap { display: flex; flex-direction: column; gap: 8px; }

      .gf-field {
        position: relative;
        height: 180px;
        border: 3px solid #1e293b;
        overflow: hidden;
      }
      @media (min-width: 768px) { .gf-field { height: 220px; } }

      .gf-sky { position: absolute; inset: 0 0 42% 0; }

      .gf-far {
        position: absolute;
        left: 0; right: 0; bottom: 40%;
        height: 34px;
        opacity: 0.5;
      }
      .gf-far-item {
        position: absolute;
        bottom: 0;
        font-size: 20px;
        filter: saturate(0.6) brightness(0.85);
      }
      /* Distant scenery drifts slower than the ground — parallax. */
      .gf-moving .gf-far { animation: gfScrollFar 9s linear infinite; }
      @keyframes gfScrollFar { from { transform: translateX(0); } to { transform: translateX(-7.5%); } }

      .gf-ground {
        position: absolute;
        left: 0; right: 0; bottom: 0;
        height: 58%;
        border-top: 3px solid rgba(0,0,0,0.25);
      }

      .gf-tufts { position: absolute; inset: 0; }
      .gf-tuft {
        position: absolute;
        color: rgba(20, 83, 45, 0.85);
        line-height: 1;
        transform-origin: bottom center;
        animation: gfSway 2.6s var(--ease) infinite;
      }
      @keyframes gfSway {
        0%, 100% { transform: rotate(-5deg); }
        50% { transform: rotate(5deg); }
      }
      .gf-moving .gf-tufts { animation: gfScroll 3.4s linear infinite; }
      @keyframes gfScroll { from { transform: translateX(0); } to { transform: translateX(-4.3%); } }

      .gf-player {
        position: absolute;
        left: 50%;
        bottom: 18%;
        transform: translateX(-50%);
      }
      .gf-sprite {
        width: 56px; height: 56px;
        object-fit: contain;
        image-rendering: pixelated;
        display: block;
        filter: drop-shadow(0 3px 0 rgba(0,0,0,0.3));
      }
      @media (min-width: 768px) { .gf-sprite { width: 68px; height: 68px; } }

      /* A two-frame bob reads as walking without needing real
         walk-cycle frames. */
      .gf-walk .gf-sprite { animation: gfStride 420ms steps(2) infinite; }
      @keyframes gfStride {
        0%   { transform: translateY(0) scaleY(1); }
        50%  { transform: translateY(-3px) scaleY(0.98); }
        100% { transform: translateY(0) scaleY(1); }
      }

      .gf-rustle {
        position: absolute;
        left: 50%; bottom: -6px;
        transform: translateX(-50%) scale(0.4);
        opacity: 0;
        font-size: 20px;
        color: #bbf7d0;
        pointer-events: none;
      }
      .gf-rustle-on { animation: gfRustle 300ms var(--ease) both; }
      @keyframes gfRustle {
        0%   { opacity: 0; transform: translateX(-50%) scale(0.4) rotate(-20deg); }
        45%  { opacity: 1; transform: translateX(-50%) scale(1.25) rotate(12deg); }
        100% { opacity: 0; transform: translateX(-50%) scale(1) rotate(-8deg); }
      }

      .gf-hud {
        position: absolute;
        top: 6px; right: 8px;
        display: flex; gap: 6px; align-items: center;
      }
      .gf-steps, .gf-walking {
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        padding: 3px 6px;
        background: rgba(2,6,23,0.65);
        color: #e2e8f0;
        border: 1px solid rgba(255,255,255,0.15);
      }
      .gf-walking { color: #4ade80; animation: gfBlink 1.2s steps(2) infinite; }
      @keyframes gfBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }

      .gf-banner {
        background: #020617;
        border: 2px solid #1e293b;
        padding: 10px 12px;
        min-height: 42px;
        display: flex;
        align-items: center;
      }
      .gf-banner-text {
        font-size: 10px;
        color: #cbd5e1;
        line-height: 1.5;
        animation: gfLine var(--t-base) var(--ease) both;
      }
      @keyframes gfLine { from { opacity: 0; transform: translateX(-5px); } to { opacity: 1; transform: none; } }

      .gf-toggle {
        padding: 14px;
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        background: #22c55e;
        color: #052e16;
        border-bottom: 5px solid #15803d;
        transition: filter var(--t-fast) var(--ease), transform var(--t-fast) var(--ease),
                    background var(--t-fast) var(--ease);
      }
      .gf-toggle:hover:not(:disabled) { filter: brightness(1.1); }
      .gf-toggle:active:not(:disabled) { transform: translateY(4px); border-bottom-width: 1px; }
      .gf-toggle-on { background: #ef4444; color: #fff; border-bottom-color: #991b1b; }
      .gf-toggle:disabled {
        background: #475569; color: #94a3b8;
        border-bottom-color: #1e293b; cursor: not-allowed;
      }

      @media (prefers-reduced-motion: reduce) {
        .gf-moving .gf-tufts, .gf-moving .gf-far, .gf-tuft,
        .gf-walk .gf-sprite, .gf-walking { animation: none !important; }
      }
    `}</style>
  );
}
