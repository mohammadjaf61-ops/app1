# Hypermarket Platform - Code Review Checklist

This document provides comprehensive guidelines for code review. All PRs must
pass these checks before merge.

---

## Automated Quality Gates

These checks run automatically in CI. PRs cannot be merged until all pass.

| Gate       | Tool           | Threshold                  |
| ---------- | -------------- | -------------------------- |
| Lint       | ESLint         | 0 errors                   |
| Format     | Prettier       | All files formatted        |
| Type Check | TypeScript     | 0 errors                   |
| Security   | pnpm audit     | 0 critical vulnerabilities |
| Unit Tests | Jest           | All tests pass             |
| Build      | Next.js/NestJS | Successful build           |

---

## Manual Review Checklist

### 1. Code Quality

#### TypeScript

- [ ] No `any` types (use `unknown` if type is truly unknown)
- [ ] Interfaces/types are well-defined
- [ ] Generics used appropriately
- [ ] Strict null checks handled
- [ ] No type assertions (`as`) without justification

#### Clean Code

- [ ] Functions do one thing (Single Responsibility)
- [ ] Functions are under 100 lines
- [ ] Cognitive complexity < 15
- [ ] No duplicate code (DRY principle)
- [ ] Meaningful variable/function names
- [ ] No magic numbers (use constants)
- [ ] No commented-out code

#### Error Handling

- [ ] All async operations have error handling
- [ ] Errors are logged with context
- [ ] User-facing errors are friendly
- [ ] No swallowed errors (empty catch blocks)
- [ ] Custom errors extend base Error class

### 2. Security (OWASP Top 10)

#### A01: Broken Access Control

- [ ] Authorization checks on all protected endpoints
- [ ] Role-based access control (RBAC) enforced
- [ ] Users can only access their own data
- [ ] Admin functions require admin role

#### A02: Cryptographic Failures

- [ ] Passwords hashed with bcrypt (cost factor ≥ 10)
- [ ] Sensitive data encrypted at rest
- [ ] HTTPS enforced for all communications
- [ ] JWT secrets are strong and not hardcoded

#### A03: Injection

- [ ] All database queries use Prisma ORM (parameterized)
- [ ] No raw SQL with user input
- [ ] User input sanitized for special characters
- [ ] No `eval()` or `Function()` with user input

#### A04: Insecure Design

- [ ] Input validation on all user inputs
- [ ] Rate limiting on authentication endpoints
- [ ] Secure defaults for all configurations
- [ ] Principle of least privilege applied

#### A05: Security Misconfiguration

- [ ] No debug mode in production
- [ ] Error messages don't leak stack traces
- [ ] CORS configured correctly
- [ ] Security headers set (helmet.js)

#### A06: Vulnerable Components

- [ ] Dependencies are up to date
- [ ] No known vulnerabilities in dependencies
- [ ] Only necessary dependencies included

#### A07: Authentication Failures

- [ ] Strong password requirements enforced
- [ ] Account lockout after failed attempts
- [ ] Session timeout implemented
- [ ] Secure session management

#### A08: Software and Data Integrity

- [ ] No unsigned/unverified updates
- [ ] CI/CD pipeline is secure
- [ ] Code changes are reviewed

#### A09: Logging and Monitoring

- [ ] Security events are logged
- [ ] No sensitive data in logs
- [ ] Logs include request context (user, IP)
- [ ] Audit trail for critical operations

#### A10: Server-Side Request Forgery

- [ ] External URLs are validated
- [ ] Allowlists for external services
- [ ] No user-controlled URLs in server requests

### 3. Backend (NestJS) Specific

#### API Design

- [ ] RESTful conventions followed
- [ ] Proper HTTP status codes
- [ ] Request/response DTOs defined
- [ ] Swagger documentation complete
- [ ] Pagination for list endpoints
- [ ] Proper error responses

#### Database

- [ ] Efficient queries (no N+1)
- [ ] Indexes on frequently queried columns
- [ ] Migrations are reversible
- [ ] Transactions for multi-step operations
- [ ] Soft deletes where appropriate

#### Performance

- [ ] Database queries are optimized
- [ ] Caching strategy in place
- [ ] Background jobs for heavy operations
- [ ] Response times acceptable (<200ms)

### 4. Frontend Specific

#### React/React Native

- [ ] Components are focused (single responsibility)
- [ ] Proper use of hooks (no rules violations)
- [ ] Memoization where beneficial
- [ ] No inline function definitions in JSX
- [ ] Keys used correctly in lists
- [ ] Accessibility (a11y) considered

#### State Management

- [ ] Appropriate state location (local vs global)
- [ ] No prop drilling (use context/store)
- [ ] State updates are immutable
- [ ] Loading/error states handled

#### Performance

- [ ] No unnecessary re-renders
- [ ] Images optimized
- [ ] Lazy loading for large components
- [ ] Bundle size considered

### 5. AI/ML Governance

#### Transparency

- [ ] All AI outputs logged with audit trail
- [ ] Model name/version recorded
- [ ] Input parameters logged
- [ ] Confidence scores included

#### Human Oversight

- [ ] AI recommendations require human approval
- [ ] No autonomous actions without review
- [ ] Override mechanism available
- [ ] Escalation path defined

#### Accountability

- [ ] AI decisions can be explained
- [ ] Audit trail is queryable
- [ ] Performance metrics tracked
- [ ] Bias monitoring in place

---

## Review Process

### For Authors

1. **Before Creating PR**
   - Run `pnpm lint:fix` and `pnpm format`
   - Run `pnpm type-check`
   - Run `pnpm test`
   - Self-review using this checklist

2. **PR Description**
   - Clear summary of changes
   - Link to related issues
   - Test plan provided
   - Screenshots for UI changes

3. **During Review**
   - Respond to all comments
   - Request re-review after changes
   - Don't resolve comments yourself

### For Reviewers

1. **First Pass (5 min)**
   - Read PR description
   - Check for obvious issues
   - Verify CI passes

2. **Deep Review (15-30 min)**
   - Review code changes
   - Check against this checklist
   - Test locally if needed

3. **Feedback**
   - Be specific and constructive
   - Suggest improvements
   - Approve only when satisfied

---

## Merge Requirements

- [ ] All CI checks pass
- [ ] At least 1 approval from code owner
- [ ] All review comments resolved
- [ ] PR is up to date with target branch
- [ ] No merge conflicts

---

## Severity Levels

| Level         | Description                            | Action                  |
| ------------- | -------------------------------------- | ----------------------- |
| 🔴 Critical   | Security vulnerability, data loss risk | Must fix before merge   |
| 🟠 Major      | Bug, significant issue                 | Should fix before merge |
| 🟡 Minor      | Code quality, style issue              | Can fix in follow-up    |
| 🟢 Suggestion | Nice to have improvement               | Optional                |

---

_Last updated: January 2025_
