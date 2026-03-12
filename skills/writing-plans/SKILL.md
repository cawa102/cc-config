---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

Write implementation plans assuming the engineer has zero context for the codebase. Document WHAT to build and WHERE, not HOW to test or implement — that's the TDD skill's job. Make every task manageable with checklists ("- [ ]" and "- [-]"). DRY. YAGNI. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** This should be run in a dedicated worktree (created by brainstorming skill).

**Save plans to:** `docs/plans/YYYY-MM-DD-<feature-name>.md`

## Separation of Concerns

| Responsibility | Owner | NOT Owner |
|---|---|---|
| What to build | Plan | — |
| File paths & structure | Plan | — |
| Interface/API contracts | Plan | — |
| Test scenarios (what to verify) | Plan | — |
| Dependencies & config | Plan | — |
| Actual test code | TDD | Plan |
| Implementation code | TDD | Plan |
| RED → GREEN → REFACTOR cycle | TDD | Plan |
| Coverage verification | TDD | Plan |

**Key principle:** The plan describes the WHAT and WHERE. TDD handles the HOW.

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---
```

## Task Structure

```markdown
- [ ] Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts:123-145`
- Test: `tests/exact/path/to/test.ts`

**What:** Brief description of what this task builds.

**Interface:**
- `methodName(param: Type): ReturnType` — what it does
- `otherMethod(param: Type): ReturnType` — what it does

**Test scenarios:**
- Valid input returns expected result
- Missing required field throws validation error
- Duplicate entry returns conflict error
- Empty collection returns empty array

**Dependencies:** `@/lib/db`, `@/types/model`

**Notes:** [Any non-obvious decisions, gotchas, or references to docs]

**Commit:** `feat: add component-name with CRUD operations`
```

## What to Include vs. Omit

### INCLUDE in the plan:
- Exact file paths (create, modify, test)
- Interface/type signatures for public APIs
- Test scenarios as plain-language descriptions
- Dependencies and imports needed
- Non-obvious decisions or gotchas
- Commit message per task

### OMIT from the plan (TDD handles these):
- Full test code blocks
- Full implementation code blocks
- "Run test to verify it fails/passes" steps
- Test framework commands and expected output

### Exception: Include code snippets ONLY for:
- Config files (e.g., `tsconfig.json` changes, env vars)
- Type/interface definitions that multiple tasks depend on
- Complex data structures or schemas that define the contract

## Remember
- Exact file paths always
- Describe behavior, not code
- Reference relevant skills with @ syntax
- DRY, YAGNI, frequent commits
- Keep plans concise — long plans cause session timeouts

## Execution Handoff

After saving the plan, analyze its characteristics and recommend an execution approach:

### Decision Criteria

| Factor | Subagent-Driven | Parallel Session |
|---|---|---|
| Task count | 1-4 tasks | 5+ tasks |
| Task independence | Sequential / dependent | 3+ independent tasks |
| Scope | Single feature, focused | Multi-component, broad |
| Review need | High (exploratory, uncertain) | Lower (well-defined tasks) |

### Offer with Recommendation

**"Plan complete and saved to `docs/plans/<filename>.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Recommendation: [1 or 2] — [1-2 sentence justification based on the plan's task count, independence, and complexity]"**

**If Subagent-Driven chosen:**
- **REQUIRED ACTION:** Use "/tdd" command to invoke "tdd-guide" agent with "test-driven-development" skill
- Stay in this session
- Fresh subagent per task + code review

**If Parallel Session chosen:**
- Guide them to open new session in worktree. or Use "/clear" command to open new session.
- **REQUIRED ACTION:** Use "/team-dev" command to invoke "team-development" skill
