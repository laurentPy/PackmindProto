# Packmind Lite Proof of Concept

This repository demonstrates a minimal Packmind workflow. A FastAPI server
serves ADR rules and accepts linter violations. A tiny CLI consumes a SARIF
report and uploads any violations found.

## Getting Started

1. Install Python 3.11
2. Install dependencies:
   ```bash
   pip install -r server/requirements.txt
   ```
3. Run the API server:
   ```bash
   uvicorn server.app:app --port 8000
   ```
4. Generate a SARIF report and call the CLI:
   ```bash
   python cli/packmind_cli.py --sarif report.sarif \
       --manifest-url http://localhost:8000/manifest \
       --upload-url http://localhost:8000/api/upload \
       --repo my-org/my-repo
   ```

The server logs received violations to the console.

## GitHub Actions

The workflow in `.github/workflows/packmind-check.yml` shows how to run the
server, produce a dummy SARIF file and invoke the CLI in CI.
