# ROAM Agent Board — Updated March 16, 2026

---

## Composer 1 — Visual

Full visual pass on onboarding screens. Make the hook screen genuinely beautiful. Dream vault redesign. Profile tab redesign. Use magazine editorial aesthetic (Cormorant Garamond italic headers, DM Sans body, DM Mono data). Dark UI only (#080F0A bg). Colors: sage #7CAF8A, cream #F5EDD8, coral #E8614A, gold #C9A84C.

### Tasks

- Redesign onboarding Screen 1 (the hook) — full bleed, text fades in, no signup
- Redesign onboarding Screen 2 (magic reveal) — streaming demo trip
- Design Dream Vault cards — full bleed photo, 350px, saved date, price estimate
- Redesign Profile tab — travel identity, Travel DNA preview, subscription status
- Visual pass on paywall screen — annual prominent with gold badge

---

## Composer 2 — Builder

Wire RevenueCat paywall completely. Affiliate link audit and fix. Dream vault price calculation logic. Onboarding flow implementation.

### Tasks

- Verify RevenueCat paywall flow end to end (free limit -> paywall -> purchase -> unlimited)
- Wire affiliate links: hotels -> Booking.com, flights -> Skyscanner, activities -> GetYourGuide
- Build Dream Vault price estimate (use what-if-calculator.ts for cost estimation)
- Implement new onboarding flow: Hook -> Magic Reveal -> One Question -> Where To -> Signup
- Wire social proof queries (trip counts per destination from Supabase)

---

## Composer 3 — Debug

Run full pre-launch checklist. Fix every console error. Test paywall flow end to end. Test affiliate links.

### Tasks

- Run npx tsc --noEmit — verify 0 errors
- Test generate flow 5 times with different destinations
- Test paywall: exhaust free tier, verify paywall appears, test purchase
- Test auth: Google, Apple, Email, Guest mode
- Audit all console.error and console.warn in production
- Verify no placeholder text visible to users
- Report to system_health.md

---

## Composer 4 — Research/Growth

Write Reddit launch post. Write DACH creator DM templates. Research Product Hunt strategy.

### Tasks

- Draft Reddit post for r/solotravel and r/backpacking (genuine, not spammy)
- Write 3 DACH creator DM templates (German/Austrian/Swiss travel influencers)
- Research Product Hunt launch: timing, tagline, first comment strategy
- Draft email waitlist announcement for launch day
- Write to growth_dashboard.md with full strategy

---

## Composer 5 — QA/Captain

Test every tab on mobile. Test full onboarding as new user. Test generate flow.

### Tasks

- Test all 5 tabs load correctly with real data
- Test generate flow: quick mode + conversation mode
- Test onboarding as brand new user (clear AsyncStorage)
- Test offline mode (airplane mode -> prep tab should work)
- Test share card generation and native share sheet
- Test language switching (EN/ES/FR/JA)
- Report to test_results.md
- Update captain_status.md with overall status

---

## Agent Registry

| # | Agent | Model | Rule File | Cursor Cloud Name | Output File | Status |
|---|-------|-------|-----------|-------------------|-------------|--------|
| 01 | Tester | claude-sonnet-4-5 | agent-01-tester.mdc | ROAM — 01 Tester | /test_results.md, /bugs_found.md | ACTIVE |
| 02 | Researcher | claude-sonnet-4-5 | agent-02-researcher.mdc | ROAM — 02 Researcher | /research_report.md | ACTIVE |
| 03 | Design | claude-sonnet-4-5 | agent-03-design-enforcer.mdc | ROAM — 03 Design | /design_audit.md | ACTIVE |
| 04 | Builder | claude-opus-4-5 | agent-04-builder.mdc | Ideas | PRs + /analytics_spec.md | ACTIVE |
| 05 | Debugger | claude-sonnet-4-5 | agent-05-debugger.mdc | ROAM — 05 Debugger | /system_health.md, /incidents.md | ACTIVE |
| 06 | Growth | claude-sonnet-4-5 | agent-06-growth.mdc | ROAM — 06 Growth | /growth_dashboard.md | ACTIVE |
| 07 | Monetization | claude-sonnet-4-5 | agent-07-monetization.mdc | ROAM — 07 Monetization | /monetization_model.md | ACTIVE |
| 08 | Security | claude-sonnet-4-5 | agent-08-security.mdc | ROAM — 08 Security | /security_audit.md | ACTIVE |
| 09 | Localization | claude-sonnet-4-5 | agent-09-localization.mdc | ROAM — 09 Localization | /localization_audit.md | ACTIVE |
| 10 | Analytics | claude-sonnet-4-5 | agent-10-analytics.mdc | ROAM — 10 Analytics | /analytics_spec.md | ACTIVE |
| 11 | Content | claude-sonnet-4-5 | agent-11-content.mdc | ROAM — 11 Content | /copy_library.md | ACTIVE |
| 12 | Investor | claude-sonnet-4-5 | agent-12-investor.mdc | ROAM — 12 Investor | /investor_narrative.md, /weekly_memo.md | ACTIVE |
| 13 | DACH Growth | claude-sonnet-4-5 | (new) | ROAM — 13 DACH Growth | /dach_influencers.md, /dach_scripts.md, /ugc_research.md | ACTIVE |
| 14 | UGC Engine | claude-sonnet-4-5 | (new) | ROAM — 14 UGC Engine | /creator_outreach.md, /ambassador_program.md | ACTIVE |
| CP | Captain | claude-sonnet-4-5 | captain.mdc | ROAM — Captain | /captain_status.md | ACTIVE |
| -- | Orchestrator | claude-opus-4-5 | orchestrator.mdc | (Claude Code) | /AGENT_BOARD.md | ACTIVE |

---

## File Ownership

| File/Directory | Owner Agent | Notes |
|----------------|-------------|-------|
| app/(tabs)/flights.tsx | Orchestrator | Just rebuilt — hero + Skyscanner links |
| app/(tabs)/index.tsx | Agent 06 (Growth) | Discover/acquisition |
| app/(tabs)/plan.tsx | Orchestrator | Generate flow |
| app/(tabs)/people.tsx | Agent 06 (Growth) | Social layer |
| app/(tabs)/prep.tsx | Agent 09 (Localization) | Offline prep data |
| lib/claude.ts | Orchestrator | P0 critical — generate flow |
| lib/store.ts | Orchestrator | Shared ownership |
| lib/flights.ts | Agent 07 (Monetization) | Skyscanner affiliate |
| lib/constants.ts | Agent 03 (Design) | Design tokens |
| components/ui/ | Agent 03 (Design) | UI primitives |
| components/premium/ | Agent 03 (Design) | Premium components |
| supabase/functions/ | Agent 08 (Security) | Edge functions + RLS |
| lib/analytics.ts | Agent 10 (Analytics) | Event tracking |
| lib/i18n/ | Agent 09 (Localization) | Translations |

---

## Blocked

| Task | Blocker | Owner |
|------|---------|-------|
| Booking.com real AID | Quinn needs to sign up at partners.booking.com | Quinn |
| Waitlist DB writes | Apply migration 20260325000001_waitlist_comprehensive_fix.sql in Supabase SQL Editor | Quinn |
| Admin rate limit bypass | Add ADMIN_TEST_EMAILS=qbyars08@gmail.com to Supabase secrets | Quinn |

---

## Agent Communication Protocol

- Agents write findings to their output .md file in roam/
- Captain reads ALL output files and compiles captain_status.md
- Quinn asks Captain for status — gets instant briefing
- Agents do NOT open GitHub comments to ask questions
- Agents DO open PRs with direct fixes
- Conflicts: security > infra > features > polish
- Orchestrator reviews all PRs before merge
- File ownership in table above — agent with ownership has priority
