## Summary

<!-- Brief description of changes (1-3 sentences) -->

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to
      change)
- [ ] Refactoring (no functional changes)
- [ ] Documentation update
- [ ] Infrastructure/CI change

## Related Issues

<!-- Link to related issues: Fixes #123, Related to #456 -->

---

## Code Review Checklist

### Submitter Checklist (Complete before requesting review)

#### Code Quality

- [ ] Code follows the project's ESLint configuration
- [ ] Code is formatted with Prettier (`pnpm format`)
- [ ] TypeScript has no type errors (`pnpm type-check`)
- [ ] No `any` types added (or justified in comments)
- [ ] Functions are under 100 lines (or have clear justification)
- [ ] Cognitive complexity is reasonable (no deeply nested logic)

#### Security (OWASP Top 10)

- [ ] No hardcoded secrets, API keys, or credentials
- [ ] User input is validated and sanitized
- [ ] SQL queries use parameterized queries (Prisma handles this)
- [ ] No unsafe `dangerouslySetInnerHTML` without sanitization
- [ ] Authentication/authorization checks are in place
- [ ] Sensitive data is not logged

#### Testing

- [ ] Unit tests added for new functionality
- [ ] Existing tests pass (`pnpm test`)
- [ ] Edge cases are covered
- [ ] Error scenarios are tested

#### Documentation

- [ ] Code is self-documenting (clear names, simple logic)
- [ ] Complex logic has inline comments
- [ ] API changes are documented (Swagger/OpenAPI)
- [ ] README updated if needed

#### Performance

- [ ] No N+1 query issues
- [ ] Large data sets use pagination
- [ ] Expensive operations are cached or optimized
- [ ] No unnecessary re-renders in React components

---

### Reviewer Checklist

#### First Pass (Quick Review)

- [ ] PR description clearly explains the change
- [ ] Change size is reasonable (<500 lines preferred)
- [ ] No obvious security issues
- [ ] No hardcoded values that should be configurable

#### Deep Review

- [ ] Business logic is correct
- [ ] Error handling is appropriate
- [ ] Edge cases are handled
- [ ] Code is testable and tested
- [ ] No breaking changes to public APIs (or documented)

#### Architecture

- [ ] Changes follow existing patterns
- [ ] No unnecessary dependencies added
- [ ] Separation of concerns is maintained
- [ ] Database schema changes are migration-safe

---

## Test Plan

<!-- How should reviewers test these changes? -->

1.
2.
3.

## Screenshots/Recordings

<!-- If UI changes, include before/after screenshots -->

## Deployment Notes

<!-- Any special deployment considerations? Database migrations, feature flags, etc. -->

---

## AI/ML Changes (if applicable)

- [ ] AI outputs are logged for audit trail
- [ ] Human review is required before autonomous actions
- [ ] Confidence scores are included in outputs
- [ ] Fallback to human decision exists
