# Context7 Documentation Lookup

## Core Principle

ALWAYS use Context7 MCP to retrieve up-to-date, version-specific documentation before writing code that uses any library, framework, or API. Never rely solely on training data — it may reference deprecated APIs, outdated patterns, or non-existent methods.

This rule is **proactive**: use Context7 automatically without waiting for the user to say "use context7". If the task involves an external library, look up its documentation first.

## When to Use Context7 (MANDATORY)

### ALWAYS Use Context7 For:

1. **Library/Framework Code**
   - Importing or calling ANY external library (npm, pip, cargo, gem, etc.)
   - Using framework-specific APIs (Next.js, Express, Django, FastAPI, Rails, etc.)
   - Working with SDKs (AWS, Stripe, Supabase, Firebase, Cloudflare, etc.)

2. **Project Setup & Configuration**
   - Initializing a new project with a framework or CLI tool
   - Configuring build tools (Vite, Webpack, Turbopack, esbuild, etc.)
   - Setting up linters, formatters, testing frameworks
   - Docker/container configuration for specific runtimes

3. **Best Practices & Patterns**
   - Authentication/authorization implementation
   - Database schema design and ORM usage
   - State management (Redux, Zustand, Pinia, Jotai, etc.)
   - Caching strategies (Redis, Memcached, etc.)
   - API design for specific frameworks
   - Performance optimization techniques for a specific library

4. **Migration & Upgrades**
   - Migrating between major versions (e.g., Next.js 13 → 14 → 15)
   - Replacing deprecated APIs with current alternatives
   - Adopting new features from recent releases

5. **Error Resolution**
   - Library-specific errors or unexpected behavior
   - APIs that appear to have changed between versions
   - Stack traces referencing library internals

### DO NOT Use Context7 For:

- Standard library features (JavaScript built-ins, Python stdlib, etc.)
- Basic language syntax and constructs
- Pure algorithmic logic with no external dependencies
- Reading/writing files with native APIs only

## How to Use Context7

### Step 1: Check Project Dependencies

Before writing any library code, read the project's dependency file:
- `package.json` for Node.js/Bun/Deno projects
- `requirements.txt`, `pyproject.toml`, or `Pipfile` for Python
- `Cargo.toml` for Rust
- `go.mod` for Go

Note the **exact version** of each relevant library.

### Step 2: Resolve the Library ID

ALWAYS use `resolve-library-id` to find the correct Context7 identifier. Do not guess or hardcode library IDs:

```
Tool: resolve-library-id
  libraryName: "next.js"
  query: "middleware authentication"
```

### Step 3: Query Documentation

Use `query-docs` with the resolved library ID and a specific query:

```
Tool: query-docs
  libraryId: "/vercel/next.js"
  query: "how to implement middleware for JWT authentication in Next.js 15"
```

### Effective Query Formulation

Write queries that are **specific**, **action-oriented**, and **version-aware**:

```
GOOD:  "how to define API route handlers with GET and POST in App Router"
GOOD:  "configure Prisma connection pooling with PostgreSQL"
GOOD:  "implement cursor-based pagination with Drizzle ORM"
GOOD:  "set up server actions with form validation in Next.js 15"

BAD:   "how to use this library"
BAD:   "API docs"
BAD:   "everything about routing"
```

### Multi-Library Tasks

When a task involves multiple libraries, query each one in parallel:

Example: "Set up Supabase auth with Next.js middleware"
1. `resolve-library-id` for "supabase" and "next.js" (parallel)
2. `query-docs` for Supabase: "authentication setup with SSR and PKCE"
3. `query-docs` for Next.js: "middleware implementation with external auth provider"
4. Cross-reference both results to build a coherent implementation

## Version Awareness (CRITICAL)

### Always Include Version in Queries

Projects pin specific versions. Query with that version to avoid getting docs for a different major release:

```
# Project uses next@15.1.0 → query for Next.js 15
Tool: query-docs
  libraryId: "/vercel/next.js"
  query: "App Router server components in Next.js 15"
```

### When Training Data Conflicts with Context7

If training data suggests one approach but Context7 docs show a different current API:
1. **Trust Context7** — it reflects the actual current documentation
2. Note the discrepancy to the user if relevant
3. Implement using the Context7-documented approach

## Fallback Strategy

If Context7 does not have docs for a specific library:
1. Check if an alternative library name resolves (e.g., "react-query" vs "tanstack-query")
2. If unavailable, use WebSearch to find official documentation
3. State clearly to the user that Context7 docs were not available and the source used instead

## Validation Checklist

After retrieving documentation and writing code:

- [ ] API methods used actually exist in the retrieved docs
- [ ] Import paths match the documented module structure
- [ ] Configuration options align with the documented schema
- [ ] Version-specific features match the project's installed version
- [ ] Deprecated patterns from training data are replaced with documented current ones

## Integration with Other Rules

This rule works alongside existing rules:
- **coding-style.md**: Context7 provides the "what" (correct API usage), coding style provides the "how" (code structure)
- **security.md**: Verify Context7 patterns against security guidelines — docs may show insecure shortcuts
- **testing.md**: Use Context7 to find correct testing utilities and patterns for each library
- **patterns.md**: Context7 provides library-specific patterns; common patterns provide architectural guidance
