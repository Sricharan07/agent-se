# Agent Design

## Agent roles

### Intake agent
Reads signals and prepares them for clustering.

### Dedup agent
Groups likely duplicates into canonical issues.

### Triage agent
Classifies work as bug, feature request, regression, or noise.

### Investigation agent
Reads repo code, commit history, tests, and artifacts to find root cause.

### Test agent
Runs regression tests or creates tests to verify the fix.

### PR agent
Creates draft pull requests, summaries, and changelog updates.

## Detailed logs
Each agent step should store:
- timestamp
- action
- tool used
- input summary
- output summary
- confidence
- duration
- next step

## Planning behavior
The agent should:
1. Confirm the issue is real
2. Find duplicates
3. Identify the canonical issue
4. Investigate the root cause
5. Validate with tests
6. Draft the fix
7. Publish a PR

## Safety defaults
- Draft PRs by default
- No auto-merge
- Human approval for merge
- Low-confidence clusters stay in triage
