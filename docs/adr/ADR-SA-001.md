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
In our current monolithic codebase, several UI classes directly import and invoke domain‐core services, bypassing the intended application service layer. This tight coupling creates multiple challenges:

- **Violation of separation of concerns:** UI components should be agnostic to business‐logic implementation details. When UI layers call core services directly, changes in domain logic often force simultaneous UI changes.  
- **Limited testability and maintainability:** With direct coupling, unit tests for UI components require mocking deep domain objects or stubbing out application logic, making tests brittle and harder to maintain.  
- **Risk of inconsistent business rules:** If multiple UI screens call core services in varying ways (e.g., by constructing domain objects or bypassing validation logic), business rules can drift or be applied inconsistently.  
- **Difficulty scaling toward microservices:** As we evolve toward a modular architecture (or eventual microservices), every UI–core dependency must be identified and refactored. Enforcing a strict UI‐to‐application‐service boundary reduces refactoring scope.  
- **Performance and security concerns:** Core services may perform resource‐intensive operations or require specific security filters. Calling them directly from UI could expose sensitive logic or credentials to the wrong context.

We evaluated these alternatives:

1. **Keep allowing direct UI→Core calls but add code reviews/guide warnings:**  
   - Pros: Minimal upfront work; relies on developers to follow best practices.  
   - Cons: Inconsistent adherence; reviewers often overlook such coupling until it is too late.  
2. **Introduce a separate “facade” layer that the UI must call:**  
   - Pros: Decouples UI from core; introduces a clear API boundary.  
   - Cons: Adds extra boilerplate; requires migrating existing calls manually.  
3. **Enforce with ArchUnit rule (`ui_should_not_access_core`):**  
   - Pros: Automates detection at compile/test time; immediate, actionable feedback to developers.  
   - Cons: Requires adding ArchUnit to the build and maintaining rule logic.

Given our need to **prevent further UI‐core erosion** and support a gradual refactoring path to modular services, we chose to introduce an **ArchUnit rule** that fails builds when any class under the `..ui..` package directly accesses classes under the `..core..` package. This approach ensures:

- **Early failure in CI:** Violations are caught before code merges, reducing technical debt.  
- **Clear accountability:** Developers see exactly which UI class is invoking a core method and can refactor toward the application service layer.  
- **Gradual migration support:** Teams can fix existing violations one by one, tracking progress via ADR‐ID `ADR-SA-001`.  

By enforcing the boundary at test time, we preserve architectural integrity and simplify future efforts to extract or repackage the domain core into its own module or microservice.