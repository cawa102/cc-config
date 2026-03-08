---
description: Run a 3-agent security review team (Semgrep+Checkov, Supply Chain+Secrets, OWASP Logic Review) in parallel
---

Organize an Agent Team with the following configuration to run security reviews in parallel, and execute the review.
This Agent Team should consist of a Team Lead plus 3 Teammates.
Create a directory for security review reports before starting.
Provide each Teammate with specific target file paths in their instructions.

## Teammates

### Teammate A: Static Analysis + IaC Inspection (Semgrep + Checkov)
Tools: Semgrep, Checkov
Execution method: Run sequentially via bash

#### Semgrep (targeting application code)
```bash
semgrep --config=auto --json --output=semgrep-results.json .
```
Detect issues from the following perspectives:
- SQL injection (non-parameterized queries)
- XSS (unescaped output, dangerouslySetInnerHTML, etc.)
- Command injection (shell execution with user input)
- SSRF (HTTP requests containing user input)
- Path traversal (file operations containing user input)
- Cryptographic misuse (weak algorithms, hardcoded IV/Salt)
- Insecure deserialization (use of eval-like functions)

#### Checkov (targeting infrastructure configuration files, only if they exist)
```bash
checkov --file Dockerfile --output json > checkov-docker.json 2>/dev/null || true
checkov --file docker-compose.yml --output json > checkov-compose.json 2>/dev/null || true
checkov -d .github/workflows --framework github_actions --output json > checkov-ci.json 2>/dev/null || true
checkov -d ./terraform --output json > checkov-terraform.json 2>/dev/null || true
```
Detect issues from the following perspectives:
- Running as root in Dockerfile, unpinned base images, not using multi-stage builds
- Privileged mode in docker-compose, unnecessary port exposure
- Script injection in GitHub Actions (direct use of `${{ github.event.* }}`), excessive permissions
- Public bucket configuration in Terraform, excessive IAM permissions, lack of encryption

Merge and report results from both tools.

### Teammate B: Supply Chain + Secret Detection (npm audit + OSV-Scanner + TruffleHog)
Tools: npm audit, OSV-Scanner, TruffleHog
Execution method: Run sequentially via bash

#### Dependency Check
```bash
npm audit --json > npm-audit-results.json
osv-scanner --json --lockfile=package-lock.json > osv-results.json
```
Detect issues from the following perspectives:
- Known CVEs in direct and transitive dependencies
- Suggested fix versions (with explicit upgrade paths)
- License risks (GPL contamination, etc.)

For Python projects, replace with the following:
```bash
pip audit --format=json > pip-audit-results.json
osv-scanner --json --lockfile=requirements.txt > osv-results.json
```

#### Secret Detection
```bash
trufflehog filesystem . --json > trufflehog-fs.json
trufflehog git file://. --since-commit=HEAD~1 --json > trufflehog-git.json
```
Detect issues from the following perspectives:
- Hardcoded AWS credentials, GitHub tokens, API keys, etc.
- Exposed database connection strings
- Committed .env files
- Committed private keys
- Past secrets remaining in commit history (retrievable via git log even if deleted)

Merge and report all results.

### Teammate C: Logic Review (OWASP Checklist)
Tools: Semantic analysis based on code comprehension
Execution method: Run as a sub-agent that reads and analyzes target code

Teammate C is a security specialist focused on identifying and remediating web application vulnerabilities.
Conduct a thorough security review of code, configuration, and dependencies to prevent security issues from reaching production.

#### OWASP Top 10 Checklist

For each category, inspect from the following specific perspectives.

**1. Injection (SQL, NoSQL, Command)**
- Are queries parameterized?
- Is user input sanitized?
- Is the ORM used safely?

```javascript
// ❌ Vulnerable: Query via string concatenation
const user = await db.query(`SELECT * FROM users WHERE id = ${req.params.id}`);

// ✅ Safe: Parameterized query
const user = await db.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
```

**2. Broken Authentication**
- Are passwords hashed with bcrypt/argon2?
- Is JWT properly verified (signature, expiration, issuer)?
- Are sessions secure (httpOnly, secure, sameSite)?
- Is MFA available?

```javascript
// ❌ Vulnerable: Weak hash
const hash = crypto.createHash("md5").update(password).digest("hex");

// ✅ Safe: bcrypt hashing
const hash = await bcrypt.hash(password, 12);
```

```javascript
// ❌ Vulnerable: JWT signature not verified
const decoded = jwt.decode(token);

// ✅ Safe: With signature verification
const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
```

**3. Sensitive Data Exposure**
- Is HTTPS enforced?
- Are secrets stored in environment variables?
- Is PII encrypted (at rest and in transit)?
- Are logs sanitized?

```javascript
// ❌ Vulnerable: Hardcoded secret
const apiKey = "sk-abc123secret";

// ✅ Safe: Retrieved from environment variable
const apiKey = process.env.API_KEY;
```

```javascript
// ❌ Vulnerable: Logging sensitive information
console.log("User login:", { email, password, token });

// ✅ Safe: Masking sensitive fields
console.log("User login:", { email, password: "[REDACTED]", token: "[REDACTED]" });
```

**4. XXE (XML External Entity)**
- Is the XML parser configured securely?
- Is external entity processing disabled?

**5. Broken Access Control**
- Do all routes have authorization checks?
- Are object references indirect?
- Is CORS configured properly?

```javascript
// ❌ Vulnerable: CORS allows all origins
app.use(cors({ origin: "*", credentials: true }));

// ✅ Safe: Explicitly specifying allowed origins
app.use(cors({ origin: ["https://myapp.com"], credentials: true }));
```

**6. Security Misconfiguration**
- Are default credentials changed?
- Is error handling secure (no stack trace exposure)?
- Are security headers configured?
- Is debug mode disabled in production?

```javascript
// ❌ Vulnerable: Returning stack trace to client
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message, stack: err.stack });
});

// ✅ Safe: Returning only a generic error message
app.use((err, req, res, next) => {
  console.error(err.stack); // Log server-side only
  res.status(500).json({ error: "Internal server error" });
});
```

**7. XSS (Cross-Site Scripting)**
- Is output escaped/sanitized?
- Is Content-Security-Policy configured?

```javascript
// ❌ Vulnerable: Rendering user input as-is
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ Safe: Sanitize before rendering
import DOMPurify from "dompurify";
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

#### Context-Dependent Vulnerabilities Undetectable by Teammates A & B

Focus especially on the following vulnerabilities. These are undetectable by pattern matching and represent the greatest added value of this Teammate.

**IDOR (Insecure Direct Object Reference)**
```javascript
// ❌ Vulnerable: No verification that requester ID matches target resource
app.get("/api/users/:id/profile", async (req, res) => {
  const profile = await User.findById(req.params.id);
  res.json(profile);
});

// ✅ Safe: Verify authenticated user ID matches target
app.get("/api/users/:id/profile", authMiddleware, async (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  const profile = await User.findById(req.params.id);
  res.json(profile);
});
```

**Privilege Escalation**
```javascript
// ❌ Vulnerable: Exposing admin API without role check
app.post("/api/admin/users", async (req, res) => {
  const user = await User.create(req.body);
  res.json(user);
});

// ✅ Safe: Role-based access control
app.post("/api/admin/users", authMiddleware, requireRole("admin"), async (req, res) => {
  const user = await User.create(req.body);
  res.json(user);
});
```

**Race Condition**
```javascript
// ❌ Vulnerable: Race condition between check and operation
const balance = await getBalance(userId);
if (balance >= amount) {
  await deductBalance(userId, amount); // Double deduction possible with concurrent requests
}

// ✅ Safe: Protected with transaction and lock
await db.transaction(async (trx) => {
  const balance = await trx("accounts").where({ userId }).forUpdate().first();
  if (balance.amount >= amount) {
    await trx("accounts").where({ userId }).decrement("amount", amount);
  }
});
```

**Business Logic Abuse**
```javascript
// ❌ Vulnerable: Allowing negative amounts
app.post("/api/transfer", async (req, res) => {
  const { amount, to } = req.body;
  await transfer(req.user.id, to, amount); // amount=-100 enables reverse transfer
});

// ✅ Safe: Input validation
app.post("/api/transfer", async (req, res) => {
  const { amount, to } = req.body;
  if (typeof amount !== "number" || amount <= 0 || amount > 1000000) {
    return res.status(400).json({ error: "Invalid amount" });
  }
  await transfer(req.user.id, to, amount);
});
```

**Authentication Flow Flaws**
```javascript
// ❌ Vulnerable: Reset token is not single-use
app.post("/api/reset-password", async (req, res) => {
  const user = await User.findOne({ resetToken: req.body.token });
  user.password = await bcrypt.hash(req.body.newPassword, 12);
  await user.save(); // Token not invalidated → can be reused
});

// ✅ Safe: Make token single-use with expiration
app.post("/api/reset-password", async (req, res) => {
  const user = await User.findOne({
    resetToken: req.body.token,
    resetTokenExpiry: { $gt: Date.now() },
  });
  if (!user) return res.status(400).json({ error: "Invalid or expired token" });
  user.password = await bcrypt.hash(req.body.newPassword, 12);
  user.resetToken = undefined;      // Invalidate token
  user.resetTokenExpiry = undefined;
  await user.save();
});
```

#### Report Format

For each detected issue, report in the following format:

```
[Severity] Issue Title
Category: OWASP Category Name
Location: file.ts:line number
Issue: Description of the vulnerability
Impact: What happens if exploited
Proof of Concept: Specific attack example (when possible)
Recommended Fix: Safe code example
```

The findings from this Teammate depend on LLM judgment and therefore have lower confidence than others. Flag all findings with "Needs Human Review" in the report.

## Final Report Format

Consolidate results from all Teammates and output the report in the following structure.

### Severity Normalization
Normalize each tool's severity scale to the following:
- **Critical** — Immediately exploitable by an attacker remotely
- **High** — Exploitation conditions are limited but impact is severe
- **Medium** — Direct attack is difficult but represents a defensive weakness
- **Low** — Deviation from best practices
- **Info** — Informational, no action required

### Duplicate Handling
When multiple Teammates detect the same issue:
- Teammates A and C report the same vulnerability → Teammate A (Semgrep) is authoritative, C provides supplementary information
- Teammate B's TruffleHog and A's Semgrep detect the same hardcoded key → Teammate B is authoritative (has commit history information)
- Teammate B's dependency check and A's Semgrep report the same library vulnerability → Teammate B is authoritative (has accurate CVE information)

### Summary
Save this to the security check directory.
- Review execution date/time
- Target branch / commit range
- Status overview per category (✅ Pass / ⚠️ Warning / ❌ Fail)
- Final verdict: **Block** / **Approve with Changes** / **Approve**

### Issue Details
For each issue:
1. Issue summary
2. Detecting Teammate
3. Affected file / line number
4. CWE / OWASP mapping (if applicable)
5. Impact (what happens if exploited)
6. Recommended remediation action (with code examples)
7. "Needs Human Review" flag (for Teammate C findings)
