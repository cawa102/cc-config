# Agent Team Development

## Context Window Management (MANDATORY)

When working in an Agent Team (parallel development with multiple agents):

1. **Check context usage** before starting each new task
2. **If usage exceeds 50%**: Do NOT continue development in the current agent — spawn a new agent to take over
3. **On handoff**, clearly communicate:
   - Completed tasks and their status
   - Current state of the work
   - Next task to pick up
4. This ensures each agent operates with sufficient context capacity, preventing quality degradation from context pressure

## File Conflict Avoidance (MANDATORY)

Multiple agents editing the same file simultaneously causes destructive conflicts:

1. **Task design**: Team Lead must design tasks so that no two agents edit the same file concurrently
2. **On conflict**: Stop both affected agents → Team Lead resolves the conflict → resume agents
3. **Worktree isolation**: When conflict risk is high, use `isolation: "worktree"` to give agents isolated copies of the repo

## Communication Discipline

- **Default to `message` (direct)** — progress reports, questions, and blocker reports should all be sent directly to the recipient
- **Use `broadcast` sparingly** — it sends a separate message to every teammate, costing N deliveries for N agents. Only use for team-wide blockers or round transitions that genuinely require everyone's attention
- **Agent text output is invisible to the team** — always use `SendMessage` to communicate

## Shutdown Protocol

Always release resources when team work is complete:

1. Verify all tasks are `completed` via `TaskList`
2. Send `SendMessage` with type: `"shutdown_request"` to each agent
3. Wait for shutdown confirmations from all agents
4. Run `TeamDelete` to clean up team and task list

## Related Skills

- `/team-dev` (`team-development`) — Parallel TDD development team (implementation phase)
- `/team-discussion` — Multi-agent design review (design phase)
- `/sec-team` — 3-agent parallel security review
- `/e2e-team` — 3-agent parallel E2E testing (playwright-cli, Lighthouse CI, axe-core)
