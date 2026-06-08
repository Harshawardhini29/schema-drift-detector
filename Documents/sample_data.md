# Schema Drift Detector - Sample Data Reference

This document provides sample datasets that can be used for mock testing, database seeding, or API integrations.

---

## 1. User Authentication Data

These credentials represent pre-seeded test accounts in the local database.

| User ID | Username | Email | Password | Role |
| :--- | :--- | :--- | :--- | :--- |
| `1` | `John` | `john@gmail.com` | `password` | Administrator |
| `2` | `developer` | `dev@example.com` | `password` | Developer |

---

## 2. Database Connection Configurations

Here are standard connection string configurations for the database engines supported by the Schema Drift Detector:

### A. PostgreSQL (Standard/Local)
*   **Alias**: `local_postgres`
*   **Connection String**: `postgresql://postgres:password@localhost:5432/schema_drift_db`
*   **Type**: `postgresql`

### B. PostgreSQL (Hosted/Cloud - e.g., Supabase/Render)
*   **Alias**: `production_supabase`
*   **Connection String**: `postgresql://postgres:strongpassword@db.supabase.co:5432/postgres`
*   **Type**: `postgresql_hosted`

### C. SQLite (Local File)
*   **Alias**: `inventory_db`
*   **Connection String**: `sqlite:///C:/databases/inventory.db`
*   **Type**: `sqlite`

---

## 3. Schema Snapshots (JSON Representation)

Below is a progression of two historical schema snapshot states for a `college_db` alias.

### Snapshot 1: Initial Database Schema (Base State)
```json
{
  "students": {
    "columns": {
      "id": {"type": "INTEGER", "nullable": false},
      "name": {"type": "VARCHAR(100)", "nullable": false},
      "email": {"type": "VARCHAR(255)", "nullable": true}
    },
    "primary_keys": ["id"]
  },
  "departments": {
    "columns": {
      "id": {"type": "INTEGER", "nullable": false},
      "name": {"type": "VARCHAR(100)", "nullable": false}
    },
    "primary_keys": ["id"]
  }
}
```

### Snapshot 2: Drifted Database Schema (Modified State)
```json
{
  "students": {
    "columns": {
      "id": {"type": "INTEGER", "nullable": false},
      "name": {"type": "VARCHAR(120)", "nullable": false},
      "email": {"type": "VARCHAR(255)", "nullable": false},
      "phone": {"type": "VARCHAR(20)", "nullable": true}
    },
    "primary_keys": ["id"]
  },
  "departments": {
    "columns": {
      "id": {"type": "INTEGER", "nullable": false},
      "name": {"type": "VARCHAR(100)", "nullable": false}
    },
    "primary_keys": ["id"]
  },
  "enrollments": {
    "columns": {
      "id": {"type": "INTEGER", "nullable": false},
      "student_id": {"type": "INTEGER", "nullable": false},
      "course_id": {"type": "INTEGER", "nullable": false}
    },
    "primary_keys": ["id"]
  }
}
```

---

## 4. Calculated Schema Drift Report (Raw Diff)

This is the computed raw differences output from comparing **Snapshot 1** to **Snapshot 2**:

```json
{
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
      }
    },
    {
      "table": "students",
      "type": "nullable_changed",
      "classification": "breaking",
      "risk": "high",
      "detail": {
        "column": "email",
        "old_nullable": true,
        "new_nullable": false
      }
    },
    {
      "table": "students",
      "type": "column_added",
      "classification": "additive",
      "risk": "low",
      "detail": {
        "column": "phone",
        "new_type": "VARCHAR(20)"
      }
    },
    {
      "table": "enrollments",
      "type": "table_added",
      "classification": "additive",
      "risk": "low",
      "detail": {}
    }
  ]
}
```

---

## 5. AI LLM Analysis Report

This represents the output returned by the OpenAI/LLM Agent analyzing the drift:

```json
{
  "summary": "This drift report contains 4 changes on the 'college_db' database. The most critical change is making the 'students.email' column NOT NULL, which is a breaking change for existing clients and datasets containing empty values. Additionally, a type alteration and two additive changes (new table 'enrollments' and new column 'phone') were detected.",
  "overall_risk": "high",
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
        "old_nullable": true,
        "new_nullable": false
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
```
