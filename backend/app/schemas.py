import datetime
import re
from datetime import date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

# ─── AUTHENTICATION SCHEMAS ───
#
# Email is normalised to lowercase here, not just validated.
# Previously `register` stored whatever was typed and `login` did an
# exact-match lookup, so "Jp@Example.com" and "jp@example.com" were
# two different accounts — and signing in with the wrong
# capitalisation failed as "invalid email or password", which looks
# identical to a forgotten password.
#
# The pattern check is a deliberate regex rather than pydantic's
# EmailStr: EmailStr needs the separate `email-validator` package,
# and a missing dependency would stop the API booting at all. This
# catches obvious rubbish without adding a way to fail at import.

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# bcrypt hashes at most 72 bytes and raises beyond that, so the cap
# is enforced at the edge rather than discovered at hashing time.
PASSWORD_MIN = 8
PASSWORD_MAX = 72


def _normalise_email(value: str) -> str:
    email = (value or "").strip().lower()
    if not _EMAIL_RE.match(email):
        raise ValueError("Enter a valid email address.")
    return email


class UserRegister(BaseModel):
    """Validates registration payloads from the Academy Gateway."""
    # Minimum of 2, not 3: plenty of people have two-letter names,
    # and an arbitrary floor that rejects them is a bad first
    # impression. Existing accounts aren't re-validated either way.
    username: str = Field(..., min_length=2, max_length=20)
    email: str
    password: str = Field(..., min_length=PASSWORD_MIN, max_length=PASSWORD_MAX)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return _normalise_email(v)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        name = (v or "").strip()
        if not name:
            raise ValueError("Username cannot be blank.")
        if not re.match(r"^[A-Za-z0-9 _.-]+$", name):
            raise ValueError("Username can only contain letters, numbers, spaces, . _ and -")
        return name


class UserLogin(BaseModel):
    """Validates inbound login attempts."""
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        # Whitespace only. Deliberately NOT lowercased.
        #
        # Registration lowercases, so no new account can differ from
        # another by case alone. But accounts created before that rule
        # existed can, and those pairs are genuinely separate accounts
        # with separate passwords. Lowercasing here would collapse the
        # address the user typed before the lookup could tell them
        # apart, making one of the two permanently unreachable.
        #
        # `find_user_by_email` tries an exact match first and only then
        # falls back to a case-insensitive one, so someone typing an
        # unusual capitalisation of a unique address still gets in.
        return (v or "").strip()


class AuthResponse(BaseModel):
    """What /api/auth/login and /api/auth/register return.

    `access_token` is a signed JWT. It replaced the old scheme where
    the client was handed its own email and sent that back as a
    bearer token — which meant knowing an address was a full login.
    """
    message: str
    access_token: str
    token_type: str = "bearer"
    email: str
    username: str


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

    # Pydantic v2 style, matching the rest of this file. The old
    # `class Config: from_attributes = True` still works but is
    # deprecated.
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
    # Bounded here as well as in the route. The route already
    # rejected scores above 10; stating the range in the schema means
    # a bad payload is a 422 with a clear message rather than
    # business logic catching it later.
    daily_correct: int = Field(..., ge=0, le=10)


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


# ─── JOURNEY SAVE SCHEMAS ───

class JourneyStatePut(BaseModel):
    """A Journey save being written up from the client.

    `state` is the client's whole save blob, stored opaquely. The
    backend never inspects its contents - the shape belongs to the
    frontend and has already changed several times.

    `save_version` and `updated_at` travel alongside it so the server
    can tell a newer save from an older one without parsing the blob.
    """
    state: dict
    save_version: int = Field(..., ge=1)
    updated_at: Optional[datetime.datetime] = None


class JourneyStateResponse(BaseModel):
    """What the client gets back when it asks for its save."""
    state: Optional[dict] = None
    save_version: Optional[int] = None
    updated_at: Optional[datetime.datetime] = None
    # True when the server has never been given a save for this
    # account, so the client knows to keep whatever it has locally
    # rather than treating the empty response as "your save is gone".
    empty: bool = False