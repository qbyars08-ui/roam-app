# ROAM Decisions Log

> Maintained by Bridge. Append-only — never delete entries. Most recent at top.

---

## March 13, 2026

**[INFRA] Guest mode implementation**
- Decision: Guest mode uses a fake Supabase session with ID `guest-web-<timestamp>` stored in AsyncStorage. Not a real anonymous auth session.
- Rationale: Faster to implement; avoids Supabase anonymous user quota; can be cleared cleanly on signup.
- Tradeoff: No server-side guest data — all guest state is local. Lost if user clears storage.
- Status: Shipped (`lib/guest.ts`, `app/_layout.tsx`).

**[INFRA] AI routing: all Claude calls go through edge function**
- Decision: Client never calls Anthropic directly. `lib/claude.ts` → `supabase/functions/claude-proxy/`.
- Rationale: Key security, rate limiting, free-tier enforcement, trip count tracking.
- Tradeoff: Extra network hop adds ~100–200ms latency per generation.
- Status: Shipped and enforced by `.cursorrules`.

**[INFRA] Feature flags: native gating, web fully unlocked**
- Decision: `lib/feature-flags.ts` gates non-core routes on native builds. Web (`isWeb`) bypasses all flags.
- Rationale: Ship v1.0 native with a smaller, polished surface; web serves as full feature preview.
- Tradeoff: Web and native are on different feature sets — QA must test both.
- Status: Shipped (`94b34f2`).

**[MONETIZATION] Free tier: 1 trip/month**
- Decision: `FREE_TRIPS_PER_MONTH = 1` in `lib/constants.ts`. Enforced server-side in `claude-proxy`.
- Rationale: Low enough to convert, high enough that users see the value before hitting the wall.
- Tradeoff: Users who only travel once a year may never need Pro — accept this.
- Status: Shipped.

**[MONETIZATION] Pro pricing: $9.99/month or $49.99/year**
- Decision: Monthly and annual plans only. No lifetime. Annual = ~58% savings vs monthly.
- Rationale: SaaS-standard. Annual reduces churn, monthly lowers barrier.
- Status: Shipped via RevenueCat.

**[INFRA] Referral reward: 3 refs = 1 month Pro, 10 refs = 1 year Pro**
- Decision: Referral rewards are free Pro time, not cash.
- Rationale: Aligns incentives — referrers become Pro users who experience full value.
- Status: Shipped (`lib/referral.ts`, `20260317_referral_flow.sql`).

**[ARCH] Duplicate RevenueCat modules: `lib/revenuecat.ts` + `lib/revenue-cat.ts`**
- Decision: TBD — needs audit. One is likely dead code from an earlier implementation.
- Action: FORGE to determine canonical module. Delete the other. Update all imports.
- Status: Open.

**[PERFORMANCE] Lazy load all non-tab stack screens**
- Decision: `lazy: true` on the root Stack in `_layout.tsx`. Tab screens remain eager.
- Rationale: Reduces JS parsed before first paint. 50+ modal screens don't need to mount until navigated to.
- Status: Shipped (PERFORMANCE_AUDIT_REPORT.md).

**[DESIGN] Dark-only UI, no light mode**
- Decision: Single color scheme. No system preference detection.
- Rationale: Brand identity is night-photography aesthetic. Light mode would require full redesign.
- Tradeoff: Accessibility concerns for high-contrast users — accept for v1.0, revisit post-launch.
- Status: Enforced by `.cursorrules`.

**[DESIGN] No emojis in UI code**
- Decision: Lucide icons, colored dots, or text pills only.
- Rationale: Consistent visual language. Emojis render differently across platforms and break the premium aesthetic.
- Status: Enforced by `.cursorrules`.

**[CONTENT] AI system prompt: opinionated and specific**
- Decision: ROAM's AI generates real restaurant names, real prices, real dishes — not generic "explore local culture."
- Rationale: #1 competitive differentiator per user research. 7% of travelers trust generic AI recs; specific recommendations build trust.
- Tradeoff: Higher hallucination risk on obscure destinations — monitor and add fallback language.
- Status: Shipped in `ITINERARY_SYSTEM_PROMPT` and `CHAT_SYSTEM_PROMPT` in `lib/claude.ts`.

**[SOCIAL] Group trips: built, spec doc is outdated**
- Decision: `docs/group-trips-spec.md` incorrectly says group trips are not built. They are fully implemented.
- Action: FORGE to update spec doc header with "Status: BUILT — see app/group-trip.tsx, app/create-group.tsx, lib/group-trips.ts".
- Status: Open.

**[AI] Claude model: `claude-sonnet-4-20250514`, 8192 max tokens**
- Decision: Uses Claude Sonnet (not Opus) for cost efficiency. 8192 tokens is sufficient for full itinerary output.
- Tradeoff: If itinerary quality degrades at complex destinations, consider Opus for edge cases.
- Status: Shipped in `supabase/functions/claude-proxy/index.ts`.

---

## How to Use This Log

- **Before starting work:** Read the last 5–10 entries to avoid re-litigating settled decisions.
- **When making a decision:** Add an entry with: Decision, Rationale, Tradeoff, Status.
- **When a decision is revisited:** Add a new entry — do not edit old ones. Note which prior entry you're superseding.
- **Format:** `**[CATEGORY] Short title**` → Decision → Rationale → Tradeoff → Status.
- **Categories:** INFRA, ARCH, DESIGN, MONETIZATION, CONTENT, SOCIAL, AI, PERF, UX.
