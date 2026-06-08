from sqlalchemy.orm import Session
from app.models.db_models import SchemaSnapshot


def save_snapshot(db: Session, db_alias: str, db_type: str, snapshot: dict, user_id: int) -> SchemaSnapshot:
    record = SchemaSnapshot(db_alias=db_alias, db_type=db_type, snapshot=snapshot, user_id=user_id)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_all_snapshots(db: Session, user_id: int, db_alias: str = None):
    q = db.query(SchemaSnapshot).filter(SchemaSnapshot.user_id == user_id)
    if db_alias:
        q = q.filter(SchemaSnapshot.db_alias == db_alias)
    return q.order_by(SchemaSnapshot.created_at.desc()).all()
