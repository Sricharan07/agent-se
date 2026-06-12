# Codex Prompt

Build a minimal but polished autonomous software evolution dashboard as a production-style Next.js app.

## Product
The app helps an open source maintainer connect a repository, ingest noisy signals from GitHub and Slack, deduplicate them into canonical issues, and let agents investigate, validate, and draft fixes.

## Critical product rule
Do not process every raw signal independently.
First deduplicate and cluster signals into one canonical issue.

## Must-have user flow
1. GitHub login
2. Select repository
3. Connect sources
4. Review permissions
5. Start autonomous monitoring

## Dashboard layout
Use a minimal black-on-white theme.

Main page has three areas:
- Raw Signals
- Canonical Issues
- Agent Workspace

## Raw Signals
Show all sources in one list:
- GitHub Issues
- Slack
- Discussions
- Docs feedback

Each item shows type, source, repo, age, and a short summary.

## Canonical Issues
Show merged clusters with:
- title
- confidence
- source count
- priority
- status
- short summary

## Agent Workspace
Show:
- selected canonical issue
- step-by-step agent logs
- investigation progress
- tests
- proposed change
- draft PR summary

## Detailed agent logs
Logs must be explicit and readable, not just a chat transcript.
Each entry should show:
- timestamp
- action
- tool
- input summary
- output summary
- confidence
- duration

## Onboarding screens
Create a 4-step onboarding flow:
1. Connect GitHub
2. Select repository
3. Connect sources and choose focus
4. Review and start monitoring

## Tech stack
- Next.js App Router
- TypeScript
- Tailwind
- shadcn/ui
- React Query or equivalent
- Local mock data layer for the hackathon
- Optional Supabase/Postgres for persistence
- Optional ClickHouse event logging
- Optional Langfuse trace integration

## Design system
- Black on white
- Minimal
- Soft gray borders
- Large whitespace
- Calm typography
- Very restrained accent color
- No colorful dashboard visuals

## Components to create
- App shell
- Onboarding wizard
- Signal feed
- Canonical issue list
- Issue detail workspace
- Agent log timeline
- Test results card
- PR draft card
- Metrics summary cards

## Data model
Create mock data structures for:
- signals
- canonical issues
- agent runs
- agent steps
- test artifacts
- pull request drafts
- learned procedures

## Behavior
- Signals should be clusterable into canonical issues.
- Agent logs should show a believable multi-step workflow.
- Selecting an issue should update the workspace panel.
- The UI should feel like a real control tower for autonomous engineering work.

## Acceptance criteria
- Runs locally
- Looks polished
- Has onboarding
- Has a detailed dashboard
- Shows deduplication
- Shows agent autonomy
- Shows outputs and validation
- Is hackathon demo ready
