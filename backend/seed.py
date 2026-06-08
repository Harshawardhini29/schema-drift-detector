import os
import sys
import bcrypt
from datetime import datetime, timedelta

# Add backend directory to path so app modules can be loaded properly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.database import SessionLocal, init_db, DATABASE_URL
from app.models.db_models import User, SchemaSnapshot, DriftReport

def seed_db():
    print(f"Connecting to database at {DATABASE_URL}...")
    init_db()
    db = SessionLocal()
    try:
        # 1. Seed Users
        existing_user = db.query(User).filter(User.username == "John").first()
        if not existing_user:
            print("Seeding users...")
            hashed_pass = bcrypt.hashpw(b"password", bcrypt.gensalt()).decode("utf-8")
            john = User(username="John", email="john@gmail.com", hashed_password=hashed_pass)
            dev = User(username="developer", email="dev@example.com", hashed_password=hashed_pass)
            db.add(john)
            db.add(dev)
            db.commit()
            john_id = john.id
            print("Users seeded successfully! (John / password)")
        else:
            john_id = existing_user.id
            print("User 'John' already exists, skipping user seed.")

        # 2. Seed Snapshots
        snap_count = db.query(SchemaSnapshot).count()
        if snap_count == 0:
            print("Seeding schema snapshots...")
            # Snapshot 1 (Initial schema)
            snapshot_1_data = {
                "students": {
                    "columns": {
                        "id": {"type": "INTEGER", "nullable": False},
                        "name": {"type": "VARCHAR(100)", "nullable": False},
                        "email": {"type": "VARCHAR(255)", "nullable": True}
                    },
                    "primary_keys": ["id"]
                },
                "departments": {
                    "columns": {
                        "id": {"type": "INTEGER", "nullable": False},
                        "name": {"type": "VARCHAR(100)", "nullable": False}
                    },
                    "primary_keys": ["id"]
                }
            }
            
            snap1 = SchemaSnapshot(
                db_alias="college_db",
                db_type="postgresql",
                snapshot=snapshot_1_data,
                user_id=john_id,
                created_at=datetime.utcnow() - timedelta(days=2)
            )
            db.add(snap1)
            db.commit()
            db.refresh(snap1)

            # Snapshot 2 (Drifted schema)
            snapshot_2_data = {
                "students": {
                    "columns": {
                        "id": {"type": "INTEGER", "nullable": False},
                        "name": {"type": "VARCHAR(120)", "nullable": False}, # type length changed
                        "email": {"type": "VARCHAR(255)", "nullable": False}, # changed to NOT NULL (breaking)
                        "phone": {"type": "VARCHAR(20)", "nullable": True} # new column (additive)
                    },
                    "primary_keys": ["id"]
                },
                "departments": {
                    "columns": {
                        "id": {"type": "INTEGER", "nullable": False},
                        "name": {"type": "VARCHAR(100)", "nullable": False}
                    },
                    "primary_keys": ["id"]
                },
                "enrollments": { # new table (additive)
                    "columns": {
                        "id": {"type": "INTEGER", "nullable": False},
                        "student_id": {"type": "INTEGER", "nullable": False},
                        "course_id": {"type": "INTEGER", "nullable": False}
                    },
                    "primary_keys": ["id"]
                }
            }

            snap2 = SchemaSnapshot(
                db_alias="college_db",
                db_type="postgresql",
                snapshot=snapshot_2_data,
                user_id=john_id,
                created_at=datetime.utcnow() - timedelta(days=1)
            )
            db.add(snap2)
            db.commit()
            db.refresh(snap2)

            print("Schema snapshots seeded successfully!")

            # 3. Seed Drift Reports
            print("Seeding drift reports...")
            raw_diff = {
                "total_changes": 4,
                "changes": [
                    {
                        "table": "students",
                        "type": "column_type_changed",
                        "classification": "potentially_breaking",
                        "risk": "medium",
                        "detail": {
                            "column": "name",
                            "old_type": "VARCHAR(100)",
                            "new_type": "VARCHAR(120)"
                        },
                        "impact": "Altering column length is generally safe but might require table rebuild or index updates depending on the database engine.",
                        "mitigation": "Review table size and locks before applying type alterations."
                    },
                    {
                        "table": "students",
                        "type": "nullable_changed",
                        "classification": "breaking",
                        "risk": "high",
                        "detail": {
                            "column": "email",
                            "old_nullable": True,
                            "new_nullable": False
                        },
                        "impact": "Changing column 'email' to NOT NULL is a breaking change. Existing rows with NULL values will cause insertion failures.",
                        "mitigation": "Backfill existing NULL values with defaults before making the column NOT NULL."
                    },
                    {
                        "table": "students",
                        "type": "column_added",
                        "classification": "additive",
                        "risk": "low",
                        "detail": {
                            "column": "phone",
                            "new_type": "VARCHAR(20)"
                        },
                        "impact": "Adding column 'phone' is safe (additive change). Existing client applications will continue to operate.",
                        "mitigation": "Ensure any insert statements in API endpoints default this column or allow nulls."
                    },
                    {
                        "table": "enrollments",
                        "type": "table_added",
                        "classification": "additive",
                        "risk": "low",
                        "detail": {},
                        "impact": "Adding a new table 'enrollments' is completely additive and has no impact on existing features.",
                        "mitigation": "None required."
                    }
                ]
            }

            llm_analysis = {
                "summary": "This drift report contains 4 changes on the 'college_db' database. The most critical change is making the 'students.email' column NOT NULL, which is a breaking change for existing clients and datasets containing empty values. Additionally, a type alteration and two additive changes (new table 'enrollments' and new column 'phone') were detected.",
                "overall_risk": "high",
                "changes": raw_diff["changes"]
            }

            report = DriftReport(
                db_alias="college_db",
                previous_snapshot_id=snap1.id,
                current_snapshot_id=snap2.id,
                raw_diff=raw_diff,
                llm_analysis=llm_analysis,
                overall_risk="high",
                user_id=john_id,
                created_at=datetime.utcnow() - timedelta(hours=12)
            )
            db.add(report)
            db.commit()
            print("Drift report seeded successfully!")
        else:
            print("Database already contains snapshots, skipping snapshot seed.")

        print("Seeding process completed!")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
