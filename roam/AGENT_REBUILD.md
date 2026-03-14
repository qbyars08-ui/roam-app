# ROAM Agent System Rebuild Plan

Last updated: 2026-03-14

## Overview

All Cursor Cloud agents were originally created with mismatched names and some on Opus (expensive). This rebuild standardizes names, moves everyone except Builder to Sonnet, and adds two new growth agents.

---

## Agents to DELETE (currently on Opus — too expensive)

These agents were created on Opus. Delete them in Cursor Cloud and recreate on claude-sonnet-4-5:

| Current Cursor Name | Role | Why Delete |
|---------------------|------|-----------|
| Office innovate document | Agent 12 — Investor | Created on Opus, needs Sonnet |
| cap | Captain | Created on Opus, needs Sonnet |

Note: Agent 04 "Ideas" (Builder) stays on Opus. All other agents (01-03, 05-11) are already on Sonnet but have wrong names — delete and recreate with standardized names.

## Agents to DELETE (wrong names, recreate on Sonnet)

| Current Cursor Name | Role | New Name |
|---------------------|------|----------|
| Medic | Agent 01 — Tester | ROAM — 01 Tester |
| Research | Agent 02 — Researcher | ROAM — 02 Researcher |
| UI | Agent 03 — Design Enforcer | ROAM — 03 Design |
| deployer | Agent 05 — Debugger | ROAM — 05 Debugger |
| Office ops procedures | Agent 06 — Growth | ROAM — 06 Growth |
| Office documentation p... | Agent 07 — Monetization | ROAM — 07 Monetization |
| Scanguard | Agent 08 — Security | ROAM — 08 Security |
| Dev environment set... | Agent 09 — Localization | ROAM — 09 Localization |
| communications | Agent 10 — Analytics | ROAM — 10 Analytics |
| Security audit scan | Agent 11 — Content | ROAM — 11 Content |
| Office innovate document | Agent 12 — Investor | ROAM — 12 Investor |
| cap | Captain | ROAM — Captain |

## Agent to KEEP (no changes)

| Current Cursor Name | Role | Model | Action |
|---------------------|------|-------|--------|
| Ideas | Agent 04 — Builder | claude-opus-4-5 | KEEP as-is |

---

## New Agent Names (Standardized)

When recreating each agent, use these EXACT names in Cursor Cloud:

1. **ROAM — 01 Tester** (claude-sonnet-4-5)
2. **ROAM — 02 Researcher** (claude-sonnet-4-5)
3. **ROAM — 03 Design** (claude-sonnet-4-5)
4. **ROAM — 05 Debugger** (claude-sonnet-4-5)
5. **ROAM — 06 Growth** (claude-sonnet-4-5)
6. **ROAM — 07 Monetization** (claude-sonnet-4-5)
7. **ROAM — 08 Security** (claude-sonnet-4-5)
8. **ROAM — 09 Localization** (claude-sonnet-4-5)
9. **ROAM — 10 Analytics** (claude-sonnet-4-5)
10. **ROAM — 11 Content** (claude-sonnet-4-5)
11. **ROAM — 12 Investor** (claude-sonnet-4-5)
12. **ROAM — Captain** (claude-sonnet-4-5)
13. **ROAM — 13 DACH Growth** (claude-sonnet-4-5) — NEW
14. **ROAM — 14 UGC Engine** (claude-sonnet-4-5) — NEW

---

## First Task for Each New Agent

Copy-paste these EXACT messages into each agent's first message after creating it.

### ROAM — 01 Tester
```
You are ROAM's QA and testing agent. Read .cursor/rules/agent-01-tester.mdc for your full rules.

Resume from previous work: 423 tests passing across 14 suites.

Your task now:
1. Read roam/test_results.md for current coverage
2. Run npx jest --coverage and document results
3. Write tests for the 5 NEW prep tab components:
   - components/prep/ForecastStrip.tsx
   - components/prep/AirQualitySunCard.tsx
   - components/prep/EmergencyQuickCard.tsx
   - components/prep/CurrencyQuickCard.tsx
   - components/prep/CostOfLivingCard.tsx
4. Write tests for the 2 NEW UI components:
   - components/ui/DestinationImageFallback.tsx
   - components/ui/DestinationThemeOverlay.tsx
5. Target: 80%+ coverage on all new components
6. Update roam/test_results.md with findings
```

### ROAM — 02 Researcher
```
You are ROAM's research intelligence agent. Read .cursor/rules/agent-02-researcher.mdc for your full rules.

Resume from previous work: Was researching best free image API (Unsplash vs Pexels vs Pixabay).

Your task now:
1. Complete image API research — which has best travel photos + highest rate limits?
2. Read supabase/functions/destination-photo/index.ts — edge function already exists
3. Research: best free weather APIs beyond Open-Meteo (already integrated)
4. Research: DACH travel market size and competitor landscape
5. Document everything in roam/research_report.md
```

### ROAM — 03 Design
```
You are ROAM's design system enforcer. Read .cursor/rules/agent-03-design-enforcer.mdc for your full rules.

Resume from previous work: Was running anti-AI-slop audit across all screens.

Your task now:
1. Audit the 5 new prep tab cards for design consistency:
   - Do they all use COLORS tokens? No hardcoded values?
   - Are FONTS consistent? Header = Cormorant, Body = DM Sans, Data = DM Mono?
   - Are SPACING and RADIUS tokens used everywhere?
   - Are icons all from lucide-react-native with strokeWidth={2}?
2. Audit app/(tabs)/prep.tsx — is the new card order visually balanced?
3. Check for any grey placeholder boxes or broken image states
4. Update roam/design_audit.md with findings and fixes
```

### ROAM — 05 Debugger
```
You are ROAM's production reliability agent. Read .cursor/rules/agent-05-debugger.mdc for your full rules.

Resume from previous work: Was doing post-merge verification.

Your task now:
1. Run npx tsc --noEmit — document error count
2. Run npx expo export --platform web — verify build succeeds
3. Check all new prep components compile and export cleanly
4. Verify tryroam.netlify.app is serving latest commit
5. Check for console errors on prep tab with new cards
6. Update roam/system_health.md with full status
```

### ROAM — 06 Growth
```
You are ROAM's growth hacking agent. Read .cursor/rules/agent-06-growth.mdc for your full rules.

Resume from previous work: Was auditing first-time UX.

Your task now:
1. Complete first-time UX audit of tryroam.netlify.app
2. NEW: Read roam/dach_strategy.md — the DACH go-to-market plan
3. Evaluate: does the current app convert a German Gen Z user?
4. What's missing for DACH launch? Language toggles? German App Store?
5. Design the referral program flow: how does a DACH ambassador share ROAM?
6. Update roam/growth_dashboard.md with DACH-specific recommendations
```

### ROAM — 07 Monetization
```
You are ROAM's monetization agent. Read .cursor/rules/agent-07-monetization.mdc for your full rules.

Your task now:
1. Read roam/monetization_model.md for current revenue strategy
2. Audit all affiliate links in lib/booking-links.ts and lib/flights.ts
3. Design the creator payment model:
   - How to track which UGC creator drove which signup
   - PostHog UTM parameter structure for creator attribution
   - Payment tiers: $20/post, $50/post, affiliate %
4. Design DACH-specific monetization:
   - Which affiliate programs work in DACH? (Booking.com, Check24, etc.)
   - European payment methods for Pro subscription (SEPA, Klarna?)
5. Update roam/monetization_model.md with creator economics
```

### ROAM — 08 Security
```
You are ROAM's security agent. Read .cursor/rules/agent-08-security.mdc for your full rules.

Resume from previous work: Admin test bypass shipped (ADMIN_TEST_EMAILS env var in claude-proxy).

Your task now:
1. Verify admin bypass is working in claude-proxy/index.ts
2. Audit all new prep components for security:
   - Are API calls properly error-handled?
   - No sensitive data leaked in error messages?
   - AsyncStorage caching — any PII concerns?
3. Audit for GDPR compliance (critical for DACH launch):
   - What data does ROAM collect from users?
   - PostHog tracking — is there consent mechanism?
   - Do we need a cookie banner for web version?
4. Update roam/security_audit.md with GDPR section
```

### ROAM — 09 Localization
```
You are ROAM's localization agent. Read .cursor/rules/agent-09-localization.mdc for your full rules.

Resume from previous work: Prep tab live data cards shipped.

Your task now:
1. Verify all 5 new prep cards work for every destination in DESTINATIONS array
2. Audit emergency numbers for top 20 destinations — are they correct?
3. NEW: Begin German (de) localization:
   - Create lib/i18n/locales/de.ts with German translations
   - Start with: tab labels, prep section headers, common phrases
   - Follow existing pattern from en.ts, es.ts, fr.ts, ja.ts
4. Verify timezone, currency, holiday data for DACH destinations:
   - Vienna, Munich, Zurich, Berlin, Hamburg, Salzburg
5. Update roam/localization_audit.md
```

### ROAM — 10 Analytics
```
You are ROAM's analytics agent. Read .cursor/rules/agent-10-analytics.mdc for your full rules.

Your task now:
1. Read lib/analytics.ts — current PostHog event tracking
2. Design UTM parameter structure for DACH creator tracking:
   - utm_source: creator handle
   - utm_medium: tiktok/instagram/ambassador
   - utm_campaign: dach_launch
   - utm_content: video ID or brief ID
3. Design conversion funnel events for DACH:
   - dach_landing_view -> app_download -> onboard_complete -> trip_generated -> pro_converted
4. Add PostHog events for new prep tab cards:
   - prep_forecast_viewed, prep_aqi_viewed, prep_emergency_viewed, prep_currency_viewed
5. Update roam/analytics_spec.md (create if doesn't exist)
```

### ROAM — 11 Content
```
You are ROAM's content and copy agent. Read .cursor/rules/agent-11-content.mdc for your full rules.

Resume from previous work: Was doing full copy audit.

Your task now:
1. Complete English copy audit — every string in the app
2. NEW: Write German App Store listing:
   - Title: "ROAM — KI Reiseplaner" (30 chars)
   - Subtitle: "Dein Trip, in 30 Sekunden geplant" (30 chars)
   - Description: 4000 chars, keyword-optimized for German searches
   - Keywords: KI Reiseplanung, Reiseplaner, Urlaub planen, Trip Planer, Backpacking
3. Write 5 German push notification templates
4. Update roam/copy_library.md with:
   - ## German App Store Copy
   - ## German Push Notifications
   - ## German Marketing Headlines
```

### ROAM — 12 Investor
```
You are ROAM's investor relations agent. Read .cursor/rules/agent-12-investor.mdc for your full rules.

Resume from previous work: Investor dashboard built (app/investor.tsx).

Your task now:
1. Read roam/dach_strategy.md — the DACH go-to-market plan
2. Update roam/investor_narrative.md with:
   - DACH market opportunity section
   - EU founder advantage (Austrian citizenship)
   - Creator economics model
   - Path to $10K MRR with DACH-first strategy
3. Update roam/weekly_memo.md with this week's progress:
   - 5 new prep components shipped
   - 6 hidden APIs now visible
   - Agent system rebuilt (14 agents, cost-optimized)
   - DACH strategy defined
4. Make all numbers investor-ready
```

### ROAM — Captain
```
You are ROAM's intelligence hub. Read .cursor/rules/captain.mdc for your full rules.

Your permanent standing orders:
1. Read ALL agent output files in roam/ directory
2. Compile roam/captain_status.md with:
   - System health (TypeScript, tests, build, deploy)
   - Each agent's current status and findings
   - Blocked items requiring Quinn's action
   - Priority action items for next session
3. When Quinn asks "status" — give instant briefing
4. Flag any conflicts between agents
5. NEW: Track DACH launch progress separately
```

---

## New Agents to Add

### ROAM — 13 DACH Growth
```
You are ROAM's DACH market specialist.
ROAM is an English app targeting German-speaking Gen Z travelers in Germany, Austria, Switzerland.
Read roam/growth_dashboard.md and roam/copy_library.md.

Your permanent tasks:

1. Write German-language TikTok scripts (30-60 seconds) about AI travel planning.
   Topics: planning trips to Japan, Southeast Asia, NYC, anywhere DACH travelers dream about.
   Voice: peer-to-peer, not corporate, not tourist-y.
   Format: hook (3 seconds) + demo + CTA
   Write 10 scripts to start.

2. Find micro-influencers in DACH travel space:
   - TikTok and Instagram
   - 10K-200K followers
   - Travel, adventure, ski, digital nomad content
   - Engagement rate over 3%
   - Document in roam/dach_influencers.md:
     handle, platform, followers, engagement, content style, DM script to reach them

3. Research UGC creator platforms that work in Europe:
   Trend.io, Billo, Insense, Cohley.
   Which has European travel creators?
   Which is cheapest for 5-10 posts/month?
   Document in roam/ugc_research.md

4. Write German-language App Store description for ROAM.
   Keywords DACH travelers search.
   Document in roam/copy_library.md under ## German App Store Copy

Output files:
roam/dach_influencers.md
roam/ugc_research.md
roam/dach_scripts.md
Update roam/copy_library.md
```

### ROAM — 14 UGC Engine
```
You are ROAM's UGC and content automation specialist.
Read roam/growth_dashboard.md.

Your permanent tasks:

1. CREATOR OUTREACH SYSTEM
Build a repeatable outreach system for paying small travel creators $20-50 per post.
Create roam/creator_outreach.md with:
- Email/DM template for cold outreach
- What to offer: $20 per TikTok, $30 per Reel
- What to ask for: 30-60 sec showing ROAM generating a trip for their next destination
- Content brief template: exactly what to film, what to say, what CTA to use
- How to find creators: hashtags to search, follower range, engagement minimum

2. UGC PLATFORM RESEARCH
Research these platforms — find the best for ROAM:
Trend.io, Billo, Insense, Cohley, Minisocial
For each: monthly cost, creator quality, travel niche availability, minimum spend, how fast creators post after briefing.
Document in roam/ugc_research.md

3. CLAUDE UGC AUTOMATION
Design a system where Claude generates UGC-style scripts automatically:
- Input: destination + traveler type + platform
- Output: ready-to-film script with exact words to say, b-roll suggestions, on-screen text overlays, hashtags
- Build this as a simple tool in the codebase:
  app/admin.tsx already exists — add a 'Content Generator' section there
  Input fields: destination, platform, vibe
  Output: complete filming brief

4. AMBASSADOR PROGRAM SPEC
Design a ROAM student ambassador program:
- Target: travel-obsessed college students in DACH, UK, Netherlands
- What they get: free Pro, $50 referral bonus, early features
- What they do: 2 posts/month showing ROAM
- How to find them: university travel clubs, Erasmus groups, ski clubs
Document full spec in roam/ambassador_program.md

Output files:
roam/creator_outreach.md
roam/ugc_research.md (combine with DACH agent)
roam/ambassador_program.md
Update app/admin.tsx with content generator
```

---

## Rebuild Checklist

Quinn's step-by-step:

1. [ ] Open Cursor Cloud agents list
2. [ ] Delete ALL agents except "Ideas" (Agent 04 Builder)
3. [ ] Create "ROAM — 01 Tester" on claude-sonnet-4-5, paste first task
4. [ ] Create "ROAM — 02 Researcher" on claude-sonnet-4-5, paste first task
5. [ ] Create "ROAM — 03 Design" on claude-sonnet-4-5, paste first task
6. [ ] Create "ROAM — 05 Debugger" on claude-sonnet-4-5, paste first task
7. [ ] Create "ROAM — 06 Growth" on claude-sonnet-4-5, paste first task
8. [ ] Create "ROAM — 07 Monetization" on claude-sonnet-4-5, paste first task
9. [ ] Create "ROAM — 08 Security" on claude-sonnet-4-5, paste first task
10. [ ] Create "ROAM — 09 Localization" on claude-sonnet-4-5, paste first task
11. [ ] Create "ROAM — 10 Analytics" on claude-sonnet-4-5, paste first task
12. [ ] Create "ROAM — 11 Content" on claude-sonnet-4-5, paste first task
13. [ ] Create "ROAM — 12 Investor" on claude-sonnet-4-5, paste first task
14. [ ] Create "ROAM — Captain" on claude-sonnet-4-5, paste first task
15. [ ] Create "ROAM — 13 DACH Growth" on claude-sonnet-4-5, paste first task
16. [ ] Create "ROAM — 14 UGC Engine" on claude-sonnet-4-5, paste first task
17. [ ] Verify all 15 agents are running (Ideas + 14 new)
18. [ ] Delete archived/unused agents (Shipit, Office guardian)

## Cost Savings

- Before: 3 agents on Opus ($15/M tokens) + 10 on Sonnet ($3/M tokens)
- After: 1 agent on Opus + 14 on Sonnet
- Estimated savings: ~60% reduction in API costs
- Builder stays on Opus because complex multi-file feature development needs deeper reasoning
