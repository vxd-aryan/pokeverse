from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, Float, Boolean, Date
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # Trainer Progression
    level = Column(Integer, default=1)
    current_xp = Column(Integer, default=0)
    title = Column(String, default="Novice Trainer")

    # Competitive Telemetry (Daily Quiz)
    daily_correct = Column(Integer, default=0)
    avg_response_time_sec = Column(Float, default=0.0)
    daily_streak = Column(Integer, default=0)
    last_quiz_date = Column(Date, nullable=True)

    # Battle Arena Profile Telemetry
    battles_played = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    win_rate = Column(Float, default=0.0)
    favorite_pokemon = Column(String, default="None")
    most_used_move = Column(String, default="None")
    avg_damage = Column(Float, default=0.0)
    longest_battle_turns = Column(Integer, default=0)

    # ROM Mechanic Telemetry
    total_critical_hits = Column(Integer, default=0)
    total_statuses_inflicted = Column(Integer, default=0)


class Battle(Base):
    __tablename__ = "battles"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    opponent_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Null for AI opponent
    winner_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    mode = Column(String, nullable=False, default="random")  # 'practice', 'random', 'custom'
    status = Column(String, default="active")  # 'active', 'finished', 'forfeited'
    turn_count = Column(Integer, default=0)

    # JSON snapshot holding: HP, active slots, moves, weather, stat stages, statuses
    current_state = Column(JSON, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ended_at = Column(DateTime, nullable=True)

    # Relationships
    player = relationship("User", foreign_keys=[player_id])
    opponent = relationship("User", foreign_keys=[opponent_id])
    winner = relationship("User", foreign_keys=[winner_id])
    turns = relationship("BattleTurn", back_populates="battle", cascade="all, delete-orphan")
    logs = relationship("BattleLog", back_populates="battle", cascade="all, delete-orphan")
    statistics = relationship("BattleStatistic", back_populates="battle", uselist=False, cascade="all, delete-orphan")


class BattleTurn(Base):
    __tablename__ = "battle_turns"

    id = Column(Integer, primary_key=True, index=True)
    battle_id = Column(Integer, ForeignKey("battles.id"), nullable=False)
    turn_number = Column(Integer, nullable=False)

    player_action = Column(JSON, nullable=False)    # Contains move_id or switch_pokemon_id
    opponent_action = Column(JSON, nullable=False)  # Contains AI/Opponent move or switch
    resulting_state = Column(JSON, nullable=False)  # Complete snapshot post-resolution

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    battle = relationship("Battle", back_populates="turns")


class BattleLog(Base):
    __tablename__ = "battle_logs"

    id = Column(Integer, primary_key=True, index=True)
    battle_id = Column(Integer, ForeignKey("battles.id"), nullable=False)
    turn_number = Column(Integer, nullable=False)

    message = Column(String, nullable=False)  # e.g., "Pikachu used Thunderbolt!"
    event_type = Column(String, nullable=False)  # 'damage', 'status', 'switch', 'weather', 'faint'

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    battle = relationship("Battle", back_populates="logs")


class BattleStatistic(Base):
    __tablename__ = "battle_statistics"

    id = Column(Integer, primary_key=True, index=True)
    battle_id = Column(Integer, ForeignKey("battles.id"), nullable=False)

    damage_dealt = Column(Integer, default=0)
    damage_received = Column(Integer, default=0)
    pokemon_used = Column(JSON, nullable=False, default=list)  # List of string names used by player
    moves_used = Column(JSON, nullable=False, default=dict)    # Dict matching move names to counts
    battle_duration_seconds = Column(Integer, default=0)

    # ROM Mechanic Session Telemetry
    critical_hits_landed = Column(Integer, default=0)
    statuses_inflicted = Column(Integer, default=0)
    weather_summoned = Column(Integer, default=0)

    battle = relationship("Battle", back_populates="statistics")