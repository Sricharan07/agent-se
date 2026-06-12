# Autonomous Software Evolution

An autonomous software engineering system for open source repositories.

## One-line summary
The platform ingests signals from GitHub and Slack, deduplicates them into canonical issues, then uses agents to investigate, test, propose fixes, and publish results.

## Product principle
Do not run every signal directly.
First cluster signals into one issue, then let the agent work on the canonical work item.

## Core loop
Signals -> Deduplicate -> Canonical Issue -> Investigate -> Validate -> PR -> Learn
