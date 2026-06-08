# 🔍 Schema Drift Detector

> An AI-powered full-stack web application that monitors database schema changes, detects structural drift, and uses an **LLM agent** (via OpenRouter) to classify risk, explain downstream impact, and generate mitigation recommendations — all in real time.

🔗 **Live Deployment**: [schema-drift-detector.vercel.app](https://schema-drift-detector-e8v2.vercel.app/)  
🎥 **Demo Video**: [Google Drive Link](https://drive.google.com/file/d/1vkb8hT86jioxVOIBoAOw10UJUbtTEG8k/view?usp=drive_link)

---

## 📋 Table of Contents

- [🔍 Schema Drift Detector](#-schema-drift-detector)
  - [📋 Table of Contents](#-table-of-contents)
  - [What It Does](#what-it-does)
  - [Full-Stack Architecture Overview](#full-stack-architecture-overview)
  - [Architecture Diagram (HLD)](#architecture-diagram-hld)
  - [Tech Stack](#tech-stack)
    - [Frontend](#frontend)
    - [Backend](#backend)
  - [Tools Used](#tools-used)
    - [🧠 Core Backend](#-core-backend)
    - [🗄 Database \& ORM](#-database--orm)
    - [🔐 Authentication \& Security](#-authentication--security)
    - [🤖 AI / LLM](#-ai--llm)
    - [⚛️ Frontend](#️-frontend)
    - [🐳 DevOps \& Infrastructure](#-devops--infrastructure)
    - [🔧 Development Utilities](#-development-utilities)
  - [Project Structure](#project-structure)
  - [End-to-End Application Flow](#end-to-end-application-flow)
    - [1. User Authentication Flow](#1-user-authentication-flow)
    - [2. Database Connection Flow](#2-database-connection-flow)
    - [3. Schema Scan \& Drift Detection Flow](#3-schema-scan--drift-detection-flow)
    - [4. AI Analysis Flow](#4-ai-analysis-flow)
    - [5. Auto-Scan Background Flow](#5-auto-scan-background-flow)
  - [Frontend](#frontend-1)
    - [Pages \& Routes](#pages--routes)
    - [Components](#components)
    - [State Management](#state-management)
    - [API Integration](#api-integration)
  - [Backend](#backend-1)
    - [Services Layer](#services-layer)
    - [AI Agent](#ai-agent)
    - [Database Models](#database-models)
      - [`users` Table](#users-table)
      - [`schema_snapshots` Table](#schema_snapshots-table)
      - [`drift_reports` Table](#drift_reports-table)
  - [API Documentation](#api-documentation)
    - [Authentication Endpoints](#authentication-endpoints)
      - [`POST /api/auth/register`](#post-apiauthregister)
      - [`POST /api/auth/login`](#post-apiauthlogin)
      - [`GET /api/auth/me` 🔒](#get-apiauthme-)
    - [Scan \& Schema Endpoints](#scan--schema-endpoints)
      - [`POST /api/test-connection` 🔒](#post-apitest-connection-)
      - [`POST /api/scan` 🔒 ← Core Endpoint](#post-apiscan---core-endpoint)
      - [`GET /api/snapshots` 🔒](#get-apisnapshots-)
      - [`GET /api/snapshots/{id}` 🔒](#get-apisnapshotsid-)
      - [`GET /api/drift-reports` 🔒](#get-apidrift-reports-)
      - [`GET /api/drift-reports/{id}` 🔒](#get-apidrift-reportsid-)
    - [Dashboard Endpoint](#dashboard-endpoint)
      - [`GET /api/dashboard` 🔒](#get-apidashboard-)
    - [Quick Reference — All Endpoints](#quick-reference--all-endpoints)
  - [API Testing \& Swagger](#api-testing--swagger)
    - [Testing with Swagger UI (Step-by-Step)](#testing-with-swagger-ui-step-by-step)
    - [Testing with curl](#testing-with-curl)
    - [Testing with Postman](#testing-with-postman)
  - [Authentication Flow](#authentication-flow)
  - [Error Handling](#error-handling)
  - [Environment Variables](#environment-variables)
    - [Backend — `backend/.env` (copy from `.env.example`)](#backend--backendenv-copy-from-envexample)
    - [Frontend — `frontend/.env`](#frontend--frontendenv)
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
| Manual monitoring is error-prone | Auto-scan feature polls DBs on a configurable interval |

---

## Full-Stack Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                    BROWSER (React + Vite :5173)                      │
│   Login → Dashboard → Connect DB → Run Scan → Reports → Snapshots   │
│   AuthContext (JWT in localStorage) + axios interceptor              │
└──────────────────────────┬───────────────────────────────────────────┘
                           │  HTTP (axios) — Authorization: Bearer JWT
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND (:8000)                            │
│   CORS Middleware → JWT Auth Guard → API Router (/api)               │
│   ├── /api/auth/*     → Auth endpoints (register, login, me)         │
│   └── /api/*          → Scan, Snapshots, Reports, Dashboard          │
└───────┬──────────────────────────────────────────┬───────────────────┘
        │                                          │
        ▼                                          ▼
┌────────────────────────┐            ┌────────────────────────────────┐
│    Services Layer       │            │        AI Agent Layer           │
│  • SchemaExtractor      │──► Target  │  agents/drift_analyzer.py      │
│  • DiffEngine           │    DB      │  → OpenRouter API              │
│  • SnapshotService      │  (user's)  │  → LLM (GPT-3.5-turbo)        │
│  • AuthService (JWT)    │            │  ← JSON: risk + mitigation     │
└───────┬────────────────┘            └────────────┬───────────────────┘
        │                                          │
        ▼                                          ▼
┌──────────────────────────────────────────────────────────────────────┐
│                APP DATABASE (PostgreSQL 15 / SQLite)                  │
│        users  |  schema_snapshots  |  drift_reports                  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Diagram (HLD)

> High-Level Design of the full backend system — from client request to AI-powered drift analysis and database persistence.

![Schema Drift Detector — High Level Design](backend/db_hld.drawio.png)

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
| Auth | JWT (PyJWT) + bcrypt | 2.10 / 4.2 |
| Validation | Pydantic | 2.9 |
| LLM Client | openai SDK | 1.82 |
| LLM Orchestration | LangChain + langchain-openai | 0.3 |
| LLM Gateway | OpenRouter | — |
| Config | python-dotenv | 1.0 |
| HTTP Client | httpx | 0.27 |
| Containerization | Docker + Docker Compose | — |

---

## Tools Used

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

### ⚛️ Frontend
| Tool | Version | Purpose |
|------|---------|----------------------------------------------------------|
| **React** | 19 | UI component library |
| **Vite** | 5 | Fast frontend build tool and dev server |
| **React Router DOM** | 7 | Client-side routing and navigation |
| **Tailwind CSS** | 3.4 | Utility-first CSS framework |
| **Axios** | 1.17 | HTTP client with interceptors for JWT injection |
| **Recharts** | 3.8 | Composable chart library (Pie, Bar charts) |
| **Lucide React** | 1.17 | SVG icon set |

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

## Project Structure

```
infinite_project/
└── schema-drift-detector/
    ├── docker-compose.yml              # Orchestrates postgres + backend + frontend
    ├── README.md                       # Project-level README
    │
    ├── backend/
    │   ├── Dockerfile
    │   ├── requirements.txt
    │   ├── seed.py                     # Demo data loader
    │   ├── .env.example
    │   ├── db_hld.drawio.png           # HLD architecture diagram
    │   ├── README.md                   # Backend-specific full documentation
    │   └── app/
    │       ├── main.py                 # FastAPI app, CORS, startup hook
    │       ├── api/
    │       │   ├── routes.py           # Root API router
    │       │   ├── auth.py             # Auth endpoints + JWT guard dependency
    │       │   └── scan.py             # Scan, snapshots, reports, dashboard
    │       ├── models/
    │       │   ├── database.py         # SQLAlchemy engine + session factory
    │       │   └── db_models.py        # ORM: User, SchemaSnapshot, DriftReport
    │       ├── services/
    │       │   ├── auth.py             # bcrypt + JWT helpers
    │       │   ├── schema_extractor.py # Connects to target DB, reads schema
    │       │   ├── diff_engine.py      # Pure-Python schema comparator
    │       │   └── snapshot_service.py # CRUD for snapshots
    │       └── agents/
    │           └── drift_analyzer.py   # LLM agent (OpenRouter call + parsing)
    │
    └── frontend/
        ├── index.html
        ├── vite.config.js
        ├── tailwind.config.js
        ├── vercel.json
        ├── package.json
        └── src/
            ├── main.jsx                # React entry point
            ├── App.jsx                 # Router + ProtectedRoute + Auto-scan hook
            ├── api.js                  # Axios instance + all API call exports
            ├── index.css               # Global base styles
            ├── App.css                 # App-level styles
            ├── context/
            │   └── AuthContext.jsx     # Auth state: login, register, logout
            ├── components/
            │   ├── Sidebar.jsx         # Fixed nav sidebar with user info + logout
            │   └── Badges.jsx          # RiskBadge color component
            └── pages/
                ├── Login.jsx           # Login + Register form (toggle)
                ├── Dashboard.jsx       # Stats cards, Pie chart, Bar chart, recent events
                ├── ConnectDB.jsx       # Add/manage DB connections + test connection
                ├── Scan.jsx            # Trigger scan, view AI-classified change cards
                ├── Reports.jsx         # Drift report list + full detail view
                └── Snapshots.jsx       # Snapshot history + raw schema JSON viewer
```

---

## End-to-End Application Flow

### 1. User Authentication Flow

```
User opens http://localhost:5173
         │
         ▼
  AuthContext.jsx initializes
  ├── Reads token from localStorage
  ├── Calls GET /api/auth/me to validate token
  │   ├── Valid   → sets user state → redirect to /
  │   └── Expired → clears token   → redirect to /login
         │
         ▼
  Login.jsx renders (toggle between Login / Register)
  ├── Login: POST /api/auth/login { username, password }
  │   Backend:
  │   ├── Query User by username OR email
  │   ├── bcrypt.checkpw(plain, hashed)
  │   └── create_access_token({ sub: username }, exp: 24h)
  │
  ├── Register: POST /api/auth/register { username, email, password }
  │   Backend:
  │   ├── Check duplicate username + email
  │   ├── bcrypt.hashpw(password)
  │   ├── Save new User to DB
  │   └── Return token immediately (auto-login)
  │
  ├── Store access_token → localStorage["token"]
  └── React Router navigates to / (Dashboard)

All subsequent Axios requests (interceptor in api.js):
  config.headers.Authorization = `Bearer ${localStorage.token}`
```

---

### 2. Database Connection Flow

```
User → Databases page (/connect) → ConnectDB.jsx
         │
         ▼
User fills form:
  ├── DB Alias (friendly name, e.g. "production_db")
  ├── Connection String (e.g. postgresql://user:pass@host/db)
  ├── DB Type (postgresql / sqlite)
  └── Auto-scan toggle + interval (minutes)
         │
         ▼
Clicks "Test Connection":
  POST /api/test-connection { connection_string }
  Backend:
  ├── Normalize "postgres://" → "postgresql://"
  ├── SQLAlchemy create_engine(conn_str)
  ├── Execute SELECT 1
  └── Return { success: true, message: "Connection successful!" }
         │
         ▼
On success: Save to localStorage["db_connections"]:
  [{
    db_alias: "production_db",
    connection_string: "postgresql://...",
    db_type: "postgresql",
    auto_take: true,
    auto_take_interval: 60,
    last_auto_take: null
  }]
```

---

### 3. Schema Scan & Drift Detection Flow

```
User → Run Scan page (/scan) → Scan.jsx
         │
         ▼
Loads saved connections from localStorage
User selects a DB → clicks "Run AI Scan"
         │
         ▼
POST /api/scan { connection_string, db_alias, db_type }
─────────────────────────────────────────────────────────
BACKEND PROCESSING (8 steps):

  Step 1 │ JWT Auth Guard
         │ decode_access_token(token) → get User from DB

  Step 2 │ Schema Extractor (schema_extractor.py)
         │ • SQLAlchemy inspect(target_engine)
         │ • For each table: columns (name, type, nullable, default)
         │                   primary_keys, foreign_keys, indexes
         │ • Returns: { table_name: { columns, pks, fks, indexes } }

  Step 3 │ Save Current Snapshot (snapshot_service.py)
         │ • INSERT INTO schema_snapshots (db_alias, db_type, snapshot JSON)

  Step 4 │ Fetch Previous Snapshot
         │ • SELECT WHERE db_alias=? ORDER BY created_at DESC OFFSET 1
         │ • If None → return { drift_detected: false }  ← First scan

  Step 5 │ Diff Engine (diff_engine.py)
         │ • Compares previous_schema vs current_schema
         │ • Detects:
         │   - table_added / table_removed
         │   - column_added / column_removed
         │   - column_type_changed
         │   - nullable_changed
         │   - primary_key_changed
         │ • Returns: { total_changes: N, changes: [...] }

  Step 6 │ AI Drift Analysis (drift_analyzer.py)
         │ • If total_changes == 0 → { overall_risk: "none" }
         │ • Sends to OpenRouter LLM:
         │   - Previous schema JSON
         │   - Current schema JSON
         │   - Change list
         │ • LLM returns per-change: classification, risk, impact, mitigation
         │ • Extracts overall_risk (highest across all changes)

  Step 7 │ Persist Drift Report
         │ • INSERT INTO drift_reports (db_alias, raw_diff, llm_analysis,
         │                             overall_risk, prev_snap_id, curr_snap_id)

  Step 8 │ Return Response
         │ {
         │   message, snapshot_id, drift_detected,
         │   total_changes, overall_risk, report_id, llm_analysis
         │ }
─────────────────────────────────────────────────────────
FRONTEND (Scan.jsx):
  ├── Shows per-change cards:
  │   • Classification badge (Breaking / Additive / Potentially Breaking)
  │   • Risk badge (High / Medium / Low)
  │   • Impact explanation (plain language from LLM)
  │   └── Mitigation steps (actionable from LLM)
  └── Links to full report at /reports/:report_id
```

---

### 4. AI Analysis Flow

```
agents/drift_analyzer.py receives:
  { diff, previous_schema, current_schema }
         │
         ▼
  total_changes == 0 ?
  └── YES → return { overall_risk: "none", summary: "No changes." }
         │
         ▼ NO
  Build two-message LLM conversation:
  ┌────────────────────────────────────────────────────┐
  │ SYSTEM:                                            │
  │ "You are a senior data engineer and database       │
  │  architect. Always respond with valid JSON only."  │
  │                                                    │
  │ USER:                                              │
  │ Previous Schema: { ... full JSON ... }             │
  │ Current Schema:  { ... full JSON ... }             │
  │ Detected Changes: [ ... typed change list ... ]    │
  │                                                    │
  │ For each change return:                            │
  │   classification: additive|breaking|...            │
  │   risk: low|medium|high                            │
  │   impact: plain-language downstream effects        │
  │   mitigation: actionable remediation steps         │
  │                                                    │
  │ Return JSON: { overall_risk, summary, changes[] }  │
  └────────────────────────────────────────────────────┘
         │
         ▼
  OpenRouter API call
  model: openai/gpt-3.5-turbo  |  temperature: 0.2
         │
         ▼
  Raw response → strip markdown code fences if present
         │
         ▼
  json.loads() → return structured Python dict:
  {
    "overall_risk": "high",
    "summary": "Executive summary...",
    "changes": [
      {
        "type": "nullable_changed",
        "table": "users",
        "classification": "breaking",
        "risk": "high",
        "impact": "Existing NULL rows will fail future inserts.",
        "mitigation": "Backfill NULLs before enforcing NOT NULL."
      }
    ]
  }
```

---

### 5. Auto-Scan Background Flow

```
App.jsx → useAutoScan() hook (active while user is logged in)
         │
         ▼
setInterval(checkAndTriggerScans, 30_000ms)  ← runs every 30 seconds
         │
         ▼
For each connection in localStorage["db_connections"]:
  ├── auto_take == false? → skip
  │
  ├── Check: (now - last_auto_take) >= auto_take_interval * 60_000ms
  │
  └── Interval elapsed?
      ├── YES → runScan({ connection_string, db_alias, db_type })
      │         • Full 8-step scan executes silently in background
      │         • Updates last_auto_take → new Date().toISOString()
      │         • localStorage saved → dispatches "storage" event
      │           (other browser tabs sync automatically)
      │         • Console: "[Auto-Scan] Triggered for: my_db"
      └── NO  → skip until next 30s check
```

---

## Frontend

### Pages & Routes

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/login` | `Login.jsx` | ❌ Public | Login + Register toggle form |
| `/` | `Dashboard.jsx` | 🔒 | Stats cards, risk pie chart, bar chart, recent drift events table |
| `/connect` | `ConnectDB.jsx` | 🔒 | Add/manage/test database connections |
| `/scan` | `Scan.jsx` | 🔒 | Select DB, run AI scan, view per-change analysis cards |
| `/reports` | `Reports.jsx` | 🔒 | Full paginated history of all drift reports |
| `/reports/:id` | `Reports.jsx` | 🔒 | Detailed drift report with LLM executive summary |
| `/snapshots` | `Snapshots.jsx` | 🔒 | Schema snapshot timeline + raw JSON schema viewer |
| `*` (any) | Redirect | 🔒 | Falls back to `/` |

---

### Components

| Component | File | Description |
|-----------|------|-------------|
| `Sidebar` | `components/Sidebar.jsx` | Fixed left navigation with page links, user info card (avatar, username, email), logout button, "AI-Powered" label |
| `RiskBadge` | `components/Badges.jsx` | Color-coded inline badge: High (red) / Medium (purple) / Low (blue) / None (gray) |
| `Layout` | `App.jsx` | Wraps all protected pages: `<Sidebar /> + <Outlet />` in a flex layout |
| `ProtectedRoute` | `App.jsx` | Redirects unauthenticated users to `/login`, preserving the intended destination |

---

### State Management

| State | Location | Mechanism |
|-------|----------|-----------|
| Auth user + token | `AuthContext.jsx` | React Context + `localStorage["token"]` |
| DB connections list | `ConnectDB.jsx` | `localStorage["db_connections"]` (array of connection objects) |
| Dashboard stats | `Dashboard.jsx` | Local `useState` — fetched on mount via `getDashboard()` |
| Scan results | `Scan.jsx` | Local `useState` — set after `runScan()` resolves |
| Reports list | `Reports.jsx` | Local `useState` — fetched on mount via `getDriftReports()` |
| Report detail | `Reports.jsx` | Local `useState` — fetched by `id` param via `getDriftReport()` |
| Snapshots | `Snapshots.jsx` | Local `useState` — fetched via `getSnapshots()` |

---

### API Integration

All API calls live in [`frontend/src/api.js`](schema-drift-detector/frontend/src/api.js).

**Axios instance config:**
- Base URL: `VITE_API_URL` env var (default: `http://localhost:8000/api`)
- Timeout: `60,000ms` (LLM analysis can be slow on large schemas)
- **Request interceptor:** Auto-attaches `Authorization: Bearer <token>` to every request

| Exported Function | Method | Endpoint |
|-------------------|--------|----------|
| `login(data)` | POST | `/auth/login` |
| `register(data)` | POST | `/auth/register` |
| `getMe()` | GET | `/auth/me` |
| `testConnection(data)` | POST | `/test-connection` |
| `runScan(data)` | POST | `/scan` |
| `getDashboard()` | GET | `/dashboard` |
| `getSnapshots(db_alias?)` | GET | `/snapshots` |
| `getSnapshot(id)` | GET | `/snapshots/:id` |
| `getDriftReports(db_alias?)` | GET | `/drift-reports` |
| `getDriftReport(id)` | GET | `/drift-reports/:id` |

---

## Backend

### Services Layer

| Service | File | Responsibility |
|---------|------|---------------|
| **Schema Extractor** | `services/schema_extractor.py` | SQLAlchemy `inspect()` on target DB — reads tables, columns (type, nullable, default), PKs, FKs, indexes |
| **Diff Engine** | `services/diff_engine.py` | Pure-Python comparison of two schema dicts — returns typed change list |
| **Snapshot Service** | `services/snapshot_service.py` | `save_snapshot()` and `get_all_snapshots()` CRUD helpers |
| **Auth Service** | `services/auth.py` | `hash_password()`, `verify_password()` (bcrypt), `create_access_token()`, `decode_access_token()` (JWT HS256) |

**Diff change types detected:**

| Change Type | Typical Risk | Description |
|-------------|--------------|-------------|
| `table_added` | Low | New table appeared in current schema |
| `table_removed` | High | Table was dropped |
| `column_added` | Low | New column added to existing table |
| `column_removed` | High | Column was dropped |
| `column_type_changed` | Medium–High | Data type modified |
| `nullable_changed` | High (if NOT NULL enforced) | Nullability constraint changed |
| `primary_key_changed` | High | PK column set changed |

---

### AI Agent

**File:** `agents/drift_analyzer.py`

- Uses the **OpenAI SDK** pointed at **OpenRouter** (`https://openrouter.ai/api/v1`)
- Model: configured via `LLM_MODEL` env var — default: `openai/gpt-3.5-turbo`
- Temperature: `0.2` → deterministic, factual output
- System persona: *"You are a senior data engineer and database architect"*
- Short-circuits with `{ overall_risk: "none" }` when `total_changes == 0`
- Strips markdown code fences automatically from LLM response
- Returns strict structured JSON — no free-form text

---

### Database Models

**File:** `backend/app/models/db_models.py`

#### `users` Table

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | Integer | Primary Key, Auto-index |
| `username` | String | Unique, Not Null, Indexed |
| `email` | String | Unique, Not Null, Indexed |
| `hashed_password` | String | Not Null |
| `created_at` | DateTime | Default: IST `now()` |

#### `schema_snapshots` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer | Primary Key |
| `db_alias` | String | Human-readable DB name (indexed) |
| `db_type` | String | `"postgresql"` / `"sqlite"` |
| `snapshot` | JSON | Full schema dict (tables → columns → metadata) |
| `created_at` | DateTime | Default: IST `now()` |

#### `drift_reports` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer | Primary Key |
| `db_alias` | String | Which DB was scanned (indexed) |
| `previous_snapshot_id` | Integer | Reference to older snapshot |
| `current_snapshot_id` | Integer | Reference to newer snapshot |
| `raw_diff` | JSON | Output of `diff_engine.compute_diff()` |
| `llm_analysis` | JSON | Output of `drift_analyzer.analyze_drift()` |
| `overall_risk` | String | `"low"` / `"medium"` / `"high"` / `"none"` |
| `created_at` | DateTime | Default: IST `now()` |

> All `created_at` timestamps default to **IST (UTC+5:30)** timezone.

---

## API Documentation

### Base URL
*   **Local Development**: `http://localhost:8000/api`
*   **Production Deployment**: `https://schema-drift-detector-1.onrender.com/docs`

All 🔒 protected endpoints require: `Authorization: Bearer <access_token>`

### Authentication Endpoints

#### `POST /api/auth/register`

**Request:**
```json
{ "username": "john_doe", "email": "john@example.com", "password": "secure123" }
```
**Response `200`:**
```json
{ "access_token": "eyJ...", "token_type": "bearer", "user": { "id": 1, "username": "john_doe", "email": "john@example.com" } }
```
**Errors:** `400` Username/email already taken

---

#### `POST /api/auth/login`

**Request:**
```json
{ "username": "john_doe", "password": "secure123" }
```
> `username` field accepts username **or** email address.

**Response `200`:** Same as register.

**Errors:** `401` Incorrect credentials

---

#### `GET /api/auth/me` 🔒

**Response `200`:**
```json
{ "id": 1, "username": "john_doe", "email": "john@example.com" }
```

---

### Scan & Schema Endpoints

#### `POST /api/test-connection` 🔒

**Request:**
```json
{ "connection_string": "postgresql://user:pass@host:5432/mydb" }
```
**Response `200`:** `{ "success": true, "message": "Connection successful!" }`

---

#### `POST /api/scan` 🔒 ← Core Endpoint

**Request:**
```json
{
  "connection_string": "postgresql://user:pass@host:5432/mydb",
  "db_alias": "my_production_db",
  "db_type": "postgresql"
}
```

**Response — First scan:**
```json
{ "message": "First snapshot saved. No previous snapshot to compare.", "snapshot_id": 1, "drift_detected": false }
```

**Response — Drift detected:**
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
    "summary": "...",
    "changes": [
      {
        "type": "nullable_changed",
        "table": "users",
        "classification": "breaking",
        "risk": "high",
        "impact": "Existing NULL rows will fail future inserts.",
        "mitigation": "Backfill NULL values before enforcing NOT NULL."
      }
    ]
  }
}
```

---

#### `GET /api/snapshots` 🔒

**Query Params:** `?db_alias=my_production_db` (optional)

**Response:** Array of snapshot summaries with `id, db_alias, db_type, created_at, table_count`

---

#### `GET /api/snapshots/{id}` 🔒

**Response:** Full snapshot with complete `snapshot` JSON (all tables, columns, PKs, FKs, indexes)

**Errors:** `404` Not found

---

#### `GET /api/drift-reports` 🔒

**Query Params:** `?db_alias=my_production_db` (optional filter)

**Response:** Array of report summaries ordered by newest first

---

#### `GET /api/drift-reports/{id}` 🔒

**Response:** Full report including `raw_diff` + complete `llm_analysis`

**Errors:** `404` Not found

---

### Dashboard Endpoint

#### `GET /api/dashboard` 🔒

**Response:**
```json
{
  "total_scans": 12,
  "total_drifts": 5,
  "risk_distribution": { "low": 2, "medium": 1, "high": 2, "none": 0 },
  "recent_reports": [
    { "id": 5, "db_alias": "prod_db", "overall_risk": "medium", "total_changes": 2, "created_at": "..." }
  ]
}
```

---

### Quick Reference — All Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ❌ | Health check |
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login and get JWT |
| GET | `/api/auth/me` | 🔒 | Get current user |
| POST | `/api/test-connection` | 🔒 | Test target DB connectivity |
| POST | `/api/scan` | 🔒 | Run drift detection scan |
| GET | `/api/snapshots` | 🔒 | List snapshots |
| GET | `/api/snapshots/{id}` | 🔒 | Get snapshot detail |
| GET | `/api/drift-reports` | 🔒 | List drift reports |
| GET | `/api/drift-reports/{id}` | 🔒 | Get report detail |
| GET | `/api/dashboard` | 🔒 | Dashboard aggregate stats |

---

## API Testing & Swagger

FastAPI auto-generates **interactive documentation** — no extra setup needed.

| Interface | URL | Description |
|-----------|-----|-------------|
| **Swagger UI** | `http://localhost:8000/docs` | Interactive — try endpoints directly |
| **ReDoc** | `http://localhost:8000/redoc` | Clean, readable reference |
| **OpenAPI JSON** | `http://localhost:8000/openapi.json` | Import to Postman/Insomnia |

### Testing with Swagger UI (Step-by-Step)

1. Start the server: `uvicorn app.main:app --reload`
2. Open **http://localhost:8000/docs**
3. Expand `POST /api/auth/register` → **Try it out** → fill body → **Execute**
4. Copy the `access_token` from the response
5. Click 🔒 **Authorize** (top right) → paste `Bearer <token>` → **Authorize**
6. All 🔒 locked endpoints are now callable — try `POST /api/scan` or `GET /api/dashboard`

### Testing with curl

```bash
# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@example.com","password":"pass123"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john","password":"pass123"}'

# Run scan (replace TOKEN)
curl -X POST http://localhost:8000/api/scan \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"connection_string":"postgresql://user:pass@localhost:5432/mydb","db_alias":"prod","db_type":"postgresql"}'

# Dashboard
curl -X GET http://localhost:8000/api/dashboard \
  -H "Authorization: Bearer TOKEN"
```

### Testing with Postman

1. **File → Import** → URL: `http://localhost:8000/openapi.json`
2. Postman auto-creates a full collection
3. Run `POST /api/auth/login` → copy token
4. Set Collection Variable: `token = <paste token>`
5. Set Collection Auth Header: `Bearer {{token}}`
6. All requests are now authenticated automatically

---

## Authentication Flow

```
1. POST /api/auth/login or /register
         │
2. Backend validates credentials / creates user
         │
3. JWT created: { sub: "username", exp: now + 24h }
   Signed with HS256 + JWT_SECRET_KEY
         │
4. Client stores token in localStorage["token"]
         │
5. Every request: Authorization: Bearer <token>
         │
6. get_current_user() dependency on every 🔒 route:
   a. Extract token from Authorization header
   b. jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
   c. Read username from payload["sub"]
   d. Query User from DB
   e. Return User ORM object (or raise HTTP 401)
```

---

## Error Handling

All errors return standard HTTP status codes with JSON body:

```json
{ "detail": "Human-readable error message" }
```

| Status | Meaning | Common Causes |
|--------|---------|---------------|
| `200` | Success | — |
| `400` | Bad Request | Invalid input, connection failure, duplicate username/email |
| `401` | Unauthorized | Missing/expired/invalid JWT, wrong credentials |
| `404` | Not Found | Snapshot or report ID doesn't exist |
| `422` | Unprocessable Entity | Missing required request body fields (Pydantic) |
| `500` | Internal Server Error | Unexpected server error |

---

## Environment Variables

### Backend — `backend/.env` (copy from `.env.example`)

```env
# LLM (required)
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=openai/gpt-3.5-turbo

# App database (required)
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/schema_drift_db
# SQLite alternative: DATABASE_URL=sqlite:///./schema_drift.db

# JWT (optional — secure defaults)
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
| `OPENROUTER_API_KEY` | ✅ | — | Get from [openrouter.ai/keys](https://openrouter.ai/keys) |
| `DATABASE_URL` | ✅ | `sqlite:///./schema_drift.db` | App's own storage DB |
| `LLM_MODEL` | ✅ | `openai/gpt-3.5-turbo` | Any OpenRouter model slug |
| `JWT_SECRET_KEY` | ⚠️ | Hardcoded fallback | **Always change in production** |
| `VITE_API_URL` | ❌ | `http://localhost:8000/api` | Frontend → backend URL |

---

## Getting Started

### Local Setup

**Prerequisites:** Python 3.11+, Node.js 20+, PostgreSQL (or use SQLite)

```bash
# Clone the repo
git clone https://github.com/yourusername/schema-drift-detector.git
cd schema-drift-detector
```

**Backend:**
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env         # Windows
# cp .env.example .env         # macOS/Linux
# Edit .env: add OPENROUTER_API_KEY + DATABASE_URL

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend

npm install

# Create .env
echo VITE_API_URL=http://localhost:8000/api > .env

npm run dev
```

| Service | URL |
|---------|-----|
| Frontend App | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |

---

### Docker Setup

```bash
# From project root
$env:OPENROUTER_API_KEY="your_key_here"    # PowerShell
# export OPENROUTER_API_KEY="your_key"     # Linux/macOS

# Build and start all services
docker-compose up --build

# Detached mode
docker-compose up -d --build

# Stop (preserve data)
docker-compose down

# Stop + wipe database volume
docker-compose down -v
```

| Service | Port | Description |
|---------|------|-------------|
| `postgres` | 5432 | PostgreSQL 15 |
| `backend` | 8000 | FastAPI |
| `frontend` | 5173 | Vite + React |

---

## Seeding Demo Data

```bash
cd schema-drift-detector/backend
python seed.py
```

| Resource | Details |
|----------|---------|
| Users | `John` / `password` and `developer` / `password` |
| Snapshots | 2 snapshots for `college_db` (initial schema → drifted schema) |
| Drift Report | 1 report with 4 changes: 1 breaking HIGH, 1 medium, 2 low |

Script is **idempotent** — safe to run multiple times.

---

## Features

- 🔐 **JWT Authentication** — secure register/login with bcrypt hashing and 24-hour token expiry
- 🗄 **Multi-DB Support** — connect to any PostgreSQL or SQLite database by connection string
- ✅ **Connection Testing** — verify connectivity before running a scan
- 📸 **Schema Snapshots** — full schema capture (tables, columns, types, nullable, default, PKs, FKs, indexes)
- ⚙️ **Deterministic Diff Engine** — pure-Python comparator detects 7 types of schema changes
- 🤖 **LLM Risk Analysis** — per-change classification (breaking/additive), risk scoring, plain-English impact + mitigation
- 📊 **Dashboard** — total scans, drift count, risk distribution pie + bar charts, recent events table
- 📋 **Drift Report History** — full timeline with AI executive summaries
- 🕑 **Snapshot Timeline** — browse and inspect raw schema JSON at any point in time
- ⏱ **Auto-Scan** — background hook polls databases automatically on a user-defined interval
- 🐳 **Docker Ready** — `docker-compose up --build` starts all services
- 📖 **Swagger UI** — interactive API docs auto-generated at `/docs`
- 🌐 **Vercel Deployable** — frontend includes `vercel.json` for easy deployment

---

*Schema Drift Detector v1.0.0 — Full-Stack Documentation — June 2026*
