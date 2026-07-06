from sqlalchemy import Column, Integer, String, Float, Date
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # Trainer Stats (Your Existing Columns)
    level = Column(Integer, default=1)
    current_xp = Column(Integer, default=0)
    title = Column(String, default="Novice Trainer")

    # Competitive Telemetry (New Daily Quiz Columns)
    daily_correct = Column(Integer, default=0)
    avg_response_time_sec = Column(Float, default=0.0)
    daily_streak = Column(Integer, default=0)
    last_quiz_date = Column(Date, nullable=True)