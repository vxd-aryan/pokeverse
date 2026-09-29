"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import {
  KANTO_GYMS,
  KANTO_LEVEL_CURVE,
  KANTO_GYM_LEVEL_OFFSET,
  KANTO_EVOLUTION_MAP,
  type JourneyPokemon,
} from '../../../data/kanto';
import { fetchJourneyPokemon, relevelJourneyPokemon } from '../../../lib/pokemonFetch';
import { resolveJourneyTurn } from '../../../lib/battleEngine';
import { getRegionState, markGymComplete, markRegionComplete, updateTeam } from '../../../lib/journeyStorage';

type Phase = 'loading' | 'intro' | 'battling' | 'victory' | 'defeat';

export default function KantoGymBattlePage() {
  const { gymId } = useParams();
  const router = useRouter();
  const { user } = useUserStore() as any;

  const [phase, setPhase] = useState<Phase>('loading');
  const [playerTeam, setPlayerTeam] = useState<JourneyPokemon[]>([]);
  const [playerActiveIdx, setPlayerActiveIdx] = useState(0);
  const [opponentTeam, setOpponentTeam] = useState<JourneyPokemon[]>([]);
  const [opponentActiveIdx, setOpponentActiveIdx] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [needsSwitch, setNeedsSwitch] = useState(false);
  const [levelUpSummary, setLevelUpSummary] = useState<{ name: string; fromLevel: number; toLevel: number; evolved: boolean; newName?: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const gym = KANTO_GYMS.find((g) => g.id === gymId);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    if (!gym) {
      router.push('/journey/kanto/map');
      return;
    }

    const region = getRegionState(user.username, 'kanto');
    if (!region.team || region.team.length !== 6) {
      router.push('/journey/kanto/team');
      return;
    }

    // Enforce sequential unlocking: reject if any earlier gym isn't done yet.
    const priorGyms = KANTO_GYMS.filter((g) => g.order < gym.order);
    const allPriorDone = priorGyms.every((g) => region.completedGyms.includes(g.id));
    if (!allPriorDone || region.completedGyms.includes(gym.id)) {
      router.push('/journey/kanto/map');
      return;
    }

    async function setupBattle() {
      try {
        const playerMons = region.team!.map((p) => ({ ...p, currentHp: p.maxHp }));
        setPlayerTeam(playerMons);
        setPlayerActiveIdx(0);

        const gymLevel = Math.max(2, KANTO_LEVEL_CURVE[gym!.order] + KANTO_GYM_LEVEL_OFFSET);
        const opponents = await Promise.all(
          gym!.team.map((t) => fetchJourneyPokemon(t.pokemonId, gymLevel))
        );
        setOpponentTeam(opponents);
        setOpponentActiveIdx(0);
        setLogs([`${gym!.name} wants to battle!`]);
        setPhase('intro');
      } catch (err) {
        console.error('Failed to set up gym battle:', err);
        setErrorMsg('Could not load this gym battle. Please try again.');
      }
    }
    setupBattle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, gymId]);

  if (!user || !gym) return null;

  const playerMon = playerTeam[playerActiveIdx];
  const opponentMon = opponentTeam[opponentActiveIdx];

  const handleStartBattle = () => setPhase('battling');

  const handleMove = async (moveIdx: number) => {
    if (isProcessingTurn || !playerMon || !opponentMon) return;
    setIsProcessingTurn(true);

    const move = playerMon.moves[moveIdx];
    const updatedPlayerTeam = [...playerTeam];
    const updatedOpponentTeam = [...opponentTeam];
    const pMon = { ...updatedPlayerTeam[playerActiveIdx] };
    const oMon = { ...updatedOpponentTeam[opponentActiveIdx] };

    const result = resolveJourneyTurn(pMon, move, oMon);
    updatedPlayerTeam[playerActiveIdx] = pMon;
    updatedOpponentTeam[opponentActiveIdx] = oMon;
    setPlayerTeam(updatedPlayerTeam);
    setOpponentTeam(updatedOpponentTeam);
    setLogs((prev) => [...prev, ...result.logs]);

    await new Promise((r) => setTimeout(r, 900)); // brief pause so logs are readable

    if (result.opponentFainted) {
      const nextOpponentIdx = updatedOpponentTeam.findIndex((m, i) => i !== opponentActiveIdx && m.currentHp > 0);
      if (nextOpponentIdx === -1) {
        // Gym leader has no Pokémon left - victory!
        await handleVictory(updatedPlayerTeam);
        setIsProcessingTurn(false);
        return;
      }
      setOpponentActiveIdx(nextOpponentIdx);
      setLogs((prev) => [...prev, `${gym.name} sends out ${updatedOpponentTeam[nextOpponentIdx].name}!`]);
    }

    if (result.playerFainted) {
      const nextPlayerIdx = updatedPlayerTeam.findIndex((m, i) => i !== playerActiveIdx && m.currentHp > 0);
      if (nextPlayerIdx === -1) {
        setPhase('defeat');
        setIsProcessingTurn(false);
        return;
      }
      setNeedsSwitch(true);
    }

    setIsProcessingTurn(false);
  };

  const handleForcedSwitch = (idx: number) => {
    if (playerTeam[idx].currentHp <= 0) return;
    setPlayerActiveIdx(idx);
    setNeedsSwitch(false);
    setLogs((prev) => [...prev, `Go, ${playerTeam[idx].name}!`]);
  };

  const handleVictory = async (finalPlayerTeam: JourneyPokemon[]) => {
    if (!user) return;
    const nextCheckpointLevel = KANTO_LEVEL_CURVE[gym!.order]; // gym.order is 1-8, curve index matches

    const summary: typeof levelUpSummary = [];
    const releveled = await Promise.all(
      finalPlayerTeam.map(async (mon) => {
        let currentId = mon.pokemonId;
        let currentLevel = nextCheckpointLevel;
        let evolved = false;
        let newName: string | undefined;

        // Apply any evolutions this level threshold unlocks, chaining
        // through multiple stages if the new level clears more than one.
        let evoData = KANTO_EVOLUTION_MAP[currentId];
        while (evoData && evoData.to !== -1 && currentLevel >= evoData.level) {
          currentId = evoData.to;
          evolved = true;
          evoData = KANTO_EVOLUTION_MAP[currentId];
        }

        const relev = evolved
          ? await fetchJourneyPokemon(currentId, currentLevel)
          : await relevelJourneyPokemon(mon, currentLevel);

        if (evolved) newName = relev.name;

        summary.push({
          name: mon.name,
          fromLevel: mon.level,
          toLevel: currentLevel,
          evolved,
          newName,
        });

        return relev;
      })
    );

    updateTeam(user.username, 'kanto', releveled);
    markGymComplete(user.username, 'kanto', gym!.id);

    const isLastGym = gym!.order === KANTO_GYMS.length;
    if (isLastGym) {
      markRegionComplete(user.username, 'kanto');
    }

    setLevelUpSummary(summary);
    setPhase('victory');
  };

  const handleRetry = () => {
    setPlayerTeam((prev) => prev.map((p) => ({ ...p, currentHp: p.maxHp })));
    setOpponentTeam((prev) => prev.map((p) => ({ ...p, currentHp: p.maxHp })));
    setPlayerActiveIdx(0);
    setOpponentActiveIdx(0);
    setLogs([`${gym.name} wants to battle again!`]);
    setNeedsSwitch(false);
    setPhase('intro');
  };

  if (errorMsg) {
    return (
      <div className="journey-root min-h-screen flex items-center justify-center text-white p-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">{errorMsg}</p>
          <button
            onClick={() => router.push('/journey/kanto/map')}
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm"
          >
            Back to Map
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="journey-root min-h-screen flex items-center justify-center text-white">
        <p className="pixel-font text-sm animate-pulse text-yellow-300">Entering the Gym...</p>
      </div>
    );
  }

  return (
    <div className="journey-root min-h-screen p-4 md:p-8 text-white font-mono">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <span className="pixel-font text-[10px] text-yellow-300">{gym.gymName.toUpperCase()}</span>
          <span className="text-[10px] text-slate-400">Leader: {gym.name} ({gym.type})</span>
        </div>

        {phase === 'intro' && (
          <div className="bg-slate-800 border-2 border-yellow-500 rounded-2xl p-8 text-center">
            <p className="text-lg font-black uppercase mb-2">{gym.name}</p>
            <p className="text-sm text-slate-400 mb-6">"I've been waiting for a challenger like you!"</p>
            <button
              onClick={handleStartBattle}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase px-8 py-3 rounded-xl"
            >
              Begin Battle
            </button>
          </div>
        )}

        {(phase === 'battling') && playerMon && opponentMon && (
          <div className="bg-black rounded-xl border-4 border-slate-700 overflow-hidden">
            {/* Battlefield */}
            <div className="relative bg-gradient-to-b from-sky-300 to-sky-100 h-56">
              <div className="absolute top-4 left-4 bg-white/90 text-black rounded-lg p-2 w-48 shadow">
                <p className="text-xs font-bold uppercase">{opponentMon.name} Lv.{opponentMon.level}</p>
                <div className="h-2 bg-gray-300 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${(opponentMon.currentHp / opponentMon.maxHp) * 100}%` }}
                  />
                </div>
              </div>
              {opponentMon.spriteUrl && (
                <img
                  src={opponentMon.spriteUrl}
                  alt={opponentMon.name}
                  className="absolute top-8 right-8 w-24 h-24 object-contain"
                />
              )}
              <div className="absolute bottom-4 right-4 bg-white/90 text-black rounded-lg p-2 w-48 shadow">
                <p className="text-xs font-bold uppercase">{playerMon.name} Lv.{playerMon.level}</p>
                <div className="h-2 bg-gray-300 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${(playerMon.currentHp / playerMon.maxHp) * 100}%` }}
                  />
                </div>
              </div>
              {playerMon.spriteUrl && (
                <img
                  src={playerMon.spriteUrl}
                  alt={playerMon.name}
                  className="absolute bottom-8 left-8 w-28 h-28 object-contain scale-x-[-1]"
                />
              )}
            </div>

            {/* Log + Actions */}
            <div className="bg-stone-800 p-3 flex gap-3 h-40">
              <div className="w-1/2 bg-stone-100 text-gray-800 rounded-lg p-3 overflow-y-auto text-xs">
                {logs.slice(-6).map((l, i) => (
                  <p key={i} className="mb-1">▶ {l}</p>
                ))}
              </div>
              <div className="w-1/2">
                {needsSwitch ? (
                  <div className="bg-white rounded-lg p-2 h-full">
                    <p className="text-black text-[10px] font-bold uppercase mb-1">Choose next Pokémon!</p>
                    <div className="grid grid-cols-2 gap-1">
                      {playerTeam.map((p, idx) =>
                        p.currentHp > 0 && idx !== playerActiveIdx ? (
                          <button
                            key={idx}
                            onClick={() => handleForcedSwitch(idx)}
                            className="bg-gray-100 hover:bg-gray-200 text-black text-[9px] font-bold rounded p-1"
                          >
                            {p.name} Lv.{p.level}
                          </button>
                        ) : null
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1 h-full">
                    {playerMon.moves.map((m, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleMove(idx)}
                        disabled={isProcessingTurn}
                        className="bg-white hover:bg-gray-100 disabled:opacity-50 text-black rounded-lg p-1 flex flex-col items-center justify-center"
                      >
                        <span className="text-[10px] font-black uppercase">{m.name}</span>
                        <span className="text-[8px] text-gray-500 uppercase">{m.type} · {m.power}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {phase === 'victory' && (
          <div className="bg-slate-800 border-2 border-green-500 rounded-2xl p-8 text-center">
            <p className="pixel-font text-sm text-green-400 mb-4">GYM DEFEATED!</p>
            <p className="text-xs text-yellow-300 mb-6">🏅 {gym.badgeName} earned!</p>
            <div className="space-y-2 mb-6 text-left max-w-sm mx-auto">
              {levelUpSummary.map((s, i) => (
                <p key={i} className="text-xs text-slate-300">
                  {s.name} Lv.{s.fromLevel} → Lv.{s.toLevel}
                  {s.evolved && <span className="text-yellow-300"> · Evolved into {s.newName}!</span>}
                </p>
              ))}
            </div>
            <button
              onClick={() => router.push('/journey/kanto/map')}
              className="bg-green-500 hover:bg-green-400 text-black font-black uppercase px-8 py-3 rounded-xl"
            >
              Continue
            </button>
          </div>
        )}

        {phase === 'defeat' && (
          <div className="bg-slate-800 border-2 border-red-500 rounded-2xl p-8 text-center">
            <p className="pixel-font text-sm text-red-400 mb-4">DEFEATED...</p>
            <p className="text-xs text-slate-400 mb-6">Your team has fainted. Heal up and try again!</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRetry}
                className="bg-red-500 hover:bg-red-400 text-white font-black uppercase px-6 py-3 rounded-xl"
              >
                Retry
              </button>
              <button
                onClick={() => router.push('/journey/kanto/map')}
                className="bg-slate-600 hover:bg-slate-500 text-white font-black uppercase px-6 py-3 rounded-xl"
              >
                Back to Map
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .pixel-font { font-family: 'Press Start 2P', monospace; }
        .journey-root { background: radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 100%); }
      `}</style>
    </div>
  );
}