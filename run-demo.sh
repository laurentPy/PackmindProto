#!/usr/bin/env bash
#
# run-demo.sh – simulate a CI/GitHub Action for the “vanilla” app:
#   1) run ArchUnit tests
#   2) convert JUnit XML → SARIF
#   3) upload SARIF via the Packmind CLI
#
# Usage (from PackmindProto/):
#   chmod +x run-demo.sh
#   ./run-demo.sh

set -euo pipefail

echo "=== 1/3: Running ArchUnit tests (./gradlew test) in apps/vanilla ==="
pushd apps/vanilla > /dev/null

# 1a) Clean and run tests. We expect tests to fail, but we proceed anyway.
./gradlew clean test || echo "⚠️  ArchUnit tests failed (expected) – continuing..."

# 1b) Capture the local JUnit XML filename under apps/vanilla/build/test-results/test/
LOCAL_XML="$(ls build/test-results/test/*.xml | head -n1)"
if [[ -z "$LOCAL_XML" ]] || [[ ! -f "$LOCAL_XML" ]]; then
  echo "❌ ERROR: JUnit XML not found under apps/vanilla/build/test-results/test/"
  popd > /dev/null
  exit 1
fi
echo "✅ Found JUnit XML (inside apps/vanilla): $LOCAL_XML"

popd > /dev/null

# Construct a path relative to the repo root
XML_REPORT_REL="apps/vanilla/${LOCAL_XML}"


echo
echo "=== 2/3: Converting JUnit XML to SARIF ==="
SARIF_OUT="report_archunit.sarif"

# Call the converter from the repo root, using the repo-relative path
python3 xml2sarif.py "$XML_REPORT_REL" "$SARIF_OUT"
echo "✅ Generated SARIF file: $SARIF_OUT"


echo
echo "=== 3/3: Uploading SARIF to Packmind server ==="
python3 cli/packmind_cli.py \
  --sarif        "$SARIF_OUT" \
  --manifest-url http://localhost:8000/manifest \
  --upload-url   http://localhost:8000/api/upload \
  --repo         mySpace

echo
echo "🎉 Demo complete."
