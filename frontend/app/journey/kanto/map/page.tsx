"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import {
  KANTO_GYMS,
  KANTO_BADGES,
  KANTO_PLAYER_LEVEL_CURVE,
  getEvolutionStage,
} from '../../data/kanto';
import {
  KANTO_MAP_NODES,
  KANTO_MAP_EDGES,
  KANTO_NODE_BY_ID,
  KANTO_LANDMARKS,
  NODE_STYLE,
  playerLocationForProgress,
  isNodeReachable,
  type MapNode,
} from '../../data/kanto-map';
import {
  getRegionState,
  getNextObjective,
  getGymUiState,
  isTrainerDefeated,
  type JourneyRegionState,
  type GymUiState,
} from '../../lib/journeyStorage';
import { trainersAt, KANTO_TRAINERS, trainerSpriteKey } from '../../data/kanto-trainers';
import { TrainerSprite } from '../../components/TrainerSprite';

const GYM_LOCATION_IDS = KANTO_GYMS.map((g) => g.locationId);

const GYM_STATE_STYLE: Record<GymUiState, { ring: string; chip: string; label: string }> = {
  locked:        { ring: '#475569', chip: 'text-slate-500 border-slate-700 bg-slate-900',   label: 'Locked' },
  available:     { ring: '#facc15', chip: 'text-yellow-300 border-yellow-500 bg-yellow-500/10', label: 'Available' },
  'in-progress': { ring: '#fb923c', chip: 'text-orange-300 border-orange-500 bg-orange-500/10', label: 'In Progress' },
  completed:     { ring: '#22c55e', chip: 'text-green-300 border-green-500 bg-green-500/10',  label: 'Completed' },
};

export default function KantoMapPage() {
  const { user } = useUserStore() as any;
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [region, setRegion] = useState<JourneyRegionState | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  // Why the map can't render, when it can't. Shown to the player
  // instead of a blank screen. Deliberately does NOT redirect —
  // auto-redirecting between map and team selection can ping-pong
  // forever and looks exactly like an infinite load.
  const [blocked, setBlocked] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!user) {
      setBlocked('no-user');
      return;
    }
    let state: JourneyRegionState;
    try {
      state = getRegionState(user.username, 'kanto');
    } catch (err) {
      console.error('[journey] could not read saved progress:', err);
      setBlocked('storage-error');
      return;
    }
    if (!state.team || !Array.isArray(state.team) || state.team.length !== 6) {
      console.warn('[journey] no valid Kanto team saved. Found:', state.team);
      setBlocked('no-team');
      return;
    }
    setRegion(state);
    setBlocked(null);
  }, [user]);

  const completedCount = region?.completedGyms.length ?? 0;
  const objective = useMemo(
    () => (region ? getNextObjective(region, KANTO_GYMS) : null),
    [region]
  );
  const playerNodeId = playerLocationForProgress(completedCount, GYM_LOCATION_IDS);

  // --- Visible states, never a blank screen ---
  if (!mounted) {
    return (
      <StatusScreen title="LOADING KANTO" body="Reading your saved progress…" />
    );
  }
  if (blocked === 'no-user') {
    return (
      <StatusScreen
        title="NOT SIGNED IN"
        body="Your session ended. Sign in again to pick up your Journey where you left off."
        action={{ href: '/auth', label: 'Sign In' }}
      />
    );
  }
  if (blocked === 'storage-error') {
    return (
      <StatusScreen
        title="SAVE DATA UNREADABLE"
        body="Your saved Journey could not be read. Starting a new Kanto run will clear it."
        action={{ href: '/journey/kanto/team', label: 'Start Fresh' }}
      />
    );
  }
  if (blocked === 'no-team') {
    return (
      <StatusScreen
        title="NO TEAM CHOSEN"
        body="You need a team of six before setting out from Pallet Town."
        action={{ href: '/journey/kanto/team', label: 'Choose Your Six' }}
      />
    );
  }
  if (!region || !objective) {
    return <StatusScreen title="LOADING KANTO" body="Preparing the region map…" />;
  }

  const team = region.team || [];
  const avgLevel = team.length
    ? Math.round(team.reduce((s, p) => s + p.level, 0) / team.length)
    : 0;
  const nextGym = KANTO_GYMS.find((g) => g.id === objective.gymId);
  const focused = focusedId ? KANTO_NODE_BY_ID[focusedId] : null;

  const handleNodeClick = (node: MapNode) => {
    setFocusedId(node.id === focusedId ? null : node.id);
    if (!node.gymId) return;
    if (getGymUiState(region, KANTO_GYMS, node.gymId) === 'locked') return;
    if (region.completedGyms.includes(node.gymId)) return;
    router.push(`/journey/kanto/gym/${node.gymId}`);
  };

  return (
    <div className="journey-root min-h-screen p-3 md:p-6 text-slate-200">
      <div className="max-w-6xl mx-auto">

        {/* ---------- TOP BAR ---------- */}
        <div className="panel flex items-center justify-between px-3 py-2 mb-3">
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="pixel-font text-[10px] md:text-xs text-yellow-300 whitespace-nowrap">
              KANTO
            </span>
            <span className="text-[10px] text-slate-500 truncate hidden sm:inline">
              FireRed / LeafGreen canon
            </span>
          </div>
          <Link href="/journey" className="text-[10px] text-slate-400 hover:text-white underline whitespace-nowrap">
            ← All Regions
          </Link>
        </div>

        {/* ---------- OBJECTIVE BANNER ---------- */}
        <div className="objective-banner px-3 py-2 mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="objective-arrow">▶</span>
            <div className="min-w-0">
              <p className="text-[8px] uppercase tracking-[0.2em] text-yellow-600">Next Objective</p>
              <p className="pixel-font text-[10px] md:text-xs text-yellow-200 truncate">
                {objective.text}
              </p>
            </div>
          </div>
          {objective.kind === 'defeat-gym' && nextGym && (
            <Link
              href={`/journey/kanto/gym/${nextGym.id}`}
              className="shrink-0 bg-yellow-500 hover:bg-yellow-400 text-black text-[9px] md:text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded border-b-2 border-yellow-700 active:translate-y-[2px] active:border-b-0"
            >
              Go to {nextGym.gymName}
            </Link>
          )}
          {objective.kind === 'region-complete' && (
            <Link
              href="/journey/kanto/complete"
              className="shrink-0 bg-green-500 hover:bg-green-400 text-black text-[9px] md:text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded border-b-2 border-green-700 active:translate-y-[2px] active:border-b-0"
            >
              View Hall of Fame
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">

          {/* ---------- OVERWORLD MAP ---------- */}
          <div className="panel p-2 md:p-3 overflow-hidden">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="pixel-font text-[9px] text-slate-400">OVERWORLD</span>
              <span className="text-[9px] text-slate-500">
                {KANTO_MAP_NODES.filter((n) => isNodeReachable(n, completedCount)).length}
                /{KANTO_MAP_NODES.length} areas open
              </span>
            </div>

            <div className="map-viewport">
              <svg viewBox="0 0 900 780" className="w-full h-auto block" shapeRendering="crispEdges">
                {/* Sea backdrop */}
                <rect x="0" y="0" width="900" height="780" fill="#0c4a6e" />
                {/* Landmass */}
                <path
                  d="M 60 30 L 620 30 L 700 60 L 840 130 L 860 330 L 830 520 L 700 600 L 520 640 L 400 660 L 300 640 L 230 560 L 210 430 L 190 300 L 120 240 L 70 140 Z"
                  fill="#15803d"
                  stroke="#14532d"
                  strokeWidth="3"
                />
                {/* Southern islands */}
                <ellipse cx="185" cy="700" rx="46" ry="30" fill="#15803d" stroke="#14532d" strokeWidth="3" />
                <ellipse cx="90" cy="700" rx="48" ry="32" fill="#7f1d1d" stroke="#450a0a" strokeWidth="3" />

                {/* Compass */}
                <g opacity="0.55">
                  <text x="845" y="705" fill="#e2e8f0" fontSize="16" fontWeight="bold" textAnchor="middle">N</text>
                  <path d="M 845 712 L 839 736 L 845 730 L 851 736 Z" fill="#e2e8f0" />
                  <text x="845" y="756" fill="#94a3b8" fontSize="11" textAnchor="middle">S</text>
                </g>

                {/* Travel paths */}
                {KANTO_MAP_EDGES.map((edge, i) => {
                  const a = KANTO_NODE_BY_ID[edge.from];
                  const b = KANTO_NODE_BY_ID[edge.to];
                  if (!a || !b) return null;
                  const open =
                    isNodeReachable(a, completedCount) && isNodeReachable(b, completedCount);
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
                  const open = isNodeReachable(node, completedCount);
                  const style = NODE_STYLE[node.kind];
                  const gymState = node.gymId
                    ? getGymUiState(region, KANTO_GYMS, node.gymId)
                    : null;
                  const isBig = node.kind === 'town' || node.kind === 'city' || !!node.gymId;
                  const size = isBig ? 30 : 18;
                  const half = size / 2;
                  const isFocused = focusedId === node.id;
                  const clickable = open && (!!node.gymId || !!node.blurb || !!node.landmark);

                  const locals = trainersAt(node.id);
                  const unbeaten = locals.filter((t) => !isTrainerDefeated(region, t.id)).length;

                  return (
                    <g
                      key={node.id}
                      onClick={() => open && handleNodeClick(node)}
                      className={`map-node ${open ? 'node-open' : ''} ${isFocused ? 'node-focused' : ''}`}
                      style={{
                        cursor: open ? 'pointer' : 'default',
                        animationDelay: `${Math.min(idx * 22, 700)}ms`,
                      }}
                      opacity={open ? 1 : 0.42}
                    >
                      {/* Gym status ring */}
                      {gymState && open && (
                        <rect
                          x={node.x - half - 6} y={node.y - half - 6}
                          width={size + 12} height={size + 12}
                          fill="none"
                          stroke={GYM_STATE_STYLE[gymState].ring}
                          strokeWidth="3"
                          className={gymState === 'available' ? 'gym-ring-pulse' : undefined}
                        />
                      )}

                      {/* Tile */}
                      <rect
                        x={node.x - half} y={node.y - half}
                        width={size} height={size}
                        fill={open ? style.fill : '#1e293b'}
                        stroke={isFocused ? '#ffffff' : style.stroke}
                        strokeWidth={isFocused ? 3 : 2}
                      />

                      {/* Kind glyph */}
                      {node.kind === 'forest' && open && (
                        <>
                          <path d={`M ${node.x - 8} ${node.y + 8} L ${node.x - 3} ${node.y - 6} L ${node.x + 2} ${node.y + 8} Z`} fill="#4ade80" />
                          <path d={`M ${node.x + 1} ${node.y + 8} L ${node.x + 6} ${node.y - 3} L ${node.x + 11} ${node.y + 8} Z`} fill="#4ade80" />
                        </>
                      )}
                      {node.kind === 'cave' && open && (
                        <path
                          d={`M ${node.x - 6} ${node.y + 7} L ${node.x - 6} ${node.y} Q ${node.x} ${node.y - 8} ${node.x + 6} ${node.y} L ${node.x + 6} ${node.y + 7} Z`}
                          fill="#1c1917"
                        />
                      )}
                      {node.kind === 'water' && open && (
                        <path
                          d={`M ${node.x - 7} ${node.y + 2} q 3.5 -4 7 0 t 7 0`}
                          fill="none" stroke="#0c4a6e" strokeWidth="2"
                        />
                      )}
                      {node.gymId && open && (
                        <text
                          x={node.x} y={node.y + 5}
                          textAnchor="middle" fontSize="15"
                          style={{ pointerEvents: 'none' }}
                        >
                          {gymState === 'completed' ? '🏅' : gymState === 'locked' ? '🔒' : '🏟️'}
                        </text>
                      )}
                      {!open && (
                        <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize="11" fill="#64748b">?</text>
                      )}

                      {/* Trainer marker — how many are still standing here */}
                      {open && locals.length > 0 && (
                        <g className={unbeaten > 0 ? 'trainer-badge' : undefined}>
                          <circle
                            cx={node.x + half + 3}
                            cy={node.y - half - 1}
                            r="8"
                            fill={unbeaten > 0 ? '#ef4444' : '#16a34a'}
                            stroke="#0b1120"
                            strokeWidth="2"
                          />
                          <text
                            x={node.x + half + 3}
                            y={node.y - half + 2.5}
                            textAnchor="middle"
                            fontSize="9"
                            fontWeight="bold"
                            fill="#ffffff"
                            style={{ pointerEvents: 'none' }}
                          >
                            {unbeaten > 0 ? unbeaten : '✓'}
                          </text>
                        </g>
                      )}

                      {/* Label */}
                      {(isBig || node.landmark) && (
                        <text
                          x={node.x} y={node.y + half + 14}
                          textAnchor="middle"
                          fontSize="12"
                          fontWeight="bold"
                          fill={open ? '#f8fafc' : '#64748b'}
                          stroke="#0f172a" strokeWidth="3" paintOrder="stroke"
                          style={{ pointerEvents: 'none' }}
                        >
                          {node.label}
                        </text>
                      )}
                      {!isBig && !node.landmark && (
                        <text
                          x={node.x} y={node.y + half + 12}
                          textAnchor="middle" fontSize="10"
                          fill={open ? '#cbd5e1' : '#475569'}
                          stroke="#0f172a" strokeWidth="2.5" paintOrder="stroke"
                          style={{ pointerEvents: 'none' }}
                        >
                          {node.label}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Player marker */}
                {(() => {
                  const p = KANTO_NODE_BY_ID[playerNodeId];
                  if (!p) return null;
                  return (
                    // Outer group holds position and glides between
                    // towns; inner group does the idle bob, so the
                    // two motions never fight each other.
                    <g
                      className="player-anchor"
                      style={{ pointerEvents: 'none', transform: `translate(${p.x}px, ${p.y}px)` }}
                    >
                      <g className="player-marker">
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

            {/* Focused-area detail panel */}
            <div className="focus-bar mt-2 px-3 py-2" key={focused?.id ?? 'none'}>
              {focused && isNodeReachable(focused, completedCount) ? (
                <div className="focus-in">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <p className="pixel-font text-[9px] text-yellow-300">
                      {focused.label.toUpperCase()}
                      {focused.landmark && <span className="text-slate-400"> · {focused.landmark}</span>}
                    </p>
                    <span className="text-[8px] uppercase tracking-widest text-slate-500">
                      {NODE_STYLE[focused.kind].label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {focused.blurb || 'Part of the route network between Kanto’s towns.'}
                  </p>

                  {(() => {
                    const locals = trainersAt(focused.id);
                    if (locals.length === 0) return null;
                    const beaten = locals.filter((t) => isTrainerDefeated(region, t.id)).length;
                    return (
                      <div className="mt-2 pt-2 border-t-2 border-slate-800">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[8px] uppercase tracking-widest text-slate-500">
                            Trainers here
                          </span>
                          <span className="text-[9px] text-slate-400">{beaten}/{locals.length} beaten</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          {locals.map((t) => {
                            const done = isTrainerDefeated(region, t.id);
                            const top = Math.max(...t.team.map((m) => m.level));
                            const row = (
                              <div className={`trainer-row flex items-center gap-2 px-2 py-1.5 ${done ? 'trainer-done' : ''}`}>
                                <TrainerSprite
                                  spriteKey={trainerSpriteKey(t)}
                                  alt={t.name}
                                  className="w-9 h-9 object-contain shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[8px] uppercase tracking-wider text-slate-500">
                                    {t.trainerClass}
                                  </p>
                                  <p className="text-[10px] font-bold uppercase truncate">{t.name}</p>
                                </div>
                                <span className={`shrink-0 text-[8px] font-black uppercase px-2 py-1 border ${
                                  done
                                    ? 'text-green-400 border-green-700 bg-green-900/20'
                                    : 'text-yellow-300 border-yellow-600 bg-yellow-500/10'
                                }`}>
                                  {done ? 'Beaten' : `Lv${top} · Battle`}
                                </span>
                              </div>
                            );
                            return done ? (
                              <div key={t.id}>{row}</div>
                            ) : (
                              <Link key={t.id} href={`/journey/kanto/trainer/${t.id}`}>{row}</Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <p className="text-[10px] text-slate-500">
                  Tap any area to inspect it and battle the trainers standing there.
                  Dashed lines are sea crossings.
                </p>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 px-1">
              {(['town', 'route', 'forest', 'cave', 'water', 'landmark'] as const).map((k) => (
                <span key={k} className="flex items-center gap-1 text-[9px] text-slate-400">
                  <span
                    className="inline-block w-2.5 h-2.5 border"
                    style={{ background: NODE_STYLE[k].fill, borderColor: NODE_STYLE[k].stroke }}
                  />
                  {NODE_STYLE[k].label}
                </span>
              ))}
            </div>
          </div>

          {/* ---------- SIDE HUD ---------- */}
          <div className="flex flex-col gap-3">

            {/* Progress */}
            <div className="panel p-3">
              <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                <span className="pixel-font text-[9px] text-slate-400">GYMS</span>
                <span className="font-bold">{completedCount} / {KANTO_GYMS.length}</span>
              </div>
              <div className="h-3 bg-slate-900 border border-slate-700 overflow-hidden mb-2">
                <div
                  className="h-full bg-yellow-400 progress-fill"
                  style={{ width: `${(completedCount / KANTO_GYMS.length) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 uppercase tracking-wide">
                <span>Team Avg Lv {avgLevel}</span>
                <span>Target Lv {KANTO_PLAYER_LEVEL_CURVE[completedCount]}</span>
              </div>

              {/* Route trainers are optional, so they get their own
                  line rather than competing with gym progress. */}
              {(() => {
                const reachable = KANTO_TRAINERS.filter((t) => {
                  const n = KANTO_NODE_BY_ID[t.locationId];
                  return n && isNodeReachable(n, completedCount);
                });
                const beaten = reachable.filter((t) => isTrainerDefeated(region, t.id)).length;
                return (
                  <div className="mt-2 pt-2 border-t-2 border-slate-800">
                    <div className="flex justify-between text-[9px] text-slate-400 uppercase tracking-wide mb-1">
                      <span>Route Trainers</span>
                      <span>{beaten}/{reachable.length}</span>
                    </div>
                    <div className="h-2 bg-slate-900 border border-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-sky-400 progress-fill"
                        style={{ width: reachable.length ? `${(beaten / reachable.length) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Badge case */}
            <div className="panel p-3">
              <p className="pixel-font text-[9px] text-slate-400 mb-2">BADGE CASE</p>
              <div className="grid grid-cols-4 gap-2">
                {KANTO_BADGES.map((b) => {
                  const earned = region.completedGyms.includes(b.gymId);
                  return (
                    <div
                      key={b.gymId}
                      title={earned ? `${b.name} — ${b.leader}` : `Locked · Gym ${b.order}`}
                      className={`aspect-square flex items-center justify-center border-2 text-lg ${
                        earned
                          ? 'border-yellow-500 bg-yellow-500/15 badge-earned'
                          : 'border-slate-700 bg-slate-900 opacity-50'
                      }`}
                    >
                      {earned ? '🏅' : '·'}
                    </div>
                  );
                })}
              </div>
              <p className="text-[9px] text-slate-500 mt-2">
                {completedCount === 0
                  ? 'No badges yet.'
                  : `${KANTO_BADGES.filter((b) => region.completedGyms.includes(b.gymId))
                      .map((b) => b.name)
                      .join(' · ')}`}
              </p>
            </div>

            {/* Party */}
            <div className="panel p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="pixel-font text-[9px] text-slate-400">PARTY</p>
                <span className="text-[9px] text-slate-500">{team.length}/6</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {team.map((p, i) => {
                  const pct = Math.max(0, (p.currentHp / p.maxHp) * 100);
                  const hpColor = pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-yellow-400' : 'bg-red-500';
                  const stage = p.evolutionStage ?? getEvolutionStage(p.pokemonId);
                  return (
                    <div key={i} className="party-row flex items-center gap-2 px-1.5 py-1">
                      {p.spriteUrl && (
                        <img
                          src={p.spriteUrl}
                          alt={p.name}
                          className="w-8 h-8 object-contain image-pixelated shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-1">
                          <span className="text-[10px] font-bold uppercase truncate">{p.name}</span>
                          <span className="text-[9px] text-slate-400 shrink-0">Lv{p.level}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="h-1.5 flex-1 bg-slate-900 border border-slate-700 overflow-hidden">
                            <div className={`h-full ${hpColor} progress-fill`} style={{ width: `${pct}%` }} />
                          </div>
                          {p.status && (
                            <span className={`status-chip status-${p.status}`}>
                              {p.status.slice(0, 3).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {(p.types || []).map((t) => (
                            <span key={t} className="type-chip">{t}</span>
                          ))}
                          <span className="text-[8px] text-slate-600 ml-auto">
                            {'★'.repeat(stage)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Landmarks */}
            <div className="panel p-3">
              <p className="pixel-font text-[9px] text-slate-400 mb-2">LANDMARKS</p>
              <div className="flex flex-col gap-1">
                {KANTO_LANDMARKS.map((l) => {
                  const found = completedCount >= l.unlocksAfterGym;
                  return (
                    <button
                      key={l.id}
                      onClick={() => found && setFocusedId(l.id)}
                      className={`text-left text-[10px] flex justify-between gap-2 px-1 py-0.5 ${
                        found ? 'text-slate-300 hover:text-yellow-300' : 'text-slate-600'
                      }`}
                    >
                      <span className="truncate">{found ? l.name : '???'}</span>
                      <span className="text-[9px] text-slate-500 shrink-0">
                        {found ? l.location : `Gym ${l.unlocksAfterGym}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ---------- GYM LIST (mobile-friendly, always visible) ---------- */}
        <div className="panel p-3 mt-3">
          <p className="pixel-font text-[9px] text-slate-400 mb-2">GYM PROGRESSION</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {KANTO_GYMS.map((gym) => {
              const state = getGymUiState(region, KANTO_GYMS, gym.id);
              const s = GYM_STATE_STYLE[state];
              const clickable = state === 'available' || state === 'in-progress';
              const inner = (
                <div
                  className={`gym-row flex items-center justify-between gap-2 px-3 py-2 border-2 ${
                    state === 'completed'
                      ? 'border-green-600 bg-green-900/20'
                      : clickable
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-slate-800 bg-slate-900/60 opacity-60'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-[8px] uppercase tracking-widest text-slate-500">
                      Gym {gym.order} · {gym.type}
                    </p>
                    <p className="text-[11px] font-black uppercase truncate">{gym.name}</p>
                    <p className="text-[9px] text-slate-400 truncate">
                      {gym.gymName} · {gym.badgeName}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[8px] font-black uppercase tracking-wider px-2 py-1 border ${s.chip}`}>
                    {s.label}
                  </span>
                </div>
              );
              return clickable ? (
                <Link key={gym.id} href={`/journey/kanto/gym/${gym.id}`}>{inner}</Link>
              ) : (
                <div key={gym.id}>{inner}</div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

        /* One easing curve and one set of durations across the
           whole Journey, so nothing feels out of step. */
        :root {
          --ease: cubic-bezier(0.22, 0.61, 0.36, 1);
          --ease-pop: cubic-bezier(0.34, 1.4, 0.64, 1);
          --t-fast: 140ms;
          --t-base: 260ms;
          --t-slow: 520ms;
          --t-travel: 900ms;
        }

        .pixel-font { font-family: 'Press Start 2P', monospace; line-height: 1.6; }
        .image-pixelated { image-rendering: pixelated; }

        .journey-root {
          background: #0b1120;
          background-image:
            linear-gradient(0deg, rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 16px 16px;
        }

        .panel {
          background: #0f172a;
          border: 3px solid #334155;
          box-shadow: inset -2px -2px 0 rgba(0,0,0,0.5), inset 2px 2px 0 rgba(255,255,255,0.05);
        }

        .objective-banner {
          background: linear-gradient(90deg, rgba(250,204,21,0.12), rgba(250,204,21,0.02));
          border: 3px solid #a16207;
          box-shadow: inset 2px 2px 0 rgba(255,255,255,0.06);
        }
        .objective-arrow {
          color: #facc15;
          font-size: 12px;
          display: inline-block;
        }
        @keyframes nudge {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }

        .map-viewport {
          border: 3px solid #1e293b;
          background: #0c4a6e;
          overflow: hidden;
        }

        .focus-bar {
          background: #020617;
          border: 2px solid #1e293b;
          min-height: 52px;
        }

        /* The trainer walks to the next town rather than teleporting. */
        .player-anchor { transition: transform var(--t-travel) var(--ease); }
        .player-marker { animation: bob 1.6s var(--ease) infinite; }
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        /* Nodes settle in on load instead of appearing all at once. */
        .map-node { animation: nodeIn var(--t-base) var(--ease) both; }
        @keyframes nodeIn {
          from { opacity: 0; transform: scale(0.82); }
          to   { opacity: 1; transform: scale(1); }
        }
        .map-node rect, .map-node circle, .map-node text {
          transition: transform var(--t-fast) var(--ease),
                      fill var(--t-base) var(--ease),
                      stroke var(--t-base) var(--ease);
        }
        .node-open:hover { filter: brightness(1.18); }
        .node-focused { filter: drop-shadow(0 0 6px rgba(255,255,255,0.55)); }

        .gym-ring-pulse { animation: ringPulse 1.8s var(--ease) infinite; }
        @keyframes ringPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* Unbeaten trainers gently ask to be noticed. */
        .trainer-badge { animation: badgeBeat 2s var(--ease) infinite; transform-origin: center; }
        @keyframes badgeBeat {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }

        .focus-in { animation: focusIn var(--t-base) var(--ease) both; }
        @keyframes focusIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .trainer-row {
          background: #0f172a;
          border: 1px solid #1e293b;
          transition: transform var(--t-fast) var(--ease),
                      border-color var(--t-fast) var(--ease),
                      background var(--t-fast) var(--ease);
        }
        a:hover .trainer-row { transform: translateX(3px); border-color: #facc15; background: #111c33; }
        .trainer-done { opacity: 0.55; }
        .trainer-sprite { image-rendering: pixelated; display: block; }

        .badge-earned {
          box-shadow: 0 0 10px -2px rgba(250,204,21,0.6);
          animation: badgeIn 420ms var(--ease-pop) both;
        }
        @keyframes badgeIn {
          from { opacity: 0; transform: scale(0.5) rotate(-18deg); }
          to   { opacity: 1; transform: scale(1) rotate(0); }
        }

        .party-row {
          background: #020617;
          border: 1px solid #1e293b;
        }

        .type-chip {
          font-size: 7px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 1px 4px;
          border: 1px solid #334155;
          background: #0f172a;
          color: #94a3b8;
        }

        .status-chip {
          font-size: 7px;
          font-weight: 900;
          padding: 1px 3px;
          color: #0b1120;
        }
        .status-burn { background: #f97316; }
        .status-poison { background: #a855f7; }
        .status-paralysis { background: #eab308; }
        .status-sleep { background: #94a3b8; }
        .status-freeze { background: #38bdf8; }

        .gym-row {
          box-shadow: 0 3px 0 rgba(0,0,0,0.35);
          transition: transform var(--t-fast) var(--ease), box-shadow var(--t-fast) var(--ease);
        }
        a:hover .gym-row { transform: translateY(-2px); box-shadow: 0 5px 0 rgba(0,0,0,0.4); }

        .objective-arrow { animation: nudge 1.4s var(--ease) infinite; }

        /* Progress bars fill smoothly rather than snapping. */
        .progress-fill { transition: width var(--t-slow) var(--ease); }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// A visible stand-in for every state where the map can't draw.
// Anything that would once have rendered null now lands here, so
// a problem announces itself instead of showing a blank page.
// ============================================================

function StatusScreen({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="status-root min-h-screen flex items-center justify-center p-6 text-slate-200">
      <div className="status-panel max-w-sm w-full p-6 text-center">
        <p className="status-title text-[11px] mb-3">{title}</p>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-5">{body}</p>
        <div className="flex gap-2 justify-center flex-wrap">
          {action && (
            <Link href={action.href} className="status-btn status-btn-primary">
              {action.label}
            </Link>
          )}
          <Link href="/journey" className="status-btn status-btn-quiet">
            All Regions
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .status-root {
          background: #0b1120;
          font-family: ui-monospace, monospace;
        }
        .status-panel {
          background: #0f172a;
          border: 3px solid #334155;
          box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.5),
            inset 2px 2px 0 rgba(255, 255, 255, 0.05);
        }
        .status-title {
          font-family: 'Press Start 2P', monospace;
          line-height: 1.7;
          color: #facc15;
        }
        .status-btn {
          display: inline-block;
          padding: 10px 18px;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border-bottom-width: 4px;
          border-bottom-style: solid;
        }
        .status-btn:active {
          transform: translateY(3px);
          border-bottom-width: 1px;
        }
        .status-btn-primary {
          background: #facc15;
          color: #1c1917;
          border-bottom-color: #a16207;
        }
        .status-btn-quiet {
          background: #475569;
          color: #ffffff;
          border-bottom-color: #1e293b;
        }
      `}</style>
    </div>
  );
}