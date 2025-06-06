import os
import sqlite3
import yaml
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# ──────────────────────────────────────────────────────────────────────────────
# 1) Create the FastAPI instance *before* any @app.post / @app.get decorators.
#    This must come first so that "app" is defined.
# ──────────────────────────────────────────────────────────────────────────────
app = FastAPI(title="Packmind Lite")

# In‐memory store for demo‐only violations (no persistent DB)
IN_MEMORY_VIOLATIONS: list[dict] = []

# Path to SQLite DB where we’ll load ADR front‐matter
DB_PATH = os.path.join(os.path.dirname(__file__), "packmind.db")
# Default REPO_NAME (can be overridden via environment)
REPO_NAME = os.getenv("REPO_NAME", "mySpace")
ADR_DIR = os.path.join(os.path.dirname(__file__), "..", "docs", "adr")


class Violation(BaseModel):
    adr_id: str
    file:   str
    line:   int
    message: str


class UploadPayload(BaseModel):
    violations: list[Violation]


def init_db():
    """Create the 'adr' table if it doesn’t exist."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS adr (
            id TEXT PRIMARY KEY,
            title TEXT,
            repo TEXT,
            tool TEXT,
            rule_id TEXT,
            severity TEXT
        )
        """
    )
    conn.commit()
    conn.close()


def load_adrs(repo: str, adr_dir: str):
    """
    Parse each ADR Markdown file under `docs/adr/*.md`,
    read its YAML front‐matter, and insert (or replace) into SQLite.
    """
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    if not os.path.isdir(adr_dir):
        return

    for fname in os.listdir(adr_dir):
        if not fname.endswith(".md"):
            continue
        path = os.path.join(adr_dir, fname)
        with open(path, "r", encoding="utf-8") as fh:
            text = fh.read()
        if not text.startswith("---"):
            continue

        try:
            front = text.split("---", 2)[1]
            data = yaml.safe_load(front) or {}
            enforcement = data.get("enforcement", {})
            cur.execute(
                "REPLACE INTO adr (id, title, repo, tool, rule_id, severity) VALUES (?,?,?,?,?,?)",
                (
                    data.get("id"),
                    data.get("title"),
                    repo,
                    enforcement.get("tool"),
                    enforcement.get("rule_id"),
                    enforcement.get("severity"),
                ),
            )
        except Exception as e:
            print(f"Failed to load ADR {fname}: {e}")
    conn.commit()
    conn.close()


@app.on_event("startup")
def startup_event():
    """When the server starts, create the table and load ADRs into it."""
    init_db()
    load_adrs(REPO_NAME, ADR_DIR)


@app.get("/manifest/{repo}")
def get_manifest(repo: str):
    """
    Return JSON with all enforcement rules for this ‘repo’:
      { repo: "mySpace",
        rules: [
          { id: "...", tool: "...", rule_id: "...", severity: "..." },
          …
        ]
      }
    """
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    rows = cur.execute(
        "SELECT id, tool, rule_id, severity FROM adr WHERE repo=?",
        (repo,),
    ).fetchall()
    conn.close()

    results = [
        {"id": r[0], "tool": r[1], "rule_id": r[2], "severity": r[3]}
        for r in rows
    ]
    return {"repo": repo, "rules": results}


@app.post("/api/upload")
def upload_violations(payload: UploadPayload):
    """
    Accept an array of violations from the CLI. For each:
      { adr_id, file, line, message }
    we append it to the in‐memory list so that the UI can fetch it.
    """
    for v in payload.violations:
        entry = {
            "adr_id":  v.adr_id,
            "file":    v.file,
            "line":    v.line,
            "message": v.message,
        }
        IN_MEMORY_VIOLATIONS.append(entry)
        print(f"Violation for {v.adr_id} in {v.file}:{v.line} - {v.message}")
    return {"status": "ok"}


@app.get("/api/violations/{repo}")
def get_violations(repo: str):
    """
    Return all violations stored in memory. We’re ignoring `repo` for now,
    but you could filter by repo if you wanted.
    """
    return {"violations": IN_MEMORY_VIOLATIONS}


# ──────────────────────────────────────────────────────────────────────────────
#  Finally, serve the React/TS front‐end from packmind-ui/dist
# ──────────────────────────────────────────────────────────────────────────────
app.mount(
    "/",
    StaticFiles(directory="../packmind-ui/dist", html=True),
    name="ui",
)
