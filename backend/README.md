# 🔍 Schema Drift Detector — Backend

> A FastAPI-powered backend that detects database schema changes (drift) between snapshots and uses an LLM agent to classify, risk-assess, and explain each change in plain language.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture Diagram](#architecture-diagram)
- [Tech Stack](#tech-stack)
- [Tools Used](#tools-used)
- [API Testing & Swagger](#api-testing--swagger)
- [Project Structure](#project-structure)
- [End-to-End Backend Flow](#end-to-end-backend-flow)
- [Database Models](#database-models)
- [Services Layer](#services-layer)
- [AI Agent](#ai-agent)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
  - [Local Setup (without Docker)](#local-setup-without-docker)
  - [Docker Setup](#docker-setup)
- [Seeding the Database](#seeding-the-database)
- [API Documentation](#api-documentation)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Scan & Schema Endpoints](#scan--schema-endpoints)
  - [Dashboard Endpoint](#dashboard-endpoint)
- [Authentication Flow](#authentication-flow)
- [Error Handling](#error-handling)

---

## Overview

Schema Drift Detector monitors databases by taking periodic **schema snapshots** and comparing them over time. When drift is detected (columns added/removed/modified, tables added/dropped, nullability changes, primary key changes), an **LLM agent** (via OpenRouter) is invoked to:

- Classify each change (`additive`, `breaking`, `potentially_breaking`)
- Assign a risk level (`low`, `medium`, `high`)
- Explain downstream impact (ETL pipelines, APIs, analytics, ML)
- Suggest mitigation strategies

Results are stored as **Drift Reports** and exposed via a RESTful API.

---

## Architecture Diagram

> High-Level Design (HLD) of the full backend system — from client request to AI-powered drift analysis and database persistence.

![Schema Drift Detector — High Level Design](db_hld.drawio.png)

---

## Tech Stack

| Layer         | Technology                             |
|---------------|----------------------------------------|
| Framework     | FastAPI 0.115                          |
| Server        | Uvicorn 0.32                           |
| ORM           | SQLAlchemy 2.0                         |
| Database      | PostgreSQL 15 (or SQLite for dev)      |
| Auth          | JWT (PyJWT 2.10) + bcrypt 4.2          |
| LLM Agent     | OpenAI-compatible API via OpenRouter   |
| LLM Client    | `openai` SDK 1.82 + LangChain 0.3      |
| Validation    | Pydantic 2.9                           |
| Config        | python-dotenv 1.0                      |
| HTTP Client   | httpx 0.27                             |
| Containerization | Docker + Docker Compose             |

---

## Tools Used

A breakdown of every tool used across development, runtime, and operations.

### 🧠 Core Backend
| Tool | Version | Purpose |
|------|---------|----------------------------------------------------------|
| **FastAPI** | 0.115 | Web framework — async REST API with auto schema generation |
| **Uvicorn** | 0.32 | ASGI server for running FastAPI |
| **Pydantic** | 2.9 | Request/response validation and serialization |
| **Python** | 3.11 | Runtime language |

### 🗄 Database & ORM
| Tool | Version | Purpose |
|------|---------|----------------------------------------------------------|
| **SQLAlchemy** | 2.0 | ORM + query builder for all DB operations |
| **PostgreSQL** | 15 | Primary production database |
| **SQLite** | built-in | Lightweight alternative for local development |
| **psycopg2-binary** | 2.9.9 | PostgreSQL adapter for Python |

### 🔐 Authentication & Security
| Tool | Version | Purpose |
|------|---------|----------------------------------------------------------|
| **PyJWT** | 2.10 | JSON Web Token creation and verification |
| **bcrypt** | 4.2 | Password hashing with random salt |
| **python-dotenv** | 1.0 | Loads secrets from `.env` file |

### 🤖 AI / LLM
| Tool | Version | Purpose |
|------|---------|----------------------------------------------------------|
| **openai SDK** | 1.82 | OpenAI-compatible client used to call OpenRouter |
| **LangChain** | 0.3.25 | LLM orchestration utilities |
| **langchain-openai** | 0.3.16 | LangChain + OpenAI integration layer |
| **OpenRouter** | — | LLM gateway — routes to GPT-3.5-turbo or other models |

### 🐳 DevOps & Infrastructure
| Tool | Purpose |
|------|---------|
| **Docker** | Containerizes the backend into a portable image |
| **Docker Compose** | Orchestrates PostgreSQL + Backend + Frontend together |
| **Dockerfile** | `python:3.11-slim` base — installs deps, runs uvicorn |

### 🔧 Development Utilities
| Tool | Purpose |
|------|---------|
| **httpx** | Async HTTP client used internally for external calls |
| **Swagger UI** | Auto-generated interactive API docs at `/docs` |
| **ReDoc** | Alternative API docs at `/redoc` |
| **seed.py** | Seeds demo data (users, snapshots, reports) for local dev |

---

## API Testing & Swagger

FastAPI automatically generates **interactive API documentation** — no extra setup needed.

### 🔗 Available Docs

| Interface | URL | Description |
|-----------|-----|-------------|
| **Swagger UI** | `http://localhost:8000/docs` | Interactive — try endpoints directly in browser |
| **ReDoc** | `http://localhost:8000/redoc` | Clean, readable reference documentation |
| **OpenAPI JSON** | `http://localhost:8000/openapi.json` | Raw schema for import into Postman/Insomnia |

---

### 🧪 Testing with Swagger UI (Step-by-Step)

1. Start the server: `uvicorn app.main:app --reload`
2. Open **http://localhost:8000/docs** in your browser
3. **Register** a user — expand `POST /api/auth/register` → click **Try it out** → fill body → **Execute**
4. **Copy** the `access_token` from the response
5. Click the 🔒 **Authorize** button (top right) → paste token as `Bearer <token>` → **Authorize**
6. All 🔒 locked endpoints are now accessible — try `POST /api/scan` or `GET /api/dashboard`

---

### 🧪 Testing with curl

**1. Register:**
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "john", "email": "john@example.com", "password": "pass123"}'
```

**2. Login and grab token:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "john", "password": "pass123"}'
```

**3. Run a scan (replace `TOKEN` with your access_token):**
```bash
curl -X POST http://localhost:8000/api/scan \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "connection_string": "postgresql://user:password@localhost:5432/mydb",
    "db_alias": "my_production_db",
    "db_type": "postgresql"
  }'
```

**4. Get dashboard:**
```bash
curl -X GET http://localhost:8000/api/dashboard \
  -H "Authorization: Bearer TOKEN"
```

---

### 🧪 Testing with Postman

1. Import the OpenAPI schema: **File → Import** → paste `http://localhost:8000/openapi.json`
2. Postman auto-creates a collection with all endpoints
3. Run `POST /api/auth/login` → copy the token
4. Set a **Collection Variable** `token = <paste token>`
5. Add a Collection-level **Authorization** header: `Bearer {{token}}`
6. All requests in the collection will now be authenticated automatically

---

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app entry point, CORS, startup
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes.py            # Root router — registers auth + scan sub-routers
│   │   ├── auth.py              # Auth endpoints: register, login, me
│   │   └── scan.py              # Scan endpoints: test-connection, scan, snapshots, reports, dashboard
│   ├── models/
│   │   ├── __init__.py
│   │   ├── database.py          # SQLAlchemy engine, session factory, init_db()
│   │   └── db_models.py         # ORM models: User, SchemaSnapshot, DriftReport
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth.py              # JWT creation/decoding, bcrypt hashing
│   │   ├── schema_extractor.py  # Connects to target DB and introspects schema
│   │   ├── diff_engine.py       # Pure-Python diff logic (no AI)
│   │   └── snapshot_service.py  # CRUD helpers for SchemaSnapshot
│   └── agents/
│       ├── __init__.py
│       └── drift_analyzer.py    # LLM agent: sends diff to OpenRouter, parses response
├── seed.py                      # Script to seed demo users, snapshots, and reports
├── requirements.txt
├── Dockerfile
└── .env.example
```

---

## End-to-End Backend Flow

This section walks through the **complete lifecycle** of a schema drift detection scan.

```
Client (Frontend / API)
        │
        ▼
┌───────────────────┐
│  POST /api/scan   │  ← Authenticated request with connection_string + db_alias
└───────────────────┘
        │
        ▼
┌─────────────────────────────┐
│  1. JWT Auth Middleware      │  ← Validates Bearer token from Authorization header
│     (get_current_user)       │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  2. Schema Extraction           │
│     schema_extractor.py         │
│  • Connects to target DB via    │
│    SQLAlchemy + connection_string│
│  • Inspects all tables:         │
│    - column names + types       │
│    - nullable flags             │
│    - default values             │
│    - primary key constraints    │
│    - foreign key relationships  │
│    - indexes                    │
│  • Returns a structured dict    │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  3. Save Current Snapshot       │
│     snapshot_service.py         │
│  • Persists extracted schema    │
│    as a SchemaSnapshot row      │
│  • Stores db_alias, db_type,    │
│    snapshot JSON, created_at    │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  4. Fetch Previous Snapshot     │
│  • Queries SchemaSnapshot table │
│  • Orders by created_at DESC    │
│  • Offset(1) = second-latest    │
│    snapshot for same db_alias   │
│  • If none → return early       │
│    (first scan, no drift yet)   │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  5. Compute Diff                │
│     diff_engine.py              │
│  • Detects:                     │
│    - Tables added / removed     │
│    - Columns added / removed    │
│    - Column type changes        │
│    - Nullable flag changes      │
│    - Primary key changes        │
│  • Returns: { total_changes,    │
│              changes: [...] }   │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  6. AI Drift Analysis           │
│     agents/drift_analyzer.py   │
│  • If no changes → returns      │
│    { overall_risk: "none" }     │
│  • Sends diff + both schemas    │
│    to OpenRouter LLM            │
│  • System prompt: senior data   │
│    engineer persona             │
│  • LLM classifies each change:  │
│    - additive / breaking /      │
│      potentially_breaking       │
│    - risk: low / medium / high  │
│    - impact + mitigation text   │
│  • Returns structured JSON      │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  7. Persist Drift Report        │
│  • Saves DriftReport row with:  │
│    - raw_diff (JSON)            │
│    - llm_analysis (JSON)        │
│    - overall_risk (string)      │
│    - snapshot IDs               │
│    - db_alias                   │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  8. Return Response to Client   │
│  {                              │
│    message, snapshot_id,        │
│    drift_detected, total_changes│
│    overall_risk, report_id,     │
│    llm_analysis                 │
│  }                              │
└─────────────────────────────────┘
```

---

## Database Models

All models are defined in [`app/models/db_models.py`](app/models/db_models.py).

### `users` Table

Stores registered user accounts.

| Column            | Type    | Constraints              |
|-------------------|---------|--------------------------|
| `id`              | Integer | Primary Key, Auto-index  |
| `username`        | String  | Unique, Not Null, Indexed|
| `email`           | String  | Unique, Not Null, Indexed|
| `hashed_password` | String  | Not Null                 |
| `created_at`      | DateTime| Default: IST `now()`     |

---

### `schema_snapshots` Table

Stores a point-in-time snapshot of a database's full schema.

| Column       | Type    | Constraints          |
|--------------|---------|----------------------|
| `id`         | Integer | Primary Key          |
| `db_alias`   | String  | Indexed              |
| `db_type`    | String  | e.g., `"postgresql"` |
| `snapshot`   | JSON    | Full schema dict     |
| `created_at` | DateTime| Default: IST `now()` |

**`snapshot` JSON structure:**
```json
{
  "table_name": {
    "columns": {
      "col_name": {
        "type": "VARCHAR(255)",
        "nullable": true,
        "default": null
      }
    },
    "primary_keys": ["id"],
    "foreign_keys": [
      {
        "columns": ["user_id"],
        "referred_table": "users",
        "referred_columns": ["id"]
      }
    ],
    "indexes": [
      { "name": "ix_table_col", "columns": ["col_name"] }
    ]
  }
}
```

---

### `drift_reports` Table

Stores the output of a completed drift analysis.

| Column                  | Type    | Description                          |
|-------------------------|---------|--------------------------------------|
| `id`                    | Integer | Primary Key                          |
| `db_alias`              | String  | Indexed; which DB was scanned        |
| `previous_snapshot_id`  | Integer | FK reference (soft) to older snap    |
| `current_snapshot_id`   | Integer | FK reference (soft) to newer snap    |
| `raw_diff`              | JSON    | Output of `diff_engine.compute_diff()`|
| `llm_analysis`          | JSON    | Output of `drift_analyzer.analyze_drift()` |
| `overall_risk`          | String  | `"low"` / `"medium"` / `"high"` / `"none"` |
| `created_at`            | DateTime| Default: IST `now()`                 |

---

## Services Layer

### `schema_extractor.py`

Uses SQLAlchemy's `inspect()` to introspect any supported database. Connects to the **target database** (not the app's own DB), reads table metadata, and returns a normalized schema dict.

**Supported databases:** PostgreSQL, SQLite, and any SQLAlchemy-compatible DB.

---

### `diff_engine.py`

Pure-Python comparison between two schema dictionaries. Detects:

| Change Type            | Description                                  |
|------------------------|----------------------------------------------|
| `table_added`          | A new table exists in current but not previous |
| `table_removed`        | A table was dropped                          |
| `column_added`         | A new column was added to an existing table  |
| `column_removed`       | A column was removed from an existing table  |
| `column_type_changed`  | A column's data type changed                 |
| `nullable_changed`     | A column's `NOT NULL` constraint changed     |
| `primary_key_changed`  | The primary key set changed                  |

Returns:
```json
{
  "total_changes": 4,
  "changes": [
    {
      "type": "nullable_changed",
      "table": "students",
      "detail": { "column": "email", "old_nullable": true, "new_nullable": false }
    }
  ]
}
```

---

### `snapshot_service.py`

Thin CRUD helpers:
- `save_snapshot(db, db_alias, db_type, snapshot)` → creates and returns a `SchemaSnapshot`
- `get_all_snapshots(db, db_alias=None)` → returns snapshots ordered by `created_at DESC`

---

### `auth.py` (services)

Handles all cryptographic operations:
- `hash_password(password)` — bcrypt with random salt
- `verify_password(plain, hashed)` — constant-time bcrypt comparison
- `create_access_token(data, expires_delta)` — HS256 JWT with 24-hour expiry (configurable)
- `decode_access_token(token)` — validates and decodes; returns `None` on any error

**JWT Payload:**
```json
{ "sub": "username", "exp": 1749123456 }
```

---

## AI Agent

### `agents/drift_analyzer.py`

Calls the OpenRouter API (OpenAI-compatible) with a two-message conversation:

**System role:** *"You are a senior data engineer and database architect..."*

**User prompt includes:**
1. Previous schema (full JSON)
2. Current schema (full JSON)
3. Detected changes list

**Expected LLM response (strict JSON):**
```json
{
  "overall_risk": "high",
  "summary": "This drift contains a breaking nullable change on the email column...",
  "changes": [
    {
      "type": "nullable_changed",
      "table": "students",
      "detail": { "column": "email", "old_nullable": true, "new_nullable": false },
      "classification": "breaking",
      "risk": "high",
      "impact": "Existing rows with NULL emails will fail future inserts.",
      "mitigation": "Backfill NULL values before enforcing the NOT NULL constraint."
    }
  ]
}
```

The agent uses `temperature=0.2` for deterministic, factual output and strips markdown code fences if the model adds them.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
# OpenRouter API Key — get from https://openrouter.ai/keys
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=openai/gpt-3.5-turbo

# PostgreSQL connection string
# For SQLite: sqlite:///./schema_drift.db
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/schema_drift_db

# JWT Settings (optional — defaults shown)
JWT_SECRET_KEY=super-secret-schema-drift-detector-key-2026
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

| Variable                     | Required | Default                              | Description                            |
|------------------------------|----------|--------------------------------------|----------------------------------------|
| `OPENROUTER_API_KEY`         | ✅ Yes   | —                                    | API key for LLM access                 |
| `OPENROUTER_BASE_URL`        | ✅ Yes   | `https://openrouter.ai/api/v1`       | LLM provider base URL                  |
| `LLM_MODEL`                  | ✅ Yes   | `openai/gpt-3.5-turbo`               | Model to use via OpenRouter            |
| `DATABASE_URL`               | ✅ Yes   | `sqlite:///./schema_drift.db`        | App's own database connection          |
| `JWT_SECRET_KEY`             | ⚠️ Recommended | (hardcoded fallback)          | Secret for signing JWTs                |
| `JWT_ALGORITHM`              | ❌ No    | `HS256`                              | JWT signing algorithm                  |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| ❌ No    | `1440` (24 hours)                    | Token lifetime in minutes              |

---

## Getting Started

### Local Setup (without Docker)

**Prerequisites:** Python 3.11+, PostgreSQL (or use SQLite)

```bash
# 1. Clone the repo and navigate to backend
cd schema-drift-detector/backend

# 2. Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy environment config
copy .env.example .env
# Edit .env and fill in your DATABASE_URL and OPENROUTER_API_KEY

# 5. Run the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: **http://localhost:8000**
Interactive docs at: **http://localhost:8000/docs**

---

### Docker Setup

```bash
# From the project root (schema-drift-detector/)
# Set your OpenRouter API key
$env:OPENROUTER_API_KEY = "your_key_here"   # PowerShell
# export OPENROUTER_API_KEY="your_key_here"  # Linux/macOS

# Start all services (PostgreSQL + Backend + Frontend)
docker-compose up --build

# Run in detached mode
docker-compose up -d --build

# Stop all services
docker-compose down

# Stop and remove volumes (wipes database)
docker-compose down -v
```

Services started:

| Service    | Port   | Description               |
|------------|--------|---------------------------|
| `postgres` | 5432   | PostgreSQL 15 database     |
| `backend`  | 8000   | FastAPI server             |
| `frontend` | 5173   | Vite/React dev server      |

---

## Seeding the Database

The `seed.py` script populates the database with demo users, snapshots, and a drift report for development and testing:

```bash
# From the backend/ directory (with venv active)
python seed.py
```

**What it seeds:**

| Resource         | Details                                                     |
|------------------|-------------------------------------------------------------|
| Users            | `John` / `password` and `developer` / `password`           |
| Schema Snapshots | 2 snapshots for `college_db` (initial + drifted)           |
| Drift Report     | 1 report with 4 changes (breaking + additive)              |

The script is **idempotent** — running it multiple times won't create duplicate users or snapshots.

---

## API Documentation

**Base URL:** `http://localhost:8000/api`  
**Interactive Docs:** `http://localhost:8000/docs` (Swagger UI)  
**Alternative Docs:** `http://localhost:8000/redoc` (ReDoc)

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

---

### Authentication Endpoints

#### `POST /api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response `200 OK`:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**

| Status | Detail                        | Cause                        |
|--------|-------------------------------|------------------------------|
| 400    | `Username is already taken`   | Duplicate username           |
| 400    | `Email is already registered` | Duplicate email              |

---

#### `POST /api/auth/login`

Authenticate with username or email.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securepassword123"
}
```
> The `username` field accepts either a username **or** email address.

**Response `200 OK`:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**

| Status | Detail                                  | Cause                        |
|--------|-----------------------------------------|------------------------------|
| 401    | `Incorrect username/email or password`  | Bad credentials              |

---

#### `GET /api/auth/me` 🔒

Get the currently authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response `200 OK`:**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com"
}
```

**Error Responses:**

| Status | Detail                                  |
|--------|-----------------------------------------|
| 401    | `Invalid or expired authentication token`|
| 401    | `User not found`                         |

---

### Scan & Schema Endpoints

#### `POST /api/test-connection` 🔒

Test connectivity to a target database before running a full scan.

**Request Body:**
```json
{
  "connection_string": "postgresql://user:password@host:5432/mydb"
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "message": "Connection successful!"
}
```

**Error Responses:**

| Status | Detail                               |
|--------|--------------------------------------|
| 400    | `Connection string cannot be empty`  |
| 400    | `Connection failed: <error details>` |

> **Note:** `postgres://` prefix is automatically rewritten to `postgresql://` for SQLAlchemy 2.0 compatibility.

---

#### `POST /api/scan` 🔒

Run a full schema drift detection scan on a target database. This is the **core endpoint**.

**Request Body:**
```json
{
  "connection_string": "postgresql://user:password@host:5432/mydb",
  "db_alias": "my_production_db",
  "db_type": "postgresql"
}
```

| Field               | Type   | Required | Description                                   |
|---------------------|--------|----------|-----------------------------------------------|
| `connection_string` | string | ✅       | Full SQLAlchemy connection string to target DB |
| `db_alias`          | string | ✅       | A human-readable name to track this DB        |
| `db_type`           | string | ❌       | Database type (default: `"postgresql"`)        |

**Response — First scan (no previous snapshot):**
```json
{
  "message": "First snapshot saved. No previous snapshot to compare.",
  "snapshot_id": 1,
  "drift_detected": false
}
```

**Response — Subsequent scan (drift detected):**
```json
{
  "message": "Scan complete",
  "snapshot_id": 3,
  "drift_detected": true,
  "total_changes": 4,
  "overall_risk": "high",
  "report_id": 1,
  "llm_analysis": {
    "overall_risk": "high",
    "summary": "4 schema changes detected. The most critical is...",
    "changes": [
      {
        "type": "nullable_changed",
        "table": "students",
        "detail": { "column": "email", "old_nullable": true, "new_nullable": false },
        "classification": "breaking",
        "risk": "high",
        "impact": "Existing rows with NULL emails will cause failures.",
        "mitigation": "Backfill NULL values before enforcing NOT NULL."
      }
    ]
  }
}
```

**Error Responses:**

| Status | Detail                                |
|--------|---------------------------------------|
| 400    | `Connection failed: <error details>`  |

---

#### `GET /api/snapshots` 🔒

List all stored schema snapshots, optionally filtered by `db_alias`.

**Query Parameters:**

| Param      | Type   | Required | Description                                     |
|------------|--------|----------|-------------------------------------------------|
| `db_alias` | string | ❌       | Filter snapshots to a specific database alias   |

**Example:** `GET /api/snapshots?db_alias=my_production_db`

**Response `200 OK`:**
```json
[
  {
    "id": 2,
    "db_alias": "my_production_db",
    "db_type": "postgresql",
    "created_at": "2026-06-08T10:30:00",
    "table_count": 7
  },
  {
    "id": 1,
    "db_alias": "my_production_db",
    "db_type": "postgresql",
    "created_at": "2026-06-06T08:00:00",
    "table_count": 6
  }
]
```

---

#### `GET /api/snapshots/{snapshot_id}` 🔒

Get the full schema JSON of a single snapshot.

**Path Parameters:** `snapshot_id` (integer)

**Response `200 OK`:**
```json
{
  "id": 1,
  "db_alias": "my_production_db",
  "db_type": "postgresql",
  "snapshot": {
    "users": {
      "columns": {
        "id": { "type": "INTEGER", "nullable": false, "default": null },
        "email": { "type": "VARCHAR(255)", "nullable": true, "default": null }
      },
      "primary_keys": ["id"],
      "foreign_keys": [],
      "indexes": []
    }
  },
  "created_at": "2026-06-06T08:00:00"
}
```

**Error Responses:**

| Status | Detail                  |
|--------|-------------------------|
| 404    | `Snapshot not found`    |

---

#### `GET /api/drift-reports` 🔒

List all drift reports, optionally filtered by `db_alias`. Ordered by newest first.

**Query Parameters:**

| Param      | Type   | Required | Description                              |
|------------|--------|----------|------------------------------------------|
| `db_alias` | string | ❌       | Filter to a specific database alias      |

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "db_alias": "my_production_db",
    "overall_risk": "high",
    "total_changes": 4,
    "summary": "4 changes detected, including a breaking nullable change...",
    "created_at": "2026-06-08T10:45:00"
  }
]
```

---

#### `GET /api/drift-reports/{report_id}` 🔒

Get the full detail of a single drift report, including complete `raw_diff` and `llm_analysis`.

**Path Parameters:** `report_id` (integer)

**Response `200 OK`:**
```json
{
  "id": 1,
  "db_alias": "my_production_db",
  "previous_snapshot_id": 1,
  "current_snapshot_id": 2,
  "raw_diff": {
    "total_changes": 4,
    "changes": [ ... ]
  },
  "llm_analysis": {
    "overall_risk": "high",
    "summary": "...",
    "changes": [ ... ]
  },
  "overall_risk": "high",
  "created_at": "2026-06-08T10:45:00"
}
```

**Error Responses:**

| Status | Detail               |
|--------|----------------------|
| 404    | `Report not found`   |

---

### Dashboard Endpoint

#### `GET /api/dashboard` 🔒

Aggregate statistics for the dashboard overview.

**Response `200 OK`:**
```json
{
  "total_scans": 12,
  "total_drifts": 5,
  "risk_distribution": {
    "low": 2,
    "medium": 1,
    "high": 2,
    "none": 0
  },
  "recent_reports": [
    {
      "id": 5,
      "db_alias": "analytics_db",
      "overall_risk": "medium",
      "total_changes": 2,
      "created_at": "2026-06-08T10:45:00"
    }
  ]
}
```

---

## Authentication Flow

```
1. User calls POST /api/auth/register or POST /api/auth/login
           │
           ▼
2. Server validates credentials / creates user
           │
           ▼
3. Server generates JWT:
   { sub: "username", exp: <24h from now> }
   Signed with HS256 + JWT_SECRET_KEY
           │
           ▼
4. Client stores token (localStorage / memory)
           │
           ▼
5. Client sends token in all subsequent requests:
   Authorization: Bearer eyJhbGci...
           │
           ▼
6. get_current_user() dependency runs on every 🔒 route:
   a. Extracts token from Authorization header
   b. Decodes and verifies JWT signature + expiry
   c. Reads username from payload["sub"]
   d. Queries users table for that username
   e. Returns User ORM object (or raises HTTP 401)
```

---

## Error Handling

All errors follow standard HTTP status codes with a JSON body:

```json
{
  "detail": "Human-readable error message"
}
```

| Status Code | Meaning                             | Common Causes                                  |
|-------------|-------------------------------------|------------------------------------------------|
| `200`       | Success                             | —                                              |
| `400`       | Bad Request                         | Invalid input, connection failure, duplicate   |
| `401`       | Unauthorized                        | Missing/invalid/expired token, bad credentials |
| `404`       | Not Found                           | Snapshot or report ID doesn't exist            |
| `422`       | Unprocessable Entity                | Missing required request body fields (Pydantic)|
| `500`       | Internal Server Error               | Unexpected server-side error                   |

---

## Quick Reference — All API Endpoints

| Method | Endpoint                          | Auth | Description                          |
|--------|-----------------------------------|------|--------------------------------------|
| GET    | `/`                               | ❌   | Health check                         |
| POST   | `/api/auth/register`              | ❌   | Register new user                    |
| POST   | `/api/auth/login`                 | ❌   | Login and get JWT token              |
| GET    | `/api/auth/me`                    | 🔒   | Get current user profile             |
| POST   | `/api/test-connection`            | 🔒   | Test target DB connectivity          |
| POST   | `/api/scan`                       | 🔒   | Run drift detection scan             |
| GET    | `/api/snapshots`                  | 🔒   | List all snapshots                   |
| GET    | `/api/snapshots/{id}`             | 🔒   | Get full snapshot detail             |
| GET    | `/api/drift-reports`              | 🔒   | List all drift reports               |
| GET    | `/api/drift-reports/{id}`         | 🔒   | Get full drift report detail         |
| GET    | `/api/dashboard`                  | 🔒   | Get dashboard aggregate statistics   |

---

*Generated for Schema Drift Detector v1.0.0 — June 2026*
