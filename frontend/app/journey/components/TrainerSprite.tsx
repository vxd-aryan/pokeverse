"use client";

import { useEffect, useState } from 'react';

// ============================================================
// TRAINER SPRITE
// ============================================================
// Pokémon Showdown hosts per-generation trainer artwork. Kanto
// runs on FireRed/LeafGreen, which is Gen 3, so we ask for the
// `-gen3` file first and fall back to the generation-neutral one.
// If neither loads — offline, blocked, or a key with no artwork —
// we draw a silhouette instead of leaving a broken image, so the
// intro never looks half-finished.
// ============================================================

export const TRAINER_SPRITE_BASE = 'https://play.pokemonshowdown.com/sprites/trainers';

export const PLAYER_SPRITE_KEY = 'red';

function chainFor(spriteKey: string): string[] {
  return [
    `${TRAINER_SPRITE_BASE}/${spriteKey}-gen3.png`,
    `${TRAINER_SPRITE_BASE}/${spriteKey}.png`,
  ];
}

export function TrainerSprite({
  spriteKey,
  alt,
  className = '',
  flip = false,
}: {
  spriteKey: string;
  alt: string;
  className?: string;
  /** Mirror horizontally — used for the player, who faces right. */
  flip?: boolean;
}) {
  const chain = chainFor(spriteKey);
  const [step, setStep] = useState(0);

  // A new trainer means a fresh attempt at the preferred sprite.
  useEffect(() => setStep(0), [spriteKey]);

  if (step >= chain.length) {
    return <TrainerSilhouette alt={alt} className={className} flip={flip} />;
  }

  return (
    <img
      src={chain[step]}
      alt={alt}
      onError={() => setStep((s) => s + 1)}
      className={`trainer-sprite ${className}`}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    />
  );
}

/** Last-resort stand-in: a plain trainer shape, no broken-image icon. */
function TrainerSilhouette({
  alt, className, flip,
}: { alt: string; className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 40 60"
      role="img"
      aria-label={alt}
      className={`trainer-sprite ${className ?? ''}`}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      shapeRendering="crispEdges"
    >
      <rect x="14" y="6" width="12" height="11" fill="#475569" />
      <rect x="12" y="4" width="16" height="4" fill="#334155" />
      <rect x="12" y="17" width="16" height="20" fill="#475569" />
      <rect x="8" y="19" width="4" height="14" fill="#3f4c60" />
      <rect x="28" y="19" width="4" height="14" fill="#3f4c60" />
      <rect x="14" y="37" width="5" height="17" fill="#3f4c60" />
      <rect x="21" y="37" width="5" height="17" fill="#3f4c60" />
      <rect x="12" y="54" width="8" height="4" fill="#1e293b" />
      <rect x="20" y="54" width="8" height="4" fill="#1e293b" />
    </svg>
  );
}

// ============================================================
// SEND-OUT ANIMATION
// ============================================================
// The classic opening: both trainers stand on the field, then
// walk off as they throw their first Pokémon. Runs once, then
// hands control to the battle.

export function SendOutScene({
  opponentSpriteKey,
  opponentName,
  playerName,
  onDone,
  durationMs = 2200,
}: {
  opponentSpriteKey: string;
  opponentName: string;
  playerName: string;
  onDone: () => void;
  durationMs?: number;
}) {
  const [stage, setStage] = useState<'stand' | 'throw' | 'leave'>('stand');

  useEffect(() => {
    const a = setTimeout(() => setStage('throw'), durationMs * 0.3);
    const b = setTimeout(() => setStage('leave'), durationMs * 0.55);
    const c = setTimeout(onDone, durationMs);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
      clearTimeout(c);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMs]);

  return (
    <div className="battlefield relative h-56 md:h-64 overflow-hidden">
      {/* Opponent trainer, upper right */}
      <div className={`absolute top-4 right-6 sendout-op sendout-${stage}`}>
        <TrainerSprite
          spriteKey={opponentSpriteKey}
          alt={opponentName}
          className="w-24 h-24 md:w-28 md:h-28 object-contain"
        />
      </div>

      {/* Player trainer, lower left */}
      <div className={`absolute bottom-4 left-6 sendout-pl sendout-${stage}`}>
        <TrainerSprite
          spriteKey={PLAYER_SPRITE_KEY}
          alt={playerName}
          flip
          className="w-28 h-28 md:w-32 md:h-32 object-contain"
        />
      </div>

      {/* Thrown pokéballs */}
      {stage !== 'stand' && (
        <>
          <span className="pokeball-throw throw-op" />
          <span className="pokeball-throw throw-pl" />
        </>
      )}

      {/* Flash as each ball opens */}
      {stage === 'leave' && <span className="sendout-flash" />}

      <style jsx>{`
        .sendout-op,
        .sendout-pl {
          transition: transform 620ms cubic-bezier(0.22, 0.61, 0.36, 1),
                      opacity 620ms cubic-bezier(0.22, 0.61, 0.36, 1);
        }
        .sendout-op.sendout-stand { transform: translateX(0); opacity: 1; }
        .sendout-op.sendout-throw { transform: translateX(-6px); opacity: 1; }
        .sendout-op.sendout-leave { transform: translateX(150px); opacity: 0; }

        .sendout-pl.sendout-stand { transform: translateX(0); opacity: 1; }
        .sendout-pl.sendout-throw { transform: translateX(6px); opacity: 1; }
        .sendout-pl.sendout-leave { transform: translateX(-150px); opacity: 0; }

        .pokeball-throw {
          position: absolute;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: linear-gradient(#ef4444 0 49%, #f8fafc 51% 100%);
          border: 2px solid #1c1917;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
        }
        .throw-op {
          top: 36%;
          right: 22%;
          animation: arcOp 620ms cubic-bezier(0.3, 0, 0.5, 1) forwards;
        }
        .throw-pl {
          bottom: 34%;
          left: 24%;
          animation: arcPl 620ms cubic-bezier(0.3, 0, 0.5, 1) forwards;
        }
        @keyframes arcOp {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          60%  { transform: translate(-46px, -26px) rotate(320deg); opacity: 1; }
          100% { transform: translate(-80px, 6px) rotate(560deg); opacity: 0; }
        }
        @keyframes arcPl {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          60%  { transform: translate(44px, -30px) rotate(320deg); opacity: 1; }
          100% { transform: translate(78px, 4px) rotate(560deg); opacity: 0; }
        }

        .sendout-flash {
          position: absolute;
          inset: 0;
          background: #ffffff;
          animation: flashOut 420ms ease-out forwards;
          pointer-events: none;
        }
        @keyframes flashOut {
          from { opacity: 0.85; }
          to   { opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .sendout-op, .sendout-pl, .pokeball-throw, .sendout-flash {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}