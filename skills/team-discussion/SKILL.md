---
name: team-discussion
description: Multi-agent design review. Spawns 3 specialized reviewers (Devil's Advocate, Failure Analyst, Implementation Architect) for 3 rounds of structured discussion on a design document. Produces a prioritized findings report.
---

# Team Discussion

Review a design document through structured multi-agent discussion. Three specialized reviewers analyze the design from orthogonal perspectives, producing a prioritized findings report for the next planning phase.

**Core principle:** Independent analysis first (avoid anchoring bias), then cross-review for synthesis, then convergence on actionable recommendations.

## When to Use

```
Have a design document from brainstorming?
  ├─ No  → Use /brainstorming first
  └─ Yes → Are there architectural decisions that benefit from multi-perspective review?
              ├─ No  → Proceed directly to /writing-plans
              └─ Yes → ★ Use this skill (team-discussion)
```

## Prerequisites

1. Design document exists at `docs/plans/YYYY-MM-DD-<topic>-design.md`
2. The design covers: architecture, components, data flow, error handling, testing approach
3. `docs/discussions/` directory exists (use `/init-docs` if needed)

## The Process

```
Phase A: Setup
  │  1. Read design document
  │  2. TeamCreate with team name "{feature-name}-discussion"
  │  3. Create tasks for Round 1 + Round 2 + Round 3
  │  4. Spawn 3 reviewer agents
  │
Phase B: Round 1 — Independent Review
  │  Each reviewer analyzes the design independently
  │  NO cross-sharing — prevents anchoring bias
  │  Reviewers send findings to team-lead only
  │
Phase C: Round 2 — Cross-Review
  │  Team-lead shares ALL Round 1 findings with ALL reviewers
  │  Each reviewer: confirm, challenge, or extend others' findings
  │  Reviewers send cross-review to team-lead
  │
Phase D: Round 3 — Convergence
  │  Team-lead shares draft synthesis + contested items
  │  Each reviewer: final stance on contested items + last additions
  │  Goal: resolve disagreements into actionable recommendations
  │
Phase E: Synthesis
     Team-lead writes prioritized report to docs/discussions/
```

## Phase A: Team Setup

### Step 1: Read Design Document

```
Read docs/plans/YYYY-MM-DD-<topic>-design.md
Extract:
  - Core architecture decisions
  - Key components and their responsibilities
  - Data flow between components
  - Technology choices and trade-offs
  - Testing approach
```

### Step 2: Create Team

```
TeamCreate:
  team_name: "{feature-name}-discussion"
  description: "Design review discussion for {feature-name}"
```

### Step 3: Create Tasks

Create 9 tasks (3 per reviewer): one for each round.

```
TaskCreate (for each reviewer × 3 rounds):
  Round 1 tasks:
    "R1: Devil's Advocate review"
    "R1: Failure Analyst review"
    "R1: Implementation Architect review"
  Round 2 tasks (blocked by ALL Round 1 tasks):
    "R2: Devil's Advocate cross-review"
    "R2: Failure Analyst cross-review"
    "R2: Implementation Architect cross-review"
  Round 3 tasks (blocked by ALL Round 2 tasks):
    "R3: Devil's Advocate convergence"
    "R3: Failure Analyst convergence"
    "R3: Implementation Architect convergence"

TaskUpdate:
  R2 tasks addBlockedBy: [all R1 task IDs]
  R3 tasks addBlockedBy: [all R2 task IDs]
```

### Step 4: Spawn Reviewers

Spawn 3 reviewer agents using their respective prompt templates:

```
Task tool (parallel, all 3 at once):
  Agent 1:
    subagent_type: general-purpose
    team_name: "{feature-name}-discussion"
    name: "devils-advocate"
    mode: "dontAsk"
    prompt: [Use ./devils-advocate-prompt.md with design context]

  Agent 2:
    subagent_type: general-purpose
    team_name: "{feature-name}-discussion"
    name: "failure-analyst"
    mode: "dontAsk"
    prompt: [Use ./failure-analyst-prompt.md with design context]

  Agent 3:
    subagent_type: general-purpose
    team_name: "{feature-name}-discussion"
    name: "impl-architect"
    mode: "dontAsk"
    prompt: [Use ./impl-architect-prompt.md with design context]
```

## Phase B: Round 1 — Independent Review

**Team lead responsibilities:**
- Wait for all 3 reviewers to complete Round 1 tasks
- Do NOT forward any reviewer's findings to others during this phase
- If a reviewer asks a clarification question, answer it directly

**Each reviewer:**
1. Claims their R1 task
2. Reads the design document
3. Analyzes from their specialized perspective
4. Sends findings to team-lead via SendMessage
5. Marks R1 task as completed

**When all 3 R1 tasks complete:**
- Unblock R2 tasks (automatic via dependency)
- Proceed to Phase C

## Phase C: Round 2 — Cross-Review

**Team lead action:**
Send a single message to each reviewer containing ALL Round 1 findings from ALL reviewers. Use broadcast:

```
SendMessage:
  type: "broadcast"
  content: |
    ## Round 1 Findings from All Reviewers

    ### Devil's Advocate Findings:
    {devil's advocate R1 findings}

    ### Failure Analyst Findings:
    {failure analyst R1 findings}

    ### Implementation Architect Findings:
    {impl architect R1 findings}

    ## Your Round 2 Task:
    Review the above findings. For each finding from other reviewers:
    - AGREE: If you confirm the issue (optionally add detail)
    - CHALLENGE: If you disagree (explain why)
    - EXTEND: If you see additional implications

    Also add any NEW findings triggered by reading others' perspectives.
    Claim your R2 task and send your cross-review to team-lead.
```

**When all 3 R2 tasks complete:**
- Proceed to Phase D

## Phase D: Round 3 — Convergence

**Purpose:** Resolve contested items and produce final, actionable recommendations. The team-lead drafts a synthesis of Round 1 + Round 2, highlights disagreements, and asks each reviewer for their final position.

**Team lead action:**
Draft a preliminary synthesis from Round 1 and Round 2 findings, then broadcast to all reviewers:

```
SendMessage:
  type: "broadcast"
  content: |
    ## Draft Synthesis (Round 1 + Round 2)

    ### Agreed Findings (no action needed from you):
    {findings where all reviewers agree — listed for reference}

    ### Contested Items (YOUR INPUT NEEDED):
    For each contested item below, state your FINAL position:
    - ACCEPT: You accept the majority view
    - MAINTAIN: You maintain your position (provide final reasoning)
    - COMPROMISE: You propose a middle ground

    1. {Contested finding}: {Reviewer A says X, Reviewer B says Y}
    2. {Contested finding}: {Detail}
    ...

    ### Gaps Check:
    Is there anything CRITICAL that was missed across all rounds?
    Only raise genuinely new issues — do not repeat prior findings.

    Claim your R3 task and send your final input to team-lead.
```

**Each reviewer:**
1. Claims their R3 task
2. Reviews the draft synthesis
3. Provides final stance on each contested item
4. Flags any last critical gaps (new issues only)
5. Sends final input to team-lead via SendMessage
6. Marks R3 task as completed

**When all 3 R3 tasks complete:**
- Shutdown all reviewers via SendMessage type: "shutdown_request"
- Wait for shutdown confirmations
- Proceed to Phase E

## Phase E: Synthesis

Synthesize all findings into the discussion report.

### Report Format

Save to: `docs/discussions/YYYY-MM-DD-<topic>-discussion.md`

```markdown
# Discussion Report: {Feature Name}

> **Date:** YYYY-MM-DD
> **Design:** docs/plans/YYYY-MM-DD-<topic>-design.md
> **Reviewers:** Devil's Advocate, Failure Analyst, Implementation Architect
> **Rounds:** 3

## Summary

{3-5 sentences: key findings and recommended design changes}

## Findings

### Critical (Design Change Required)

- **[Source]** {Finding title}
  - Issue: {description}
  - Impact: {what goes wrong if ignored}
  - Recommendation: {specific action}
  - Consensus: {Agreed by N/3 reviewers | Contested — see details}

### Important (Must Address in Planning)

- **[Source]** {Finding title}
  - Issue: {description}
  - Recommendation: {specific action}

### Minor (Note During Implementation)

- **[Source]** {Finding title}
  - Note: {description}

## Recommended Implementation Order

{Based on Implementation Architect's dependency analysis}

1. {Task/component} — Reason: {why first}
2. {Task/component} — Reason: {dependency on 1}
3. ...

## Edge Cases & Failure Scenarios

{Consolidated from Failure Analyst, confirmed/extended by others}

| Scenario | Likelihood | Impact | Mitigation |
|----------|-----------|--------|------------|
| {scenario} | {H/M/L} | {H/M/L} | {strategy} |

## Open Questions

{Unresolved items requiring user decision}

- {Question} — Context: {why this matters}
```

### After Writing Report

1. Announce: "Discussion complete. Report saved to `docs/discussions/YYYY-MM-DD-<topic>-discussion.md`"
2. Present summary of Critical and Important findings to user
3. Ask: "Would you like to address any findings before proceeding to implementation planning?"
4. After user confirms, proceed to `/writing-plans` (the writing-plans skill will incorporate discussion findings)

## Red Flags

**Never:**
- Share Round 1 findings between reviewers before Round 1 completes (anchoring bias)
- Skip Round 2 (cross-pollination is where synthesis happens)
- Skip Round 3 (convergence resolves contested items into clear recommendations)
- Let reviewers see each other's Round 1 messages during Phase B
- Add more than 3 reviewers (diminishing returns, coordination overhead)
- Proceed to writing-plans without user review of Critical findings

**If a reviewer goes off-topic:**
- Redirect via SendMessage with specific focus area
- Remind them of their role's scope

## Integration

**Required before this skill:**
- `/brainstorming` → Design document in docs/plans/

**Used during this skill:**
- `TeamCreate` + `TaskCreate/TaskUpdate/TaskList` → Team coordination
- `SendMessage` → Round management and finding distribution
- `./devils-advocate-prompt.md` → Devil's Advocate agent template
- `./failure-analyst-prompt.md` → Failure Analyst agent template
- `./impl-architect-prompt.md` → Implementation Architect agent template

**Used after this skill:**
- `/writing-plans` → Implementation plan incorporating discussion findings
