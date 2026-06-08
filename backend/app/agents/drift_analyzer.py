import json
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
)

MODEL = os.getenv("LLM_MODEL", "openai/gpt-3.5-turbo")

SYSTEM_PROMPT = """You are a senior data engineer and database architect.
You analyze database schema changes and assess their impact on downstream systems.
Always respond with valid JSON only — no markdown, no explanation outside JSON."""


def analyze_drift(diff: dict, previous_schema: dict, current_schema: dict) -> dict:
    if diff["total_changes"] == 0:
        return {
            "overall_risk": "none",
            "summary": "No schema changes detected.",
            "changes": [],
        }

    user_prompt = f"""
You are given a structured diff of a database schema change.

Previous Schema:
{json.dumps(previous_schema, indent=2)}

Current Schema:
{json.dumps(current_schema, indent=2)}

Detected Changes:
{json.dumps(diff["changes"], indent=2)}

For each change provide:
1. classification: "additive" | "breaking" | "potentially_breaking"
2. risk: "low" | "medium" | "high"
3. impact: human-readable explanation of downstream effects (ETL, analytics, ML, APIs)
4. mitigation: actionable steps to handle this change safely

Also provide:
- overall_risk: the highest risk level among all changes ("low", "medium", or "high")
- summary: one paragraph executive summary of the entire drift

Return strictly this JSON structure with no extra text:
{{
  "overall_risk": "low|medium|high",
  "summary": "...",
  "changes": [
    {{
      "type": "...",
      "table": "...",
      "detail": {{}},
      "classification": "...",
      "risk": "...",
      "impact": "...",
      "mitigation": "..."
    }}
  ]
}}
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
    )

    raw = response.choices[0].message.content.strip()

    # Strip markdown code fences if model adds them
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1] if len(parts) > 1 else raw
        if raw.startswith("json"):
            raw = raw[4:]

    return json.loads(raw.strip())
