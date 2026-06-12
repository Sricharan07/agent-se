# Signal Deduplication

## Goal
Turn multiple noisy reports into one canonical issue.

Example:
- GitHub issue #213: search timeout
- GitHub issue #214: slow query on large dataset
- Slack message: search gets stuck on big data

All three might represent the same bug.

## Dedup pipeline
1. Normalize the text
2. Extract repo, module, and symptom
3. Generate embeddings
4. Compare against recent signals
5. Score similarity
6. Group into a canonical issue
7. Attach sources and confidence
8. Present merge candidate for review if confidence is low

## Grouping signals
A cluster should consider:
- same repo
- same module
- same symptom
- same time window
- same stack trace / error family
- same user-facing impact

## Output
The result is a single canonical issue card with:
- title
- summary
- source count
- confidence
- affected repo
- current status

## Why this matters
The agent should not waste cycles on repeated reports.
Deduplication is the first autonomy gate.
