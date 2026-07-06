"use client";

import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';

// --- STATIC GEN 1 DICTIONARY ---
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
  "zapdos", "moltres", "dratini", "dragonair", "dragonite", "mewtwo", "mew"
];

const POKEMON_DATABASE = GEN1_NAMES.map((name, index) => ({
  id: index + 1,
  name: name,
  sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${index + 1}.png`
}));

const BASE_POKEMON_IDS = [
  1, 4, 7, 10, 13, 16, 19, 21, 23, 25, 27, 29, 32, 35, 37, 39, 41, 43, 46, 48, 50, 
  52, 54, 56, 58, 60, 63, 66, 69, 72, 74, 77, 79, 81, 83, 84, 86, 88, 90, 92, 96, 
  98, 100, 102, 104, 108, 109, 111, 114, 116, 118, 120, 127, 129, 131, 133, 137, 138, 140, 142, 143, 147
];

const EVOLUTION_MAP: Record<number, { to: number, level: number }> = {
  1: { to: 2, level: 16 }, 2: { to: 3, level: 32 },
  4: { to: 5, level: 16 }, 5: { to: 6, level: 36 },
  7: { to: 8, level: 16 }, 8: { to: 9, level: 36 },
  10: { to: 11, level: 7 }, 11: { to: 12, level: 10 },
  13: { to: 14, level: 7 }, 14: { to: 15, level: 10 },
  16: { to: 17, level: 18 }, 17: { to: 18, level: 36 },
  19: { to: 20, level: 20 }, 21: { to: 22, level: 20 }, 23: { to: 24, level: 22 },
  25: { to: 26, level: 30 }, 27: { to: 28, level: 22 },
  29: { to: 30, level: 16 }, 30: { to: 31, level: 36 },
  32: { to: 33, level: 16 }, 33: { to: 34, level: 36 },
  41: { to: 42, level: 22 }, 43: { to: 44, level: 21 }, 44: { to: 45, level: 40 },
  60: { to: 61, level: 25 }, 61: { to: 62, level: 40 },
  63: { to: 64, level: 16 }, 64: { to: 65, level: 36 },
  66: { to: 67, level: 28 }, 67: { to: 68, level: 40 },
  69: { to: 70, level: 21 }, 70: { to: 71, level: 40 },
  74: { to: 75, level: 25 }, 75: { to: 76, level: 40 },
  92: { to: 93, level: 25 }, 93: { to: 94, level: 40 },
  129: { to: 130, level: 20 }, 147: { to: 148, level: 30 }, 148: { to: 149, level: 55 },
};

const TRAINER_AVATARS = {
  boy: [
    "https://play.pokemonshowdown.com/sprites/trainers/red.png",
    "https://play.pokemonshowdown.com/sprites/trainers/ethan.png",
    "https://play.pokemonshowdown.com/sprites/trainers/brendan.png",
    "https://play.pokemonshowdown.com/sprites/trainers/lucas.png",
  ],
  girl: [
    "https://play.pokemonshowdown.com/sprites/trainers/leaf.png",
    "https://play.pokemonshowdown.com/sprites/trainers/lyra.png",
    "https://play.pokemonshowdown.com/sprites/trainers/may.png",
    "https://play.pokemonshowdown.com/sprites/trainers/dawn.png",
  ]
};

type PokemonMember = {
  baseId: number;
  currentId: number;
  name: string;
  sprite: string;
  xp: number;
  level: number;
} | null;

export default function DashboardPage() {
  const { user } = useUserStore() as any;
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [genderTab, setGenderTab] = useState<'boy' | 'girl'>('boy');
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);

  const [team, setTeam] = useState<PokemonMember[]>(Array(6).fill(null));
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUserXp, setLastUserXp] = useState<number | null>(null);
  
  const [loadedUsername, setLoadedUsername] = useState<string>('');

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    const usersDatabase = JSON.parse(localStorage.getItem('my_pokemon_users') || '{}');
    const savedUserData = usersDatabase[user.username];

    if (savedUserData) {
      setCurrentAvatar(savedUserData.avatar_url || null);
      setTeam(savedUserData.team || Array(6).fill(null));
      setLastUserXp(savedUserData.last_user_xp ?? user.xp ?? 0);
    } else {
      setCurrentAvatar(null);
      setTeam(Array(6).fill(null));
      setLastUserXp(user.xp ?? 0);
    }
    
    setLoadedUsername(user.username);
  }, [user, router]);

  useEffect(() => {
    if (!user || user.xp === undefined || lastUserXp === null || user.username !== loadedUsername) return;

    if (user.xp > lastUserXp) {
      const xpGained = user.xp - lastUserXp;

      setTeam(prevTeam => {
        const activeMembersCount = prevTeam.filter(Boolean).length;
        
        if (activeMembersCount === 0) {
          saveToDB({ last_user_xp: user.xp });
          setLastUserXp(user.xp);
          return prevTeam;
        }

        const xpPerPokemon = Math.floor(xpGained / activeMembersCount);
        const newTeam = prevTeam.map(member => {
          if (!member) return null;
          
          let newXp = member.xp + xpPerPokemon;
          let newLevel = 5 + Math.floor(newXp / 100);
          
          let currentId = member.currentId;
          let currentName = member.name;
          let currentSprite = member.sprite;

          let evoData = EVOLUTION_MAP[currentId];
          while (evoData && newLevel >= evoData.level) {
            const evolvedForm = POKEMON_DATABASE.find(p => p.id === evoData.to);
            if (evolvedForm) {
              currentId = evolvedForm.id;
              currentName = evolvedForm.name;
              currentSprite = evolvedForm.sprite;
            }
            evoData = EVOLUTION_MAP[currentId];
          }

          return {
            ...member,
            xp: newXp,
            level: newLevel,
            currentId,
            name: currentName,
            sprite: currentSprite
          };
        });

        saveToDB({ team: newTeam, last_user_xp: user.xp });
        setLastUserXp(user.xp);
        return newTeam;
      });
    }
  }, [user?.xp, lastUserXp, loadedUsername, user?.username]);

  const saveToDB = (updates: any) => {
    if (!user) return;
    const usersDatabase = JSON.parse(localStorage.getItem('my_pokemon_users') || '{}');
    usersDatabase[user.username] = { ...usersDatabase[user.username], ...updates };
    localStorage.setItem('my_pokemon_users', JSON.stringify(usersDatabase));
  };

  const handleSelectPokemon = (basePokemon: any) => {
    if (activeSlot === null) return;
    
    const newMember: PokemonMember = {
      baseId: basePokemon.id,
      currentId: basePokemon.id,
      name: basePokemon.name,
      sprite: basePokemon.sprite,
      xp: 0,
      level: 5
    };

    const newTeam = [...team];
    newTeam[activeSlot] = newMember;
    setTeam(newTeam);
    setIsTeamModalOpen(false);
    saveToDB({ team: newTeam });
  };

  const handleRemovePokemon = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTeam = [...team];
    newTeam[index] = null;
    setTeam(newTeam);
    saveToDB({ team: newTeam });
  };

  const filteredPokemon = useMemo(() => {
    return POKEMON_DATABASE.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) && BASE_POKEMON_IDS.includes(p.id)
    );
  }, [searchQuery]);

  const activePokemonCount = team.filter(Boolean).length;

  if (!user || user.username !== loadedUsername) return null;

  return (
    <div className="tcg-root min-h-screen px-4 py-10 md:py-14 text-slate-200">
      <div className="max-w-4xl mx-auto space-y-12">

        {/* ============ THE TRAINER CARD ============ */}
        <div className="foil-frame relative rounded-[28px] p-[3px] mx-auto max-w-2xl shadow-2xl">
          <div className="card-stock relative rounded-[25px] px-6 md:px-8 pt-6 pb-5 overflow-hidden">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div onClick={() => setIsModalOpen(true)} className="avatar-ring relative h-20 w-20 md:h-24 md:w-24 flex-shrink-0 rounded-full overflow-hidden cursor-pointer group bg-[#F7F1DE]">
                  {currentAvatar ? (
                    <img src={currentAvatar} alt="Trainer Avatar" className="w-full h-full object-contain p-2 image-pixelated" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><span className="card-display text-3xl text-[#8a6a2f] uppercase">{user.username.charAt(0)}</span></div>
                  )}
                  <div className="absolute inset-0 bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-white text-[10px] font-bold uppercase tracking-wider">Edit</span></div>
                </div>
                <div className="min-w-0">
                  <p className="card-label text-[10px] tracking-[0.25em] text-[#8a6a2f] mb-1">TRAINER CARD</p>
                  <h1 className="card-display text-2xl md:text-3xl text-[#20242f] truncate leading-tight">{user.username}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="type-pill">{user.title || 'Novice'}</span>
                    <span className="type-pill !bg-[#C9A84C] !text-[#14100c]">Total XP: {user.xp || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ TEAM BUILDER ============ */}
        <div className="felt-panel rounded-[28px] p-6 md:p-10 flex flex-col items-center relative overflow-hidden shadow-xl">
          <div className="w-full flex flex-col md:flex-row items-center justify-between mb-8 border-b border-[#3c6653] pb-6 gap-4">
            <div className="text-center md:text-left">
              <h3 className="card-display text-2xl text-[#F2E9CF] tracking-wide mb-1">Active Party</h3>
              <p className="text-[#9db8ac] text-xs font-bold tracking-[0.15em] uppercase">Roster: {activePokemonCount}/6 | XP Shared from Action Engine</p>
            </div>
            
            <button 
              onClick={() => {
                const firstEmpty = team.findIndex(p => p === null);
                if (firstEmpty !== -1) { setActiveSlot(firstEmpty); setIsTeamModalOpen(true); }
              }}
              disabled={activePokemonCount === 6}
              className="bg-[#2a4d8f] hover:bg-[#345ca8] disabled:opacity-50 text-[#F1E8CE] px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-colors border border-[#446bb3]"
            >
              + ADD PARTNER
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-3xl">
            {team.map((member, index) => (
              <div key={index} onClick={() => { setActiveSlot(index); setIsTeamModalOpen(true); }} className={`team-slot relative rounded-2xl border-2 transition-all cursor-pointer group shadow-inner h-36 flex flex-col items-center justify-center ${member ? "bg-[#F1E8CE]/10 border-[#C9A84C] hover:bg-[#F1E8CE]/20" : "border-dashed border-[#3c6653] bg-white/5 hover:bg-white/10 hover:border-[#528a70]"}`}>
                {member ? (
                  <>
                    <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[9px] text-white font-mono border border-white/20 z-10">
                      Lv.{member.level}
                    </div>
                    
                    <div className="relative w-16 h-16 mb-4 group-hover:scale-110 transition-transform">
                      <Image src={member.sprite} alt={member.name} width={64} height={64} priority className="object-contain drop-shadow-lg image-pixelated" />
                    </div>
                    
                    <div className="absolute bottom-0 left-0 w-full bg-black/50 py-1.5 px-2 rounded-b-xl backdrop-blur-sm border-t border-white/10">
                      <p className="text-[#F2E9CF] text-[10px] font-bold tracking-[0.1em] uppercase text-center mb-1">{member.name}</p>
                      <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#4ade80] h-full transition-all duration-500" style={{ width: `${(member.xp % 100)}%` }} />
                      </div>
                    </div>

                    <button onClick={(e) => handleRemovePokemon(index, e)} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity border-2 border-[#163229] z-20">×</button>
                  </>
                ) : (
                  <span className="text-[#9db8ac] text-[10px] font-bold tracking-[0.2em] group-hover:text-[#F2E9CF]">SLOT 0{index + 1}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ AVATAR MODAL ============ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c0906]/90 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card w-full max-w-2xl p-6 md:p-8 rounded-[24px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="card-display text-2xl text-center text-[#20242f] mb-6">Select Avatar</h3>
            <div className="flex gap-2 mb-6 max-w-xs mx-auto">
              <button onClick={() => setGenderTab('boy')} className={`type-toggle flex-1 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${genderTab === 'boy' ? 'type-toggle-active-boy' : ''}`}>Boy</button>
              <button onClick={() => setGenderTab('girl')} className={`type-toggle flex-1 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${genderTab === 'girl' ? 'type-toggle-active-girl' : ''}`}>Girl</button>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {TRAINER_AVATARS[genderTab].map((url, idx) => (
                <button key={idx} onClick={() => { setCurrentAvatar(url); setIsModalOpen(false); saveToDB({ avatar_url: url }); }} className="avatar-pick rounded-xl p-2 h-20 bg-[#F7F1DE] relative">
                  <img src={url} alt={`Avatar ${idx}`} className="h-full mx-auto object-contain image-pixelated" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============ SEARCH MODAL ============ */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c0906]/90 backdrop-blur-sm" onClick={() => setIsTeamModalOpen(false)}>
          <div className="modal-card w-full max-w-3xl h-[80vh] p-6 md:p-8 rounded-[24px] relative flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <h3 className="card-display text-2xl text-[#20242f]">Select a Base Partner</h3>
            </div>
            <input 
              type="text" placeholder="Search Database..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F7F1DE] border-2 border-[#d8cba5] rounded-xl px-4 py-3 mb-4 font-mono text-slate-800 focus:outline-none"
            />
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {filteredPokemon.map((poke) => (
                  <button key={poke.id} onClick={() => handleSelectPokemon(poke)} className="avatar-pick rounded-xl p-2 flex flex-col items-center justify-center h-28 bg-[#F7F1DE]">
                    <div className="relative w-14 h-14">
                      <Image src={poke.sprite} alt={poke.name} width={56} height={56} loading="lazy" className="object-contain image-pixelated" />
                    </div>
                    <span className="text-[10px] font-bold text-[#8a6a2f] uppercase mt-1 truncate w-full text-center">{poke.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setIsTeamModalOpen(false)} className="mt-4 w-full border border-[#d8cba5] py-3 rounded-xl uppercase text-sm font-bold text-[#8a6a2f]">Close</button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Inter:wght@400;500;600;700&display=swap');
        .tcg-root { font-family: 'Inter', ui-sans-serif, sans-serif; background: #14100c; }
        .card-display { font-family: 'Cinzel', serif; font-weight: 700; }
        .card-label { font-family: 'Inter', ui-sans-serif, sans-serif; font-weight: 700; }
        .foil-frame { background: linear-gradient(135deg, #F0D488 0%, #B9862F 35%, #F5E6B8 50%, #97721f 65%, #F0D488 100%); }
        .card-stock { background: linear-gradient(180deg, #FBF6E7 0%, #F1E8CE 100%); }
        .avatar-ring { box-shadow: 0 0 0 3px #FBF6E7, 0 0 0 5px #C9A84C; }
        .type-pill { background: #2a4d8f; color: #F1E8CE; font-size: 10px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; }
        .felt-panel { background: linear-gradient(180deg, #163229 0%, #101f19 100%); border: 1px solid #244638; }
        .modal-card { background: linear-gradient(180deg, #FBF6E7 0%, #F1E8CE 100%); border: 1px solid #d8cba5; }
        .type-toggle { background: #EDE3C8; color: #8a6a2f; border: 1px solid #d8cba5; }
        .type-toggle-active-boy { background: #2a4d8f; color: #F1E8CE; }
        .type-toggle-active-girl { background: #b5407a; color: #F1E8CE; }
        .avatar-pick { border: 2px solid #e3d6ae; cursor: pointer; }
        .avatar-pick:hover { border-color: #C9A84C; }
        .image-pixelated { image-rendering: pixelated; }
      `}</style>
    </div>
  );
}