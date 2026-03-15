# ROAM Agent Board

Updated: 2026-03-15 (morning session)

---

## System Status: GREEN

- TypeScript: 0 errors
- Live URL: https://tryroam.netlify.app
- Open PRs: 14 (from overnight Cursor agents)
- All 6 tabs rendering
- All 37 destination images loading (200 OK)
- 10/11 APIs working (emergencynumberapi CORS fail on web only — fallback data covers it)

---

## PR Merge Priority

| Priority | PR | Title | Files | +/- | Action |
|----------|-----|-------|-------|-----|--------|
| P0 | #36 | Design audit violations | 12 | +648/-199 | REVIEW — code changes, high impact |
| P0 | #33 | German localization | 7 | +722/-0 | REVIEW — needed for DACH launch |
| P1 | #32 | App copy and store text | 1 | +423/-1 | REVIEW — copy improvements |
| P1 | #27 | Application health check | 1 | +55/-32 | MERGE — system health update |
| P1 | #24 | CAPTAIN | 1 | +33/-38 | MERGE — captain status update |
| P2 | #31 | Agent 14 UGC | 2 | +629/-0 | REVIEW — creator programs (docs only) |
| P2 | #29 | Investor narrative enhancement | 2 | +102/-39 | MERGE — narrative update |
| P2 | #26 | ROAM monetization model | 4 | +268/-0 | REVIEW — monetization docs |
| P2 | #25 | Gen Z growth audit | 1 | +92/-0 | MERGE — growth insights |
| P2 | #30 | GDPR DACH compliance | 1 | +249/-0 | REVIEW — compliance audit |
| P2 | #28 | DACH analytics specification | 1 | +393/-0 | MERGE — analytics spec |
| P3 | #35 | DACH travel micro-influencers | 1 | +469/-0 | MERGE — influencer list |
| P3 | #34 | Live app test matrix | 3 | +383/-0 | MERGE — test results |
| P3 | #23 | Destination image APIs | 1 | +126/-0 | MERGE — research doc |

---

## Agent Assignments (Current Sprint)

### 01 — ROAM Tester
**STATUS:** ASSIGNED
**TASK:** Run full 5-tier test matrix.
- Generate flow: Tokyo, Paris, Bali (verify itinerary renders completely)
- Auth flow end-to-end
- Offline mode graceful degradation
- Group trip flow (2+ travelers)
- All 6 tabs load without crash
**OUTPUT:** roam/test_results.md
**PRIORITY:** P0 — bugs get fixed immediately

### 03 — ROAM Design
**STATUS:** ASSIGNED
**TASK:** Audit every screen added in last 48 hours.
- Hunt: hardcoded hex, non-Lucide icons, missing loading states, AI slop copy
- Fix top 10 violations
- Open PR
**OUTPUT:** roam/design_audit.md
**PRIORITY:** P0

### 04 — ROAM Builder (Ideas — Opus)
**STATUS:** ASSIGNED
**TASK:** Priority stack:
1. Verify all 37 destination images loading from direct Unsplash URLs
2. Flights tab rework — hero search UI, popular routes, Skyscanner deep links
3. Stays tab rework — curated sections, Booking.com deep links
4. Food tab — wire enrich-venues edge function
**OUTPUT:** PRs to main
**PRIORITY:** P0

### 05 — ROAM Debugger
**STATUS:** ASSIGNED
**TASK:** Full system health check:
- Supabase edge function logs (last 24 hours)
- TypeScript: npx tsc --noEmit = 0
- Netlify build status
- Generate flow end-to-end
- Bundle size check
**OUTPUT:** roam/system_health.md (GREEN/YELLOW/RED)
**PRIORITY:** P0

### 06 — ROAM Growth
**STATUS:** ASSIGNED
**TASK:** Two deliverables:
1. Find 5 real DACH travel creators on TikTok — handle, followers, engagement, DM template
2. Write exact first TikTok post caption for ROAM launch in German
**OUTPUT:** roam/growth_dashboard.md
**PRIORITY:** P1

### 08 — ROAM Security
**STATUS:** ASSIGNED
**TASK:** GDPR compliance check for DACH launch.
- Cookie consent on tryroam.netlify.app
- All edge functions have JWT auth
- Data deletion capability
**OUTPUT:** roam/security_audit.md
**PRIORITY:** P1

### 11 — ROAM Content
**STATUS:** ASSIGNED
**TASK:** Audit every destination hook line in lib/constants.ts.
- Make every single one specific, evocative, non-generic
- "Explore the beauty of Tokyo" = BANNED
- Rewrite generate tab empty state — invitation not form
**OUTPUT:** roam/copy_library.md + PR
**PRIORITY:** P1

### 12 — ROAM Investor
**STATUS:** ASSIGNED
**TASK:** Update roam/weekly_memo.md with this week's progress:
- App live at tryroam.netlify.app
- 423 tests, 0 TS errors, 15 agents
- DACH strategy complete
- Write 30-second elevator pitch
**OUTPUT:** roam/investor_narrative.md
**PRIORITY:** P2

### 13 — ROAM DACH Growth
**STATUS:** ASSIGNED — URGENT
**TASK:** Find 20 German-speaking travel micro-influencers.
- Search: #reisetipps #fernweh #interrail #staedtetrip #digitalnomad
- For each: handle, followers, engagement, contact method, cost estimate
**OUTPUT:** roam/dach_influencers.md
**PRIORITY:** P1

### 14 — ROAM UGC Engine
**STATUS:** ASSIGNED
**TASK:** Write 3 complete creator briefs in German.
- Destinations: Tokyo, Bali, Barcelona
- Each: exact script, b-roll shots, on-screen text, CTA, hashtags
**OUTPUT:** roam/dach_scripts.md
**PRIORITY:** P1

---

## Blocked on Quinn

| Item | Action Required | Priority |
|------|----------------|----------|
| Booking.com AID | Sign up at partners.booking.com — replace placeholder 'roam' in booking-links.ts | P1 |
| ADMIN_TEST_EMAILS | Add qbyars08@gmail.com to Supabase edge function secrets | P1 |
| RevenueCat products | Create Pro subscription in RC dashboard | P2 |
| Amadeus cleanup | Remove AMADEUS_KEY + AMADEUS_SECRET from Supabase Dashboard | P3 |
| PostHog project key | Verify key is set in environment | P2 |
| PR reviews | 14 open PRs need review/merge (see priority table above) | P0 |

---

## Orchestrator Direct Work (This Session)

- [x] git pull origin main
- [x] npm install
- [x] npx tsc --noEmit = 0 errors
- [x] Check open PRs — 14 listed with merge priority
- [ ] Booking.com affiliate link verification
- [ ] Generate flow hardening (Tokyo/Paris/Bali)
- [ ] Performance check (bundle size)
- [ ] Waitlist form verification
- [ ] Parent demo prep
- [ ] Final deploy to Netlify
- [ ] captain_status.md update
