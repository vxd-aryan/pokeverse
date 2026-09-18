"use client";

import { useMemo, useState } from 'react';

// ============================================================
// TYPE DATA
// Same 18-type chart used by the battle engine's damage formula
// (kept in sync with backend main.py's TYPE_CHART), so what this
// shows always matches what actually happens in a match.
// ============================================================

export const TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
  'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
  'Steel', 'Fairy',
] as const;

export type PokeType = (typeof TYPES)[number];

// attacker -> defender -> multiplier. Any pair not listed defaults to 1.
const RAW_CHART: Record<PokeType, Partial<Record<PokeType, number>>> = {
  Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
  Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Grass: { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
  Electric: { Water: 2, Grass: 0.5, Electric: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
  Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: 0.5 },
  Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
  Ground: { Fire: 2, Grass: 0.5, Electric: 2, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
  Flying: { Grass: 2, Electric: 0.5, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug: { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5, Fairy: 0.5 },
  Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
  Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
  Fairy: { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 },
};

export function getMultiplier(attacker: PokeType, defender: PokeType): number {
  return RAW_CHART[attacker]?.[defender] ?? 1;
}

export function getCombinedMultiplier(attacker: PokeType, defenderTypes: PokeType[]): number {
  return defenderTypes.reduce((mult, def) => mult * getMultiplier(attacker, def), 1);
}

// Recognizable, game-accurate type badge colors.
const TYPE_COLORS: Record<PokeType, string> = {
  Normal: '#A8A878', Fire: '#F08030', Water: '#6890F0', Electric: '#F8D030',
  Grass: '#78C850', Ice: '#98D8D8', Fighting: '#C03028', Poison: '#A040A0',
  Ground: '#E0C068', Flying: '#A890F0', Psychic: '#F85888', Bug: '#A8B820',
  Rock: '#B8A038', Ghost: '#705898', Dragon: '#7038F8', Dark: '#705848',
  Steel: '#B8B8D0', Fairy: '#EE99AC',
};

function textColorFor(bg: string): string {
  // Light badges (Normal, Electric, Ice, Ground, Steel, Fairy) read better with dark text.
  const light = ['#A8A878', '#F8D030', '#98D8D8', '#E0C068', '#B8B8D0', '#EE99AC'];
  return light.includes(bg) ? '#1A1A1A' : '#FFFFFF';
}

function cellStyle(mult: number): { bg: string; label: string; text: string } {
  if (mult === 0) return { bg: '#3F1D1D', label: '0×', text: '#F87171' };
  if (mult === 0.25) return { bg: '#4A2A12', label: '¼×', text: '#FB923C' };
  if (mult === 0.5) return { bg: '#4A3412', label: '½×', text: '#FBBF24' };
  if (mult === 1) return { bg: 'transparent', label: '', text: '#5B6472' };
  if (mult === 2) return { bg: '#123B27', label: '2×', text: '#4ADE80' };
  if (mult === 4) return { bg: '#0F4A2C', label: '4×', text: '#34D399' };
  return { bg: 'transparent', label: `${mult}×`, text: '#5B6472' };
}

function TypeBadge({ type, size = 'md', onClick, selected, disabled }: {
  type: PokeType;
  size?: 'sm' | 'md';
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
}) {
  const bg = TYPE_COLORS[type];
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-md font-bold uppercase tracking-wide transition-all ${
        size === 'sm' ? 'text-[10px] px-2 py-1' : 'text-xs px-3 py-1.5'
      } ${onClick ? 'cursor-pointer active:scale-95' : ''} ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
      style={{
        background: bg,
        color: textColorFor(bg),
        boxShadow: selected ? `0 0 0 2px #0B0F14, 0 0 0 4px ${bg}` : 'none',
      }}
    >
      {type}
    </Tag>
  );
}

// ============================================================
// LOOKUP MODE — pick a defending Pokémon's type(s), see what
// hurts / doesn't hurt it. This is the "what do I hit it with"
// view, most useful mid-battle.
// ============================================================

function LookupView({ initialTypes }: { initialTypes?: PokeType[] }) {
  const [defType1, setDefType1] = useState<PokeType | null>(initialTypes?.[0] ?? null);
  const [defType2, setDefType2] = useState<PokeType | null>(initialTypes?.[1] ?? null);

  const buckets = useMemo(() => {
    if (!defType1) return null;
    const defenders = [defType1, ...(defType2 ? [defType2] : [])];
    const groups: Record<string, PokeType[]> = { '4': [], '2': [], '1': [], '0.5': [], '0.25': [], '0': [] };
    for (const atk of TYPES) {
      const mult = getCombinedMultiplier(atk, defenders);
      const key = mult === 4 ? '4' : mult === 2 ? '2' : mult === 1 ? '1' : mult === 0.5 ? '0.5' : mult === 0.25 ? '0.25' : '0';
      groups[key].push(atk);
    }
    return groups;
  }, [defType1, defType2]);

  const bucketMeta: { key: string; label: string; hint: string; tone: string }[] = [
    { key: '4', label: '4× damage', hint: 'Devastating — lead with these', tone: '#34D399' },
    { key: '2', label: '2× damage', hint: 'Super effective', tone: '#4ADE80' },
    { key: '0.5', label: '½× damage', hint: 'Resisted', tone: '#FBBF24' },
    { key: '0.25', label: '¼× damage', hint: 'Barely scratches it', tone: '#FB923C' },
    { key: '0', label: 'No effect', hint: 'Completely immune', tone: '#F87171' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-[#7B8794] mb-2">Defending Pokémon's type(s)</p>
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((t) => {
            const isSel = t === defType1 || t === defType2;
            return (
              <TypeBadge
                key={t}
                type={t}
                size="sm"
                selected={isSel}
                onClick={() => {
                  if (t === defType1) { setDefType1(defType2); setDefType2(null); return; }
                  if (t === defType2) { setDefType2(null); return; }
                  if (!defType1) { setDefType1(t); return; }
                  if (!defType2) { setDefType2(t); return; }
                  // both slots full: replace the second slot
                  setDefType2(t);
                }}
              />
            );
          })}
        </div>
        {(defType1 || defType2) && (
          <button
            onClick={() => { setDefType1(null); setDefType2(null); }}
            className="text-[11px] text-[#5B6472] hover:text-[#9AA5B1] mt-2 underline"
          >
            Clear selection
          </button>
        )}
      </div>

      {!buckets ? (
        <p className="text-sm text-[#5B6472] py-6 text-center">
          Pick one or two types above to see what's strong or weak against them.
        </p>
      ) : (
        <div className="space-y-4">
          {bucketMeta.map(({ key, label, hint, tone }) => {
            const list = buckets[key];
            if (list.length === 0) return null;
            return (
              <div key={key}>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-sm font-bold" style={{ color: tone }}>{label}</span>
                  <span className="text-[11px] text-[#5B6472]">{hint}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((t) => <TypeBadge key={t} type={t} size="sm" />)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// GRID MODE — full 18×18 reference matrix.
// ============================================================

function GridView() {
  return (
    <div className="overflow-auto max-h-[70vh] rounded-lg border border-[#1E2630]">
      <table className="border-collapse text-[11px] min-w-max">
        <thead>
          <tr>
            <th className="sticky top-0 left-0 z-20 bg-[#0B0F14] p-1.5 border-b border-r border-[#1E2630]" />
            {TYPES.map((def) => (
              <th
                key={def}
                className="sticky top-0 z-10 bg-[#0B0F14] p-1 border-b border-[#1E2630] font-normal"
              >
                <div className="mx-auto" style={{ writingMode: 'vertical-rl' }}>
                  <TypeBadge type={def} size="sm" />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TYPES.map((atk) => (
            <tr key={atk}>
              <th className="sticky left-0 z-10 bg-[#0B0F14] p-1 border-r border-[#1E2630] text-left font-normal">
                <TypeBadge type={atk} size="sm" />
              </th>
              {TYPES.map((def) => {
                const mult = getMultiplier(atk, def);
                const { bg, label, text } = cellStyle(mult);
                return (
                  <td
                    key={def}
                    className="w-9 h-9 text-center align-middle border-b border-[#141A21]"
                    style={{ background: bg, color: text }}
                    title={`${atk} → ${def}: ${mult}×`}
                  >
                    <span className="font-bold text-[10px]">{label}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-[#5B6472] p-2 border-t border-[#1E2630]">
        Rows attack, columns defend. Blank = neutral (1×).
      </p>
    </div>
  );
}

// ============================================================
// PUBLIC COMPONENT
// ============================================================

interface TypeChartProps {
  /** Which view opens first. Defaults to the quick lookup. */
  defaultMode?: 'lookup' | 'grid';
  /** Pre-fill the lookup with a Pokémon's type(s) — e.g. the current opponent. */
  initialTypes?: string[];
  /** Tighter spacing/height for embedding inside a panel (e.g. mid-battle). */
  compact?: boolean;
  /** Optional close handler; renders a × button in the header when provided. */
  onClose?: () => void;
}

export default function TypeChart({ defaultMode = 'lookup', initialTypes, compact = false, onClose }: TypeChartProps) {
  const [mode, setMode] = useState<'lookup' | 'grid'>(defaultMode);
  const normalizedInitial = (initialTypes || []).filter((t): t is PokeType =>
    (TYPES as readonly string[]).includes(t)
  );

  return (
    <div className={`tc-root ${compact ? 'p-4' : 'p-6'} rounded-2xl`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-[#0B0F14] rounded-lg p-1">
          <button
            onClick={() => setMode('lookup')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-colors ${
              mode === 'lookup' ? 'bg-[#1E2630] text-[#EAF0F6]' : 'text-[#5B6472] hover:text-[#9AA5B1]'
            }`}
          >
            Quick lookup
          </button>
          <button
            onClick={() => setMode('grid')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-colors ${
              mode === 'grid' ? 'bg-[#1E2630] text-[#EAF0F6]' : 'text-[#5B6472] hover:text-[#9AA5B1]'
            }`}
          >
            Full chart
          </button>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#0B0F14] text-[#5B6472] hover:text-[#EAF0F6] hover:bg-[#1E2630] transition-colors text-lg leading-none"
            aria-label="Close type chart"
          >
            ×
          </button>
        )}
      </div>

      {mode === 'lookup' ? <LookupView initialTypes={normalizedInitial} /> : <GridView />}

      <style jsx>{`
        .tc-root {
          background: linear-gradient(180deg, #10151C 0%, #0B0F14 100%);
          border: 1px solid #1E2630;
          color: #EAF0F6;
          font-family: 'Inter', ui-sans-serif, sans-serif;
        }
      `}</style>
    </div>
  );
}