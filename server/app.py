import os
import sqlite3
import yaml
from fastapi import FastAPI
from pydantic import BaseModel

DB_PATH = os.path.join(os.path.dirname(__file__), "packmind.db")
REPO_NAME = os.getenv("REPO_NAME", "org/repo")
ADR_DIR = os.path.join(os.path.dirname(__file__), "..", "docs", "adr")

app = FastAPI(title="Packmind Lite")

class Violation(BaseModel):
    adr_id: str
    file: str
    line: int
    message: str

class UploadPayload(BaseModel):
    violations: list[Violation]


def init_db():
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
    """Parse ADR markdown files and load them into SQLite."""
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
            data = yaml.safe_load(front)
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
            print(f"Failed to load {fname}: {e}")
    conn.commit()
    conn.close()


@app.on_event("startup")
def startup_event():
    init_db()
    load_adrs(REPO_NAME, ADR_DIR)


@app.get("/manifest/{repo}")
def get_manifest(repo: str):
    """Return enforcement rules for the repo."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    rows = cur.execute(
        "SELECT id, tool, rule_id, severity FROM adr WHERE repo=?", (repo,)
    ).fetchall()
    conn.close()
    rules = [
        {"id": r[0], "tool": r[1], "rule_id": r[2], "severity": r[3]} for r in rows
    ]
    return {"repo": repo, "rules": rules}


@app.post("/api/upload")
def upload(payload: UploadPayload):
    """Accept violations uploaded by the CLI."""
    for v in payload.violations:
        print(f"Violation for {v.adr_id} in {v.file}:{v.line} - {v.message}")
    return {"status": "ok"}
