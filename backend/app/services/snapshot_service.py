from sqlalchemy.orm import Session
from app.models.db_models import SchemaSnapshot


def save_snapshot(db: Session, db_alias: str, db_type: str, snapshot: dict) -> SchemaSnapshot:
    record = SchemaSnapshot(db_alias=db_alias, db_type=db_type, snapshot=snapshot)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_all_snapshots(db: Session, db_alias: str = None):
    q = db.query(SchemaSnapshot)
    if db_alias:
        q = q.filter(SchemaSnapshot.db_alias == db_alias)
    return q.order_by(SchemaSnapshot.created_at.desc()).all()
