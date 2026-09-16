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
    <path d="M20 8 C28 10 30 20 20 32 C10 20 12 10 20 8 Z" fill="currentColor" />
    <path d="M20 12 V28" stroke="#0009" strokeWidth="1.5" />
  </svg>
);

const TideShellIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className}>
    <circle cx="20" cy="20" r="18" fill="currentColor" opacity="0.15" />
    <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M12 26 C12 16 16 10 20 10 C24 10 28 16 28 26 C24 23 16 23 12 26 Z" fill="currentColor" />
    <circle cx="20" cy="17" r="2.2" fill="#0009" />
  </svg>
);

const EmberCoreIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className}>
    <circle cx="20" cy="20" r="18" fill="currentColor" opacity="0.15" />
    <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M20 8 C24 14 28 17 24 24 C26 22 27 20 27 20 C28 27 22 32 17 30 C12 28 12 22 15 19 C15 22 17 22 17 22 C15 17 17 11 20 8 Z" fill="currentColor" />
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
    <path d="M20 8 L31 14 V26 L20 32 L9 26 V14 Z" fill="currentColor" />
    <path d="M20 8 V32 M9 14 L31 26 M31 14 L9 26" stroke="#0006" strokeWidth="1" />
  </svg>
);

const NightwingCrestIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className}>
    <circle cx="20" cy="20" r="18" fill="currentColor" opacity="0.15" />
    <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M20 12 C14 12 9 16 6 20 C11 20 15 22 18 26 C16 20 17 15 20 12 Z" fill="currentColor" />
    <path d="M20 12 C26 12 31 16 34 20 C29 20 25 22 22 26 C24 20 23 15 20 12 Z" fill="currentColor" />
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
    <div className="trainer-card-frame rounded-[24px] p-[3px] mx-auto max-w-2xl shadow-2xl relative group">
      <div className="absolute inset-0 rounded-[24px] bg-gradient-to-tr from-emerald-500/20 via-transparent to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      <div className="trainer-card-stripes rounded-[20px] overflow-hidden relative shadow-inner">
        
        {/* Holographic overlay */}
        <div className="absolute inset-0 holographic-sheen pointer-events-none mix-blend-overlay opacity-30" />

        {/* Header banner */}
        <div className="flex items-center justify-between px-5 pt-5 relative z-10">
          <div className="trainer-banner-plaque px-4 py-1.5 backdrop-blur-md rounded-lg">
            <span className="pixel-font text-[11px] md:text-xs text-emerald-50 tracking-wider">TRAINER CARD</span>
          </div>
          <span className="pixel-font text-[10px] md:text-[11px] text-emerald-200/80 drop-shadow-md">LV.{level}</span>
        </div>

        {/* Name row */}
        <div className="px-5 mt-5 flex items-center gap-3 relative z-10">
          <span className="w-2 h-6 bg-emerald-400 flex-shrink-0 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="pixel-font text-[10px] md:text-xs text-emerald-200/70">NAME</span>
          <span className="pixel-font text-base md:text-xl text-white tracking-widest truncate drop-shadow-lg">{user.username?.toUpperCase()}</span>
        </div>
        <div className="mx-5 mt-3 border-b border-emerald-500/30 shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />

        {/* Body: interactive team slots left, portrait right */}
        <div className="px-5 pt-5 pb-3 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="pixel-font text-[10px] md:text-[11px] text-emerald-200/70">TEAM</span>
            <span className="pixel-font text-[9px] md:text-[10px] text-emerald-200/50">{rosterCount}/6</span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="grid grid-cols-3 gap-3 md:gap-5">
              {team.map((member, idx) => (
                <div
                  key={idx}
                  className="group/slot relative"
                  onMouseEnter={() => setHoveredSlotIdx(idx)}
                  onMouseLeave={() => setHoveredSlotIdx(null)}
                >
                  <button
                    type="button"
                    onClick={() => onSlotClick(idx)}
                    className={`trainer-team-slot w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${
                      member ? 'trainer-team-slot-filled' : 'trainer-team-slot-empty'
                    }`}
                  >
                    {member ? (
                      <Image
                        src={member.sprite}
                        alt={member.name}
                        width={48}
                        height={48}
                        className="object-contain image-pixelated drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] group-hover/slot:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <span className="pixel-font text-emerald-200/30 text-base drop-shadow-sm">+</span>
                    )}
                  </button>

                  {member && (
                    <>
                      <span className="absolute -top-1.5 -right-1.5 bg-slate-900/90 text-emerald-300 text-[8px] font-mono px-1.5 py-0.5 rounded-full border border-emerald-500/50 shadow-lg pointer-events-none z-10">
                        Lv{member.level}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => onRemoveSlot(idx, e)}
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-500/90 hover:bg-red-500 text-white text-[12px] font-bold leading-none flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity border border-white/20 shadow-lg z-20"
                        aria-label={`Remove ${member.name}`}
                      >
                        ×
                      </button>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-slate-900/80 rounded-full overflow-hidden pointer-events-none border border-slate-700/50">
                        <div
                          className="h-full bg-emerald-400 transition-all duration-500 shadow-[0_0_5px_#34d399]"
                          style={{ width: `${member.xp % 100}%` }}
                        />
                      </div>
                    </>
                  )}

                  {hoveredSlotIdx === idx && (
                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap bg-slate-900/95 backdrop-blur-sm border border-emerald-500/30 rounded-lg px-3 py-2 shadow-2xl pointer-events-none">
                      {member ? (
                        <>
                          <p className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider">{member.name}</p>
                          <p className="text-[9px] text-emerald-400/80 mt-0.5">Level {member.level} · tap to swap</p>
                        </>
                      ) : (
                        <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-wide">+ Add Partner</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={onAvatarClick}
              className="trainer-portrait-ring relative w-24 h-24 md:w-28 md:h-28 rounded-full flex-shrink-0 flex items-center justify-center group/avatar transition-transform hover:scale-105"
            >
              <div className="absolute inset-1 bg-slate-900 rounded-full overflow-hidden flex items-center justify-center">
                {currentAvatar ? (
                  <img src={currentAvatar} alt="Trainer" className="w-[90%] h-[90%] object-contain image-pixelated drop-shadow-md" />
                ) : (
                  <span className="pixel-font text-3xl text-emerald-500/50">{user.username?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="absolute inset-1 rounded-full bg-slate-900/60 backdrop-blur-sm opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center z-10 border border-emerald-400/50">
                <span className="text-emerald-300 text-[10px] font-bold uppercase tracking-widest drop-shadow-md">Edit</span>
              </div>
            </button>
          </div>
        </div>

        {/* Badge strip */}
        <div className="trainer-badge-strip px-5 py-4 mt-3 relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="pixel-font text-[10px] md:text-[11px] text-emerald-100/90 drop-shadow-md">BADGES</span>
            <span className="pixel-font text-[9px] md:text-[10px] text-emerald-200/50">{earnedCount}/{BADGES.length}</span>
          </div>
          <div className="flex items-center justify-between gap-2 md:gap-3">
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
                    className={`trainer-badge-tile aspect-square rounded-xl flex items-center justify-center transition-all duration-300 ${
                      earned ? 'trainer-badge-tile-earned hover:scale-110' : 'trainer-badge-tile-locked'
                    }`}
                    style={earned ? ({ '--badge-color': badge.primary, '--badge-glow': badge.secondary } as React.CSSProperties) : undefined}
                  >
                    <Icon className={`w-6 h-6 md:w-8 md:h-8 transition-all duration-300 ${earned ? 'drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]' : 'opacity-30 grayscale'}`} />
                    {earned && <div className="badge-shine" />}
                  </div>

                  {hoveredBadgeIdx === idx && (
                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-20 w-36 bg-slate-900/95 backdrop-blur-sm border border-slate-700/80 rounded-xl p-3 shadow-2xl text-center pointer-events-none">
                      <p className="text-[11px] font-bold text-white tracking-wide" style={{ color: earned ? badge.secondary : '#cbd5e1' }}>{badge.name}</p>
                      <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">
                        {earned ? badge.blurb : `Unlock at Lv. ${badge.level}`}
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
    <div className="tcg-root min-h-screen px-4 py-10 md:py-16 text-slate-200">
      {/* Background ambient orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card w-full max-w-2xl p-6 md:p-8 rounded-[24px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="card-display text-2xl text-center text-emerald-50 mb-8 drop-shadow-md">Select Avatar</h3>
            <div className="flex gap-3 mb-8 max-w-xs mx-auto">
              <button onClick={() => setGenderTab('boy')} className={`type-toggle flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${genderTab === 'boy' ? 'type-toggle-active-boy' : ''}`}>Boy</button>
              <button onClick={() => setGenderTab('girl')} className={`type-toggle flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${genderTab === 'girl' ? 'type-toggle-active-girl' : ''}`}>Girl</button>
            </div>
            <div className="grid grid-cols-4 gap-4 md:gap-6 mb-4">
              {TRAINER_AVATARS[genderTab].map((url, idx) => (
                <button key={idx} onClick={() => { setCurrentAvatar(url); setIsModalOpen(false); saveToDB({ avatar_url: url }); }} className="avatar-pick rounded-2xl p-3 h-24 relative group">
                  <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
                  <img src={url} alt={`Avatar ${idx}`} className="h-full mx-auto object-contain image-pixelated drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============ SEARCH MODAL ============ */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-md" onClick={() => setIsTeamModalOpen(false)}>
          <div className="modal-card w-full max-w-4xl h-[85vh] p-6 md:p-8 rounded-[24px] relative flex flex-col shadow-[0_0_50px_rgba(16,185,129,0.1)]" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6 flex items-center justify-between">
              <h3 className="card-display text-2xl text-emerald-50 drop-shadow-md">Select a Partner</h3>
              {activeSlot !== null && team[activeSlot] && (
                <button
                  onClick={(e) => { handleRemovePokemon(activeSlot, e); setIsTeamModalOpen(false); }}
                  className="text-[11px] font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300 border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl px-4 py-2 transition-colors"
                >
                  Remove Current
                </button>
              )}
            </div>
            <div className="relative mb-6">
              <input
                type="text" placeholder="Search Database..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-5 py-4 font-mono text-emerald-50 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 shadow-inner transition-all"
              />
            </div>
            <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {filteredPokemon.map((poke) => (
                  <button key={poke.id} onClick={() => handleSelectPokemon(poke)} className="avatar-pick rounded-2xl p-3 flex flex-col items-center justify-center h-32 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative w-16 h-16 mb-2">
                      <Image src={poke.sprite} alt={poke.name} width={64} height={64} loading="lazy" className="object-contain image-pixelated drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 group-hover:text-emerald-300 uppercase tracking-wider truncate w-full text-center transition-colors relative z-10">{poke.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setIsTeamModalOpen(false)} className="mt-6 w-full border border-slate-700/80 bg-slate-800/50 hover:bg-slate-700/50 py-4 rounded-xl uppercase text-sm font-bold text-slate-300 hover:text-emerald-300 transition-all">Close</button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Inter:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        .tcg-root {
          font-family: 'Inter', ui-sans-serif, sans-serif;
          background: radial-gradient(circle at 50% 0%, #061c14 0%, #030712 100%);
          position: relative;
        }
        .pixel-font { font-family: 'Press Start 2P', monospace; }
        .card-display { font-family: 'Cinzel', serif; font-weight: 700; letter-spacing: 0.05em; }
        .image-pixelated { image-rendering: pixelated; }

        /* --- Modals & Global Accents --- */
        .modal-card {
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(3, 7, 18, 0.98) 100%);
          border: 1px solid rgba(52, 211, 153, 0.2);
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05) inset;
        }
        .type-toggle {
          background: rgba(30, 41, 59, 0.7);
          color: #94a3b8;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .type-toggle:hover { background: rgba(51, 65, 85, 0.8); color: #e2e8f0; }
        .type-toggle-active-boy { background: rgba(59, 130, 246, 0.2); color: #93c5fd; border-color: rgba(59, 130, 246, 0.5); box-shadow: 0 0 15px rgba(59,130,246,0.2); }
        .type-toggle-active-girl { background: rgba(236, 72, 153, 0.2); color: #f9a8d4; border-color: rgba(236, 72, 153, 0.5); box-shadow: 0 0 15px rgba(236,72,153,0.2); }
        
        .avatar-pick {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .avatar-pick:hover {
          border-color: rgba(52, 211, 153, 0.5);
          box-shadow: 0 0 15px rgba(52,211,153,0.1), inset 0 2px 4px rgba(0,0,0,0.5);
        }

        /* --- Scrollbar --- */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(52, 211, 153, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(52, 211, 153, 0.5); }

        /* --- Trainer Card Frame & Background --- */
        .trainer-card-frame {
          background: linear-gradient(135deg, #1e293b, #020617);
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.9), 0 0 20px rgba(52, 211, 153, 0.15);
        }
        .trainer-card-stripes {
          background-color: #064e3b;
          background-image: repeating-linear-gradient(
            180deg,
            rgba(255,255,255,0.03) 0px,
            rgba(255,255,255,0.03) 2px,
            transparent 2px,
            transparent 8px
          ), radial-gradient(circle at top right, rgba(16, 185, 129, 0.15), transparent 60%);
        }
        .holographic-sheen {
          background: linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.1) 40%, rgba(52, 211, 153, 0.15) 50%, transparent 60%);
          background-size: 200% 200%;
          animation: holoSlide 8s ease-in-out infinite alternate;
        }
        @keyframes holoSlide {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }

        .trainer-banner-plaque {
          background: linear-gradient(180deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
          border: 1px solid rgba(52, 211, 153, 0.3);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 6px -1px rgba(0,0,0,0.5);
        }

        /* --- Team Slots --- */
        .trainer-team-slot { border: 1px solid transparent; }
        .trainer-team-slot-empty {
          background: rgba(3, 7, 18, 0.4);
          border: 1px dashed rgba(52, 211, 153, 0.3);
          box-shadow: inset 0 2px 6px rgba(0,0,0,0.8);
        }
        .trainer-team-slot-empty:hover {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(52, 211, 153, 0.6);
          box-shadow: inset 0 2px 6px rgba(0,0,0,0.8), 0 0 10px rgba(52, 211, 153, 0.2);
        }
        .trainer-team-slot-filled {
          background: radial-gradient(circle at center, rgba(15, 23, 42, 0.8) 0%, rgba(2, 6, 23, 0.9) 100%);
          border-color: rgba(52, 211, 153, 0.5);
          box-shadow: 0 4px 10px rgba(0,0,0,0.5), inset 0 0 15px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .trainer-team-slot-filled:hover {
          border-color: #34d399;
          box-shadow: 0 0 15px rgba(52, 211, 153, 0.4), inset 0 0 10px rgba(0,0,0,0.8);
        }

        /* --- Portrait Ring --- */
        .trainer-portrait-ring {
          background: conic-gradient(from 0deg, #10b981, #0ea5e9, #10b981, #34d399, #10b981);
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.8), 0 0 15px rgba(16, 185, 129, 0.4);
          animation: borderSpin 4s linear infinite;
        }
        @keyframes borderSpin {
          100% { transform: rotate(360deg); }
        }
        .trainer-portrait-ring > div {
          animation: counterSpin 4s linear infinite;
        }
        @keyframes counterSpin {
          100% { transform: rotate(-360deg); }
        }
        .trainer-portrait-ring:hover { animation-play-state: paused; }
        .trainer-portrait-ring:hover > div { animation-play-state: paused; }

        /* --- Badges --- */
        .trainer-badge-strip {
          background: rgba(2, 6, 23, 0.5);
          backdrop-filter: blur(8px);
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .trainer-badge-tile {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.6);
        }
        .trainer-badge-tile-locked {
          background: rgba(3, 7, 18, 0.6);
        }
        .trainer-badge-tile-earned {
          background: radial-gradient(circle at top left, rgba(255,255,255,0.1), transparent), rgba(15, 23, 42, 0.8);
          border: 1px solid var(--badge-color);
          color: var(--badge-glow);
          box-shadow: 0 0 12px -2px var(--badge-color), inset 0 0 15px rgba(0,0,0,0.8);
          overflow: hidden;
        }
        .badge-shine {
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%);
          background-size: 250% 250%;
          background-position: 100% 0;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .trainer-badge-tile-earned:hover .badge-shine {
          opacity: 1;
          animation: badgeShineSweep 1.5s ease-in-out infinite;
        }
        @keyframes badgeShineSweep {
          0% { background-position: 120% 0; }
          100% { background-position: -20% 0; }
        }
      `}</style>
    </div>
  );
}