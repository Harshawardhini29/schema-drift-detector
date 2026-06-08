from sqlalchemy import Column, Integer, String, JSON, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))

def ist_now():
    return datetime.now(IST).replace(tzinfo=None)

Base = declarative_base()


class SchemaSnapshot(Base):
    __tablename__ = "schema_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    db_alias = Column(String, index=True)
    db_type = Column(String)
    snapshot = Column(JSON)
    user_id = Column(Integer, index=True, nullable=True)
    created_at = Column(DateTime, default=ist_now)


class DriftReport(Base):
    __tablename__ = "drift_reports"

    id = Column(Integer, primary_key=True, index=True)
    db_alias = Column(String, index=True)
    previous_snapshot_id = Column(Integer)
    current_snapshot_id = Column(Integer)
    raw_diff = Column(JSON)
    llm_analysis = Column(JSON)
    overall_risk = Column(String)
    user_id = Column(Integer, index=True, nullable=True)
    created_at = Column(DateTime, default=ist_now)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=ist_now)

