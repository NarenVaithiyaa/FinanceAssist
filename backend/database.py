from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from typing import Generator

from config import settings

# 1. Create the SQLAlchemy Engine
# The engine manages the connection pool to PostgreSQL.
engine = create_engine(
    settings.DATABASE_URL.get_secret_value(),
    echo=(settings.APP_ENV == "development")  # Logs SQL queries in development
)

# 2. Create the Session Factory
# This will be used to create individual database sessions for each request.
SessionLocal = sessionmaker(autoflush=False, autocommit=False, bind=engine)

# 3. Create the Declarative Base
# Using SQLAlchemy 2.x class-based approach. All future models will inherit from this.
class Base(DeclarativeBase):
    pass

# 4. FastAPI Database Dependency
# Yields a new database session per request and ensures it is safely closed.
def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
