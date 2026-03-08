# Git Workflow

## Commit Message Format

```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

Note: Attribution disabled globally via ~/.claude/settings.json.

## Pull Request Workflow

When creating PRs:
1. Analyze full commit history (not just latest commit)
2. Use `git diff [base-branch]...HEAD` to see all changes
3. Draft comprehensive PR summary
4. Include test plan with TODOs
5. Push with `-u` flag if new branch

## Feature Implementation Workflow

1. **Brainstorm & Plan (MANDATORY)**
   - Run `/brainstorming` to explore requirements and design
   - Run `/writing-plans` to save implementation plan to `docs/plans/`
   - Do NOT proceed to implementation without a plan in `docs/plans/`

2. **Implement**
   - **Parallelizable tasks**: Use `/team-dev` to launch AgentTeam for parallel development
   - **Simple/sequential tasks**: Use `/tdd` for TDD cycle (RED → GREEN → REFACTOR)
   - Both paths require 80%+ test coverage

3. **Code Review**
   - Use **code-reviewer** agent immediately after writing code
   - Address CRITICAL and HIGH issues
   - Fix MEDIUM issues when possible

4. **Commit & Push**
   - Detailed commit messages
   - Follow conventional commits format
