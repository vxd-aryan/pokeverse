"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import { getRegion, previousRegionId } from '../../data/regions';
import {
  nodeById, trainersAt, encountersFor, landmarksOf, rewardsOf,
  isNodeReachable, NODE_STYLE, CHALLENGE_STYLE,
  type MapNode, type RegionData,
} from '../../data/types';
import { frontSprite } from '../../lib/fetchMon';
import {
  getRegionState, hasStarted, getNextObjective, getChallengeUiState,
  isTrainerDefeated, isRegionUnlocked,
  type JourneyRegionState, type ChallengeUiState,
} from '../../lib/journeyStorage';
import { JourneyShell, StatusCard, journeyStyles, GlobalStyle } from '../../components/JourneyShell';

// ============================================================
// REGION MAP — THE TRAVEL LAYER
// ============================================================
// Draws whatever region the URL names. The landmass, the nodes,
// the paths and the challenge markers all come from region data,
// so Kanto and Johto share this file entirely.
// ============================================================

const STATE_STYLE: Record<ChallengeUiState, { ring: string; chip: string; label: string }> = {
  locked:        { ring: '#475569', chip: 'text-slate-500 border-slate-700 bg-slate-900', label: 'Locked' },
  available:     { ring: '#facc15', chip: 'text-yellow-300 border-yellow-500 bg-yellow-500/10', label: 'Open' },
  'in-progress': { ring: '#fb923c', chip: 'text-orange-300 border-orange-500 bg-orange-500/10', label: 'Ready' },
  completed:     { ring: '#22c55e', chip: 'text-green-300 border-green-500 bg-green-500/10', label: 'Cleared' },
};

export default function RegionMapPage() {
  const { regionId } = useParams();
  const router = useRouter();
  const { user } = useUserStore() as any;
  const rid = String(regionId);
  const region = getRegion(rid);

  const [mounted, setMounted] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [state, setState] = useState<JourneyRegionState | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!user) { setBlocked('no-user'); return; }
    if (!region) { setBlocked('no-region'); return; }
    if (!isRegionUnlocked(user.username, previousRegionId(rid))) { setBlocked('locked'); return; }
    try {
      const s = getRegionState(user.username, rid, region.map.nodes[0]?.id);
      if (!hasStarted(s)) { setBlocked('no-starter'); return; }
      setState(s);
      setFocusedId(s.currentNode);
      setBlocked(null);
    } catch (err) {
      console.error('[journey] could not read save:', err);
      setBlocked('storage');
    }
  }, [user, rid, region]);

  const cleared = state?.clearedChallenges.length ?? 0;
  const objective = useMemo(
    () => (state && region ? getNextObjective(state, region.challenges) : null),
    [state, region]
  );

  if (!mounted) return <JourneyShell><StatusCard title="LOADING" body="Unfolding the map…" /></JourneyShell>;

  if (blocked) {
    const copy: Record<string, { title: string; body: string; href: string; label: string }> = {
      'no-user': { title: 'NOT SIGNED IN', body: 'Sign in to continue your Journey.', href: '/auth', label: 'Sign In' },
      'no-region': { title: 'UNKNOWN REGION', body: 'There is no region by that name.', href: '/journey', label: 'All Regions' },
      locked: { title: 'REGION LOCKED', body: 'Complete the previous region first.', href: '/journey', label: 'All Regions' },
      'no-starter': {
        title: 'YOUR JOURNEY HASN’T STARTED',
        body: `${region?.professor ?? 'The professor'} is waiting for you in ${region?.labLocation ?? 'the lab'} with three Poké Balls.`,
        href: `/journey/${rid}/starter`, label: 'Go to the Lab',
      },
      storage: { title: 'SAVE UNREADABLE', body: 'Your save could not be read.', href: `/journey/${rid}/starter`, label: 'Start Fresh' },
    };
    const c = copy[blocked] ?? copy['no-region'];
    return <JourneyShell><StatusCard title={c.title} body={c.body} action={{ href: c.href, label: c.label }} /></JourneyShell>;
  }

  if (!region || !state || !objective) {
    return <JourneyShell><StatusCard title="LOADING" body="Unfolding the map…" /></JourneyShell>;
  }

  const byId = nodeById(region);
  const here = state.currentNode;
  const focused = focusedId ? byId[focusedId] : null;
  const nextChallenge = region.challenges.find((c) => c.id === objective.challengeId);
  const partyAlive = state.party.some((p) => p.currentHp > 0);
  const rewards = rewardsOf(region);
  const landmarks = landmarksOf(region);

  const go = (node: MapNode) => {
    if (!isNodeReachable(node, cleared)) return;
    router.push(`/journey/${rid}/area/${node.id}`);
  };

  return (
    <div className="jr-root min-h-screen p-3 md:p-6">
      <div className="max-w-6xl mx-auto">

        {/* Top bar */}
        <div className="jr-panel flex items-center justify-between px-3 py-2 mb-3">
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="jr-pixel text-[10px] text-yellow-300 whitespace-nowrap">
              {region.name.toUpperCase()}
            </span>
            <span className="text-[10px] text-slate-500 truncate hidden sm:inline">
              {byId[here]?.label ?? 'Travelling'}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[10px] text-yellow-300 font-bold">₽{state.money}</span>
            <Link href="/journey" className="text-[10px] text-slate-400 hover:text-white underline">← Regions</Link>
          </div>
        </div>

        {/* Objective */}
        <div className="mp-objective px-3 py-2 mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="mp-arrow">▶</span>
            <div className="min-w-0">
              <p className="text-[8px] uppercase tracking-[0.2em] text-yellow-600">Next Objective</p>
              <p className="jr-pixel text-[10px] text-yellow-200 truncate">{objective.text}</p>
            </div>
          </div>
          {objective.kind === 'defeat-challenge' && nextChallenge && (
            <Link href={`/journey/${rid}/area/${nextChallenge.locationId}`} className="jr-btn jr-btn-yellow !py-2 !px-3 !text-[10px] shrink-0">
              Go to {byId[nextChallenge.locationId]?.label ?? nextChallenge.venue}
            </Link>
          )}
          {objective.kind === 'region-complete' && (
            <Link href={`/journey/${rid}/complete`} className="jr-btn jr-btn-green !py-2 !px-3 !text-[10px] shrink-0">
              Hall of Fame
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">

          {/* Map */}
          <div className="jr-panel p-2 md:p-3 overflow-hidden">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="jr-pixel text-[9px] text-slate-400">OVERWORLD</span>
              <span className="text-[9px] text-slate-500">
                {region.map.nodes.filter((n) => isNodeReachable(n, cleared)).length}/{region.map.nodes.length} open
              </span>
            </div>

            <div className="mp-viewport" style={{ background: region.map.canvas.sea }}>
              <svg viewBox={region.map.canvas.viewBox} className="w-full h-auto block" shapeRendering="crispEdges">
                <rect x="0" y="0" width="100%" height="100%" fill={region.map.canvas.sea} />

                {/* Landmass, as the region defines it */}
                {region.map.canvas.land.map((shape, i) =>
                  shape.d ? (
                    <path key={i} d={shape.d} fill={shape.fill} stroke={shape.stroke} strokeWidth="3" />
                  ) : shape.ellipse ? (
                    <ellipse
                      key={i}
                      cx={shape.ellipse.cx} cy={shape.ellipse.cy}
                      rx={shape.ellipse.rx} ry={shape.ellipse.ry}
                      fill={shape.fill} stroke={shape.stroke} strokeWidth="3"
                    />
                  ) : null
                )}

                {/* Paths */}
                {region.map.edges.map((edge, i) => {
                  const a = byId[edge.from];
                  const b = byId[edge.to];
                  if (!a || !b) return null;
                  const open = isNodeReachable(a, cleared) && isNodeReachable(b, cleared);
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
                {region.map.nodes.map((node, idx) => {
                  const open = isNodeReachable(node, cleared);
                  const style = NODE_STYLE[node.kind];
                  const challenge = node.challengeId
                    ? region.challenges.find((c) => c.id === node.challengeId)
                    : null;
                  const cState = node.challengeId
                    ? getChallengeUiState(state, region.challenges, node.challengeId)
                    : null;
                  const big = node.isTown || !!node.challengeId;
                  const size = big ? 30 : 18;
                  const half = size / 2;
                  const isFocused = focusedId === node.id;
                  const locals = trainersAt(region, node.id);
                  const unbeaten = locals.filter((t) => !isTrainerDefeated(state, t.id)).length;

                  return (
                    <g
                      key={node.id}
                      onClick={() => open && setFocusedId(node.id)}
                      onDoubleClick={() => go(node)}
                      className={`mp-node ${open ? 'mp-open' : ''} ${isFocused ? 'mp-focused' : ''}`}
                      style={{ cursor: open ? 'pointer' : 'default', animationDelay: `${Math.min(idx * 20, 640)}ms` }}
                      opacity={open ? 1 : 0.42}
                    >
                      {cState && open && (
                        <rect
                          x={node.x - half - 6} y={node.y - half - 6}
                          width={size + 12} height={size + 12}
                          fill="none" stroke={STATE_STYLE[cState].ring} strokeWidth="3"
                          className={cState === 'available' ? 'mp-ring' : undefined}
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
                      {challenge && open && (
                        <text x={node.x} y={node.y + 5} textAnchor="middle" fontSize="15" style={{ pointerEvents: 'none' }}>
                          {cState === 'completed' ? '🏅' : cState === 'locked' ? '🔒' : CHALLENGE_STYLE[challenge.kind].icon}
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
                  const p = byId[here];
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
            <div className="jr-inset mt-2 px-3 py-3" key={focused?.id ?? 'none'}>
              {focused && isNodeReachable(focused, cleared) ? (
                <div className="mp-in">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
                    <p className="jr-pixel text-[9px] text-yellow-300">
                      {focused.label.toUpperCase()}
                      {focused.landmark && <span className="text-slate-400"> · {focused.landmark}</span>}
                    </p>
                    <span className="text-[8px] uppercase tracking-widest text-slate-500">
                      {focused.isTown ? 'Town' : NODE_STYLE[focused.kind].label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-3">
                    {focused.blurb || 'Part of the route network between this region’s towns.'}
                  </p>

                  <div className="flex flex-wrap gap-2 text-[9px] text-slate-400 mb-3">
                    {encountersFor(region, focused.id) && <span className="mp-fact">🌿 Wild Pokémon</span>}
                    {focused.isTown && <span className="mp-fact">🏥 Centre · 🏪 Mart</span>}
                    {focused.challengeId && (
                      <span className="mp-fact">
                        {CHALLENGE_STYLE[region.challenges.find((c) => c.id === focused.challengeId)!.kind].icon}{' '}
                        {CHALLENGE_STYLE[region.challenges.find((c) => c.id === focused.challengeId)!.kind].label}
                      </span>
                    )}
                    {trainersAt(region, focused.id).length > 0 && (
                      <span className="mp-fact">
                        👤 {trainersAt(region, focused.id).filter((t) => !isTrainerDefeated(state, t.id)).length} trainers
                      </span>
                    )}
                  </div>

                  <button onClick={() => go(focused)} className="jr-btn jr-btn-yellow w-full">
                    {focused.id === here ? 'Return Here ▸' : `Travel to ${focused.label} ▸`}
                  </button>
                </div>
              ) : (
                <p className="text-[10px] text-slate-500">
                  Tap an area to see what’s there, then travel to it. Dashed lines are sea crossings.
                </p>
              )}
            </div>
          </div>

          {/* Side */}
          <div className="flex flex-col gap-3">
            <div className="jr-panel p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="jr-pixel text-[9px] text-slate-400">PARTY</p>
                <span className="text-[9px] text-slate-500">{state.party.length}/6</span>
              </div>
              {!partyAlive && <p className="text-[9px] text-red-400 mb-2">All fainted — heal at a Pokémon Centre.</p>}
              <div className="flex flex-col gap-1.5">
                {state.party.map((p, i) => {
                  const pct = Math.max(0, (p.currentHp / p.maxHp) * 100);
                  return (
                    <div key={i} className="jr-inset flex items-center gap-2 px-1.5 py-1">
                      <img src={frontSprite(p.pokemonId)} alt={p.name} className="w-8 h-8 object-contain jr-pixelated shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-1">
                          <span className="text-[10px] font-bold uppercase truncate">{p.name}</span>
                          <span className="text-[9px] text-slate-400 shrink-0">Lv{p.level}</span>
                        </div>
                        <div className="h-1.5 bg-slate-900 border border-slate-700 overflow-hidden mt-0.5">
                          <div
                            className={`h-full jr-fill ${pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-yellow-400' : 'bg-red-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="jr-panel p-3">
              <p className="jr-pixel text-[9px] text-slate-400 mb-2">{region.rewardNoun.toUpperCase()}</p>
              <div className="grid grid-cols-4 gap-2">
                {rewards.map((b) => {
                  const earned = state.clearedChallenges.includes(b.challengeId);
                  return (
                    <div
                      key={b.challengeId}
                      title={earned ? `${b.name} — ${b.leader}` : `${b.order}`}
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

            <div className="jr-panel p-3">
              <div className="flex justify-between text-[9px] text-slate-400 uppercase mb-1">
                <span>Dex Caught</span><span className="text-slate-200">{state.caught.length}</span>
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 uppercase mb-1">
                <span>Seen</span><span className="text-slate-200">{state.seen.length}</span>
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 uppercase mb-2">
                <span>Steps</span><span className="text-slate-200">{state.stats.stepsTaken}</span>
              </div>
              {(() => {
                const reachable = region.trainers.filter((t) => {
                  const n = byId[t.locationId];
                  return n && isNodeReachable(n, cleared);
                });
                const beaten = reachable.filter((t) => isTrainerDefeated(state, t.id)).length;
                return (
                  <div className="pt-2 border-t-2 border-slate-800">
                    <div className="flex justify-between text-[9px] text-slate-400 uppercase mb-1">
                      <span>Trainers</span><span>{beaten}/{reachable.length}</span>
                    </div>
                    <div className="h-2 bg-slate-900 border border-slate-700 overflow-hidden">
                      <div className="h-full bg-sky-400 jr-fill" style={{ width: reachable.length ? `${(beaten / reachable.length) * 100}%` : '0%' }} />
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="jr-panel p-3">
              <p className="jr-pixel text-[9px] text-slate-400 mb-2">LANDMARKS</p>
              <div className="flex flex-col gap-1">
                {landmarks.map((l) => {
                  const found = cleared >= l.unlocksAfterChallenge;
                  return (
                    <button
                      key={l.id}
                      onClick={() => found && setFocusedId(l.id)}
                      className={`text-left text-[10px] flex justify-between gap-2 px-1 py-0.5 ${found ? 'text-slate-300 hover:text-yellow-300' : 'text-slate-600'}`}
                    >
                      <span className="truncate">{found ? l.name : '???'}</span>
                      <span className="text-[9px] text-slate-500 shrink-0">{found ? l.location : `#${l.unlocksAfterChallenge}`}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <GlobalStyle css={journeyStyles} />
      <GlobalStyle css={`
        .mp-objective {
          background: linear-gradient(90deg, rgba(250,204,21,0.12), rgba(250,204,21,0.02));
          border: 3px solid #a16207;
        }
        .mp-arrow { color: #facc15; font-size: 12px; display: inline-block; animation: mpNudge 1.4s var(--ease) infinite; }
        @keyframes mpNudge { 0%,100% { transform: translateX(0); } 50% { transform: translateX(4px); } }

        .mp-viewport { border: 3px solid #1e293b; overflow: hidden; }

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

        .mp-in { animation: mpIn var(--t-base) var(--ease) both; }
        @keyframes mpIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }

        .mp-fact { padding: 3px 7px; border: 1px solid #334155; background: #0f172a; font-size: 9px; }
        .mp-earned { box-shadow: 0 0 10px -2px rgba(250,204,21,0.6); animation: mpBadgeIn 420ms var(--ease-pop) both; }
        @keyframes mpBadgeIn { from { opacity: 0; transform: scale(0.5) rotate(-18deg); } to { opacity: 1; transform: none; } }
      `} />
    </div>
  );
}
