from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
import uuid

# --- Enums ---
class BattleStatus(str, Enum):
    WAITING = "waiting"       # Waiting for an opponent to join
    ACTIVE = "active"         # Battle is currently ongoing
    FINISHED = "finished"     # Battle has concluded
    FORFEITED = "forfeited"   # A player fled or disconnected

class MoveCategory(str, Enum):
    PHYSICAL = "physical"
    SPECIAL = "special"
    STATUS = "status"

class WeatherType(str, Enum):
    NONE = "none"
    SUN = "sun"
    RAIN = "rain"
    SANDSTORM = "sandstorm"
    HAIL = "hail"

# --- Models ---
class MoveState(BaseModel):
    name: str
    power: Optional[int] = 0
    accuracy: Optional[int] = 100
    type: str
    damage_class: MoveCategory
    priority: int = 0
    pp: Optional[int] = None      
    max_pp: Optional[int] = None
    
    # --- ROM Mechanic Extensions ---
    status_effect: Optional[str] = None  # e.g., "burn", "paralysis", "poison", "sleep"
    status_chance: Optional[int] = 0     # 0 to 100 chance to inflict status
    stat_changes: Optional[Dict[str, int]] = None  # e.g., {"attack": 2, "defense": -1}
    target: str = "opponent"             # "opponent" or "self"

class PokemonStats(BaseModel):
    attack: int
    defense: int
    special_attack: int = Field(alias="special-attack")
    special_defense: int = Field(alias="special-defense")
    speed: int
    
    class Config:
        populate_by_name = True

class StatStages(BaseModel):
    attack: int = 0
    defense: int = 0
    special_attack: int = Field(0, alias="special-attack")
    special_defense: int = Field(0, alias="special-defense")
    speed: int = 0
    accuracy: int = 0
    evasion: int = 0
    
    class Config:
        populate_by_name = True

class PokemonState(BaseModel):
    pokemon_id: int
    name: str
    level: int = 50
    types: List[str]
    current_hp: int
    max_hp: int
    stats: PokemonStats
    stat_stages: StatStages = Field(default_factory=StatStages)
    moves: List[MoveState]
    is_fainted: bool = False
    
    # --- ROM Mechanic Extensions ---
    status_condition: Optional[str] = None
    volatile_statuses: List[str] = Field(default_factory=list) # e.g., "confusion", "flinch", "leech_seed"
    sleep_turns: int = 0 # Tracks turns spent asleep for wake-up calculation
    toxic_turns: int = 0 # Tracks bad poison escalation (Toxic)

class PlayerState(BaseModel):
    user_id: int
    username: str
    team: List[PokemonState]
    active_pokemon_index: int = 0
    
    @property
    def active_pokemon(self) -> Optional[PokemonState]:
        if not self.team or self.active_pokemon_index >= len(self.team):
            return None
        return self.team[self.active_pokemon_index]

class BattleState(BaseModel):
    battle_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: BattleStatus = BattleStatus.WAITING
    
    # We maintain both players for a multiplayer room
    player1: PlayerState
    player2: Optional[PlayerState] = None
    
    # Notice: current_turn_user_id is REMOVED! 
    # In multiplayer, both players lock in their actions simultaneously.
    
    turn_number: int = 1
    battle_log: List[Dict[str, Any]] = [] 
    winner_id: Optional[int] = None
    
    # --- ROM Mechanic Extensions ---
    weather: WeatherType = WeatherType.NONE
    weather_turns: int = 0
    
    # Analytics for XP distribution
    telemetry_damage_dealt: int = 0
    telemetry_damage_received: int = 0


# --- In-Memory State Manager ---
# Note: In our new architecture, the WebSocket ConnectionManager in routers/battle.py 
# handles live room states. This dictionary can be used as a global fallback or for 
# REST API lookups if you need to query active matches from outside the socket context.

_active_battles: Dict[str, BattleState] = {}

def get_battle(battle_id: str) -> Optional[BattleState]:
    """Retrieve an active battle by its ID."""
    return _active_battles.get(battle_id)

def create_battle(player1: PlayerState) -> BattleState:
    """Initialize a new battle and store it."""
    new_battle = BattleState(player1=player1)
    _active_battles[new_battle.battle_id] = new_battle
    return new_battle

def update_battle(battle: BattleState) -> None:
    """Save changes to a battle."""
    _active_battles[battle.battle_id] = battle

def remove_battle(battle_id: str) -> None:
    """Clean up a battle from memory once it is finished."""
    if battle_id in _active_battles:
        del _active_battles[battle_id]

def get_all_waiting_battles() -> List[BattleState]:
    """Find all battles that need a second player."""
    return [b for b in _active_battles.values() if b.status == BattleStatus.WAITING]