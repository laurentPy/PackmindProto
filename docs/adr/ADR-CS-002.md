---
id: ADR-CS-002
title: Log should include full error not just the message
enforcement:
  tool: packmind_agent
  rule_id: log_should_include_full_error
  severity: error
date: 2025-06-10
status: active
---
## Context

In our current services, error handling often logs only the high-level exception message.


While the exception message can be helpful, it frequently omits critical details (stack trace, inner exception, root cause) needed to diagnose and fix the underlying issue. Developers and on-call engineers waste time reproducing the error or hunting through logs to piece together what actually went wrong.

Key problems we’ve observed:
- **Ambiguous root causes** – the logged message alone does not reveal which line of code or which subsystem threw the exception.
- **Missing context** – without the full stack trace, it’s hard to trace back through nested exceptions, especially in asynchronous or multi-threaded flows.
- **Slower incident response** – lack of detail forces teams to flag bugs as “low confidence” and to spend extra time gathering logs and reproducing the failure.
- **Inconsistent logging practices** – some services log full exceptions, others log only the message string, leading to uneven observability across the stack.

Because we rely heavily on automated alerting and log inspection (e.g., via Kibana or Splunk), having only a terse message can cause alerts to fire without enough detail to troubleshoot. The absence of full error information also makes it harder to correlate related failures across distributed systems.

## Decision

All services must update their logging framework to include the full exception (stack trace and inner-exception details), not just the top-level message. Specifically:

1. **Standardize on a logging helper/utility** that, when catching an exception, calls:
   ```java
   logger.error("Operation failed", exception);

Ensure that all catch blocks throughout the codebase pass the caught exception object into the logger, preserving stack trace and nested exceptions.

Update any custom error-formatting utilities so that they emit both the exception message and full stack trace.

Add a Packmind Agent rule (log_should_include_full_error) that scans for logger calls and flags any usage of only exception.getMessage() or similar patterns without passing the full exception object. This rule should run automatically in CI and in IDE linting.

Document this requirement in our coding guidelines:

Whenever an exception is logged, always include the exception object (e.g. logger.error("…", ex)), not just its message.

Do not swallow exceptions or call getMessage() without logging the full stack.