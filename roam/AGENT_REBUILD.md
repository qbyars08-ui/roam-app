# ROAM Agent System Rebuild — Step-by-Step

Last updated: 2026-03-15

Quinn: Follow this in order. Should take 15 minutes.

---

## STEP 1: DELETE OLD AGENTS

Open Cursor sidebar. Delete each of these (they have wrong names, some on Opus):

- [ ] Medic
- [ ] Scanguard
- [ ] UI
- [ ] Research
- [ ] deployer
- [ ] Office ops procedures
- [ ] Office documentation p...
- [ ] Dev environment set...
- [ ] communications
- [ ] Security audit scan
- [ ] Office innovate document
- [ ] cap
- [ ] Shipit document guid...
- [ ] Office guardian documentation

**DO NOT DELETE "Ideas"** — that's Agent 04 Builder on Opus. Keep it.

---

## STEP 2: CREATE NEW AGENTS ON SONNET

For each agent below:
1. Click "+" in Cursor sidebar
2. Name it exactly as shown
3. Select **claude-sonnet-4-5** as the model
4. Paste the FIRST MESSAGE shown below
5. Hit send — let it start working

---

### ROAM — 01 Tester
**Model:** claude-sonnet-4-5

**FIRST MESSAGE:**
```
You are ROAM's QA agent. Read .cursor/rules/agent-01-tester.mdc for your full instructions.

Your job right now: Run the 5-tier test matrix against the live app.

Tier 1 (Smoke): Verify app boots, all 6 tab screens render, auth flow works.
Tier 2 (Core Flow): Generate a trip for Tokyo — verify the itinerary renders with valid data.
Tier 3 (Edge Cases): Test 0-day trip rejected, special characters in destination, empty API response.

Run `npx tsc --noEmit` first. Must be 0 errors.

Test with these 10 destinations: Tokyo, Marrakech, Buenos Aires, Reykjavik, Bali, Cape Town, Oaxaca, Tbilisi, Queenstown, Seoul.

Write results to roam/test_results.md with date, pass/fail counts, and details for each failure.
```

---

### ROAM — 02 Researcher
**Model:** claude-sonnet-4-5

**FIRST MESSAGE:**
```
You are ROAM's intelligence agent. Read .cursor/rules/agent-02-researcher.mdc for your full instructions.

Your job right now: Image API recommendation.

Read supabase/functions/destination-photo/index.ts — it uses Google Places API (requires paid GOOGLE_PLACES_KEY).

We've added direct Unsplash URLs to all 37 destinations in lib/constants.ts as a stopgap. But we need a long-term solution for user-generated destinations (when someone types a custom city).

Evaluate these options:
1. Keep Google Places (paid, high quality, already built)
2. Unsplash API (50 req/hr free, good travel photos)
3. Pexels API (200 req/hr free, good travel content)
4. Pixabay API (unlimited free, lower quality)

Write your recommendation to roam/research_report.md with: API choice, rate limits, implementation plan, cost comparison, and migration path.
```

---

### ROAM — 03 Design
**Model:** claude-sonnet-4-5

**FIRST MESSAGE:**
```
You are ROAM's design enforcer. Read .cursor/rules/agent-03-design-enforcer.mdc for your full instructions.

Your previous work: design_audit.md has 299 lines of findings. Two PRs merged. 22 alpha sweep fixes.

Continue the anti-AI-slop audit. Focus on:
1. Flights tab — needs full visual rework, static skeleton loading states
2. Stays tab — needs curated sections, remove broken elements
3. Generate empty state — should feel conversational, not form-like
4. Any remaining hardcoded hex colors (search for rgba, #)
5. Any non-Lucide icon imports

Fix top 20 remaining violations. Open a PR. Update roam/design_audit.md.

Design system reference: lib/constants.ts — COLORS, FONTS, SPACING, RADIUS. Dark-only UI. Cormorant Garamond Bold headers, DM Sans body, DM Mono data.
```

---

### ROAM — 05 Debugger
**Model:** claude-sonnet-4-5

**FIRST MESSAGE:**
```
You are ROAM's reliability agent. Read .cursor/rules/agent-05-debugger.mdc for your full instructions.

Your job right now: Post-merge verification.

1. Run `npx tsc --noEmit` — must be 0 errors
2. Verify all destination images load on discover tab (all 37 destinations now have direct Unsplash URLs in constants.ts — no more source.unsplash.com dependency)
3. Check these specifically: Tokyo, Paris, Bali, NYC, Barcelona, Rome, London, Bangkok, Lisbon, Seoul
4. Verify flights, stays, food tabs load without crashes
5. Check console for errors (ignore RN web collapsable deprecation warnings)
6. Verify prep tab loads: safety score, "Right now" card, forecast strip, emergency numbers, currency converter

Update roam/system_health.md with your findings.
```

---

### ROAM — 06 Growth
**Model:** claude-sonnet-4-5

**FIRST MESSAGE:**
```
You are ROAM's growth engine. Read .cursor/rules/agent-06-growth.mdc for your full instructions.

Your previous work: growth_dashboard.md has ASO keywords, TikTok concepts, A/B tests, waitlist referral system.

Your job right now: First-time UX audit of tryroam.netlify.app.

Open it as a brand new Gen Z user (18-24, uses TikTok for travel inspo). Answer:
- Does the discover tab communicate value in 3 seconds?
- Do the destination cards make you want to tap?
- Does the generate empty state guide you or confuse you?
- Is the share moment obvious after generating a trip?
- What would make a user screenshot this and post it?
- Is the onboarding flow clear for a first-time user?

Write 10 actionable recommendations to roam/growth_dashboard.md. Focus on what makes someone share this app with friends.
```

---

### ROAM — 07 Monetization
**Model:** claude-sonnet-4-5

**FIRST MESSAGE:**
```
You are ROAM's monetization agent. Read .cursor/rules/agent-07-monetization.mdc for your full instructions.

Your job right now: Creator payment model for DACH UGC campaign.

Read roam/dach_strategy.md for the go-to-market plan.

Design a 3-tier creator payment model:
1. Barter tier: Free Pro account + feature on website. For first 5 creators.
2. Micro-payment tier: $20-50/video + 10% revenue share on signups from their UTM link.
3. Partner tier: $200-500/video + 15% revenue share + co-marketing.

Also verify: are Skyscanner affiliate links generating click events in PostHog? Check lib/flights.ts and lib/affiliate-tracking.ts.

Write to roam/monetization_model.md.
```

---

### ROAM — 08 Security
**Model:** claude-sonnet-4-5

**FIRST MESSAGE:**
```
You are ROAM's security agent. Read .cursor/rules/agent-08-security.mdc for your full instructions.

Status update: Admin bypass is ALREADY IMPLEMENTED in supabase/functions/claude-proxy/index.ts. It reads ADMIN_TEST_EMAILS env var and skips rate limit for matching emails. Quinn needs to add the secret to Supabase manually.

Your job right now: GDPR compliance audit for DACH launch.

Check:
1. What personal data does ROAM collect? (auth emails, trip data, analytics events)
2. Is there a data deletion mechanism? (Supabase has RLS — verify user can delete their data)
3. Cookie consent for web version (tryroam.netlify.app)
4. Privacy policy needed before German App Store submission
5. PostHog GDPR compliance (EU data residency?)
6. Any data sent to third parties? (Anthropic API, Unsplash, Open-Meteo — document each)

Write findings to roam/security_audit.md with severity ratings and action items.
```

---

### ROAM — 09 Localization
**Model:** claude-sonnet-4-5

**FIRST MESSAGE:**
```
You are ROAM's localization agent. Read .cursor/rules/agent-09-localization.mdc for your full instructions.

Your job right now: German localization for DACH launch.

1. Create lib/i18n/locales/de.ts — translate all keys from lib/i18n/locales/en.ts to German. Use native Gen Z German, not formal/corporate translation.
2. Verify emergency numbers for these DACH-relevant destinations: Vienna, Munich, Zurich, Berlin, Budapest, Prague, Amsterdam, Barcelona (all popular DACH weekend trips).
3. Check lib/prep/emergency-data.ts has correct data for DE, AT, CH country codes.
4. Verify prep tab shows correct currency (EUR for DE/AT, CHF for CH).

Write findings to roam/localization_audit.md.
```

---

### ROAM — 10 Analytics
**Model:** claude-sonnet-4-5

**FIRST MESSAGE:**
```
You are ROAM's analytics agent. Read .cursor/rules/agent-10-analytics.mdc for your full instructions.

Your job right now: DACH analytics + UTM tracking.

1. Design UTM schema for DACH creator links:
   - utm_source=tiktok|instagram|youtube
   - utm_medium=ugc|organic|paid
   - utm_campaign=dach_launch
   - utm_content=script_01 through script_10

2. Verify PostHog captures these events: app_open, generate_started, generate_completed, generate_failed, paywall_seen, subscription_started, referral_sent

3. Check lib/analytics.ts and lib/posthog.ts — document the full event taxonomy

4. Design a DACH-specific funnel: Creator video view → App visit → Signup → First trip generated → Pro conversion

Write to roam/analytics_spec.md.
```

---

### ROAM — 11 Content
**Model:** claude-sonnet-4-5

**FIRST MESSAGE:**
```
You are ROAM's content agent. Read .cursor/rules/agent-11-content.mdc for your full instructions.

Your previous work: copy_library.md has 282 lines — full waitlist funnel, 5-email sequence, voice rules.

Your job right now: Full in-app copy audit.

Rules:
- Keep "Travel like you know someone there" — it's the brand line
- Every destination hook in lib/constants.ts must be specific, not generic
- Generate empty state should feel like an invitation, not a form
- All error messages: human, specific, actionable (no "Something went wrong")
- Zero AI-sounding copy ("unlock", "seamless", "elevate", "curate")
- Zero exclamation marks

Also: Write German App Store copy for DACH launch:
- Title (30 chars): "ROAM — Reiseplanung mit AI"
- Subtitle (30 chars): "Dein Trip in 30 Sekunden"
- Description (4000 chars): Full German description
- Keywords (100 chars): German travel keywords

Write everything to roam/copy_library.md.
```

---

### ROAM — 12 Investor
**Model:** claude-sonnet-4-5

**FIRST MESSAGE:**
```
You are ROAM's investor relations agent. Read .cursor/rules/agent-12-investor.mdc for your full instructions.

Two files were just created with current data:
- roam/investor_narrative.md — full pitch narrative
- roam/weekly_memo.md — this week's investor memo

Your job: Review and refine both documents.
1. Verify all numbers are accurate (screens, tests, agents, etc.)
2. Strengthen the "Why Now" section with specific market data
3. Add DACH market size data (Germany travel market ~$70B/year)
4. Draft a 30-second elevator pitch version at the bottom of investor_narrative.md
5. Make sure the competitive landscape section is sharp and defensible

Also read roam/dach_strategy.md — incorporate the DACH angle into the pitch.

Update both files with your improvements.
```

---

### ROAM — 13 DACH Growth
**Model:** claude-sonnet-4-5

**FIRST MESSAGE:**
```
You are ROAM's DACH market specialist. Read .cursor/rules/agent-13-dach.mdc for your full instructions.

Context files to read first:
- roam/dach_strategy.md (277-line go-to-market plan)
- roam/dach_scripts.md (10 German TikTok scripts)
- roam/ugc_research.md (UGC platform comparison)

Your job right now: DACH influencer research.

Research and compile a list of 20 German-speaking travel micro-influencers (5K-50K followers) on TikTok and Instagram. For each creator, document:
- Handle (TikTok + Instagram)
- Follower count
- Avg engagement rate (estimate from recent posts)
- Content style (vlog, POV, tips, aesthetic, comedy)
- Top 3 destinations they cover
- Contact method (DM, email in bio, management)
- Estimated cost per video (based on follower count: ~$20 for 5K, ~$50 for 20K, ~$100 for 50K)

Search using: #reisetipps #fernweh #backpacking #reisenistleben #digitalnomad #interrail #staedtetrip

Write to roam/dach_influencers.md.
```

---

### ROAM — 14 UGC Engine
**Model:** claude-sonnet-4-5

**FIRST MESSAGE:**
```
You are ROAM's creator content machine. Read .cursor/rules/agent-14-ugc.mdc for your full instructions.

Context files to read first:
- roam/ugc_research.md (Billo, Insense, Trend.io, Minisocial comparison)
- roam/dach_strategy.md (go-to-market plan with creator funnel)
- roam/dach_scripts.md (10 scripts ready for production)

Your job right now — two deliverables:

1. Creator outreach system (write to roam/creator_outreach.md):
   - DM sequence: first contact template → day 3 follow-up → day 7 final follow-up
   - All in German (native, casual, Gen Z)
   - Tracking columns: creator handle, follower count, DM sent date, response date, status, content delivered, views, clicks
   - Response rate targets: 15% response, 5% conversion to content
   - Outreach volume: 50 DMs/week

2. Ambassador program (write to roam/ambassador_program.md):
   - 3 tiers: Seed (0-5 videos), Growth (5-15 videos), Partner (15+ videos)
   - Requirements, rewards, and escalation criteria per tier
   - Revenue share model (10% Seed, 15% Growth, 20% Partner)
   - Contract template outline (scope, deliverables, payment terms, content rights)
   - Onboarding checklist for new ambassadors
```

---

### ROAM — Captain
**Model:** claude-sonnet-4-5

**FIRST MESSAGE:**
```
You are ROAM's Captain — the central intelligence hub. Read .cursor/rules/captain.mdc for your full instructions.

Your job: Read every agent output file in roam/ and compile a fresh status board.

Files to read:
- roam/AGENT_BOARD.md
- roam/MASTER_HANDOFF.md
- roam/captain_status.md
- roam/system_health.md
- roam/design_audit.md
- roam/growth_dashboard.md
- roam/copy_library.md
- roam/dach_strategy.md
- roam/dach_scripts.md
- roam/ugc_research.md
- roam/weekly_memo.md
- roam/investor_narrative.md

Compile a fresh roam/captain_status.md with:
- System status: GREEN/YELLOW/RED
- Each agent's status and last output date
- What needs Quinn's attention (ordered by priority)
- Conflicts between agents (if any)
- This week's wins (what shipped)

Keep it under 50 lines. Quinn reads this first thing in the morning.
```

---

## STEP 3: RESUME BUILDER (Already exists as "Ideas")

Paste this into the existing "Ideas" agent:

```
Resume from where you left off. Read roam/MASTER_HANDOFF.md for full context.

Priority stack:
1. Image loading — direct Unsplash URLs now added to all 37 destinations in constants.ts. Verify they render on discover tab. Add gradient fallback for any that fail. Add AsyncStorage caching.
2. Flights tab rework — remove broken Amadeus references, add hero search UI, popular routes section, Skyscanner deep links.
3. Stays tab rework — remove broken elements, add curated hotel sections, Booking.com deep links.
4. Food tab live data — wire enrich-venues edge function, add Overpass API integration.

Start with #1. Run `npx tsc --noEmit` after each change. Open PRs.
```

---

## STEP 4: VERIFY

After all agents are created and running:
- [ ] Count: 15 agents total in sidebar (14 new + Ideas)
- [ ] All new agents on claude-sonnet-4-5 (check model dropdown)
- [ ] Ideas/Builder still on claude-opus-4-5
- [ ] Each agent has started its first task
- [ ] No old agents remaining (Medic, Scanguard, etc. all deleted)

---

## Cost Savings

| Before | After |
|--------|-------|
| 13 agents on Opus | 1 agent on Opus, 14 on Sonnet |
| ~$50-80/day in API costs | ~$15-25/day estimated |
| 60-70% cost reduction | Same output quality for most tasks |
