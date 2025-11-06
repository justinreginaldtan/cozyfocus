# CozyFocus

> A real-time collaborative Pomodoro timer with social presence in a cozy twilight study lounge

**Status:** 🚧 Active Development (2-week sprint)

---

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:3000
```

---

## 🧭 Navigation

**For Development:**
- **[QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md)** ← START HERE! Daily workflow, commands, cheat sheets
- **[DAILY_LOG.md](./DAILY_LOG.md)** - Track your progress
- **[SPRINT_PLAN.md](./docs/SPRINT_PLAN.md)** - 2-week roadmap

**For Technical Details:**
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System design & patterns
- **[WORKFLOW_GUIDE.md](./docs/WORKFLOW_GUIDE.md)** - AI-assisted workflow tips
- **[cozyfocus-spec.md](./docs/cozyfocus-spec.md)** - Design vision

---

## 🎨 What is CozyFocus?

A twilight-themed study space where you can:
- 🍅 Focus with Pomodoro timers (solo or shared)
- 👥 See others studying alongside you (real-time presence)
- 🎵 Listen to ambient music
- ✨ Feel cozy in a beautiful pixel art environment

**Design Philosophy:** Calm, minimal, warm. Like studying in a quiet lounge at dusk.

---

## 🛠 Tech Stack

- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS + Framer Motion
- **Backend:** Supabase (Auth, Database, Realtime)
- **Payments:** Stripe (subscriptions)
- **State:** Zustand + localStorage
- **Deployment:** Vercel

---

## 📁 Project Structure

```
app/                    # Next.js pages
components/             # React components (avatars, timer, UI)
lib/                    # Services, utilities, design tokens
  ├── auth/            # ✅ Authentication service (Day 1)
  ├── design-tokens.ts # Twilight color palette
  └── supabaseClient.ts
docs/                   # Documentation & guides
DAILY_LOG.md           # Daily progress tracking
```

---

## 🎯 Current Sprint Progress

**Day 1:** ✅ Supabase Auth Setup
- Created auth service with email/password + OAuth
- Built test page with twilight glass morphism UI
- Ready for database schema design

**Next Up (Day 2):** Database schema + Row Level Security policies

---

## 🔑 Environment Setup

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

Get these from: https://supabase.com/dashboard → Settings → API

---

## 🧪 Testing

```bash
# Auth test page
http://localhost:3000/test-auth

# Type checking
npm run type-check

# Build
npm run build
```

---

## 📖 Documentation

**Need help?** Check [QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md) first!

**Claude Skills (slash commands):**
- `/daily-log [hours]h [notes]` - Quick progress update
- `/sprint-status` - See current progress
- `/code-review [file]` - Review code quality

---

## 🎨 Design System

**Colors:**
- Twilight dark: `#0b1220`
- Accent yellow: `#fcd34d`
- Accent pink: `#f973af`
- Accent blue: `#38bdf8`

**Key Components:**
- Glass morphism with `backdrop-blur-lounge`
- Soft animations (`animate-breath`, `animate-aurora-drift`)
- Minimal UI philosophy

See [design-tokens.ts](./lib/design-tokens.ts) for full system.

---

## 🚀 Deployment

**Not yet deployed.** Coming in Week 2 (Day 14).

---

## 📝 License

Private project - Portfolio piece

---

## 🙏 Credits

**Developer:** Justin (Senior CIS student)
**Design:** CozyFocus team
**AI Assist:** Claude (Anthropic)

---

**Last Updated:** Day 1
**Next Review:** End of Week 1
