"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUserStore } from '@/store/userStore';
import { KANTO_BASE_STAGE_IDS, KANTO_LEVEL_CURVE } from '../../data/kanto';
import { fetchJourneyPokemon } from '../../lib/pokemonFetch';
import { setTeam, getRegionState } from '../../lib/journeyStorage';
import type { JourneyPokemon } from '../../data/kanto';

// Gen 1 species names (index+1 = National Dex #), reused for the eligible
// selection list without needing a network call just to show names.
const GEN1_NAMES = [
  "bulbasaur", "ivysaur", "venusaur", "charmander", "charmeleon", "charizard",
  "squirtle", "wartortle", "blastoise", "caterpie", "metapod", "butterfree",
  "weedle", "kakuna", "beedrill", "pidgey", "pidgeotto", "pidgeot",
  "rattata", "raticate", "spearow", "fearow", "ekans", "arbok",
  "pikachu", "raichu", "sandshrew", "sandslash", "nidoran-f", "nidorina",
  "nidoqueen", "nidoran-m", "nidorino", "nidoking", "clefairy", "clefable",
  "vulpix", "ninetales", "jigglypuff", "wigglytuff", "zubat", "golbat",
  "oddish", "gloom", "vileplume", "paras", "parasect", "venonat",
  "venomoth", "diglett", "dugtrio", "meowth", "persian", "psyduck",
  "golduck", "mankey", "primeape", "growlithe", "arcanine", "poliwag",
  "poliwhirl", "poliwrath", "abra", "kadabra", "alakazam", "machop",
  "machoke", "machamp", "bellsprout", "weepinbell", "victreebel", "tentacool",
  "tentacruel", "geodude", "graveler", "golem", "ponyta", "rapidash",
  "slowpoke", "slowbro", "magnemite", "magneton", "farfetchd", "doduo",
  "dodrio", "seel", "dewgong", "grimer", "muk", "shellder",
  "cloyster", "gastly", "haunter", "gengar", "onix", "drowzee",
  "hypno", "krabby", "kingler", "voltorb", "electrode", "exeggcute",
  "exeggutor", "cubone", "marowak", "hitmonlee", "hitmonchan", "lickitung",
  "koffing", "weezing", "rhyhorn", "rhydon", "chansey", "tangela",
  "kangaskhan", "horsea", "seadra", "goldeen", "seaking", "staryu",
  "starmie", "mr-mime", "scyther", "jynx", "electabuzz", "magmar",
  "pinsir", "tauros", "magikarp", "gyarados", "lapras", "ditto",
  "eevee", "vaporeon", "jolteon", "flareon", "porygon", "omanyte",
  "omastar", "kabuto", "kabutops", "aerodactyl", "snorlax", "articuno",
  "zapdos", "moltres", "dratini", "dragonair", "dragonite", "mewtwo", "mew",
];

interface EligibleMon {
  id: number;
  name: string;
  sprite: string;
}

const ELIGIBLE_MONS: EligibleMon[] = KANTO_BASE_STAGE_IDS.map((id) => ({
  id,
  name: GEN1_NAMES[id - 1],
  sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
}));

export default function KantoTeamSelectPage() {
  const { user } = useUserStore() as any;
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    // If a team already exists for Kanto and the region isn't complete,
    // skip straight to the map instead of re-picking a team.
    const region = getRegionState(user.username, 'kanto');
    if (region.team && region.team.length === 6 && !region.regionComplete) {
      router.push('/journey/kanto/map');
      return;
    }
    setMounted(true);
  }, [user, router]);

  if (!mounted || !user) return null;

  const filtered = ELIGIBLE_MONS.filter((m) => m.name.includes(searchQuery.toLowerCase()));

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 6) return prev;
      return [...prev, id];
    });
  };

  const handleConfirm = async () => {
    if (selectedIds.length !== 6) {
      setError('Pick exactly 6 Pokémon to continue.');
      return;
    }
    setError(null);
    setIsConfirming(true);
    try {
      const startingLevel = KANTO_LEVEL_CURVE[0];
      const team: JourneyPokemon[] = await Promise.all(
        selectedIds.map((id) => fetchJourneyPokemon(id, startingLevel))
      );
      setTeam(user.username, 'kanto', team);
      router.push('/journey/kanto/map');
    } catch (err) {
      console.error('Failed to build Journey team:', err);
      setError('Something went wrong building your team. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="journey-root min-h-screen p-4 md:p-8 text-white">
      <div className="max-w-3xl mx-auto">
        <h1 className="pixel-font text-lg md:text-xl mb-2 text-yellow-300">Choose Your Journey Team</h1>
        <p className="text-sm text-slate-400 mb-1">
          Pick exactly 6 Kanto Pokémon at their first evolution stage. No legendaries or mythicals.
        </p>
        <p className="text-xs text-slate-500 mb-6">
          They'll start at Level {KANTO_LEVEL_CURVE[0]} and grow (and evolve!) as you clear each gym.
        </p>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search eligible Kanto Pokémon..."
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-yellow-400"
          />
          <span className="ml-4 text-sm font-bold text-yellow-300 whitespace-nowrap">
            {selectedIds.length}/6 selected
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-8 max-h-[50vh] overflow-y-auto pr-1">
          {filtered.map((mon) => {
            const isSelected = selectedIds.includes(mon.id);
            return (
              <button
                key={mon.id}
                onClick={() => toggleSelect(mon.id)}
                disabled={!isSelected && selectedIds.length >= 6}
                className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all disabled:opacity-30 ${
                  isSelected ? 'border-yellow-400 bg-yellow-400/10' : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                }`}
              >
                <Image src={mon.sprite} alt={mon.name} width={48} height={48} className="image-pixelated" />
                <span className="text-[9px] uppercase font-bold mt-1 truncate w-full text-center">{mon.name}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleConfirm}
          disabled={selectedIds.length !== 6 || isConfirming}
          className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black uppercase tracking-wide py-4 rounded-xl transition-colors"
        >
          {isConfirming ? 'Preparing Your Team...' : 'Confirm Team & Begin Journey'}
        </button>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .pixel-font { font-family: 'Press Start 2P', monospace; }
        .journey-root { background: radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 100%); }
        .image-pixelated { image-rendering: pixelated; }
      `}</style>
    </div>
  );
}