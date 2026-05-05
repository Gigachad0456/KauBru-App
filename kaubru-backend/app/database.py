from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Read DATABASE_URL directly from environment first, then fall back to config
# This ensures Railway's env vars are picked up before the module is imported
_DATABASE_URL = os.environ.get("DATABASE_URL") or "sqlite:///./kaubru.db"

# Fix for Railway/Heroku style URLs
if _DATABASE_URL.startswith("postgres://"):
    _DATABASE_URL = _DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite needs 'check_same_thread', but Postgres does not
connect_args = {"check_same_thread": False} if _DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(_DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that provides a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
