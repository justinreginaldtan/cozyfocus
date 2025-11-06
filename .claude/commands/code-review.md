# Code Review Skill

Reviews code against CozyFocus patterns, security, and design system.

## Usage

```
/code-review [file-path]
/code-review components/AuthForm.tsx
/code-review lib/auth/authService.ts
```

## What It Does

1. Reads the specified file
2. Checks against CozyFocus standards:
   - TypeScript type safety
   - Security vulnerabilities
   - Design system compliance (twilight theme, glass morphism)
   - Architecture patterns from ARCHITECTURE.md
   - Error handling
   - Performance considerations
3. Provides actionable feedback

---

**Prompt:**

Review the code at: {{prompt}}

Instructions:
1. Read the specified file
2. Read ARCHITECTURE.md and cozyfocus-spec.md for context
3. Analyze the code for:

**Type Safety:**
- [ ] All functions have proper TypeScript types
- [ ] No `any` types used
- [ ] Props are properly typed
- [ ] Return types are explicit

**Security:**
- [ ] No hard-coded credentials
- [ ] Input validation present (Zod schemas?)
- [ ] No SQL injection risks
- [ ] XSS prevention (sanitized inputs)
- [ ] Authentication checks if needed
- [ ] No exposed secrets

**Design System:**
- [ ] Uses design tokens from `lib/design-tokens.ts`
- [ ] Follows twilight color scheme
- [ ] Glass morphism for overlays (backdrop-blur, rgba)
- [ ] Animations use defined keyframes (breath, aurora-drift)
- [ ] Spacing uses token system
- [ ] Minimal UI philosophy maintained

**Architecture:**
- [ ] Follows component composition patterns
- [ ] Custom hooks extracted if logic is reusable
- [ ] Separation of concerns (UI vs logic)
- [ ] Error boundaries present for critical components
- [ ] Loading states handled

**Performance:**
- [ ] No unnecessary re-renders
- [ ] Memoization used where appropriate (memo, useMemo, useCallback)
- [ ] Refs used for high-frequency updates (60fps animations)
- [ ] No memory leaks (cleanup in useEffect)

**Error Handling:**
- [ ] Try/catch blocks present
- [ ] User-friendly error messages
- [ ] Errors logged (console.error or Sentry)
- [ ] Graceful degradation

**Testing:**
- [ ] Is this code testable?
- [ ] Does it have tests? (Check for .test.ts/.spec.ts file)

Present feedback as:

```
📝 CODE REVIEW: [filename]

✅ Strengths:
- [What's done well]

⚠️ Issues Found:
1. [Critical/High/Medium/Low] - [Issue description]
   Location: [line numbers]
   Fix: [Specific recommendation]

💡 Suggestions:
- [Optional improvements]

Security Score: X/10
Type Safety Score: X/10
Design Compliance Score: X/10
Overall: [Pass / Needs Work / Refactor Needed]
```

Be constructive but honest. If there are security issues, mark as CRITICAL.
