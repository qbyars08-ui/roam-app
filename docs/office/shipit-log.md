# ROAM — ShipIt Log

Append-only. One entry per ShipIt run.

---

## ShipIt — 2026-03-13 — main branch baseline audit

**Ran by:** ShipIt agent (first run, establishes baseline)  
**Go / No-Go:** NO-GO  
**Score:** 13 / 25

### Gate Results

| Gate | Result | Notes |
|------|--------|-------|
| TypeScript | PASS | `npx tsc --noEmit` exits 0, zero errors |
| Lint | FAIL | 137 errors, 231 warnings — `react/no-unescaped-entities` (cosmetic, ~70 errors), `react-hooks/rules-of-hooks` (real bugs, ~35 errors in multiple screens), `import/first` (trivial) |
| Build (web) | PASS | `npm run build:web` exits 0; `dist/_redirects` present |
| Security | FAIL | `lib/flights-amadeus.ts` still exposes `EXPO_PUBLIC_AMADEUS_SECRET` to client — critical. CORS `*` on 4 edge functions. Fix is in open PR (cursor/role-definition-f25b) but not merged. |
| Tests | PASS | 46 tests passing across 5 suites |
| UX audit | PARTIAL | 24 of ~59 screens audited in `docs/polish-checklist.md`; 35 unaudited |
| Feature flags | N/A | Not audited this run |

### Score breakdown

| Dimension | Score |
|-----------|-------|
| TypeScript + Lint + Build pass | 3 — TS and build pass, lint fails |
| Security gate clear | 1 — critical Amadeus secret still exposed |
| Tests passing | 5 — 46/46 passing |
| UX audit complete (affected screens) | 2 — 24/59 audited, major gaps |
| No known P0 regressions | 2 — security regression unmerged; hooks violations are live bugs |
| **Total** | **13 / 25** |

### What shipped

Nothing shipped this run — NO-GO.

### Blockers found (did not ship)

| Blocker | Owner | Expected resolution |
|---------|-------|---------------------|
| `EXPO_PUBLIC_AMADEUS_SECRET` in `lib/flights-amadeus.ts` — critical secret leak | MEDIC / LAUNCH | Merge `cursor/role-definition-f25b` — fix already written |
| Lint: 137 errors including `react-hooks/rules-of-hooks` violations | FORGE | Audit hooks violations before next release; unescaped entities can be auto-fixed |
| 35 unaudited screens in `docs/polish-checklist.md` | FORGE | Complete polish audit before App Store submission |
| Netlify billing paused — web deploy would silently 404 | LAUNCH / human | Resolve Netlify billing in dashboard (`docs/NETLIFY_PAUSED.md`) |

### Next ShipIt

Before the next go decision:
1. `[CAP]` — Merge `cursor/role-definition-f25b` (Amadeus security fix)
2. `[FORGE]` — Fix `react-hooks/rules-of-hooks` violations (conditional hook calls are real bugs)
3. `[FORGE]` — Run `npx expo lint --fix` on auto-fixable errors, then audit remaining
4. `[LAUNCH]` — Unblock Netlify billing
5. Once 1–4 done, re-run ShipIt — expected score ≥ 20
