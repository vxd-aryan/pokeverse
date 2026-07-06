from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import date

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
    email: str  # Added to ensure your Next.js auth state can map trainer tokens!
    current_xp: int
    level: int
    title: str
    last_quiz_date: Optional[date] = None
    # Enable Pydantic v2 to automatically read SQLAlchemy ORM attributes
    model_config = ConfigDict(from_attributes=True)


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
    # Removed user_id. The backend handles this via the Bearer token authorization header!
    daily_correct: int = Field(..., ge=0, le=10, description="Score matching the 10-question matrix limit.")
    
class LeaderboardUserResponse(BaseModel):
    """Maps global rankings to the live client leaderboard arranged by total Trainer XP."""
    id: int
    username: str
    level: int
    title: str
    current_xp: int  # Primary ranking metric weight

    model_config = ConfigDict(from_attributes=True)