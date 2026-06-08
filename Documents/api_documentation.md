# Schema Drift Detector - Backend API Reference

This document serves as the official API specification for the **Schema Drift Detector** backend services.

## Base URL
*   **Local Development**: `http://localhost:8000/api`
*   **Production Deployment**: `https://schema-drift-detector-1.onrender.com/docs`

---

## Authentication

All protected endpoints require a Bearer token in the `Authorization` header:

```http
Authorization: Bearer <your_access_token>
```

---

## Endpoints Index

### 1. Authentication Module
*   `POST /auth/register` - Create a new user account.
*   `POST /auth/login` - Authenticate and obtain JWT token.
*   `GET /auth/me` - Retrieve current user profile.

### 2. Schema Scan & Connections Module
*   `POST /test-connection` - Test database connection string.
*   `POST /scan` - Extract schema, run comparison, and generate AI analysis.
*   `GET /dashboard` - Fetch aggregate statistics and recent reports.

### 3. History Module
*   `GET /snapshots` - List schema snapshots.
*   `GET /snapshots/{snapshot_id}` - Fetch details of a specific snapshot.
*   `GET /drift-reports` - List drift analysis reports.
*   `GET /drift-reports/{report_id}` - Retrieve a specific drift report.

---

## Detailed Endpoint Reference

### 1. User Registration
Creates a new user and returns an access token.

*   **URL:** `/auth/register`
*   **Method:** `POST`
*   **Auth Required:** No
*   **Request Body (JSON):**
    ```json
    {
      "username": "JaneDoe",
      "email": "jane@example.com",
      "password": "strongpassword"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "access_token": "eyJhbGciOi...",
      "token_type": "bearer",
      "user": {
        "id": 3,
        "username": "JaneDoe",
        "email": "jane@example.com"
      }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request` (Username is already taken or Email is already registered).

---

### 2. User Login
Authenticates user and returns JWT token.

*   **URL:** `/auth/login`
*   **Method:** `POST`
*   **Auth Required:** No
*   **Request Body (JSON):**
    ```json
    {
      "username": "jane@example.com",
      "password": "strongpassword"
    }
    ```
    *(Accepts either username or email in the `username` field).*
*   **Success Response (200 OK):**
    ```json
    {
      "access_token": "eyJhbGciOi...",
      "token_type": "bearer",
      "user": {
        "id": 3,
        "username": "JaneDoe",
        "email": "jane@example.com"
      }
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized` (Incorrect credentials).

---

### 3. Get User Profile
Retrieves info of the currently logged-in user.

*   **URL:** `/auth/me`
*   **Method:** `GET`
*   **Auth Required:** Yes
*   **Success Response (200 OK):**
    ```json
    {
      "id": 3,
      "username": "JaneDoe",
      "email": "jane@example.com"
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized` (Invalid/expired token).

---

### 4. Test Connection
Verifies a PostgreSQL or SQLite connection string.

*   **URL:** `/test-connection`
*   **Method:** `POST`
*   **Auth Required:** Yes
*   **Request Body (JSON):**
    ```json
    {
      "connection_string": "postgresql://postgres:password@localhost:5432/mydb"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Connection successful!"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request` (Connection string empty or connection failed).

---

### 5. Run Schema Scan
Extracts target schema, computes drift against previous snapshot, and generates AI report.

*   **URL:** `/scan`
*   **Method:** `POST`
*   **Auth Required:** Yes
*   **Request Body (JSON):**
    ```json
    {
      "connection_string": "postgresql://user:pass@host:5432/db",
      "db_alias": "college_db",
      "db_type": "postgresql"
    }
    ```
*   **Success Response (200 OK - First Scan):**
    ```json
    {
      "message": "First snapshot saved. No previous snapshot to compare.",
      "snapshot_id": 12,
      "drift_detected": false
    }
    ```
*   **Success Response (200 OK - Subsequent Scan):**
    ```json
    {
      "message": "Scan complete",
      "snapshot_id": 13,
      "drift_detected": true,
      "total_changes": 1,
      "overall_risk": "high",
      "report_id": 8,
      "llm_analysis": {
        "summary": "This drift report contains 1 change: making students.email column NOT NULL...",
        "overall_risk": "high",
        "changes": [...]
      }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request` (Extraction failed / Database offline).

---

### 6. List Snapshots
Retrieves list of snapshots owned by the authenticated user.

*   **URL:** `/snapshots`
*   **Method:** `GET`
*   **Parameters:** `db_alias` (Optional string)
*   **Auth Required:** Yes
*   **Success Response (200 OK):**
    ```json
    [
      {
        "id": 13,
        "db_alias": "college_db",
        "db_type": "postgresql",
        "created_at": "2026-06-08T12:00:00.000Z",
        "table_count": 3
      }
    ]
    ```

---

### 7. Get Snapshot Details
Retrieves full captured schema catalog.

*   **URL:** `/snapshots/{snapshot_id}`
*   **Method:** `GET`
*   **Auth Required:** Yes
*   **Success Response (200 OK):**
    ```json
    {
      "id": 13,
      "db_alias": "college_db",
      "db_type": "postgresql",
      "snapshot": {
        "students": {
          "columns": {
            "id": {"type": "INTEGER", "nullable": false},
            "name": {"type": "VARCHAR(120)", "nullable": false}
          },
          "primary_keys": ["id"]
        }
      },
      "user_id": 3,
      "created_at": "2026-06-08T12:00:00.000Z"
    }
    ```
*   **Error Responses:**
    *   `404 Not Found` (Snapshot not found or does not belong to user).

---

### 8. List Drift Reports
Lists all generated drift analysis events.

*   **URL:** `/drift-reports`
*   **Method:** `GET`
*   **Parameters:** `db_alias` (Optional string)
*   **Auth Required:** Yes
*   **Success Response (200 OK):**
    ```json
    [
      {
        "id": 8,
        "db_alias": "college_db",
        "overall_risk": "high",
        "total_changes": 1,
        "summary": "This drift report contains 1 change: making students.email column NOT NULL...",
        "created_at": "2026-06-08T12:05:00.000Z"
      }
    ]
    ```

---

### 9. Get Drift Report Details
Retrieves details of a specific drift event.

*   **URL:** `/drift-reports/{report_id}`
*   **Method:** `GET`
*   **Auth Required:** Yes
*   **Success Response (200 OK):**
    ```json
    {
      "id": 8,
      "db_alias": "college_db",
      "previous_snapshot_id": 12,
      "current_snapshot_id": 13,
      "raw_diff": {
        "total_changes": 1,
        "changes": [...]
      },
      "llm_analysis": {
        "summary": "This drift report contains 1 change...",
        "overall_risk": "high",
        "changes": [...]
      },
      "overall_risk": "high",
      "user_id": 3,
      "created_at": "2026-06-08T12:05:00.000Z"
    }
    ```

---

### 10. Get Dashboard Details
Aggregates user-scoped statistics for dashboard representation.

*   **URL:** `/dashboard`
*   **Method:** `GET`
*   **Auth Required:** Yes
*   **Success Response (200 OK):**
    ```json
    {
      "total_scans": 2,
      "total_drifts": 1,
      "risk_distribution": {
        "low": 0,
        "medium": 0,
        "high": 1,
        "none": 0
      },
      "recent_reports": [
        {
          "id": 8,
          "db_alias": "college_db",
          "overall_risk": "high",
          "total_changes": 1,
          "created_at": "2026-06-08T12:05:00.000Z"
        }
      ]
    }
    ```
