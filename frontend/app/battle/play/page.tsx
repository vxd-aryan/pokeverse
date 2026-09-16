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

interface TeamSlot {
  index: number;
  name: string;
  sprite_url: string;
  types?: string[];
  current_hp: number;
  max_hp: number;
  fainted: boolean;
  is_active: boolean;
}

interface GameState {
  turn: number;
  active_pokemon: Pokemon;
  opponent_pokemon: Pokemon;
  my_team?: TeamSlot[];
  opponent_team?: TeamSlot[];
  status: 'ongoing' | 'finished' | 'abandoned';
  must_switch?: boolean;
  opponent_must_switch?: boolean;
  action_locked?: boolean;
  winner?: string;
  rematch_requested_by_me?: boolean;
  rematch_votes_count?: number;
}

interface BattleLog {
  text: string;
  timestamp: number;
}

type UiPhase =
  | 'connecting'
  | 'select_pokemon'
  | 'searching'
  | 'battling'
  | 'game_over'
  | 'opponent_left'
  | 'disconnected';

interface RosterSearchResult {
  id: number;
  name: string;
}

interface RosterMoveOption {
  move_key: string;
  name: string;
  type: string;
  power: number;
}

interface RosterPokemonDetail {
  id: number;
  name: string;
  hp: number;
  sprite_url: string;
  moves: RosterMoveOption[];
}

// One confirmed party member in the pre-battle builder.
interface PartyPick {
  id: number;
  name: string;
  sprite_url: string;
  hp: number;
  moveKeys: string[];
  moveNames: string[];
}

const MAX_PARTY = 3;
const API_BASE = 'https://pokeverse-backend1.onrender.com';

// --- Token Extraction Helper ---
const getTrainerToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  if (token && token.includes('.')) return token;
  return null;
};

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
    return decoded.userId || decoded.user_id || decoded.sub || decoded.email || decoded.id || token;
  } catch (error) {
    console.warn('Could not parse JWT payload, defaulting to raw token:', error);
    return token;
  }
};

const getPokemonSprite = (pokemon: Pokemon, isBack: boolean = false) => {
  if (pokemon.sprite_url) return pokemon.sprite_url;
  const safeName = pokemon.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (isBack) return `https://play.pokemonshowdown.com/sprites/ani-back/${safeName}.gif`;
  return `https://play.pokemonshowdown.com/sprites/ani/${safeName}.gif`;
};

export default function BattlePlayPage() {
  const router = useRouter();

  // --- State ---
  const [phase, setPhase] = useState<UiPhase>('connecting');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [logs, setLogs] = useState<BattleLog[]>([]);
  const [, setReconnectAttempts] = useState(0);
  const [opponentWantsRematch, setOpponentWantsRematch] = useState(false);
  const [iVotedRematch, setIVotedRematch] = useState(false);
  const [exitReason, setExitReason] = useState<string | null>(null);
  const [isWaitingForTurn, setIsWaitingForTurn] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [showSwitchPanel, setShowSwitchPanel] = useState(false);

  // --- Team Builder State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RosterSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<RosterPokemonDetail | null>(null);
  const [isLoadingSpecies, setIsLoadingSpecies] = useState(false);
  const [selectedMoveKeys, setSelectedMoveKeys] = useState<string[]>([]);
  const [party, setParty] = useState<PartyPick[]>([]);
  const [teamBuilderError, setTeamBuilderError] = useState<string | null>(null);
  const [searchTakingTooLong, setSearchTakingTooLong] = useState(false);

  // --- Battle Animation State ---
  const [attackingSide, setAttackingSide] = useState<'mine' | 'theirs' | null>(null);
  const [hitSide, setHitSide] = useState<'mine' | 'theirs' | null>(null);
  const [isCritHit, setIsCritHit] = useState(false);
  const [faintedSide, setFaintedSide] = useState<'mine' | 'theirs' | null>(null);
  const [floatingDamage, setFloatingDamage] = useState<{ side: 'mine' | 'theirs'; amount: number; key: number } | null>(null);
  const [battleBanner, setBattleBanner] = useState<{ text: string; key: number } | null>(null);
  const lastProcessedLogIndexRef = useRef(0);

  // --- Refs ---
  const wsRef = useRef<WebSocket | null>(null);
  const phaseRef = useRef<UiPhase>('connecting');
  const gameStateRef = useRef<GameState | null>(null);
  const partyRef = useRef<PartyPick[]>([]);
  const intentionalCloseRef = useRef(false);
  const maxRetries = 5;
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { partyRef.current = party; }, [party]);
  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  // Reset animation state at the start of a fresh match or rematch.
  useEffect(() => {
    if (gameState?.turn === 1) {
      setFaintedSide(null);
      setHitSide(null);
      setAttackingSide(null);
      setIsCritHit(false);
      setFloatingDamage(null);
      setBattleBanner(null);
      lastProcessedLogIndexRef.current = 0;
    }
  }, [gameState?.turn, gameState?.active_pokemon?.name, gameState?.opponent_pokemon?.name]);

  // A newly sent-out Pokémon should never inherit the previous one's faint animation.
  useEffect(() => {
    setFaintedSide(null);
    setHitSide(null);
    setAttackingSide(null);
  }, [gameState?.active_pokemon?.name, gameState?.opponent_pokemon?.name]);

  // Stuck-search safety net.
  useEffect(() => {
    if (phase !== 'searching') {
      setSearchTakingTooLong(false);
      return;
    }
    const timeoutId = setTimeout(() => setSearchTakingTooLong(true), 15000);
    return () => clearTimeout(timeoutId);
  }, [phase]);

  const animationQueueRef = useRef<BattleLog[]>([]);
  const isProcessingQueueRef = useRef(false);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const animateLogEntry = async (entry: BattleLog) => {
    const text = entry.text;
    const current = gameStateRef.current;
    if (!current) return;
    const myName = current.active_pokemon.name;
    const opponentName = current.opponent_pokemon.name;

    const usedMatch = text.match(/^(.+) used (.+)!$/);
    if (usedMatch) {
      const attacker = usedMatch[1];
      const side: 'mine' | 'theirs' | null =
        attacker === myName ? 'mine' : attacker === opponentName ? 'theirs' : null;
      if (side) {
        setAttackingSide(side);
        await sleep(500);
        setAttackingSide(null);
        await sleep(150);
      }
      return;
    }

    if (text === 'A critical hit!') {
      setIsCritHit(true);
      setBattleBanner({ text: 'Critical Hit!', key: Date.now() });
      await sleep(700);
      setBattleBanner(null);
      await sleep(150);
      return;
    }

    if (text === "It's super effective!") {
      setBattleBanner({ text: 'Super Effective!', key: Date.now() });
      await sleep(700);
      setBattleBanner(null);
      await sleep(150);
      return;
    }

    if (text === "It's not very effective...") {
      setBattleBanner({ text: 'Not Very Effective...', key: Date.now() });
      await sleep(700);
      setBattleBanner(null);
      await sleep(150);
      return;
    }

    if (text.match(/^It had no effect on (.+)!$/)) {
      setBattleBanner({ text: 'No Effect!', key: Date.now() });
      await sleep(700);
      setBattleBanner(null);
      await sleep(150);
      return;
    }

    const damageMatch = text.match(/^(.+) took (\d+) damage!$/);
    if (damageMatch) {
      const defender = damageMatch[1];
      const amount = parseInt(damageMatch[2], 10);
      const side: 'mine' | 'theirs' | null =
        defender === myName ? 'mine' : defender === opponentName ? 'theirs' : null;
      if (side) {
        setHitSide(side);
        setFloatingDamage({ side, amount, key: Date.now() });
        await sleep(600);
        setHitSide(null);
        setIsCritHit(false);
        await sleep(300);
        setFloatingDamage(null);
        await sleep(250);
      }
      return;
    }

    const faintMatch = text.match(/^(.+) fainted!$/);
    if (faintMatch) {
      const fainter = faintMatch[1];
      const side: 'mine' | 'theirs' | null =
        fainter === myName ? 'mine' : fainter === opponentName ? 'theirs' : null;
      if (side) {
        setFaintedSide(side);
        await sleep(900);
      }
      return;
    }

    // Switch-in lines get a short beat so the sprite swap reads clearly.
    if (text.match(/^(.+) was sent out!$/) || text.match(/was withdrawn!/)) {
      await sleep(450);
    }
  };

  const drainAnimationQueue = async () => {
    isProcessingQueueRef.current = true;
    while (animationQueueRef.current.length > 0) {
      const entry = animationQueueRef.current.shift();
      if (entry) await animateLogEntry(entry);
    }
    isProcessingQueueRef.current = false;
  };

  useEffect(() => {
    if (!gameState) return;
    const newEntries = logs.slice(lastProcessedLogIndexRef.current);
    lastProcessedLogIndexRef.current = logs.length;
    if (newEntries.length === 0) return;

    animationQueueRef.current.push(...newEntries);
    if (!isProcessingQueueRef.current) drainAnimationQueue();
  }, [logs, gameState]);

  // --- Broadcast XP Changes to the Top Navbar ---
  useEffect(() => {
    if ((phase === 'game_over' || phase === 'opponent_left') && !xpAwarded) {
      let xpChange = 0;

      if (phase === 'opponent_left') {
        xpChange = 50;
      } else if (gameState) {
        const isVictory = gameState.winner === gameState.active_pokemon.id;
        const isDraw = !gameState.winner;
        xpChange = isDraw ? 0 : isVictory ? 50 : -15;
      }

      if (xpChange !== 0) {
        window.dispatchEvent(new CustomEvent('update-trainer-xp', { detail: { xpChange } }));
      }
      setXpAwarded(true);
    } else if (phase === 'battling' && xpAwarded) {
      setXpAwarded(false);
    }
  }, [phase, gameState, xpAwarded]);

  const connectWebSocket = useCallback((token: string, retryCount: number) => {
    try {
      const wsUrl = `wss://pokeverse-backend1.onrender.com/api/battle/ws?token=${encodeURIComponent(token)}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      intentionalCloseRef.current = false;

      ws.onopen = () => {
        setReconnectAttempts(0);
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: 'ping' }));
        }, 30000);
        ws.addEventListener('close', () => clearInterval(pingInterval));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'connected':
              setPhase('select_pokemon');
              break;

            case 'state_update':
              if (data.state) {
                setGameState(data.state);
                // The server is the source of truth for whether this
                // trainer still owes an action this turn.
                setIsWaitingForTurn(Boolean(data.state.action_locked));
                if (data.state.must_switch) {
                  setShowSwitchPanel(true);
                } else if (!data.state.action_locked) {
                  setShowSwitchPanel(false);
                }
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
              setIsWaitingForTurn(false);
              setShowSwitchPanel(false);
              if (data.state) setGameState(data.state);
              break;

            case 'rematch_status':
              setOpponentWantsRematch(Boolean(data.opponent_wants_rematch));
              if (data.text) setLogs((prev) => [...prev, { text: data.text, timestamp: Date.now() }]);
              break;

            case 'rematch_declined':
            case 'opponent_left':
            case 'opponent_disconnected':
            case 'foe_disconnected':
              setExitReason(data.text || 'Foe disconnected from the battle.');
              setPhase('opponent_left');
              setIsWaitingForTurn(false);
              setShowSwitchPanel(false);
              break;

            case 'error':
              console.error('WebSocket error:', data.message);
              if (data.message?.includes('auth')) setPhase('disconnected');
              break;
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (error) => console.error('WebSocket error event:', error);

      ws.onclose = () => {
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
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setPhase('disconnected');
    }
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

  // --- Battle actions ---
  const handleMove = (moveId: string) => {
    if (gameState?.must_switch) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !isWaitingForTurn) {
      setIsWaitingForTurn(true);
      setShowSwitchPanel(false);
      wsRef.current.send(JSON.stringify({ action: 'use_move', moveId }));
    }
  };

  const handleSwitch = (index: number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const forced = Boolean(gameState?.must_switch);
    if (!forced && isWaitingForTurn) return;

    // A forced (post-faint) switch is free; a voluntary one uses this turn.
    if (!forced) setIsWaitingForTurn(true);
    setShowSwitchPanel(false);
    wsRef.current.send(JSON.stringify({ action: 'switch', index }));
  };

  // --- Team Builder Handlers ---
  const runRosterSearch = async (query: string) => {
    setTeamBuilderError(null);
    setIsSearching(true);
    try {
      const res = await fetch(`${API_BASE}/api/battle/roster/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Roster search failed:', err);
      setTeamBuilderError('Could not search the Pokédex right now. Try again.');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (selectedSpecies) return;
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timeoutId = setTimeout(() => runRosterSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedSpecies]);

  const handleSearchPokemon = async (e: React.FormEvent) => {
    e.preventDefault();
    await runRosterSearch(searchQuery.trim());
  };

  const handleSelectSpecies = async (pokemonId: number) => {
    setTeamBuilderError(null);
    setIsLoadingSpecies(true);
    setSelectedSpecies(null);
    setSelectedMoveKeys([]);
    try {
      const res = await fetch(`${API_BASE}/api/battle/roster/${pokemonId}`);
      if (!res.ok) throw new Error('Failed to load Pokémon details');
      const data: RosterPokemonDetail = await res.json();
      setSelectedSpecies(data);
    } catch (err) {
      console.error('Failed to load species detail:', err);
      setTeamBuilderError("Could not load that Pokémon's moves. Try another.");
    } finally {
      setIsLoadingSpecies(false);
    }
  };

  const handleToggleMove = (moveKey: string) => {
    setSelectedMoveKeys((prev) => {
      if (prev.includes(moveKey)) return prev.filter((k) => k !== moveKey);
      if (prev.length >= 4) return prev;
      return [...prev, moveKey];
    });
  };

  const clearSpeciesDraft = () => {
    setSelectedSpecies(null);
    setSelectedMoveKeys([]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleAddToParty = () => {
    if (!selectedSpecies || selectedMoveKeys.length === 0) return;
    if (party.length >= MAX_PARTY) return;
    if (party.some((p) => p.id === selectedSpecies.id)) {
      setTeamBuilderError('That Pokémon is already in your party.');
      return;
    }

    const moveNames = selectedMoveKeys.map(
      (key) => selectedSpecies.moves.find((m) => m.move_key === key)?.name || key
    );

    setParty((prev) => [
      ...prev,
      {
        id: selectedSpecies.id,
        name: selectedSpecies.name,
        sprite_url: selectedSpecies.sprite_url,
        hp: selectedSpecies.hp,
        moveKeys: [...selectedMoveKeys],
        moveNames,
      },
    ]);
    clearSpeciesDraft();
  };

  const handleRemoveFromParty = (index: number) => {
    setParty((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMovePartyMember = (index: number, direction: -1 | 1) => {
    setParty((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const sendFindMatch = useCallback(() => {
    const currentParty = partyRef.current;
    if (currentParty.length === 0) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    setPhase('searching');
    wsRef.current.send(
      JSON.stringify({
        action: 'find_match',
        selection: {
          team: currentParty.map((p) => ({ pokemon_id: p.id, moves: p.moveKeys })),
        },
      })
    );
  }, []);

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
    const ratio = max > 0 ? current / max : 0;
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
          <p className="text-sm mb-4">Failed to connect to battle server. Please try again.</p>
          <button onClick={() => router.push('/battle')} className="bg-white text-black px-6 py-2 rounded font-bold hover:bg-gray-200">
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'select_pokemon') {
    const partyFull = party.length >= MAX_PARTY;

    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#1c2331] text-white font-mono p-4">
        <div className="max-w-3xl mx-auto pb-10">
          <h1 className="text-2xl font-black uppercase tracking-widest mb-1">Build Your Party</h1>
          <p className="text-sm text-gray-400 mb-6">
            Choose up to {MAX_PARTY} Pokémon in battle order. The one at the top leads. You can switch mid-battle,
            but a switch uses your turn.
          </p>

          {teamBuilderError && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 text-sm rounded-lg p-3 mb-4">
              {teamBuilderError}
            </div>
          )}

          {/* --- Current party --- */}
          <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-300">
                Your Party
              </h2>
              <span className="text-xs text-gray-400">{party.length}/{MAX_PARTY}</span>
            </div>

            {party.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">
                No Pokémon added yet — search below and add your lead.
              </p>
            ) : (
              <div className="space-y-2">
                {party.map((member, index) => (
                  <div
                    key={`${member.id}-${index}`}
                    className="flex items-center gap-3 bg-gray-900 border border-gray-700 rounded-lg p-2"
                  >
                    <span className={`text-[10px] font-black px-2 py-1 rounded ${index === 0 ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}>
                      {index === 0 ? 'LEAD' : `#${index + 1}`}
                    </span>
                    {member.sprite_url && (
                      <img src={member.sprite_url} alt={member.name} className="w-12 h-12 object-contain" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm uppercase truncate">{member.name}</div>
                      <div className="text-[10px] text-gray-400 truncate">
                        HP {member.hp} · {member.moveNames.join(', ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMovePartyMember(index, -1)}
                        disabled={index === 0}
                        className="w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-xs"
                        aria-label="Move up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleMovePartyMember(index, 1)}
                        disabled={index === party.length - 1}
                        className="w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-xs"
                        aria-label="Move down"
                      >
                        ▼
                      </button>
                      <button
                        onClick={() => handleRemoveFromParty(index)}
                        className="w-7 h-7 rounded bg-red-600 hover:bg-red-500 text-xs font-bold"
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={sendFindMatch}
              disabled={party.length === 0}
              className="w-full mt-4 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed py-3 rounded-xl font-black uppercase tracking-wide"
            >
              Confirm Party &amp; Find Match
            </button>
            {party.length > 0 && party.length < MAX_PARTY && (
              <p className="text-[10px] text-gray-500 text-center mt-2">
                You can queue with {party.length}; empty slots are filled with random Pokémon.
              </p>
            )}
          </div>

          {/* --- Add a member --- */}
          {!partyFull && (
            <>
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-300 mb-2">
                Add Pokémon {party.length + 1}
              </h2>

              <form onSubmit={handleSearchPokemon} className="relative mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Start typing a Pokémon's name..."
                    autoComplete="off"
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-red-400"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="bg-red-500 hover:bg-red-400 disabled:opacity-50 px-4 py-2 rounded-lg font-bold text-sm uppercase"
                  >
                    {isSearching ? '...' : 'Search'}
                  </button>
                </div>

                {searchQuery.trim() && !selectedSpecies && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl max-h-72 overflow-y-auto">
                    {isSearching && searchResults.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-400 animate-pulse">Searching...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((p) => {
                        const alreadyPicked = party.some((m) => m.id === p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            disabled={alreadyPicked}
                            onClick={() => {
                              handleSelectSpecies(p.id);
                              setSearchQuery(p.name);
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors border-b border-gray-700 last:border-b-0"
                          >
                            {p.name}
                            {alreadyPicked && <span className="text-[10px] text-gray-500 ml-2">in party</span>}
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">No Pokémon found.</div>
                    )}
                  </div>
                )}
              </form>

              {isLoadingSpecies && (
                <div className="text-center text-sm text-gray-400 animate-pulse py-6">Loading moves...</div>
              )}

              {selectedSpecies && (
                <div className="bg-gray-800 border border-gray-600 rounded-xl p-4">
                  <div className="flex items-center gap-4 mb-4">
                    {selectedSpecies.sprite_url && (
                      <img src={selectedSpecies.sprite_url} alt={selectedSpecies.name} className="w-20 h-20 object-contain" />
                    )}
                    <div>
                      <h2 className="text-lg font-black uppercase">{selectedSpecies.name}</h2>
                      <p className="text-xs text-gray-400">HP: {selectedSpecies.hp}</p>
                      <button
                        onClick={clearSpeciesDraft}
                        className="text-xs text-red-400 hover:text-red-300 underline mt-1"
                      >
                        Choose a different Pokémon
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mb-2">
                    Pick up to 4 moves ({selectedMoveKeys.length}/4 selected):
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {selectedSpecies.moves.map((move) => {
                      const isSelected = selectedMoveKeys.includes(move.move_key);
                      return (
                        <button
                          key={move.move_key}
                          onClick={() => handleToggleMove(move.move_key)}
                          disabled={!isSelected && selectedMoveKeys.length >= 4}
                          className={`border-2 rounded-lg p-2 text-left transition-colors disabled:opacity-40 ${
                            isSelected ? 'bg-red-500/20 border-red-400' : 'bg-gray-900 border-gray-700 hover:border-gray-500'
                          }`}
                        >
                          <div className="font-bold text-sm">{move.name}</div>
                          <div className="text-[10px] text-gray-400 uppercase">
                            {move.type} · Power {move.power}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleAddToParty}
                    disabled={selectedMoveKeys.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed py-3 rounded-xl font-black uppercase tracking-wide"
                  >
                    Add to Party
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  const mustSwitch = Boolean(gameState?.must_switch);
  const myTeam = gameState?.my_team || [];
  const opponentTeam = gameState?.opponent_team || [];
  const switchableCount = myTeam.filter((m) => !m.fainted && !m.is_active).length;

  return (
    <>
      <style>{`
        @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .animate-bob { animation: bob 3s infinite ease-in-out; }

        @keyframes attackLungeRight { 0% { transform: translateX(0); } 40% { transform: translateX(-24px) scale(1.05); } 100% { transform: translateX(0); } }
        @keyframes attackLungeLeft { 0% { transform: translateX(0); } 40% { transform: translateX(24px) scale(1.05); } 100% { transform: translateX(0); } }
        .animate-attack-lunge-left { animation: attackLungeRight 0.45s ease-in-out; }
        .animate-attack-lunge-right { animation: attackLungeLeft 0.45s ease-in-out; }

        @keyframes hitShake {
          0%, 100% { transform: translateX(0); filter: brightness(1); }
          20% { transform: translateX(-6px); filter: brightness(2.2) saturate(0); }
          40% { transform: translateX(6px); filter: brightness(2.2) saturate(0); }
          60% { transform: translateX(-4px); filter: brightness(1.4); }
          80% { transform: translateX(4px); filter: brightness(1.4); }
        }
        .animate-hit-shake { animation: hitShake 0.45s ease-in-out; }
        .animate-hit-shake-crit { animation: hitShake 0.45s ease-in-out 2; }

        @keyframes faintDrop {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; filter: grayscale(0); }
          100% { transform: translateY(40px) rotate(8deg); opacity: 0; filter: grayscale(1); }
        }
        .animate-faint-drop { animation: faintDrop 0.7s ease-in forwards; }

        @keyframes floatDamage {
          0% { transform: translateY(0); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(-40px); opacity: 0; }
        }
        .animate-float-damage { animation: floatDamage 1s ease-out forwards; }

        @keyframes bannerPop {
          0% { transform: scale(0.6) translateY(10px); opacity: 0; }
          20% { transform: scale(1.1) translateY(0); opacity: 1; }
          80% { transform: scale(1) translateY(0); opacity: 1; }
          100% { transform: scale(1) translateY(-6px); opacity: 0; }
        }
        .animate-banner-pop { animation: bannerPop 0.9s ease-out forwards; }

        @keyframes sendOut {
          0% { transform: translateY(30px) scale(0.5); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-send-out { animation: sendOut 0.4s ease-out; }
      `}</style>

      {battleBanner && (
        <div
          key={battleBanner.key}
          className="fixed top-1/3 left-1/2 -translate-x-1/2 z-[60] pointer-events-none animate-banner-pop"
        >
          <span className="text-2xl md:text-4xl font-black uppercase tracking-wider text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {battleBanner.text}
          </span>
        </div>
      )}

      <div className="min-h-[calc(100vh-64px)] bg-[#1c2331] flex items-center justify-center p-4 font-mono select-none">
        <div className="w-full max-w-4xl bg-gray-300 p-2 rounded-3xl shadow-2xl border-b-8 border-gray-400">
          <div className="bg-gray-800 p-6 rounded-2xl shadow-inner border-4 border-gray-900">
            <div className="bg-black rounded-lg overflow-hidden border-8 border-gray-700 aspect-[4/3] flex flex-col relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
              {gameState ? (
                <>
                  {/* --- BATTLEFIELD SCENE --- */}
                  <div className="relative flex-grow bg-gradient-to-b from-sky-300 to-sky-100 overflow-hidden">
                    <div className="absolute top-10 left-10 w-32 h-12 bg-white/40 rounded-full blur-md"></div>
                    <div className="absolute top-16 right-20 w-48 h-16 bg-white/40 rounded-full blur-md"></div>

                    {/* Party indicator: opponent (top-right), mine (bottom-left) */}
                    <div className="absolute top-3 right-4 flex gap-1.5 z-20">
                      {opponentTeam.map((slot) => (
                        <span
                          key={slot.index}
                          title={slot.fainted ? `${slot.name} (fainted)` : slot.name}
                          className={`w-3.5 h-3.5 rounded-full border-2 ${
                            slot.fainted
                              ? 'bg-gray-400 border-gray-600'
                              : slot.is_active
                              ? 'bg-red-500 border-red-800'
                              : 'bg-white border-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="absolute bottom-3 left-4 flex gap-1.5 z-20">
                      {myTeam.map((slot) => (
                        <span
                          key={slot.index}
                          title={slot.fainted ? `${slot.name} (fainted)` : slot.name}
                          className={`w-3.5 h-3.5 rounded-full border-2 ${
                            slot.fainted
                              ? 'bg-gray-400 border-gray-600'
                              : slot.is_active
                              ? 'bg-emerald-500 border-emerald-800'
                              : 'bg-white border-gray-600'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Opponent Pokemon */}
                    <div className="absolute top-[25%] right-[10%] w-[45%] h-[15%] bg-green-500/80 rounded-[50%] border-t-8 border-green-400 shadow-[inset_0_-10px_20px_rgba(0,100,0,0.4)]">
                      <img
                        key={gameState.opponent_pokemon.name}
                        src={getPokemonSprite(gameState.opponent_pokemon, false)}
                        alt={gameState.opponent_pokemon.name}
                        className={`absolute bottom-[20%] left-1/2 -translate-x-1/2 w-40 h-40 object-contain drop-shadow-2xl ${
                          phase === 'opponent_left' || faintedSide === 'theirs'
                            ? faintedSide === 'theirs' ? 'animate-faint-drop' : 'grayscale opacity-60'
                            : attackingSide === 'theirs'
                            ? 'animate-attack-lunge-right'
                            : hitSide === 'theirs'
                            ? (isCritHit ? 'animate-hit-shake-crit' : 'animate-hit-shake')
                            : 'animate-bob'
                        }`}
                      />
                      {floatingDamage && floatingDamage.side === 'theirs' && (
                        <span
                          key={floatingDamage.key}
                          className="absolute top-1/4 left-1/2 -translate-x-1/2 text-2xl font-black text-red-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] animate-float-damage pointer-events-none"
                        >
                          -{floatingDamage.amount}
                        </span>
                      )}
                    </div>

                    {/* Opponent HP */}
                    <div className="absolute top-6 left-6 w-[40%] bg-stone-100 border-4 border-gray-600 rounded-bl-2xl rounded-tr-xl p-3 shadow-xl transform skew-x-[-5deg]">
                      <div className="transform skew-x-[5deg]">
                        <div className="flex justify-between items-end mb-1 border-b-2 border-gray-300 pb-1">
                          <h3 className="font-bold uppercase tracking-widest text-gray-800 text-sm md:text-lg truncate">
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
                        key={gameState.active_pokemon.name}
                        src={getPokemonSprite(gameState.active_pokemon, true)}
                        alt={gameState.active_pokemon.name}
                        className={`absolute bottom-[20%] left-1/2 -translate-x-1/2 w-56 h-56 object-contain drop-shadow-2xl ${
                          faintedSide === 'mine'
                            ? 'animate-faint-drop'
                            : attackingSide === 'mine'
                            ? 'animate-attack-lunge-left'
                            : hitSide === 'mine'
                            ? (isCritHit ? 'animate-hit-shake-crit' : 'animate-hit-shake')
                            : 'animate-bob'
                        }`}
                      />
                      {floatingDamage && floatingDamage.side === 'mine' && (
                        <span
                          key={floatingDamage.key}
                          className="absolute top-1/4 left-1/2 -translate-x-1/2 text-2xl font-black text-red-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] animate-float-damage pointer-events-none"
                        >
                          -{floatingDamage.amount}
                        </span>
                      )}
                    </div>

                    {/* Player HP Box */}
                    <div className="absolute bottom-28 right-6 w-[45%] bg-stone-100 border-4 border-gray-600 rounded-tl-2xl rounded-br-xl p-3 shadow-xl transform skew-x-[-5deg]">
                      <div className="transform skew-x-[5deg]">
                        <div className="flex justify-between items-end mb-1 border-b-2 border-gray-300 pb-1">
                          <h3 className="font-bold uppercase tracking-widest text-gray-800 text-sm md:text-lg truncate">
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
                          <h2 className="text-xl md:text-2xl font-black uppercase text-[#00b34d] mb-1">VICTORY!</h2>
                          <div className="text-gray-600 font-bold text-xs md:text-sm">
                            {exitReason || 'Foe left the battle.'}
                          </div>
                          <div className="text-[#00b34d] font-bold text-sm md:text-md">+50 XP</div>
                          <div className="grid grid-cols-2 gap-3 w-full mt-2">
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
                        <div className="flex flex-col items-center justify-center h-full space-y-1 font-sans tracking-wide">
                          {(() => {
                            const isVictory = gameState.winner === gameState.active_pokemon.id;
                            const isDraw = !gameState.winner;

                            if (isDraw) {
                              return (
                                <>
                                  <h2 className="text-xl md:text-2xl font-black uppercase text-yellow-500">DRAW!</h2>
                                  <div className="font-bold text-sm md:text-md text-yellow-500">+0 XP</div>
                                </>
                              );
                            }

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

                          {opponentWantsRematch && (
                            <div className="text-xs font-bold text-blue-600 animate-pulse mt-1">
                              Opponent requested a rematch!
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3 w-full mt-2 px-2">
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
                      ) : mustSwitch || showSwitchPanel ? (
                        <div className="flex flex-col h-full">
                          <div className="text-center mb-1">
                            <span className="text-[11px] font-black uppercase tracking-wider text-blue-900">
                              {mustSwitch ? 'Choose your next Pokémon' : 'Switch (uses your turn)'}
                            </span>
                          </div>
                          <div className="flex-1 grid grid-cols-1 gap-1.5 overflow-y-auto">
                            {myTeam.map((slot) => {
                              const disabled = slot.fainted || slot.is_active;
                              return (
                                <button
                                  key={slot.index}
                                  onClick={() => handleSwitch(slot.index)}
                                  disabled={disabled}
                                  className={`flex items-center gap-2 border-2 rounded-lg px-2 py-1 text-left transition-colors ${
                                    disabled
                                      ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
                                      : 'bg-blue-50 border-blue-400 hover:bg-blue-100 active:scale-95'
                                  }`}
                                >
                                  {slot.sprite_url && (
                                    <img src={slot.sprite_url} alt={slot.name} className="w-8 h-8 object-contain" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[11px] font-black uppercase text-gray-800 truncate">
                                      {slot.name}
                                      {slot.is_active && <span className="text-[9px] text-gray-500 ml-1">(out)</span>}
                                      {slot.fainted && <span className="text-[9px] text-red-500 ml-1">(fainted)</span>}
                                    </div>
                                    <div className="w-full bg-gray-300 h-1.5 rounded-full overflow-hidden mt-0.5">
                                      <div
                                        className={`h-full ${getHpColor(slot.current_hp, slot.max_hp)}`}
                                        style={{ width: `${(slot.current_hp / slot.max_hp) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                  <span className="text-[9px] font-bold text-gray-600">
                                    {slot.current_hp}/{slot.max_hp}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          {!mustSwitch && (
                            <button
                              onClick={() => setShowSwitchPanel(false)}
                              className="mt-1 text-[10px] font-bold uppercase text-gray-500 hover:text-gray-700"
                            >
                              ← Back to moves
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col h-full gap-1.5">
                          <div className="grid grid-cols-2 grid-rows-2 gap-2 flex-1">
                            {gameState.active_pokemon.moves.map((move, idx) => {
                              const colors = [
                                'bg-red-100 border-red-400 hover:bg-red-200',
                                'bg-blue-100 border-blue-400 hover:bg-blue-200',
                                'bg-green-100 border-green-400 hover:bg-green-200',
                                'bg-yellow-100 border-yellow-400 hover:bg-yellow-200',
                              ];

                              return (
                                <button
                                  key={move.id}
                                  onClick={() => handleMove(move.id)}
                                  disabled={phase !== 'battling' || isWaitingForTurn}
                                  className={`${colors[idx % 4]} border-4 rounded-lg p-1 flex flex-col justify-center items-center transition-transform disabled:opacity-50 shadow-sm active:scale-95`}
                                >
                                  <span className="font-black text-gray-800 text-xs md:text-sm uppercase tracking-wide text-center leading-tight">
                                    {move.name}
                                  </span>
                                  <div className="flex justify-between w-full mt-0.5 px-1 text-[9px] text-gray-600 font-bold uppercase">
                                    <span>{move.type}</span>
                                    <span>PWR {move.power}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          <button
                            onClick={() => setShowSwitchPanel(true)}
                            disabled={phase !== 'battling' || isWaitingForTurn || switchableCount === 0}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-1.5 text-[11px] font-black uppercase tracking-wider transition-colors"
                          >
                            {switchableCount === 0 ? 'No Switches Left' : `Switch Pokémon (${switchableCount})`}
                          </button>
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
                  {searchTakingTooLong && (
                    <div className="flex flex-col items-center gap-2 pt-2">
                      <p className="text-xs text-gray-400 normal-case tracking-normal text-center max-w-xs">
                        This is taking longer than usual - the match server may have hit a snag.
                      </p>
                      <button
                        onClick={sendFindMatch}
                        className="bg-red-500 hover:bg-red-400 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide"
                      >
                        Retry Find Match
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}