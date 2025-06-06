#!/usr/bin/env python3
"""
junit XML → SARIF converter, strips trailing () from rule names
usage: python3 xml2sarif.py input.xml output.sarif
"""
import json, sys, xml.etree.ElementTree as ET, pathlib

junit, sarif_out = sys.argv[1], sys.argv[2]
root = ET.parse(junit).getroot()
results = []

for tc in root.iter("testcase"):
    fails = tc.findall("failure")
    if not fails:
        continue

    # Grab the method name; e.g. "ui_should_not_access_core()"
    raw_name = tc.attrib.get("name", "")
    # Strip any trailing "()" if present
    rule_id = raw_name.rstrip("()")

    # Grab failure message text
    fail_elem = fails[0]
    msg = (fail_elem.attrib.get("message") or (fail_elem.text or "")).strip()

    # Build SARIF result
    results.append({
        "ruleId": rule_id,
        "message": {"text": msg},
        "locations": [{
            "physicalLocation": {
                "artifactLocation": {
                    "uri": tc.attrib["classname"].replace(".", "/") + ".java"
                }
            }
        }]
    })

sarif = {"runs": [{"tool": {"driver": {"name": "archunit"}}, "results": results}]}
pathlib.Path(sarif_out).write_text(json.dumps(sarif, indent=2))
print(f"Wrote {sarif_out} with {len(results)} result(s)")
