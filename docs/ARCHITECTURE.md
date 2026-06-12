# Architecture

## High-level flow
1. Connect GitHub and select a repo.
2. Ingest signals from GitHub Issues, Slack, and discussions.
3. Normalize each signal into a single schema.
4. Cluster related signals into canonical issues.
5. Route canonical issues to agents.
6. Agent investigates repo code, tests, and context.
7. Agent drafts a patch and test plan.
8. Validation service runs tests.
9. Agent opens a draft PR and writes a summary.
10. Learning layer stores the procedure for future reuse.

## Services

### 1. Ingestion service
Pulls external events into the system.

### 2. Signal normalizer
Converts incoming data into a common event schema.

### 3. Deduplication / clustering service
Groups multiple reports of the same underlying problem.

### 4. Triage agent
Classifies canonical issues by type, priority, confidence, and affected area.

### 5. Investigation agent
Reads code, recent commits, docs, logs, and test failures.

### 6. Test agent
Generates or runs tests for a candidate fix.

### 7. PR agent
Creates draft pull requests and attaches evidence.

### 8. Learning layer
Stores recurring patterns, verified procedures, and outcome history.

## Data stores
- Postgres: operational state
- ClickHouse: event history, logs, analytics
- Object storage: artifacts, traces, captured test output

## Design constraints
- Keep the user interface minimal.
- Keep the core loop autonomous.
- Show deep logs, but only after deduplication.
- Favor traceability over hidden automation.
