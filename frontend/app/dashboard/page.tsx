"use client";

import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, type ReactElement } from 'react';
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

// ============================================================
// ORIGINAL BADGE CASE — custom badges, unlocked every 5 levels.
// These are entirely original designs/names, not tied to any
// existing game's gym badges.
// ============================================================

interface BadgeDef {
  level: number;
  name: string;
  blurb: string;
  primary: string;
  secondary: string;
  icon: (props: { className?: string }) => ReactElement;
}

const SparkEmblemIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className}>
    <circle cx="20" cy="20" r="18" fill="currentColor" opacity="0.15" />
    <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M22 6 L11 22 H18 L16 34 L29 16 H21 Z" fill="currentColor" />
  </svg>
);

const LeafRingIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className}>
    <circle cx="20" cy="20" r="18" fill="currentColor" opacity="0.15" />
    <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
    <path
      d="M20 8 C28 10 30 20 20 32 C10 20 12 10 20 8 Z"
      fill="currentColor"
    />
    <path d="M20 12 V28" stroke="#0009" strokeWidth="1.5" />
  </svg>
);

const TideShellIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className}>
    <circle cx="20" cy="20" r="18" fill="currentColor" opacity="0.15" />
    <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
    <path
      d="M12 26 C12 16 16 10 20 10 C24 10 28 16 28 26 C24 23 16 23 12 26 Z"
      fill="currentColor"
    />
    <circle cx="20" cy="17" r="2.2" fill="#0009" />
  </svg>
);

const EmberCoreIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className}>
    <circle cx="20" cy="20" r="18" fill="currentColor" opacity="0.15" />
    <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
    <path
      d="M20 8 C24 14 28 17 24 24 C26 22 27 20 27 20 C28 27 22 32 17 30 C12 28 12 22 15 19 C15 22 17 22 17 22 C15 17 17 11 20 8 Z"
      fill="currentColor"
    />
  </svg>
);

const FrostShardIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className}>
    <circle cx="20" cy="20" r="18" fill="currentColor" opacity="0.15" />
    <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M20 7 L28 20 L20 33 L12 20 Z" fill="currentColor" />
    <path d="M20 7 V33 M12 20 H28" stroke="#0009" strokeWidth="1" />
  </svg>
);

const BastionSealIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className}>
    <circle cx="20" cy="20" r="18" fill="currentColor" opacity="0.15" />
    <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
    <path
      d="M20 8 L31 14 V26 L20 32 L9 26 V14 Z"
      fill="currentColor"
    />
    <path d="M20 8 V32 M9 14 L31 26 M31 14 L9 26" stroke="#0006" strokeWidth="1" />
  </svg>
);

const NightwingCrestIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className}>
    <circle cx="20" cy="20" r="18" fill="currentColor" opacity="0.15" />
    <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
    <path
      d="M20 12 C14 12 9 16 6 20 C11 20 15 22 18 26 C16 20 17 15 20 12 Z"
      fill="currentColor"
    />
    <path
      d="M20 12 C26 12 31 16 34 20 C29 20 25 22 22 26 C24 20 23 15 20 12 Z"
      fill="currentColor"
    />
  </svg>
);

const RadiantZenithIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className}>
    <circle cx="20" cy="20" r="18" fill="currentColor" opacity="0.15" />
    <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
    {Array.from({ length: 8 }).map((_, i) => {
      const angle = (i * Math.PI) / 4;
      const x = 20 + Math.cos(angle) * 12;
      const y = 20 + Math.sin(angle) * 12;
      return <circle key={i} cx={x} cy={y} r="2.4" fill="currentColor" />;
    })}
    <circle cx="20" cy="20" r="6" fill="currentColor" />
  </svg>
);

const BADGES: BadgeDef[] = [
  { level: 5, name: "Spark Emblem", blurb: "Awarded for reaching Level 5.", primary: "#eab308", secondary: "#fef08a", icon: SparkEmblemIcon },
  { level: 10, name: "Leaf Ring", blurb: "Awarded for reaching Level 10.", primary: "#22c55e", secondary: "#bbf7d0", icon: LeafRingIcon },
  { level: 15, name: "Tide Shell", blurb: "Awarded for reaching Level 15.", primary: "#0ea5e9", secondary: "#bae6fd", icon: TideShellIcon },
  { level: 20, name: "Ember Core", blurb: "Awarded for reaching Level 20.", primary: "#f97316", secondary: "#fed7aa", icon: EmberCoreIcon },
  { level: 25, name: "Frost Shard", blurb: "Awarded for reaching Level 25.", primary: "#22d3ee", secondary: "#cffafe", icon: FrostShardIcon },
  { level: 30, name: "Bastion Seal", blurb: "Awarded for reaching Level 30.", primary: "#a8785a", secondary: "#e7d3c4", icon: BastionSealIcon },
  { level: 35, name: "Nightwing Crest", blurb: "Awarded for reaching Level 35.", primary: "#a855f7", secondary: "#e9d5ff", icon: NightwingCrestIcon },
  { level: 40, name: "Radiant Zenith", blurb: "Awarded for reaching Level 40.", primary: "#facc15", secondary: "#fef9c3", icon: RadiantZenithIcon },
];

function TrainerCard({
  user,
  currentAvatar,
  team,
  onAvatarClick,
  onSlotClick,
  onRemoveSlot,
}: {
  user: any;
  currentAvatar: string | null;
  team: PokemonMember[];
  onAvatarClick: () => void;
  onSlotClick: (index: number) => void;
  onRemoveSlot: (index: number, e: React.MouseEvent) => void;
}) {
  const [hoveredBadgeIdx, setHoveredBadgeIdx] = useState<number | null>(null);
  const [hoveredSlotIdx, setHoveredSlotIdx] = useState<number | null>(null);
  const level = user.level || 1;
  const earnedCount = BADGES.filter((b) => level >= b.level).length;
  const rosterCount = team.filter(Boolean).length;

  return (
    <div className="trainer-card-frame rounded-[18px] p-2 mx-auto max-w-2xl shadow-2xl">
      <div className="trainer-card-stripes rounded-[12px] overflow-hidden relative">
        {/* Header banner */}
        <div className="flex items-center justify-between px-4 pt-4">
          <div className="trainer-banner-plaque px-4 py-1.5">
            <span className="pixel-font text-[11px] md:text-xs text-white tracking-wider">TRAINER CARD</span>
          </div>
          <span className="pixel-font text-[9px] md:text-[10px] text-[#2d5a3a]/70">LV.{level}</span>
        </div>

        {/* Name row */}
        <div className="px-4 mt-4 flex items-center gap-2">
          <span className="w-2.5 h-6 bg-[#4ade80] flex-shrink-0" />
          <span className="pixel-font text-[10px] md:text-xs text-[#2d5a3a]">NAME</span>
          <span className="pixel-font text-base md:text-xl text-[#1c3826] truncate">{user.username?.toUpperCase()}</span>
        </div>
        <div className="mx-4 mt-2 border-b-2 border-[#2d5a3a]/30" />

        {/* Body: interactive team slots left, portrait right */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <span className="pixel-font text-[9px] md:text-[10px] text-[#2d5a3a]">TEAM</span>
            <span className="pixel-font text-[8px] md:text-[9px] text-[#2d5a3a]/70">{rosterCount}/6</span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {team.map((member, idx) => (
                <div
                  key={idx}
                  className="group relative"
                  onMouseEnter={() => setHoveredSlotIdx(idx)}
                  onMouseLeave={() => setHoveredSlotIdx(null)}
                >
                  <button
                    type="button"
                    onClick={() => onSlotClick(idx)}
                    className={`trainer-team-slot w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 ${
                      member ? 'trainer-team-slot-filled' : 'trainer-team-slot-empty'
                    }`}
                  >
                    {member ? (
                      <Image
                        src={member.sprite}
                        alt={member.name}
                        width={44}
                        height={44}
                        className="object-contain image-pixelated drop-shadow"
                      />
                    ) : (
                      <span className="pixel-font text-[#2d5a3a]/40 text-base">+</span>
                    )}
                  </button>

                  {member && (
                    <>
                      <span className="absolute -top-1 -right-1 bg-black/70 text-white text-[7px] font-mono px-1.5 py-0.5 rounded-full border border-white/30 pointer-events-none z-10">
                        Lv{member.level}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => onRemoveSlot(idx, e)}
                        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/60 z-20"
                        aria-label={`Remove ${member.name}`}
                      >
                        ×
                      </button>
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-9 h-1 bg-black/30 rounded-full overflow-hidden pointer-events-none">
                        <div
                          className="h-full bg-[#4ade80] transition-all duration-500"
                          style={{ width: `${member.xp % 100}%` }}
                        />
                      </div>
                    </>
                  )}

                  {hoveredSlotIdx === idx && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap bg-[#20140a] border border-[#5a4326] rounded-lg px-2 py-1.5 shadow-xl pointer-events-none">
                      {member ? (
                        <>
                          <p className="text-[10px] font-bold text-[#F2E9CF] uppercase">{member.name}</p>
                          <p className="text-[8px] text-[#c9b28c] mt-0.5">Level {member.level} · tap to swap</p>
                        </>
                      ) : (
                        <p className="text-[9px] font-bold text-[#F2E9CF] uppercase">+ Add Partner</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={onAvatarClick}
              className="trainer-portrait-ring relative w-24 h-24 md:w-28 md:h-28 rounded-full flex-shrink-0 flex items-center justify-center group"
            >
              {currentAvatar ? (
                <img src={currentAvatar} alt="Trainer" className="w-[85%] h-[85%] object-contain image-pixelated" />
              ) : (
                <span className="pixel-font text-2xl text-[#1c3826]">{user.username?.charAt(0).toUpperCase()}</span>
              )}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-[9px] font-bold uppercase tracking-wider">Edit</span>
              </div>
            </button>
          </div>
        </div>

        {/* Badge strip */}
        <div className="trainer-badge-strip px-4 py-3 mt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="pixel-font text-[10px] md:text-xs text-white">BADGES</span>
            <span className="pixel-font text-[8px] md:text-[9px] text-white/70">{earnedCount}/{BADGES.length}</span>
          </div>
          <div className="flex items-center justify-between gap-1.5 md:gap-2">
            {BADGES.map((badge, idx) => {
              const earned = level >= badge.level;
              const Icon = badge.icon;
              return (
                <div
                  key={badge.level}
                  className="relative flex-1"
                  onMouseEnter={() => setHoveredBadgeIdx(idx)}
                  onMouseLeave={() => setHoveredBadgeIdx(null)}
                >
                  <div
                    className={`trainer-badge-tile aspect-square rounded-lg flex items-center justify-center transition-all ${
                      earned ? 'trainer-badge-tile-earned' : 'trainer-badge-tile-locked'
                    }`}
                    style={earned ? ({ '--badge-color': badge.primary } as React.CSSProperties) : undefined}
                  >
                    <Icon className={`w-5 h-5 md:w-7 md:h-7 ${earned ? '' : 'opacity-40 grayscale'}`} />
                  </div>

                  {hoveredBadgeIdx === idx && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 w-32 bg-[#20140a] border border-[#5a4326] rounded-lg p-2 shadow-xl text-center pointer-events-none">
                      <p className="text-[10px] font-bold text-[#F2E9CF]">{badge.name}</p>
                      <p className="text-[8px] text-[#c9b28c] mt-0.5">
                        {earned ? badge.blurb : `Reach Level ${badge.level}`}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

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

  const saveToDB = (updates: Record<string, any>) => {
    if (!user || !user.username) return;

    try {
      const rawData = localStorage.getItem('my_pokemon_users');
      const usersDatabase = rawData ? JSON.parse(rawData) : {};

      usersDatabase[user.username] = {
        ...(usersDatabase[user.username] || {}),
        ...updates,
      };

      localStorage.setItem('my_pokemon_users', JSON.stringify(usersDatabase));
    } catch (error) {
      console.error('Failed to save user data to localStorage:', error);
    }
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

  const handleSlotClick = (index: number) => {
    setActiveSlot(index);
    setIsTeamModalOpen(true);
  };

  const filteredPokemon = useMemo(() => {
    return POKEMON_DATABASE.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) && BASE_POKEMON_IDS.includes(p.id)
    );
  }, [searchQuery]);

  if (!user || user.username !== loadedUsername) return null;

  return (
    <div className="tcg-root min-h-screen px-4 py-10 md:py-14 text-slate-200">
      <div className="max-w-4xl mx-auto space-y-12">

        {/* ============ THE TRAINER CARD ============ */}
        <TrainerCard
          user={user}
          currentAvatar={currentAvatar}
          team={team}
          onAvatarClick={() => setIsModalOpen(true)}
          onSlotClick={handleSlotClick}
          onRemoveSlot={handleRemovePokemon}
        />
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
            <div className="text-center mb-6 flex items-center justify-between">
              <h3 className="card-display text-2xl text-[#20242f]">Select a Base Partner</h3>
              {activeSlot !== null && team[activeSlot] && (
                <button
                  onClick={(e) => { handleRemovePokemon(activeSlot, e); setIsTeamModalOpen(false); }}
                  className="text-[11px] font-bold uppercase tracking-wider text-red-600 hover:text-red-700 border border-red-300 hover:bg-red-50 rounded-full px-3 py-1.5 transition-colors"
                >
                  Remove Current
                </button>
              )}
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
        .modal-card { background: linear-gradient(180deg, #FBF6E7 0%, #F1E8CE 100%); border: 1px solid #d8cba5; }
        .type-toggle { background: #EDE3C8; color: #8a6a2f; border: 1px solid #d8cba5; }
        .type-toggle-active-boy { background: #2a4d8f; color: #F1E8CE; }
        .type-toggle-active-girl { background: #b5407a; color: #F1E8CE; }
        .avatar-pick { border: 2px solid #e3d6ae; cursor: pointer; }
        .avatar-pick:hover { border-color: #C9A84C; }
        .image-pixelated { image-rendering: pixelated; }

        /* --- Badge Case --- */
        .badge-case {
          background: linear-gradient(180deg, #3a2412 0%, #241407 100%);
          border: 1px solid #5a4326;
        }
        .badge-slot-locked {
          background: radial-gradient(circle, #2a1c10 0%, #1a1108 100%);
          border: 2px solid #4a3620;
        }
        .badge-slot-earned {
          background: radial-gradient(circle, var(--badge-color) 0%, #1a1108 120%);
          border: 2px solid var(--badge-color);
          color: #fff8e7;
          box-shadow: 0 0 12px -2px var(--badge-color), inset 0 0 8px rgba(255,255,255,0.25);
        }
        .badge-slot-locked svg { color: #4a3620; }
        .badge-shine {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%);
          background-size: 250% 250%;
          background-position: 100% 0;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .badge-slot-earned:hover .badge-shine {
          opacity: 1;
          animation: badgeShineSweep 1s ease-in-out;
        }
        @keyframes badgeShineSweep {
          0% { background-position: 120% 0; }
          100% { background-position: -20% 0; }
        }

        /* --- Trainer Card --- */
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .pixel-font { font-family: 'Press Start 2P', monospace; }

        .trainer-card-frame {
          background: #2b2b2b;
          border: 3px solid #1a1a1a;
        }
        .trainer-card-stripes {
          background-color: #a8dba8;
          background-image: repeating-linear-gradient(
            180deg,
            rgba(255,255,255,0.18) 0px,
            rgba(255,255,255,0.18) 6px,
            transparent 6px,
            transparent 12px
          );
        }
        .trainer-banner-plaque {
          background: linear-gradient(180deg, #5fb3e8 0%, #2f7fc4 100%);
          border: 2px solid #1c4d78;
          border-radius: 6px;
          box-shadow: inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -2px 0 rgba(0,0,0,0.25);
        }

        /* Interactive team slots inside the trainer card */
        .trainer-team-slot {
          border: 2px solid rgba(45,90,58,0.4);
          cursor: pointer;
        }
        .trainer-team-slot-empty {
          background: rgba(255,255,255,0.28);
          border-style: dashed;
        }
        .trainer-team-slot-empty:hover {
          background: rgba(255,255,255,0.45);
          border-color: rgba(45,90,58,0.7);
        }
        .trainer-team-slot-filled {
          background: radial-gradient(circle, #fdfcf6 0%, #eef3e6 100%);
          border-style: solid;
          border-color: #2d5a3a;
          box-shadow: 0 2px 0 rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.4);
        }
        .trainer-team-slot-filled:hover {
          box-shadow: 0 3px 0 rgba(0,0,0,0.2), 0 0 8px -1px rgba(45,90,58,0.6), inset 0 0 0 1px rgba(255,255,255,0.5);
        }

        .trainer-portrait-ring {
          background: radial-gradient(circle, #7bc98a 0%, #5aa86c 100%);
          border: 3px solid #2d5a3a;
          box-shadow: 0 3px 0 rgba(0,0,0,0.2);
        }
        .trainer-badge-strip {
          background: linear-gradient(180deg, #4a9e5e 0%, #3a7d4a 100%);
          border-top: 2px solid #2d5a3a;
        }
        .trainer-badge-tile-locked {
          background: rgba(0,0,0,0.2);
          border: 2px solid rgba(255,255,255,0.3);
        }
        .trainer-badge-tile-earned {
          background: radial-gradient(circle, var(--badge-color) 0%, rgba(0,0,0,0.2) 130%);
          border: 2px solid rgba(255,255,255,0.7);
          color: #fff8e7;
          box-shadow: 0 0 8px -1px var(--badge-color);
        }
      `}</style>
    </div>
  );
}