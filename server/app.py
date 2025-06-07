import os
import sqlite3
import yaml
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

DB_PATH = os.path.join(os.path.dirname(__file__), "packmind.db")
REPO_NAME = os.getenv("REPO_NAME", "org/repo")
ADR_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "docs", "adr"))

app = FastAPI(title="Packmind Lite")

# In-memory list to hold uploaded violations
in_memory_violations: List[dict] = []

class Violation(BaseModel):
    adr_id:  str
    file:    str
    line:    int
    message: str

class UploadPayload(BaseModel):
    violations: list[Violation]


def init_db():
    """
    Create the `adr` table if it doesn’t exist yet.
    """
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
    1) DELETE all existing rows for this repo
    2) Re-scan adr_dir for .md files
    3) REPLACE INTO adr (exactly what’s on disk)
    """
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # 1) Remove all existing rows for this repo
    cur.execute("DELETE FROM adr WHERE repo = ?", (repo,))

    # 2) If the directory doesn’t exist, bail
    if not os.path.isdir(adr_dir):
        conn.commit()
        conn.close()
        return

    # 3) For each .md file in docs/adr, parse front-matter and insert
    for fname in os.listdir(adr_dir):
        if not fname.endswith(".md"):
            continue
        path = os.path.join(adr_dir, fname)
        with open(path, "r", encoding="utf-8") as fh:
            text = fh.read()
        if not text.startswith("---"):
            continue
        try:
            parts = text.split("---", 2)
            front = parts[1]
            data = yaml.safe_load(front)
            enforcement = data.get("enforcement", {})
            cur.execute(
                """
                REPLACE INTO adr (id, title, repo, tool, rule_id, severity)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
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
            print(f"Failed to load {fname}: {e}")

    conn.commit()
    conn.close()


@app.on_event("startup")
def startup_event():
    """
    Ensure the database exists. We do NOT pre-load ADRs here;
    instead we rebuild on each /manifest call.
    """
    init_db()


@app.get("/manifest/{repo}")
def get_manifest(repo: str):
    """
    Rebuild ADRs from disk, then return them.
    """
    load_adrs(repo, ADR_DIR)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    rows = cur.execute(
        "SELECT id, tool, rule_id, severity FROM adr WHERE repo = ?", (repo,)
    ).fetchall()
    conn.close()

    rules = [
        {"id": r[0], "tool": r[1], "rule_id": r[2], "severity": r[3]}
        for r in rows
    ]
    return {"repo": repo, "rules": rules}


@app.get("/adr/{adr_id}")
def get_adr(adr_id: str):
    """
    Return the full content of the ADR whose front-matter `id` matches `adr_id`.
    """
    if not os.path.isdir(ADR_DIR):
        raise HTTPException(status_code=404, detail="ADR directory not found")

    for fname in os.listdir(ADR_DIR):
        if not fname.endswith(".md"):
            continue
        path = os.path.join(ADR_DIR, fname)
        with open(path, "r", encoding="utf-8") as fh:
            text = fh.read()
        if text.startswith("---"):
            try:
                parts = text.split("---", 2)
                data = yaml.safe_load(parts[1])
                if data.get("id") == adr_id:
                    return {"content": text}
            except:
                continue

    raise HTTPException(status_code=404, detail="ADR not found")


@app.post("/api/upload")
def upload(payload: UploadPayload):
    """
    Accept incoming violations, append to in-memory list, and print them.
    """
    for v in payload.violations:
        in_memory_violations.append({
            "adr_id":  v.adr_id,
            "file":    v.file,
            "line":    v.line,
            "message": v.message
        })
        print(f"Violation for {v.adr_id} in {v.file}:{v.line} – {v.message}")
    return {"status": "ok"}


@app.get("/api/violations/{repo}")
def get_violations(repo: str):
    """
    Return all uploaded violations (ignoring `repo` for now).
    """
    return {"violations": in_memory_violations}


# Serve the React static files under `/`
app.mount(
    "/",
    StaticFiles(directory="../packmind-ui/dist", html=True),
    name="ui"
)
