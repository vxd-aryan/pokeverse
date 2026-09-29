// ============================================================
// JOURNEY BATTLE ENGINE — single-player vs. scripted gym team.
// Mirrors the exact damage formula / type chart used by the
// multiplayer Battle Arena (main.py's _calculate_move_damage),
// but runs entirely client-side since Journey has no matchmaking.
// ============================================================

import type { JourneyPokemon, JourneyMove } from '../data/kanto';

const TYPE_CHART: Record<string, Record<string, number>> = {
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

export function getTypeEffectiveness(moveType: string, defenderTypes: string[]): number {
  const row = TYPE_CHART[moveType] || {};
  let mult = 1;
  defenderTypes.forEach((t) => {
    mult *= row[t] ?? 1;
  });
  return mult;
}

export interface DamageResult {
  damage: number;
  effectiveness: number;
  critical: boolean;
}

export function calculateMoveDamage(
  move: JourneyMove,
  attacker: JourneyPokemon,
  defender: JourneyPokemon
): DamageResult {
  const power = move.power || 0;
  if (power <= 0) return { damage: 0, effectiveness: 1, critical: false };

  const isPhysical = move.damage_class === 'physical';
  const atkStat = isPhysical ? attacker.stats.attack : attacker.stats['special-attack'];
  const defStat = Math.max(1, isPhysical ? defender.stats.defense : defender.stats['special-defense']);

  const typeMult = getTypeEffectiveness(move.type, defender.types);
  if (typeMult === 0) return { damage: 0, effectiveness: 0, critical: false };

  const isCrit = Math.random() < 1 / 16;
  const critMult = isCrit ? 1.5 : 1;
  const stab = attacker.types.includes(move.type) ? 1.5 : 1;
  const randomMult = 0.85 + Math.random() * 0.15;

  const level = attacker.level;
  const baseDamage = Math.floor((((2 * level) / 5 + 2) * power * (atkStat / defStat)) / 50) + 2;
  const finalDamage = Math.max(1, Math.floor(baseDamage * critMult * stab * typeMult * randomMult));

  return { damage: finalDamage, effectiveness: typeMult, critical: isCrit };
}

// Simple gym-leader AI: picks whichever move is most effective against the
// player's current active Pokémon, defaulting to highest power on ties.
export function pickAiMove(attacker: JourneyPokemon, defender: JourneyPokemon): JourneyMove {
  let best = attacker.moves[0];
  let bestScore = -1;
  attacker.moves.forEach((m) => {
    const eff = getTypeEffectiveness(m.type, defender.types);
    const score = eff * (m.power || 0);
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  });
  return best;
}

export interface TurnResult {
  logs: string[];
  playerFainted: boolean;
  opponentFainted: boolean;
}

// Resolves one turn: player's chosen move, then the AI's move (or vice
// versa if the AI's Pokémon is faster), stopping early if either side
// faints mid-exchange.
export function resolveJourneyTurn(
  playerMon: JourneyPokemon,
  playerMove: JourneyMove,
  opponentMon: JourneyPokemon
): TurnResult {
  const logs: string[] = [];
  const aiMove = pickAiMove(opponentMon, playerMon);

  const playerFirst = playerMon.stats.speed >= opponentMon.stats.speed;
  const order: Array<{ attacker: JourneyPokemon; defender: JourneyPokemon; move: JourneyMove; isPlayer: boolean }> = playerFirst
    ? [
        { attacker: playerMon, defender: opponentMon, move: playerMove, isPlayer: true },
        { attacker: opponentMon, defender: playerMon, move: aiMove, isPlayer: false },
      ]
    : [
        { attacker: opponentMon, defender: playerMon, move: aiMove, isPlayer: false },
        { attacker: playerMon, defender: opponentMon, move: playerMove, isPlayer: true },
      ];

  let playerFainted = false;
  let opponentFainted = false;

  for (const step of order) {
    if (step.isPlayer && playerMon.currentHp <= 0) continue;
    if (!step.isPlayer && opponentMon.currentHp <= 0) continue;

    logs.push(`${step.attacker.name} used ${step.move.name}!`);
    const result = calculateMoveDamage(step.move, step.attacker, step.defender);

    if (result.effectiveness === 0) {
      logs.push(`It had no effect on ${step.defender.name}!`);
      continue;
    }

    step.defender.currentHp = Math.max(0, step.defender.currentHp - result.damage);
    if (result.critical) logs.push('A critical hit!');
    if (result.effectiveness > 1) logs.push("It's super effective!");
    else if (result.effectiveness < 1) logs.push("It's not very effective...");
    logs.push(`${step.defender.name} took ${result.damage} damage!`);

    if (step.defender.currentHp <= 0) {
      logs.push(`${step.defender.name} fainted!`);
      if (step.defender === playerMon) playerFainted = true;
      else opponentFainted = true;
      break;
    }
  }

  return { logs, playerFainted, opponentFainted };
}