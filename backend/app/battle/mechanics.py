import math
import random

class BattleMechanics:
    # Standard Generation VI+ Type Chart (simplified for direct multipliers)
    TYPE_CHART = {
        "normal": {"rock": 0.5, "ghost": 0.0, "steel": 0.5},
        "fire": {"fire": 0.5, "water": 0.5, "grass": 2.0, "ice": 2.0, "bug": 2.0, "rock": 0.5, "dragon": 0.5, "steel": 2.0},
        "water": {"fire": 2.0, "water": 0.5, "grass": 0.5, "ground": 2.0, "rock": 2.0, "dragon": 0.5},
        "electric": {"water": 2.0, "electric": 0.5, "grass": 0.5, "ground": 0.0, "flying": 2.0, "dragon": 0.5},
        "grass": {"fire": 0.5, "water": 2.0, "grass": 0.5, "poison": 0.5, "ground": 2.0, "flying": 0.5, "bug": 0.5, "rock": 2.0, "dragon": 0.5, "steel": 0.5},
        "ice": {"fire": 0.5, "water": 0.5, "grass": 2.0, "ice": 0.5, "ground": 2.0, "flying": 2.0, "dragon": 2.0, "steel": 0.5},
        "fighting": {"normal": 2.0, "ice": 2.0, "poison": 0.5, "flying": 0.5, "psychic": 0.5, "bug": 0.5, "rock": 2.0, "ghost": 0.0, "dark": 2.0, "steel": 2.0, "fairy": 0.5},
        "poison": {"grass": 2.0, "poison": 0.5, "ground": 0.5, "rock": 0.5, "ghost": 0.5, "steel": 0.0, "fairy": 2.0},
        "ground": {"fire": 2.0, "electric": 2.0, "grass": 0.5, "poison": 2.0, "flying": 0.0, "bug": 0.5, "rock": 2.0, "steel": 2.0},
        "flying": {"electric": 0.5, "grass": 2.0, "fighting": 2.0, "bug": 2.0, "rock": 0.5, "steel": 0.5},
        "psychic": {"fighting": 2.0, "poison": 2.0, "psychic": 0.5, "dark": 0.0, "steel": 0.5},
        "bug": {"fire": 0.5, "grass": 2.0, "fighting": 0.5, "poison": 0.5, "flying": 0.5, "psychic": 2.0, "ghost": 0.5, "dark": 2.0, "steel": 0.5, "fairy": 0.5},
        "rock": {"fire": 2.0, "ice": 2.0, "fighting": 0.5, "ground": 0.5, "flying": 2.0, "bug": 2.0, "steel": 0.5},
        "ghost": {"normal": 0.0, "psychic": 2.0, "ghost": 2.0, "dark": 0.5},
        "dragon": {"dragon": 2.0, "steel": 0.5, "fairy": 0.0},
        "dark": {"fighting": 0.5, "psychic": 2.0, "ghost": 2.0, "dark": 0.5, "fairy": 0.5},
        "steel": {"fire": 0.5, "water": 0.5, "electric": 0.5, "ice": 2.0, "rock": 2.0, "steel": 0.5, "fairy": 2.0},
        "fairy": {"fire": 0.5, "fighting": 2.0, "poison": 0.5, "dragon": 2.0, "dark": 2.0, "steel": 0.5}
    }

    @staticmethod
    def get_type_effectiveness(move_type: str, defender_types: list) -> float:
        """Calculates total effectiveness against a dual-type defender."""
        multiplier = 1.0
        move_type = move_type.lower()
        if move_type not in BattleMechanics.TYPE_CHART:
            return multiplier
            
        for def_type in defender_types:
            def_type = def_type.lower()
            multiplier *= BattleMechanics.TYPE_CHART[move_type].get(def_type, 1.0)
        return multiplier

    @staticmethod
    def calculate_max_hp(base: int, iv: int = 31, ev: int = 84, level: int = 50) -> int:
        """Calculates official Max HP."""
        if base == 1: # Shedinja exception
            return 1
        core = math.floor(0.01 * (2 * base + iv + math.floor(0.25 * ev)) * level)
        return core + level + 10

    @staticmethod
    def calculate_stat(base: int, iv: int = 31, ev: int = 84, level: int = 50, nature_modifier: float = 1.0) -> int:
        """Calculates official non-HP stats (Atk, Def, SpA, SpD, Spe)."""
        core = math.floor(0.01 * (2 * base + iv + math.floor(0.25 * ev)) * level)
        return math.floor((core + 5) * nature_modifier)

    @staticmethod
    def get_stat_multiplier(stage: int) -> float:
        """Calculates the multiplier for stat changes (-6 to +6)."""
        stage = max(-6, min(6, stage))
        if stage >= 0:
            return (2.0 + stage) / 2.0
        else:
            return 2.0 / (2.0 - stage)

    @staticmethod
    def calculate_damage(
        level: int,
        move_power: int,
        attack_stat: float,
        defense_stat: float,
        is_stab: bool = False,
        type_effectiveness: float = 1.0,
        is_crit: bool = False,
        is_burned: bool = False,
        is_physical: bool = True
    ) -> int:
        """Executes the official Generation VI+ Pokemon damage formula."""
        if move_power == 0 or type_effectiveness == 0.0:
            return 0

        # 1. Base Damage Calculation
        step1 = math.floor((2 * level) / 5) + 2
        step2 = math.floor(step1 * move_power * (attack_stat / defense_stat))
        base_damage = math.floor(step2 / 50) + 2

        # 2. Modifiers
        critical_mod = 1.5 if is_crit else 1.0
        stab_mod = 1.5 if is_stab else 1.0
        burn_mod = 0.5 if (is_burned and is_physical and not is_crit) else 1.0
        random_factor = random.uniform(0.85, 1.00)

        # Apply all modifiers
        modifier = critical_mod * random_factor * stab_mod * type_effectiveness * burn_mod
        final_damage = math.floor(base_damage * modifier)
        
        return max(1, final_damage)