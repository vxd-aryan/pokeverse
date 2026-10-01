"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import { buildPokemon, frontSprite } from '../../lib/fetchMon';
import { getRegionState, setStarter, hasStarted } from '../../lib/journeyStorage';
import type { JourneyPokemon } from '../../data/kanto';

// ============================================================
// OAK'S LAB — STARTER CHOICE
// ============================================================
// Where a Kanto run begins. One of three, level 5, and the only
// Pokémon you're handed — everything else has to be caught.
// ============================================================

const STARTERS = [
  {
    id: 1,
    name: 'Bulbasaur',
    types: ['Grass', 'Poison'],
    blurb:
      'A steady start. Its Grass typing walks over the first two gyms — Brock\'s rocks and Misty\'s water — which makes the early game noticeably kinder.',
    oak: 'This one is quite docile. I rather like it.',
  },
  {
    id: 4,
    name: 'Charmander',
    types: ['Fire'],
    blurb:
      'The hard road. Weak to Brock and Misty both, but it grows into one of Kanto\'s strongest and tears through Erika, Koga and Sabrina later on.',
    oak: 'It has a fiery temperament. A challenge, but a rewarding one.',
  },
  {
    id: 7,
    name: 'Squirtle',
    types: ['Water'],
    blurb:
      'The dependable pick. Beats Brock, holds its own against Misty, and its defences make the whole first half forgiving.',
    oak: 'A tough little Pokémon with a sturdy shell. Hard to go wrong.',
  },
];

const START_LEVEL = 5;

export default function StarterPage() {
  const { user } = useUserStore() as any;
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [received, setReceived] = useState<JourneyPokemon | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!user) {
      setBlocked('no-user');
      return;
    }
    const region = getRegionState(user.username, 'kanto');
    if (hasStarted(region)) setBlocked('already-started');
  }, [user]);

  const handleConfirm = async () => {
    if (selected === null || confirming) return;
    setConfirming(true);
    setError(null);
    try {
      const mon = await buildPokemon(selected, START_LEVEL, { caughtAt: 'Pallet Town' });
      setStarter(user.username, 'kanto', mon);
      setReceived(mon);
    } catch (err: any) {
      console.error('[journey] starter setup failed:', err);
      setError(err?.message ? `Could not prepare your starter: ${err.message}` : 'Could not prepare your starter. Check your connection and try again.');
      setConfirming(false);
    }
  };

  if (!mounted) return <Status title="OAK'S LAB" body="Opening the door…" />;

  if (blocked === 'no-user') {
    return <Status title="NOT SIGNED IN" body="Sign in to begin your Journey." action={{ href: '/auth', label: 'Sign In' }} />;
  }
  if (blocked === 'already-started') {
    return (
      <Status
        title="ALREADY ON THE ROAD"
        body="Professor Oak has already given you a partner. Your Journey is underway."
        action={{ href: '/journey/kanto/map', label: 'Continue Journey' }}
      />
    );
  }

  // --- Handed over ---
  if (received) {
    return (
      <div className="st-root min-h-screen flex items-center justify-center p-4">
        <div className="st-panel max-w-md w-full p-6 md:p-8 text-center st-fade">
          <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500 mb-4">
            Professor Oak
          </p>
          <div className="st-got mx-auto mb-4">
            <img src={frontSprite(received.pokemonId)} alt={received.name} className="w-28 h-28 object-contain st-pixelated st-pop" />
          </div>
          <p className="st-pixel text-xs text-yellow-300 mb-3">
            {received.name.toUpperCase()} IS YOURS!
          </p>
          <p className="text-[11px] text-slate-300 italic mb-6 leading-relaxed">
            “Take good care of it. Your very own Pokémon legend is about to unfold.
            A world of dreams and adventures awaits — let's go!”
          </p>
          <div className="st-summary mb-6 px-4 py-3 text-left">
            <Row label="Level" value={`${received.level}`} />
            <Row label="Type" value={received.types.join(' / ')} />
            <Row label="HP" value={`${received.maxHp}`} />
            <Row label="Moves" value={received.moves.map((m) => m.name).join(', ')} />
          </div>
          <button onClick={() => router.push('/journey/kanto/map')} className="st-btn st-btn-yellow">
            Step Outside →
          </button>
        </div>
        <StarterStyles />
      </div>
    );
  }

  // --- Choosing ---
  const pick = STARTERS.find((s) => s.id === selected);

  return (
    <div className="st-root min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6 st-fade">
          <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500 mb-2">Pallet Town</p>
          <h1 className="st-pixel text-sm md:text-lg text-yellow-300 mb-3">PROFESSOR OAK'S LAB</h1>
          <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
            “There are three Pokémon here. You may have one. Choose carefully —
            this one stays with you, and the rest of your team you'll have to
            catch yourself out there.”
          </p>
        </div>

        {/* The three balls on the table */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {STARTERS.map((s, i) => {
            const isPicked = selected === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={`st-card p-4 flex flex-col items-center st-stagger ${isPicked ? 'st-picked' : ''}`}
                style={{ animationDelay: `${i * 110}ms` }}
              >
                <img
                  src={frontSprite(s.id)}
                  alt={s.name}
                  className="w-20 h-20 md:w-24 md:h-24 object-contain st-pixelated mb-2"
                />
                <span className="text-[11px] font-black uppercase tracking-wide">{s.name}</span>
                <div className="flex gap-1 mt-1">
                  {s.types.map((t) => (
                    <span key={t} className="st-type">{t}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* What Oak says about the one you're hovering */}
        <div className="st-detail px-4 py-3 mb-4 min-h-[6rem]">
          {pick ? (
            <div className="st-fade" key={pick.id}>
              <p className="st-pixel text-[9px] text-yellow-300 mb-2">{pick.name.toUpperCase()}</p>
              <p className="text-[11px] text-slate-300 italic mb-2">“{pick.oak}”</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">{pick.blurb}</p>
            </div>
          ) : (
            <p className="text-[10px] text-slate-500">
              Pick up a Poké Ball to hear what the Professor says about it.
            </p>
          )}
        </div>

        {error && <p className="text-[10px] text-red-400 mb-3 text-center">{error}</p>}

        <div className="text-center">
          <button
            onClick={handleConfirm}
            disabled={selected === null || confirming}
            className="st-btn st-btn-yellow"
          >
            {confirming ? 'Receiving…' : selected ? `Choose ${pick?.name}` : 'Choose a Pokémon'}
          </button>
          <p className="text-[9px] text-slate-600 mt-3">
            This choice is permanent for your Kanto run.
          </p>
        </div>
      </div>
      <StarterStyles />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-1 border-b border-slate-800 last:border-0">
      <span className="text-[9px] uppercase tracking-wider text-slate-500 shrink-0">{label}</span>
      <span className="text-[10px] text-slate-200 text-right">{value}</span>
    </div>
  );
}

function Status({
  title, body, action,
}: { title: string; body: string; action?: { href: string; label: string } }) {
  return (
    <div className="st-root min-h-screen flex items-center justify-center p-6">
      <div className="st-panel max-w-sm w-full p-6 text-center">
        <p className="st-pixel text-[11px] text-yellow-300 mb-3">{title}</p>
        <p className="text-[11px] text-slate-400 mb-5">{body}</p>
        <div className="flex gap-2 justify-center flex-wrap">
          {action && <Link href={action.href} className="st-btn st-btn-yellow">{action.label}</Link>}
          <Link href="/journey" className="st-btn st-btn-grey">All Regions</Link>
        </div>
      </div>
      <StarterStyles />
    </div>
  );
}

function StarterStyles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      :root {
        --ease: cubic-bezier(0.22, 0.61, 0.36, 1);
        --ease-pop: cubic-bezier(0.34, 1.4, 0.64, 1);
        --t-base: 260ms;
      }
      .st-pixel { font-family: 'Press Start 2P', monospace; line-height: 1.7; }
      .st-pixelated { image-rendering: pixelated; }

      .st-root {
        background:
          radial-gradient(circle at 50% 0%, rgba(250,204,21,0.07), transparent 55%),
          #0b1120;
        color: #e2e8f0;
        font-family: ui-monospace, monospace;
      }
      .st-panel {
        background: #0f172a;
        border: 3px solid #334155;
        box-shadow: inset -2px -2px 0 rgba(0,0,0,0.5), inset 2px 2px 0 rgba(255,255,255,0.05);
      }

      .st-card {
        background: #0f172a;
        border: 3px solid #334155;
        transition: transform var(--t-base) var(--ease), border-color var(--t-base) var(--ease),
                    background var(--t-base) var(--ease);
      }
      .st-card:hover { transform: translateY(-4px); border-color: #64748b; }
      .st-picked {
        border-color: #facc15;
        background: rgba(250,204,21,0.08);
        box-shadow: 0 0 20px -6px rgba(250,204,21,0.6);
      }

      .st-type {
        font-size: 7px; text-transform: uppercase; letter-spacing: 0.08em;
        padding: 1px 4px; border: 1px solid #334155; color: #94a3b8;
      }

      .st-detail, .st-summary { background: #020617; border: 2px solid #1e293b; }

      .st-got {
        display: inline-flex; padding: 10px;
        background: radial-gradient(circle at 50% 40%, rgba(250,204,21,0.22), transparent 70%), #020617;
        border: 3px solid #a16207;
      }

      .st-fade { animation: stFade var(--t-base) var(--ease) both; }
      @keyframes stFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      .st-stagger { animation: stFade var(--t-base) var(--ease) both; }
      .st-pop { animation: stPop 560ms var(--ease-pop) both; }
      @keyframes stPop { from { opacity: 0; transform: scale(0.3) rotate(-12deg); } to { opacity: 1; transform: none; } }

      .st-btn {
        display: inline-block; padding: 12px 26px;
        font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em;
        border-bottom-width: 4px; border-bottom-style: solid;
      }
      .st-btn:active { transform: translateY(3px); border-bottom-width: 1px; }
      .st-btn:disabled { background: #475569; color: #94a3b8; border-bottom-color: #1e293b; cursor: not-allowed; }
      .st-btn-yellow { background: #facc15; color: #1c1917; border-bottom-color: #a16207; }
      .st-btn-grey { background: #475569; color: #fff; border-bottom-color: #1e293b; }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
      }
    `}</style>
  );
}
