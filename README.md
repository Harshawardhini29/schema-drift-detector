# 🔍 Schema Drift Detector

> An AI-powered full-stack web application that monitors database schema changes, detects structural drift, and uses an **LLM agent** (via OpenRouter) to classify risk, explain downstream impact, and generate mitigation recommendations — all in real time.

---

## 📋 Table of Contents

- [What It Does](#what-it-does)
- [Full-Stack Architecture Overview](#full-stack-architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [End-to-End Application Flow](#end-to-end-application-flow)
  - [1. User Authentication Flow](#1-user-authentication-flow)
  - [2. Database Connection Flow](#2-database-connection-flow)
  - [3. Schema Scan & Drift Detection Flow](#3-schema-scan--drift-detection-flow)
  - [4. AI Analysis Flow](#4-ai-analysis-flow)
  - [5. Auto-Scan Background Flow](#5-auto-scan-background-flow)
- [Frontend](#frontend)
  - [Pages & Routes](#pages--routes)
  - [Components](#components)
  - [State Management](#state-management)
  - [API Integration](#api-integration)
- [Backend](#backend)
  - [API Endpoints](#api-endpoints)
  - [Services Layer](#services-layer)
  - [AI Agent](#ai-agent)
  - [Database Models](#database-models)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
  - [Local Setup](#local-setup)
  - [Docker Setup](#docker-setup)
- [Seeding Demo Data](#seeding-demo-data)
- [Features](#features)

---

## What It Does

Schema Drift Detector solves a critical DevOps and data engineering problem: **detecting unintended or unexpected changes to database schemas** before they break production applications.

| Problem | Solution |
|---------|----------|
| Production DB schema changed without notice | Take periodic snapshots and compare automatically |
| Hard to know if a schema change is safe | LLM classifies each change: `additive`, `breaking`, `potentially_breaking` |
| Impact on ETL/API/ML is unclear | AI explains downstream effects in plain language |
| No history of schema evolution | Full snapshot + drift report history with timeline |

---

## Full-Stack Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        BROWSER (React + Vite)                        │
│   Login → Dashboard → Connect DB → Run Scan → Reports → Snapshots    │
│   AuthContext (JWT in localStorage) + axios interceptor              │
└──────────────────────────┬───────────────────────────────────────────┘
                           │  HTTP (axios) — Authorization: Bearer JWT
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  FASTAPI BACKEND (:8000)                             │
│   CORS Middleware → JWT Auth Guard → API Router                      │
│   ├── /api/auth/*     → Auth endpoints                               │
│   └── /api/*          → Scan, Snapshots, Reports, Dashboard          │
└───────┬──────────────────────────────────────────────┬───────────────┘
        │                                              │
        ▼                                              ▼
┌───────────────────┐                    ┌─────────────────────────────┐
│  Services Layer   │                    │     AI Agent Layer           │
│ • SchemaExtractor │──► Target DB       │  drift_analyzer.py           │
│ • DiffEngine      │   (user's DB)      │  → OpenRouter API            │
│ • SnapshotService │                    │  → LLM (GPT-3.5-turbo)       │
│ • AuthService     │                    │  ← JSON: risk + mitigation   │
└───────┬───────────┘                    └────────────┬────────────────┘
        │                                             │
        ▼                                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│               APP DATABASE (PostgreSQL / SQLite)                      │
│   users │ schema_snapshots │ drift_reports                           │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19 |
| Build Tool | Vite | 5 |
| Routing | React Router DOM | 7 |
| Styling | Tailwind CSS | 3.4 |
| HTTP Client | Axios | 1.17 |
| Charts | Recharts | 3.8 |
| Icons | Lucide React | 1.17 |

### Backend
| Layer | Technology | Version |
|-------|-----------|---------|
| API Framework | FastAPI | 0.115 |
| ASGI Server | Uvicorn | 0.32 |
| ORM | SQLAlchemy | 2.0 |
| Database | PostgreSQL 15 / SQLite | — |
| Auth | PyJWT + bcrypt | 2.10 / 4.2 |
| Validation | Pydantic | 2.9 |
| LLM Client | openai SDK | 1.82 |
| LLM Orchestration | LangChain + langchain-openai | 0.3 |
| LLM Gateway | OpenRouter | — |
| Config | python-dotenv | 1.0 |
| Containerization | Docker + Docker Compose | — |

---

## Project Structure

```
schema-drift-detector/
├── docker-compose.yml              # Orchestrates postgres + backend + frontend
├── README.md                       # ← You are here
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── seed.py                     # Demo data loader
│   ├── .env.example
│   └── app/
│       ├── main.py                 # FastAPI app, CORS, startup
│       ├── api/
│       │   ├── routes.py           # Root router
│       │   ├── auth.py             # Auth endpoints + JWT guard
│       │   └── scan.py             # Scan, snapshots, reports, dashboard
│       ├── models/
│       │   ├── database.py         # SQLAlchemy engine + session
│       │   └── db_models.py        # User, SchemaSnapshot, DriftReport
│       ├── services/
│       │   ├── auth.py             # bcrypt + JWT helpers
│       │   ├── schema_extractor.py # Connects to target DB, reads schema
│       │   ├── diff_engine.py      # Pure-Python schema comparator
│       │   └── snapshot_service.py # CRUD for snapshots
│       └── agents/
│           └── drift_analyzer.py   # LLM agent (OpenRouter call)
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── package.json
    └── src/
        ├── main.jsx                # React entry point
        ├── App.jsx                 # Router + Auth guard + Auto-scan hook
        ├── api.js                  # Axios instance + all API call exports
        ├── index.css               # Global styles
        ├── context/
        │   └── AuthContext.jsx     # Auth state (login, register, logout)
        ├── components/
        │   ├── Sidebar.jsx         # Fixed nav sidebar with user info
        │   └── Badges.jsx          # RiskBadge component
        └── pages/
            ├── Login.jsx           # Login + register form
            ├── Dashboard.jsx       # Stats, pie chart, bar chart, recent events
            ├── ConnectDB.jsx       # Add/manage DB connections + test connection
            ├── Scan.jsx            # Trigger manual scan, view LLM results
            ├── Reports.jsx         # Drift report list + full detail view
            └── Snapshots.jsx       # Snapshot history + schema viewer
```

---

## End-to-End Application Flow

### 1. User Authentication Flow

```
User opens http://localhost:5173
         │
         ▼
   AuthContext loads
   ├── Reads token from localStorage
   ├── Calls GET /api/auth/me to validate token
   │   ├── Valid → sets user state → redirect to /
   │   └── Invalid/expired → clears token → redirect to /login
         │
         ▼
   Login.jsx renders
   ├── User fills username + password (or registers)
   ├── Calls POST /api/auth/login (or /register)
   │   Backend: verifies bcrypt hash → creates JWT (24h expiry)
   ├── Stores access_token in localStorage
   └── React Router navigates to / (Dashboard)

All subsequent API requests (axios interceptor):
   config.headers.Authorization = `Bearer ${token}`
```

---

### 2. Database Connection Flow

```
User → Databases page (/connect)
         │
         ▼
ConnectDB.jsx
├── User enters: DB alias, connection string, DB type
├── Clicks "Test Connection"
│   → POST /api/test-connection { connection_string }
│   → Backend: SQLAlchemy.create_engine() + SELECT 1
│   ← { success: true, message: "Connection successful!" }
│
├── User enables "Auto-scan" toggle + sets interval (minutes)
└── Connection saved to localStorage as db_connections[]
    {
      db_alias, connection_string, db_type,
      auto_take: true, auto_take_interval: 60,
      last_auto_take: null
    }
```

---

### 3. Schema Scan & Drift Detection Flow

```
User → Run Scan page (/scan)
         │
         ▼
Scan.jsx
├── Loads saved connections from localStorage
├── User selects a DB and clicks "Run AI Scan"
│
└── POST /api/scan { connection_string, db_alias, db_type }
    │
    │ BACKEND PROCESSING:
    │
    ├── 1. JWT Auth Guard validates Bearer token
    │
    ├── 2. Schema Extractor (schema_extractor.py)
    │      • SQLAlchemy inspect(engine) on target DB
    │      • Reads: tables, columns (type, nullable, default),
    │        primary_keys, foreign_keys, indexes
    │      • Returns normalized schema dict
    │
    ├── 3. Save Current Snapshot (snapshot_service.py)
    │      • Persists SchemaSnapshot to app DB
    │      • { db_alias, db_type, snapshot JSON, created_at }
    │
    ├── 4. Fetch Previous Snapshot
    │      • Query: ORDER BY created_at DESC OFFSET 1
    │      • If none → return { drift_detected: false }
    │        (first scan, no baseline yet)
    │
    ├── 5. Diff Engine (diff_engine.py)
    │      • Compares previous vs current schema
    │      • Detects:
    │        - table_added / table_removed
    │        - column_added / column_removed
    │        - column_type_changed
    │        - nullable_changed
    │        - primary_key_changed
    │      • Returns: { total_changes, changes: [...] }
    │
    ├── 6. AI Drift Analysis (drift_analyzer.py)
    │      • If no changes → { overall_risk: "none" }
    │      • Sends full context to OpenRouter LLM:
    │        - Previous schema JSON
    │        - Current schema JSON
    │        - Detected changes list
    │      • LLM returns structured JSON per change:
    │        { classification, risk, impact, mitigation }
    │      • Assigns overall_risk (highest across all changes)
    │
    ├── 7. Persist Drift Report
    │      • Saves DriftReport to app DB with:
    │        raw_diff + llm_analysis + overall_risk
    │
    └── 8. Return to Frontend
           {
             drift_detected, total_changes, overall_risk,
             report_id, snapshot_id, llm_analysis
           }

Frontend (Scan.jsx):
  ├── Shows per-change cards with:
  │   • Classification badge (Breaking / Additive / Potentially Breaking)
  │   • Risk level badge (High / Medium / Low)
  │   • Impact explanation (plain language)
  │   └── Mitigation steps
  └── Links to full report at /reports/:id
```

---

### 4. AI Analysis Flow

```
drift_analyzer.py receives:
  { diff, previous_schema, current_schema }
         │
         ▼
  If total_changes == 0 → return { overall_risk: "none" }
         │
         ▼
  Build LLM prompt:
  ┌─────────────────────────────────────────────────────┐
  │ SYSTEM: "You are a senior data engineer..."         │
  │                                                     │
  │ USER:                                               │
  │ Previous Schema: { ... }                            │
  │ Current Schema:  { ... }                            │
  │ Detected Changes: [ ... ]                           │
  │                                                     │
  │ For each change provide:                            │
  │  1. classification: additive|breaking|...           │
  │  2. risk: low|medium|high                           │
  │  3. impact: downstream effect explanation           │
  │  4. mitigation: actionable steps                    │
  │                                                     │
  │ Also provide overall_risk + executive summary       │
  └─────────────────────────────────────────────────────┘
         │
         ▼
  OpenRouter API (model: openai/gpt-3.5-turbo)
  temperature: 0.2  ← deterministic, factual output
         │
         ▼
  Parse response:
  ├── Strip markdown code fences if present
  └── json.loads() → structured Python dict
         │
         ▼
  Return:
  {
    "overall_risk": "high",
    "summary": "...",
    "changes": [
      {
        "type": "nullable_changed",
        "table": "users",
        "classification": "breaking",
        "risk": "high",
        "impact": "...",
        "mitigation": "..."
      }
    ]
  }
```

---

### 5. Auto-Scan Background Flow

```
App.jsx → useAutoScan() hook (runs while logged in)
         │
         ▼
  Reads db_connections from localStorage every 30 seconds
         │
         ▼
  For each connection where auto_take == true:
    ├── Calculate: now - last_auto_take >= auto_take_interval * 60000ms
    │
    ├── If interval elapsed:
    │   → Triggers runScan({ connection_string, db_alias, db_type })
    │   → Full scan flow executes silently in background
    │   → Updates last_auto_take timestamp in localStorage
    │   → Dispatches storage event → other tabs sync
    │
    └── Logs result to browser console:
        "[Auto-Scan] Triggering schema scan for: my_production_db"
        "[Auto-Scan] Successfully completed scan for: my_production_db"
```

---

## Frontend

### Pages & Routes

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/login` | `Login.jsx` | ❌ Public | Login + Register form |
| `/` | `Dashboard.jsx` | 🔒 | Stats, risk pie chart, bar chart, recent drift events |
| `/connect` | `ConnectDB.jsx` | 🔒 | Add/manage DB connections, test connectivity |
| `/scan` | `Scan.jsx` | 🔒 | Select DB, run scan, view AI-analyzed results |
| `/reports` | `Reports.jsx` | 🔒 | Full history of all drift reports |
| `/reports/:id` | `Reports.jsx` | 🔒 | Detailed view of one drift report |
| `/snapshots` | `Snapshots.jsx` | 🔒 | Schema snapshot timeline + raw schema viewer |

### Components

| Component | File | Description |
|-----------|------|-------------|
| `Sidebar` | `components/Sidebar.jsx` | Fixed left nav with links, user info card, logout button |
| `RiskBadge` | `components/Badges.jsx` | Color-coded badge for `high / medium / low / none` |
| `Layout` | `App.jsx` | Wraps all protected pages with `Sidebar + <Outlet>` |
| `ProtectedRoute` | `App.jsx` | Redirects to `/login` if not authenticated |

### State Management

| State | Location | How |
|-------|----------|-----|
| Auth (user, token) | `AuthContext.jsx` | React Context + `localStorage` |
| DB connections list | `ConnectDB.jsx` | `localStorage["db_connections"]` |
| Dashboard data | `Dashboard.jsx` | Local `useState` + `useEffect` fetch |
| Scan results | `Scan.jsx` | Local `useState` |
| Reports list / detail | `Reports.jsx` | Local `useState` |
| Snapshots | `Snapshots.jsx` | Local `useState` |

### API Integration

All API calls are defined in [`src/api.js`](frontend/src/api.js). Axios is configured with:
- **Base URL:** `VITE_API_URL` env var (defaults to `http://localhost:8000/api`)
- **Timeout:** 60 seconds (LLM calls can be slow)
- **Request interceptor:** Automatically attaches `Authorization: Bearer <token>` from `localStorage`

| Export | Method | Endpoint |
|--------|--------|----------|
| `login(data)` | POST | `/auth/login` |
| `register(data)` | POST | `/auth/register` |
| `getMe()` | GET | `/auth/me` |
| `testConnection(data)` | POST | `/test-connection` |
| `runScan(data)` | POST | `/scan` |
| `getDashboard()` | GET | `/dashboard` |
| `getSnapshots(db_alias)` | GET | `/snapshots` |
| `getSnapshot(id)` | GET | `/snapshots/:id` |
| `getDriftReports(db_alias)` | GET | `/drift-reports` |
| `getDriftReport(id)` | GET | `/drift-reports/:id` |

---

## Backend

### API Endpoints

All endpoints are prefixed with `/api`. Protected endpoints require `Authorization: Bearer <token>`.

#### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user, returns JWT |
| POST | `/api/auth/login` | ❌ | Login with username or email, returns JWT |
| GET | `/api/auth/me` | 🔒 | Get current user profile |

#### Scan & Schema

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/test-connection` | 🔒 | Verify target DB is reachable |
| POST | `/api/scan` | 🔒 | Run full schema drift scan (core feature) |
| GET | `/api/snapshots` | 🔒 | List snapshots (`?db_alias=` optional filter) |
| GET | `/api/snapshots/{id}` | 🔒 | Get full snapshot with schema JSON |
| GET | `/api/drift-reports` | 🔒 | List drift reports (`?db_alias=` optional filter) |
| GET | `/api/drift-reports/{id}` | 🔒 | Get full report with LLM analysis |
| GET | `/api/dashboard` | 🔒 | Aggregate stats + recent 5 reports |

#### Interactive Docs

| URL | Interface |
|-----|-----------|
| `http://localhost:8000/docs` | Swagger UI (try endpoints directly) |
| `http://localhost:8000/redoc` | ReDoc (clean reference view) |
| `http://localhost:8000/openapi.json` | Raw OpenAPI schema (import to Postman) |

---

### Services Layer

| Service | File | Responsibility |
|---------|------|---------------|
| **Schema Extractor** | `services/schema_extractor.py` | Connects to target DB via SQLAlchemy `inspect()`, reads all tables/columns/PKs/FKs/indexes |
| **Diff Engine** | `services/diff_engine.py` | Pure-Python comparison of two schema dicts; returns typed list of changes |
| **Snapshot Service** | `services/snapshot_service.py` | `save_snapshot()` and `get_all_snapshots()` CRUD helpers |
| **Auth Service** | `services/auth.py` | `hash_password()`, `verify_password()` (bcrypt), `create_access_token()`, `decode_access_token()` (JWT) |

**Diff change types detected:**

| Change Type | Description | Typical Risk |
|-------------|-------------|--------------|
| `table_added` | New table in current schema | Low |
| `table_removed` | Table dropped | High |
| `column_added` | New column added | Low |
| `column_removed` | Column dropped | High |
| `column_type_changed` | Data type modified | Medium–High |
| `nullable_changed` | NOT NULL constraint added/removed | High (if made NOT NULL) |
| `primary_key_changed` | PK columns changed | High |

---

### AI Agent

**File:** `agents/drift_analyzer.py`

- Uses the **OpenAI SDK** pointed at **OpenRouter** (`https://openrouter.ai/api/v1`)
- Model: configurable via `LLM_MODEL` env var (default: `openai/gpt-3.5-turbo`)
- Temperature: `0.2` for deterministic, factual output
- System persona: *"You are a senior data engineer and database architect"*
- Sends full context: previous schema + current schema + change list
- Returns strict JSON — strips markdown code fences automatically if LLM adds them
- Short-circuits with `{ overall_risk: "none" }` when `total_changes == 0`

**LLM Response Structure:**
```json
{
  "overall_risk": "high | medium | low | none",
  "summary": "Executive summary of the entire drift event...",
  "changes": [
    {
      "type": "nullable_changed",
      "table": "users",
      "detail": { "column": "email", "old_nullable": true, "new_nullable": false },
      "classification": "breaking | additive | potentially_breaking",
      "risk": "high | medium | low",
      "impact": "Existing rows with NULL email values will fail future inserts.",
      "mitigation": "Backfill all NULL values with a placeholder before enforcing NOT NULL."
    }
  ]
}
```

---

### Database Models

**File:** `models/db_models.py`

| Table | Columns | Purpose |
|-------|---------|---------|
| `users` | `id, username, email, hashed_password, created_at` | User accounts |
| `schema_snapshots` | `id, db_alias, db_type, snapshot (JSON), created_at` | Point-in-time schema captures |
| `drift_reports` | `id, db_alias, prev_snapshot_id, curr_snapshot_id, raw_diff, llm_analysis, overall_risk, created_at` | Drift analysis results |

> All `created_at` timestamps use **IST (UTC+5:30)** by default.

---

## Environment Variables

### Backend — `backend/.env`

Copy `backend/.env.example` to `backend/.env`:

```env
# LLM (required)
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=openai/gpt-3.5-turbo

# App database (required)
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/schema_drift_db
# For local SQLite: DATABASE_URL=sqlite:///./schema_drift.db

# JWT (optional — defaults shown)
JWT_SECRET_KEY=change-this-to-a-secure-random-string
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:8000/api
```

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `OPENROUTER_API_KEY` | ✅ | — | Get from openrouter.ai/keys |
| `DATABASE_URL` | ✅ | `sqlite:///./schema_drift.db` | App's own storage DB |
| `LLM_MODEL` | ✅ | `openai/gpt-3.5-turbo` | Any OpenRouter model slug |
| `JWT_SECRET_KEY` | ⚠️ | Hardcoded fallback | **Change in production** |
| `VITE_API_URL` | ❌ | `http://localhost:8000/api` | Frontend → backend URL |

---

## Getting Started

### Local Setup

**Prerequisites:** Python 3.11+, Node.js 20+, PostgreSQL (or use SQLite)

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/schema-drift-detector.git
cd schema-drift-detector
```

**Backend:**
```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env: add OPENROUTER_API_KEY and DATABASE_URL

# Start backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
echo "VITE_API_URL=http://localhost:8000/api" > .env

# Start dev server
npm run dev
```

**Open the app:** http://localhost:5173  
**API Docs (Swagger):** http://localhost:8000/docs

---

### Docker Setup

```bash
# From the project root
# Set your OpenRouter API key first
$env:OPENROUTER_API_KEY="your_key_here"   # PowerShell
# export OPENROUTER_API_KEY="your_key"    # Linux/macOS

# Start all 3 services
docker-compose up --build

# Detached mode
docker-compose up -d --build

# Tear down (keep data)
docker-compose down

# Tear down + wipe DB
docker-compose down -v
```

| Service | Port | Description |
|---------|------|-------------|
| `postgres` | 5432 | PostgreSQL 15 app database |
| `backend` | 8000 | FastAPI server |
| `frontend` | 5173 | Vite React dev server |

---

## Seeding Demo Data

Populate the database with demo users, snapshots, and a pre-built drift report:

```bash
# From backend/ directory (with venv active)
cd backend
python seed.py
```

**Seeds:**
| Resource | Details |
|----------|---------|
| Users | `John` / `password` and `developer` / `password` |
| Snapshots | 2 snapshots for `college_db` (initial → drifted) |
| Drift Report | 1 report with 4 changes: 1 breaking (HIGH), 1 medium, 2 low |

The script is **idempotent** — safe to run multiple times.

---

## Features

- 🔐 **JWT Authentication** — secure register/login with bcrypt passwords and 24-hour tokens
- 🗄 **Multi-DB Support** — connect to any PostgreSQL or SQLite database
- 📸 **Schema Snapshots** — capture full schema (tables, columns, types, PKs, FKs, indexes)
- ⚙️ **Deterministic Diff Engine** — pure-Python comparator detects 7 types of schema changes
- 🤖 **LLM Risk Analysis** — per-change classification, risk scoring, impact + mitigation in plain English
- 📊 **Dashboard** — total scans, drift count, risk distribution pie/bar charts, recent events
- 📋 **Drift Report History** — full timeline of all drift events with executive AI summaries
- 🕑 **Snapshot History** — browse and inspect raw schema JSON at any point in time
- ⏱ **Auto-Scan** — background polling that triggers scans automatically on a user-defined interval
- 🐳 **Docker Ready** — one-command `docker-compose up` for full stack
- 📖 **Swagger UI** — interactive API docs auto-generated at `/docs`

---

*Schema Drift Detector v1.0.0 — Full-Stack Documentation — June 2026*
