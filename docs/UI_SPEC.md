# UI Spec

## Style
- Black text on white background
- Minimal
- Thin borders
- Soft gray dividers
- Lots of whitespace
- One accent color only, used sparingly

## Dashboard layout
Three main panels:
1. Raw signals
2. Canonical issues
3. Agent workspace

## Raw signals panel
Shows all inputs in one feed:
- GitHub issues
- Slack messages
- Discussions
- Docs feedback

Each row includes:
- type
- source
- repo
- short text
- timestamp

## Canonical issues panel
Shows deduplicated work items:
- merged source count
- confidence
- priority
- status
- brief summary

## Agent workspace panel
Shows:
- current investigation state
- detailed logs
- plan
- tests
- code changes
- outputs

## Onboarding
Four screens:
1. Connect GitHub
2. Select repository
3. Connect sources and choose focus
4. Review and start monitoring
