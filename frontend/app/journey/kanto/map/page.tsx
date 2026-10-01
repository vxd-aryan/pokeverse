"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import { KANTO_GYMS, KANTO_BADGES } from '../../data/kanto';
import {
  KANTO_MAP_NODES, KANTO_MAP_EDGES, KANTO_NODE_BY_ID, KANTO_LANDMARKS,
  NODE_STYLE, isNodeReachable, type MapNode,
} from '../../data/kanto-map';
import { trainersAt, KANTO_TRAINERS } from '../../data/kanto-trainers';
import { isTown, encountersFor } from '../../data/kanto-encounters';
import { frontSprite } from '../../lib/fetchMon';
import {
  getRegionState, hasStarted, getNextObjective, getGymUiState,
  isTrainerDefeated, type JourneyRegionState, type GymUiState,
} from '../../lib/journeyStorage';

// ============================================================
// KANTO MAP — THE TRAVEL LAYER
// ============================================================
// The map no longer holds the game; it decides where you go.
// Tapping an area opens it, and the area itself is where you
// explore, catch, battle and shop.
// ============================================================

const GYM_STATE_STYLE: Record<GymUiState, { ring: string; chip: string; label: string }> = {
  locked:        { ring: '#475569', chip: 'text-slate-500 border-slate-700 bg-slate-900', label: 'Locked' },
  available:     { ring: '#facc15', chip: 'text-yellow-300 border-yellow-500 bg-yellow-500/10', label: 'Open' },
  'in-progress': { ring: '#fb923c', chip: 'text-orange-300 border-orange-500 bg-orange-500/10', label: 'Ready' },
  completed:     { ring: '#22c55e', chip: 'text-green-300 border-green-500 bg-green-500/10', label: 'Cleared' },
};

export default function KantoMapPage() {
  const { user } = useUserStore() as any;
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [region, setRegion] = useState<JourneyRegionState | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!user) { setBlocked('no-user'); return; }
    try {
      const r = getRegionState(user.username, 'kanto');
      if (!hasStarted(r)) { setBlocked('no-starter'); return; }
      setRegion(r);
      setFocusedId(r.currentNode);
    } catch (err) {
      console.error('[journey] could not read save:', err);
      setBlocked('storage');
    }
  }, [user]);

  const completed = region?.completedGyms.length ?? 0;
  const objective = useMemo(
    () => (region ? getNextObjective(region, KANTO_GYMS) : null),
    [region]
  );

  if (!mounted) return <Status title="LOADING KANTO" body="Unfolding the map…" />;
  if (blocked === 'no-user') return <Status title="NOT SIGNED IN" body="Sign in to continue your Journey." action={{ href: '/auth', label: 'Sign In' }} />;
  if (blocked === 'no-starter') return <Status title="YOUR JOURNEY HASN'T STARTED" body="Professor Oak is waiting for you in Pallet Town with three Poké Balls." action={{ href: '/journey/kanto/starter', label: "Go to Oak's Lab" }} />;
  if (blocked === 'storage') return <Status title="SAVE UNREADABLE" body="Your save could not be read." action={{ href: '/journey/kanto/starter', label: 'Start Fresh' }} />;
  if (!region || !objective) return <Status title="LOADING KANTO" body="Unfolding the map…" />;

  const here = region.currentNode;
  const focused = focusedId ? KANTO_NODE_BY_ID[focusedId] : null;
  const nextGym = KANTO_GYMS.find((g) => g.id === objective.gymId);
  const partyAlive = region.party.some((p) => p.currentHp > 0);

  const go = (node: MapNode) => {
    if (!isNodeReachable(node, completed)) return;
    router.push(`/journey/kanto/area/${node.id}`);
  };

  return (
    <div className="mp-root min-h-screen p-3 md:p-6">
      <div className="max-w-6xl mx-auto">

        {/* Top bar */}
        <div className="mp-panel flex items-center justify-between px-3 py-2 mb-3">
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="mp-pixel text-[10px] text-yellow-300 whitespace-nowrap">KANTO</span>
            <span className="text-[10px] text-slate-500 truncate hidden sm:inline">
              {KANTO_NODE_BY_ID[here]?.label ?? 'Travelling'}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[10px] text-yellow-300 font-bold">₽{region.money}</span>
            <Link href="/journey" className="text-[10px] text-slate-400 hover:text-white underline">← Regions</Link>
          </div>
        </div>

        {/* Objective */}
        <div className="mp-objective px-3 py-2 mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="mp-arrow">▶</span>
            <div className="min-w-0">
              <p className="text-[8px] uppercase tracking-[0.2em] text-yellow-600">Next Objective</p>
              <p className="mp-pixel text-[10px] text-yellow-200 truncate">{objective.text}</p>
            </div>
          </div>
          {objective.kind === 'defeat-gym' && nextGym && (
            <Link href={`/journey/kanto/area/${nextGym.locationId}`} className="mp-cta shrink-0">
              Go to {KANTO_NODE_BY_ID[nextGym.locationId]?.label ?? nextGym.gymName}
            </Link>
          )}
          {objective.kind === 'region-complete' && (
            <Link href="/journey/kanto/complete" className="mp-cta mp-cta-green shrink-0">Hall of Fame</Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">

          {/* Map */}
          <div className="mp-panel p-2 md:p-3 overflow-hidden">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="mp-pixel text-[9px] text-slate-400">OVERWORLD</span>
              <span className="text-[9px] text-slate-500">
                {KANTO_MAP_NODES.filter((n) => isNodeReachable(n, completed)).length}/{KANTO_MAP_NODES.length} open
              </span>
            </div>

            <div className="mp-viewport">
              <svg viewBox="0 0 900 780" className="w-full h-auto block" shapeRendering="crispEdges">
                <rect x="0" y="0" width="900" height="780" fill="#0c4a6e" />
                <path
                  d="M 60 30 L 620 30 L 700 60 L 840 130 L 860 330 L 830 520 L 700 600 L 520 640 L 400 660 L 300 640 L 230 560 L 210 430 L 190 300 L 120 240 L 70 140 Z"
                  fill="#15803d" stroke="#14532d" strokeWidth="3"
                />
                <ellipse cx="185" cy="700" rx="46" ry="30" fill="#15803d" stroke="#14532d" strokeWidth="3" />
                <ellipse cx="90" cy="700" rx="48" ry="32" fill="#7f1d1d" stroke="#450a0a" strokeWidth="3" />

                <g opacity="0.55">
                  <text x="845" y="705" fill="#e2e8f0" fontSize="16" fontWeight="bold" textAnchor="middle">N</text>
                  <path d="M 845 712 L 839 736 L 845 730 L 851 736 Z" fill="#e2e8f0" />
                  <text x="845" y="756" fill="#94a3b8" fontSize="11" textAnchor="middle">S</text>
                </g>

                {/* Paths */}
                {KANTO_MAP_EDGES.map((edge, i) => {
                  const a = KANTO_NODE_BY_ID[edge.from];
                  const b = KANTO_NODE_BY_ID[edge.to];
                  if (!a || !b) return null;
                  const open = isNodeReachable(a, completed) && isNodeReachable(b, completed);
                  return (
                    <line
                      key={i}
                      x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                      stroke={open ? (edge.water ? '#7dd3fc' : '#fde68a') : '#334155'}
                      strokeWidth={open ? 6 : 4}
                      strokeDasharray={edge.water ? '10 8' : undefined}
                      strokeLinecap="square"
                      opacity={open ? 0.95 : 0.4}
                    />
                  );
                })}

                {/* Nodes */}
                {KANTO_MAP_NODES.map((node, idx) => {
                  const open = isNodeReachable(node, completed);
                  const style = NODE_STYLE[node.kind];
                  const gymState = node.gymId ? getGymUiState(region, KANTO_GYMS, node.gymId) : null;
                  const big = node.kind === 'town' || node.kind === 'city' || !!node.gymId;
                  const size = big ? 30 : 18;
                  const half = size / 2;
                  const isHere = node.id === here;
                  const isFocused = focusedId === node.id;
                  const locals = trainersAt(node.id);
                  const unbeaten = locals.filter((t) => !isTrainerDefeated(region, t.id)).length;

                  return (
                    <g
                      key={node.id}
                      onClick={() => open && setFocusedId(node.id)}
                      onDoubleClick={() => go(node)}
                      className={`mp-node ${open ? 'mp-open' : ''} ${isFocused ? 'mp-focused' : ''}`}
                      style={{ cursor: open ? 'pointer' : 'default', animationDelay: `${Math.min(idx * 20, 640)}ms` }}
                      opacity={open ? 1 : 0.42}
                    >
                      {gymState && open && (
                        <rect
                          x={node.x - half - 6} y={node.y - half - 6}
                          width={size + 12} height={size + 12}
                          fill="none" stroke={GYM_STATE_STYLE[gymState].ring} strokeWidth="3"
                          className={gymState === 'available' ? 'mp-ring' : undefined}
                        />
                      )}

                      <rect
                        x={node.x - half} y={node.y - half} width={size} height={size}
                        fill={open ? style.fill : '#1e293b'}
                        stroke={isFocused ? '#ffffff' : style.stroke}
                        strokeWidth={isFocused ? 3 : 2}
                      />

                      {node.kind === 'forest' && open && (
                        <>
                          <path d={`M ${node.x - 8} ${node.y + 8} L ${node.x - 3} ${node.y - 6} L ${node.x + 2} ${node.y + 8} Z`} fill="#4ade80" />
                          <path d={`M ${node.x + 1} ${node.y + 8} L ${node.x + 6} ${node.y - 3} L ${node.x + 11} ${node.y + 8} Z`} fill="#4ade80" />
                        </>
                      )}
                      {node.kind === 'cave' && open && (
                        <path d={`M ${node.x - 6} ${node.y + 7} L ${node.x - 6} ${node.y} Q ${node.x} ${node.y - 8} ${node.x + 6} ${node.y} L ${node.x + 6} ${node.y + 7} Z`} fill="#1c1917" />
                      )}
                      {node.kind === 'water' && open && (
                        <path d={`M ${node.x - 7} ${node.y + 2} q 3.5 -4 7 0 t 7 0`} fill="none" stroke="#0c4a6e" strokeWidth="2" />
                      )}
                      {node.gymId && open && (
                        <text x={node.x} y={node.y + 5} textAnchor="middle" fontSize="15" style={{ pointerEvents: 'none' }}>
                          {gymState === 'completed' ? '🏅' : gymState === 'locked' ? '🔒' : '🏟️'}
                        </text>
                      )}
                      {!open && <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize="11" fill="#64748b">?</text>}

                      {open && unbeaten > 0 && (
                        <g className="mp-badge">
                          <circle cx={node.x + half + 3} cy={node.y - half - 1} r="8" fill="#ef4444" stroke="#0b1120" strokeWidth="2" />
                          <text x={node.x + half + 3} y={node.y - half + 2.5} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff" style={{ pointerEvents: 'none' }}>
                            {unbeaten}
                          </text>
                        </g>
                      )}

                      <text
                        x={node.x} y={node.y + half + (big ? 14 : 12)}
                        textAnchor="middle" fontSize={big ? 12 : 10}
                        fontWeight={big ? 'bold' : 'normal'}
                        fill={open ? (big ? '#f8fafc' : '#cbd5e1') : '#64748b'}
                        stroke="#0f172a" strokeWidth={big ? 3 : 2.5} paintOrder="stroke"
                        style={{ pointerEvents: 'none' }}
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}

                {/* You are here */}
                {(() => {
                  const p = KANTO_NODE_BY_ID[here];
                  if (!p) return null;
                  return (
                    <g className="mp-anchor" style={{ pointerEvents: 'none', transform: `translate(${p.x}px, ${p.y}px)` }}>
                      <g className="mp-marker">
                        <ellipse cx="0" cy="-12" rx="11" ry="3" fill="rgba(0,0,0,0.35)" />
                        <rect x="-11" y="-44" width="22" height="22" fill="#fbbf24" stroke="#78350f" strokeWidth="3" />
                        <rect x="-11" y="-44" width="22" height="6" fill="#dc2626" />
                        <rect x="-6" y="-34" width="4" height="4" fill="#1c1917" />
                        <rect x="2" y="-34" width="4" height="4" fill="#1c1917" />
                        <path d="M -5 -22 L 5 -22 L 0 -15 Z" fill="#78350f" />
                      </g>
                    </g>
                  );
                })()}
              </svg>
            </div>

            {/* Focused area */}
            <div className="mp-focus mt-2 px-3 py-3" key={focused?.id ?? 'none'}>
              {focused && isNodeReachable(focused, completed) ? (
                <div className="mp-in">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
                    <p className="mp-pixel text-[9px] text-yellow-300">
                      {focused.label.toUpperCase()}
                      {focused.landmark && <span className="text-slate-400"> · {focused.landmark}</span>}
                    </p>
                    <span className="text-[8px] uppercase tracking-widest text-slate-500">
                      {isTown(focused.id) ? 'Town' : NODE_STYLE[focused.kind].label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-3">
                    {focused.blurb || 'Part of the route network between Kanto’s towns.'}
                  </p>

                  <div className="flex flex-wrap gap-2 text-[9px] text-slate-400 mb-3">
                    {encountersFor(focused.id) && (
                      <span className="mp-fact">🌿 Wild Pokémon</span>
                    )}
                    {isTown(focused.id) && <span className="mp-fact">🏥 Center · 🏪 Mart</span>}
                    {focused.gymId && <span className="mp-fact">🏟️ Gym</span>}
                    {trainersAt(focused.id).length > 0 && (
                      <span className="mp-fact">
                        👤 {trainersAt(focused.id).filter((t) => !isTrainerDefeated(region, t.id)).length} trainers
                      </span>
                    )}
                  </div>

                  <button onClick={() => go(focused)} className="mp-enter w-full">
                    {focused.id === here ? 'Return Here ▸' : `Travel to ${focused.label} ▸`}
                  </button>
                </div>
              ) : (
                <p className="text-[10px] text-slate-500">
                  Tap an area to see what's there, then travel to it. Dashed lines are sea crossings.
                </p>
              )}
            </div>
          </div>

          {/* Side */}
          <div className="flex flex-col gap-3">

            {/* Party */}
            <div className="mp-panel p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="mp-pixel text-[9px] text-slate-400">PARTY</p>
                <span className="text-[9px] text-slate-500">{region.party.length}/6</span>
              </div>
              {!partyAlive && (
                <p className="text-[9px] text-red-400 mb-2">All fainted — heal at a Pokémon Center.</p>
              )}
              <div className="flex flex-col gap-1.5">
                {region.party.map((p, i) => {
                  const pct = Math.max(0, (p.currentHp / p.maxHp) * 100);
                  return (
                    <div key={i} className="mp-row flex items-center gap-2 px-1.5 py-1">
                      <img src={frontSprite(p.pokemonId)} alt={p.name} className="w-8 h-8 object-contain mp-pixelated shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-1">
                          <span className="text-[10px] font-bold uppercase truncate">{p.name}</span>
                          <span className="text-[9px] text-slate-400 shrink-0">Lv{p.level}</span>
                        </div>
                        <div className="h-1.5 bg-slate-900 border border-slate-700 overflow-hidden mt-0.5">
                          <div
                            className={`h-full mp-fill ${pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-yellow-400' : 'bg-red-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Badges */}
            <div className="mp-panel p-3">
              <p className="mp-pixel text-[9px] text-slate-400 mb-2">BADGE CASE</p>
              <div className="grid grid-cols-4 gap-2">
                {KANTO_BADGES.map((b) => {
                  const earned = region.completedGyms.includes(b.gymId);
                  return (
                    <div
                      key={b.gymId}
                      title={earned ? `${b.name} — ${b.leader}` : `Gym ${b.order}`}
                      className={`aspect-square flex items-center justify-center border-2 text-lg ${
                        earned ? 'border-yellow-500 bg-yellow-500/15 mp-earned' : 'border-slate-700 bg-slate-900 opacity-50'
                      }`}
                    >
                      {earned ? '🏅' : '·'}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Progress */}
            <div className="mp-panel p-3">
              <div className="flex justify-between text-[9px] text-slate-400 uppercase mb-1">
                <span>Dex Caught</span><span className="text-slate-200">{region.caught.length}</span>
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 uppercase mb-1">
                <span>Seen</span><span className="text-slate-200">{region.seen.length}</span>
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 uppercase mb-2">
                <span>Steps</span><span className="text-slate-200">{region.stats.stepsTaken}</span>
              </div>
              {(() => {
                const reachable = KANTO_TRAINERS.filter((t) => {
                  const n = KANTO_NODE_BY_ID[t.locationId];
                  return n && isNodeReachable(n, completed);
                });
                const beaten = reachable.filter((t) => isTrainerDefeated(region, t.id)).length;
                return (
                  <div className="pt-2 border-t-2 border-slate-800">
                    <div className="flex justify-between text-[9px] text-slate-400 uppercase mb-1">
                      <span>Trainers</span><span>{beaten}/{reachable.length}</span>
                    </div>
                    <div className="h-2 bg-slate-900 border border-slate-700 overflow-hidden">
                      <div className="h-full bg-sky-400 mp-fill" style={{ width: reachable.length ? `${(beaten / reachable.length) * 100}%` : '0%' }} />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Landmarks */}
            <div className="mp-panel p-3">
              <p className="mp-pixel text-[9px] text-slate-400 mb-2">LANDMARKS</p>
              <div className="flex flex-col gap-1">
                {KANTO_LANDMARKS.map((l) => {
                  const found = completed >= l.unlocksAfterGym;
                  return (
                    <button
                      key={l.id}
                      onClick={() => found && setFocusedId(l.id)}
                      className={`text-left text-[10px] flex justify-between gap-2 px-1 py-0.5 ${found ? 'text-slate-300 hover:text-yellow-300' : 'text-slate-600'}`}
                    >
                      <span className="truncate">{found ? l.name : '???'}</span>
                      <span className="text-[9px] text-slate-500 shrink-0">{found ? l.location : `Gym ${l.unlocksAfterGym}`}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <MapStyles />
    </div>
  );
}

function Status({
  title, body, action,
}: { title: string; body: string; action?: { href: string; label: string } }) {
  return (
    <div className="mp-root min-h-screen flex items-center justify-center p-6">
      <div className="mp-panel max-w-sm w-full p-6 text-center">
        <p className="mp-pixel text-[11px] text-yellow-300 mb-3">{title}</p>
        <p className="text-[11px] text-slate-400 mb-5">{body}</p>
        <div className="flex gap-2 justify-center flex-wrap">
          {action && <Link href={action.href} className="mp-cta">{action.label}</Link>}
          <Link href="/journey" className="mp-cta mp-cta-grey">All Regions</Link>
        </div>
      </div>
      <MapStyles />
    </div>
  );
}

function MapStyles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      :root {
        --ease: cubic-bezier(0.22, 0.61, 0.36, 1);
        --ease-pop: cubic-bezier(0.34, 1.4, 0.64, 1);
        --t-fast: 140ms;
        --t-base: 260ms;
        --t-slow: 520ms;
        --t-travel: 900ms;
      }
      .mp-pixel { font-family: 'Press Start 2P', monospace; line-height: 1.6; }
      .mp-pixelated { image-rendering: pixelated; }

      .mp-root {
        background: #0b1120;
        background-image:
          linear-gradient(0deg, rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
        background-size: 16px 16px;
        color: #e2e8f0;
        font-family: ui-monospace, monospace;
      }

      .mp-panel {
        background: #0f172a;
        border: 3px solid #334155;
        box-shadow: inset -2px -2px 0 rgba(0,0,0,0.5), inset 2px 2px 0 rgba(255,255,255,0.05);
      }

      .mp-objective {
        background: linear-gradient(90deg, rgba(250,204,21,0.12), rgba(250,204,21,0.02));
        border: 3px solid #a16207;
      }
      .mp-arrow { color: #facc15; font-size: 12px; display: inline-block; animation: mpNudge 1.4s var(--ease) infinite; }
      @keyframes mpNudge { 0%,100% { transform: translateX(0); } 50% { transform: translateX(4px); } }

      .mp-cta {
        display: inline-block;
        background: #facc15; color: #000;
        font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.06em;
        padding: 10px 14px; border-bottom: 3px solid #a16207;
      }
      .mp-cta:active { transform: translateY(2px); border-bottom-width: 1px; }
      .mp-cta-green { background: #22c55e; color: #052e16; border-bottom-color: #15803d; }
      .mp-cta-grey { background: #475569; color: #fff; border-bottom-color: #1e293b; }

      .mp-viewport { border: 3px solid #1e293b; background: #0c4a6e; overflow: hidden; }

      .mp-node { animation: mpNodeIn var(--t-base) var(--ease) both; }
      @keyframes mpNodeIn { from { opacity: 0; transform: scale(0.82); } to { opacity: 1; transform: scale(1); } }
      .mp-open:hover { filter: brightness(1.18); }
      .mp-focused { filter: drop-shadow(0 0 6px rgba(255,255,255,0.55)); }
      .mp-ring { animation: mpRing 1.8s var(--ease) infinite; }
      @keyframes mpRing { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      .mp-badge { animation: mpBeat 2s var(--ease) infinite; }
      @keyframes mpBeat { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }

      .mp-anchor { transition: transform var(--t-travel) var(--ease); }
      .mp-marker { animation: mpBob 1.6s var(--ease) infinite; }
      @keyframes mpBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }

      .mp-focus { background: #020617; border: 2px solid #1e293b; min-height: 92px; }
      .mp-in { animation: mpIn var(--t-base) var(--ease) both; }
      @keyframes mpIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }

      .mp-fact {
        padding: 3px 7px; border: 1px solid #334155; background: #0f172a;
        font-size: 9px;
      }

      .mp-enter {
        padding: 12px;
        font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em;
        background: #facc15; color: #1c1917; border-bottom: 4px solid #a16207;
        transition: filter var(--t-fast) var(--ease);
      }
      .mp-enter:hover { filter: brightness(1.1); }
      .mp-enter:active { transform: translateY(3px); border-bottom-width: 1px; }

      .mp-row { background: #020617; border: 1px solid #1e293b; }
      .mp-fill { transition: width var(--t-slow) var(--ease); }
      .mp-earned { box-shadow: 0 0 10px -2px rgba(250,204,21,0.6); animation: mpBadgeIn 420ms var(--ease-pop) both; }
      @keyframes mpBadgeIn { from { opacity: 0; transform: scale(0.5) rotate(-18deg); } to { opacity: 1; transform: none; } }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `}</style>
  );
}
