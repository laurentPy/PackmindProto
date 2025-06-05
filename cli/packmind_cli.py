#!/usr/bin/env python3
"""Simple CLI to upload linter violations mapped to ADRs."""
import argparse
import json
import requests


def parse_args():
    p = argparse.ArgumentParser(description="Packmind Lite CLI")
    p.add_argument("--sarif", required=True, help="Path to SARIF report")
    p.add_argument("--manifest-url", required=True, help="Base URL to manifest endpoint")
    p.add_argument("--upload-url", required=True, help="URL to upload violations")
    p.add_argument("--repo", required=True, help="GitHub repository name")
    return p.parse_args()


def load_manifest(url: str, repo: str):
    resp = requests.get(f"{url.rstrip('/')}/{repo}")
    resp.raise_for_status()
    data = resp.json()
    mapping = {}
    for rule in data.get("rules", []):
        mapping[(rule["tool"], rule["rule_id"])] = rule["id"]
    return mapping


def parse_sarif(path: str):
    with open(path, "r", encoding="utf-8") as f:
        sarif = json.load(f)
    run = sarif["runs"][0]
    tool = run["tool"]["driver"]["name"].lower()
    results = run.get("results", [])
    items = []
    for res in results:
        rule = res.get("ruleId")
        msg = res.get("message", {}).get("text", "")
        if res.get("locations"):
            loc = res["locations"][0]["physicalLocation"]
            file = loc["artifactLocation"]["uri"]
            line = loc.get("region", {}).get("startLine", 1)
        else:
            file = ""
            line = 1
        items.append({"tool": tool, "rule": rule, "file": file, "line": line, "msg": msg})
    return items


def main():
    args = parse_args()
    manifest = load_manifest(args.manifest_url, args.repo)
    sarif_items = parse_sarif(args.sarif)
    violations = []
    for it in sarif_items:
        adr = manifest.get((it["tool"], it["rule"]))
        if not adr:
            continue
        violations.append(
            {
                "adr_id": adr,
                "file": it["file"],
                "line": it["line"],
                "message": it["msg"],
            }
        )
    if not violations:
        print("No violations found")
        return
    resp = requests.post(args.upload_url, json={"violations": violations})
    resp.raise_for_status()
    print("Uploaded", len(violations), "violations")


if __name__ == "__main__":
    main()
