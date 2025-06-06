---
id: ADR-SA-001
title: UI must not call Core directly
type: system-architecture
status: active
enforcement:
  tool: archunit
  rule_id: ui_should_not_access_core
  severity: error
---
## Context
Direct coupling between UI and domain core leads to …
