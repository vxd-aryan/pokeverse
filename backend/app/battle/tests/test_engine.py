import pytest
from backend.app.battle.calculator import BattleCalculator
from backend.app.battle.engine import BattleEngine

def test_speed_calculation():
    pokemon = {
        "stats": {"speed": 100},
        "stat_stages": {"speed": 2}, # +2 speed = 2x multiplier
        "status_condition": None
    }
    speed = BattleCalculator.calculate_speed(pokemon)
    assert speed == 200

    pokemon["status_condition"] = "paralysis"
    speed_paralyzed = BattleCalculator.calculate_speed(pokemon)
    assert speed_paralyzed == 100 # Paralyzed cuts speed in half

def test_type_effectiveness():
    # Thunderbolt (Electric) on Gyarados (Water/Flying) -> 4x effective
    effectiveness = BattleCalculator.get_type_effectiveness("electric", ["water", "flying"])
    assert effectiveness == 4.0

    # Earthquake (Ground) on Charizard (Fire/Flying) -> 0x effective (Immune)
    immunity = BattleCalculator.get_type_effectiveness("ground", ["fire", "flying"])
    assert immunity == 0.0

def test_damage_calculator():
    attacker = {
        "level": 50,
        "types": ["electric"],
        "stats": {"attack": 100, "special-attack": 150},
        "stat_stages": {}
    }
    defender = {
        "types": ["water"],
        "stats": {"defense": 100, "special-defense": 100},
        "stat_stages": {}
    }
    move = {
        "power": 90,
        "type": "electric",
        "damage_class": "special"
    }

    result = BattleCalculator.calculate_damage(move, attacker, defender, weather="clear")
    assert result["damage"] > 0
    assert result["effectiveness"] == 2.0 # Electric vs Water

def test_battle_engine_faint_condition():
    mock_p1 = {
        "pokemon_id": 1, "name": "bulbasaur", "level": 50, "max_hp": 100, "current_hp": 10,
        "types": ["grass"], "is_fainted": False, "stats": {"speed": 50, "special-defense": 10}, "stat_stages": {}
    }
    mock_p2 = {
        "pokemon_id": 4, "name": "charmander", "level": 50, "max_hp": 100, "current_hp": 100,
        "types": ["fire"], "is_fainted": False, "stats": {"speed": 100, "special-attack": 100}, "stat_stages": {}
    }

    initial_state = {
        "turn_count": 1,
        "player_active": mock_p1, "opponent_active": mock_p2,
        "player_party": [mock_p1], "opponent_party": [mock_p2],
        "weather": "clear", "player_id": 1, "opponent_id": 2
    }

    engine = BattleEngine(initial_state)
    
    # Opponent (Charmander) is faster and uses Flamethrower
    p_act = {"action_type": "move", "move": {"name": "tackle", "power": 40, "type": "normal", "damage_class": "physical", "priority": 0}}
    o_act = {"action_type": "move", "move": {"name": "flamethrower", "power": 90, "type": "fire", "damage_class": "special", "priority": 0}}

    new_state, logs, game_over, winner = engine.process_turn(p_act, o_act)

    assert new_state["player_active"]["is_fainted"] is True
    assert new_state["player_active"]["current_hp"] == 0
    assert game_over is True
    assert winner == 2