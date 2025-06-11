---
id: ADR-CS-001
title: Enforce Prettier Formatting
enforcement:
  tool: prettier
  rule_id: prettier
  severity: warning
date: 2025-06-10
status: active
---
## Context

Over time, our JavaScript/TypeScript codebase has accumulated a variety of formatting styles—different indent widths, quote styles, trailing commas, and line‐break conventions. This inconsistency has led to several problems:

- **Code‐review noise:** Reviewers often spend time commenting on trivial formatting issues instead of focusing on substantive logic or architectural concerns.  
- **Merge conflicts:** Differing formatting rules in pull requests (PRs) result in unnecessary diffs and conflict churn, especially when multiple developers touch the same file.  
- **Onboarding friction:** New team members struggle to adhere to an unwritten, informal set of formatting conventions, slowing down their ramp‐up time.  
- **Toolchain drift:** Without a single, enforced formatter, some developers rely on personal IDE settings (e.g., EditorConfig, custom ESLint rules) that can diverge from others’, causing unpredictable formatting changes.

We considered the following alternatives before settling on Prettier:

1. **Manual style guide + ESLint rules:**  
   - Pros: Very customizable; rule violations can be flagged by ESLint.  
   - Cons: Requires constant maintenance of ESLint formatting plugins, and developers must run ESLint’s `--fix` manually.  
2. **EditorConfig only:**  
   - Pros: Easy to bootstrap; provides basic indent/whitespace rules.  
   - Cons: Doesn’t cover quote styles, trailing commas, bracket spacing, JSX formatting, etc.  
3. **Prettier (with a shared, code‐checked‐in configuration):**  
   - Pros: Opinionated but widely adopted; integrates with most IDEs and CI. A single `prettier --check` step can catch all formatting errors automatically.  
   - Cons: Some teams find Prettier’s formatting decisions too “opinionated,” but the consistency savings outweigh this.

Because our primary drivers are (a) reducing PR noise, (b) preventing merge conflicts caused by formatting, and (c) minimizing onboarding friction, adopting a single, team‐wide Prettier configuration is the best choice. Prettier’s CLI can be integrated into CI (e.g., a `prettier --check` step in GitHub Actions) and as a Git pre‐commit hook to enforce consistent formatting before code is merged.
