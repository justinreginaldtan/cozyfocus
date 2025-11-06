# Daily Log Skill

Quick command to update your DAILY_LOG.md with today's progress.

## Usage

```
/daily-log [hours]h [status] [notes]
```

## Examples

```
/daily-log 6h completed auth setup, struggled with OAuth
/daily-log 4h blocked on Stripe approval
/daily-log 8h finished database schema, all tests passing
```

## What It Does

1. Finds today's entry in DAILY_LOG.md (or creates it)
2. Updates the hours worked
3. Adds your status/notes
4. Saves automatically

---

**Prompt:**

Update the DAILY_LOG.md file with today's progress.

Instructions:
1. Read DAILY_LOG.md
2. Find the current day's entry (look for the most recent "Day X" section that's in progress)
3. Parse the user's input:
   - Extract hours (e.g., "6h" → 6 hours)
   - Extract status (completed/blocked/in-progress)
   - Extract notes (everything else)
4. Update the entry:
   - Fill in **Hours:** field
   - If tasks mentioned, check them off as [x]
   - Add notes to **Notes:** section
   - If blocked, add to **Blockers:** section
5. Show me a summary of what was updated

User input: {{prompt}}

Example update:
```markdown
### Day 1 - Supabase Auth Setup
**Hours:** 6h  ← UPDATED
**Focus:** Setting up authentication

**Completed:**
- [x] Enable Supabase Auth in dashboard  ← CHECKED
- [x] Configure email authentication  ← CHECKED
- [ ] Add Google OAuth provider  ← Still unchecked

**Blockers:**
OAuth approval pending  ← ADDED

**Notes:**
Supabase docs were super helpful. Auth setup easier than expected.  ← ADDED
```

Be concise and just update the file, then confirm what changed.
