import math
import random
from typing import Dict, Any

# ==========================================
# 18-TYPE EFFECTIVENESS MATRIX
# ==========================================
TYPES = [
    "Normal", "Fire", "Water", "Grass", "Electric", "Ice",
    "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug",
    "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy"
]

TYPE_CHART: Dict[str, Dict[str, float]] = {atk: {defn: 1.0 for defn in TYPES} for atk in TYPES}

def _set_eff(atk: str, defn: str, mult: float):
    TYPE_CHART[atk][defn] = mult

_set_eff("Normal", "Rock", 0.5); _set_eff("Normal", "Ghost", 0.0); _set_eff("Normal", "Steel", 0.5)
_set_eff("Fire", "Fire", 0.5); _set_eff("Fire", "Water", 0.5); _set_eff("Fire", "Grass", 2.0); _set_eff("Fire", "Ice", 2.0); _set_eff("Fire", "Bug", 2.0); _set_eff("Fire", "Rock", 0.5); _set_eff("Fire", "Dragon", 0.5); _set_eff("Fire", "Steel", 2.0)
_set_eff("Water", "Fire", 2.0); _set_eff("Water", "Water", 0.5); _set_eff("Water", "Grass", 0.5); _set_eff("Water", "Ground", 2.0); _set_eff("Water", "Rock", 2.0); _set_eff("Water", "Dragon", 0.5)
_set_eff("Grass", "Fire", 0.5); _set_eff("Grass", "Water", 2.0); _set_eff("Grass", "Grass", 0.5); _set_eff("Grass", "Poison", 0.5); _set_eff("Grass", "Ground", 2.0); _set_eff("Grass", "Flying", 0.5); _set_eff("Grass", "Bug", 0.5); _set_eff("Grass", "Rock", 2.0); _set_eff("Grass", "Dragon", 0.5); _set_eff("Grass", "Steel", 0.5)
_set_eff("Electric", "Water", 2.0); _set_eff("Electric", "Grass", 0.5); _set_eff("Electric", "Electric", 0.5); _set_eff("Electric", "Ground", 0.0); _set_eff("Electric", "Flying", 2.0); _set_eff("Electric", "Dragon", 0.5)
_set_eff("Ice", "Fire", 0.5); _set_eff("Ice", "Water", 0.5); _set_eff("Ice", "Grass", 2.0); _set_eff("Ice", "Ice", 0.5); _set_eff("Ice", "Ground", 2.0); _set_eff("Ice", "Flying", 2.0); _set_eff("Ice", "Dragon", 2.0); _set_eff("Ice", "Steel", 0.5)
_set_eff("Fighting", "Normal", 2.0); _set_eff("Fighting", "Ice", 2.0); _set_eff("Fighting", "Poison", 0.5); _set_eff("Fighting", "Flying", 0.5); _set_eff("Fighting", "Psychic", 0.5); _set_eff("Fighting", "Bug", 0.5); _set_eff("Fighting", "Rock", 2.0); _set_eff("Fighting", "Ghost", 0.0); _set_eff("Fighting", "Dark", 2.0); _set_eff("Fighting", "Steel", 2.0); _set_eff("Fighting", "Fairy", 0.5)
_set_eff("Poison", "Grass", 2.0); _set_eff("Poison", "Poison", 0.5); _set_eff("Poison", "Ground", 0.5); _set_eff("Poison", "Rock", 0.5); _set_eff("Poison", "Ghost", 0.5); _set_eff("Poison", "Steel", 0.0); _set_eff("Poison", "Fairy", 2.0)
_set_eff("Ground", "Fire", 2.0); _set_eff("Ground", "Grass", 0.5); _set_eff("Ground", "Electric", 2.0); _set_eff("Ground", "Poison", 2.0); _set_eff("Ground", "Flying", 0.0); _set_eff("Ground", "Bug", 0.5); _set_eff("Ground", "Rock", 2.0); _set_eff("Ground", "Steel", 2.0)
_set_eff("Flying", "Grass", 2.0); _set_eff("Flying", "Electric", 0.5); _set_eff("Flying", "Fighting", 2.0); _set_eff("Flying", "Bug", 2.0); _set_eff("Flying", "Rock", 0.5); _set_eff("Flying", "Steel", 0.5)
_set_eff("Psychic", "Fighting", 2.0); _set_eff("Psychic", "Poison", 2.0); _set_eff("Psychic", "Psychic", 0.5); _set_eff("Psychic", "Dark", 0.0); _set_eff("Psychic", "Steel", 0.5)
_set_eff("Bug", "Fire", 0.5); _set_eff("Bug", "Grass", 2.0); _set_eff("Bug", "Fighting", 0.5); _set_eff("Bug", "Poison", 0.5); _set_eff("Bug", "Flying", 0.5); _set_eff("Bug", "Psychic", 2.0); _set_eff("Bug", "Ghost", 0.5); _set_eff("Bug", "Dark", 2.0); _set_eff("Bug", "Steel", 0.5); _set_eff("Bug", "Fairy", 0.5)
_set_eff("Rock", "Fire", 2.0); _set_eff("Rock", "Ice", 2.0); _set_eff("Rock", "Fighting", 0.5); _set_eff("Rock", "Ground", 0.5); _set_eff("Rock", "Flying", 2.0); _set_eff("Rock", "Bug", 2.0); _set_eff("Rock", "Steel", 0.5)
_set_eff("Ghost", "Normal", 0.0); _set_eff("Ghost", "Psychic", 2.0); _set_eff("Ghost", "Ghost", 2.0); _set_eff("Ghost", "Dark", 0.5)
_set_eff("Dragon", "Dragon", 2.0); _set_eff("Dragon", "Steel", 0.5); _set_eff("Dragon", "Fairy", 0.0)
_set_eff("Dark", "Fighting", 0.5); _set_eff("Dark", "Psychic", 2.0); _set_eff("Dark", "Ghost", 2.0); _set_eff("Dark", "Dark", 0.5); _set_eff("Dark", "Fairy", 0.5)
_set_eff("Steel", "Fire", 0.5); _set_eff("Steel", "Water", 0.5); _set_eff("Steel", "Electric", 0.5); _set_eff("Steel", "Ice", 2.0); _set_eff("Steel", "Rock", 2.0); _set_eff("Steel", "Steel", 0.5); _set_eff("Steel", "Fairy", 2.0)
_set_eff("Fairy", "Fire", 0.5); _set_eff("Fairy", "Fighting", 2.0); _set_eff("Fairy", "Poison", 0.5); _set_eff("Fairy", "Dragon", 2.0); _set_eff("Fairy", "Dark", 2.0); _set_eff("Fairy", "Steel", 0.5)


class BattleCalculator:
    
    @staticmethod
    def _get_stat_multiplier(stage: int) -> float:
        """Returns the multiplier for a given stat stage (-6 to +6)."""
        stage = max(-6, min(6, stage))
        if stage >= 0:
            return (2.0 + stage) / 2.0
        else:
            return 2.0 / (2.0 - stage)

    @staticmethod
    def ensure_level_50_stats(pokemon: Dict[str, Any]):
        """Calculates and assigns standard Level 50 stats if not already present."""
        if "stats" in pokemon and pokemon.get("max_hp"):
            return # Already initialized
            
        level = pokemon.get("level", 50)
        base = pokemon.get("base_stats", {})
        
        # Default base stats fallback just in case
        b_hp = base.get("hp", 80)
        b_atk = base.get("attack", 80)
        b_def = base.get("defense", 80)
        b_spa = base.get("special-attack", 80)
        b_spd = base.get("special-defense", 80)
        b_spe = base.get("speed", 80)

        # Assuming IV=31, EV=0, Nature Multiplier=1.0 for balanced baseline
        iv = 31
        ev = 0
        
        # HP Formula: floor(((2 * Base + IV + EV/4) * Level) / 100) + Level + 10
        max_hp = math.floor(((2 * b_hp + iv + math.floor(ev / 4)) * level) / 100) + level + 10
        pokemon["max_hp"] = max_hp
        pokemon["current_hp"] = pokemon.get("current_hp", max_hp)
        
        # Other Stats Formula: floor(((2 * Base + IV + EV/4) * Level) / 100) + 5
        pokemon["stats"] = {
            "attack": math.floor(((2 * b_atk + iv + math.floor(ev / 4)) * level) / 100) + 5,
            "defense": math.floor(((2 * b_def + iv + math.floor(ev / 4)) * level) / 100) + 5,
            "special-attack": math.floor(((2 * b_spa + iv + math.floor(ev / 4)) * level) / 100) + 5,
            "special-defense": math.floor(((2 * b_spd + iv + math.floor(ev / 4)) * level) / 100) + 5,
            "speed": math.floor(((2 * b_spe + iv + math.floor(ev / 4)) * level) / 100) + 5,
        }

    @staticmethod
    def calculate_speed(pokemon: Dict[str, Any]) -> int:
        """Calculates speed, factoring in stat stages and the official Paralysis speed drop."""
        base_speed = pokemon.get("stats", {}).get("speed", 80)
        
        # 1. Apply Stat Stage Multiplier
        speed_stage = pokemon.get("stat_stages", {}).get("speed", 0)
        current_speed = math.floor(base_speed * BattleCalculator._get_stat_multiplier(speed_stage))
        
        # 2. Modern ROMs: Paralysis cuts speed by 50%
        if pokemon.get("status_condition") == "paralysis":
            current_speed = math.floor(current_speed * 0.5)
            
        return current_speed

    @staticmethod
    def calculate_damage(move: Dict[str, Any], attacker: Dict[str, Any], defender: Dict[str, Any], weather: Any = None) -> Dict[str, Any]:
        """Calculates authentic damage utilizing type effectiveness, STAB, physical/special checks, stat changes, and rolls."""
        power = move.get("power", 0)
        damage_class = move.get("damage_class", "physical").lower()
        
        if power == 0 or damage_class == "status":
            return {"damage": 0, "effectiveness": 1.0, "critical": False}

        level = attacker.get("level", 50)
        move_type = move.get("type", "Normal").capitalize()

        # 1. Physical vs Special Stats & Stage Modifiers
        if damage_class == "physical":
            base_atk = attacker["stats"]["attack"]
            base_def = defender["stats"]["defense"]
            atk_stage = attacker.get("stat_stages", {}).get("attack", 0)
            def_stage = defender.get("stat_stages", {}).get("defense", 0)
        else:
            base_atk = attacker["stats"]["special-attack"]
            base_def = defender["stats"]["special-defense"]
            atk_stage = attacker.get("stat_stages", {}).get("special-attack", 0)
            def_stage = defender.get("stat_stages", {}).get("special-defense", 0)

        # 4. Critical Hit (Gen 7+ Standard: 1/24 chance, 1.5x damage)
        is_crit = random.random() < (1 / 24)
        crit_mult = 1.5 if is_crit else 1.0

        # Apply Stat Stages (Crits ignore negative attack drops and positive defense boosts)
        atk_stat = math.floor(base_atk * BattleCalculator._get_stat_multiplier(atk_stage))
        def_stat = math.floor(base_def * BattleCalculator._get_stat_multiplier(def_stage))
        
        if is_crit:
            if atk_stage < 0: atk_stat = base_atk
            if def_stage > 0: def_stat = base_def

        # 2. Base Damage Formulation
        level_factor = (2 * level / 5) + 2
        base_damage = (((level_factor * power * (atk_stat / def_stat)) / 50) + 2)

        # 3. Weather Modifiers
        weather_mult = 1.0
        if weather == "rain":
            if move_type == "Water": weather_mult = 1.5
            elif move_type == "Fire": weather_mult = 0.5
        elif weather == "sun":
            if move_type == "Fire": weather_mult = 1.5
            elif move_type == "Water": weather_mult = 0.5

        # 5. Random Float Variation (0.85 to 1.00)
        random_mult = random.uniform(0.85, 1.00)

        # 6. STAB (Same-Type Attack Bonus)
        attacker_types = [t.capitalize() for t in attacker.get("types", [])]
        stab = 1.5 if move_type in attacker_types else 1.0

        # 7. Type Effectiveness
        defender_types = [t.capitalize() for t in defender.get("types", ["Normal"])]
        type_mult = 1.0
        for def_type in defender_types:
            type_mult *= TYPE_CHART.get(move_type, {}).get(def_type, 1.0)

        # Immunity check
        if type_mult == 0.0:
            return {"damage": 0, "effectiveness": 0.0, "critical": False}

        # 8. Burn Penalty (Physical attacks do half damage if burned, negated if critical hit or ability (Guts) - simplified to standard)
        burn_penalty = 0.5 if attacker.get("status_condition") == "burn" and damage_class == "physical" else 1.0

        # 9. Final Computed Damage
        final_damage = math.floor(base_damage * weather_mult * crit_mult * random_mult * stab * type_mult * burn_penalty)
        
        # Minimum 1 damage if move has power but resistance heavily minimized it
        if final_damage < 1:
            final_damage = 1

        return {
            "damage": final_damage,
            "effectiveness": type_mult,
            "critical": is_crit
        }