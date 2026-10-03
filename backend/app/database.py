import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Render injects DATABASE_URL. Locally there's no such variable, so we
# fall back to a SQLite file sitting next to the code.
#
# That fallback is deliberately NOT allowed in production. Render's
# filesystem is ephemeral: a SQLite file there is destroyed on every
# deploy and every spin-down, so a missing DATABASE_URL would silently
# wipe every account and Journey save on each restart, looking exactly
# like a bug in the app. Better to refuse to boot.
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    if ENVIRONMENT == "production":
        raise RuntimeError(
            "DATABASE_URL is not set. Refusing to start in production with "
            "a SQLite fallback, which lives on ephemeral disk and would "
            "lose all data on the next restart. Set DATABASE_URL to your "
            "Render Postgres Internal Database URL."
        )
    DATABASE_URL = "sqlite:///./pokeverse.db"
    print("[DB] No DATABASE_URL set; using local SQLite (development only).")

# Some providers hand out the legacy 'postgres://' scheme, which
# SQLAlchemy 2.x no longer recognises.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if DATABASE_URL.startswith("sqlite"):
    # SQLite objects to being used across threads without this.
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(
        DATABASE_URL,
        # The free tier spins down after ~15 minutes idle. On wake, every
        # pooled connection is already dead and the first request fails
        # with "server closed the connection unexpectedly". pool_pre_ping
        # tests a connection before handing it out and transparently
        # reconnects if it's stale.
        pool_pre_ping=True,
        # Recycle before Postgres' own idle timeout can close them.
        pool_recycle=300,
        # Free Postgres allows few connections; a large pool exhausts it.
        pool_size=5,
        max_overflow=5,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Moved from sqlalchemy.ext.declarative, which is deprecated in 2.0.
Base = declarative_base()


def get_db():
    """FastAPI dependency: one session per request, always closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()