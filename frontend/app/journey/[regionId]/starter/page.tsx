"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import { getRegion, previousRegionId } from '../../data/regions';
import type { JourneyPokemon } from '../../data/types';
import { buildPokemon, frontSprite } from '../../lib/fetchMon';
import {
  getRegionState, setStarter, hasStarted, isRegionUnlocked,
} from '../../lib/journeyStorage';
import { JourneyShell, StatusCard, journeyStyles, GlobalStyle } from '../../components/JourneyShell';

// ============================================================
// THE LAB — STARTER CHOICE
// ============================================================
// Region-agnostic: the professor, the town and the three Pokémon
// all come from the region's data. Kanto's Oak and Johto's Elm
// run through exactly the same page.
// ============================================================

export default function StarterPage() {
  const { regionId } = useParams();
  const router = useRouter();
  const { user } = useUserStore() as any;
  const rid = String(regionId);
  const region = getRegion(rid);

  const [mounted, setMounted] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [received, setReceived] = useState<JourneyPokemon | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!user) { setBlocked('no-user'); return; }
    if (!region) { setBlocked('no-region'); return; }
    if (!isRegionUnlocked(user.username, previousRegionId(rid))) {
      setBlocked('locked');
      return;
    }
    const state = getRegionState(user.username, rid, region.map.nodes[0]?.id);
    if (hasStarted(state)) setBlocked('already-started');
  }, [user, rid, region]);

  const handleConfirm = async () => {
    if (selected === null || confirming || !region) return;
    setConfirming(true);
    setError(null);
    try {
      const mon = await buildPokemon(selected, region.starterLevel, {
        caughtAt: region.labLocation,
      });
      setStarter(user.username, rid, mon);
      setReceived(mon);
    } catch (err: any) {
      console.error('[journey] starter setup failed:', err);
      setError(
        err?.message
          ? `Could not prepare your starter: ${err.message}`
          : 'Could not prepare your starter. Check your connection and try again.'
      );
      setConfirming(false);
    }
  };

  if (!mounted) return <JourneyShell><StatusCard title="THE LAB" body="Opening the door…" /></JourneyShell>;

  if (blocked) {
    const copy: Record<string, { title: string; body: string; href: string; label: string }> = {
      'no-user': { title: 'NOT SIGNED IN', body: 'Sign in to begin your Journey.', href: '/auth', label: 'Sign In' },
      'no-region': { title: 'UNKNOWN REGION', body: 'There is no region by that name.', href: '/journey', label: 'All Regions' },
      locked: {
        title: 'REGION LOCKED',
        body: 'Complete the previous region before setting out here.',
        href: '/journey', label: 'All Regions',
      },
      'already-started': {
        title: 'ALREADY ON THE ROAD',
        body: `${region?.professor ?? 'The professor'} has already given you a partner. Your Journey is underway.`,
        href: `/journey/${rid}/map`, label: 'Continue Journey',
      },
    };
    const c = copy[blocked] ?? copy['no-region'];
    return <JourneyShell><StatusCard title={c.title} body={c.body} action={{ href: c.href, label: c.label }} /></JourneyShell>;
  }

  if (!region) return null;

  // --- Handed over ---
  if (received) {
    return (
      <div className="jr-root min-h-screen flex items-center justify-center p-4">
        <div className="jr-panel max-w-md w-full p-6 md:p-8 text-center jr-fade">
          <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500 mb-4">
            {region.professor}
          </p>
          <div className="st-got mx-auto mb-4">
            <img
              src={frontSprite(received.pokemonId)}
              alt={received.name}
              className="w-28 h-28 object-contain jr-pixelated st-pop"
            />
          </div>
          <p className="jr-pixel text-xs text-yellow-300 mb-3">
            {received.name.toUpperCase()} IS YOURS!
          </p>
          <p className="text-[11px] text-slate-300 italic mb-6 leading-relaxed">
            “Take good care of it. Your very own Pokémon legend is about to unfold.
            A world of dreams and adventures awaits — let’s go!”
          </p>
          <div className="jr-inset mb-6 px-4 py-3 text-left">
            <Row label="Level" value={`${received.level}`} />
            <Row label="Type" value={received.types.join(' / ')} />
            <Row label="HP" value={`${received.maxHp}`} />
            <Row label="Moves" value={received.moves.map((m) => m.name).join(', ')} />
          </div>
          <button onClick={() => router.push(`/journey/${rid}/map`)} className="jr-btn jr-btn-yellow">
            Step Outside →
          </button>
        </div>
        <GlobalStyle css={journeyStyles} />
        <GlobalStyle css={`
          .st-got {
            display: inline-flex; padding: 10px;
            background: radial-gradient(circle at 50% 40%, rgba(250,204,21,0.22), transparent 70%), #020617;
            border: 3px solid #a16207;
          }
          .st-pop { animation: stPop 560ms var(--ease-pop) both; }
          @keyframes stPop { from { opacity: 0; transform: scale(0.3) rotate(-12deg); } to { opacity: 1; transform: none; } }
        `} />
      </div>
    );
  }

  // --- Choosing ---
  const pick = region.starters.find((s) => s.id === selected);

  return (
    <div className="jr-root min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6 jr-fade">
          <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500 mb-2">
            {region.labLocation}
          </p>
          <h1 className="jr-pixel text-sm md:text-lg text-yellow-300 mb-3">
            {region.professor.toUpperCase()}’S LAB
          </h1>
          <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
            “There are three Pokémon here. You may have one. Choose carefully —
            this one stays with you, and the rest of your team you’ll have to
            catch yourself out there.”
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {region.starters.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setSelected(s.id)}
              className={`st-card p-4 flex flex-col items-center jr-stagger ${selected === s.id ? 'st-picked' : ''}`}
              style={{ animationDelay: `${i * 110}ms` }}
            >
              <img
                src={frontSprite(s.id)}
                alt={s.name}
                className="w-20 h-20 md:w-24 md:h-24 object-contain jr-pixelated mb-2"
              />
              <span className="text-[11px] font-black uppercase tracking-wide">{s.name}</span>
              <div className="flex gap-1 mt-1">
                {s.types.map((t) => <span key={t} className="jr-type">{t}</span>)}
              </div>
            </button>
          ))}
        </div>

        <div className="jr-inset px-4 py-3 mb-4 min-h-[6rem]">
          {pick ? (
            <div className="jr-fade" key={pick.id}>
              <p className="jr-pixel text-[9px] text-yellow-300 mb-2">{pick.name.toUpperCase()}</p>
              <p className="text-[11px] text-slate-300 italic mb-2">“{pick.professorQuote}”</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">{pick.blurb}</p>
            </div>
          ) : (
            <p className="text-[10px] text-slate-500">
              Pick up a Poké Ball to hear what {region.professor} says about it.
            </p>
          )}
        </div>

        {error && <p className="text-[10px] text-red-400 mb-3 text-center">{error}</p>}

        <div className="text-center">
          <button
            onClick={handleConfirm}
            disabled={selected === null || confirming}
            className="jr-btn jr-btn-yellow"
          >
            {confirming ? 'Receiving…' : pick ? `Choose ${pick.name}` : 'Choose a Pokémon'}
          </button>
          <p className="text-[9px] text-slate-600 mt-3">
            This choice is permanent for your {region.name} run.
          </p>
        </div>
      </div>

      <GlobalStyle css={journeyStyles} />
      <GlobalStyle css={`
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
      `} />
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
