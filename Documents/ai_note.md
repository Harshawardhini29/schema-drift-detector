# AI Usage Note: Schema Drift Detector

## Overview
The **Schema Drift Detector** leverages Generative AI to automate database schema drift analysis. By comparing historical schema snapshots and calculating risk levels for structural changes, the AI mimics the expertise of a Senior Database Administrator (DBA) to flag breaking changes before they disrupt downstream applications or production services.

---

## AI Model & Infrastructure
*   **LLM Engine:** Cloud-based API via **OpenRouter** (configured to use `openai/gpt-3.5-turbo` or comparable LLM models).
*   **Why OpenRouter?** OpenRouter provides a unified interface to access state-of-the-art LLM engines. It enables the system to offload complex structural analysis and contextual schema evaluation to high-reasoning models that excel at interpreting database syntax, data types, and constraint rules.
*   **Configuration:** The backend reads LLM settings from environment variables:
    *   `OPENROUTER_API_KEY`: Authentication credentials.
    *   `OPENROUTER_BASE_URL`: Endpoint router (`https://openrouter.ai/api/v1`).
    *   `LLM_MODEL`: Selected model identifier (e.g. `openai/gpt-3.5-turbo`).

---

## AI Analysis Workflow
The LLM agent operates downstream of the core Python diff engine:

### 1. Diff Extraction (Deterministic)
The Python backend's Diff Engine compares the current schema snapshot against the previous snapshot. It computes a structured dictionary of changes (table additions/deletions, column additions/deletions, data type alterations, and constraint modifications).

### 2. LLM Context Ingestion
The structured diff, along with the before-and-after schema definitions, is formatted into a prompt and sent to the LLM agent.

### 3. AI Coprocessor Synthesis
The LLM processes the diff and returns a structured JSON payload containing:
*   **AI Executive Summary:** A high-level technical overview of the drift event.
*   **Change Classification & Risk Assessment:** For every detected change, the AI assigns:
    *   **Classification:** `breaking` (e.g. dropping columns or altering nullable constraints to NOT NULL), `potentially_breaking` (e.g. reducing VARCHAR sizes or changing index settings), or `additive` (e.g. adding new tables or columns).
    *   **Risk Level:** `high`, `medium`, or `low`.
*   **Downstream Impact Analysis:** Explanation of how the changes will affect running APIs, client applications, and query performance.
*   **Mitigation Actions:** Actionable recovery steps (such as default data backfills or SQL migration scripts) to resolve the drift safely.

---

## Graceful Fallback Mechanism
To ensure system stability, the AI analyzer agent in `backend/app/agents/drift_analyzer.py` is wrapped in safe exception handling. 
If OpenRouter is unreachable, rate-limited, or fails due to an invalid API key, the backend service degrades gracefully:
1.  It catches the connection error.
2.  It falls back to a deterministic, rule-based risk estimator.
3.  It serves the core structural diff to the frontend UI so users can still see *what* changed, while appending a placeholder note indicating that AI-driven impact analysis is temporarily offline.
