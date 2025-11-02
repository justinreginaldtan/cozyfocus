# CozyFocus - Project Context

## Vision & Emotional Core

CozyFocus is **intimacy software, not productivity software**. It's designed to remove loneliness through ambient companionship.

### Origin Story
Started from thinking about long-distance relationships and people studying alone. How do you give someone even the smallest feeling that they're closer to someone they care about? Not through webcams (too daunting), not through chat (too risky, ruins the safe space), but through **presence and small gestures**.

Like the Tamagotchi pets people share, or little avatars on each other's screens. A cute, cozy, chibi/Sanrio aesthetic that feels warm and safe.

### Target Users
- People in long-distance relationships who want to study "together"
- Solo studiers who feel isolated
- Anyone intimidated by existing study-together apps (webcams on, professional vibe, potentially toxic chat)

### Core Philosophy
**"Those little avatar walks, emotes, and emojis mean a lot when most of the time you're studying alone. That little companionship makes a big difference."**

---

## Design Principles

### 1. Safety First
- No way for bad actors to intrude on the vibe
- No text chat (prevents harassment/toxicity)
- No webcams/voice (removes social pressure)
- Anonymous by default
- Users should feel **immediately safe**

### 2. Intimacy Through Simplicity
- A little avatar walking around means MORE than paragraphs in chat
- Small gestures > complex social features
- Tamagotchi-level simplicity, Sanrio-level warmth
- Non-verbal communication only

### 3. Presence Without Pressure
- Like studying in a café, but safer
- You see others, they see you, but no performance metrics
- No leaderboards, no streaks, no competition
- Just quiet companionship

### 4. Warm & Welcoming
- Copy should feel like a friend inviting you in
- Not corporate, not gamified, not intimidating
- Immediate comfort from the moment you land
- $10,000 SAAS-level polish in micro-interactions

---

## Tech Stack

**Frontend:**
- Next.js 16.0.1 (React 19.2.0)
- TypeScript 5.9.3
- Tailwind CSS 3.4.14 (heavy customization)
- Framer Motion 12.23.24 (animations)
- Zustand 5.0.8 (UI state management)
- Lucide React 0.552.0 (icons)

**Backend:**
- Supabase 2.78.0 (Realtime channels only, no database tables yet)
- Client-only architecture
- No authentication (guest-only for now)

**Key Patterns:**
- `useRef` for high-frequency updates (position, animation)
- Zustand for persisted UI preferences
- React state for UI-driven values
- RequestAnimationFrame loop for smooth movement
- Supabase Realtime for presence broadcasting

---

## Current State

### ✅ Working Features
- Real-time avatar presence (smooth interpolation, 120ms broadcast rate)
- Solo Pomodoro timer (25min focus, 5min break)
- Shared Pomodoro timer (synced across all users)
- Ambient audio player (lofi music, persistent state)
- Theme system (Twilight, Dawn, Night)
- Avatar customization (8 pastel colors)
- Interactive scene (click to move avatar)
- Accessibility (reduced motion, high contrast)

### 🚧 In Progress (Uncommitted Changes)
- `AvatarDrawer.tsx` - Color customization drawer
- `SettingsDrawer.tsx` - Theme, volume, session presets, accessibility
- `PlayerListModal.tsx` - "Study Companions" list showing who's online
- Enhanced `AmbientPlayer.tsx` with better controls
- Enhanced `AvatarSprite.tsx` with more animations
- Zustand integration in `page.tsx`
- Parallax effects
- Enhanced styling in `globals.css`

### ❌ Not Yet Built
- **Non-verbal communication** (emotes, reactions) - CRITICAL for MVP
- **Private rooms** (room codes for LDR/friends) - CRITICAL for MVP
- Session history/persistence
- User accounts/authentication
- Multiple room themes/environments

### 🔧 Technical Debt
- `page.tsx` is ~800 lines (needs refactoring into hooks)
- Magic numbers scattered (should be in constants)
- No TypeScript strict mode

---

## File Structure

```
cozylands_v0.1/
├── app/
│   ├── layout.tsx          # Root layout, fonts, metadata
│   ├── page.tsx            # Main app (800 lines - REFACTOR NEEDED)
│   └── globals.css         # Theme system, custom utilities
├── components/
│   ├── AvatarSprite.tsx    # Canvas-based pixel art rendering
│   ├── AmbientPlayer.tsx   # Lofi audio player
│   ├── PomodoroPanel.tsx   # Timer UI & controls
│   ├── WelcomeModal.tsx    # Onboarding (needs warmth)
│   ├── SharedAura.tsx      # Visual indicator for shared sessions
│   ├── AvatarDrawer.tsx    # [NEW] Color customization
│   ├── SettingsDrawer.tsx  # [NEW] Theme/volume/accessibility
│   └── PlayerListModal.tsx # [NEW] Online users list
├── lib/
│   ├── supabaseClient.ts   # Singleton client
│   ├── types.ts            # TypeScript interfaces
│   ├── utils.ts            # Color/name generation, lerp
│   ├── state/
│   │   └── uiStore.ts      # Zustand store (theme, settings)
│   └── ui/
│       ├── motion.ts       # Framer Motion presets
│       └── theme.ts        # Theme tokens
└── public/
    └── lofi.mp3            # Ambient audio file
```

---

## MVP Priorities (In Order)

### 1. Non-Verbal Communication ⭐ HIGHEST PRIORITY
**Why:** This is the core differentiator. "Those little emotes mean a lot."

**Features:**
- Click your avatar → emote menu (radial or dropdown)
- 5 emotes: wave, heart, coffee, sleepy, celebrate
- Animated icon above avatar for 3-4 seconds
- Real-time broadcast via Supabase
- Spring animations, particle effects for special emotes

### 2. Private Rooms ⭐ HIGH PRIORITY
**Why:** LDR couples and friends need a space that's just for them.

**Features:**
- "Create Private Room" button
- Generate shareable 6-character code (e.g., "COZY-MOON")
- Copy-to-clipboard with feedback
- Private rooms show only invited people
- Keep public lobby option

### 3. Warmer Onboarding
**Why:** First impression sets emotional tone.

**Changes:**
- Rewrite copy to be more friendly ("Hey there 💛" vs. "Welcome")
- Add animated character waving hello
- Reassuring microcopy ("No pressure, just focus together")
- Subtle music fade-in on welcome

### 4. Micro-Interaction Polish
**Why:** $10k SAAS apps have feedback for EVERY interaction.

**Examples:**
- Subtle notification when someone joins
- Avatar glow when someone starts focusing
- Gentle celebration when completing pomodoro
- Empty state messaging when alone
- Smooth hover states everywhere

### 5. Code Refactoring (Not User-Facing)
**Why:** Makes iteration 3x faster.

**Tasks:**
- Extract `useTimerSync` hook from page.tsx
- Extract `useAvatarPresence` hook
- Extract `useRoomChannel` hook
- Create `lib/constants.ts` for magic numbers
- Enable TypeScript strict mode

---

## Off-Limits (For Now)

### ❌ Don't Build Yet
- User accounts/authentication (wait until core flow feels perfect)
- Text chat (goes against safety philosophy)
- Leaderboards/streaks (too competitive, not cozy)
- Video/voice calls (too intimidating)
- Complex social features (friend lists, profiles, followers)
- Session history/analytics (adds pressure)

### ❌ Don't Touch
- Supabase auth setup (explicitly deferred)
- Database schema/migrations (no tables yet)

---

## Known Issues & Constraints

### Performance
- Timer can desync in shared mode (edge case)
- Avatar movement might feel janky on mobile (needs testing)

### UX Gaps
- No way to communicate without emotes (biggest gap)
- Can't study with specific people (need private rooms)
- Empty states aren't warm enough
- Onboarding feels neutral, not welcoming

### Technical Constraints
- Other AIs struggle to understand the codebase (architecture is complex)
- 800-line page.tsx makes changes slow
- No test coverage yet

---

## Aesthetic & Style Guide

### Visual Style
- **Glass morphism**: Semi-transparent panels, backdrop blur
- **Pastel palette**: 8 avatar colors, soft gradients
- **Soft shadows**: Multiple layered shadows for depth
- **Rounded corners**: 18px+ radius on major elements
- **Aurora effects**: Animated gradient overlays

### Animation Philosophy
- **Smooth, not flashy**: Cubic-bezier easing, spring physics
- **Gentle movements**: Subtle breathing animations, slow drifts
- **Meaningful transitions**: Every animation serves a purpose
- **Reduced motion support**: Respect user preferences

### Copy Tone
- **Friendly, not corporate**: "Hey there" vs. "Welcome"
- **Reassuring**: "No pressure" messaging
- **Minimal**: Don't over-explain
- **Warm**: Like a friend inviting you in

### Interaction Feedback
- **Every action has response**: Hover, click, complete
- **Audio optional**: Visual feedback first
- **Non-intrusive**: Notifications are gentle
- **Celebratory, not gamified**: Celebrate milestones without metrics

---

## How to Prompt Claude Efficiently

### ✅ Good Prompts
```
"Read .claude/project-context.md. Add emote system (see MVP priorities). Build the core mechanic first, I'll polish icons later."

"Read .claude/project-context.md. Refactor page.tsx by extracting the timer sync logic into a custom hook."

"Read .claude/project-context.md. The onboarding copy doesn't match our warm tone. Rewrite WelcomeModal to feel more inviting."
```

### ❌ Avoid
```
"Add emotes" (too vague, missing context)
"Make it better" (subjective, no direction)
"Fix the timer" (what's broken?)
```

### Template for Feature Requests
```
FEATURE: [name]
WHY IT MATTERS: [emotional goal from design principles]
WHAT TO BUILD: [specific requirements]
TECHNICAL APPROACH: [implementation details]
CONSTRAINTS: [what NOT to do, style requirements]
SCOPE: [MVP vs. future version]
```

---

## Success Metrics (For Later)

Not tracking these yet, but eventually:
- Time to first "felt connected" moment
- Private room usage vs. public lobby
- Average session duration (indicator of comfort)
- Emote usage patterns (which ones resonate)

**NOT tracking:**
- Productivity metrics (focus time, sessions completed)
- Competitive metrics (leaderboards, rankings)
- Social metrics (followers, friend counts)

---

## Questions to Ask When Adding Features

Before building anything new, ask:
1. **Does this increase safety or reduce it?**
2. **Does this add intimacy through simplicity, or complexity?**
3. **Does this create pressure or remove it?**
4. **Would this make a solo studier or LDR couple feel less lonely?**
5. **Could this be abused by bad actors?**

If the answers don't align with design principles, reconsider.

---

Last updated: 2025-01-01 (Initial creation)
