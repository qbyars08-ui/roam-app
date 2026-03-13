# ROAM — ShipIt Guidelines

> The ShipIt process is the final gate before any feature, fix, or release touches users.  
> Run this checklist before every merge to `main` and before every App Store or web deploy.

---

## Who runs ShipIt?

**LAUNCH** owns the deploy mechanics.  
**CAP** makes the go/no-go call.  
**ShipIt** is the checklist they both run through together.

Any agent can run this document. If you find a blocker, file it in `docs/agents/AGENT_BOARD.md` and flag `[CAP]`.

---

## 1. TypeScript Gate

Run before every push:

```bash
npx tsc --noEmit
```

**Pass criteria:** Zero errors. Warnings are allowed; errors are not.

If this fails → do not merge. Fix all type errors first.

---

## 2. Lint Gate

```bash
npx expo lint
```

**Pass criteria:** Zero errors. Warnings may be logged but do not block.

---

## 3. Build Gate (Web)

```bash
npm run build:web
```

This runs `expo export --platform web` and creates `dist/`. The `_redirects` file must be present in `dist/` after the build.

```bash
ls dist/_redirects
```

**Pass criteria:** Build exits 0. `dist/_redirects` exists.

---

## 4. Security Gate

Reference `docs/SHIELD_DEPENDENCY_SCAN_*.md` for the latest scan.

Before shipping, verify all **critical** findings are resolved:

| Check | How to verify |
|-------|---------------|
| No secrets in `EXPO_PUBLIC_` vars | `rg "EXPO_PUBLIC_" lib/ --include="*.ts" -l` — confirm no OAuth secrets |
| Amadeus OAuth is edge-function-only | `lib/flights-amadeus.ts` must not contain `EXPO_PUBLIC_AMADEUS_SECRET` |
| No `service_role` key in client code | `rg "service_role" lib/ supabase/functions/ -l` — only edge functions may use it |
| CORS not `*` on edge functions | Check `supabase/functions/*/index.ts` for `Access-Control-Allow-Origin: *` |
| RLS policies use `auth.uid()` | All new migrations: `rg "true" supabase/migrations/ -l` — must have zero `USING (true)` |

**Pass criteria:** Zero unresolved critical items from Shield's most recent scan.

---

## 5. Test Gate

```bash
npm test -- --passWithNoTests
```

**Pass criteria:** All tests pass. Zero failing tests.

If test suite is empty (no tests written yet), note this in the ShipIt report and tag `[CAP]` — tests must exist before the next major release.

---

## 6. UX Gate

Before shipping any screen to users, it must be marked `x` (audited) in `docs/polish-checklist.md`.

Check current audit coverage:

```bash
grep -c "| x |" docs/polish-checklist.md
grep -c "| |" docs/polish-checklist.md
```

**Pass criteria for full release:** 100% of screens audited.  
**Pass criteria for incremental ship (single feature):** The specific screen(s) touched must be audited.

---

## 7. Feature Flag Gate

Any feature not ready for all users must be wrapped in a feature flag (`lib/feature-flags.ts`).

Before shipping, confirm:
- All new screens that are not fully polished are behind a flag
- Pro-gated features are dual-enforced: `lib/pro-gate.ts` + server-side check
- Guest mode is tested: trip generation → email capture → waitlist flow

---

## 8. Deploy Gate

### Web (Netlify)

1. Confirm Netlify billing is active (no paused site — see `docs/NETLIFY_PAUSED.md`)
2. Confirm GitHub secrets are set: `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`
3. Confirm env vars are set in Netlify Dashboard: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
4. Push to `main` — Netlify auto-deploys via `netlify.toml`
5. Verify deploy at the Netlify dashboard URL

### iOS (TestFlight)

Follow `docs/testflight-build.md`:

1. Increment `app.json` version + `ios.buildNumber`
2. `eas build --platform ios --profile production`
3. `eas submit --platform ios --latest`
4. Confirm build in App Store Connect → TestFlight → add testers

### App Store (Production)

Follow `docs/app-store-submission.md` — full checklist must be complete before submitting.

---

## 9. Go / No-Go Decision

CAP scores each dimension 1–5 and totals. Minimum **20 out of 25** to ship.

| Dimension | Score (1–5) |
|-----------|-------------|
| TypeScript + Lint + Build pass | — |
| Security gate clear | — |
| Tests passing | — |
| UX audit complete (affected screens) | — |
| No known P0 regressions | — |
| **Total** | — / 25 |

Minimum to ship: **20**.  
If any single dimension scores **1** (critical failure), do not ship regardless of total.

---

## 10. ShipIt Report

After every ShipIt run, append a report to `docs/office/shipit-log.md`:

```markdown
## ShipIt — [date] — [version or description]

**Ran by:** [agent or human]  
**Go / No-Go:** GO | NO-GO  
**Score:** [X] / 25

### Gate Results
- TypeScript: PASS | FAIL
- Lint: PASS | FAIL | WARN
- Build (web): PASS | FAIL
- Security: PASS | FAIL | PENDING
- Tests: PASS | FAIL | EMPTY
- UX audit: [N/59 screens] PASS | PARTIAL | FAIL
- Feature flags: PASS | N/A

### What shipped
- [description of what was merged or released]

### Blockers found (did not ship)
- [blocker] — [owner] — [expected resolution]

### Next ShipIt
[What needs to happen before the next go decision]
```

---

## Quick-Reference Card

```
1. npx tsc --noEmit              ← must be zero errors
2. npx expo lint                 ← zero errors
3. npm run build:web             ← must exit 0, dist/_redirects exists
4. Shield scan clear?            ← zero critical findings
5. npm test                      ← all passing
6. polish-checklist.md           ← affected screens audited
7. Feature flags in place?       ← new/unpolished screens gated
8. Deploy environment ready?     ← Netlify billing, secrets set
9. CAP go/no-go score ≥ 20/25   ← ship it
10. Append shipit-log.md         ← always log the run
```

---

## Negative Constraints — DO NOT:

- Ship with TypeScript errors — type safety is non-negotiable
- Ship with `EXPO_PUBLIC_` containing OAuth secrets or service keys
- Ship unaudited screens to a marketing push or featured placement
- Deploy without confirming Netlify billing is active (you'll get a silent 404)
- Skip the ShipIt log — the log is how the team knows what shipped and when
- Let "almost ready" become "shipped but broken"

## Positive Enforcement — ALWAYS:

- Run this document top-to-bottom before every release
- Fix what you find; don't defer critical items
- When in doubt, NO-GO — users trust ROAM because we ship quality
- Tag everything you can't fix with `[CAP]` in `AGENT_BOARD.md`
- Celebrate every successful ShipIt — momentum matters
