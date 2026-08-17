import datetime
from datetime import date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

# ─── AUTHENTICATION SCHEMAS (ADDED FOR MAIN.PY) ───

class UserRegister(BaseModel):
    """Validates registration payloads from the Academy Gateway."""
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    """Validates inbound login attempts."""
    email: str
    password: str


# ─── USER PROFILE SCHEMAS ───

class UserResponse(BaseModel):
    id: int
    username: str
    level: int
    current_xp: int
    title: str
    battles_played: int
    wins: int
    losses: int
    win_rate: float
    
    # --- ROM Mechanic Telemetry ---
    total_critical_hits: int = 0
    total_statuses_inflicted: int = 0

    class Config:
        from_attributes = True


# ─── CORE QUIZ SCHEMAS ───

class PokemonResponse(BaseModel):
    id: int
    name: str
    primary_type: str
    secondary_type: Optional[str] = None
    sprite_url: Optional[str] = None
    artwork_url: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class QuizQuestion(BaseModel):
    pokemon_id: int  # Sent to frontend so it can track which ID to submit back
    artwork_url: str
    options: List[str]


class QuizSubmit(BaseModel):
    # Removed user_id. The backend handles this via the Bearer token authorization header!
    is_correct: bool
    pokemon_id: Optional[int] = None


# ─── TELEMETRY SCHEMAS FOR THE DAILY GAUNTLET ───

class DailyQuizSubmission(BaseModel):
    daily_correct: int
    
class LeaderboardUserResponse(BaseModel):
    """Maps global rankings to the live client leaderboard arranged by total Trainer XP."""
    id: int
    username: str
    level: int
    title: str
    current_xp: int  # Primary ranking metric weight

    model_config = ConfigDict(from_attributes=True)


# --- BATTLE ARENA SCHEMAS ---

class BattleCreate(BaseModel):
    mode: str = Field(default="quick", description="Mode of battle, e.g., quick, ranked")

class BattleAction(BaseModel):
    action_type: str = Field(..., description="Either 'move' or 'switch'")
    target_pokemon_id: Optional[int] = Field(None, description="Target Pokemon ID if switching")
    move_name: Optional[str] = Field(None, description="Name of the move if attacking")

class BattleResponse(BaseModel):
    battle_id: int
    status: str
    turn_count: int
    current_state: dict
    latest_logs: List[str]
    winner_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class BattleHistoryBase(BaseModel):
    id: int
    mode: str
    status: str
    turn_count: int
    winner_id: Optional[int] = None
    current_state: dict  
    created_at: datetime.datetime
    ended_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)