# Product Spec

## Vision
A minimal dashboard that acts like a control tower for an autonomous engineering team.

## Primary user
An OSS maintainer or small engineering team that wants the system to:
- collect signals from GitHub and Slack
- deduplicate repeated reports
- prioritize issues
- investigate likely root causes
- generate fixes and tests
- open draft PRs
- learn reusable procedures

## What makes it different
Most tools treat each signal separately.
This product merges noisy signals into one canonical issue before the agent spends time.

## MVP scope
- Single repository onboarding
- GitHub login
- GitHub Issues + Slack signals
- Deduplication into canonical issues
- Detailed agent logs
- Draft PR generation
- Human review before merge

## Non-goals for hackathon
- Multi-repo support
- Full enterprise RBAC
- Auto-merge without review
- Complex settings screens
- Separate Slack/GitHub dashboards
