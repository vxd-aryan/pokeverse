'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// --- TypeScript Interfaces ---
interface Move {
  id: string;
  name: string;
  type: string;
  power: number;
}

interface Pokemon {
  id: string;
  name: string;
  current_hp: number;
  max_hp: number;
  moves: Move[];
  sprite_url?: string;
}

interface GameState {
  turn: number;
  active_pokemon: Pokemon;
  opponent_pokemon: Pokemon;
  status: 'ongoing' | 'finished' | 'abandoned';
  winner?: string;
  rematch_requested_by_me?: boolean;
  rematch_votes_count?: number;
}

interface BattleLog {
  text: string;
  timestamp: number;
}

// Local UI phase
type UiPhase =
  | 'connecting'
  | 'searching'
  | 'battling'
  | 'game_over'
  | 'opponent_left'
  | 'disconnected';

// --- Token Extraction Helper ---
const getTrainerToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('trainer_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('auth_token') ||
    null
  );
};

// --- Crash-Proof Token & Identifier Resolver ---
const getUserIdFromToken = (token: string): string | null => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return token;

  try {
    let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (payload.length % 4 !== 0) payload += '=';
    const decodedString = atob(payload);

    let jsonPayload = decodedString;
    try {
      jsonPayload = decodeURIComponent(
        decodedString
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch {}

    const decoded = JSON.parse(jsonPayload);
    return (
      decoded.userId ||
      decoded.user_id ||
      decoded.sub ||
      decoded.email ||
      decoded.id ||
      token
    );
  } catch (error) {
    console.warn('Could not parse JWT payload, defaulting to raw token:', error);
    return token;
  }
};

// --- Sprite Helper ---
const getPokemonSprite = (pokemon: Pokemon, isBack: boolean = false) => {
  if (pokemon.sprite_url) return pokemon.sprite_url;
  const safeName = pokemon.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (isBack) {
    return `https://play.pokemonshowdown.com/sprites/ani-back/${safeName}.gif`;
  }
  return `https://play.pokemonshowdown.com/sprites/ani/${safeName}.gif`;
};

export default function BattlePlayPage() {
  const router = useRouter();

  // --- State ---
  const [phase, setPhase] = useState<UiPhase>('connecting');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [logs, setLogs] = useState<BattleLog[]>([]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [opponentWantsRematch, setOpponentWantsRematch] = useState(false);
  const [iVotedRematch, setIVotedRematch] = useState(false);
  const [exitReason, setExitReason] = useState<string | null>(null);
  const [xpAwarded, setXpAwarded] = useState(false);

  // --- Refs ---
  const wsRef = useRef<WebSocket | null>(null);
  const phaseRef = useRef<UiPhase>('connecting');
  const gameStateRef = useRef<GameState | null>(null);
  const intentionalCloseRef = useRef(false);
  const maxRetries = 5;
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // --- Broadcast XP Changes to the Top Navbar ---
  useEffect(() => {
    if ((phase === 'game_over' || phase === 'opponent_left') && !xpAwarded) {
      let xpChange = 0;
      
      if (phase === 'opponent_left') {
        xpChange = 50; // Opponent fled/disconnected
      } else if (gameState) {
        const isVictory = gameState.winner === gameState.active_pokemon.id;
        xpChange = isVictory ? 50 : -15; // Win/Loss logic
      }

      if (xpChange !== 0) {
        // Dispatch event for the Navbar to pick up
        window.dispatchEvent(
          new CustomEvent('update-trainer-xp', { detail: { xpChange } })
        );
        setXpAwarded(true);
      }
    } else if (phase === 'battling' && xpAwarded) {
      // Reset flag for rematches
      setXpAwarded(false);
    }
  }, [phase, gameState, xpAwarded]);

  const connectWebSocket = useCallback((token: string, retryCount: number) => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//127.0.0.1:8000/api/battle/ws?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    intentionalCloseRef.current = false;

    ws.onopen = () => {
      setReconnectAttempts(0);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'connected':
            setPhase('searching');
            ws.send(JSON.stringify({ action: 'find_match' }));
            break;
          case 'state_update':
            if (data.state) {
              setGameState(data.state);
              if (data.state.status === 'ongoing') {
                setPhase('battling');
                setOpponentWantsRematch(false);
                setIVotedRematch(Boolean(data.state.rematch_requested_by_me));
              } else if (data.state.status === 'finished') {
                setPhase('game_over');
                setIVotedRematch(Boolean(data.state.rematch_requested_by_me));
              }
            }
            break;
          case 'log':
            if (data.log) setLogs((prev) => [...prev, data.log]);
            break;
          case 'game_over':
            setPhase('game_over');
            if (data.state) setGameState(data.state);
            break;
          case 'rematch_status':
            setOpponentWantsRematch(Boolean(data.opponent_wants_rematch));
            if (data.text) {
              setLogs((prev) => [...prev, { text: data.text, timestamp: Date.now() }]);
            }
            break;
          case 'rematch_declined':
          case 'opponent_left':
          case 'opponent_disconnected':
          case 'foe_disconnected':
            setExitReason(data.text || 'Foe disconnected from the battle.');
            setPhase('opponent_left');
            break;
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onclose = (event) => {
      if (intentionalCloseRef.current) return;
      if (retryCount < maxRetries) {
        const timeout = Math.pow(2, retryCount) * 1000;
        setTimeout(() => {
          setReconnectAttempts((prev) => prev + 1);
          connectWebSocket(token, retryCount + 1);
        }, timeout);
      } else {
        setPhase('disconnected');
      }
    };
  }, []);

  useEffect(() => {
    const token = getTrainerToken();
    if (!token || !getUserIdFromToken(token)) {
      router.push('/battle');
      return;
    }

    connectWebSocket(token, 0);

    return () => {
      if (wsRef.current) {
        intentionalCloseRef.current = true;
        wsRef.current.close();
      }
    };
  }, [connectWebSocket, router]);

  const handleMove = (moveId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'use_move', moveId }));
    }
  };

  const handleRematch = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'rematch' }));
      setIVotedRematch(true);
    }
  };

  const handleExit = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'exit' }));
    }
    intentionalCloseRef.current = true;
    wsRef.current?.close();
    router.push('/battle');
  };

  const getHpColor = (current: number, max: number) => {
    const ratio = current / max;
    if (ratio > 0.5) return 'bg-emerald-400';
    if (ratio > 0.2) return 'bg-yellow-400';
    return 'bg-red-500';
  };

  // --- Early Return Fallback Screens ---
  if (phase === 'connecting') {
    return (
      <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center bg-[#1c2331] text-white font-mono">
        <div className="text-center animate-pulse">
          <p className="text-xl">Connecting to Battle Server...</p>
        </div>
      </div>
    );
  }

  if (phase === 'disconnected') {
    return (
      <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center bg-[#1c2331] text-white font-mono">
        <div className="text-center bg-red-900/50 p-8 rounded-lg border-2 border-red-500">
          <h2 className="text-2xl font-bold mb-4">Connection Lost</h2>
          <button onClick={() => router.push('/battle')} className="bg-white text-black px-6 py-2 rounded font-bold hover:bg-gray-200">
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bob {
          animation: bob 3s infinite ease-in-out;
        }
      `}</style>

      <div className="min-h-[calc(100vh-64px)] bg-[#1c2331] flex items-center justify-center p-4 font-mono select-none">
        
        {/* --- BATTLE INTERFACE --- */}
        <div className="w-full max-w-4xl bg-gray-300 p-2 rounded-3xl shadow-2xl border-b-8 border-gray-400">
          <div className="bg-gray-800 p-6 rounded-2xl shadow-inner border-4 border-gray-900">
            
            <div className="bg-black rounded-lg overflow-hidden border-8 border-gray-700 aspect-[4/3] flex flex-col relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
              
              {gameState ? (
                <>
                  {/* --- BATTLEFIELD SCENE --- */}
                  <div className="relative flex-grow bg-gradient-to-b from-sky-300 to-sky-100 overflow-hidden">
                    
                    {/* Background Elements */}
                    <div className="absolute top-10 left-10 w-32 h-12 bg-white/40 rounded-full blur-md"></div>
                    <div className="absolute top-16 right-20 w-48 h-16 bg-white/40 rounded-full blur-md"></div>

                    {/* Opponent Pokemon */}
                    <div className="absolute top-[25%] right-[10%] w-[45%] h-[15%] bg-green-500/80 rounded-[50%] border-t-8 border-green-400 shadow-[inset_0_-10px_20px_rgba(0,100,0,0.4)]">
                      <img 
                        src={getPokemonSprite(gameState.opponent_pokemon, false)}
                        alt={gameState.opponent_pokemon.name}
                        className={`absolute bottom-[20%] left-1/2 -translate-x-1/2 w-40 h-40 object-contain drop-shadow-2xl ${phase === 'opponent_left' ? 'grayscale opacity-60' : 'animate-bob'}`}
                      />
                    </div>
                    
                    {/* Opponent HP */}
                    <div className="absolute top-6 left-6 w-[40%] bg-stone-100 border-4 border-gray-600 rounded-bl-2xl rounded-tr-xl p-3 shadow-xl transform skew-x-[-5deg]">
                      <div className="transform skew-x-[5deg]">
                        <div className="flex justify-between items-end mb-1 border-b-2 border-gray-300 pb-1">
                          <h3 className="font-bold uppercase tracking-widest text-gray-800 text-sm md:text-lg">
                            {gameState.opponent_pokemon.name}
                          </h3>
                          <span className="text-xs font-bold text-gray-600">Lv50</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-black text-yellow-500 bg-gray-800 px-1 rounded">HP</span>
                          <div className="flex-grow bg-gray-700 h-3 rounded-full overflow-hidden p-[2px] shadow-inner">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${getHpColor(
                                gameState.opponent_pokemon.current_hp,
                                gameState.opponent_pokemon.max_hp
                              )}`}
                              style={{ width: `${(gameState.opponent_pokemon.current_hp / gameState.opponent_pokemon.max_hp) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Player Pokemon */}
                    <div className="absolute bottom-[20%] left-[5%] w-[55%] h-[20%] bg-green-500/90 rounded-[50%] border-t-8 border-green-400 shadow-[inset_0_-10px_20px_rgba(0,100,0,0.5)]">
                      <img 
                        src={getPokemonSprite(gameState.active_pokemon, true)}
                        alt={gameState.active_pokemon.name}
                        className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-56 h-56 object-contain drop-shadow-2xl animate-bob"
                      />
                    </div>

                    {/* Player HP Box */}
                    <div className="absolute bottom-28 right-6 w-[45%] bg-stone-100 border-4 border-gray-600 rounded-tl-2xl rounded-br-xl p-3 shadow-xl transform skew-x-[-5deg]">
                      <div className="transform skew-x-[5deg]">
                        <div className="flex justify-between items-end mb-1 border-b-2 border-gray-300 pb-1">
                          <h3 className="font-bold uppercase tracking-widest text-gray-800 text-sm md:text-lg">
                            {gameState.active_pokemon.name}
                          </h3>
                          <span className="text-xs font-bold text-gray-600">Lv50</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-black text-yellow-500 bg-gray-800 px-1 rounded">HP</span>
                          <div className="flex-grow bg-gray-700 h-3 rounded-full overflow-hidden p-[2px] shadow-inner">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${getHpColor(
                                gameState.active_pokemon.current_hp,
                                gameState.active_pokemon.max_hp
                              )}`}
                              style={{ width: `${(gameState.active_pokemon.current_hp / gameState.active_pokemon.max_hp) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right text-xs font-black text-gray-700 mt-1">
                          {gameState.active_pokemon.current_hp} / {gameState.active_pokemon.max_hp}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- BOTTOM UI: Logs & Actions --- */}
                  <div className="h-48 bg-stone-800 border-t-8 border-stone-900 flex p-3 gap-3 relative z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
                    
                    {/* Battle Logs */}
                    <div className="w-1/2 bg-stone-100 border-[6px] border-double border-gray-500 rounded-xl p-4 overflow-y-auto custom-scrollbar shadow-inner text-gray-800 font-bold text-sm md:text-base leading-relaxed">
                      {logs.length === 0 ? (
                        <p className="animate-pulse">Waiting for battle to start...</p>
                      ) : (
                        logs.map((log, i) => (
                          <p key={i} className="mb-2">
                            <span className="text-red-600 mr-2">▶</span>{log.text}
                          </p>
                        ))
                      )}
                      <div ref={logsEndRef} />
                    </div>

                    {/* Action Menu / Results Screens */}
                    <div className="w-1/2 bg-white rounded-xl border-[6px] border-double border-blue-900 p-2 shadow-inner">
                      {phase === 'opponent_left' ? (
                        <div className="flex flex-col items-center justify-center h-full p-2 space-y-1 text-center font-sans tracking-wide">
                          <h2 className="text-xl md:text-2xl font-black uppercase text-[#00b34d] mb-1">
                            VICTORY!
                          </h2>
                          <div className="text-[#00b34d] font-bold text-sm md:text-md">
                            +50 XP
                          </div>
                          <div className="grid grid-cols-2 gap-3 w-full mt-4">
                            <button
                              disabled
                              className="bg-[#00cc55] border-b-[5px] border-[#009940] text-white px-2 py-3 rounded-xl font-bold uppercase text-xs md:text-sm opacity-50 cursor-not-allowed"
                            >
                              REMATCH
                            </button>
                            <button
                              onClick={handleExit}
                              className="bg-[#ff3333] border-b-[5px] border-[#cc0000] text-white px-2 py-3 rounded-xl hover:bg-[#ff4d4d] hover:border-b-4 hover:translate-y-[1px] font-bold uppercase text-xs md:text-sm active:translate-y-[5px] active:border-b-0 transition-all"
                            >
                              RUN AWAY
                            </button>
                          </div>
                        </div>
                      ) : phase === 'game_over' ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-2 font-sans tracking-wide">
                          {(() => {
                            const isVictory = gameState.winner === gameState.active_pokemon.id;
                            return (
                              <>
                                <h2 className={`text-xl md:text-2xl font-black uppercase ${isVictory ? 'text-[#00b34d]' : 'text-[#ff0000]'}`}>
                                  {isVictory ? 'VICTORY!' : 'DEFEAT!'}
                                </h2>
                                <div className={`font-bold text-sm md:text-md ${isVictory ? 'text-[#00b34d]' : 'text-[#ff0000]'}`}>
                                  {isVictory ? '+50 XP' : '-15 XP'}
                                </div>
                              </>
                            );
                          })()}

                          <div className="grid grid-cols-2 gap-3 w-full mt-4 px-2">
                            <button
                              onClick={handleRematch}
                              disabled={iVotedRematch}
                              className={`px-2 py-3 rounded-xl font-bold uppercase text-xs md:text-sm transition-all ${
                                iVotedRematch 
                                  ? 'bg-gray-400 border-b-[5px] border-gray-500 text-gray-200 opacity-80' 
                                  : 'bg-[#00cc55] border-b-[5px] border-[#009940] text-white hover:bg-[#00e660] hover:border-b-4 hover:translate-y-[1px] active:translate-y-[5px] active:border-b-0'
                              }`}
                            >
                              {iVotedRematch ? 'WAITING...' : 'REMATCH'}
                            </button>
                            <button
                              onClick={handleExit}
                              className="bg-[#ff3333] border-b-[5px] border-[#cc0000] text-white px-2 py-3 rounded-xl hover:bg-[#ff4d4d] hover:border-b-4 hover:translate-y-[1px] font-bold uppercase text-xs md:text-sm active:translate-y-[5px] active:border-b-0 transition-all"
                            >
                              RUN AWAY
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full">
                          {gameState.active_pokemon.moves.map((move, idx) => {
                            const getMoveColor = (idx: number) => {
                              const colors = [
                                'bg-red-100 border-red-400 hover:bg-red-200', 
                                'bg-blue-100 border-blue-400 hover:bg-blue-200', 
                                'bg-green-100 border-green-400 hover:bg-green-200', 
                                'bg-yellow-100 border-yellow-400 hover:bg-yellow-200'
                              ];
                              return colors[idx % 4];
                            };

                            return (
                              <button
                                key={move.id}
                                onClick={() => handleMove(move.id)}
                                disabled={phase !== 'battling'}
                                className={`${getMoveColor(idx)} border-4 rounded-lg p-2 flex flex-col justify-center items-center transition-transform disabled:opacity-50 shadow-sm active:scale-95`}
                              >
                                <span className="font-black text-gray-800 text-sm md:text-md uppercase tracking-wide">
                                  {move.name}
                                </span>
                                <div className="flex justify-between w-full mt-1 px-1 text-[10px] text-gray-600 font-bold uppercase">
                                  <span>{move.type}</span>
                                  <span>PP {move.power}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-white bg-gray-900 font-bold space-y-4">
                  <div className="w-16 h-16 border-4 border-white rounded-full relative overflow-hidden bg-white/20 animate-spin">
                    <div className="absolute top-0 w-full h-1/2 bg-red-500"></div>
                    <div className="absolute bottom-0 w-full h-1/2 bg-white"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gray-900 rounded-full border-2 border-white z-10"></div>
                    <div className="absolute top-1/2 w-full h-1 bg-gray-900 transform -translate-y-1/2"></div>
                  </div>
                  <p className="text-xl animate-pulse tracking-widest uppercase">
                    {logs.length > 0 ? logs[logs.length - 1].text : 'Entering Arena...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}