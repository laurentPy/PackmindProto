#!/usr/bin/env python3
"""Simple CLI to upload linter violations mapped to ADRs."""
import argparse
import json
import requests
import sys

def parse_args():
    p = argparse.ArgumentParser(description="Packmind Lite CLI")
    p.add_argument("--sarif", required=True, nargs="+", help="Path to SARIF report")
    p.add_argument("--manifest-url", required=True, help="Base URL to manifest endpoint")
    p.add_argument("--upload-url", required=True, help="URL to upload violations")
    p.add_argument("--repo", required=True, help="GitHub repository name")
    p.add_argument("--output", "-o",help="If set, write GitHub annotations JSON to the given file",required=False)
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


def load_violations_from_sarif(sarif_path):
    """
    Read one SARIF file and return a list of violation dicts in the shape:
        { "adr_id": ..., "file": ..., "line": ..., "message": ... }
    """
    with open(sarif_path, "r", encoding="utf-8") as f:
        sarif = json.load(f)

    results = []
    # The exact SARIF schema may vary, but typically:
    # sarif["runs"][...]["results"][...] each has .ruleId, .locations, .message
    for run in sarif.get("runs", []):
        for res in run.get("results", []):
            rule_id = res.get("ruleId", "")
            # Extract location (first location= file + line)
            locs = res.get("locations", [])
            if locs:
                physical = locs[0].get("physicalLocation", {})
                artifact = physical.get("artifactLocation", {})
                file_path = artifact.get("uri", "<unknown>")
                region = physical.get("region", {})
                line     = region.get("startLine", 0)
            else:
                file_path = "<unknown>"
                line = 0

            msg_obj = res.get("message", {})
            message = msg_obj.get("text", "<no message>")

            # We assume ruleId encodes the ADR, e.g. "ADR-CS-001"
            # or you have some mapping from ruleId→adr_id. Adjust as needed.
            parts   = rule_id.split("_", 1)
            adr_id  = parts[0] if parts else ""
            results.append({
                "adr_id":  adr_id,
                "file":    file_path,
                "line":    line,
                "message": message,
            })
    return results

def main():
    args = parse_args()

    manifest_map = load_manifest(args.manifest_url, args.repo)
    all_violations = []
    for sarif_path in args.sarif:

            try:
                items = parse_sarif(sarif_path)
            except FileNotFoundError:
                print(f"ERROR: SARIF file not found: {sarif_path}", file=sys.stderr)
                sys.exit(1)
            except json.JSONDecodeError:
                print(f"ERROR: Failed to parse SARIF (invalid JSON): {sarif_path}", file=sys.stderr)
                sys.exit(1)

            # 2) Convert to Packmind “violation” objects using the manifest map
            violations = []
            for it in items:
                key = (it["tool"], it["rule"])
                adr_id = manifest_map.get(key)
                if not adr_id:
                    print(f"⚠️  No ADR mapping for {key}, skipping", file=sys.stderr)
                    continue
                violations.append({
                    "adr_id":  adr_id,
                    "file":    it["file"],
                    "line":    it["line"],
                    "message": it["msg"],
                })
            print(f"Loaded {len(violations)} violation(s) from {sarif_path}")
            all_violations.extend(violations)

    if not all_violations:
        print("→ No violations found in any SARIF (after manifest mapping). Exiting.")
        sys.exit(0)

    # Build payload
    payload = {"violations": all_violations}

    # Upload to Packmind
    print(f"→ Uploading {len(all_violations)} violation(s) to {args.upload_url} …")
    r = requests.post(
        args.upload_url,
        json=payload,
        headers={"Content-Type": "application/json"},
    )
    if r.status_code != 200:
        print(f"ERROR: Upload failed: {r.status_code} {r.text}", file=sys.stderr)
        sys.exit(1)

    print("→ Successfully uploaded all violations.")

    # ─── Build GitHub annotations ─────────────────────────────────────────────
    annotations = []
    for v in all_violations:
        annotations.append({
            "path":             v["file"],
            "start_line":       v["line"] or 1,
            "end_line":         v["line"] or 1,
            "annotation_level": "failure" if v.get("severity","error")=="error" else "warning",
            "message":          f"[{v['adr_id']}] {v['message']}"
        })

    # ─── Optionally dump to the --output file ──────────────────────────────────
    if args.output:
        try:
            with open(args.output, "w", encoding="utf-8") as outf:
                json.dump(annotations, outf, indent=2)
            print(f"→ Wrote {len(annotations)} annotations to {args.output}")
        except Exception as e:
            print(f"ERROR: failed to write annotations to {args.output}: {e}", file=sys.stderr)
            sys.exit(1)

if __name__ == "__main__":
    main()
