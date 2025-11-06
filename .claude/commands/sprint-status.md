# Sprint Status Skill

Shows your current progress in the 2-week sprint.

## Usage

```
/sprint-status
```

## What It Does

1. Reads DAILY_LOG.md to see what day you're on
2. Shows today's target tasks
3. Shows tomorrow's tasks
4. Calculates hours logged vs. target
5. Shows week progress

---

**Prompt:**

Show the current sprint status for CozyFocus development.

Instructions:
1. Read DAILY_LOG.md
2. Find the most recent day entry (look for the last "Day X" with content)
3. Identify:
   - Current day number (1-14)
   - Today's target feature
   - Completed tasks (marked with [x])
   - Pending tasks (marked with [ ])
   - Blockers if any
   - Hours logged today
4. Read SPRINT_PLAN.md to get the next day's tasks
5. Calculate:
   - Total hours logged so far (sum all **Hours:** fields)
   - Target hours for current week (50 hours per week)
   - Days remaining in sprint (14 - current day)

Present as a clean status report:

```
📊 SPRINT STATUS

Current: Day X/14 - [Feature Name]
Week: 1 (Days 1-7) | 2 (Days 8-14)

Progress Today:
✅ [Completed tasks]
🔄 [In-progress tasks]
❌ [Blocked tasks]

Hours Logged:
Today: Xh
This week: Xh / 50h
Total: Xh / 100h

Up Next (Day X+1):
- [Tomorrow's main tasks from SPRINT_PLAN.md]

Blockers:
[Any noted blockers]

Velocity: On track | Ahead | Behind
```

Be honest about velocity. If hours are low or tasks incomplete, say "Behind schedule".
