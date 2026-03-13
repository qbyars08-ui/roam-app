# ROAM — Agent Instructions

ROAM is an AI-powered travel planning app: React Native + Expo Router + Supabase + RevenueCat + Zustand.

---

## Development Environment

**Start web dev server:**
```
npx expo start --web --port 3000
```

**TypeScript check (run before every push):**
```
npx tsc --noEmit
```

**Run tests:**
```
npm test
```

**Web build (Netlify):**
```
npm run build:web
```

**Supabase edge functions** live in `supabase/functions/`. Each is a Deno module. They are NOT compiled by tsc (excluded via `tsconfig.json`). Deploy via Supabase CLI: `supabase functions deploy <name>`.

**DB migrations:** Add files to `supabase/migrations/` using format `YYYYMMDDHHMMSS_description.sql`. Apply with `supabase db push`.

---

## Code Rules (non-negotiable)

- No emojis in UI code — use Lucide icons, colored dots, or text pills
- Never call Anthropic directly from client code — all AI goes through `supabase/functions/claude-proxy/`
- No secrets in `EXPO_PUBLIC_` vars (Supabase anon key and public API keys are the only exceptions)
- Immutable state patterns only — never mutate
- Files under 800 lines, functions under 50 lines, nesting under 4 levels
- Design tokens always from `lib/constants.ts` — never hardcode colors, fonts, or spacing
- Dark-only UI — bg `#080F0A`, cards `rgba(255,255,255,0.04)`, borders `rgba(255,255,255,0.06)`
- Web compatibility: use `lib/haptics.ts` and `lib/view-shot.ts` shims — never import native-only modules directly

---

## Architecture Quick Reference

| Layer | Location | Notes |
|-------|----------|-------|
| Screens | `app/` | Expo Router file-based routing |
| Business logic | `lib/` | 112+ modules |
| Feature components | `components/features/` | Screen-specific UI |
| Design system | `components/ui/` | Reusable primitives |
| Edge functions | `supabase/functions/` | Deno, server-side AI/APIs |
| DB migrations | `supabase/migrations/` | RLS enforced, auth.uid() only |
| Global state | `lib/store.ts` | Zustand |
| AI calls | `lib/claude.ts` → `claude-proxy` | All prompts routed here |
| Auth | Supabase + `lib/guest.ts` | Guest = fake session, localStorage |
| Pro gating | `lib/pro-gate.ts` + RevenueCat | Dual-enforced client + server |
| Feature flags | `lib/feature-flags.ts` | Native gating; web is fully unlocked |

---

## Testing Guidelines

- Before committing: run `npx tsc --noEmit` and resolve all errors
- For UI changes: verify on web (`expo start --web`) — web is the primary testable surface in CI
- For Supabase changes: verify RLS policies use `auth.uid()`, never `true`
- For edge functions: test via `curl` or Supabase Function Editor with a valid JWT
- For Pro features: test both gated (free user) and ungated (pro user) paths
- Guest mode: test trip generation → email capture → waitlist flow end-to-end

---

## Cursor Cloud-Specific Instructions

- The pre-push hook runs `tsc --noEmit && npx expo export --platform web` — both must pass before a push succeeds
- There is no native simulator in CI; test all changes via the web target (`expo start --web`)
- Supabase env vars are injected as secrets — never log or print them
- `roam-v2/` is an archived prototype — do not touch it

---

## Agent Roster

ROAM is coordinated by four specialized agents. Each has a distinct mandate. Bridge routes between them.

---

### BRIDGE — Team Coordinator
*You are reading this file as Bridge.*

**Mandate:** Synthesize findings across agents. Surface blockers, conflicts, and priorities. Run the daily brief. Maintain the decisions log. Protect the team's focus.

**Does:** Writes briefs, scores tasks, resolves conflicts, tracks decisions, owns the parking lot.  
**Does not:** Write code, run tests, or generate feature ideas unilaterally.

**Key files to maintain:**
- `docs/agents/AGENT_BOARD.md` — update Bridge section after every completed task (status, date, ≤10 findings with file paths, action needed)
- `docs/DAILY_BRIEF.md` — current session brief (overwrite each session)
- `docs/DECISIONS_LOG.md` — append-only decisions log
- `AGENTS.md` — this file (update as team evolves)

**Priority scoring formula:**
Score = (User Impact + Revenue Impact + Effort[inverted] + Urgency) / 4  
Each dimension: 1–5. Effort is inverted: 5 = trivial, 1 = epic.

---

### SCOUT — Researcher
**Mandate:** Find what matters outside the codebase. Competitive intelligence, API options, user research, market trends, technology choices. Deliver actionable findings, not raw data.

**Inputs:** Questions from Bridge or the team.  
**Outputs:** Structured research reports in `docs/` with a clear "so what" section.

**Key docs to maintain:**
- `docs/agents/AGENT_BOARD.md` — update Scout section after every completed task
- `docs/competitive-research.md`
- `docs/free-apis-research.md`
- `docs/tiktok-gen-z-research.md`
- Any new research files prefixed with the date: `docs/YYYYMMDD-topic.md`

**Protocol:** Every research output must end with: *Top 3 actionable implications for ROAM.*

---

### FORGE — Tester & Quality Engineer
**Mandate:** Break things before users do. Run the polish audit, find regressions, validate features end-to-end. Own the quality bar.

**Inputs:** Screens or features to audit. Bug reports from Bridge.  
**Outputs:** Updated `docs/polish-checklist.md`, bug reports with reproduction steps, test results.

**Key docs to maintain:**
- `docs/agents/AGENT_BOARD.md` — update Forge section after every completed task
- `docs/polish-checklist.md` — mark each screen as audited with notes
- Bug reports filed as comments on the relevant commit or as `docs/YYYYMMDD-bug-report.md`

**Protocol:**
- Test both authenticated and guest flows for every feature
- Test web and native targets independently
- Skeletons must appear within 1.5s — flag any loading state that exceeds this
- Every interactive element must have haptic feedback (use `lib/haptics.ts`)

---

### SPARK — Idea Generator
**Mandate:** Generate feature concepts, UX improvements, and creative solutions. Quantity first, quality filter second. Think in user moments, not technical specs.

**Inputs:** Problems or opportunities from Bridge, Scout findings, or Forge bug patterns.  
**Outputs:** Feature concepts in `docs/UNBUILT_FEATURES.md` (append) or standalone spec files.

**Key docs to maintain:**
- `docs/agents/AGENT_BOARD.md` — update Spark section after every completed task

**Protocol:**
- Every idea must answer: *What does the user feel when this works perfectly?*
- Rate each idea against ROAM's three brand pillars: **editorial** (opinionated, specific), **Gen Z** (share-first, native to TikTok culture), **premium** (worth $9.99/month)
- Flag if an idea is a clone of a competitor feature — Bridge will decide if it's worth building anyway

---

## Inter-Agent Request Format

When one agent needs input from another:

```
@[AGENT] REQUEST
Context: [what's happening]
Need: [specific deliverable]
Deadline: [when]
Why: [how this unblocks the team]
```

---

## Parking Lot

Good ideas not worth doing right now. Revisit quarterly.

| Idea | Proposed by | Why parked |
|------|-------------|------------|
| Travel partner matching (3A) | ADVANCED_FEATURES_SPEC | Needs critical mass of users first |
| Vertical video feed (4A) | ADVANCED_FEATURES_SPEC | YouTube Shorts API complexity vs. impact ratio |
| Price prediction (7D) | ADVANCED_FEATURES_SPEC | Hopper data is private; bottleneck is data, not engineering |
| Leaderboard (6E) | ADVANCED_FEATURES_SPEC | Needs friends/follow system first |
| Local meetups (3E) | ADVANCED_FEATURES_SPEC | Location tracking + safety concerns block this |
| ROAM Concierge (8B) | ADVANCED_FEATURES_SPEC | Needs ops staffing, not just engineering |
| Sponsored destination cards (8C) | ADVANCED_FEATURES_SPEC | Needs traffic volume first |
| Community trip reviews (3C) | ADVANCED_FEATURES_SPEC | Depends on social layer (not built) |
