---
description: Launch a TeamCreate development team to execute an implementation plan with parallel TDD developers
---

Execute the implementation plan using the `team-development` skill.

## Instructions

1. Find the most recent plan in `docs/plans/` (or ask the user which plan to execute)
2. Follow the `team-development` skill phases A through E:
   - **Phase A**: Read plan → TeamCreate → TaskCreate with dependencies → Spawn developers
   - **Phase B**: Monitor progress, resolve blockers, handle conflicts
   - **Phase C**: After all dev tasks complete → code-reviewer + security-reviewer (Task sub-agents)
   - **Phase D**: Run `/verify` → `finishing-a-development-branch`

3. Use `./developer-prompt.md` from the `team-development` skill for developer agent prompts
4. Determine the optimal number of developers based on task count, dependencies, and complexity (max 3)

## Quick Start

```
# Read plan
Read docs/plans/YYYY-MM-DD-<feature>.md

# Create team
TeamCreate: team_name="{feature}-dev"

# Create tasks from plan (with dependencies)
TaskCreate for each task...
TaskUpdate to set addBlockedBy where needed...

# Spawn developers (see team-development/developer-prompt.md)
Task tool: dev-1 (general-purpose, team_name, dontAsk)
Task tool: dev-2 (general-purpose, team_name, dontAsk)

# Monitor until all tasks complete
# Then: Review → E2E → Verify → Finish branch
```
