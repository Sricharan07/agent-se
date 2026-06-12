# Data Model

## Signal
Raw inbound event before deduplication.

Fields:
- id
- source
- source_ref
- source_type
- repo
- text
- author
- created_at
- metadata
- embedding

## CanonicalIssue
The merged work item that represents the underlying problem.

Fields:
- id
- repo
- title
- summary
- issue_type
- status
- priority
- confidence
- created_at
- updated_at

## IssueSource
Join table linking raw signals to canonical issues.

Fields:
- id
- canonical_issue_id
- signal_id
- similarity_score
- merge_reason

## AgentRun
A full autonomous run for one canonical issue.

Fields:
- id
- canonical_issue_id
- status
- started_at
- ended_at
- outcome
- model_version
- trace_id

## AgentStep
Fine-grained logs for each action the agent performs.

Fields:
- id
- agent_run_id
- step_name
- step_type
- input_summary
- output_summary
- confidence
- duration_ms
- tool_name
- created_at

## ValidationArtifact
Evidence produced during tests or analysis.

Fields:
- id
- agent_run_id
- artifact_type
- path
- summary
- passed

## PullRequestDraft
The generated or opened PR.

Fields:
- id
- canonical_issue_id
- agent_run_id
- pr_url
- status
- diff_summary
- created_at

## LearnedProcedure
Reusable workflow captured from a successful run.

Fields:
- id
- repo
- pattern_name
- procedure_summary
- success_count
- last_verified_at
