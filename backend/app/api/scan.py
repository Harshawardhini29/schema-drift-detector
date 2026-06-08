from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.models.database import get_db
from app.models.db_models import DriftReport, SchemaSnapshot
from app.services.schema_extractor import extract_schema
from app.services.diff_engine import compute_diff
from app.services.snapshot_service import save_snapshot, get_all_snapshots
from app.agents.drift_analyzer import analyze_drift
from app.api.auth import get_current_user

router = APIRouter()


class ScanRequest(BaseModel):
    connection_string: str
    db_alias: str
    db_type: Optional[str] = "postgresql"


class TestConnectionRequest(BaseModel):
    connection_string: str


def _run_scan_logic(db: Session, db_alias: str, db_type: str, connection_string: str, user_id: int):
    try:
        current_schema = extract_schema(connection_string)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Connection failed: {str(e)}")

    current_snap = save_snapshot(db, db_alias, db_type, current_schema, user_id)

    previous_snap = (
        db.query(SchemaSnapshot)
        .filter(SchemaSnapshot.db_alias == db_alias, SchemaSnapshot.user_id == user_id)
        .order_by(SchemaSnapshot.created_at.desc())
        .offset(1)
        .first()
    )

    if previous_snap is None:
        return {
            "message": "First snapshot saved. No previous snapshot to compare.",
            "snapshot_id": current_snap.id,
            "drift_detected": False,
        }

    diff = compute_diff(previous_snap.snapshot, current_schema)
    llm_analysis = analyze_drift(diff, previous_snap.snapshot, current_schema)

    report = DriftReport(
        db_alias=db_alias,
        previous_snapshot_id=previous_snap.id,
        current_snapshot_id=current_snap.id,
        raw_diff=diff,
        llm_analysis=llm_analysis,
        overall_risk=llm_analysis.get("overall_risk", "unknown"),
        user_id=user_id,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "message": "Scan complete",
        "snapshot_id": current_snap.id,
        "drift_detected": diff["total_changes"] > 0,
        "total_changes": diff["total_changes"],
        "overall_risk": llm_analysis.get("overall_risk"),
        "report_id": report.id,
        "llm_analysis": llm_analysis,
    }


@router.post("/test-connection", dependencies=[Depends(get_current_user)])
def test_connection(req: TestConnectionRequest):
    conn_str = req.connection_string
    if not conn_str:
        raise HTTPException(status_code=400, detail="Connection string cannot be empty")
    
    if conn_str.startswith("postgres://"):
        conn_str = conn_str.replace("postgres://", "postgresql://", 1)

    try:
        from sqlalchemy import create_engine, text
        engine = create_engine(conn_str)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine.dispose()
        return {"success": True, "message": "Connection successful!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Connection failed: {str(e)}")


@router.post("/scan")
def run_scan(req: ScanRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return _run_scan_logic(db, req.db_alias, req.db_type, req.connection_string, current_user.id)


@router.get("/snapshots")
def list_snapshots(db_alias: Optional[str] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    snaps = get_all_snapshots(db, current_user.id, db_alias)
    return [
        {
            "id": s.id,
            "db_alias": s.db_alias,
            "db_type": s.db_type,
            "created_at": s.created_at.isoformat(),
            "table_count": len(s.snapshot),
        }
        for s in snaps
    ]


@router.get("/snapshots/{snapshot_id}")
def get_snapshot(snapshot_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    snap = db.query(SchemaSnapshot).filter(SchemaSnapshot.id == snapshot_id, SchemaSnapshot.user_id == current_user.id).first()
    if not snap:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    return snap


@router.get("/drift-reports")
def list_drift_reports(db_alias: Optional[str] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    q = db.query(DriftReport).filter(DriftReport.user_id == current_user.id)
    if db_alias:
        q = q.filter(DriftReport.db_alias == db_alias)
    reports = q.order_by(DriftReport.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "db_alias": r.db_alias,
            "overall_risk": r.overall_risk,
            "total_changes": r.raw_diff.get("total_changes", 0),
            "summary": r.llm_analysis.get("summary", ""),
            "created_at": r.created_at.isoformat(),
        }
        for r in reports
    ]


@router.get("/drift-reports/{report_id}")
def get_drift_report(report_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    report = db.query(DriftReport).filter(DriftReport.id == report_id, DriftReport.user_id == current_user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    total_scans = db.query(SchemaSnapshot).filter(SchemaSnapshot.user_id == current_user.id).count()
    total_drifts = db.query(DriftReport).filter(DriftReport.user_id == current_user.id).count()

    risk_counts = {"low": 0, "medium": 0, "high": 0, "none": 0}
    for r in db.query(DriftReport).filter(DriftReport.user_id == current_user.id).all():
        risk = (r.overall_risk or "none").lower()
        risk_counts[risk] = risk_counts.get(risk, 0) + 1

    recent = db.query(DriftReport).filter(DriftReport.user_id == current_user.id).order_by(DriftReport.created_at.desc()).limit(5).all()

    return {
        "total_scans": total_scans,
        "total_drifts": total_drifts,
        "risk_distribution": risk_counts,
        "recent_reports": [
            {
                "id": r.id,
                "db_alias": r.db_alias,
                "overall_risk": r.overall_risk,
                "total_changes": r.raw_diff.get("total_changes", 0),
                "created_at": r.created_at.isoformat(),
            }
            for r in recent
        ],
    }
