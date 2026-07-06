import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Grab the URL from the environment (Render), fallback to SQLite (Local)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./pokeverse.db")

# 2. SQLAlchemy expects 'postgresql://' but many providers give 'postgres://'
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 3. Configure the engine dynamically
if DATABASE_URL.startswith("sqlite"):
    # SQLite requires this specific connect_arg to prevent thread errors
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL does not need the thread argument
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get db session in routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()