---
name: e2e-team
description: "Run a 3-agent E2E test team (playwright-cli functional+exploratory, Lighthouse CI, axe-core accessibility) in parallel. Use when the user wants comprehensive end-to-end testing of a web application, including functional tests, performance audits, and accessibility checks. Trigger on phrases like 'run e2e tests', 'full site test', 'test my app end to end', 'check performance and accessibility', or any request for thorough web app quality validation."
---

# E2E Test Team

Run comprehensive end-to-end tests against a web application using 3 specialized agents in parallel, coordinated by you as the Team Lead.

The goal of E2E testing is to validate that the application works correctly from the user's perspective — not just that individual components function, but that real user journeys complete successfully, the site performs well, and it's accessible to everyone. This team covers three pillars: **functional correctness**, **performance**, and **accessibility**.

## Team Structure

```
Team Lead (you)
├── Teammate 1: Playwright Tester (playwright-cli)
│   └── Functional tests + Exploratory testing + Regression test generation
├── Teammate 2: Lighthouse CI (@lhci/cli)
│   └── Performance, SEO, best practices scoring
└── Teammate 3: axe-core Accessibility (@axe-core/playwright)
    └── WCAG 2.0/2.1 AA compliance inspection
```

## Skill Dependencies

This skill relies on the **playwright-cli** skill (`~/.claude/skills/playwright-cli/`):
- Teammate 1 (Playwright Tester) uses `playwright-cli` as its primary tool
- The playwright-cli skill provides the SKILL.md (command reference) and `references/` directory (tracing, video, sessions, storage, test generation, mocking, running code)
- The Playwright Tester agent reads these files just-in-time during testing phases

## Prerequisites

Before launching the team:

1. **Identify the target** — the app must be running and accessible at a URL (local or remote)
2. **Create a test output directory** — `mkdir -p e2e-results/{playwright,lighthouse,accessibility}`
3. **Verify dependencies** — ensure `playwright-cli`, `@lhci/cli`, and `@axe-core/playwright` are available (install if needed)

## Phase A: Setup

### Step 1: Understand the Application

Before spawning agents, gather context:

```
- What is the app's purpose? (e-commerce, SaaS, blog, etc.)
- What are the critical user flows? (login, checkout, form submission, etc.)
- What pages exist? (check sitemap, routes, navigation)
- Is authentication required? If so, how? (credentials, OAuth, etc.)
- What is the base URL?
```

If any of this is unclear, ask the user before proceeding.

### Step 2: Create Team and Tasks

```
TeamCreate:
  team_name: "e2e-test"
  description: "E2E testing team for [app name]"

TaskCreate (3 tasks):
  Task 1: "Playwright: Functional & Exploratory Testing"
  Task 2: "Lighthouse: Performance & SEO Audit"
  Task 3: "axe-core: Accessibility Compliance Check"
```

### Step 3: Spawn Teammates

Spawn all 3 agents in parallel using the prompt templates below.

Each agent should be spawned with:
```
Agent tool:
  team_name: "e2e-test"
  name: "[teammate-name]"
  mode: "dontAsk"
  prompt: [Use the corresponding prompt template file]
```

**Teammate prompts:**
- Teammate 1 (Playwright Tester): `./playwright-tester-prompt.md`
- Teammate 2 (Lighthouse CI): `./lighthouse-prompt.md`
- Teammate 3 (axe-core): `./axe-core-prompt.md`

When spawning, replace these placeholders in each prompt:
- `[BASE_URL]` — the application's base URL
- `[APP_DESCRIPTION]` — brief description of the app
- `[CRITICAL_FLOWS]` — list of critical user flows to test
- `[AUTH_INFO]` — authentication method and credentials (if applicable)
- `[PAGES]` — list of known pages/routes
- `[OUTPUT_DIR]` — path to the results directory

## Phase B: Monitoring

While agents are working:

1. Monitor progress via `TaskList`
2. Respond to questions or blockers via `SendMessage`
3. If an agent hits authentication issues, help them set up storage state
4. As agents complete, collect their results

## Phase C: Report Generation

Once all 3 agents have completed, consolidate results into a single report.

### Report Structure

```markdown
# E2E Test Report

## Summary
- **Test date:** [date and time]
- **Application:** [app name and URL]
- **Tested pages:** [list of URLs]
- **Overall status:** [PASS / FAIL / WARNINGS]

| Category              | Status | Details                          |
|-----------------------|--------|----------------------------------|
| Functional Tests      | ✅/⚠️/❌ | X passed, Y failed              |
| Exploratory Testing   | ✅/⚠️/❌ | N issues found                  |
| Performance           | ✅/⚠️/❌ | Score: X/100                    |
| Accessibility (a11y)  | ✅/⚠️/❌ | N violations (C critical)       |
| SEO                   | ✅/⚠️/❌ | Score: X/100                    |
| Best Practices        | ✅/⚠️/❌ | Score: X/100                    |

## Detected Issues (by severity)

### Critical (merge-blocking)
[Issues that prevent core functionality from working]

### High (fix recommended soon)
[Issues that significantly degrade UX, performance, or accessibility]

### Medium (address in next sprint)
[Issues that should be fixed but don't block release]

### Low / Info (improvement suggestions)
[Nice-to-have improvements and informational findings]

## Issue Details
For each issue:
1. **Issue summary**
2. **Detecting agent** (Playwright / Lighthouse / axe-core)
3. **Affected page / element**
4. **Steps to reproduce or evidence** (trace file, screenshot, video, score)
5. **Recommended fix action**

## Artifacts
- Trace files: [paths]
- Videos: [paths]
- Screenshots: [paths]
- Lighthouse reports: [paths]
- Generated test code: [paths]
```

## Phase D: Cleanup

1. Verify all tasks are `completed` via `TaskList`
2. Send `shutdown_request` to each agent via `SendMessage`
3. Wait for shutdown confirmations
4. Run `TeamDelete` to clean up

## Key Principles

- **Launch all 3 agents simultaneously** — they are independent and should run in parallel
- **Do not skip any pillar** — functional, performance, and accessibility together give a complete picture
- **Trace everything** — traces and videos are cheap storage but invaluable for debugging
- **Prioritize real user impact** — severity should reflect actual user-facing consequences, not technical severity alone
- **Generate reproducible tests** — exploratory findings should be captured as test code for regression prevention
