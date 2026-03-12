---
name: team-development
description: Use when you have a written implementation plan with 3+ independent tasks that benefit from parallel development. Creates a TeamCreate-based development team where each developer follows TDD independently, coordinated through a shared task list.
---

# Team Development

Execute an implementation plan using TeamCreate with parallel developer agents. Each developer follows TDD, including 'test-driven-development' skill and 'testing.md' rule independently, coordinated by a team lead through a shared task list.

**Core principle:** TeamCreate for parallel TDD development + Task sub-agents for review/E2E = maximum throughput with quality gates

## When to Use

```
Have implementation plan in docs/plans/?
  ├─ No  → Use /brainstorming then /writing-plans first
  └─ Yes → Are there 3+ independent tasks?
              ├─ No  → Use subagent-driven-development (test-driven-development skill and subagents)
              └─ Yes → ★ Use this skill (team-development)
```

**vs. subagent-driven-development (SP):**
- SP: Sequential subagents, one task at a time, same session
- This: Parallel developers via TeamCreate, multiple tasks simultaneously, tmux panes

## Prerequisites

1. Implementation plan exists at `docs/plans/YYYY-MM-DD-<feature-name>.md`
2. Plan has tasks with clear acceptance criteria
3. Tasks have dependency information (which can run in parallel)
4. Git branch is ready (use `using-git-worktrees` skill if needed)

## The Process

```
Phase A: Setup
  │  1. Read plan from docs/plans/
  │  2. TeamCreate with team name "{feature-name}-dev"
  │  3. Create tasks via TaskCreate (with dependency chains) by refering implementation plan under 'docs/plans/'.
  │  4. Spawn developer agents (2-5 based on task count and dependency)
  │
Phase B: Parallel TDD Development
  │  Each developer:
  │    1. Claims task from TaskList
  │    2. TDD cycle: Test → Fail → Implement → Pass → Refactor
  │    3. Self-review before marking complete
  │    4. TaskUpdate → completed, SendMessage to team-lead
  │    5. Claims next available task
  │  Team lead:
  │    - Monitors progress via TaskList
  │    - Resolves blockers via SendMessage
  │    - Verifies plan checklist is updated on each task completion report
  │    - Handles merge conflicts if any
  │
Phase C: Review (after all dev tasks complete)
  │  1. Shutdown developer agents
  │  2. Run code-reviewer + security-reviewer agents (Task sub-agents, parallel)
  │  3. Fix critical/high issues if any
  │
Phase D: Completion
     1. Run /verify (6-stage verification)
     2. Use finishing-a-development-branch
```

## Phase A: Team Setup

### Step 1: Read and Analyze Plan

```
Read the plan file: docs/plans/YYYY-MM-DD-<feature-name>.md
Extract:
  - All tasks with full descriptions
  - Dependencies between tasks
  - Estimated complexity per task
  - Which tasks can run in parallel
```

### Step 2: Create Team

```
TeamCreate:
  team_name: "{feature-name}-dev"
  description: "Development team for {feature-name}"
```

### Step 3: Create Tasks with Dependencies

**File conflict avoidance:** When splitting tasks, ensure no two concurrent tasks edit the same file. If unavoidable, use `isolation: "worktree"` for the agents involved, or serialize those tasks via `addBlockedBy`.

For each task in the plan:
**Tasks and TaskList should be reflected implementation plan at the 'docs/plans/YYYY-MM-DD-<feature-name>.md'**
```
TaskCreate:
  subject: "Task N: {task title}"
  description: |
    {Full task description from plan}

    ## Acceptance Criteria
    {criteria from plan}

    ## TDD Requirements
    - Write tests first (Red)
    - Run tests - must FAIL
    - Write minimal implementation (Green)
    - Run tests - must PASS
    - Refactor if needed
    - Coverage: 80%+
  activeForm: "Implementing {task title}"
```

Set dependencies:
```
TaskUpdate:
  taskId: "2"
  addBlockedBy: ["1"]  # Task 2 depends on Task 1
```

### Step 4: Spawn Developers

Determine the number of developer agents based on the plan's task count, dependencies, and complexity. The team lead is always present; spawn as many developers as you judge optimal.

Spawn each developer using `./developer-prompt.md` template:

```
Task tool:
  subagent_type: general-purpose
  team_name: "{feature-name}-dev"
  name: "{role-name}"  (e.g., "frontend-dev", "backend-dev")
  model: "sonnet"
  mode: "dontAsk"
  prompt: [Use developer-prompt.md template with project-specific context]
```

## Phase B: Monitoring (Team Lead Responsibilities)

### Progress Check Loop

On each developer completion report:
1. Verify the developer updated `- [ ]` to `- [x]` in `docs/plans/` for that task
2. If not updated, update it immediately
3. Check `TaskList` for overall progress
4. If a developer reports a blocker → help resolve or reassign

### Conflict Resolution

If two developers modify the same file:
1. Identify the conflict via developer messages
2. Determine which change takes priority
3. SendMessage to the lower-priority developer with merge instructions

### When All Tasks Complete

1. Verify via `TaskList` that all tasks show `completed`
2. Verify all checkboxes in the plan file are `- [x]` (sync any missed ones from `TaskList` status)
3. Shutdown all developer agents via `SendMessage` type: "shutdown_request"
4. Wait for shutdown confirmations
5. Proceed to Phase C

## Phase C: Review

Run review agents in parallel (NOT TeamCreate — these are quick, independent analyses):

```
Task tool (parallel):
  Agent 1: code-reviewer agent
    "Review all changes on the current branch.
     Run git diff main...HEAD to see all changes.
     Report: CRITICAL / HIGH / MEDIUM / SUGGESTIONS"

  Agent 2: security-reviewer agent
    "Security review of all changes on the current branch.
     Run git diff main...HEAD.
     Check OWASP Top 10, hardcoded secrets, input validation."
```

If CRITICAL or HIGH issues found:
1. Fix issues directly (single-agent, not TeamCreate)
2. Re-run reviewers to confirm fixes

For deeper security analysis, use `/sec-team` (3-agent parallel).

## Phase D: Completion

1. Tick implementation progress (what is done) at the 'docs/plans/YYYY-MM-DD-<feature-name>.md'

2. Run `/verify` for 6-stage verification:
   - Build → Types → Lint → Tests → Security → Diff review

3. Use `finishing-a-development-branch` skill:
   - Option 1: Merge locally
   - Option 2: Push and create PR
   - Option 3: Keep branch
   - Option 4: Discard

## Red Flags

**Never:**
- Spawn more than 5 developer agents (coordination overhead exceeds benefit)
- Skip TDD in developer prompts (tests-first is non-negotiable)
- Let developers work on dependent tasks simultaneously
- Skip Phase C review (even if developers self-reviewed)
- Use TeamCreate for Phase C (Task sub-agents are more efficient)
- Continue to Phase D if Phase C has unresolved CRITICAL issues

**If developer reports blockers repeatedly:**
- After 3 failed attempts → escalate to systematic-debugging skill
- Consider splitting the task or reassigning

**If merge conflicts arise:**
- Stop both affected developers
- Resolve conflict in team-lead context
- Resume developers with updated context

## Integration

**Required before this skill:**
- `/brainstorming` (SP) → Design exploration
- `/writing-plans` (SP) → Detailed task plan in docs/plans/
- `using-git-worktrees` (SP) → Isolated workspace (recommended)

**Used during this skill:**
- `TeamCreate` + `TaskCreate/TaskUpdate/TaskList` → Team coordination
- `./developer-prompt.md` → Developer agent template
- `SendMessage` → Team communication

**Used after this skill (Phase C-D):**
- `code-reviewer` agent → Code quality review
- `security-reviewer` agent → Security review
- `/sec-team` → Deep security analysis (optional)
- `/verify` → 6-stage verification
- `finishing-a-development-branch` → Branch completion
