import math
import random
from typing import Dict, Any, List, Tuple
from .mechanics import BattleMechanics

class BattleEngine:
    def __init__(self, state: Dict[str, Any]):
        self.state = state
        self.logs: List[Dict[str, Any]] = []
        self.turn_number = state.get("turn_count", 0) + 1
        
        # Ensure Level 50 base stats are populated
        for key, value in self.state.items():
            if key.startswith("active_") and isinstance(value, dict):
                self._ensure_level_50_stats(value)

    def _ensure_level_50_stats(self, pokemon: Dict[str, Any]):
        """Generates accurate stats if missing, using base_stats dictionary"""
        if "max_hp" not in pokemon or "stats" not in pokemon:
            base_stats = pokemon.get("base_stats", {"hp": 80, "attack": 80, "defense": 80, "special-attack": 80, "special-defense": 80, "speed": 80})
            
            pokemon["max_hp"] = BattleMechanics.calculate_max_hp(base_stats.get("hp", 80))
            if "current_hp" not in pokemon:
                pokemon["current_hp"] = pokemon["max_hp"]
                
            pokemon["stats"] = {
                "attack": BattleMechanics.calculate_stat(base_stats.get("attack", 80)),
                "defense": BattleMechanics.calculate_stat(base_stats.get("defense", 80)),
                "special-attack": BattleMechanics.calculate_stat(base_stats.get("special-attack", 80)),
                "special-defense": BattleMechanics.calculate_stat(base_stats.get("special-defense", 80)),
                "speed": BattleMechanics.calculate_stat(base_stats.get("speed", 80))
            }
            pokemon["stat_stages"] = {"attack": 0, "defense": 0, "special-attack": 0, "special-defense": 0, "speed": 0, "accuracy": 0, "evasion": 0}

    def _get_modified_stat(self, pokemon: Dict[str, Any], stat_name: str) -> float:
        """Returns the effective stat after stat stages are applied."""
        base_stat = pokemon.get("stats", {}).get(stat_name, 50)
        stage = pokemon.get("stat_stages", {}).get(stat_name, 0)
        multiplier = BattleMechanics.get_stat_multiplier(stage)
        
        # Speed drop from paralysis (Gen 7+ is 0.5x, Gen 6- was 0.25x. Using 0.5x)
        if stat_name == "speed" and pokemon.get("status_condition") == "paralysis":
            multiplier *= 0.5
            
        return base_stat * multiplier

    def append_log(self, msg: str, event_type: str):
        self.logs.append({"turn_number": self.turn_number, "message": msg, "event_type": event_type})

    def process_multiplayer_turn(self, p1_id: int, p1_act: Dict[str, Any], p2_id: int, p2_act: Dict[str, Any]) -> Tuple[Dict[str, Any], List[Dict[str, Any]], bool, Any]:
        order = self._determine_order_multiplayer(p1_id, p1_act, p2_id, p2_act)
        
        for attacker_id in order:
            defender_id = p2_id if attacker_id == p1_id else p1_id
            act = p1_act if attacker_id == p1_id else p2_act
            
            if act.get("action_type") == "move" and not self.state[f"active_{attacker_id}"].get("is_fainted"):
                self._execute_move_multiplayer(attacker_id, defender_id, act["move"])

        self._apply_residual_statuses_multiplayer(p1_id)
        self._apply_residual_statuses_multiplayer(p2_id)

        game_over, winner_id = self._check_victory_conditions_multiplayer(p1_id, p2_id)
        self.state["turn_count"] = self.turn_number

        return self.state, self.logs, game_over, winner_id

    def _determine_order_multiplayer(self, p1_id: int, p1_act: Dict[str, Any], p2_id: int, p2_act: Dict[str, Any]) -> List[int]:
        p1_prio = p1_act.get("move", {}).get("priority", 0) if p1_act.get("action_type") == "move" else 0
        p2_prio = p2_act.get("move", {}).get("priority", 0) if p2_act.get("action_type") == "move" else 0

        if p1_prio != p2_prio:
            return [p1_id, p2_id] if p1_prio > p2_prio else [p2_id, p1_id]

        p1_speed = self._get_modified_stat(self.state[f"active_{p1_id}"], "speed")
        p2_speed = self._get_modified_stat(self.state[f"active_{p2_id}"], "speed")

        if p1_speed != p2_speed:
            return [p1_id, p2_id] if p1_speed > p2_speed else [p2_id, p1_id]
        
        # SPEED TIE! Random 50/50
        return [p1_id, p2_id] if random.choice([True, False]) else [p2_id, p1_id]

    def _execute_move_multiplayer(self, attacker_id: int, defender_id: int, move: Dict[str, Any]):
        attacker = self.state[f"active_{attacker_id}"]
        defender = self.state[f"active_{defender_id}"]
        status = attacker.get("status_condition")
        
        # Status checks
        if status == "freeze":
            if random.randint(1, 100) <= 20:
                attacker["status_condition"] = None
                self.append_log(f"{attacker['name'].capitalize()} thawed out!", "status")
            else:
                self.append_log(f"{attacker['name'].capitalize()} is frozen solid!", "status")
                return
        elif status == "paralysis":
            if random.randint(1, 100) <= 25:
                self.append_log(f"{attacker['name'].capitalize()} is paralyzed! It can't move!", "status")
                return
        elif status == "sleep":
            if random.randint(1, 100) <= 33:
                attacker["status_condition"] = None
                self.append_log(f"{attacker['name'].capitalize()} woke up!", "status")
            else:
                self.append_log(f"{attacker['name'].capitalize()} is fast asleep.", "status")
                return

        # PP Deduction
        if move.get("current_pp") is not None:
            if move["current_pp"] <= 0:
                self.append_log(f"{attacker['name'].capitalize()} has no PP left for {move['name'].replace('-', ' ')}!", "error")
                return
            move["current_pp"] -= 1

        self.append_log(f"{attacker['name'].capitalize()} used {move['name'].replace('-', ' ').upper()}!", "move")
        
        # Accuracy Check
        accuracy = move.get("accuracy")
        if accuracy is not None:
            acc_stage = attacker.get("stat_stages", {}).get("accuracy", 0) - defender.get("stat_stages", {}).get("evasion", 0)
            acc_stage = max(-6, min(6, acc_stage))
            acc_multiplier = (3.0 + max(0, acc_stage)) / (3.0 - min(0, acc_stage))
            if random.randint(1, 100) > (accuracy * acc_multiplier):
                self.append_log(f"{attacker['name'].capitalize()}'s attack missed!", "miss")
                return

        # Damage Calculation
        damage = 0
        move_power = move.get("power", 0)
        
        if move_power > 0:
            is_physical = move.get("damage_class", "physical") == "physical"
            atk_stat_name = "attack" if is_physical else "special-attack"
            def_stat_name = "defense" if is_physical else "special-defense"
            
            # Determine critical hit (Gen 6+ is 1/16)
            is_crit = random.randint(1, 16) == 1
            
            # Type effectiveness & STAB
            defender_types = defender.get("types", ["normal"])
            effectiveness = BattleMechanics.get_type_effectiveness(move.get("type", "normal"), defender_types)
            is_stab = move.get("type", "normal") in attacker.get("types", [])

            # Ignore positive defense stages and negative attack stages on a crit
            atk = self._get_modified_stat(attacker, atk_stat_name)
            dfn = self._get_modified_stat(defender, def_stat_name)
            
            if is_crit:
                if attacker.get("stat_stages", {}).get(atk_stat_name, 0) < 0:
                    atk = attacker.get("stats", {}).get(atk_stat_name, 50)
                if defender.get("stat_stages", {}).get(def_stat_name, 0) > 0:
                    dfn = defender.get("stats", {}).get(def_stat_name, 50)

            damage = BattleMechanics.calculate_damage(
                level=attacker.get("level", 50),
                move_power=move_power,
                attack_stat=atk,
                defense_stat=dfn,
                is_stab=is_stab,
                type_effectiveness=effectiveness,
                is_crit=is_crit,
                is_burned=(attacker.get("status_condition") == "burn"),
                is_physical=is_physical
            )

            # Apply Damage
            if damage > 0:
                defender["current_hp"] = max(0, defender["current_hp"] - damage)
                if effectiveness > 1.0:
                    self.append_log("It's super effective!", "damage")
                elif 0.0 < effectiveness < 1.0:
                    self.append_log("It's not very effective...", "damage")
                if is_crit:
                    self.append_log("A critical hit!", "damage")
                    
                self.append_log(f"{defender['name'].capitalize()} took {damage} damage!", "damage")
            elif effectiveness == 0:
                self.append_log(f"It had no effect on {defender['name'].capitalize()}!", "damage")

        # Stat Changes
        if move.get("stat_changes") and not defender.get("is_fainted"):
            for stat, change in move["stat_changes"].items():
                target = attacker if move.get("target") == "self" else defender
                if "stat_stages" not in target:
                    target["stat_stages"] = {"attack": 0, "defense": 0, "special-attack": 0, "special-defense": 0, "speed": 0, "accuracy": 0, "evasion": 0}
                
                current_stage = target["stat_stages"].get(stat, 0)
                new_stage = max(-6, min(6, current_stage + change))
                if current_stage != new_stage:
                    target["stat_stages"][stat] = new_stage
                    direction = "rose" if change > 0 else "fell"
                    self.append_log(f"{target['name'].capitalize()}'s {stat.replace('-', ' ')} {direction}!", "stat_change")

        # Status Effects
        if move.get("status_effect") and move["status_effect"] != "none" and not defender.get("is_fainted"):
            if defender.get("status_condition") is None:
                chance = move.get("status_chance") or 100
                if random.randint(1, 100) <= chance:
                    defender["status_condition"] = move["status_effect"]
                    self.append_log(f"{defender['name'].capitalize()} was afflicted with {move['status_effect']}!", "status")

        # Faint Check
        if defender["current_hp"] <= 0 and not defender.get("is_fainted"):
            defender["is_fainted"] = True
            defender["status_condition"] = None
            self.append_log(f"{defender['name'].capitalize()} fainted!", "faint")

    def _apply_residual_statuses_multiplayer(self, player_id: int):
        active = self.state[f"active_{player_id}"]
        if active.get("is_fainted", False):
            return

        cond = active.get("status_condition")
        if cond in ["poison", "burn"]:
            denominator = 8 if cond == "poison" else 16
            tick = max(1, math.floor(active["max_hp"] / denominator))
            
            active["current_hp"] = max(0, active["current_hp"] - tick)
            self.append_log(f"{active['name'].capitalize()} is hurt by its {cond}!", "status")
            
            if active["current_hp"] <= 0:
                active["is_fainted"] = True
                active["status_condition"] = None
                self.append_log(f"{active['name'].capitalize()} fainted!", "faint")

    def _check_victory_conditions_multiplayer(self, p1_id: int, p2_id: int) -> Tuple[bool, Any]:
        p1_fainted = self.state[f"active_{p1_id}"].get("is_fainted", False)
        p2_fainted = self.state[f"active_{p2_id}"].get("is_fainted", False)

        if p1_fainted and p2_fainted:
            return True, None
        if p2_fainted:
            return True, p1_id
        if p1_fainted:
            return True, p2_id
            
        return False, None